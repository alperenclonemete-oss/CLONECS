const fs=require('node:fs');
const {parseKV3,overview,project}=require('./annotation-data.cjs');
const root='data/lineup-sources/';
const typeMap={smoke:'smoke',flash:'flash',molotov:'molotov',incendiary:'molotov',he:'he'};
const clean=s=>String(s||'').replace(/\\n/g,'\n').trim();
const skipped=[],result=[];
const floor=(map,p)=>map==='vertigo'?(p[2]<11700?'lower':'upper'):map==='nuke'?(p[2]<-495?'lower':'upper'):map==='train'?(p[2]<-50?'lower':'upper'):'upper';
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('-community.txt')||f==='cache-valve.txt')){
 const map=file.split('-')[0],official=file==='cache-valve.txt',o=overview(map);
 const data=parseKV3(fs.readFileSync(root+file,'utf8')),nodes=Object.values(data).filter(n=>n&&typeof n==='object');
 for(const n of nodes.filter(n=>n.Type==='grenade'&&n.SubType==='main'&&n.Enabled!==false)){
  const aim=nodes.find(a=>a.MasterNodeId===n.Id&&a.SubType==='aim_target'&&a.Enabled!==false);
  const dest=nodes.find(a=>a.MasterNodeId===n.Id&&a.SubType==='destination'&&a.Enabled!==false);
  if(!aim||!dest||!typeMap[n.GrenadeType]){skipped.push({map,id:n.Id,reason:'Missing aim, destination or supported grenade type'});continue;}
  const start=project(n.Position,o),end=project(dest.Position,o);
  if(![start.x,start.y,end.x,end.y].every(v=>Number.isFinite(v)&&v>=0&&v<=100)){skipped.push({map,id:n.Id,reason:'Outside radar'});continue;}
  let title=clean(n.Title?.Text),from=clean(n.Desc?.Text),instruction=clean(aim.Desc?.Text);
  // Two imported Train records refer to localized strings absent from this export.
  if(title.startsWith('#')){skipped.push({map,id:n.Id,reason:'Missing localized instructions'});continue;}
  const team=official?(/^(B Main|A Main)/.test(title)?'CT':'T'):JSON.stringify(n.Color)==='[151,201,250]'?'CT':JSON.stringify(n.Color)==='[255,239,111]'?'T':null;
  if(!team){skipped.push({map,id:n.Id,reason:'Unknown side'});continue;}
  result.push({id:(official?'valve-':'annotations-')+n.Id,map,title,type:typeMap[n.GrenadeType],...start,tx:end.x,ty:end.y,team,from,aim:instruction,throwType:instruction|| (n.JumpThrow?'Zıplayarak atış.':'Sabit atış.'),jumpThrow:n.JumpThrow===true,worldStart:n.Position,worldTarget:dest.Position,viewAngles:aim.Angles,startFloor:floor(map,n.Position),targetFloor:floor(map,dest.Position),source:official?'Valve':'CS2-Annotations',sourceUrl:official?'https://github.com/SteamDatabase/GameTracking-CS2/blob/master/game/csgo/pak01_dir/annotations/official/de_cache/de_cache.txt':'https://github.com/ReneRebsdorf/CS2-annotations',author:official?'Valve':'Rene Rebsdorf ve katkıda bulunanlar',workshopId:data.WorkshopSubmissionID,coordinateSpace:'world',status:'source-imported'});
 }
}
// Retain photo-backed records on matching single-floor radars. Misregistered
// Vertigo/Overpass legacy markers are replaced by world-coordinate annotations.
for(const r of JSON.parse(fs.readFileSync(root+'lineupx-legacy.json','utf8')).filter(r=>!['vertigo','overpass'].includes(r.map))){
 result.push({...r,source:'LineupX',sourceUrl:'https://github.com/shimupan/lineupx',coordinateSpace:'legacy-percent',startFloor:'upper',targetFloor:'upper',status:'legacy-2024'});
}
fs.writeFileSync('static/lineup-seed.json',JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(root+'import-report.json',JSON.stringify({records:result.length,byMap:Object.fromEntries([...new Set(result.map(r=>r.map))].map(m=>[m,result.filter(r=>r.map===m).length])),skipped},null,2)+'\n');
console.log(fs.readFileSync(root+'import-report.json','utf8'));
