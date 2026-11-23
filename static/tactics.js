(() => {
  const catalog=window.LineupCatalog;
  const esc=catalog.esc;
  const host=document.getElementById('tacticsTab');
  const plans=[
    {
      id:'mongolz-mirage-a',map:'mirage',side:'T',team:'The MongolZ',title:'A’ya yavaş split',
      match:'PARIVISION · 1win Private Club S2 · Harita 2, round 6',
      source:'https://www.cs2strat.com/articles/pSAvuYvQNKTcVMWKhBQu',
      observation:'Maç incelemesi Mirage’da A alanına gecikmeli ve iki hatlı bir giriş gösteriyor.',
      roles:['Mid giriş','Mid takas','Ramp giriş','Ramp destek','Bomba'],
      steps:[
        ['Alanı al','Bir grup Mid’de, diğeri A yaklaşımında beklesin. İki hat da güvenli konumunu bildirir.'],
        ['Çağrıyı eşleştir','Mid grubu yolu açınca A yaklaşımı aynı çağrıda ilerler. Takas oyuncuları birer adım arkada kalır.'],
        ['Plant sonrası','Bombayı güvenli açıdan kur. İki hat birbirini görecek şekilde çapraz oluşturur.'],
      ],
    },
    {
      id:'vitality-overpass-b',map:'overpass',side:'T',team:'Vitality',title:'B execute',
      match:'The MongolZ · BLAST Open Rotterdam 2026 · Harita 2, round 12',
      source:'https://www.cs2strat.com/articles/RVIKxO0FGntUlFtS9AYi',
      observation:'İncelenen round, Vitality’nin başlangıç düzeninden Overpass B alanına geçtiği bir execute.',
      roles:['Monster giriş','Monster takas','Short kontrol','Flash desteği','Bomba'],
      steps:[
        ['Hatları hazırla','Monster ve Short girişlerinde rakip teması olup olmadığını bildir. Çağrıdan önce yalnız çıkma.'],
        ['Girişi başlat','Desteğin flash çağrısından sonra iki hattı yürüt. İlk temasın ardından takım arkadaşı takasa hazır olsun.'],
        ['Alanı sabitle','Bomba oyuncusu güvenli kurulum ister. İki savunma açısı paylaş ve geri alma girişine karşı takas düzeni tut.'],
      ],
    },
    {
      id:'navi-inferno-banana',map:'inferno',side:'CT',team:'NAVI',title:'Banana’yı geri al',
      match:'Vitality · IEM Atlanta 2026 · Harita 3, round 6',
      source:'https://www.cs2strat.com/articles/bCjTiw0W3rK96QOfYpm5',
      observation:'Kaynak round, iki A ve üç B oyunculu CT dağılımıyla Banana’yı geri alma örneği.',
      roles:['Banana temas','Banana takas','Flash desteği','A tutuşu','A rotasyonu'],
      steps:[
        ['Teması bekle','B üçlüsü rakip utility’sini bildirir. A çifti kendi temasını ve rotasyon durumunu çağırır.'],
        ['Birlikte çık','Desteğin flash’ıyla iki oyuncu Banana’yı birlikte temizler. İkinci oyuncu takas mesafesini korur.'],
        ['Yeniden yerleş','Bilgi aldıktan sonra tek başına ileri gitme. A rotasyonunun gerekli olup olmadığına karar ver.'],
      ],
    },
    {
      id:'navi-anubis-water',map:'anubis',side:'CT',team:'NAVI',title:'Water kontrolü',
      match:'Vitality · BLAST Open Rotterdam 2026 · Harita 2, round 7',
      source:'https://www.cs2strat.com/articles/3zE3KIrvQSmCYUwgYw0w',
      observation:'Maç incelemesi NAVI’nin CT tarafında Anubis Water kontrolüne odaklanıyor.',
      roles:['Water temas','Water takas','Bilgi ve flash','A savunma','B savunma'],
      steps:[
        ['Bilgiyi paylaş','Water çifti ilk rakip sesini veya utility’sini bildirir. Site oyuncuları rotasyon için temas teyidi bekler.'],
        ['Teması takas et','İlk oyuncu göreceği açıyı söyler, ikinci oyuncu diğer açıyı kapatır. Baskı yüksekse birlikte çekil.'],
        ['Kararı ver','Water bilgisini A ve B’ye aktar. Site savunmacıları eldeki bilgiye göre açı veya rotasyon güncellesin.'],
      ],
    },
    {
      id:'mirage-b-split',map:'mirage',side:'T',title:'Short ve Apartments B split',
      observation:'Üç kişilik Short ve iki kişilik Apartments grubu aynı giriş çağrısını prova eder.',
      roles:['Short giriş','Short takas','Short destek','Apartments giriş','Apartments bomba'],
      steps:[['Hazırlık','İki grup kendi hattını güvenli hale getirir.'],['Eş zamanlı giriş','İki hazır çağrısından sonra birlikte çık ve takasını al.'],['Plant sonrası','Bombayı kur ve diğer hattı gören bir açı seç.']],
    },
    {
      id:'inferno-b-execute',map:'inferno',side:'T',title:'Banana’dan B execute',
      observation:'Banana kontrolünden sonra utility ve giriş çağrısı çalışılır.',
      roles:['Giriş','Takas','CT smoke','Coffins smoke','Bomba'],
      steps:[['Kontrol','Takım toplanmadan execute çağırma.'],['Utility ve giriş','İki smoke hazır çağrısını bekle ve flash sonrasında gir.'],['Plant sonrası','Plant bilgisini paylaş ve takas pozisyonlarına yerleş.']],
    },
  ];
  let filter='all', side='all', selected=plans[0], role=0, phase=0;
  host.innerHTML='<div class="tactics-workspace"><header class="workspace-heading"><div><h1>Takım taktikleri</h1><p>Profesyonel roundları incele ve takımınla prova et.</p></div></header><div class="tactics-filters"><label>Harita<select id="tacticMap"></select></label><label>Taraf<select id="tacticSide"><option value="all">Tümü</option><option value="T">T</option><option value="CT">CT</option></select></label></div><div id="tacticCards" class="tactics-catalog"></div><section id="tacticReading" class="tactic-detail"></section></div>';
  const cards=document.getElementById('tacticCards');
  const reading=document.getElementById('tacticReading');
  const mapInput=document.getElementById('tacticMap');
  const sideInput=document.getElementById('tacticSide');
  mapInput.innerHTML='<option value="all">Tüm haritalar</option>'+Object.entries(catalog.maps).map(([id,name])=>'<option value="'+id+'">'+esc(name)+'</option>').join('');

  function renderReading(){
    const existing=reading.querySelector('#tacticalBoard');
    const step=selected.steps[phase];
    reading.innerHTML='<div class="tactic-reading-head"><div><p class="workspace-meta">'+esc(catalog.maps[selected.map])+' · '+selected.side+(selected.team?' · '+esc(selected.team):' · Takım provası')+'</p><h2>'+esc(selected.title)+'</h2></div>'+
      (selected.source?'<a class="secondary" href="'+esc(selected.source)+'" target="_blank" rel="noopener noreferrer">Round kaynağı ↗</a>':'')+'</div>'+
      '<p>'+esc(selected.observation)+'</p>'+(selected.match?'<p class="workspace-meta">'+esc(selected.match)+'</p>':'')+
      '<h3>Prova görevleri</h3><div class="tactic-roles">'+selected.roles.map((name,index)=>'<button type="button" data-role="'+index+'" aria-pressed="'+(role===index)+'">'+esc(name)+'</button>').join('')+'</div>'+
      '<div class="tactic-phase"><p class="workspace-meta">Adım '+(phase+1)+' / '+selected.steps.length+'</p><h3>'+esc(step[0])+'</h3><p>'+esc(step[1])+'</p><p>Senin görevin: <b>'+esc(selected.roles[role])+'</b></p>'+
      '<div class="exercise-actions"><button class="secondary" type="button" data-step="-1" '+(phase===0?'disabled':'')+'>Önceki</button><button type="button" data-step="1" '+(phase===selected.steps.length-1?'disabled':'')+'>Sonraki</button></div></div>'+
      '<div class="exercise-actions"><button type="button" class="secondary" data-tactic-lineups>Bu haritanın lineupları</button><button type="button" class="workspace-text-button" data-tactic-training>Antrenmana dön</button></div>';
    if(existing)reading.append(existing);
  }
  function render(reset=false){
    const visible=plans.filter(plan=>(filter==='all'||plan.map===filter)&&(side==='all'||plan.side===side));
    if(!visible.includes(selected)&&visible.length){selected=visible[0];reset=true}
    cards.innerHTML=visible.map(plan=>'<button type="button" class="tactic-card" data-plan="'+plan.id+'" aria-pressed="'+(plan===selected)+'"><span>'+esc(catalog.maps[plan.map])+' · '+plan.side+'</span><b>'+esc(plan.title)+'</b><small>'+esc(plan.team||'Clone Lab provası')+'</small></button>').join('')||
      '<p class="workspace-empty">Bu seçimde taktik bulunamadı. Başka bir harita veya taraf seç.</p>';
    reading.hidden=!visible.length;
    if(!visible.length)return;
    if(reset){role=0;phase=0}
    renderReading();
    if(reset)window.dispatchEvent(new CustomEvent('clone:tactic-selected',{detail:selected}));
  }
  mapInput.onchange=()=>{filter=mapInput.value;render()};
  sideInput.onchange=()=>{side=sideInput.value;render()};
  window.addEventListener('clone:tactics:map',event=>{
    filter=catalog.maps[event.detail]?event.detail:'all';side='all';
    mapInput.value=filter;sideInput.value=side;render();
  });
  host.addEventListener('click',async event=>{
    const b=event.target.closest('button');
    if(!b)return;
    if(b.dataset.plan){selected=plans.find(plan=>plan.id===b.dataset.plan)||selected;render(true);cards.querySelector('[aria-pressed=true]')?.focus()}
    else if(b.dataset.role!==undefined){role=Number(b.dataset.role);renderReading();reading.querySelector('[data-role][aria-pressed=true]').focus()}
    else if(b.dataset.step){
      const direction=Number(b.dataset.step);
      phase=Math.max(0,Math.min(selected.steps.length-1,phase+direction));renderReading();
      reading.querySelector('[data-step="'+direction+'"]:not([disabled])')?.focus();
    }else if(b.hasAttribute('data-tactic-lineups')){
      await window.selectMainTab('lineups');
      window.dispatchEvent(new CustomEvent('clone:nades:open',{detail:{map:selected.map}}));
    }else if(b.hasAttribute('data-tactic-training'))await window.selectMainTab('training');
  });
  render();
  window.cloneTacticSelection=()=>selected;
})();
