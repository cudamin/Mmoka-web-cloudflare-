# Momoka 官网

Momoka 的官方介绍与下载指引站，仅介绍 Windows 桌面客户端，不提供网页播放、媒体内容或服务器账号。说明 WinUI 3、libmpv、字幕与版本筛选、多账号聚合、弹弹play 弹幕、播放快捷键、Emby 片头 / 片尾标记和可选 MoviePilot 集成，并分别标注 Emby、Jellyfin、飞牛影视与 Plex 的支持范围。

- 主项目：[cudamin/Momoka](https://github.com/cudamin/Momoka)
- 站点是纯静态 HTML/CSS/JavaScript，可以直接部署到 Cloudflare Pages，也可以放进任意 Nginx 容器。

## 0.1.8 候选版说明（正式发布暂缓）

0.1.8 尚未提交微软商店，线上仍为 0.1.7，候选版待完成验收。最终并发UI自动化验收出现尚未定位的原生崩溃，正式发布暂缓。安装器与 MSIX 仍只是候选产物；本轮不发布应用二进制、不提交微软商店、不替换桌面稳定版。网页下载入口指向已公开版本，不预填候选安装包：

- GitHub 发布页：[已公开版本](https://github.com/cudamin/Momoka/releases)，请留意各版本的预发布标记。辅助 [latest 跳转](https://github.com/cudamin/Momoka/releases/latest) 只用于打开 GitHub 所指向的页面，不据此判定正式版或稳定版。
- Microsoft Store：[产品 9NQJL7K0H8X0](https://apps.microsoft.com/detail/9NQJL7K0H8X0?hl=zh-CN&gl=CN)。0.1.8 尚未提交微软商店，线上仍为 0.1.7，候选版待完成验收。页面返回 200 不代表候选版已提交或可安装。

### 三项候选版新功能与限制

下述三项新功能属于 0.1.8 候选版说明，尚待完成验收，不把它们当作线上 0.1.7 的已交付能力。

- **MoviePilot 订阅**：电视剧支持按剧集组或季开启 / 关闭订阅，可选普通订阅、分集洗版、全集洗版；电影直接点击「订阅」，已订阅后再次点击即可取消。需要启用并连接自己的 MoviePilot，服务关闭或连接不可用时相关入口自动隐藏。搜索、主页订阅列表与手动整理继续保留。
- **实时文字字幕翻译**：可选 Google Cloud Translation v2、Microsoft Translator v3 或兼容 OpenAI API 的 AI 服务，保留原字幕。PGS / VOBSUB 无 OCR 时不适用，也不是语音识别或音频转写。翻译默认关闭，需自备 API key，第三方 API 可能收费；启用后字幕原文外发到所选翻译服务。密钥仅在本机用 Windows DPAPI 加密，不参与设置备份；本机加密不等于字幕原文不会离开设备。
- **可选补帧**：默认关闭，可选平滑插值与 CPU 运动补偿（minterpolate）。Motion 仅用于已识别的 8-bit SDR；HDR / 高位深跳过 Motion。不提供 SVP、RIFE 或 AI GPU 补帧。卡顿、运动伪影和额外延迟是可能的代价，性能不足时建议关闭。

保留弹弹play 弹幕、播放快捷键、Emby 片头 / 片尾标记、着色器、字幕与版本筛选、多账号聚合，以及按服务端能力和权限显示的管理入口。字幕默认仍优先简体中文，其次匹配其他中文字幕；服务端验证边界未因这次文案更新而扩大。使用客户端需要你自己的合法媒体来源和有权访问的账号。网页不承诺免账号或第三方服务免费，媒体服务器、MoviePilot 和翻译 API 的账号与费用需自行确认。

页面正文、FAQ、description、OpenGraph、Twitter 描述与 SoftwareApplication JSON-LD 使用相同的候选版未提交状态和功能边界。JSON-LD 的 `softwareVersion` 为线上版本 `0.1.7`，`releaseNotes` 说明候选版 `0.1.8` 的功能和暂缓原因，`downloadUrl` 指向 GitHub 发布页。结构化数据不添加价格、评分、已上架承诺或候选安装包地址。

### 本轮交付与后续发布

主窗口已验收上一轮网页 DOM 和三功能说明，本轮只更新准确的候选状态。用户已授权网页仓库更新，但当前仍只本地提交，**不 push、不部署**；先将本轮 diff / SHA 交给父窗口，等主窗口验收通过并明确给出绿色 `push main` 指令后，才在原树干净、`origin/main` 可安全快进时推送 `main`。不用图形公共提交表单，不合并其他未提交内容。网页获准推送也不等于应用二进制发布获准；应用发布和商店提交由主窗口负责。

Git 推送成功不等于 Cloudflare 已部署：之后需核对对应提交的真实 GitHub check / 服务部署状态与生产页面内容；没有生产服务证据时，只报告已推送，不宣称已上线。下方部署命令是维护说明，不是本轮已执行的操作。

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
node --test tests/site-copy.test.mjs tests/release-copy.test.mjs
py -3 -B tests/test_site_links.py
py -3 -B tools/check_site_links.py --root .
```

原有检查可单独运行：`node --test tests/site-copy.test.mjs`。新检查覆盖线上 0.1.7 / 候选 0.1.8 未提交状态在正文、FAQ、metadata、JSON-LD 和 README 中的一致性，三项功能的格式 / 隐私 / 费用 / 性能边界，以及原有弹幕、快捷键、标记和服务功能。两组检查均包含故意破坏文案、链接、JSON-LD 或 `dist/` 的失败场景。

外链脚本默认离线验证 URL、官方 GitHub 下载路径、商店产品 ID、HTTPS、无凭据链接、文档路径、锚点、资源及 `index.html` / `dist/index.html` 字节一致性。确需联网检查时再运行：

```bash
py -3 -B tools/check_site_links.py --root . --live
```

`--live` 只使用无认证的 HTTP GET 检查链接可达性，不登录、不使用 API key。404 / 410 等明确坏链接使检查失败；403、429、服务端错误或超时记为 **未核实**，不算通过。商店及社区页面可能拦截自动请求，可用 `--strict-live` 让任何未核实项也导致非零退出。无论链接是否可达，脚本都不核对已安装版本、不证明商店已上架，也不证明 Cloudflare 已部署。

本地与部署文件的一致性、平衡标签、可点击目录、兼容性卡片、首次使用步骤、资源和锚点的检查继续保留。页面排版仍由主窗口验收，不以静态检查替代视觉验收。

Windows 本地预览（需要 Python）：

在此仓库根目录执行：

```powershell
py -m http.server 8080 --bind 127.0.0.1 --directory dist
```

本轮独立目录也可用绝对路径预览：

```powershell
py -3 -m http.server 8080 --bind 127.0.0.1 --directory 'C:\Users\89400\.codex\worktrees\momoka-website-release-20261025\dist'
```

浏览器打开 `http://127.0.0.1:8080/`，修改文件后刷新。部署前仍需查看桌面和窄屏排版，不能仅用内容检查代替视觉检查。

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

