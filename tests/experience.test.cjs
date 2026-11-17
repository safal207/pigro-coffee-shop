const test=require('node:test');
const assert=require('node:assert/strict');
const {recommend,atomicBundle}=require('../experience-addon.js');
const menu=[
 {id:'espresso',price:80},{id:'latte',price:110},{id:'iced-latte',price:120},
 {id:'hibiscus',price:110},{id:'pistachio',price:240},{id:'bubble',price:150}
];
test('guided selection only uses actual menu matches and strict budget',()=>{
 assert.deepEqual(recommend(menu,{temperature:'hot',taste:'bold',budget:130}).map(p=>p.id),['espresso']);
 assert.deepEqual(recommend(menu,{temperature:'cold',taste:'creamy',budget:130}).map(p=>p.id),['iced-latte']);
 assert.deepEqual(recommend(menu,{temperature:'hot',taste:'fruity',budget:130}),[]);
 assert.deepEqual(recommend(menu,{temperature:'any',taste:'sweet',budget:130}),[]);
 assert.deepEqual(recommend(menu,{temperature:'any',taste:'creamy',budget:0}).map(p=>p.id),['latte','iced-latte','pistachio']);
 assert.deepEqual(recommend(menu,{temperature:'invalid',taste:'creamy',budget:0}),[]);
 assert.deepEqual(recommend(menu,{temperature:'any',taste:'creamy',budget:-1}),[]);
});
test('pairing is all-or-nothing and safe with capacity limits',()=>{
 const cart=[{id:'latte',extras:[],qty:2}],b={id:'sweet',items:['latte','hibiscus']};
 assert.deepEqual(atomicBundle(cart,b,menu),[{id:'latte',extras:[],qty:3},{id:'hibiscus',extras:[],qty:1}]);
 assert.equal(cart[0].qty,2,'original cart is unchanged');
 assert.equal(atomicBundle(cart,{items:['latte','missing']},menu),null);
 assert.equal(cart.length,1,'no partial cart commit');
 assert.equal(atomicBundle([{id:'latte',extras:[],qty:50}],b,menu),null);
 assert.equal(atomicBundle([{id:'latte',qty:1}],b,menu),null);
 assert.equal(atomicBundle([],null,menu),null);
});
test('external asset paths and views are present',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/experience-addon\.js/);
 assert.match(html,/experience-addon\.css/);
 assert.match(html,/assets\/pigro-sloth\.webp/);
 assert.doesNotMatch(html,/data:image\/webp;base64,/);
 for(const p of ['pigro-sloth.webp','cappuccino.webp','hibiscus.webp'])assert.ok(fs.statSync('assets/'+p).size>500,'missing asset '+p);
});
