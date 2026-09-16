# -*- coding: utf-8 -*-
"""把4张hero PNG压缩为JPEG并生成base64数据URI的 heroes.ts"""
import base64, io, os, sys
from PIL import Image

HERO_DIR = r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project\app\frontend\public\heroes"
OUT_TS = r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project\app\frontend\src\heroes.ts"

NAMES = ["beijing", "shanghai", "xiamen", "guangzhou"]
lines = ["/** 城市主视觉（压缩内嵌，保证仓库与部署全自包含） */"]
total = 0
for n in NAMES:
    src = os.path.join(HERO_DIR, n + ".png")
    img = Image.open(src).convert("RGB")
    img.thumbnail((1024, 1024), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=78, optimize=True)
    data = buf.getvalue()
    total += len(data)
    b64 = base64.b64encode(data).decode("ascii")
    lines.append(f'export const hero_{n} = "data:image/jpeg;base64,{b64}";')
    print(n, len(data), "bytes jpeg")

with open(OUT_TS, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print("TOTAL jpeg:", total, "-> written", OUT_TS)
