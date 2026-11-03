const assert=require('node:assert/strict');const M=require('../static/performance-model.js');
assert.equal(M.mean([null,undefined,'']),null);assert.equal(M.mean([0,10,null]),5);
assert.deepEqual(M.steam({matches:[{status:'failed',result:{kd:99}},{status:'complete',result:{map:'de_mirage',kd:0,hs_percent:null,adr:55}}]}).map(r=>[r.kd,r.hs]),[[0,null]]);
assert.equal(M.change([{kd:0},{kd:1}], 'kd'),null);
const c=M.change([1,1,1,2,2,2].map(kd=>({kd})),'kd');assert.equal(c.delta,1);assert.equal(c.size,3);
assert.equal(M.faceit([{stats:{'K/D Ratio':'1.2','Headshots %':'50%'}}])[0].hs,50);
assert.equal(M.faceit([{stats:{}}])[0].adr,null);
assert.equal(M.maps([{map:'de_mirage',kd:null},{map:'de_mirage',kd:2}])[0].kd,2);
console.log('PASS: missing metrics, zero values, window comparisons, FACEIT parsing, map aggregation');
