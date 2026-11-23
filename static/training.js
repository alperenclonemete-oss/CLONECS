(() => {
  const catalog = window.LineupCatalog;
  const host = document.getElementById('trainingTab');
  const esc = catalog.esc;
  const routines = {
    warmup: {name:'Maç önü', steps:[
      ['aim','İlk mermi',5,'Bot veya DM’de 30 kontrollü tekli atış yap. Her denemede ateş etmeden önce tamamen dur.','servers'],
      ['utility','İki lineup',5,'Seçtiğin haritada iki atışı üçer kez tekrarla. Dumanın kapatması gereken açıyı kontrol et.','lineups'],
      ['review','Maç hedefi',5,'Son maçta tekrarlayan bir durumu bul. Bir sonraki maç için ölçebileceğin tek bir hedef yaz.','analysis'],
    ]},
    utility: {name:'Utility', steps:[
      ['select','Atışları seç',4,'Bir giriş smoke’u, bir destek flash’ı ve bir savunma atışı seç. Başlangıç ve düşüş yerlerini incele.','lineups'],
      ['reps','İsabet tekrarı',10,'Her atışı art arda üç kez tuttur. Kaçırdığında nişan, duruş ve hareketi tek tek kontrol et.','lineups'],
      ['call','Kullanım çağrısı',6,'Atışı kimin kullanacağını ve hangi çağrıyla giriş yapılacağını bir takım arkadaşına anlat.','tactics'],
    ]},
    team: {name:'Takım provası', steps:[
      ['setup','Rolleri dağıt',5,'Beş oyuncuya görev ver. İki hat varsa her hattın hazır olduğu anı çağıracak oyuncuyu seç.','tactics'],
      ['dry','Kuru prova',10,'Önce rakipsiz prova yap. İlk temas, takas ve destek arasındaki mesafeyi ayarla.','tactics'],
      ['live','Karşı baskı',10,'Erken temas veya eksik utility senaryosunu deneyin. Ne zaman duracağınızı ve ikinci planı çalışın.','servers'],
      ['review','Takım notu',5,'Herkes bir gözlem paylaşsın. Sonraki provada değiştireceğiniz tek ayrıntıyı yazın.','analysis'],
    ]},
  };
  let accountKey='', map='mirage', routine='warmup', log={}, timer=null;
  let previewRun=0;
  const dateKey=()=>new Date().toLocaleDateString('sv-SE');
  const plan=()=>routines[routine];
  const newEntry=()=>({done:[],note:''});
  const recordKey=()=>[dateKey(),map,routine].join(':');
  const entry=()=>log[recordKey()]||newEntry();
  const options=(values,active)=>Object.entries(values).map(([id,label])=>
    '<option value="'+esc(id)+'"'+(active===id?' selected':'')+'>'+esc(label)+'</option>').join('');

  function read(key){
    try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}
  }
  function restore(){
    const account=window.activeAccountData||{};
    const key=account.account_id?'clone-practice-v2:'+account.account_id:'';
    if(key===accountKey)return;
    accountKey=key;stopClock();
    const stored=key?read(key):null;
    map=catalog.maps[stored?.map]?stored.map:'mirage';
    routine=routines[stored?.routine]?stored.routine:'warmup';
    log=stored?.log&&typeof stored.log==='object'&&!Array.isArray(stored.log)?stored.log:{};
    if(!stored&&key){
      const legacy=read('clone-training-'+(account.steam_id||account.username));
      for(const id of Object.keys(catalog.maps)){
        const done=[['aim',0],['utility',1],['review',3]].filter(([,i])=>legacy?.[id+':'+i]).map(([step])=>step);
        if(done.length)log[[dateKey(),id,'warmup'].join(':')]={done,note:''};
      }
    }
  }
  function save(){
    const status=host.querySelector('#practiceStorageStatus');
    if(!accountKey){if(status)status.textContent='Kaydetmek için giriş yap.';return}
    try{
      const last=Object.fromEntries(Object.entries(log).sort(([a],[b])=>b.localeCompare(a)).slice(0,90));
      localStorage.setItem(accountKey,JSON.stringify({map,routine,log:last}));
      if(status)status.textContent='Bu cihazda kaydedildi.';
    }catch{if(status)status.textContent='Tarayıcı kayıt alanına erişilemedi.'}
  }
  function syncProgress(){
    const count=entry().done.length;
    host.querySelector('#practiceProgress').value=count;
    host.querySelector('#practiceCount').textContent=count+' / '+plan().steps.length;
  }
  function stopClock(){
    if(timer?.interval)clearInterval(timer.interval);
    timer=null;
  }
  function displayClock(){
    const output=host.querySelector('#practiceTimer');
    if(!output)return;
    if(!timer){output.hidden=true;return}
    const seconds=Math.max(0,Math.ceil((timer.ends-Date.now())/1000));
    output.hidden=false;
    output.querySelector('strong').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
    output.querySelector('span').textContent=seconds?timer.label:timer.label+' · Süre doldu';
    if(!seconds)clearInterval(timer.interval);
  }
  function render(){
    const selected=plan();
    const current=entry();
    const steps=selected.steps.map(([id,title,mins,copy,target])=>[
      '<article class="exercise-card"><div class="exercise-title"><h2>'+title+'</h2><span>'+mins+' dk</span></div>',
      '<p>'+copy+'</p><div class="exercise-actions"><button type="button" class="secondary" data-clock="'+id+'">Süreyi başlat</button>',
      '<button type="button" class="workspace-text-button" data-practice-go="'+target+'">'+({servers:'Sunucu seç',lineups:'Atışlara git',tactics:'Taktik seç',analysis:'Analizi aç'}[target])+'</button></div>',
      '<label class="practice-check"><input type="checkbox" data-complete="'+id+'"'+(current.done.includes(id)?' checked':'')+'>Tamamlandı</label></article>',
    ].join('')).join('');
    host.innerHTML='<div class="practice-workspace"><header class="workspace-heading"><div><h1>Antrenman</h1><p>Bir program seç, çalışmanı tamamla ve kısa bir not bırak.</p></div></header>'+
      '<div class="practice-controls"><label>Program<select id="practiceRoutine">'+options(Object.fromEntries(Object.entries(routines).map(([id,r])=>[id,r.name])),routine)+'</select></label>'+
      '<label>Harita<select id="practiceMap">'+options(catalog.maps,map)+'</select></label>'+
      '<div class="practice-meter"><span>'+selected.steps.reduce((sum,step)=>sum+step[2],0)+' dk · <b id="practiceCount"></b></span><progress id="practiceProgress" aria-label="Tamamlanan çalışmalar" max="'+selected.steps.length+'"></progress></div></div>'+
      '<aside id="practiceTimer" class="practice-timer" hidden><span></span><strong role="timer"></strong><button class="secondary" type="button" data-clock-stop>Durdur</button></aside>'+
      '<div class="exercise-grid">'+steps+'</div><section class="practice-supplement"><h2>'+esc(catalog.maps[map])+' atışları</h2><div id="practiceLineupSuggestions" class="practice-suggestions"></div></section>'+
      '<section class="practice-supplement"><label for="practiceNote">Çalışma notu</label><textarea id="practiceNote" rows="3" maxlength="500" placeholder="Bir sonraki maçta neyi tekrar edeceksin?">'+esc(current.note)+'</textarea>'+
      '<div class="exercise-actions"><button type="button" class="secondary" id="practiceSaveNote">Notu kaydet</button><span id="practiceStorageStatus" role="status"></span></div></section></div>';
    syncProgress();displayClock();
    const run=++previewRun;
    catalog.ready.then(()=>{
      if(run!==previewRun||!accountKey)return;
      const rows=catalog.read().maps[map]?.lineups||[];
      const favorites=read('clonecs-nade-favorites');
      const preferred=Array.isArray(favorites)?rows.filter(row=>favorites.includes(row.id)):[];
      const picks=[...new Map([...preferred,...rows].map(row=>[row.id,row])).values()].slice(0,3);
      host.querySelector('#practiceLineupSuggestions').innerHTML=picks.length?picks.map(row=>
        '<button type="button" class="secondary" data-practice-lineup="'+esc(row.id)+'">'+catalog.icon(row.type)+esc(row.title)+'</button>').join(''):'<p>Bu haritada kayıtlı atış yok.</p>';
    });
  }
  async function navigate(tab,id){
    await window.selectMainTab(tab);
    if(tab==='lineups')window.dispatchEvent(new CustomEvent('clone:nades:open',{detail:{map,id}}));
    if(tab==='tactics')window.dispatchEvent(new CustomEvent('clone:tactics:map',{detail:map}));
  }
  host.addEventListener('change',event=>{
    const control=event.target;
    if(control.id==='practiceMap'||control.id==='practiceRoutine'){
      if(control.id==='practiceMap'&&catalog.maps[control.value])map=control.value;
      if(control.id==='practiceRoutine'&&routines[control.value])routine=control.value;
      stopClock();render();save();host.querySelector('#'+control.id).focus();
    }else if(control.dataset.complete){
      const current=entry(),done=new Set(current.done);
      if(control.checked)done.add(control.dataset.complete);else done.delete(control.dataset.complete);
      log[recordKey()]={...current,done:[...done]};
      syncProgress();save();
    }
  });
  host.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.dataset.clock){
      const step=plan().steps.find(item=>item[0]===button.dataset.clock);
      if(!step)return;
      stopClock();
      timer={label:step[1],ends:Date.now()+step[2]*60000,interval:setInterval(displayClock,250)};
      displayClock();
    }else if(button.hasAttribute('data-clock-stop')){stopClock();displayClock()}
    else if(button.dataset.practiceLineup)navigate('lineups',button.dataset.practiceLineup);
    else if(button.dataset.practiceGo){
      const target=button.dataset.practiceGo;
      const account=window.activeAccountData||{};
      navigate(target==='analysis'?(account.faceit_nickname?'faceit':account.steam_id?'steam':'settings'):target);
    }else if(button.id==='practiceSaveNote'){
      log[recordKey()]={...entry(),note:host.querySelector('#practiceNote').value.trim()};
      save();
    }
  });
  window.addEventListener('clone:account-changed',restore);
  window.loadTraining=()=>{restore();render()};
})();
