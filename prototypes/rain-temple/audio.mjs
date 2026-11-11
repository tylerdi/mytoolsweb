// Original synthesized soundscape. No audio files, microphone or network requests.
export function createSoundscape(){
  let ctx,master,rainGain,enabled=false,rain='light';
  function init(){
    if(ctx)return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)throw new Error('当前浏览器不支持音频');
    ctx=new AudioContext();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
    const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);
    let last=0;
    for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*6;}
    const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=2400;
    rainGain=ctx.createGain();rainGain.gain.value=.38;noise.connect(low).connect(rainGain).connect(master);noise.start();
    const wind=ctx.createBiquadFilter();wind.type='bandpass';wind.frequency.value=350;wind.Q.value=.4;
    const wg=ctx.createGain();wg.gain.value=.08;noise.connect(wind).connect(wg).connect(master);
  }
  async function setEnabled(value){
    if(value){init();await ctx.resume();enabled=true;master.gain.setTargetAtTime(.45,ctx.currentTime,.3);setRain(rain);}
    else {enabled=false;if(ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.08);}
    return enabled;
  }
  function setRain(value){rain=value;if(ctx)rainGain.gain.setTargetAtTime(value==='off'?0:value==='steady'?.7:.38,ctx.currentTime,.6);}
  function tone(freq,volume,duration,type='sine',delay=0){
    if(!enabled||!ctx||document.hidden)return;
    const now=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,now);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain).connect(master);osc.start(now);osc.stop(now+duration+.1);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function bell(){for(const [ratio,gain] of [[1,.42],[2.01,.15],[2.73,.08],[4.07,.035]])tone(196*ratio,gain,7/Math.sqrt(ratio));}
  function wood(){tone(610,.5,.12);tone(960,.17,.065);}
  function bead(){tone(430,.075,.045);tone(880,.035,.025);}
  function water(){[620,940,780].forEach((f,i)=>tone(f,.08,.2,'sine',i*.07));}
  function visibility(){if(!ctx)return;if(document.hidden)ctx.suspend();else if(enabled)ctx.resume().catch(()=>{});}
  document.addEventListener('visibilitychange',visibility);
  return {setEnabled,setRain,bell,wood,water,bead,get enabled(){return enabled;}};
}
