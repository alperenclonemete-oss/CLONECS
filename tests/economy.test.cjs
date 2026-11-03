const assert=require('node:assert/strict'),{calculate}=require('../static/economy-model.js');
for(const side of ['T','CT'])for(const round of [1,2,12,13,24])for(const cash of [0,800,2000,4000,16000])for(const force of [false,true]){
 const r=calculate({side,round,money:Array(5).fill(cash),loss:1400,force});
 r.rows.forEach(p=>{assert.ok(p.left>=0);assert.equal(p.left+p.spent,cash);assert.ok(p.nextLossBalance<=16000);if(side==='T')assert.ok(!p.items.some(x=>x.key==='kit'||x.key==='incendiary'));});
}
assert.equal(calculate({money:[5000,5000,5000,5000,0]}).mode,'Eco');
assert.equal(calculate({money:Array(5).fill(5000)}).mode,'Full buy');
assert.throws(()=>calculate({money:[NaN,1,2,3,4]}));
assert.equal(calculate({money:Array(5).fill(800),round:13}).mode,'Pistol');
console.log('PASS: budgets, team affordability, pistol resets, force buys and side restrictions');
