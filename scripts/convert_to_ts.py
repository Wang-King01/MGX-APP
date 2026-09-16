# -*- coding: utf-8 -*-
"""把 5 个城市数据模块合并转换为前端 explore-data.ts"""
import importlib.util, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = r"C:\Users\汪蒋涛\WorkBuddy\2026-09-16-01-37-46\project"
FILES = ["data_hangzhou.py", "data_beijing.py", "data_shanghai.py", "data_xiamen.py", "data_guangzhou.py"]

IMG_MAP = {
    ("杭州", "九溪十八涧"): "https://mgx-backend-cdn.metadl.com/generate/images/431670/2026-09-15/wp7cunacak7q/activity-forest-walk.png",
    ("杭州", "浙江美术馆"): "https://mgx-backend-cdn.metadl.com/generate/images/431670/2026-09-15/wp7cuzycak7a/activity-art-gallery.png",
    ("杭州", "五柳巷历史街区"): "https://mgx-backend-cdn.metadl.com/generate/images/431670/2026-09-15/wp7cvgycak6q/activity-coffee-street.png",
}
HEROES = {
    "杭州": "https://mgx-backend-cdn.metadl.com/generate/images/431670/2026-09-15/wp7cuaicalaa/hero-hangzhou-lakeside.png",
    "北京": "/heroes/beijing.png", "上海": "/heroes/shanghai.png",
    "厦门": "/heroes/xiamen.png", "广州": "/heroes/guangzhou.png",
}
# GitHub 仓库全文本化：hero 换成 heroes.ts 内嵌的 base64 数据URI
HERO_REPLACE = {
    '"/heroes/beijing.png"': "{hero_beijing}",
    '"/heroes/shanghai.png"': "{hero_shanghai}",
    '"/heroes/xiamen.png"': "{hero_xiamen}",
    '"/heroes/guangzhou.png"': "{hero_guangzhou}",
}
CENTERS = {"杭州": "120.169,30.262", "北京": "116.40,39.90", "上海": "121.47,31.23", "厦门": "118.09,24.46", "广州": "113.27,23.13"}
CAPTIONS = {"杭州": "杭州 · 西湖的慢时光", "北京": "北京 · 中轴线的黄昏", "上海": "上海 · 梧桐与江岸", "厦门": "厦门 · 海风与骑楼", "广州": "广州 · 珠江与骑楼"}

def load(name):
    spec = importlib.util.spec_from_file_location(name[:-3], f"{BASE}\\{name}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

city_metas, entries = [], []
gid = 0
for fname in FILES:
    m = load(fname)
    city = m.CITY
    city_metas.append({
        "name": city, "adcode": m.ADCODE, "hero": HEROES[city],
        "center": CENTERS[city], "caption": CAPTIONS[city],
    })
    for t in m.ENTRIES:
        (cat, venue, district, lng, lat, price, people, indoor, duration, hot, tags, title, desc, route) = t
        gid += 1
        # 杭州前3条保持原演示 id 1/2/3（initialTeams 引用）
        eid = gid if city != "杭州" or gid > 3 else gid
        entries.append({
            "id": eid, "city": city, "title": title, "category": cat, "venue": venue,
            "location": district, "lng": lng, "lat": lat, "price": price, "people": people,
            "indoor": indoor, "duration": duration, "hot": hot, "tags": tags,
            "image": IMG_MAP.get((city, venue), ""), "description": desc, "route": route,
        })

def j(s): return json.dumps(s, ensure_ascii=False)

acts = []
for e in entries:
    acts.append(
        f'  {{id:{e["id"]},city:{j(e["city"])},title:{j(e["title"])},category:{j(e["category"])},venue:{j(e["venue"])},'
        f'location:{j(e["location"])},lng:{("null" if e["lng"] is None else e["lng"])},lat:{("null" if e["lat"] is None else e["lat"])},'
        f'price:{e["price"]},people:{e["people"]},indoor:{"true" if e["indoor"] else "false"},duration:{j(e["duration"])},'
        f'hot:{e["hot"]},tags:{json.dumps(e["tags"], ensure_ascii=False)},image:{j(e["image"])},'
        f'description:{j(e["description"])},route:{json.dumps(e["route"], ensure_ascii=False)}}}'
    )

cm = []
for c in city_metas:
    cm.append(f'  {{name:{j(c["name"])},adcode:{j(c["adcode"])},hero:{j(c["hero"])},center:{j(c["center"])},caption:{j(c["caption"])}}}')

# 演示组队引用：九溪（自然户外第一条）与浙江美术馆
art_id = next(e["id"] for e in entries if e["venue"] == "浙江美术馆")

ts = f'''import {{ hero_beijing, hero_shanghai, hero_xiamen, hero_guangzhou }} from './heroes';

export type Activity = {{ id: number; city: string; title: string; category: string; venue: string; location: string; lng: number | null; lat: number | null; price: number; people: number; indoor: boolean; duration: string; hot: number; tags: string[]; image: string; description: string; route: string[] }};
export type CityMeta = {{ name: string; adcode: string; hero: string; center: string; caption: string }};

/** 高德地图 Web 服务 Key（用户提供，用于静态地图与实时天气） */
export const AMAP_KEY = 'ea2ba6b18456a7266b9304bbf9144b7e';

export const cities: CityMeta[] = [
{(",\n").join(cm)}
];

/** 全部真实场地活动（5 城市 × 6 场景 × 10 条，坐标与票价经公开资料核验） */
export const activities: Activity[] = [
{(",\n").join(acts)}
];

/** 城市主视觉：杭州沿用原图，其余城市使用本地生成图 */
export const heroImage = cities[0].hero;

/** 卡片配图：优先原图，无图则用高德静态地图（真实坐标） */
export function venueImage(a: Activity): string {{
  if (a.image) return a.image;
  const c = cities.find(x => x.name === a.city)!;
  const pos = a.lng != null && a.lat != null ? `${{a.lng}},${{a.lat}}` : c.center;
  return `https://restapi.amap.com/v3/staticmap?key=${{AMAP_KEY}}&zoom=15&size=400*300&scale=2&markers=mid,0xF97316,A:${{pos}}`;
}}

/** 高德地图页链接：详情内一键导航 */
export function amapLink(a: Activity): string {{
  const c = cities.find(x => x.name === a.city)!;
  const pos = a.lng != null && a.lat != null ? `${{a.lng}},${{a.lat}}` : c.center;
  return `https://uri.amap.com/marker?position=${{pos}}&name=${{encodeURIComponent(a.venue)}}&src=weekend-explorer&callnative=0`;
}}

export type Team = {{id:string; activityId:number; name:string; count:number; capacity:number; joined:boolean}};
export const initialTeams: Team[] = [{{id:'demo-1',activityId:1,name:'一起去吸氧，不做特种兵',count:3,capacity:6,joined:false}},{{id:'demo-2',activityId:{art_id},name:'找一个一起看展的搭子',count:2,capacity:4,joined:false}}];
export type Journal = {{id:string;activityId:number;note:string;date:string}};
export type LocalState = {{saved:number[];teams:Team[];journals:Journal[]}};
export function readState(): LocalState {{ try {{const raw=localStorage.getItem('weekend-explorer-v1');if(raw){{const value=JSON.parse(raw);if(Array.isArray(value.saved)&&Array.isArray(value.teams)&&Array.isArray(value.journals))return value;}}}}catch{{/* 无效缓存回到演示初始状态。 */}}return {{saved:[],teams:initialTeams,journals:[]}}; }}
'''

out = f"{BASE}\\app\\frontend\\src\\explore-data.ts"
for k, v in HERO_REPLACE.items():
    ts = ts.replace(k, v)
with open(out, "w", encoding="utf-8") as f:
    f.write(ts)

# 校验
per_city = {}
per_cat = {}
for e in entries:
    per_city[e["city"]] = per_city.get(e["city"], 0) + 1
    per_cat.setdefault(e["city"], {})
    per_cat[e["city"]][e["category"]] = per_cat[e["city"]].get(e["category"], 0) + 1

print("TOTAL:", len(entries))
for c, n in per_city.items():
    cats = per_cat[c]
    ok = all(v >= 10 for v in cats.values()) and len(cats) == 6
    print(f"{c}: {n} 条 | " + " ".join(f"{k}{v}" for k, v in cats.items()) + (" | OK" if ok else " | ⚠️"))
print("written:", out, len(ts), "chars")
