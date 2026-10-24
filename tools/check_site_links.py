"""Offline link guardrails and optional unauthenticated GET checks for this static site.

A reachable Store page does not prove that a particular app version is available.
No GitHub API, sign-in, package installation or deployment is performed.
"""

from __future__ import annotations

import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, quote, unquote, urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
HOSTS = {"github.com", "apps.microsoft.com", "t.me", "qm.qq.com"}
PRIVATE_QUERY_KEYS = {"key", "api_key", "apikey", "token", "access_token", "auth", "authorization", "password", "secret", "signature"}
LATEST_URL = "https://github.com/cudamin/Momoka/releases/latest"
STORE_ID = "9NQJL7K0H8X0"


class PageLinks(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[str] = []
        self.labels: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.append(values["id"])
        for key in ("href", "src"):
            if values.get(key):
                self.references.append(values[key])
        for key in ("srcset", "imagesrcset"):
            for item in (values.get(key) or "").split(","):
                if item.strip():
                    self.references.append(item.strip().split()[0])
        self.labels.extend((values.get("aria-labelledby") or "").split())

    handle_startendtag = handle_starttag


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def validate_external(url: str) -> str:
    parsed = urlsplit(url)
    # Reject credentials before including any URL in output. No key values are logged.
    require(not parsed.username and not parsed.password, "Link credentials are forbidden")
    require(not any(key.lower() in PRIVATE_QUERY_KEYS for key, _ in parse_qsl(parsed.query)), "Credential query parameters are forbidden")
    require(parsed.scheme == "https", "External links must use HTTPS")
    require(parsed.hostname in HOSTS and parsed.netloc == parsed.hostname, "Unknown public link host or port")
    path = unquote(parsed.path)
    if parsed.hostname == "github.com":
        project = "/cudamin/Momoka"
        require(path == project or path.startswith(project + "/"), "GitHub links must point to the official Momoka project")
        if path.startswith(project + "/releases"):
            require(path in {project + "/releases", project + "/releases/latest"}, "Use latest/release listing, not a guessed version asset")
    if parsed.hostname == "apps.microsoft.com":
        require(path == f"/detail/{STORE_ID}", "Wrong Microsoft Store product ID")
        require(all(key in {"hl", "gl"} for key, _ in parse_qsl(parsed.query)), "Unexpected Store link query")
    return url


def validate_markup(markup: str, directory: Path) -> set[str]:
    parser = PageLinks()
    parser.feed(markup)
    require(len(parser.ids) == len(set(parser.ids)), "Duplicate page ID")
    ids = set(parser.ids)
    for label in parser.labels:
        require(label in ids, f"Broken accessible label: {label}")
    external = set()
    for reference in parser.references:
        parsed = urlsplit(reference)
        if parsed.scheme or parsed.netloc:
            external.add(validate_external(reference))
            continue
        require(not reference.startswith("//"), "Protocol-relative external link")
        if parsed.path:
            local = (directory / unquote(parsed.path)).resolve()
            require(local.is_relative_to(directory.resolve()), "Local asset outside site")
            require(local.is_file(), f"Missing local resource: {parsed.path}")
        if parsed.fragment:
            require(not parsed.path and unquote(parsed.fragment) in ids, f"Broken anchor: {parsed.fragment}")
    # JSON-LD download destinations are data, but must obey the same link policy.
    scripts = re.findall(r'<script type="application/ld\+json">([\s\S]*?)</script>', markup)
    require(len(scripts) == 1, "Expected one SoftwareApplication JSON-LD block")
    data = json.loads(scripts[0])
    for key in ("url", "downloadUrl"):
        require(isinstance(data.get(key), str), f"Missing JSON-LD URL: {key}")
        external.add(validate_external(data[key]))
    require(data["downloadUrl"] == LATEST_URL, "JSON-LD must use official latest release")
    return external


def markdown_links(markdown: str) -> set[str]:
    # Only actual Markdown destinations, not deployment examples or placeholder hosts.
    return {validate_external(url) for url in re.findall(r'\]\((https?://[^\s)]+)\)', markdown)}


def assert_mirrored(source: bytes, deployed: bytes) -> None:
    require(source == deployed, "Source/dist HTML byte drift")


def check_site(root: Path) -> set[str]:
    source = (root / "index.html").read_bytes()
    deployed = (root / "dist/index.html").read_bytes()
    assert_mirrored(source, deployed)
    links = validate_markup(source.decode("utf-8"), root)
    require(links == validate_markup(deployed.decode("utf-8"), root / "dist"), "Source/dist external link drift")
    links.update(markdown_links((root / "README.md").read_text(encoding="utf-8")))
    require(LATEST_URL in links, "Missing official latest download link")
    require(any(urlsplit(url).path == f"/detail/{STORE_ID}" for url in links), "Missing Store product link")
    return links


def classify_status(status: int) -> str:
    if 200 <= status < 300:
        return "reachable"
    # Authentication, anti-bot/rate limits and server failures are not bad-link proof.
    if status >= 500 or status in {401, 403, 405, 408, 425, 429, 451}:
        return "unverified"
    if 400 <= status < 500:
        return "broken"
    return "unverified"


def probe_url(url: str, *, opener=urlopen) -> tuple[str, str]:
    parsed = urlsplit(validate_external(url))
    wire_url = urlunsplit((parsed.scheme, parsed.netloc, quote(parsed.path, safe="/%:@"), parsed.query, ""))
    request = Request(wire_url, method="GET", headers={"User-Agent": "Momoka-site-link-check/0.1"})
    try:
        with opener(request, timeout=15) as response:
            response.read(1024)  # Reachability only; do not interpret page content as instructions.
            return classify_status(response.status), f"HTTP {response.status}"
    except HTTPError as error:
        return classify_status(error.code), f"HTTP {error.code}"
    except (URLError, TimeoutError, OSError) as error:
        return "unverified", type(error).__name__


def live_exit_code(counts: Counter, strict: bool) -> int:
    if counts["broken"]:
        return 1
    return 2 if strict and counts["unverified"] else 0


def main(argv: list[str] | None = None) -> int:
    arguments = argparse.ArgumentParser(description=__doc__)
    arguments.add_argument("--root", type=Path, default=ROOT, help="Static website root (defaults to this checkout)")
    arguments.add_argument("--live", action="store_true", help="Unauthenticated HTTP GET checks; no login or version claims")
    arguments.add_argument("--strict-live", action="store_true", help="Also fail for unverified live checks (implies --live)")
    args = arguments.parse_args(argv)
    try:
        urls = check_site(args.root.resolve())
    except (ValueError, OSError) as error:
        print(f"FAIL: {error}")
        return 1
    print(f"离线检查通过：源/dist、锚点、资源及 {len(urls)} 个公开外链；未联网。")
    if not (args.live or args.strict_live):
        return 0
    # Fragments are meaningful in source documents but do not affect HTTP requests.
    urls = sorted({urlunsplit(urlsplit(url)._replace(fragment="")) for url in urls})
    counts = Counter()
    with ThreadPoolExecutor(max_workers=4) as executor:
        for url, (status, detail) in zip(urls, executor.map(probe_url, urls)):
            counts[status] += 1
            print(f"{status.upper()}: {detail} {url}")
    print(f"联网检查：{counts['reachable']} 个可达，{counts['broken']} 个坏链接，{counts['unverified']} 个未核实。")
    if counts["unverified"]:
        print("未核实项不算通过；可能为自动请求限制或网络 / 服务错误。")
    print("链接可达不证明 0.1.8 已发布、商店可安装或 Cloudflare 已部署。")
    return live_exit_code(counts, args.strict_live)


if __name__ == "__main__":
    raise SystemExit(main())
