# -*- coding: utf-8 -*-
"""补充采集：定向搜索弱类别的真实场地"""
import json, time, urllib.request, urllib.parse, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

KEY = "ea2ba6b18456a7266b9304bbf9144b7e"

# (城市, 关键词, 备注)
QUERIES = [
    # 夜游市集补充
    ("杭州", "夜游", "night"), ("杭州", "灯光秀", "night"), ("杭州", "游船", "night"),
    ("北京", "夜游", "night"), ("北京", "灯光秀", "night"), ("北京", "胡同 咖啡", "night"),
    ("上海", "夜游", "night"), ("上海", "豫园", "night"), ("上海", "外滩 夜景", "night"),
    ("厦门", "沙坡尾", "night"), ("厦门", "夜游", "night"), ("厦门", "集美学村", "walk"),
    ("广州", "珠江夜游", "night"), ("广州", "夜游", "night"), ("广州", "太古仓", "night"),
    # 城市漫步补充
    ("上海", "田子坊", "walk"), ("上海", "新天地", "walk"), ("上海", "思南公馆", "walk"), ("上海", "张园", "walk"),
    ("北京", "五道营胡同", "walk"), ("北京", "杨梅竹斜街", "walk"), ("北京", "南锣鼓巷", "walk"),
    ("厦门", "第八市场", "walk"), ("厦门", "中山路步行街", "walk"), ("厦门", "华新路", "walk"),
    ("广州", "东山口", "walk"), ("广州", "泮塘五约", "walk"),
    ("杭州", "小河直街", "walk"), ("杭州", "桥西历史街区", "walk"), ("杭州", "湘湖", "nature"),
    # 自然补充
    ("北京", "香山公园", "nature"), ("北京", "颐和园", "nature"), ("北京", "圆明园", "nature"),
    ("上海", "世纪公园", "nature"), ("上海", "辰山植物园", "nature"),
    ("厦门", "环岛路", "nature"), ("厦门", "五缘湾", "nature"),
    ("广州", "白云山", "nature"), ("广州", "珠江公园", "nature"),
    ("杭州", "宝石山", "nature"), ("杭州", "北高峰", "nature"),
]

def poi_search(city, keyword, offset=10):
    params = urllib.parse.urlencode({
        "key": KEY, "keywords": keyword, "city": city, "citylimit": "true",
        "offset": offset, "page": 1, "extensions": "base",
    })
    url = "https://restapi.amap.com/v3/place/text?" + params
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
        if data.get("status") == "1":
            return data.get("pois", [])
        return []
    except Exception as e:
        return []

out = []
for city, kw, tag in QUERIES:
    pois = poi_search(city, kw)
    for p in pois[:6]:
        out.append({"city": city, "tag": tag, "kw": kw, "name": p.get("name",""),
                    "address": (p.get("pname","") or "") + (p.get("adname","") or "") + (p.get("address","") or "—"),
                    "location": p.get("location",""), "type": p.get("type","")})
    time.sleep(0.12)

with open(r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project\poi_extra.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

with open(r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project\poi_extra.txt", "w", encoding="utf-8") as f:
    for i, p in enumerate(out):
        f.write(f"{i+1}. [{p['city']}|{p['tag']}|{p['kw']}] {p['name']} | {p['address']} | {p['location']}\n")
print("extra done:", len(out))
