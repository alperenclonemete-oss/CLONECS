const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const seed=JSON.parse(fs.readFileSync('static/lineup-seed.json','utf8'));
let stored=null;
const context={window:{dispatchEvent(){}},Event:class{},localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},fetch:async()=>({ok:true,json:async()=>seed})};
vm.createContext(context);vm.runInContext(fs.readFileSync('static/lineup-catalog.js','utf8'),context);
(async()=>{
 const C=context.window.LineupCatalog;await C.ready;
 assert.equal(Object.values(C.read().maps).flatMap(m=>m.lineups).length,19);
 for(const m of Object.values(C.read().maps))if(m.radar)assert.ok(fs.existsSync('.'+m.radar));
 for(const bad of ['null','{"maps":null}','{"maps":[]}','{"maps":{"mirage":{"lineups":{}}}}']){
   stored=bad;assert.equal(C.read().maps.mirage.lineups.length,7);
 }
 stored=null;const row=C.read().maps.mirage.lineups[0];
 C.save('mirage',{...row,throwType:'Updated instruction'});
 assert.equal(C.read().maps.mirage.lineups.length,7);
 assert.equal(C.read().maps.mirage.lineups.find(r=>r.id===row.id).throwType,'Updated instruction');
 assert.throws(()=>C.save('mirage',{...row,x:NaN}));
 assert.equal(C.image('javascript:alert(1)'),'');
 const groups=C.clusters([{...row,x:20,y:20},{...row,id:'second',x:21,y:20},{...row,id:'far',x:70,y:70}]);
 assert.equal(groups.length,2);assert.equal(groups[0].items.length,2);
 console.log('PASS: 19 source rows, radar assets, malformed storage, edit persistence, coordinate validation and clustering');
})().catch(e=>{console.error(e);process.exitCode=1});
