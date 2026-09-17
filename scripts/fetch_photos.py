# -*- coding: utf-8 -*-
"""抓取高德POI实拍照片：304个场地 + 4个城市地标hero"""
import json, time, urllib.request, urllib.parse, sys, io, importlib.util
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

KEY = "ea2ba6b18456a7266b9304bbf9144b7e"
BASE = r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project"

def api(path, params):
    qs = urllib.parse.urlencode(dict(params, key=KEY))
    url = f"https://restapi.amap.com/v3/{path}?{qs}"
    for attempt in range(2):
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if attempt == 1:
                print("ERR", path, params.get("keywords") or params.get("id"), e)
            time.sleep(1)
    return {}

def search_id(city, venue):
    d = api("place/text", {"keywords": venue, "city": city, "citylimit": "true", "offset": 5, "page": 1})
    pois = d.get("pois") or []
    if not pois:
        return None
    # 优先名称包含匹配
    for p in pois:
        n, v = p.get("name", ""), venue
        core = v.split("·")[0].split("(")[0]
        if core and (core in n or n in v):
            return p.get("id")
    return pois[0].get("id")

def detail_photos(poi_id):
    d = api("place/detail", {"id": poi_id, "extensions": "all"})
    poi = (d.get("pois") or [{}])[0]
    urls = []
    for ph in (poi.get("photos") or []):
        u = ph.get("url") or ""
        if u.startswith("http"):
            urls.append(u)
    return urls

def load(name):
    spec = importlib.util.spec_from_file_location(name[:-3], f"{BASE}\\scripts\\{name}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

photos = {}
total, hit = 0, 0
for fname in ["data_hangzhou.py", "data_beijing.py", "data_shanghai.py", "data_xiamen.py", "data_guangzhou.py"]:
    m = load(fname)
    for t in m.ENTRIES:
        venue = t[1]
        total += 1
        key = f"{m.CITY}|{venue}"
        pid = search_id(m.CITY, venue)
        time.sleep(0.12)
        if not pid:
            photos[key] = []
            continue
        urls = detail_photos(pid)
        time.sleep(0.12)
        photos[key] = urls[:2]
        if urls:
            hit += 1
        if total % 40 == 0:
            print(f"progress {total} hit {hit}")

# 城市hero：地标实拍
HERO_POIS = {"北京": "故宫博物院", "上海": "外滩", "厦门": "鼓浪屿风景名胜区", "广州": "广州塔"}
hero_urls = {}
for city, landmark in HERO_POIS.items():
    pid = search_id(city, landmark)
    time.sleep(0.15)
    urls = detail_photos(pid) if pid else []
    hero_urls[city] = urls[:3]
    print("hero", city, len(urls))

with open(f"{BASE}\\scripts\\poi_photos.json", "w", encoding="utf-8") as f:
    json.dump({"venues": photos, "heroes": hero_urls}, f, ensure_ascii=False)

print(f"DONE total={total} with_photo={hit} ({hit*100//max(total,1)}%)")
