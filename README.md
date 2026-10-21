# 个人主页 · GitHub Pages

零依赖静态站点：纯 HTML + CSS + JS，不需要构建、不需要 Node。改完推上去就是线上版本。

```
.
├── index.html          # 全部内容都在这里
├── assets/
│   ├── style.css       # 样式，配色改 :root 变量
│   └── main.js         # 主题切换 / 菜单 / 滚动动画
├── .nojekyll           # 让 GitHub 跳过 Jekyll 处理
└── README.md           # 本文件（不影响访问，可删）
```

---

## 1. 换成你自己的内容（约 15 分钟）

打开 `index.html`，按顺序替换。样板里的「陈亦然」是假人，全部要改。

| 位置 | 搜索关键词 | 改什么 |
|---|---|---|
| `<title>` / `meta` | `陈亦然`、`产品设计师` | 名字、职位、简介 |
| 首屏大标题 | `把复杂的流程` | 一句话定位，`<em>` 内的高亮色文字 |
| 首屏描述 | `六年 B 端设计经验` | 两行自我介绍 |
| 名片卡 | `CHEN YIRAN`、`杭州 · 中国` | 英文名、坐标、状态 |
| 关于 | `我在 2019 年` | 三段经历，可以只留两段 |
| 能力 | `<li>交互设计</li>` | 三组技能标签 |
| 作品 | `Arbor 设计系统` | 三张卡片：标题、一句成果、年份、链接 |
| 联系 | `hi@example.com` | 出现 3 次，全部替换 |
| 页脚 | `© 2026 陈亦然` | 名字 |
| `<link rel="icon">` | `陈` | 浏览器标签上的字 |

**换头像**：名片卡里有注释标好的位置，把 `<div class="avatar">陈</div>` 换成
`<img class="avatar" src="assets/avatar.jpg" alt="你的名字" />`，图片放进 `assets/`。

**换作品缩略图**：`<div class="thumb thumb-a"><span>Arbor</span></div>` 整段替换成
`<img class="thumb" src="assets/work-1.png" alt="项目名" />`（推荐 1600×1000）。

**改配色**：`assets/style.css` 顶部 `:root` 里的 `--accent` 改一个颜色就能换主题色；
深色模式在下面两个同名变量块里，一起改。

---

## 2. 本地预览

```bash
cd 本目录
python3 -m http.server 8000
```

打开 <http://localhost:8000>。直接双击 `index.html` 也能看，但用服务器更接近线上。

---

## 3. 发布到 GitHub Pages

### 方式 A：网页建仓库 + 命令行推送（推荐）

1. 在 GitHub 新建仓库，**仓库名必须叫 `<你的用户名>.github.io`**，例如用户名是 `liuyunwen` 就叫 `liuyunwen.github.io`。选 Public。
2. 在本目录执行（把 `USERNAME` 换成你的用户名）：

```bash
cd /Users/liuyunwen/WorkBuddy/2026-10-21-19-08-13
git init -b main
git add .
git commit -m "init: personal site"
git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
git push -u origin main
```

3. 等 1 分钟左右，访问 `https://USERNAME.github.io`。

> 首次 `push` 会要求认证。GitHub 已不接受密码，用 **Personal Access Token**（Settings → Developer settings → Personal access tokens → Fine-grained tokens，勾选该仓库的 Contents: Read and write）当密码填。或者先 `brew install gh && gh auth login`，之后 push 会走浏览器授权。

### 方式 B：纯网页

新建同名仓库 → 上传 `index.html` 和 `assets/` 文件夹 → Settings → Pages → Source 选 `main` 分支 `/ (root)` → Save。

### 更新内容

```bash
git add -A && git commit -m "update content" && git push
```

推送后 30 秒到 1 分钟生效，浏览器记得强刷（Cmd+Shift+R）。

---

## 4. 绑定自己的域名（可选）

1. 域名商处加一条 CNAME 记录：`www` → `USERNAME.github.io`。
2. 本目录新建文件 `CNAME`，内容一行：`www.你的域名.com`（不要带 https://）。
3. `git add CNAME && git commit -m "add domain" && git push`。
4. 仓库 Settings → Pages → Custom domain 填入同域名，勾选 Enforce HTTPS（证书签发要等几分钟到几小时）。

---

## 5. 注意事项

- **国内访问**：`*.github.io` 在国内不稳定。如果访客主要在国内，建议绑自定义域名（配合国内可用的 CDN），或改用其他托管。
- **公开性**：免费账号的 Pages 仓库必须 Public，页面内容全员可见。别放手机号、身份证、未脱敏的项目数据。
- **没有后端**：纯静态。要留言板、访问统计这类型功能，得接第三方（如 Umami / Vercel Analytics）。
- **404 页**：加一个 `404.html` 放在根目录，GitHub Pages 会自动用作自定义 404。
