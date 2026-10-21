/* Ribbon intake (Figma 131:434): a passive memory vortex that fills with photos and messages,
   then asks what to make. Answer choices are pulled out of the vortex. Loaded after web.js, before app.js. */
(()=>{
'use strict';

const RELATIVE={su24:'2 years ago',fa24:'2 years ago',wi25:'Last year',sp25:'Last year'};
const FAVORITES=['Burgers on road trips','Chasing sunsets','Late nights on the Lower East Side','Subway antics','Spicy Village noodles','Field dances','Mirror selfies','Sleepovers and face masks','Thai Diner','The Catskills','Golden hour walks','Hanging off the train pole','London trips','Kitchen dance parties'];
const QUESTIONS=[
  {id:'format',title:'What kind of gift are you making?',type:'cards',options:[['storybook','A storybook','Chapters of your moments, in your words'],['trivia','Trivia','How well do they know your story?'],['capsule','A time capsule','Something for them to open later'],['unsure','I don’t know yet','Answer the rest and we’ll suggest one']]},
  {id:'occasion',title:'What’s the occasion, really?',type:'tiles',options:['Their birthday','Graduation','Moving away','Just because','Saying sorry','Our friendiversary']},
  {id:'favorites',title:'Any obsessions, favorites or notable things {person} loves?',type:'favorites',multi:true,options:FAVORITES},
  {id:'scope',title:'Is this a personal moment or a shared one?',type:'cards',options:[['personal','Just the two of us','A one-on-one moment between you'],['group','Shared with a group','Friends can be part of it too']]},
  {id:'reminds',title:'What reminds you of them most?',type:'photos',multi:true,pull:['m04','m12','m07','m16']},
  {id:'moments',title:'Which memory collections should the gift focus on?',type:'moments',multi:true},
  {id:'tone',title:'What’s the vibe for the mood?',type:'tone'},
  {id:'relationship',title:'What explains you two best?',type:'chips',multi:true,options:['Ride or die','Found family','Chaotic in the best way','Soft and steady','Long distance','Since we were kids','Partners in crime']},
  {id:'messages',title:'Which messages sound most like you two?',type:'messages',multi:true,pull:['t06','t12','t13','t10','t04','t08','t02','t11','t15']}
];

const F=520,DEPTH=3800;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

let ctx=null,data=null,slots=[],stage,nodeLayer,content,raf=0,last=0;
let camZ=0,speed=60,speedT=60,spin=0,dim=.8,dimT=.8,step='contact',qIndex=0,answers={},person='',gatherTimer=0,gathered=false;

function buildSlots(){
  const rand=rng(11);
  slots=[];
  data.PHOTOS.forEach(([id,w,h,moment,place,time,caption])=>{const width=Math.round(110+rand()*60);slots.push({id,kind:'photo',width,height:Math.round(Math.min(width*h/w,width*1.4)),caption,moment,time});});
  data.MESSAGES.forEach(([id,text,moment,,,,,sender])=>slots.push({id,kind:'message',text,moment,sender}));
  ['m05','m13','m20','m09','m15','m01','m22','m10'].forEach((id,i)=>slots.push({id:'c'+i,src:id,kind:'circle',size:Math.round(60+rand()*50)}));
  for(let i=0;i<18;i++)slots.push({id:'d'+i,kind:'dot',size:Math.round(14+rand()*16)});
  const order=slots.map((_,i)=>i).sort(()=>rand()-.5);
  slots.forEach((v,i)=>{const k=order[i];v.theta=(k>>1)*2.39996+(k&1)*Math.PI;v.radius=230+rand()*270;v.z=k/slots.length*DEPTH+rand()*80;v.blur=-1;v.zi=-1;v.filled=false;v.pulled=false;});
}

function slotHTML(v){
  if(v.kind==='photo')return `<div class="intake-slot intake-rect" style="width:${v.width}px;height:${v.height}px"><img src="assets/constellation/thumbs/${v.id}.jpg" alt=""></div>`;
  if(v.kind==='circle')return `<div class="intake-slot intake-circle" style="width:${v.size}px;height:${v.size}px"><img src="assets/constellation/thumbs/${v.src}.jpg" alt=""></div>`;
  if(v.kind==='message')return `<div class="intake-slot intake-pill ${v.sender==='you'?'from-you':''}"><span>${esc(v.text)}</span></div>`;
  return `<div class="intake-slot intake-dot" style="width:${v.size}px;height:${v.size}px"></div>`;
}

function markup(c){
  return `<section class="screen intake-screen" aria-label="Start a new keepsake">
<div class="intake-stage" id="intake-stage" aria-hidden="true"><div class="intake-nodes" id="intake-nodes"></div></div>
<div class="intake-veil" aria-hidden="true"></div>
<header class="intake-top"><button class="icon-button intake-close" data-go="${c.back||'home'}" aria-label="Close">${c.icon('close')}</button><div class="intake-progress" id="intake-progress" hidden>${QUESTIONS.map(()=>'<i></i>').join('')}</div><span class="intake-spacer"></span></header>
<div class="intake-content" id="intake-content" aria-live="polite"></div>
<footer class="intake-actions" id="intake-actions" hidden><button class="intake-back" data-intake="back">Back</button><button class="intake-next" data-intake="next">Next ${c.icon('arrow')}</button></footer>
</section>`;
}

function mount(c){
  unmount();
  ctx=c;data=window.RibbonWeb.data;stage=document.getElementById('intake-stage');nodeLayer=document.getElementById('intake-nodes');content=document.getElementById('intake-content');
  if(!stage)return;
  buildSlots();
  nodeLayer.innerHTML=slots.map(slotHTML).join('');
  [...nodeLayer.children].forEach((el,i)=>{slots[i].el=el;});
  camZ=0;speed=speedT=60;spin=0;dim=dimT=.85;step='contact';qIndex=0;answers={tone:{x:-.42,y:-.4}};shown={};freshSet=null;person='';gathered=false;
  document.addEventListener('click',onClick);
  document.addEventListener('input',onInput);
  document.addEventListener('keydown',onKey);
  if(c.preset&&c.resume){person=c.preset;slots.forEach(v=>{v.filled=true;v.el.classList.add('filled');});gathered=true;dim=dimT=.45;speed=speedT=50;Object.assign(answers,structuredClone(c.resume.answers));qIndex=c.resume.index;renderQuestion();}
  // Starting fresh for a known person (e.g. from their gift screen) still plays the gathering intro.
  else if(c.preset){document.getElementById('intake-progress').hidden=true;document.getElementById('intake-actions').hidden=true;startGathering(c.preset);}
  else renderContact();
  last=performance.now();raf=requestAnimationFrame(frame);
}
function unmount(){cancelAnimationFrame(raf);raf=0;clearTimeout(gatherTimer);document.removeEventListener('click',onClick);document.removeEventListener('input',onInput);document.removeEventListener('keydown',onKey);viewer=null;ctx=null;}
function onInput(e){if(e.target.id==='intake-fav-note'){answers.favoritesNote=e.target.value;updateNext();}if(e.target.id==='intake-own-input'){const q=QUESTIONS[qIndex];answers[q.id]=e.target.value.trim();updateNext();}}

/* ---------- steps ---------- */
function swap(html,after){
  closeViewer(true);
  content.classList.remove('entering');
  content.innerHTML=html;
  void content.offsetWidth;
  content.classList.add('entering');
  content.scrollTop=0;
  if(after)requestAnimationFrame(after);
}

function renderContact(){
  step='contact';speedT=60;dimT=.85;
  document.getElementById('intake-progress').hidden=true;document.getElementById('intake-actions').hidden=true;
  const list=ctx.contacts.length?ctx.contacts:[{id:'maya',name:'Maya',count:6}];
  swap(`<div class="intake-question"><h1 class="intake-title">Who is this for?</h1><p class="intake-sub">Ribbon looks through the photos and messages you share with them.</p><div class="intake-contacts">${list.map(c=>`<button class="intake-contact" data-intake-contact="${esc(c.name)}"><span class="intake-monogram" data-avatar="${esc(c.name)}">${esc(c.name[0])}</span><span><strong>${esc(c.name)}</strong><small>${c.count} saved ${c.count===1?'memory':'memories'}</small></span></button>`).join('')}</div><p class="intake-note">Demo: sample photos and messages. No accounts are connected.</p></div>`);
}

function startGathering(name){
  person=name;step='gather';speedT=reducedMotion()?60:340;dimT=1;
  const photos=data.PHOTOS.length,messages=data.MESSAGES.length;
  swap(`<div class="intake-question intake-gather"><h1 class="intake-title">Gathering what you and ${esc(person)} share</h1><p class="intake-sub" id="intake-count">0 photos · 0 messages</p></div>`);
  const queue=slots.filter(v=>v.kind!=='dot').sort((a,b)=>depth(a)-depth(b));
  let i=0,seenPhotos=0,seenMessages=0;
  const tick=()=>{
    if(!ctx)return;
    const batch=reducedMotion()?queue.length:1;
    for(let b=0;b<batch&&i<queue.length;b++,i++){const v=queue[i];v.filled=true;v.el.classList.add('filled');if(v.kind==='photo')seenPhotos++;if(v.kind==='message')seenMessages++;}
    const count=document.getElementById('intake-count');
    if(count)count.textContent=`${seenPhotos} ${seenPhotos===1?'photo':'photos'} · ${seenMessages} ${seenMessages===1?'message':'messages'}`;
    if(i<queue.length){gatherTimer=setTimeout(tick,95);return;}
    gathered=true;speedT=50;dimT=.45;
    gatherTimer=setTimeout(()=>{if(!ctx)return;swap(`<div class="intake-question intake-gather"><h1 class="intake-title">Found ${photos} photos and ${messages} messages</h1><p class="intake-sub">From summer 2024 to spring 2025. Now, a few questions so this sounds like you.</p><button class="intake-start" data-intake="begin">Let’s begin ${ctx.icon('arrow')}</button></div>`);},500);
  };
  gatherTimer=setTimeout(tick,600);
}

/* ---------- option pools: answers pulled from data can be swapped for new ones ---------- */
let shown={},freshSet=null;
const SHUFFLE={photos:'Pull new photos',messages:'Pull new messages',favorites:'More suggestions',moments:'Show other collections'};
const SHUFFLE_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>';
const LENSES=[['moment','MOMENTS',3,2,'Moment'],['place','PLACES',4,3,'Place'],['time','TIMES',5,4,'Season']];
function collectionPool(){const out=[];LENSES.forEach(([lens,map,pi,mi,tag])=>Object.entries(data[map]).forEach(([k,label])=>{const ids=data.PHOTOS.filter(p=>p[pi]===k).map(p=>p[0]);if(ids.length>=2)out.push({key:`${lens}:${k}`,lens,k,label,tag,pi,mi,ids});}));return out;}
function collectionOf(key){return collectionPool().find(c=>c.key===key);}
function poolFor(q){if(q.type==='photos')return data.PHOTOS.map(p=>p[0]);if(q.type==='messages')return data.MESSAGES.map(m=>m[0]);if(q.type==='favorites')return q.options;if(q.type==='moments')return collectionPool().map(c=>c.key);return null;}
function shownFor(q){if(!shown[q.id])shown[q.id]=q.type==='photos'||q.type==='messages'?q.pull.slice():q.type==='favorites'?q.options.slice(0,8):collectionPool().filter(c=>c.lens==='moment').map(c=>c.key);return shown[q.id];}
function shuffled(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function keepAttr(id){return freshSet&&!freshSet.has(id)?'data-keep':'';}
function pullNew(q){
  const cur=shownFor(q),sel=new Set(answers[q.id]||[]),fresh=shuffled(poolFor(q).filter(x=>!cur.includes(x)));
  if(fresh.length<cur.filter(x=>!sel.has(x)).length)fresh.push(...shuffled(cur.filter(x=>!sel.has(x))));
  let f=0;const next=cur.map(x=>sel.has(x)?x:fresh[f++]);
  shown[q.id]=next;freshSet=new Set(next.filter(x=>!cur.includes(x)));
  renderQuestion();
}
// Line icons (Figma 149:89 for the three templates; the rest drawn to match: 1.875 white strokes on a 30px frame).
const LINE_ICON={
  storybook:'<img src="assets/icons/storybook.svg" width="30" height="30" alt="">',
  trivia:'<img src="assets/icons/trivia.svg" width="22.5" height="25" alt="">',
  capsule:'<img src="assets/icons/capsule.svg" width="30" height="30" alt="">',
  unsure:'<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="white" stroke-width="1.875" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3.5c.8 5.6 2.9 7.7 8.5 8.5-5.6.8-7.7 2.9-8.5 8.5-.8-5.6-2.9-7.7-8.5-8.5 5.6-.8 7.7-2.9 8.5-8.5Z"/><path d="M23.5 19.5c.4 2.4 1.1 3.1 3.5 3.5-2.4.4-3.1 1.1-3.5 3.5-.4-2.4-1.1-3.1-3.5-3.5 2.4-.4 3.1-1.1 3.5-3.5Z"/></svg>',
  personal:'<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="white" stroke-width="1.875" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10" r="3.75"/><circle cx="19.5" cy="10" r="3.75"/><path d="M3.75 24.5c0-3.73 3.02-6.75 6.75-6.75 2.1 0 3.97.96 5.2 2.46M26.25 24.5c0-3.73-3.02-6.75-6.75-6.75-2.1 0-3.97.96-5.2 2.46"/></svg>',
  group:'<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="white" stroke-width="1.875" stroke-linecap="round" stroke-linejoin="round"><circle cx="15" cy="9" r="3.5"/><circle cx="6.5" cy="12" r="2.75"/><circle cx="23.5" cy="12" r="2.75"/><path d="M9 24.5c0-3.31 2.69-6 6-6s6 2.69 6 6M2.5 23c0-2.49 1.79-4.5 4-4.5 1 0 1.9.4 2.6 1.06M27.5 23c0-2.49-1.79-4.5-4-4.5-1 0-1.9.4-2.6 1.06"/></svg>'
};
function cardIcon(v){return LINE_ICON[v]||'';}
// While editing from the overview, Next becomes Done (back to the summary) and Back returns to the overview.
function setEditLabels(){const next=document.querySelector('[data-intake="next"]'),back=document.querySelector('[data-intake="back"]');if(next)next.innerHTML=editing?`Done ${ctx.icon('check')}`:`Next ${ctx.icon('arrow')}`;if(back)back.textContent=editing?'All answers':'Back';}
function renderQuestion(){
  step='question';dimT=.45;
  releaseAll();
  const q=QUESTIONS[qIndex],progress=document.getElementById('intake-progress');
  progress.hidden=false;[...progress.children].forEach((el,i)=>el.classList.toggle('on',i<=qIndex));
  document.getElementById('intake-actions').hidden=false;
  const value=answers[q.id];
  const picked=v=>q.multi?(value||[]).includes(v):value===v;
  const check='<span class="intake-check" aria-hidden="true"></span>';
  let body='';
  if(q.type==='cards')body=`<div class="intake-cards">${q.options.map(([v,l,d])=>`<button class="intake-card ${picked(v)?'selected':''}" data-intake-pick="${v}" aria-pressed="${picked(v)}"><span class="intake-card-icon" aria-hidden="true">${cardIcon(v)}</span><span><strong>${l}</strong><small>${d}</small></span>${check}</button>`).join('')}</div>`;
  if(q.type==='tiles'){const own=!!answers[q.id+'Own'];body=`<div class="intake-tiles">${q.options.map((l,i)=>`<button class="intake-tile glow-${i%6} ${!own&&picked(l)?'selected':''}" data-intake-pick="${esc(l)}" aria-pressed="${!own&&picked(l)}"><span class="intake-tile-label">${esc(l)}</span>${check}</button>`).join('')}<button class="intake-tile intake-tile-own ${own?'selected':''}" data-intake-own aria-pressed="${own}"><span class="intake-tile-label">Something else…</span>${check}</button></div><label class="intake-text-field" id="intake-own-field" ${own?'':'hidden'}><span>Type your own</span><input id="intake-own-input" maxlength="60" autocomplete="off" placeholder="e.g. First apartment together" value="${own?esc(answers[q.id]||''):''}"></label>`;}
  if(q.type==='chips')body=`<div class="intake-chips">${q.options.map(l=>`<button class="intake-chip ${picked(l)?'selected':''}" data-intake-pick="${esc(l)}" aria-pressed="${picked(l)}">${esc(l)}</button>`).join('')}</div>`;
  if(q.type==='photos')body=`<div class="intake-photos">${shownFor(q).map(id=>{const p=data.PHOTOS.find(x=>x[0]===id),wide=p[1]/p[2]>1.05;return `<button class="intake-photo ${picked(id)?'selected':''}" ${keepAttr(id)} data-intake-pick="${id}" aria-pressed="${picked(id)}"><span class="intake-media ${wide?'wide':''}" data-pull="${id}"><img src="assets/constellation/thumbs/${id}.jpg" alt="">${check}</span><strong>${esc(p[6])}</strong><small>${RELATIVE[p[5]]}</small></button>`;}).join('')}</div>`;
  if(q.type==='moments')body=`<div class="intake-moments">${shownFor(q).map(key=>{const c=collectionOf(key),k=key,l=c.label,ids=c.ids;return `<button class="intake-moment ${picked(k)?'selected':''}" ${keepAttr(k)} data-intake-view="${k}" aria-haspopup="dialog" aria-label="${esc(l)} (${c.tag.toLowerCase()}), ${ids.length} photos${picked(k)?', included':''}. Open to look through it"><span class="intake-fan">${ids.slice(0,3).map(id=>`<span class="intake-media" data-pull="${id}"><img src="assets/constellation/thumbs/${id}.jpg" alt=""></span>`).join('')}${check}</span><strong>${esc(l)}</strong><small>${ids.length} photos</small></button>`;}).join('')}</div>`;
  if(q.type==='messages')body=`<div class="intake-messages" id="intake-thread">${shownFor(q).map(id=>{const m=data.MESSAGES.find(x=>x[0]===id);return `<button class="intake-bubble ${m[7]==='you'?'from-you':'from-them'} ${picked(id)?'selected':''}" ${keepAttr(id)} aria-label="${m[7]==='you'?'You':esc(person)}: ${esc(m[1])}" data-intake-pick="${id}" data-pull="${id}" aria-pressed="${picked(id)}">${esc(m[1])}${check}</button>`;}).join('')}</div>`;
  if(q.type==='favorites')body=`<div class="intake-chips">${shownFor(q).map(l=>`<button class="intake-chip ${picked(l)?'selected':''} ${freshSet?.has(l)?'fresh':''}" data-intake-pick="${esc(l)}" aria-pressed="${picked(l)}">${esc(l)}</button>`).join('')}</div><label class="intake-text-field"><span>Or in your own words</span><input id="intake-fav-note" maxlength="80" autocomplete="off" placeholder="e.g. Christopher Nolan fanatic" value="${esc(answers.favoritesNote||'')}"></label><p class="intake-note">Suggestions come from your photos and messages with ${esc(person)}.</p>`;
  if(q.type==='tone')body=tonePad();
  swap(`<div class="intake-question"><h1 class="intake-title">${esc(q.title.replace('{person}',person))}</h1>${q.multi?`<p class="intake-sub"${q.type==='messages'?' id="intake-vibe" aria-live="polite"':''}>${q.type==='favorites'?'Pick any that fit, or add your own.':q.type==='moments'?'Tap one to look through it, then include the ones you want.':q.type==='messages'?vibeLine():'Pick as many as you like.'}</p>`:''}${body}${SHUFFLE[q.type]?`<button class="intake-shuffle" data-intake-shuffle>${SHUFFLE_ICON}${SHUFFLE[q.type]}</button>`:''}</div>`,()=>{pullIn();freshSet=null;if(q.type==='tone')bindTone();});
  updateNext();setEditLabels();
}

function tonePad(){
  const {x,y}=answers.tone;
  return `<div class="intake-tone"><div class="intake-tone-inner" id="intake-tone-inner" style="${toneGlowVars(x,y)}"><span class="intake-tone-dots" aria-hidden="true"></span><span class="intake-tone-dots lit" aria-hidden="true"></span><span class="intake-tone-axis v" aria-hidden="true"></span><span class="intake-tone-axis h" aria-hidden="true"></span>
<span class="intake-tone-label top">Heartfelt</span><span class="intake-tone-label bottom">Unserious</span><span class="intake-tone-label left">Personal</span><span class="intake-tone-label right">Shared</span>
<button class="intake-tone-handle" id="intake-tone-handle" role="slider" aria-label="Mood" aria-valuetext="${toneLabel()}" style="left:${50+x*40}%;top:${50+y*40}%"></button></div></div><p class="intake-tone-readout" id="intake-tone-readout">${toneLabel()}</p>`;
}
// The lit dot layer is inset 8% like the dots, so map the handle's position into that box.
function toneGlowVars(x,y){return `--hx:${((50+x*40-8)/.84).toFixed(2)}%;--hy:${((50+y*40-8)/.84).toFixed(2)}%`;}
function toneLabel(){const {x,y}=answers.tone;return `${y<-.25?'Heartfelt':y>.25?'Unserious':'Somewhere between heartfelt and silly'} · ${x<-.25?'about them':x>.25?'about the two of you':'a bit of both'}`;}
function bindTone(){
  const inner=document.getElementById('intake-tone-inner'),handle=document.getElementById('intake-tone-handle');if(!inner)return;
  const set=(x,y)=>{answers.tone={x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};handle.style.left=`${50+answers.tone.x*40}%`;handle.style.top=`${50+answers.tone.y*40}%`;inner.style.setProperty('--hx',`${((50+answers.tone.x*40-8)/.84).toFixed(2)}%`);inner.style.setProperty('--hy',`${((50+answers.tone.y*40-8)/.84).toFixed(2)}%`);handle.setAttribute('aria-valuetext',toneLabel());document.getElementById('intake-tone-readout').textContent=toneLabel();};
  const fromEvent=e=>{const r=inner.getBoundingClientRect();set(((e.clientX-r.left)/r.width-.5)/.4,((e.clientY-r.top)/r.height-.5)/.4);};
  inner.addEventListener('pointerdown',e=>{try{inner.setPointerCapture(e.pointerId);}catch{}fromEvent(e);inner.classList.add('dragging');});
  inner.addEventListener('pointermove',e=>{if(inner.hasPointerCapture(e.pointerId))fromEvent(e);});
  inner.addEventListener('pointerup',()=>inner.classList.remove('dragging'));
  handle.addEventListener('keydown',e=>{const d=.1,{x,y}=answers.tone,m={ArrowLeft:[-d,0],ArrowRight:[d,0],ArrowUp:[0,-d],ArrowDown:[0,d]}[e.key];if(!m)return;e.preventDefault();set(x+m[0],y+m[1]);});
}

const TEMPLATE_NAMES={storybook:'A storybook',trivia:'Trivia',capsule:'A time capsule'};
// Known obsessions that point at a specific template, e.g. "she rates everything on Beli" or "she loves Hamilton".
const MUSICALS=['hamilton','wicked','mamma mia','les mis','phantom','dear evan hansen','six','hadestown','taylor swift','beyonce','abba','harry styles','olivia rodrigo','broadway','musical','karaoke','singing'];
function favoriteTheme(){
  const note=(answers.favoritesNote||'').toLowerCase(),chips=answers.favorites||[];
  const song=MUSICALS.find(w=>new RegExp(`\\b${w}\\b`).test(note));
  if(song){const named=['broadway','musical','karaoke','singing'].includes(song)?'':song.replace(/\b\w/g,c=>c.toUpperCase());return {kind:'karaoke',name:named};}
  if(/beli|rates? everything|restaurant|foodie/.test(note))return {kind:'beli'};
  const label=note.trim()?answers.favoritesNote.trim().replace(/^(she|he|they)\s+(loves?|likes?|is obsessed with)\s+/i,''):chips[0]||'';
  return label?{kind:'theme',name:label}:null;
}
function recommend(){
  const {x,y}=answers.tone,group=answers.scope==='group',favs=[...(answers.favorites||[]),answers.favoritesNote||''].join(' ').toLowerCase(),theme=favoriteTheme();
  const foodie=/burger|noodle|spicy|food|eat|restaurant|beli|diner/.test(favs);
  if(theme?.kind==='karaoke')return {format:'storybook',route:'reels',title:`${theme.name?theme.name+'-themed ':''}karaoke reel`,cta:'karaoke reel',reason:`${person} loves ${theme.name||'a good singalong'}, so friends can each send a clip belting their part, cut together like a reel.`};
  if(theme?.kind==='beli')return {format:'trivia',route:'beli',title:'Beli trivia game',reason:`${person} rates everything on Beli, so friends can guess how they scored the places you’ve eaten together.`};
  const nod=theme?.kind==='theme'?` We’ll theme it around ${theme.name.charAt(0).toLowerCase()+theme.name.slice(1)}.`:'';
  if(group&&((answers.messages||[]).length>=2||(answers.relationship||[]).includes('Found family')))return {format:'storybook',route:'reels',title:'reel recap',reason:`It’s a shared moment, so ${person}’s friends can add their own clips and wishes.${nod}`};
  if(y>.25)return foodie?{format:'trivia',route:'beli',title:'Beli trivia game',reason:`You want it playful, and ${person} loves good food, so friends can guess how they rated their favorite spots.`}:{format:'trivia',route:'triviaTemplates',title:'trivia game',reason:`You want it playful, so a game everyone can play fits best.${nod}`};
  if(y<-.25&&!group)return {format:'capsule',route:'capsuleSetup',title:'time capsule',reason:`It’s heartfelt and just between you two, made to be opened together later.${nod}`};
  return {format:'storybook',route:'storybookTemplates',title:'storybook',reason:`Your memories tell a story, so chapters in your own words will feel the most like you.${nod}`};
}
const REVIEW_LABELS={format:'Gift',occasion:'Occasion',favorites:'{person} loves',scope:'Moment',reminds:'Reminds you of them',moments:'Collections',tone:'Vibe',relationship:'You two',messages:'In your words'};
function answerText(q){
  const v=answers[q.id];
  if(q.id==='format')return v==='unsure'?'Not sure yet':TEMPLATE_NAMES[v]||'';
  if(q.id==='scope')return v==='group'?'Shared with a group':v==='personal'?'Just the two of you':'';
  if(q.id==='tone')return toneLabel();
  if(q.id==='favorites')return [...(v||[]),...(answers.favoritesNote?.trim()?[answers.favoritesNote.trim()]:[])].join(', ');
  if(q.id==='moments')return (v||[]).map(k=>collectionOf(k)?.label).filter(Boolean).join(', ');
  if(q.id==='reminds')return (v||[]).length?`${v.length} ${v.length===1?'photo':'photos'}`:'';
  if(q.id==='messages')return (v||[]).length?`${v.length} ${v.length===1?'message':'messages'}`:'';
  return Array.isArray(v)?v.join(', '):v||'';
}
let editing=false;
function renderReview(){
  step='review';editing=false;releaseAll();dimT=.25;
  document.getElementById('intake-progress').hidden=true;document.getElementById('intake-actions').hidden=true;
  swap(`<div class="intake-question intake-review"><h1 class="intake-title">Change an answer</h1><p class="intake-sub">Tap one to jump back to it.</p>
<div class="intake-review-list">${QUESTIONS.map((q,i)=>{const a=answerText(q);return `<button class="intake-review-row" data-intake-edit="${i}"><span><small>${esc(REVIEW_LABELS[q.id].replace('{person}',person))}</small><strong class="${a?'':'empty'}">${esc(a||'Not answered')}</strong></span>${ctx.icon('arrow')}</button>`;}).join('')}</div>
<button class="intake-back solo" data-intake="summary">Back to the summary</button></div>`);
}
function renderSummary(){
  step='summary';editing=false;releaseAll();dimT=.25;
  document.getElementById('intake-progress').hidden=true;document.getElementById('intake-actions').hidden=true;
  const rec=answers.format==='unsure'?recommend():null;
  const title=rec?`We’d make ${esc(person)} a ${esc(rec.title)}`:`${esc(TEMPLATE_NAMES[answers.format])} for ${esc(person)}`;
  const picks=[...(answers.reminds||[])],moments=(answers.moments||[]).map(k=>collectionOf(k)?.label).filter(Boolean),rel=answers.relationship||[],favs=[...(answers.favorites||[]),...(answers.favoritesNote?.trim()?[answers.favoritesNote.trim()]:[])];
  swap(`<div class="intake-question intake-summary"><h1 class="intake-title">${title}</h1>${rec?`<p class="intake-rec">${esc(rec.reason)}</p>`:''}<p class="intake-sub">${esc(answers.occasion)} · ${esc(toneLabel())}</p>
<div class="intake-summary-strip">${picks.map(id=>`<span class="intake-media" data-pull="${id}"><img src="assets/constellation/thumbs/${id}.jpg" alt=""></span>`).join('')}</div>
<dl class="intake-summary-list"><div><dt>Moment</dt><dd>${answers.scope==='group'?'Shared with a group':'Just the two of you'}</dd></div>${moments.length?`<div><dt>Collections</dt><dd>${moments.map(esc).join(', ')}</dd></div>`:''}${favs.length?`<div><dt>${esc(person)} loves</dt><dd>${favs.map(esc).join(', ')}</dd></div>`:''}${rel.length?`<div><dt>You two</dt><dd>${rel.map(esc).join(', ')}</dd></div>`:''}${(answers.messages||[]).length?`<div><dt>In your words</dt><dd>${answers.messages.length} ${answers.messages.length===1?'message':'messages'} to quote</dd></div>`:''}</dl>
<button class="intake-start" data-intake="finish">${rec?`Start the ${esc(rec.cta||rec.title)}`:'Start making it'} ${ctx.icon('arrow')}</button><button class="intake-back solo" data-intake="review">Change an answer</button></div>`,pullIn);
}

/* ---------- collection viewer: swipe through a collection's photos and messages, or see them all ---------- */
let viewer=null;
function collectionItems(key){
  const c=collectionOf(key),photos=data.PHOTOS.filter(p=>p[c.pi]===c.k),msgs=data.MESSAGES.filter(m=>m[c.mi]===c.k),used=new Set(),items=[];
  const msgItem=m=>({type:'message',id:m[0],text:m[1],sender:m[7],source:m[5],time:data.TIMES[m[4]]});
  photos.forEach(p=>{items.push({type:'photo',id:p[0],caption:p[6],time:data.TIMES[p[5]],place:data.PLACES[p[4]]});msgs.filter(m=>!used.has(m[0])&&m[6][0]===p[0]).forEach(m=>{used.add(m[0]);items.push(msgItem(m));});});
  msgs.filter(m=>!used.has(m[0])).forEach(m=>items.push(msgItem(m)));
  return items;
}
function openViewer(k,trigger){viewer={key:k,items:collectionItems(k),index:0,mode:'swipe',trigger};drawViewer();}
// Swipe view: a looping fan of cards (Figma 192:129). Details sit in each card's top-left corner and the
// neighbours peek out on either side along an arc, so the next one is always visible underneath.
function fanCard(it){
  const meta=(a,b)=>`<div class="iv-meta"><strong>${a}</strong><small>${b}</small></div>`;
  if(it.type==='photo')return `<img src="assets/constellation/${it.id}.jpg" alt="${esc(it.caption)}" draggable="false">${meta(esc(it.caption),`${esc(it.time)} · ${esc(it.place)}`)}`;
  return `<div class="iv-card-msg"><p class="${it.sender==='you'?'you':''}">${esc(it.text)}</p></div>${meta(it.sender==='you'?'You':esc(person),`${esc(it.source)} · ${esc(it.time)}`)}`;
}
function layoutFan(drag=0){
  const fan=document.getElementById('iv-fan');if(!fan||!viewer)return;const n=viewer.items.length;
  fan.querySelectorAll('.iv-card').forEach(card=>{
    let d=(+card.dataset.i-viewer.index-drag)%n;if(d>n/2)d-=n;if(d<-n/2)d+=n;const a=Math.abs(d);
    card.style.transform=`rotate(${(d*13).toFixed(2)}deg) scale(${(1-Math.min(a,3)*.05).toFixed(3)})`;
    card.style.zIndex=String(100-Math.round(a*10));card.style.opacity=a>2.6?'0':'1';
    card.classList.toggle('is-current',a<.5);card.setAttribute('aria-hidden',a<.5?'false':'true');
  });
  document.querySelectorAll('#intake-viewer .iv-dots i').forEach((dot,k)=>dot.classList.toggle('on',k===viewer.index));
}
function bindFan(fan){
  let start=null,moved=false;const w=()=>fan.querySelector('.iv-card')?.offsetWidth||240;
  fan.addEventListener('pointerdown',e=>{start={x:e.clientX};moved=false;fan.classList.add('dragging');fan.setPointerCapture?.(e.pointerId);});
  fan.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x;if(Math.abs(dx)>4)moved=true;layoutFan(-dx/(w()*.95));});
  const end=e=>{if(!start)return;const dx=e.clientX-start.x;start=null;fan.classList.remove('dragging');
    if(Math.abs(dx)>40)return viewerStep(dx<0?Math.max(1,Math.round(-dx/(w()*.95))):-Math.max(1,Math.round(dx/(w()*.95))));
    if(!moved){const card=e.target.closest('.iv-card');if(card&&!card.classList.contains('is-current')){viewer.index=+card.dataset.i;return layoutFan();}}
    layoutFan();};
  fan.addEventListener('pointerup',end);fan.addEventListener('pointercancel',end);
}
function drawViewer(){
  const root=stage.closest('.intake-screen');let el=document.getElementById('intake-viewer');
  if(!el){el=document.createElement('div');el.id='intake-viewer';el.className='intake-viewer';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');root.appendChild(el);}
  const {key,items,index,mode}=viewer,label=collectionOf(key).label,nP=items.filter(i=>i.type==='photo').length,nM=items.length-nP,inc=(answers.moments||[]).includes(key);
  el.setAttribute('aria-label',`${label}: ${nP} photos and ${nM} messages`);
  el.innerHTML=`<div class="iv-scrim" data-viewer-close></div><div class="iv-panel">
<header class="iv-head"><div class="iv-title"><h2>${esc(label)}</h2><small>${nP} ${nP===1?'photo':'photos'} · ${nM} ${nM===1?'message':'messages'}</small></div><button class="iv-close" data-viewer-close aria-label="Close">${ctx.icon('close')}</button></header>
<div class="iv-modes" role="group" aria-label="View as"><button class="${mode==='swipe'?'active':''}" data-viewer-mode="swipe" aria-pressed="${mode==='swipe'}">Swipe</button><button class="${mode==='all'?'active':''}" data-viewer-mode="all" aria-pressed="${mode==='all'}">All</button></div>
${mode==='swipe'?`<div class="iv-fan" id="iv-fan" tabindex="0" role="group" aria-roledescription="carousel" aria-label="Swipe through ${esc(label)}">${items.map((it,i)=>`<div class="iv-card ${it.type}" data-i="${i}" aria-label="${i+1} of ${items.length}">${fanCard(it)}</div>`).join('')}</div>
<div class="iv-nav"><button data-viewer-step="-1" aria-label="Previous">${ctx.icon('back')}</button><span class="iv-dots" aria-hidden="true">${items.map((_,i)=>`<i class="${i===index?'on':''}"></i>`).join('')}</span><button data-viewer-step="1" aria-label="Next">${ctx.icon('arrow')}</button></div>`
:`<div class="iv-all">${nP?`<h3 class="iv-all-label">Photos</h3><div class="iv-grid">${items.map((it,i)=>it.type==='photo'?`<button class="iv-cell photo" data-viewer-jump="${i}" aria-label="${esc(it.caption)}"><img src="assets/constellation/thumbs/${it.id}.jpg" alt=""></button>`:'').join('')}</div>`:''}${nM?`<h3 class="iv-all-label">Messages</h3><div class="iv-thread">${items.map((it,i)=>it.type==='message'?`<button class="iv-cell message ${it.sender==='you'?'you':''}" data-viewer-jump="${i}" aria-label="Message: ${esc(it.text)}"><span>${esc(it.text)}</span></button>`:'').join('')}</div>`:''}</div>`}
<button class="iv-include ${inc?'on':''}" data-viewer-toggle aria-pressed="${inc}">${inc?'Included in the gift ✓':'Include this collection'}</button></div>`;
  if(mode==='swipe'){const fan=document.getElementById('iv-fan');fan.classList.add('dragging');layoutFan();requestAnimationFrame(()=>fan.classList.remove('dragging'));bindFan(fan);}
  el.querySelector('.iv-close').focus({preventScroll:true});
}
function viewerStep(d){if(!document.getElementById('iv-fan'))return;const n=viewer.items.length;viewer.index=((viewer.index+d)%n+n)%n;layoutFan();}
function viewerClick(e){
  const t=e.target.closest('[data-viewer-close],[data-viewer-mode],[data-viewer-step],[data-viewer-jump],[data-viewer-toggle]');if(!t)return !!e.target.closest('#intake-viewer');
  if(t.dataset.viewerClose!==undefined)closeViewer();
  else if(t.dataset.viewerMode){viewer.mode=t.dataset.viewerMode;drawViewer();}
  else if(t.dataset.viewerStep)viewerStep(+t.dataset.viewerStep);
  else if(t.dataset.viewerJump){viewer.index=+t.dataset.viewerJump;viewer.mode='swipe';drawViewer();}
  else if(t.dataset.viewerToggle!==undefined){const list=new Set(answers.moments||[]);list.has(viewer.key)?list.delete(viewer.key):list.add(viewer.key);answers.moments=[...list];
    const on=list.has(viewer.key),card=content.querySelector(`[data-intake-view="${viewer.key}"]`);card?.classList.toggle('selected',on);
    t.classList.toggle('on',on);t.setAttribute('aria-pressed',on);t.textContent=on?'Included in the gift ✓':'Include this collection';updateNext();}
  return true;
}
function closeViewer(silent){const el=document.getElementById('intake-viewer');if(!el)return;el.remove();if(!silent)viewer?.trigger?.focus({preventScroll:true});viewer=null;}
function onKey(e){if(!viewer)return;if(e.key==='Escape'){e.preventDefault();closeViewer();}if(viewer?.mode==='swipe'&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();viewerStep(e.key==='ArrowRight'?1:-1);}}

/* ---------- pulling choices out of the vortex ---------- */
function ratio(){const r=stage.getBoundingClientRect();return {r,s:r.width/stage.offsetWidth};}
function pullIn(){
  const els=[...content.querySelectorAll('[data-pull]')];if(!els.length)return;
  const {r:sr,s}=ratio(),W=stage.offsetWidth,H=stage.offsetHeight,still=reducedMotion();
  els.forEach((el,i)=>{
    const id=el.dataset.pull,v=slots.find(n=>n.id===id)||slots.find(n=>n.src===id);
    const t=el.getBoundingClientRect(),tx=(t.left-sr.left)/s+t.width/s/2,ty=(t.top-sr.top)/s+t.height/s/2,tw=t.width/s;
    let fx,fy,fs,fb;
    if(v&&v.visible&&v.scale>.18){fx=v.sx;fy=v.sy;fs=Math.max(.2,(v.kind==='message'?v.el.offsetWidth:v.width||v.size)*v.scale/tw);fb=v.blur;}
    else{const a=v?v.theta+spin:i*2.4,reach=Math.max(W,H)*.75;fx=W/2+Math.cos(a)*reach;fy=H/2+Math.sin(a)*reach;fs=1.9;fb=8;}
    if(v){v.pulled=true;v.el.style.visibility='hidden';}
    if(still||el.closest('[data-keep]'))return;
    el.animate([{transform:`translate(${fx-tx}px,${fy-ty}px) scale(${fs})`,filter:`blur(${fb}px)`,opacity:.25},{transform:'none',filter:'blur(0)',opacity:1}],{duration:950,delay:i*85,easing:'cubic-bezier(.16,.8,.2,1)',fill:'backwards'});
  });
}
function releaseAll(){slots.forEach(v=>{if(v.pulled){v.pulled=false;v.shown=null;}});}

/* ---------- interaction ---------- */
function onClick(e){
  if(!ctx)return;
  const contact=e.target.closest('[data-intake-contact]');if(contact)return startGathering(contact.dataset.intakeContact);
  if(viewer&&viewerClick(e))return;
  if(e.target.closest('[data-intake-shuffle]'))return pullNew(QUESTIONS[qIndex]);
  const own=e.target.closest('[data-intake-own]');if(own)return chooseOwn(own);
  const view=e.target.closest('[data-intake-view]');if(view)return openViewer(view.dataset.intakeView,view);
  const pick=e.target.closest('[data-intake-pick]');if(pick)return choose(pick.dataset.intakePick,pick);
  const edit=e.target.closest('[data-intake-edit]');if(edit){editing=true;qIndex=+edit.dataset.intakeEdit;return renderQuestion();}
  const action=e.target.closest('[data-intake]');if(!action)return;
  const a=action.dataset.intake;
  if(a==='begin'){qIndex=0;renderQuestion();}
  if(a==='next'){if(editing)return renderSummary();if(qIndex<QUESTIONS.length-1){qIndex++;renderQuestion();}else renderSummary();}
  if(a==='review')return renderReview();
  if(a==='summary')return renderSummary();
  if(a==='back'){if(editing)return renderReview();if(step==='summary'){qIndex=QUESTIONS.length-1;renderQuestion();}else if(qIndex>0){qIndex--;renderQuestion();}else if(ctx.preset)location.hash=ctx.back||'gift';else renderContact();}
  if(a==='finish'){const r=answers.format==='unsure'?recommend():null;ctx.finish({person,format:r?r.format:answers.format,route:r?.route,occasion:answers.occasion,picks:answers.reminds||[]});}
}
function choose(value,button){
  const q=QUESTIONS[qIndex];
  if(q.type==='tiles'){answers[q.id+'Own']=false;const f=document.getElementById('intake-own-field');if(f)f.hidden=true;content.querySelector('[data-intake-own]')?.classList.remove('selected');}
  if(q.multi){const list=new Set(answers[q.id]||[]);list.has(value)?list.delete(value):list.add(value);answers[q.id]=[...list];button.classList.toggle('selected',list.has(value));button.setAttribute('aria-pressed',list.has(value));if(q.type==='messages')updateVibe();}
  else{answers[q.id]=value;content.querySelectorAll('[data-intake-pick]').forEach(b=>{const on=b===button;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});}
  updateNext();
}
function chooseOwn(button){const q=QUESTIONS[qIndex];answers[q.id+'Own']=true;answers[q.id]=(document.getElementById('intake-own-input')?.value||'').trim();
  content.querySelectorAll('[data-intake-pick]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});button.classList.add('selected');button.setAttribute('aria-pressed','true');
  const f=document.getElementById('intake-own-field');f.hidden=false;f.querySelector('input').focus();updateNext();}
// What the picked messages suggest about the friendship, shown in place of the hint on the messages question.
const VIBES=[['sweet',/miss|love|♡|❤|text me when|made it home|proud|thinking of you|hug/],['teasing',/who raised you|lol|lmao|😭|iconic|why are we|religious|unhinged|again/],
  ['up for anything',/train|trip|london|road|upside down|walk|ludlow|the l\b|sleepover|bringing/],['food-obsessed',/burger|noodle|pizza|eat|dinner|brunch|snack|diner/],['a little late-night',/u up|2am|3am|late|tonight|midnight/]];
function vibeLine(){
  const texts=(answers.messages||[]).map(id=>(data.MESSAGES.find(m=>m[0]===id)||[])[1]||'').map(t=>t.toLowerCase());
  if(!texts.length)return 'Pick the ones that sound like you two, and we’ll read the vibe.';
  const found=VIBES.map(([label,re])=>[label,texts.filter(t=>re.test(t)).length]).filter(([,n])=>n).sort((a,b)=>b[1]-a[1]).map(([l])=>l).slice(0,3);
  if(!found.length)return 'Reading this as easygoing and a little low-key.';
  const list=found.length>1?`${found.slice(0,-1).join(', ')} and ${found[found.length-1]}`:found[0];
  return `Reading this as ${list}.`;
}
function updateVibe(){const el=document.getElementById('intake-vibe');if(el)el.textContent=vibeLine();}
function updateNext(){
  const q=QUESTIONS[qIndex],next=document.querySelector('[data-intake="next"]');if(!next||step!=='question')return;
  const v=answers[q.id],ok=(q.type==='tiles'&&answers[q.id+'Own'])?!!(v||'').trim():q.type==='tone'||(q.type==='favorites'&&(answers.favoritesNote||'').trim())||(q.multi?(v||[]).length>0:!!v);
  next.disabled=!ok;
}

/* ---------- vortex ---------- */
function depth(v){return ((v.z-camZ)%DEPTH+DEPTH)%DEPTH+70;}
function frame(now){
  if(!ctx||!stage?.isConnected){raf=0;return;}
  raf=requestAnimationFrame(frame);
  const dt=Math.min(64,now-last);last=now;
  const still=reducedMotion(),k=1-Math.pow(.96,dt/16);
  speed+=(speedT-speed)*k;dim+=(dimT-dim)*k;
  if(!still){camZ+=speed*dt/1000;spin+=dt*.000045;}
  const W=stage.offsetWidth,H=stage.offsetHeight,focus=F*1.15;
  for(const v of slots){
    if(v.pulled){v.visible=false;continue;}
    const z=depth(v),s=F/z,a=v.theta+spin,x=Math.cos(a)*v.radius,y=Math.sin(a)*v.radius*.92;
    const px=W/2+x*s,py=H/2+y*s;
    v.sx=px;v.sy=py;v.scale=s;
    v.visible=!(px<-300||px>W+300||py<-300||py>H+300);
    if(!v.visible){if(v.shown!==false){v.el.style.visibility='hidden';v.shown=false;}continue;}
    if(v.shown!==true){v.el.style.visibility='visible';v.shown=true;}
    const near=Math.max(0,Math.min(1,(z-110)/260)),far=Math.max(0,Math.min(1,1-(z-2700)/1000));
    const alpha=near*far*dim*(v.kind==='dot'?.5:1);
    const blur=Math.round(Math.min(9,Math.abs(z-focus)/focus*6)*2)/2;
    v.el.style.transform=`translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) translate(-50%,-50%) scale(${s.toFixed(4)})`;
    v.el.style.opacity=alpha.toFixed(3);
    if(blur!==v.blur){v.el.style.filter=blur?`blur(${blur}px)`:'none';v.blur=blur;}
    const zi=Math.round(10000-z);if(zi!==v.zi){v.el.style.zIndex=zi;v.zi=zi;}
  }
}

window.RibbonIntake={markup,mount,unmount};
})();
