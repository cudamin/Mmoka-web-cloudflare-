"""Tests for offline checks plus mocked reachable, broken and unverified HTTP paths."""

from collections import Counter
from contextlib import redirect_stdout
import importlib.util
import io
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from urllib.error import HTTPError, URLError

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("check_site_links", ROOT / "tools/check_site_links.py")
links = importlib.util.module_from_spec(spec)
spec.loader.exec_module(links)
HTML = (ROOT / "index.html").read_text(encoding="utf-8")


class Response:
    def __init__(self, status=200):
        self.status = status
        self.read_limit = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, limit):
        self.read_limit = limit
        return b"Static page"


class SiteLinkTests(unittest.TestCase):
    def test_current_source_and_dist_have_valid_official_links(self):
        urls = links.check_site(ROOT)
        self.assertIn(links.LATEST_URL, urls)
        self.assertIn("https://github.com/cudamin/Momoka/releases", urls)
        self.assertTrue(any("/detail/9NQJL7K0H8X0" in url for url in urls))
        self.assertTrue(any("/docs/Plex支持.md" in url for url in urls))

    def test_current_external_urls_are_valid(self):
        for url in links.check_site(ROOT):
            with self.subTest(url=url):
                self.assertEqual(links.validate_external(url), url)

    def test_accepts_official_latest_releases_store_and_encoded_document(self):
        urls = [links.LATEST_URL, "https://github.com/cudamin/Momoka/releases", "https://apps.microsoft.com/detail/9NQJL7K0H8X0?hl=zh-CN&gl=CN", "https://github.com/cudamin/Momoka/blob/master/docs/%E9%A3%9E%E7%89%9B%E5%BD%B1%E8%A7%86.md"]
        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(links.validate_external(url), url)

    def test_rejects_unsafe_hosts_versions_credentials_and_wrong_store(self):
        cases = [
            ("http://github.com/cudamin/Momoka", "HTTPS"),
            ("https://github.com.example.invalid/cudamin/Momoka", "host"),
            ("https://github.com/other/Momoka/releases", "official"),
            ("https://github.com/cudamin/Momoka-clone/releases", "official"),
            ("https://github.com/cudamin/Momoka/releases/download/v0.1.8/not-yet.exe", "guessed version"),
            ("https://github.com/cudamin/Momoka/releases/tag/v0.1.8", "guessed version"),
            ("https://github.com:8443/cudamin/Momoka", "port"),
            ("https://apps.microsoft.com/detail/9WRONG00000", "product ID"),
            ("https://apps.microsoft.com/detail/9NQJL7K0H8X0?redirect=example", "Store link query"),
            ("https://sample:PLACEHOLDER_ONLY@github.com/cudamin/Momoka", "credentials"),
            ("https://github.com/cudamin/Momoka?api_key=PLACEHOLDER_ONLY", "Credential query"),
            ("https://github.com/cudamin/Momoka?access_token=PLACEHOLDER_ONLY", "Credential query"),
        ]
        for url, expected in cases:
            with self.subTest(case=expected):
                with self.assertRaisesRegex(ValueError, expected):
                    links.validate_external(url)

    def test_duplicate_anchor_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate page ID"):
            links.validate_markup(HTML.replace('id="faq"', 'id="player"'), ROOT)

    def test_broken_anchor_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Broken anchor"):
            links.validate_markup(HTML.replace('href="#faq"', 'href="#missing"'), ROOT)

    def test_broken_accessible_label_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "accessible label"):
            links.validate_markup(HTML.replace('aria-labelledby="faq-title"', 'aria-labelledby="missing"'), ROOT)

    def test_missing_local_image_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Missing local resource"):
            links.validate_markup(HTML.replace('src="assets/app-icon.png"', 'src="assets/missing.png"'), ROOT)

    def test_escaped_local_path_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "outside site"):
            links.validate_markup(HTML.replace('src="assets/app-icon.png"', 'src="../outside.png"'), ROOT)

    def test_protocol_relative_link_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "HTTPS"):
            links.validate_markup(HTML.replace(links.LATEST_URL, "//github.com/cudamin/Momoka/releases/latest"), ROOT)

    def test_metadata_download_url_is_checked(self):
        with self.assertRaisesRegex(ValueError, "official latest release"):
            links.validate_markup(HTML.replace('"downloadUrl": "' + links.LATEST_URL + '"', '"downloadUrl": "https://github.com/cudamin/Momoka/releases"'), ROOT)

    def test_dist_drift_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "byte drift"):
            links.assert_mirrored(b"Reviewed source\n", b"Old source\n")
        links.assert_mirrored(b"Reviewed source\n", b"Reviewed source\n")

    def test_check_site_has_a_failure_path_without_touching_checkout(self):
        with TemporaryDirectory(prefix="momoka-site-check-") as temporary:
            root = Path(temporary)
            (root / "dist").mkdir()
            (root / "index.html").write_bytes(b"source")
            (root / "dist/index.html").write_bytes(b"different")
            with self.assertRaisesRegex(ValueError, "byte drift"):
                links.check_site(root)

    def test_markdown_links_skip_code_examples_and_check_real_destinations(self):
        markdown = "[Official](https://github.com/cudamin/Momoka)\n`https://placeholder.invalid`\n[Relative](wrangler.jsonc)"
        self.assertEqual(links.markdown_links(markdown), {"https://github.com/cudamin/Momoka"})
        with self.assertRaisesRegex(ValueError, "HTTPS"):
            links.markdown_links("[Bad](http://github.com/cudamin/Momoka)")

    def test_http_status_is_not_used_as_store_version_proof(self):
        expected = {200: "reachable", 204: "reachable", 302: "unverified", 401: "unverified", 403: "unverified", 405: "unverified", 408: "unverified", 429: "unverified", 451: "unverified", 500: "unverified", 503: "unverified", 404: "broken", 410: "broken"}
        for status, classification in expected.items():
            with self.subTest(status=status):
                self.assertEqual(links.classify_status(status), classification)

    def test_live_get_uses_no_auth_and_does_not_read_full_page(self):
        seen = {}
        response = Response()

        def opener(request, timeout):
            seen["request"] = request
            seen["timeout"] = timeout
            return response

        url = "https://github.com/cudamin/Momoka/blob/master/docs/飞牛影视.md#说明"
        self.assertEqual(links.probe_url(url, opener=opener), ("reachable", "HTTP 200"))
        self.assertEqual(seen["request"].get_method(), "GET")
        self.assertNotIn("#", seen["request"].full_url)
        self.assertNotIn("飞", seen["request"].full_url)
        self.assertIsNone(seen["request"].get_header("Authorization"))
        self.assertIsNone(seen["request"].get_header("Cookie"))
        self.assertEqual(response.read_limit, 1024)
        self.assertEqual(seen["timeout"], 15)

    def test_live_http_errors_remain_broken_or_unverified(self):
        for code, expected in [(404, "broken"), (410, "broken"), (403, "unverified"), (429, "unverified"), (503, "unverified")]:
            def opener(request, timeout, code=code):
                raise HTTPError(request.full_url, code, "mock", None, None)
            with self.subTest(code=code):
                self.assertEqual(links.probe_url(links.LATEST_URL, opener=opener), (expected, f"HTTP {code}"))

    def test_live_network_errors_are_unverified_and_redacted(self):
        for error in [URLError("PLACEHOLDER_ONLY: simulated connection failure"), TimeoutError("PLACEHOLDER_ONLY: simulated timeout")]:
            def opener(request, timeout, error=error):
                raise error
            with self.subTest(error=type(error).__name__):
                self.assertEqual(links.probe_url(links.LATEST_URL, opener=opener), ("unverified", type(error).__name__))

    def test_strict_live_never_counts_unverified_as_green(self):
        self.assertEqual(links.live_exit_code(Counter(reachable=13), True), 0)
        self.assertEqual(links.live_exit_code(Counter(reachable=12, unverified=1), True), 2)
        self.assertEqual(links.live_exit_code(Counter(reachable=12, unverified=1), False), 0)
        self.assertEqual(links.live_exit_code(Counter(broken=1), False), 1)

    def test_cli_offline_success_and_failure(self):
        output = io.StringIO()
        with redirect_stdout(output):
            self.assertEqual(links.main(["--root", str(ROOT)]), 0)
        self.assertIn("未联网", output.getvalue())
        with TemporaryDirectory(prefix="momoka-site-cli-") as temporary:
            output = io.StringIO()
            with redirect_stdout(output):
                self.assertEqual(links.main(["--root", temporary]), 1)
            self.assertIn("FAIL", output.getvalue())


if __name__ == "__main__":
    unittest.main(verbosity=2)
