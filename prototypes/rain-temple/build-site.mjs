import {build} from 'esbuild';
import {readFile,writeFile,mkdir,rm,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {LOCALES,messages} from './i18n.mjs';
import {siteContent} from './site-content.mjs';

export const SITE_ORIGIN='https://temple.tylerzhang.xyz';
const base=new URL('./',import.meta.url),out=new URL('./dist/',base);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const digest=data=>createHash('sha256').update(data).digest('hex').slice(0,12);
const nav=(lang,page)=>Object.entries(LOCALES).map(([id,meta])=>`<a href="/${id}/${page?`${page}/`:''}" lang="${meta.html}" ${id===lang?'aria-current="page"':''}>${meta.label}</a>`).join('');
const alternate=(page='')=>Object.entries(LOCALES).map(([id,meta])=>`<link rel="alternate" hreflang="${meta.html}" href="${SITE_ORIGIN}/${id}/${page?`${page}/`:''}">`).join('');
const infoCSS=`:root{color:#304b40;background:#eef0e5;font:15px/1.9 -apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Kaku Gothic ProN","Apple SD Gothic Neo",sans-serif}*{box-sizing:border-box}body{margin:0}a{color:#476e58;text-underline-offset:4px}a:focus-visible{outline:2px solid #8c734c;outline-offset:4px}header{max-width:920px;margin:30px auto;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 24px}.brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:#27493b;font-family:Georgia,"Songti SC",serif;font-size:21px}.brand img{width:38px;height:38px}header nav{display:flex;flex-wrap:wrap;gap:13px;font-size:12px}header nav a[aria-current]{font-weight:700}main{max-width:760px;margin:65px auto;padding:0 24px}.eyebrow{color:#8c8f75;font-size:11px;letter-spacing:2px}h1{font-family:Georgia,"Songti SC","Yu Mincho",serif;font-weight:400;font-size:36px;line-height:1.5}h2{font-size:18px;font-weight:500;margin-top:36px}p{color:#647362}.lead{font-size:18px}article{border-top:1px solid #667a5526;margin-top:30px}.actions{display:flex;flex-wrap:wrap;gap:15px;margin-top:35px}footer{max-width:920px;margin:50px auto;padding:25px 24px;border-top:1px solid #667a5526;display:flex;justify-content:space-between;gap:20px;font-size:12px}footer nav{display:flex;flex-wrap:wrap;gap:14px}html[lang=ko]{word-break:keep-all;overflow-wrap:break-word}@media(max-width:600px){header{align-items:flex-start;flex-direction:column}main{margin-top:35px}h1{font-size:29px}footer{flex-direction:column}}`;
export async function buildSite(){
 await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
 await cp(new URL('../../assets/insights/',base),new URL('assets/insights/',out),{recursive:true});
 const compiled=await build({entryPoints:[fileURLToPath(new URL('main.mjs',base))],bundle:true,format:'esm',target:['es2022'],minify:true,write:false,legalComments:'eof'});
 const js=compiled.outputFiles[0].contents,jsName=`temple.${digest(js)}.js`;
 const css=await readFile(new URL('temple.css',base),'utf8'),cssName=`temple.${digest(css)}.css`;
 await writeFile(new URL(jsName,out),js);await writeFile(new URL(cssName,out),css);await writeFile(new URL('site.css',out),infoCSS);await copyFile(new URL('mark.svg',base),new URL('mark.svg',out));
 const source=await readFile(new URL('index.html',base),'utf8');
 function appHTML(lang){
  const m=messages[lang],meta=LOCALES[lang],c=siteContent[lang];
  let html=source.replace('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow">').replace('<html lang="zh-CN">',`<html lang="${meta.html}">`).replace('<body>',`<body data-site-root="${SITE_ORIGIN}">`);
  html=html.replace(/<([a-z][\w-]*)\b([^>]*\bdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/gi,(whole,tag,attrs,key)=>m[key]===undefined?whole:`<${tag}${attrs}>${m[key]}</${tag}>`);
  html=html.replace(/(<span id="weather-label">).*?(<\/span>)/,`$1${esc(m.weather_light)}$2`).replace(/(<div id="location"[\s\S]*?<span>).*?(<\/span>)/,`$1${esc(m.location_start)}$2`);
  html=html.replace(/<title>.*?<\/title>/,`<title>${esc(m.title)}</title>`).replace(/(<meta name="description" content=")[^"]*(">)/,`$1${esc(m.description)}$2`);
  html=html.replace('./temple.css',`/${cssName}`).replace(/\.\/temple\.js\?[^"\s]+/,`/${jsName}`).replaceAll('./mark.svg','/mark.svg').replace('class="brand" href="./"',`class="brand" href="/${lang}/"`);
  html=html.replace(/<span data-i18n="footer">.*?<\/span>/,`<nav class="site-links" aria-label="Site information"><a href="/${lang}/about/" data-site-page="about" data-i18n="siteAbout">${esc(c.aboutLabel)}</a><a href="/${lang}/privacy/" data-site-page="privacy" data-i18n="sitePrivacy">${esc(c.privacyLabel)}</a><a href="/${lang}/contact/" data-site-page="contact" data-i18n="siteContact">${esc(c.contactLabel)}</a></nav>`);
  // These fields make the main content useful before the interactive scene starts.
  html=html.replace(/(<h1 data-i18n="poem">)[\s\S]*?(<\/h1>)/,`$1${m.poem}$2`).replace(/(<p data-i18n="poemBody">)[\s\S]*?(<\/p>)/,`$1${m.poemBody}$2`).replace(/(<span data-i18n="brand">).*?(<\/span>)/,`$1${esc(m.brand)}$2`);
  return html.replace('</head>',`<link data-site-canonical rel="canonical" href="${SITE_ORIGIN}/${lang}/">${alternate()}<meta name="google-adsense-account" content="ca-pub-6426056111301969"><meta property="og:type" content="website"><meta property="og:title" content="${esc(m.title)}"><meta property="og:description" content="${esc(m.description)}"><meta property="og:url" content="${SITE_ORIGIN}/${lang}/"><meta property="og:image" content="${SITE_ORIGIN}/share.png"></head>`);
 }
 await writeFile(new URL('index.html',out),appHTML('zh'));
 const urls=[];
 for(const [lang,meta] of Object.entries(LOCALES)){
  const c=siteContent[lang];await mkdir(new URL(`${lang}/`,out),{recursive:true});await writeFile(new URL(`${lang}/index.html`,out),appHTML(lang));urls.push(`${SITE_ORIGIN}/${lang}/`);
  for(const page of ['about','privacy','contact']){
   const p=c[page],directory=new URL(`${lang}/${page}/`,out);await mkdir(directory,{recursive:true});
   const html=`<!doctype html><html lang="${meta.html}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)} | ${esc(messages[lang].brand)}</title><meta name="description" content="${esc(p.lead)}"><link rel="canonical" href="${SITE_ORIGIN}/${lang}/${page}/">${alternate(page)}<link rel="icon" href="/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/site.css"></head><body><header><a class="brand" href="/${lang}/"><img src="/mark.svg" alt="">${esc(messages[lang].brand)}</a><nav aria-label="Language">${nav(lang,page)}</nav></header><main><p class="eyebrow">RAIN TEMPLE · ${esc(c.updated)}</p><h1>${esc(p.title)}</h1><p class="lead">${esc(p.lead)}</p><article>${p.sections.map(([title,text])=>`<section><h2>${esc(title)}</h2><p>${esc(text)}</p></section>`).join('')}</article>${page==='privacy'?'<p id="metrics-status" role="status"></p><button id="metrics-toggle">Anonymous metrics</button>':''}<div class="actions"><a href="/${lang}/">${esc(c.back)}</a><a href="https://github.com/tylerdi/mytoolsweb/issues" target="_blank" rel="noopener">${esc(c.issue)}</a>${page==='about'?`<a href="https://github.com/tylerdi/mytoolsweb/tree/codex/rain-temple-launch/prototypes/rain-temple" rel="noopener" target="_blank">${esc(c.source)}</a>`:''}</div></main><footer><span>© 2026 ${esc(messages[lang].brand)}</span><nav><a href="/${lang}/about/">${esc(c.aboutLabel)}</a><a href="/${lang}/privacy/">${esc(c.privacyLabel)}</a><a href="/${lang}/contact/">${esc(c.contactLabel)}</a></nav></footer><script type="module">import {createInsights,bindPrivacyControls} from "/assets/insights/client.mjs";bindPrivacyControls();createInsights("temple")("visit");</script></body></html>`;
   await writeFile(new URL('index.html',directory),html);urls.push(`${SITE_ORIGIN}/${lang}/${page}/`);
  }
 }
 await writeFile(new URL('robots.txt',out),`User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
 await writeFile(new URL('sitemap.xml',out),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
 await writeFile(new URL('ads.txt',out),'google.com, pub-6426056111301969, DIRECT, f08c47fec0942fa0\n');
 await writeFile(new URL('_headers',out),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Cache-Control: public, max-age=0, must-revalidate\n/temple.*\n  Cache-Control: public, max-age=31536000, immutable\n');
 await writeFile(new URL('_redirects',out),'/about /zh/about/ 301\n/privacy /zh/privacy/ 301\n/contact /zh/contact/ 301\n');
 await writeFile(new URL('404.html',out),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Rain Temple</title><link rel="stylesheet" href="/site.css"><main><h1>Page not found</h1><p>This path is not part of the courtyard.</p><a href="/">Return to Rain Temple · 返回听雨山寺</a></main></html>');
 await copyFile(new URL('share.png',base),new URL('share.png',out));
 console.log(`Rain Temple production site: ${fileURLToPath(out)}\n${urls.length} localized pages + root entry, isolated static assets.\nOrigin: ${SITE_ORIGIN}`);
 return fileURLToPath(out);
}
if(process.argv[1]===fileURLToPath(import.meta.url))await buildSite();
