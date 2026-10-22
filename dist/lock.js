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
  // Opening the app plays the Ribbon loading screen (Figma 236:408) over home, then fades it away.
  shell.insertAdjacentHTML('beforeend',loaderMarkup());
  const loader=document.getElementById('ribbon-loader');
  lock.classList.add('opening');
  setTimeout(()=>lock.remove(),560);
  // The loader fades as home rises in underneath it.
  const finish=()=>{if(!loader.isConnected)return;shell.classList.add('is-revealing');loader.classList.add('leaving');setTimeout(()=>{loader.remove();shell.classList.remove('is-locked','is-opening');document.getElementById('app')?.focus({preventScroll:true});},500);setTimeout(()=>shell.classList.remove('is-revealing'),900);setTimeout(traceHeroCard,700);};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){loader.classList.add('still');setTimeout(finish,900);return;}
  loader.addEventListener('click',finish,{once:true});
  setTimeout(finish,3500);
}

// Once home has settled, a hairline of light travels once around the occasion card, then fades away.
function traceHeroCard(){const card=document.querySelector('.home-hero-card');if(!card||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ring=document.createElement('span');ring.className='hero-trace';ring.setAttribute('aria-hidden','true');card.appendChild(ring);
  ring.addEventListener('animationend',e=>{if(e.animationName==='hero-trace-fade')ring.remove();});}

/* The loading screen: 1 the bow draws along its path, 2 it shrinks and lifts as a box rises beneath it,
   3 it bounces down onto the box, 4 the icon settles above the Ribbon wordmark, 5 the warm gradient rises. */
function loaderMarkup(){
  const loop='fill="none" stroke="white" stroke-width="4.4" pathLength="1"';
  return `<div class="ribbon-loader" id="ribbon-loader" role="img" aria-label="Ribbon">
<div class="rl-glow" aria-hidden="true"></div>
<div class="rl-stage" aria-hidden="true">
  <div class="rl-icon">
    <div class="rl-box"><i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i></div>
    <svg class="rl-bow" viewBox="0 0 39 32" overflow="visible">
      <path class="rl-loop a" ${loop} d="M19.058 19.5761C20.9064 18.0174 11.0997 2.56474 5.82048 8.23362C0.541201 13.9025 17.2092 21.1349 19.058 19.5761Z"/>
      <path class="rl-loop b" ${loop} d="M19.5631 19.5761C17.7147 18.0174 27.5213 2.56474 32.8006 8.23362C38.0799 13.9025 21.4119 21.1349 19.5631 19.5761Z"/>
      <path class="rl-tail a" ${loop} stroke-linecap="round" d="M20.34 19.07L10.03 25.43"/>
      <path class="rl-tail b" ${loop} stroke-linecap="round" d="M18.31 18.78L29.34 25.72"/>
    </svg>
  </div>
  <p class="rl-word">Ribbon</p>
</div></div>`;
}

const start=()=>{if(!location.hash||location.hash==='#home')show();};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start):start();
window.RibbonLock={show};
})();
