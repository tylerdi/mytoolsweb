import { createBeadView } from './beads.mjs';
import { createBeadMotion } from './beads-core.mjs';
import { createTemple } from './scene.mjs';
import { createSoundscape } from './audio.mjs';
import { PLACES, formatTime } from './walk.mjs';
import { createI18n, LOCALES } from './i18n.mjs';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const icons={
 sound:'<path d="M11 4 6 8H3v8h3l5 4z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--paper)"/><circle cx="15" cy="17" r="3" fill="var(--paper)"/>',
 pointer:'<path d="m5 3 4 17 4-7 7-3z"/>',
 camera:'<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13" r="4"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01"/>',
 sit:'<circle cx="12" cy="5" r="2"/><path d="m9 10-3 5-4 1m13-6 3 5 4 1M9 10l3 4 3-4M12 14v5M12 19c-8-4-10 3-3 2h6c7 1 5-6-3-2"/>',
 bell:'<path d="M5 18h14l-2-4V9a5 5 0 0 0-10 0v5zM10 21h4M12 2v2M3 10 2 7M21 10l1-3"/>',
 wood:'<path d="M18 11c3 2 3 8-2 9H7c-6-2-3-10 2-10h5M9 14l7-8M14 5l4-3 3 3-4 4M5 20h14"/>',
 fish:'<path d="M18 12c-5-8-13-6-16 0 3 6 11 8 16 0Zm0 0 4-5v10zM9 8l3-4M9 16l3 4M6 11h.01"/>',
 greet:'<path d="M11 20V7c0-3-2-4-3-2L6 12l-3 5 5 4M13 20V7c0-3 2-4 3-2l2 7 3 5-5 4"/>',
 beads:'<circle cx="12" cy="10" r="7" stroke-dasharray="1 4" stroke-width="3.5"/><path d="M12 17v3m-2 2 2-3 2 3"/>',
 share:'<path d="M12 16V3m-4 4 4-4 4 4M5 12v9h14v-9"/>'
};
for(const el of $$('[data-icon]'))el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[el.dataset.icon]}</svg>`;
let world,audio=createSoundscape(),active=null,phase='ready',duration=1,remaining=60,lastTick=performance.now(),toastTimer,lastToast=null,woodCount=0,feedCount=0,bellCooldown=0,postcardURL='',locationKey='location_start',shareState='private',errorKey='errorWebGL';
let beadsView=null,greetingUntil=0,greetingTimer;const beadMotion=createBeadMotion();
const i18n=createI18n(renderLocale),t=(key,values)=>i18n.t(key,values);
const eyebrows={sit:'JUST BREATHE',bell:'A SOUND INTO THE DISTANCE',wood:'ONE BEAT AT A TIME',fish:'LITTLE MOMENTS OF WONDER',greet:'A QUIET HELLO',beads:'ONE BEAD AT A TIME'};
const localPreview=()=>['127.0.0.1','localhost'].includes(location.hostname);
function toast(key,values){lastToast={key,values};clearTimeout(toastTimer);$('#toast').textContent=t(key,values);$('#toast').classList.add('show');toastTimer=setTimeout(()=>{$('#toast').classList.remove('show');lastToast=null;$('#toast').textContent='';},3500);}
function fail(key){errorKey=key;$('#welcome').close();$('#error-detail').textContent=t(key);$('#error').hidden=false;}
function soundUI(){const on=audio.enabled;$('#sound').setAttribute('aria-pressed',String(on));$('#sound').setAttribute('aria-label',t(on?'soundOff':'soundOn'));$('#audio-setting').checked=on;$('#sound').style.opacity=on?'1':'.65';}
async function enableSound(on){try{await audio.setEnabled(on);soundUI();}catch{toast('audioFailed');soundUI();}}
function renderActivity(){
 if(!active)return;
 $('#action-eyebrow').textContent=eyebrows[active];$('#action-title').textContent=t(active+'Title');
 $('#action-description').textContent=t(phase==='walking'?'walkDescription':active+'Description');
 $('#beads-widget').hidden=active!=='beads';$('#action-panel').dataset.activity=active;
 $('#bead-count').textContent=t('beadsCount',{n:beadMotion.count});
 $('#sit-options').hidden=active!=='sit'||phase==='walking';$('#sit-timer').textContent=formatTime(remaining);
 $$('[data-duration]').forEach(b=>{b.disabled=phase==='meditating';b.setAttribute('aria-pressed',String(Number(b.dataset.duration)===duration));});
 let button=active+'Button',note=active+'Note',params={n:woodCount};
 if(phase==='walking'){button='walkButton';note='walkNote';params={place:t('location_'+active)};}
 else if(active==='sit'){
  if(phase==='meditating'){button='sitEnd';note='sitDuring';}
  if(phase==='stopped'){button='sitAgain';note='sitStopped';}
  if(phase==='complete'){button='sitAgain';note='sitComplete';}
 }else if(active==='bell'&&performance.now()<bellCooldown)button='bellWait';
 else if(active==='greet'&&performance.now()<greetingUntil)button='greetDuring';
 else if(active==='fish'&&feedCount){note='fishFed';params={n:feedCount};}
 $('#do-action').textContent=t(button);$('#action-note').textContent=t(note,params);
 $('#do-action').disabled=phase==='walking'||(active==='bell'&&performance.now()<bellCooldown)||(active==='greet'&&performance.now()<greetingUntil);
}
function renderShareNote(){
 $('#share-note').textContent=shareState==='copied'?t('copyDone')+t(localPreview()?'copyLocal':'copyInvite'):shareState==='manual'?t('copyManual',{url:shareLink()}):shareState==='failed'?t('nativeFailed'):t(localPreview()?'shareLocal':'sharePrivate');
}
function renderLocale(){
 soundUI();$('#weather-label').textContent=t('weather_'+$('#rain').value);$('#location span').textContent=t(locationKey);
 $('#enter').textContent=t(world?'enter':'loading');$('#error-detail').textContent=t(errorKey);renderActivity();renderShareNote();world?.setLanguage(i18n.language);
 $('#toast').textContent=lastToast?t(lastToast.key,lastToast.values):'';
 if($('#share-dialog').open)updatePostcard().catch(()=>toast('cardFailed'));
}
function leave({quiet=false}={}){clearTimeout(greetingTimer);greetingUntil=0;beadsView?.setActive(false);beadMotion.halt();document.body.classList.remove('has-activity');world?.cancel();world?.setStance('idle');active=null;phase='ready';$$('[data-duration]').forEach(b=>b.disabled=false);document.body.classList.remove('quiet');$('#action-panel').hidden=true;$$('[data-action]').forEach(b=>b.setAttribute('aria-pressed','false'));if(!quiet)$('#world').focus({preventScroll:true});}
function chooseActivity(kind){
 leave({quiet:true});active=kind;document.body.classList.add('has-activity');phase=['greet','beads'].includes(kind)?'ready':'walking';$('#action-panel').hidden=false;renderActivity();$$('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===kind)));
 if(kind==='greet'||kind==='beads'){
  locationKey='location_'+kind;$('#location span').textContent=t(locationKey);world.focusTraveler();
  if(kind==='greet')performGreeting();
  else{
   world.setStance('beads');
   if(!beadsView){try{beadsView=createBeadView($('#beads-canvas'),{motion:beadMotion,onStep:()=>audio.bead(),onChange:beadsChanged});}catch{toast('beadsFailed');$('#beads-canvas').hidden=true;}}
   beadsView?.setReduced($('#motion').checked);beadsView?.setActive(true);
  }
  renderActivity();return;
 }
 const ok=world.moveTo(PLACES[kind].x,PLACES[kind].z,()=>{
  if(active!==kind)return;phase='ready';world.focusPlace(PLACES[kind].x,PLACES[kind].z);locationKey='location_'+kind;$('#location span').textContent=t(locationKey);
  if(kind==='sit')remaining=duration*60;renderActivity();toast('arrived');
 });
 if(!ok){leave();toast('noPath');}
}
function performGreeting(){
 if(performance.now()<greetingUntil)return;
 greetingUntil=performance.now()+3000;world.effect('greet');renderActivity();
 greetingTimer=setTimeout(()=>{if(active==='greet'){renderActivity();toast('greetDone');}},3050);
}
function beadsChanged(count,angle){
 const text=t('beadsCount',{n:count});if($('#bead-count').textContent!==text)$('#bead-count').textContent=text;
 world?.setBeadPhase(angle);
}
$('#beads-reset').addEventListener('click',()=>{if(beadsView)beadsView.reset();else{beadMotion.reset();beadsChanged(0,0);}});
i18n.apply();$('#welcome').showModal();
try{
 world=createTemple($('#world'),{onGround:p=>{
   if(active)leave({quiet:true});
   if(!world.moveTo(p.x,p.z))toast('blocked');else{locationKey='location_walk';$('#location span').textContent=t(locationKey);}
 },onArrival:()=>{},onError:()=>fail('errorContext')});
 world.setLanguage(i18n.language);$('#enter').disabled=false;$('#enter').textContent=t('enter');
}catch(e){console.error('Temple initialization failed',e);fail('errorWebGL');}
$('#enter').addEventListener('click',()=>{if($('#welcome-sound').checked)enableSound(true);toast('entered');setTimeout(()=>$('#world').focus({preventScroll:true}),0);});
$('#sound').addEventListener('click',()=>enableSound(!audio.enabled));
$('#audio-setting').addEventListener('change',e=>enableSound(e.target.checked));
$('#settings').addEventListener('click',()=>$('#settings-dialog').showModal());
$('#help').addEventListener('click',()=>$('#help-dialog').showModal());
for(const d of $$('dialog')){d.querySelector('[data-close]')?.addEventListener('click',()=>d.close());d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)d.close();}});}
$('#camera').addEventListener('click',()=>{world.overview();toast('overview');});
$('#motion').checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
$('#motion').addEventListener('change',e=>{world.setReduced(e.target.checked);beadMotion.setReduced(e.target.checked);beadsView?.setReduced(e.target.checked);});
$('#rain').addEventListener('change',e=>{world.setRain(e.target.value);audio.setRain(e.target.value);$('#weather-label').textContent=t('weather_'+e.target.value);});
$$('[data-action]').forEach(b=>b.addEventListener('click',()=>chooseActivity(b.dataset.action)));
$('#leave').addEventListener('click',()=>leave());
$$('[data-duration]').forEach(b=>b.addEventListener('click',()=>{if(phase==='meditating')return;duration=Number(b.dataset.duration);remaining=duration*60;renderActivity();}));
$('#do-action').addEventListener('click',()=>{
 if(phase==='walking'||!active)return;
 if(active==='greet'){performGreeting();return;}
 if(active==='beads'){if(beadsView)beadsView.step();else{beadMotion.step();beadsChanged(beadMotion.count,beadMotion.angle);audio.bead();}return;}
 if(active==='sit'){
  if(phase==='meditating'){phase='stopped';world.setStance('idle');document.body.classList.remove('quiet');renderActivity();return;}
  remaining=duration*60;lastTick=performance.now();phase='meditating';world.setStance('sit');document.body.classList.add('quiet');
 }else if(active==='bell'){
  if(performance.now()<bellCooldown)return;world.effect('bell');audio.bell();bellCooldown=performance.now()+2000;
  setTimeout(()=>{if(active==='bell')renderActivity();},2050);if(!audio.enabled)toast('bellMuted');
 }else if(active==='wood'){world.effect('wood');audio.wood();woodCount++;}
 else if(active==='fish'){world.effect('fish');audio.water();feedCount++;}
 renderActivity();
});
setInterval(()=>{
 const now=performance.now(),dt=Math.min((now-lastTick)/1000,1);lastTick=now;
 if(phase!=='meditating'||document.hidden||$$('dialog[open]').length)return;
 remaining=Math.max(0,remaining-dt);$('#sit-timer').textContent=formatTime(remaining);
 if(remaining===0){phase='complete';document.body.classList.remove('quiet');world.setStance('idle');renderActivity();audio.bell();toast('sitToast');}
},250);
document.addEventListener('visibilitychange',()=>{lastTick=performance.now();});
$('#world').addEventListener('keydown',e=>{if(active&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){beadsView?.setActive(false);beadMotion.halt();document.body.classList.remove('has-activity');active=null;phase='ready';document.body.classList.remove('quiet');$('#action-panel').hidden=true;$$('[data-action]').forEach(b=>b.setAttribute('aria-pressed','false'));}});
async function postcard(){
 const photo=new Image();photo.src=world.capture();await photo.decode();const c=document.createElement('canvas');c.width=1200;c.height=900;const ctx=c.getContext('2d');ctx.fillStyle='#f0f0e4';ctx.fillRect(0,0,1200,900);
 const ratio=Math.max(1120/photo.width,660/photo.height),w=photo.width*ratio,h=photo.height*ratio;ctx.save();ctx.beginPath();ctx.rect(40,40,1120,660);ctx.clip();ctx.drawImage(photo,40+(1120-w)/2,40+(660-h)/2,w,h);ctx.restore();ctx.fillStyle='#345342';ctx.font=i18n.language==='ko'?'32px "Apple SD Gothic Neo",sans-serif':i18n.language==='ja'?'34px "Hiragino Mincho ProN",serif':'36px "Songti SC",Georgia,serif';ctx.fillText(t('cardTitle'),50,770);ctx.font='18px sans-serif';ctx.fillStyle='#7b8870';ctx.fillText(t('cardLine'),52,816);ctx.textAlign='right';ctx.font='16px sans-serif';ctx.fillText(new Intl.DateTimeFormat(LOCALES[i18n.language].date,{timeZone:'Asia/Shanghai',dateStyle:'medium'}).format(new Date()),1145,816);return c.toDataURL('image/png');
}
let cardRequest=0;
async function updatePostcard(){const request=++cardRequest;const image=await postcard();if(request!==cardRequest)return;postcardURL=image;$('#postcard').src=image;}
function shareLink(){const url=new URL(location.href);url.search='';url.hash='';if(document.body.dataset.siteRoot)url.pathname='/'+i18n.language+'/';else url.searchParams.set('lang',i18n.language);return url.href;}
$('#share').addEventListener('click',async()=>{try{await updatePostcard();shareState='private';renderShareNote();$('#native-share').hidden=!navigator.share;$('#share-dialog').showModal();}catch{toast('cardFailed');}});
$('#download').addEventListener('click',()=>{if(!postcardURL)return;const a=document.createElement('a');a.download=LOCALES[i18n.language].filename;a.href=postcardURL;a.click();toast('downloaded');});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(shareLink());shareState='copied';}catch{shareState='manual';}renderShareNote();});
$('#native-share').addEventListener('click',async()=>{try{await navigator.share({title:t('title'),text:t('shareText'),url:shareLink()});}catch(e){if(e.name!=='AbortError'){shareState='failed';renderShareNote();}}});
window.addEventListener('error',()=>{if(!world)fail('errorScript');});
