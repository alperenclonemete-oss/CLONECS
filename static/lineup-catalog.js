(() => {
  const key='clone_lab_lineup_catalog_v2';
  const maps={ancient:'Ancient',anubis:'Anubis',cache:'Cache',dust2:'Dust II',inferno:'Inferno',mirage:'Mirage',nuke:'Nuke',overpass:'Overpass',train:'Train',vertigo:'Vertigo'};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const image=v=>typeof v==='string'&&(/^\/static\/[a-zA-Z0-9_./-]+$/.test(v)||/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v))?v:'';
  let seed=[];
  const valid=r=>r&&typeof r.id==='string'&&/^[a-zA-Z0-9_-]+$/.test(r.id)&&['smoke','flash','molotov'].includes(r.type)&&['x','y','tx','ty'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<=100);
  const rows=v=>Array.isArray(v)?v.filter(valid):[];
  function local(){try{const d=JSON.parse(localStorage.getItem(key)||'{}');return d&&d.maps&&typeof d.maps==='object'&&!Array.isArray(d.maps)?d:{maps:{}}}catch{return {maps:{}}}}
  function read(){const d=local();for(const id of Object.keys(maps)){const existing=d.maps[id]||{};const byId=new Map(seed.filter(r=>r.map===id).map(r=>[r.id,r]));for(const r of rows(existing.lineups))byId.set(r.id,r);d.maps[id]={...existing,radar:id==='cache'?image(existing.radar):id==='train'?'/static/radars/de_train_radar_psd.png':'/static/radars/'+id+'radar.png',lineups:[...byId.values()]};}return d;}
  function save(map,item){if(!Object.hasOwn(maps,map)||!valid(item))throw Error('Geçersiz atış');const d=local();d.maps[map]??={lineups:[]};const saved=rows(d.maps[map].lineups);d.maps[map].lineups=[item,...saved.filter(r=>r.id!==item.id)];localStorage.setItem(key,JSON.stringify(d));window.dispatchEvent(new Event('clone:lineups:changed'));}
  function clusters(rows){const groups=[];for(const r of rows){let g=groups.find(g=>g.type===r.type&&Math.hypot(g.x-r.x,g.y-r.y)<4);if(!g){g={x:r.x,y:r.y,type:r.type,items:[]};groups.push(g)}g.items.push(r)}return groups;}
  const paths={smoke:'M7 7h10v14H7z M9 3h6v4 M15 3h4v4',flash:'M13 2 5 13h6l-1 9 9-13h-6z',molotov:'M10 2h4v7l4 7v6H6v-6l4-7z M8 16h8'};
  const icon=type=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="'+(paths[type]||paths.smoke)+'"/></svg>';
  window.LineupCatalog={maps,esc,image,read,save,clusters,icon,ready:fetch('/static/lineup-seed.json').then(r=>{if(!r.ok)throw Error('Katalog yüklenemedi');return r.json()}).then(rows=>{seed=Array.isArray(rows)?rows.filter(valid):[];window.dispatchEvent(new Event('clone:lineups:changed'))}).catch(e=>{window.LineupCatalog.error=e.message;window.dispatchEvent(new Event('clone:lineups:changed'))})};
})();
