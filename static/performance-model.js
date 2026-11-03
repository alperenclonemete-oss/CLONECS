/* Shared performance calculations: missing data stays missing, never zero-filled. */
((root)=>{
 const num=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
 const mean=values=>{const a=values.map(num).filter(v=>v!==null);return a.length?a.reduce((s,v)=>s+v,0)/a.length:null};
 const stats=(row,keys)=>{for(const k of keys){const v=num(String(row[k]??'').replace('%','').replace(',','.'));if(v!==null)return v}return null};
 function steam(data){return (data.matches||[]).filter(m=>m.status==='complete'&&m.result).map(m=>({...m.result,hs:num(m.result.hs_percent),kd:num(m.result.kd),adr:num(m.result.adr)})).reverse();}
 function faceit(items){return (items||[]).slice(0,30).map(m=>{const s=m.stats||{};return {map:m.map||s.Map||'Bilinmiyor',kd:stats(s,['K/D Ratio','K/D','KD Ratio']),hs:stats(s,['Headshots %','Headshot %','HS %']),adr:stats(s,['ADR','Average Damage per Round']),kills:stats(s,['Kills']),deaths:stats(s,['Deaths']),finished_at:m.finished_at};}).reverse();}
 function maps(rows){const buckets=new Map();for(const r of rows){const key=r.map||'Bilinmiyor';if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(r)}return [...buckets].map(([map,rows])=>({map,count:rows.length,kd:mean(rows.map(r=>r.kd)),adr:mean(rows.map(r=>r.adr)),hs:mean(rows.map(r=>r.hs))})).sort((a,b)=>b.count-a.count);}
 function change(rows,key){const a=rows.map(r=>num(r[key])).filter(v=>v!==null);if(a.length<6)return null;const size=Math.min(5,Math.floor(a.length/2));const previous=mean(a.slice(-size*2,-size)),recent=mean(a.slice(-size));return {previous,recent,delta:recent-previous,size};}
 const model={num,mean,steam,faceit,maps,change};if(typeof module!=='undefined')module.exports=model;else root.PerformanceModel=model;
})(typeof window==='undefined'?{}:window);
