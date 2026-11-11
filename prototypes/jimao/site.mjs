import {createInsights,bindPrivacyControls} from '/assets/insights/client.mjs';
createInsights('jimao')('visit');bindPrivacyControls();
try{localStorage.setItem('jimao:language',JSON.stringify(document.documentElement.lang==='en'?'en':'zh'))}catch{}
