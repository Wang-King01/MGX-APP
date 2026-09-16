# -*- coding: utf-8 -*-
"""高德地图 POI 采集脚本：5城市 × 6场景，采集真实场地名称/地址/坐标"""
import json, time, urllib.request, urllib.parse, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

KEY = "ea2ba6b18456a7266b9304bbf9144b7e"
CITIES = ["杭州", "北京", "上海", "厦门", "广州"]
ADCODE = {"杭州": "330100", "北京": "110000", "上海": "310000", "厦门": "350200", "广州": "440100"}

# 每个场景的搜索关键词（采集时合并去重）
CATS = {
    "自然户外": ["风景名胜", "森林公园", "湿地公园", "郊野公园"],
    "艺术文化": ["博物馆", "美术馆", "艺术区", "展览馆"],
    "美食漫游": ["美食街", "老字号", "特色小吃"],
    "城市漫步": ["历史街区", "步行街", "历史风貌区"],
    "咖啡书店": ["咖啡馆", "书店"],
    "夜游市集": ["夜市", "创意市集", "灯光秀"],
}

def poi_search(city, keyword, offset=15, page=1):
    params = urllib.parse.urlencode({
        "key": KEY, "keywords": keyword, "city": city, "citylimit": "true",
        "offset": offset, "page": page, "extensions": "base",
    })
    url = "https://restapi.amap.com/v3/place/text?" + params
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
        if data.get("status") == "1":
            return data.get("pois", [])
        return []
    except Exception as e:
        print("ERR", city, keyword, e)
        return []

def weather(adcode):
    params = urllib.parse.urlencode({"key": KEY, "city": adcode})
    url = "https://restapi.amap.com/v3/weather/weatherInfo?" + params
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            data = json.loads(r.read().decode("utf-8"))
        return data
    except Exception as e:
        return {"err": str(e)}

out = {}
for city in CITIES:
    out[city] = {}
    for cat, kws in CATS.items():
        seen, items = set(), []
        for kw in kws:
            for pois in [poi_search(city, kw)]:
                for p in pois:
                    name = p.get("name", "")
                    if not name or name in seen:
                        continue
                    seen.add(name)
                    items.append({
                        "name": name,
                        "address": (p.get("pname", "") or "") + (p.get("cityname", "") or "") + (p.get("adname", "") or "") + (p.get("address", "") or "—"),
                        "location": p.get("location", ""),
                        "type": p.get("type", ""),
                        "kw": kw,
                    })
            time.sleep(0.15)
        out[city][cat] = items
        print(f"{city} | {cat} | 采集 {len(items)} 个候选")
    time.sleep(0.2)

with open(r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project\poi_raw.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

# 天气API测试
w = weather(ADCODE["杭州"])
print("\n天气API测试:", json.dumps(w, ensure_ascii=False)[:300])
print("\nDONE -> poi_raw.json")
