import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const deployed = readFileSync(join(root, 'dist/index.html'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const version = '0.1.8'; // Prepare only; change after the parent confirms the real release.
const storeUrl = 'https://apps.microsoft.com/detail/9NQJL7K0H8X0?hl=zh-CN&gl=CN';
const latestUrl = 'https://github.com/cudamin/Momoka/releases/latest';
const stripTags = markup => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const visibleText = markup => stripTags(markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));

function blockOf(markup, tag, id) {
    const block = markup.match(new RegExp(`<${tag}\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    assert.ok(block, `Missing ${tag}: ${id}`);
    return stripTags(block[1]);
}

function metadataOf(markup) {
    const result = new Map();
    for (const [, attrs] of markup.matchAll(/<meta\b([^>]*)>/g)) {
        const key = attrs.match(/(?:name|property)="([^"]+)"/)?.[1];
        const value = attrs.match(/content="([^"]*)"/)?.[1];
        if (key) {
            assert.ok(!result.has(key), `Duplicate metadata: ${key}`);
            result.set(key, value);
        }
    }
    return result;
}

function structuredOf(markup) {
    const scripts = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.equal(scripts.length, 1, 'Expected one SoftwareApplication JSON-LD block');
    return JSON.parse(scripts[0][1]);
}

function assertPending(copy) {
    assert.match(copy, /0\.1\.8[（( ]*待发布/);
    assert.match(copy, /商店.*(?:实际|审核)/);
    assert.doesNotMatch(copy, /0\.1\.8\s*(?:已上架|已发布|现已可安装)/);
}

function assertSubscriptions(copy) {
    assert.match(copy, /MoviePilot/);
    assert.match(copy, /电视剧.*剧集组.*季.*开启\s*\/\s*关闭订阅/);
    for (const mode of ['普通订阅', '分集洗版', '全集洗版']) assert.ok(copy.includes(mode), `Missing subscription mode: ${mode}`);
    assert.match(copy, /电影直接点击.*订阅.*再次点击.*取消/);
}

function assertTranslation(copy) {
    assert.match(copy, /实时文字字幕翻译|文字字幕实时翻译/);
    assert.match(copy, /Google Cloud Translation v2/);
    assert.match(copy, /Microsoft Translator v3/);
    assert.match(copy, /兼容 OpenAI API 的 AI 服务/);
    assert.match(copy, /保留原字幕/);
    assert.match(copy, /PGS\s*\/\s*VOBSUB.*无 OCR 时不适用/);
}

function assertPrivacy(copy) {
    assert.match(copy, /(?:字幕)?翻译默认关闭/);
    assert.match(copy, /需自备 API key/);
    assert.match(copy, /可能(?:产生费用|收费)|可能产生 API 费用/);
    assert.match(copy, /字幕原文外发|原文会发往/);
    assert.match(copy, /所选(?:翻译)?服务/);
    assert.match(copy, /密钥.*本机.*DPAPI 加密/);
    assert.match(copy, /不参与设置备份/);
}

function assertInterpolation(copy) {
    assert.match(copy, /补帧默认关闭|可选补帧.*默认关闭/);
    assert.match(copy, /平滑插值/);
    assert.match(copy, /CPU 运动补偿（minterpolate）/);
    assert.match(copy, /Motion 仅用于已识别的 8-bit SDR/);
    assert.match(copy, /HDR\s*\/\s*高位深.*跳过 Motion/);
    assert.match(copy, /卡顿/);
    assert.match(copy, /伪影/);
    assert.match(copy, /延迟/);
    assert.match(copy, /(?:不是|不提供) SVP、RIFE 或 AI GPU 补帧/);
}

function assertPreserved(copy) {
    for (const feature of ['弹弹play 弹幕', '播放快捷键', 'Emby', '片头 / 片尾标记', '多账号聚合', '字幕', '版本筛选', '手动整理']) {
        assert.ok(copy.includes(feature), `Missing existing feature: ${feature}`);
    }
    for (const server of ['Emby', 'Jellyfin', '飞牛影视', 'Plex']) assert.ok(copy.includes(server));
    assert.match(copy, /按服务端(?:能力和权限|和权限|能力与权限)|按各自能力与账号权限/);
}

function assertDownloadLinks(markup) {
    const anchors = [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attrs, text]) => ({
        href: attrs.match(/href="([^"]+)"/)?.[1], text: stripTags(text)
    }));
    const store = anchors.filter(anchor => anchor.href?.startsWith('https://apps.microsoft.com/'));
    assert.equal(store.length, 2);
    for (const anchor of store) {
        assert.equal(anchor.href, storeUrl);
        assert.equal(anchor.text, '查看 Microsoft Store');
    }
    const latest = anchors.filter(anchor => anchor.text === 'GitHub 最新正式版');
    assert.equal(latest.length, 2);
    for (const anchor of latest) assert.equal(anchor.href, latestUrl);
    assert.doesNotMatch(markup, /releases\/download\/v?0\.1\.8|releases\/tag\/v?0\.1\.8/);
}

function assertWebsiteBoundary(copy) {
    assert.match(copy, /不提供网页播放/);
    assert.match(copy, /(?:不提供|或).*服务器账号|不提供网页播放、媒体内容或服务器账号/);
    assert.match(copy, /有权访问的账号|已获授权访问的媒体服务器与账号/);
    assert.match(copy, /费用需自行确认|是否收费由相应服务|账号与费用需自行确认/);
}

function assertMetadata(markup) {
    const meta = metadataOf(markup);
    const data = structuredOf(markup);
    const description = meta.get('description');
    assert.ok(description.length >= 50 && description.length <= 160);
    for (const key of ['og:description', 'twitter:description']) assert.equal(meta.get(key), description);
    assert.equal(data.description, description);
    assert.equal(meta.get('og:title'), 'Momoka — Windows 原生媒体库客户端');
    assert.equal(meta.get('twitter:title'), meta.get('og:title'));
    assert.equal(meta.get('twitter:card'), 'summary');
    assert.equal(data['@context'], 'https://schema.org');
    assert.equal(data['@type'], 'SoftwareApplication');
    assert.equal(data.softwareVersion, `${version}（待发布）`);
    assert.equal(data.downloadUrl, latestUrl);
    assert.equal(data.url, 'https://github.com/cudamin/Momoka');
    assert.equal(data.operatingSystem, 'Windows 10 1809 及以上，仅 x64');
    assert.equal(data.applicationCategory, 'MultimediaApplication');
    assertPending(description);
    assert.match(description, /字幕翻译与补帧/);
    assert.match(description, /翻译可能收费并外发原文/);
    assert.match(data.releaseNotes, /0\.1\.8 待发布.*商店|0\.1\.8 待发布.*Microsoft Store/);
    // No fabricated price, review, release date, build number or pending download asset.
    for (const key of ['offers', 'aggregateRating', 'review', 'datePublished', 'softwareBuildNumber']) assert.ok(!(key in data), `Unsupported schema promise: ${key}`);
    const features = data.featureList.join(' ');
    assertSubscriptions(features);
    assertTranslation(features);
    assertPrivacy(features);
    assertInterpolation(features);
    assertPreserved(features);
}

for (const [label, markup] of [['source', html], ['dist', deployed]]) {
    test(`${label}: version, metadata, OpenGraph and JSON-LD agree on the pending release`, () => assertMetadata(markup));
    test(`${label}: MoviePilot copy retains existing services and all subscription modes`, () => {
        const copy = blockOf(markup, 'article', 'moviepilot');
        assertSubscriptions(copy);
        assert.match(copy, /MoviePilot 3\.x\.x/);
        assert.match(copy, /单独配置/);
        assert.match(copy, /服务关闭或连接不可用时.*入口自动隐藏/);
        assertSubscriptions(blockOf(markup, 'article', 'faq-subscriptions'));
    });
    test(`${label}: subtitle translation retains originals and excludes image subtitles without OCR`, () => {
        assertTranslation(blockOf(markup, 'li', 'subtitles'));
        assertTranslation(blockOf(markup, 'article', 'faq-translation-formats'));
    });
    test(`${label}: privacy, API cost, off-by-default and DPAPI backup limits stay visible`, () => {
        const copy = blockOf(markup, 'article', 'faq-translation-privacy');
        assertPrivacy(copy);
        assert.match(copy, /本机加密不等于字幕原文不会离开设备/);
        assertPrivacy(visibleText(markup));
    });
    test(`${label}: interpolation exposes motion eligibility and performance tradeoffs`, () => {
        assertInterpolation(blockOf(markup, 'li', 'frame-interpolation'));
        assertInterpolation(blockOf(markup, 'article', 'faq-interpolation'));
    });
    test(`${label}: official downloads have neutral Store labels and no invented 0.1.8 asset`, () => {
        assertDownloadLinks(markup);
        assertPending(blockOf(markup, 'p', 'release-status'));
        assertPending(blockOf(markup, 'article', 'faq-release'));
    });
    test(`${label}: existing playback, server and legal-source boundaries remain`, () => {
        assertPreserved(visibleText(markup));
        assertWebsiteBoundary(visibleText(markup));
        assert.match(visibleText(markup), /默认优先简体中文，其次匹配其他中文字幕/);
    });
}

test('README matches pending version, feature limits, downloads and release workflow', () => {
    assertPending(readme);
    assertSubscriptions(readme);
    assertTranslation(readme);
    assertPrivacy(readme);
    assertInterpolation(readme);
    assertPreserved(readme);
    assertWebsiteBoundary(readme);
    assert.ok(readme.includes(storeUrl));
    assert.ok(readme.includes(latestUrl));
    assert.match(readme, /不 push、不部署/);
    assert.match(readme, /主窗口验收通过/);
    assert.match(readme, /推送 `main`/);
    assert.match(readme, /Git 推送成功不等于 Cloudflare 已部署/);
    for (const command of [
        'node --test tests/site-copy.test.mjs tests/release-copy.test.mjs',
        'py -3 -B tests/test_site_links.py',
        'py -3 -B tools/check_site_links.py --root .',
        'py -3 -B tools/check_site_links.py --root . --live'
    ]) assert.ok(readme.includes(command));
});

test('edited text files use LF and source/dist HTML are byte-identical', () => {
    assert.deepEqual(readFileSync(join(root, 'index.html')), readFileSync(join(root, 'dist/index.html')));
    for (const path of [
        'index.html', 'dist/index.html', 'README.md', 'PROGRESS.md',
        'tests/site-copy.test.mjs', 'tests/release-copy.test.mjs',
        'tools/check_site_links.py', 'tests/test_site_links.py'
    ]) assert.ok(!readFileSync(join(root, path), 'utf8').includes('\r'), `Non-LF file: ${path}`);
});

// Mutation fixtures exercise the new guardrails, not only the current successful copy.
const regressions = [
    ['metadata drift', () => assertMetadata(html.replace('property="og:description" content="Momoka', 'property="og:description" content="Old Momoka')), /strictly equal/],
    ['JSON-LD pretending a final release', () => assertMetadata(html.replace('"softwareVersion": "0.1.8（待发布）"', '"softwareVersion": "0.1.8"')), /strictly equal/],
    ['fabricated free-service schema', () => assertMetadata(html.replace('"@type": "SoftwareApplication",', '"@type": "SoftwareApplication", "offers": {"price": "0"},')), /Unsupported schema promise/],
    ['corrupt JSON-LD', () => assertMetadata(html.replace('"@context": "https://schema.org",', '"@context": ,')), /JSON/],
    ['missing series subscription mode', () => assertSubscriptions(readme.replaceAll('分集洗版', '仅普通订阅')), /Missing subscription mode/],
    ['movie cancellation regression', () => assertSubscriptions(readme.replace('再次点击即可取消', '无法取消')), /再次点击/],
    ['bitmap OCR overclaim', () => assertTranslation(readme.replace('PGS / VOBSUB 无 OCR 时不适用', 'PGS / VOBSUB 全部支持自动翻译')), /无 OCR 时不适用/],
    ['lost off-by-default privacy', () => assertPrivacy(readme.replace('翻译默认关闭', '翻译默认开启')), /翻译默认关闭/],
    ['keys included in backups', () => assertPrivacy(readme.replace('不参与设置备份', '参与设置备份')), /不参与设置备份/],
    ['overbroad HDR motion support', () => assertInterpolation(readme.replace('HDR / 高位深跳过 Motion', 'HDR / 高位深全部启用 Motion')), /跳过 Motion/],
    ['AI GPU interpolation overclaim', () => assertInterpolation(readme.replace('不提供 SVP、RIFE 或 AI GPU 补帧', '提供 AI GPU 补帧')), /SVP、RIFE/],
    ['lost existing danmaku', () => assertPreserved(readme.replaceAll('弹弹play 弹幕', '')), /Missing existing feature/],
    ['wrong Store product', () => assertDownloadLinks(html.replaceAll('9NQJL7K0H8X0', '9WRONG00000')), /strictly equal/],
    ['web playback promise', () => assertWebsiteBoundary(readme.replaceAll('不提供网页播放', '提供网页播放')), /不提供网页播放/],
];
for (const [name, check, expected] of regressions) test(`rejects ${name}`, () => assert.throws(check, expected));
