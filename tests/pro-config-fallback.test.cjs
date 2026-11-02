const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync('static/app.js','utf8');
const loader=script.slice(script.indexOf('async function loadProConfigs(){'),script.indexOf("$('appTabs').addEventListener"));
const nodes={},context={AbortSignal,esc:String,proConfigLoaded:false,proConfigItems:[],hltvTeams:[],hltvRankingMeta:{},playerConfigFiles:[],playerPhotoFiles:[],
 $:id=>nodes[id]??=( {} ),api:async()=>{throw Error('offline')},
 fetch:async path=>{if(path.includes('index.json'))throw Error('optional index offline');return {ok:true,json:async()=>JSON.parse(fs.readFileSync('.'+path,'utf8'))}},
 mergeProConfigItems:(api,local)=>local,renderConfigTeams:()=>{nodes.rendered=true}};
vm.createContext(context);vm.runInContext(loader,context);
(async()=>{await context.loadProConfigs();assert.equal(context.proConfigLoaded,true);assert.equal(nodes.rendered,true);assert.equal(context.hltvTeams.length,29);assert.ok(context.proConfigItems.length>0);assert.ok(nodes.configStatus.innerHTML.includes('145 oyuncu'));console.log('PASS: Pro Config local catalog works when API and optional indexes are unavailable');})().catch(e=>{console.error(e);process.exitCode=1});
