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

## 0. 不懂代码就看这一节（浏览器里直接改，5 分钟）

不用装软件、不用敲命令。改完点一个按钮，1 分钟后线上就是新的。

### 第 1 步 · 打开要改的文件

在浏览器地址栏输入：

```
https://github.com/aichicucumber-afk/aichicucumber-afk.github.io
```

页面中间有一个 **`index.html`**，点它。进去后你会看到一堆文字和尖括号，别慌，那只是它本来的样子。

### 第 2 步 · 进入编辑模式

点右上角那个 **铅笔图标**（鼠标悬停会显示 “Edit this file”）。

这时整个页面变成可以打字的状态。

### 第 3 步 · 找「改这里」

按 `Command + F`（查找），输入：

```
✏️
```

页面会跳到第一个标记。全文一共 8 个，格式长这样：

```html
<!-- ✏️【第一块：首屏】改下面 4 处：... -->
```

**注释只是给你看的提示，不用改它，也不用删它。**

### 第 4 步 · 只改中文，不碰代码

规则只有一条：**尖括号 `< >` 里的英文和符号一个字都别动，只改夹在中间的汉字。**

```html
<h1>把复杂的流程<br /><em>拆成能用的界面</em>。</h1>
      ↑ 只改这些汉字，<h1> <br /> <em> </em> 都不能碰
```

改错了不要紧，最后一步会教你退回。

### 第 5 步 · 保存

1. 点页面右上角绿色按钮 **`Commit changes...`**
2. 弹出的窗口里再点一次绿色 **`Commit changes`**

看到文件页面恢复原样，就说明存好了。

### 第 6 步 · 看结果

等 1 分钟，打开：

```
https://aichicucumber-afk.github.io/
```

如果看起来没变，按 `Command + Shift + R` 强制刷新。

### 改坏了怎么退回去

1. 回到仓库首页，点上方的 **`History`**（带时钟图标的那一栏）
2. 看到一串历史记录，每条右边有修改时间
3. 找到改坏之前那条，点进去
4. 点右上 **`...`** → **`View file`**，把里面的内容复制出来，替换回去

最省事的办法：直接跟我说「页面改坏了」，我这边有完整的版本记录，一句话就能恢复。

### 三个不要动的地方

| 看起来像这样 | 说明 |
|---|---|
| `<div class="wrap">` | 尖括号里的英文，是结构，别碰 |
| `assets/style.css` / `assets/main.js` | 这两个文件管排版和动画，不用打开 |
| `.nojekyll`、`.gitignore` | 系统文件，永远不要改 |

---

## 1. 换成你自己的内容（有代码基础时看）

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

## 3. 已上线

| 项 | 值 |
|---|---|
| 站点 | https://aichicucumber-afk.github.io/ |
| 仓库 | https://github.com/aichicucumber-afk/aichicucumber-afk.github.io |
| 分支 / 目录 | `main` / 根目录，Pages 已自动启用 |
| 本机 Git 身份 | 江虎 · `aichicucumber-afk@users.noreply.github.com`（只配在本仓库，未动全局） |

### 更新内容

改完 `index.html` 直接推：

```bash
cd /Users/liuyunwen/WorkBuddy/2026-10-21-19-08-13
git add -A && git commit -m "update content" && git push
```

推送后 30 秒到 1 分钟生效，强制刷新（Cmd+Shift+R）看结果。

### 认证说明

已用 GitHub CLI 完成浏览器授权，凭证存在系统钥匙串（keyring）。`gh` 装在 `~/.local/bin/gh`，已在 PATH 里。

凭证失效时重新授权：

```bash
gh auth login --hostname github.com --git-protocol https --web
```

---

## 4. 绑定自己的域名（可选）

1. 域名商处加一条 CNAME 记录：`www` → `aichicucumber-afk.github.io`。
2. 本目录新建文件 `CNAME`，内容一行：`www.你的域名.com`（不要带 https://）。
3. `git add CNAME && git commit -m "add domain" && git push`。
4. 仓库 Settings → Pages → Custom domain 填入同域名，勾选 Enforce HTTPS（证书签发要等几分钟到几小时）。

---

## 5. 注意事项

- **国内访问**：`*.github.io` 在国内不稳定。如果访客主要在国内，建议绑自定义域名（配合国内可用的 CDN），或改用其他托管。
- **公开性**：免费账号的 Pages 仓库必须 Public，页面内容全员可见。别放手机号、身份证、未脱敏的项目数据。
- **没有后端**：纯静态。要留言板、访问统计这类型功能，得接第三方（如 Umami / Vercel Analytics）。
- **404 页**：加一个 `404.html` 放在根目录，GitHub Pages 会自动用作自定义 404。
