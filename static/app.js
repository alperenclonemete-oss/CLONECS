const form=document.querySelector('#search-form'),input=document.querySelector('#nickname'),statusEl=document.querySelector('#status'),results=document.querySelector('#results');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v?new Date(Number(v)*1000).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'Date unavailable';
const human=k=>String(k).replace(/[_-]+/g,' ').replace(/\b\w/g,x=>x.toUpperCase());
function metric(label,value,foot='FACEIT verisi'){return `<div class="metric"><div class="metric-label">${esc(label)}</div><div class="metric-value">${esc(value)}</div><div class="metric-foot">${esc(foot)}</div></div>`}
function lineChart(points,label,unit=''){
  const vals=(points||[]).filter(p=>Number.isFinite(Number(p.value))).map(p=>Number(p.value));
  if(vals.length<2)return `<div class="chart-empty">Bu grafik için FACEIT en az iki geçerli maç verisi döndürmeli. Mevcut nokta: ${vals.length}.</div>`;
  const w=720,h=210,pad=28,min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;
  const xy=vals.map((v,i)=>[pad+i*(w-2*pad)/(vals.length-1),h-pad-(v-min)*(h-2*pad)/span]);
  const path=xy.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dots=xy.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.5"><title>Maç ${i+1}: ${vals[i]}${unit}</title></circle>`).join('');
  return `<div class="chart-wrap"><div class="chart-caption"><span>${esc(label)}</span><span>${min}${unit} – ${max}${unit}</span></div><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)} maç trendi"><line x1="${pad}" y1="${pad}" x2="${w-pad}" y2="${pad}"/><line x1="${pad}" y1="${h/2}" x2="${w-pad}" y2="${h/2}"/><line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}"/><path class="chart-line" d="${path}"/>${dots}</svg><div class="chart-axis"><span>FACEIT kayıt sırası</span><span>${vals.length} veri noktası</span></div></div>`;
}
function draw(d){
 const p=d.player,s=d.summary,ms=d.matches||[],life=s.lifetime||{},recent=s.recent||{},metrics=recent.metrics||{},series=recent.series||{};
 const avatar=p.avatar?`<img class="avatar" src="${esc(p.avatar)}" alt="">`:'<div class="avatar"></div>';
 const cards=metric('FACEIT ELO',p.elo??'—',p.level?`Seviye ${p.level}`:'Seviye bilgisi yok')+
  metric('Son maç kazanma',s.win_rate==null?'—':`${s.win_rate}%`,`${s.wins}G · ${s.losses}M · ${s.results_available} sonucu belli maç`)+
  metric('Son maçlar',s.matches_returned,`${esc(d.source)} · istenen kayıt`)+
  metric('K/D',metrics.kd?.average??life['Average K/D Ratio']??life['K/D Ratio']??'—',metrics.kd?`Son ${metrics.kd.matches} maç ortalaması`:'Kariyer verisi, mevcutsa');
 const recentCards=[['HS oranı',metrics.hs_percent,'%'],['ADR',metrics.adr,''],['Kill',metrics.kills,''],['Death',metrics.deaths,''],['Assist',metrics.assists,''],['K/R',metrics.kr,'']].map(([name,m,u])=>metric(name,m?`${m.average}${u}`:'—',m?`${m.matches} maç · min ${m.min} / max ${m.max}`:'FACEIT verisi yok')).join('');
 const matchHtml=ms.length?ms.map((m,i)=>`<article class="match"><span class="outcome ${m.won===true?'win':m.won===false?'loss':''}"></span><div class="match-main"><div class="match-map">${esc(m.map||m.mode||'Harita bilgisi yok')}</div><div class="match-date">${esc(date(m.finished_at))}${m.score?` · ${esc(Object.values(m.score).join(' : '))}`:''}</div></div><span class="badge ${m.won===true?'win':m.won===false?'loss':''}">${m.won===true?'GALİBİYET':m.won===false?'MAĞLUBİYET':'SONUÇ YOK'}</span>${m.id?`<button type="button" class="detail-button" data-match="${esc(m.id)}" aria-expanded="false">Detay</button>`:''}<div class="match-detail" id="detail-${esc(m.id||i)}" hidden></div>${m.url?`<a class="match-link" href="${esc(m.url)}" target="_blank" rel="noopener">FACEIT ↗</a>`:''}</article>`).join(''):'<p class="empty">FACEIT bu oyun modu için maç geçmişi döndürmedi.</p>';
 const tips=(d.recommendations||[]).map(t=>`<div class="tip"><div class="tip-title">${esc(t.title)}</div><p>${esc(t.text)}</p></div>`).join('');
 const keys=recent.fields||[];
 const rawFields=keys.length?`<details class="raw-fields"><summary>FACEIT’in döndürdüğü tüm maç başı alanlar (${keys.length})</summary><div class="field-chips">${keys.map(k=>`<span>${esc(k)}</span>`).join('')}</div></details>`:'<p class="empty">Maç başı detaylı istatistikler bu API anahtarı/oyuncu için gelmedi.</p>';
 const lifetimeEntries=Object.entries(life);
 const lifetimeHtml=lifetimeEntries.length?`<details class="raw-fields"><summary>Tüm kariyer istatistikleri (${lifetimeEntries.length})</summary><div class="lifetime-grid">${lifetimeEntries.map(([k,v])=>`<div><span>${esc(human(k))}</span><b>${esc(v)}</b></div>`).join('')}</div></details>`:'<p class="empty">FACEIT kariyer istatistiklerini döndürmedi.</p>';
 results.innerHTML=`<div class="profile">${avatar}<div><div class="player-name">${esc(p.nickname)}</div><div class="player-sub">${esc(p.country||'Ülke bilgisi yok')} · CS2 · veri alım: ${esc(new Date(d.retrieved_at).toLocaleString())}</div></div>${p.faceit_url?`<a class="profile-link" target="_blank" rel="noopener" href="${esc(p.faceit_url)}">FACEIT PROFİL ↗</a>`:''}</div><div class="metrics">${cards}</div><section class="card stats-card"><div class="section-kicker">SON MAÇ PERFORMANSI</div><h2>Maç başı istatistikler</h2><div class="metrics mini-metrics">${recentCards}</div><div class="charts">${lineChart(series.kd,'K/D trendi')}${lineChart(series.hs_percent,'HS oranı trendi','%')}${lineChart(series.adr,'ADR trendi')}</div>${rawFields}${lifetimeHtml}<p class="notice">${esc(recent.notice||'')} Geçmiş ELO noktaları API tarafından verilmediği için ELO çizgisi uydurulmaz; burada yalnızca güncel ELO gösterilir.</p></section><div class="columns"><section class="card"><div class="section-kicker">FACEIT MAÇ GEÇMİŞİ</div><h2>Son maçlar</h2>${matchHtml}</section><section class="card"><div class="section-kicker">KOÇ NOTLARI</div><h2>Veriye dayalı öneriler</h2>${tips}</section></div><p class="notice">${esc(d.notice)} Eksik alanlar tahmin edilmez. Maç detayları FACEIT’ten ayrıca yüklenir.</p>`;
 results.hidden=false;results.scrollIntoView({behavior:'smooth',block:'start'});
}
results.addEventListener('click',async e=>{
 const button=e.target.closest('.detail-button');if(!button)return;
 const matchId=button.dataset.match,box=button.parentElement.querySelector('.match-detail');
 if(!matchId||!box)return;
 if(!box.hidden){box.hidden=true;button.setAttribute('aria-expanded','false');button.textContent='Detay';return;}
 box.hidden=false;button.setAttribute('aria-expanded','true');button.textContent='Kapat';box.innerHTML='<span class="loading-inline">FACEIT maç detayı alınıyor…</span>';
 try{const res=await fetch(`/api/match/${encodeURIComponent(matchId)}`),data=await res.json();if(!res.ok)throw new Error(data.detail||'Maç detayı alınamadı.');
  const m=data.match||{},rounds=data.stats?.rounds||[],teams=m.teams||{},details=m.detailed_results||[];
  const teamHtml=Object.values(teams).map(t=>`<div class="detail-team"><b>${esc(t.nickname||t.name||'Takım')}</b><span>${(t.roster||t.players||[]).map(x=>esc(x.nickname)).join(', ')}</span></div>`).join('')||'<span>Takım kadrosu FACEIT tarafından paylaşılmadı.</span>';
  const statRows=rounds.flatMap(r=>{const ts=r.teams||[];return (Array.isArray(ts)?ts:Object.values(ts)).flatMap(t=>(t.players||[]).map(pl=>({nick:pl.nickname||pl.player_id,stats:pl.player_stats||pl.stats||{}})));});
  const statHtml=statRows.length?`<details><summary>Oyuncu istatistikleri (${statRows.length})</summary><div class="detail-table">${statRows.map(r=>`<div><b>${esc(r.nick)}</b><span>${Object.entries(r.stats).map(([k,v])=>`${esc(human(k))}: ${esc(v)}`).join(' · ')}</span></div>`).join('')}</div></details>`:'';
  const mapName=rounds.map(r=>r.round_stats?.Map||r.round_stats?.map||r.round_stats?.MapName).find(Boolean);
  const score=details.map(x=>Object.values(x.factions||{}).map(f=>f.score).join(' : ')).filter(Boolean).join(' / ')||Object.values(m.results?.score||{}).join(' : ');
  box.innerHTML=`<div class="detail-heading">${esc(m.competition_name||'FACEIT maçı')} ${m.status?`· ${esc(m.status)}`:''}</div>${mapName?`<div>Harita: ${esc(mapName)}</div>`:''}${score?`<div class="detail-score">${esc(score)}</div>`:''}<div class="detail-teams">${teamHtml}</div>${statHtml}<a href="${esc(m.faceit_url||`https://www.faceit.com/en/cs2/room/${encodeURIComponent(matchId)}`)}" target="_blank" rel="noopener">FACEIT’te aç ↗</a>`;
 }catch(err){box.innerHTML=`<span class="status error">${esc(err.message)}</span>`;}
});
form.addEventListener('submit',async e=>{e.preventDefault();const name=input.value.trim();if(!name)return;statusEl.className='status loading';statusEl.textContent='Oyuncu ve güncel FACEIT maç verileri getiriliyor…';results.hidden=true;form.querySelector('button').disabled=true;try{const res=await fetch(`/api/player/${encodeURIComponent(name)}?limit=20`);const data=await res.json();if(!res.ok)throw new Error(data.detail||'Oyuncu verisi alınamadı.');draw(data);statusEl.className='status';statusEl.textContent=`FACEIT canlı verisi alındı: ${data.player.nickname}.`;}catch(err){statusEl.className='status error';statusEl.textContent=err.message||'FACEIT verisi yüklenemedi.';}finally{form.querySelector('button').disabled=false;}});
