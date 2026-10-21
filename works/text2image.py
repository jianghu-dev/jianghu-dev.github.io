import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageDraw, ImageFont, ImageTk, ImageFilter, ImageChops
import os
import platform
import glob
import re
import time
import random
import subprocess
import tempfile
import zlib

# ================== 核心排版引擎 ==================
def find_font_files(base_dirs, name_patterns, extensions=('.ttf', '.ttc', '.otf')):
    found = []
    for base in base_dirs:
        if not os.path.exists(base): 
            continue
        for pattern in name_patterns:
            for ext in extensions:
                found.extend(glob.glob(os.path.join(base, pattern + ext)))
            if not any(pattern.lower() in os.path.basename(f).lower() for f in found):
                for ext in extensions:
                    for f in glob.glob(os.path.join(base, '*' + ext)):
                        if pattern.lower() in os.path.basename(f).lower():
                            found.append(f)
    return list(set(found))

system = platform.system()
if system == "Darwin":
    CN_FONT_CANDIDATES = find_font_files(
        ['/System/Library/Fonts/', '/System/Library/Fonts/Supplemental/', '/Library/Fonts/', os.path.expanduser('~/Library/Fonts/')],
        ['PingFang', 'Songti', 'STHeiti', 'Hiragino Sans GB']
    )
    EN_FONT_CANDIDATES = ["/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Arial.ttf"]
elif system == "Windows":
    CN_FONT_CANDIDATES = ["C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/simsun.ttc", "C:/Windows/Fonts/simkai.ttf"]
    EN_FONT_CANDIDATES = ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/consola.ttf"]
else:
    CN_FONT_CANDIDATES = ["/usr/share/fonts/truetype/arphic/uming.ttc"]
    EN_FONT_CANDIDATES = ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]

def load_first_font(candidates, size, user_path=None):
    if user_path and os.path.exists(user_path):
        try: return ImageFont.truetype(user_path, size)
        except: pass
    for path in candidates:
        if os.path.exists(path):
            try: return ImageFont.truetype(path, size)
            except: continue
    return ImageFont.load_default()

def render_text_lines(text, cn_font, en_font, max_width, margin=70, line_spacing=1.35):
    temp_img = Image.new("RGB", (1, 1), "white")
    temp_draw = ImageDraw.Draw(temp_img)
    lines = text.split('\n')
    rendered = []
    
    bbox = cn_font.getbbox("Agy中")
    raw_h = (bbox[3] - bbox[1]) if bbox else 50
    line_h = int(raw_h * line_spacing)

    for line in lines:
        if not line.strip():
            rendered.append(([], []))
            continue
        
        tokens = re.findall(r'[A-Za-z0-9]+|.', line)
        chars, fonts, w = [], [], 0
        for token in tokens:
            f = en_font if re.match(r'^[A-Za-z]+$', token) else cn_font
            bb = temp_draw.textbbox((0, 0), token, font=f)
            tw = (bb[2] - bb[0]) + 2
            
            if w + tw > max_width - 2 * margin:
                if chars:
                    rendered.append((chars, fonts))
                    chars, fonts, w = [token], [f], tw
                else:
                    chars.append(token)
                    fonts.append(f)
                    w += tw
            else:
                chars.append(token)
                fonts.append(f)
                w += tw
                
        if chars:
            rendered.append((chars, fonts))
            
    total_h = max(len(rendered) * line_h + 2 * margin, 260)
    return rendered, total_h, line_h

def generate_blueprint_image(text, cn_size=55, en_size=50, max_width=1240, 
                             cn_path=None, en_path=None, theme_cfg=None,
                             add_watermark=True, line_spacing=1.35):
    cn_font = load_first_font(CN_FONT_CANDIDATES, cn_size, user_path=cn_path)
    en_font = load_first_font(EN_FONT_CANDIDATES, en_size, user_path=en_path)
    margin = max(60, int(max_width * 0.06))
    
    lines, total_h, line_h = render_text_lines(text, cn_font, en_font, max_width, margin, line_spacing)
    
    bg_color = theme_cfg["img_bg"]
    fg_color = theme_cfg["img_fg"]
    sub_color = theme_cfg["img_sub"]
    line_color = theme_cfg["img_line"]
    is_blood = theme_cfg.get("fx") == "blood"
    seed = zlib.crc32(text.encode("utf-8")) & 0xFFFFFFFF if is_blood else 0

    img = Image.new("RGB", (max_width, total_h), bg_color)
    if is_blood:
        img = blood_underlayer(img, seed)   # 血色底纹: 斑驳 + 顶部滴血 + 中心血光
    draw = ImageDraw.Draw(img)

    pad = 22
    draw.rectangle([pad, pad, max_width - pad, total_h - pad], outline=line_color, width=1)
    
    cs = 16
    draw.line([(pad, pad + cs), (pad, pad), (pad + cs, pad)], fill=fg_color, width=2)
    draw.line([(max_width - pad - cs, pad), (max_width - pad, pad), (max_width - pad, pad + cs)], fill=fg_color, width=2)
    draw.line([(pad, total_h - pad - cs), (pad, total_h - pad), (pad + cs, total_h - pad)], fill=fg_color, width=2)
    draw.line([(max_width - pad - cs, total_h - pad), (max_width - pad, total_h - pad), (max_width - pad, total_h - pad - cs)], fill=fg_color, width=2)

    # 血色画风: 字口加一圈暗红渗墨晕边, 模拟湿墨/血渍吃进纸面
    bleed = {"stroke_width": 2, "stroke_fill": (74, 5, 7)} if is_blood else {}

    y = margin
    for chars, fonts in lines:
        if not chars:
            y += line_h
            continue
        tw = sum(draw.textbbox((0,0), c, font=f)[2] - draw.textbbox((0,0), c, font=f)[0] + 2 
                 for c, f in zip(chars, fonts))
        x = (max_width - tw) // 2
        for c, f in zip(chars, fonts):
            draw.text((x, y), c, font=f, fill=fg_color, **bleed)
            x += draw.textbbox((0,0), c, font=f)[2] - draw.textbbox((0,0), c, font=f)[0] + 2
        y += line_h

    if add_watermark:
        meta_font = load_first_font(EN_FONT_CANDIDATES, 16)
        stamp = f"TALOS AIC PROTOCOL // ARCHITECTURE 300-DPI // SPEC #{random.randint(1000, 9999)}"
        draw.text((pad + 18, total_h - pad - 26), stamp, font=meta_font, fill=sub_color)
        draw.text((max_width - pad - 200, total_h - pad - 26), time.strftime("%Y-%m-%d SOL"), font=meta_font, fill=sub_color)

    if is_blood:
        img = blood_finish(img, seed)       # 表层飞溅 + 暗角 + 颗粒

    return img


# ================== 恐怖画风: 血污特效引擎 (无鬼怪, 纯血迹/污渍质感) ==================
def blood_underlayer(img, seed):
    """底层: 暗墙斑驳 + 顶部滴血 + 中心血光"""
    W, H = img.size
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    for _ in range(max(8, W * H // 140000)):                       # 斑驳污渍
        cx, cy = rnd.randint(-60, W + 60), rnd.randint(-40, H + 40)
        r = rnd.randint(50, 170)
        col = (rnd.randint(46, 96), rnd.randint(3, 12), rnd.randint(4, 14), rnd.randint(28, 78))
        for _ in range(rnd.randint(4, 9)):
            rr = int(r * rnd.uniform(0.4, 1.3))
            ox, oy = rnd.randint(-r, r), rnd.randint(-int(r * 0.6), int(r * 0.6))
            d.ellipse([cx + ox - rr, cy + oy - rr, cx + ox + rr, cy + oy + rr], fill=col)

    for _ in range(rnd.randint(2, 4)):                             # 拖擦状血污
        cx, cy = rnd.randint(0, W), rnd.randint(0, H)
        sw, sh = rnd.randint(90, 260), rnd.randint(8, 26)
        d.ellipse([cx - sw, cy - sh, cx + sw, cy + sh],
                  fill=(rnd.randint(58, 108), rnd.randint(3, 10), rnd.randint(4, 12), rnd.randint(40, 92)))

    for _ in range(rnd.randint(4, 8)):                             # 顶边向下流淌的血痕
        x = rnd.randint(0, W)
        w = rnd.randint(6, 26)
        length = max(70, rnd.randint(60, int(H * 0.85)))
        base = (rnd.randint(86, 158), rnd.randint(3, 10), rnd.randint(4, 12))
        for t in range(0, length, 3):
            k = t / length
            ww = max(2, int(w * (1 - k) ** 0.6))
            d.ellipse([x - ww, t - ww, x + ww, t + ww],
                      fill=(base[0], base[1], base[2], max(18, int(180 * (1 - k)))))

    layer = layer.filter(ImageFilter.GaussianBlur(1.6))
    base = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

    # 中心血光
    glow = Image.new("L", (64, 64))
    glow.putdata([max(0, int((1 - min(1.0, (((x - 31.5) / 31.5) ** 2 + ((y - 31.5) / 31.5) ** 2) ** 0.5)) ** 2 * 150))
                  for y in range(64) for x in range(64)])
    glow = glow.resize((W, H), Image.BICUBIC)
    return ImageChops.add(base, Image.composite(Image.new("RGB", (W, H), (128, 12, 14)),
                                                Image.new("RGB", (W, H), (0, 0, 0)), glow))


def blood_finish(img, seed):
    """表层: 飞溅血点 + 暗角 + 胶片颗粒"""
    W, H = img.size
    rnd = random.Random(seed ^ 0x9E3779B9)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)

    for _ in range(max(10, W * H // 110000)):                      # 覆盖在字面上的飞溅
        cx, cy = rnd.randint(0, W), rnd.randint(0, H)
        r = rnd.randint(3, 26)
        col = (rnd.randint(120, 196), rnd.randint(6, 24), rnd.randint(5, 18))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(col[0], col[1], col[2], rnd.randint(28, 82)))
        for _ in range(rnd.randint(4, 14)):
            s = rnd.randint(1, 4)
            sx, sy = cx + rnd.randint(-r * 4, r * 4), cy + rnd.randint(-r * 4, r * 4)
            d.ellipse([sx - s, sy - s, sx + s, sy + s], fill=(col[0], col[1], col[2], rnd.randint(50, 165)))
        if rnd.random() < 0.3:                                     # 血点下淌
            dy = rnd.randint(20, 120)
            dx = rnd.randint(-3, 3)
            for t in range(0, dy, 3):
                ww = max(1, int(r * (1 - t / dy) * 0.32))
                d.ellipse([cx + dx - ww, cy + t - ww, cx + dx + ww, cy + t + ww],
                          fill=(col[0], col[1], col[2], max(25, int(120 * (1 - t / dy)))))

    img = Image.alpha_composite(img.convert("RGBA"), layer.filter(ImageFilter.GaussianBlur(0.6))).convert("RGB")

    vig = Image.new("L", (64, 64))                                 # 暗角
    vig.putdata([max(0, int(255 - 130 * min(1.0, (((x - 31.5) / 31.5) ** 2 + ((y - 31.5) / 31.5) ** 2) ** 0.5)))
                 for y in range(64) for x in range(64)])
    vig = vig.resize((W, H), Image.BICUBIC)
    img = ImageChops.multiply(img, Image.merge("RGB", (vig, vig, vig)))

    return Image.blend(img, Image.effect_noise((W, H), 14).convert("RGB"), 0.055)   # 胶片颗粒


# ================== 图片渲染专用的 6 套色调方案 ==================
IMAGE_THEMES = {
    "工业极简白 (Paper White)": {
        "img_bg": (248, 249, 250),
        "img_fg": (17, 24, 39),
        "img_sub": (156, 163, 175),
        "img_line": (226, 232, 240)
    },
    "极夜战术黑 (Midnight Dark)": {
        "img_bg": (15, 18, 24),
        "img_fg": (240, 246, 252),
        "img_sub": (139, 148, 158),
        "img_line": (48, 54, 61)
    },
    "终端琥珀金 (Amber CRT)": {
        "img_bg": (18, 14, 4),
        "img_fg": (251, 191, 36),
        "img_sub": (217, 119, 6),
        "img_line": (110, 80, 10)
    },
    "冷灰钛合金 (Cool Titanium)": {
        "img_bg": (28, 30, 36),
        "img_fg": (226, 232, 240),
        "img_sub": (148, 163, 184),
        "img_line": (67, 71, 82)
    },
    "战地橄榄绿 (Olive Drab)": {
        "img_bg": (22, 26, 22),
        "img_fg": (227, 232, 227),
        "img_sub": (143, 157, 143),
        "img_line": (69, 78, 69)
    },
    "血祭污痕 (Blood Ritual)": {
        "img_bg": (10, 7, 8),
        "img_fg": (178, 22, 26),
        "img_sub": (112, 26, 28),
        "img_line": (58, 12, 14),
        "fx": "blood"
    }
}

# ================== 界面固定配色 (纯净建筑白与高对比黑字) ==================
UI_COLORS = {
    "app_bg": "#F4F5F7",
    "panel_bg": "#FFFFFF",
    "border": "#D1D5DB",
    "text_main": "#111827",
    "text_sub": "#4B5563",
    "input_bg": "#FFFFFF",
    "btn_primary_bg": "#111827",
    "btn_primary_fg": "#FFFFFF",
    "btn_sec_bg": "#F3F4F6",
    "btn_sec_fg": "#111827",
    "hairline": "#E5E7EB"
}

# 细边样式: 设置弹窗的分组框/输入框统一走 1px 发丝线, 不再用粗实线框
SLIM_BOX = dict(bd=0, relief="flat", highlightthickness=1,
                highlightbackground=UI_COLORS["hairline"], highlightcolor=UI_COLORS["hairline"])


# ================== 快捷键解析 (序列键 "=L" / 组合键 "Cmd+S") ==================
KEYSYM_ALIASES = {
    "equal": "=", "minus": "-", "plus": "+", "slash": "/", "backslash": "\\",
    "semicolon": ";", "comma": ",", "period": ".", "apostrophe": "'",
    "quoteleft": "`", "bracketleft": "[", "bracketright": "]", "space": " ",
    "periodcentered": "·", "middot": "·",
}
CHAR_TO_TKSYM = {
    "=": "equal", "-": "minus", "+": "plus", "/": "slash", "\\": "backslash",
    ";": "semicolon", ",": "comma", ".": "period", "'": "apostrophe",
    "`": "quoteleft", "[": "bracketleft", "]": "bracketright", " ": "space",
    "enter": "Return", "tab": "Tab", "esc": "Escape",
}
MOD_MAP = {
    "cmd": "Command", "command": "Command", "⌘": "Command", "meta": "Command",
    "ctrl": "Control", "control": "Control", "ctl": "Control",
    "alt": "Option", "opt": "Option", "option": "Option", "shift": "Shift",
}

def normalize_keysym(event):
    ks = event.keysym
    if ks in KEYSYM_ALIASES:
        return KEYSYM_ALIASES[ks]
    if len(ks) == 1:
        return ks.lower()
    # 兼容 Option 组合键产生的符号 (如 · 由 Option+Shift+9 打出)
    ch = getattr(event, "char", "") or ""
    return ch.lower() if len(ch) == 1 else ks.lower()

def parse_hotkey(spec):
    """=L -> 序列键 (先按 = 再按 L); Cmd+Shift+S -> 组合键"""
    spec = (spec or "").strip()
    if not spec:
        return None
    if "+" in spec:
        parts = [p.strip() for p in spec.split("+") if p.strip()]
        if len(parts) > 1:
            return {"type": "combo", "mods": parts[:-1], "key": parts[-1]}
    return {"type": "seq", "keys": [ch.lower() for ch in spec]}

def combo_to_tk(spec):
    parts = [p.strip() for p in spec.split("+") if p.strip()]
    mods = [MOD_MAP.get(p.lower(), p) for p in parts[:-1]]
    key = CHAR_TO_TKSYM.get(parts[-1].lower(), parts[-1].lower())
    return "<" + "-".join(mods + [key]) + ">"

def copy_image_to_clipboard(img, tmp_path=None):
    """写入系统粘贴板: macOS osascript / Windows PowerShell / Linux xclip"""
    try:
        tmp = tmp_path or os.path.join(tempfile.gettempdir(), "talos_clipboard_tmp.png")
        img.convert("RGB").save(tmp, "PNG")
        if platform.system() == "Darwin":
            r = subprocess.run(["osascript", "-e",
                                'set the clipboard to (read (POSIX file "%s") as «class PNGf»)' % tmp],
                               capture_output=True, text=True)
        elif platform.system() == "Windows":
            ps = ("Add-Type -AssemblyName System.Windows.Forms;Add-Type -AssemblyName System.Drawing;"
                  "$i=[System.Drawing.Image]::FromFile('%s');"
                  "[System.Windows.Forms.Clipboard]::SetImage($i);$i.Dispose()" % tmp)
            r = subprocess.run(["powershell", "-sta", "-NoProfile", "-Command", ps],
                               capture_output=True, text=True)
        else:
            r = subprocess.run(["xclip", "-selection", "clipboard", "-t", "image/png", "-i", tmp],
                               capture_output=True, text=True)
        return r.returncode == 0
    except Exception:
        return False


# ================== 防白屏高对比度大按钮 ==================
class TacticalButton(tk.Frame):
    def __init__(self, parent, text, command, primary=False, width=None, font_size=13, **kwargs):
        super().__init__(parent, bd=1, relief="solid", cursor="hand2", **kwargs)
        self.command = command
        self.primary = primary
        
        bg = UI_COLORS["btn_primary_bg"] if primary else UI_COLORS["btn_sec_bg"]
        fg = UI_COLORS["btn_primary_fg"] if primary else UI_COLORS["btn_sec_fg"]
        bd = UI_COLORS["text_main"] if primary else UI_COLORS["border"]

        self.config(bg=bg, highlightbackground=bd)
        self.lbl = tk.Label(
            self, text=text, font=("JetBrains Mono", font_size, "bold" if primary else "normal"),
            bg=bg, fg=fg, padx=14, pady=8
        )
        self.lbl.pack(fill="both", expand=True)
        if width:
            self.lbl.config(width=width)

        for widget in (self, self.lbl):
            widget.bind("<Button-1>", lambda e: self.on_click())
            widget.bind("<Enter>", lambda e: self.on_enter())
            widget.bind("<Leave>", lambda e: self.on_leave())

    def on_enter(self):
        if not self.primary:
            self.config(bg=UI_COLORS["border"])
            self.lbl.config(bg=UI_COLORS["border"], fg=UI_COLORS["text_main"])

    def on_leave(self):
        bg = UI_COLORS["btn_primary_bg"] if self.primary else UI_COLORS["btn_sec_bg"]
        fg = UI_COLORS["btn_primary_fg"] if self.primary else UI_COLORS["btn_sec_fg"]
        self.config(bg=bg)
        self.lbl.config(bg=bg, fg=fg)

    def on_click(self):
        if self.command:
            self.command()


# ================== 主工作站界面 ==================
class TalosWorkstation:
    def __init__(self, root):
        self.root = root
        self.root.title("TALOS AIC // 排版图形光栅化工作站")
        self.root.geometry("1300x890")
        self.root.minsize(1140, 760)
        self.root.config(bg=UI_COLORS["app_bg"])

        self.active_modal = None
        self.current_theme_key = "极夜战术黑 (Midnight Dark)"

        # 核心参数变量
        self.cn_path = None
        self.en_path = None
        self.current_img = None
        
        self.var_w = tk.StringVar(value="1240")
        self.var_cn_sz = tk.StringVar(value="55")
        self.var_en_sz = tk.StringVar(value="50")
        self.var_lead = tk.StringVar(value="1.35")
        self.watermark_var = tk.BooleanVar(value=True)

        # 快捷键 / 实时渲染 / 快捷保存配置
        self.hotkey_enabled = tk.BooleanVar(value=True)
        self.var_hot_render = tk.StringVar(value="=L")
        self.var_hot_save = tk.StringVar(value="·1")
        self.hotkey_window = 1.2
        self.live_render_var = tk.BooleanVar(value=False)
        self.live_delay_ms = 120
        self.copy_clip_var = tk.BooleanVar(value=True)
        self.var_save_dir = tk.StringVar(value=os.path.expanduser("~/Desktop"))

        self._key_buffer = []
        self._combo_bindings = []
        self._live_job = None
        self._toast_job = None

        self.setup_ui()
        self.install_hotkeys()
        self.update_clock()
        self.log("AIC_CORE: High-contrast white workstation ready.")
        self.log(f"HOTKEY: 生成【{self.var_hot_render.get()}】 存桌面【{self.var_hot_save.get()}】 | "
                 f"LIVE={'ON' if self.live_render_var.get() else 'OFF'}")

    def setup_ui(self):
        # 1. 顶部 Header
        self.header = tk.Frame(self.root, bg=UI_COLORS["panel_bg"], height=68, bd=1, relief="solid", highlightbackground=UI_COLORS["border"])
        self.header.pack(fill="x", side="top")
        self.header.pack_propagate(False)

        h_left = tk.Frame(self.header, bg=UI_COLORS["panel_bg"])
        h_left.pack(side="left", padx=20, pady=10)

        tk.Label(h_left, text="", bg=UI_COLORS["text_main"], width=1, height=1).pack(side="left", padx=(0, 14), fill="y")
        
        t_box = tk.Frame(h_left, bg=UI_COLORS["panel_bg"])
        t_box.pack(side="left")
        
        l_top = tk.Frame(t_box, bg=UI_COLORS["panel_bg"])
        l_top.pack(anchor="w")
        tk.Label(l_top, text="TALOS AIC", font=("Inter", 17, "bold"), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="left")
        tk.Label(l_top, text="RASTER-SPEC", font=("JetBrains Mono", 9, "bold"), bg=UI_COLORS["btn_sec_bg"], fg=UI_COLORS["text_main"], padx=8, pady=2).pack(side="left", padx=10)

        tk.Label(t_box, text="HIGH-CONTRAST LIGHT WORKSPACE // 300-DPI ARCHITECTURE", font=("JetBrains Mono", 10), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"]).pack(anchor="w", pady=(2, 0))

        # 头部右侧操作
        h_right = tk.Frame(self.header, bg=UI_COLORS["panel_bg"])
        h_right.pack(side="right", padx=20)

        self.lbl_sol = tk.Label(h_right, text="00:00:00 SOL", font=("JetBrains Mono", 13, "bold"), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"])
        self.lbl_sol.pack(side="right", padx=(18, 0))

        # 顶部大号设置按钮
        self.btn_gear = TacticalButton(h_right, "⚙ 战术配置 / 设置", self.open_settings_modal, font_size=12)
        self.btn_gear.pack(side="right")

        # 2. 主体区 (双栏)
        self.main_frame = tk.Frame(self.root, bg=UI_COLORS["app_bg"])
        self.main_frame.pack(fill="both", expand=True, padx=20, pady=16)

        self.left_panel = tk.Frame(self.main_frame, bg=UI_COLORS["app_bg"], width=460)
        self.left_panel.pack(side="left", fill="y", padx=(0, 16))
        self.left_panel.pack_propagate(False)

        self.right_panel = tk.Frame(self.main_frame, bg=UI_COLORS["app_bg"])
        self.right_panel.pack(side="right", fill="both", expand=True)

        self.setup_left_panel()
        self.setup_right_viewport()

    def setup_left_panel(self):
        # 概览参数快照 (文字放大，一目了然)
        self.c_status = tk.LabelFrame(self.left_panel, text=" 当前配置快照 (CONFIG SNAPSHOT) ", font=("JetBrains Mono", 11, "bold"),
                                      bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], bd=1, relief="solid", highlightbackground=UI_COLORS["border"])
        self.c_status.pack(fill="x", pady=(0, 12), ipady=6)

        self.lbl_cfg_summary = tk.Label(self.c_status, text="", font=("JetBrains Mono", 11), justify="left", anchor="w",
                                        bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"])
        self.lbl_cfg_summary.pack(fill="x", padx=12, pady=4)
        self.update_summary_label()

        # 文本载荷输入卡片 (原生大字号输入框，纯白底黑字)
        self.c_input = tk.LabelFrame(self.left_panel, text=" 报文载荷输入 (PAYLOAD) ", font=("JetBrains Mono", 12, "bold"),
                                     bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], bd=1, relief="solid", highlightbackground=UI_COLORS["border"])
        self.c_input.pack(fill="both", expand=True, pady=(0, 12))

        self.txt_frame = tk.Frame(self.c_input, bg=UI_COLORS["panel_bg"])
        self.txt_frame.pack(fill="both", expand=True, padx=10, pady=10)

        self.txt_payload = tk.Text(
            self.txt_frame, font=("JetBrains Mono", 13), bd=1, relief="solid",
            bg="#FFFFFF", fg="#111827", insertbackground="#111827",
            padx=12, pady=12, wrap="word", highlightthickness=0
        )
        self.txt_scroll = tk.Scrollbar(self.txt_frame, orient="vertical", command=self.txt_payload.yview)
        self.txt_payload.config(yscrollcommand=self.txt_scroll.set)
        
        self.txt_scroll.pack(side="right", fill="y")
        self.txt_payload.pack(side="left", fill="both", expand=True)
        self.txt_payload.insert("1.0", "TALOS AIC PROTOCOL //\nEnsure system configurations are validated before executing typography rasterization.")

        # 实时渲染: 键入/粘贴/剪切后立即刷新
        for ev in ("<KeyRelease>", "<<Paste>>", "<<Cut>>"):
            self.txt_payload.bind(ev, lambda e: self.root.after(10, self.on_payload_key))

        # 终端控制台
        self.c_log = tk.LabelFrame(self.left_panel, text=" 终端日志 (KERNEL LOG) ", font=("JetBrains Mono", 11, "bold"),
                                   bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], bd=1, relief="solid", highlightbackground=UI_COLORS["border"])
        self.c_log.pack(fill="x", pady=(0, 14))

        self.txt_log = tk.Text(self.c_log, height=4, font=("JetBrains Mono", 10), bd=0, padx=8, pady=6,
                               bg="#F9FAFB", fg=UI_COLORS["text_sub"], state="disabled", highlightthickness=0)
        self.txt_log.pack(fill="x", padx=8, pady=8)

        # 核心主按钮区 (大字体清晰按键)
        actions = tk.Frame(self.left_panel, bg=UI_COLORS["app_bg"])
        actions.pack(fill="x")
        
        TacticalButton(actions, "⚡ 执行排版光栅化", self.render_now, primary=True, font_size=14).pack(side="left", fill="x", expand=True, padx=(0, 6))
        TacticalButton(actions, "💾 导出图像", self.save_now, font_size=12).pack(side="left", padx=4)
        TacticalButton(actions, "🗑 清空", self.clear_all, font_size=12).pack(side="right", padx=(6, 0))

    def setup_right_viewport(self):
        self.v_card = tk.Frame(self.right_panel, bg=UI_COLORS["panel_bg"], bd=1, relief="solid", highlightbackground=UI_COLORS["border"])
        self.v_card.pack(fill="both", expand=True)

        self.v_head = tk.Frame(self.v_card, bg=UI_COLORS["panel_bg"], height=44, bd=1, relief="solid", highlightbackground=UI_COLORS["border"])
        self.v_head.pack(fill="x", side="top")
        self.v_head.pack_propagate(False)

        tk.Label(self.v_head, text="VIEWPORT // 实时光学渲染视口", font=("JetBrains Mono", 12, "bold"),
                 bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="left", padx=16)

        self.lbl_metrics = tk.Label(self.v_head, text="TOKENS: 0 | GLYPHS: 0 | LINES: 0", font=("JetBrains Mono", 11),
                                    bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"])
        self.lbl_metrics.pack(side="right", padx=16)

        # 提示条 (快捷键触发反馈, 不弹窗)
        self.lbl_toast = tk.Label(self.v_head, text="", font=("JetBrains Mono", 11, "bold"),
                                  bg=UI_COLORS["panel_bg"], fg="#065F46")
        self.lbl_toast.place(relx=0.5, rely=0.5, anchor="center")

        # 视口画布
        self.canvas = tk.Canvas(self.v_card, bg="#FFFFFF", highlightthickness=0)
        self.canvas.pack(fill="both", expand=True, padx=16, pady=16)
        self.canvas.bind("<Configure>", lambda e: self.redraw_viewport())

        self.v_foot = tk.Frame(self.v_card, bg=UI_COLORS["panel_bg"], height=38)
        self.v_foot.pack(fill="x", side="bottom")
        self.v_foot.pack_propagate(False)

        self.lbl_dim = tk.Label(self.v_foot, text="DIMENSION: N/A", font=("JetBrains Mono", 11),
                                bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"])
        self.lbl_dim.pack(side="left", padx=16)
        
        tk.Label(self.v_foot, text="OUTPUT: 300-DPI ARCHITECTURE", font=("JetBrains Mono", 11),
                 bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"]).pack(side="right", padx=16)

    def update_summary_label(self):
        cn_str = os.path.basename(self.cn_path) if self.cn_path else "系统预设中文字族"
        en_str = os.path.basename(self.en_path) if self.en_path else "系统预设英文字族"
        if len(cn_str) > 14: cn_str = cn_str[:12] + ".."
        if len(en_str) > 14: en_str = en_str[:12] + ".."
        
        summary = (
            f"幅面: {self.var_w.get()}px  |  字号: {self.var_cn_sz.get()}/{self.var_en_sz.get()}pt  |  行距: {self.var_lead.get()}x\n"
            f"图像色调: 【{self.current_theme_key}】\n"
            f"字体映射: ZH: {cn_str}  |  EN: {en_str}\n"
            f"快捷键: 生成【{self.var_hot_render.get()}】 存桌面【{self.var_hot_save.get()}】  |  实时渲染: {'ON' if self.live_render_var.get() else 'OFF'}"
        )
        self.lbl_cfg_summary.config(text=summary)

    # ================== 提示条 (无弹窗反馈) ==================
    def toast(self, text, warn=False, ms=2600):
        if not hasattr(self, "lbl_toast"):
            return
        self.lbl_toast.config(text=text, fg="#B91C1C" if warn else "#065F46")
        if self._toast_job:
            try: self.root.after_cancel(self._toast_job)
            except Exception: pass
        self._toast_job = self.root.after(ms, lambda: self.lbl_toast.config(text=""))

    # ================== 快捷键系统 ==================
    def hotkey_map(self):
        return {"render": self.var_hot_render.get(), "save": self.var_hot_save.get()}

    def install_hotkeys(self):
        """组合键用 Tk 绑定, 序列键交给全局 KeyPress 监听"""
        for seq in self._combo_bindings:
            try: self.root.unbind_all(seq)
            except Exception: pass
        self._combo_bindings = []

        for action, spec in self.hotkey_map().items():
            if (parse_hotkey(spec) or {}).get("type") != "combo":
                continue
            try:
                tk_seq = combo_to_tk(spec)
                self.root.bind_all(tk_seq, lambda e, a=action: self.fire_hotkey(a))
                self._combo_bindings.append(tk_seq)
            except Exception as e:
                self.log(f"HOTKEY BIND ERR ({spec}): {e}")
        self.root.bind_all("<KeyPress>", self.on_global_key)

    def on_global_key(self, event):
        """序列键: 例如 = 之后 1.2 秒内按 L"""
        if not self.hotkey_enabled.get():
            return
        # 在输入框/下拉框内打字不触发, 避免录快捷键时误触
        focus = self.root.focus_get()
        if focus is not None:
            try:
                if focus.winfo_class() in ("Entry", "TEntry", "TCombobox", "TSpinbox", "Spinbox"):
                    return
            except Exception:
                pass

        seq_specs = {}
        for action, spec in self.hotkey_map().items():
            parsed = parse_hotkey(spec)
            if parsed and parsed["type"] == "seq":
                seq_specs[action] = parsed["keys"]
        if not seq_specs:
            return

        now = time.time()
        self._key_buffer.append((normalize_keysym(event), now))
        self._key_buffer = [(k, t) for k, t in self._key_buffer if now - t <= self.hotkey_window]
        buf = [k for k, _ in self._key_buffer]
        for action, keys in seq_specs.items():
            if len(buf) >= len(keys) and buf[-len(keys):] == keys:
                self._key_buffer = []
                self.fire_hotkey(action)
                return
        self._key_buffer = self._key_buffer[-max(len(k) for k in seq_specs.values()):]

    def fire_hotkey(self, action):
        if not self.hotkey_enabled.get():
            return
        if action == "render":
            self.log("HOTKEY: RASTERIZE")
            self.render_now(silent=True)
        else:
            self.log("HOTKEY: SAVE_TO_DESKTOP")
            self.save_to_desktop(silent=True)

    # ================== 实时渲染 (每键入一字立即刷新) ==================
    def on_payload_key(self, event=None):
        if not self.live_render_var.get():
            return
        if self._live_job:
            try: self.root.after_cancel(self._live_job)
            except Exception: pass
        self._live_job = self.root.after(self.live_delay_ms, self._live_render_tick)

    def _live_render_tick(self):
        self._live_job = None
        if not self.txt_payload.get("1.0", tk.END).strip():
            self.current_img = None
            self.redraw_viewport()
            self.lbl_dim.config(text="DIMENSION: N/A")
            self.lbl_metrics.config(text="TOKENS: 0 | GLYPHS: 0 | LINES: 0")
            return
        self.render_now(silent=True, live=True)

    # ================== 快捷保存: 桌面 + 粘贴板 ==================
    def save_to_desktop(self, silent=False):
        if not self.current_img:
            if not silent:
                messagebox.showwarning("提示", "当前无渲染产物，请先执行光栅化。")
            self.log("SAVE ABORT: no raster")
            self.toast("无渲染产物", warn=True)
            return None

        target_dir = os.path.expanduser(self.var_save_dir.get().strip() or "~/Desktop")
        try:
            os.makedirs(target_dir, exist_ok=True)
        except Exception:
            target_dir = os.path.expanduser("~/Desktop")

        fname = f"TALOS_{time.strftime('%Y%m%d_%H%M%S')}.png"
        path = os.path.join(target_dir, fname)
        try:
            self.current_img.save(path, dpi=(300, 300))
        except Exception as e:
            messagebox.showerror("保存故障", str(e))
            self.log(f"SAVE ERR: {e}")
            return None

        copied = copy_image_to_clipboard(self.current_img, path) if self.copy_clip_var.get() else False
        self.log(f"ARCHIVED_FAST: {path} | CLIPBOARD: {'OK' if copied else 'OFF/FAIL'}")
        self.toast(f"✔ 已存桌面{'并复制到粘贴板' if copied else '（粘贴板未复制）'}：{fname}", warn=not copied)
        return path

    # ================== 齿轮大字号设置弹窗 ==================
    def open_settings_modal(self):
        if self.active_modal and self.active_modal.winfo_exists():
            self.active_modal.lift()
            return

        modal = tk.Toplevel(self.root)
        self.active_modal = modal
        modal.title("TALOS AIC // 战术配置中心")
        modal.geometry("620x750")
        modal.resizable(False, True)
        modal.transient(self.root)
        modal.grab_set()
        modal.config(bg=UI_COLORS["app_bg"])

        # 头部
        m_head = tk.Frame(modal, bg=UI_COLORS["panel_bg"], height=56, **SLIM_BOX)
        m_head.pack(fill="x")
        m_head.pack_propagate(False)
        tk.Label(m_head, text="⚙ 系统核心参数配置", font=("Inter", 15, "bold"),
                 bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="left", padx=18)

        m_body = tk.Frame(modal, bg=UI_COLORS["app_bg"], padx=18, pady=16)
        m_body.pack(fill="both", expand=True)

        # 1. 字体映射
        f_font = tk.LabelFrame(m_body, text=" 字体字族映射 ", font=("JetBrains Mono", 12, "bold"),
                               bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], **SLIM_BOX)
        f_font.pack(fill="x", pady=(0, 10), ipady=4)

        r_cn = tk.Frame(f_font, bg=UI_COLORS["panel_bg"])
        r_cn.pack(fill="x", padx=14, pady=6)
        tk.Label(r_cn, text="中文字体:", font=("JetBrains Mono", 12), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], width=9, anchor="w").pack(side="left")
        lbl_cn_p = tk.Label(r_cn, text=os.path.basename(self.cn_path) if self.cn_path else "系统预设", font=("JetBrains Mono", 12),
                            bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"], anchor="w")
        lbl_cn_p.pack(side="left", fill="x", expand=True, padx=6)
        
        def pick_cn():
            p = filedialog.askopenfilename(parent=modal, filetypes=[("字体", "*.ttf *.ttc *.otf")])
            if p:
                self.cn_path = p
                lbl_cn_p.config(text=os.path.basename(p), fg=UI_COLORS["text_main"])
                self.update_summary_label()
        TacticalButton(r_cn, "寻址…", pick_cn, font_size=11).pack(side="right")

        r_en = tk.Frame(f_font, bg=UI_COLORS["panel_bg"])
        r_en.pack(fill="x", padx=14, pady=6)
        tk.Label(r_en, text="英文字体:", font=("JetBrains Mono", 12), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], width=9, anchor="w").pack(side="left")
        lbl_en_p = tk.Label(r_en, text=os.path.basename(self.en_path) if self.en_path else "系统预设", font=("JetBrains Mono", 12),
                            bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"], anchor="w")
        lbl_en_p.pack(side="left", fill="x", expand=True, padx=6)
        
        def pick_en():
            p = filedialog.askopenfilename(parent=modal, filetypes=[("字体", "*.ttf *.ttc *.otf")])
            if p:
                self.en_path = p
                lbl_en_p.config(text=os.path.basename(p), fg=UI_COLORS["text_main"])
                self.update_summary_label()
        TacticalButton(r_en, "寻址…", pick_en, font_size=11).pack(side="right")

        # 2. 物理排版矩阵 (输入框放大)
        f_param = tk.LabelFrame(m_body, text=" 排版矩阵规格 ", font=("JetBrains Mono", 12, "bold"),
                                bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], **SLIM_BOX)
        f_param.pack(fill="x", pady=(0, 10), ipady=4)

        r_p1 = tk.Frame(f_param, bg=UI_COLORS["panel_bg"])
        r_p1.pack(fill="x", padx=14, pady=6)
        tk.Label(r_p1, text="基板幅宽 (PX):", font=("JetBrains Mono", 12), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="left")
        tk.Entry(r_p1, textvariable=self.var_w, width=9, font=("JetBrains Mono", 13, "bold"),
                 bg="#FFFFFF", fg="#111827", bd=0, relief="flat", highlightthickness=1,
                 highlightbackground=UI_COLORS["hairline"], justify="center").pack(side="right")

        r_p2 = tk.Frame(f_param, bg=UI_COLORS["panel_bg"])
        r_p2.pack(fill="x", padx=14, pady=6)
        tk.Label(r_p2, text="渲染字号 [中 / 英]:", font=("JetBrains Mono", 12), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="left")
        tk.Entry(r_p2, textvariable=self.var_en_sz, width=4, font=("JetBrains Mono", 13, "bold"),
                 bg="#FFFFFF", fg="#111827", bd=0, relief="flat", highlightthickness=1,
                 highlightbackground=UI_COLORS["hairline"], justify="center").pack(side="right")
        tk.Label(r_p2, text="/", font=("JetBrains Mono", 13), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="right", padx=3)
        tk.Entry(r_p2, textvariable=self.var_cn_sz, width=4, font=("JetBrains Mono", 13, "bold"),
                 bg="#FFFFFF", fg="#111827", bd=0, relief="flat", highlightthickness=1,
                 highlightbackground=UI_COLORS["hairline"], justify="center").pack(side="right")

        r_p3 = tk.Frame(f_param, bg=UI_COLORS["panel_bg"])
        r_p3.pack(fill="x", padx=14, pady=6)
        tk.Label(r_p3, text="行距系数 (LEADING):", font=("JetBrains Mono", 12), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="left")
        tk.Entry(r_p3, textvariable=self.var_lead, width=9, font=("JetBrains Mono", 13, "bold"),
                 bg="#FFFFFF", fg="#111827", bd=0, relief="flat", highlightthickness=1,
                 highlightbackground=UI_COLORS["hairline"], justify="center").pack(side="right")

        r_p4 = tk.Frame(f_param, bg=UI_COLORS["panel_bg"])
        r_p4.pack(fill="x", padx=14, pady=6)
        tk.Checkbutton(r_p4, text="附加工程测绘底标水印", variable=self.watermark_var, font=("JetBrains Mono", 12),
                       bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], selectcolor="#FFFFFF", activebackground=UI_COLORS["panel_bg"]).pack(side="left")

        # 3. 图像生成色调选项
        f_theme = tk.LabelFrame(m_body, text=" 生成图片专属色调方案 ", font=("JetBrains Mono", 12, "bold"),
                                bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], **SLIM_BOX)
        f_theme.pack(fill="x", pady=(0, 10), ipady=5)

        r_th = tk.Frame(f_theme, bg=UI_COLORS["panel_bg"])
        r_th.pack(fill="x", padx=14, pady=6)
        tk.Label(r_th, text="选择图片色调:", font=("JetBrains Mono", 12), bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"]).pack(side="left")
        
        t_combo = ttk.Combobox(r_th, values=list(IMAGE_THEMES.keys()), state="readonly", width=22, font=("JetBrains Mono", 12))
        t_combo.set(self.current_theme_key)
        t_combo.pack(side="right")
        
        def on_theme_select(e):
            self.current_theme_key = t_combo.get()
            self.update_summary_label()
            self.log(f"IMAGE_THEME_SET: {self.current_theme_key}")
        t_combo.bind("<<ComboboxSelected>>", on_theme_select)

        # 4. 快捷键 & 实时渲染
        f_hot = tk.LabelFrame(m_body, text=" 快捷键 & 实时渲染 (HOTKEYS / LIVE) ", font=("JetBrains Mono", 12, "bold"),
                              bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], **SLIM_BOX)
        f_hot.pack(fill="x", pady=(0, 12), ipady=4)

        def make_row(parent, label_text, var=None, entry_kw=None, width=15):
            r = tk.Frame(parent, bg=UI_COLORS["panel_bg"])
            r.pack(fill="x", padx=14, pady=6)
            tk.Label(r, text=label_text, font=("JetBrains Mono", 12), bg=UI_COLORS["panel_bg"],
                     fg=UI_COLORS["text_main"], width=width, anchor="w").pack(side="left")
            if var is not None:
                kw = {"width": 18, "justify": "center"}
                kw.update(entry_kw or {})
                e = tk.Entry(r, textvariable=var, font=("JetBrains Mono", 12, "bold"),
                             bg="#FFFFFF", fg="#111827", bd=0, relief="flat", highlightthickness=1,
                             highlightbackground=UI_COLORS["hairline"], highlightcolor=UI_COLORS["text_main"], **kw)
                e.pack(side="right")
            return r

        def make_chk(parent, text, var):
            return tk.Checkbutton(parent, text=text, variable=var, font=("JetBrains Mono", 12),
                                  bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_main"], selectcolor="#FFFFFF",
                                  activebackground=UI_COLORS["panel_bg"])

        r_h0 = tk.Frame(f_hot, bg=UI_COLORS["panel_bg"])
        r_h0.pack(fill="x", padx=14, pady=(6, 2))
        make_chk(r_h0, "启用快捷键(全局)", self.hotkey_enabled).pack(side="left")
        make_chk(r_h0, "实时渲染(每键入一字立即刷新)", self.live_render_var).pack(side="left", padx=(16, 0))

        make_row(f_hot, "生成图片快捷键:", self.var_hot_render)
        make_row(f_hot, "存桌面快捷键:", self.var_hot_save)

        r_h3 = make_row(f_hot, "快捷保存目录:", self.var_save_dir, entry_kw={"width": 26, "justify": "left"})

        def pick_dir():
            d = filedialog.askdirectory(parent=modal, initialdir=os.path.expanduser(self.var_save_dir.get() or "~/Desktop"))
            if d:
                self.var_save_dir.set(d)
        TacticalButton(r_h3, "选择…", pick_dir, font_size=11).pack(side="right")

        r_h4 = tk.Frame(f_hot, bg=UI_COLORS["panel_bg"])
        r_h4.pack(fill="x", padx=14, pady=(2, 6))
        make_chk(r_h4, "保存到桌面后自动复制到粘贴板", self.copy_clip_var).pack(side="left")

        tk.Label(f_hot, text=f"格式: 序列键【{self.var_hot_render.get()}】【{self.var_hot_save.get()}】=按序敲完两下(1.2秒内)；【Cmd+Shift+S】=按住修饰键。输入框内有字符插入属正常现象。",
                 font=("JetBrains Mono", 10), justify="left", wraplength=540, anchor="w",
                 bg=UI_COLORS["panel_bg"], fg=UI_COLORS["text_sub"]).pack(fill="x", padx=14, pady=(0, 6))

        # 关闭弹窗 (同时应用快捷键)
        def close_modal():
            self.install_hotkeys()
            self.update_summary_label()
            modal.destroy()
            self.active_modal = None
            self.log(f"HOTKEY/LIVE SAVED: RENDER【{self.var_hot_render.get()}】 SAVE【{self.var_hot_save.get()}】 "
                     f"LIVE={'ON' if self.live_render_var.get() else 'OFF'}")
            if self.current_img:
                self.render_now(silent=True)
            elif self.live_render_var.get():
                self._live_render_tick()

        TacticalButton(m_body, "保存并关闭设置", close_modal, primary=True, font_size=13).pack(fill="x")

    def log(self, msg):
        self.txt_log.config(state="normal")
        t_str = time.strftime("%H:%M:%S")
        self.txt_log.insert("end", f"[{t_str}] {msg}\n")
        self.txt_log.see("end")
        self.txt_log.config(state="disabled")

    def update_clock(self):
        self.lbl_sol.config(text=f"{time.strftime('%H:%M:%S')} SOL")
        self.root.after(1000, self.update_clock)

    def clear_all(self):
        self.txt_payload.delete("1.0", tk.END)
        self.canvas.delete("all")
        self.current_img = None
        self.lbl_dim.config(text="DIMENSION: N/A")
        self.lbl_metrics.config(text="TOKENS: 0 | GLYPHS: 0 | LINES: 0")
        self.log("PAYLOAD purged.")
        if self.live_render_var.get():
            self.on_payload_key()

    def render_now(self, silent=False, live=False):
        raw = self.txt_payload.get("1.0", tk.END).strip()
        if not raw:
            if not silent:
                messagebox.showwarning("提示", "报文载荷为空，请输入文字后重试。")
            return
        
        try:
            w = int(self.var_w.get().strip())
            c_sz = int(self.var_cn_sz.get().strip())
            e_sz = int(self.var_en_sz.get().strip())
            lead = float(self.var_lead.get().strip())
        except ValueError:
            if not silent:
                messagebox.showerror("格式错误", "排版参数必须为有效数值，请在设置中检查。")
            self.log("ERR: invalid numeric parameters")
            return

        t0 = time.time()
        try:
            # 使用选中的图片色调进行光栅化渲染
            target_theme = IMAGE_THEMES[self.current_theme_key]
            img = generate_blueprint_image(
                raw, cn_size=c_sz, en_size=e_sz, max_width=w,
                cn_path=self.cn_path, en_path=self.en_path,
                theme_cfg=target_theme,
                add_watermark=self.watermark_var.get(),
                line_spacing=lead
            )
            self.current_img = img
            elapsed = (time.time() - t0) * 1000
            
            glyphs = len(raw)
            lines = len(raw.split('\n'))
            self.lbl_metrics.config(text=f"TOKENS: {len(raw.split())} | GLYPHS: {glyphs} | LINES: {lines}")
            prefix = "LIVE " if live else ""
            self.lbl_dim.config(text=f"DIMENSION: {img.width} × {img.height} PX // {prefix}COST: {elapsed:.1f}ms")
            
            if not live:
                self.log(f"RASTER SUCCESS: {img.width}x{img.height} in {elapsed:.1f}ms ({self.current_theme_key})")
            self.redraw_viewport()
        except Exception as e:
            if not silent:
                messagebox.showerror("渲染故障", str(e))
            self.log(f"ERR: {str(e)}")

    def redraw_viewport(self):
        self.canvas.delete("all")
        cw = self.canvas.winfo_width()
        ch = self.canvas.winfo_height()
        if cw < 40 or ch < 40:
            return

        # 视口背景细腻网格
        grid_step = 44
        for x in range(0, cw, grid_step):
            self.canvas.create_line(x, 0, x, ch, fill="#E5E7EB", width=1)
        for y in range(0, ch, grid_step):
            self.canvas.create_line(0, y, cw, y, fill="#E5E7EB", width=1)

        if not self.current_img:
            self.canvas.create_text(cw // 2, ch // 2, text="[ 视口就绪 // WAITING FOR RASTER ]",
                                    font=("JetBrains Mono", 13, "bold"), fill=UI_COLORS["text_sub"])
            return

        pad = 32
        avail_w = max(cw - pad * 2, 10)
        avail_h = max(ch - pad * 2, 10)

        img_w, img_h = self.current_img.width, self.current_img.height
        ratio = min(avail_w / img_w, avail_h / img_h, 1.0)
        tw = max(int(img_w * ratio), 1)
        th = max(int(img_h * ratio), 1)

        resample_filter = getattr(Image, 'Resampling', Image).LANCZOS
        resized = self.current_img.resize((tw, th), resample_filter)
        self._tk_cache = ImageTk.PhotoImage(resized)

        cx, cy = cw // 2, ch // 2
        
        # 视口卡片阴影与实体
        self.canvas.create_rectangle(cx - tw // 2 + 5, cy - th // 2 + 5, cx + tw // 2 + 5, cy + th // 2 + 5,
                                     fill="#CBD5E1", outline="")
        self.canvas.create_image(cx, cy, image=self._tk_cache, anchor="center")

        x0, y0 = cx - tw // 2, cy - th // 2
        x1, y1 = cx + tw // 2, cy + th // 2
        self.canvas.create_rectangle(x0, y0, x1, y1, outline=UI_COLORS["text_main"], width=1)

        # 瞄准准星刻度
        tick = 10
        self.canvas.create_line(x0 - tick, y0, x0 + tick, y0, fill=UI_COLORS["text_main"], width=2)
        self.canvas.create_line(x0, y0 - tick, x0, y0 + tick, fill=UI_COLORS["text_main"], width=2)
        self.canvas.create_line(x1 - tick, y1, x1 + tick, y1, fill=UI_COLORS["text_main"], width=2)
        self.canvas.create_line(x1, y1 - tick, x1, y1 + tick, fill=UI_COLORS["text_main"], width=2)

    def save_now(self):
        if not self.current_img:
            messagebox.showwarning("提示", "当前无渲染产物，请先执行光栅化。")
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".png",
            filetypes=[("PNG 300-DPI 光栅", "*.png"), ("JPEG 图像", "*.jpg")]
        )
        if path:
            kw = {'dpi': (300, 300)} if path.lower().endswith('.png') else {}
            self.current_img.save(path, **kw)
            self.log(f"ARCHIVED: {os.path.basename(path)}")
            messagebox.showinfo("完成", f"300-DPI 输出已归档：\n{path}")


if __name__ == "__main__":
    root = tk.Tk()
    TalosWorkstation(root)
    root.mainloop()
