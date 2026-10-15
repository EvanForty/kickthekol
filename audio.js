// Procedural weapon Foley plus the original Minecraft player damage samples.
let gameAudio,masterAudio,noiseBuffer,lastSoundAt=0;
function readyAudio(){
 if(!gameAudio){gameAudio=new(window.AudioContext||window.webkitAudioContext)();masterAudio=gameAudio.createGain();masterAudio.gain.value=.42;const limiter=gameAudio.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=8;masterAudio.connect(limiter);limiter.connect(gameAudio.destination);noiseBuffer=gameAudio.createBuffer(1,gameAudio.sampleRate,gameAudio.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 if(gameAudio.state==='suspended')gameAudio.resume().catch(()=>{});prepareDamageAudio(gameAudio).catch(()=>{});return gameAudio;
}
function tone(at,hz,end,duration,volume=.3,type='sine'){
 const o=gameAudio.createOscillator(),g=gameAudio.createGain();o.type=type;o.frequency.setValueAtTime(hz,at);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),at+duration);g.gain.setValueAtTime(.001,at);g.gain.exponentialRampToValueAtTime(volume,at+.007);g.gain.exponentialRampToValueAtTime(.001,at+duration);o.connect(g);g.connect(masterAudio);o.start(at);o.stop(at+duration+.02);
}
function foley(at,duration,frequency,volume=.3,type='bandpass',end=frequency){
 const source=gameAudio.createBufferSource(),filter=gameAudio.createBiquadFilter(),g=gameAudio.createGain();source.buffer=noiseBuffer;filter.type=type;filter.frequency.setValueAtTime(frequency,at);filter.frequency.exponentialRampToValueAtTime(Math.max(50,end),at+duration);filter.Q.value=1;g.gain.setValueAtTime(.001,at);g.gain.exponentialRampToValueAtTime(volume,at+.008);g.gain.exponentialRampToValueAtTime(.001,at+duration);source.connect(filter);filter.connect(g);g.connect(masterAudio);source.start(at,Math.random()*.2,duration);source.stop(at+duration+.02);
}
function reaction(at,kind){playPain(at,kind)}
function weaponSound(id){
 if(!sound)return;try{readyAudio();const now=gameAudio.currentTime;if(now-lastSoundAt<.06)return;lastSoundAt=now;const t=now+.005;
 switch(id){
 case 'fling':foley(t,.2,700,.25,'bandpass',2700);tone(t+.07,230,700,.18,.12);reaction(t+.16,'yelp');break;
 case 'kick':foley(t,.045,1500,.28);tone(t+.025,150,42,.15,.65);reaction(t+.08,'oof');break;
 case 'red':foley(t,.11,2200,.26,'bandpass',320);tone(t+.09,270,70,.12,.32,'triangle');reaction(t+.15,'gasp');break;
 case 'hammer':foley(t,.045,2200,.5);[440,703,1061,1490].forEach((hz,i)=>tone(t,hz,hz*.93,.42-i*.06,.2/(i+1)));tone(t,125,40,.17,.5);reaction(t+.16,'dizzy');break;
 case 'rug':for(let i=0;i<5;i++)foley(t+i*.028,.07,700+i*230,.25,'highpass',300);tone(t+.13,230,70,.17,.2);reaction(t+.16,'squeak');break;
 case 'chart':[660,490,330,160].forEach((hz,i)=>tone(t+i*.045,hz,hz*.65,.1,.1,'triangle'));foley(t+.16,.24,1300,.42,'lowpass',120);reaction(t+.24,'yelp');break;
 case 'sell':tone(t,250,60,.06,.42,'square');tone(t+.04,105,29,.36,.7);foley(t+.04,.24,600,.5,'lowpass',80);reaction(t+.19,'oof');break;
 case 'whale':foley(t,.24,1400,.32,'bandpass',200);tone(t+.15,90,27,.5,.8);foley(t+.16,.45,1900,.5,'lowpass',170);[0,.08,.17].forEach(d=>tone(t+.3+d,400,120,.12,.12));reaction(t+.28,'gasp');break;
 case 'meteor':foley(t,.32,3200,.42,'bandpass',160);tone(t+.19,130,28,.45,.7);foley(t+.2,.32,1200,.55,'lowpass',90);reaction(t+.3,'dizzy');break;
 case 'candle':[220,330,440,660].forEach((hz,i)=>tone(t+i*.045,hz,hz*1.7,.16,.15,'triangle'));foley(t,.23,280,.3,'bandpass',2600);reaction(t+.19,'yelp');break;
 }
 }catch{/* Gameplay remains available when audio is unavailable. */}
}
const hitWithPremium=hit;hit=function(x,y){if(mode!=='arena')return;hitWithPremium(x,y);weaponSound(premiumActive&&ownedPremium.has(premiumActive)?premiumActive:flinging?'fling':['kick','red','hammer','rug','chart','sell'][weapon]);};
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=sound?'♪ Sound on':'♪ Sound off';$('#sound').setAttribute('aria-pressed',String(sound));if(sound){try{readyAudio();masterAudio.gain.setValueAtTime(.42,gameAudio.currentTime);}catch{sound=false;$('#sound').textContent='♪ Sound off';toast('Audio is unavailable in this browser.');}}else if(masterAudio)masterAudio.gain.setValueAtTime(0,gameAudio.currentTime);};
document.addEventListener('visibilitychange',()=>{if(!gameAudio)return;if(document.hidden)gameAudio.suspend().catch(()=>{});else if(sound)gameAudio.resume().catch(()=>{});});
