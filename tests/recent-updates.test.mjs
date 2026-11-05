import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const deployed = readFileSync(join(root, 'dist/index.html'), 'utf8');

function copyOf(markup, tag, id) {
    const block = markup.match(new RegExp(`<${tag}\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)<\\/${tag}>`));
    assert.ok(block, `Missing ${id}`);
    return block[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function assertRecentCopy(markup) {
    const layout = copyOf(markup, 'article', 'detail-layout');
    assert.match(layout, /电影、剧集与单集详情分别保存卡片顺序和显示偏好/);
    assert.match(layout, /亚克力.*高斯模糊.*不透明度/);
    const navigation = copyOf(markup, 'article', 'navigation');
    assert.match(navigation, /先显示缓存.*后台核对.*逐排更新/);
    assert.match(navigation, /普通媒体库.*恢复原来的卡片和滚动位置/);
    assert.doesNotMatch(navigation, /秒|毫秒|零延迟|瞬间|所有媒体库/);
    const episodes = copyOf(markup, 'li', 'episodes');
    assert.match(episodes, /全季集列表.*图文季菜单.*特别篇.*按需创建集卡/);
    assert.match(episodes, /播放器内.*跨季选集/);
    const controls = copyOf(markup, 'li', 'playback-controls');
    assert.match(controls, /弹弹play 弹幕.*自部署 danmu_api.*合并来源.*服务默认关闭/);
    assert.match(controls, /字体、密度、透明度与字幕避让.*一键开关/);
    assert.match(controls, /播放快捷键可重绑/);
    assert.match(controls, /Emby、Jellyfin 或 Plex 提供片头 \/ 片尾标记时/);
    assert.match(copyOf(markup, 'li', 'versions'), /版本菜单显示各份文件的体积/);
    const danmaku = copyOf(markup, 'details', 'faq-danmaku');
    assert.match(danmaku, /服务默认关闭.*内置应用凭据.*无需填写 AppId 或 AppSecret/);
    assert.match(danmaku, /danmu_api 需要自己部署/);
    assert.match(danmaku, /随窗口缩放、字幕避让、防重叠、倍速同步和屏蔽词/);
    assert.match(danmaku, /关闭保留偏好.*作品名称与集数发送到所选服务.*共享额度/);
    const moviepilot = copyOf(markup, 'article', 'moviepilot');
    assert.match(moviepilot, /从属操作入口自动隐藏/);
    assert.match(moviepilot, /媒体库、MoviePilot 订阅、MoviePilot 资源与 AniBT 四个来源入口始终显示/);
    assert.match(moviepilot, /不可用时显示恢复说明.*保留搜索内容/);
    assert.match(copyOf(markup, 'details', 'faq-subscriptions'), /来源栏始终显示.*阻止请求/);
}

for (const [name, markup] of [['source', html], ['dist', deployed]]) {
    test(`${name}: recent features retain their conditions and search entry exception`, () => assertRecentCopy(markup));
    test(`${name}: sharing and structured features describe the same recent capabilities`, () => {
        const description = markup.match(/<meta name="description" content="([^"]+)"/)[1];
        const schema = JSON.parse(markup.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
        for (const keyword of ['全季选集', '详情布局自定义', '弹幕外观']) assert.ok(description.includes(keyword), keyword);
        assert.equal(schema.description, description);
        const features = schema.featureList.join(' ');
        for (const keyword of ['全季选集', '卡片', '排序和隐藏', '高斯', 'danmu_api', '来源入口始终显示']) assert.ok(features.includes(keyword), keyword);
    });
}

const mutations = [
    ['default-enabled danmaku', ['服务默认关闭', '服务默认开启']],
    ['public danmu_api promise', ['danmu_api 需要自己部署', 'danmu_api 无需自己部署']],
    ['lost danmaku disclosure', ['作品名称与集数发送到所选服务', '只在本机处理作品信息']],
    ['hidden search sources', ['四个来源入口始终显示', '四个来源入口不可用时隐藏']],
    ['requests allowed when unavailable', ['阻止请求', '继续请求']],
    ['all libraries restoration promise', ['普通媒体库从详情返回', '所有媒体库从详情返回']],
    ['missing episode laziness', ['按需创建集卡', '一次创建全部集卡']],
];
for (const [name, [before, after]] of mutations) {
    test(`rejects ${name}`, () => {
        assert.ok(html.includes(before), `Mutation anchor disappeared: ${before}`);
        assert.throws(() => assertRecentCopy(html.replaceAll(before, after)), assert.AssertionError);
    });
}
