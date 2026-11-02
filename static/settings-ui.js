(() => {
  const host=document.getElementById('settingsContent');
  const overview=document.getElementById('settingsOverview');
  const saved=document.getElementById('settingsSaved');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const account=()=>window.activeAccountData||{};
  const savedNades=()=>{try{const data=JSON.parse(localStorage.getItem('clonecs-nade-favorites')||'[]');return Array.isArray(data)?data:[]}catch{return []}};
  function jump(tab,detail){
    window.selectMainTab?.(tab);
    if(detail==='saved-nades')window.dispatchEvent(new CustomEvent('clone:nades:saved'));
    if(detail==='configs')setTimeout(()=>{window.setConfigView?.('favorites');window.renderFavoriteConfigs?.();},0);
  }
  function renderPlayerCenter(view='home'){
    const data=account(), configs=window.getFavoriteConfigs?.()||[], servers=window.getSavedServers?.()||[], nades=savedNades();
    document.getElementById('settingsSteamCopy').textContent=data.steam_id?`Bağlı · ${data.steam_persona_name||data.steam_id}`:'Steam hesabını bağlayarak CS2 verilerini eşleştir.';
    overview.innerHTML=`<article class="settings-player-card"><span class="settings-player-initials">${esc((data.username||'CL').slice(0,2).toUpperCase())}</span><div><small>CLONE LAB ÜYESİ</small><h2>${esc(data.username||'Oyuncu')}</h2><p>${data.faceit_nickname?`FACEIT · ${esc(data.faceit_nickname)}`:'FACEIT profilin henüz bağlı değil'}</p></div><button data-center="connections" class="secondary">Bağlantıları düzenle</button></article>`;
    saved.innerHTML=[
      {kind:'lineups',count:nades.length,title:'Lineups',copy:'Kaydettiğin smoke, flash ve molotoflar',action:'saved-nades'},
      {kind:'configs',count:configs.length,title:'Pro configler',copy:'Favori oyuncu ayarların',action:'configs'},
      {kind:'servers',count:servers.length,title:'Sunucular',copy:'Kayıtlı oyun sunucuların',action:'servers'}
    ].map(card=>`<article class="saved-card"><span class="saved-card-count">${card.count}</span><div><small>${card.kind.toUpperCase()}</small><h3>${card.title}</h3><p>${card.copy}</p></div><button data-center="${card.action}" class="saved-card-link">Aç</button></article>`).join('');
    if(view==='saved')saved.scrollIntoView({block:'start',behavior:'smooth'});
    if(view==='connections')host.querySelector('.settings-section')?.scrollIntoView({block:'start',behavior:'smooth'});
  }
  host.addEventListener('click',event=>{
    const connect=event.target.closest('[data-connect]');if(connect){location.href='steam://connect/'+connect.dataset.connect;return;}
    const button=event.target.closest('[data-center]');if(!button)return;
    const action=button.dataset.center;
    if(action==='saved-nades')jump('lineups','saved-nades');
    else if(action==='configs')jump('configs','configs');
    else if(action==='servers'){const entries=window.getSavedServers?.()||[];const list=entries.length?entries.map(item=>`<button class="saved-server" data-connect="${esc(item.address)}">${esc(item.mode)} <b>${esc(item.address)}</b></button>`).join(''):'<p class="settings-empty">Henüz sunucu kaydetmedin. Ana sayfadaki Server Browser’dan adresi ekleyebilirsin.</p>';saved.innerHTML=`<article class="settings-saved-detail"><div class="eyebrow">SAVED SERVERS</div><h3>Kaydedilen sunucular</h3>${list}</article>`;}
    else if(action==='connections')host.querySelector('.settings-section')?.scrollIntoView({block:'start',behavior:'smooth'});
  });
  document.getElementById('settingsRefreshSaved').addEventListener('click',()=>renderPlayerCenter('saved'));
  window.renderPlayerCenter=renderPlayerCenter;
  window.getSavedServers=window.getSavedServers||(()=>{try{return JSON.parse(localStorage.getItem(`clone_lab_servers_${(document.getElementById('profileMenuAccount')?.textContent||'guest').toLowerCase().replace(/\s+/g,'_')}`)||'[]')}catch{return []}});
  renderPlayerCenter();
})();
