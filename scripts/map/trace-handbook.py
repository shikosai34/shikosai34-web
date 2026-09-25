"""
学生便覧（binran_2026.pdf）の建物図面（スキャン画像）から壁を拾い、SVG に書き出す。

便覧の図面は 150dpi の画像で文字データを持たないため、長い水平線・垂直線だけを壁とみなして
細い塗りの矩形として出力する。出力は第33回サイトの図面と同じ形（塗りの細長い path）なので、
あとは scripts/map/build-plans.mjs がほかの図面と同じように部屋を切り出す。
部屋名の文字は短い線の集まりなので壁としては拾われない。

便覧そのもの・ページの画像はリポジトリに入れない（壁の線だけを SVG として残す）。

実行: python3 scripts/map/trace-handbook.py path/to/binran_2026.pdf
確認用: 出力と同じ場所に <name>.png（切り出した元画像）を /tmp/map-debug に書く
"""

import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "svg")
DEBUG_DIR = "/tmp/map-debug"

# 便覧の画像の 1px → SVG の単位。第33回の図面（A4 = 596 単位）と縮尺を揃える
SCALE = 596 / 1241
# これより短い線は文字などとみなして捨てる（px）
MIN_RUN = 26
# 暗いとみなす明るさ（0〜255）
DARK = 150

# name: (PDF のページ, 切り出す範囲 [x0, y0, x1, y1]（px）)
# ページ番号は PDF の通し番号（便覧の印刷上のページとは異なる）
TARGETS = {
    "hb-bldg4": (186, [215, 200, 1025, 1600]),
    "hb-bldg7": (188, [175, 200, 1085, 1600]),
    "hb-bldg10": (190, [175, 815, 1040, 1505]),
    "hb-ibayu": (192, [230, 225, 1040, 1510]),
    "hb-gym1": (193, [205, 195, 1095, 1065]),
    "hb-budokan": (194, [215, 195, 1025, 1090]),
}


def page_image(pdf, page):
    with tempfile.TemporaryDirectory() as tmp:
        prefix = os.path.join(tmp, "p")
        subprocess.run(["pdfimages", "-png", "-f", str(page), "-l", str(page), pdf, prefix], check=True)
        name = sorted(os.listdir(tmp))[0]
        return Image.open(os.path.join(tmp, name)).convert("L").copy()


def runs(line):
    """1 行（または 1 列）の暗い画素の連なり [(start, end)]（end は含まない）"""
    padded = np.concatenate([[False], line, [False]])
    diff = np.diff(padded.astype(np.int8))
    starts = np.where(diff == 1)[0]
    ends = np.where(diff == -1)[0]
    return [(s, e) for s, e in zip(starts, ends) if e - s >= MIN_RUN]


def merge(segments):
    """隣り合う行（列）の、ほぼ同じ範囲の線をまとめて矩形 [a0, b0, a1, b1] にする"""
    rects = []
    open_ = []
    for pos in sorted(segments):
        next_open = []
        for s, e in segments[pos]:
            for r in open_:
                if r[3] == pos and abs(r[0] - s) <= 3 and abs(r[2] - e) <= 3:
                    r[0], r[2], r[3] = min(r[0], s), max(r[2], e), pos + 1
                    next_open.append(r)
                    break
            else:
                r = [s, pos, e, pos + 1]
                rects.append(r)
                next_open.append(r)
        open_ = next_open
    return rects


def trace(img):
    dark = np.asarray(img) < DARK
    h_segments = {y: runs(dark[y]) for y in range(dark.shape[0])}
    v_segments = {x: runs(dark[:, x]) for x in range(dark.shape[1])}
    horizontal = merge({k: v for k, v in h_segments.items() if v})  # [x0, y0, x1, y1]
    vertical = [[r[1], r[0], r[3], r[2]] for r in merge({k: v for k, v in v_segments.items() if v})]
    # 太いもの（塗りつぶしの面など）は壁ではない
    return [r for r in horizontal + vertical if min(r[2] - r[0], r[3] - r[1]) <= 6]


def to_svg(rects, width, height):
    f = lambda v: f"{v * SCALE:.2f}"
    paths = [
        f'<path d="M{f(x0)} {f(y0)}H{f(x1)}V{f(y1)}H{f(x0)}Z" fill="black"/>'
        for x0, y0, x1, y1 in rects
    ]
    return (
        f'<svg width="{f(width)}" height="{f(height)}" viewBox="0 0 {f(width)} {f(height)}" fill="none" '
        f'xmlns="http://www.w3.org/2000/svg">\n' + "\n".join(paths) + "\n</svg>\n"
    )


def main():
    if len(sys.argv) < 2:
        sys.exit("使い方: python3 scripts/map/trace-handbook.py path/to/binran_2026.pdf [name ...]")
    pdf = sys.argv[1]
    names = sys.argv[2:] or list(TARGETS)
    os.makedirs(DEBUG_DIR, exist_ok=True)
    for name in names:
        page, box = TARGETS[name]
        img = page_image(pdf, page).crop(box)
        img.save(os.path.join(DEBUG_DIR, f"{name}.png"))
        rects = trace(img)
        with open(os.path.join(OUT_DIR, f"{name}.svg"), "w", encoding="utf-8") as fp:
            fp.write(to_svg(rects, *img.size))
        print(f"{name}: 壁 {len(rects)} 本")


if __name__ == "__main__":
    main()
