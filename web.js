/* Ribbon constellation: a layered 3D web of the photos and messages collected for one person.
   Loaded before app.js; app.js calls RibbonWeb.markup() to render and mount()/unmount() around it. */
(()=>{
'use strict';

const MOMENTS={road:'Road trip',city:'City nights',walks:'Walks & the L',home:'At home'};
const PLACES={catskills:'Catskills',route:'Route 28',les:'Lower East Side',park:'Prospect Park',apt:'Maya’s apartment',train:'The L train',london:'London',village:'West Village'};
const TIMES={su24:'Summer 2024',fa24:'Fall 2024',wi25:'Winter 2025',sp25:'Spring 2025'};

// [id, width, height, moment, place, time, caption]
const PHOTOS=[
['m01',736,981,'city','les','sp25','Stoop sitting after the show'],
['m02',736,981,'walks','village','fa24','Golden hour on Perry St'],
['m03',736,1104,'city','les','sp25','Ludlow at midnight'],
['m04',736,981,'road','route','su24','Window dancing, somewhere upstate'],
['m05',1200,1499,'walks','park','fa24','The hello hug'],
['m06',736,1104,'walks','train','wi25','Hands on the pole'],
['m07',736,981,'home','apt','wi25','Kitchen screaming, unclear why'],
['m08',1200,1600,'walks','park','fa24','Draped over the railing'],
['m09',900,1200,'home','apt','wi25','Three faces, one phone'],
['m10',736,920,'walks','london','sp25','London, day two'],
['m11',750,784,'road','catskills','su24','The sunset we pulled over for'],
['m12',736,552,'road','route','su24','Burger break'],
['m13',900,1200,'city','les','sp25','Mirror selfie on Delancey'],
['m14',736,1100,'home','apt','wi25','Stairwell portrait'],
['m15',736,981,'road','catskills','su24','Nap in the meadow'],
['m16',736,552,'city','les','sp25','Bench at 2am'],
['m17',736,920,'walks','train','wi25','Upside down on the L'],
['m18',735,700,'road','catskills','su24','Field dance'],
['m19',1200,1600,'road','catskills','su24','Arms up, all that green'],
['m20',720,698,'city','village','sp25','Peekaboo'],
['m21',736,981,'walks','village','fa24','Walking nowhere in particular'],
['m22',736,981,'home','apt','wi25','Floor talks'],
['m23',640,427,'road','route','su24','Wind in the window']
];

// [id, text, moment, place, time, shared over, linked photos, sender: 'you' or 'them']
const MESSAGES=[
['t01','are we still doing the catskills thing','road','catskills','su24','iMessage',['m15'],'them'],
['t02','i’m bringing the aux and zero snacks','road','route','su24','WhatsApp',['m04','m23'],'you'],
['t03','pull over!! the sky is insane rn','road','catskills','su24','iMessage',['m11'],'them'],
['t04','that burger was a religious experience','road','route','su24','Instagram',['m12'],'you'],
['t05','the field dance video is my lock screen now','road','catskills','su24','Instagram',['m18','m19'],'them'],
['t06','u up','city','les','sp25','iMessage',['m16'],'them'],
['t07','meet me on ludlow at 11','city','les','sp25','WhatsApp',['m03','m01'],'you'],
['t08','the mirror pic is iconic do not delete','city','les','sp25','Instagram',['m13','m20'],'them'],
['t09','omw, the L is being the L again','walks','train','wi25','iMessage',['m06'],'you'],
['t10','you hung upside down on a moving train. who raised you','walks','train','wi25','WhatsApp',['m17'],'you'],
['t11','walk tomorrow? the leaves are doing the thing','walks','park','fa24','iMessage',['m08','m21'],'them'],
['t12','i miss you already and you left 4 min ago','walks','park','fa24','iMessage',['m05'],'them'],
['t13','made it home? text me when you do ♡','home','apt','wi25','iMessage',['m14'],'them'],
['t14','sleepover friday. i’m bringing face masks','home','apt','wi25','WhatsApp',['m09','m22'],'you'],
['t15','why are we screaming in this kitchen photo','home','apt','wi25','Instagram',['m07'],'them'],
['t16','send me every london pic immediately','walks','london','sp25','WhatsApp',['m10','m02'],'you']
];

// Links between photos that share something beyond their moment: sunsets, lying down, sunglasses, city lights.
const CROSS_LINKS=[['m05','m11'],['m13','m06'],['m22','m15'],['m20','m12'],['m18','m05'],['m03','m17']];
const LENSES={all:null,moment:['Moments',MOMENTS],place:['Places',PLACES],time:['Time',TIMES]};

const F=560, OVERVIEW_Z=-1180, INTRO_Z=-3400, R=500;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function fibonacci(i,n){const y=1-(i+.5)/n*2,r=Math.sqrt(1-y*y),a=i*2.399963;return [Math.cos(a)*r,y,Math.sin(a)*r];}

let ctx=null,nodes=[],edges=[],stage,lineLayer,nodeLayer,raf=0,last=0;
let cam={x:0,y:0,z:OVERVIEW_Z},camT={...cam},homeT={...cam},recenterShown=false,rot={x:-.12,y:0},rotT={...rot};
let lens='all',focusGroup=null,focusDepth=0,selected=new Set(),activeId=null,idleUntil=0,pointers=new Map(),drag=null,dragged=false,hinted=false;

function buildNodes(){
  const rand=rng(7);
  nodes=[];
  PHOTOS.forEach(([id,w,h,moment,place,time,caption])=>{const width=Math.round(118+rand()*58),height=Math.round(Math.min(width*h/w,width*1.45));nodes.push({id,kind:'photo',moment,place,time,caption,width,height,phase:rand()*6.28});});
  MESSAGES.forEach(([id,text,moment,place,time,source,links,sender])=>nodes.push({id,kind:'message',moment,place,time,text,source,links,sender,phase:rand()*6.28}));
  for(let i=0;i<34;i++)nodes.push({id:'d'+i,kind:'dot',size:Math.round(10+rand()*20),phase:rand()*6.28});
  const n=nodes.filter(v=>v.kind!=='dot').length;
  const order=[...Array(n).keys()].sort(()=>rand()-.5);
  let item=0,dot=0;
  nodes.forEach(v=>{
    const isDot=v.kind==='dot',dir=isDot?fibonacci((dot++*7+3)%60,60):fibonacci(order[item++],n),dist=isDot?R*(.6+rand()*.9):R*(.38+Math.sqrt(rand())*.62);
    v.home=[dir[0]*dist,dir[1]*dist*.92,dir[2]*dist];
    [v.x,v.y,v.z]=v.home;[v.tx,v.ty,v.tz]=v.home;v.blur=-1;v.z_index=-1;
  });
  const byId=Object.fromEntries(nodes.map(v=>[v.id,v]));
  edges=[];
  MESSAGES.forEach(m=>m[6].forEach(p=>edges.push([byId[m[0]],byId[p]])));
  Object.keys(MOMENTS).forEach(key=>{const group=nodes.filter(v=>v.kind==='photo'&&v.moment===key);group.forEach((v,i)=>{if(i%2===0&&group[i+1])edges.push([v,group[i+1]]);});});
  CROSS_LINKS.forEach(([a,b])=>edges.push([byId[a],byId[b]]));
  return byId;
}

function layout(){
  const groups=lens==='all'?null:Object.keys(LENSES[lens][1]);
  nodes.forEach(v=>{
    if(!groups||v.kind==='dot'){const s=groups?1.25:1;[v.tx,v.ty,v.tz]=v.home.map(c=>c*s);return;}
    const key=v[lens],gi=groups.indexOf(key),members=nodes.filter(o=>o.kind!=='dot'&&o[lens]===key),mi=members.indexOf(v);
    const c=groupCenter(gi,groups.length),spread=130+members.length*12,d=fibonacci(mi,members.length);
    v.tx=c[0]+d[0]*spread;v.ty=c[1]+d[1]*spread*.85;v.tz=c[2]+d[2]*spread;
  });
}
function groupCenter(i,n){const d=fibonacci(i,n),r=n>4?560:480;return [d[0]*r,d[1]*r*.8,d[2]*r];}

function markup(c){
  const person=esc(c.person);
  return `<section class="screen web-screen" aria-label="${person}’s web">
<div class="web-stage" id="web-stage" tabindex="0" role="application" aria-roledescription="memory web" aria-label="${person}’s photos and messages. Scroll or pinch to zoom toward a point, drag to turn, plus and minus keys to zoom.">
<svg class="web-lines" id="web-lines" aria-hidden="true"></svg><div class="web-nodes" id="web-nodes"></div></div>
<header class="web-top"><button class="icon-button web-back" data-go="${c.back||'memories'}" aria-label="Back">${c.icon('back')}</button><h1 class="web-title">${person}’s Web</h1><button class="web-orb" id="web-orb" aria-label="Remix selected memories"><span class="web-orb-count" id="web-orb-count" hidden></span></button></header>
<div class="web-lenses" role="group" aria-label="Arrange the web">${Object.entries({all:'All',moment:'Moments',place:'Places',time:'Time'}).map(([k,l])=>`<button class="web-chip ${k==='all'?'active':''}" data-web-lens="${k}" aria-pressed="${k==='all'}">${l}</button>`).join('')}</div>
<div class="web-clusters" id="web-clusters" hidden></div>
<button class="web-recenter" id="web-recenter" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>Recenter</button>
<div class="web-card" id="web-card" hidden></div>
<p class="web-hint" id="web-hint">Scroll to zoom where you point · drag to turn · tap to pick</p>
</section>`;
}

function nodeHTML(v){
  if(v.kind==='photo')return `<button class="web-node web-photo" data-web-node="${v.id}" style="width:${v.width}px;height:${v.height}px" aria-label="Photo: ${esc(v.caption)}" aria-pressed="false"><img src="assets/constellation/thumbs/${v.id}.jpg" alt="" draggable="false"><span class="web-check" aria-hidden="true"></span></button>`;
  if(v.kind==='message')return `<button class="web-node web-bubble ${v.sender==='you'?'from-you':'from-them'}" data-web-node="${v.id}" aria-label="Message from ${v.sender==='you'?'you':esc(ctx.person)}: ${esc(v.text)}" aria-pressed="false">${esc(v.text)}<span class="web-check" aria-hidden="true"></span></button>`;
  return `<span class="web-node web-dot" style="width:${v.size}px;height:${v.size}px" aria-hidden="true"></span>`;
}

function mount(c){
  unmount();
  ctx=c;stage=document.getElementById('web-stage');lineLayer=document.getElementById('web-lines');nodeLayer=document.getElementById('web-nodes');
  if(!stage)return;
  buildNodes();
  nodeLayer.innerHTML=nodes.map(nodeHTML).join('');
  [...nodeLayer.children].forEach((el,i)=>{nodes[i].el=el;});
  lineLayer.innerHTML=edges.map(()=>'<line/>').join('');
  [...lineLayer.children].forEach((el,i)=>{edges[i].el=el;});
  cam={x:0,y:0,z:reducedMotion()?OVERVIEW_Z:INTRO_Z};camT={x:0,y:0,z:OVERVIEW_Z};homeT={...camT};recenterShown=false;rot={x:-.12,y:-.6};rotT={...rot};lens='all';focusGroup=null;activeId=null;hinted=false;selected=new Set();idleUntil=0;
  stage.addEventListener('wheel',onWheel,{passive:false});
  stage.addEventListener('pointerdown',onDown);
  stage.addEventListener('pointermove',onMove);
  stage.addEventListener('pointerup',onUp);
  stage.addEventListener('pointercancel',onUp);
  stage.addEventListener('keydown',onKey);
  document.addEventListener('click',onClick);
  updateOrb();
  last=performance.now();raf=requestAnimationFrame(frame);
}
function unmount(){cancelAnimationFrame(raf);raf=0;document.removeEventListener('click',onClick);pointers.clear();drag=null;ctx=null;}

function local(e){const r=stage.getBoundingClientRect(),s=r.width/stage.offsetWidth;return [(e.clientX-r.left)/s,(e.clientY-r.top)/s];}
function interacted(){idleUntil=performance.now()+3500;if(!hinted){hinted=true;document.getElementById('web-hint')?.classList.add('faded');}}

function zoomAt(mx,my,amount){
  const W=stage.offsetWidth,H=stage.offsetHeight,dx=(mx-W/2)/F,dy=(my-H/2)/F;
  camT.x=Math.max(-900,Math.min(900,camT.x+dx*amount));
  camT.y=Math.max(-900,Math.min(900,camT.y+dy*amount));
  camT.z=Math.max(-3200,Math.min(R*.45,camT.z+amount));
  interacted();
}
function zoomStep(){return Math.max(260,R*.6-camT.z);}
function onWheel(e){e.preventDefault();const [mx,my]=local(e),unit=e.deltaMode===1?33:1;const amount=-e.deltaY*unit*(e.ctrlKey?.004:.0008)*zoomStep();zoomAt(mx,my,Math.max(-zoomStep()*.35,Math.min(zoomStep()*.35,amount)));}
function onDown(e){pointers.set(e.pointerId,local(e));if(pointers.size===1){drag={start:local(e),last:local(e)};dragged=false;}if(pointers.size===2)drag=null;}
function onMove(e){
  if(!pointers.has(e.pointerId))return;
  const prev=pointers.get(e.pointerId),now=local(e);pointers.set(e.pointerId,now);
  if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1];const d1=Math.hypot(prev[0]-other[0],prev[1]-other[1]),d2=Math.hypot(now[0]-other[0],now[1]-other[1]);zoomAt((now[0]+other[0])/2,(now[1]+other[1])/2,(d2-d1)*.004*zoomStep());dragged=true;return;}
  if(!drag)return;
  if(!dragged&&Math.hypot(now[0]-drag.start[0],now[1]-drag.start[1])>5){dragged=true;try{stage.setPointerCapture(e.pointerId);}catch{}}
  if(dragged){rotT.y+=(now[0]-drag.last[0])*.006;rotT.x=Math.max(-.9,Math.min(.9,rotT.x-(now[1]-drag.last[1])*.004));interacted();}
  drag.last=now;
}
function onUp(e){pointers.delete(e.pointerId);if(!pointers.size)drag=null;}
function onKey(e){
  const W=stage.offsetWidth,H=stage.offsetHeight;
  if(e.key==='+'||e.key==='=')zoomAt(W/2,H/2,zoomStep()*.2);
  else if(e.key==='-'||e.key==='_')zoomAt(W/2,H/2,-zoomStep()*.2);
  else if(e.key==='ArrowLeft'){rotT.y-=.25;interacted();}
  else if(e.key==='ArrowRight'){rotT.y+=.25;interacted();}
  else return;
  e.preventDefault();
}

function onClick(e){
  if(!ctx)return;
  const lensBtn=e.target.closest('[data-web-lens]');if(lensBtn)return setLens(lensBtn.dataset.webLens);
  const cluster=e.target.closest('[data-web-cluster]');if(cluster)return focus(cluster.dataset.webCluster||null);
  const node=e.target.closest('[data-web-node]');if(node){if(dragged){dragged=false;return;}return toggle(node.dataset.webNode);}
  if(e.target.closest('#web-orb'))return openRemix();
  if(e.target.closest('#web-recenter'))return recenter();
  const explore=e.target.closest('[data-web-explore]');if(explore){const v=nodes.find(n=>n.id===explore.dataset.webExplore);setLens('moment');return focus(v.moment);}
  if(e.target.closest('[data-web-card-close]')){activeId=null;return renderCard();}
  const remix=e.target.closest('[data-web-remix]');
  if(remix){const n=selected.size,label={surprise:`a surprise from your ${n} picks`,random:`something unexpected from your ${n} picks`,occasion:`a remix of your ${n} picks for ${ctx.occasion}`}[remix.dataset.webRemix];ctx.close();ctx.toast(`Prototype placeholder: Ribbon would make ${label}.`);}
}

function setLens(next){
  lens=next;focusGroup=null;activeId=null;
  document.querySelectorAll('[data-web-lens]').forEach(b=>{const on=b.dataset.webLens===next;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on);});
  const box=document.getElementById('web-clusters');
  if(next==='all')box.hidden=true;
  else{box.hidden=false;box.innerHTML=`<button class="web-chip small active" data-web-cluster="">Everything</button>`+Object.entries(LENSES[next][1]).map(([k,l])=>`<button class="web-chip small" data-web-cluster="${k}">${esc(l)}</button>`).join('');}
  layout();camT={x:0,y:0,z:OVERVIEW_Z-(next==='place'?260:120)};homeT={...camT};rotT.x=-.12;interacted();renderCard();
}

function focus(key){
  focusGroup=key||null;
  document.querySelectorAll('[data-web-cluster]').forEach(b=>b.classList.toggle('active',(b.dataset.webCluster||null)===focusGroup));
  if(!focusGroup){camT={x:0,y:0,z:OVERVIEW_Z-(lens==='place'?260:120)};homeT={...camT};interacted();return;}
  const groups=Object.keys(LENSES[lens][1]),c=groupCenter(groups.indexOf(key),groups.length);
  let target=Math.atan2(-c[0],c[2])+Math.PI;
  while(target-rot.y>Math.PI)target-=Math.PI*2;
  while(target-rot.y<-Math.PI)target+=Math.PI*2;
  rotT.y=target;rotT.x=0;
  const members=nodes.filter(o=>o.kind!=='dot'&&o[lens]===key).length,spread=130+members*12;
  focusDepth=F*.9+spread*1.7;
  camT={x:0,y:c[1],z:-Math.hypot(c[0],c[2])-focusDepth};homeT={...camT};
  idleUntil=Infinity;
}
// Back to the framing the current lens or group opened with.
function recenter(){if(focusGroup)return focus(focusGroup);camT={...homeT};rotT.x=-.12;interacted();}
// Offer Recenter once the view has been zoomed out or panned well away from that framing.
function updateRecenter(){const away=camT.z<homeT.z-320||Math.hypot(camT.x-homeT.x,camT.y-homeT.y)>320;if(away===recenterShown)return;recenterShown=away;const b=document.getElementById('web-recenter');if(b)b.hidden=!away;}

function toggle(id){
  const v=nodes.find(n=>n.id===id);
  if(selected.has(id)){selected.delete(id);if(activeId===id)activeId=null;}else{selected.add(id);activeId=id;}
  v.el.classList.toggle('selected',selected.has(id));v.el.setAttribute('aria-pressed',selected.has(id));
  updateOrb();renderCard();interacted();
}
function updateOrb(){
  const count=document.getElementById('web-orb-count'),orb=document.getElementById('web-orb');if(!count)return;
  count.hidden=!selected.size;count.textContent=selected.size;
  orb.setAttribute('aria-label',selected.size?`Remix ${selected.size} selected memories`:'Remix memories: pick photos and messages first');
  orb.classList.toggle('ready',selected.size>0);
}
function renderCard(){
  const card=document.getElementById('web-card');if(!card)return;
  const v=nodes.find(n=>n.id===activeId);
  if(!v){card.hidden=true;return;}
  const meta=`${TIMES[v.time]} · ${PLACES[v.place]}`;
  const linked=v.kind==='photo'?MESSAGES.filter(m=>m[6].includes(v.id)).length:v.links.length;
  card.hidden=false;
  card.innerHTML=`<button class="web-card-close" data-web-card-close aria-label="Close details">×</button>${v.kind==='photo'?`<img src="assets/constellation/thumbs/${v.id}.jpg" alt="">`:`<span class="web-card-quote ${v.sender==='you'?'from-you':''}">“${esc(v.text)}”</span>`}<div><strong>${v.kind==='photo'?esc(v.caption):`From ${v.sender==='you'?'you':esc(ctx.person)} over ${v.source}`}</strong><small>${meta}</small><small>${MOMENTS[v.moment]} · linked to ${linked} ${v.kind==='photo'?(linked===1?'message':'messages'):(linked===1?'photo':'photos')}</small><button class="web-card-explore" data-web-explore="${v.id}">Explore this moment</button></div>`;
}
function openRemix(){
  if(!selected.size){ctx.toast('Tap photos and messages to pick what goes into the remix.');return;}
  const n=selected.size;
  ctx.modal(`<h2>Make something from ${n} ${n===1?'pick':'picks'}</h2><p>A placeholder for Ribbon’s remix tools. Nothing is generated in this prototype.</p><div class="web-remix-options"><button class="web-remix" data-web-remix="surprise"><strong>Surprise me</strong><small>Let Ribbon find the thread between your picks.</small></button><button class="web-remix" data-web-remix="random"><strong>Something random</strong><small>An unexpected format from the same moments.</small></button><button class="web-remix" data-web-remix="occasion"><strong>Remix for ${esc(ctx.occasion)}</strong><small>Shape your picks around the upcoming day.</small></button></div>`);
}

function frame(now){
  if(!ctx||!stage?.isConnected){raf=0;return;}
  raf=requestAnimationFrame(frame);
  const dt=Math.min(64,now-last);last=now;
  const still=reducedMotion(),k=still?1:1-Math.pow(.86,dt/16),kn=still?1:1-Math.pow(.93,dt/16);
  if(!still&&now>idleUntil&&!focusGroup)rotT.y+=dt*.00007;
  rot.x+=(rotT.x-rot.x)*k;rot.y+=(rotT.y-rot.y)*k;
  updateRecenter();
  const kc=still?1:1-Math.pow(.94,dt/16);cam.x+=(camT.x-cam.x)*kc;cam.y+=(camT.y-cam.y)*kc;cam.z+=(camT.z-cam.z)*kc;
  const W=stage.offsetWidth,H=stage.offsetHeight,cy=Math.cos(rot.y),sy=Math.sin(rot.y),cx=Math.cos(rot.x),sx=Math.sin(rot.x);
  const centerDist=Math.max(F*.9,Math.hypot(cam.x,cam.y,cam.z)),focusDist=focusGroup?focusDepth:Math.max(F*.85,centerDist-R*.55);
  for(const v of nodes){
    v.x+=(v.tx-v.x)*kn;v.y+=(v.ty-v.y)*kn;v.z+=(v.tz-v.z)*kn;
    const bob=still?0:Math.sin(now*.0006+v.phase)*6;
    const x1=v.x*cy+v.z*sy,z1=-v.x*sy+v.z*cy,y2=(v.y+bob)*cx-z1*sx,z2=(v.y+bob)*sx+z1*cx;
    const rx=x1-cam.x,ry=y2-cam.y,rz=z2-cam.z;
    v.visible=rz>30;
    if(!v.visible){if(v.shown!==false){v.el.style.visibility='hidden';v.shown=false;}continue;}
    const s=F/rz,px=W/2+rx*s,py=H/2+ry*s;
    v.sx=px;v.sy=py;
    if(px<-400||px>W+400||py<-400||py>H+400||s<.035){if(v.shown!==false){v.el.style.visibility='hidden';v.shown=false;}v.visible=false;continue;}
    if(v.shown!==true){v.el.style.visibility='visible';v.shown=true;}
    const inFocus=!focusGroup||(v.kind!=='dot'&&v[lens]===focusGroup);
    // Sharp unless it sits behind the focal plane, fills most of the screen, or another group is in focus.
    if(!v.bw){v.bw=v.el.offsetWidth;v.bh=v.el.offsetHeight;}
    const fill=Math.max(v.bw*s/W,v.bh*s/H),farBlur=rz>focusDist?(rz-focusDist)/focusDist*(focusGroup?6:7):0,nearBlur=fill>.72?(fill-.72)*24:0;
    const blur=Math.round(Math.min(8,Math.max(farBlur,nearBlur)+(inFocus?0:3))*2)/2;
    const near=Math.max(0,Math.min(1,(rz-90)/300,(4.2-s)/1.6)),far=rz>3400?Math.max(0,1-(rz-3400)/900):1;
    v.alpha=near*far*(inFocus?1:.12)*(v.kind==='dot'?.55:1);
    v.depthBlur=blur;
    v.el.style.transform=`translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(4)})`;
    v.el.style.opacity=v.alpha.toFixed(3);
    if(blur!==v.blur){v.el.style.filter=blur?`blur(${blur}px)`:'none';v.blur=blur;}
    const zi=Math.max(1,Math.round(10000-rz));if(zi!==v.z_index){v.el.style.zIndex=zi;v.z_index=zi;}
    v.el.tabIndex=inFocus&&v.kind!=='dot'?0:-1;
  }
  for(const e of edges){
    const [a,b]=e;
    if(!a.visible||!b.visible){if(e.on!==false){e.el.style.display='none';e.on=false;}continue;}
    if(e.on!==true){e.el.style.display='';e.on=true;}
    e.el.setAttribute('x1',a.sx.toFixed(1));e.el.setAttribute('y1',a.sy.toFixed(1));e.el.setAttribute('x2',b.sx.toFixed(1));e.el.setAttribute('y2',b.sy.toFixed(1));
    e.el.style.opacity=(Math.min(a.alpha,b.alpha)*Math.max(.15,1-(a.depthBlur+b.depthBlur)/14)*.7).toFixed(3);
  }
}

window.RibbonWeb={markup,mount,unmount,data:{PHOTOS,MESSAGES,MOMENTS,PLACES,TIMES}};
})();
