(() => {
const C=window.LineupCatalog,esc=C.esc,host=document.getElementById('lineupsTab');
let map='mirage',type='all',active=null,selected=[],query='',savedOnly=false,zoom=1;
let favorites;try{favorites=JSON.parse(localStorage.getItem('clonecs-nade-favorites')||'[]');if(!Array.isArray(favorites))favorites=[]}catch{favorites=[]}
const types={smoke:'Smoke',flash:'Flash',molotov:'Molotof'};
host.innerHTML='<div class="nade-atlas"><header class="nade-atlas-head"><div><div class="eyebrow">UTILITY ATLAS</div><h1>Nade <span class="accent">Lineups</span></h1><p>Haritada başlangıcı seç. Duruşu, nişanı ve sonucu oyun içinden gör.</p></div></header><div class="atlas-controls"><div class="atlas-map-tabs">'+Object.entries(C.maps).map(([id,name])=>'<button data-map="'+id+'">'+name+'</button>').join('')+'</div></div><div class="atlas-toolbar"><div id="typeFilters"></div><input id="nadeSearch" type="search" placeholder="Atış ara: window, CT, market…" aria-label="Atış ara"><button id="savedFilter" aria-pressed="false">Kaydettiklerim</button></div><div class="atlas-layout"><section class="atlas-map-wrap"><div class="atlas-map-heading"><h2 id="radarName"></h2><div class="radar-zoom"><button data-zoom="-1" aria-label="Uzaklaştır">−</button><button data-zoom="0" aria-label="Yakınlaştırmayı sıfırla">1×</button><button data-zoom="1" aria-label="Yakınlaştır">+</button></div></div><div id="radarViewport" class="radar-viewport"><div id="radarSurface" class="radar-surface"></div></div><p class="radar-hint">Simge: başlangıç · Halka: hedef bölgesi · Çizgi: bağlantı, uçuş yörüngesi değil</p><div id="nadeList" class="nade-list"></div></section><aside id="nadeCards" class="atlas-detail"></aside></div><p class="atlas-disclaimer">Topluluk arşivi · Kaynak kayıtları 2024 tarihli; güncel oyunda test edilmedi. Radar hedefleri yaklaşık bölgeyi gösterir. Kesin duruş ve nişan için fotoğrafları kullan.</p></div><dialog id="nadeLightbox"><button id="closeNadeImage" aria-label="Fotoğrafı kapat">Kapat ×</button><img alt="Lineup ayrıntısı"><p></p></dialog>';
const $=s=>host.querySelector(s);
function photo(src,label){const safe=C.image(src);return safe?'<figure><button class="lineup-photo" data-photo="'+esc(safe)+'" data-label="'+label+'" aria-label="'+label+' fotoğrafını büyüt"><img loading="lazy" src="'+esc(safe)+'" alt="'+label+'"></button><figcaption>'+label+'</figcaption></figure>':''}
function render(){
const data=C.read().maps[map],all=data.lineups,rows=all.filter(r=>(type==='all'||r.type===type)&&(!savedOnly||favorites.includes(r.id))&&r.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())),groups=C.clusters(rows);
if(!rows.some(r=>r.id===active))active=null;
selected=selected.filter(id=>rows.some(r=>r.id===id));
const chosen=rows.find(r=>r.id===active);
$('#radarName').textContent=C.maps[map]+' · '+rows.length+' atış';
host.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.map===map)));
$('#typeFilters').innerHTML=[['all','Tümü'],...Object.entries(types)].map(([id,label])=>'<button data-type="'+id+'" aria-pressed="'+(type===id)+'">'+(id==='all'?'':C.icon(id))+label+' <small>'+all.filter(r=>id==='all'||r.type===id).length+'</small></button>').join('');
$('#radarSurface').style.width=(zoom*100)+'%';
$('#radarSurface').innerHTML=data.radar?'<img draggable="false" src="'+esc(C.image(data.radar))+'" alt="'+esc(C.maps[map])+' radar">'+(chosen?'<svg class="radar-route '+chosen.type+'" viewBox="0 0 100 100"><path d="M'+chosen.x+' '+chosen.y+' L'+chosen.tx+' '+chosen.ty+'"/><circle cx="'+chosen.tx+'" cy="'+chosen.ty+'" r="2.2"/><circle class="exact-start" cx="'+chosen.x+'" cy="'+chosen.y+'" r=".65"/></svg>':'')+groups.map((g,i)=>'<button class="radar-pin '+g.type+(g.items.some(r=>r.id===active)?' is-selected':'')+'" style="left:'+g.x+'%;top:'+g.y+'%" data-group="'+i+'" title="'+esc(g.items.map(r=>r.title).join(' / '))+'" aria-label="'+types[g.type]+': '+esc(g.items.map(r=>r.title).join(', '))+'" aria-pressed="'+g.items.some(r=>r.id===active)+'">'+C.icon(g.type)+(g.items.length>1?'<b>'+g.items.length+'</b>':'')+'</button>').join(''):'<p>Bu haritanın radarı henüz eklenmedi.</p>';
$('#nadeList').innerHTML=rows.map(r=>'<button data-active="'+r.id+'" class="'+r.type+'" aria-pressed="'+(r.id===active)+'">'+C.icon(r.type)+'<span>'+esc(r.title)+'</span></button>').join('');
const group=rows.filter(r=>selected.includes(r.id));
$('#nadeCards').innerHTML=chosen?'<div class="detail-type '+chosen.type+'">'+C.icon(chosen.type)+types[chosen.type]+' · '+esc(chosen.team||'')+'</div><h2>'+esc(chosen.title)+'</h2><button data-favorite="'+chosen.id+'" aria-pressed="'+favorites.includes(chosen.id)+'">'+(favorites.includes(chosen.id)?'Kaydedildi':'Kaydet')+'</button>'+(group.length>1?'<div class="group-choices"><p>Bu bölgede '+group.length+' atış</p>'+group.map(r=>'<button data-active="'+r.id+'" aria-pressed="'+(r.id===active)+'">'+esc(r.title)+'</button>').join('')+'</div>':'')+'<div class="lineup-gallery">'+photo(chosen.standImage,'1 · Nerede dur')+photo(chosen.aimImage,'2 · Nereye nişan al')+'</div><div class="throw-instruction"><small>3 · NASIL ATILIR</small><p>'+esc(chosen.throwType)+'</p></div><div class="lineup-gallery">'+photo(chosen.landingImage,'Sonuç · Hedef bölgesi')+'</div><p class="lineup-credit">Kayıt: '+esc(chosen.author)+' · <a href="https://github.com/shimupan/lineupx" target="_blank" rel="noopener">LineupX</a></p>':'<div class="atlas-empty"><div class="eyebrow">HARİTADAN KEŞFET</div><h2>'+(rows.length?'Bir atış seç':'Atış bulunamadı')+'</h2><p>'+(C.error?esc(C.error):rows.length?'Haritadaki simgeye ya da aşağıdaki atış adına tıkla. Aynı bölgedeki atışları sayı rozetiyle görebilirsin.':'Bu filtreye uygun kayıt yok. Başka harita veya bomba türü seç.')+'</p></div>';
host.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{selected=groups[+b.dataset.group].items.map(r=>r.id);active=selected[0];render()});
}
host.onclick=e=>{
const b=e.target.closest('button');if(!b)return;
if(b.dataset.map){map=b.dataset.map;selected=[];active=null;zoom=1;$('#radarViewport').scrollTo(0,0);render()}
if(b.dataset.type){type=b.dataset.type;selected=[];active=null;render()}
if(b.dataset.active){active=b.dataset.active;if(!selected.includes(active))selected=[active];render()}
if(b.dataset.zoom!==undefined){zoom=b.dataset.zoom==='0'?1:Math.min(3,Math.max(1,zoom+Number(b.dataset.zoom)*.5));render()}
if(b.dataset.favorite){const id=b.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(v=>v!==id):[...favorites,id];try{localStorage.setItem('clonecs-nade-favorites',JSON.stringify(favorites))}catch{}render()}
if(b.dataset.photo){$('#nadeLightbox img').src=b.dataset.photo;$('#nadeLightbox p').textContent=b.dataset.label;$('#nadeLightbox').showModal()}
};
$('#closeNadeImage').onclick=()=>$('#nadeLightbox').close();
$('#nadeLightbox').onclick=e=>{if(e.target===$('#nadeLightbox'))$('#nadeLightbox').close()};
$('#nadeSearch').oninput=e=>{query=e.target.value;render()};
$('#savedFilter').onclick=()=>{savedOnly=!savedOnly;$('#savedFilter').setAttribute('aria-pressed',String(savedOnly));render()};
window.addEventListener('clone:nades:saved',()=>{savedOnly=true;query='';type='all';$('#nadeSearch').value='';$('#savedFilter').setAttribute('aria-pressed','true');const first=Object.entries(C.read().maps).find(([,m])=>m.lineups.some(r=>favorites.includes(r.id)));if(first)map=first[0];render()});
window.addEventListener('clone:lineups:changed',render);render();
})();
