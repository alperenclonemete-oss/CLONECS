(() => {
  const host=document.getElementById('serversTab');
  if(!host)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const searchText=v=>String(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
  const valid=v=>typeof v==='string'&&/^(\d{1,3}\.){3}\d{1,3}:\d{1,5}$/.test(v)&&v.split(':')[0].split('.').every(n=>+n<=255)&&+v.split(':')[1]>0&&+v.split(':')[1]<=65535;
  const key=()=>`clone_lab_servers_${(window.activeAccountData?.username||'guest').toLowerCase().replace(/\s+/g,'_')}`;
  window.getSavedServers=()=>{try{const x=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(x)?x.filter(s=>s&&valid(s.address)):[]}catch{return []}};
  let data={servers:[],providers:[]}, loaded=0, busy=false, page=1;
  host.innerHTML=`<div class="server-shell"><header class="server-heading"><div><div class="eyebrow">COMMUNITY / CS2</div><h1>Sunucu <span class="accent">bul.</span></h1><p>Isın, antrenman yap, oyuna katıl. Sunucunu seç ve Steam üzerinden bağlan.</p></div><button id="serverRefresh" class="secondary">Listeyi yenile</button></header><div id="serverProviders" class="server-providers"></div><div class="server-filters"><label>Sunucu ara<input id="serverSearch" type="search" placeholder="İstanbul, Mirage, IP…"></label><label>Sağlayıcı<select id="serverProvider"><option value="">Tümü</option></select></label><label>Mod<select id="directoryMode"><option value="">Tüm modlar</option></select></label><label>Konum<select id="serverCity"><option value="">Tüm şehirler</option></select></label><label class="server-check"><input id="serverSaved" type="checkbox">Kaydettiklerim</label><label class="server-check"><input id="serverAvailable" type="checkbox">Boş yer var</label></div><p id="serverStatus" role="status" aria-live="polite"></p><div id="serverResults" class="server-results"></div><nav class="server-pages" aria-label="Sunucu sayfaları"><button id="serverPrev" class="secondary">Önceki</button><span id="serverPage"></span><button id="serverNext" class="secondary">Sonraki</button></nav><p class="server-footnote">Bağlan düğmesi Steam’i açar. Açılmazsa “Komutu kopyala” ile CS2 konsoluna yapıştır. Doluluk sağlayıcının bildirdiği değerdir; giriş sırasında değişebilir. Bazı sunucular Prime veya sağlayıcı üyeliği isteyebilir. Kaydettiklerin bu tarayıcıda tutulur.</p></div>`;
  const el=id=>document.getElementById(id);
  function render(){
    const saved=window.getSavedServers(), favorites=new Set(saved.map(s=>s.address));
    const q=searchText(el('serverSearch').value.trim());
    const source=el('serverSaved').checked?[...data.servers,...saved.filter(s=>!data.servers.some(r=>r.address===s.address)).map(s=>({...s,stale:true,players:null,capacity:null}))]:data.servers;
    const rows=source.filter(s=>(!el('serverSaved').checked||favorites.has(s.address))&&(!el('serverProvider').value||s.provider===el('serverProvider').value)&&(!el('directoryMode').value||s.mode===el('directoryMode').value)&&(!el('serverCity').value||s.city===el('serverCity').value)&&(!el('serverAvailable').checked||!s.stale&&s.capacity>0&&s.players!==null&&s.players<s.capacity)&&(!q||searchText([s.name,s.city,s.country,s.map,s.mode,s.address].join(' ')).includes(q)));
    const pages=Math.max(1,Math.ceil(rows.length/30));page=Math.min(page,pages);
    el('serverStatus').textContent=busy?'Sunucu listeleri yükleniyor…':`${rows.length} sunucu · ${data.providers.some(p=>p.status==='stale'||p.status==='unavailable')?'Bazı kaynaklar güncellenemedi.':'Sağlayıcı listeleri aşağıda.'}`;
    el('serverResults').innerHTML=rows.slice((page-1)*30,page*30).map(s=>`<article class="server-card"><div class="server-card-top"><span>${esc(data.providers.find(p=>p.id===s.provider)?.name||s.provider)}</span><button class="secondary server-save" data-save="${esc(s.address)}" aria-pressed="${favorites.has(s.address)}" aria-label="${esc(s.name)} ${favorites.has(s.address)?'kaydını kaldır':'kaydet'}">${favorites.has(s.address)?'Kaydedildi':'Kaydet'}</button></div><h2>${esc(s.name||s.address)}</h2><div class="server-tags"><b>${esc(s.mode)}</b><span>${esc(s.map||'Harita belirtilmedi')}</span></div><p>${esc(s.city)} · ${esc(String(s.country||'').toUpperCase())}</p><div class="server-occupancy">${s.stale?'Güncelliği doğrulanamadı':`${s.players??'—'} / ${s.capacity??'—'} oyuncu${s.bots?` · ${s.bots} bot`:''}`}</div><code>${esc(s.address)}</code><div class="server-actions"><a href="steam://connect/${esc(s.address)}" class="button-cta">Bağlan</a><button class="secondary" data-copy="${esc(s.address)}">Komutu kopyala</button></div></article>`).join('')||'<div class="server-empty">Bu filtrelerle sunucu bulunamadı. Filtreleri değiştir veya sağlayıcıların resmî listelerini aç.</div>';
    el('serverPage').textContent=`${page} / ${pages}`;el('serverPrev').disabled=page<=1;el('serverNext').disabled=page>=pages;
  }
  window.loadServerDirectory=async()=>{
    if(busy)return;if(Date.now()-loaded<90000){render();return;}
    busy=true;render();el('serverRefresh').disabled=true;
    try{
      const response=await fetch('/api/servers',{signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error();const next=await response.json();
      if(!Array.isArray(next.servers)||!Array.isArray(next.providers))throw Error();
      data={...next,servers:next.servers.filter(s=>valid(s.address))};loaded=Date.now();
      el('serverProviders').innerHTML=data.providers.map(p=>`<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer"><b>${esc(p.name)} ↗</b><span>${p.status==='directory'?'Resmî listeyi aç · IP aktarımı henüz bağlı değil':`${p.count} sunucu · ${p.status==='updated'?'Güncellendi':p.status==='stale'?'Son bilinen liste':'Kaynak erişilemiyor'}`}</span>${p.updatedAt?`<small>${esc(new Date(p.updatedAt*1000).toLocaleString('tr-TR'))}</small>`:''}</a>`).join('');
      for(const [id,field,label] of [['serverProvider','provider','Tümü'],['directoryMode','mode','Tüm modlar'],['serverCity','city','Tüm şehirler']]){
        const select=el(id),value=select.value;select.innerHTML=`<option value="">${label}</option>`+[...new Set(data.servers.map(s=>s[field]).filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">${esc(field==='provider'?data.providers.find(p=>p.id===v)?.name||v:v)}</option>`).join('');select.value=[...select.options].some(o=>o.value===value)?value:'';
      }
    }catch{data.servers=data.servers.map(s=>({...s,stale:true}));busy=false;render();el('serverStatus').textContent='Liste güncellenemedi. Biraz sonra yeniden dene. Önceki sonuçlar varsa güncel olmayabilir.';return;}
    finally{busy=false;el('serverRefresh').disabled=false;}
    render();
  };
  host.addEventListener('input',e=>{if(e.target.closest('.server-filters')){page=1;render();}});
  host.addEventListener('click',async e=>{
    const save=e.target.closest('[data-save]'),copy=e.target.closest('[data-copy]');
    if(save){const old=window.getSavedServers(),addr=save.dataset.save;const row=data.servers.find(s=>s.address===addr);const next=old.some(s=>s.address===addr)?old.filter(s=>s.address!==addr):row?[...old,row]:old;try{localStorage.setItem(key(),JSON.stringify(next));render();}catch{el('serverStatus').textContent='Tarayıcı kaydetmeye izin vermedi.';}}
    if(copy){try{await navigator.clipboard.writeText(`connect ${copy.dataset.copy}`);el('serverStatus').textContent='Bağlantı komutu kopyalandı.';}catch{el('serverStatus').textContent=`Kopyalanamadı. CS2 konsoluna yaz: connect ${copy.dataset.copy}`;}}
  });
  el('serverRefresh').onclick=()=>{loaded=0;window.loadServerDirectory();};
  el('serverPrev').onclick=()=>{page--;render();};el('serverNext').onclick=()=>{page++;render();};
  window.addEventListener('clone:servers:saved',()=>{el('serverSaved').checked=true;page=1;render();});
})();
