const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync('static/app.js','utf8');
const nav=script.slice(script.indexOf('async function selectMainTab('),script.indexOf('function closeProfileMenu('));
const panels=Object.fromEntries(['faceit','steam','configs','lineups','settings'].map(k=>[k+'Tab',{hidden:false}]));
let loads=0;const context={$:id=>panels[id]||null,document:{querySelectorAll:()=>[]},loadProConfigs:async()=>loads++,loadSteamProfile:async()=>{},window:{}};
vm.createContext(context);vm.runInContext(nav,context);
(async()=>{await context.selectMainTab('configs');assert.equal(loads,1);assert.equal(panels.configsTab.hidden,false);assert.equal(panels.lineupsTab.hidden,true);await context.selectMainTab('lineups');assert.equal(panels.lineupsTab.hidden,false);assert.equal(panels.configsTab.hidden,true);console.log('PASS: missing Studio panel does not block Pro Config or lineup navigation');})().catch(e=>{console.error(e);process.exitCode=1});
