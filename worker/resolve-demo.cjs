// Separate Steam worker account; never use a player's Steam password.
const SteamUser = require('steam-user');
const GlobalOffensive = require('globaloffensive');
const {ShareCode} = require('globaloffensive-sharecode');
const code = process.argv[2];
if (!/^CSGO(?:-[A-Za-z0-9]{5}){5}$/.test(code || '') || !process.env.STEAM_WORKER_REFRESH_TOKEN) process.exit(2);
let expected;try{expected=String(new ShareCode(code).decode().matchId)}catch{process.exit(2)}
const client = new SteamUser({autoRelogin:false});
const gc = new GlobalOffensive(client);
let finished=false;
function finish(url) { if(finished)return;finished=true;clearTimeout(timer);client.logOff();if(url)process.stdout.write(JSON.stringify({url}));setTimeout(()=>process.exit(url?0:1),100); }
const timer=setTimeout(()=>finish(),85000);
client.on('error',()=>finish());
gc.on('error',()=>finish());
client.on('steamGuard',()=>finish());
client.on('loggedOn',()=>client.gamesPlayed([730]));
gc.once('connectedToGC',()=>gc.requestGame(code));
gc.on('matchList',matches=>{
  // This process requests exactly one match and performs no other GC queries.
  const matching=matches.filter(m=>String(m.matchid)===expected);
  if(!matching.length)return;
  const urls=matching.flatMap(m=>[...(m.roundstatsall||[]),m.roundstats_legacy].filter(Boolean)).map(r=>r.map).filter(u=>typeof u==='string'&&/^https?:\/\//.test(u));
  finish(urls.find(u=>u.endsWith('.dem.bz2')));
});
client.logOn({refreshToken:process.env.STEAM_WORKER_REFRESH_TOKEN});
