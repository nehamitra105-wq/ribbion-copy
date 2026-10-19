/* Ribbon time capsules (Figma 139:2): a one-time capsule built in a simple video editor, sealed until an open date,
   plus daily, monthly and yearly widget capsules. Registers its screens with RibbonTemplates. */
(()=>{
'use strict';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
const icon=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I={
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>',
  plus:icon('<path d="M12 5v14M5 12h14"/>'),
  text:icon('<path d="M5 6V4h14v2M12 4v16M9 20h6"/>'),
  cut:icon('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.6 7.6 20 19M8.6 16.4 20 5"/>'),
  trash:icon('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  undo:icon('<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'),
  expand:icon('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  lock:icon('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  photo:icon('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>'),
  video:icon('<rect x="2" y="5" width="14" height="14" rx="3"/><path d="m16 10 6-3v10l-6-3"/>'),
  bubble:icon('<path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5Z"/>'),
  x:icon('<path d="m6 6 12 12M18 6 6 18"/>')
};
const PX=28,MIN_CLIP=.6;
const SONGS=[['golden','Golden hour','Soft piano, 2:41'],['drive','Long drive home','Lo-fi guitar, 3:05'],['party','Last one out','Upbeat synth, 2:58'],['letter','Letter to you','Strings, 3:20']];
const VIDEO_LEN={v1:5.9,v2:5.1,v3:7.5,v4:5.4,v5:11,v6:10.8,v7:25.4,v8:42};

let ctx=null,on=null,cap=null,t=0,playing=false,raf=0,last=0,history=[],holdTimer=0,fullscreen=false;
const key=()=>`ribbon-capsule-v1-${ctx.person}`;
const nextYear=()=>{const d=new Date();d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10);};
function seed(){return {title:'When we first met',openDate:nextYear(),opener:'both',sealed:false,song:null,clips:[
  {id:'c1',type:'text',lines:['Hey...','Remember when we first met?'],bg:'m18',dur:4},
  {id:'c2',type:'photo',src:'m10',dur:3},
  {id:'c3',type:'photo',src:'m02',dur:3},
  {id:'c4',type:'video',src:'v3',in:0,dur:5},
  {id:'c5',type:'message',msg:'t12',bg:'m05',dur:4},
  {id:'c6',type:'photo',src:'m21',dur:3},
  {id:'c7',type:'text',lines:['Promise we’ll still do this','when we open it.'],bg:'m19',dur:4}
]};}
const load=()=>{const c=store.get(key(),null)||seed();return c;};
const save=()=>store.set(key(),cap);
const total=()=>cap.clips.reduce((s,c)=>s+c.dur,0);
const fmt=s=>{s=Math.max(0,Math.floor(s));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const dateLabel=iso=>new Date(iso+'T12:00:00').toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'});
const daysUntil=iso=>Math.ceil((new Date(iso+'T00:00:00')-new Date())/864e5);
const msg=id=>window.RibbonWeb.data.MESSAGES.find(m=>m[0]===id);
function at(time){let s=0;for(let i=0;i<cap.clips.length;i++){const c=cap.clips[i];if(time<s+c.dur||i===cap.clips.length-1)return {clip:c,index:i,local:Math.min(c.dur,Math.max(0,time-s)),start:s};s+=c.dur;}return null;}

/* ---------------- Shared visuals (Figma 119:170) ---------------- */
function backdrop(src='m18'){return `<div class="cap-backdrop" aria-hidden="true"><img class="cap-backdrop-photo" src="assets/constellation/${src}.jpg" alt="">
<span class="cap-ring r114"><img src="assets/capsule/ring-114.svg" alt=""></span><span class="cap-ring r115"><img src="assets/capsule/ring-115.svg" alt=""></span><span class="cap-ring r118"><img src="assets/capsule/ring-118.svg" alt=""></span>
<span class="cap-ring r119"><img src="assets/capsule/ring-119.svg" alt=""></span><span class="cap-ring r120"><img src="assets/capsule/ring-120.svg" alt=""></span><span class="cap-ring r121"><img src="assets/capsule/ring-121.svg" alt=""></span></div>`;}
const stageHTML=extra=>`<div class="cap-stage ${extra||''}"><img class="cap-layer cap-bg" alt=""><img class="cap-layer cap-photo" alt=""><video class="cap-layer cap-video" muted playsinline preload="auto"></video><div class="cap-text"></div><div class="cap-bubble"></div></div>`;
function paint(stage,time,scrubbing){
  if(!stage)return;const hit=at(time);if(!hit)return;const {clip,local}=hit,p=local/clip.dur;
  stage.dataset.type=clip.type;
  const bg=stage.querySelector('.cap-bg'),photo=stage.querySelector('.cap-photo'),video=stage.querySelector('.cap-video'),text=stage.querySelector('.cap-text'),bubble=stage.querySelector('.cap-bubble');
  const full=stage.classList.contains('full')?'':'thumbs/';
  if(clip.type==='photo'){const src=`assets/constellation/${full}${clip.src}.jpg`;if(photo.getAttribute('src')!==src)photo.src=src;photo.style.transform=`scale(${1.04+p*.08})`;}
  if(clip.type==='text'||clip.type==='message'){const src=`assets/constellation/thumbs/${clip.bg}.jpg`;if(bg.getAttribute('src')!==src)bg.src=src;}
  if(clip.type==='text'){const html=clip.lines.filter(Boolean).map(l=>`<p>${esc(l)}</p>`).join('');if(text.dataset.id!==clip.id+html){text.innerHTML=html;text.dataset.id=clip.id+html;}text.querySelectorAll('p').forEach((el,k)=>el.classList.toggle('on',p>=k*.22));}
  if(clip.type==='message'){const m=msg(clip.msg);if(bubble.dataset.id!==clip.id){bubble.innerHTML=`<span>${esc(m?.[1]||'')}</span><small>${esc(window.RibbonWeb.data.TIMES[m?.[4]]||'')}</small>`;bubble.dataset.id=clip.id;}bubble.classList.toggle('on',p>=0);}
  if(clip.type==='video'){const src=`assets/reels/${clip.src}.mp4`;if(video.getAttribute('src')!==src){video.src=src;video.poster=`assets/reels/posters/${clip.src}.jpg`;}
    const want=clip.in+local;if(scrubbing||!playing||Math.abs(video.currentTime-want)>.35){try{video.currentTime=want;}catch{}}
    if(playing&&video.paused)video.play().catch(()=>{});if(!playing&&!video.paused)video.pause();}
  else if(!video.paused)video.pause();
}

/* ---------------- Picker ---------------- */
function pickerMarkup(c){ctx=c;cap=load();return `<section class="screen tpl-picker ribbon-home glass-screen">${c.atmosphere()}
<header class="tpl-top"><button class="icon-button" data-go="home" aria-label="Back to home">${c.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>Make a time capsule</h1><p>Hold onto this moment with ${esc(c.person)}, then open it together later, wherever you both are.</p></div>
<div class="tpl-picks">
<button class="cap-hero" data-go="capsuleSetup">${backdrop()}<span class="cap-hero-copy"><small>One-time capsule</small><strong>Hey...<br>Remember when we first met?</strong></span><span class="cap-hero-foot"><span>A story of this moment, sealed until a date you choose.</span>${c.icon('arrow')}</span></button>
<p class="tpl-section-label">Mini capsules</p>
<div class="cap-minis">${[['capsuleDaily','Daily','A fortune or affirmation from you, every morning.','“You’re braver than you think.”'],['capsuleMonthly','Monthly','A photo and a note that changes each month.','October with you'],['capsuleYearly','Yearly','A letter that unlocks every birthday.','Oct 24 · Chapter 2']].map(([go,t,d,w])=>`<button class="cap-mini" data-go="${go}"><span class="cap-widget-mini"><small>${esc(t)}</small>${esc(w)}</span><strong>${t}</strong><span>${d}</span></button>`).join('')}</div>
</div></section>`;}

/* ---------------- Setup: title + open date ---------------- */
function setupMarkup(c){ctx=c;cap=load();const quick=[['1y','In a year',nextYear()],['bday','Next birthday',nextBirthday()],['5y','In 5 years',addYears(5)]];
return `<section class="screen cap-screen cap-setup">${backdrop()}
<header class="tpl-top"><button class="icon-button" data-go="capsuleTemplates" aria-label="Back">${c.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<form class="cap-setup-form" data-cap-setup><h1>Name your capsule</h1><p>Give it a title and pick the day it opens.</p>
<label class="cap-field"><span>Title</span><input name="title" value="${esc(cap.title)}" required maxlength="60"></label>
<fieldset class="cap-field"><legend>Opens on</legend><div class="cap-quick">${quick.map(([k,l,d])=>`<button type="button" class="cap-chip ${cap.openDate===d?'active':''}" data-cap-date="${d}">${l}</button>`).join('')}</div><input type="date" name="openDate" value="${esc(cap.openDate)}" min="${new Date().toISOString().slice(0,10)}" required aria-label="Open date"></fieldset>
<fieldset class="cap-field"><legend>Who opens it</legend><div class="cap-quick">${[['both','Both of us'],['them',`Just ${esc(c.person)}`]].map(([v,l])=>`<label class="cap-chip ${cap.opener===v?'active':''}"><input type="radio" name="opener" value="${v}" ${cap.opener===v?'checked':''}>${l}</label>`).join('')}</div></fieldset>
<p class="cap-countdown" id="cap-countdown">${countdownText(cap.openDate)}</p>
<button class="cap-primary">Start the story ${c.icon('arrow')}</button></form></section>`;}
function nextBirthday(){const d=new Date('2026-10-24T12:00:00'),now=new Date();while(d<now)d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10);}
function addYears(n){const d=new Date();d.setFullYear(d.getFullYear()+n);return d.toISOString().slice(0,10);}
function countdownText(iso){const n=daysUntil(iso);return n>0?`Opens in ${n.toLocaleString()} ${n===1?'day':'days'}, on ${dateLabel(iso)}.`:'Pick a future date.';}
function mountSetup(c,bind){ctx=c;const form=document.querySelector('[data-cap-setup]');if(!form)return;
  const date=form.elements.openDate,count=document.getElementById('cap-countdown');
  bind(form,'click',e=>{const b=e.target.closest('[data-cap-date]');if(!b)return;date.value=b.dataset.capDate;form.querySelectorAll('[data-cap-date]').forEach(x=>x.classList.toggle('active',x===b));count.textContent=countdownText(date.value);});
  bind(form,'change',e=>{if(e.target===date){form.querySelectorAll('[data-cap-date]').forEach(x=>x.classList.toggle('active',x.dataset.capDate===date.value));count.textContent=countdownText(date.value);}if(e.target.name==='opener')form.querySelectorAll('label.cap-chip').forEach(l=>l.classList.toggle('active',l.querySelector('input').checked));});
  bind(form,'submit',e=>{e.preventDefault();cap=load();cap.title=form.elements.title.value.trim()||'Our time capsule';cap.openDate=date.value;cap.opener=form.elements.opener.value;save();location.hash='capsuleEditor';});
}

/* ---------------- Editor (Figma 61:1177) ---------------- */
function editorMarkup(c){ctx=c;cap=load();
return `<section class="screen cap-screen cap-editor">${backdrop()}
<header class="cap-top"><button class="icon-button" data-go="capsuleSetup" aria-label="Back to capsule details">${c.icon('back')}</button><div class="cap-title"><h1>${esc(cap.title)} <span>draft</span></h1><small>${I.lock} Opens ${dateLabel(cap.openDate)}</small></div><button class="cap-seal" data-go="capsuleSeal">Seal</button></header>
<button class="cap-preview" data-cap-full aria-label="Expand preview to full screen">${stageHTML()}<span class="cap-expand">${I.expand}</span></button>
<div class="cap-transport"><button class="cap-play" data-cap-play aria-label="Play">${I.play}</button><div class="cap-scrub" id="cap-scrub" role="slider" tabindex="0" aria-label="Scrub" aria-valuemin="0"><i id="cap-scrub-fill"></i></div><span class="cap-time" id="cap-time">00:00</span></div>
<div class="cap-tracks">
<div class="cap-row"><button class="cap-add" data-cap-tool="clip" aria-label="Add clips">${I.plus}</button><div class="cap-track" id="cap-track" aria-label="Clip timeline. Scroll to scrub, hold to cut or delete."><div class="cap-strip" id="cap-strip"></div></div><span class="cap-playhead" aria-hidden="true"><b></b></span></div>
<div class="cap-row"><button class="cap-disc ${cap.song?'has-song':''}" data-cap-tool="song" aria-label="${cap.song?'Change song':'Add a song'}"><span></span></button><button class="cap-audio" data-cap-tool="song" id="cap-audio">${audioLabel()}</button></div>
</div>
<p class="cap-hint" id="cap-hint">Hold the timeline to cut or delete a clip</p>
<nav class="cap-toolbar" aria-label="Editing tools">${[['clip','Clip',I.plus],['text','Text',I.text],['cut','Cut',I.cut],['delete','Delete',I.trash],['undo','Undo',I.undo]].map(([k,l,svg])=>`<button data-cap-tool="${k}"><span>${svg}</span><small>${l}</small></button>`).join('')}</nav>
<div class="cap-menu" id="cap-menu" role="menu" hidden><button data-cap-menu="cut" role="menuitem">${I.cut} Cut here</button><button data-cap-menu="delete" role="menuitem">${I.trash} Delete clip</button><button data-cap-menu="cancel" role="menuitem">Cancel</button></div>
<div class="cap-full" id="cap-full" hidden><button class="cap-full-close" data-cap-close aria-label="Close full screen preview">${c.icon('close')}</button>${stageHTML('full')}<div class="cap-full-bar"><i id="cap-full-fill"></i></div></div>
<div class="cap-sheet-scrim" id="cap-scrim" hidden></div><div class="cap-sheet" id="cap-sheet" role="dialog" aria-modal="true" hidden></div>
</section>`;}
function audioLabel(){const s=SONGS.find(x=>x[0]===cap.song);return s?`<span class="cap-wave" aria-hidden="true">${Array.from({length:42},(_,i)=>`<i style="height:${30+Math.round(Math.abs(Math.sin(i*1.7)+Math.sin(i*.6))*30)}%"></i>`).join('')}</span><span class="cap-song-name">${s[1]}</span>`:'<span class="cap-audio-empty">Add a song</span>';}
function stripHTML(){return cap.clips.map((c,i)=>{const thumb=c.type==='photo'?`assets/constellation/thumbs/${c.src}.jpg`:c.type==='video'?`assets/reels/posters/${c.src}.jpg`:`assets/constellation/thumbs/${c.bg}.jpg`;
  const label=c.type==='text'?esc(c.lines[0]):c.type==='message'?'Message':c.type==='video'?'Video':'';
  return `<div class="cap-clip type-${c.type}" data-i="${i}" style="width:${c.dur*PX}px"><span style="background-image:url('${thumb}')">${label?`<em>${label}</em>`:''}<b>${c.dur.toFixed(1)}s</b></span></div>`;}).join('');}

function mountEditor(c,bind){
  ctx=c;on=bind;cap=load();t=0;playing=false;history=[];fullscreen=false;
  const root=document.querySelector('.cap-editor');if(!root)return;
  const track=document.getElementById('cap-track'),strip=document.getElementById('cap-strip');
  const redraw=()=>{strip.innerHTML=stripHTML();layoutStrip();setTime(Math.min(t,total()-.01),true);};
  const layoutStrip=()=>{const pad=track.clientWidth/2;strip.style.paddingLeft=strip.style.paddingRight=`${pad}px`;};
  layoutStrip();strip.innerHTML=stripHTML();
  bind(window,'resize',layoutStrip);
  bind(track,'scroll',()=>{if(playing||Math.abs(track.scrollLeft-t*PX)<1.5)return;t=Math.min(total()-.001,track.scrollLeft/PX);render(true);});
  // Hold on the timeline to cut or delete at the playhead.
  let downAt=null;
  bind(track,'pointerdown',e=>{downAt=[e.clientX,e.clientY];clearTimeout(holdTimer);holdTimer=setTimeout(()=>{openMenu();},480);});
  bind(track,'pointermove',e=>{if(downAt&&Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>8)clearTimeout(holdTimer);});
  bind(track,'pointerup',()=>{clearTimeout(holdTimer);downAt=null;});
  bind(track,'pointercancel',()=>{clearTimeout(holdTimer);downAt=null;});
  bind(track,'contextmenu',e=>e.preventDefault());
  // Scrub bar
  const scrub=document.getElementById('cap-scrub');
  const scrubTo=e=>{const r=scrub.getBoundingClientRect();setTime(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*total(),true);};
  bind(scrub,'pointerdown',e=>{try{scrub.setPointerCapture(e.pointerId);}catch{}scrubTo(e);});
  bind(scrub,'pointermove',e=>{if(scrub.hasPointerCapture?.(e.pointerId))scrubTo(e);});
  bind(scrub,'keydown',e=>{const d={ArrowLeft:-1,ArrowRight:1}[e.key];if(!d)return;e.preventDefault();setTime(t+d,true);});
  bind(root,'click',e=>onClick(e,redraw));
  bind(document,'keydown',e=>{if(e.key==='Escape'){if(fullscreen)closeFull();else{closeSheet();closeMenu();}}if(e.key===' '&&e.target===document.body){e.preventDefault();togglePlay();}});
  setTime(0,true);
  last=performance.now();
  const tick=now=>{raf=requestAnimationFrame(tick);const dt=(now-last)/1000;last=now;if(!playing)return;t+=dt;if(t>=total()){t=total();togglePlay(false);}render(false);};
  raf=requestAnimationFrame(tick);
}
function stopEditor(){cancelAnimationFrame(raf);clearTimeout(holdTimer);playing=false;document.querySelectorAll('.cap-screen video').forEach(v=>v.pause());}
function setTime(time,scrubbing){t=Math.max(0,Math.min(total()-.001,time));render(scrubbing,true);}
function render(scrubbing,syncTrack){
  const T=total(),track=document.getElementById('cap-track');if(!track)return;
  document.getElementById('cap-time').textContent=fmt(t);
  document.getElementById('cap-scrub-fill').style.width=`${(t/T*100).toFixed(2)}%`;
  const scrub=document.getElementById('cap-scrub');scrub.setAttribute('aria-valuemax',Math.round(T));scrub.setAttribute('aria-valuenow',Math.round(t));scrub.setAttribute('aria-valuetext',fmt(t));
  if(playing||syncTrack){const target=t*PX;if(Math.abs(track.scrollLeft-target)>.5)track.scrollLeft=target;}
  const hit=at(t);document.querySelectorAll('.cap-clip').forEach(el=>el.classList.toggle('current',+el.dataset.i===hit?.index));
  paint(document.querySelector('.cap-preview .cap-stage'),t,scrubbing);
  if(fullscreen){paint(document.querySelector('.cap-full .cap-stage'),t,scrubbing);document.getElementById('cap-full-fill').style.width=`${(t/T*100).toFixed(2)}%`;}
}
function togglePlay(force){
  playing=force??!playing;if(playing&&t>=total()-.05)t=0;last=performance.now();
  const b=document.querySelector('[data-cap-play]');if(b){b.innerHTML=playing?I.pause:I.play;b.setAttribute('aria-label',playing?'Pause':'Play');}
  document.querySelector('.cap-disc')?.classList.toggle('spinning',playing&&!!cap.song);
  if(!playing)document.querySelectorAll('.cap-screen video').forEach(v=>v.pause());
  render(!playing);
}
function snapshot(){history.push(JSON.stringify(cap.clips));if(history.length>30)history.shift();}
function cutAtPlayhead(redraw){const hit=at(t);if(!hit)return;const {clip,index,local}=hit;
  if(local<MIN_CLIP||clip.dur-local<MIN_CLIP){ctx.toast('Move the playhead further into the clip to cut it.');return;}
  snapshot();const a={...clip,id:clip.id+'a',dur:+local.toFixed(2)},b={...clip,id:clip.id+'b'+Date.now(),dur:+(clip.dur-local).toFixed(2)};if(clip.type==='video')b.in=+(clip.in+local).toFixed(2);
  cap.clips.splice(index,1,a,b);save();redraw();ctx.toast('Clip cut at the playhead.');}
function deleteAtPlayhead(redraw){if(cap.clips.length<=1){ctx.toast('A capsule needs at least one clip.');return;}const hit=at(t);if(!hit)return;snapshot();cap.clips.splice(hit.index,1);save();t=Math.min(hit.start,total()-.01);redraw();ctx.toast('Clip deleted.');}
function openMenu(){const m=document.getElementById('cap-menu');if(!m)return;m.hidden=false;m.querySelector('button').focus({preventScroll:true});}
function closeMenu(){const m=document.getElementById('cap-menu');if(m)m.hidden=true;}
function openFull(){fullscreen=true;const f=document.getElementById('cap-full');f.hidden=false;f.querySelector('.cap-full-close').focus({preventScroll:true});render(true);if(!playing)togglePlay(true);}
function closeFull(){fullscreen=false;document.getElementById('cap-full').hidden=true;document.querySelector('.cap-full video')?.pause();togglePlay(false);document.querySelector('[data-cap-full]')?.focus({preventScroll:true});}

/* ---------------- Sheets: add clips, text, song ---------------- */
function openSheet(html){const s=document.getElementById('cap-sheet');s.innerHTML=`<div class="cap-sheet-grip" aria-hidden="true"></div>${html}`;s.hidden=false;document.getElementById('cap-scrim').hidden=false;s.querySelector('button,input,textarea')?.focus({preventScroll:true});}
function closeSheet(){const s=document.getElementById('cap-sheet');if(!s||s.hidden)return;s.hidden=true;document.getElementById('cap-scrim').hidden=true;}
function clipSheet(tab='photos'){const {PHOTOS,MESSAGES}=window.RibbonWeb.data;
  const tabs=`<div class="cap-tabs" role="tablist">${[['photos','Photos'],['videos','Videos'],['messages','Messages']].map(([k,l])=>`<button role="tab" aria-selected="${k===tab}" class="${k===tab?'active':''}" data-cap-tab="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(tab==='photos')body=`<div class="cap-pick-grid">${PHOTOS.map(p=>`<button class="cap-pick" data-cap-add="photo:${p[0]}" aria-label="Add photo: ${esc(p[6])}"><img src="assets/constellation/thumbs/${p[0]}.jpg" alt=""></button>`).join('')}</div>`;
  if(tab==='videos')body=`<div class="cap-pick-grid tall">${Object.keys(VIDEO_LEN).map(v=>`<button class="cap-pick" data-cap-add="video:${v}" aria-label="Add video"><img src="assets/reels/posters/${v}.jpg" alt=""><small>${VIDEO_LEN[v].toFixed(0)}s</small></button>`).join('')}</div>`;
  if(tab==='messages')body=`<div class="cap-pick-texts">${MESSAGES.map(m=>`<button data-cap-add="message:${m[0]}">${esc(m[1])}</button>`).join('')}</div>`;
  openSheet(`<h2>Add to the story</h2><p>Added at the playhead (${fmt(t)}).</p>${tabs}${body}`);}
function textSheet(){openSheet(`<h2>Add a text card</h2><p>Something to say to each other when you open it.</p><form class="cap-text-form" data-cap-text-form><input name="l1" placeholder="Hey..." maxlength="40" aria-label="First line" required><input name="l2" placeholder="Remember when we first met?" maxlength="60" aria-label="Second line"><div class="cap-text-ideas">${['Open this when you miss me','Look how far we’ve come','Still my favorite person','Same time next year?'].map(x=>`<button type="button" data-cap-idea="${esc(x)}">${esc(x)}</button>`).join('')}</div><button class="cap-primary">Add text card</button></form>`);}
function songSheet(){openSheet(`<h2>Add a song</h2><p>Demo tracks. They show on the timeline but don’t play in this prototype.</p><div class="cap-songs">${SONGS.map(([k,n,d])=>`<button class="${cap.song===k?'active':''}" data-cap-song="${k}"><span class="cap-mini-disc" aria-hidden="true"></span><span><strong>${n}</strong><small>${d}</small></span></button>`).join('')}${cap.song?'<button data-cap-song="">Remove song</button>':''}</div>`);}
function insertClip(clip,redraw){snapshot();const hit=at(t),index=hit?(hit.local>hit.clip.dur/2?hit.index+1:hit.index):cap.clips.length;cap.clips.splice(index,0,clip);save();t=cap.clips.slice(0,index).reduce((s,c)=>s+c.dur,0)+.01;closeSheet();redraw();ctx.toast('Added to the timeline.');}

function onClick(e,redraw){
  if(e.target.id==='cap-scrim')return closeSheet();
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.capPlay!==undefined)return togglePlay();
  if(b.dataset.capFull!==undefined)return openFull();
  if(b.dataset.capClose!==undefined)return closeFull();
  if(b.dataset.capMenu){closeMenu();if(b.dataset.capMenu==='cut')cutAtPlayhead(redraw);if(b.dataset.capMenu==='delete')deleteAtPlayhead(redraw);return;}
  const tool=b.dataset.capTool;
  if(tool==='clip')return clipSheet();
  if(tool==='text'){textSheet();const form=document.querySelector('[data-cap-text-form]');form.addEventListener('submit',ev=>{ev.preventDefault();insertClip({id:'t'+Date.now(),type:'text',lines:[form.l1.value.trim(),form.l2.value.trim()],bg:['m18','m11','m05','m19'][Math.floor(Math.random()*4)],dur:4},redraw);});return;}
  if(tool==='song')return songSheet();
  if(tool==='cut')return cutAtPlayhead(redraw);
  if(tool==='delete')return deleteAtPlayhead(redraw);
  if(tool==='undo'){if(!history.length){ctx.toast('Nothing to undo.');return;}cap.clips=JSON.parse(history.pop());save();redraw();return;}
  if(b.dataset.capTab)return clipSheet(b.dataset.capTab);
  if(b.dataset.capAdd){const [type,id]=b.dataset.capAdd.split(':');const stamp='n'+Date.now();
    if(type==='photo')insertClip({id:stamp,type:'photo',src:id,dur:3},redraw);
    if(type==='video')insertClip({id:stamp,type:'video',src:id,in:0,dur:Math.min(6,VIDEO_LEN[id])},redraw);
    if(type==='message')insertClip({id:stamp,type:'message',msg:id,bg:msg(id)[6][0],dur:4},redraw);return;}
  if(b.dataset.capIdea){const f=document.querySelector('[data-cap-text-form]');f.l1.value=b.dataset.capIdea;f.l2.focus();return;}
  if(b.dataset.capSong!==undefined){cap.song=b.dataset.capSong||null;save();document.getElementById('cap-audio').innerHTML=audioLabel();const disc=document.querySelector('.cap-disc');disc.classList.toggle('has-song',!!cap.song);disc.setAttribute('aria-label',cap.song?'Change song':'Add a song');closeSheet();return;}
}

/* ---------------- Seal + open ---------------- */
function sealMarkup(c){ctx=c;cap=load();const n=daysUntil(cap.openDate);
return `<section class="screen cap-screen cap-sealed">${backdrop()}
<header class="tpl-top"><button class="icon-button" data-go="capsuleEditor" aria-label="Back to editor">${c.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="cap-orb" aria-hidden="true"><img src="assets/constellation/thumbs/m18.jpg" alt=""><span>${I.lock}</span></div>
<div class="tpl-intro"><h1>${esc(cap.title)}</h1><p>Sealed until ${dateLabel(cap.openDate)}. That’s ${n.toLocaleString()} ${n===1?'day':'days'} from now.</p></div>
${window.RibbonTemplates.shareCard(cap.opener==='both'?'For both of you':`For ${esc(c.person)}`,'Capsule link','Shows a countdown until the open date, then plays your story.','capsuleOpen')}
<p class="tpl-note">Prototype: the link works in this browser only, and nothing is actually locked.</p></section>`;}
function openMarkup(c){ctx=c;cap=load();const n=daysUntil(cap.openDate);
return `<section class="screen cap-screen cap-open">${backdrop()}
<header class="tpl-top"><button class="icon-button" data-go="capsuleSeal" aria-label="Back">${c.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="cap-locked" id="cap-locked"><div class="cap-orb" aria-hidden="true"><img src="assets/constellation/thumbs/m18.jpg" alt=""><span>${I.lock}</span></div><small>A time capsule from you</small><h1>${esc(cap.title)}</h1>
<div class="cap-count">${countdownParts(cap.openDate).map(([v,l])=>`<span><b>${v}</b>${l}</span>`).join('')}</div><p>Opens ${dateLabel(cap.openDate)}</p>
<button class="cap-ghost" data-cap-peek>Preview the opening (demo)</button></div>
<div class="cap-full open-view" id="cap-full" hidden><button class="cap-full-close" data-cap-close aria-label="Close">${c.icon('close')}</button>${stageHTML('full')}<div class="cap-full-bar"><i id="cap-full-fill"></i></div></div>
</section>`;}
function countdownParts(iso){const ms=Math.max(0,new Date(iso+'T00:00:00')-new Date()),d=Math.floor(ms/864e5),h=Math.floor(ms/36e5)%24,m=Math.floor(ms/6e4)%60;return [[d.toLocaleString(),d===1?'day':'days'],[h,'hrs'],[m,'min']];}
function mountOpen(c,bind){ctx=c;cap=load();t=0;playing=false;const root=document.querySelector('.cap-open');if(!root)return;
  let loop=0;const T=total();
  const tick=now=>{loop=requestAnimationFrame(tick);if(!playing)return;const dt=(now-last)/1000;last=now;t+=dt;if(t>=T){t=0;}paint(root.querySelector('.cap-full .cap-stage'),t,false);document.getElementById('cap-full-fill').style.width=`${t/T*100}%`;};
  bind(root,'click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.capPeek!==undefined){document.getElementById('cap-full').hidden=false;playing=true;last=performance.now();t=0;loop=requestAnimationFrame(tick);root.querySelector('.cap-full-close').focus({preventScroll:true});}
    if(b.dataset.capClose!==undefined){playing=false;cancelAnimationFrame(loop);document.getElementById('cap-full').hidden=true;root.querySelectorAll('video').forEach(v=>v.pause());}});
  bind(document,'keydown',e=>{if(e.key==='Escape'&&!document.getElementById('cap-full').hidden)root.querySelector('[data-cap-close]').click();});
  openStop=()=>{playing=false;cancelAnimationFrame(loop);root.querySelectorAll('video').forEach(v=>v.pause());};
}
let openStop=()=>{};

/* ---------------- Widget capsules ---------------- */
const WIDGETS={
  capsuleDaily:{label:'Daily capsule',title:'A note every morning',when:'Every day at 8:00',items:['You’re braver than you think.','Drink water. Text me back.','Today is a good day for a walk.','Someone is proud of you (me).','Remember the field dance? Do it again.'],widget:i=>`<small>Today’s note</small><p>“${esc(i[0])}”</p><span>from you</span>`},
  capsuleMonthly:{label:'Monthly capsule',title:'A new photo each month',when:'On the 1st of every month',items:['October: the month we met.','November: soup season, our tradition.','December: the sleepover marathon.'],widget:i=>`<img src="assets/constellation/thumbs/m05.jpg" alt=""><small>October with you</small><p>${esc(i[0].split(': ')[1]||i[0])}</p>`},
  capsuleYearly:{label:'Yearly capsule',title:'A letter every birthday',when:'Every October 24',items:['Chapter 2: the year we got braver.','Chapter 3: what I hope for you.'],widget:i=>`<small>Oct 24 · unlocked</small><p>${esc(i[0])}</p><span>Chapter 2 of ∞</span>`}
};
function widgetMarkup(name){return c=>{ctx=c;const w=WIDGETS[name],saved=store.get(`ribbon-${name}-v1-${c.person}`,null),items=saved||w.items;
return `<section class="screen cap-screen cap-widget-screen">${backdrop('m05')}
<header class="tpl-top"><button class="icon-button" data-go="capsuleTemplates" aria-label="Back">${c.icon('back')}</button><span class="cap-eyebrow">${w.label}</span><span class="tpl-spacer"></span></header>
<div class="cap-phone" aria-label="Widget preview on ${esc(c.person)}’s home screen"><div class="cap-phone-apps" aria-hidden="true">${'<i></i>'.repeat(8)}</div><div class="cap-widget" id="cap-widget">${w.widget(items)}</div><div class="cap-phone-apps" aria-hidden="true">${'<i></i>'.repeat(4)}</div></div>
<div class="cap-widget-form"><h1>${w.title}</h1><p>${w.when} on ${esc(c.person)}’s home screen. Edit what they’ll see.</p>
<ol class="cap-entries" id="cap-entries">${items.map((x,i)=>`<li><textarea rows="1" data-cap-entry="${i}" aria-label="Entry ${i+1}">${esc(x)}</textarea></li>`).join('')}</ol>
<button class="cap-ghost" data-cap-entry-add>${I.plus} Add another</button>
<button class="cap-primary" data-cap-widget-save>Set up the widget</button></div></section>`;};}
function widgetMount(name){return (c,bind)=>{ctx=c;const root=document.querySelector('.cap-widget-screen');if(!root)return;const k=`ribbon-${name}-v1-${c.person}`,w=WIDGETS[name];
  const items=()=>[...root.querySelectorAll('[data-cap-entry]')].map(x=>x.value.trim()).filter(Boolean);
  const refresh=()=>{const list=items();store.set(k,list);document.getElementById('cap-widget').innerHTML=w.widget(list.length?list:w.items);};
  bind(root,'input',e=>{if(e.target.dataset.capEntry!==undefined)refresh();});
  bind(root,'click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.capEntryAdd!==undefined){const ol=document.getElementById('cap-entries'),li=document.createElement('li');li.innerHTML=`<textarea rows="1" data-cap-entry="${ol.children.length}" aria-label="Entry ${ol.children.length+1}"></textarea>`;ol.appendChild(li);li.querySelector('textarea').focus();}
    if(b.dataset.capWidgetSave!==undefined){refresh();c.toast(`Prototype: the ${w.label.toLowerCase()} is saved here but not installed as a widget.`);}});
};}

// Lets a draft open the editor under its own title.
window.RibbonCapsule={prepare(person,title){const k=`ribbon-capsule-v1-${person}`,c=store.get(k,null)||seed();c.title=title;store.set(k,c);}};
window.RibbonTemplates.register({
  capsuleTemplates:{markup:pickerMarkup},
  capsuleSetup:{markup:setupMarkup,mount:mountSetup},
  capsuleEditor:{markup:editorMarkup,mount:mountEditor,unmount:stopEditor},
  capsuleSeal:{markup:sealMarkup,mount:(c)=>{ctx=c;cap=load();cap.sealed=true;save();}},
  capsuleOpen:{markup:openMarkup,mount:mountOpen,unmount:()=>openStop()},
  capsuleDaily:{markup:widgetMarkup('capsuleDaily'),mount:widgetMount('capsuleDaily')},
  capsuleMonthly:{markup:widgetMarkup('capsuleMonthly'),mount:widgetMount('capsuleMonthly')},
  capsuleYearly:{markup:widgetMarkup('capsuleYearly'),mount:widgetMount('capsuleYearly')}
});
})();
