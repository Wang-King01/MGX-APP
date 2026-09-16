import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, MapPin, Compass, Users, BookOpen, Bookmark, Sun, CloudRain, ChevronDown, SlidersHorizontal, Sparkles, Check, X, Clock, Footprints, Mountain, Coffee, Palette, Plus, Send, Leaf, Navigation, Heart, Menu, Copy, Camera, MoonStar } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { activities, cities, AMAP_KEY, venueImage, amapLink, readState, type Activity, type LocalState } from '../explore-data';

const tabs = ['发现周末','搭子广场','探索手记','我的收藏'];
const interests = ['全部灵感','自然户外','艺术文化','美食漫游','城市漫步','咖啡书店','夜游市集'];
const interestIcons = [Compass, Mountain, Palette, Coffee, Footprints, BookOpen, MoonStar];
type Applied = { budget: number; people: number; weather: string };
type LiveWeather = { temperature: string; weather: string; winddirection: string; windpower: string; reporttime: string } | null;

/** 推荐评分（0–100）：天气 40 + 预算 25 + 人数 20 + 热度 15 */
const scoreOf = (a: Activity, ap: Applied): number => {
  let score = 0;
  // 天气匹配（40 分）
  if (ap.weather === '雨天') score += a.indoor ? 40 : 0;
  else if (ap.weather === '多云') score += a.indoor ? 32 : 40;
  else score += a.indoor ? 24 : 40;
  // 预算匹配（25 分）：免费满分，越接近预算上限分越低
  if (a.price === 0) score += 25;
  else score += Math.max(8, 25 - 12 * (a.price / ap.budget));
  // 人数匹配（20 分）：容量刚好够用得分最高；单人时小容量活动额外加分
  if (a.people >= ap.people) score += Math.max(6, 20 - 3 * (a.people - ap.people));
  if (ap.people === 1 && a.people <= 4) score += 4;
  // 热度（15 分）
  score += a.hot * 3;
  return score;
};

/** 推荐理由：按天气 / 预算 / 人数 / 热度 / 标签构成拼接 */
const reasonOf = (a: Activity, ap: Applied): string => {
  const parts: string[] = [];
  if (ap.weather === '雨天') parts.push('雨天室内优选 · 不受天气影响');
  else if (ap.weather === '晴天') parts.push(a.indoor ? '晴雨都适宜 · 出门不亏' : '好天气别浪费 · 户外首选');
  else parts.push('晴雨都适宜 · 出门不亏');
  if (a.price === 0) parts.push('预算0元也精彩');
  else if (a.price <= ap.budget * 0.5) parts.push(`预算宽裕 · 人均仅¥${a.price}`);
  else parts.push(`预算内 · 人均¥${a.price}`);
  if (ap.people === 1 && a.people <= 4) parts.push('一个人也很好');
  else parts.push(`适合 ${ap.people} 人小队`);
  if (a.hot >= 5) parts.push(' · 小红书热门');
  if (a.tags[0]) parts.push(` · ${a.tags[0]}`);
  return parts.join('');
};

export default function Index() {
 const [page,setPage]=useState('发现周末'); const [menu,setMenu]=useState(false);
 const [state,setState]=useState(readState); const [category,setCategory]=useState('全部灵感');
 const [budget,setBudget]=useState('100');const [people,setPeople]=useState('2');const [weather,setWeather]=useState('晴天');
 const [applied,setApplied]=useState<Applied>({budget:100,people:2,weather:'晴天'}); const [sort,setSort]=useState('recommended');
 const [selected,setSelected]=useState<Activity|null>(null);const [action,setAction]=useState('detail');
 const [teamName,setTeamName]=useState('');const [note,setNote]=useState('');const [share,setShare]=useState('');
 // 城市切换：初始值从 localStorage 读取并校验，仅接受已知城市名
 const [city,setCityState]=useState<string>(()=>{try{const raw=localStorage.getItem('weekend-explorer-city');if(raw&&cities.some(c=>c.name===raw))return raw;}catch{/* 忽略隐私模式等存储异常 */}return '杭州';});
 const [liveWeather,setLiveWeather]=useState<LiveWeather>(null);
 const setCity=(next:string)=>{setCityState(next);try{localStorage.setItem('weekend-explorer-city',next);}catch{/* 忽略存储异常 */}};
 const cityMeta=cities.find(c=>c.name===city)!;
 const cityActs=activities.filter(a=>a.city===city);
 // 高德实时天气：随城市切换请求，AbortController 防竞态；失败/为空回落到模拟数据
 useEffect(()=>{
   const ctrl=new AbortController();
   fetch(`https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${cityMeta.adcode}&extensions=base`,{signal:ctrl.signal})
     .then(r=>r.json())
     .then((d:{lives?:Array<{weather?:string;temperature?:string;winddirection?:string;windpower?:string;reporttime?:string}>})=>{
       const live=d?.lives?.[0];
       if(live&&live.weather&&live.temperature)setLiveWeather({temperature:live.temperature,weather:live.weather,winddirection:live.winddirection||'—',windpower:live.windpower||'—',reporttime:live.reporttime||''});
       else setLiveWeather(null);
     })
     .catch(()=>{if(!ctrl.signal.aborted)setLiveWeather(null);});
   return ()=>ctrl.abort();
 },[city]);
 const rainy=liveWeather?liveWeather.weather.includes('雨'):applied.weather==='雨天';
 const weatherTemp=liveWeather?liveWeather.temperature:(rainy?'21':'24');
 const weatherText=liveWeather?`${liveWeather.weather} · ${liveWeather.winddirection}风 ${liveWeather.windpower}级`:`${applied.weather} · 微风轻拂`;
 const weatherSource=liveWeather?`高德实时 · ${(liveWeather.reporttime.split(' ')[1]||liveWeather.reporttime).slice(0,5)} 更新`:'模拟数据';
 const persist=(next:LocalState)=>{try{localStorage.setItem('weekend-explorer-v1',JSON.stringify(next));setState(next);return true;}catch{toast.error('浏览器无法保存记录，请允许本地存储后重试。');return false;}};
 const navigate=(next:string)=>{setPage(next);setMenu(false);};
 const save=(id:number)=>{const exists=state.saved.includes(id);if(persist({...state,saved:exists?state.saved.filter(x=>x!==id):[...state.saved,id]}))toast.success(exists?'已取消收藏':'已收藏，在「我的收藏」查看');};
 const open=(activity:Activity,next='detail')=>{setSelected(activity);setAction(next);setTeamName('');setNote('');setShare('');};
 // 真实推荐：当前城市 + 兴趣 + 硬性过滤（预算/人数/雨天仅室内）→ 加权评分排序
 const visible=cityActs
   .filter(a=>(category==='全部灵感'||a.category===category)&&a.price<=applied.budget&&a.people>=applied.people&&(applied.weather!=='雨天'||a.indoor))
   .map(a=>({a,score:scoreOf(a,applied)}))
   .sort((x,y)=>sort==='price'?x.a.price-y.a.price||x.a.id-y.a.id:y.score-x.score||x.a.id-y.a.id)
   .map(x=>x.a);
 const makeShare=(a:Activity,text='')=>{setShare(`【周末出逃 · 演示攻略】\n${a.title}\n地点：${a.location}\n人均预算：¥${a.price}（不含交通）\n建议时长：${a.duration}\n路线：${a.route.join(' → ')}\n${text?`我的心得：${text}\n`:''}仅为产品演示，请出发前核实开放、预约与天气信息。`);setAction('share');};
 const join=(id:string)=>{const team=state.teams.find(t=>t.id===id);if(!team)return;if(!team.joined&&team.count>=team.capacity){toast.error('这支队伍已满，试试创建自己的队伍。');return;}if(persist({...state,teams:state.teams.map(t=>t.id===id?{...t,joined:!t.joined,count:t.count+(t.joined?-1:1)}:t)}))toast.success(team.joined?'已退出演示队伍':'已加入演示队伍，仅在当前浏览器可见');};
 // 组队/手记表单的活动下拉：当前城市活动；若详情弹层里的活动来自其他城市，临时补进选项保证可用
 const formActivities=selected&&!cityActs.some(a=>a.id===selected.id)?[selected,...cityActs]:cityActs;
 const renderCard=(a:Activity)=><article className="activity-card" key={a.id}><div className="card-photo"><button className="image-button" onClick={()=>open(a)} aria-label={`查看${a.title}`}><img src={venueImage(a)} alt={a.title} /></button><span className="photo-tag">{a.category}</span><button className={`save-button ${state.saved.includes(a.id)?'saved':''}`} onClick={()=>save(a.id)} aria-label={state.saved.includes(a.id)?'取消收藏':'收藏活动'}><Bookmark size={18} fill={state.saved.includes(a.id)?'currentColor':'none'} /></button><span className="photo-location"><MapPin size={13}/>{a.location}</span></div><div className="card-copy"><div className="reason"><Sparkles size={13}/>{reasonOf(a,applied)}</div><button className="title-button" onClick={()=>open(a)}>{a.title}</button><div className="card-meta"><span><Clock size={14}/>{a.duration}</span><span><Users size={14}/>1–{a.people} 人</span></div><div className="card-bottom"><span className="price">{a.price===0?'免费':`¥${a.price}`}<small> / 人{a.price===0?'':'起'}</small></span><button className="text-button" onClick={()=>open(a)}>去探索 <ArrowUpRight size={17}/></button></div></div></article>;
 return <div className="app"><header className="header"><div className="header-inner"><a href="/" className="brand"><span className="brand-mark"><Compass size={25}/></span><span>周末出逃<span className="brand-sub">把城市，逛成你的地图</span></span></a><nav className={menu?'nav open':'nav'} aria-label="主导航">{tabs.map(t=><button key={t} className={page===t?'active':''} onClick={()=>navigate(t)}>{t}</button>)}</nav><div className="header-actions"><span className="demo-badge">产品 Demo</span><button className="avatar" aria-label="查看我的探索手记" onClick={()=>navigate('探索手记')}><Footprints size={20}/></button><button className="menu-button" aria-label="打开导航" onClick={()=>setMenu(!menu)}><Menu/></button></div></div></header>
 <main className="main"><div className="topline"><span className="city-locator"><MapPin size={15}/><span className="city-tabs" role="group" aria-label="切换城市">{cities.map(c=><button key={c.name} className={city===c.name?'city-tab active':'city-tab'} onClick={()=>setCity(c.name)} aria-pressed={city===c.name}>{c.name}</button>)}</span><span className="separator">/</span>你的周末探索半径</span><span className="topline-note"><span className="status-dot"/>周末不必远行，也能有所发现</span></div>
 {page==='发现周末'?<><section className="hero"><img className="hero-image" src={cityMeta.hero} alt={`${cityMeta.caption}（生成示意配图）`}/><div className="hero-shade"/><div className="hero-content"><span className="hero-eyebrow"><span/>给生活，留一点计划之外</span><h1>别宅着了，<br/>周末一起<span>出逃。</span></h1><p>去山野透口气，在街角发会儿呆。<br/>发现适合你的城市玩法，和有趣的人一起出发。</p><button className="primary" onClick={()=>document.getElementById('recommendations')?.scrollIntoView({behavior:'smooth',block:'start'})}>发现我的周末 <ArrowRight size={17}/></button></div><div className="hero-stamp"><Navigation size={25}/><span>走出去<br/><strong>就有好事发生</strong></span></div><span className="hero-caption"><MapPin size={14}/>{cityMeta.caption}<span>配图为生成示意</span></span></section>
 <section className="planner" aria-label="周末偏好筛选"><div className="planner-intro"><div className="mini-icon"><SlidersHorizontal size={20}/></div><div><h2>这个周末，怎么过？</h2><p>告诉我们偏好，好去处交给我们</p></div></div><div className="planner-fields"><label><span>模拟天气</span><div><Sun size={18}/><select value={weather} onChange={e=>setWeather(e.target.value)}><option>晴天</option><option>多云</option><option>雨天</option></select></div></label><label><span>人均预算</span><div><span className="field-symbol">¥</span><select value={budget} onChange={e=>setBudget(e.target.value)}><option value="0">免费也精彩</option><option value="50">50 元以内</option><option value="100">100 元以内</option><option value="200">200 元以内</option></select></div></label><label><span>同行人数</span><div><Users size={18}/><select value={people} onChange={e=>setPeople(e.target.value)}><option value="1">一个人也很好</option><option value="2">2 人结伴</option><option value="4">3–4 人小队</option><option value="6">5–6 人出发</option><option value="8">7–8 人同行</option></select></div></label><button className="dark-button" onClick={()=>{setApplied({budget:Number(budget),people:Number(people),weather});toast.success('已按天气、预算和人数更新推荐');}}><Sparkles size={16}/>为我推荐</button></div></section>
 <div className="discovery-layout"><section id="recommendations" className="recommendations"><div className="section-heading"><div><span className="eyebrow">周末灵感补给站</span><h2>你的周末，值得期待<span className="tiny-spark">✳</span></h2><p>不用做满分攻略，从一件喜欢的小事开始。</p></div><label className="sort-label"><select aria-label="排序方式" value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">综合推荐</option><option value="price">预算从低到高</option></select></label></div><div className="category-tabs">{interests.map((c,i)=>{const Icon=interestIcons[i];return <button key={c} className={category===c?'selected':''} onClick={()=>setCategory(c)}><Icon size={16}/>{c}</button>;})}</div><div className="results-caption"><span>{city} · 为你找到 <strong>{visible.length}</strong> 个好去处</span><span>{applied.weather} · 人均 ¥{applied.budget} 内 · {applied.people} 人</span></div>{visible.length?<div className="activity-grid">{visible.map(renderCard)}</div>:<div className="empty-state"><Compass size={36}/><h3>换个偏好，还有更多可能</h3><p>暂时没有同时符合这些条件的活动。试试更小的队伍或其他兴趣。</p><button className="primary" onClick={()=>{setCategory('全部灵感');setBudget('100');setPeople('2');setWeather('晴天');setApplied({budget:100,people:2,weather:'晴天'});}}>重置筛选</button></div>}<div className="small-reminder"><Leaf size={16}/><span>走近一点，也能发现新鲜。低碳出行，带走回忆，不留下垃圾。</span></div></section>
 <aside><section className="weather-card"><div className="weather-top"><span><MapPin size={14}/>{city}周末天气</span><small>{weatherSource}</small></div><div className="weather-main">{rainy?<CloudRain size={53}/>:<Sun size={53}/>}<div><strong>{weatherTemp}<sup>°</sup></strong><span>{weatherText}</span></div></div><p>{rainy?'雨天也有好去处，去室内看看展。':'宜出门，宜散步，宜收集快乐。'}</p><div className="weather-footer"><Leaf size={14}/>{rainy?'推荐室内探索':'推荐轻徒步与城市漫游'}</div></section><section className="team-preview"><div className="aside-title"><h3>一个人？一起呀</h3><Users size={19}/></div><p>找到同频搭子，快乐不止一份。</p><div className="avatar-stack"><span>小</span><span>林</span><span>阿</span><span>你</span></div><div className="team-note"><strong>周末搭子正在集合</strong><span>演示队伍 · 无需真实报名</span></div><button className="outline-button" onClick={()=>navigate('搭子广场')}>去搭子广场 <ArrowUpRight size={16}/></button></section></aside></div>
 <section className="journal-banner"><div className="journal-icon"><BookOpen size={34}/></div><div><h3>把路上的小确幸，写成下一次出发的灵感。</h3><p>用一篇探索手记，收藏你的周末，也把好去处分享给朋友。</p></div><button className="text-button" onClick={()=>navigate('探索手记')}>写下我的周末 <ArrowRight size={18}/></button></section></>:<section className="secondary-page"><div className="section-heading"><div><span className="eyebrow">让周末多一种可能</span><h1>{page}</h1><p>{page==='搭子广场'?'不赶路的同伴，比目的地更重要。所有队伍仅为本地演示。':page==='探索手记'?'记下真实感受，拼起属于你的城市地图。':'先收藏心动，下一次就出发。'}</p></div><button className="outline-button" onClick={()=>navigate('发现周末')}>发现更多 <ArrowRight size={16}/></button></div>
 {page==='搭子广场'&&<><div className="inline-notice"><Users size={18}/>这是组队交互演示，加入或创建不会联系其他用户，也不产生真实报名。</div><div className="team-list">{state.teams.map(t=>{const a=activities.find(item=>item.id===t.activityId);if(!a)return null;return <article className="team-row" key={t.id}><img src={venueImage(a)} alt={a.title}/><div><span className="pill">{t.joined?'我的队伍':'招募中 · 演示'}</span><h3>{t.name}</h3><button className="title-button small" onClick={()=>open(a)}>{a.title}</button><p><Users size={15}/>{t.count} / {t.capacity} 人 · 周末自由安排</p></div><button className={t.joined?'outline-button':'primary'} onClick={()=>join(t.id)}>{t.joined?'退出队伍':t.count>=t.capacity?'队伍已满':'加入队伍'}</button></article>;})}</div><button className="dark-button" onClick={()=>open(cityActs[0],'team')}><Plus size={17}/>创建我的演示队伍</button></>}
 {page==='我的收藏'&&(state.saved.length?<div className="activity-grid">{activities.filter(a=>state.saved.includes(a.id)).map(renderCard)}</div>:<div className="empty-state"><Bookmark size={36}/><h3>你的周末心愿单，等你开启</h3><p>点击活动图片上的收藏按钮，把喜欢的地方留在这里。</p><button className="primary" onClick={()=>navigate('发现周末')}>寻找心动好去处</button></div>)}
 {page==='探索手记'&&<><button className="dark-button" onClick={()=>open(cityActs[0],'journal')}><Plus size={17}/>记录一次探索</button>{state.journals.length?<div className="journal-list">{state.journals.map(j=>{const a=activities.find(item=>item.id===j.activityId);if(!a)return null;return <article className="journal-entry" key={j.id}><img src={venueImage(a)} alt={a.title}/><div><span className="eyebrow"><Check size={14}/>已打卡 · {j.date}</span><h3>{a.title}</h3><p className="journal-text">{j.note}</p><button className="text-button" onClick={()=>{setSelected(a);makeShare(a,j.note);}}><Send size={15}/>生成分享攻略</button></div></article>;})}</div>:<div className="empty-state"><Camera size={38}/><h3>第一篇手记，从这个周末开始</h3><p>选择一个活动，写下心得即可完成演示打卡。记录仅保存在当前浏览器。</p></div>}</>}
 </section>}
 <footer><a className="footer-brand" href="/"><Compass size={18}/>周末出逃</a><span>周末城市探索指南 · 为每一份好奇心，找到目的地</span><small>数据来自高德地图与公开资料 · 活动队伍为演示 · 操作仅保存在当前浏览器</small></footer></main>
 <Dialog.Root open={!!selected} onOpenChange={isOpen=>{if(!isOpen)setSelected(null);}}><Dialog.Portal><Dialog.Overlay className="sheet-overlay"/><Dialog.Content className="detail-sheet"><Dialog.Close className="sheet-close" aria-label="关闭详情"><X size={22}/></Dialog.Close>{selected&&<><img className="detail-image" src={venueImage(selected)} alt={selected.title}/><div className="detail-content"><span className="eyebrow">{selected.category} · 演示活动</span><Dialog.Title>{selected.title}</Dialog.Title><Dialog.Description>{selected.location} · {selected.duration} · 人均 ¥{selected.price}</Dialog.Description><div className="detail-tabs">{[['detail','活动详情'],['team','组队出发'],['journal','打卡记录']].map(([key,label])=><button className={action===key?'selected':''} key={key} onClick={()=>setAction(key)}>{label}</button>)}</div>
 {action==='detail'&&<><p className="detail-description">{selected.description}</p><h3>一条不赶路的路线</h3><ol className="route-list">{selected.route.map((r,i)=><li key={r}><span>{i+1}</span>{r}</li>)}</ol><div className="inline-notice">活动费用与路线仅供演示，交通费另计。请出发前核实天气、开放与预约信息。</div><div className="sheet-actions"><button className="primary" onClick={()=>setAction('team')}><Users size={17}/>一起出发</button><button className="outline-button" onClick={()=>save(selected.id)}><Bookmark size={17}/>{state.saved.includes(selected.id)?'取消收藏':'收藏活动'}</button><button className="text-button" onClick={()=>makeShare(selected)}><Send size={16}/>分享攻略</button><button className="text-button" onClick={()=>window.open(amapLink(selected),'_blank')}><Navigation size={16}/>高德导航</button></div></>}
 {action==='team'&&<><h3>创建你的周末小队</h3><p className="muted">队伍仅保存在当前浏览器，不会发送邀请或产生真实报名。</p><form onSubmit={e=>{e.preventDefault();if(!teamName.trim()){toast.error('给小队取一个名字吧');return;}if(persist({...state,teams:[...state.teams,{id:crypto.randomUUID(),activityId:selected.id,name:teamName.trim(),count:1,capacity:selected.people,joined:true}]})){setSelected(null);navigate('搭子广场');toast.success('演示小队已创建');}}}><label className="form-label">探索活动<select value={selected.id} onChange={e=>setSelected(activities.find(a=>a.id===Number(e.target.value))!)}>{formActivities.map(a=><option value={a.id} key={a.id}>{a.title}</option>)}</select></label><label className="form-label">小队名称<input required maxLength={30} value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="例如：不赶路的周末散步小队"/></label><p className="muted">队伍上限 {selected.people} 人 · 创建后你将成为首位成员</p><button className="primary" type="submit"><Plus size={17}/>创建演示队伍</button></form></>}
 {action==='journal'&&<><h3>把这一刻，留在手记里</h3><form onSubmit={e=>{e.preventDefault();if(note.trim().length<5){toast.error('请写下至少 5 个字的探索心得');return;}if(persist({...state,journals:[{id:crypto.randomUUID(),activityId:selected.id,note:note.trim(),date:new Date().toLocaleDateString('zh-CN')},...state.journals]})){setSelected(null);navigate('探索手记');toast.success('已完成演示打卡，手记已保存到当前浏览器');}}}><label className="form-label">打卡活动<select value={selected.id} onChange={e=>setSelected(activities.find(a=>a.id===Number(e.target.value))!)}>{formActivities.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label><label className="form-label">探索心得<textarea required minLength={5} maxLength={1000} rows={6} value={note} onChange={e=>setNote(e.target.value)} placeholder="今天发现了什么？记下路线建议、喜欢的瞬间，或想分享的小提醒……"/></label><p className="muted">{note.length} / 1000 字 · 本地演示打卡，不获取定位</p><button className="primary" type="submit"><Check size={17}/>打卡并保存手记</button></form></>}
 {action==='share'&&<><h3>把周末灵感，分享出去</h3><p className="muted">已根据活动路线生成攻略文本，可复制发送给朋友；不会自动公开发布。</p><label className="form-label">攻略文本<textarea rows={12} value={share} onChange={e=>setShare(e.target.value)}/></label><button className="primary" onClick={async()=>{try{await navigator.clipboard.writeText(share);toast.success('攻略已复制，可以粘贴分享给朋友');}catch{toast.error('浏览器未允许复制，请选中文本后手动复制。');}}}><Copy size={17}/>复制分享攻略</button></>}
 </div></>}</Dialog.Content></Dialog.Portal></Dialog.Root></div>;
}
