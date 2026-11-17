/* Pigro Social Menu v1
   Real catalog items only. Likes, saves and viewed flags are private to this device.
   No public counters, video playback, order submission or external event tracking. */
(function () {
'use strict';

function shareUrl(origin, id, locale) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(String(id || ''))) return null;
  let url;
  try { url = new URL(origin); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  url.search = '';
  url.hash = '';
  url.searchParams.set('view', 'feed');
  url.searchParams.set('product', id);
  url.searchParams.set('lang', ['ru', 'tr', 'en'].includes(locale) ? locale : 'tr');
  return url.toString();
}
function validSet(input, allowed) {
  if (!Array.isArray(input)) return [];
  const ids = new Set(allowed);
  return [...new Set(input.filter(id => typeof id === 'string' && ids.has(id)))].slice(0, 300);
}
function storyProducts(menu, featured) {
  if (!Array.isArray(menu) || !Array.isArray(featured)) return [];
  const index = new Map(menu.map(p => [p.id, p]));
  return [...new Set(featured)].map(id => index.get(id)).filter(p => p && Number.isSafeInteger(p.price) && p.price > 0);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { shareUrl, validSet, storyProducts };
}
if (typeof document === 'undefined' || typeof products === 'undefined' || typeof state === 'undefined' || !document.querySelector('#catalog')) return;

const localeCopy = {
  ru: {
    stories:'Вкусы дня', storiesNote:'Выбери фото и открой напиток',
    feed:'Фото-лента',grid:'Плитка',list:'Список',
    intro:'Смотри, листай, сохраняй и собирай свой заказ.', photo:'Фотография — иллюстрация, не видео',
    like:'Нравится', unlike:'Убрать лайк', saved:'Сохранить', unsave:'Убрать из сохранённого',
    share:'Поделиться', details:'Подробнее', add:'Добавить', seen:'Вы уже смотрели',
    prev:'Предыдущий напиток', next:'Следующий напиток', opening:'Открыть в ленте',
    shareTitle:'Поделиться напитком', shareHint:'Отправь ссылку другу. Он увидит этот напиток в меню Pigro.',
    native:'Поделиться через телефон', copy:'Копировать ссылку', copied:'Ссылка скопирована',
    copyFallback:'Выдели и скопируй ссылку вручную', close:'Закрыть', back:'Вернуться к меню',
    notice:'Лайки и просмотры видны только тебе на этом устройстве. Это фотографии, не ролики.',
    likeDone:'Добавлено в понравившиеся', likeGone:'Лайк убран', savedDone:'Сохранено на этом устройстве'
  },
  tr: {
    stories:'Günün tatları', storiesNote:'Fotoğraf seç, içeceği keşfet',
    feed:'Fotoğraf akışı',grid:'Kartlar',list:'Liste',
    intro:'Kaydır, beğen, kaydet ve sepetini oluştur.', photo:'Temsili fotoğraf, video değildir',
    like:'Beğen', unlike:'Beğeniyi kaldır', saved:'Kaydet', unsave:'Kaydı kaldır',
    share:'Paylaş', details:'Detaylar', add:'Ekle', seen:'Daha önce gördün',
    prev:'Önceki içecek', next:'Sonraki içecek', opening:'Akışta aç',
    shareTitle:'İçeceği paylaş', shareHint:'Bağlantıyı arkadaşınla paylaş. Bu ürünü Pigro menüsünde görsün.',
    native:'Telefonla paylaş', copy:'Bağlantıyı kopyala', copied:'Bağlantı kopyalandı',
    copyFallback:'Bağlantıyı seçip elle kopyala', close:'Kapat', back:'Menüye dön',
    notice:'Beğeni ve görüntülemeler yalnızca bu cihazda görünür. Bunlar video değil, fotoğraf.',
    likeDone:'Beğenildi', likeGone:'Beğeni kaldırıldı', savedDone:'Bu cihaza kaydedildi'
  },
  en: {
    stories:'Today’s tastes', storiesNote:'Pick a photo to discover a drink',
    feed:'Photo feed',grid:'Grid',list:'List',
    intro:'Swipe, like, save and build your basket.', photo:'Illustrative photo, not a video',
    like:'Like', unlike:'Unlike', saved:'Save', unsave:'Remove saved',
    share:'Share', details:'Details', add:'Add', seen:'You viewed this',
    prev:'Previous drink', next:'Next drink', opening:'Open in feed',
    shareTitle:'Share a drink', shareHint:'Send the link to a friend so they can explore this Pigro item.',
    native:'Share on your phone', copy:'Copy link', copied:'Link copied',
    copyFallback:'Select the link to copy it manually', close:'Close', back:'Back to menu',
    notice:'Likes and views are only visible to you on this device. These are photos, not videos.',
    likeDone:'Liked', likeGone:'Like removed', savedDone:'Saved on this device'
  }
};
const tr = () => localeCopy[state.lang] || localeCopy.ru;
const allowed = new Set(products.map(p => p.id));
const KEY_LIKES = 'pigro_social_likes_v1';
const KEY_SEEN = 'pigro_social_seen_v1';
function load(key) {
  try { return validSet(JSON.parse(localStorage.getItem(key) || '[]'), allowed); }
  catch { return []; }
}
function save(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* memory only */ }
}
let likes = new Set(load(KEY_LIKES));
let seen = new Set(load(KEY_SEEN));
let observer = null;
const pending = new Map();
let tap = null;
let tapTimer = null;
const icons = {
 heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.9a5.4 5.4 0 0 0-7.6 0L12 6.1l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.5a5.4 5.4 0 0 0 0-7.6Z"/></svg>',
 bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4-6 4Z"/></svg>',
 share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V3m0 0L7.2 7.8M12 3l4.8 4.8"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
 info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9v.1"/></svg>',
 arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
};
const pictures = ['pistachio','cappuccino','iced-latte','bubble','hibiscus','cool-lime','turkish','dessert','latte','choco-shake'];
const stories = document.createElement('section');
stories.id = 'pigro-stories'; stories.className = 'pigro-stories section-frame';
stories.setAttribute('aria-label', tr().stories);
document.querySelector('.color-cats').insertAdjacentElement('afterend', stories);
const intro = document.createElement('div');
intro.className = 'pigro-feed-intro'; intro.hidden = true;
document.querySelector('#catalog').insertAdjacentElement('beforebegin', intro);
const shareDialog = document.createElement('dialog');
shareDialog.className = 'pigro-social-sheet';
shareDialog.setAttribute('aria-labelledby', 'pigro-share-title');
shareDialog.innerHTML = '<div class="pigro-social-sheet-head"><div><span>PIGRO / SOCIAL</span><h2 id="pigro-share-title"></h2></div><button type="button" class="pigro-sheet-close" data-social-close aria-label="Close">×</button></div><div class="pigro-social-preview"><img id="pigro-sheet-image" alt=""><div><b id="pigro-sheet-product"></b><span id="pigro-sheet-price"></span></div></div><p id="pigro-sheet-hint"></p><label class="pigro-share-link"><span>URL</span><input type="text" id="pigro-sheet-url" readonly></label><div class="pigro-sheet-actions"><button type="button" data-social-native></button><button type="button" data-social-copy></button></div><div class="pigro-sheet-apps"><a id="pigro-sheet-whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp</a><a id="pigro-sheet-telegram" target="_blank" rel="noopener noreferrer">Telegram</a></div><p class="pigro-share-feedback" aria-live="polite" id="pigro-share-feedback"></p>';
document.body.appendChild(shareDialog);
let shareId = null;
function note(name, id) {
  if (!['social_like','social_save','social_share_open','social_share_copy','social_story_open','social_next','social_viewed'].includes(name) || !allowed.has(id)) return;
  try {
    const data = JSON.parse(sessionStorage.getItem('pigro.ui.events.v1') || '[]');
    const events = Array.isArray(data) ? data.slice(-98) : [];
    events.push({ event:name, productId:id, locale:state.lang, time:new Date().toISOString() });
    sessionStorage.setItem('pigro.ui.events.v1', JSON.stringify(events));
  } catch {}
}
function actionButton(icon, action, id, label, pressed) {
  const attr = pressed === undefined ? '' : ' aria-pressed="' + pressed + '"';
  return '<button type="button" class="pigro-rail-button" data-social-' + action + '="' + id + '" aria-label="' + escapeHTML(label) + '"' + attr + '>' + icons[icon] + '</button>';
}
function renderStories() {
  const copy = tr();
  const items = storyProducts(products, pictures);
  stories.setAttribute('aria-label', copy.stories);
  stories.innerHTML = '<div class="pigro-story-heading"><div><span>✳ PIGRO / STORIES</span><h2>' + escapeHTML(copy.stories) + '</h2><p>' + escapeHTML(copy.storiesNote) + '</p></div><button type="button" class="pigro-story-open" data-open-feed>' + escapeHTML(copy.feed) + ' ' + icons.arrow + '</button></div>' +
    '<div class="pigro-story-strip" role="group" aria-label="' + escapeHTML(copy.stories) + '">' + items.map(p =>
      '<button type="button" class="pigro-story" data-story="' + p.id + '" aria-label="' + escapeHTML(copy.opening + ': ' + itemName(p)) + '">' +
      '<span class="pigro-story-ring"><img src="' + image(p.img) + '" alt="" loading="lazy" width="80" height="80"></span>' +
      '<span class="pigro-story-name">' + escapeHTML(itemName(p)) + '</span></button>'
    ).join('') + '</div><p class="pigro-story-disclaimer">' + escapeHTML(copy.notice) + '</p>';
}
function syncLikes() {
  document.querySelectorAll('[data-social-like]').forEach(btn => {
    const liked = likes.has(btn.dataset.socialLike);
    btn.setAttribute('aria-pressed', String(liked));
    btn.setAttribute('aria-label', liked ? tr().unlike : tr().like);
  });
  document.querySelectorAll('[data-social-save]').forEach(btn => {
    const saved = state.fav.includes(btn.dataset.socialSave);
    btn.setAttribute('aria-pressed', String(saved));
    btn.setAttribute('aria-label', saved ? tr().unsave : tr().saved);
  });
}
function updateSeen() {
  document.querySelectorAll('[data-social-seen]').forEach(el => {
    const didSee = seen.has(el.dataset.socialSeen);
    el.hidden = !didSee;
    el.textContent = didSee ? '✓ ' + tr().seen : '';
  });
}
function disconnectViews() {
  if (observer) observer.disconnect();
  observer = null;
  for (const timeout of pending.values()) clearTimeout(timeout);
  pending.clear();
}
function watchVisible() {
  disconnectViews();
  if (state.view !== 'feed' || typeof IntersectionObserver === 'undefined') return;
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const id = entry.target.closest('[data-social-id]')?.dataset.socialId;
      if (!id || seen.has(id)) continue;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && document.visibilityState === 'visible' && !document.querySelector('.cart-drawer.open,.product-modal.open') && !shareDialog.open) {
        if (pending.has(id)) continue;
        const timeout = setTimeout(() => {
          pending.delete(id);
          if (!entry.target.isConnected || document.visibilityState !== 'visible' || !entry.target.complete || entry.target.naturalWidth === 0 || shareDialog.open || document.querySelector('.cart-drawer.open,.product-modal.open')) return;
          seen.add(id); save(KEY_SEEN, seen); updateSeen(); note('social_viewed', id);
        }, 1000);
        pending.set(id, timeout);
      } else if (pending.has(id)) {
        clearTimeout(pending.get(id)); pending.delete(id);
      }
    }
  }, {threshold:[0,0.5,1]});
  document.querySelectorAll('#catalog.feed-mode .product-img>img').forEach(img => observer.observe(img));
}
function decorate() {
  const copy = tr(), isFeed = state.view === 'feed';
  const catalog = document.querySelector('#catalog');
  const cards = [...catalog.querySelectorAll('.product')];
  document.querySelectorAll('.view-switch [data-view]').forEach(button => {
    const value = button.dataset.view;
    const label = copy[value] || value;
    button.dataset.uiLabel = label;
    button.title = label;
    button.setAttribute('aria-label', label);
  });
  intro.hidden = !isFeed;
  intro.innerHTML = isFeed ? '<span>PIGRO / SCROLL & TASTE</span><p>' + escapeHTML(copy.intro) + '</p><small>' + escapeHTML(copy.photo) + '</small>' : '';
  for (const card of cards) {
    const id = card.querySelector('[data-detail]')?.dataset.detail;
    if (!allowed.has(id)) continue;
    const p = product(id);
    card.dataset.socialId = id;
    const fav = card.querySelector('[data-fav]');
    if (fav) {
      fav.innerHTML = icons.bookmark;
      fav.title = state.fav.includes(id) ? copy.unsave : copy.saved;
      fav.setAttribute('aria-label', fav.title);
    }
    const actions = card.querySelector('.product-actions');
    if (actions && !actions.querySelector('[data-social-share]')) {
      const share = document.createElement('button');
      share.className = 'pigro-card-share';
      share.type = 'button';
      share.dataset.socialShare = id;
      share.innerHTML = icons.share;
      share.setAttribute('aria-label', copy.share + ': ' + itemName(p));
      actions.insertAdjacentElement('afterbegin', share);
    }
    if (!isFeed) continue;
    const media = card.querySelector('.product-img');
    if (!media) continue;
    const rail = document.createElement('div');
    rail.className = 'pigro-rail';
    rail.setAttribute('role','group');
    rail.setAttribute('aria-label', copy.share + ' / ' + copy.like + ' / ' + copy.saved);
    rail.innerHTML =
      actionButton('heart','like',id,likes.has(id)?copy.unlike:copy.like,likes.has(id)) +
      actionButton('bookmark','save',id,state.fav.includes(id)?copy.unsave:copy.saved,state.fav.includes(id)) +
      actionButton('share','share',id,copy.share) +
      actionButton('info','details',id,copy.details);
    media.append(rail);
    const seenFlag = document.createElement('span');
    seenFlag.className='pigro-seen';
    seenFlag.dataset.socialSeen=id;
    seenFlag.hidden = !seen.has(id);
    media.append(seenFlag);
    const bottom = card.querySelector('.product-body');
    if (bottom) {
      const cta = document.createElement('div');
      cta.className='pigro-post-actions';
      cta.innerHTML='<button type="button" class="pigro-post-add" data-add="' + id + '">' + escapeHTML(copy.add) + ' · ' + money(p.price) + ' ' + icons.arrow + '</button>' +
       '<button type="button" class="pigro-post-details" data-detail="' + id + '">' + escapeHTML(copy.details) + '</button>' +
       '<div class="pigro-post-nav"><button type="button" data-social-prev="' + id + '" aria-label="' + escapeHTML(copy.prev) + '">↑</button><button type="button" data-social-next="' + id + '" aria-label="' + escapeHTML(copy.next) + '">↓</button></div>';
      bottom.append(cta);
    }
  }
  syncLikes(); updateSeen(); watchVisible();
}
const oldRender = renderProducts;
renderProducts = function () { oldRender(); decorate(); };
const oldAll = renderAll;
renderAll = function () { oldAll(); renderStories(); };
function updateLike(id, onlyAdd) {
  if (!allowed.has(id)) return;
  const had = likes.has(id);
  if (onlyAdd && had) return;
  if (had) likes.delete(id); else likes.add(id);
  save(KEY_LIKES, likes);
  syncLikes();
  note('social_like', id);
  toast(had ? tr().likeGone : tr().likeDone);
  if (!had && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const photo = document.querySelector('[data-social-id="' + id + '"] .product-img');
    if (photo) { photo.classList.remove('pigro-heart-pop'); void photo.offsetWidth; photo.classList.add('pigro-heart-pop'); }
  }
}
function saveFavorite(id) {
  if (!allowed.has(id)) return;
  state.fav = state.fav.includes(id) ? state.fav.filter(x => x !== id) : [...state.fav, id];
  safelyWrite('pigro_fav', state.fav);
  renderProducts();
  note('social_save',id);
  if (state.fav.includes(id)) toast(tr().savedDone);
}
function enterFeed(id) {
  state.view = 'feed';
  state.category = 'all';
  state.search = ''; state.favoritesOnly = false; state.sort = 'featured';
  safelyWrite('pigro_view','feed');
  document.querySelector('#search').value = '';
  document.querySelector('#sort').value = 'featured';
  const index = products.findIndex(p => p.id === id);
  if (index >= 0) state.shown = Math.max(state.shown, Math.ceil((index + 1) / 12) * 12);
  renderProducts();
  const card = id ? document.querySelector('[data-social-id="' + id + '"]') : null;
  (card || document.querySelector('#menu')).scrollIntoView({behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth',block:'start'});
  if (id) note('social_story_open',id);
}
function moveFeed(id, delta) {
  const all = [...document.querySelectorAll('#catalog .product[data-social-id]')];
  const at = all.findIndex(c=>c.dataset.socialId===id);
  if (at < 0) return;
  const destination = all[at + delta];
  if (destination) { destination.scrollIntoView({behavior:'smooth',block:'start'}); note('social_next', destination.dataset.socialId); return; }
  if (delta > 0 && !document.querySelector('#moreBtn').hidden) {
    const more = document.querySelector('#moreBtn');
    more.click();
    requestAnimationFrame(() => {
      const appended = document.querySelectorAll('#catalog .product[data-social-id]');
      appended[at + 1]?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
}
// One tap from every product card: native Android/iOS share targets, no Pigro intermediary.
function openShare(id) {
  if (!allowed.has(id)) return;
  const p = product(id);
  const url = shareUrl(location.href, id, state.lang);
  if (!p || !url) return;
  const title = 'Pigro Coffee Shop — ' + itemName(p);
  note('social_share_open', id);
  if (typeof navigator.share === 'function') {
    try {
      // Must be invoked synchronously inside the click gesture on mobile browsers.
      Promise.resolve(navigator.share({title, url})).catch(error => {
        if (error && error.name === 'AbortError') return; // User dismissed OS share sheet.
        toast(state.lang === 'tr' ? 'Paylaşılamadı, tekrar deneyin' : state.lang === 'en' ? 'Unable to share, please try again' : 'Не удалось поделиться, попробуйте ещё раз');
      });
      return;
    } catch { /* Unsupported native handler: use the one-tap WhatsApp route. */ }
  }
  // No Web Share API (e.g. older browsers/desktop): open the social app directly.
  location.assign('https://wa.me/?text=' + encodeURIComponent(title + ' ' + url));
}
window.pigroShareDirect = openShare;
async function copyLink() {
  const input = document.querySelector('#pigro-sheet-url');
  const hint = document.querySelector('#pigro-share-feedback');
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(input.value);
    hint.textContent = tr().copied;
    if (shareId) note('social_share_copy',shareId);
  } catch {
    input.focus(); input.select();
    hint.textContent=tr().copyFallback;
  }
}
function cancelTap() { if (tapTimer) clearTimeout(tapTimer); tapTimer=null; tap=null; }
window.addEventListener('click', event => {
  const imageTarget = event.target.closest?.('#catalog.feed-mode .product-img > img');
  if (!imageTarget) return;
  const id = imageTarget.closest('[data-social-id]')?.dataset.socialId;
  if (!allowed.has(id)) return;
  event.preventDefault(); event.stopImmediatePropagation();
  const now = Date.now();
  if (tap && tap.id === id && now - tap.at < 320) {
    cancelTap(); updateLike(id,true);
  } else {
    cancelTap();
    tap = {id,at:now};
    tapTimer=setTimeout(() => {tap=null;tapTimer=null;openProduct(id);}, 310);
  }
},true);
window.addEventListener('dblclick', event => {
  if (event.target.closest?.('#catalog.feed-mode .product-img > img')) event.preventDefault();
},true);
document.addEventListener('click', e => {
  const like = e.target.closest('[data-social-like]');
  if (like) { e.preventDefault(); updateLike(like.dataset.socialLike,false); return; }
  const saved = e.target.closest('[data-social-save]');
  if (saved) { e.preventDefault(); saveFavorite(saved.dataset.socialSave); return; }
  const share = e.target.closest('[data-social-share]');
  if (share) { e.preventDefault(); openShare(share.dataset.socialShare); return; }
  const detail = e.target.closest('[data-social-details]');
  if (detail) { e.preventDefault(); openProduct(detail.dataset.socialDetails); return; }
  const story = e.target.closest('[data-story]');
  if (story) { e.preventDefault(); enterFeed(story.dataset.story); return; }
  if (e.target.closest('[data-open-feed]')) { e.preventDefault(); enterFeed(null); return; }
  const prev = e.target.closest('[data-social-prev]'), next = e.target.closest('[data-social-next]');
  if (prev || next) { e.preventDefault(); moveFeed((prev||next).dataset[prev?'socialPrev':'socialNext'],prev?-1:1); }
});
shareDialog.addEventListener('click',e=>{
  if (e.target.closest('[data-social-close]')) shareDialog.close();
  if (e.target.closest('[data-social-copy]')) copyLink();
  if (e.target.closest('[data-social-native]') && shareId && navigator.share) {
    const p=product(shareId);
    navigator.share({title:'Pigro Coffee Shop — '+itemName(p),url:shareUrl(location.href,shareId,state.lang)}).catch(()=>{});
  }
});
shareDialog.addEventListener('close',()=>{shareId=null;});
document.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (state.view !== 'feed' || shareDialog.open || document.querySelector('.cart-drawer.open,.product-modal.open') || e.target.closest('input,textarea,select,button,[contenteditable]')) return;
  const cards=[...document.querySelectorAll('#catalog .product[data-social-id]')];
  if (!cards.length) return;
  const targetY=window.innerHeight*0.35;
  let closest=0, distance=Infinity;
  for(let i=0;i<cards.length;i++){const d=Math.abs(cards[i].getBoundingClientRect().top-targetY);if(d<distance){closest=i;distance=d;}}
  e.preventDefault();
  moveFeed(cards[closest].dataset.socialId,e.key==='ArrowDown'?1:-1);
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')disconnectViews();else watchVisible();});
window.addEventListener('storage', e=>{
  if(e.key===KEY_LIKES){likes=new Set(load(KEY_LIKES));syncLikes();}
  if(e.key===KEY_SEEN){seen=new Set(load(KEY_SEEN));updateSeen();}
  if(e.key==='pigro_fav'){state.fav=validSet(safelyRead('pigro_fav',[]),allowed);renderProducts();}
});
document.querySelector('#lang').addEventListener('change',()=>queueMicrotask(()=>{renderStories();renderProducts();}));
try {
  const requested = new URL(location.href).searchParams.get('lang');
  if (['ru','tr','en'].includes(requested) && requested !== state.lang) {
    state.lang = requested;
    safelyWrite('pigro_lang', requested);
    translate();
    renderCart();
    renderBundles();
  }
} catch {}
renderStories();
renderProducts();
})();