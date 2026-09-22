const http=require("http"),crypto=require("crypto");
const PORT=8787, licenses=new Map(), transfers=new Map();
function send(res,code,data){const b=JSON.stringify(data);res.writeHead(code,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"});res.end(b)}
function body(req){return new Promise((ok,bad)=>{let s="";req.on("data",x=>s+=x);req.on("end",()=>{try{ok(s?JSON.parse(s):{})}catch(e){bad(e)}})})}
function code(){let x=crypto.randomBytes(10).toString("hex").toUpperCase();return`SWS-${x.slice(0,4)}-${x.slice(4,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}`}
function token(){return crypto.randomBytes(32).toString("hex")}
setInterval(()=>{let n=Date.now();for(let [k,v]of transfers)if(v.used||v.expiresAt<=n)transfers.delete(k)},30000);
http.createServer(async(req,res)=>{
 if(req.method==="OPTIONS")return send(res,204,{});
 let u=new URL(req.url,`http://${req.headers.host}`);
 try{
  if(req.method==="GET"&&u.pathname==="/api/health")return send(res,200,{ok:true,service:"Soft Week Studio License Test Server"});
  if(req.method==="GET"&&u.pathname==="/api/admin/licenses")return send(res,200,{ok:true,licenses:[...licenses.values()]});
  let b=await body(req);
  if(req.method==="POST"&&u.pathname==="/api/license/create"){let c=code(),l={code:c,status:"UNUSED",deviceId:null,transferCount:0,createdAt:Date.now()};licenses.set(c,l);return send(res,201,{ok:true,license:l})}
  if(req.method==="POST"&&u.pathname==="/api/license/activate"){let c=String(b.code||"").trim().toUpperCase(),d=String(b.deviceId||"").trim(),l=licenses.get(c);if(!l)return send(res,404,{ok:false,error:"INVALID_LICENSE"});if(l.status==="REVOKED")return send(res,409,{ok:false,error:"LICENSE_REVOKED"});if(!d)return send(res,400,{ok:false,error:"DEVICE_REQUIRED"});if(l.status==="ACTIVE"&&l.deviceId!==d)return send(res,409,{ok:false,error:"LICENSE_ALREADY_ACTIVE_ON_ANOTHER_DEVICE"});l.status="ACTIVE";l.deviceId=d;return send(res,200,{ok:true,license:l})}
  if(req.method==="POST"&&u.pathname==="/api/transfer/create"){let c=String(b.code||"").trim().toUpperCase(),d=String(b.deviceId||"").trim(),l=licenses.get(c);if(!l)return send(res,404,{ok:false,error:"INVALID_LICENSE"});if(l.status!=="ACTIVE")return send(res,409,{ok:false,error:"LICENSE_NOT_ACTIVE"});if(l.deviceId!==d)return send(res,403,{ok:false,error:"NOT_CURRENT_LICENSE_DEVICE"});let t=token(),e=Date.now()+120000;transfers.set(t,{code:c,fromDeviceId:d,expiresAt:e,used:false});return send(res,201,{ok:true,token:t,expiresAt:e})}
  if(req.method==="POST"&&u.pathname==="/api/transfer/claim"){let t=String(b.token||""),d=String(b.deviceId||"").trim(),x=transfers.get(t);if(!x)return send(res,404,{ok:false,error:"INVALID_OR_EXPIRED_TRANSFER_TOKEN"});if(x.used||x.expiresAt<=Date.now()){transfers.delete(t);return send(res,409,{ok:false,error:"TRANSFER_TOKEN_EXPIRED_OR_USED"})}if(!d)return send(res,400,{ok:false,error:"DEVICE_REQUIRED"});let l=licenses.get(x.code);if(!l)return send(res,404,{ok:false,error:"INVALID_LICENSE"});if(l.status!=="ACTIVE"||l.deviceId!==x.fromDeviceId)return send(res,409,{ok:false,error:"LICENSE_STATE_CHANGED"});l.deviceId=d;l.transferCount++;x.used=true;return send(res,200,{ok:true,license:l,transferUsed:true})}
  if(req.method==="POST"&&u.pathname==="/api/license/revoke"){let c=String(b.code||"").trim().toUpperCase(),l=licenses.get(c);if(!l)return send(res,404,{ok:false,error:"INVALID_LICENSE"});l.status="REVOKED";return send(res,200,{ok:true,license:l})}
  return send(res,404,{ok:false,error:"NOT_FOUND"})
 }catch(e){return send(res,500,{ok:false,error:"SERVER_ERROR",detail:e.message})}
}).listen(PORT,()=>console.log("Soft Week Studio License Test Server: http://localhost:"+PORT));
