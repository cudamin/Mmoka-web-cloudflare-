import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const deployed = readFileSync(join(root, 'dist/index.html'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const candidateVersion = '0.1.8';
const publicVersion = '0.1.7'; // Public version; the candidate is not submitted to Microsoft Store.
const candidateStatus = '0.1.8 尚未提交微软商店，线上仍为 0.1.7，候选版待完成验收';
const holdReason = '最终并发UI自动化验收出现尚未定位的原生崩溃，正式发布暂缓';
const storeUrl = 'https://apps.microsoft.com/detail/9NQJL7K0H8X0?hl=zh-CN&gl=CN';
const releaseUrl = 'https://github.com/cudamin/Momoka/releases';
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

function assertCandidateStatus(copy) {
    assert.ok(copy.includes(candidateStatus), 'Missing exact candidate / Store status');
    assert.doesNotMatch(copy, /(?:商店|Store|该版本|新版本|0\.1\.8)[^。\n]*可能[^。\n]*审核|审核状态(?:尚)?待确认|最新正式/);
    assert.doesNotMatch(copy, /0\.1\.8\s*(?:已上架|已发布|现已可安装|已提交微软商店)/);
}

function assertReleaseHold(copy) {
    assertCandidateStatus(copy);
    assert.ok(copy.includes(holdReason), 'Missing native-crash release hold reason');
    assert.doesNotMatch(copy, /(?:等待|未发布|暂缓)[^。\n]*(?:翻译密钥|API key)|(?:翻译密钥|API key)[^。\n]*(?:导致|原因)/);
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
    const releases = anchors.filter(anchor => anchor.text === 'GitHub 发布页');
    assert.equal(releases.length, 2);
    for (const anchor of releases) assert.equal(anchor.href, releaseUrl);
    assert.doesNotMatch(visibleText(markup), /GitHub 最新正式版|最新正式发布页/);
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
    assert.equal(data.softwareVersion, publicVersion);
    assert.equal(data.downloadUrl, releaseUrl);
    assert.equal(data.url, 'https://github.com/cudamin/Momoka');
    assert.equal(data.operatingSystem, 'Windows 10 1809 及以上，仅 x64');
    assert.equal(data.applicationCategory, 'MultimediaApplication');
    assertCandidateStatus(description);
    assert.match(description, /字幕翻译与补帧/);
    assert.match(description, /翻译与补帧默认关闭/);
    assert.match(description, /翻译可能收费并外发原文/);
    assertReleaseHold(data.releaseNotes);
    // No fabricated price, review, release date, build number or pending download asset.
    for (const key of ['offers', 'aggregateRating', 'review', 'datePublished', 'softwareBuildNumber']) assert.ok(!(key in data), `Unsupported schema promise: ${key}`);
    const features = data.featureList.join(' ');
    assert.equal(data.featureList.filter(feature => feature.startsWith(`${candidateVersion} 候选版：`)).length, 4);
    assertSubscriptions(features);
    assertTranslation(features);
    assertPrivacy(features);
    assertInterpolation(features);
    assertPreserved(features);
}

for (const [label, markup] of [['source', html], ['dist', deployed]]) {
    test(`${label}: public 0.1.7 and unsubmitted 0.1.8 candidate agree across metadata and JSON-LD`, () => assertMetadata(markup));
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
        assertCandidateStatus(blockOf(markup, 'p', 'release-status'));
        assertCandidateStatus(visibleText(markup));
        assertReleaseHold(blockOf(markup, 'article', 'faq-release'));
        assert.match(blockOf(markup, 'section', 'faq'), /三项新功能为候选版说明/);
    });
    test(`${label}: existing playback, server and legal-source boundaries remain`, () => {
        assertPreserved(visibleText(markup));
        assertWebsiteBoundary(visibleText(markup));
        assert.match(visibleText(markup), /默认优先简体中文，其次匹配其他中文字幕/);
    });
}

test('README matches candidate hold, native-crash reason, downloads and website-only release workflow', () => {
    assertReleaseHold(readme);
    assertSubscriptions(readme);
    assertTranslation(readme);
    assertPrivacy(readme);
    assertInterpolation(readme);
    assertPreserved(readme);
    assertWebsiteBoundary(readme);
    assert.ok(readme.includes(storeUrl));
    assert.ok(readme.includes(releaseUrl));
    assert.match(readme, /不据此判定正式版或稳定版/);
    assert.match(readme, /diff \/ SHA/);
    assert.match(readme, /网页获准推送也不等于应用二进制发布获准/);
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
    ['candidate promotion and inaccurate hold status', () => {
        assert.throws(() => assertCandidateStatus(readme.replaceAll(candidateStatus, '0.1.8 可能仍在审核')), /candidate \/ Store status/);
        assert.throws(() => assertReleaseHold(readme.replace(holdReason, '等待用户提供翻译密钥，正式发布暂缓')), /native-crash release hold reason/);
        assertMetadata(html.replace('"softwareVersion": "0.1.7"', '"softwareVersion": "0.1.8"'));
    }, /strictly equal/],
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
