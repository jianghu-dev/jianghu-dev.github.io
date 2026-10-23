# 个人主页 · GitHub Pages

五个独立页面的个人站：**主页 / 关于 / 作品 / 动态 / 联系**。极简黑白 + 测绘仪表风。  
零依赖：纯 HTML + CSS + JS，不需要构建、不需要 Node。改完推上去就是线上版本。

```
.
├── index.html          主页（三栏总览，带启动动画）
├── about.html          关于（个人信息 + 经历时间线 + 技能）
├── work.html           作品（6 张大卡片）
├── updates.html        动态（按年份分组的更新记录）
├── contact.html        联系（大邮箱 + 四个入口）
├── assets/
│   ├── style.css       五个页面共用一套样式
│   ├── main.js         五个页面共用一套交互
│   ├── avatar.jpg      头像（默认灰度，悬停显色）
│   └── banner.webp     顶部氛围图
├── .nojekyll           让 GitHub 跳过 Jekyll 处理
└── README.md           本文件（不影响访问，可删）
```

页头页脚在五个文件里各写了一份，所以改导航文字要五个文件一起改。除此之外内容互不影响。

---

## 0. 不懂代码就看这一节

不用装软件、不用敲命令。改完点一个按钮，1 分钟后线上就是新的。

### 第 1 步 · 打开仓库

```
https://github.com/jianghu-dev/jianghu-dev.github.io
```

### 第 2 步 · 点开你要改的那个页面

| 想改什么             | 打开哪个文件         |
| ---------------- | -------------- |
| 主页的自我介绍、链接、最近的动态 | `index.html`   |
| 关于页的经历、时间线、技能    | `about.html`   |
| 作品列表             | `work.html`    |
| 更新记录             | `updates.html` |
| 联系方式、邮箱          | `contact.html` |

### 第 3 步 · 点右上角的铅笔图标

悬停显示 "Edit this file"，页面变成可输入状态。

### 第 4 步 · 按 `Command + F`，输入 `✏️`

全文一共 **37 处**标记，页面里有多少就是多少。格式长这样：

```html
```

**注释是给你看的提示，不用改，也不用删。**

### 第 5 步 · 只改中文，不碰代码

规则只有一条：**尖括号 `< >` 里的英文和符号一个字都别动，只改夹在中间的汉字。**

```html
<p class="role">独立开发者 / 前端</p>
                  ↑ 只改这里
```

### 第 6 步 · 保存

1. 点右上角绿色 **`Commit changes...`**
2. 弹窗里再点一次绿色 **`Commit changes`**

### 第 7 步 · 看结果

等 1 分钟，打开 <https://jianghu-dev.github.io/> ，按 `Command + Shift + R` 强制刷新。

### 改坏了怎么退回去

1. 回仓库首页，点上方的 **`History`**
2. 找到改坏之前那条，点进去
3. 右上 **`...`** → **`View file`**，复制内容贴回去

最省事：直接跟我说「页面改坏了」，我这边有完整版本记录，一句话恢复。

---

## 1. 每页有什么

**index.html 主页** — 三栏总览

| 卡片       | 内容                        |
| -------- | ------------------------- |
| PROFILE  | 头像字母、姓名、英文名、职位、自我介绍、底部跑马灯 |
| LINKS    | 4 个链接按钮                   |
| TAGS     | 关键词标签                     |
| SITE     | 版本、上线日期、托管方式              |
| NOTE     | 一句话引言（逐字浮现）               |
| UPDATES  | 最近 4 条动态 + 「查看全部」         |
| GALLERY  | 4 格精选作品 + 「查看全部」          |
| MANIFEST | 坐标、方向、开始年份、状态             |
| SKILLS   | 技能条                       |
| NOW      | 待办清单                      |
| TOOLS    | 常用工具                      |

**about.html 关于** — 左栏 PROFILE / TAGS / TOOLS，右栏 NOTE / TIMELINE / SKILLS

**work.html 作品** — 6 张卡片，每张：编号 + 分类标签 + 标题 + 年份 + 一句描述 + 技术标签

**updates.html 动态** — 按年份分组的列表，每条：日期（YYMMDD）+ 分类 + 标题 + 一行摘要

**contact.html 联系** — 大标题 + 大邮箱 + 4 个入口卡片 + 接活说明

**卡片右上角的编号是自动生成的**，加卡片、删卡片都不用手动改。

---

## 2. 加一个新页面（进阶）

1. 复制任意一个 html，改文件名（比如 `notes.html`）
2. 改 `<title>` 和页面里的 `<h1>`
3. 在**五个现有文件**的 `<nav class="tabs">` 里各加一行 `<a href="notes.html">笔记</a>`
4. 在新文件里把 `notes.html` 那个链接加上 `class="active"`
5. 顶部 `PAGE 0x/05` 的编号按需要调整

不加也行，用不上就别加。

---

## 3. 本地预览

```bash
cd /Users/liuyunwen/WorkBuddy/2026-10-21-19-08-13
python3 -m http.server 8000
```

打开 <http://localhost:8000>。或者直接双击 `index.html`（页面间跳转也正常）。

> 本机有代理会拦 localhost 的 8000/8765 端口（`curl` 返回 502），打不开就直接双击文件预览。

---

## 4. 已上线

| 项         | 值                                                             |
| --------- | ------------------------------------------------------------- |
| 站点        | <https://jianghu-dev.github.io/>                              |
| 仓库        | <https://github.com/jianghu-dev/jianghu-dev.github.io>        |
| 分支 / 目录   | `main` / 根目录，Pages 已自动启用                                      |
| 本机 Git 身份 | 江虎 · `345785505+jianghu-dev@users.noreply.github.com`（只配在本仓库） |

### 更新内容

```bash
cd /Users/liuyunwen/WorkBuddy/2026-10-21-19-08-13
git add -A && git commit -m "update content" && git push
```

### 认证说明

已用 GitHub CLI 完成浏览器授权，凭证存在系统钥匙串。`gh` 装在 `~/.local/bin/gh`。失效时：

```bash
gh auth login --hostname github.com --git-protocol https --web
```

---

## 5. 改样式

全在 `assets/style.css` 顶部的 `:root` 里，五个页面同时生效。**整站固定深色，没有浅色模式。**

| 变量        | 作用     | 默认值                     |
| --------- | ------ | ----------------------- |
| `--bg`    | 页面底色   | `#08090a`               |
| `--ink`   | 主墨色（文字、实心块） | `#f7f7f8`               |
| `--panel` | 卡片底色   | `rgba(15,16,19,.93)`    |
| `--max`   | 内容最大宽度 | `1280px`                |
| `--gap`   | 卡片间距   | `16px`                  |
| `--red`   | 唯一强调色（标签、锁定） | `#ff5a4f`             |

UI 参照 Vercel 开源的 Geist 设计系统：发丝线 + 阴影当边框、负字距、圆角 6/8/12。  
换强调色只改 `--red` / `--red-soft` / `--red-line` 三个值。

**三栏宽度**在 `.layout` 的 `grid-template-columns`；**作品网格**在 `.work-grid`。  
**网格底纹**密度在 `.bg-grid` 的 `background-size`。  
**顶部氛围图**在 `.banner`：换图就把 `assets/banner.webp` 替换掉，高度改 `height`，压暗程度改 `.banner img` 的 `brightness()`。  
**头像**在 `.avatar` / `img.avatar`，默认灰度，鼠标悬停恢复彩色。

---

## 6. 动画说明

| 位置   | 效果                                                       |
| ---- | -------------------------------------------------------- |
| 第一次打开主页 | 终端日志逐行打印，显示 `[ENTER] 按回车进入站点`，**按回车（或点一下）才进入**。本次会话内再回主页不再播放；其他页面没有这一步 |
| 鼠标   | 四角准星跟随，移到链接/按钮上会吸附并框住                                    |
| 卡片   | 滚动到视口时依次淡入                                               |
| 引言   | 逐字浮现，每字 0.045 秒                                          |
| 卡片   | 悬停时一条细线从上扫到下                                             |
| 页面顶部 | 2px 进度条                                                  |

**改启动日志**：`assets/main.js` 里的 `BOOT_LINES`，一行一个 `['标签', '内容']`。  
**关掉全部动画**：系统设置 → 辅助功能 → 显示 → 打开「减弱动态效果」。

**三道保护**：`main.js` 没跑起来时 3 秒后自动显示内容；浏览器禁 JS 时遮罩不出现；已进过站就直接跳过遮罩和入场动画。

---

## 7. 绑定自己的域名（可选）

1. 域名商处加 CNAME 记录：`www` → `jianghu-dev.github.io`。
2. 本目录新建文件 `CNAME`，内容一行：`www.你的域名.com`（不带 https://）。
3. `git add CNAME && git commit -m "add domain" && git push`。
4. 仓库 Settings → Pages → Custom domain 填同域名，勾选 Enforce HTTPS。

---

## 8. 注意事项

- **国内访问**：`*.github.io` 在国内不稳定。访客主要在国内就绑自定义域名 + CDN。
- **公开性**：免费账号的 Pages 仓库必须 Public，内容全员可见。
- **没有后端**：纯静态。留言板、访客统计要接第三方。
- **导航改动**：页头在五个 html 里各有一份，改文字记得五个文件都改。
