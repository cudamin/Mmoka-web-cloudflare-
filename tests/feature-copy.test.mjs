import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const deployed = readFileSync(join(root, 'dist/index.html'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');
const stripTags = markup => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const pageText = markup => stripTags(markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''));
const releaseUrl = 'https://github.com/cudamin/Momoka/releases';
const storeUrl = 'https://apps.microsoft.com/detail/9NQJL7K0H8X0?hl=zh-CN&gl=CN';

function blockOf(markup, tag, id) {
    const block = markup.match(new RegExp('<' + tag + '\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/' + tag + '>'));
    assert.ok(block, 'Missing ' + tag + ': ' + id);
    return stripTags(block[1]);
}

function metadataOf(markup) {
    const result = new Map();
    for (const [, attrs] of markup.matchAll(/<meta\b([^>]*)>/g)) {
        const key = attrs.match(/(?:name|property)="([^"]+)"/)?.[1];
        const value = attrs.match(/content="([^"]*)"/)?.[1];
        if (key) {
            assert.ok(!result.has(key), 'Duplicate metadata: ' + key);
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

function assertVersionFree(markup) {
    assert.doesNotMatch(markup, /\bv?\d+\.\d+\.(?:\d+|x|\*)\b/i, 'Software versions do not belong on the page');
    assert.doesNotMatch(markup, /候选版|尚未提交|线上仍为|正式发布暂缓|发布进度|release-status|faq-release|softwareVersion|softwareBuildNumber|releaseNotes/, 'Release-status copy does not belong on the page');
}

function assertSubscriptions(copy) {
    assert.match(copy, /MoviePilot/);
    assert.match(copy, /电视剧.*剧集组.*季.*开启\s*\/\s*关闭订阅/);
    for (const mode of ['普通订阅', '分集洗版', '全集洗版']) assert.ok(copy.includes(mode), 'Missing subscription mode: ' + mode);
    assert.match(copy, /电影点击.*订阅.*再次点击.*取消/);
    assert.match(copy, /服务不可用时相关入口隐藏/);
}

function assertTranslation(copy) {
    assert.match(copy, /文字字幕.*实时翻译.*保留原字幕/);
    for (const service of ['Google Cloud Translation', 'Microsoft Translator', '兼容 OpenAI API 的 AI 服务']) assert.ok(copy.includes(service), 'Missing translation service: ' + service);
    assert.match(copy, /PGS\s*\/\s*VOBSUB.*无 OCR 时不适用/);
    assert.match(copy, /不提供语音识别或音频转写/);
}

function assertPrivacy(copy) {
    assert.match(copy, /字幕翻译默认关闭/);
    assert.match(copy, /需自备 API key/);
    assert.match(copy, /可能产生费用/);
    assert.match(copy, /字幕原文外发到所选翻译服务/);
    assert.match(copy, /密钥.*本机.*DPAPI 加密/);
    assert.match(copy, /不参与设置备份/);
    assert.match(copy, /本机加密不阻止字幕原文外发/);
}

function assertInterpolation(copy) {
    assert.match(copy, /补帧默认关闭/);
    assert.match(copy, /平滑插值/);
    assert.match(copy, /CPU 运动补偿（minterpolate）/);
    assert.match(copy, /Motion 仅用于已识别的 8-bit SDR/);
    assert.match(copy, /HDR\s*\/\s*高位深.*跳过 Motion/);
    for (const cost of ['卡顿', '伪影', '延迟']) assert.ok(copy.includes(cost), 'Missing interpolation cost: ' + cost);
    assert.match(copy, /不提供 SVP、RIFE 或 AI GPU 补帧/);
}

function assertDownloads(markup) {
    const links = [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attrs, text]) => ({ href: attrs.match(/href="([^"]+)"/)?.[1], text: stripTags(text) }));
    const store = links.filter(link => link.href?.startsWith('https://apps.microsoft.com/'));
    assert.equal(store.length, 2);
    for (const link of store) {
        assert.equal(link.href, storeUrl);
        assert.equal(link.text, '查看 Microsoft Store');
    }
    const downloads = links.filter(link => link.text === 'GitHub 下载');
    assert.equal(downloads.length, 2);
    for (const link of downloads) assert.equal(link.href, releaseUrl);
    assert.doesNotMatch(markup, /releases\/(?:download|tag)\//);
    assert.doesNotMatch(pageText(markup), /最新正式|已上架|已提交商店/);
}

function assertWebsiteBoundary(copy) {
    assert.match(copy, /不提供网页播放、媒体内容或服务器账号/);
    assert.match(copy, /有权访问的账号|登录有权访问的媒体服务器/);
    assert.match(copy, /账号与费用需自行确认/);
}

function assertMetadata(markup) {
    assertVersionFree(markup);
    const meta = metadataOf(markup);
    const data = structuredOf(markup);
    const description = meta.get('description');
    assert.ok(description.length >= 50 && description.length <= 110, 'Description must be concise');
    for (const key of ['og:description', 'twitter:description']) assert.equal(meta.get(key), description);
    assert.equal(data.description, description);
    assert.match(description, /Windows.*WinUI 3.*libmpv/);
    assert.match(description, /支持范围因服务端而异/);
    assert.match(description, /字幕翻译与补帧可选且默认关闭/);
    assert.equal(meta.get('og:title'), 'Momoka — Windows 原生媒体库客户端');
    assert.equal(meta.get('twitter:title'), meta.get('og:title'));
    assert.equal(meta.get('twitter:card'), 'summary');
    assert.equal(data['@context'], 'https://schema.org');
    assert.equal(data['@type'], 'SoftwareApplication');
    assert.equal(data.downloadUrl, releaseUrl);
    assert.equal(data.url, 'https://github.com/cudamin/Momoka');
    assert.equal(data.operatingSystem, 'Windows 10 1809 及以上，仅 x64');
    assert.equal(data.applicationCategory, 'MultimediaApplication');
    for (const key of ['offers', 'aggregateRating', 'review', 'datePublished', 'softwareVersion', 'softwareBuildNumber', 'releaseNotes']) assert.ok(!(key in data), 'Unsupported schema promise: ' + key);
    assert.ok(data.featureList.length >= 6);
    for (const feature of data.featureList) assert.ok(feature.length <= 140, 'Verbose structured feature');
    const features = data.featureList.join(' ');
    assert.match(features, /字幕和视频版本筛选/);
    assert.match(features, /翻译.*默认关闭.*外发.*可能收费/);
    assert.match(features, /补帧.*默认关闭.*8-bit SDR.*卡顿.*伪影.*延迟/);
    assertWebsiteBoundary(features);
}

function assertFaq(markup) {
    const questions = [...markup.matchAll(/<details class="faq-item reveal" id="([^"]+)"([^>]*)>([\s\S]*?)<\/details>/g)];
    assert.deepEqual(questions.map(([, id]) => id), ['faq-subscriptions', 'faq-translation-formats', 'faq-translation-privacy', 'faq-interpolation', 'faq-website']);
    for (const [, id, attrs, content] of questions) {
        assert.doesNotMatch(attrs, /\bopen\b/, 'FAQ should start collapsed: ' + id);
        assert.equal([...content.matchAll(/<summary>/g)].length, 1);
        assert.match(content, /class="faq-answer"/);
        const summary = content.match(/<summary>([\s\S]*?)<\/summary>/)?.[1];
        assert.doesNotMatch(summary, /<(?:a|button)\b/, 'No nested interactive controls in summary');
        for (const [, paragraph] of content.matchAll(/<p>([\s\S]*?)<\/p>/g)) assert.ok(stripTags(paragraph).length <= 120, 'Verbose FAQ answer');
    }
}

for (const [label, markup] of [['source', html], ['dist', deployed]]) {
    test(label + ': concise metadata and structured data have no release status or version numbers', () => assertMetadata(markup));
    test(label + ': overview remains brief and existing media-version features remain', () => {
        const overview = markup.slice(markup.indexOf('<main'), markup.indexOf('<section class="section" id="faq"'));
        for (const [, paragraph] of overview.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)) assert.ok(stripTags(paragraph).length <= 125, 'Overview paragraph is too long');
        for (const feature of ['弹弹play 弹幕', '播放快捷键', '片头 / 片尾标记', '多账号聚合', '版本筛选', '手动整理']) assert.ok(pageText(markup).includes(feature), 'Missing existing feature: ' + feature);
        assert.match(markup, /id="versions"/);
    });
    test(label + ': concise, initially collapsed FAQ preserves all detailed conditions', () => {
        assertFaq(markup);
        assertSubscriptions(blockOf(markup, 'details', 'faq-subscriptions'));
        assertTranslation(blockOf(markup, 'details', 'faq-translation-formats'));
        assertPrivacy(blockOf(markup, 'details', 'faq-translation-privacy'));
        assertInterpolation(blockOf(markup, 'details', 'faq-interpolation'));
        assertWebsiteBoundary(blockOf(markup, 'details', 'faq-website'));
    });
    test(label + ': sensitive off-by-default and external-transmission warnings stay in the overview', () => {
        const subtitles = blockOf(markup, 'li', 'subtitles');
        assert.match(subtitles, /翻译默认关闭.*字幕原文外发.*可能收费/);
        assert.match(blockOf(markup, 'li', 'frame-interpolation'), /补帧默认关闭.*8-bit SDR.*跳过 Motion.*卡顿.*伪影.*延迟/);
        const moviepilot = blockOf(markup, 'article', 'moviepilot');
        assert.match(moviepilot, /MoviePilot.*需单独配置.*服务关闭或连接不可用时.*入口自动隐藏/);
    });
    test(label + ': official downloads stay neutral and avoid guessed assets', () => assertDownloads(markup));
}

test('README describes timeless copy, preserved limits and upload boundaries', () => {
    assert.match(readme, /不写软件版本号、候选版或发布进度/);
    assert.match(readme, /Motion.*8-bit SDR/);
    assert.match(readme, /不推送、不部署/);
    assert.match(readme, /Git 推送成功也不等于 Cloudflare 已部署/);
    assert.match(readme, /node --test tests\/\*\.test\.mjs/);
    assert.match(readme, /node tools\/check_site_layout\.mjs/);
});

test('source and deployment are byte-identical and edited text stays LF', () => {
    for (const file of ['index.html', 'styles.css', 'main.js']) assert.deepEqual(readFileSync(join(root, file)), readFileSync(join(root, 'dist', file)));
    for (const file of ['.gitignore', 'README.md', 'index.html', 'dist/index.html', 'styles.css', 'dist/styles.css', 'main.js', 'dist/main.js', 'tests/site-copy.test.mjs', 'tests/feature-copy.test.mjs', 'tests/site-interactions.test.mjs', 'tests/test_site_links.py', 'tools/check_site_layout.mjs']) assert.ok(!readFileSync(join(root, file)).includes(13), 'CRLF drift: ' + file);
});

const regressions = [
    ['body version reintroduced', () => assertVersionFree(html.replace('集中浏览片库。', '集中浏览片库。0.2.1 候选版')), /Software versions/],
    ['metadata version reintroduced', () => assertVersionFree(html.replace('采用 WinUI 3', '0.2.1 采用 WinUI 3')), /Software versions/],
    ['schema version reintroduced', () => assertVersionFree(html.replace('"name": "Momoka"', '"softwareVersion": "next", "name": "Momoka"')), /Release-status/],
    ['metadata drift', () => assertMetadata(html.replace('property="og:description" content="Momoka', 'property="og:description" content="旧描述 Momoka')), /Expected values/],
    ['fabricated free-service schema', () => assertMetadata(html.replace('"applicationCategory": "MultimediaApplication",', '"applicationCategory": "MultimediaApplication", "offers": {"price": "0"},')), /Unsupported schema promise: offers/],
    ['corrupt JSON-LD', () => structuredOf(html.replace('"name": "Momoka",', '"name": "Momoka" "broken"')), SyntaxError],
    ['missing subscription mode', () => assertSubscriptions(blockOf(html.replace('分集洗版或全集洗版', '分集洗版'), 'details', 'faq-subscriptions')), /Missing subscription mode/],
    ['lost movie cancellation', () => assertSubscriptions(blockOf(html.replace('再次点击即可取消', '再次点击保持订阅'), 'details', 'faq-subscriptions')), /取消/],
    ['bitmap OCR overclaim', () => assertTranslation(blockOf(html.replace('无 OCR 时不适用', '无需 OCR 即可翻译'), 'details', 'faq-translation-formats')), /无 OCR/],
    ['lost default-off privacy', () => assertPrivacy(blockOf(html.replace('字幕翻译默认关闭，需自备', '字幕翻译默认开启，需自备'), 'details', 'faq-translation-privacy')), /默认关闭/],
    ['keys included in backups', () => assertPrivacy(blockOf(html.replace('不参与设置备份', '参与设置备份'), 'details', 'faq-translation-privacy')), /不参与设置备份/],
    ['overbroad HDR motion support', () => assertInterpolation(blockOf(html.replaceAll('HDR / 高位深片源跳过 Motion', 'HDR / 高位深也强制 Motion'), 'details', 'faq-interpolation')), /跳过 Motion/],
    ['AI GPU interpolation promise', () => assertInterpolation(blockOf(html.replace('不提供 SVP、RIFE 或 AI GPU 补帧', '提供 SVP、RIFE 或 AI GPU 补帧'), 'details', 'faq-interpolation')), /不提供/],
    ['wrong Store product', () => assertDownloads(html.replace('9NQJL7K0H8X0', 'INVALID_PRODUCT')), /Expected values/],
    ['web playback promise', () => assertWebsiteBoundary(blockOf(html.replaceAll('本站不提供网页播放、媒体内容或服务器账号', '本站提供网页播放、媒体内容及服务器账号'), 'details', 'faq-website')), /不提供网页播放/],
    ['missing accessible summary', () => assertFaq(html.replace('<summary>', '<div>')), /Expected values/],
    ['expanded-by-default FAQ', () => assertFaq(html.replace('id="faq-subscriptions">', 'id="faq-subscriptions" open>')), /start collapsed/],
];
for (const [name, check, expected] of regressions) test('rejects ' + name, () => assert.throws(check, expected));
