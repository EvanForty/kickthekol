// Eight independently simulated joints. Segment lengths stay fixed while joints
// react to torso acceleration, rotation, throws, weapon impulses and landings.
const jointRest=[-.65,-.9,.65,.9,-.14,.24,.14,-.24];
let joints=jointRest.map(a=>({a,v:0})),rigTime=0,rigVX=0,rigVY=0,rigVA=0;
function resetRig(){joints=jointRest.map(a=>({a,v:0}));rigTime=0;rigVX=rigVY=rigVA=0}
function impulseRig(power,direction=1){joints.forEach((j,i)=>{const side=i<2||i===4||i===5?-1:1;const bend=i%2?1.3:1;j.v+=power*bend*(side*.7+direction*.65)*(i>=4?-1:1)});}
function stepRig(t){const dt=Math.min(.045,Math.max(0,(t-rigTime)/1000||1/60));rigTime=t;const ax=Math.max(-20,Math.min(20,body.vx-rigVX)),ay=Math.max(-25,Math.min(25,body.vy-rigVY));
 if(rigVY>2&&body.vy<=0&&body.y>=429)impulseRig(Math.min(7,rigVY*.32),body.vx>=0?1:-1);
 const spin=body.va-rigVA;rigVX=body.vx;rigVY=body.vy;rigVA=body.va;
 joints.forEach((j,i)=>{const side=i<2||i===4||i===5?-1:1;j.v+=(-ax*.075+ay*side*.035-spin*7)*(i%2?1.3:1);});
 for(let n=0;n<3;n++){const h=dt/3;joints.forEach((j,i)=>{const arm=i<4,side=i<2||i===4||i===5?-1:1;const rest=jointRest[i]+Math.sin(t/850+i)*.025;const inertial=Math.max(-.55,Math.min(.55,-body.vx*.025-body.va*(arm?1.5:.8)));const gravity=-Math.sin(body.a+j.a)*1.3;const target=rest+inertial*(i%2?-.7:1);j.v+=((target-j.a)*(arm?24:35)+gravity-j.v*4.5)*h;j.v=Math.max(-18,Math.min(18,j.v));j.a+=j.v*h;const min=i%2?-2.2:-1.9,max=i%2?2.2:1.9;if(j.a<min||j.a>max){j.a=Math.max(min,Math.min(max,j.a));j.v*=-.3}})}
}
function limbPoint(start,len,angle){return[start[0]+Math.sin(angle)*len,start[1]+Math.cos(angle)*len]}
function drawRigLimb(side,arm){const i=arm?(side<0?0:2):(side<0?4:6),start=arm?[side*40,-18]:[side*24,62],a=joints[i].a,b=a+joints[i+1].a;
 const mid=limbPoint(start,arm?43:46,a),end=limbPoint(mid,arm?39:44,b),cup=selected===3;
 line([start,mid,end],'#292039',arm?22:24);
 line([start,mid],arm?shirts[selected]:(cup?'#826045':'#252333'),arm?16:18);
 line([mid,end],arm?skins[selected]:(cup?'#f5ebd1':'#252333'),arm?13:18);
 if(typeof drawLimbWear==='function')drawLimbWear(mid,end,arm);
 ctx.save();ctx.translate(...end);ctx.rotate(b);
 if(arm){ctx.fillStyle=skins[selected];ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#292039';ctx.lineWidth=3;ctx.stroke();line([[side*3,-3],[side*7,1]],'#b98764',1.5)}else{shape(side<0?-30:-10,-5,40,20,'#171827',8);line([[side<0?-25:-5,12],[side<0?4:24,12]],'#e2def4',3)}ctx.restore();
}
function drawArticulatedCharacter(t){stepRig(t);ctx.save();ctx.translate(body.x,body.y);ctx.rotate(body.a);const age=t-damage.at,active=t<damage.until,kick=age<420?Math.sin(age/42)*Math.exp(-age/130):0,stretch=damage.weapon===3?-.22:damage.weapon===2?.28:.18;ctx.scale(.64*(1+kick*stretch),.64*(1-kick*stretch));if(age<110)ctx.filter='brightness(1.65) saturate(.65)';
 drawRigLimb(-1,false);drawRigLimb(1,false);drawRigLimb(-1,true);drawRigLimb(1,true);
 shape(-42,-46,84,120,shirts[selected],selected===3?8:22);
 if(selected===3){shape(-42,34,84,40,'#8a6040',4);line([[-41,35],[41,35]],'#292039',3);ctx.fillStyle='#df3544';ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(9,-13);ctx.lineTo(4,-5);ctx.lineTo(12,24);ctx.lineTo(0,34);ctx.lineTo(-12,24);ctx.lineTo(-4,-5);ctx.lineTo(-9,-13);ctx.closePath();ctx.fill();ctx.stroke();line([[-31,-38],[-7,-25],[-18,-13],[-34,-33]],'#292039',2);line([[31,-38],[7,-25],[18,-13],[34,-33]],'#292039',2);line([[-32,48],[-15,48]],'#292039',6);line([[15,48],[32,48]],'#292039',6)}
 else if(selected>3&&selected!==9&&selected!==10&&selected!==11&&selected!==12&&selected!==13&&selected!==14&&selected!==17)text(selected%3===0?'100×':selected%3===1?'GM':'₿',selected%3===2?-12:-23,30,selected%3===2?35:22,'#fff7ed','Lilita One');
 if(selected===9){line([[-33,-38],[-19,-15],[0,-34],[19,-15],[33,-38]],'#a4a9b4',4);line([[-13,-16],[-15,29]],'#fff8ed',3);line([[13,-16],[15,29]],'#fff8ed',3);line([[-23,47],[-28,64],[28,64],[23,47]],'#a4a9b4',3)}if(selected===11){ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.moveTo(-33,-39);ctx.lineTo(-16,-13);ctx.lineTo(0,-29);ctx.lineTo(16,-13);ctx.lineTo(33,-39);ctx.lineTo(0,-35);ctx.closePath();ctx.fill();line([[-33,-39],[-16,-13],[0,-29],[16,-13],[33,-39]],'#c4bda9',3);line([[0,-29],[0,19]],'#c4bda9',2);for(const y of [-8,7]){ctx.fillStyle='#a29985';ctx.beginPath();ctx.arc(6,y,2,0,7);ctx.fill()}}if(selected===13){ctx.fillStyle='#34434a';ctx.beginPath();ctx.moveTo(-36,-40);ctx.quadraticCurveTo(-26,-52,-14,-35);ctx.lineTo(0,-15);ctx.lineTo(14,-35);ctx.quadraticCurveTo(26,-52,36,-40);ctx.lineTo(23,-3);ctx.lineTo(-23,-3);ctx.closePath();ctx.fill();ctx.strokeStyle='#1b252c';ctx.lineWidth=3;ctx.stroke();line([[-13,-6],[-16,32]],'#5b686b',2);line([[13,-6],[16,32]],'#5b686b',2);line([[-24,48],[-28,64],[28,64],[24,48]],'#1b252c',2)}if(selected===14){ctx.beginPath();ctx.moveTo(-20,-41);ctx.quadraticCurveTo(0,-20,20,-41);ctx.strokeStyle='#9c9c98';ctx.lineWidth=3;ctx.stroke()}if(selected===17){ctx.fillStyle='#b9bbb1';ctx.beginPath();ctx.moveTo(-35,-39);ctx.quadraticCurveTo(-26,-51,-14,-35);ctx.lineTo(0,-15);ctx.lineTo(14,-35);ctx.quadraticCurveTo(26,-51,35,-39);ctx.lineTo(23,-4);ctx.lineTo(-23,-4);ctx.closePath();ctx.fill();ctx.strokeStyle='#858980';ctx.lineWidth=3;ctx.stroke();line([[-12,-7],[-14,31]],'#252833',3);line([[12,-7],[15,31]],'#252833',3);line([[-24,47],[-29,65],[29,65],[24,47]],'#858980',3);line([[-38,13],[-31,48]],'#b9bbb1',2);line([[38,13],[31,48]],'#b9bbb1',2)}if(typeof drawClothingWear==='function')drawClothingWear();const head=active?reactionHeads[damage.streak>=3?1:0][selected]:heads[selected];if(head.complete)ctx.drawImage(head,-80,-168,160,131);ctx.filter='none';if(typeof drawFaceWear==='function')drawFaceWear(t);damageStars(t);if(selected===1){line([[-30,-40],[-24,-5],[-3,33]],'#fffaf6',2);line([[34,-40],[28,0],[9,53]],'#fffaf6',2)}ctx.restore();
}
const hitBeforeRig=hit;hit=function(x,y){if(mode!=='arena')return;const direction=(x??body.x)<body.x?1:-1;hitBeforeRig(x,y);impulseRig(5+weapon*1.25,direction)};
const selectBeforeRig=select;select=function(i){selectBeforeRig(i);resetRig()};
