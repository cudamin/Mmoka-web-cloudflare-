# Momoka 官网

Windows 原生媒体库客户端的介绍与下载指引，支持 Cloudflare Pages / Workers 与 Docker 静态部署。

## 页面内容与维护

- 保留原有墨绿主视觉、五套主题配色和下载入口；功能介绍简短，详细使用条件集中在可展开的常见问题中。
- 页面、搜索摘要、分享描述与 JSON-LD 不写软件版本号、候选版或发布进度；视频版本筛选仍是产品功能，不应误删。
- 服务器卡片只概述能力与验证边界，并链接对应支持文档。Jellyfin 与飞牛影视已实测原画播放和续播；管理写入未验证，Plex 尚未连接真实服务器核对。不承诺所有服务端配置都兼容。
- 字幕翻译与补帧默认关闭。翻译需自备 API key，可能收费并外发原文；PGS / VOBSUB 无 OCR 时不适用，密钥本机加密且不参与设置备份。Motion 仅适用于已识别的 8-bit SDR，可能增加卡顿、伪影与延迟。
- MoviePilot 需单独配置；不可用时隐藏依赖入口。本站不提供网页播放、媒体内容或服务器账号，第三方账号与费用需自行确认。

历史验证与发布记录保留在 PROGRESS.md。移除页面发布进度不代表发布了客户端，也不改变真实服务器的验证范围。详见[实服验证记录](https://github.com/cudamin/Momoka/blob/master/docs/实服验证-飞牛与Jellyfin-2026-10-26.md)。

## 提交与部署

只提交本次任务的文件。没有本轮明确上传授权时，不推送、不部署；网页上传不等于客户端或商店发布。

Git 推送成功也不等于 Cloudflare 已部署：必须另外核对对应提交的部署状态与生产页面内容。下方命令是维护说明，不代表已经执行。

## 目录结构

```
Momoka-site/
├── dist/                 # 实际部署内容：index.html、styles.css、main.js、assets/
├── index.html            # 源文件
├── styles.css
├── main.js
├── assets/
├── worker/               # Cloudflare Workers 备选入口
├── wrangler.jsonc        # Cloudflare Workers 配置
├── docker-compose.yml
├── nginx.conf
└── README.md
```

修改源文件后，把最新文件同步到 `dist/` 再部署：

```bash
cp index.html styles.css main.js dist/
cp -r assets/* dist/assets/
```

## 本地预览与文案检查

站点没有包安装或编译步骤。使用 Node.js 和 Python 标准库检查，无需额外安装依赖：

```bash
node --test tests/*.test.mjs
py -3 -B tests/test_site_links.py
py -3 -B tools/check_site_links.py --root .
```

检查覆盖版本号与发布状态的缺席、简短说明、功能与安全边界、原有弹幕 / 快捷键 / 视频版本筛选、FAQ 展开与主题状态，以及源文件和 `dist/` 的一致性。包含故意破坏文案、链接、JSON-LD、FAQ 定位或存储的失败场景；凭据端点继续使用占位数据测试，不读取真实 Secret。

外链脚本默认离线验证 URL、官方 GitHub 下载路径、商店产品 ID、HTTPS、无凭据链接、文档路径、锚点、资源及 `index.html` / `dist/index.html` 字节一致性。确需联网检查时再运行：

```bash
py -3 -B tools/check_site_links.py --root . --live
```

`--live` 只使用无认证的 HTTP GET 检查链接可达性，不登录、不使用 API key。404 / 410 等明确坏链接使检查失败；403、429、服务端错误或超时记为 **未核实**，不算通过。商店及社区页面可能拦截自动请求，可用 `--strict-live` 让任何未核实项也导致非零退出。无论链接是否可达，脚本都不核对已安装版本、不证明商店已上架，也不证明 Cloudflare 已部署。

本地与部署文件的一致性、平衡标签、目录、兼容性卡片、首次使用步骤、资源与锚点继续检查。静态测试不能替代浏览器截图与交互验证。

Windows 本地预览（需要 Python）：

在此仓库根目录执行：

```powershell
py -m http.server 8080 --bind 127.0.0.1 --directory dist
```

浏览器打开 `http://127.0.0.1:8080/`，修改文件后刷新。部署前仍需查看桌面和窄屏排版，不能仅用内容检查代替视觉检查。

### 浏览器布局与交互验证

使用本机 Playwright 与 Chromium / Edge，可运行：


```bash
node tools/check_site_layout.mjs --playwright-module <Playwright入口路径> --browser-executable <浏览器路径>
```


脚本只启动独立无头浏览器与回环 HTTP 服务，不操作桌面、账号或媒体服务器。检查桌面 / 平板 / 手机宽度、主题保存、键盘焦点、FAQ 点击与深链接、关闭后重复打开、禁用脚本和减少动态效果；输出截图及报告到已忽略的 `.preview/`。若 Playwright 已可直接导入，或有自带浏览器，可省略对应参数。

### GitHub 仓库简介建议

> Momoka 官网：Windows 原生媒体库客户端的功能介绍、服务端兼容性与下载指引，支持 Cloudflare Pages / Workers 部署。

## 飞牛 Docker 部署

1. 在飞牛「文件管理」里新建目录，例如：

   ```text
   /vol1/1000/docker/momoka-site
   ```

2. 把 `dist/`、`docker-compose.yml`、`nginx.conf` 上传到这个目录。也可以把整个仓库目录传上去；Compose 只会把 `dist/` 挂载给容器。

   最终目录至少应是这样：

   ```text
   momoka-site/
   ├── dist/
   │   ├── index.html
   │   ├── styles.css
   │   ├── main.js
   │   └── assets/
   ├── docker-compose.yml
   └── nginx.conf
   ```

3. 打开飞牛「Docker → Compose → 新建项目」，工作目录选上面的 `momoka-site`，使用其中的 `docker-compose.yml` 部署。

   或者在 NAS 的 SSH 里执行：

   ```bash
   cd /vol1/1000/docker/momoka-site
   docker compose up -d
   ```

4. 浏览器访问：

   ```text
   http://飞牛IP:8080/
   ```

   容器内 Nginx 监听 80，飞牛宿主机映射到 8080；首次启动需要先拉取 `nginx:alpine`。

## 更新与排查

```bash
# 查看状态
docker compose ps

# 查看日志
docker logs --tail 50 momoka-site

# 修改 nginx.conf 后重启
docker compose restart momoka-site

# 检查本机是否能访问
curl -I http://127.0.0.1:8080/
```

- **页面 404**：确认挂载的是 `./dist`，且 `dist/index.html` 确实存在。
- **端口被占用**：改 `docker-compose.yml` 里 `"8080:80"` 左边的端口，例如 `"8090:80"`。
- **改了文件没生效**：HTML/CSS/JS 默认不缓存，直接强制刷新；图片缓存 7 天，可换文件名或清 Cloudflare 缓存。

## 用 443 访问（Lucky / Cloudflare 终止 TLS）

容器仍然只提供 HTTP，映射到宿主机 `8080`；443 交给 Lucky 或 Cloudflare Tunnel，不要改成 `443:80`。

### Lucky 监听 443

1. 在 Lucky「Web 服务」里新建规则：
   - 监听端口：`443`，开启 HTTPS
   - 域名：你的域名
   - 证书：用 Lucky 申请 Let's Encrypt，或上传 Cloudflare Origin Certificate
   - 后端地址：`http://127.0.0.1:8080`
     - Lucky 与容器在同一台飞牛：用 `127.0.0.1`
     - Lucky 在 Docker 里：用 `http://172.17.0.1:8080` 或宿主机局域网 IP
     - Lucky 在另一台设备：用 `http://飞牛IP:8080`
2. 路由器把公网 `443` 转发到 Lucky 的 `443`；80 可选，用于跳转到 HTTPS。**不要**把 `8080` 转发到公网。
3. Cloudflare DNS 指向你的公网 IP（橙云开启），SSL/TLS 模式选 **Full (strict)**；Lucky 上的证书必须有效。家宽动态 IP 记得配 DDNS。

### 使用 Cloudflare Tunnel

Tunnel 的 Public Hostname 服务地址填 `http://飞牛IP:8080`（或 Tunnel 所在环境能访问到的容器地址）。这样访问域名自然走 443，不需要开放任何入站端口。

### 常见错误

- `443:80` 只是把明文 HTTP 映射到 443，浏览器和 Cloudflare 都会报 TLS 错误，不要这样改。
- 容器和 Lucky 不能同时监听同一个 443；若 Lucky 已占用 443，保持容器在 8080 即可。
- 公开访问前建议加一层访问控制（Cloudflare Access、Lucky 基础认证等）。

- 不要把 Qoder 的 `*.qoder.zone` 预览地址直接 CNAME 到 Cloudflare：登录态、Cookie 和 Host 校验都会失效；要自定义域名就自行托管这份静态文件。

## 不用 Compose 的启动方式

```bash
docker run -d \
  --name momoka-site \
  -p 8080:80 \
  -v "$(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$(pwd)/dist:/usr/share/nginx/html:ro" \
  --restart unless-stopped \
  nginx:alpine
```

## 部署到 Cloudflare Pages（推荐）

这是纯静态站点，Pages 比 Worker 更直接，不需要写服务端代码，也不需要 NAS。

### 控制台拖拽上传

1. Cloudflare 控制台 → Workers & Pages → Create → Pages → Upload assets。
2. 项目名填 `momoka-site`；把 `dist/` 里的内容拖进去（不要上传整个仓库目录）。
3. 点击 Deploy，得到 `https://momoka-site.pages.dev`。
4. 进入项目 → Custom domains → Set up a custom domain，填你的域名。域名在同一个 Cloudflare 账号时，DNS 和证书会自动配置。

### 用 Wrangler 部署

```bash
cd Momoka-site
npx wrangler@latest login
npx wrangler@latest pages deploy dist --project-name momoka-site
```

- 更新站点：把源文件同步到 `dist/`，重新拖拽或重跑 `wrangler pages deploy`。
- Pages 的生产地址默认公开；需要私密访问时，在自定义域名前加 Cloudflare Access。
- 项目里的 `wrangler.jsonc` 和 `worker/` 是 Workers 方案备选，使用 Pages 时不需要。

## 备选：部署到 Cloudflare Workers（无需 NAS）

这是纯静态站点，Worker 只负责返回 `dist/` 里的文件。需要本机有 Node.js 和 Cloudflare 账号。

```bash
cd Momoka-site
npx wrangler@latest login
npx wrangler@latest deploy
```

- [wrangler.jsonc](wrangler.jsonc) 已把 `dist/` 声明为静态资源目录，入口是 `worker/index.js`。
- `login` 会打开浏览器授权；部署成功后终端会给出 `https://momoka-site.<你的子域>.workers.dev`。
- 绑定自定义域名：Cloudflare 控制台 → Workers & Pages → `momoka-site` → Settings → Domains & Routes → Add → Custom Domain。域名与 Worker 在同一个 Cloudflare 账号时，DNS 和证书会自动配置。
- 更新站点：同步源文件到 `dist/`，再执行一次 `npx wrangler@latest deploy`。
- 不想用命令行的话，也可以在 Cloudflare 用 Pages 直接上传 `dist/` 文件夹，效果相同。

## 弹幕凭据端点（`/api/danmaku/credential`）

站点同时带上了 Momoka 内置弹幕凭据的下发端点，两种部署方式都支持：

- **Workers**：`worker/index.js` 把 `GET /api/danmaku/credential` 交给 `worker/credential.js`，其余请求继续由 `ASSETS` 提供。
- **Pages**：`functions/api/danmaku/credential.js` 是 Pages Function，复用同一个 `worker/credential.js`。

它只下发 AES-GCM 加密的弹弹play 应用凭据，不代理搜索或弹幕请求。需要配置四个 Secret（不要写进仓库或 `dist/`）：

```bash
# Workers
npx wrangler@latest secret put DANDANPLAY_APP_ID --name mmoka-web-cloudflare
npx wrangler@latest secret put DANDANPLAY_APP_SECRET --name mmoka-web-cloudflare
npx wrangler@latest secret put DANDANPLAY_CREDENTIAL_KEY --name mmoka-web-cloudflare
npx wrangler@latest secret put DANDANPLAY_CREDENTIAL_KID --name mmoka-web-cloudflare

# Pages（如果项目是 Pages）
npx wrangler@latest pages secret put DANDANPLAY_APP_ID --project-name <项目名>
npx wrangler@latest pages secret put DANDANPLAY_APP_SECRET --project-name <项目名>
npx wrangler@latest pages secret put DANDANPLAY_CREDENTIAL_KEY --project-name <项目名>
npx wrangler@latest pages secret put DANDANPLAY_CREDENTIAL_KID --project-name <项目名>
```

- `DANDANPLAY_APP_ID`／`DANDANPLAY_APP_SECRET`：弹弹play 开发者中心的应用凭据。
- `DANDANPLAY_CREDENTIAL_KEY`：必须与客户端 `src/Momoka.Core/Danmaku/DandanPlayBuiltIn.cs` 里的 `Key` 完全相同（32 字节 base64）。
- `DANDANPLAY_CREDENTIAL_KID`：任意短标识，例如 `momoka-2026-10`。

部署后端点就是现有站点域名加 `/api/danmaku/credential`。验证：

```bash
node --test tests/danmaku-credential.test.mjs
curl https://<站点域名>/api/danmaku/credential
```

应返回 `{"v":1,"kid":"...","exp":...,"data":"..."}`；503 表示 Secret 没配齐，404 表示项目没有加载到 Worker/Function。端点公开且凭据随客户端分发，建议在 Cloudflare 给这个路径加频率限制（例如 60 次/分钟/IP）。

