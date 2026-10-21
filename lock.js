/* Demo opener: an iPhone lock screen (Figma 181:279) where Ribbon's notification pops in.
   Tapping it opens the app to home. Shown whenever the demo loads on home; deep links skip it. */
(()=>{
'use strict';

const A='assets/lock/';
// SF Symbols aren't shipped as assets, so these are small line stand-ins in the same slots.
const SYM={
  cloud:'<svg viewBox="0 0 20 16" fill="currentColor"><circle cx="7" cy="6" r="3.2"/><path d="M7 .6v1.6M2.2 2.4l1.1 1.1M.6 6h1.6M11.8 2.4l-1.1 1.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M8.5 15.5h7.2a3.3 3.3 0 0 0 .3-6.6 4.6 4.6 0 0 0-8.7 1.3 2.7 2.7 0 0 0 1.2 5.3Z"/></svg>',
  sunset:'<svg viewBox="0 0 20 14" fill="currentColor"><path d="M3.5 11a6.5 6.5 0 0 1 13 0Z"/><path d="M10 .5v3M6.7 2.6 8 4.4M13.3 2.6 12 4.4M1 13h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  flashlight:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10v4l-2.5 4v11a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V10L7 6Z"/><circle cx="12" cy="14" r="1.3" fill="#2a2a2a"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.6 5.5 10 3.6h4l1.4 1.9h3.1A2.5 2.5 0 0 1 21 8v9.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5V8a2.5 2.5 0 0 1 2.5-2.5Z"/><circle cx="12" cy="12.6" r="3.6" fill="#2a2a2a"/><circle cx="12" cy="12.6" r="2.4"/></svg>'
};

function markup(){
  return `<div class="lock-screen" id="lock-screen" role="dialog" aria-label="Lock screen">
<div class="lock-wallpaper" aria-hidden="true"><img src="${A}wallpaper.png" alt=""></div>
<div class="lock-status" aria-hidden="true"><img class="lock-cell" src="${A}cellular.svg" alt=""><img class="lock-wifi" src="${A}wifi.svg" alt=""><span class="lock-battery"><i></i><img src="${A}battery-cap.svg" alt=""></span></div>
<span class="lock-swipe" aria-hidden="true"></span>
<p class="lock-date">Wed Oct 21</p>
<div class="lock-clock" id="lock-clock" role="img" aria-label="9:41"><img src="${A}clock-fill.svg" alt=""></div>
<div class="lock-widgets" aria-hidden="true">
  <div class="lock-weather"><p class="lock-weather-head">${SYM.cloud}<span>72º</span></p><p>Partly Cloudy</p><p>H:88º L:64º</p></div>
  <div class="lock-circles">
    <div class="lock-gauge"><img class="lock-gauge-arc" src="${A}gauge.svg" alt=""><img class="lock-gauge-dot" src="${A}gauge-indicator.svg" alt=""><b>67</b><small class="min">50</small><small class="max">78</small></div>
    <div class="lock-sunset"><span>${SYM.sunset}<b>8:29</b><small>PM</small></span></div>
  </div>
</div>
<button class="lock-note" id="lock-note" aria-label="Ribbon notification: Maya’s birthday is coming up! Want to make her something special? Open Ribbon">
  <img class="lock-note-icon" src="${A}app-icon.png" alt="">
  <span class="lock-note-text"><strong>Ribbon</strong><span>Maya’s birthday is coming up! Want to make her something special?</span></span>
  <time>9:30 AM</time>
</button>
<div class="lock-controls" aria-hidden="true"><span>${SYM.flashlight}</span><span>${SYM.camera}</span></div>
<span class="lock-home-bar" aria-hidden="true"></span>
</div>`;
}

function show(){
  const shell=document.querySelector('.app-shell');if(!shell||document.getElementById('lock-screen'))return;
  shell.insertAdjacentHTML('beforeend',markup());shell.classList.add('is-locked');window.scrollTo(0,0);
  const lock=document.getElementById('lock-screen'),note=document.getElementById('lock-note');
  // Inline the clock so its color-dodge and backdrop blur composite with the wallpaper, as in iOS.
  fetch(A+'clock-fill.svg').then(r=>r.ok?r.text():Promise.reject()).then(svg=>{const c=document.getElementById('lock-clock');if(c)c.innerHTML=svg;}).catch(()=>{});
  // The notification arrives a beat after the lock screen settles.
  setTimeout(()=>{note.classList.add('in');note.focus({preventScroll:true});},matchMedia('(prefers-reduced-motion: reduce)').matches?0:900);
  note.addEventListener('click',()=>open(lock),{once:true});
}
function open(lock){
  const shell=document.querySelector('.app-shell');
  if(location.hash&&location.hash!=='#home')location.hash='home';
  lock.classList.add('opening');shell.classList.add('is-opening');
  const done=()=>{lock.remove();shell.classList.remove('is-locked','is-opening');document.getElementById('app')?.focus({preventScroll:true});};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return done();
  setTimeout(done,560);
}

const start=()=>{if(!location.hash||location.hash==='#home')show();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.RibbonLock={show};
})();
