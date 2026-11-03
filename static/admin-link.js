(() => {
 let pending=false;
 async function update(){
  if(pending)return;pending=true;
  try{const r=await fetch('/api/lineup-admin/access');const d=await r.json();let link=document.getElementById('lineupAdminLink');if(!d.admin){link?.remove();return;}if(!link){link=document.createElement('a');link.id='lineupAdminLink';link.href='/admin/lineups';link.textContent='Lineup yönetimi';link.className='secondary';document.getElementById('profileDropdown').append(link);}}
  catch{}finally{pending=false;}
 }
 document.getElementById('profileMenuButton')?.addEventListener('click',update);update();
})();
