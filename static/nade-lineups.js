(() => {
const C=window.LineupCatalog,esc=C.esc,host=document.getElementById('lineupsTab');
let map='mirage',type='all',team='all',floor='upper',active=null,selected=[],query='',savedOnly=false,photosOnly=false,zoom=1;
let favorites;try{favorites=JSON.parse(localStorage.getItem('clonecs-nade-favorites')||'[]');if(!Array.isArray(favorites))favorites=[]}catch{favorites=[]}
const types={smoke:'Smoke',flash:'Flash',molotov:'Molotof',he:'HE'};
const multiFloor=()=>['vertigo','nuke','train'].includes(map),floorName=f=>f==='lower'?'Alt kat':'Üst kat';
host.innerHTML='<div class="nade-atlas"><header class="nade-atlas-head"><div><div class="eyebrow">UTILITY ATLAS</div><h1>Nade <span class="accent">Lineups</span></h1><p>Tarafını seç. Başlangıcı ve hedefi haritada bul, atış talimatını incele.</p></div></header><div class="atlas-controls"><label class="atlas-map-picker" for="atlasMapSelect">Harita<select id="atlasMapSelect">'+Object.entries(C.maps).map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('')+'</select></label></div><div class="atlas-toolbar"><div id="typeFilters"></div><input id="nadeSearch" type="search" placeholder="Atış ara: window, CT, market…" aria-label="Atış ara"><button id="savedFilter" aria-pressed="false">Kaydettiklerim</button></div><div class="atlas-layout"><section class="atlas-map-wrap"><div class="atlas-map-heading"><h2 id="radarName"></h2><div class="radar-zoom"><button data-zoom="-1" aria-label="Uzaklaştır">−</button><button data-zoom="0" aria-label="Yakınlaştırmayı sıfırla">1×</button><button data-zoom="1" aria-label="Yakınlaştır">+</button></div></div><div id="radarViewport" class="radar-viewport"><div id="radarSurface" class="radar-surface"></div></div><p class="radar-hint">Simge: başlangıç · Halka: hedef bölgesi · Çizgi: bağlantı, uçuş yörüngesi değil</p><div id="nadeList" class="nade-list"></div></section><aside id="nadeCards" class="atlas-detail"></aside></div><p class="atlas-disclaimer">Topluluk arşivi · Kaynak kayıtları 2024 tarihli; güncel oyunda test edilmedi. Radar hedefleri yaklaşık bölgeyi gösterir. Kesin duruş ve nişan için fotoğrafları kullan.</p></div><dialog id="nadeLightbox"><button id="closeNadeImage" aria-label="Fotoğrafı kapat">Kapat ×</button><img alt="Lineup ayrıntısı"><p></p></dialog>';
const $=s=>host.querySelector(s);
$('#typeFilters').insertAdjacentHTML('beforebegin','<div id="teamFilters" class="atlas-filters" role="group" aria-label="Oynadığın taraf"></div>');
$('#savedFilter').insertAdjacentHTML('afterend','<button id="photoFilter" aria-pressed="false">Fotoğraflı</button>');
const more=document.createElement('details');more.className='atlas-more';more.innerHTML='<summary>Arama ve kayıtlar</summary><div class="atlas-more-controls"></div>';$('.atlas-toolbar').append(more);more.lastElementChild.append($('#nadeSearch'),$('#savedFilter'),$('#photoFilter'));
$('#radarViewport').insertAdjacentHTML('beforebegin','<div id="floorFilters" class="atlas-filters" role="group" aria-label="Radar katı"></div>');
$('.atlas-disclaimer').textContent='Kaynaklı topluluk arşivi. Oyun güncellemeleri atışları etkileyebilir; rekabetçi maçtan önce antrenmanda dene. Çizgi başlangıç ve hedefi bağlar, uçuş yörüngesi değildir.';
function photo(src,label){const safe=C.image(src);return safe?'<figure><button class="lineup-photo" data-photo="'+esc(safe)+'" data-label="'+label+'" aria-label="'+label+' fotoğrafını büyüt"><img loading="lazy" src="'+esc(safe)+'" alt="'+label+'"></button><figcaption>'+label+'</figcaption></figure>':''}

function sourceLink(r){if(r.source==='CLONE LAB')return 'CLONE LAB';const url=typeof r.sourceUrl==='string'&&r.sourceUrl.startsWith('https://github.com/')?r.sourceUrl:'https://github.com/shimupan/lineupx';return '<a href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(r.source||'LineupX')+'</a>'}
function route(r){
 if(!r)return '';
 const start=!multiFloor()||r.startFloor===floor,end=!multiFloor()||r.targetFloor===floor;
 return '<svg class="radar-route '+r.type+'" viewBox="0 0 100 100">'+(start&&end?'<path d="M'+r.x+' '+r.y+' L'+r.tx+' '+r.ty+'"/>':'')+(end?'<circle cx="'+r.tx+'" cy="'+r.ty+'" r="2.2"/>':'')+(start?'<circle class="exact-start" cx="'+r.x+'" cy="'+r.y+'" r=".65"/>':'')+'</svg>';
}
function details(r){
 const video=typeof r.video==='string'&&/^\/api\/lineup-videos\/[a-f0-9]{32}$/.test(r.video)?'<video class="lineup-video" controls playsinline preload="metadata" src="'+esc(r.video)+'"></video>':'';
 if(video)return (r.from?'<p>'+esc(r.from)+'</p>':'')+video+(r.aim?'<p>'+esc(r.aim)+'</p>':'');
 if(r.coordinateSpace==='manual')return '<p>'+esc(r.from||'')+'</p><p>'+esc(r.aim||'')+'</p>';
 const hasPhotos=C.image(r.standImage)&&C.image(r.aimImage);
 const command=r.worldStart&&r.viewAngles?'setpos_exact '+r.worldStart.join(' ')+'; setang '+r.viewAngles.join(' '):'';
 return (multiFloor()?'<div class="floor-route"><button data-floor="'+r.startFloor+'">Başlangıç · '+floorName(r.startFloor)+'</button><button data-floor="'+r.targetFloor+'">Hedef · '+floorName(r.targetFloor)+'</button></div>':'')+
 (r.from?'<div class="throw-instruction"><small>1 · DURUŞ</small><p>'+esc(r.from)+'</p></div>':'')+
 (!hasPhotos?'<p class="lineup-media-note">Bu kayıtta fotoğraf yok. Konum ve nişan açıları kaynak rehberden alınmıştır.</p>':'')+
 (command?'<details class="lineup-practice"><summary>Antrenmanda konuma git</summary><p>Yerel antrenmanda <code>sv_cheats 1</code> açtıktan sonra konsola yapıştır. Hareketli atışlarda kaynak talimatındaki adımları da uygula.</p><code>'+esc(command)+'</code><button data-command="'+esc(command)+'">Komutu kopyala</button><span id="copyStatus" role="status"></span></details>':'')+
 (r.workshopId&&/^\d+$/.test(r.workshopId)?'<a class="lineup-workshop" href="https://steamcommunity.com/sharedfiles/filedetails/?id='+r.workshopId+'" target="_blank" rel="noopener">Oyun içi rehberi aç ↗</a>':'')+
 '<p class="lineup-media-note">'+(r.coordinateSpace==='world'?'Noktalar oyun koordinatlarından hesaplandı.':'2024 fotoğraf arşivi · Noktalar yaklaşık.')+' Güncel oyunda tekrar test edilmedi.</p>';
}

function render(){
const data=C.read().maps[map],all=data.lineups,rows=C.filterRows(all,{type,team,query,savedOnly,favorites,photosOnly}),groups=C.clusters(rows.filter(r=>!multiFloor()||r.startFloor===floor));
if(!rows.some(r=>r.id===active))active=null;
selected=selected.filter(id=>rows.some(r=>r.id===id));
const chosen=rows.find(r=>r.id===active);
$('#teamFilters').innerHTML=[['all','İki taraf'],['T','T · Hücum'],['CT','CT · Savunma']].map(([id,label])=>'<button data-team="'+id+'" aria-pressed="'+(team===id)+'">'+label+' <small>'+C.filterRows(all,{team:id}).length+'</small></button>').join('');
$('#floorFilters').innerHTML=multiFloor()?['upper','lower'].map(f=>'<button data-floor="'+f+'" aria-pressed="'+(floor===f)+'">'+floorName(f)+'</button>').join(''):'';
data.radar='/static/radars/de_'+map+(multiFloor()&&floor==='lower'?'_lower':'')+'_radar_psd.png';
$('#radarName').textContent=C.maps[map]+' · '+rows.length+' atış';
$('#atlasMapSelect').value=map;
$('#typeFilters').innerHTML=[['all','Tümü'],...Object.entries(types)].map(([id,label])=>'<button data-type="'+id+'" aria-pressed="'+(type===id)+'">'+(id==='all'?'':C.icon(id))+label+' <small>'+C.filterRows(all,{team,type:id,query,savedOnly,favorites,photosOnly}).length+'</small></button>').join('');
$('#radarSurface').style.width=(zoom*100)+'%';
$('#radarSurface').innerHTML=data.radar?'<img draggable="false" src="'+esc(C.image(data.radar))+'" alt="'+esc(C.maps[map])+' radar">'+route(chosen)+groups.map((g,i)=>'<button class="radar-pin '+g.type+(g.items.some(r=>r.id===active)?' is-selected':'')+'" style="left:'+g.x+'%;top:'+g.y+'%" data-group="'+i+'" title="'+esc(g.items.map(r=>r.title).join(' / '))+'" aria-label="'+(types[g.type]||'Farklı bombalar')+': '+esc(g.items.map(r=>r.title).join(', '))+'" aria-pressed="'+g.items.some(r=>r.id===active)+'">'+C.icon(g.type)+(g.items.length>1?'<b>'+g.items.length+'</b>':'')+'</button>').join(''):'<p>Bu haritanın radarı henüz eklenmedi.</p>';
$('#nadeList').hidden=!query.trim();
$('#nadeList').innerHTML=rows.slice(0,30).map(r=>'<button data-active="'+r.id+'" class="'+r.type+'" aria-pressed="'+(r.id===active)+'">'+C.icon(r.type)+'<span>'+esc(r.title)+'</span></button>').join('');
const group=rows.filter(r=>selected.includes(r.id));
$('#nadeCards').classList.toggle('has-selection',Boolean(chosen));
$('#nadeCards').innerHTML=chosen?'<button class="secondary" data-close-detail>← Haritaya dön</button>'+'<div class="detail-type '+chosen.type+'">'+C.icon(chosen.type)+types[chosen.type]+' · '+esc(chosen.team||'')+'</div><h2>'+esc(chosen.title)+'</h2><button data-favorite="'+chosen.id+'" aria-pressed="'+favorites.includes(chosen.id)+'">'+(favorites.includes(chosen.id)?'Kaydedildi':'Kaydet')+'</button>'+(group.length>1?'<div class="group-choices"><p>Bu bölgede '+group.length+' atış</p>'+group.map(r=>'<button data-active="'+r.id+'" aria-pressed="'+(r.id===active)+'">'+C.icon(r.type)+esc(r.title)+'</button>').join('')+'</div>':'')+details(chosen)+'<div class="lineup-gallery">'+photo(chosen.video?'':chosen.standImage,'1 · Nerede dur')+photo(chosen.video?'':chosen.aimImage,'2 · Nereye nişan al')+'</div><div class="throw-instruction"><small>3 · NASIL ATILIR</small><p>'+esc(chosen.throwType)+'</p></div><div class="lineup-gallery">'+photo(chosen.video?'':chosen.landingImage,'Sonuç · Hedef bölgesi')+'</div><p class="lineup-credit">Kayıt: '+esc(chosen.author)+' · '+sourceLink(chosen)+'</p>':'<div class="atlas-empty"><div class="eyebrow">HARİTADAN KEŞFET</div><h2>'+(rows.length?'Bir atış seç':'Atış bulunamadı')+'</h2><p>'+(C.error?esc(C.error):rows.length?'Haritadaki simgeye dokun. Aynı bölgedeki atışları sayı rozetiyle görebilirsin.':'Bu filtreye uygun kayıt yok. Başka harita veya bomba türü seç.')+'</p></div>';
host.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{selected=groups[+b.dataset.group].items.map(r=>r.id);active=selected[0];render();revealDetail()});
}
function revealDetail(){if(matchMedia('(max-width:850px)').matches)$('#nadeCards').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
$('#atlasMapSelect').onchange=e=>{map=e.target.value;selected=[];active=null;floor=map==='train'?'lower':'upper';zoom=1;$('#radarViewport').scrollTo(0,0);render()};
host.onclick=async e=>{
const b=e.target.closest('button');if(!b)return;
if(b.hasAttribute('data-close-detail')){active=null;selected=[];render();$('#radarViewport').scrollIntoView({block:'center'});return}
if(b.dataset.map){map=b.dataset.map;selected=[];active=null;floor=map==='train'?'lower':'upper';zoom=1;$('#radarViewport').scrollTo(0,0);render()}
if(b.dataset.type){type=b.dataset.type;selected=[];active=null;render()}
if(b.dataset.team){team=b.dataset.team;selected=[];active=null;render()}
if(b.dataset.floor){floor=b.dataset.floor;render()}
if(b.dataset.active){active=b.dataset.active;floor=C.read().maps[map].lineups.find(r=>r.id===active)?.startFloor||'upper';if(!selected.includes(active))selected=[active];render()}
if(b.dataset.zoom!==undefined){zoom=b.dataset.zoom==='0'?1:Math.min(3,Math.max(1,zoom+Number(b.dataset.zoom)*.5));render()}
if(b.dataset.favorite){const id=b.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(v=>v!==id):[...favorites,id];try{localStorage.setItem('clonecs-nade-favorites',JSON.stringify(favorites))}catch{}render()}
if(b.dataset.command){try{await navigator.clipboard.writeText(b.dataset.command);$('#copyStatus').textContent='Kopyalandı'}catch{$('#copyStatus').textContent='Komutu yukarıdan seçip kopyalayabilirsin.'}}
if(b.dataset.photo){$('#nadeLightbox img').src=b.dataset.photo;$('#nadeLightbox p').textContent=b.dataset.label;$('#nadeLightbox').showModal()}
};
$('#closeNadeImage').onclick=()=>$('#nadeLightbox').close();
$('#nadeLightbox').onclick=e=>{if(e.target===$('#nadeLightbox'))$('#nadeLightbox').close()};
$('#nadeSearch').oninput=e=>{query=e.target.value;render()};
$('#photoFilter').onclick=()=>{photosOnly=!photosOnly;$('#photoFilter').setAttribute('aria-pressed',String(photosOnly));render()};
$('#savedFilter').onclick=()=>{savedOnly=!savedOnly;$('#savedFilter').setAttribute('aria-pressed',String(savedOnly));render()};
window.addEventListener('clone:nades:open',e=>{const d=e.detail||{};if(!Object.hasOwn(C.maps,d.map))return;map=d.map;type='all';team='all';query='';savedOnly=false;photosOnly=false;$('#nadeSearch').value='';$('#savedFilter').setAttribute('aria-pressed','false');$('#photoFilter').setAttribute('aria-pressed','false');const r=C.read().maps[map].lineups.find(r=>r.id===d.id);active=r?.id||null;selected=active?[active]:[];floor=r?.startFloor||'upper';render()});
window.addEventListener('clone:nades:saved',()=>{savedOnly=true;query='';type='all';team='all';photosOnly=false;$('#photoFilter').setAttribute('aria-pressed','false');$('#nadeSearch').value='';$('#savedFilter').setAttribute('aria-pressed','true');const first=Object.entries(C.read().maps).find(([,m])=>m.lineups.some(r=>favorites.includes(r.id)));if(first)map=first[0];render()});
window.addEventListener('clone:lineups:changed',render);render();
})();
