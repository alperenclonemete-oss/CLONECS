// Steam matchmaking tracking. No Steam password or API key is requested here.
(() => {
  const host=document.getElementById('steamTab');
  const section=document.createElement('section');section.className='match-tracking';
  section.innerHTML=`<div class="eyebrow">MATCH INTELLIGENCE // VALVE MATCHMAKING</div><h2>Maçlarını otomatik analiz et</h2><p>Başlangıç maçını ve Steam maç geçmişi erişimini bir kez bağla. Yeni maçlar arka planda işlenir. Eski maçların tamamı geriye dönük getirilemez.</p><p><a href="https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128" target="_blank" rel="noopener noreferrer">Steam’den maç erişim kodlarını al ↗</a></p><form id="matchTrackingForm"><label>Maç geçmişi erişim kodu<input name="auth_code" type="password" autocomplete="off" placeholder="XXXX-XXXXX-XXXX" maxlength="32" required></label><label>Başlangıç maç paylaşım kodu<input name="share_code" autocomplete="off" placeholder="CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx" maxlength="64" required></label><button type="submit" class="button-cta">Otomatik takibi bağla</button></form><div class="tracking-actions"><button type="button" id="trackingRefresh">Durumu yenile</button><button type="button" id="trackingDisconnect" hidden>Takibi durdur</button></div><p id="trackingStatus" role="status" aria-live="polite"></p><div id="trackingMatches"></div>`;
  host.append(section);
  const stateNames={pending:'İşleyicinin ilk kontrolü bekleniyor',active:'Maç geçmişi takibi açık',error:'Bağlantı kontrolü gerekiyor',queued:'Analiz sırası bekleniyor',processing:'Demo işleniyor',retry:'Tekrar denenecek',failed:'Analiz tamamlanamadı'};
  let generation=0;
  function render(data){
    document.getElementById('trackingStatus').textContent=!data.configured?'Otomatik takip sunucusu henüz etkinleştirilmedi.':data.tracking?(stateNames[data.tracking.status]||'Bekleniyor')+(data.tracking.error?' · '+data.tracking.error:''):'Steam hesabın bağlı. Maç analizi için yukarıdaki kodları ekle.';
    document.querySelector('#matchTrackingForm button').disabled=!data.configured;
    document.getElementById('trackingDisconnect').hidden=!data.tracking;
    document.getElementById('trackingMatches').innerHTML=(data.matches||[]).map(item=>{
      const r=item.result;if(!r)return `<article class="steam-history-note"><b>${esc(stateNames[item.status]||item.status)}</b><p>${esc(item.error||'Yeni maçın sonucu işlem tamamlanınca burada görünecek.')}</p></article>`;
      return `<article class="steam-history-note"><h3>${esc(r.map||'Harita bilinmiyor')}</h3><div class="steam-metrics">${steamMetric('K / D / A',[r.kills,r.deaths,r.assists].map(v=>v??'—').join(' / '))}${steamMetric('K/D',r.kd)}${steamMetric('HS',r.hs_percent,'%')}${steamMetric('ADR',r.adr)}${steamMetric('Round',r.rounds)}</div><p>${esc(r.note)}</p><small>${esc(r.source)}</small></article>`;
    }).join('');
  }
  async function refresh(){const g=++generation;try{const data=await api('/api/cs2/tracking');if(g===generation&&!host.hidden)render(data)}catch(e){if(g===generation)document.getElementById('trackingStatus').textContent=e.message}}
  document.getElementById('matchTrackingForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector('button');button.disabled=true;const g=++generation;try{const data=await api('/api/cs2/tracking',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});form.reset();if(g===generation)render(data)}catch(error){document.getElementById('trackingStatus').textContent=error.message}finally{button.disabled=false}});
  document.getElementById('trackingRefresh').addEventListener('click',refresh);
  document.getElementById('trackingDisconnect').addEventListener('click',async()=>{try{await api('/api/cs2/tracking',{method:'DELETE'});await refresh()}catch(e){document.getElementById('trackingStatus').textContent=e.message}});
  new MutationObserver(()=>{if(!host.hidden)refresh();else{generation++;document.getElementById('trackingMatches').innerHTML='';document.getElementById('matchTrackingForm').reset()}}).observe(host,{attributes:true,attributeFilter:['hidden']});
  setInterval(()=>{if(!host.hidden&&!document.hidden)refresh()},30000);
  if(!host.hidden)refresh();
})();
