import {test} from 'node:test';import assert from 'node:assert/strict';
import handler,{validPayment,TREASURY,memoFor} from './payment.mjs';
const wallet='payer';
const fixture=()=>({meta:{err:null},transaction:{message:{accountKeys:[{pubkey:wallet,signer:true}],instructions:[{programId:'11111111111111111111111111111111',parsed:{type:'transfer',info:{source:wallet,destination:TREASURY,lamports:100000000}}},{programId:'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',parsed:memoFor('whale')}]}}});
test('accepts exact purchase and binds it to one weapon',()=>{assert.equal(validPayment(fixture(),wallet,'whale'),true);assert.equal(validPayment(fixture(),wallet,'meteor'),false);});
test('rejects failed, incomplete, forged and mismatched transfers',()=>{assert.equal(validPayment(null,wallet,'whale'),false);for(const change of [t=>t.meta.err={InstructionError:1},t=>t.transaction.message.accountKeys[0].signer=false,t=>t.transaction.message.instructions[0].parsed.info.source='other',t=>t.transaction.message.instructions[0].parsed.info.destination='other',t=>t.transaction.message.instructions[0].parsed.info.lamports=10000000,t=>t.transaction.message.instructions[0].programId='fake',t=>t.transaction.message.instructions.pop()]){const t=fixture();change(t);assert.equal(validPayment(t,wallet,'whale'),false);}});
test('rejects other payer and unknown product',()=>{assert.equal(validPayment(fixture(),'other','whale'),false);assert.equal(validPayment(fixture(),wallet,'fake'),false);});
test('Vercel rewritten routes prepare and verify payments',async()=>{
 const originalFetch=globalThis.fetch;
 const payer='A'.repeat(32),signature='B'.repeat(88);
 const request=(action,input,origin='https://game.example')=>new Request('https://game.example/api/payment?action='+action,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input)});
 try{
  globalThis.fetch=async()=>Response.json({result:{value:{blockhash:'test-blockhash',lastValidBlockHeight:123}}});
  const prepared=await handler.fetch(request('prepare',{product:'whale'}));
  assert.equal(prepared.status,200);assert.deepEqual(await prepared.json(),{treasury:TREASURY,lamports:100000000,memo:memoFor('whale'),blockhash:'test-blockhash',lastValidBlockHeight:123});
  const tx=fixture();tx.transaction.message.accountKeys[0].pubkey=payer;tx.transaction.message.instructions[0].parsed.info.source=payer;
  globalThis.fetch=async()=>Response.json({result:tx});
  const input={product:'whale',wallet:payer,signature};
  assert.equal((await (await handler.fetch(request('verify',input))).json()).status,'verified');
  assert.equal((await handler.fetch(request('verify',{...input,product:'meteor'}))).status,422);
  assert.equal((await handler.fetch(request('verify',input,'https://other.example'))).status,403);
  assert.equal((await handler.fetch(request('verify',{...input,signature:'invalid'}))).status,400);
  globalThis.fetch=async()=>Response.json({result:null});
  assert.equal((await (await handler.fetch(request('verify',input))).json()).status,'pending');
  assert.equal((await handler.fetch(new Request('https://game.example/api/payment?action=prepare'))).status,405);
 }finally{globalThis.fetch=originalFetch;}
});

