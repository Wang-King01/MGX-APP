# -*- coding: utf-8 -*-
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
with open(r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project\poi_raw.json", encoding="utf-8") as f:
    data = json.load(f)
lines = []
for city, cats in data.items():
    for cat, items in cats.items():
        lines.append(f"=== {city} / {cat} ({len(items)}) ===")
        for i, p in enumerate(items):
            addr = p["address"].replace("浙江省", "").replace("上海市", "").replace("北京市", "").replace("福建省", "").replace("广东省", "")
            lines.append(f"{i+1}. {p['name']} | {addr} | {p['location']} | {p['type'][:24]}")
        lines.append("")
with open(r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project\poi_summary.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("done", sum(len(v) for c in data.values() for v in c.values()), "total POIs")
