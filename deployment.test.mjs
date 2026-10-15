import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import handler from './.vercel/output/functions/payment.func/server.mjs';
test('build emits function, routes and only browser assets',async()=>{
 const root=new URL('./.vercel/output/',import.meta.url);
 const config=JSON.parse(await readFile(new URL('config.json',root)));
 assert.equal(config.version,3);
 for(const action of ['prepare','verify'])assert.equal(('/api/payment/'+action).replace(new RegExp(config.routes[0].src),config.routes[0].dest),'/payment?action='+action);
 const fn=JSON.parse(await readFile(new URL('functions/payment.func/.vc-config.json',root)));
 assert.equal(fn.runtime,'nodejs22.x');assert.equal(fn.launcherType,'Nodejs');
 await readFile(new URL('functions/payment.func/'+fn.handler,root));
 const files=await readdir(new URL('static/',root));assert.equal(files.length,11);assert.ok(!files.includes('payment.mjs'));
 const vc=JSON.parse(await readFile(new URL('./vercel.json',import.meta.url)));assert.equal(vc.functions,undefined);assert.equal(vc.outputDirectory,undefined);
});
test('generated Node handler works through HTTP with payment routing and origin checks',async()=>{
 const nativeFetch=globalThis.fetch;
 globalThis.fetch=async()=>Response.json({result:{value:{blockhash:'test',lastValidBlockHeight:123}}});
 const server=createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 try{
  const post=async(path,body,source=origin)=>nativeFetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json','Origin':source,'x-forwarded-proto':'http'},body:JSON.stringify(body)});
  const response=await post('/payment?action=prepare',{product:'whale'});assert.equal(response.status,200);assert.equal((await response.json()).lamports,100000000);
  assert.equal((await post('/payment?action=prepare',{product:'whale'},'https://other.example')).status,403);
  assert.equal((await post('/payment?action=verify',{product:'whale',wallet:'bad',signature:'bad'})).status,400);
  assert.equal((await post('/payment?action=prepare',{product:'bad'})).status,400);
 }finally{globalThis.fetch=nativeFetch;await new Promise(resolve=>server.close(resolve));}
});
