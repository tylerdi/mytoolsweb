import { interactionMessages } from './interaction-locales.mjs';
import ja from './locales/ja.mjs';
import ko from './locales/ko.mjs';
export const LOCALES = Object.freeze({
 zh:{label:'中文',html:'zh-CN',date:'zh-CN',sign:'听 雨 山 寺',filename:'听雨山寺-山中明信片.png'},
 en:{label:'English',html:'en',date:'en-GB',sign:'RAIN TEMPLE',filename:'rain-temple-postcard.png'},
 ja:{label:'日本語',html:'ja',date:'ja-JP',sign:'雨音の山寺',filename:'雨音の山寺-絵はがき.png'},
 ko:{label:'한국어',html:'ko',date:'ko-KR',sign:'빗소리 산사',filename:'빗소리-산사-엽서.png'},
});
export const messages = {
 zh: {
  title:'听雨山寺 · 在这里，慢下来',description:'一处可以散步、听雨、敲钟与看鱼的在线山寺。给自己留一小会儿。', brand:'听雨山寺', brandLabel:'听雨山寺首页', language:'语言 / Language',
  world:'可漫游的三维山寺庭院，点击地面行走，拖动旋转视角', settings:'打开设置', soundOn:'开启声音',soundOff:'关闭声音',
  poemLabel:'山寺寄语',seal:'听 雨',poem:'山色入怀，<br>暂忘尘事。',poemBody:'不必赶路，也没有待办。<br>在这片雨声里，坐一会儿。',poemFoot:'一隅山寺 · 一刻清闲',
  hint:'轻点石径行走 <b>·</b> 拖动环顾 <b>·</b> 滚轮缩放',camera:'回到全景视角',help:'操作帮助',activities:'山中小事',activitiesCaption:'山 中 小 事',
  sitLabel:'坐听雨',sitSub:'给自己片刻',bellLabel:'敲晚钟',bellSub:'一声入远山',woodLabel:'叩木鱼',woodSub:'心随声渐静',fishLabel:'看锦鲤',fishSub:'池边有闲趣',
  footer:'原创交互体验 · 单人庭院',share:'寄一张山中明信片',currentActivity:'当前活动',leave:'离开当前活动',duration:'静坐时长',minute:'{n} 分钟',
  welcomeTitle:'给自己，一场山雨的时间。',welcomeBody:'沿石径走走，听一声钟，看一池鱼。<br>这里没有任务，随时来，随时离开。',welcomeSound:'开启雨声与互动音效',welcomeMuted:'默认静音，可随时关闭',welcomeNote:'原创单人试玩版 · 无需登录 · 不采集游玩数据',enter:'走进山寺 →',loading:'正在铺好山间石径…',
  settingsTitle:'山中偏好',closeSettings:'关闭设置',audioSetting:'雨声与音效',audioHint:'首次开启需要你的点击',rainSetting:'雨势',rainHint:'同时调整雨景和雨声',light:'微雨',steady:'细雨',off:'雨歇',motionSetting:'减少动态效果',motionHint:'关闭飘叶、雨线与自动水波',settingsNote:'所有声音在浏览器内合成，未开启麦克风。语言偏好保存在此浏览器，其余设置仅当前页面有效。',
  helpTitle:'慢慢来，就会了。',closeHelp:'关闭帮助',helpWalk:'<strong>散步</strong>轻点庭院地面，旅人会沿可走的路线前往。',helpLook:'<strong>环顾</strong>按住画面拖动；滚轮或双指捏合缩放。',helpKeys:'<strong>键盘</strong>点击庭院后，用方向键或 WASD 行走。',helpActivity:'<strong>小事</strong>点击底部活动，旅人会先走到对应位置。',helpAudio:'<strong>声音</strong>点击右上方声音按钮后才会播放。',helpNote:'这是单人庭院，不显示其他真实访客。静坐计时在页面隐藏时暂停。',
  shareTitle:'把这片安静，寄给朋友。',closeShare:'关闭明信片',postcardAlt:'当前山寺风景明信片',download:'保存明信片',copy:'复制体验链接',nativeShare:'系统分享',sharePrivate:'明信片在本地生成，不上传场景截图。',shareLocal:'当前为本地试玩链接，其他设备暂时无法访问；明信片可以直接保存。',copyDone:'体验链接已复制。',copyLocal:'这是本地地址，上线后才能邀请朋友。',copyInvite:'愿朋友也能遇见这片安静。',copyManual:'请手动复制链接：{url}',nativeFailed:'系统分享暂不可用，可以复制链接或保存明信片。',cardFailed:'明信片生成失败，请稍后重试。',downloaded:'明信片已交给浏览器保存。',cardTitle:'听雨山寺 · 在这里，慢下来。',cardLine:'山色入怀，暂忘尘事。',shareText:'给自己，一场山雨的时间。',
  errorTitle:'这片山景暂时无法打开',errorWebGL:'三维场景未能启动。请使用支持 WebGL 2 的新版浏览器，并检查硬件加速是否开启。',errorContext:'三维画面连接中断，请重新进入。',errorScript:'场景脚本加载失败，请刷新后再试。',retry:'重新进入',audioFailed:'声音暂时无法开启，请检查浏览器的声音权限。',
  weather_light:'山中微雨',weather_steady:'山中细雨',weather_off:'山中雨歇',location_start:'山门 · 初来',location_walk:'庭院 · 漫步',location_sit:'檐下 · 听雨',location_bell:'钟亭 · 远声',location_wood:'木鱼 · 一念',location_fish:'池畔 · 游鱼',
  walkDescription:'沿着石径，慢慢走过去…',walkButton:'正在前往…',walkNote:'正在前往{place}',arrived:'到了。这里的时间，可以慢一点。',noPath:'这条路暂时走不到，请先回到石径再试。',blocked:'那边是山石或水面，试着点一下石径。',entered:'轻点地面，开始你自己的山中散步。',overview:'回到山寺全景。',
  sitTitle:'檐下，听一会儿雨。',sitDescription:'不用调整呼吸，也不用完成什么。让雨落下，让念头经过。',sitButton:'开始静坐',sitNote:'随时可以结束。切到其他页面时暂停计时。',sitEnd:'结束静坐',sitAgain:'再坐一会儿',sitDuring:'让肩膀放松，听一听身边的声音。',sitStopped:'不必坐满。愿这片刻，已经让你轻松一点。',sitComplete:'这一刻，留给了自己。想继续坐，也很好。',sitToast:'雨还在下，你已经可以慢慢出发了。',
  bellTitle:'晚钟，入远山。',bellDescription:'轻敲一下，让钟声慢慢散开。不急着敲下一声。',bellButton:'敲一声钟',bellNote:'开启声音，可以听见钟声的余韵。',bellWait:'让余音走一会儿…',bellMuted:'钟已敲响。右上角开启声音，可听见余韵。',
  woodTitle:'一叩，一念。',woodDescription:'指尖落下，木声响起。按自己的节奏就好。',woodButton:'轻叩木鱼',woodNote:'已叩 {n} 次 · 不计功德，只听声音。',fishTitle:'池中，也有慢生活。',fishDescription:'撒一点鱼食，看锦鲤从荷叶间慢慢游过来。',fishButton:'撒一点鱼食',fishNote:'锦鲤会聚拢一会儿，再继续游弋。',fishFed:'撒下第 {n} 小把鱼食。看，它们游过来了。',
 },
 en: {
  title:'Rain Temple · A little room to breathe',description:'A quiet, interactive mountain courtyard. Take a walk, listen to the rain, ring a bell and watch the koi.',brand:'Rain Temple',brandLabel:'Rain Temple home',language:'Language / 语言',
  world:'An interactive 3D temple courtyard. Click the ground to walk; drag to look around.',settings:'Open settings',soundOn:'Turn sound on',soundOff:'Turn sound off',
  poemLabel:'A thought from the mountains',seal:'RAIN',poem:'A little room<br>to breathe.',poemBody:'Nowhere to rush. Nothing to finish.<br>Stay a while, and listen to the rain.',poemFoot:'A quiet corner. A moment of your own.',
  hint:'Click to walk <b>·</b> Drag to look <b>·</b> Scroll to zoom',camera:'Return to courtyard view',help:'How to explore',activities:'Quiet moments',activitiesCaption:'L I T T L E  M O M E N T S',
  sitLabel:'Sit & listen',sitSub:'A moment for you',bellLabel:'Ring the bell',bellSub:'Into the mountains',woodLabel:'Wooden fish',woodSub:'One gentle beat',fishLabel:'Watch the koi',fishSub:'Life by the pond',
  footer:'An original experience · Single-player courtyard',share:'Send a mountain postcard',currentActivity:'Current activity',leave:'Leave this activity',duration:'Sitting duration',minute:'{n} min',
  welcomeTitle:'Stay for a little mountain rain.',welcomeBody:'Follow the stone path. Ring a bell. Watch the koi.<br>No tasks to finish. Come and go as you please.',welcomeSound:'Enable rain sounds and sound effects',welcomeMuted:'Sound is off by default. Change it anytime.',welcomeNote:'Original single-player preview · No sign-up · No play tracking',enter:'Enter the temple →',loading:'Laying the mountain path…',
  settingsTitle:'Make yourself comfortable',closeSettings:'Close settings',audioSetting:'Rain sounds & effects',audioHint:'Sound starts only after your click',rainSetting:'Rainfall',rainHint:'Adjusts both the rain and its sound',light:'Drizzle',steady:'Steady rain',off:'Rain has stopped',motionSetting:'Reduce motion',motionHint:'Turn off falling leaves, rain streaks and ambient ripples',settingsNote:'All sound is synthesized in your browser. No microphone is used. Only your language choice is saved in this browser; other settings last for this visit.',
  helpTitle:'There is no hurry.',closeHelp:'Close help',helpWalk:'<strong>Walk</strong>Click the courtyard ground. Your traveler will find a walkable path.',helpLook:'<strong>Look around</strong>Drag to turn the view. Scroll or pinch to zoom.',helpKeys:'<strong>Keyboard</strong>Click the courtyard, then use the arrow keys or WASD to walk.',helpActivity:'<strong>Little moments</strong>Choose an activity below. Your traveler will walk there first.',helpAudio:'<strong>Listen</strong>Use the sound button in the top right to enable audio.',helpNote:'This is a single-player courtyard. Other real visitors are not shown. Sitting time pauses when the page is hidden.',
  shareTitle:'Send a little quiet to a friend.',closeShare:'Close postcard',postcardAlt:'A postcard of your current temple view',download:'Save postcard',copy:'Copy experience link',nativeShare:'Share…',sharePrivate:'Your postcard is created locally. The screenshot is not uploaded.',shareLocal:'This is a local preview link. Other devices cannot visit it yet; you can still save the postcard.',copyDone:'Experience link copied. ',copyLocal:'This local address will work for friends once the site is published.',copyInvite:'May your friend find a little quiet here, too.',copyManual:'Copy this link manually: {url}',nativeFailed:'System sharing is unavailable. Copy the link or save the postcard instead.',cardFailed:'The postcard could not be created. Please try again.',downloaded:'Your browser has been asked to save the postcard.',cardTitle:'Rain Temple · A little room to breathe.',cardLine:'Nowhere to rush. Nothing to finish.',shareText:'Stay for a little mountain rain.',
  errorTitle:'The mountain view could not open',errorWebGL:'The 3D scene could not start. Please use a current browser with WebGL 2 and check that hardware acceleration is enabled.',errorContext:'The 3D connection was interrupted. Please enter again.',errorScript:'The scene could not load. Please refresh and try again.',retry:'Enter again',audioFailed:'Sound could not be enabled. Please check your browser’s sound permissions.',
  weather_light:'Mountain drizzle',weather_steady:'Mountain rain',weather_off:'After the rain',location_start:'Gate · Welcome',location_walk:'Courtyard · Wandering',location_sit:'Under the eaves · Listening',location_bell:'Bell pavilion · Resonance',location_wood:'Wooden fish · A quiet beat',location_fish:'By the pond · Koi',
  walkDescription:'Following the stone path. There is no hurry…',walkButton:'On the way…',walkNote:'Walking to {place}',arrived:'You are here. Take your time.',noPath:'That place is out of reach. Try returning to the stone path.',blocked:'There are rocks or water there. Try clicking the stone path.',entered:'Click the ground to begin your own quiet walk.',overview:'Back to the courtyard view.',
  sitTitle:'Listen, under the eaves.',sitDescription:'No need to control your breathing or achieve anything. Let the rain fall. Let your thoughts pass.',sitButton:'Begin sitting',sitNote:'Stop whenever you like. The timer pauses when you leave this tab.',sitEnd:'Finish sitting',sitAgain:'Sit a little longer',sitDuring:'Let your shoulders soften. Notice the sounds around you.',sitStopped:'You do not need to stay the whole time. A little rest is enough.',sitComplete:'A moment, just for you. Stay a little longer if you like.',sitToast:'The rain is still falling. Leave whenever you are ready.',
  bellTitle:'A bell into the mountains.',bellDescription:'One gentle strike. Let the sound fade before you ring it again.',bellButton:'Ring the bell',bellNote:'Enable sound to hear the lingering resonance.',bellWait:'Let it ring for a moment…',bellMuted:'The bell is ringing. Turn on sound in the top right to hear it.',
  woodTitle:'One beat at a time.',woodDescription:'A gentle tap. A wooden note. Find a rhythm that feels right to you.',woodButton:'Tap the wooden fish',woodNote:'Tap count: {n}. Just a sound, not a score.',fishTitle:'A slower life in the pond.',fishDescription:'Scatter a little food. Watch the koi gather among the lotus leaves.',fishButton:'Scatter a little food',fishNote:'The koi gather for a while, then continue on their way.',fishFed:'Feedings: {n}. Here they come.',
 },
 ja,ko,
};
const siteLabels={zh:['关于','隐私','反馈'],en:['About','Privacy','Feedback'],ja:['概要','プライバシー','ご意見'],ko:['소개','개인정보','문의']};
for(const lang of Object.keys(LOCALES))Object.assign(messages[lang],interactionMessages[lang],{siteAbout:siteLabels[lang][0],sitePrivacy:siteLabels[lang][1],siteContact:siteLabels[lang][2]});
export function translate(lang,key,values={}){
 const value=messages[lang]?.[key]??messages.zh[key];
 if(value===undefined)throw new Error(`Missing temple translation: ${key}`);
 return value.replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??''));
}
export function normalizeLanguage(value){
 const base=String(value||'').trim().toLowerCase().split(/[-_]/)[0];
 return Object.hasOwn(LOCALES,base)?base:null;
}
export function resolveLanguage({query='',stored='',languages=[]}={}){
 return normalizeLanguage(query)||normalizeLanguage(stored)||languages.map(normalizeLanguage).find(Boolean)||'en';
}
export function createI18n(onChange){
 let stored='';try{stored=localStorage.getItem('rain-temple:language')||'';}catch{}
 let lang=resolveLanguage({query:new URLSearchParams(location.search).get('lang')||(document.body.dataset.siteRoot?normalizeLanguage(location.pathname.split('/')[1]):null),stored,languages:navigator.languages||[navigator.language]});
 function apply(){
  document.documentElement.lang=LOCALES[lang].html;document.title=translate(lang,'title');document.querySelector('meta[name=description]')?.setAttribute('content',translate(lang,'description'));
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.innerHTML=translate(lang,el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',translate(lang,el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-alt]').forEach(el=>el.setAttribute('alt',translate(lang,el.dataset.i18nAlt)));
  document.querySelectorAll('[data-language]').forEach(el=>{el.value=lang;el.setAttribute('aria-label',translate(lang,'language'));});
  document.querySelectorAll('[data-duration]').forEach(el=>{el.textContent=translate(lang,'minute',{n:el.dataset.duration});});
  if(document.body.dataset.siteRoot){const origin=document.body.dataset.siteRoot;document.querySelector('[data-site-canonical]')?.setAttribute('href',origin+'/'+lang+'/');document.querySelector('meta[property="og:url"]')?.setAttribute('content',origin+'/'+lang+'/');document.querySelector('a.brand')?.setAttribute('href','/'+lang+'/');document.querySelectorAll('[data-site-page]').forEach(el=>el.setAttribute('href','/'+lang+'/'+el.dataset.sitePage+'/'));}
  onChange?.();
 }
 for(const el of document.querySelectorAll('[data-language]'))el.replaceChildren(...Object.entries(LOCALES).map(([value,locale])=>{const option=document.createElement('option');option.value=value;option.textContent=locale.label;return option;}));
 document.querySelectorAll('[data-language]').forEach(el=>el.addEventListener('change',()=>{
  lang=normalizeLanguage(el.value)||lang;try{localStorage.setItem('rain-temple:language',lang);}catch{}
  const url=new URL(location.href);if(document.body.dataset.siteRoot){url.pathname='/'+lang+'/';url.searchParams.delete('lang');}else url.searchParams.set('lang',lang);history.replaceState(null,'',url);apply();
 }));
 return {get language(){return lang;},t:(key,values)=>translate(lang,key,values),apply};
}
