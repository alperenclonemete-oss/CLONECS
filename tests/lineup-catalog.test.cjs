const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const seed=JSON.parse(fs.readFileSync('static/lineup-seed.json','utf8'));
let stored=null;
const context={window:{dispatchEvent(){}},Event:class{},localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},fetch:async()=>({ok:true,json:async()=>seed})};
vm.createContext(context);vm.runInContext(fs.readFileSync('static/lineup-catalog.js','utf8'),context);
(async()=>{
 const C=context.window.LineupCatalog;await C.ready;
 assert.equal(Object.values(C.read().maps).flatMap(m=>m.lineups).length,447);
 for(const m of Object.values(C.read().maps))if(m.radar)assert.ok(fs.existsSync('.'+m.radar));
 for(const bad of ['null','{"maps":null}','{"maps":[]}','{"maps":{"mirage":{"lineups":{}}}}']){
   stored=bad;assert.equal(C.read().maps.mirage.lineups.length,50);
 }
 stored=null;const row=C.read().maps.mirage.lineups[0];
 C.save('mirage',{...row,standImage:'/static/custom.png',tx:1});
 assert.equal(C.read().maps.mirage.lineups.length,50);
 assert.equal(C.read().maps.mirage.lineups.find(r=>r.id===row.id).standImage,'/static/custom.png');
 assert.equal(C.read().maps.mirage.lineups.find(r=>r.id===row.id).tx,row.tx);
 for(const record of seed)for(const field of ['standImage','aimImage','landingImage'])if(record[field])assert.ok(fs.existsSync('.'+record[field]));
 for(const record of seed.filter(r=>r.map==='dust2'&&r.title.includes('CT geçidi')))assert.equal(record.ty,25);
 assert.throws(()=>C.save('mirage',{...row,x:NaN}));
 assert.equal(C.image('javascript:alert(1)'),'');
 const groups=C.clusters([{...row,x:20,y:20},{...row,id:'second',x:21,y:20},{...row,id:'far',x:70,y:70}]);
 assert.equal(groups.length,2);assert.equal(groups[0].items.length,2);
 assert.equal(new Set(seed.map(r=>r.id)).size,seed.length);
 for(const map of Object.keys(C.maps))assert.ok(seed.some(r=>r.map===map));
 const ct=C.filterRows(seed,{team:'CT',type:'smoke'});
 assert.ok(ct.length>30);assert.ok(ct.every(r=>r.team==='CT'&&r.type==='smoke'));
 assert.ok(C.filterRows(seed,{team:'T',type:'flash'}).length>10);
 assert.ok(C.filterRows(seed,{type:'he'}).length>0);
 assert.equal(C.filterRows(seed,{photosOnly:true}).length,16);
 assert.equal(C.filterRows(seed,{team:'CT',savedOnly:true,favorites:[seed.find(r=>r.team==='T').id]}).length,0);
 const mixed=C.clusters([{...row,x:20,y:20,type:'smoke'},{...row,id:'flash',x:20,y:20,type:'flash'}]);
 assert.equal(mixed.length,1);assert.equal(mixed[0].type,'mixed');
 assert.equal(C.clusters([{...row,startFloor:'upper'},{...row,startFloor:'lower'}]).length,2);
 const {project,overview,parseKV3}=require('../tools/annotation-data.cjs');
 assert.deepEqual(project([-3168,1762,0],overview('vertigo')),{x:0,y:0});
 assert.deepEqual(project([-1120,-286,0],overview('vertigo')),{x:50,y:50});
 assert.deepEqual(project([-2168.6,-881.4,0],overview('overpass')),{x:50,y:50});
 for(const r of seed.filter(r=>r.coordinateSpace==='world')){
   const {x,y}=project(r.worldStart,overview(r.map));assert.equal(r.x,x);assert.equal(r.y,y);
   const target=project(r.worldTarget,overview(r.map));assert.equal(r.tx,target.x);assert.equal(r.ty,target.y);
   const file='data/lineup-sources/'+r.map+(r.source==='Valve'?'-valve.txt':'-community.txt');
   const nodes=Object.values(parseKV3(fs.readFileSync(file,'utf8'))),id=r.id.replace(/^(annotations|valve)-/,'');
   assert.deepEqual(r.worldStart,nodes.find(n=>n?.Id===id).Position);
   assert.deepEqual(r.worldTarget,nodes.find(n=>n?.MasterNodeId===id&&n.SubType==='destination').Position);
   if(['nuke','train','vertigo'].includes(r.map))for(const f of [r.startFloor,r.targetFloor])assert.ok(fs.existsSync('static/radars/de_'+r.map+(f==='lower'?'_lower':'')+'_radar_psd.png'));
 }
 assert.ok(seed.some(r=>r.map==='vertigo'&&r.startFloor!==r.targetFloor));
 console.log('PASS: 447 source rows, all 10 maps, CT/T and grenade filters, 16 photo records, source-coordinate parity, floor assets, storage and clustering');
})().catch(e=>{console.error(e);process.exitCode=1});
