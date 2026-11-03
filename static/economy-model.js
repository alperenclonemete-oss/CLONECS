(function(root){
 const prices={armor:650,helmet:1000,smoke:300,flash:200,molotov:400,incendiary:500,kit:400,ak:2700,m4:2900,galil:1800,famas:1950,mac10:1050,mp9:1250,p250:300};
 function calculate({side='T',money,round=2,loss=1400,force=false}){
  if(!['T','CT'].includes(side)||!Array.isArray(money)||money.length!==5||money.some(v=>!Number.isFinite(v)||v<0||v>16000)||!Number.isInteger(round)||round<1||round>24||![1400,1900,2400,2900,3400].includes(loss))throw Error('Beş oyuncu için 0–16000 arası bütçe ve geçerli round gir.');
  const pistol=round===1||round===13,last=round===12||round===24,rifle=side==='T'?'ak':'m4',small=side==='T'?'mac10':'mp9',fire=side==='T'?'molotov':'incendiary';
  const base=prices[rifle]+prices.helmet+prices.smoke+prices.flash;
  const full=money.every(v=>v>=base),mode=pistol?'Pistol':full?'Full buy':(force||last)?'Force buy':'Eco';
  const rows=money.map((cash,i)=>{let left=cash;const items=[];const buy=k=>{if(left>=prices[k]){left-=prices[k];items.push({key:k,cost:prices[k]});return true}return false};
   if(pistol){buy('armor');if(!items.length)buy('flash')}
   else if(full){buy(rifle);buy('helmet');buy('smoke');buy('flash');if(side==='CT'&&i<2)buy('kit');buy(fire)}
   else if(force||last){buy(cash>=prices[rifle]+prices.armor?rifle:cash>=prices[small]+prices.armor?small:'p250');buy('armor');if(side==='CT'&&i===0)buy('kit');buy('smoke');buy('flash')}
   else if(cash+loss-base>=prices.p250)buy('p250');
   return {items,spent:cash-left,left,nextLossBalance:Math.min(16000,left+loss)};
  });return {mode,rows,base,total:rows.reduce((n,r)=>n+r.spent,0)};
 }
 const api={prices,calculate};if(typeof module!=='undefined')module.exports=api;else root.Economy=api;
})(typeof window!=='undefined'?window:globalThis);
