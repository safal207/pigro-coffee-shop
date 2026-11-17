/* Real Chromium smoke journey for Pigro social menu.
   This test uses only local assets; it sends no order and posts no social events. */
const assert = require('node:assert/strict');
const {createServer} = require('node:http');
const {readFile,mkdir} = require('node:fs/promises');
const {resolve,sep,extname} = require('node:path');
const {chromium} = require('playwright-core');
const root = resolve(__dirname, '..');
const shotDir = resolve(process.env.RUNNER_TEMP || root,'pigro-qa');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml'};
const srv = createServer(async (req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);}catch{res.writeHead(400).end();return;}
 const path=resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 if(!(path===root||path.startsWith(root+sep))){res.writeHead(403).end();return;}
 try{const data=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-store'});res.end(data);}
 catch{res.writeHead(404).end('Not found');}
});
let browser;
(async()=>{
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+srv.address().port+'/';
 const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
 browser=await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 page.on('pageerror',err=>errors.push(err.message));
 let response=await page.goto(base,{waitUntil:'load',timeout:25000});
 assert.equal(response.status(),200);
 await page.locator('#pigro-stories .pigro-story').first().waitFor({timeout:15000});
 assert.ok(await page.locator('#pigro-stories .pigro-story').count()>=7,'stories cover real catalog');
 const noHoriz=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+3);
 assert.ok(noHoriz,'mobile site must not overflow viewport horizontally');
 await page.locator('[data-story="pistachio"]').click();
 await page.locator('#catalog.feed-mode .product[data-social-id="pistachio"]').waitFor();
 const product=page.locator('#catalog.feed-mode .product[data-social-id="pistachio"]');
 const like=product.locator('.pigro-rail [data-social-like]');
 assert.equal(await like.getAttribute('aria-pressed'),'false');
 await like.click();
 assert.equal(await like.getAttribute('aria-pressed'),'true');
 let likes=await page.evaluate(()=>JSON.parse(localStorage.getItem('pigro_social_likes_v1')||'[]'));
 assert.ok(likes.includes('pistachio'),'like persists locally');
 await product.locator('.pigro-rail [data-social-save]').click();
 assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('pigro_fav')||'[]'))).includes('pistachio'),'bookmark saves to favorites');
 await page.locator('#catalog.feed-mode .product[data-social-id="pistachio"] .pigro-rail [data-social-share]').click();
 assert.ok(await page.locator('.pigro-social-sheet').evaluate(el=>el.open),'share sheet opens');
 const share=await page.locator('#pigro-sheet-url').inputValue();
 assert.match(share,/view=feed/);
 assert.match(share,/product=pistachio/);
 assert.ok(!share.includes('token='),'share URL excludes token data');
 await page.locator('[data-social-close]').click();
 await page.locator('#catalog.feed-mode .product[data-social-id="pistachio"] .pigro-post-add').click();
 assert.equal((await page.locator('#headerCount').textContent()).trim(),'1','quick add updates shared cart');
 await page.locator('#headerCart').click();
 assert.ok(await page.locator('#cartDrawer').evaluate(el=>el.classList.contains('open')));
 await page.locator('#closeCart').click();
 await page.locator('[data-view="grid"]').click();
 assert.equal(await page.locator('#catalog.feed-mode').count(),0,'grid view remains available');
 assert.ok(await page.locator('#catalog .pigro-card-share').count()>0,'grid has share action');
 await page.locator('#lang').selectOption('tr');
 assert.ok((await page.locator('#pigro-stories h2').textContent()).includes('Günün tatları'),'social UI translated');
 await page.goto(base+'?product=pistachio&view=feed&lang=en',{waitUntil:'load'});
 await page.locator('#pigro-stories h2').waitFor();
 assert.ok((await page.locator('#pigro-stories h2').textContent()).includes('Today'),'shared links preserve language');
 assert.equal(await page.locator('#catalog .pigro-rail [data-social-like="pistachio"]').getAttribute('aria-pressed'),'true','like survives reload');
 await page.locator('#productModal.open').waitFor({timeout:5000});
 await page.keyboard.press('Escape');
 await mkdir(shotDir,{recursive:true});
 await page.screenshot({path:resolve(shotDir,'social-mobile.png'),fullPage:false});
 const desktop=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});
 const desktopPage=await desktop.newPage();
 desktopPage.on('pageerror',err=>errors.push(err.message));
 await desktopPage.goto(base+'?view=feed',{waitUntil:'load'});
 await desktopPage.locator('#catalog.feed-mode .pigro-rail').first().waitFor();
 const desktopOverflow=await desktopPage.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+3);
 assert.ok(desktopOverflow,'desktop width fits');
 await desktopPage.screenshot({path:resolve(shotDir,'social-desktop.png'),fullPage:false});
 await desktop.close();
 assert.deepEqual(errors,[],'no uncaught JavaScript errors');
 await context.close();
 console.log('PASS: social stories, like/save/share, CTA/cart, language, deep link, responsive Chromium');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();await new Promise(ok=>srv.close(ok));});
