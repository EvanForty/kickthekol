// Every receipt is rechecked against finalized mainnet transactions before use.
const premiumItems=[{id:'whale',name:'Whale Drop',icon:'🐋',desc:'Drop a giant crypto whale. Huge bounce, huge splash.',base:5},{id:'meteor',name:'MEV Meteor',icon:'☄️',desc:'A flaming meteor sends your KOL spinning.',base:4},{id:'candle',name:'God Candle',icon:'🟩',desc:'Launch your KOL with an enormous green candle.',base:1}];
const treasury='3d6EEXauB9KFBkDW4zE81fDaFrHoygyCquRxzeMwmrvg';
let premiumWallet='',premiumProvider=null,premiumActive=null,premiumBusy=false,premiumChoice='whale',shopReturn='home',premiumEffects=[];
let ownedPremium=new Set();
const receipts=()=>read('kickPremiumReceiptsV1',{});
function storeReceipt(product,signature){const all=receipts();all[premiumWallet]??={};all[premiumWallet][product]=signature;save('kickPremiumReceiptsV1',all);}
async function paymentApi(action,data){const r=await fetch('/api/payment/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw Error(result.error||'Payment service unavailable');return result;}
function shopStatus(message){$('#premium-status').textContent=message;}
function renderPremium(){
 $('#wallet-label').textContent=premiumWallet?premiumWallet.slice(0,6)+'…'+premiumWallet.slice(-6):'Wallet not connected';
 $('#premium-connect').textContent=premiumWallet?'Change / reconnect wallet':'Connect Phantom or Solflare';
 $('#premium-items').innerHTML=premiumItems.map(p=>`<button class="premium-card ${premiumChoice===p.id?'chosen':''}" data-premium="${p.id}" aria-pressed="${premiumChoice===p.id}"><span>${p.icon}</span><strong>${p.name}</strong><small>${p.desc}</small><b>${ownedPremium.has(p.id)?'✓ Owned':'0.1 SOL'}</b></button>`).join('');
 document.querySelectorAll('[data-premium]').forEach(b=>b.onclick=()=>{if(premiumBusy)return;premiumChoice=b.dataset.premium;renderPremium();shopStatus('');});
 const p=premiumItems.find(p=>p.id===premiumChoice),has=ownedPremium.has(p.id),pending=receipts()[premiumWallet]?.[p.id];
 $('#premium-buy').textContent=has?'Equip '+p.name:pending?'Check existing payment':'Buy '+p.name+' · 0.1 SOL';
 $('#premium-buy').disabled=premiumBusy||!premiumWallet;
 $('#premium-connect').disabled=premiumBusy;$('#premium-restore').disabled=premiumBusy||!premiumWallet;
}
function openPremium(){shopReturn=mode==='arena'?'arena':'home';show('premium');renderPremium();}
document.querySelectorAll('[data-shop]').forEach(b=>b.onclick=openPremium);
$('#premium-close').onclick=()=>show(shopReturn);
async function verifyReceipt(product,signature,poll=false){
 const wallet=premiumWallet;
 for(let attempt=0;attempt<(poll?20:1);attempt++){
 const result=await paymentApi('verify',{wallet,product,signature});
 if(wallet!==premiumWallet)throw Error('Wallet changed. Reconnect to check your purchase.');
 if(result.status==='verified'){ownedPremium.add(product);storeReceipt(product,signature);renderPremium();weapons();return true;}
 if(!poll) return false;
 shopStatus('Payment submitted. Waiting for final confirmation… Do not pay again.');
 await new Promise(resolve=>setTimeout(resolve,3000));
 }
 return false;
}
$('#premium-connect').onclick=async()=>{
 try{
 premiumProvider=window.phantom?.solana||window.solflare;
 if(!premiumProvider)throw Error('Open this game in a browser with Phantom or Solflare installed, or in your wallet’s in-app browser.');
 await premiumProvider.connect();premiumWallet=premiumProvider.publicKey.toString();ownedPremium.clear();premiumActive=null;
 if(!premiumProvider._kickBound){premiumProvider.on?.('accountChanged',()=>{premiumWallet='';ownedPremium.clear();premiumActive=null;renderPremium();weapons();shopStatus('Wallet changed. Reconnect to restore purchases.');});premiumProvider.on?.('disconnect',()=>{premiumWallet='';ownedPremium.clear();premiumActive=null;renderPremium();weapons();});premiumProvider._kickBound=true;}
 renderPremium();shopStatus('Connected. Checking saved receipts…');
 for(const [product,signature] of Object.entries(receipts()[premiumWallet]||{}))if(premiumItems.some(p=>p.id===product))await verifyReceipt(product,signature);
 shopStatus('Connected to '+premiumWallet+'. Purchases use Solana mainnet.');renderPremium();
 }catch(e){shopStatus(e.message||'Wallet connection cancelled.');}
};
$('#premium-buy').onclick=async()=>{
 const product=premiumChoice,p=premiumItems.find(p=>p.id===product);
 if(ownedPremium.has(product)){premiumActive=product;flinging=false;weapon=p.base;weapons();show(shopReturn==='arena'?'arena':'choose');return;}
 if(premiumBusy||!premiumWallet)return;
 premiumBusy=true;renderPremium();
 try{
 let signature=receipts()[premiumWallet]?.[product];
 if(!signature){
 shopStatus('Preparing '+p.name+' purchase for 0.1 SOL + network fee…');
 const quote=await paymentApi('prepare',{product});
 if(quote.treasury!==treasury||quote.lamports!==100000000||quote.memo!=='KickTheKOL:premium:'+product+':v1')throw Error('Payment details do not match. Purchase stopped.');
 const w=solanaWeb3,wallet=premiumWallet;
 const tx=new w.Transaction({feePayer:new w.PublicKey(wallet),recentBlockhash:quote.blockhash});
 tx.add(w.SystemProgram.transfer({fromPubkey:new w.PublicKey(wallet),toPubkey:new w.PublicKey(treasury),lamports:100000000}));
 tx.add(new w.TransactionInstruction({keys:[],programId:new w.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),data:tx.instructions[0].data.constructor.from(quote.memo,'utf8')}));
 shopStatus('Approve 0.1 SOL in your wallet to buy '+p.name+'.');
 const sent=await premiumProvider.signAndSendTransaction(tx);
 signature=typeof sent==='string'?sent:sent.signature;
 if(!signature)throw Error('Wallet did not return a receipt. Check wallet activity before trying again.');
 // Retain a pending receipt even if confirmation fails or the page closes.
 const all=receipts();all[wallet]??={};all[wallet][product]=signature;save('kickPremiumReceiptsV1',all);
 $('#receipt-signature').value=signature;
 if(wallet!==premiumWallet)throw Error('Wallet changed. Reconnect the purchasing wallet.');
 }
 const ok=await verifyReceipt(product,signature,true);
 shopStatus(ok?p.name+' unlocked! Select Equip to use it. Keep your transaction signature to restore on another device.':'Payment is still pending. Keep your receipt and check it again; do not pay again.');
 }catch(e){shopStatus(e.code===4001?'Purchase cancelled in your wallet.':e.message||'Purchase did not complete. Check wallet activity before retrying.');}
 finally{premiumBusy=false;renderPremium();}
};
$('#premium-restore').onclick=async()=>{
 if(premiumBusy)return;const signature=$('#receipt-signature').value.trim();if(!signature){shopStatus('Paste the transaction signature from your wallet activity.');return;}
 premiumBusy=true;renderPremium();
 try{const ok=await verifyReceipt(premiumChoice,signature);shopStatus(ok?'Purchase restored. Your weapon is ready to equip.':'Transaction not finalized yet. Retry later.');}catch(e){shopStatus(e.message);}finally{premiumBusy=false;renderPremium();}
};
const originalPickTool=pickTool;pickTool=function(i){premiumActive=null;originalPickTool(i);};
const standardWeapons=weapons;weapons=function(){standardWeapons();const p=premiumItems.find(p=>p.id===premiumActive);if(p&&ownedPremium.has(p.id)){$('#weapon-tip').textContent=p.desc;document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});}const b=document.createElement('button');b.className='weapon premium-shortcut'+(p?' selected':'');b.textContent=p?p.icon+' '+p.name:'✦ Premium';b.onclick=openPremium;$('#weapons').appendChild(b);};
const normalHit=hit;hit=function(x=body.x,y=body.y){normalHit(x,y);if(mode!=='arena'||!premiumActive||!ownedPremium.has(premiumActive))return;const p=premiumActive;body.vy=p==='candle'?-32:-25;body.vx=p==='whale'?(body.x<500?24:-24):body.vx;body.va=p==='meteor'?.55:body.va;premiumEffects.push({id:p,x,y,t:performance.now()});};
const drawBaseCharacter=character;character=function(t){drawBaseCharacter(t);premiumEffects=premiumEffects.filter(f=>t-f.t<1200);for(const f of premiumEffects){const age=(t-f.t)/1200;ctx.save();ctx.globalAlpha=1-age;ctx.translate(f.x,f.y-180+Math.min(age*5,1)*130);if(f.id==='candle'){ctx.fillStyle='#39e785';ctx.strokeStyle='#153e2b';ctx.lineWidth=6;ctx.fillRect(-30,-140,60,180);ctx.strokeRect(-30,-140,60,180);ctx.beginPath();ctx.moveTo(0,-180);ctx.lineTo(0,75);ctx.stroke();}else{ctx.font='130px sans-serif';ctx.textAlign='center';ctx.fillText(f.id==='whale'?'🐋':'☄️',0,0);}ctx.restore();}};
weapons();
