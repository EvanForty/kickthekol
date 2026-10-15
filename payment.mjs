export const TREASURY='3d6EEXauB9KFBkDW4zE81fDaFrHoygyCquRxzeMwmrvg';
export const PRODUCTS=['whale','meteor','candle'];
export const memoFor=id=>'KickTheKOL:premium:'+id+':v1';
export function validPayment(tx,wallet,product){
 if(!PRODUCTS.includes(product)||!tx||!tx.meta||tx.meta.err!==null)return false;
 const msg=tx.transaction?.message;
 if(!msg?.accountKeys?.some(k=>k.pubkey===wallet&&k.signer))return false;
 const instructions=msg.instructions||[];
 return instructions.some(i=>i.programId==='11111111111111111111111111111111'&&i.parsed?.type==='transfer'&&i.parsed.info.source===wallet&&i.parsed.info.destination===TREASURY&&i.parsed.info.lamports===100000000)
 && instructions.some(i=>i.programId==='MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'&&i.parsed===memoFor(product));
}
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function rpc(env,method,params){
 const response=await fetch(env.SOLANA_RPC_URL||'https://solana-rpc.publicnode.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Solana connection is unavailable. Try again later.');
 const result=await response.json();if(result.error)throw Error('Solana could not verify this request. Try again later.');return result.result;
}
export default {async fetch(request){
 const env=process.env;
 const url=new URL(request.url);
 const action=url.searchParams.get('action');
 if(action)url.pathname='/api/payment/'+action;
 try{
 if(url.pathname.startsWith('/api/')){
 if(request.method!=='POST')return json({error:'POST required'},405);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Invalid origin'},403);
 if(Number(request.headers.get('Content-Length'))>3000)return json({error:'Request too large'},413);
 const raw=await request.text();if(raw.length>3000)return json({error:'Request too large'},413);
 const input=JSON.parse(raw||'{}');
 if(!PRODUCTS.includes(input.product))return json({error:'Unknown premium weapon'},400);
 if(url.pathname==='/api/payment/prepare')return json({treasury:TREASURY,lamports:100000000,memo:memoFor(input.product),...(await rpc(env,'getLatestBlockhash',[{commitment:'finalized'}])).value});
 if(url.pathname==='/api/payment/verify'){
 if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.wallet)||!/^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(input.signature))return json({error:'Enter a valid wallet and transaction signature.'},400);
 const tx=await rpc(env,'getTransaction',[input.signature,{encoding:'jsonParsed',commitment:'finalized',maxSupportedTransactionVersion:0}]);
 if(!tx)return json({status:'pending'});
 if(!validPayment(tx,input.wallet,input.product))return json({error:'This transaction is not a successful 0.1 SOL weapon purchase from this wallet.'},422);
 return json({status:'verified',wallet:input.wallet,signature:input.signature,product:input.product});
 }
 return json({error:'Not found'},404);
 }
 return json({error:'Not found'},404);
 }catch{return json({error:'Payment verification is unavailable. Keep your transaction signature and retry; do not pay again.'},503);}
 }};
