// Weapons must touch the ragdoll. Pointer clicks alone never deal damage.
let wield={x:190,y:320,vx:0,vy:0,held:false,flying:false,hit:false,key:'',last:0},contactHit=false,flingFlight=false,previousFlingVY=0,keyboardHeld=false;
function toolKey(){return premiumActive|| (flinging?'fling':['kick','red','hammer','rug','chart','sell'][weapon]);}
const parkedWeapons=new Map();
function resetWield(){const key=toolKey();if(wield.key){if(wield.held){wield.held=false;wield.flying=true;}parkedWeapons.set(wield.key,wield);}wield=parkedWeapons.get(key)||{x:key==='rug'?body.x:190,y:key==='rug'?518:320,vx:0,vy:0,held:false,flying:false,hit:false,key,last:performance.now()};wield.last=performance.now();keyboardHeld=false;drag=null;flingFlight=false;}
function weaponRadius(){return ['whale','meteor','sell'].includes(wield.key)?42:wield.key==='hammer'?28:24;}
function keepWeaponInRoom(){const edge=wield.key==='rug'?85:45;if(wield.x<edge||wield.x>1000-edge){wield.x=Math.max(edge,Math.min(1000-edge,wield.x));wield.vx*=-.45;}if(wield.y<95){wield.y=95;wield.vy=Math.abs(wield.vy)*.4;}}
function segmentDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],n=dx*dx+dy*dy;const u=n?Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/n)):0;return Math.hypot(p.x-a[0]-u*dx,p.y-a[1]-u*dy);}
function touchesKOL(x,y,radius=0){
 const dx=x-body.x,dy=y-body.y,c=Math.cos(body.a),s=Math.sin(body.a),p={x:(dx*c+dy*s)/.64,y:(-dx*s+dy*c)/.64},r=radius/.64;
 if(((p.x)/(66+r))**2+((p.y+103)/(62+r))**2<=1)return true;
 if(p.x>=-44-r&&p.x<=44+r&&p.y>=-46-r&&p.y<=77+r)return true;
 for(const arm of [true,false])for(const side of [-1,1]){const i=arm?(side<0?0:2):(side<0?4:6),start=arm?[side*40,-18]:[side*24,62],a=joints[i].a,b=a+joints[i+1].a,mid=limbPoint(start,arm?43:46,a),end=limbPoint(mid,arm?39:44,b);if(segmentDistance(p,start,mid)<=12+r||segmentDistance(p,mid,end)<=12+r)return true;}
 return false;
}
function sweptContact(a,b,r){const count=Math.min(120,Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8)));for(let i=0;i<=count;i++){const u=i/count;if(touchesKOL(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,r))return true;}return false;}
const hitFromGame=hit;hit=function(x,y){if(!contactHit)return;hitFromGame(x,y);};
function landWeapon(x,y){if(wield.hit)return;wield.hit=true;contactHit=true;try{hit(x,y);}finally{contactHit=false;}if(!wield.held){wield.vx*=-.3;wield.vy=-5;}}
function syncWield(){if(wield.key!==toolKey())resetWield();}
function moveWeapon(p){const old={x:wield.x,y:wield.y};if(wield.key!=='rug'&&!touchesKOL(old.x,old.y,weaponRadius()+8))wield.hit=false;const now=performance.now(),dt=Math.max(8,now-wield.last)/16.67;wield.vx=Math.max(-32,Math.min(32,(p.x-wield.x)/dt));wield.vy=Math.max(-32,Math.min(32,(p.y-wield.y)/dt));wield.x=p.x;wield.y=Math.min(525,p.y);keepWeaponInRoom();wield.last=now;
 if(wield.key==='rug'){
 const onRug=Math.abs(body.x-wield.rugOrigin)<95&&body.y>395&&Math.abs(wield.y-518)<30;
 if(!wield.hit&&onRug&&Math.abs(wield.x-wield.rugOrigin)>45)landWeapon(body.x,520);
 }else if(Math.hypot(wield.x-old.x,wield.y-old.y)>4&&sweptContact(old,wield,weaponRadius()))landWeapon(wield.x,wield.y);
}
canvas.onpointerdown=e=>{
 if(mode!=='arena')return;syncWield();canvas.focus();const p=point(e);
 if(flinging){if(!touchesKOL(p.x,p.y,10))return;drag={...p,start:p,moved:false,offsetX:body.x-p.x,offsetY:body.y-p.y};flingFlight=false;}
 else{const radius=wield.key==='rug'?90:65;if(Math.hypot(p.x-wield.x,p.y-wield.y)>radius)return;wield.flying=false;wield.held=true;wield.hit=false;wield.rugOrigin=wield.x;wield.last=performance.now();wield.vx=wield.vy=0;}
 canvas.setPointerCapture(e.pointerId);
};
canvas.onpointermove=e=>{
 if(mode!=='arena')return;const p=point(e);
 if(flinging&&drag){if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>5)drag.moved=true;if(drag.moved){body.vx=Math.max(-35,Math.min(35,(p.x-drag.x)*.7));body.vy=Math.max(-30,Math.min(30,(p.y-drag.y)*.7));body.x=Math.max(135,Math.min(865,p.x+drag.offsetX));body.y=Math.max(180,Math.min(430,p.y+drag.offsetY));body.a=(p.x-drag.x)*.015;}drag.x=p.x;drag.y=p.y;}
 else if(wield.held)moveWeapon(p);
};
function releaseWeapon(){if(keyboardHeld||performance.now()-wield.last>100)wield.vx=wield.vy=0;wield.held=false;keyboardHeld=false;if(wield.key==='rug'){wield.flying=true;wield.vy=-2;}else{wield.flying=true;if(Math.hypot(wield.vx,wield.vy)<2){wield.vx=0;wield.vy=0;}}}
canvas.onpointerup=e=>{if(flinging&&drag){flingFlight=drag.moved;previousFlingVY=body.vy;drag=null;}else if(wield.held)releaseWeapon();if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
canvas.onpointercancel=()=>{drag=null;if(wield.held)releaseWeapon();};
canvas.addEventListener('keydown',e=>{
 if(mode!=='arena'||e.target!==canvas)return;syncWield();
 if(e.code==='Space'){e.preventDefault();if(e.repeat)return;if(flinging){toast('Grab the character and drag to fling.');return;}if(keyboardHeld)releaseWeapon();else{wield.held=keyboardHeld=true;wield.flying=false;wield.vx=wield.vy=0;wield.hit=false;wield.rugOrigin=wield.x;}return;}
 if(keyboardHeld&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();moveWeapon({x:Math.max(20,Math.min(980,wield.x+(e.code==='ArrowLeft'?-22:e.code==='ArrowRight'?22:0))),y:Math.max(30,Math.min(520,wield.y+(e.code==='ArrowUp'?-22:e.code==='ArrowDown'?22:0)))});}
});
function drawHeldWeapon(t){
 if(mode!=='arena')return;syncWield();const dt=Math.min(2,Math.max(.1,(t-(drawHeldWeapon.last||t-16.67))/16.67));drawHeldWeapon.last=t;
 if(flinging){if(flingFlight&&previousFlingVY>3&&body.vy<0){wield.hit=false;landWeapon(body.x,530);flingFlight=false;}previousFlingVY=body.vy;return;}
 if(wield.flying){const old={x:wield.x,y:wield.y};if(!touchesKOL(old.x,old.y,weaponRadius()+8))wield.hit=false;wield.vy+=.7*dt;wield.x+=wield.vx*dt;wield.y+=wield.vy*dt;if(!wield.hit&&wield.key!=='rug'&&sweptContact(old,wield,weaponRadius()))landWeapon(wield.x,wield.y);
 if(wield.y>525){if(wield.key==='sell'&&!wield.hit&&Math.abs(body.x-wield.x)<145&&body.y>350)landWeapon(wield.x,525);wield.y=525;wield.vx*=.8;wield.vy*=-.25;if(Math.abs(wield.vy)<1.5){wield.vy=0;if(Math.abs(wield.vx)<.5){wield.vx=0;wield.flying=false;}}}
 keepWeaponInRoom();
 }
 ctx.save();ctx.translate(wield.x,wield.y);if(wield.key!=='rug')ctx.rotate(wield.held?Math.max(-.6,Math.min(.6,wield.vx*.025)):0);
 if(wield.key==='hammer'){line([[0,0],[0,62]],'#292039',15);line([[0,0],[0,62]],'#ba804d',9);shape(-36,-21,72,40,'#8995ad',7);line([[-25,-11],[20,-11]],'#dce5ef',4);}
 else if(wield.key==='red'||wield.key==='candle'){line([[0,-61],[0,61]],'#292039',6);shape(-17,-43,34,86,wield.key==='red'?'#f23b56':'#39e785',3);}
 else if(wield.key==='rug'){shape(-82,-9,164,18,'#f6b521',3);for(let x=-70;x<=70;x+=20)line([[x,-7],[x+12,7]],'#d94576',5);}
 else if(wield.key==='chart'){shape(-42,-32,84,64,'#fff4dc',5);line([[-30,-18],[-12,-4],[-1,-11],[15,12],[30,22]],'#ee3654',6);}
 else if(wield.key==='sell'){ctx.fillStyle='#ef1746';ctx.beginPath();ctx.arc(0,0,38,Math.PI,0);ctx.fill();ctx.strokeStyle='#292039';ctx.lineWidth=4;ctx.stroke();shape(-43,-2,86,25,'#465266',7);ctx.textAlign='center';text('SELL',0,-12,20,'#fff','Lilita One');}
 else{ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=wield.key==='kick'?'65px sans-serif':'85px sans-serif';ctx.fillText(wield.key==='kick'?'🥾':wield.key==='whale'?'🐋':'☄️',0,0);}
 if(!wield.held&&!wield.flying){ctx.textAlign='center';ctx.textBaseline='alphabetic';text('GRAB ME',0,wield.key==='rug'?-24:-78,14,'#fff8dc','Lilita One');}
 ctx.restore();
}
const drawWithWear=character;character=function(t){drawWithWear(t);drawHeldWeapon(t);};
const selectWithWear=select;select=function(i){selectWithWear(i);resetWield();};
const showWithWeapons=show;show=function(view){if(view!==mode)resetWield();showWithWeapons(view);};
const weaponUI=weapons;weapons=function(){weaponUI();const key=toolKey();$('#weapon-tip').textContent=key==='fling'?'Grab your KOL, throw, and let the landing do the damage.':key==='rug'?'Grab the carpet and pull sideways while your KOL stands on it.':['kick','hammer'].includes(key)?'Grab and keep swinging. Pull away between hits, or throw and catch.':'Grab, swing, or throw. Pick it up anywhere and keep going.';};
weapons();resetWield();
