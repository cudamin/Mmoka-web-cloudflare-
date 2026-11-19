# 网站文案与布局优化

## 2026-11-19 按当前客户端能力补齐媒体库、播放工具与预告片介绍

- 本树 `C:/Users/89400/Momoka-site`，分支 `main`；起点为本地未推送的 `184e2fc`（远端 HEAD `1580517`），保留其全部改动。对照客户端 master `8e816d3` 的 README、`UiThemes.cs`、`AppSettings.cs` 及 `docs/音乐媒体库.md`、`docs/本机整理.md`、`docs/播放菜单与工具.md`、预告片与 SVP 说明逐项核对；未修改客户端或重新发布应用。
- 新增「媒体库」分区（音乐库、本机整理、片库管理、AniBT）和播放区的「播放器与工具」「预告片」两张卡片；首屏功能目录、主导航与页脚同步加入口。补帧说明改为可接入本机 SVP（官方 mpvpipe 通道，Momoka 不安装、不修改 SVP 与 VapourSynth），删除「不提供 SVP、RIFE 或 AI GPU 补帧」的旧说法。首套主题按客户端改称「薄荷影院」，保留墨绿背景主视觉。
- 新增 AniBT、本机整理、音乐库、播放工具、预告片五条 FAQ，补帧 FAQ 同步 SVP 条件；下载区补充 SVP、FFmpeg 等可选组件。Plex 音乐仍标协议适配、未实服核对；本地库明确只浏览、不在应用内播放；外部工具明确需自备，远程媒体先下载副本，Plex 多段文件隐藏工具。
- 布局：播放列表 8 项维持两列；媒体库四卡两列，720 以下单列；首屏目录 6 项（960 三列、720 两列）；分区背景交替重排。`index.html` / `styles.css` / `main.js` 与 `dist/` 对应文件字节一致。
- 验证：`node --test tests/*.test.mjs` **81/81**、失败 0、跳过 0；`py -3 -B tests/test_site_links.py` **20/20**；`py -3 -B tools/check_site_links.py --root .` 离线检查源/dist、锚点、资源与 14 个公开外链通过；`node tools/check_site_layout.mjs`（本机 Playwright + Edge）**14/14**，8 种宽度无横向或组件溢出，1440 / 720 / 390 整页、主题与展开 FAQ 截图已目视。未构建客户端、未连接真实服务器。
- 交付：用户明确要求提交并推送 `main`；推送后核对远端 SHA。Cloudflare 生产部署与线上内容不在本轮核对范围，不以 Git 推送声称已上线。

## 2026-11-05 按近期客户端更新同步介绍

- 本树 `C:/Users/89400/Momoka-site`，分支 main；从干净的旧副本快进至远端 `1580517` 后修改。参考主项目 master `63f02ab`（仅本地进度记录）及远端产品 `f4f1b60`，逐项读取 `Configuration/AppSettings.cs`、`DanmakuSettings.cs`、`SettingsViewModel.Danmaku.cs`、Jellyfin 媒体段实现、发布说明与主树交付记录。未修改客户端源码或重新发布应用。
- 增补全季选集、图文季菜单、特别篇、长剧按需集卡；详情页三种卡片独立排序/显隐、亚克力控件、高斯背景和不透明度；主页缓存/逐排更新、普通媒体库精确返回与版本体积；顶部聚合开关、账号单独下线。
- 弹幕说明补齐弹弹play / 自部署 danmu_api / 合并来源、内置应用凭据、外观与避让、播放页开关、默认关闭、外发作品名称与集数和共享额度。MoviePilot 与 AniBT 搜索页四个来源入口始终显示，与不可用时隐藏从属操作区分。搜索摘要、分享描述与 JSON-LD 同步，不增加软件版本号/发布进度，不扩大 Plex 或真实服务器写入验证。
- 源 index/styles 与 dist 对应文件字节一致；播放六项改为宽屏三行双列，沿用现有主题、字体和主视觉。新增近期功能与拒绝错误文案的回归，扩展现有 FAQ 名单/来源例外，浏览器路径补弹幕问答定位和真实列宽一致性。
- 最终 Node **75/75，失败0、跳过0**，Python链接测试 **20/20**，14个公开外链离线结构检查与 git diff --check 通过。浏览器 **14/14**：8种宽度1440/1280/1080/960/768/720/390/320无横向或组件溢出，五主题/保存/无效值回退、键盘FAQ、各FAQ链接/重复开启、禁JS/禁存储/普通动画通过。桌面整页、手机整页、主题与展开FAQ截图已目视；无头渲染不冒充客户端实屏。另将旧整行CSS注入独立夹具，真实浏览器以列宽断言退出1，证实新增失败路径。
- 证据在忽略目录 `.preview/recent-updates-20261105/final/`（测试日志、截图与report.json），负向布局在同级failure-columns。生产域名只读返回200，但当时仍为旧介绍；本轮尚未获明确上传授权，未推送/部署，不称已上线。按 README 的提交与部署约定等待授权后再推 origin/main 并核对 Cloudflare 最终内容。

## 2026-10-26 上传与生产核验完成

- 兼容性提交 `6c39b04` 已推送 `origin/main` 并核对远端 SHA。GitHub About 简介与官网地址已更新并回读确认，不只是给出建议文案。
- 生产域名返回 200，Jellyfin 10.10.7 与飞牛 0.9.8／0.8.43 的原画及续播实测说明已出现，旧未实播声明消失；未测管理写入、其它版本／管线与 Plex 仍保留限制。
- 生产正文与 `dist/index.html` 排除 Cloudflare 原有 analytics／challenge 注入后完全一致；原始字节不同，所以未声称字节相同。对应主项目本机证据 `artifacts/live-server-verification-20261026/website-production.json`；内容提交 HTML SHA-256 为 `47cfea1a699c470962f690cb756a8e4296b0da5fcd40cf7528d501da477e25c9`。
- 最终 52 项 Node 文案／负向检查与 20 项 Python 链接检查通过，源／dist 一致；桌面 1440 和手机 390 预览已查看，无横向溢出。本轮没有发布应用安装包或微软商店版本。
## 2026-10-26 实服验证后的兼容性更新

- 工作树 `C:/Users/89400/Momoka/work/web-cloudflare-20261026`，分支 main；用户直接授权更新并推送网页。只改兼容性说明与对应测试，保留线上 0.1.7／未提交的 0.1.8 候选状态，不发布应用二进制或商店包。
- Jellyfin 10.10.7、飞牛网页 0.9.8／服务 0.8.43 的保存登录恢复、媒体库读取、原画播放与停止／续播闭环真实验证通过，两端进度上报零失败；覆盖内置 libmpv／独占管线。飞牛新增同版流时长回退修复。
- 页面卡片与 JSON-LD 同步实测版本、日期、管线和管理写入未验证范围；Plex、内嵌网页登录和其他版本／管线／HDR 等未测范围不推广为通过。
- 新克隆在 core.autocrlf=true 下把所有文本改成 CRLF，既有 LF 测试失败；明确 .gitattributes 固定 LF，并原样归一化现有文本，不改验证基线或降级断言。
- 本轮真实生产部署与 Git 推送状态待校验；Git 推送不等于 Cloudflare 已上线。

## 范围与设计方向

- 日期：2026-10-22。
- 工作树：`C:/Users/89400/Momoka/work/website-copy-20261022`。
- 仓库：`cudamin/Mmoka-web-cloudflare-`，分支 `codex/website-copy`。
- 只改网站文件与对应检查；Momoka 主项目及其中已有未提交内容不动。
- 保留墨绿背景、花瓣主视觉、现有本机字体和五套配色。不重新生成图片、不引入远程字体，不恢复已移除的首屏与播放大标题。
- 色板沿用森林黑 `#060a07`、正文白 `#edf4ef`、次要灰绿 `#9bada1`、强调绿 `#8be6a3` 与提示金 `#e7c877`；正文使用 Segoe UI / 中文系统字体，等宽字体仅用于真正的步骤编号，文字左对齐。
- 用短文案、可点击功能目录、双列兼容性卡片和首次使用指引改善阅读。支持限制保持可见，不折叠成看不到的说明。
- 只给真正有先后关系的首次使用步骤编号；功能介绍不再伪装成步骤。

```text
首屏介绍与下载入口    | 既有花瓣插画
可点击功能目录（窄屏换行）
播放偏好             | 着色器选择示意
主题配色示意         | 主题选择
Emby / Jellyfin      | 飞牛影视 / Plex（双列）
多账号聚合、MoviePilot 与按权限显示的管理入口
下载与系统要求       | 安装 → 连接 → 播放偏好
```

## 内容依据

- 对照主项目 `Configuration/AppSettings.cs`，纠正过时的字幕默认说明：默认优先简体中文，其次匹配其他中文；双语与特效标题规则默认中立，并非默认排除繁体或优先双语。
- 各服务端的说明保留 Emby 主用、Jellyfin 离线适配、飞牛官方前端核对、Plex 未核对真实服务器的区别；不夸大真实播放覆盖。
- 画质文案说明启用条件与显卡档位，避免承诺修复效果或自动选择显卡档位。
- 下载区明确授权媒体来源、MoviePilot 可选与 WebView2 使用条件；隐私文案不再让人误解为应用不联网。

## 验证与交付

- `node --check` 检查源文件和部署 JavaScript、检查脚本语法通过；`node --test tests/site-copy.test.mjs`：20 项通过，0 失败，0 跳过。包含 7 个故意破坏文案、链接、结构或部署一致性的拒绝场景。
- `index.html` / `dist/index.html` 与 `styles.css` / `dist/styles.css` 同步；未修改网站 JavaScript、图片、Workers、Nginx 或 Docker 配置。
- 浏览器实测 390×844、820×1180、1024×768 和默认 1280×720，覆盖 11 个页面/尺寸组合；均无横向溢出、可见文字截断或坏图。检查中发现原有花瓣光晕导致窄屏横向溢出，使用 `overflow: clip` 限定在首屏区域并重验通过。
- 5 个功能目录链接均跳到正确目标且未被固定导航遮住；五套主题的配色示意、选中状态、状态文本、刷新保存，以及键盘 Tab 焦点和空格选择实测通过。
- 减少动态效果下的内容显隐实测通过。浏览器控制台错误 0；临时视口与媒体模拟设置均已恢复。
- 商店、公开 Releases 页面、README、隐私、许可证、第三方组件与三份服务端说明的链接读取均返回 HTTP 200。GitHub `releases/latest` API 曾限流（403），改查原本使用的公开 Releases 页面成功；未据此宣称已核对最新版安装包。
- 截图与浏览器记录保存在本树被忽略的 `.wrangler/copy-verification/`；它们是本次本地浏览器证据，不是应用截图或线上部署证据。
- 仅网站变更，不构建或发布 WinUI 应用，不访问真实媒体服务器、不启动播放。
- 初次本地交付时未获上传授权，因此未推送 GitHub、未修改仓库在线简介、未部署 Cloudflare。
- 2026-10-22：用户明确授权上传本次网站改动到 `cudamin/Mmoka-web-cloudflare-`，推送目标为 `main`；未另行修改仓库在线简介，不把 Git 推送成功视为 Cloudflare 生产部署已验证。

## 2026-10-25 — 网页发布侧车（本地准备，不推送）

- 独立克隆：`C:/Users/89400/.codex/worktrees/momoka-website-release-20261025`。
- 官方 remote：`https://github.com/cudamin/Mmoka-web-cloudflare-.git`；默认分支 `main`，本轮分支 `codex/release-features-20261025`，起点 `c9784c76cd3b78ec2cc09d2ec9264f2f17060771`。
- 范围仅 `index.html`、`dist/index.html`、`README.md`、本记录、`tests/site-copy.test.mjs`、`tests/release-copy.test.mjs`、`tests/test_site_links.py` 和 `tools/check_site_links.py`。不触碰 Momoka 父树代码、其他工作树或主目录的 untracked website/vibe_images；不改 CSS、运行 JavaScript、图片、Workers 或部署配置。
- 0.1.8 先标为待发布；GitHub 入口指向官方 latest / Releases，商店入口使用产品 9NQJL7K0H8X0，按钮不承诺已可安装。父窗口确认真实 release 与商店状态后才能更新准确版本、推送 `main` 并核查生产服务。
- 补充剧集组 / 季订阅、普通订阅与分集 / 全集洗版、电影订阅再点击取消；保留原有弹幕、快捷键、Emby 片头 / 片尾标记和各服务功能。
- 同步正文、6 项 FAQ、metadata、OpenGraph、Twitter 描述及 SoftwareApplication JSON-LD；翻译 / 补帧均默认关闭，明确 API 外发 / 费用 / DPAPI 不备份、PGS / VOBSUB 无 OCR 不适用、CPU minterpolate 的 8-bit SDR 限制与性能代价，不夸大为 SVP / RIFE / AI GPU 补帧。
- 只按用户提供的实现合同与官方仓库公开文档 / 源码核对文案；官方 master README 仍含较旧的字幕默认描述，未把它覆盖到网站。GitHub tree API 返回 403 限流，不作为源码完整核对成功的证据。
- Node.js v24.19.0 / Python 3.13.2 标准库验证：`node --test tests/site-copy.test.mjs tests/release-copy.test.mjs` 50 项通过、0 失败 / 跳过；`py -3 -B tests/test_site_links.py` 20 项通过。原有 20 项 Node 检查保留，新检查含 14 个故意破坏文案 / JSON-LD / 下载路径的拒绝场景；Python 覆盖 HTTP 404、403、429、超时及严格模式，不把未核实洗为通过。
- `py -3 -B tools/check_site_links.py --root .` 离线通过：源 / dist 字节一致、资源、锚点与 14 个外链（含文档片段）；`--strict-live` 实际 GET 检查去掉片段后的 13 个唯一外链全部 HTTP 200、0 坏链接、0 未核实。初次 HEAD 遇商店 403 / QQ 405，仅作不适用方法记录；最终 GET 的实际读数替代它，但不证明新版本商店可安装。
- `node --check` 核对原有 main.js、dist/main.js、worker/index.js 与两份 Node 测试，Python AST 核对新增两份脚本，全部通过。没有包安装或编译步骤，不构建 WinUI。
- 本地短时绑定 127.0.0.1 随机端口检查 dist 首页、index、CSS、JS 和三张图片：7 / 7 HTTP 200 且字节匹配；服务已关闭。仅静态 HTTP，不操作桌面，不冒充浏览器或应用视觉验收；排版和真实应用验收交给主窗口。
- `git diff --check` 通过；本轮 8 个文本文件保持 LF，index / dist HTML 完全同步，CSS、运行 JavaScript、图片和部署配置无 diff。
- 本轮仅本地提交；不推送、不部署，不操作桌面、真实应用、播放、账号或密钥。等待父窗口最终验收绿、核对 GitHub release / Store 状态并发出明确发布指令后再继续。

## 2026-10-25 — 原生崩溃暂缓状态更正（仅网页本地提交）

- 继续原网页独立树 `C:/Users/89400/.codex/worktrees/momoka-website-release-20261025` 与分支 `codex/release-features-20261025`，基于网页提交 `4c8b5dd1d865985d5aa303897ea47928c917f097`。只读 fetch 后 `origin/main` 仍为 `c9784c76cd3b78ec2cc09d2ec9264f2f17060771`，是当前 HEAD 祖先，可快进；本轮不合并、不切主干、不推送。
- 主窗口已验收上一轮网页 DOM 与三功能说明；本轮按主窗口提供的状态纠正文案：0.1.8 尚未提交微软商店，线上仍为 0.1.7，候选版待完成验收。最终并发UI自动化验收出现尚未定位的原生崩溃，正式发布暂缓。不把无并发 UIA 的对照通过写成最终验收通过，不把 API key 等使用条件写成未发布原因。
- 对应候选产物仍未放行；安装器 / MSIX 只是候选，商店与桌面稳定版未替换。应用构建、诊断、二进制发布及商店提交不属于网页侧车工作；本轮不执行这些操作。
- hero、下载区、FAQ、description、OpenGraph、Twitter 描述及 README 统一说明未提交状态。JSON-LD 的公开 softwareVersion 为 0.1.7，0.1.8 新功能明确标为候选版并在 releaseNotes 写出暂缓原因；不增加定价、数据、账号或图片 / CSS 变更。
- GitHub 主按钮与 JSON-LD downloadUrl 改为公开发布列表，用“GitHub 发布页 / 已公开版本”，提醒预发布标记。README 仅将 latest 保留为辅助跳转，不宣称它指向正式版或稳定版。
- 已有三功能、字幕 / 补帧默认关闭、翻译外发与可能费用、DPAPI 不备份、PGS / VOBSUB 无 OCR 边界、Motion 8-bit SDR 限制及性能代价保持；父树源码、主目录 website/vibe_images、其他树和运行脚本 / 部署配置不动。
- 新状态的对应测试已更新：`node --test tests/site-copy.test.mjs tests/release-copy.test.mjs` 50 / 50 通过、0 失败 / 跳过；`py -3 -B tests/test_site_links.py` 20 / 20 通过。对错误“可能在审核”、候选版冒充公开版本和“等待翻译密钥”假原因加入拒绝断言。Python 最初有一处协议相对 URL 失败场景仍修改已移除的 latest 页面地址，未真正注入坏链接；已把 fixture 改到当前发布列表地址后重跑通过，未放宽检查或删除测试。
- 本轮离线检查通过：index / dist 字节完全一致、资源 / 锚点与 14 个带文档片段的外链有效。`py -3 -B tools/check_site_links.py --root . --strict-live` 对去片段后的 13 个唯一 URL 实际无认证 GET 均 HTTP 200，0 坏链接、0 未核实；不据 HTTP 状态判断某版正式发布、商店提交或 Cloudflare 部署。
- `node --check` 对两份测试及 main.js / dist/main.js / worker/index.js 通过；Python AST 对两份 Python 脚本通过，`git diff --check` 通过。本轮 8 个修改文件均 LF；CSS、原图片、运行 JavaScript、Workers / 部署配置无 diff。新 DOM 的最终验收仍交父窗口，不操作桌面或真实应用。
- 本轮只提交网页准确状态，不把父窗口应用单测 / 自检或无并发对照通过当成最终发布绿；原生崩溃根因未明、应用发布仍暂缓。
- 用户已授权网页仓库更新，但本轮更具体指令是先交 diff / SHA，等父窗口绿色 push main 指令；当前只本地提交，不 push、不 deploy。Cloudflare 真实部署未核验，不作上线承诺。

## 2026-10-26 — 弹幕凭据端点（本地待推送）

- 在现有官网仓库加入 `GET /api/danmaku/credential`：Workers 入口 `worker/index.js` 路由到 `worker/credential.js`；Pages Function `functions/api/danmaku/credential.js` 复用同一模块。静态站点与原有资源不变。
- 端点从 `DANDANPLAY_APP_ID`、`DANDANPLAY_APP_SECRET`、`DANDANPLAY_CREDENTIAL_KEY`、`DANDANPLAY_CREDENTIAL_KID` 读取，AES-GCM 加密返回 7 天有效凭据；未配置返回 503，非 GET 返回 405。
- 验证：`node --test tests/danmaku-credential.test.mjs` **5 项全过、0 失败**；`node --check` 三个 JS 文件通过。
- **尚未推送、尚未部署、尚未配置真实 Secret**；线上端点与真实凭据未验证。客户端 `DandanPlayBuiltIn.Endpoint` 仍待按实际域名回填。

## 2026-10-26 — 页面文案与组件布局简化（本地提交）

- 工作树：C:/Users/89400/Momoka/work/web-cloudflare-20261026；分支 codex/simplify-page-layout，基于已核对的远端 main 提交 ae97e361964be346bbb44b3339829d51cfa55ce3。使用该独立网站仓库，不修改 Momoka 桌面源码、主目录 website 或其他存在未提交内容的旧官网树。
- 保留墨绿主视觉和五套主题：色彩沿用背景 #060a07、正文 #edf4ef、说明 #9bada1、强调 #8be6a3、强强调 #c3f6cf；字体沿用 Segoe UI Variable / 中文系统字体。布局保持左对齐，以原有花瓣播放符号为主视觉，不另加大标题、装饰或新图片。
- 精简首屏、播放、主题、服务器、聚合、MoviePilot、下载与页脚说明；删除页面、description / OpenGraph / Twitter 与 JSON-LD 中的软件版本号、候选说明、发布暂缓及排期，保留视频版本筛选这一产品功能。服务器版本和详细实测信息由支持文档承载，不再把它们写成长卡片。
- 播放功能宽屏双列、手机单列；服务器卡片宽屏四列、平板双列、手机单列，并对齐同一行的页脚。缩小段落与分区间隔，主题按钮在窄屏仍保持双列；下载与三步指南重新分配宽度。
- FAQ 改为 5 个原生 details / summary，默认收起；翻译与补帧默认关闭、字幕外发及费用等关键提示仍在功能概要中，详细 OCR / API key / DPAPI 不备份 / Motion 8-bit SDR / 性能代价在可展开答案中。按权限和服务可用性显示管理入口、Plex 未实服核对等边界不扩大。
- main.js 只新增 FAQ 锚点展开：直接进入、点击功能说明和关闭后再次点同一链接均能展开对应答案；无效或未正确编码的 fragment 不报错。主题状态与本地保存保持不变。
- 按本次范围退役 tests/release-copy.test.mjs 对发布状态的硬编码要求，用 tests/feature-copy.test.mjs 替换为版本缺席、简短文案及功能边界检查；原安全失败场景保留。更新 tests/site-copy.test.mjs 和 tests/test_site_links.py 的文案 / 布局 / latest 辅助链接要求，新增 tests/site-interactions.test.mjs，README 同步可运行命令。未放宽官方下载、凭据、API 或外链安全验证。
- 新增 tools/check_site_layout.mjs：回环 HTTP + 独立无头 Edge，全部浏览器 context 仅允许回环来源，输出截图与报告到忽略的 .preview/。不操作用户鼠标或桌面、不访问媒体服务器、不登录、不播放、不读取真实 Secret。
- 最终验证：Node 64 / 64、Python 链接测试 20 / 20，0 失败 / 跳过；离线资源 / 锚点 / 14 个公开外链检查通过；10 个 JS 文件语法、2 个 Python AST、Git 空白与 LF 检查通过。源 index / CSS / JS 与 dist 副本逐字节一致，原图片、Workers / Pages 凭据端点与部署配置无改动。
- 浏览器 14 项全过：1440、1280、1080、960、768、720、390、320 共 8 种宽度无横向或组件溢出；5 套主题、保存恢复 / 无效值回退、键盘焦点 / Enter / Space、问答点击 / 深链接 / 重复打开 / 坏 fragment、禁用脚本、禁止 localStorage 和普通动画滚动均检查。另在独立失败夹具实际证明横向溢出、加载 JS 异常、图片丢失与缺少参数均非零退出，不接受失败为绿。
- 已人工查看桌面整页、手机首屏及整页、展开 FAQ 与主题截图。证据目录为 C:/Users/89400/Momoka/work/web-cloudflare-20261026/.preview/page-layout-20261026/final；这是无头浏览器渲染截图，不冒充真实桌面或客户端截图。相同 1440 × 1000 预览下，默认折叠页面高度由 6630 px 缩至 4744 px。
- 本次仅网页交付，不适用 WinUI 构建、自检、播放器探针或桌面发布闸门；本轮没有上传 / 部署授权，只创建对应本地提交，不 push、不 deploy。Cloudflare 生产内容、外链实时可达性和真实客户端能力未在本轮核验。
