# 网站文案与布局优化

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
