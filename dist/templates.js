/* Ribbon trivia templates: Beli trivia (Figma 61:1002) and a Jeopardy board.
   Demo output: share links open in this browser; quiz responses and live game state use localStorage. */
(()=>{
'use strict';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
const SVG={
  save:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10M8 10l4 4 4-4M5 19h14"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>'
};
const RATING=[['liked','I liked it!'],['fine','It was fine'],['disliked','I didn’t like it']];
const TYPES={rating:'Rating',number:'Number',choice:'Choice',score:'Score'};
const link=hash=>`${location.origin}${location.pathname}#${hash}`;
const scoreClass=s=>s>=6.7?'good':s>=4?'okay':'bad';

let ctx=null,screen='',cleanup=[];
const on=(target,type,fn,opts)=>{target.addEventListener(type,fn,opts);cleanup.push(()=>target.removeEventListener(type,fn,opts));};

/* =========================================================== Beli data */
const beliKey=()=>`ribbon-beli-v1-${ctx.person}`;
function seedBeli(p){return {title:`${p}’s Beli Trivia`,questions:[
  {id:'q1',type:'rating',text:`How did ${p} rate Spicy Village?`,answer:'liked'},
  {id:'q2',type:'number',text:`How many places has ${p} rated in New York City?`,min:0,max:150,answer:62},
  {id:'q3',type:'choice',text:`What’s ${p}’s #1 spot on the Lower East Side?`,options:['Dudleys','Wu’s Wonton King','Kiki’s','Thai Diner'],answer:1},
  {id:'q4',type:'score',text:`Guess ${p}’s score for Thai Diner`,answer:9.2},
  {id:'q5',type:'rating',text:`How did ${p} feel about the road trip burger?`,answer:'liked'}
],responses:[
  {name:'Jo',demo:true,answers:{q1:'liked',q2:58,q3:1,q4:8.8,q5:'fine'}},
  {name:'Priya',demo:true,answers:{q1:'fine',q2:90,q3:3,q4:9.0,q5:'liked'}},
  {name:'Sam',demo:true,answers:{q1:'liked',q2:40,q3:0,q4:6.5,q5:'liked'}}
]};}
const beli=()=>store.get(beliKey(),null)||seedBeli(ctx.person);
const saveBeli=d=>store.set(beliKey(),d);
const reveals=d=>d.revealAnswers!==false;
function isCorrect(q,a){
  if(a===undefined||a===null)return false;
  if(q.type==='number')return Math.abs(a-q.answer)<=Math.max(1,(q.max-q.min)*.08);
  if(q.type==='score')return Math.abs(a-q.answer)<=.5;
  return a===q.answer;
}
function answerText(q,a=q.answer){
  if(q.type==='rating')return RATING.find(r=>r[0]===a)?.[1]||'';
  if(q.type==='choice')return q.options[a]||'';
  if(q.type==='score')return Number(a).toFixed(1);
  return String(a);
}
function defaults(type){return {rating:{answer:'liked'},number:{min:0,max:50,answer:12},choice:{options:['Option one','Option two','Option three'],answer:0},score:{answer:7.5}}[type];}

/* =========================================================== Screens */
const pages={
  triviaTemplates(){return `<section class="screen tpl-picker ribbon-home glass-screen">${ctx.atmosphere()}
<header class="tpl-top"><button class="icon-button" data-go="home" aria-label="Back to home">${ctx.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>Pick a trivia template</h1><p>Start from a head start built around ${esc(ctx.person)}, then make it yours.</p></div>
<div class="tpl-picks">
<button class="tpl-pick tpl-pick-beli" data-go="beli"><span class="tpl-pick-art" aria-hidden="true"><i class="good">8.9</i><i class="okay">5.4</i><i class="bad">2.1</i></span><span><strong>Beli trivia</strong><small>Guess how ${esc(ctx.person)} rated each spot.</small></span>${ctx.icon('arrow')}</button>
<button class="tpl-pick tpl-pick-jeo" data-go="jeopardy"><span class="tpl-pick-art" aria-hidden="true">${'<i>100</i>'.repeat(2)}${'<i>200</i>'.repeat(2)}</span><span><strong>Jeopardy board</strong><small>A party game board with buzzers.</small></span>${ctx.icon('arrow')}</button>
<button class="tpl-pick tpl-pick-memory" data-create-format="trivia"><span class="tpl-pick-art" aria-hidden="true"><img src="assets/constellation/thumbs/m18.jpg" alt=""><img src="assets/constellation/thumbs/m12.jpg" alt=""></span><span><strong>Memory quiz</strong><small>Questions from your photos and texts.</small></span>${ctx.icon('arrow')}</button>
<p class="tpl-section-label">More games, coming soon</p>
<button class="tpl-pick tpl-concept tpl-pick-headsup" data-tpl-concept="Forehead guess"><span class="tpl-pick-art" aria-hidden="true"><i>Road trip!</i></span><span><strong>Forehead guess</strong><small>Friends act out moments. You guess.</small></span><span class="tpl-soon">Concept</span></button>
<button class="tpl-pick tpl-concept tpl-pick-quizshow" data-tpl-concept="Live quiz show"><span class="tpl-pick-art" aria-hidden="true"><i>▲</i><i>●</i><i>■</i><i>◆</i></span><span><strong>Live quiz show</strong><small>Everyone answers live. Fastest wins.</small></span><span class="tpl-soon">Concept</span></button>
</div></section>`;},

  beli(){const d=beli();return `<section class="screen beli beli-editor">
<header class="tpl-top"><button class="icon-button" data-go="triviaTemplates" aria-label="Back to templates">${ctx.icon('back')}</button><input class="beli-title-input" data-beli-title value="${esc(d.title)}" aria-label="Quiz title"><span class="tpl-spacer"></span></header>
<p class="beli-hint">${d.questions.length} ${d.questions.length===1?'question':'questions'} to start. Edit anything, swipe left to delete.</p>
<label class="beli-toggle"><span><strong>Show the right answer</strong></span><input type="checkbox" role="switch" data-beli-reveal ${reveals(d)?'checked':''}></label>
<div class="beli-list" id="beli-list">${d.questions.map(editorCard).join('')}</div>
<div class="beli-undo" id="beli-undo" hidden><span>Question deleted</span><button data-beli-undo>Undo</button></div>
<nav class="beli-dock" aria-label="Quiz actions"><button data-beli-add><span>${SVG.plus}</span>Add</button><button data-go="beliPlay"><span>${SVG.eye}</span>Preview</button><button data-action="save-draft"><span>${SVG.save}</span>Save</button><button data-go="beliShare"><span>${SVG.send}</span>Share</button></nav>
</section>`;},

  beliShare(){const d=beli();return `<section class="screen beli beli-share">
<header class="tpl-top"><button class="icon-button" data-go="beli" aria-label="Back to editor">${ctx.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>${esc(d.title)} is ready</h1><p>${d.questions.length} questions. Send one link to friends and save the other for ${esc(ctx.person)}. ${reveals(d)?'Friends see the right answer after each question.':'Answers stay hidden from friends.'}</p></div>
${shareCard('For friends','Take the quiz','Friends answer each question and get a score.','beliPlay')}
${shareCard(`For ${esc(ctx.person)}`,'See the results','Who knows your taste best, and what everyone guessed.','beliResults')}
<p class="tpl-note">Prototype: these links work in this browser only.</p></section>`;},

  beliPlay(){return `<section class="screen beli beli-play" id="beli-play"></section>`;},

  beliResults(){const d=beli(),rows=d.responses.map(r=>({...r,correct:d.questions.filter(q=>isCorrect(q,r.answers[q.id])).length})).sort((a,b)=>b.correct-a.correct);
    return `<section class="screen beli beli-results">
<header class="tpl-top"><button class="icon-button" data-go="beliShare" aria-label="Back">${ctx.icon('back')}</button><span class="beli-eyebrow">Results for ${esc(ctx.person)}</span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>Who knows your taste?</h1><p>${rows.length} ${rows.length===1?'friend has':'friends have'} taken ${esc(d.title)}.</p></div>
<ol class="beli-board">${rows.map((r,i)=>{const s=d.questions.length?r.correct/d.questions.length*10:0;return `<li><span class="beli-rank">${i+1}</span><span class="beli-name">${esc(r.name)}${r.demo?' <small>demo</small>':''}</span><span class="beli-correct">${r.correct}/${d.questions.length}</span><span class="beli-score ${scoreClass(s)}">${s.toFixed(1)}</span></li>`;}).join('')}</ol>
<h2 class="beli-h2">Question by question</h2>
<div class="beli-breakdown">${d.questions.map(q=>{const right=rows.filter(r=>isCorrect(q,r.answers[q.id])).length,pct=rows.length?Math.round(right/rows.length*100):0;return `<article><p>${esc(q.text)}</p><div class="beli-bar"><i style="width:${pct}%"></i></div><small>${pct}% got it · Answer: <b>${esc(answerText(q))}</b></small></article>`;}).join('')}</div>
</section>`;},

  jeopardy(){const g=jeo();return `<section class="screen jeo jeo-editor">
<header class="tpl-top"><button class="icon-button" data-go="triviaTemplates" aria-label="Back to templates">${ctx.icon('back')}</button><input class="jeo-title-input" data-jeo-title value="${esc(g.title)}" aria-label="Board title"><span class="tpl-spacer"></span></header>
<p class="jeo-hint">Five categories to start. Rename a category or tap a value to edit its clue.</p>
<div class="jeo-rows">${g.categories.map((c,ci)=>`<div class="jeo-row"><input class="jeo-cat-input" data-jeo-cat="${ci}" value="${esc(c.name)}" aria-label="Category ${ci+1} name"><div class="jeo-values">${c.clues.map((cl,i)=>`<button class="jeo-value" data-jeo-edit="${ci}-${i}" aria-expanded="false">$${cl.v}</button>`).join('')}</div><div class="jeo-clue-edit" id="jeo-edit-${ci}" hidden></div></div>`).join('')}</div>
<div class="jeo-actions"><button class="jeo-save" data-action="save-draft">${SVG.save} Save draft</button><button class="jeo-primary" data-go="jeopardyShare">Make the board ${ctx.icon('arrow')}</button></div>
</section>`;},

  jeopardyShare(){const g=jeo();return `<section class="screen jeo jeo-share">
<header class="tpl-top"><button class="icon-button" data-go="jeopardy" aria-label="Back to editor">${ctx.icon('back')}</button><span></span><span class="tpl-spacer"></span></header>
<div class="tpl-intro"><h1>${esc(g.title)}</h1><p>Put the board on a laptop or TV. Everyone else joins with the player link and buzzes from their phone.</p></div>
${shareCard('For the host','Game board','Shows the board, opens clues and keeps score.','jeopardyBoard')}
${shareCard('For everyone playing','Player link','Join with a name, then buzz in when a clue opens.','jeopardyPlay')}
<p class="tpl-note">Prototype: open both links in this browser, in separate tabs, to play.</p></section>`;},

  jeopardyBoard(){return `<section class="screen jeo jeo-board" id="jeo-board"></section>`;},
  jeopardyPlay(){return `<section class="screen jeo jeo-play" id="jeo-play"></section>`;}
};

function shareCard(eyebrow,title,desc,hash){return `<article class="tpl-share"><small>${eyebrow}</small><strong>${title}</strong><p>${desc}</p><div class="tpl-link"><code>${esc(link(hash))}</code><button data-tpl-copy="${hash}" aria-label="Copy ${title} link">${SVG.copy}</button></div><button class="tpl-open" data-go="${hash}">Open ${ctx.icon('arrow')}</button></article>`;}

/* =========================================================== Beli editor */
function editorCard(q){
  return `<article class="beli-swipe" data-q="${q.id}">
<button class="beli-trash" data-beli-delete="${q.id}" aria-label="Delete question" tabindex="-1">${SVG.trash}</button>
<div class="beli-card" data-swipe="${q.id}">
<textarea class="beli-q" data-beli-text="${q.id}" rows="2" aria-label="Question">${esc(q.text)}</textarea>
<div class="beli-types" role="group" aria-label="Answer type">${Object.entries(TYPES).map(([k,l])=>`<button class="${q.type===k?'active':''}" data-beli-type="${q.id}:${k}" aria-pressed="${q.type===k}">${l}</button>`).join('')}</div>
${answerEditor(q)}
<button class="beli-card-delete" data-beli-delete="${q.id}">Delete question</button>
</div></article>`;
}
function answerEditor(q){
  if(q.type==='rating')return `<div class="beli-rating">${RATING.map(([k,l])=>`<button class="beli-circle ${k} ${q.answer===k?'correct':''}" data-beli-answer="${q.id}:${k}" aria-pressed="${q.answer===k}">${l}</button>`).join('')}</div>`;
  if(q.type==='number')return `<div class="beli-slider"><output style="--p:${(q.answer-q.min)/(q.max-q.min)*100}%">${q.answer}</output><input type="range" min="${q.min}" max="${q.max}" value="${q.answer}" data-beli-range="${q.id}" aria-label="Correct answer"><div class="beli-range-ends"><input type="number" value="${q.min}" data-beli-min="${q.id}" aria-label="Lowest value"><input type="number" value="${q.max}" data-beli-max="${q.id}" aria-label="Highest value"></div></div>`;
  if(q.type==='choice')return `<div class="beli-options">${q.options.map((o,i)=>`<div class="beli-option ${q.answer===i?'correct':''}"><button class="beli-radio" data-beli-answer="${q.id}:${i}" aria-label="Mark as correct" aria-pressed="${q.answer===i}"></button><input value="${esc(o)}" data-beli-option="${q.id}:${i}" aria-label="Option ${i+1}">${q.options.length>2?`<button class="beli-option-x" data-beli-remove-option="${q.id}:${i}" aria-label="Remove option">${SVG.x}</button>`:''}</div>`).join('')}${q.options.length<5?`<button class="beli-add-option" data-beli-add-option="${q.id}">${SVG.plus} Add option</button>`:''}</div>`;
  return `<div class="beli-slider beli-score-slider"><span class="beli-score big ${scoreClass(q.answer)}" data-beli-score-badge="${q.id}">${Number(q.answer).toFixed(1)}</span><input type="range" min="0" max="10" step="0.1" value="${q.answer}" data-beli-range="${q.id}" aria-label="Correct score"><div class="beli-range-ends static"><span>0.0</span><span>10.0</span></div></div>`;
}
function mountBeliEditor(){
  const root=document.querySelector('.beli-editor');if(!root)return;
  let lastDeleted=null;
  const update=fn=>{const d=beli();fn(d);saveBeli(d);return d;};
  const rerender=()=>{const d=beli();document.getElementById('beli-list').innerHTML=d.questions.map(editorCard).join('');root.querySelector('.beli-hint').textContent=`${d.questions.length} ${d.questions.length===1?'question':'questions'} to start. Edit anything, swipe left to delete.`;};
  const q=(d,id)=>d.questions.find(x=>x.id===id);
  on(root,'input',e=>{
    const t=e.target;
    if(t.dataset.beliTitle!==undefined)update(d=>{d.title=t.value;});
    if(t.dataset.beliText)update(d=>{q(d,t.dataset.beliText).text=t.value;});
    if(t.dataset.beliOption){const [id,i]=t.dataset.beliOption.split(':');update(d=>{q(d,id).options[+i]=t.value;});}
    if(t.dataset.beliRange){const d=update(d=>{q(d,t.dataset.beliRange).answer=+t.value;}),item=q(d,t.dataset.beliRange),out=t.parentElement.querySelector('output');
      if(out){out.textContent=t.value;out.style.setProperty('--p',`${(item.answer-item.min)/(item.max-item.min)*100}%`);}
      const badge=t.parentElement.querySelector('[data-beli-score-badge]');if(badge){badge.textContent=Number(t.value).toFixed(1);badge.className=`beli-score big ${scoreClass(+t.value)}`;}}
  });
  on(root,'change',e=>{
    const t=e.target;
    if(t.dataset.beliReveal!==undefined){update(d=>{d.revealAnswers=t.checked;});}
    if(t.dataset.beliMin||t.dataset.beliMax){const id=t.dataset.beliMin||t.dataset.beliMax;update(d=>{const item=q(d,id);if(t.dataset.beliMin)item.min=Math.min(+t.value,item.max-1);else item.max=Math.max(+t.value,item.min+1);item.answer=Math.min(item.max,Math.max(item.min,item.answer));});rerender();}
  });
  on(root,'click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.beliType){const [id,type]=b.dataset.beliType.split(':');update(d=>{const item=q(d,id);if(item.type===type)return;Object.keys(defaults(item.type)).forEach(k=>delete item[k]);Object.assign(item,{type},defaults(type));});rerender();}
    if(b.dataset.beliAnswer){const [id,v]=b.dataset.beliAnswer.split(':');update(d=>{const item=q(d,id);item.answer=item.type==='choice'?+v:v;});rerender();}
    if(b.dataset.beliAddOption){update(d=>{q(d,b.dataset.beliAddOption).options.push('New option');});rerender();}
    if(b.dataset.beliRemoveOption){const [id,i]=b.dataset.beliRemoveOption.split(':');update(d=>{const item=q(d,id);item.options.splice(+i,1);if(item.answer>=item.options.length)item.answer=0;});rerender();}
    if(b.dataset.beliDelete)remove(b.dataset.beliDelete);
    if(b.dataset.beliUndo!==undefined&&lastDeleted){update(d=>{d.questions.splice(lastDeleted.index,0,lastDeleted.q);});lastDeleted=null;document.getElementById('beli-undo').hidden=true;rerender();}
    if(b.dataset.beliAdd!==undefined){const id='q'+Date.now();update(d=>{d.questions.push({id,type:'rating',text:`How did ${ctx.person} rate…`,...defaults('rating')});});rerender();const el=root.querySelector(`[data-beli-text="${id}"]`);el?.scrollIntoView({behavior:'smooth',block:'center'});el?.focus({preventScroll:true});el?.select();}
  });
  function remove(id){
    const card=root.querySelector(`.beli-swipe[data-q="${id}"]`);
    const finish=()=>{update(d=>{const index=d.questions.findIndex(x=>x.id===id);lastDeleted={index,q:d.questions[index]};d.questions.splice(index,1);});rerender();document.getElementById('beli-undo').hidden=false;};
    if(!card||matchMedia('(prefers-reduced-motion: reduce)').matches)return finish();
    card.style.height=card.offsetHeight+'px';card.classList.add('removing');requestAnimationFrame(()=>{card.style.height='0px';});setTimeout(finish,280);
  }
  // Swipe left to reveal delete; swipe far to delete.
  let swipe=null;
  on(root,'pointerdown',e=>{const card=e.target.closest('[data-swipe]');if(!card||e.target.closest('input,button,select')||(e.target.matches('textarea')&&document.activeElement===e.target))return;swipe={card,id:card.dataset.swipe,x:e.clientX,y:e.clientY,dx:0,base:card.classList.contains('open')?-104:0,active:false};});
  on(root,'pointermove',e=>{if(!swipe)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(!swipe.active){if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){swipe.active=true;try{swipe.card.setPointerCapture(e.pointerId);}catch{}swipe.card.classList.add('dragging');}else if(Math.abs(dy)>10){swipe=null;return;}else return;}
    swipe.dx=Math.min(0,swipe.base+dx);swipe.card.style.transform=`translateX(${swipe.dx}px)`;});
  const end=()=>{if(!swipe)return;const {card,id,dx,active}=swipe;swipe=null;if(!active)return;card.classList.remove('dragging');card.style.transform='';
    root.querySelectorAll('.beli-card.open').forEach(c=>{if(c!==card)c.classList.remove('open');});
    if(dx<-200)return remove(id);
    const open=dx<-52;card.classList.toggle('open',open);card.parentElement.querySelector('.beli-trash').tabIndex=open?0:-1;};
  on(root,'pointerup',end);on(root,'pointercancel',end);
}

/* =========================================================== Beli quiz (friend view) */
function mountBeliPlay(){
  const root=document.getElementById('beli-play');if(!root)return;
  const d=beli(),answers={};let i=-1,name='',revealed=false,pending=null;
  const draw=()=>{
    if(i<0){root.innerHTML=`<header class="tpl-top"><button class="icon-button" data-go="beli" aria-label="Back to editor">${ctx.icon('back')}</button><span class="beli-eyebrow">Friend’s view</span><span class="tpl-spacer"></span></header><div class="beli-play-intro"><span class="beli-score big good">?</span><h1>${esc(d.title)}</h1><p>${d.questions.length} questions about ${esc(ctx.person)}’s taste. Let’s see how well you know them.${reveals(d)?'':' Answers stay secret until the end.'}</p><label class="beli-field"><span>Your name</span><input id="beli-name" value="${esc(name)}" autocomplete="given-name" placeholder="Your name"></label><button class="beli-primary" data-play="start">Start</button></div>`;return;}
    if(i>=d.questions.length){
      const correct=d.questions.filter(q=>isCorrect(q,answers[q.id])).length,s=correct/d.questions.length*10;
      root.innerHTML=`<header class="tpl-top"><button class="icon-button" data-go="beli" aria-label="Back to editor">${ctx.icon('back')}</button><span class="beli-eyebrow">Friend’s view</span><span class="tpl-spacer"></span></header><div class="beli-play-intro done"><span class="beli-score huge ${scoreClass(s)}">${s.toFixed(1)}</span><h1>${correct} of ${d.questions.length} right</h1><p>${s>=6.7?`You really know ${esc(ctx.person)}’s taste.`:s>=4?`Not bad. ${esc(ctx.person)} might have a few surprises left.`:`Time for a dinner with ${esc(ctx.person)}.`}</p><p class="beli-saved">Your answers were sent to ${esc(ctx.person)}’s results.</p>${reveals(d)?`<button class="beli-primary" data-go="beliResults">See ${esc(ctx.person)}’s results</button>`:''}</div>`;return;}
    const q=d.questions[i],a=answers[q.id];
    let body='';
    if(q.type==='rating')body=`<div class="beli-rating play">${RATING.map(([k,l])=>`<button class="beli-circle ${k} ${revealed&&q.answer===k?'correct':''} ${revealed&&a===k&&a!==q.answer?'wrong':''} ${a===k?'picked':''}" data-play-answer="${k}" ${revealed?'disabled':''}>${l}</button>`).join('')}</div>`;
    if(q.type==='choice')body=`<div class="beli-choices">${q.options.map((o,k)=>`<button class="${revealed&&q.answer===k?'correct':''} ${revealed&&a===k&&a!==q.answer?'wrong':''} ${a===k?'picked':''}" data-play-answer="${k}" ${revealed?'disabled':''}>${esc(o)}</button>`).join('')}</div>`;
    if(q.type==='number'){const v=pending??Math.round((q.min+q.max)/2);body=`<div class="beli-slider play"><output style="--p:${(v-q.min)/(q.max-q.min)*100}%">${v}</output><input type="range" min="${q.min}" max="${q.max}" value="${v}" id="beli-play-range" ${revealed?'disabled':''} aria-label="Your guess"><div class="beli-range-ends static"><span>${q.min}</span><span>${q.max}</span></div></div>${revealed?'':`<button class="beli-primary" data-play="lock">${reveals(d)?'Lock it in':i===d.questions.length-1?'Finish':'Lock it in'}</button>`}`;}
    if(q.type==='score'){const v=pending??5;body=`<div class="beli-slider beli-score-slider play"><span class="beli-score big ${scoreClass(v)}" id="beli-play-badge">${Number(v).toFixed(1)}</span><input type="range" min="0" max="10" step="0.1" value="${v}" id="beli-play-range" ${revealed?'disabled':''} aria-label="Your guess"><div class="beli-range-ends static"><span>0.0</span><span>10.0</span></div></div>${revealed?'':`<button class="beli-primary" data-play="lock">${reveals(d)?'Lock it in':i===d.questions.length-1?'Finish':'Lock it in'}</button>`}`;}
    const verdict=revealed?`<div class="beli-verdict ${isCorrect(q,a)?'yes':'no'}"><strong>${isCorrect(q,a)?'Nailed it':'Not quite'}</strong><span>${esc(ctx.person)}’s answer: ${esc(answerText(q))}</span></div><button class="beli-primary" data-play="next">${i===d.questions.length-1?'See my score':'Next question'}</button>`:'';
    root.innerHTML=`<header class="tpl-top"><button class="icon-button" data-go="beli" aria-label="Back to editor">${ctx.icon('back')}</button><div class="beli-progress"><i style="width:${(i+1)/d.questions.length*100}%"></i></div><span class="beli-step">${i+1}/${d.questions.length}</span></header><div class="beli-play-q"><h1>${esc(q.text)}</h1>${body}${verdict}</div>`;
  };
  const advance=()=>{i++;revealed=false;pending=null;if(i>=d.questions.length){const all=beli();all.responses.push({name,answers});saveBeli(all);}draw();};
  const lock=v=>{answers[d.questions[i].id]=v;if(reveals(d)){revealed=true;draw();return;}root.querySelectorAll('[data-play-answer]').forEach(b=>{b.classList.toggle('picked',String(v)===b.dataset.playAnswer);b.disabled=true;});setTimeout(advance,matchMedia('(prefers-reduced-motion: reduce)').matches?0:320);};
  on(root,'click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.play==='start'){name=(document.getElementById('beli-name').value||'').trim()||'A friend';i=0;draw();}
    if(b.dataset.playAnswer!==undefined){const q=d.questions[i];lock(q.type==='choice'?+b.dataset.playAnswer:b.dataset.playAnswer);}
    if(b.dataset.play==='lock')lock(+document.getElementById('beli-play-range').value);
    if(b.dataset.play==='next')advance();
  });
  on(root,'input',e=>{if(e.target.id!=='beli-play-range')return;const q=d.questions[i],v=+e.target.value;pending=v;const out=root.querySelector('output');if(out){out.textContent=v;out.style.setProperty('--p',`${(v-q.min)/(q.max-q.min)*100}%`);}const badge=document.getElementById('beli-play-badge');if(badge){badge.textContent=v.toFixed(1);badge.className=`beli-score big ${scoreClass(v)}`;}});
  draw();
}

/* =========================================================== Jeopardy data */
const jeoKey=()=>`ribbon-jeopardy-v1-${ctx.person}`,LIVE='ribbon-jeopardy-live-v1',MSG='ribbon-jeopardy-msg-v1';
function seedJeo(p){return {title:`${p} Jeopardy!`,categories:[
  {name:'Road trip',clues:[{v:100,q:'We pulled over to watch this from a field.',a:'What is the sunset?'},{v:200,q:'Our mid-drive meal, later called a religious experience.',a:'What is the burger?'},{v:300,q:'The mountains where we napped in a meadow.',a:'What are the Catskills?'}]},
  {name:'City nights',clues:[{v:100,q:'The street where we always met at 11.',a:'What is Ludlow?'},{v:200,q:'Home of the iconic mirror selfie.',a:'What is Delancey?'},{v:300,q:'What time it was on the bench.',a:'What is 2am?'}]},
  {name:'Texts',clues:[{v:100,q:`${p}’s two-word late-night text.`,a:'What is “u up”?'},{v:200,q:`Minutes after leaving before ${p} said “I miss you already.”`,a:'What is 4?'},{v:300,q:`What ${p} asks you to do the moment you get home.`,a:'What is text them?'}]},
  {name:'At home',clues:[{v:100,q:'The room where we screamed for no reason.',a:'What is the kitchen?'},{v:200,q:'The required supply for sleepover Friday.',a:'What are face masks?'},{v:300,q:'Three faces, one of these.',a:'What is a phone?'}]},
  {name:`${p}’s Beli`,clues:[{v:100,q:`${p}’s #1 spot on the Lower East Side.`,a:'What is Wu’s Wonton King?'},{v:200,q:`${p}’s score for Thai Diner.`,a:'What is 9.2?'},{v:300,q:`How many New York places ${p} has rated.`,a:'What is 62?'}]}
]};}
const jeo=()=>store.get(jeoKey(),null)||seedJeo(ctx.person);
const saveJeo=g=>store.set(jeoKey(),g);
const live=()=>store.get(LIVE,{players:{},open:null,buzz:[],used:[],revealed:false});
const send=msg=>store.set(MSG,{...msg,id:Math.random().toString(36).slice(2),t:Date.now()});

function mountJeoEditor(){
  const root=document.querySelector('.jeo-editor');if(!root)return;
  const update=fn=>{const g=jeo();fn(g);saveJeo(g);return g;};
  on(root,'input',e=>{const t=e.target;
    if(t.dataset.jeoTitle!==undefined)update(g=>{g.title=t.value;});
    if(t.dataset.jeoCat)update(g=>{g.categories[+t.dataset.jeoCat].name=t.value;});
    if(t.dataset.jeoClue){const [ci,i,field]=t.dataset.jeoClue.split('-');update(g=>{g.categories[+ci].clues[+i][field]=t.value;});const btn=root.querySelector(`[data-jeo-edit="${ci}-${i}"]`);btn?.classList.toggle('filled',true);}
  });
  on(root,'click',e=>{const b=e.target.closest('[data-jeo-edit]');if(!b)return;
    const [ci,i]=b.dataset.jeoEdit.split('-'),panel=document.getElementById(`jeo-edit-${ci}`),open=b.getAttribute('aria-expanded')==='true';
    root.querySelectorAll('[data-jeo-edit]').forEach(x=>{x.setAttribute('aria-expanded','false');x.classList.remove('active');});
    root.querySelectorAll('.jeo-clue-edit').forEach(p=>{p.hidden=true;});
    if(open)return;
    const c=jeo().categories[+ci].clues[+i];b.setAttribute('aria-expanded','true');b.classList.add('active');
    panel.hidden=false;panel.innerHTML=`<label><span>$${c.v} clue</span><textarea rows="2" data-jeo-clue="${ci}-${i}-q">${esc(c.q)}</textarea></label><label><span>Answer</span><input data-jeo-clue="${ci}-${i}-a" value="${esc(c.a)}"></label>`;
    panel.querySelector('textarea').focus();
  });
}

function mountJeoBoard(){
  const root=document.getElementById('jeo-board');if(!root)return;
  const g=jeo();
  let state=live();state.open=null;state.buzz=[];state.revealed=false;
  const publish=()=>{store.set(LIVE,state);draw();};
  const draw=()=>{
    const players=Object.entries(state.players);
    let overlay='';
    if(state.open){const [ci,i]=state.open,c=g.categories[ci].clues[i];
      overlay=`<div class="jeo-clue"><small>${esc(g.categories[ci].name)} · $${c.v}</small><p>${esc(c.q)}</p>${state.revealed?`<p class="jeo-answer">${esc(c.a)}</p>`:''}
<div class="jeo-buzzes">${state.buzz.length?state.buzz.map((n,k)=>`<span class="${k===0?'first':''}">${k===0?'Buzzed first: ':''}${esc(n)}</span>`).join(''):'<span class="waiting">Waiting for someone to buzz…</span>'}</div>
<div class="jeo-host">${state.buzz.length?`<button class="jeo-right" data-host="right">Right ✓</button><button class="jeo-wrong" data-host="wrong">Wrong ✗</button>`:''}<button data-host="reveal">${state.revealed?'Hide answer':'Show answer'}</button><button data-host="close">Back to board</button></div></div>`;}
    root.innerHTML=`<header class="tpl-top"><button class="icon-button" data-go="jeopardyShare" aria-label="Back">${ctx.icon('back')}</button><h1 class="jeo-board-title">${esc(g.title)}</h1><span class="tpl-spacer"></span></header>
<div class="jeo-grid" style="--cols:${g.categories.length}">${g.categories.map(c=>`<div class="jeo-cat">${esc(c.name)}</div>`).join('')}${[0,1,2].map(i=>g.categories.map((c,ci)=>{const used=state.used.includes(`${ci}-${i}`);return `<button class="jeo-tile ${used?'used':''}" data-open="${ci}-${i}" ${used?'disabled':''} aria-label="${esc(c.name)} for ${c.clues[i].v}">${used?'':'$'+c.clues[i].v}</button>`;}).join('')).join('')}</div>
<div class="jeo-scores">${players.length?players.map(([n,s])=>`<span><b>${esc(n)}</b>$${s}</span>`).join(''):'<span class="waiting">No players yet. Share the player link.</span>'}</div>${overlay}`;
  };
  on(root,'click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.open){state.open=b.dataset.open.split('-').map(Number);state.buzz=[];state.revealed=false;publish();}
    const h=b.dataset.host;if(!h)return;
    const [ci,i]=state.open||[],value=state.open?g.categories[ci].clues[i].v:0;
    if(h==='right'){const n=state.buzz[0];state.players[n]=(state.players[n]||0)+value;state.used.push(`${ci}-${i}`);state.open=null;state.buzz=[];}
    if(h==='wrong'){const n=state.buzz.shift();state.players[n]=(state.players[n]||0)-value;}
    if(h==='reveal')state.revealed=!state.revealed;
    if(h==='close'){state.used.includes(`${ci}-${i}`)||state.used.push(`${ci}-${i}`);state.open=null;state.buzz=[];}
    publish();
  });
  on(window,'storage',e=>{if(e.key!==MSG||!e.newValue)return;const m=JSON.parse(e.newValue);
    if(m.type==='join'&&m.name&&!(m.name in state.players)){state.players[m.name]=0;publish();}
    if(m.type==='buzz'&&state.open&&m.name in state.players&&!state.buzz.includes(m.name)){state.buzz.push(m.name);publish();}
  });
  publish();
}

function mountJeoPlay(){
  const root=document.getElementById('jeo-play');if(!root)return;
  const g=jeo();let me=sessionStorage.getItem('ribbon-jeopardy-name')||'';
  const draw=()=>{
    const s=live();
    if(!me){root.innerHTML=`<header class="tpl-top"><button class="icon-button" data-go="jeopardyShare" aria-label="Back">${ctx.icon('back')}</button><span></span><span class="tpl-spacer"></span></header><div class="jeo-join"><h1>${esc(g.title)}</h1><p>Join the game, then watch the board and buzz when a clue opens.</p><label class="beli-field"><span>Your name</span><input id="jeo-name" placeholder="Your name" autocomplete="given-name"></label><button class="jeo-primary" data-join>Join game</button></div>`;return;}
    const open=s.open,score=s.players[me]??0,place=s.buzz.indexOf(me);
    let main;
    if(open){const [ci,i]=open,c=g.categories[ci].clues[i];main=`<div class="jeo-player-clue"><small>${esc(g.categories[ci].name)} · $${c.v}</small><p>${esc(c.q)}</p></div><button class="jeo-buzz ${place===0?'first':place>0?'queued':''}" data-buzz ${place>=0?'disabled':''}>${place===0?'You’re first!':place>0?`#${place+1} in line`:'Buzz'}</button>`;}
    else main=`<div class="jeo-waiting"><span class="jeo-pulse" aria-hidden="true"></span><p>Watch the board. The buzzer wakes up when a clue opens.</p></div>`;
    root.innerHTML=`<header class="tpl-top"><button class="icon-button" data-go="jeopardyShare" aria-label="Back">${ctx.icon('back')}</button><span class="jeo-me">${esc(me)}</span><span class="jeo-my-score">$${score}</span></header>${main}`;
  };
  on(root,'click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.join!==undefined){me=(document.getElementById('jeo-name').value||'').trim();if(!me)return;sessionStorage.setItem('ribbon-jeopardy-name',me);send({type:'join',name:me});draw();}
    if(b.dataset.buzz!==undefined){send({type:'buzz',name:me});b.classList.add('pressed');}
  });
  on(window,'storage',e=>{if(e.key===LIVE)draw();});
  if(me)send({type:'join',name:me});
  draw();
}

/* =========================================================== Shared */
function onCopy(e){const b=e.target.closest('[data-tpl-copy]');if(!b)return;const url=link(b.dataset.tplCopy);
  (navigator.clipboard?.writeText(url)||Promise.reject()).then(()=>ctx.toast('Link copied.'),()=>ctx.toast(url));}

function mount(name,c){
  unmount();
  if(!pages[name])return;
  ctx=c;screen=name;
  on(document,'click',onCopy);
  mounters[name]?.(ctx);
}
function unmount(){unmounters[screen]?.();cleanup.forEach(f=>f());cleanup=[];screen='';}
const unmounters={};
const mounters={triviaTemplates:()=>on(document,'click',e=>{const b=e.target.closest('[data-tpl-concept]');if(b)ctx.toast(`${b.dataset.tplConcept} is a concept in this prototype.`);}),beli:mountBeliEditor,beliPlay:mountBeliPlay,jeopardy:mountJeoEditor,jeopardyBoard:mountJeoBoard,jeopardyPlay:mountJeoPlay};
// Other template files add screens here: register({name:{markup(ctx),mount(ctx,on)}}).
function register(defs){Object.entries(defs).forEach(([name,d])=>{pages[name]=()=>d.markup(ctx);if(d.mount)mounters[name]=c=>d.mount(c,on);if(d.unmount)unmounters[name]=d.unmount;});}
function markup(name,c){ctx=c;return pages[name]();}

window.RibbonTemplates={get names(){return Object.keys(pages);},markup,mount,unmount,register,shareCard:(...a)=>shareCard(...a)};
})();
