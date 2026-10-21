/* Ribbon storybook templates: a reel recap (Figma 61:1104) plus concept cards for other storybook formats.
   Registers its screens with RibbonTemplates. Loaded after templates.js, before app.js. */
(()=>{
'use strict';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
const SVG={
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-8.8 1 5.5 5.5 0 0 0-8.8-1C-1 9 5 15 12 21c7-6 13-12 8.8-16.4Z"/></svg>',
  comment:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  muted:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5ZM23 9l-6 6M17 9l6 6"/></svg>',
  sound:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>',
  photo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>',
  video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="14" rx="3"/><path d="m16 10 6-3v10l-6-3"/></svg>',
  text:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.4A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 10h8M8 13.5h5"/></svg>',
  friends:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12.5A2 2 0 0 0 8.5 21h7a2 2 0 0 0 2-1.5L18.5 7M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/></svg>',
  pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
  replay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>'
};

// Clips "from friends" (the provided videos, converted to 540p).
const LIBRARY=[
  {id:'v1',from:'Jo',caption:'office dance break, as promised. happy birthday!!'},
  {id:'v2',from:'Priya',caption:'the sunset hike where you refused to turn back 🌅'},
  {id:'v3',from:'Sam',caption:'moving day crew. you carried the heaviest box and never let us forget it'},
  {id:'v4',from:'Jo',caption:'the pier, your favorite walk',wide:true},
  {id:'v5',from:'Lena',caption:'golden hour over the bridge, thinking of you'},
  {id:'v6',from:'Priya',caption:'the concert that ruined our ears (worth it)'},
  {id:'v7',from:'Sam',caption:'your first apartment tour 🏠'},
  {id:'v8',from:'Lena',caption:'SF trip, day one. same time next year?'}
];
const clip=id=>LIBRARY.find(c=>c.id===id);
const PHOTO_MS=2600,MEME_MS=5000;

let ctx=null,on=null,mode='edit',reel=null,active=-1,timer=0,raf=0,started=0,soundOn=false,io=null,uploads=[],sheetPick=new Set();
let paused=false,pausedAt=0,photoIndex=0,photoTouched=0,insertAt=null,selected=0;
const key=()=>`ribbon-reels-v1-${ctx.person}`;
function seed(){return {title:`${ctx.person}’s Reels`,slides:[
  {id:'s1',kind:'video',clip:'v2',likes:24,comments:[{name:'Jo',text:'THE HIKE 😭'},{name:'Sam',text:'never again. ok maybe again'}]},
  {id:'s2',kind:'photos',photos:['m05','m18','m11','m19'],from:'You',caption:'summer, in four parts',likes:31,comments:[{name:'Priya',text:'the field dance!!!'}]},
  {id:'s3',kind:'video',clip:'v3',likes:17,comments:[]},
  {id:'s4',kind:'meme',msg:'t10',photo:'m17',likes:42,comments:[{name:'Lena',text:'who raised you is sending me'}]},
  {id:'s5',kind:'video',clip:'v5',likes:20,comments:[]},
  {id:'s6',kind:'video',clip:'v1',likes:15,comments:[{name:'Priya',text:'iconic behavior'}]},
  {id:'s7',kind:'video',clip:'v6',likes:28,comments:[]}
]};}
const load=()=>store.get(key(),null)||seed();
const save=()=>store.set(key(),{...reel,slides:reel.slides.filter(s=>!s.transient)});
const msg=id=>window.RibbonWeb.data.MESSAGES.find(m=>m[0]===id);

/* ------------------------------------------------ Storybook picker */
const CONCEPTS=[
  ['book','Flippable children’s book','Page-turning illustrated story of how you met.'],
  ['postcard','Trip postcards','Customize postcards with stickers and doodles you upload.'],
  ['vlog','Mini vlog','A photo dump and short clips, cut together like a vlog.'],
  ['slides','Photo slideshow','Your favorite photos with captions and music.'],
  ['memes','Messages as memes','Your funniest texts, turned into memes.']
];
function pickerMarkup(c){return `<section class="screen tpl-picker ribbon-home glass-screen">${c.atmosphere()}
<header class="tpl-top"><button class="icon-button" data-go="home" aria-label="Back to home">${c.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>Pick a storybook</h1><p>Tell the story of you and ${esc(c.person)} as something to watch, flip or send.</p></div>
<div class="tpl-picks">
<button class="tpl-pick tpl-pick-reels" data-go="reels"><span class="tpl-pick-art" aria-hidden="true"><img src="assets/reels/posters/v2.jpg" alt=""><i class="reels-mini-rail">${SVG.heart}${SVG.comment}${SVG.send}</i><i class="reels-mini-bar"></i></span><span><strong>Reel recap</strong><small>Clips and wishes from ${esc(c.person)}’s friends, cut together like a reel.</small></span>${c.icon('arrow')}</button>
<button class="tpl-pick tpl-pick-memory" data-create-format="storybook"><span class="tpl-pick-art" aria-hidden="true"><img src="assets/constellation/thumbs/m05.jpg" alt=""><img src="assets/constellation/thumbs/m15.jpg" alt=""></span><span><strong>Classic storybook</strong><small>Chapters of your moments, in your own words.</small></span>${c.icon('arrow')}</button>
<p class="tpl-section-label">More ideas, coming soon</p>
${CONCEPTS.map(([k,t,d])=>`<button class="tpl-pick tpl-concept" data-reels-concept="${esc(t)}"><span class="tpl-pick-art concept-${k}" aria-hidden="true"></span><span><strong>${t}</strong><small>${d}</small></span><span class="tpl-soon">Concept</span></button>`).join('')}
</div></section>`;}

/* ------------------------------------------------ Reel feed */
function slideHTML(s,i){
  const edit=mode==='edit',remove='';
  if(s.kind==='video'||s.kind==='upload-video'){
    const c=s.kind==='video'?clipFor(s):{from:s.from||'You',caption:s.caption||'',wide:false};
    const src=s.kind==='video'?`assets/reels/${s.clip}.mp4`:s.url,poster=s.kind==='video'?`assets/reels/posters/${s.clip}.jpg`:'';
    return `<article class="reel ${c.wide?'wide':''}" data-i="${i}" data-kind="video">${c.wide?`<img class="reel-backdrop" src="${poster}" alt="">`:''}<video src="${src}" ${poster?`poster="${poster}"`:''} muted playsinline preload="${i<2?'auto':'metadata'}" ${edit?'loop':''}></video>${caption(c.from,c.caption)}${remove}</article>`;
  }
  if(s.kind==='photos'||s.kind==='upload-photos'){
    const srcs=s.kind==='photos'?s.photos.map(p=>`assets/constellation/thumbs/${p}.jpg`):s.urls;
    return `<article class="reel reel-photos" data-i="${i}" data-kind="photos" style="--n:${srcs.length}"><div class="reel-photo-track">${srcs.map(u=>`<img src="${u}" alt="" draggable="false">`).join('')}</div><div class="reel-dots">${srcs.map((_,k)=>`<i class="${k===0?'on':''}"></i>`).join('')}</div>${caption(s.from||'You',s.caption||`${srcs.length} photos`)}${remove}</article>`;
  }
  if(s.kind==='meme'){const m=msg(s.msg);
    return `<article class="reel reel-meme" data-i="${i}" data-kind="meme"><img src="assets/constellation/thumbs/${s.photo}.jpg" alt=""><p class="reel-meme-top">${esc(m?.[1]||'')}</p><p class="reel-meme-bottom">${esc(ctx.person)}, ${esc(window.RibbonWeb.data.TIMES[m?.[4]]||'')}</p>${caption('You',`sent over ${m?.[5]||'text'}, framed forever`)}${remove}</article>`;}
  return '';
}
function caption(from,text){return `<div class="reel-caption"><span class="reel-avatar" data-avatar="${esc(from)}">${esc(from[0])}</span><div><strong>${esc(from)}</strong><p>${esc(text)}</p></div></div>`;}
function emptySlide(i){return `<article class="reel reel-empty" data-i="${i}" data-kind="empty"><p>Add media and mementos from ${esc(ctx.person)}’s friends!</p><div class="reel-add-grid">
<button class="wide" data-reels-sheet="photos">${SVG.plus}<span>${SVG.photo}Photos</span></button><button data-reels-sheet="videos">${SVG.plus}<span>${SVG.video}Videos</span></button>
<button data-reels-sheet="texts">${SVG.plus}<span>${SVG.text}Texts</span></button><button class="wide" data-reels-sheet="friends">${SVG.plus}<span>${SVG.friends}Ask friends</span></button></div></article>`;}
function endSlide(i){const friends=new Set(reel.slides.map(s=>s.kind==='video'?clipFor(s).from:null).filter(Boolean));
  return `<article class="reel reel-end" data-i="${i}" data-kind="end"><span class="reel-end-mark">✳</span><h2>Happy birthday, ${esc(ctx.person)}</h2><p>From you and ${friends.size} ${friends.size===1?'friend':'friends'}</p><button data-reels-replay>${SVG.replay}Watch again</button></article>`;}

function feedMarkup(c,m){
  mode=m;ctx=c;reel=load();
  const edit=m==='edit',total=reel.slides.length;
  return `<section class="screen reels" data-mode="${m}" data-theme="dark">
<div class="reels-feed" id="reels-feed">${reel.slides.map(slideHTML).join('')}${edit?emptySlide(total):endSlide(total)}</div>
<header class="reels-top"><button class="reels-icon" data-go="${edit?'storybookTemplates':m==='watch'?'home':'reels'}" aria-label="${edit?'Back to templates':m==='watch'?'Close':'Back to editor'}">${c.icon(edit?'back':'close')}</button><h1>${esc(reel.title)}</h1><span aria-hidden="true"></span></header>
<div class="reels-tools">${edit?`<button class="reels-icon reels-trash" data-reels-remove-active aria-label="Remove this slide">${SVG.trash}</button><button class="reels-icon" data-go="reelsEdit" aria-label="Edit the order of the reel">${SVG.pencil}</button>`:''}<button class="reels-icon" data-reels-sound aria-pressed="false" aria-label="Turn sound on">${SVG.muted}</button></div>
<span class="reels-paused" aria-hidden="true">${SVG.play}</span>
<div class="reels-rail" id="reels-rail"><button data-reels-like aria-pressed="false" aria-label="Like"><span>${SVG.heart}</span><small id="reels-likes">0</small></button><button data-reels-comments aria-label="Comments"><span>${SVG.comment}</span><small id="reels-comment-count">0</small></button><button data-reels-share aria-label="Share"><span>${SVG.send}</span><small>Share</small></button></div>
<div class="reels-progress" aria-hidden="true"><i id="reels-progress"></i></div>
${edit?`<nav class="reels-bar" aria-label="Reel actions"><button data-reels-jump-empty>${SVG.plus}<span>Add</span></button><button data-go="reelsPreview">${SVG.eye}<span>Preview</span></button><button class="primary" data-go="reelsSend">${SVG.send}<span>Send</span></button></nav>`:m==='preview'?`<nav class="reels-bar"><button data-go="reels">${c.icon('back')}<span>Keep editing</span></button><button class="primary" data-go="reelsSend">${SVG.send}<span>Send</span></button></nav>`:''}
<div class="reels-sheet-scrim" id="reels-scrim" hidden></div><div class="reels-sheet" id="reels-sheet" role="dialog" aria-modal="true" hidden></div>
<input type="file" id="reels-file" accept="image/*,video/*" multiple hidden>
</section>`;
}

function mountFeed(c,bind){
  ctx=c;on=bind;active=-1;soundOn=false;
  const root=document.querySelector('.reels');if(!root)return;
  const feed=document.getElementById('reels-feed');
  io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.6)activate(+e.target.dataset.i);});},{root:feed,threshold:[.6]});
  feed.querySelectorAll('.reel').forEach(el=>io.observe(el));
  on(root,'click',onClick);
  on(document.getElementById('reels-file'),'change',onFiles);
  on(document,'visibilitychange',()=>{const v=currentVideo();if(!v)return;document.hidden?v.pause():v.play().catch(()=>{});});
  on(root,'keydown',e=>{if(e.key==='Escape')closeSheet();});
  on(feed,'scroll',onPhotoScroll,{capture:true,passive:true});
  on(feed,'pointerdown',onPhotoDown);on(document,'pointermove',onPhotoMove);on(document,'pointerup',onPhotoUp);
  on(feed,'wheel',e=>{if(e.target.closest('.reel-photo-track')&&Math.abs(e.deltaX)>Math.abs(e.deltaY))photoTouched=performance.now();},{passive:true});
  activate(0);
  const tick=()=>{raf=requestAnimationFrame(tick);progress();};raf=requestAnimationFrame(tick);
}
function stopAll(){cancelAnimationFrame(raf);clearInterval(timer);clearTimeout(timer);paused=false;photoDrag=null;io?.disconnect();document.querySelectorAll('.reels video').forEach(v=>{v.pause();v.onended=null;});active=-1;}

function slideEl(i){return document.querySelector(`.reels .reel[data-i="${i}"]`);}
function currentVideo(){return slideEl(active)?.querySelector('video');}
function activate(i){
  if(i===active)return;
  const prev=slideEl(active);prev?.querySelector('video')?.pause();
  active=i;clearInterval(timer);clearTimeout(timer);started=performance.now();setPaused(false);
  const el=slideEl(i),kind=el?.dataset.kind,root=document.querySelector('.reels');
  root.dataset.theme=kind==='empty'?'light':'dark';
  root.classList.toggle('no-media',kind==='empty'||kind==='end');
  const v=el?.querySelector('video');
  if(v){v.currentTime=0;v.muted=!soundOn;v.play().catch(()=>{});if(mode!=='edit')v.onended=()=>next();}
  if(kind==='photos'){const track=el.querySelector('.reel-photo-track'),n=track.children.length;photoIndex=0;track.scrollLeft=0;markDots(el,0);
    timer=setInterval(()=>{if(paused||performance.now()-photoTouched<PHOTO_MS)return;let k=photoIndex+1;if(k>=n){if(mode!=='edit'){clearInterval(timer);return next();}k=0;}track.scrollTo({left:k*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});},PHOTO_MS);}
  if(kind==='meme'&&mode!=='edit')timer=setTimeout(next,MEME_MS);
  if(mode!=='edit'&&active===reel.slides.length)clearInterval(timer);
  updateRail();
}
function next(){const feed=document.getElementById('reels-feed');if(!feed)return;const el=slideEl(active+1);if(el)feed.scrollTo({top:el.offsetTop,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
function markDots(el,k){el.querySelectorAll('.reel-dots i').forEach((d,n)=>d.classList.toggle('on',n===k));}
function onPhotoScroll(e){const track=e.target;if(!track.classList?.contains('reel-photo-track'))return;const k=Math.round(track.scrollLeft/track.clientWidth);if(k!==photoIndex&&track.closest('.reel')===slideEl(active)){photoIndex=k;started=performance.now();markDots(track.closest('.reel'),k);}}
// Mouse users can drag the photo dump sideways; touch and trackpads scroll it natively.
let photoDrag=null,dragged=0;
function onPhotoDown(e){const track=e.target.closest('.reel-photo-track');if(!track)return;photoTouched=performance.now();if(e.pointerType!=='mouse')return;photoDrag={track,x:e.clientX,left:track.scrollLeft,moved:false};track.style.scrollSnapType='none';}
function onPhotoMove(e){if(!photoDrag)return;const dx=e.clientX-photoDrag.x;if(Math.abs(dx)>5)photoDrag.moved=true;photoDrag.track.scrollLeft=photoDrag.left-dx;photoTouched=performance.now();}
function onPhotoUp(){if(!photoDrag)return;const {track,moved}=photoDrag;photoDrag=null;if(moved)dragged=performance.now();const k=Math.round(track.scrollLeft/track.clientWidth);track.scrollTo({left:k*track.clientWidth,behavior:'smooth'});setTimeout(()=>{track.style.scrollSnapType='';},350);}
// Tapping a slide pauses or plays it.
function setPaused(p){if(p===paused)return;const now=performance.now();if(p)pausedAt=now;else if(pausedAt){started+=now-pausedAt;pausedAt=0;}paused=p;
  const el=slideEl(active),v=el?.querySelector('video');if(v){p?v.pause():v.play().catch(()=>{});}
  if(el?.dataset.kind==='meme'&&mode!=='edit'){clearTimeout(timer);if(!p)timer=setTimeout(next,Math.max(400,MEME_MS-(now-started)));}
  document.querySelector('.reels')?.classList.toggle('is-paused',p);}
function progress(){
  const bar=document.getElementById('reels-progress');if(!bar||paused)return;
  const el=slideEl(active),kind=el?.dataset.kind;let p=0;
  if(kind==='video'){const v=el.querySelector('video');p=v.duration?v.currentTime/v.duration:0;}
  else if(kind==='photos'){const n=el.querySelectorAll('img').length;p=Math.min(1,(photoIndex+Math.min(1,(performance.now()-started)/PHOTO_MS))/n);}
  else if(kind==='meme'){p=Math.min(1,(performance.now()-started)/MEME_MS);if(mode==='edit'&&p>=1)started=performance.now();}
  bar.style.width=`${(p*100).toFixed(2)}%`;
}
function updateRail(){
  const s=reel.slides[active],like=document.querySelector('[data-reels-like]');if(!like)return;
  if(!s){return;}
  like.setAttribute('aria-pressed',!!s.liked);like.classList.toggle('liked',!!s.liked);
  document.getElementById('reels-likes').textContent=(s.likes||0)+(s.liked?1:0);
  document.getElementById('reels-comment-count').textContent=(s.comments||[]).length;
}

/* ------------------------------------------------ Sheets: add media, comments */
function openSheet(html){const sheet=document.getElementById('reels-sheet');sheet.innerHTML=`<div class="reels-sheet-grip" aria-hidden="true"></div>${html}`;sheet.hidden=false;document.getElementById('reels-scrim').hidden=false;sheetPick=new Set();sheet.querySelector('button,input')?.focus({preventScroll:true});}
function closeSheet(){const sheet=document.getElementById('reels-sheet');if(!sheet||sheet.hidden)return;sheet.hidden=true;document.getElementById('reels-scrim').hidden=true;}
function sheetFor(type){
  const {PHOTOS,MESSAGES}=window.RibbonWeb.data,used=new Set(reel.slides.filter(s=>s.kind==='video').map(s=>s.clip));
  if(type==='photos')return `<h2>Choose photos</h2><p>They’ll play as a photo dump, one after another.</p><div class="reels-pick-grid">${PHOTOS.map(p=>`<button class="reels-pick" data-reels-pick="${p[0]}" aria-pressed="false"><img src="assets/constellation/thumbs/${p[0]}.jpg" alt="${esc(p[6])}"><i></i></button>`).join('')}</div><div class="reels-sheet-actions"><button class="reels-ghost" data-reels-upload="image">Upload from device</button><button class="reels-primary" data-reels-confirm="photos" disabled>Add photos</button></div>`;
  if(type==='videos'){const avail=LIBRARY.filter(c=>!used.has(c.id));return `<h2>Choose videos</h2><p>Clips your friends shared. Each becomes its own slide.</p>${avail.length?`<div class="reels-pick-grid tall">${avail.map(c=>`<button class="reels-pick" data-reels-pick="${c.id}" aria-pressed="false"><img src="assets/reels/posters/${c.id}.jpg" alt=""><span>From ${esc(c.from)}</span><i></i></button>`).join('')}</div>`:'<p class="reels-empty-note">Every shared clip is already in the reel.</p>'}<div class="reels-sheet-actions"><button class="reels-ghost" data-reels-upload="video">Upload from device</button><button class="reels-primary" data-reels-confirm="videos" disabled>Add videos</button></div>`;}
  if(type==='texts')return `<h2>Pull in texts</h2><p>Each message becomes a meme over a photo from the same moment.</p><div class="reels-pick-texts">${MESSAGES.map(m=>`<button class="reels-text" data-reels-pick="${m[0]}" aria-pressed="false">${esc(m[1])}<small>${m[5]}</small></button>`).join('')}</div><div class="reels-sheet-actions"><button class="reels-primary" data-reels-confirm="texts" disabled>Add texts</button></div>`;
  return `<h2>Ask friends for clips</h2><p>Send this link. Friends pick a clip and write a wish, and it lands in the reel.</p><div class="reels-link"><code>${esc(location.origin+location.pathname+'#reelsAdd')}</code><button data-reels-copy="reelsAdd" aria-label="Copy link">Copy</button></div><div class="reels-sheet-actions"><button class="reels-ghost" data-reels-close>Done</button><button class="reels-primary" data-go="reelsAdd">Open friend’s view</button></div>`;
}
function insert(slides){
  if(insertAt!==null){reel.slides.splice(insertAt,0,...slides);selected=insertAt;insertAt=null;save();closeSheet();drawTimeline();ctx.toast(`Added ${slides.length} ${slides.length===1?'slide':'slides'}.`);return;}
  const at=reel.slides.length;reel.slides.push(...slides);save();
  const feed=document.getElementById('reels-feed'),empty=feed.querySelector('.reel-empty');
  slides.forEach((s,k)=>{const wrap=document.createElement('div');wrap.innerHTML=slideHTML(s,at+k);const el=wrap.firstElementChild;feed.insertBefore(el,empty);io.observe(el);});
  empty.dataset.i=reel.slides.length;
  closeSheet();
  const first=slideEl(at);feed.scrollTo({top:first.offsetTop,behavior:'smooth'});
  ctx.toast(`Added ${slides.length} ${slides.length===1?'slide':'slides'} to the reel.`);
}
function rebuild(){
  const feed=document.getElementById('reels-feed');io.disconnect();
  feed.innerHTML=reel.slides.map(slideHTML).join('')+(mode==='edit'?emptySlide(reel.slides.length):endSlide(reel.slides.length));
  feed.querySelectorAll('.reel').forEach(el=>io.observe(el));active=-1;
}
function onFiles(e){
  const files=[...e.target.files];if(!files.length)return;
  const images=files.filter(f=>f.type.startsWith('image/')),videos=files.filter(f=>f.type.startsWith('video/'));
  const slides=[];
  if(images.length)slides.push({id:'u'+Date.now(),kind:'upload-photos',urls:images.map(f=>URL.createObjectURL(f)),from:'You',caption:`${images.length} uploaded ${images.length===1?'photo':'photos'}`,transient:true,likes:0,comments:[]});
  videos.forEach((f,k)=>slides.push({id:'uv'+Date.now()+k,kind:'upload-video',url:URL.createObjectURL(f),from:'You',caption:f.name.replace(/\.[^.]+$/,''),transient:true,likes:0,comments:[]}));
  e.target.value='';
  if(slides.length){insert(slides);ctx.toast('Uploads play in this tab only. They aren’t saved in the prototype.');}
}
function commentsSheet(){const s=reel.slides[active];if(!s)return;
  openSheet(`<h2>Comments</h2><div class="reels-comments">${(s.comments||[]).map(c=>`<p><span class="reel-avatar" data-avatar="${esc(c.name)}">${esc(c.name[0])}</span><span><strong>${esc(c.name)}</strong>${esc(c.text)}</span></p>`).join('')||'<p class="reels-empty-note">No comments yet.</p>'}</div><form class="reels-comment-form" data-reels-comment-form><input name="comment" placeholder="Add a comment…" aria-label="Add a comment" autocomplete="off"><button class="reels-primary">Post</button></form>`);
  document.querySelector('[data-reels-comment-form]').addEventListener('submit',e=>{e.preventDefault();const input=e.target.comment,text=input.value.trim();if(!text)return;s.comments=[...(s.comments||[]),{name:'You',text}];save();updateRail();commentsSheet();});
}

function onClick(e){
  const b=e.target.closest('button');
  if(e.target.id==='reels-scrim'||b?.dataset.reelsClose!==undefined&&b)return closeSheet();
  if(!b){const slide=e.target.closest('.reel');if(slide&&slide===slideEl(active)&&!['empty','end'].includes(slide.dataset.kind)&&performance.now()-dragged>250)setPaused(!paused);return;}
  if(b.dataset.reelsRemoveActive!==undefined){const i=active;if(!reel.slides[i])return;const [gone]=reel.slides.splice(i,1);save();rebuild();const el=slideEl(Math.min(i,reel.slides.length));document.getElementById('reels-feed').scrollTo({top:el.offsetTop});activate(Math.min(i,reel.slides.length));ctx.toast(`Removed ${gone.kind==='video'?'a clip':'a slide'}.`);return;}
  if(b.dataset.reelsSound!==undefined){soundOn=!soundOn;b.setAttribute('aria-pressed',soundOn);b.setAttribute('aria-label',soundOn?'Mute':'Turn sound on');b.innerHTML=soundOn?SVG.sound:SVG.muted;const v=currentVideo();if(v)v.muted=!soundOn;return;}
  if(b.dataset.reelsLike!==undefined){const s=reel.slides[active];if(!s)return;s.liked=!s.liked;save();updateRail();b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');return;}
  if(b.dataset.reelsComments!==undefined)return commentsSheet();
  if(b.dataset.reelsShare!==undefined){location.hash='reelsSend';return;}
  if(b.dataset.reelsSheet)return openSheet(sheetFor(b.dataset.reelsSheet));
  if(b.dataset.reelsJumpEmpty!==undefined){const el=document.querySelector('.reel-empty');document.getElementById('reels-feed').scrollTo({top:el.offsetTop,behavior:'smooth'});return;}
  if(b.dataset.reelsPick){const on=!sheetPick.has(b.dataset.reelsPick);on?sheetPick.add(b.dataset.reelsPick):sheetPick.delete(b.dataset.reelsPick);b.setAttribute('aria-pressed',on);b.classList.toggle('picked',on);const confirm=document.querySelector('[data-reels-confirm]');if(confirm){confirm.disabled=!sheetPick.size;const t=confirm.dataset.reelsConfirm;confirm.textContent=sheetPick.size?`Add ${sheetPick.size} ${t==='photos'?(sheetPick.size===1?'photo':'photos'):t==='videos'?(sheetPick.size===1?'video':'videos'):(sheetPick.size===1?'text':'texts')}`:`Add ${t}`;}return;}
  if(b.dataset.reelsConfirm){const t=b.dataset.reelsConfirm,ids=[...sheetPick],stamp=Date.now();
    if(t==='photos')insert([{id:'p'+stamp,kind:'photos',photos:ids,from:'You',caption:`${ids.length} ${ids.length===1?'photo':'photos'}`,likes:0,comments:[]}]);
    if(t==='videos')insert(ids.map((id,k)=>({id:'v'+stamp+k,kind:'video',clip:id,likes:0,comments:[]})));
    if(t==='texts')insert(ids.map((id,k)=>({id:'t'+stamp+k,kind:'meme',msg:id,photo:msg(id)[6][0],likes:0,comments:[]})));
    return;}
  if(b.dataset.reelsUpload){const input=document.getElementById('reels-file');input.accept=b.dataset.reelsUpload==='image'?'image/*':'video/*';input.click();return;}
  if(b.dataset.reelsCopy){const url=location.origin+location.pathname+'#'+b.dataset.reelsCopy;(navigator.clipboard?.writeText(url)||Promise.reject()).then(()=>ctx.toast('Link copied.'),()=>ctx.toast(url));return;}
  if(b.dataset.reelsRemove){const i=+b.dataset.reelsRemove,[gone]=reel.slides.splice(i,1);save();rebuild();const el=slideEl(Math.min(i,reel.slides.length));document.getElementById('reels-feed').scrollTo({top:el.offsetTop});ctx.toast(`Removed ${gone.kind==='video'?'a clip':'a slide'}.`);return;}
  if(b.dataset.reelsReplay!==undefined){document.getElementById('reels-feed').scrollTo({top:0,behavior:'smooth'});return;}
}

/* ------------------------------------------------ Edit: reorder the reel or add something in between */
function thumbFor(s){
  if(s.kind==='video')return `<img src="assets/reels/posters/${s.clip}.jpg" alt="">`;
  if(s.kind==='photos')return `<img src="assets/constellation/thumbs/${s.photos[0]}.jpg" alt=""><span class="rt-badge">${s.photos.length}</span>`;
  if(s.kind==='upload-photos')return `<img src="${s.urls[0]}" alt=""><span class="rt-badge">${s.urls.length}</span>`;
  if(s.kind==='meme'){const m=msg(s.msg);return `<img src="assets/constellation/thumbs/${s.photo}.jpg" alt=""><span class="rt-meme">${esc(m?.[1]||'')}</span>`;}
  return `<span class="rt-blank">${SVG.video}</span>`;
}
function labelFor(s){if(s.kind==='video')return `clip from ${clipFor(s).from}`;if(s.kind==='photos'||s.kind==='upload-photos')return 'photo dump';if(s.kind==='meme')return 'text meme';return 'uploaded clip';}
function previewFor(s){
  if(!s)return '';
  if(s.kind==='video'){const c=clipFor(s);return `<video src="assets/reels/${s.clip}.mp4" poster="assets/reels/posters/${s.clip}.jpg" muted autoplay loop playsinline></video>${caption(c.from,c.caption)}`;}
  if(s.kind==='upload-video')return `<video src="${s.url}" muted autoplay loop playsinline></video>${caption(s.from||'You',s.caption||'')}`;
  if(s.kind==='photos'||s.kind==='upload-photos'){const srcs=s.kind==='photos'?s.photos.map(p=>`assets/constellation/thumbs/${p}.jpg`):s.urls;return `<div class="reel-photo-track">${srcs.map(u=>`<img src="${u}" alt="" draggable="false">`).join('')}</div>${caption(s.from||'You',s.caption||'')}`;}
  const m=msg(s.msg);return `<img src="assets/constellation/thumbs/${s.photo}.jpg" alt=""><p class="reel-meme-top">${esc(m?.[1]||'')}</p>`;
}
function editMarkup(c){ctx=c;mode='edit';reel=load();selected=0;insertAt=null;
  return `<section class="screen reels reels-edit" data-mode="edit" data-theme="dark">
<header class="reels-top"><button class="reels-icon" data-go="reels" aria-label="Back to the reel">${c.icon('back')}</button><h1>Edit reel</h1><button class="reels-done" data-go="reels">Done</button></header>
<div class="reels-edit-preview" id="reels-edit-preview"></div>
<p class="reels-edit-hint">Drag to reorder · tap + to add in between</p>
<div class="reels-timeline" id="reels-timeline" role="list" aria-label="Reel timeline"></div>
<div class="reels-sheet-scrim" id="reels-scrim" hidden></div><div class="reels-sheet" id="reels-sheet" role="dialog" aria-modal="true" hidden></div>
<input type="file" id="reels-file" accept="image/*,video/*" multiple hidden>
</section>`;}
function drawTimeline(focusIndex){
  const tl=document.getElementById('reels-timeline');if(!tl)return;
  const add=i=>`<button class="rt-add" data-rt-add="${i}" aria-label="Add something ${i===0?'at the start':i===reel.slides.length?'at the end':`between slides ${i} and ${i+1}`}">${SVG.plus}</button>`;
  tl.innerHTML=add(0)+reel.slides.map((s,i)=>`<div class="rt-item" role="listitem"><button class="rt-thumb ${i===selected?'on':''}" data-rt-select="${i}" aria-label="Slide ${i+1} of ${reel.slides.length}, ${labelFor(s)}. Arrow keys move it.">${thumbFor(s)}<span class="rt-num">${i+1}</span></button></div>${add(i+1)}`).join('');
  document.getElementById('reels-edit-preview').innerHTML=previewFor(reel.slides[selected]);
  if(focusIndex!=null)tl.querySelector(`[data-rt-select="${focusIndex}"]`)?.focus();
  tl.querySelector('.rt-thumb.on')?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function moveSlide(from,to){if(to<0||to>=reel.slides.length||from===to)return;const [s]=reel.slides.splice(from,1);reel.slides.splice(to,0,s);selected=to;save();drawTimeline(to);}
let rtDrag=null;
// Target index for the dragged slide, measured against the other thumbnails only.
function rtGap(x,skip){const items=[...document.querySelectorAll('.rt-thumb')].filter(t=>t!==skip);let g=items.length;for(let i=0;i<items.length;i++){const r=items[i].getBoundingClientRect();if(x<r.left+r.width/2){g=i;break;}}return g;}
function rtStart(){const d=rtDrag;d.active=true;d.el.classList.add('dragging');document.querySelector('.reels-timeline').classList.add('is-dragging');}
function rtDown(e){const t=e.target.closest('.rt-thumb');if(!t||e.button>0)return;rtDrag={el:t,from:+t.dataset.rtSelect,x:e.clientX,y:e.clientY,active:false,hold:e.pointerType==='mouse'?0:setTimeout(()=>rtDrag&&rtStart(),260)};}
function rtMove(e){const d=rtDrag;if(!d)return;const dx=e.clientX-d.x;
  if(!d.active){if(d.hold){if(Math.hypot(dx,e.clientY-d.y)>8){clearTimeout(d.hold);rtDrag=null;}return;}if(Math.abs(dx)<6)return;rtStart();}
  d.el.style.transform=`translateX(${dx}px) scale(1.06)`;
  const tl=document.querySelector('.reels-timeline'),r=tl.getBoundingClientRect();if(e.clientX<r.left+40)tl.scrollLeft-=10;if(e.clientX>r.right-40)tl.scrollLeft+=10;
  const to=rtGap(e.clientX,d.el),gap=to<=d.from?to:to+1;document.querySelectorAll('.rt-add').forEach(a=>a.classList.toggle('drop',to!==d.from&&+a.dataset.rtAdd===gap));}
function rtUp(e){const d=rtDrag;rtDrag=null;if(!d)return;clearTimeout(d.hold);if(!d.active)return;rtDragged=performance.now();const to=rtGap(e.clientX,d.el);d.el.style.transform='';if(to===d.from)drawTimeline();else moveSlide(d.from,to);}
let rtDragged=0;
function mountEdit(c,bind){ctx=c;on=bind;drawTimeline();
  const root=document.querySelector('.reels-edit'),tl=document.getElementById('reels-timeline');
  on(root,'click',e=>{const b=e.target.closest('button');if(!b)return onClick(e);
    if(b.dataset.rtSelect!==undefined){if(performance.now()-rtDragged<250)return;selected=+b.dataset.rtSelect;drawTimeline();return;}
    if(b.dataset.rtAdd!==undefined){insertAt=+b.dataset.rtAdd;openSheet(`<h2>Add to the reel</h2><p>It goes in at this spot in the timeline.</p><div class="reel-add-grid"><button class="wide" data-reels-sheet="photos">${SVG.plus}<span>${SVG.photo}Photos</span></button><button data-reels-sheet="videos">${SVG.plus}<span>${SVG.video}Videos</span></button><button data-reels-sheet="texts">${SVG.plus}<span>${SVG.text}Texts</span></button><button class="wide" data-reels-upload="image">${SVG.plus}<span>${SVG.photo}Upload</span></button></div>`);return;}
    onClick(e);});
  on(document.getElementById('reels-file'),'change',onFiles);
  on(root,'keydown',e=>{if(e.key==='Escape'){insertAt=null;closeSheet();}const t=e.target.closest?.('.rt-thumb');if(t&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();const i=+t.dataset.rtSelect;moveSlide(i,i+(e.key==='ArrowRight'?1:-1));}});
  on(tl,'pointerdown',rtDown);on(document,'pointermove',rtMove);on(document,'pointerup',rtUp);on(document,'pointercancel',()=>{if(rtDrag){clearTimeout(rtDrag.hold);rtDrag.el.style.transform='';rtDrag=null;drawTimeline();}});
  on(tl,'touchmove',e=>{if(rtDrag?.active)e.preventDefault();},{passive:false});
  on(tl,'contextmenu',e=>e.preventDefault());
}

/* ------------------------------------------------ Send + friend add pages */
function sendMarkup(c){ctx=c;reel=load();const n=reel.slides.length;
  return `<section class="screen reels-page reels-send">
<header class="tpl-top"><button class="icon-button" data-go="reels" aria-label="Back to editor">${c.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>${esc(reel.title)} is ready</h1><p>${n} ${n===1?'slide':'slides'}. Send ${esc(c.person)} the reel, and keep collecting clips from friends.</p></div>
${window.RibbonTemplates.shareCard(`For ${esc(c.person)}`,'Watch the reel','Plays full screen, slide by slide, ending with your note.','reelsWatch')}
${window.RibbonTemplates.shareCard('For friends','Add a clip','Friends pick a clip and write a birthday wish.','reelsAdd')}
<p class="tpl-note">Prototype: these links work in this browser only.</p></section>`;}
function addMarkup(c){ctx=c;reel=load();const used=new Set(reel.slides.filter(s=>s.kind==='video').map(s=>s.clip));
  return `<section class="screen reels-page reels-add">
<header class="tpl-top"><button class="icon-button" data-go="reelsSend" aria-label="Back">${c.icon('back')}</button><span class="reels-eyebrow">Friend’s view</span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>Add to ${esc(c.person)}’s reel</h1><p>Pick a clip from your camera roll and say happy birthday.</p></div>
<form class="reels-add-form" data-reels-add-form><label class="reels-field"><span>Your name</span><input name="from" required placeholder="Your name" autocomplete="given-name"></label>
<fieldset class="reels-roll"><legend>Your camera roll (demo)</legend>${LIBRARY.map(cl=>`<label class="reels-roll-item ${used.has(cl.id)?'used':''}"><input type="radio" name="clip" value="${cl.id}" ${used.has(cl.id)?'disabled':''} required><img src="assets/reels/posters/${cl.id}.jpg" alt="">${used.has(cl.id)?'<small>In reel</small>':''}</label>`).join('')}</fieldset>
<label class="reels-field"><span>Your wish</span><textarea name="caption" rows="2" required placeholder="happy birthday!!"></textarea></label>
<button class="reels-primary wide">Add to the reel</button></form></section>`;}
function mountAdd(c,bind){ctx=c;const form=document.querySelector('[data-reels-add-form]');if(!form)return;
  bind(form,'submit',e=>{e.preventDefault();const d=new FormData(form);reel=load();reel.slides.push({id:'f'+Date.now(),kind:'video',clip:String(d.get('clip')),fromOverride:String(d.get('from')).trim(),captionOverride:String(d.get('caption')).trim(),likes:0,comments:[]});save();
    form.outerHTML=`<div class="reels-thanks"><span class="reel-end-mark">✳</span><h2>You’re in ${esc(ctx.person)}’s reel</h2><p>Your clip and wish were added.</p><button class="reels-primary" data-go="reelsPreview">Watch the reel</button></div>`;});
}

// Friend-added clips carry their own name and wish.
function clipFor(s){const c=clip(s.clip);return s.fromOverride?{...c,from:s.fromOverride,caption:s.captionOverride||c.caption}:c;}

window.RibbonTemplates.register({
  storybookTemplates:{markup:pickerMarkup,mount:(c,bind)=>{ctx=c;bind(document,'click',e=>{const b=e.target.closest('[data-reels-concept]');if(b)c.toast(`${b.dataset.reelsConcept} is a concept in this prototype.`);});}},
  reels:{markup:c=>feedMarkup(c,'edit'),mount:mountFeed,unmount:stopAll},
  reelsPreview:{markup:c=>feedMarkup(c,'preview'),mount:mountFeed,unmount:stopAll},
  reelsWatch:{markup:c=>feedMarkup(c,'watch'),mount:mountFeed,unmount:stopAll},
  reelsEdit:{markup:editMarkup,mount:mountEdit,unmount:()=>{rtDrag=null;insertAt=null;}},
  reelsSend:{markup:sendMarkup},
  reelsAdd:{markup:addMarkup,mount:mountAdd}
});
window.RibbonReels={clipFor};
})();
