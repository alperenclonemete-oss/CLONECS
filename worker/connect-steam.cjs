// Run locally in your own terminal. Secrets are never printed or sent to CLONE LAB.
const SteamUser=require('steam-user');
const readline=require('readline');
const {Writable}=require('stream');
const fs=require('fs');const path=require('path');
let hidden=false;
const output=new Writable({write(chunk,encoding,callback){if(!hidden)process.stdout.write(chunk);callback()}});
const rl=readline.createInterface({input:process.stdin,output,terminal:true});
function ask(label,secret=false){process.stdout.write(label);hidden=secret;return new Promise(resolve=>rl.question('',value=>{hidden=false;if(secret)process.stdout.write('\n');resolve(value.trim())}))}
const client=new SteamUser({autoRelogin:false});
client.on('error',()=>{console.error('Steam bağlantısı başarısız. Bilgileri kontrol edip tekrar deneyin.');rl.close();process.exit(1)});
client.on('steamGuard',async(domain,callback)=>callback(await ask('Steam Guard kodu: ',true)));
client.once('refreshToken',token=>{
  const destination=path.resolve(__dirname,'../.env.worker');
  // Never overwrite an existing configuration or print the token.
  try{fs.writeFileSync(destination,'STEAM_WORKER_REFRESH_TOKEN='+JSON.stringify(token)+'\n',{flag:'wx',mode:0o600});console.log('İşleyici oturumu .env.worker dosyasına kaydedildi. Bu dosyayı paylaşmayın.');}
  catch{console.error('.env.worker zaten var veya yazılamadı; mevcut dosya değiştirilmedi.');}
  client.logOff();rl.close();setTimeout(()=>process.exit(0),200);
});
(async()=>{console.log('Yalnızca ayrı Steam işleyici hesabıyla giriş yapın.');const accountName=await ask('Steam hesap adı: ');const password=await ask('Parola (gizli): ',true);client.logOn({accountName,password});})();
