/* Demo opener: an iPhone lock screen (Figma 181:279) where Ribbon's notification pops in.
   Tapping it opens the app to home. Shown whenever the demo loads on home; deep links skip it. */
(()=>{
'use strict';

const A='assets/lock/';
// SF Symbols exported from the Figma lock screen; each blends plus-lighter (Figma's linear dodge) like iOS.
const sym=(name,cls)=>`<img class="lock-sym ${cls}" src="${A}sym-${name}.svg" alt="">`;

function markup(){
  return `<div class="lock-screen" id="lock-screen" role="dialog" aria-label="Lock screen">
<div class="lock-wallpaper" aria-hidden="true"><img src="${A}wallpaper.png" alt=""></div>
<div class="lock-status" aria-hidden="true"><img class="lock-cell" src="${A}cellular.svg" alt=""><img class="lock-wifi" src="${A}wifi.svg" alt=""><span class="lock-battery"><i></i><img src="${A}battery-cap.svg" alt=""></span></div>
<span class="lock-swipe" aria-hidden="true"></span>
<p class="lock-date">Wed Oct 21</p>
<div class="lock-clock" id="lock-clock" role="img" aria-label="9:41"></div>
<div class="lock-widgets" aria-hidden="true">
  <div class="lock-weather"><p class="lock-weather-head">${sym('cloud-sun','sym-cloud')}<span>72º</span></p><p>Partly Cloudy</p><p>H:88º L:64º</p></div>
  <div class="lock-circles">
    <div class="lock-gauge"><div class="lock-gauge-frame"><img class="lock-gauge-arc" src="${A}gauge.svg" alt=""><img class="lock-gauge-dot" src="${A}gauge-indicator.svg" alt=""><b>67</b><small class="min">50</small><small class="max">78</small></div></div>
    <div class="lock-sunset"><i class="lock-sunset-blur"></i><span>${sym('sunset','sym-sunset')}<b>8:29</b><small>PM</small></span></div>
  </div>
</div>
<button class="lock-note lock-glass" id="lock-note" aria-label="Ribbon notification: Maya’s birthday is coming up! Want to make her something special? Open Ribbon">
  <img class="lock-note-icon" src="${A}app-icon.png" alt="">
  <span class="lock-note-text"><strong>Ribbon</strong><span>Maya’s birthday is coming up! Want to make her something special?</span></span>
  <time>9:30 AM</time>
</button>
<div class="lock-controls" aria-hidden="true"><span class="lock-glass">${sym('flashlight','sym-flashlight')}</span><span class="lock-glass">${sym('camera','sym-camera')}</span></div>
<span class="lock-home-bar" aria-hidden="true"></span>
</div>`;
}

/* The 9:41 from Figma: a 30px background blur inside the digits, a color-dodge fill plus 35% white,
   and a glass layer lit from the top-left (light angle 315°). Figma exports the blur as an unclipped
   foreignObject (it showed as a box), so the blur is rebuilt as a clipped HTML layer instead. */
function clockSVG(raw){
  const path=(raw.match(/<path id="stroke0_0_101" d="([^"]+)"/)||[])[1];if(!path)return raw.replace(/<foreignObject[\s\S]*?<\/foreignObject>/,'');
  return `<div class="lock-clock-blur" aria-hidden="true"></div>
<svg width="205.06" height="87.4004" viewBox="0 0 205.06 87.4004" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><path id="lock-941" d="${path}"/><clipPath id="lock-941-clip"><use href="#lock-941"/></clipPath>
<linearGradient id="lock-941-sheen" x1="0" y1="0" x2="205" y2="87.4" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>
<linearGradient id="lock-941-rim" x1="0" y1="0" x2="205" y2="87.4" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient></defs>
<use href="#lock-941" fill="#949494" style="mix-blend-mode:color-dodge"/>
<use href="#lock-941" fill="#F5F5F5" fill-opacity=".35"/>
<use href="#lock-941" fill="url(#lock-941-sheen)" style="mix-blend-mode:screen"/>
<g clip-path="url(#lock-941-clip)"><use href="#lock-941" stroke="url(#lock-941-rim)" stroke-width="2.4" fill="none"/></g>
</svg>`;
}
function show(){
  const shell=document.querySelector('.app-shell');if(!shell||document.getElementById('lock-screen'))return;
  shell.insertAdjacentHTML('beforeend',markup());shell.classList.add('is-locked');window.scrollTo(0,0);
  const lock=document.getElementById('lock-screen'),note=document.getElementById('lock-note');
  // Inline the clock so its color-dodge and backdrop blur composite with the wallpaper, as in iOS.
  fetch(A+'clock-fill.svg').then(r=>r.ok?r.text():Promise.reject()).then(svg=>{const c=document.getElementById('lock-clock');if(c)c.innerHTML=clockSVG(svg);}).catch(()=>{});
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
