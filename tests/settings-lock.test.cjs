const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/popup/popup.js', 'utf8');
const flush = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
function fixture({duration=5, local={}, now=1000000, hide=false, failure='', reduced=false}={}) {
  let time=now, id=0;
  const timers=new Map(), frames=new Map(), listeners=new Map(), elements=new Map();
  const add=(k,f)=>{if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(f);};
  const remove=(k,f)=>{listeners.get(k)?.delete(f);if(!listeners.get(k)?.size)listeners.delete(k);};
  let focused=true;
  const document={activeElement:null,hidden:false,hasFocus:()=>focused,addEventListener:add,removeEventListener:remove,querySelector:()=>container,querySelectorAll:()=>[],getElementById:k=>elements.get(k)};
  function element(id) {
    const classes=new Set(), attrs={};
    const el={id,dataset:{},hidden:false,inert:true,textContent:'',attrs,
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},
      focus(){document.activeElement=el;},blur(){document.activeElement=null;},contains:t=>t===el,setAttribute(k,v){attrs[k]=v;}};
    elements.set(id,el);return el;
  }
  const overlay=element('settingsLockOverlay'), menu=element('menuButton'),container=element('container');
  container.children=[overlay,menu];container.classList.add('settings-lock-checking');
  for(const key of ['settingsLockTitle','settingsLockSubtitle','settingsLockCountdown','settingsLockTimer','settingsLockProgress','settingsLockFooter'])element(key);
  const browser={runtime:{getManifest:()=>({version:"9.8.7"})},storage:{}};
  for(const area of ['sync','local']) browser.storage[area]={
    get(key,cb){
      if(failure==='timeout')return;
      if(failure==='throw')throw Error('unavailable');
      if(failure==='read'){browser.runtime.lastError={message:'unavailable'};cb();delete browser.runtime.lastError;return;}
      cb(area==='sync'?{settingsLockDuration:duration,settingsLockHideCountdown:hide}:local);
    },
    set(value,cb){if(failure==='write')browser.runtime.lastError={message:'unavailable'};else Object.assign(local,value);cb();delete browser.runtime.lastError;},
    remove(key,cb){if(failure==='remove')browser.runtime.lastError={message:'unavailable'};else delete local[key];cb();delete browser.runtime.lastError;},
  };
  const context=vm.createContext({document,browser,console,Date:{now:()=>time},
    window:{matchMedia:()=>({matches:reduced}),addEventListener:add,removeEventListener:remove},
    setTimeout(fn){timers.set(++id,fn);return id;},clearTimeout:k=>timers.delete(k),
    requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame:k=>frames.delete(k),
  });
  vm.runInContext(source,context);
  return {elements,menu,container,local,frames,listeners,browser,
    version:()=>{context.displayVersion();return container;},
    lifecycle:()=>context.setupSettingsLockLifecycle(),
    apply:value=>context.applySettingsLockDuration(value),
    duration:()=>vm.runInContext("currentSettingsLockDuration",context),
    visible(value){document.hidden=!value;focused=value;},
    focused(value){focused=value;},
    start:()=>context.setupSettingsLock(),
    input:k=>[...(listeners.get(k)||[])].forEach(fn=>fn()),
    timeout:()=>[...timers.values()][0](),
    async advance(ms){time+=ms;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn());await flush();},
    active:()=>document.activeElement,
  };
}
test('popup sections start inert before script execution',()=>{
 const html=fs.readFileSync('src/popup/popup.html','utf8');
 for(const cls of ['popup-header','settings-menu','settings-scroll-area','disabled-message','sponsor-page','popup-footer'])assert.match(html,new RegExp('<div inert class="'+cls+'"'));
 assert.doesNotMatch(html,/settings-lock-icon|settingsLockRetry/);
});
test('off and invalid preferences unlock without creating an active deadline',async()=>{
 for(const duration of [0,999]){const f=fixture({duration});const pending=f.start();assert.equal(f.menu.inert,true);await pending;assert.equal(f.menu.inert,false);assert.equal(f.local.settingsLockState,undefined);}
});
for(const hide of [true,false])test(`deadline controls automatic unlock; hidden=${hide}`,async()=>{
 const f=fixture({hide});await f.start();
 assert.equal(f.elements.get('settingsLockTimer').hidden,hide);
 assert.equal(f.elements.get('settingsLockCountdown').textContent,'5');
 assert.equal(Number(f.elements.get('settingsLockProgress').attrs['stroke-dashoffset']),0);
 f.input('keydown');await f.advance(2500);
 assert.equal(f.elements.get('settingsLockCountdown').textContent,'3');
 assert.equal(Number(f.elements.get('settingsLockProgress').attrs['stroke-dashoffset']),-40);
 assert.equal(f.menu.inert,true);
 await f.advance(2499);assert.equal(f.menu.inert,true);
 await f.advance(1);assert.equal(f.menu.inert,false);
 assert.equal(Number(f.elements.get('settingsLockProgress').attrs['stroke-dashoffset']),-100);
 assert.equal(f.container.classList.contains('settings-locked'),false);
 assert.equal(f.active(),f.menu);assert.equal(f.frames.size,0);
 assert.equal(f.listeners.has('keydown'),false);assert.equal(f.local.settingsLockState,undefined);
});
test('closing cleans up frames and reopening starts the full duration',async()=>{
 const local={};const first=fixture({duration:300,local});await first.start();
 await first.advance(2000);assert.equal(first.elements.get('settingsLockCountdown').textContent,'298');
 first.input('pagehide');assert.equal(first.frames.size,0);assert.equal(first.listeners.has('keydown'),false);
 const reopened=fixture({duration:300,local,now:1002000});await reopened.start();
 assert.equal(reopened.elements.get('settingsLockCountdown').textContent,'300');
 assert.equal(Number(reopened.elements.get('settingsLockProgress').attrs['stroke-dashoffset']),0);
});
test('obsolete persisted deadlines cannot resume a previous wait',async()=>{
 for(const expiresAt of [999999,1004000]){
  const f=fixture({local:{settingsLockState:{expiresAt,duration:5}}});await f.start();
  assert.equal(f.menu.inert,true);assert.equal(f.elements.get('settingsLockCountdown').textContent,'5');
 }
});
test('suspension catches up to the deadline on the next frame',async()=>{
 const f=fixture();await f.start();await f.advance(60000);
 assert.equal(f.menu.inert,false);assert.equal(f.elements.get('settingsLockCountdown').textContent,'0');
});
test('clock rollback cannot unlock before the stored expiry',async()=>{
 const f=fixture();await f.start();await f.advance(-10000);assert.equal(f.menu.inert,true);await f.advance(15000);assert.equal(f.menu.inert,false);
});
test('ring updates only with the numeric second, including reduced motion',async()=>{
 const f=fixture({reduced:true});await f.start();await f.advance(100);
 const offset=f.elements.get('settingsLockProgress').attrs['stroke-dashoffset'];await f.advance(100);assert.equal(f.elements.get('settingsLockProgress').attrs['stroke-dashoffset'],offset);
 await f.advance(800);assert.notEqual(f.elements.get('settingsLockProgress').attrs['stroke-dashoffset'],offset);
});
for(const failure of ['read','throw'])test(`storage ${failure} failure keeps settings blocked`,async()=>{
 const f=fixture({failure});await f.start();
 assert.equal(f.menu.inert,true);assert.equal(f.elements.get('settingsLockTimer').hidden,true);
 assert.equal(f.elements.get('settingsLockTitle').dataset.i18nKey,'settingsLock.errorTitle');
});
test('stalled storage exposes a readable recovery message',async()=>{
 const f=fixture({failure:'timeout'});f.start();f.timeout();assert.equal(f.menu.inert,true);assert.equal(f.container.classList.contains('settings-lock-checking'),false);
});
test('mouse users do not receive an unexpected focus ring after unlocking',async()=>{
 const f=fixture();await f.start();await f.advance(5000);assert.equal(f.active(),null);
});

test('ten-second ring loses exactly one tenth per second without intermediate motion',async()=>{
 const f=fixture({duration:10});await f.start();
 for(let second=1;second<=10;second++){
  const progress=f.elements.get('settingsLockProgress');
  const previous=progress.attrs['stroke-dashoffset'];
  await f.advance(999);assert.equal(progress.attrs['stroke-dashoffset'],previous);
  await f.advance(1);assert.equal(Number(progress.attrs['stroke-dashoffset']),-10*second);
  assert.equal(f.elements.get('settingsLockCountdown').textContent,String(10-second));
 }
 assert.equal(f.menu.inert,false);
});

test('preloaded unfocused popup does not spend its countdown before opening',async()=>{
 const f=fixture();f.focused(false);f.lifecycle();await flush();await f.advance(60000);
 assert.equal(f.menu.inert,true);assert.equal(f.frames.size,0);
 f.focused(true);f.input('focus');await flush();assert.equal(f.elements.get('settingsLockCountdown').textContent,'5');
 await f.advance(4999);assert.equal(f.menu.inert,true);await f.advance(1);assert.equal(f.menu.inert,false);
});
test('a previously unlocked reused popup locks again on every reopening',async()=>{
 const f=fixture();f.lifecycle();await flush();await f.advance(5000);assert.equal(f.menu.inert,false);
 for(let i=0;i<3;i++){
  f.visible(false);f.input('visibilitychange');assert.equal(f.menu.inert,true);
  f.visible(true);f.input('visibilitychange');f.input('focus');await flush();
  assert.equal(f.elements.get('settingsLockCountdown').textContent,'5');assert.equal(f.menu.inert,true);
  await f.advance(5000);assert.equal(f.menu.inert,false);
 }
});
test('late storage callback from a closed popup cannot unlock a new opening',async()=>{
 const f=fixture(),pending=[];f.browser.storage.sync.get=(keys,cb)=>pending.push(cb);
 f.lifecycle();f.focused(false);f.input('blur');f.focused(true);f.input('focus');
 pending[0]({settingsLockDuration:0});await flush();assert.equal(f.menu.inert,true);
 pending[1]({settingsLockDuration:5});await flush();assert.equal(f.elements.get('settingsLockCountdown').textContent,'5');assert.equal(f.menu.inert,true);
});

test('timer selection is shown as enabled only after storage confirms the save',()=>{
 const f=fixture();let saved;
 f.browser.storage.sync.set=(value,callback)=>{saved=callback;};f.apply(15);assert.equal(f.duration(),0);
 saved();assert.equal(f.duration(),15);
 f.apply(30);f.browser.runtime.lastError={message:'quota exceeded'};saved();delete f.browser.runtime.lastError;
 assert.equal(f.duration(),15);
});

test('popup version and accessibility label come from the manifest',()=>{
 const f=fixture(),label=f.version();assert.equal(label.textContent,'v.9.8.7');assert.equal(label.attrs['aria-label'],'Version 9.8.7');
});
