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
    const tools = copyOf(markup, 'li', 'player-tools');
    assert.match(tools, /FFmpeg.*ffsubsync\/alass.*faster-whisper/);
    assert.match(tools, /片段、GIF 与整份字幕/);
    assert.match(tools, /Momoka 不安装或下载/);
    const trailers = copyOf(markup, 'li', 'trailers');
    assert.match(trailers, /封面悬停.*本地预告/);
    assert.match(trailers, /YouTube 预告需要登录时/);
    const music = copyOf(markup, 'article', 'music-library');
    assert.match(music, /Emby、Jellyfin 与飞牛音乐.*底部播放栏/);
    assert.match(music, /Plex 为协议适配/);
    assert.match(music, /歌词.*服务器歌词表.*文件标签/);
    const local = copyOf(markup, 'article', 'local-libraries');
    assert.match(local, /本机磁盘或网络共享.*TMDB 或 MoviePilot.*改名、硬链接或软链接.*自动监控/);
    assert.match(local, /不在应用内播放/);
    const localFaq = copyOf(markup, 'details', 'faq-local');
    assert.match(localFaq, /硬链接要求源和目标在同一本地卷，网络共享不支持/);
    assert.match(localFaq, /不在应用内播放/);
    const management = copyOf(markup, 'article', 'library-management');
    assert.match(management, /多选批量.*已看、收藏、加入合集或播放列表/);
    assert.match(management, /改元数据、换封面、管理字幕、查看遗漏集/);
    assert.match(management, /不支持的项自动收起/);
    const anibt = copyOf(markup, 'article', 'anibt');
    assert.match(anibt, /AniBT 一栏.*番剧目录.*字幕组.*MoviePilot 下载/);
    assert.match(anibt, /原文件名识别/);
    assert.match(anibt, /需要先连接可用的 MoviePilot/);
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
        for (const keyword of ['全季选集', '音乐库', '本机整理', '弹幕外观']) assert.ok(description.includes(keyword), keyword);
        assert.equal(schema.description, description);
        const features = schema.featureList.join(' ');
        for (const keyword of ['全季选集', '卡片', '排序和隐藏', '高斯', 'danmu_api', '来源入口始终显示', '音乐库', '本机整理', '片库管理', '播放工具', '预告片', 'SVP']) assert.ok(features.includes(keyword), keyword);
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
    ['music Plex overclaim', ['Plex 为协议适配', 'Plex 已实测']],
    ['local library playback promise', ['不在应用内播放', '可直接播放']],
    ['hardlink on network share', ['网络共享不支持', '网络共享也支持']],
    ['tools installed by the app', ['Momoka 不安装或下载。', 'Momoka 会自动安装这些程序。']],
    ['trailer without login', ['YouTube 预告需要登录时', 'YouTube 预告无需登录即可']],
    ['AniBT without MoviePilot', ['需要先连接可用的 MoviePilot', '无需 MoviePilot']],
];
for (const [name, [before, after]] of mutations) {
    test(`rejects ${name}`, () => {
        assert.ok(html.includes(before), `Mutation anchor disappeared: ${before}`);
        assert.throws(() => assertRecentCopy(html.replaceAll(before, after)), assert.AssertionError);
    });
}
