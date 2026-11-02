// Original schematic maps. No third-party footage or map imagery is embedded.
(() => {
  const host=document.getElementById('lineupsTab');
  const maps={mirage:'Mirage',dust2:'Dust II',ancient:'Ancient'};
  const types={smoke:'Smoke',flash:'Flash',molotov:'Molotof'};
  const rows=[
    ['mirage-window','mirage','smoke','Mid Window','T spawn / ticket arch','Pencerenin üst çerçevesi','W + zıpla + sol tık',18,77,50,34],
    ['mirage-connector','mirage','smoke','Connector','Top mid / sağ duvar','Connector üst köşesi','Ayakta sol tık',38,58,61,42],
    ['mirage-market','mirage','smoke','Market Window','B apartments / çıkış','Market penceresinin üstü','Zıpla + sol tık',20,29,37,24],
    ['mirage-shortflash','mirage','flash','Short Flash','Top mid / kutu yanı','Short üst boşluğu','Koşarak sol tık',40,62,58,49],
    ['mirage-under','mirage','molotov','Under Palace','A ramp / giriş','Under Palace içi','Ayakta sol tık',74,78,70,58],
    ['dust2-cross','dust2','smoke','A Cross','Long / kapı çıkışı','A site üzerindeki gökyüzü','Zıpla + sol tık',19,30,68,55],
    ['dust2-midb','dust2','smoke','Mid → B','T mid / kapı önü','B tünel ağzı','Ayakta sol tık',50,77,38,37],
    ['dust2-cat','dust2','flash','Cat Flash','Lower tunnel / çıkış','Short üst çizgisi','Koşarak sol tık',40,60,55,43],
    ['dust2-backb','dust2','molotov','Back B','Upper tunnel / kutu','Back site köşesi','Ayakta sol tık',29,48,25,29],
    ['ancient-donut','ancient','smoke','Donut','T spawn / taş köşe','Donut üst silüeti','Zıpla + sol tık',25,81,54,34],
    ['ancient-red','ancient','smoke','Red Room','T spawn / sol blok','Red Room girişi','Ayakta sol tık',20,76,38,44],
    ['ancient-midflash','ancient','flash','Mid Flash','T mid / sütun','Mid üst açıklığı','Koşarak sol tık',45,66,49,43],
    ['ancient-cubby','ancient','molotov','Mid Cubby','T mid / sağ duvar','Cubby iç köşesi','Ayakta sol tık',47,70,61,46]
  ].map(([id,map,type,name,from,aim,throwType,ax,ay,bx,by])=>({id,map,type,name,from,aim,throwType,ax,ay,bx,by}));
  const icon={smoke:'●',flash:'✦',molotov:'▲'},state={map:'mirage',type:'all',saved:false,active:'mirage-window'};
  let saved=new Set();try{const stored=JSON.parse(localStorage.getItem('clonecs-nade-favorites')||'[]');if(Array.isArray(stored))saved=new Set(stored)}catch{}
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const mapShape=map=>map==='mirage'?'<path d="M12 25 30 10h32l10 12h17v22l-13 9v31l-19 8-13-11-22 7-17-9V53L12 45z"/><path d="M36 13v35h30V13M20 53h29v32M61 53h25v28"/>':map==='dust2'?'<path d="M13 26 32 12h23v15h28l9 17-13 13v32l-20 5-11-13-21 10-16-14 11-20-9-16z"/><path d="M31 12v42h29M17 52h31v30M59 27v54"/>':'<path d="M14 26 30 11h22l14 13h22l6 22-12 14 2 29-22 6-13-13-24 10-15-16 13-18-7-14z"/><path d="M30 12v37h38M19 51h29v34M58 49h27v31"/>';
  host.innerHTML='<div class="nade-atlas"><header class="nade-atlas-head"><div><div class="eyebrow">UTILITY ATLAS // ORIGINAL SCHEMATIC</div><h1>Nade <span class="accent">Lineups</span></h1><p>Haritada atışı seç; nerede duracağını, nereye nişan alacağını ve nasıl atacağını tek panelde gör.</p></div><div class="nade-atlas-note">VİDEO YOK<br><b>13</b> BAŞLANGIÇ LINEUP</div></header><div class="atlas-controls"><div class="atlas-map-tabs" role="tablist" aria-label="Harita seçimi">'+Object.entries(maps).map(([id,name])=>'<button role="tab" data-map="'+id+'" aria-selected="'+(id==='mirage')+'">'+name+'</button>').join('')+'</div><div class="atlas-filters"><label>Bomba türü<select id="atlasType"><option value="all">Tümü</option>'+Object.entries(types).map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('')+'</select></label><button id="atlasSaved" aria-pressed="false">Kaydedilenler</button></div></div><div class="atlas-layout"><section class="atlas-map-wrap"><div class="atlas-map-label"><span id="atlasMapName">Mirage</span><small>ÜSTTEN GÖRÜNÜM · ŞEMATİK</small></div><svg id="atlasMap" class="atlas-map" viewBox="0 0 100 100" aria-label="Tıklanabilir harita"><g class="atlas-map-rooms"></g><g class="atlas-routes"></g><g class="atlas-pins"></g></svg><div class="atlas-legend"><span class="legend-smoke">● Smoke</span><span class="legend-flash">✦ Flash</span><span class="legend-molotov">▲ Molotof</span></div></section><aside id="atlasDetail" class="atlas-detail"></aside></div><p class="atlas-disclaimer">Bu bölüm üçüncü taraf video veya harita görseli kullanmaz. Şematik planlar öğrenme arayüzü içindir; her atışı özel antrenman sunucusunda doğrula.</p></div>';
  const mapSvg=host.querySelector('#atlasMap'),detail=host.querySelector('#atlasDetail');
  function list(){return rows.filter(item=>item.map===state.map&&(state.type==='all'||item.type===state.type)&&(!state.saved||saved.has(item.id)))}
  function render(){
    const items=list();if(!items.some(item=>item.id===state.active))state.active=items[0]?.id||'';
    host.querySelector('#atlasMapName').textContent=maps[state.map];
    mapSvg.querySelector('.atlas-map-rooms').innerHTML=mapShape(state.map);
    mapSvg.querySelector('.atlas-routes').innerHTML=items.map(item=>'<line class="route '+item.type+'" x1="'+item.ax+'" y1="'+item.ay+'" x2="'+item.bx+'" y2="'+item.by+'"/>').join('');
    mapSvg.querySelector('.atlas-pins').innerHTML=items.map(item=>'<g class="atlas-pin '+item.type+(item.id===state.active?' is-active':'')+'" data-lineup="'+item.id+'" role="button" tabindex="0" aria-label="'+esc(item.name)+' '+types[item.type]+'"><circle cx="'+item.bx+'" cy="'+item.by+'" r="3.8"/><text x="'+item.bx+'" y="'+(item.by+1.55)+'">'+icon[item.type]+'</text></g>').join('');
    const item=rows.find(row=>row.id===state.active);
    detail.innerHTML=item?'<div class="atlas-detail-head"><span class="type-badge '+item.type+'">'+icon[item.type]+' '+types[item.type]+'</span><button data-save="'+item.id+'" aria-pressed="'+saved.has(item.id)+'">'+(saved.has(item.id)?'Kaydedildi':'Kaydet')+'</button></div><h2>'+esc(item.name)+'</h2><div class="lineup-steps"><article><span>01</span><div><small>NEREDE DUR</small><b>'+esc(item.from)+'</b></div></article><article><span>02</span><div><small>NEREYE NİŞAN AL</small><b>'+esc(item.aim)+'</b></div></article><article><span>03</span><div><small>NASIL AT</small><b>'+esc(item.throwType)+'</b></div></article></div><div class="atlas-detail-foot"><span>BAŞLANGIÇ</span><span>→</span><span>HEDEF</span></div>':'<div class="atlas-empty"><h2>Bu filtrede atış yok.</h2><p>Başka bir bomba türü seç veya kaydedilen filtresini kapat.</p></div>';
  }
  host.addEventListener('click',event=>{const map=event.target.closest('[data-map]');if(map){state.map=map.dataset.map;state.saved=false;host.querySelector('#atlasSaved').setAttribute('aria-pressed','false');host.querySelectorAll('[data-map]').forEach(button=>button.setAttribute('aria-selected',String(button===map)));render();return}const pin=event.target.closest('[data-lineup]');if(pin){state.active=pin.dataset.lineup;render();return}const button=event.target.closest('[data-save]');if(button){const id=button.dataset.save;saved.has(id)?saved.delete(id):saved.add(id);try{localStorage.setItem('clonecs-nade-favorites',JSON.stringify([...saved]))}catch{}render()}});
  host.addEventListener('keydown',event=>{const pin=event.target.closest('[data-lineup]');if(pin&&(event.key==='Enter'||event.key===' ')){event.preventDefault();state.active=pin.dataset.lineup;render();}});
  host.querySelector('#atlasType').addEventListener('change',event=>{state.type=event.target.value;render()});
  host.querySelector('#atlasSaved').addEventListener('click',event=>{state.saved=!state.saved;event.currentTarget.setAttribute('aria-pressed',String(state.saved));render()});
  window.addEventListener('clone:nades:saved',()=>{state.saved=true;host.querySelector('#atlasSaved').setAttribute('aria-pressed','true');render()});
  render();
})();
