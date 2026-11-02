// The text KV3 subset used by CS2's annotation exports. Never executes source text.
const fs=require('node:fs');
function parseKV3(text){
 const tokens=text.replace(/<!--[^]*?-->/g,'').replace(/\/\/[^\n]*/g,'').match(/"(?:\\.|[^"\\])*"|[{}\[\]=,]|[^\s{}\[\]=,]+/g)||[];
 let i=0;
 function value(){const t=tokens[i++];if(t==='{'){const o={};while(tokens[i]!=='}'){if(i>=tokens.length)throw Error('Unclosed object');const k=tokens[i++];if(tokens[i++]!=='=')throw Error('Expected =');o[k]=value()}i++;return o}if(t==='['){const a=[];while(tokens[i]!==']'){a.push(value());if(tokens[i]===',')i++;if(i>=tokens.length)throw Error('Unclosed array')}i++;return a}if(t?.startsWith('"'))return JSON.parse(t);if(t==='true'||t==='false')return t==='true';const n=Number(t);if(Number.isFinite(n))return n;throw Error('Unexpected token '+t)}
 const result=value();if(i!==tokens.length)throw Error('Trailing tokens');return result;
}
function overview(map){const text=fs.readFileSync(`data/lineup-sources/${map}-overview.txt`,'utf8');const get=k=>Number(text.match(new RegExp('"'+k+'"\\s+"([^" ]+)"'))?.[1]);return {x:get('pos_x'),y:get('pos_y'),scale:get('scale')};}
function project(p,o){return {x:+((p[0]-o.x)/(o.scale*1024)*100).toFixed(3),y:+((o.y-p[1])/(o.scale*1024)*100).toFixed(3)}}
module.exports={parseKV3,overview,project};
