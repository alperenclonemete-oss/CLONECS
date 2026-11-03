(()=>{
 if('serviceWorker' in navigator&&window.isSecureContext)navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
 let pending;const button=document.createElement('button');button.type='button';button.className='pwa-install secondary';button.textContent='Telefona / bilgisayara yükle';const hint=document.createElement('p');hint.className='notice';hint.hidden=true;
 document.getElementById('settingsContent').append(button,hint);
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pending=e});
 button.onclick=async()=>{if(pending){await pending.prompt();await pending.userChoice;pending=null}else{hint.hidden=false;hint.textContent='iPhone/iPad: Safari → Paylaş → Ana Ekrana Ekle. Android/masaüstü: tarayıcı menüsündeki Uygulamayı yükle veya Ana ekrana ekle seçeneğini kullan. Seçenek görünmüyorsa desteklenen tarayıcıda HTTPS üzerinden aç.'}};
 window.addEventListener('appinstalled',()=>{button.hidden=true;hint.hidden=false;hint.textContent='CLONE LAB yüklendi.'});
 if(matchMedia('(display-mode: standalone)').matches)button.hidden=true;
})();
