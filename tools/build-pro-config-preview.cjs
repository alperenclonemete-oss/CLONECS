// Local-only visual fixture. Production serves /static, never /tests.
const fs=require('node:fs');
const mock=`<script>
const originalFetch=window.fetch.bind(window);
window.fetch=(url,options)=>{
 if(url==='/api/account')return Promise.resolve(Response.json({authenticated:true,username:'UI Test',persistent_storage:true}));
 if(url==='/api/account/favorites')return Promise.resolve(Response.json({items:[]}));
 if(url==='/api/pro-configs')return Promise.reject(new Error('Test: API unavailable; use local snapshot'));
 if(String(url).startsWith('/api/'))return Promise.resolve(Response.json({}));
 return originalFetch(url,options);
};
</script>`;
fs.writeFileSync('tests/pro-config-preview.html',fs.readFileSync('static/index.html','utf8').replace('</head>',mock+'</head>'));
console.log('Local fixture: /tests/pro-config-preview.html');
