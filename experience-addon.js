/* Pigro Experience — independent front-end improvements inspired by Roby's and Miora.
   Local-only; no online purchase, customer accounts or fabricated revenue statistics. */
(function(root){
'use strict';
const FLAVORS={
  bold:['espresso','ristretto','lungo','americano','red-eye','black-eye','devil-eye','filter','v60','chemex','origami','aeropress','siphon','cold-brew','ice-americano','ice-espresso','turkish','turkish-double'],
  creamy:['latte','cappuccino','flat-white','cortado','iced-latte','pistachio','honey','snow','chai','ice-chai','sahlep','miel'],
  sweet:['caramel','flavor-latte','mocha','white-mocha','ice-mocha','ice-white','ice-caramel','ice-flavor','pistachio','hazelnut','crispy-caramel','tiramisu','raspberry','choco-shake','vanilla-shake','lychee','vanilla-rose','pecan','crispy-biscuit','maple'],
  fruity:['hibiscus','cool-lime','limonata','aroma-limonata','fruit-soda','frozen','bubble','lychee']
};
const COLD=new Set(['cold-brew','ice-americano','ice-espresso','ice-flavor','ice-mocha','ice-white','ice-caramel','iced-latte','ice-chai','hibiscus','cool-lime','limonata','aroma-limonata','soft-drinks','soda','fruit-soda','frozen','bubble','choco-shake','vanilla-shake']);
function recommend(menu,req){
  if(!Array.isArray(menu)||!req||!['any','hot','cold'].includes(req.temperature)||!Object.prototype.hasOwnProperty.call(FLAVORS,req.taste)||![0,130,220].includes(req.budget))return [];
  const chosen=new Set(FLAVORS[req.taste]);
  return menu.filter(p=>p&&chosen.has(p.id)&&Number.isSafeInteger(p.price)&&p.price>0&&(!req.budget||p.price<=req.budget)&&(req.temperature==='any'||(req.temperature==='cold')===COLD.has(p.id))).sort((a,b)=>a.price-b.price||a.id.localeCompare(b.id));
}
function atomicBundle(cart,bundle,menu,limit=50){
  if(!Array.isArray(cart)||!bundle||!Array.isArray(bundle.items)||!bundle.items.length||!Array.isArray(menu))return null;
  const priced=new Set(menu.filter(p=>p&&Number.isSafeInteger(p.price)&&p.price>0).map(p=>p.id));
  if(cart.some(x=>!x||!priced.has(x.id)||!Array.isArray(x.extras)||!Number.isSafeInteger(x.qty)||x.qty<1||x.qty>limit))return null;
  const next=cart.map(x=>({id:x.id,extras:[...x.extras],qty:x.qty}));
  for(const id of bundle.items){
    if(!priced.has(id))return null;
    let entry=next.find(x=>x.id===id&&x.extras.length===0);
    if(!entry){entry={id,extras:[],qty:0};next.push(entry);}
    if(entry.qty>=limit)return null;
    entry.qty++;
  }
  return next;
}
if(typeof module!=='undefined'&&module.exports)module.exports={recommend,atomicBundle};
if(typeof document==='undefined'||!document.querySelector('#menu')||typeof products==='undefined'||typeof state==='undefined')return;
const TEXT={
 ru:{kicker:'PIGRO / ПОДБОР ВКУСА',title:'Твой кофе за 3 шага',subtitle:'Подсказываем по твоим ответам, а не по выдуманному рейтингу продаж.',start:'Подобрать напиток',steps:['Горячий или холодный?','Какой вкус нравится?','Твой бюджет?'],temp:[['hot','Горячий'],['cold','Холодный'],['any','Неважно']],taste:[['bold','Крепкий'],['creamy','Нежный'],['sweet','Сладкий'],['fruity','Фруктовый']],budget:[['130','До 130 ₺'],['220','До 220 ₺'],['0','Без ограничений']],back:'Назад',again:'Начать заново',found:'Подходит к твоему вкусу',empty:'По этим условиям напитков не нашлось. Измени вкус или бюджет.',details:'Подробнее',add:'Добавить',note:'Это подбор по выбранным предпочтениям, а не рейтинг популярности. Изображения — концептуальные. Наличие и цены уточняй у бариста.',feed:'Лента',share:'Поделиться',copied:'Ссылка скопирована',fail:'Не удалось скопировать',invalid:'Нельзя добавить весь набор',photo:'Иллюстративное изображение'},
 tr:{kicker:'PIGRO / LEZZET REHBERİ',title:'3 adımda kahveni seç',subtitle:'Satış sıralaması değil, senin yanıtlarına göre seçilen içecekler.',start:'İçecek bul',steps:['Sıcak mı soğuk mu?','Nasıl bir tat?','Bütçen ne kadar?'],temp:[['hot','Sıcak'],['cold','Soğuk'],['any','Fark etmez']],taste:[['bold','Yoğun'],['creamy','Yumuşak'],['sweet','Tatlı'],['fruity','Meyveli']],budget:[['130','130 ₺ veya az'],['220','220 ₺ veya az'],['0','Sınır yok']],back:'Geri',again:'Yeniden başla',found:'Senin için seçtik',empty:'Bu seçeneklere uygun içecek yok. Bir tercihini değiştir.',details:'Detaylar',add:'Ekle',note:'Tercihlerine göre editoryal öneri. Fotoğraflar temsili. Fiyat ve stok için baristaya danışın.',feed:'Akış',share:'Paylaş',copied:'Bağlantı kopyalandı',fail:'Bağlantı kopyalanamadı',invalid:'İkili tamamen eklenemedi',photo:'Temsili içecek fotoğrafı'},
 en:{kicker:'PIGRO / TASTE GUIDE',title:'Your coffee in 3 steps',subtitle:'Suggestions based on your choices, not an invented sales ranking.',start:'Find my drink',steps:['Hot or cold?','Which flavor?','Your budget?'],temp:[['hot','Hot'],['cold','Cold'],['any','Either']],taste:[['bold','Bold'],['creamy','Creamy'],['sweet','Sweet'],['fruity','Fruity']],budget:[['130','Up to ₺130'],['220','Up to ₺220'],['0','No limit']],back:'Back',again:'Start again',found:'Matched to your taste',empty:'No items match these choices. Try another budget or flavor.',details:'Details',add:'Add',note:'Taste-based editorial suggestions, not a popularity ranking. Photos are illustrative. Confirm price and availability with the barista.',feed:'Feed',share:'Share',copied:'Link copied',fail:'Unable to copy link',invalid:'Unable to add the complete bundle',photo:'Illustrative drink image'}
};
const dict=()=>TEXT[TEXT[state.lang]?state.lang:'ru'];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const g={step:0,temperature:null,taste:null,budget:null};
const ids=new Set(products.map(p=>p.id));
function record(name,data={}){
 const allowed=['guide_answer','guide_results','guide_add','bundle_added','feed_selected','share_product','open_product','cart_open','add_to_cart','order_draft_copy'];
 if(!allowed.includes(name))return;
 try{const a=JSON.parse(sessionStorage.getItem('pigro.events.v1')||'[]');const events=Array.isArray(a)?a.slice(-98):[];
 events.push({name,time:new Date().toISOString(),locale:state.lang,productId:ids.has(data.productId)?data.productId:undefined,step:['temperature','taste','budget'].includes(data.step)?data.step:undefined});
 sessionStorage.setItem('pigro.events.v1',JSON.stringify(events));}catch{}
}
const section=document.createElement('section');
section.className='pigro-guide';section.id='taste-guide';section.setAttribute('aria-labelledby','taste-guide-title');
document.querySelector('.color-cats').insertAdjacentElement('afterend',section);
const view=document.querySelector('.view-switch');const feedBtn=document.createElement('button');
feedBtn.type='button';feedBtn.dataset.view='feed';feedBtn.setAttribute('aria-label',dict().feed);feedBtn.textContent='▤';view.append(feedBtn);
const originalRender=renderProducts;
renderProducts=function(){originalRender();document.querySelector('#catalog').classList.toggle('feed-mode',state.view==='feed');};
function buttonChoices(options,key){return '<div class="pigro-guide-options">'+options.map(([value,label])=>'<button type="button" class="pigro-guide-option" data-guide-value="'+safe(value)+'" data-guide-key="'+key+'">'+safe(label)+' <span aria-hidden="true">↗</span></button>').join('')+'</div>';}
function renderGuide(){
 const d=dict();const opts=g.step===0?d.temp:g.step===1?d.taste:d.budget;
 let body='';
 if(g.step<=2){body='<span class="pigro-guide-step">'+(g.step+1)+' / 3 · '+safe(d.steps[g.step])+'</span>'+buttonChoices(opts,['temperature','taste','budget'][g.step]);}
 else{
   const results=recommend(products,{temperature:g.temperature,taste:g.taste,budget:g.budget}).slice(0,3);
   body='<span class="pigro-guide-step">'+safe(d.found)+'</span>'+(results.length?'<div class="pigro-guide-results">'+results.map(p=>'<article class="pigro-guide-result"><img src="'+safe(image(p.img))+'" alt="'+safe(d.photo)+'" loading="lazy"><div class="pigro-guide-result-content"><strong>'+safe(itemName(p))+'</strong><span>'+money(p.price)+'</span><div class="pigro-guide-result-actions"><button type="button" data-guide-detail="'+safe(p.id)+'">'+safe(d.details)+'</button><button type="button" data-guide-add="'+safe(p.id)+'">'+safe(d.add)+' +</button></div></div></article>').join('')+'</div>':'<p class="pigro-guide-empty">'+safe(d.empty)+'</p>')+'<p class="pigro-guide-note">'+safe(d.note)+'</p>';
 }
 section.innerHTML='<div class="pigro-guide-top"><div><span class="pigro-guide-kicker">'+safe(d.kicker)+'</span><h2 id="taste-guide-title">'+safe(d.title)+'</h2><p>'+safe(d.subtitle)+'</p></div><span class="pigro-guide-mark" aria-hidden="true">☕</span></div><div class="pigro-guide-progress">'+[0,1,2].map(i=>'<span class="'+(g.step>=i?'active':'')+'"></span>').join('')+'</div>'+body+'<div class="pigro-guide-nav">'+(g.step>0?'<button type="button" data-guide-back>'+safe(g.step===3?d.again:d.back)+'</button>':'')+'</div>';
 feedBtn.setAttribute('aria-label',d.feed);
}
section.addEventListener('click',e=>{
 const choice=e.target.closest('[data-guide-value]');if(choice){const k=choice.dataset.guideKey,v=choice.dataset.guideValue;
 if(!['temperature','taste','budget'].includes(k))return;
 if(k==='budget')g.budget=Number(v);else g[k]=v;
 g.step=Math.min(3,g.step+1);record('guide_answer',{step:k});if(g.step===3)record('guide_results');renderGuide();return;}
 if(e.target.closest('[data-guide-back]')){g.step=g.step===3?0:g.step-1;renderGuide();return;}
 const detail=e.target.closest('[data-guide-detail]');if(detail&&ids.has(detail.dataset.guideDetail)){openProduct(detail.dataset.guideDetail);return;}
 const add=e.target.closest('[data-guide-add]');if(add&&ids.has(add.dataset.guideAdd)){addToCart(add.dataset.guideAdd);record('guide_add',{productId:add.dataset.guideAdd});}
});
const nativeOpenProduct=openProduct;
openProduct=function(id){
 nativeOpenProduct(id);
 if(!ids.has(id))return;
 const bottom=document.querySelector('#modalBody .modal-bottom');
 if(bottom&&!bottom.querySelector('[data-share-product]')){
 const btn=document.createElement('button');btn.type='button';btn.className='pigro-share';
 btn.dataset.shareProduct=id;btn.textContent='↗ '+dict().share;bottom.append(btn);}
 record('open_product',{productId:id});
};
async function shareProduct(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 const u=new URL(location.href);u.searchParams.set('product',id);u.hash='';
 try{
 if(navigator.share)await navigator.share({title:'Pigro Coffee Shop — '+itemName(p),url:u.toString()});
 else if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(u.toString());toast(dict().copied);}
 else{const t=document.createElement('textarea');t.value=u.toString();t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('Clipboard');toast(dict().copied);}
 record('share_product',{productId:id});
 }catch(e){if(e.name!=='AbortError')toast(dict().fail);}
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-share-product]');if(b&&ids.has(b.dataset.shareProduct))shareProduct(b.dataset.shareProduct);});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-bundle]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const bundle=bundles.find(x=>x.id===b.dataset.bundle);
 const next=atomicBundle(state.cart,bundle,products);
 if(!next){toast(dict().invalid);return;}
 state.cart=next;persistCart();openCart();record('bundle_added');
},true);
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-add]');if(b&&ids.has(b.dataset.add))record('add_to_cart',{productId:b.dataset.add});
 if(e.target.closest('#headerCart,#mobileCart'))record('cart_open');
 if(e.target.closest('#copyOrder'))record('order_draft_copy');
 const v=e.target.closest('[data-view="feed"]');if(v)record('feed_selected');
 const photo=e.target.closest('.product-img > img');if(photo){const btn=photo.closest('.product')?.querySelector('[data-detail]');if(btn&&ids.has(btn.dataset.detail)){e.preventDefault();e.stopImmediatePropagation();openProduct(btn.dataset.detail);}}
},true);
const lang=document.querySelector('#lang');lang.addEventListener('change',()=>queueMicrotask(()=>{renderGuide();}));
try{const search=new URL(location.href).searchParams;const req=search.get('product');const viewParam=search.get('view');if(viewParam==='feed'){state.view='feed';}if(req&&ids.has(req))setTimeout(()=>openProduct(req),60);}catch{}
renderGuide();renderProducts();
})(typeof globalThis==='undefined'?this:globalThis);
