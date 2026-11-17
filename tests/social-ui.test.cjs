const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {shareUrl,validSet,storyProducts}=require('../social-ui.js');

test('share links are safe, localized and contain no session or tracking tokens',()=>{
 const url=shareUrl('https://safal207.github.io/pigro-coffee-shop/?utm_source=private&token=secret#club','iced-latte','tr');
 const result=new URL(url);
 assert.equal(result.origin,'https://safal207.github.io');
 assert.equal(result.pathname,'/pigro-coffee-shop/');
 assert.equal(result.searchParams.get('product'),'iced-latte');
 assert.equal(result.searchParams.get('view'),'feed');
 assert.equal(result.searchParams.get('lang'),'tr');
 assert.equal(result.searchParams.has('utm_source'),false);
 assert.equal(result.searchParams.has('token'),false);
 assert.equal(result.hash,'');
 assert.equal(shareUrl('https://example.test/','../admin','en'),null);
 assert.equal(shareUrl('javascript:alert(1)','latte','en'),null);
 assert.equal(new URL(shareUrl('https://example.test/x?ref=1','latte','invalid')).searchParams.get('lang'),'tr');
});

test('user likes and views only accept known catalog IDs; no arbitrary personal fields',()=>{
 assert.deepEqual(validSet(['latte','latte','unknown','iced-latte',{email:'private@example.test'},null],new Set(['latte','iced-latte'])),['latte','iced-latte']);
 assert.deepEqual(validSet({user:'private'},new Set(['latte'])),[]);
 assert.deepEqual(validSet([],new Set(['latte'])),[]);
});

test('story cards resolve only real catalog items with verified positive prices',()=>{
 const menu=[{id:'latte',price:110},{id:'iced-latte',price:120},{id:'no-price'},{id:'no-stock',price:0}];
 assert.deepEqual(storyProducts(menu,['latte','invalid','no-price','latte','iced-latte','no-stock']).map(x=>x.id),['latte','iced-latte']);
});

test('social UI is wired after taste guide and retains catalog and cart',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const addon=fs.readFileSync('social-ui.js','utf8');
 const css=fs.readFileSync('social-ui.css','utf8');
 assert.match(html,/href="\.\/social-ui\.css"/);
 assert.match(html,/<script src="\.\/experience-addon\.js" defer><\/script><script src="\.\/social-ui\.js" defer><\/script>/);
 assert.match(addon,/data-social-share/);
 assert.match(addon,/data-social-like/);
 assert.match(addon,/data-social-save/);
 assert.match(addon,/data-social-next/);
 assert.match(addon,/IntersectionObserver/);
 assert.match(addon,/visibilityState === 'visible'/);
 assert.match(addon,/data-add/);
 assert.match(addon,/localStorage/);
 assert.doesNotMatch(addon,/https?:\/\/[^"']*tracking|external\s+metrics/i);
 assert.match(css,/min-height:48px/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(html,/function addToCart/);
 assert.match(html,/function renderCart/);
});
