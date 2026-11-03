const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('PWA caches only offline assets, never account/API responses',async()=>{
 const handlers={},writes=[];const offline={offline:true};
 const context={URL,self:{location:{origin:'https://clone.test'},addEventListener:(n,f)=>handlers[n]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({addAll:async a=>writes.push(...a)}),match:async()=>offline,keys:async()=>[]},fetch:async()=>{throw Error('offline')}};
 vm.runInNewContext(fs.readFileSync('static/sw.js','utf8'),context);
 let pending;handlers.install({waitUntil:p=>pending=p});await pending;
 assert.deepEqual(writes,['/static/offline.html','/static/pwa-icon-192.png','/static/pwa-icon-512.png']);
 for(const path of ['/api/auth/me','/api/cs2/tracking']){let intercepted=false;handlers.fetch({request:{url:'https://clone.test'+path,method:'GET',mode:'cors'},respondWith:()=>intercepted=true});assert.equal(intercepted,false)}
 handlers.fetch({request:{url:'https://clone.test/',method:'GET',mode:'navigate'},respondWith:p=>pending=p});assert.equal(await pending,offline);
 const manifest=JSON.parse(fs.readFileSync('static/manifest.webmanifest','utf8'));assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)assert.ok(fs.existsSync('.'+icon.src));
});
