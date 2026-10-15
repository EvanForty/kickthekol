// Persistent, non-graphic wear for the current round; hit reactions still recover.
let wear=0;
function wearStage(){return wear>=30?4:wear>=16?3:wear>=7?2:wear>0?1:0;}
function wearEllipse(x,y,rx,ry,color,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.2,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawClothingWear(){
 const stage=wearStage();if(!stage)return;ctx.save();
 line([[-28,7],[-19,13],[-31,19]],'#57485a',3);
 line([[18,40],[28,35]],'#d2bcb0',3);
 if(stage>=2){wearEllipse(-17,42,15,9,'#262031',.4);line([[23,-10],[31,-2],[23,3]],'#5c4b60',4);}
 if(stage>=3){
 // Jagged fabric holes show a contrasting undershirt, never exposed wounds.
 ctx.fillStyle='#171523';ctx.beginPath();ctx.moveTo(-30,25);ctx.lineTo(-13,18);ctx.lineTo(-17,28);ctx.lineTo(-5,34);ctx.lineTo(-23,41);ctx.lineTo(-19,31);ctx.closePath();ctx.fill();
 line([[-30,25],[-13,18],[-17,28]],'#d6c4ac',2);
 line([[25,54],[18,59],[28,64],[20,70]],'#171523',5);
 }
 if(stage>=4){wearEllipse(18,15,18,12,'#28202d',.5);line([[-32,60],[-20,54],[-12,63]],'#d6c4ac',3);line([[16,-25],[28,-17],[21,-7]],'#171523',5);}
 ctx.restore();
}
function drawLimbWear(mid,end,arm){
 const stage=wearStage();if(stage<2)return;ctx.save();
 const x=mid[0]*.65+end[0]*.35,y=mid[1]*.65+end[1]*.35;
 wearEllipse(x,y,arm?6:8,4,arm?'#74558d':'#706678',.65);
 if(stage>=3){line([[mid[0]-5,mid[1]-4],[mid[0]+5,mid[1]+3]],'#d9c3a8',3);line([[mid[0]-4,mid[1]+1],[mid[0]+3,mid[1]+7]],'#5e4d66',2);}
 ctx.restore();
}
function drawFaceWear(t){
 const stage=wearStage();if(!stage)return;ctx.save();
 // These marks live in the same coordinate space as the articulated head.
 line([[-40,-75],[-34,-68]],'#83576c',2.5);line([[-33,-77],[-27,-70]],'#83576c',2.5);
 if(stage>=2){wearEllipse(-29,-87,17,12,'#745294',.7);wearEllipse(-31,-85,10,6,'#ae80bb',.65);}
 if(stage>=3){
 ctx.save();ctx.translate(32,-70);ctx.rotate(-.4);ctx.fillStyle='#e6be83';ctx.strokeStyle='#835f50';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-16,-7,32,14,4);ctx.fill();ctx.stroke();ctx.fillStyle='#c59568';ctx.fillRect(-6,-5,12,10);for(const x of [-11,11])for(const y of [-3,3])wearEllipse(x,y,1,1,'#9b7758');ctx.restore();
 wearEllipse(4,-61,20,11,skins[selected]);line([[-12,-59],[-5,-64],[3,-59],[11,-64],[17,-60]],'#3a2537',3);
 // Heavy eyelids remain after the brief impact expression has recovered.
 if(t>=damage.until){line([[-43,-98],[-16,-93]],'#332338',4);line([[14,-93],[40,-98]],'#332338',4);}
 }
 if(stage>=4){
 wearEllipse(35,-114,13,8,'#8e649a',.8);
 if(t>=damage.until){for(const x of [-24,24]){wearEllipse(x,-94,13,10,skins[selected]);ctx.beginPath();for(let i=0;i<30;i++){const a=i*.45,r=.3+i*.24;const px=x+Math.cos(a)*r,py=-94+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.strokeStyle='#39223e';ctx.lineWidth=2.5;ctx.stroke();}}
 for(let i=0;i<3;i++){const a=t/450+i*Math.PI*2/3;ctx.save();ctx.translate(Math.cos(a)*60,-183+Math.sin(a)*10);ctx.rotate(a);ctx.fillStyle='#ffdf42';ctx.strokeStyle='#6d428c';ctx.lineWidth=2;ctx.beginPath();for(let n=0;n<10;n++){const r=n%2?4:10;const x=Math.cos(n*Math.PI/5)*r,y=Math.sin(n*Math.PI/5)*r;n?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 }
 ctx.restore();
}
const hitBeforeWear=hit;hit=function(x,y){if(mode!=='arena')return;hitBeforeWear(x,y);wear=Math.min(40,wear+(typeof premiumActive!=='undefined'&&premiumActive?4:flinging?1:1+weapon*.35));};
const selectBeforeWear=select;select=function(i){selectBeforeWear(i);wear=0;};
