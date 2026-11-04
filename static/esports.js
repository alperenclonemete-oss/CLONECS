(() => {
  const host = document.getElementById('esportsTab');
  if (!host) return;
  const E = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const list = v => Array.isArray(v) ? v : [];
  const id = v => Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : 0;
  const stamp = v => v && Number.isFinite(new Date(v).getTime()) ? new Date(v).toLocaleString(document.documentElement.lang || 'tr', {dateStyle:'medium',timeStyle:'short'}) : 'Saat açıklanmadı';
  const num = (v, digits=0) => typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '—';
  const badge = s => ({running:'Devam ediyor',not_started:'Planlandı',finished:'Tamamlandı',canceled:'İptal',postponed:'Ertelendi'})[s] || s || 'Belirsiz';
  const image = t => {try {const u=new URL(t.image_url);return u.protocol==='https:'?`<img src="${E(u.href)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}catch{return ''}};
  let view='running',page=1,token=0,loaded=0,detail=null,payload=null,rosterToken=0;
  host.innerHTML=`<section class="esports-shell"><header class="esports-heading"><div><div class="eyebrow">COUNTER-STRIKE / MATCH CENTER</div><h1>E-spor <span class="accent">merkezi</span></h1><p>Maçları takip et. Takımları tanı. Turnuvanın yolunu gör.</p></div><button data-refresh class="secondary">Yenile</button></header><nav class="esports-nav" aria-label="E-spor bölümleri">${[['running','Devam eden'],['upcoming','Takvim'],['past','Sonuçlar'],['tournaments','Turnuvalar']].map(([k,n])=>`<button data-view="${k}" aria-pressed="${k===view}">${n}</button>`).join('')}</nav><div class="esports-tools"><label>Bu sayfada ara<input data-search type="search" placeholder="Takım veya turnuva"></label><label data-phase-label hidden>Turnuva dönemi<select data-phase><option value="running">Devam eden</option><option value="upcoming">Yaklaşan</option><option value="past">Tamamlanan</option></select></label><span>Saatler cihazının yerel saatine göre.</span></div><p data-status role="status" aria-live="polite"></p><div data-content></div><nav data-pages class="esports-pages" aria-label="E-spor sayfaları"><button data-prev class="secondary">Önceki</button><span data-page></span><button data-next class="secondary">Sonraki</button></nav><p class="esports-footnote">Veri kaynağı: <a href="https://www.pandascore.co/" target="_blank" rel="noopener">PandaScore</a>. Devam eden maç listesi anlık round yayını değildir. Kapsam ve güncellenme sıklığı sağlayıcı planına bağlıdır. HLTV ile bağlantılı bir ürün değildir.</p></section>`;
  const $ = s => host.querySelector(s);
  const title = m => m.name || list(m.opponents).map(x=>x.opponent?.name).filter(Boolean).join(' vs ') || 'Eşleşme bekleniyor';
  function matchCard(m) {
    const opponents=list(m.opponents),scores=list(m.results);
    return `<article class="esports-card" id="bracket-${id(m.id)}"><div class="esports-card-top"><span class="esports-state ${m.status==='running'?'is-running':''}">${E(badge(m.status))}</span><span>${E(stamp(m.scheduled_at||m.begin_at))}</span></div><p>${E(m.league?.name||'')} ${E(m.serie?.full_name||m.serie?.name||'')} · ${E(m.tournament?.name||'')}</p>${opponents.length?opponents.map(({opponent:t})=>{t=t||{};const score=scores.find(x=>x.team_id===t.id||x.player_id===t.id)?.score;return `<div class="esports-opponent">${image(t)}<strong>${E(t.name||'TBD')}</strong><b>${num(score)}</b></div>`}).join(''):`<h3>${E(title(m))}</h3>`}<div class="esports-card-bottom"><span>${m.number_of_games?`BO${E(m.number_of_games)}`:'Format açıklanmadı'}</span><button data-match="${id(m.id)}" class="secondary">Maçı incele</button></div></article>`;
  }
  function tournamentCard(t) {
    return `<article class="esports-card"><div class="eyebrow">${E(t.league?.name||'TURNUVA')}</div><h2>${E(t.serie?.full_name||t.serie?.name||'')} ${E(t.name)}</h2><p>${E(stamp(t.begin_at))}</p><p>${E(t.tier?`Tier ${t.tier}`:'')} ${E(t.prizepool||'')}</p><button data-tournament="${id(t.id)}" class="secondary">Turnuvayı aç</button></article>`;
  }
  function notice(p) {
    $('[data-status]').textContent = p.status==='ok' ? `PandaScore · Son kontrol: ${stamp(p.updated_at*1000)}` : `${p.message||'Veri alınamadı.'}${p.stale?' Önceki veri gösteriliyor: '+stamp(p.updated_at*1000):''}`;
  }
  function renderList() {
    if(!payload||detail)return;
    notice(payload);
    const q=$('[data-search]').value.toLocaleLowerCase('tr'),rows=list(payload.data).filter(x=>`${title(x)} ${x.league?.name||''} ${x.serie?.full_name||''} ${x.tournament?.name||''}`.toLocaleLowerCase('tr').includes(q));
    $('[data-content]').innerHTML=rows.length?`<div class="esports-grid">${rows.map(view==='tournaments'?tournamentCard:matchCard).join('')}</div>`:`<div class="esports-empty"><h2>${payload.status==='setup'?'Maç merkezi hazırlanıyor':payload.status==='ok'?'Bu sayfada eşleşme yok':'Veri şu anda kullanılamıyor'}</h2><p>${E(payload.status==='setup'?'Veri bağlantısı açıldığında maçlar ve turnuvalar burada görünecek.':payload.message||'Aramayı veya dönemi değiştirebilirsin.')}</p></div>`;
    $('[data-page]').textContent=`Sayfa ${page}`;
    $('[data-prev]').disabled=page===1;
    $('[data-next]').disabled=!payload.has_more||payload.status!=='ok'||page>=20;
  }
  async function get(path) {
    const r=await fetch('/api/esports/'+path);if(!r.ok)throw Error('Veri şu anda alınamadı.');return r.json();
  }
  async function load() {
    const turn=++token;detail=null;loaded=Date.now();$('[data-pages]').hidden=false;$('[data-search]').disabled=false;
    $('[data-status]').textContent='Maç verileri yükleniyor…';$('[data-content]').innerHTML='';
    try {const p=await get(`${view==='tournaments'?'tournaments/'+$('[data-phase]').value:'matches/'+view}?page=${page}`);if(turn!==token)return;payload=p;renderList()}
    catch(e){if(turn===token){payload={status:'unavailable',data:[],message:e.message};renderList()}}
  }
  function playersTable(teams) {
    const rows=list(teams).flatMap(t=>list(t.players).map(p=>{const c=p.stats?.counts||{},a=p.stats?.per_game_averages||{};return `<tr><td>${E(p.name)}</td><td>${E(t.name)}</td><td>${num(c.kills)} / ${num(c.deaths)}</td><td>${num(a.adr,1)}</td><td>${num(a.hltv_game_rating,2)}</td></tr>`}));
    return rows.length?`<div class="esports-table"><table><thead><tr><th>Oyuncu</th><th>Takım</th><th>K / D</th><th>ADR</th><th>Oyun rating ort.</th></tr></thead><tbody>${rows.join('')}</tbody></table></div><p class="esports-footnote">Rating: PandaScore’un sağladığı oyun rating ortalaması. Eksik değerler — ile gösterilir; HLTV’nin güncel rating sürümü olduğu varsayılmaz.</p>`:'<p>Bu maç için oyuncu istatistiği yayımlanmamış.</p>';
  }
  function gamesView(games) {
    return list(games).length?`<div class="esports-grid">${games.map(g=>`<article class="esports-card"><h3>${E(g.map?.name||'Harita '+g.position)}</h3><p>${E(badge(g.status))}</p>${list(g.rounds_score).map(s=>`<div class="esports-opponent"><span>${E(list(g.teams).find(t=>t.id===s.team_id)?.name||'Takım '+s.team_id)}</span><b>${num(s.score)}</b></div>`).join('')||'<p>Round skoru sağlanmadı.</p>'}</article>`).join('')}</div>`:'<p>Harita sonuçları henüz yayımlanmadı.</p>';
  }
  function rosterView(data) {
    const rosters=list(data?.rosters||data);
    return rosters.length?`<div class="esports-grid">${rosters.map(t=>`<article class="esports-card"><div class="esports-opponent">${image(t)}<h3>${E(t.name||t.team?.name||'Takım')}</h3></div><ul>${list(t.players).map(p=>`<li>${E(p.name)} <small>${E(p.role||'')}</small></li>`).join('')||'<li>Kadro henüz sağlanmadı.</li>'}</ul></article>`).join('')}</div>`:'<p>Kadro verisi henüz sağlanmadı.</p>';
  }
  function bracketView(rows) {
    rows=list(rows);if(!rows.length)return '<p>Bu turnuvanın eşleşme ağacı henüz yayımlanmadı.</p>';
    const byId=new Map(rows.map(m=>[m.id,m])),memo=new Map();
    const depth=(m,seen=new Set())=>{if(memo.has(m.id))return memo.get(m.id);if(seen.has(m.id))return 0;const next=new Set(seen).add(m.id),parents=list(m.previous_matches).filter(p=>byId.has(p.match_id));const n=parents.length?Math.min(12,1+Math.max(...parents.map(p=>depth(byId.get(p.match_id),next)))):0;memo.set(m.id,n);return n};
    const groups=new Map();rows.forEach(m=>{const n=depth(m);if(!groups.has(n))groups.set(n,[]);groups.get(n).push(m)});
    return `<p>Eşleşmeler sağlayıcının önceki maç bağlantılarına göre sıralanır. Kazanan ve kaybeden yolları kartların altında belirtilir.</p><div class="esports-bracket">${[...groups].sort((a,b)=>a[0]-b[0]).map(([d,ms])=>`<section><h3>Aşama ${d+1}</h3>${ms.map(m=>matchCard(m)+`<div class="esports-origins">${list(m.previous_matches).map(p=>`${p.type==='loser'?'Kaybeden':'Kazanan'}: ${byId.has(p.match_id)?`<a href="#bracket-${id(p.match_id)}">${E(title(byId.get(p.match_id)))}</a>`:E('Maç #'+p.match_id)}`).join('<br>')}</div>`).join('')}</section>`).join('')}</div>`;
  }
  async function open(kind,itemId,section) {
    const turn=++token;detail={kind,id:itemId,section};$('[data-pages]').hidden=true;$('[data-search]').disabled=true;$('[data-status]').textContent='Ayrıntılar yükleniyor…';
    const opts=kind==='match'?[['details','Genel bakış'],['games','Harita sonuçları'],['stats','Oyuncu ratingleri']]:[['brackets','Eşleşme ağacı'],['rosters','Turnuva kadroları'],['matches','Maçlar']];
    $('[data-content]').innerHTML=`<button data-back class="secondary">← Listeye dön</button><h2>${kind==='match'?'Maç':'Turnuva'} #${itemId}</h2><nav class="esports-nav" aria-label="Ayrıntı bölümleri">${opts.map(([s,n])=>`<button data-section="${s}" aria-pressed="${s===section}">${n}</button>`).join('')}</nav><div data-detail></div>`;
    try {const p=await get(`${kind}/${itemId}/${section}`);if(turn!==token)return;notice(p);let html='';
      if(p.status!=='ok'&&!p.stale)html=`<div class="esports-empty"><p>${E(p.message)}</p></div>`;
      else if(section==='stats')html=playersTable(p.data?.teams);
      else if(section==='games')html=gamesView(p.data);
      else if(section==='rosters')html=rosterView(p.data);
      else if(section==='brackets')html=bracketView(p.data);
      else if(section==='matches')html=list(p.data).map(matchCard).join('')||'<p>Maçlar açıklanmadı.</p>';
      else {const m=p.data;html=`<h2>${E(title(m))}</h2>${matchCard(m)}<h3>Takımların güncel kadroları</h3><div class="esports-nav">${list(m.opponents).filter(x=>x.type==='Team').map(x=>`<button data-team="${id(x.opponent?.id)}">${E(x.opponent?.name)}</button>`).join('')}</div><div data-roster></div>${id(m.tournament_id)?`<button class="secondary" data-tournament="${id(m.tournament_id)}">Turnuvaya git</button>`:''}`}
      $('[data-detail]').innerHTML=html+(p.has_more?'<p>İlk 50 kayıt gösteriliyor; tam turnuva kapsamı henüz yüklenmedi.</p>':'');
    }catch(e){if(turn===token)$('[data-status]').textContent=e.message}
  }
  host.onclick=async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-view')){view=b.dataset.view;page=1;$('[data-search]').value='';$('[data-phase-label]').hidden=view!=='tournaments';host.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));load()}
    else if(b.hasAttribute('data-refresh'))detail?open(detail.kind,detail.id,detail.section):load();
    else if(b.hasAttribute('data-prev')){page=Math.max(1,page-1);load()}
    else if(b.hasAttribute('data-next')){page++;load()}
    else if(b.hasAttribute('data-back'))load();
    else if(id(b.dataset.match))open('match',id(b.dataset.match),'details');
    else if(id(b.dataset.tournament))open('tournament',id(b.dataset.tournament),'brackets');
    else if(b.dataset.section&&detail)open(detail.kind,detail.id,b.dataset.section);
    else if(id(b.dataset.team)){const turn=token,rosterTurn=++rosterToken,target=$('[data-roster]');target.textContent='Kadro yükleniyor…';try{const p=await get('team/'+id(b.dataset.team));if(turn===token&&rosterTurn===rosterToken)target.innerHTML=p.status==='ok'?rosterView([p.data]):`<p>${E(p.message)}</p>`}catch{if(turn===token&&rosterTurn===rosterToken)target.textContent='Kadro alınamadı.'}}
  };
  $('[data-search]').oninput=renderList;
  $('[data-phase]').onchange=()=>{page=1;load()};
  new MutationObserver(()=>{if(!host.hidden&&Date.now()-loaded>60000)load()}).observe(host,{attributes:true,attributeFilter:['hidden']});
  setInterval(()=>{if(!host.hidden&&!document.hidden&&!detail&&view==='running'&&Date.now()-loaded>60000)load()},60000);
})();
