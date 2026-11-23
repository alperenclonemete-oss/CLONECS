(() => {
  const host=document.getElementById('settingsContent');
  const overview=document.getElementById('settingsOverview');
  const saved=document.getElementById('settingsSaved');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const account=()=>window.activeAccountData||{};
  const savedNades=()=>{try{const data=JSON.parse(localStorage.getItem('clonecs-nade-favorites')||'[]');return Array.isArray(data)?data:[]}catch{return []}};
  async function jump(tab,detail){
    await window.selectMainTab?.(tab);
    if(detail==='saved-nades')window.dispatchEvent(new CustomEvent('clone:nades:saved'));
    if(detail==='configs'){await window.refreshFavoriteConfigs?.();window.setConfigView?.('favorites');window.renderFavoriteConfigs?.()}
  }
  function renderPlayerCenter(view='home'){
    const data=account(), configs=window.getFavoriteConfigs?.()||[], servers=window.getSavedServers?.()||[], nades=savedNades();
    document.getElementById('settingsSteamCopy').textContent=data.steam_id?`Bağlı · ${data.steam_persona_name||data.steam_id}`:'Steam hesabını bağlayarak CS2 verilerini eşleştir.';
    document.getElementById('settingsFaceitCopy').textContent=data.faceit_nickname||'Profil bağlı değil.';
    overview.innerHTML=`<article class="settings-player-card"><span class="settings-player-initials">${esc((data.username||'CL').slice(0,2).toUpperCase())}</span><div><h2>${esc(data.username||'Oyuncu')}</h2><p>${data.steam_id?'Steam ile bağlı':'Clone Lab hesabı'}</p></div><button data-center="connections" class="secondary">Bağlantıları düzenle</button></article>`;
    saved.innerHTML=[
      {kind:'lineups',count:nades.length,title:'Lineups',copy:'Kaydettiğin smoke, flash ve molotoflar',action:'saved-nades'},
      {kind:'configs',count:configs.length,title:'Pro configler',copy:'Favori oyuncu ayarların',action:'configs'},
      {kind:'servers',count:servers.length,title:'Sunucular',copy:'Kayıtlı oyun sunucuların',action:'servers'}
    ].map(card=>`<article class="saved-card"><span class="saved-card-count">${card.count}</span><div><h3>${card.title}</h3><p>${card.copy}</p></div><button data-center="${card.action}" class="saved-card-link">Aç</button></article>`).join('');
    if(view==='saved')saved.scrollIntoView({block:'start',behavior:'smooth'});
    if(view==='connections')host.querySelector('.settings-section')?.scrollIntoView({block:'start',behavior:'smooth'});
  }
  host.addEventListener('click',event=>{
    const button=event.target.closest('[data-center]');if(!button)return;
    const action=button.dataset.center;
    if(action==='saved-nades')jump('lineups','saved-nades');
    else if(action==='configs')jump('configs','configs');
    else if(action==='servers'){jump('servers').then(()=>window.dispatchEvent(new CustomEvent('clone:servers:saved')))}
    else if(action==='connections')host.querySelector('.settings-section')?.scrollIntoView({block:'start',behavior:'smooth'});
  });
  document.getElementById('settingsRefreshSaved').addEventListener('click',()=>renderPlayerCenter('saved'));
  window.renderPlayerCenter=renderPlayerCenter;
  window.getSavedServers=window.getSavedServers||(()=>{try{return JSON.parse(localStorage.getItem(`clone_lab_servers_${(document.getElementById('profileMenuAccount')?.textContent||'guest').toLowerCase().replace(/\s+/g,'_')}`)||'[]')}catch{return []}});
  renderPlayerCenter();
})();
