const $ = (id) => document.getElementById(id);
let activePlayerId=null;
let activeAccountData={};
let steamProfileLoaded=false;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path, options={}) {
  const r = await fetch(path, {headers:{'Content-Type':'application/json'}, ...options});
  const data = await r.json().catch(()=>({detail:'Sunucudan okunabilir yanıt alınamadı.'}));
  if(!r.ok) throw new Error(data.detail || `İstek başarısız (${r.status})`);
  return data;
}
function fmtDate(ts){ if(!ts) return 'Tarih bilinmiyor'; const n=Number(ts); const d=new Date(n < 1e12 ? n*1000 : n); return isNaN(d)?'Tarih bilinmiyor':d.toLocaleDateString('tr-TR'); }
function matchLabel(m){ return m.map || m.match_type || m.game_mode || 'FACEIT maçı'; }
function renderStatChart(points,label,suffix=''){
  const data=(points||[]).filter(p=>Number.isFinite(Number(p.value))).map(p=>({...p,value:Number(p.value)}));
  if(data.length<2)return `<div class="chart-empty"><b>${esc(label)}</b><span>Grafik için en az iki geçerli FACEIT maç verisi gerekli (${data.length} mevcut).</span></div>`;
  const w=680,h=190,pad=28,min=Math.min(...data.map(p=>p.value)),max=Math.max(...data.map(p=>p.value)),span=max-min||1;
  const coords=data.map((p,i)=>[pad+i*(w-pad*2)/(data.length-1),h-pad-(p.value-min)*(h-pad*2)/span]);
  const path=coords.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dots=coords.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.4"><title>${esc(data[i].finished_at?fmtDate(data[i].finished_at):`FACEIT kaydı ${i+1}`)}: ${data[i].value}${suffix}</title></circle>`).join('');
  return `<div class="chart-card"><div class="chart-head"><b>${esc(label)}</b><span>${min}${suffix} – ${max}${suffix} · ${data.length} maç</span></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)} maç grafiği"><line x1="${pad}" y1="${pad}" x2="${w-pad}" y2="${pad}"/><line x1="${pad}" y1="${h/2}" x2="${w-pad}" y2="${h/2}"/><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}"/><path class="chart-line" d="${path}"/>${dots}</svg><div class="chart-foot">Noktalar FACEIT’in döndürdüğü sıradadır. Üzerine gelerek değeri gör.</div></div>`;
}
function readStat(row,...keys){
  const values=new Map(Object.entries(row||{}).map(([k,v])=>[k.toLowerCase().trim(),v]));
  for(const key of keys){const value=values.get(key.toLowerCase());if(value!==undefined&&value!==null&&value!==''){const n=Number(String(value).replace('%','').replace(',','.'));if(Number.isFinite(n))return n;}}
  return null;
}
function makeWinTrend(matches){
  const ordered=(matches||[]).filter(m=>(m.won===true||m.won===false)&&m.finished_at).slice().sort((a,b)=>Number(a.finished_at)-Number(b.finished_at));
  return ordered.map((m,i)=>{const window=ordered.slice(Math.max(0,i-4),i+1);return {value:Math.round(window.filter(x=>x.won).length/window.length*100),finished_at:m.finished_at};});
}
function renderWinTrend(points){
  if(points.length<2)return '<div class="chart-empty"><b>Son maç sonuç grafiği</b><span>Grafik için FACEIT tarafından sonucu bilinen en az iki maç gerekli.</span></div>';
  const w=680,h=180,pad=28,coords=points.map((p,i)=>[pad+i*(w-pad*2)/(points.length-1),h-pad-p.value/100*(h-pad*2)]);
  const path=coords.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dots=coords.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.2"><title>${esc(fmtDate(points[i].finished_at))}: ${points[i].value}% hareketli galibiyet oranı</title></circle>`).join('');
  return `<div class="chart-card"><div class="chart-head"><b>Son maçların hareketli kazanma oranı</b><span>5 maçlık pencere · ${points.length} bilinen sonuç</span></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Son maçların kazanma oranı grafiği"><line x1="${pad}" y1="${pad}" x2="${w-pad}" y2="${pad}"/><line x1="${pad}" y1="${h/2}" x2="${w-pad}" y2="${h/2}"/><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}"/><path class="chart-line" d="${path}"/>${dots}</svg><div class="chart-foot">En eski maç solda, en yeni sağda. Bu grafik gerçek galibiyet oranını gösterir, ELO değişimini değil.</div></div>`;
}
function renderMapRadar(maps){
  if(maps.length<3)return `<div class="chart-empty"><b>Harita istatistikleri</b><span>Radar grafik için sonuç ve harita adı bilinen en az 3 farklı harita gerekli. Şu an ${maps.length} harita bulundu.</span></div>`;
  const w=680,h=370,cx=w/2,cy=185,r=118,n=maps.length,angle=i=>-Math.PI/2+i*2*Math.PI/n;
  const grid=[.25,.5,.75,1].map(scale=>`<polygon points="${maps.map((_,i)=>`${(cx+Math.cos(angle(i))*r*scale).toFixed(1)},${(cy+Math.sin(angle(i))*r*scale).toFixed(1)}`).join(' ')}"/>`).join('');
  const axes=maps.map((_,i)=>`<line x1="${cx}" y1="${cy}" x2="${(cx+Math.cos(angle(i))*r).toFixed(1)}" y2="${(cy+Math.sin(angle(i))*r).toFixed(1)}"/>`).join('');
  const winPoly=maps.map((m,i)=>`${(cx+Math.cos(angle(i))*r*m.rate/100).toFixed(1)},${(cy+Math.sin(angle(i))*r*m.rate/100).toFixed(1)}`).join(' ');
  const countMax=Math.max(...maps.map(m=>m.count));
  const countPoly=maps.map((m,i)=>`${(cx+Math.cos(angle(i))*r*m.count/countMax).toFixed(1)},${(cy+Math.sin(angle(i))*r*m.count/countMax).toFixed(1)}`).join(' ');
  const labels=maps.map((m,i)=>{const a=angle(i),x=cx+Math.cos(a)*(r+35),y=cy+Math.sin(a)*(r+24);return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${Math.cos(a)>.25?'start':Math.cos(a)<-.25?'end':'middle'}"><tspan class="radar-name" x="${x.toFixed(1)}">${esc(m.name.toUpperCase())}</tspan><tspan class="radar-meta" x="${x.toFixed(1)}" dy="15">${m.count} maç · %${m.rate.toFixed(1)}</tspan></text>`;}).join('');
  return `<div class="chart-card radar-card"><div class="chart-head"><b>Harita istatistikleri · son maçlar</b><span>${maps.reduce((a,m)=>a+m.count,0)} eşleşen maç</span></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Harita maç sayısı ve galibiyet oranı radar grafiği">${grid}${axes}<polygon class="radar-count" points="${countPoly}"/><polygon class="radar-win" points="${winPoly}"/>${labels}</svg><div class="radar-legend"><span><i class="legend-count"></i>Oynanan maç sayısı (ölçekli)</span><span><i class="legend-win"></i>Galibiyet oranı</span></div></div>`;
}
function buildDashboard(p,matches,recentStats){
  const recent=(matches||[]).slice(0,30),known=recent.filter(m=>m.won===true||m.won===false),wins=known.filter(m=>m.won===true).length,losses=known.length-wins,rate=known.length?wins/known.length*100:null;
  const sourceRows=(recentStats?.items||[]).slice(0,30).map(x=>x.stats||{});
  const mean=(...keys)=>{const vals=sourceRows.map(r=>readStat(r,...keys)).filter(v=>v!==null);return vals.length?vals.reduce((a,v)=>a+v,0)/vals.length:null;};
  const avg=(v,d=1)=>v===null?'—':Number(v).toFixed(d);
  const kills=mean('Kills','Total Kills'),deaths=mean('Deaths','Total Deaths'),assists=mean('Assists','Total Assists');
  const kd=mean('K/D Ratio','K/D','KD Ratio'),kr=mean('K/R Ratio','K/R','Kills per Round'),adr=mean('ADR','Average Damage per Round');
  const hsValues=sourceRows.map(row=>{const direct=readStat(row,'Headshots %','Headshot %','HS %','Headshot Percentage');if(direct!==null)return direct;const k=readStat(row,'Kills','Total Kills'),h=readStat(row,'Headshots','Headshot Kills','HS Kills');return k&&h!==null?h/k*100:null;}).filter(v=>v!==null);
  const hs=hsValues.length?hsValues.reduce((a,v)=>a+v,0)/hsValues.length:null;
  const kda=[kills,deaths,assists].every(v=>v!==null)?`${avg(kills,0)} / ${avg(deaths,0)} / ${avg(assists,0)}`:'—';
  const statMaps=new Map((recentStats?.items||[]).filter(x=>x.match_id&&x.map).map(x=>[String(x.match_id),x.map]));
  const mapBuckets=new Map();for(const m of (matches||[])){const name=String(m.map||statMaps.get(String(m.match_id))||'').trim();if(!name||(m.won!==true&&m.won!==false))continue;const key=name.toLowerCase();if(!mapBuckets.has(key))mapBuckets.set(key,{name,count:0,wins:0});const b=mapBuckets.get(key);b.count++;if(m.won)b.wins++;}  const mapData=[...mapBuckets.values()].sort((a,b)=>b.count-a.count).slice(0,8).map(m=>({...m,rate:m.wins/m.count*100}));
  const cards=[['K/D/A',kda],['K/D',avg(kd,2)],['K/R',avg(kr,2)],['HS%',hs===null?'—':`${avg(hs,1)}%`],['ADR',avg(adr,1)],['Kazanma oranı',rate===null?'—':`%${rate.toFixed(1)}`]];
  const trend=renderWinTrend(makeWinTrend(recent));
  return `<section class="card dashboard"><div class="season-head"><div><div class="eyebrow">FACEIT · CS2 · SON PERFORMANS</div><div class="season-title">Level ${esc(p.skill_level??'—')} <span>${esc(p.elo??'—')} ELO</span></div></div><div class="season-summary"><div><b>${known.length}</b><span>Sonucu bilinen maç</span></div><div><b class="positive">${wins}G</b><span>Galibiyet</span></div><div><b class="negative">${losses}M</b><span>Mağlubiyet</span></div><div><b>${rate===null?'—':`%${rate.toFixed(1)}`}</b><span>Kazanma oranı</span></div></div></div><div class="performance-head"><b>Son 30 maç performansı</b><span>İstatistik alınan ${sourceRows.length} maç · ${known.length} sonucu eşleşen maç</span></div><div class="dashboard-chart">${trend}</div><div class="dashboard-metrics">${cards.map(x=>`<div class="metric"><label>${esc(x[0])}</label><strong>${esc(x[1])}</strong></div>`).join('')}</div><p class="notice elo-note">Tarihsel ELO değişimi FACEIT Data API yanıtında bulunmadığı için burada güncel ELO ve gerçek maç sonuçlarından hesaplanan hareketli galibiyet oranı gösterilir.</p>${renderMapRadar(mapData)}</section>`;
}
function showProfile(p){
  $('profileWidgetName').textContent=p.nickname||$('profileWidgetName').textContent;
  $('profileMenuFaceit').textContent=p.nickname||'FACEIT profili bağlanmadı';
  if(p.avatar){$('profileWidgetAvatar').src=p.avatar;$('profileWidgetAvatar').hidden=false;$('profileWidgetInitials').hidden=true;}else{$('profileWidgetAvatar').hidden=true;$('profileWidgetInitials').hidden=false;}
  $('results').innerHTML = `
    <section class="card profile"><img class="avatar" src="${esc(p.avatar || '')}" onerror="this.style.visibility='hidden'" alt="${esc(p.nickname)} FACEIT profil fotoğrafı"><div style="flex:1;min-width:0"><div class="name">${esc(p.nickname)}</div><div class="muted" style="font-size:13px;margin-top:5px">${esc(p.country || 'Ülke bilgisi yok')} · FACEIT Level ${esc(p.skill_level ?? '—')}</div></div><div style="text-align:right"><div class="muted" style="font-size:12px">FACEIT ELO</div><strong style="font-size:25px;color:var(--accent)">${esc(p.elo ?? '—')}</strong><div style="margin-top:6px"><a href="${esc(p.faceit_url || '#')}" target="_blank" rel="noreferrer" style="color:var(--accent);font-size:12px">FACEIT profil ↗</a></div></div></section>
    <section class="metrics"><div class="metric"><label>FACEIT Level</label><strong>${esc(p.skill_level ?? '—')}</strong></div><div class="metric"><label>ELO</label><strong>${esc(p.elo ?? '—')}</strong></div><div class="metric"><label>Son maçlar</label><strong id="matchCount" class="skeleton skeleton-value" aria-label="Yükleniyor"></strong></div><div class="metric"><label>Analiz durumu</label><strong id="analysisState" class="skeleton skeleton-value" style="font-size:17px" aria-label="Yükleniyor"></strong></div></section>
    <section id="dashboardLoading" class="card dashboard loading-card" aria-label="Performans grafikleri yükleniyor"><div class="skeleton skeleton-heading"></div><div class="charts"><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i></div><i class="skeleton skeleton-row"></i></section>
    <section class="card section"><h2>Son maçlar</h2><div id="matches" class="skeleton-stack" aria-label="Maç geçmişi yükleniyor"><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i></div></section>
    <section class="card section"><h2>Koçluk notları</h2><div id="coach" class="skeleton-stack" aria-label="İstatistikler yükleniyor"><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i></div></section>`;
}
async function loadProfile(nickname){
  $('error').textContent=''; $('results').innerHTML='<section class="card loading-card" aria-label="FACEIT verisi yükleniyor"><div class="skeleton skeleton-heading"></div><div class="skeleton-stack"><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i></div></section>'; $('status').textContent='FACEIT profili aranıyor…';
  try {
    const p=await api(`/api/player?nickname=${encodeURIComponent(nickname)}`);
    if(!p.player_id) throw new Error('Oyuncu ID bilgisi alınamadı. FACEIT oyun profilini kontrol et.');
    activePlayerId=p.player_id;
    showProfile(p); $('status').textContent='Profil bulundu. Maç ve istatistik verileri yükleniyor…';
    const settled=await Promise.allSettled([api('/api/player/'+encodeURIComponent(p.player_id)+'/matches?limit=30'),api('/api/player/'+encodeURIComponent(p.player_id)+'/stats'),api('/api/player/'+encodeURIComponent(p.player_id)+'/match-stats?limit=100')]);
    const matchResult=settled[0], statsResult=settled[1], recentStatsResult=settled[2];
    let recentMatches=[]; let recentStats=null;
    if(recentStatsResult.status==='fulfilled') recentStats=recentStatsResult.value;
    if(matchResult.status==='fulfilled'){
      const items=matchResult.value.items||[]; $('matchCount').textContent=items.length; $('matchCount').classList.remove('skeleton','skeleton-value');
      recentMatches=items;
      const known=items.filter(m=>m.won===true||m.won===false); const wins=known.filter(m=>m.won===true).length;
      const summary=known.length ? '<p class="notice">Sonucu bilinen '+known.length+' maç: '+wins+' galibiyet, '+(known.length-wins)+' mağlubiyet (%'+Math.round(wins/known.length*100)+'). Bu oran yalnızca bu listedeki sonuçları kapsar.</p>' : '<p class="notice">FACEIT yanıtında kazanan takım güvenle eşleştirilemedi; galibiyet oranı hesaplanmadı.</p>';
      $('matches').innerHTML=(items.length?items.map(m=>'<div class="match"><div><strong>'+esc(matchLabel(m))+'</strong><div class="muted" style="margin-top:5px">'+esc(m.map ? 'Harita' : 'Maç türü')+' · '+esc(fmtDate(m.finished_at))+'</div><div class="muted" style="font-size:11px;margin-top:4px">'+(m.won===true?'Galibiyet':m.won===false?'Mağlubiyet':'Sonuç FACEIT yanıtında yok')+'</div></div><div style="text-align:right"><div>'+esc((m.results?.score && Object.values(m.results.score).join(' : ')) || 'Skor yok')+'</div>'+(m.faceit_url?'<a href="'+esc(m.faceit_url)+'" target="_blank" rel="noopener noreferrer" style="color:var(--accent);font-size:11px">FACEIT maç sayfası ↗</a>':'')+'<div style="margin-top:8px"><button type="button" class="secondary" data-match-detail="'+esc(m.match_id)+'" style="padding:7px 9px;font-size:11px">Detayları yükle</button></div></div><div class="match-detail" hidden style="flex:0 0 100%;margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:10px"></div></div>').join(''):'Maç geçmişi bulunamadı.')+summary; const matchRows=$('matches').querySelectorAll('.match'); matchRows.forEach((row,index)=>{row.hidden=index>=2;}); if(matchRows.length>2) $('matches').insertAdjacentHTML('beforeend','<button type="button" class="secondary" id="showMoreMatches" style="margin-top:12px;min-height:40px">Devamını göster</button>');    } else { $('matchCount').textContent='—'; $('matchCount').classList.remove('skeleton','skeleton-value'); $('matches').innerHTML=`<div class="error">${esc(matchResult.reason.message)}</div>`; }
    if(statsResult.status==='fulfilled'){
      const report=await api('/api/coach-report',{method:'POST',body:JSON.stringify({stats:statsResult.value,matches:recentMatches,recent_stats:recentStats})});
      const ms=report.metrics_detected;
      const metricBits=[['Win rate',ms.win_rate==null?'—':`${ms.win_rate}%`],['ADR',ms.adr==null?'—':ms.adr],['K/D',ms.kd==null?'—':ms.kd],['HS%',ms.headshot_pct==null?'—':`${ms.headshot_pct}%`]];
      $('coach').innerHTML=`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px">${metricBits.map(x=>`<div class="metric"><label>${esc(x[0])}</label><strong style="font-size:20px">${esc(x[1])}</strong></div>`).join('')}</div>${report.recommendations.map(r=>`<div class="recommendation"><span class="tag">${esc(r.priority)}</span><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p></div>`).join('')}<p class="notice" style="margin-top:12px">${esc(report.confidence_note)}</p>`;
    } else { $('coach').innerHTML=`<div class="error">İstatistikler alınamadı: ${esc(statsResult.reason.message)}. Maç geçmişi yine de görüntülenebilir.</div>`; }
    if(recentStats){
      const specs=[['Kills / maç','kills_per_match'],['Deaths / maç','deaths_per_match'],['Assists / maç','assists_per_match'],['Headshots / maç','headshots_per_match'],['K/D','kd'],['K/R','kr'],['ADR','adr'],['HS%','headshot_pct'],['MVP / maç','mvp_per_match']];
      const cards=specs.filter(x=>recentStats.metrics&&recentStats.metrics[x[1]]!==null&&recentStats.metrics[x[1]]!==undefined).map(x=>'<div class="metric"><label>'+esc(x[0])+'</label><strong>'+esc(x[1]==='headshot_pct'?String(recentStats.metrics[x[1]])+'%':recentStats.metrics[x[1]])+'</strong></div>').join('');
      const coverage=recentStats.field_coverage||{};
      const fieldSummary=recentStats.field_summary||{};
      const fields=(recentStats.fields||[]).map(f=>{const item=fieldSummary[f];return '<li>'+esc(f)+' · '+esc(coverage[f]||0)+'/'+esc(recentStats.count)+(item?' · ort. '+esc(item.average)+' · min '+esc(item.min)+' · max '+esc(item.max):'')+'</li>';}).join('');
      const lifetime=statsResult.status==='fulfilled'?(statsResult.value.lifetime||{}):{};
      const lifetimeFields=Object.entries(lifetime).map(entry=>'<li>'+esc(entry[0])+': '+esc(entry[1])+'</li>').join('');
      const source=recentStats.metric_sources?.headshot_pct||'FACEIT yanıtında bulunamadı';
      const chartsHtml='<div class="charts">'+renderStatChart(recentStats.series?.kd,'K/D trendi')+renderStatChart(recentStats.series?.hs_pct,'HS% trendi','%')+renderStatChart(recentStats.series?.adr,'ADR trendi')+'</div>';
    const panel='<section class="card faceit-match-stats" style="grid-column:1/-1;margin-bottom:14px"><div class="muted" style="font-size:11px;font-weight:800;letter-spacing:1px">SON '+esc(recentStats.count)+' MAÇ · FACEIT MAÇ İSTATİSTİKLERİ</div><div class="metrics" style="margin-top:12px">'+(cards||'<p class="notice">Bu yanıtla sayısal istatistik alınamadı.</p>')+'</div>'+chartsHtml+'<p class="notice" style="margin-top:12px">HS% kaynağı: '+esc(source)+'. Bu özet yalnızca FACEIT’in döndürdüğü maç kayıtlarını kapsar.</p><p class="notice">Tarihsel ELO puanları FACEIT Data API yanıtında bulunmadığında ELO grafiği çizilmez; yalnızca güncel ELO gösterilir.</p><details><summary>Maç başına FACEIT alanları ('+(recentStats.fields||[]).length+')</summary><ul style="columns:2;padding-left:20px;font-size:11px;color:var(--muted)">'+(fields||'<li>Alan adı dönmedi</li>')+'</ul></details><details style="margin-top:8px"><summary>Yaşam boyu FACEIT istatistikleri ('+Object.keys(lifetime).length+')</summary><ul style="columns:2;padding-left:20px;font-size:11px;color:var(--muted)">'+(lifetimeFields||'<li>Yaşam boyu alan dönmedi</li>')+'</ul></details></section>';
      $('results').insertAdjacentHTML('beforeend',panel);
    }else{
      $('coach').insertAdjacentHTML('afterbegin','<p class="error">Son maç istatistikleri FACEIT’ten alınamadı. Yaşam boyu istatistikler ve maç geçmişi ayrı olarak görüntüleniyor.</p>');
    }
    $('dashboardLoading')?.remove(); const metrics=$('results').querySelector('.metrics'); if(metrics)metrics.insertAdjacentHTML('afterend',buildDashboard(p,recentMatches,recentStats));else $('results').insertAdjacentHTML('afterbegin',buildDashboard(p,recentMatches,recentStats));
    $('status').textContent='Analiz tamamlandı. Bu öneriler mevcut API verileriyle sınırlıdır.'; if($('analysisState')){$('analysisState').classList.remove('skeleton','skeleton-value');$('analysisState').textContent='Tamamlandı';}
  } catch(e){ $('dashboardLoading')?.remove(); $('error').textContent=e.message; $('status').textContent='Analiz başlatılamadı.'; if($('analysisState')){$('analysisState').classList.remove('skeleton','skeleton-value');$('analysisState').textContent='Hata';} }
  finally {}
}

$('results').addEventListener('click',e=>{ if(e.target.id!=='showMoreMatches') return; const rows=[...$('matches').querySelectorAll('.match')]; const next=rows.findIndex(row=>row.hidden); rows.slice(next,next+2).forEach(row=>row.hidden=false); if(!rows.some(row=>row.hidden)) e.target.remove(); });
$('results').addEventListener('click',async e=>{
  const button=e.target.closest('[data-match-detail]');
  if(!button) return;
  const panel=button.closest('.match').querySelector('.match-detail');
  const matchId=button.getAttribute('data-match-detail');
  if(panel.dataset.loaded==='true'){panel.hidden=!panel.hidden;return;}
  panel.hidden=false; panel.innerHTML='<span class="muted">FACEIT maç detayları ve oyuncu istatistikleri yükleniyor…</span>'; button.disabled=true;
  try{
    const results=await Promise.allSettled([api('/api/match/'+encodeURIComponent(matchId)),api('/api/match/'+encodeURIComponent(matchId)+'/stats')]);
    const detail=results[0].status==='fulfilled'?results[0].value:null;
    const statsData=results[1].status==='fulfilled'?results[1].value:null;
    if(!detail) throw new Error(results[0].reason.message);
    const score=detail.results?.score||{};
    const scoreText=Object.keys(score).length?Object.entries(score).map(x=>esc(x[0])+': '+esc(x[1])).join(' · '):'Skor bilgisi yok';
    const teams=Object.entries(detail.teams||{}).map(([key,team])=>{
      const roster=team.roster||team.roster_v1||team.players||[];
      const names=roster.map(player=>player.nickname||player.game_player_name).filter(Boolean).map(esc).join(', ');
      const isWinner=detail.results?.winner===key||detail.results?.winner===team.team_id;
      return '<div style="margin-top:8px"><strong>'+esc(team.name||team.nickname||key)+'</strong>'+(isWinner?' · Kazanan':'')+'<div class="muted" style="font-size:11px;margin-top:3px">'+(names||'Oyuncu listesi sunulmadı')+'</div></div>';
    }).join('');
    const playerRoundStats=[];
    for(const round of (statsData?.rounds||[])) for(const team of (round.teams||[])) for(const player of (team.players||[])) if(player.player_id===activePlayerId) playerRoundStats.push({round:round.match_round,stats:player.player_stats||{}});
    const fields=[['Kills','Kills'],['Deaths','Deaths'],['Assists','Assists'],['K/D','K/D Ratio'],['HS%','Headshots %'],['Headshots','Headshots'],['ADR','ADR']];
    const statHtml=playerRoundStats.map((entry,index)=>{
      const lines=fields.filter(x=>entry.stats[x[1]]!==undefined&&entry.stats[x[1]]!==null).map(x=>'<span style="margin-right:12px"><b>'+esc(x[0])+'</b> '+esc(entry.stats[x[1]])+'</span>').join('');
      return lines?'<div style="margin-top:7px"><strong>'+(entry.round?'Harita/maç '+esc(entry.round):'Bölüm '+(index+1))+'</strong><div class="muted" style="margin-top:4px">'+lines+'</div></div>':'';
    }).join('');
    const statsHtml=statHtml?'<div style="margin-top:10px"><strong>FACEIT maç istatistikleri</strong>'+statHtml+'</div>':'<p class="notice" style="margin:8px 0 0">'+(results[1].status==='rejected'?'Maç istatistikleri FACEIT tarafından alınamadı.':'FACEIT bu yanıtta tanınan oyuncu istatistiklerini döndürmedi.')+'</p>';
    const mapName=detail.voting?.map?.pick?.[0]?.name||detail.voting?.map?.name||detail.map||null;
    panel.innerHTML='<div><strong>'+(mapName?esc(mapName):'Harita bilgisi FACEIT yanıtında yok')+'</strong> · '+scoreText+'</div><div class="muted" style="font-size:11px;margin-top:5px">'+esc(detail.competition_name||detail.competition_type||'FACEIT maçı')+' · '+esc(detail.status||'Durum yok')+'</div>'+teams+statsHtml;
    panel.dataset.loaded='true';
  }catch(err){panel.innerHTML='<span class="error">'+esc(err.message||'Maç detayları alınamadı.')+'</span>';}
  finally{button.disabled=false;}
});

let proConfigItems=[];
let proConfigLoaded=false;
let hltvTeams=[];
let hltvRankingMeta={};
let playerConfigFiles=[];
let playerPhotoFiles=[];
function favoritesStorageKey(){const name=$('profileMenuAccount').textContent||'guest';return `clone_lab_favorites_${configKey(name)}`}
function getFavoriteConfigs(){try{const items=JSON.parse(localStorage.getItem(favoritesStorageKey())||'[]');return Array.isArray(items)?items:[]}catch{return []}}
function isFavoriteConfig(name,team){return getFavoriteConfigs().some(item=>configKey(item.name)===configKey(name)&&configKey(item.team)===configKey(team))}
function favoriteButton(name,team){const saved=isFavoriteConfig(name,team);return `<button type="button" class="favorite-toggle${saved?' is-saved':''}" data-toggle-favorite data-favorite-name="${esc(name)}" data-favorite-team="${esc(team)}" aria-pressed="${saved}">${saved?'🔖 Favorilerde':'☆ Favorilere ekle'}</button>`}
function toggleFavoriteConfig(name,team){const items=getFavoriteConfigs();const index=items.findIndex(item=>configKey(item.name)===configKey(name)&&configKey(item.team)===configKey(team));if(index>=0)items.splice(index,1);else items.push({name,team});try{localStorage.setItem(favoritesStorageKey(),JSON.stringify(items));return index<0}catch{return false}}
function renderFavoriteConfigs(){const items=getFavoriteConfigs();$('configFavoritesGrid').innerHTML=items.map(item=>`<button type="button" class="config-player-card" data-favorite-config="${esc(item.name)}" data-favorite-team="${esc(item.team)}"><span class="config-player-photo"><span>${esc(String(item.name||'?').slice(0,2).toUpperCase())}</span></span><b>${esc(item.name)}</b><small>${esc(item.team)}</small></button>`).join('');$('configFavoritesEmpty').hidden=items.length>0}
function configValue(value){if(value===undefined||value===null)return '';const clean=String(value).trim();return !clean||/^(null|undefined|n\/a|na|unknown|not available|not set)$/i.test(clean)?'':clean}
function configMetric(label,value){const clean=configValue(value);return clean?`<div class="config-metric"><span>${esc(label)}</span><b>${esc(clean)}</b></div>`:''}
function configSection(title,content){return content?`<h3 class="config-section-title">${esc(title)}</h3>${content}`:''}
function configKey(value){return configImageSlug(value)}
function teamLogoImage(teamData,alt){const slug=teamData.logo||configTeamImageSlug(teamData.name);const local=`/static/team-logos/${slug}.png`;const remote=hltvRankingMeta.logo_urls?.[teamData.rank];const preferRemote=remote&&['parivision','mibr','1win','nemiga','luminosity','alliance','eternalfire'].includes(configKey(teamData.name));const primary=preferRemote?remote:local;const fallback=preferRemote?local:(remote||`https://cstools.io/teams/${slug}.png`);return `<img src="${esc(primary)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${esc(fallback)}'}else{this.remove()}">`}
function renderConfigTeams(){
  const query=$('configSearch').value.trim().toLocaleLowerCase('tr'); const teams=hltvTeams.filter(team=>!query||team.name.toLocaleLowerCase('tr').includes(query)||team.players.some(name=>name.toLocaleLowerCase('tr').includes(query)));
  const teamCards=teams.map(team=>`<button type="button" class="config-team-card" data-config-team="${esc(team.name)}"><span class="config-team-logo">${teamLogoImage(team,team.name+' takım logosu')}</span><b><i>#${team.rank}</i> ${esc(team.name)}</b></button>`).join('');
  $('configTeamsGrid').innerHTML=teamCards||'<div class="config-missing">Bu aramayla eşleşen takım yok.</div>';
}function openConfigTeam(team){
  const teamData=hltvTeams.find(item=>item.name===team);if(!teamData)return;const players=teamData.players;
  $('configSelectedTeam').textContent=`#${teamData.rank} ${team}`; $('configPlayersGrid').innerHTML=players.map(name=>{const initials=String(name||'?').slice(0,2).toUpperCase();const photo=playerPhotoUrl(name,teamData.rank);return `<button type="button" class="config-player-card" data-config-player="${esc(name)}"><span class="config-player-photo"><span>${esc(initials)}</span><img src="${esc(photo)}" alt="${esc(name)} profil fotoğrafı" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${esc(playerPhotoFallbackUrl(name))}'}else{this.remove()}"></span><b>${esc(name)}</b><small>${esc(proConfigItems.find(item=>configKey(item.name)===configKey(name))?.role||'Oyuncu')}</small></button>`}).join('');
  $('configTeamsView').hidden=true;$('configProfileView').hidden=true;$('configPlayersView').hidden=false;
}
function configImageSlug(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,50)}
function configTeamImageSlug(value){const key=String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'');const aliases={'teamspirit':'spirit','teamvitality':'vitality','natusvincere':'navi','fazeclan':'faze','falconsesports':'falcons','teamfalcons':'falcons','ninjasinpyjamas':'nip'};return aliases[key]||configImageSlug(value)}
function configAvatar(url,alt,initials,team=false,fallbackUrl=''){const fallback=fallbackUrl?`if(!this.dataset.fallback){this.dataset.fallback='1';this.src='${esc(fallbackUrl)}'}else{this.remove()}`:'this.remove()';return `<div class="config-avatar-wrap ${team?'team-avatar':''}"><span aria-hidden="true">${esc(initials)}</span>${url?`<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer" onerror="${fallback}">`:''}</div>`}
function playerPhotoEntry(name,rank){return playerPhotoFiles.find(item=>configKey(item.player)===configKey(name)&&Number(item.rank)===Number(rank))||playerPhotoFiles.find(item=>configKey(item.player)===configKey(name))||null}
function mergeProConfigItems(apiItems,localItems){const merged=new Map();for(const item of [...(apiItems||[]),...(localItems||[])]){if(!item?.name)continue;const key=configKey(item.name);const current=merged.get(key)||{};for(const [field,value] of Object.entries(item)){if(value!==null&&value!==undefined&&value!=='')current[field]=value;}merged.set(key,current);}return [...merged.values()]}
function playerPhotoFallbackUrl(name){return `https://csdb.gg/images/players/${configImageSlug(name)}.webp`}
function playerPhotoUrl(name,rank){const photo=playerPhotoEntry(name,rank);return photo?.file||photo?.remote_url||playerPhotoFallbackUrl(name)}
function renderConfigPlayer(name,team,displayTeam=team){
  const player=proConfigItems.find(item=>configKey(item.name)===configKey(name)&&configKey(item.team)===configKey(team))||proConfigItems.find(item=>configKey(item.name)===configKey(name));if(!player)return;
  const download=playerConfigFiles.find(item=>configKey(item.player)===configKey(player.name));const downloadLink=download?.file?`<a class="cfg-download" href="${esc(download.file)}" download>CFG indir ↓</a>`:'';
  const crosshair=configValue(player.crosshair_code);const crosshairSection=crosshair?`<div class="config-crosshair"><code>${esc(crosshair)}</code><button type="button" class="secondary" data-copy-crosshair="${esc(crosshair)}">Kodu kopyala</button></div>`:'';
  const teamData=hltvTeams.find(item=>configKey(item.name)===configKey(displayTeam));const rank=teamData?.rank;const initials=String(player.name||'?').slice(0,2).toUpperCase();const teamInitials=String(displayTeam||'?').split(/\s+/).map(word=>word[0]).join('').slice(0,3).toUpperCase();
  const visuals=`<div class="config-profile-visuals"><div class="config-avatar-wrap team-avatar"><span aria-hidden="true">${esc(teamInitials)}</span>${teamData?teamLogoImage(teamData,displayTeam+' logosu'):''}</div>${configAvatar(playerPhotoUrl(player.name,rank),`${player.name} profil fotoğrafı`,initials,false,playerPhotoFallbackUrl(player.name))}</div>`;
  const sources=[];if(player.source_url)sources.push(`<a href="${esc(player.source_url)}" target="_blank" rel="noopener noreferrer">${esc(player.source_label||'CFG kaynağı')} ↗</a>`);if(Array.isArray(player.source_urls))for(const source of player.source_urls){if(source?.url)sources.push(`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label||'Ayar kaynağı')} ↗</a>`)}if(player.github_source)sources.push(`<a href="${esc(player.github_source)}" target="_blank" rel="noopener noreferrer">Açık ayar veri tabanı ↗</a>`);const portrait=playerPhotoEntry(player.name,rank);if(portrait?.attribution_url)sources.push(`<a href="${esc(portrait.attribution_url)}" target="_blank" rel="noopener noreferrer">${esc(portrait.source||'Oyuncu fotoğrafı kaynağı')} ↗</a>`);const sourceLinks=sources.length?`<div class="config-source-links">${sources.join('')}</div>`:'';const sourceDate=player.source_updated?`Kaynak güncellemesi: ${esc(player.source_updated)}.`:'';
  const makeMetrics=(entries)=>entries.map(([label,value])=>configMetric(label,value)).join('');
  const aim=makeMetrics([['DPI',player.dpi],['Oyun içi hassasiyet',player.sensitivity],['eDPI',player.edpi],['Zoom hassasiyeti',player.zoom_sensitivity],['Polling rate',player.hz?player.hz+' Hz':null],['Mouse',player.mouse]]);
  const view=makeMetrics([['Çözünürlük',player.resolution],['En-boy / ölçek',player.aspect_ratio]]);
  const video=makeMetrics([['Yenileme hızı',player.refresh_rate?player.refresh_rate+' Hz':null],['Ölçekleme',player.scaling_mode],['Parlaklık',player.brightness]]);
  const viewmodel=makeMetrics([['FOV',player.viewmodel_fov],['X konumu',player.viewmodel_offset_x],['Y konumu',player.viewmodel_offset_y],['Z konumu',player.viewmodel_offset_z],['Preset',player.viewmodel_presetpos]]);
  const commands=Array.isArray(player.cfg_commands)?player.cfg_commands.filter(Boolean):[];const commandSection=commands.length?configSection('CFG’DE YAYIMLANAN KOMUTLAR',`<pre class="config-cfg-commands"><code>${commands.map(esc).join('\n')}</code></pre>`):'';
  $('configProfile').innerHTML=`<article class="config-profile"><div class="config-profile-head">${visuals}<div class="config-player-heading"><h2>${esc(player.name)}</h2><div class="muted">${esc(displayTeam)}${player.role?' · '+esc(player.role):''}</div></div>${downloadLink}</div><div class="config-profile-actions">${favoriteButton(player.name,displayTeam)}${sourceLinks}</div>${sourceDate?`<p class="config-source">${sourceDate}</p>`:''}${configSection('AIM & MOUSE',aim?`<div class="config-metrics">${aim}</div>`:'')}${configSection('CROSSHAIR',crosshairSection)}${configSection('GÖRÜNTÜ',view?`<div class="config-metrics">${view}</div>`:'')}${configSection('VIDEO & GRAFİK',video?`<div class="config-metrics">${video}</div>`:'')}${configSection('VIEWMODEL',viewmodel?`<div class="config-metrics">${viewmodel}</div>`:'')}${commandSection}</article>`;
  $('configPlayersView').hidden=true;$('configTeamsView').hidden=true;$('configProfileView').hidden=false;
}function renderTop30Player(name,team){const teamData=hltvTeams.find(item=>configKey(item.name)===configKey(team));const known=proConfigItems.find(item=>configKey(item.name)===configKey(name)&&configKey(item.team)===configKey(team))||proConfigItems.find(item=>configKey(item.name)===configKey(name));if(known){renderConfigPlayer(name,team,team);return}const slug=configImageSlug(name);const initials=String(name||'?').slice(0,2).toUpperCase();const download=playerConfigFiles.find(item=>configKey(item.player)===configKey(name));const downloadLink=download?.file?`<a class="cfg-download" href="${esc(download.file)}" download>CFG indir ↓</a>`:'';const links=`<div class="config-directory-links" style="margin-top:12px"><a href="https://confighub.gg/cs2/${slug}" target="_blank" rel="noopener noreferrer">Kaynak profili aç ↗</a><a href="https://cstools.io/pros/${slug}" target="_blank" rel="noopener noreferrer">CS Tools profili ↗</a></div>`;const logoUrl=teamData?`/static/team-logos/${teamData.logo||configTeamImageSlug(team)}.png`:'';const remoteLogo=hltvRankingMeta.logo_urls?.[teamData?.rank]||`https://cstools.io/teams/${configTeamImageSlug(team)}.png`;const teamImage=`<div class="config-avatar-wrap team-avatar"><span aria-hidden="true">${esc(team.slice(0,2).toUpperCase())}</span><img src="${esc(logoUrl)}" alt="${esc(team)} logosu" loading="lazy" onerror="if(!this.dataset.remote){this.dataset.remote='1';this.src='${esc(remoteLogo)}'}else{this.remove()}"></div>`;$('configProfile').innerHTML=`<article class="config-profile"><div class="config-profile-head">${teamImage}${configAvatar(playerPhotoUrl(name,teamData?.rank),`${name} profil fotoğrafı`,initials)}<div class="config-player-heading"><h2>${esc(name)}</h2><div class="muted">#${teamData?.rank||'—'} ${esc(team)}</div></div>${downloadLink}</div><div class="config-profile-actions">${favoriteButton(name,team)}${links}</div></article>`;$('configPlayersView').hidden=true;$('configTeamsView').hidden=true;$('configProfileView').hidden=false}
async function loadProConfigs(){
  if(proConfigLoaded)return; $('configStatus').className='config-loading';$('configStatus').innerHTML='<div class="skeleton-stack" aria-label="Oyuncu verileri yükleniyor"><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i></div>';$('configTeamsGrid').innerHTML=Array.from({length:6},()=>'<div class="config-team-skeleton"><i class="skeleton skeleton-square"></i><i class="skeleton skeleton-name"></i></div>').join('');
  try{const [data,rankingResponse,cfgResponse,photoResponse,localResponse]=await Promise.all([api('/api/pro-configs').catch(()=>({items:[]})),fetch('/static/hltv-top30.json'),fetch('/static/player-config-index.json'),fetch('/static/player-photo-index.json'),fetch('/static/pro_players.json')]);if(!rankingResponse.ok)throw new Error('HLTV takım listesi yüklenemedi.');const ranking=await rankingResponse.json();const localSnapshot=localResponse.ok?await localResponse.json():{};proConfigItems=mergeProConfigItems(data.items,localSnapshot.players);hltvTeams=Array.isArray(ranking.teams)?ranking.teams:[];hltvRankingMeta=ranking;playerConfigFiles=cfgResponse.ok?await cfgResponse.json():[];playerPhotoFiles=photoResponse.ok?await photoResponse.json():[];if(hltvTeams.length!==29||hltvTeams.some(team=>team.players.length!==5))throw new Error('HLTV liste dosyası 29 takım ve beşer kişilik kadro içermeli.');renderConfigTeams();proConfigLoaded=true;$('configStatus').className='notice';$('configStatus').innerHTML=`HLTV · ${esc(ranking.ranking_date)} sıralaması · ${hltvTeams.length} takım / ${hltvTeams.reduce((n,t)=>n+t.players.length,0)} oyuncu · ${playerConfigFiles.length} indirilebilir CFG · ${playerPhotoFiles.filter(item=>item.file).length} yerel + ${playerPhotoFiles.filter(item=>item.remote_url).length} uzak kaynaklı portre · <a href="${esc(ranking.source_url)}" target="_blank" rel="noopener noreferrer">kaynağı aç ↗</a>${ranking.note?`<span class="config-note">${esc(ranking.note)}</span>`:''}`; }
  catch(error){$('configTeamsGrid').innerHTML='';$('configStatus').textContent=error.message;$('configStatus').className='error';}
}
$('appTabs').addEventListener('click',async event=>{const button=event.target.closest('[data-tab]');if(button)await selectMainTab(button.dataset.tab);});
$('configSearch').addEventListener('input',renderConfigTeams);
$('configTeamsGrid').addEventListener('click',event=>{const card=event.target.closest('[data-config-team]');if(card)openConfigTeam(card.dataset.configTeam)});
$('configPlayersGrid').addEventListener('click',event=>{const card=event.target.closest('[data-config-player]');if(card)renderTop30Player(card.dataset.configPlayer,$('configSelectedTeam').textContent.replace(/^#\d+\s*/,''))});
$('configBackTeams').addEventListener('click',()=>{$('configPlayersView').hidden=true;$('configProfileView').hidden=true;$('configTeamsView').hidden=false});
$('configBackPlayers').addEventListener('click',()=>{$('configProfileView').hidden=true;$('configPlayersView').hidden=false});
$('configProfile').addEventListener('click',async event=>{const button=event.target.closest('[data-copy-crosshair]');if(!button)return;try{await navigator.clipboard.writeText(button.dataset.copyCrosshair);button.textContent='Kopyalandı';setTimeout(()=>button.textContent='Kodu kopyala',1500);}catch{$('configStatus').textContent='Panoya erişilemedi; crosshair kodunu seçip kopyalayabilirsin.';}});
function setConfigView(view){$('configTeamsView').hidden=view!=='teams';$('configPlayersView').hidden=view!=='players';$('configProfileView').hidden=view!=='profile';$('configFavoritesView').hidden=view!=='favorites'}
async function selectMainTab(target){
  const selected=typeof target==='string'?target:(target?'configs':'faceit');
  const panels={faceit:$('faceitTab'),steam:$('steamTab'),configs:$('configsTab')};
  Object.entries(panels).forEach(([name,panel])=>{panel.hidden=name!==selected;});
  document.querySelectorAll('.app-tab').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.tab===selected)));
  if(selected==='configs')await loadProConfigs();
  if(selected==='steam')await loadSteamProfile();
}function closeProfileMenu(){const menu=$('profileDropdown');menu.classList.remove('is-open');$('profileMenuButton').setAttribute('aria-expanded','false');setTimeout(()=>{if(!menu.classList.contains('is-open'))menu.hidden=true;},150)}
$('profileMenuButton').addEventListener('click',()=>{const menu=$('profileDropdown'),open=menu.hidden;menu.hidden=!open;$('profileMenuButton').setAttribute('aria-expanded',String(open));requestAnimationFrame(()=>menu.classList.toggle('is-open',open));});
$('profileDropdown').addEventListener('click',async event=>{
  const favorite=event.target.closest('[data-toggle-favorite]');if(favorite){const saved=toggleFavoriteConfig(favorite.dataset.favoriteName,favorite.dataset.favoriteTeam);favorite.classList.toggle('is-saved',saved);favorite.setAttribute('aria-pressed',String(saved));favorite.textContent=saved?'🔖 Favorilerde':'☆ Favorilere ekle';return;}
  const item=event.target.closest('[data-profile-menu]');if(!item)return;const action=item.dataset.profileMenu;
  if(action==='settings'){$('profileSettingsPanel').hidden=!$('profileSettingsPanel').hidden;$('savedFaceitNickname').focus();return;}
  closeProfileMenu();$('profileSettingsPanel').hidden=true;
  if(action==='profile'){await selectMainTab(false);const nickname=$('savedFaceitNickname').value.trim();if(nickname)await loadProfile(nickname);else{$('status').textContent='FACEIT profili bağlı değil. Hesap ayarlarından kullanıcı adını ekleyebilirsin.';$('profileDropdown').hidden=false;$('profileMenuButton').setAttribute('aria-expanded','true');$('profileDropdown').classList.add('is-open');$('profileSettingsPanel').hidden=false;}}
  if(action==='favorites'){await selectMainTab(true);setConfigView('favorites');renderFavoriteConfigs();}
});
$('configProfile').addEventListener('click',event=>{const favorite=event.target.closest('[data-toggle-favorite]');if(!favorite)return;const saved=toggleFavoriteConfig(favorite.dataset.favoriteName,favorite.dataset.favoriteTeam);favorite.classList.toggle('is-saved',saved);favorite.setAttribute('aria-pressed',String(saved));favorite.textContent=saved?'🔖 Favorilerde':'☆ Favorilere ekle';});
$('configFavoritesGrid').addEventListener('click',event=>{const item=event.target.closest('[data-favorite-config]');if(item)renderTop30Player(item.dataset.favoriteConfig,item.dataset.favoriteTeam)});
$('configBackFavorites').addEventListener('click',()=>setConfigView('teams'));
$('configBackTeams').addEventListener('click',()=>setConfigView('teams'));
$('configBackPlayers').addEventListener('click',()=>setConfigView('players'));
document.addEventListener('click',event=>{if(!$('profileWidget').contains(event.target))closeProfileMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeProfileMenu();closeAuthModal();}});
function setAuthMode(mode){
  const register=mode==='register';
  $('loginPanel').hidden=register;
  $('registerPanel').hidden=!register;
  $('authLoginTab').classList.toggle('is-active',!register);
  $('authRegisterTab').classList.toggle('is-active',register);
  $('authLoginTab').setAttribute('aria-selected',String(!register));
  $('authRegisterTab').setAttribute('aria-selected',String(register));
}
let authReturnFocus=null;
let authCloseTimer=null;
function openAuthModal(mode='login'){
  clearTimeout(authCloseTimer);
  authReturnFocus=document.activeElement;
  $('authModal').hidden=false;
  document.body.classList.add('auth-modal-open');
  setAuthMode(mode);
  requestAnimationFrame(()=>$('authModal').classList.add('is-open'));
  setTimeout(()=>$(mode==='register'?'registerUsername':'loginUsername').focus(),80);
}
function closeAuthModal(){
  const modal=$('authModal');
  if(!modal||modal.hidden)return;
  modal.classList.remove('is-open');
  document.body.classList.remove('auth-modal-open');
  authCloseTimer=setTimeout(()=>{if(modal.classList.contains('is-open'))return;modal.hidden=true;if(authReturnFocus?.focus)authReturnFocus.focus();},180);
}
document.querySelectorAll('[data-auth-open]').forEach(button=>button.addEventListener('click',()=>openAuthModal(button.dataset.authOpen)));
document.querySelectorAll('[data-auth-mode]').forEach(button=>button.addEventListener('click',()=>setAuthMode(button.dataset.authMode)));
document.querySelectorAll('[data-auth-close]').forEach(button=>button.addEventListener('click',closeAuthModal));
async function setAccountState(data,openSavedProfile=false){
  if(data?.authenticated){data={...activeAccountData,...data};activeAccountData=data;}else activeAccountData={};
  const loggedIn=Boolean(data?.authenticated);
  $('landingPage').hidden=loggedIn;$('authActions').hidden=loggedIn;$('appBranding').hidden=!loggedIn;
  $('appTabs').hidden=!loggedIn;$('faceitTab').hidden=!loggedIn;$('steamTab').hidden=true;$('configsTab').hidden=true;
  document.querySelectorAll('.app-tab').forEach((tab,index)=>tab.setAttribute('aria-selected',String(index===0)));
  const persistenceNote=$('accountPersistenceNote');
  persistenceNote.textContent=data?.persistent_storage?'Hesap kayıtları yapılandırılmış veritabanı veya disk üzerinde tutuluyor; sağlayıcının saklama koşulları geçerlidir.':'Uyarı: Bu Render yayını kalıcı depolama bildirmiyor. Servis yeniden başlarsa kayıtlı hesaplar silinebilir; kalıcı Postgres DATABASE_URL veya kalıcı disk yapılandır.';
  $('authLoggedOut').hidden=loggedIn;$('profileWidget').hidden=!loggedIn;
  if(loggedIn)closeAuthModal();
  if(!loggedIn){
    $('results').innerHTML='';$('error').textContent='';$('status').textContent='Clone Lab hesabınla giriş yap veya yeni bir hesap oluştur.';
    $('steamResults').innerHTML='';$('steamStatus').textContent='Steam verisi henüz yüklenmedi.';$('steamFaceitPrompt').hidden=true;$('steamNotConnected').hidden=true;$('steamConnectSetting').hidden=true;$('steamConnectedSetting').hidden=true;steamProfileLoaded=false;activePlayerId=null;
    $('profileWidgetAvatar').hidden=true;$('profileWidgetInitials').hidden=false;closeProfileMenu();return;
  }
  $('profileMenuAccount').textContent=data.username||'';
  $('profileMenuSteam').textContent=data.steam_id?'Steam · '+(data.steam_persona_name||data.username):'Steam hesabı bağlı değil';
  $('profileMenuFaceit').textContent=data.faceit_nickname?`FACEIT · ${data.faceit_nickname}`:'FACEIT profili bağlı değil';
  $('savedFaceitNickname').value=data.faceit_nickname||'';
  $('profileWidgetName').textContent=data.faceit_nickname||data.steam_persona_name||data.username||'';
  $('steamFaceitPrompt').hidden=!data.steam_id||Boolean(data.faceit_nickname);$('steamNotConnected').hidden=Boolean(data.steam_id);
  $('steamConnectSetting').hidden=Boolean(data.steam_id);$('steamConnectedSetting').hidden=!data.steam_id;
  $('profileWidgetInitials').textContent=String(data.username||'CL').slice(0,2).toUpperCase();
  if(data.steam_avatar_url){$('profileWidgetAvatar').src=data.steam_avatar_url;$('profileWidgetAvatar').hidden=false;$('profileWidgetInitials').hidden=true;}else{$('profileWidgetAvatar').hidden=true;$('profileWidgetInitials').hidden=false;}
  $('profileSettingsPanel').hidden=true;
  if(data.faceit_nickname&&openSavedProfile)await loadProfile(data.faceit_nickname);
  else if(!data.faceit_nickname)$('status').textContent=data.steam_id?'Steam hesabın hazır. FACEIT profilin varsa ekleyebilir veya daha sonra bağlayabilirsin.':'Hesabın hazır. FACEIT profilini profil menüsünden bağlayabilirsin.';
}function accountMessage(text,type=''){
  const el=$('authMessage');el.textContent=text;el.className='account-message'+(type?' '+type:'');const profile=$('profileMessage');profile.textContent=text;profile.className='profile-message'+(type?' '+type:'');
}
async function restoreAccount(){
  try{
    const data=await api('/api/account');
    const params=new URLSearchParams(location.search),steamResult=params.get('steam_login'),reason=params.get('reason');
    await setAccountState(data,true);
    if(steamResult==='success'||steamResult==='linked'){
      $('status').textContent=steamResult==='linked'?'Steam hesabı Clone Lab hesabına bağlandı.':'Steam ile giriş başarılı. FACEIT kullanıyorsan profil menüsünden ekleyebilirsin.';
      if(data.steam_id&&!data.faceit_nickname){$('steamFaceitPrompt').hidden=false;}
      history.replaceState({},'',location.pathname+location.hash);
    }else if(steamResult==='error'){
      const messages={state:'Steam giriş doğrulaması başarısız oldu. Lütfen tekrar dene.',expired:'Steam giriş isteğinin süresi doldu. Tekrar dene.',cancelled:'Steam girişi iptal edildi.',setup:'Steam girişi için sunucu adresi yapılandırılmamış.',return:'Steam dönüş adresi doğrulanamadı.',identity:'Steam hesabı doğrulanamadı.',verify:'Steam doğrulama sunucusuna erişilemedi.',already_linked:'Bu Steam hesabı başka bir Clone Lab hesabına bağlı.'};
      openAuthModal('login');accountMessage(messages[reason]||'Steam ile giriş tamamlanamadı. Tekrar dene.','error');history.replaceState({},'',location.pathname+location.hash);
    }
  }catch(e){accountMessage('Hesap bilgisi alınamadı: '+e.message,'error');}
}async function submitAuth(form,path){
  const button=form.querySelector('button[type="submit"]');button.disabled=true;accountMessage('Hesabın kontrol ediliyor…');
  try{
    const body=Object.fromEntries(new FormData(form).entries());
    const data=await api(path,{method:'POST',body:JSON.stringify(body)});
    accountMessage(path.endsWith('/register')?'Yeni hesap oluşturuldu.':'Giriş başarılı.','success');
    const passwordField=form.querySelector('[name="password"]');if(passwordField)passwordField.value='';
    await setAccountState(data,true);
  }catch(e){accountMessage(e.message,'error');}
  finally{button.disabled=false;}
}
function steamMetric(label,value,suffix=''){
  const shown=value===null||value===undefined?'—':String(value)+suffix;
  return `<article class="steam-metric"><span>${esc(label)}</span><b>${esc(shown)}</b></article>`;
}
function renderSteamProfile(data){
  const profile=data.steam||{},cs2=data.cs2||{};
  const hours=value=>value!==null&&value!==undefined&&Number.isFinite(Number(value))?Math.round(Number(value)/60).toLocaleString('tr-TR')+' saat':null;
  const metrics=[steamMetric('Toplam CS2 süresi',hours(cs2.playtime_minutes)),steamMetric('Son 2 haftada',hours(cs2.recent_playtime_minutes)),steamMetric('Steam oyun istatistiği',cs2.stats_available?cs2.stats.length:null,' kayıt')].join('');
  const avatar=profile.avatar_url?`<img class="steam-profile-avatar" src="${esc(profile.avatar_url)}" alt="${esc(profile.persona_name||'Steam')} avatarı">`:'<div class="steam-profile-avatar steam-avatar-fallback">S</div>';
  const stats=(cs2.stats||[]).map(item=>`<div class="steam-stat-row"><span>${esc(String(item.name).replaceAll('_',' '))}</span><b>${esc(item.value)}</b></div>`).join('');
  const statusNote=data.unavailable_sources?.length?`<p class="notice">Gizlilik ayarları veya Steam API erişimi nedeniyle bazı alanlar alınamadı: ${esc(data.unavailable_sources.join(', '))}.</p>`:'';
  $('steamResults').innerHTML=`<section class="steam-profile-card">${avatar}<div class="steam-profile-copy"><span class="eyebrow">STEAM PLAYER</span><h2>${esc(profile.persona_name||'Steam hesabı')}</h2><a href="${esc(profile.profile_url||'#')}" target="_blank" rel="noopener noreferrer">Steam profilini aç ↗</a></div><span class="steam-app-badge">COUNTER-STRIKE 2 · 730</span></section><div class="steam-metrics">${metrics}</div>${stats?`<details class="steam-stats-details"><summary>Steam’in yayımladığı ${stats.length} oyun istatistiği</summary><div class="steam-stats-grid">${stats}</div></details>`:'<div class="notice">Steam bu profil için herkese açık CS2 oyun istatistiği döndürmedi.</div>'}<section class="steam-history-note"><b>Maç geçmişi</b><p>${esc(cs2.match_history?.message||'Steam Web API kişisel CS2 maç geçmişini maç maç sağlamıyor.')}</p></section>${statusNote}<p class="steam-source">Kaynak: ${esc(data.source||'Steam Web API')}. ${esc(data.privacy_note||'Gizlilik ayarları erişilebilir alanları etkileyebilir.')}</p>`;
}
async function loadSteamProfile(){
  if(!activeAccountData.steam_id){$('steamNotConnected').hidden=false;$('steamStatus').textContent='Steam hesabı bağlı değil.';$('steamResults').innerHTML='';return;}
  $('steamNotConnected').hidden=true;$('steamStatus').className='notice';$('steamStatus').innerHTML='<div class="skeleton-stack" aria-label="Steam verisi yükleniyor"><i class="skeleton skeleton-row"></i><i class="skeleton skeleton-row"></i></div>';
  try{const data=await api('/api/steam/profile');renderSteamProfile(data);steamProfileLoaded=true;$('steamStatus').textContent='Steam hesabı doğrulandı. Yalnızca API’den alınan alanlar gösteriliyor.';}
  catch(error){$('steamResults').innerHTML='';$('steamStatus').textContent=error.message;$('steamStatus').className='error';}
}
$('steamRefresh').addEventListener('click',()=>loadSteamProfile());
$('connectFaceitPrompt').addEventListener('click',event=>{
  event.stopPropagation();$('profileDropdown').hidden=false;$('profileMenuButton').setAttribute('aria-expanded','true');$('profileDropdown').classList.add('is-open');$('profileSettingsPanel').hidden=false;$('savedFaceitNickname').focus();
});
$('loginForm').addEventListener('submit',e=>{e.preventDefault();submitAuth(e.currentTarget,'/api/account/login');});
$('registerForm').addEventListener('submit',e=>{e.preventDefault();submitAuth(e.currentTarget,'/api/account/register');});
$('faceitLinkForm').addEventListener('submit',async e=>{
  e.preventDefault();const button=e.currentTarget.querySelector('button[type="submit"]');button.disabled=true;accountMessage('FACEIT profili aranıyor…');
  try{
    const nickname=$('savedFaceitNickname').value.trim();
    const data=await api('/api/account/faceit',{method:'POST',body:JSON.stringify({nickname})});
    await setAccountState({authenticated:true,username:$('profileMenuAccount').textContent,faceit_nickname:data.faceit_nickname,persistent_storage:data.persistent_storage},false);
    accountMessage('FACEIT profili bulundu ve bu hesaba kaydedildi.','success');
    $('profileSettingsPanel').hidden=true;
    await loadProfile(data.faceit_nickname);
  }catch(err){accountMessage(err.message,'error');}
  finally{button.disabled=false;}
});
$('logoutButton').addEventListener('click',async()=>{
  try{await api('/api/account/logout',{method:'POST'});await setAccountState({authenticated:false});accountMessage('Oturum kapatıldı.');}
  catch(e){accountMessage(e.message,'error');}
});
const warmupPlans=[
  [['04:00','Bot aim · isabet ve kısa flick'],['06:00','DM · crosshair seviyesi ve ilk mermi'],['05:00','Recoil kontrolü · 2 favori silah']],
  [['05:00','Kısa strafing aim çalışması'],['05:00','DM · açı temizleme ve trade mesafesi'],['05:00','Spray aktarımı · AK/M4']],
  [['03:00','El bileği ve mouse kontrolü'],['07:00','DM · sakin pre-aim ve burst'],['05:00','Retake sunucusu · utility sonrası giriş']]
];
let warmupPlanIndex=0;
$('newRoutine').addEventListener('click',()=>{
  warmupPlanIndex=(warmupPlanIndex+1)%warmupPlans.length;
  $('warmupRoutine').innerHTML=warmupPlans[warmupPlanIndex].map(([time,label])=>'<li><time>'+time+'</time><span>'+esc(label)+'</span></li>').join('');
  $('routineIndex').textContent='0'+(warmupPlanIndex+1)+' / 03';
});
$('serverConnect').addEventListener('click',()=>{
  const address=$('serverAddress').value.trim();
  const message=$('serverMessage');
  const match=address.match(/^(?:[a-z0-9.-]+|\[[0-9a-f:]+\]):(\d{1,5})$/i);
  const port=match?Number(match[1]):0;
  if(!match||port<1||port>65535){message.textContent='Geçerli bir sunucu adresi ve port gir (ör. sunucu:27015).';message.classList.add('is-error');$('serverAddress').focus();return;}
  message.classList.remove('is-error');
  message.textContent=$('serverMode').value+' sunucusu için Steam bağlantısı açılıyor…';
  window.location.href='steam://connect/'+address;
});
const lineupScene=$('lineupScene');
const lineupHand=document.querySelector('.lineup-hand');
const lineupGrenade=document.querySelector('.lineup-grenade');
const lineupResult=document.querySelector('.lineup-result');
const lineupCopy=$('lineupCopy');
const lineupStageLabel=$('lineupStageLabel');
const smokeCanvas=$('smokeCanvas');
const smokeContext=smokeCanvas?.getContext('2d');
const smokeArtwork=new Image();
const guideRevealTargets=[...document.querySelectorAll('.guide-panel-top,.guide-instructions,.guide-video-card,.guide-panel-foot')];
function fitSmokeArtwork(){
  if(!smokeCanvas||!smokeContext||!smokeArtwork.complete||!smokeArtwork.naturalWidth)return;
  const bounds=smokeCanvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);
  smokeCanvas.width=Math.max(1,Math.round(bounds.width*ratio));smokeCanvas.height=Math.max(1,Math.round(bounds.height*ratio));
  smokeContext.setTransform(ratio,0,0,ratio,0,0);smokeContext.clearRect(0,0,bounds.width,bounds.height);
  const scale=Math.min(bounds.width/smokeArtwork.width,bounds.height/smokeArtwork.height);
  const width=smokeArtwork.width*scale,height=smokeArtwork.height*scale;
  smokeContext.drawImage(smokeArtwork,(bounds.width-width)/2,(bounds.height-height)/2,width,height);
}
smokeArtwork.addEventListener('load',fitSmokeArtwork);
smokeArtwork.src='/static/lineup/smoke-cloud.png';
window.addEventListener('resize',fitSmokeArtwork,{passive:true});
if(lineupScene&&lineupHand&&lineupGrenade&&lineupResult&&smokeCanvas){
  if(window.gsap&&window.ScrollTrigger&&window.MotionPathPlugin&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    gsap.registerPlugin(ScrollTrigger,MotionPathPlugin);
    const pinned=$('lineupPinned'),section=$('lineupFeature');
    const grenadeArtwork=lineupGrenade.querySelector('img');
    gsap.set(lineupHand,{xPercent:-76,yPercent:34,rotation:-27,autoAlpha:0});
    gsap.set(lineupGrenade,{left:0,top:0,x:0,y:0,scale:1,autoAlpha:0,transformOrigin:'50% 50%'});
    gsap.set(smokeCanvas,{visibility:'hidden',opacity:0,scale:.38,transformOrigin:'50% 65%'});
    gsap.set(guideRevealTargets,{autoAlpha:0,y:22,filter:'blur(12px)'});
    const lineupTimeline=gsap.timeline({
      scrollTrigger:{
        trigger:section,pin:pinned,pinSpacing:true,anticipatePin:1,
        start:'top top',
        end:()=>'+='+Math.round(window.innerHeight*(window.innerWidth<700?1.3:1.55)),
        scrub:1.2,invalidateOnRefresh:true,
        onUpdate:self=>{
          gsap.set($('lineupProgress'),{scaleX:self.progress});
          lineupStageLabel.textContent=self.progress<.4?'01 — HAND / THROW':self.progress<.8?'02 — FLIGHT / BOUNCE':'03 — SMOKE / LINEUP GUIDE';
        }
      }
    });
    lineupTimeline
      .to(lineupHand,{xPercent:-5,yPercent:-5,rotation:-4,autoAlpha:1,duration:.2,ease:'power1.out'},0)
      .to(lineupHand,{xPercent:-95,yPercent:45,rotation:24,autoAlpha:.12,duration:.2,ease:'power2.in'},.2)
      .set(lineupGrenade,{autoAlpha:1},.4)
      .to(lineupGrenade,{
        motionPath:{path:'#smoke-trajectory',align:'#smoke-trajectory',alignOrigin:[.5,.5],autoRotate:false,start:0,end:1},
        duration:.34,ease:'none'
      },.4)
      .to(grenadeArtwork,{rotation:360,duration:.34,ease:'none',transformOrigin:'50% 50%'},.4)
      .to(lineupGrenade,{y:-18,duration:.025,ease:'power2.out'},.74)
      .to(lineupGrenade,{y:0,duration:.035,ease:'bounce.out'},.765)
      .to(lineupGrenade,{scale:.28,autoAlpha:0,duration:.02},.8)
      .to(smokeCanvas,{visibility:'visible',opacity:.25,scale:1.28,duration:.16,ease:'power2.out'},.8)
      .to(lineupCopy,{autoAlpha:0,duration:.08},.8)
      .to(guideRevealTargets,{autoAlpha:1,y:0,filter:'blur(0px)',duration:.1,stagger:.015,ease:'power2.out'},.82);
    smokeArtwork.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
  }else{
    fitSmokeArtwork();
    lineupHand.style.opacity=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'0':'1';
    lineupGrenade.style.opacity='1';lineupGrenade.style.left='54%';lineupGrenade.style.top='78%';
    smokeCanvas.style.opacity='1';lineupResult.style.opacity='1';lineupResult.style.transform='none';
    lineupCopy.style.opacity='0';guideRevealTargets.forEach(item=>{item.style.opacity='1';item.style.visibility='visible';item.style.filter='none';item.style.transform='none';});
  }
}
if('IntersectionObserver' in window){
  const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}}),{threshold:.12});
  document.querySelectorAll('.reveal-on-scroll').forEach(element=>revealObserver.observe(element));
}else document.querySelectorAll('.reveal-on-scroll').forEach(element=>element.classList.add('is-visible'));
restoreAccount();
