import math
C, R = 200, 180          # 中心座標と半径（viewBox 400×400）
INK, SUB = "#e8e8e8", "#9fb8c4"

def pt(r, deg):
    a = math.radians(deg - 90)
    return C + r*math.cos(a), C + r*math.sin(a)

def f(x): return f"{x:.2f}"

def edge_path(n, rot=0, sag=0.965):
    """骨の先端を結ぶ縁。骨の間で内側へたわむ曲線にする"""
    d = []
    for i in range(n):
        a0 = rot + 360*i/n; a1 = rot + 360*(i+1)/n
        x0,y0 = pt(R,a0); cx,cy = pt(R*sag,(a0+a1)/2); x1,y1 = pt(R,a1)
        if i == 0: d.append(f"M {f(x0)} {f(y0)}")
        d.append(f"Q {f(cx)} {f(cy)} {f(x1)} {f(y1)}")
    return " ".join(d) + " Z"

def ribs(n, rot=0, r0=0.07):
    return "".join(f'<line x1="{f(pt(R*r0,rot+360*i/n)[0])}" y1="{f(pt(R*r0,rot+360*i/n)[1])}" '
                   f'x2="{f(pt(R,rot+360*i/n)[0])}" y2="{f(pt(R,rot+360*i/n)[1])}"/>' for i in range(n))

def ring(r, **kw):
    attrs = " ".join(f'{k.replace("_","-")}="{v}"' for k,v in kw.items())
    return f'<circle cx="{C}" cy="{C}" r="{f(r)}" {attrs}/>'

def kagari(r0=0.13, r1=0.19, n=56):
    """中心付近のかがり糸（ジグザグの装飾糸）"""
    pts = [pt(R*(r0 if i%2 else r1), 360*i/n) for i in range(n)]
    return '<polygon fill="none" stroke="%s" stroke-width="0.7" points="%s"/>' % (SUB, " ".join(f"{f(x)},{f(y)}" for x,y in pts)) \
         + ring(R*r0, fill="none", stroke=INK, stroke_width="0.9") + ring(R*r1, fill="none", stroke=INK, stroke_width="0.9")

def hub():
    """頭ろくろ（中心の部品）"""
    return ring(R*0.07, fill="none", stroke=INK, stroke_width="1.2") + ring(R*0.035, fill="none", stroke=INK, stroke_width="1")

def sector(r1, r2, a0, a1):
    p = [pt(r1,a0), pt(r2,a0), pt(r2,a1), pt(r1,a1)]
    return (f"M {f(p[0][0])} {f(p[0][1])} L {f(p[1][0])} {f(p[1][1])} "
            f"A {f(r2)} {f(r2)} 0 0 1 {f(p[2][0])} {f(p[2][1])} L {f(p[3][0])} {f(p[3][1])} "
            f"A {f(r1)} {f(r1)} 0 0 0 {f(p[0][0])} {f(p[0][1])} Z")

def wrap(title, n, body_under, body_over="", rot=0):
    edge = edge_path(n, rot)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <title>{title}</title>
  <defs><clipPath id="clip"><path d="{edge}"/></clipPath></defs>
  <!-- 傘の面（白）。背景に重ねて使う場合は fill を変更する -->
  <path d="{edge}" fill="none"/>
  <!-- 文様 -->
  <g clip-path="url(#clip)">{body_under}</g>
  <!-- 骨・輪 -->
  <g fill="none" stroke="{INK}" stroke-width="1" stroke-linecap="round">{body_over}</g>
  <!-- 縁 -->
  <path d="{edge}" fill="none" stroke="{INK}" stroke-width="1.6" stroke-linejoin="round"/>
</svg>
'''

# 1. 青海波：外周の帯に青海波
def seigaiha(r_in, r_out, s=9):
    out = [f'<g stroke="{SUB}" stroke-width="0.7">']
    row = 0; y = C - R - s
    while y < C + R + 2*s:
        off = 0 if row%2==0 else s
        x = C - R - 2*s + off
        while x < C + R + 2*s:
            for k in (1, 2/3, 1/3):
                out.append(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(s*2*k)}" fill="none"/>')
            x += 4*s
        y += s; row += 1
    out.append("</g>")
    # 内側は無地にするため白い円で覆う
    out.append('')
    return "".join(out)
def circ(r):
    return f"M {C-r} {C} A {r} {r} 0 1 0 {C+r} {C} A {r} {r} 0 1 0 {C-r} {C} Z"

n=20
w1 = wrap("和傘 青海波", n,
          seigaiha(R*0.52, R),
          ribs(n) + ring(R*0.52) + kagari() + hub())

# 2. 市松：3段の輪で区切り、交互に斜線
n=24
hatch = f'<pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="{SUB}" stroke-width="0.8"/></pattern>'
bounds = [0.19, 0.45, 0.72, 1.02]
cells = "".join(f'<path d="{sector(R*bounds[j], R*bounds[j+1], 360*i/n, 360*(i+1)/n)}" fill="url(#hatch)"/>'
                for j in range(3) for i in range(n) if (i+j)%2==0)
w2 = wrap("和傘 市松", n, hatch + cells,
          ribs(n) + ring(R*0.45) + ring(R*0.72) + kagari() + hub())

# 3. 麻の葉：内側の円に麻の葉、外側は無地
def asanoha(r_clip, a=22):
    h = a*math.sqrt(3)/2
    P = lambda i,j: (C + i*a + j*a/2 - 20*a, C + j*h - 10*h*2)
    seg = set()
    def add(p,q): seg.add((f(p[0]),f(p[1]),f(q[0]),f(q[1])))
    for j in range(-2, 44):
        for i in range(-2, 44):
            for tri in ((P(i,j),P(i+1,j),P(i,j+1)), (P(i+1,j),P(i+1,j+1),P(i,j+1))):
                gx = sum(p[0] for p in tri)/3; gy = sum(p[1] for p in tri)/3
                if math.hypot(gx-C, gy-C) > r_clip + a: continue
                for k in range(3):
                    add(tri[k], tri[(k+1)%3]); add((gx,gy), tri[k])
    lines = "".join(f'<line x1="{s[0]}" y1="{s[1]}" x2="{s[2]}" y2="{s[3]}"/>' for s in seg)
    return (f'<clipPath id="disc"><circle cx="{C}" cy="{C}" r="{f(r_clip)}"/></clipPath>'
            f'<g clip-path="url(#disc)" stroke="{SUB}" stroke-width="0.6">{lines}</g>')
n=16
w3 = wrap("和傘 麻の葉", n, asanoha(R*0.58),
          ribs(n, r0=0.58) + ring(R*0.58, stroke_width="1.4") + ring(R*0.62) + hub())

# 4. 渦：骨を曲線にして回転を表現、外周に細い輪
n=18
def curved_ribs(n, twist=38):
    d=[]
    for i in range(n):
        a = 360*i/n
        x0,y0 = pt(R*0.07, a - twist); c1 = pt(R*0.45, a - twist*0.55); c2 = pt(R*0.8, a - twist*0.12); x1,y1 = pt(R, a)
        d.append(f'<path d="M {f(x0)} {f(y0)} C {f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(x1)} {f(y1)}"/>')
    return "".join(d)
w4 = wrap("和傘 渦", n, "",
          curved_ribs(n) + ring(R*0.84, stroke=SUB, stroke_dasharray="2 3") + ring(R*0.3) + hub())

import os
OUT="wagasa_v2"
for name, s in (("wagasa-seigaiha", w1), ("wagasa-ichimatsu", w2), ("wagasa-asanoha", w3), ("wagasa-uzu", w4)):
    open(f"{OUT}/{name}.svg","w").write(s)
    print(f"{name}.svg  {len(s):>7} bytes")
