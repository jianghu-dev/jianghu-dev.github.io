# 个人主页 · GitHub Pages

极简黑白 / 测绘仪表风的三栏个人站。零依赖：纯 HTML + CSS + JS，不需要构建、不需要 Node。改完推上去就是线上版本。

```
.
├── index.html          # 全部内容和文案都在这里
├── assets/
│   ├── style.css       # 样式，配色/字体/栏宽改 :root 变量
│   └── main.js         # 时钟、黑白切换、导航高亮
├── .nojekyll           # 让 GitHub 跳过 Jekyll 处理
└── README.md           # 本文件（不影响访问，可删）
```

**布局**：顶部标签导航 + 三栏。左栏个人信息与链接，中栏更新记录与作品，右栏档案读数与技能。窄屏自动折成两栏、再折成单栏。

---

## 0. 不懂代码就看这一节（浏览器里直接改，5 分钟）

不用装软件、不用敲命令。改完点一个按钮，1 分钟后线上就是新的。

### 第 1 步 · 打开要改的文件

浏览器地址栏输入：

```
https://github.com/aichicucumber-afk/aichicucumber-afk.github.io
```

页面中间有一个 **`index.html`**，点它。进去后是一堆文字和尖括号，别慌，那是它本来的样子。

### 第 2 步 · 进入编辑模式

点右上角的 **铅笔图标**（悬停显示 "Edit this file"）。页面变成可输入状态。

### 第 3 步 · 找「改这里」

按 `Command + F`（查找），输入：

```
✏️
```

全文一共 **16 处**，格式长这样：

```html
<!-- ✏️【改这里】名字、英文名、职位 -->
```

**注释是给你看的提示，不用改，也不用删。**

### 第 4 步 · 只改中文，不碰代码

规则只有一条：**尖括号 `< >` 里的英文和符号一个字都别动，只改夹在中间的汉字。**

```html
<p class="role">独立开发者 / 前端</p>
                  ↑ 只改这里
```

改错了不要紧，最后一步教你怎么退。

### 第 5 步 · 保存

1. 点右上角绿色按钮 **`Commit changes...`**
2. 弹窗里再点一次绿色 **`Commit changes`**

文件页面恢复原样 = 存好了。

### 第 6 步 · 看结果

等 1 分钟，打开 https://aichicucumber-afk.github.io/ ，按 `Command + Shift + R` 强制刷新。

### 改坏了怎么退回去

1. 回仓库首页，点上方的 **`History`**（带时钟图标那栏）
2. 找到改坏之前那条记录，点进去
3. 右上 **`...`** → **`View file`**，把内容复制出来贴回去

最省事：直接跟我说「页面改坏了」，我这边有完整版本记录，一句话恢复。

### 三个不要动的地方

| 看起来像这样 | 说明 |
|---|---|
| `<div class="panel">` | 尖括号里的英文，是结构，别碰 |
| `assets/style.css`、`assets/main.js` | 管排版和交互，不用打开 |
| `.nojekyll`、`.gitignore` | 系统文件，永远不要改 |

---

## 1. 内容地图（改哪儿对应页面哪块）

`index.html` 里从上到下就是这个顺序。开着页面和文件对照着看最快。

| 卡片 | 位置 | 改什么 |
|---|---|---|
| **PROFILE** 个人信息 | 左栏上 | 头像里的字母、姓名、英文名、职位、自我介绍、底部状态条文字 |
| **LINKS** 链接 | 左栏中 | 4 个按钮的 `href` 地址（GitHub / Email / 仓库 / 联系） |
| **TAGS** 标签 | 左栏中 | 关键词，删一个 `<span>` 就少一个 |
| **SITE** 本站 | 左栏下 | 版本号、上线日期、托管方式 |
| **NOTE** 引言 | 中栏上 | 一句话 + 日期 |
| **UPDATES** 更新记录 | 中栏 | 每条 = 日期 + 分类 + 标题；复制一行 `<li>` 加一条 |
| **GALLERY** 作品 | 中栏下 | 4 格：编号、名字、类型年份、链接 |
| **MANIFEST** 档案 | 右栏 | 坐标、方向、开始年份、状态 |
| **SKILLS** 能力 | 右栏 | 技能名、百分比；`--w:85%` 要和数字一致 |
| **NOW** 最近 | 右栏 | 待办清单；`class="done"` 表示已勾选 |
| **TOOLS** 常用 | 右栏 | 工具清单 |
| 页脚 | 底部 | 名字、邮箱 |

**卡片右上角的编号是自动生成的**（01、02、03…），加卡片、删卡片都不用手动改。

**加一张作品卡**：复制一整段 `<a class="shot …"> … </a>`，改里面的文字和 `data-idx`。
**删一张卡**：从 `<section class="panel">` 到对应的 `</section>` 整段删掉。

---

## 2. 本地预览

```bash
cd /Users/liuyunwen/WorkBuddy/2026-10-21-19-08-13
python3 -m http.server 8000
```

打开 <http://localhost:8000>。或者直接双击 `index.html`。

> 本机有代理会拦 localhost 的 8000/8765 端口（`curl` 返回 502）。遇到就打不开，直接用 `file://` 双击预览。

---

## 3. 已上线

| 项 | 值 |
|---|---|
| 站点 | https://aichicucumber-afk.github.io/ |
| 仓库 | https://github.com/aichicucumber-afk/aichicucumber-afk.github.io |
| 分支 / 目录 | `main` / 根目录，Pages 已自动启用 |
| 本机 Git 身份 | 江虎 · `aichicucumber-afk@users.noreply.github.com`（只配在本仓库） |

### 更新内容

```bash
cd /Users/liuyunwen/WorkBuddy/2026-10-21-19-08-13
git add -A && git commit -m "update content" && git push
```

推送后 30 秒到 1 分钟生效，强制刷新看结果。

### 认证说明

已用 GitHub CLI 完成浏览器授权，凭证存在系统钥匙串。`gh` 装在 `~/.local/bin/gh`，已在 PATH 里。失效时重新授权：

```bash
gh auth login --hostname github.com --git-protocol https --web
```

---

## 4. 改样式

全在 `assets/style.css` 顶部的 `:root` 里，改完刷新即可。

| 变量 | 作用 | 默认值 |
|---|---|---|
| `--bg` | 页面底色 | `#f8f9fa` |
| `--ink` | 主墨色（文字、实心块） | `#0a0a0a` |
| `--panel` | 卡片底色 | `rgba(255,255,255,.88)` |
| `--max` | 内容最大宽度 | `1240px` |
| `--gap` | 卡片间距 | `14px` |

**三栏宽度**在 `.layout` 的 `grid-template-columns: 300px minmax(0,1fr) 286px;` 里。
**深色模式**是同一组变量在 `:root[data-theme="dark"]` 下的覆盖值，要改深色单独改那一块。
**网格底纹**的密度在 `.bg-grid` 的 `background-size: 32px 32px`。

---

## 5. 绑定自己的域名（可选）

1. 域名商处加 CNAME 记录：`www` → `aichicucumber-afk.github.io`。
2. 本目录新建文件 `CNAME`，内容一行：`www.你的域名.com`（不带 https://）。
3. `git add CNAME && git commit -m "add domain" && git push`。
4. 仓库 Settings → Pages → Custom domain 填同域名，勾选 Enforce HTTPS（证书要等几分钟到几小时）。

---

## 6. 注意事项

- **国内访问**：`*.github.io` 在国内不稳定。访客主要在国内就绑自定义域名 + CDN。
- **公开性**：免费账号的 Pages 仓库必须 Public，内容全员可见。别放手机号、身份证、未脱敏数据。
- **没有后端**：纯静态。要留言板、访问统计得接第三方（Umami / Vercel Analytics）。
- **手机上改**：GitHub 网页在手机浏览器上也能编辑，只是文本框小，适合改一两个错字。
