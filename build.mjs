import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
const out=new URL('./.vercel/output/',import.meta.url);
const assets=['index.html','arcade.css','game.js','arcade.js','rig.js','solana-web3.min.js','premium.js','pain-voice.js','audio.js','wear.js','weapon-input.js'];
await mkdir(new URL('static/',out),{recursive:true});
await mkdir(new URL('functions/payment.func/',out),{recursive:true});
for(const file of assets)await copyFile(new URL(file,import.meta.url),new URL('static/'+file,out));
for(const file of ['payment.mjs','server.mjs'])await copyFile(new URL(file,import.meta.url),new URL('functions/payment.func/'+file,out));
await writeFile(new URL('functions/payment.func/.vc-config.json',out),JSON.stringify({runtime:'nodejs22.x',handler:'server.mjs',launcherType:'Nodejs',maxDuration:20},null,2));
await writeFile(new URL('config.json',out),JSON.stringify({version:3,routes:[{src:'^/api/payment/(prepare|verify)$',dest:'/payment?action=$1'},{src:'^/$',dest:'/index.html'},{handle:'filesystem'}]},null,2));
const html=await readFile(new URL('static/index.html',out),'utf8');
for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^https?:/.test(match[1]))await readFile(new URL('static/'+match[1],out));}
console.log('Built game assets and payment function with Vercel Build Output API v3.');
