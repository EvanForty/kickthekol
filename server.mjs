import payment from './payment.mjs';
export default async function handler(req,res){
 try{
  const headers=new Headers();
  for(const [key,value] of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);
  let body='';
  for await(const chunk of req){body+=chunk.toString();if(body.length>3000){res.statusCode=413;res.end('Request too large');return;}}
  const host=headers.get('host')||'localhost';
  const protocol=(headers.get('x-forwarded-proto')||'https').split(',')[0].trim();
  const request=new Request(new URL(req.url,protocol+'://'+host),{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body}:{})});
  const response=await payment.fetch(request);
  res.statusCode=response.status;
  response.headers.forEach((value,key)=>res.setHeader(key,value));
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.statusCode=500;res.end('Payment service unavailable. Retry verification before paying again.');}
}
