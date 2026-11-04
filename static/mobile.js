(() => {
 const trigger=document.getElementById('mobileMenu'),nav=document.getElementById('appTabs');
 const media=matchMedia('(max-width:760px)');
 const shade=document.createElement('button');shade.className='mobile-menu-backdrop';shade.setAttribute('aria-label','Menüyü kapat');shade.tabIndex=-1;document.body.append(shade);
 function close(focus=false){document.body.classList.remove('mobile-menu-open');trigger.setAttribute('aria-expanded','false');if(focus)trigger.focus()}
 function open(){document.body.classList.add('mobile-menu-open');trigger.setAttribute('aria-expanded','true');requestAnimationFrame(()=>nav.querySelector('.app-tab[aria-selected=true]')?.focus())}
 trigger.onclick=()=>document.body.classList.contains('mobile-menu-open')?close(true):open();shade.onclick=()=>close(true);
 document.getElementById('sidebarToggle').addEventListener('click',e=>{if(media.matches){e.stopImmediatePropagation();close(true)}},true);
 nav.addEventListener('click',e=>{if(media.matches&&e.target.closest('.app-tab'))close(true)});
 document.addEventListener('keydown',e=>{
  if(!media.matches||!document.body.classList.contains('mobile-menu-open'))return;
  if(e.key==='Escape'){e.preventDefault();close(true)}
  if(e.key==='Tab'){const items=[...nav.querySelectorAll('button,a[href]')].filter(x=>x.getClientRects().length&&!x.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
 });
 media.addEventListener('change',()=>close());
 new MutationObserver(()=>{if(nav.hidden)close()}).observe(nav,{attributes:true,attributeFilter:['hidden']});
})();
