import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const deployed = readFileSync(join(root, 'dist/index.html'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const stylesheet = readFileSync(join(root, 'styles.css'), 'utf8');
const normalizeLines = text => text.replace(/\r\n/g, '\n');
const textOf = markup => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const tagsOf = markup => [...markup.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)];
const attributesOf = source => Object.fromEntries(
    [...source.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
        .map(([, name, doubleQuoted, singleQuoted]) => [name, doubleQuoted ?? singleQuoted])
);

function sectionOf(markup, id) {
    const section = markup.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/section>`));
    assert.ok(section, `Missing section: ${id}`);
    return section[1];
}

function serverOf(markup, name) {
    const cards = [...sectionOf(markup, 'servers').matchAll(/<article\b[^>]*class="server-card reveal"[^>]*>([\s\S]*?)<\/article>/g)];
    const card = cards.find(([, content]) => content.includes(`<h3>${name}</h3>`));
    assert.ok(card, `Missing server card: ${name}`);
    return textOf(card[1]);
}

function assertLinks(markup, assetRoot) {
    const tags = tagsOf(markup).map(([, tag, source]) => ({ tag, attributes: attributesOf(source) }));
    const ids = tags.map(({ attributes }) => attributes.id).filter(Boolean);
    assert.equal(ids.length, new Set(ids).size, 'Duplicate page ID');
    const knownIds = new Set(ids);
    for (const { tag, attributes } of tags) {
        const { href, src, srcset, rel, target } = attributes;
        if (href?.startsWith('#')) {
            assert.ok(knownIds.has(href.slice(1)), `Broken anchor: ${href}`);
        } else if (href && /^[a-z][a-z\d+.-]*:/i.test(href)) {
            assert.equal(new URL(href).protocol, 'https:', `Unsafe link: ${href}`);
        }
        if (target === '_blank') {
            const tokens = new Set((rel ?? '').split(/\s+/));
            assert.ok(tokens.has('noopener') && tokens.has('noreferrer'), 'Unsafe new-tab link');
        }
        for (const id of (attributes['aria-labelledby'] ?? '').split(/\s+/).filter(Boolean)) {
            assert.ok(knownIds.has(id), `Broken accessible label: ${id}`);
        }
        const files = [src, tag === 'link' ? href : undefined,
            ...(srcset?.split(',').map(entry => entry.trim().split(/\s+/)[0]) ?? [])]
            .filter(value => value && !value.startsWith('#') && !/^[a-z][a-z\d+.-]*:/i.test(value));
        for (const file of files) {
            const path = resolve(assetRoot, file);
            const inside = relative(assetRoot, path);
            assert.ok(!inside.startsWith('..') && !isAbsolute(inside), `Asset outside site: ${file}`);
            assert.ok(statSync(path).isFile(), `Missing asset: ${file}`);
        }
    }
}

function assertSupportBoundaries(markup) {
    const emby = serverOf(markup, 'Emby');
    assert.match(emby, /主要支持.*4\.10\.x/);
    const jellyfin = serverOf(markup, 'Jellyfin');
    assert.match(jellyfin, /实服播放通过/);
    assert.match(jellyfin, /10\.10\.7.*2026-10-26/);
    assert.match(jellyfin, /已实测登录恢复、媒体库读取、原画播放和续播/);
    assert.match(jellyfin, /管理写入未验证/);
    assert.match(jellyfin, /内嵌网页控制台登录与界面实屏尚未完成验证/);
    assert.match(jellyfin, /内置 libmpv.*独占管线/);
    assert.match(jellyfin, /不代表所有版本均兼容/);
    const fnnas = serverOf(markup, '飞牛影视');
    assert.match(fnnas, /实服播放通过/);
    assert.match(fnnas, /0\.9\.8.*0\.8\.43/);
    assert.match(fnnas, /2026-10-26 已实测登录恢复、媒体库读取、原画播放和续播/);
    assert.match(fnnas, /详情零时长的流时长回退/);
    assert.match(fnnas, /管理写入未验证/);
    assert.match(fnnas, /内置 libmpv.*独占管线/);
    assert.match(fnnas, /不代表所有版本均兼容/);
    const plex = serverOf(markup, 'Plex');
    assert.match(plex, /实验性/);
    assert.match(plex, /尚未连接真实 Plex 服务器核对/);
    assert.match(plex, /实际连接、浏览和播放仍需验证/);
}

function assertPlaybackCopy(markup) {
    const player = textOf(sectionOf(markup, 'player'));
    assert.match(player, /默认优先简体中文，其次匹配其他中文字幕/);
    assert.match(player, /双语、特效等关键词可按需设为优先或候补/);
    assert.doesNotMatch(player, /默认排除繁体|优先双语字幕与特效字幕|修复老片源|互不影响|画质完全交给/);
    assert.match(player, /启用着色器后/);
    assert.match(player, /所选显卡档位/);
    assert.match(player, /实际效果与性能开销取决于片源、显卡和所选档位/);
    assert.match(player, /默认将新入库版本排在前面/);
}

function assertMirrored(source, destination) {
    assert.equal(normalizeLines(source), normalizeLines(destination), 'Source and deployment differ');
}

function assertBalanced(markup) {
    // These pages are static, with no optional closing tags or nested inline templates.
    const stripped = markup.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const stack = [];
    for (const [, closing, rawTag, tail] of stripped.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*)>/gi)) {
        const tag = rawTag.toLowerCase();
        if (closing) {
            assert.equal(stack.pop(), tag, `Mismatched closing tag: ${tag}`);
        } else if (!voidTags.has(tag) && !tail.endsWith('/')) {
            stack.push(tag);
        }
    }
    assert.deepEqual(stack, [], 'Unclosed HTML elements');
}

function filesIn(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? filesIn(path) : [path];
    });
}

test('source and Cloudflare deployment have the same reviewed copy and assets', () => {
    assertMirrored(html, deployed);
    for (const file of ['styles.css', 'main.js']) {
        assertMirrored(readFileSync(join(root, file), 'utf8'), readFileSync(join(root, 'dist', file), 'utf8'));
    }
    const assets = filesIn(join(root, 'assets'));
    assert.deepEqual(assets.map(path => relative(join(root, 'assets'), path)).sort(),
        filesIn(join(root, 'dist/assets')).map(path => relative(join(root, 'dist/assets'), path)).sort());
    for (const path of assets) {
        assert.deepEqual(readFileSync(path), readFileSync(join(root, 'dist/assets', relative(join(root, 'assets'), path))));
    }
});

test('document stays balanced and retains navigation, hidden headings and controls', () => {
    assertBalanced(html);
    assert.match(html, /<html lang="zh-CN">/);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    assert.match(html, /<h1 id="hero-title" class="sr-only">/);
    assert.match(html, /<h2 id="player-title" class="sr-only">/);
    assert.deepEqual([...html.matchAll(/<section\b[^>]*id="([^"]+)"/g)].map(([, id]) => id),
        ['top', 'player', 'interface', 'servers', 'download', 'faq']);
    assert.equal([...html.matchAll(/data-set-theme="/g)].length, 5);
    assert.equal([...html.matchAll(/<article class="server-card reveal">/g)].length, 4);
});

test('search and sharing descriptions identify the product without overstating compatibility', () => {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const metas = tagsOf(html).filter(([, tag]) => tag === 'meta').map(([, , source]) => attributesOf(source));
    assert.equal(title, 'Momoka — Windows 原生媒体库客户端');
    assert.equal(metas.find(meta => meta.property === 'og:title')?.content, title);
    for (const identifier of ['description', 'og:description', 'twitter:description']) {
        const description = metas.find(meta => (meta.name ?? meta.property) === identifier)?.content;
        assert.ok(description && description.length >= 50 && description.length <= 160);
        assert.match(description, /Windows.*libmpv/);
        assert.match(description, /支持范围|支持范围因服务端而异/);
    }
});

test('anchors, accessible labels, local images and new-tab links are valid in both entries', () => {
    assertLinks(html, root);
    assertLinks(deployed, join(root, 'dist'));
});

test('store and GitHub download destinations are preserved and consistently labelled', () => {
    const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
        .map(([, source, content]) => ({ ...attributesOf(source), text: textOf(content) }));
    const store = anchors.filter(anchor => anchor.href.startsWith('https://apps.microsoft.com/'));
    assert.equal(store.length, 2);
    for (const link of store) {
        assert.equal(link.href, 'https://apps.microsoft.com/detail/9NQJL7K0H8X0?hl=zh-CN&gl=CN');
        assert.equal(link.text, '查看 Microsoft Store');
    }
    const releases = anchors.filter(anchor => anchor.href === 'https://github.com/cudamin/Momoka/releases');
    assert.equal(releases.length, 3);
    assert.equal(releases.filter(anchor => anchor.text === 'GitHub 发布页').length, 2);
    assert.equal(releases.filter(anchor => anchor.text === '版本下载').length, 1);
    assert.doesNotMatch(html, /最新正式发布页|GitHub 最新正式版/);
    for (const path of ['README.md', 'PRIVACY.md', 'LICENSE', 'THIRD-PARTY-NOTICES.md']) {
        assert.ok(anchors.some(anchor => anchor.href === `https://github.com/cudamin/Momoka/blob/master/${path}`));
    }
});

test('every server card states its own verification boundary', () => assertSupportBoundaries(html));
test('playback copy matches subtitle defaults and conditions for shaders and versions', () => assertPlaybackCopy(html));

test('aggregation, optional services, previews and privacy remain explicit', () => {
    const servers = textOf(sectionOf(html, 'servers'));
    assert.match(servers, /聚合模式默认关闭/);
    assert.match(servers, /设置 → 服务器/);
    assert.match(servers, /两个及以上账号在线时/);
    assert.match(servers, /MoviePilot 3\.x\.x.*此功能可选，需要单独配置/);
    assert.match(servers, /Plex 不提供管理入口/);
    assert.match(textOf(sectionOf(html, 'interface')), /主题配色示意，并非应用截图/);
    const download = sectionOf(html, 'download');
    assert.match(textOf(download), /Windows 10 1809 及以上，仅 x64/);
    assert.match(download, /Jellyfin、飞牛影视与 Plex.*href="#servers"/);
    assert.match(textOf(download), /可选组件.*MoviePilot 3\.x\.x.*需单独配置.*网页控制台.*WebView2 Runtime/);
    assert.match(textOf(download), /不收集个人信息、使用统计或诊断数据/);
    assert.match(textOf(download), /运行时仍会连接媒体服务器和相关服务/);
    assert.doesNotMatch(download, /不上传、不分享你的数据/);
    assert.match(textOf(html), /不提供、不托管、不索引任何媒体内容/);
    assert.match(textOf(html), /拥有合法权利或已获授权的内容/);
});

test('feature directory targets real sections and only setup steps are numbered', () => {
    const directory = html.match(/<ul class="hero-strip"[^>]*>([\s\S]*?)<\/ul>/)?.[1];
    assert.ok(directory);
    assert.deepEqual([...directory.matchAll(/href="([^"]+)"/g)].map(([, href]) => href),
        ['#player', '#aggregation', '#subtitles', '#versions', '#moviepilot']);
    for (const id of ['aggregation', 'subtitles', 'versions', 'moviepilot']) {
        assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.doesNotMatch(html, /feature-num|01 \/ 播放|02 \/ 界面|03 \/ 兼容性|04 \/ 下载/);
    assert.match(html, /<ol class="setup-steps">/);
    assert.equal([...html.matchAll(/class="step-number"/g)].length, 3);
});

test('each compatibility card links to its corresponding support documentation', () => {
    const cards = [...sectionOf(html, 'servers').matchAll(/<article\b[^>]*class="server-card reveal"[^>]*>([\s\S]*?)<\/article>/g)];
    const names = ['Emby', 'Jellyfin', '飞牛影视', 'Plex'];
    const paths = ['README.md#系统要求', 'docs/Jellyfin支持.md', 'docs/飞牛影视.md', 'docs/Plex支持.md'];
    assert.equal(cards.length, paths.length);
    cards.forEach(([, content], index) => {
        const links = [...content.matchAll(/<a\b([^>]*)>/g)].map(([, source]) => attributesOf(source));
        assert.equal(links.length, 1);
        assert.equal(links[0].href, `https://github.com/cudamin/Momoka/blob/master/${paths[index]}`);
        assert.equal(links[0]['aria-label'], `${names[index]} 支持说明`);
        assert.match(content, /class="server-footer"/);
    });
});

test('download section has a real heading and an accessible three-step getting-started guide', () => {
    const download = sectionOf(html, 'download');
    assert.match(html, /id="download" aria-labelledby="download-title"/);
    assert.match(download, /<h2 id="download-title">下载 Momoka<\/h2>/);
    assert.match(download, /<aside class="getting-started" aria-labelledby="start-title">/);
    assert.match(download, /<h3 id="start-title">从安装到播放<\/h3>/);
    assert.deepEqual([...download.matchAll(/<h4>([^<]+)<\/h4>/g)].map(([, title]) => title),
        ['安装客户端', '连接媒体服务器', '设置播放偏好']);
    assert.doesNotMatch(html, /download-mark|mark-glow/);
});

test('responsive styles preserve focus, reduced motion and readable compatibility cards', () => {
    assert.match(stylesheet, /:focus-visible\s*\{/);
    assert.match(stylesheet, /\.hero\s*\{[^}]*overflow: clip/);
    assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(stylesheet, /\.server-grid\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.match(stylesheet, /@media \(max-width: 720px\)/);
    assert.match(stylesheet, /\.server-grid,\s*\.aside-grid\s*\{[^}]*grid-template-columns: 1fr/);
    assert.match(stylesheet, /\.hero-strip\s*\{[^}]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
    assert.match(stylesheet, /\.hero-strip li:last-child\s*\{[^}]*grid-column: 1 \/ -1/);
    assert.doesNotMatch(stylesheet, /\.download-mark|\.mark-glow|\.feature-num/);
});

test('README documents runnable checks and the deployed preview directory', () => {
    assert.match(readme, /node --test tests\/site-copy\.test\.mjs/);
    assert.match(readme, /py -m http\.server 8080 --bind 127\.0\.0\.1 --directory dist/);
    assert.match(readme, /cp index\.html styles\.css main\.js dist\//);
    assert.match(readme, /GitHub 仓库简介建议/);
    assert.ok(statSync(fileURLToPath(import.meta.url)).isFile());
});

// Mutation fixtures prove these checks reject regressions, rather than merely reading the current page.
const regressions = [
    ['deployment drift', () => assertMirrored(html, deployed.replace('Windows 原生媒体库客户端', '旧文案')), /Source and deployment differ/],
    ['broken fragment', () => assertLinks(html.replace('href="#download"', 'href="#missing"'), root), /Broken anchor/],
    ['missing image', () => assertLinks(html.replace('src="assets/app-icon.png"', 'src="assets/missing.png"'), root), /ENOENT/],
    ['unsafe new tab', () => assertLinks(html.replace('rel="noopener noreferrer"', 'rel="noreferrer"'), root), /Unsafe new-tab link/],
    ['obsolete subtitle default', () => assertPlaybackCopy(html.replace('默认优先简体中文，其次匹配其他中文字幕', '默认排除繁体中文')), /默认优先简体中文/],
    ['unverified Plex promoted to verified', () => assertSupportBoundaries(html.replace('尚未连接真实 Plex 服务器核对', '已通过真实 Plex 服务器核对')), /尚未连接真实 Plex/],
    ['Jellyfin management overclaim', () => assertSupportBoundaries(html.replace('管理写入未验证，内嵌网页', '管理写入全部通过，内嵌网页')), /管理写入未验证/],
    ['FnNas version overclaim', () => assertSupportBoundaries(html.replace('所列版本不代表所有版本均兼容', '所有版本均兼容')), /不代表所有版本均兼容/],
    ['unbalanced markup', () => assertBalanced(html.replace('</figure>', '</div>')), /Mismatched closing tag/],
];
for (const [name, check, expected] of regressions) {
    test(`rejects ${name}`, () => assert.throws(check, expected));
}
