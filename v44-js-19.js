
(function(){'use strict';
function fa4(){return typeof LANG==='undefined'||LANG==='fa'}
function tx4(a,b){return fa4()?a:b}
function esc4(x){var d=document.createElement('div');d.textContent=String(x==null?'':x);return d.innerHTML}
function fnLiveRequestExit(){var message=tx4('آیا مطمئنید می‌خواهید پخش متوقف و از بخش Live خارج شوید؟','Are you sure you want to stop playback and leave Live TV?');if(window.confirm(message)){if(window.fnLiveClosePlayer)window.fnLiveClosePlayer();if(typeof switchTab==='function')switchTab('home')}}
window.fnLiveRequestExit=fnLiveRequestExit;
window.addEventListener('popstate',function(e){if(document.body.classList.contains('fn-live-mode')){e.preventDefault();try{history.pushState({page:'live'},'',location.href)}catch(x){}fnLiveRequestExit()}},true);
window.fnLiveResetFilters=function(){var search=document.getElementById('fn-live-search');if(search)search.value='';['fn-live-topic','fn-live-country','fn-live-language','fn-live-sort'].forEach(function(id){var e=document.getElementById(id);if(e){e.value=(id==='fn-live-sort'?'name':'all');e.dispatchEvent(new Event('change',{bubbles:true}));}});document.querySelectorAll('.fn-live-filter-custom.open').forEach(function(x){x.classList.remove('open')});if(typeof fnLiveApply==='function')fnLiveApply();}
function setupHeader(){var live=document.getElementById('live-tab'),h=live&&live.querySelector('header'),a=h&&h.querySelector('.fn-live-top-actions');if(!a)return;a.innerHTML='<button class="fn-live-icon-btn" onclick="fnLiveRequestExit()" title="'+tx4('بازگشت','Back')+'" aria-label="'+tx4('بازگشت','Back')+'"><i class="fa-solid fa-arrow-right"></i></button><button class="fn-live-icon-btn" onclick="fnLiveAppFullscreen()" title="'+tx4('تمام‌صفحهٔ اپ','Fullscreen app')+'" aria-label="'+tx4('تمام‌صفحهٔ اپ','Fullscreen app')+'"><i class="fa-solid fa-expand"></i></button><button id="fn-live-fav-toggle" class="fn-live-icon-btn" onclick="fnLiveToggleFavorites()" title="'+tx4('علاقه‌مندی‌ها','Favorites')+'" aria-label="'+tx4('علاقه‌مندی‌ها','Favorites')+'"><i class="fa-solid fa-star"></i></button><button class="fn-live-icon-btn" onclick="fnLiveResetFilters()" title="'+tx4('بازنشانی فیلترها','Reset filters')+'" aria-label="'+tx4('بازنشانی فیلترها','Reset filters')+'"><i class="fa-solid fa-rotate-right"></i></button><button class="fn-live-icon-btn" onclick="fnLiveRequestExit()" title="'+tx4('بستن','Close')+'" aria-label="'+tx4('بستن','Close')+'"><i class="fa-solid fa-xmark"></i></button>';var ht=document.getElementById('fn-live-title-text'),hs=document.getElementById('fn-live-subtitle');if(ht)ht.textContent=tx4('پخش زنده','LIVE TV');if(hs)hs.textContent=tx4('پخش زنده','LIVE TV');document.querySelectorAll('#live-tab .fn-live-filter-field>label').forEach(function(x){x.textContent=tx4(x.getAttribute('data-fa')||'',x.getAttribute('data-en')||'')});h.setAttribute('data-v4','1')}
function setupPlayer(){var bar=document.querySelector('#fn-live-player .fn-live-player-bar');if(!bar||bar.getAttribute('data-v4'))return;bar.setAttribute('data-v4','1');bar.innerHTML='<button class="fn-live-nav-btn" onclick="fnLivePrev()" title="'+tx4('شبکهٔ قبلی','Previous channel')+'" aria-label="'+tx4('شبکهٔ قبلی','Previous channel')+'"><i class="fa-solid fa-backward-step"></i></button><button id="fn-live-pause" class="fn-live-nav-btn" onclick="fnLivePauseToggle()" title="'+tx4('مکث','Pause')+'" aria-label="'+tx4('مکث','Pause')+'"><i class="fa-solid fa-pause"></i></button><button class="fn-live-nav-btn" onclick="fnLiveNext()" title="'+tx4('شبکهٔ بعدی','Next channel')+'" aria-label="'+tx4('شبکهٔ بعدی','Next channel')+'"><i class="fa-solid fa-forward-step"></i></button><button class="fn-live-close" onclick="fnLiveClosePlayer()" title="'+tx4('بستن پلیر','Close player')+'" aria-label="'+tx4('بستن پلیر','Close player')+'"><i class="fa-solid fa-xmark"></i></button><div id="fn-live-now" class="fn-live-now"></div><span id="fn-live-state" class="fn-live-state"></span>'}
function setupCountrySearch(){document.querySelectorAll('.fn-live-filter-custom').forEach(function(w){if(w.querySelector('.fn-live-filter-search'))return;var menu=w.querySelector('.fn-live-filter-menu');if(!menu)return;var input=document.createElement('input');input.className='fn-live-filter-search';input.type='search';var isLang=!!w.querySelector('#fn-live-language');input.placeholder=isLang?tx4('جستجوی زبان…','Search languages…'):tx4('جستجوی کشور…','Search countries…');input.setAttribute('aria-label',input.placeholder);menu.querySelectorAll('.fn-live-filter-option').forEach(function(o){if(o.querySelector('.fn-lang-flag')&&((o.textContent||'').indexOf('🌐')>=0||/All countries|همه کشورها|All languages|همه زبان‌ها/.test(o.textContent||'')))o.setAttribute('data-all','1');var t=o.textContent||'';t=t.replace(/^[^\p{L}\p{N}]*/u,'').replace(/(^|\s)[A-Z]{2}\s*[—-]?\s*/g,' ').trim();o.setAttribute('data-search',t)});input.oninput=function(){var q=String(input.value||'').trim().toLocaleLowerCase();menu.querySelectorAll('.fn-live-filter-option').forEach(function(o){if(o.getAttribute('data-all')==='1'){o.classList.remove('is-filtered');return}var text=(o.getAttribute('data-search')||o.textContent||'').toLocaleLowerCase();o.classList.toggle('is-filtered',!!q&&!text.startsWith(q))})};menu.insertBefore(input,menu.firstChild);var oldOpen=w.querySelector('button');if(oldOpen)oldOpen.addEventListener('click',function(){setTimeout(function(){input.focus()},20)})})}
function stripCountryCode(){document.querySelectorAll('.fn-live-filter-option span:last-child').forEach(function(t){t.textContent=t.textContent.replace(/(^|\s)[A-Z]{2}\s*[—-]?\s*/g,' ').trim()})}
function rebuildFilterLabels(){setupHeader();setupPlayer();document.querySelectorAll('.fn-live-filter-custom').forEach(function(w){var b=w.querySelector('button.fn-live-select'),s=w.previousElementSibling;if(b&&s&&s.options){var o=s.options[s.selectedIndex],isCountry=s.id==='fn-live-country',flag=isCountry&&o&&o.value&&o.value!=='all'&&typeof countryFlag==='function'?countryFlag(o.value):'';b.innerHTML=(flag?'<span class="fn-lang-flag"><img src="'+esc4(flag)+'" alt=""></span>':'')+'<span>'+esc4(o?o.textContent:'')+'</span>'}});setupCountrySearch();stripCountryCode()}
window.fnLiveAppFullscreen=function(){var root=document.documentElement;if(document.fullscreenElement)document.exitFullscreen();else if(root.requestFullscreen)root.requestFullscreen().catch(function(){})}
window.fnLivePauseToggle=function(){var v=document.getElementById('fn-live-video'),b=document.getElementById('fn-live-pause');if(!v)return;if(v.paused){v.play().catch(function(){});if(b){b.innerHTML='<i class="fa-solid fa-pause"></i>';b.title=tx4('مکث','Pause')}}else{v.pause();if(b){b.innerHTML='<i class="fa-solid fa-play"></i>';b.title=tx4('پخش','Play')}}}
var oldPlay=window.fnLiveRetry;document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.fn-live-card'))setTimeout(function(){var b=document.getElementById('fn-live-pause');if(b){b.innerHTML='<i class="fa-solid fa-pause"></i>';b.title=tx4('مکث','Pause')}},80)},true)
var last='';setInterval(function(){var now=String(typeof LANG==='undefined'?'fa':LANG);if(now!==last){last=now;rebuildFilterLabels()}},700);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',rebuildFilterLabels);else rebuildFilterLabels();
})();


;

(function(){'use strict';
 var KEY='fn_live_view_mode_v1', modes=['title','compact','list'], mode='title';
 try{var saved=localStorage.getItem(KEY);if(modes.indexOf(saved)>-1)mode=saved}catch(e){}
 function fa(){return typeof LANG==='undefined'||LANG==='fa'}
 function tx(a,b){return fa()?a:b}
 function esc(x){var d=document.createElement('div');d.textContent=String(x==null?'':x);return d.innerHTML}
 function labels(){return [{k:'title',fa:'نمایش عنوانی',en:'Title view',i:'fa-table-cells-large'},{k:'compact',fa:'نمایش فشرده',en:'Compact view',i:'fa-table-list'},{k:'list',fa:'گرید',en:'Grid',i:'fa-table-cells'}]}
 function applyMode(){var g=document.getElementById('fn-live-grid');if(!g)return;g.classList.remove('fn-live-view-title','fn-live-view-compact','fn-live-view-list');g.classList.add('fn-live-view-'+mode);var p=document.getElementById('fn-live-view-picker');if(p)p.querySelectorAll('button').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-mode')===mode);b.setAttribute('aria-pressed',b.getAttribute('data-mode')===mode?'true':'false')});var b=document.getElementById('fn-live-view-btn');if(b){var x=labels().find(function(v){return v.k===mode})||labels()[0];b.title=tx(x.fa,x.en);b.setAttribute('aria-label',b.title);var i=b.querySelector('i');if(i)i.className='fa-solid '+x.i}}
 window.fnLiveSetViewMode=function(m){if(modes.indexOf(m)<0)return;mode=m;try{localStorage.setItem(KEY,mode)}catch(e){}applyMode();var p=document.getElementById('fn-live-view-picker');if(p)p.classList.remove('open')};
 function ensure(){var a=document.querySelector('#live-tab .fn-live-top-actions');if(!a)return;var reset=a.querySelector('button[onclick*="fnLiveResetFilters"]');if(!reset)return;if(!document.getElementById('fn-live-view-control')){var w=document.createElement('span');w.id='fn-live-view-control';w.className='fn-live-view-wrap';w.innerHTML='<button id="fn-live-view-btn" type="button" class="fn-live-icon-btn fn-live-view-btn" onclick="fnLiveToggleViewPicker(event)" title="'+tx('تغییر ظاهر شبکه‌ها','Change channel view')+'" aria-label="'+tx('تغییر ظاهر شبکه‌ها','Change channel view')+'"><i class="fa-solid fa-table-cells-large"></i></button><span id="fn-live-view-picker" class="fn-live-view-picker" role="menu">'+labels().map(function(x){return '<button type="button" role="menuitem" data-mode="'+x.k+'" onclick="fnLiveSetViewMode(\''+x.k+'\')"><i class="fa-solid '+x.i+'"></i> '+esc(tx(x.fa,x.en))+'</button>'}).join('')+'</span>';reset.parentNode.insertBefore(w,reset)}applyMode()}
 window.fnLiveToggleViewPicker=function(e){if(e)e.stopPropagation();ensure();var p=document.getElementById('fn-live-view-picker');if(p)p.classList.toggle('open')};
 document.addEventListener('click',function(e){var w=document.getElementById('fn-live-view-control');if(w&&!w.contains(e.target)){var p=document.getElementById('fn-live-view-picker');if(p)p.classList.remove('open')}});
 var mo=new MutationObserver(function(){ensure();applyMode()});document.addEventListener('DOMContentLoaded',function(){ensure();applyMode();mo.observe(document.body,{childList:true,subtree:true})});if(document.readyState!=='loading'){ensure();applyMode();mo.observe(document.body,{childList:true,subtree:true})}
 setInterval(function(){ensure();applyMode()},900);
 // The app fullscreen button must never request or retain landscape orientation.
 window.fnLiveAppFullscreen=function(){var root=document.documentElement;try{if(document.fullscreenElement||document.webkitFullscreenElement){var ex=document.exitFullscreen||document.webkitExitFullscreen;if(ex)Promise.resolve(ex.call(document)).finally(function(){try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock()}catch(e){}});return}var req=root.requestFullscreen||root.webkitRequestFullscreen;if(req)Promise.resolve(req.call(root,{navigationUI:'hide'})).then(function(){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait-primary').catch(function(){});else if(window.screen.lockOrientation)window.screen.lockOrientation('portrait-primary')}catch(e){}}).catch(function(){})}catch(e){}}
 // App/header fullscreen remains portrait; player fullscreen is handled separately below.
 document.addEventListener('fullscreenchange',function(){if(document.fullscreenElement===document.documentElement){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('portrait-primary').catch(function(){})}catch(e){}}});
})();


;

(function(){'use strict';
 var timer=null, bound=null, rangeStart=0, rangeEnd=0;
 function tx(a,b){return (typeof LANG==='undefined'||LANG==='fa')?a:b}
 function esc(x){var d=document.createElement('div');d.textContent=String(x==null?'':x);return d.innerHTML}
 function ensure(){
  var wrap=document.querySelector('#fn-live-player .fn-live-video-wrap');if(!wrap)return null;
  var old=document.getElementById('fn-live-seek');if(old)return old;
  var box=document.createElement('div');box.id='fn-live-seek';box.setAttribute('aria-label',tx('جابه‌جایی در پخش','Seek within live playback'));
  box.innerHTML='<input id="fn-live-seek-range" type="range" min="0" max="1" step="0.1" value="1" aria-label="'+esc(tx('زمان پخش','Playback time'))+'"><span id="fn-live-seek-time">LIVE</span>';
  wrap.appendChild(box);
  var input=box.querySelector('input');input.addEventListener('input',function(){
   var v=document.getElementById('fn-live-video');if(!v||!rangeEnd||rangeEnd<=rangeStart)return;
   var t=rangeStart+(Number(input.value)/1000);try{v.currentTime=Math.max(rangeStart,Math.min(rangeEnd,t))}catch(e){}
  });
  return box;
 }
 function fmt(sec){sec=Math.max(0,Math.floor(Number(sec)||0));var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return (h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
 function update(){
  var v=document.getElementById('fn-live-video'),box=ensure();if(!v||!box){if(box)box.classList.remove('is-available');return}
  var q=v.seekable, start=0,end=0;
  try{if(q&&q.length){start=q.start(q.length-1);end=q.end(q.length-1)}}catch(e){}
  // Only expose the control when the stream has a real seekable DVR window.
  var available=isFinite(start)&&isFinite(end)&&end-start>5;
  if(!available){box.classList.remove('is-available');return}
  rangeStart=start;rangeEnd=end;box.classList.add('is-available');
  var input=box.querySelector('input'),time=box.querySelector('#fn-live-seek-time'),cur=isFinite(v.currentTime)?Math.max(start,Math.min(end,v.currentTime)):end;
  if(document.activeElement!==input)input.value=String(Math.round((cur-start)*1000));
  input.min='0';input.max=String(Math.round((end-start)*1000));
  if(time)time.textContent=fmt(cur-start)+' / '+fmt(end-start);
 }
 function bind(){var v=document.getElementById('fn-live-video');if(!v||bound===v)return;bound=v;['loadedmetadata','durationchange','progress','canplay','timeupdate','playing','emptied'].forEach(function(e){v.addEventListener(e,update)});if(timer)clearInterval(timer);timer=setInterval(update,1000);update()}
 function reset(){var b=document.getElementById('fn-live-seek');if(b)b.classList.remove('is-available');rangeStart=rangeEnd=0}
 var oldPlay=window.play;
 var mo=new MutationObserver(function(){bind();update()});
 function init(){bind();var p=document.getElementById('fn-live-player');if(p)mo.observe(p,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
 // Keep the seek bar scoped to the current Live player and hide it on close/error-free source changes.
 document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.fn-live-card'))setTimeout(function(){bind();update()},120);if(e.target.closest&&e.target.closest('.fn-live-close'))setTimeout(reset,30)},true);
 window.addEventListener('beforeunload',function(){if(timer)clearInterval(timer)});
})();


;

/* ===== FINAL REQUESTED POLISH: unified modal header controls and universal in-app back ===== */
(function(){
  var st=document.createElement('style'); st.textContent=`.quiz-header{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:8px!important;direction:ltr!important;padding-inline:16px!important;}.quiz-header .quiz-close,.quiz-header .fn-modal-fs-btn{position:static!important;inset:auto!important;width:34px!important;height:34px!important;min-width:34px!important;flex:0 0 34px!important;margin:0!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;}.quiz-header .quiz-header-title{order:3!important;margin-inline-start:auto!important;direction:rtl!important;text-align:right!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}.quiz-header>div:last-child{display:none!important;}`; document.head.appendChild(st);
  function visible(id){var x=document.getElementById(id);if(!x)return false;var cs=getComputedStyle(x);return cs.display!=='none'&&cs.visibility!=='hidden'&&!x.hidden;}
  function closeTop(e){var x;
    x=document.getElementById('quiz-level-action-modal');if(x&&x.classList.contains('open')){x.classList.remove('open');e.stopImmediatePropagation();return true;}
    x=document.getElementById('quiz-page');if(x&&x.classList.contains('open')){if(typeof closeQuizPage==='function')closeQuizPage();else x.classList.remove('open');e.stopImmediatePropagation();return true;}
    x=document.getElementById('personality-page');if(x&&x.classList.contains('open')){if(typeof closePersonalityPage==='function')closePersonalityPage();else x.classList.remove('open');e.stopImmediatePropagation();return true;}
    x=document.getElementById('ai-fullscreen');if(visible('ai-fullscreen')){if(typeof closeAIFullscreen==='function')closeAIFullscreen();else x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('fn-download-page');if(visible('fn-download-page')){if(typeof closeFNDownloadPage==='function')closeFNDownloadPage();else x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('fn-release-calendar');if(x&&x.classList.contains('open')){if(typeof closeReleaseCalendar==='function')closeReleaseCalendar();else x.classList.remove('open');e.stopImmediatePropagation();return true;}
    x=document.getElementById('detailed-stats-modal');if(visible('detailed-stats-modal')){if(typeof closeDetailedStats==='function')closeDetailedStats();else x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('scenes-modal');if(visible('scenes-modal')){if(typeof closeScenes==='function')closeScenes();else x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('compare-modal');if(x&&x.classList.contains('open')){x.classList.remove('open');e.stopImmediatePropagation();return true;}
    x=document.getElementById('reviews-modal');if(visible('reviews-modal')){if(typeof closeReviews==='function')closeReviews();else x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('person-bio-modal');if(visible('person-bio-modal')){x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('person-gallery-modal');if(visible('person-gallery-modal')){x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('person-works-modal');if(visible('person-works-modal')){x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('modal');if(visible('modal')){x.style.display='none';if(window.__fnCountryReturn&&window.FNCountryDiscovery){window.FNCountryDiscovery.restoreAfterDetail();window.__fnCountryReturn=null;}e.stopImmediatePropagation();return true;}
    x=document.getElementById('generic-grid-page');if(visible('generic-grid-page')){if(typeof closeGenericGrid==='function')closeGenericGrid();else x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('companies-all-page');if(visible('companies-all-page')){if(typeof closeCompaniesAll==='function')closeCompaniesAll();else x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('company-works-page');if(visible('company-works-page')){x.style.display='none';e.stopImmediatePropagation();return true;}
    x=document.getElementById('sidebar');if(x&&x.classList.contains('open')){if(typeof toggleMenu==='function')toggleMenu();else x.classList.remove('open');e.stopImmediatePropagation();return true;}
    var active=document.querySelector('.tab-content.active');
    if(active&&active.id==='tests-tab'){var lp=document.getElementById('quiz-level-panel');if(lp&&getComputedStyle(lp).display!=='none'){if(typeof renderTestsQuizHome==='function')renderTestsQuizHome();e.stopImmediatePropagation();return true;}}
    if(active&&active.id&&active.id!=='home-tab'&&active.id!=='live-tab'){if(typeof switchTab==='function')switchTab('home');e.stopImmediatePropagation();return true;}
    return false;
  }
  window.addEventListener('popstate',function(e){closeTop(e);},true);
})();


;
window.addEventListener('popstate',function(e){var p=document.getElementById('fn-custom-lists-page');if(p&&p.classList.contains('open')){if(typeof openCustomLists==='function')openCustomLists();e.stopImmediatePropagation()}},true);

;

(function(){
  var tabs=['movies','series','search','home','tests','fav','live'];
  var sx=0, sy=0, tracking=false, eligible=false, moved=false;
  function blockedTarget(t){
    if(!t || !t.closest) return true;
    if(!t.closest('#app')) return true;
    if(t.closest('.nav, .hero-carousel, .row-scroll, .mood-row, .grid-container, #home-content .section, input, textarea, select, button, a, [contenteditable="true"], #modal, .fn-custom-lists-page, .fn-live-shell, .fn-live-player, .fn-watch-party-page')) return true;
    return false;
  }
  document.addEventListener('touchstart',function(e){
    if(!e.touches || e.touches.length!==1) { tracking=false; return; }
    var active=document.querySelector('.tab-content.active');
    eligible=!!active && !blockedTarget(e.target) && !!e.target.closest('.tab-content.active');
    if(!eligible){ tracking=false; return; }
    sx=e.touches[0].clientX; sy=e.touches[0].clientY; tracking=true; moved=false;
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(!tracking || !eligible || !e.touches || e.touches.length!==1) return;
    var dx=e.touches[0].clientX-sx, dy=e.touches[0].clientY-sy;
    if(Math.abs(dx)>18 && Math.abs(dx)>Math.abs(dy)*1.15){ moved=true; e.preventDefault(); }
    else if(Math.abs(dy)>Math.abs(dx)*1.15){ tracking=false; }
  },{passive:false});
  document.addEventListener('touchend',function(e){
    if(!tracking || !eligible || !moved || !e.changedTouches || !e.changedTouches.length){ tracking=false; return; }
    var dx=e.changedTouches[0].clientX-sx;
    if(Math.abs(dx)>=55){
      var active=document.querySelector('.tab-content.active'), idx=active?tabs.indexOf(active.id.replace('-tab','')):-1;
      // Match the app's spatial direction: swipe toward the left opens the left tab;
      // swipe toward the right opens the right tab.
      var next=idx+(dx<0?-1:1);
      if(idx>=0 && next>=0 && next<tabs.length){
        var nav=document.querySelector('.nav-item:nth-child('+(next+1)+')');
        switchTab(tabs[next],nav||undefined);
        if(tabs[next]==='search' && typeof loadTrendingActors==='function') loadTrendingActors();
        if(tabs[next]==='fav' && typeof loadFavorites==='function') loadFavorites();
        if(tabs[next]==='tests' && typeof renderTestsQuizHome==='function') renderTestsQuizHome();
      }
    }
    tracking=false; eligible=false; moved=false;
  },{passive:true});
  document.addEventListener('touchcancel',function(){tracking=false;eligible=false;moved=false;},{passive:true});
})();


;

(function(){'use strict';
var C=[
['US','آمریکا','United States'],['GB','انگلیس','United Kingdom'],['ES','اسپانیا','Spain'],['IT','ایتالیا','Italy'],['FR','فرانسه','France'],['KR','کره جنوبی','South Korea'],['JP','ژاپن','Japan'],['IR','ایران','Iran'],['IN','هند','India'],['CN','چین','China'],['RU','روسیه','Russia'],['HK','هنگ کنگ','Hong Kong'],['DE','آلمان','Germany'],['UA','اوکراین','Ukraine'],['AF','افغانستان','Afghanistan'],['AL','آلبانی','Albania'],['DZ','الجزایر','Algeria'],['AR','آرژانتین','Argentina'],['AM','ارمنستان','Armenia'],['AU','استرالیا','Australia'],['AT','اتریش','Austria'],['AZ','آذربایجان','Azerbaijan'],['BD','بنگلادش','Bangladesh'],['BE','بلژیک','Belgium'],['BR','برزیل','Brazil'],['BG','بلغارستان','Bulgaria'],['CA','کانادا','Canada'],['CL','شیلی','Chile'],['CO','کلمبیا','Colombia'],['HR','کرواسی','Croatia'],['CZ','جمهوری چک','Czech Republic'],['DK','دانمارک','Denmark'],['EG','مصر','Egypt'],['FI','فنلاند','Finland'],['GE','گرجستان','Georgia'],['GR','یونان','Greece'],['HU','مجارستان','Hungary'],['ID','اندونزی','Indonesia'],['IE','ایرلند','Ireland'],['IL','اسرائیل','Israel'],['IQ','عراق','Iraq'],['JO','اردن','Jordan'],['KZ','قزاقستان','Kazakhstan'],['KW','کویت','Kuwait'],['LB','لبنان','Lebanon'],['MY','مالزی','Malaysia'],['MX','مکزیک','Mexico'],['MA','مراکش','Morocco'],['NL','هلند','Netherlands'],['NZ','نیوزیلند','New Zealand'],['NG','نیجریه','Nigeria'],['NO','نروژ','Norway'],['PK','پاکستان','Pakistan'],['PE','پرو','Peru'],['PH','فیلیپین','Philippines'],['PL','لهستان','Poland'],['PT','پرتغال','Portugal'],['QA','قطر','Qatar'],['RO','رومانی','Romania'],['SA','عربستان','Saudi Arabia'],['RS','صربستان','Serbia'],['SG','سنگاپور','Singapore'],['SK','اسلواکی','Slovakia'],['SI','اسلوونی','Slovenia'],['ZA','آفریقای جنوبی','South Africa'],['SE','سوئد','Sweden'],['CH','سوئیس','Switzerland'],['TW','تایوان','Taiwan'],['TH','تایلند','Thailand'],['TN','تونس','Tunisia'],['TR','ترکیه','Turkey'],['AE','امارات','UAE'],['UY','اروگوئه','Uruguay'],['UZ','ازبکستان','Uzbekistan'],['VE','ونزوئلا','Venezuela'],['VN','ویتنام','Vietnam']
];
var ALL_CODES='AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW'.split(',');var known=C.map(function(x){return x[0]});try{var enNames=new Intl.DisplayNames(['en'],{type:'region'}),faNames=new Intl.DisplayNames(['fa'],{type:'region'});ALL_CODES.forEach(function(code){if(known.indexOf(code)<0)C.push([code,faNames.of(code)||code,enNames.of(code)||code])})}catch(e){}
var state={code:null,kind:'all',order:'default',query:'',page:1,items:[],loading:false,view:'grid',fromAll:false,returnToAll:false,renderToken:0};
function fa(){return (typeof LANG!=='undefined'?LANG:localStorage.getItem('lang'))==='fa'} function name(c){return fa()?c[1]:c[2]} function flag(code){return code==='IR'?'https://flagofiran.com/files/Flag_of_Iran.svg':'https://flagcdn.com/w160/'+code.toLowerCase()+'.png'} function globeFlag(){return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="o" cx="32%" cy="24%"><stop stop-color="#6ed6ff"/><stop offset=".58" stop-color="#1685c3"/><stop offset="1" stop-color="#064b86"/></radialGradient><linearGradient id="l" x2="0" y2="1"><stop stop-color="#76c96b"/><stop offset="1" stop-color="#258044"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#o)"/><path fill="url(#l)" d="M20 20c8-8 18-10 25-7l-3 10-11 5-3 12-10-3-2-10zm31 0 13 1 8 9-5 8-12-2-6-8zm-6 23 12 3 5 11-8 9-2 14-12 4-7-12 4-12-7-8z"/><path fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2" d="M12 50h76M18 31c18 8 46 8 64 0M18 69c18-8 46-8 64 0M50 3c-10 13-15 29-15 47s5 34 15 47M50 3c10 13 15 29 15 47s-5 34-15 47"/><circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2"/></svg>')}
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]})}
function ordered(){var head=C.slice(0,14),rest=C.slice(14).sort(function(a,b){return name(a).localeCompare(name(b),fa()?'fa':'en')});return head.concat(rest)}
function renderRow(){var row=document.getElementById('fn-country-row');if(!row)return;row.innerHTML=ordered().slice(0,14).map(function(c){return '<button class="fn-country-chip" data-code="'+c[0]+'" onclick="FNCountryDiscovery.open(this.dataset.code)"><span class="fn-country-flag-wrap"><img class="fn-country-flag" loading="lazy" src="'+flag(c[0])+'" alt=""></span><span class="fn-country-name">'+esc(name(c))+'</span></button>'}).join('')}
function labels(){var t=document.getElementById('fn-country-section-title'),a=document.getElementById('fn-country-see-all'),sel=document.getElementById('fn-country-type'),ord=document.getElementById('fn-country-order'),inp=document.getElementById('fn-country-work-search'),more=document.getElementById('fn-country-more');if(t)t.textContent=fa()?'کشورها':'Countries';if(a)a.textContent=fa()?'مشاهده همه':'See all';if(sel)sel.innerHTML=fa()?'<option value="all">همه</option><option value="movie">فیلم‌ها</option><option value="tv">سریال‌ها</option>':'<option value="all">All</option><option value="movie">Movies</option><option value="tv">TV Shows</option>';if(ord)ord.innerHTML=fa()?'<option value="default">پیش‌فرض</option><option value="newest">جدیدترین</option><option value="oldest">قدیمی‌ترین</option><option value="votes">بیشترین رأی</option><option value="rating">بالاترین امتیاز</option>':'<option value="default">Default</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="votes">Most voted</option><option value="rating">Top rated</option>';if(ord)ord.value=state.order;if(inp)inp.placeholder=fa()?'جستجو در آثار این کشور...':'Search this country...';if(more)more.textContent=fa()?'نمایش بیشتر':'Load more';renderRow();if(state.code){var c=C.find(function(x){return x[0]===state.code});var title=document.getElementById('fn-country-page-title');if(title)title.textContent=name(c||[state.code,'','']);}}
async function get(path){try{return await window.getDataEN(path)}catch(e){return{results:[]}}}
function card(x,type){return window.makeCard?window.makeCard(x,type):''}
function inCountry(x){var oc=Array.isArray(x.origin_country)?x.origin_country:[];var pc=Array.isArray(x.production_countries)?x.production_countries.map(function(y){return y.iso_3166_1}):[];return oc.indexOf(state.code)>=0||pc.indexOf(state.code)>=0}
async function fetchPage(page){var jobs=[];if(state.kind!=='tv')jobs.push(get('discover/movie?with_origin_country='+state.code+'&sort_by=popularity.desc&page='+page));if(state.kind!=='movie')jobs.push(get('discover/tv?with_origin_country='+state.code+'&sort_by=popularity.desc&page='+page));var ds=await Promise.all(jobs),out=[];ds.forEach(function(d){(d.results||[]).forEach(function(x){x.media_type=x.title?'movie':'tv';out.push(x)})});return out}
function filtered(){var q=state.query.toLocaleLowerCase();return state.items.filter(function(x){if(state.kind!=='all'&&x.media_type!==state.kind)return false;if(!q&&!x.vote_average)return false;if(q&&String(x.title||x.name||'').toLocaleLowerCase().indexOf(q)<0&&String(x._en_title||'').toLocaleLowerCase().indexOf(q)<0)return false;return true})}
async function render(){var box=document.getElementById('fn-country-results'),st=document.getElementById('fn-country-status'),more=document.getElementById('fn-country-more');if(!box)return;var list=filtered();if(state.order!=='default')list.sort(function(a,b){var da=String(a.release_date||a.first_air_date||'0000'),db=String(b.release_date||b.first_air_date||'0000');if(state.order==='newest')return db.localeCompare(da);if(state.order==='oldest')return da.localeCompare(db);if(state.order==='votes')return (b.vote_count||0)-(a.vote_count||0);if(state.order==='rating'){var av=(a.vote_count||0)>=100?a.vote_average||0:-1,bv=(b.vote_count||0)>=100?b.vote_average||0:-1;return bv-av}return 0});var tok=++state.renderToken;box.classList.toggle('fn-country-list-mode',state.view==='list');if(state.view==='grid'){box.innerHTML=list.length?list.map(function(x){return card(x,x.media_type)}).join(''):'<div class="fn-country-empty">'+(fa()?'اثری پیدا نشد':'No titles found')+'</div>';}else{box.innerHTML='<div class="fn-country-empty"><i class="fa-solid fa-spinner fa-spin"></i> '+(fa()?'در حال آماده‌سازی فهرست...':'Preparing list...')+'</div>';var cards=await Promise.all(list.map(function(x){return typeof _ggListCard==='function'?_ggListCard(x,x.media_type):Promise.resolve(card(x,x.media_type))}));if(tok!==state.renderToken)return;box.innerHTML=cards.filter(Boolean).join('')||'<div class="fn-country-empty">'+(fa()?'اثری پیدا نشد':'No titles found')+'</div>';}if(st)st.textContent=(fa()?'تعداد آثار: ':'Titles: ')+list.length+(state.query?' · '+(fa()?'نتیجه جستجو':'Search results'):'');if(more)more.style.display=state.loading?'none':'block';updateViewButtons()}
async function load(reset){if(state.loading)return;state.loading=true;var box=document.getElementById('fn-country-results');if(reset&&box)box.innerHTML='<div class="fn-country-empty"><i class="fa-solid fa-spinner fa-spin"></i> '+(fa()?'در حال بارگذاری آثار...':'Loading titles...')+'</div>';var items=await fetchPage(state.page);var seen={};state.items.concat(items).forEach(function(x){seen[x.media_type+':'+x.id]=x});state.items=Object.keys(seen).map(function(k){return seen[k]});state.loading=false;render()}
function open(code){state.returnToAll=state.fromAll===true;state.code=code;state.fromAll=false;state.view='grid';state.kind='all';state.order='default';state.query='';state.page=1;state.items=[];var p=document.getElementById('fn-country-page');if(p){p.style.display='flex';p.setAttribute('aria-hidden','false')}document.body.classList.add('fn-country-page-open');var countryBox=document.getElementById('fn-country-results');if(countryBox){countryBox.classList.remove('fn-country-all-grid');countryBox.style.gridTemplateColumns='';}var im=document.getElementById('fn-country-page-flag');if(im)im.src=flag(code);var sel=document.getElementById('fn-country-type');if(sel)sel.value='all';var ord=document.getElementById('fn-country-order');if(ord)ord.value='default';var tools=document.querySelector('#fn-country-page .fn-country-tools');if(tools)tools.style.display='flex';var vc=document.getElementById('fn-country-view-controls');if(vc)vc.style.display='flex';var inp=document.getElementById('fn-country-work-search');if(inp)inp.value='';var cl=document.getElementById('fn-country-work-clear');if(cl)cl.style.display='none';labels();load(true)}
function openAll(){var p=document.getElementById('fn-country-page');if(!p)return;p.style.display='flex';p.setAttribute('aria-hidden','false');state.code=null;state.fromAll=true;state.view='grid';state.items=[];var box=document.getElementById('fn-country-results');if(box){box.classList.remove('fn-country-list-mode','fn-country-all-grid');box.style.display='grid';box.style.gridTemplateColumns='repeat(5,minmax(0,1fr))';}var pageFlag=document.getElementById('fn-country-page-flag');if(pageFlag)pageFlag.src=globeFlag();if(box)box.innerHTML=ordered().map(function(c){return '<button class="fn-country-chip" style="width:auto;min-width:90px" data-code="'+c[0]+'" onclick="FNCountryDiscovery.open(this.dataset.code)"><span class="fn-country-flag-wrap"><img class="fn-country-flag" loading="lazy" src="'+flag(c[0])+'" alt=""></span><span class="fn-country-name">'+esc(name(c))+'</span></button>'}).join('');box.classList.add('fn-country-all-grid');box.style.gridTemplateColumns='repeat(5,minmax(0,1fr))';var st=document.getElementById('fn-country-status');if(st)st.textContent=fa()?'همه کشورها':'All countries';var more=document.getElementById('fn-country-more');if(more)more.style.display='none';var title=document.getElementById('fn-country-page-title');if(title)title.textContent=fa()?'همه کشورها':'All Countries';var tools=document.querySelector('#fn-country-page .fn-country-tools');if(tools)tools.style.display='none';var vc=document.getElementById('fn-country-view-controls');if(vc)vc.style.display='none';}
function restoreAfterDetail(){if(window.__fnCountryReturn&&window.__fnCountryReturn.fromAll)state.returnToAll=true;if(!state.code&&!state.fromAll&&!state.returnToAll)return;var p=document.getElementById('fn-country-page');if(p){p.style.display='flex';p.setAttribute('aria-hidden','false')}document.body.classList.add('fn-country-page-open');var tools=document.querySelector('#fn-country-page .fn-country-tools');if(tools)tools.style.display=(state.fromAll||state.returnToAll)?'none':'flex';var vc=document.getElementById('fn-country-view-controls');if(vc)vc.style.display=(state.fromAll||state.returnToAll)?'none':'flex';if(state.fromAll||state.returnToAll){var pageFlag=document.getElementById('fn-country-page-flag');if(pageFlag)pageFlag.src=globeFlag();var box=document.getElementById('fn-country-results');if(box){box.classList.remove('fn-country-list-mode');box.classList.add('fn-country-all-grid');box.style.display='grid';box.style.gridTemplateColumns='repeat(5,minmax(0,1fr))';box.innerHTML=ordered().map(function(c){return '<button class="fn-country-chip" data-code="'+c[0]+'" onclick="FNCountryDiscovery.open(this.dataset.code)"><span class="fn-country-flag-wrap"><img class="fn-country-flag" loading="lazy" src="'+flag(c[0])+'" alt=""><\/span><span class="fn-country-name">'+esc(name(c))+'<\/span><\/button>'}).join('');}}else{labels();render();}updateViewButtons();}
function back(){if(state.returnToAll){openAll();return;}close()}
function close(){var p=document.getElementById('fn-country-page');if(p){p.style.display='none';p.setAttribute('aria-hidden','true')}document.body.classList.remove('fn-country-page-open');var tools=document.querySelector('#fn-country-page .fn-country-tools');if(tools)tools.style.display='flex'}
function apply(){if(!state.code)return;var sel=document.getElementById('fn-country-type'),ord=document.getElementById('fn-country-order'),inp=document.getElementById('fn-country-work-search'),cl=document.getElementById('fn-country-work-clear');state.kind=sel?sel.value:'all';state.order=ord?ord.value:'default';state.query=inp?inp.value.trim():'';if(cl)cl.style.display=state.query?'block':'none';render();if(state.query&&!filtered().length)searchFallback(state.query)}
var searchToken=0;async function searchFallback(q){var tok=++searchToken;var jobs=[];if(state.kind!=='tv')jobs.push(get('search/movie?query='+encodeURIComponent(q)+'&page=1'));if(state.kind!=='movie')jobs.push(get('search/tv?query='+encodeURIComponent(q)+'&page=1'));var ds=await Promise.all(jobs);if(tok!==searchToken||!state.code)return;var add=[];ds.forEach(function(d){(d.results||[]).forEach(function(x){x.media_type=x.title?'movie':'tv';if(!x.origin_country||x.origin_country.indexOf(state.code)>=0)add.push(x)})});var seen={};state.items.concat(add).forEach(function(x){seen[x.media_type+':'+x.id]=x});state.items=Object.keys(seen).map(function(k){return seen[k]});render()}
document.addEventListener('click',function(ev){if(state.code&&ev.target&&ev.target.closest&&ev.target.closest('#fn-country-results .card')){window.__fnCountryReturn={code:state.code,fromAll:state.returnToAll===true};close()}},true);
function updateViewButtons(){var c=document.getElementById('fn-country-view-controls');if(!c)return;c.querySelectorAll('button').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-view')===state.view);b.setAttribute('aria-pressed',b.getAttribute('data-view')===state.view?'true':'false');b.title=((typeof LANG!=='undefined'?LANG:localStorage.getItem('lang'))==='fa'?(b.getAttribute('data-view')==='grid'?'شبکه‌ای':'لیستی'):(b.getAttribute('data-view')==='grid'?'Grid':'List'))})}function setView(v){if(v!=='list')v='grid';state.view=v;if(state.code)render();else updateViewButtons();}
function clearSearch(){var inp=document.getElementById('fn-country-work-search');if(inp)inp.value='';apply();if(inp)inp.focus()}
function more(){if(state.code){state.page++;load(false)}}
window.FNCountryDiscovery={open:open,openAll:openAll,back:back,close:close,restoreAfterDetail:restoreAfterDetail,apply:apply,clearSearch:clearSearch,more:more,setView:setView};
function init(){var sec=document.getElementById('fn-country-section');if(!sec)return;labels();}
var oldLang=window.applyLang;if(typeof oldLang==='function'&&!oldLang.__fnCountryWrapped){window.applyLang=function(){var r=oldLang.apply(this,arguments);setTimeout(labels,0);return r};window.applyLang.__fnCountryWrapped=true}
document.addEventListener('DOMContentLoaded',init);window.addEventListener('load',function(){init();setTimeout(labels,500)});
})();


;

/* FN Telegram Mini App direct-detail bridge */
(function () {
  'use strict';
  function openFromTelegramLink() {
    try {
      var q = new URL(window.location.href).searchParams;
      var id = q.get('fn_id');
      var type = q.get('fn_type') || 'movie';
      if (!id || !/^(movie|tv)$/.test(type) || typeof window.openDetail !== 'function') return;
      var numericId = Number(id);
      if (!Number.isInteger(numericId) || numericId <= 0) return;
      window.setTimeout(function () { window.openDetail(numericId, type); }, 250);
    } catch (err) { console.warn('FN direct detail link failed', err); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openFromTelegramLink);
  else openFromTelegramLink();
  window.addEventListener('load', function () { window.setTimeout(openFromTelegramLink, 600); });
})();


;

(function(){'use strict';
function current(){return document.fullscreenElement||document.webkitFullscreenElement||null}
function expand(){try{var w=window.Telegram&&window.Telegram.WebApp;if(w&&w.expand)w.expand()}catch(_){} }
function req(el){var f=el&&(el.requestFullscreen||el.webkitRequestFullscreen||el.mozRequestFullScreen);if(!f)return Promise.reject();try{return Promise.resolve(f.call(el,{navigationUI:'hide'}))}catch(_){try{return Promise.resolve(f.call(el))}catch(e){return Promise.reject(e)}}}
function exit(){var f=document.exitFullscreen||document.webkitExitFullscreen||document.mozCancelFullScreen;try{return f?Promise.resolve(f.call(document)):Promise.resolve()}catch(_){return Promise.resolve()}}
window.toggleAppFullscreen=function(){if(current()){exit();return}expand();req(document.documentElement).catch(function(){expand()})};
function icons(){var on=!!current();document.querySelectorAll('[onclick="toggleAppFullscreen()"],.page-header-fs').forEach(function(b){if(b.tagName==='I')b.className=on?'fa-solid fa-compress':'fa-solid fa-expand'});var b=document.getElementById('app-fs-btn');if(b){b.className=on?'fa-solid fa-compress':'fa-solid fa-expand';b.style.color=on?'var(--primary)':'#aaa'}}
document.addEventListener('fullscreenchange',icons);document.addEventListener('webkitfullscreenchange',icons);window.addEventListener('pageshow',icons);
})();


;

// FN-v44: single version, local error log, backup timestamp, personalized home row.
// This block runs last on purpose: it wins over the older version strings
// (v37 title, v26 footer, v40 patch) without editing dozens of patch blocks.
(function(){
  'use strict';
  // FN-v42 speed: lazy home rows. renderHome used to call loadRow for all 52
  // sections at once because fnLoadHomeRow was never defined (fn-api.js is not
  // loaded). Now only the first 2 rows load immediately; the rest start only
  // when they come within 900px of the viewport. No section is removed: every
  // row still loads exactly as before, just when the user can actually see it.
  // The monthly-upcoming widget at the bottom is deferred the same way (700px).
  if (!window.fnLoadHomeRow) {
    var _fnEagerRows = 0;
    var _fnRowObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        _fnRowObserver.unobserve(entry.target);
        if (entry.target.__fnStart) entry.target.__fnStart();
      });
    }, { rootMargin: '900px 0px' }) : null;
    window.fnLoadHomeRow = function(section, id){
      var el = document.getElementById(id);
      if (!el || el.dataset.fnQueued) return;
      el.dataset.fnQueued = '1';
      var start = function(){
        if (el.dataset.fnLoaded) return;
        el.dataset.fnLoaded = '1';
        if (section.trending && typeof window.loadTrendingRow === 'function') window.loadTrendingRow(section.q, id);
        else if (section.adult && typeof window.loadAdultRow === 'function') window.loadAdultRow(id);
        else if (typeof window.loadRow === 'function') window.loadRow(section.q, id, section.type);
      };
      var sec = el.closest ? el.closest('.section') : null;
      if (sec) sec.__fnStart = start;
      if (_fnEagerRows++ < 2 || !_fnRowObserver) start();
      else if (sec) _fnRowObserver.observe(sec);
      else start();
    };
  }
  if (!window.fnDeferHomeTask) {
    var _fnDeferredObserver = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        _fnDeferredObserver.unobserve(entry.target);
        if (entry.target.__fnDeferredTask) entry.target.__fnDeferredTask();
      });
    }, { rootMargin: '700px 0px' }) : null;
    window.fnDeferHomeTask = function(el, task){
      if (!el || el.dataset.fnDeferred) return;
      el.dataset.fnDeferred = '1';
      el.__fnDeferredTask = task;
      if (_fnDeferredObserver) _fnDeferredObserver.observe(el);
      else task();
    };
  }
  var FN_VER41 = 'v44.0.1';
  window.FN_APP_VERSION = FN_VER41;
  function fnIsFa(){ try { return (typeof LANG !== 'undefined' ? LANG : (localStorage.getItem('lang') || 'fa')) === 'fa'; } catch(e){ return true; } }
  function applyFnVersion(){
    try {
      document.title = 'Family Night ' + FN_VER41;
      document.querySelectorAll('.fn-about-version').forEach(function(el){ el.textContent = '🚀 Family Night ' + FN_VER41; });
      var t = document.getElementById('txt-desc-t'); if (t) t.textContent = 'Family Night ' + FN_VER41;
      document.querySelectorAll('[data-fn-version], .fn-app-version, #fn-app-version').forEach(function(el){ el.textContent = FN_VER41; });
    } catch(e){}
  }
  // Local error log (never sent anywhere): message only, keys stripped.
  window.fnErrorLogPush = function(msg, src){
    try {
      var log = JSON.parse(localStorage.getItem('fn_error_log_v1') || '[]');
      if (!Array.isArray(log)) log = [];
      var clean = String(msg || '').replace(/api_key=[^&\s]+/gi, 'api_key=***').replace(/apikey=[^&\s]+/gi, 'apikey=***').slice(0, 300);
      log.unshift({ t: new Date().toISOString(), m: clean, s: String(src || '').slice(0, 200) });
      localStorage.setItem('fn_error_log_v1', JSON.stringify(log.slice(0, 20)));
    } catch(e){}
  };
  window.addEventListener('error', function(e){ window.fnErrorLogPush(e.message || 'error', e.filename || ''); });
  window.addEventListener('unhandledrejection', function(e){ var r = e.reason; window.fnErrorLogPush((r && (r.message || r)) || 'unhandled rejection', 'promise'); });
  window.fnCopyErrorLog = function(){
    var fa = fnIsFa(), log = '';
    try { log = localStorage.getItem('fn_error_log_v1') || '[]'; } catch(e){}
    if (!log || log === '[]') { alert(fa ? 'خطایی ثبت نشده است.' : 'No errors recorded.'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(log).then(function(){ alert(fa ? 'گزارش خطاها کپی شد.' : 'Error log copied.'); }, function(){ alert(log); });
    } else { alert(log); }
  };
  function fnInjectAboutExtras(){
    try {
      var dev = document.querySelector('.dev-info');
      if (!dev || document.getElementById('fn-v41-extras')) return;
      var fa = fnIsFa(), last = 0;
      try { last = Number(localStorage.getItem('fn_backup_last_export') || 0) || 0; } catch(e){}
      var lastTxt = last ? new Date(last).toLocaleDateString(fa ? 'fa-IR' : 'en-US') : (fa ? 'هرگز' : 'never');
      var div = document.createElement('div');
      div.id = 'fn-v41-extras';
      div.style.cssText = 'margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.12);';
      div.innerHTML = '<p style="font-size:12px;color:#aaa;margin-bottom:8px;">' + (fa ? 'آخرین پشتیبان: ' : 'Last backup: ') + lastTxt + '</p>' +
        '<button onclick="fnCopyErrorLog()" style="padding:9px 14px;background:#1a1a2a;border:1px solid rgba(255,255,255,0.2);border-radius:999px;color:#ddd;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">' + (fa ? '📋 کپی گزارش خطاها' : '📋 Copy error log') + '</button>';
      dev.appendChild(div);
    } catch(e){}
  }
  // Remember when a backup was exported, so the About section can show it.
  try {
    if (typeof exportFNBackup === 'function' && !exportFNBackup.__fnWrapped) {
      var _origExport = exportFNBackup;
      var wrapped = function(){ var r = _origExport.apply(this, arguments); try { localStorage.setItem('fn_backup_last_export', String(Date.now())); } catch(e){} return r; };
      wrapped.__fnWrapped = true; window.exportFNBackup = wrapped;
    }
  } catch(e){}
  // Personalized home row: genres of the user's own favorites, not a generic row.
  var _foryouToken = 0;
  async function insertForYouRow(){
    var myToken = ++_foryouToken;
    try {
      var c = document.getElementById('home-content');
      if (!c || document.getElementById('foryou-section')) return;
      var favs = [];
      try { favs = JSON.parse(localStorage.getItem('family_favs_v2') || '[]') || []; } catch(e){}
      if (!favs.length || typeof getData !== 'function' || typeof makeCard !== 'function') return;
      var info = {}, typeCounts = { movie: 0, tv: 0 };
      for (var i = 0; i < Math.min(favs.length, 10); i++) {
        if (myToken !== _foryouToken) return;
        var f = favs[i], mt = (f.type === 'tv') ? 'tv' : 'movie';
        try {
          var d = await getData(mt + '/' + f.id);
          if (d && d.genres) { typeCounts[mt]++; d.genres.forEach(function(g){ var k = mt + ':' + g.id; if (!info[k]) info[k] = { id: g.id, name: g.name, count: 0 }; info[k].count++; }); }
        } catch(e){}
      }
      if (myToken !== _foryouToken) return;
      var type = (typeCounts.tv > typeCounts.movie) ? 'tv' : 'movie';
      var top = Object.keys(info).filter(function(k){ return k.indexOf(type + ':') === 0; }).map(function(k){ return info[k]; }).sort(function(a, b){ return b.count - a.count; });
      if (!top.length) return;
      var picked = top.slice(0, 2);
      var genreIds = picked.map(function(g){ return g.id; }).join(',');
      var genreNames = picked.map(function(g){ return g.name; }).join('، ');
      var fa = fnIsFa();
      var title = fa ? '🎯 بر اساس علاقه‌مندی‌هایت' + (genreNames ? ' (' + genreNames + ')' : '') : '🎯 Based on your favorites' + (genreNames ? ' (' + genreNames + ')' : '');
      var q = 'discover/' + type + '?with_genres=' + genreIds + '&sort_by=popularity.desc&vote_count.gte=50&include_adult=false';
      var res = await getData(q);
      if (myToken !== _foryouToken) return;
      var favIds = {};
      favs.forEach(function(x){ favIds[String(x.id)] = true; });
      var items = (res && res.results ? res.results : []).filter(function(m){ return !favIds[String(m.id)] && (m.vote_average > 0 || String(m.release_date || m.first_air_date || '').indexOf('2026') === 0); }).slice(0, 20);
      if (!items.length || document.getElementById('foryou-section')) return;
      var sec = document.createElement('div');
      sec.className = 'section'; sec.id = 'foryou-section';
      var safeTitle = title.replace(/'/g, "\\'");
      var safeQ = q.replace(/'/g, "\\'");
      sec.innerHTML = '<div class="sec-head"><span class="sec-title"><span>' + title.replace(/</g, '&lt;') + '</span></span><span class="sec-more" onclick="openGenericGrid(\'' + type + '\', \'' + safeQ + '\', \'' + safeTitle + '\')">' + (fa ? 'مشاهده همه' : 'See all') + '</span></div><div class="row-scroll" id="row-foryou"></div>';
      var first = c.querySelector('.section');
      if (first) c.insertBefore(sec, first); else c.appendChild(sec);
      var row = document.getElementById('row-foryou');
      items.forEach(function(m){ try { row.innerHTML += makeCard(m, type); } catch(e){} });
    } catch(e){}
  }
  try {
    if (typeof window.renderHome === 'function' && !window.renderHome.__fnPersonalized) {
      var _origHome = window.renderHome;
      var wrappedHome = function(){ var r = _origHome.apply(this, arguments); setTimeout(insertForYouRow, 300); return r; };
      wrappedHome.__fnPersonalized = true; window.renderHome = wrappedHome;
    }
  } catch(e){}
  applyFnVersion(); fnInjectAboutExtras();
  document.addEventListener('DOMContentLoaded', function(){ applyFnVersion(); fnInjectAboutExtras(); });
  window.addEventListener('load', function(){ applyFnVersion(); fnInjectAboutExtras(); });
  setTimeout(applyFnVersion, 1500); setTimeout(applyFnVersion, 3000);
})();


;

(function(){
  'use strict';
  var tabs=['fav','rated','watchlater','recent'];
  function fa(){return typeof LANG!=='undefined'&&LANG==='fa';}
  function tr(en,faText){return fa()?faText:en;}
  function esc(s){var d=document.createElement('div');d.textContent=String(s==null?'':s);return d.innerHTML;}
  function data(){return {fav:(typeof favorites!=='undefined'&&Array.isArray(favorites))?favorites:[],rated:(typeof personalRatings!=='undefined'&&personalRatings)?personalRatings:{},watchlater:(typeof watchlist!=='undefined'&&Array.isArray(watchlist))?watchlist:[],recent:(typeof recentlyViewed!=='undefined'&&Array.isArray(recentlyViewed))?recentlyViewed:[]};}
  function count(tab){var x=data()[tab];return Array.isArray(x)?x.length:Object.keys(x).length;}
  function ensureControls(){
    tabs.forEach(function(tab){
      var section=document.getElementById('mylist-section-'+tab);
      if(!section||section.querySelector('.fn-mylist-controls'))return;
      var bar=document.createElement('div');bar.className='fn-mylist-controls';bar.dataset.fnMylistTab=tab;
      bar.innerHTML='<button type="button" class="fn-mylist-clear" data-fn-mylist-clear="'+tab+'">'+tr('Clear All','پاک‌کردن همه')+'</button>';
      section.insertBefore(bar,section.firstChild);
    });
  }
  function updateControls(){
    ensureControls();
    document.querySelectorAll('.fn-mylist-clear').forEach(function(b){
      var n=count(b.getAttribute('data-fn-mylist-clear'));
      b.disabled=!n;
      b.setAttribute('aria-disabled',n?'false':'true');
      b.title=n?tr('Clear this list only','فقط همین فهرست را پاک کن'):tr('This list is already empty','این فهرست خالی است');
    });
  }
  function button(tab,id,type){return '<button type="button" class="fn-mylist-remove" aria-label="'+esc(tr('Remove from list','حذف از فهرست'))+'" title="'+esc(tr('Remove','حذف'))+'" onclick="event.preventDefault();event.stopPropagation();window.FNMyListRemove(\''+tab+'\',\''+encodeURIComponent(String(id))+'\',\''+encodeURIComponent(String(type||'movie'))+'\');">&times;</button>';}
  function card(item,tab){
    var type=item.type||(item.media_type)||(item.title?'movie':'tv');
    var html=makeCard(item,type);
    return html?html.replace('<div class="card"','<div class="card mylist-card"').replace('>', '>'+button(tab,item.id,type)):'';
  }
  function render(){
    var tab=(typeof _myListCurrentTab!=='undefined'&&_myListCurrentTab)||'fav',isFA=fa(),x=data();
    updateControls();
    if(tab==='fav'){
      var g=document.getElementById('fav-grid'),e=document.getElementById('fav-empty');if(!g)return;g.innerHTML='';
      if(!x.fav.length){if(e){e.style.display='block';e.textContent=tr('No favorites yet','لیست خالیه');}}else{if(e)e.style.display='none';x.fav.forEach(function(v){g.innerHTML+=card(v,'fav');});}
    }else if(tab==='watchlater'){
      var wg=document.getElementById('watchlater-grid'),we=document.getElementById('watchlater-empty');if(!wg)return;wg.innerHTML='';
      if(!x.watchlater.length){if(we){we.style.display='block';we.textContent=tr('Nothing saved for later','هیچ اثری ذخیره نشده');}}else{if(we)we.style.display='none';x.watchlater.forEach(function(v){wg.innerHTML+=card(v,'watchlater');});}
    }else if(tab==='recent'){
      /* Recently uses the unified history renderer so its dashboard, filters,
         visited/watched badges and hydration are never bypassed. */
      if(typeof loadHistory==='function') loadHistory();
    }else if(tab==='rated'){
      var rl=document.getElementById('rated-list-content'),rEmpty=document.getElementById('rated-empty');if(!rl)return;
      var items=Object.keys(x.rated).map(function(id){return [id,x.rated[id]];}).sort(function(a,b){return (b[1].stars||0)-(a[1].stars||0);});
      if(!items.length){rl.innerHTML='';if(rEmpty){rEmpty.style.display='block';rEmpty.textContent=tr('No ratings yet','هنوز امتیازی ثبت نشده');}return;}
      if(rEmpty)rEmpty.style.display='none';
      var labels={loved:tr('Loved it','سلیقم بود'),ok:tr('Was OK','بد نبود'),disliked:tr('Waste of time','اتلاف وقت'),notmytaste:tr('Not my taste','سلیقم نبود')};
      rl.innerHTML=items.map(function(ent){var id=ent[0],r=ent[1]||{},stars='';for(var i=1;i<=5;i++)stars+='<span style="color:'+(i<=r.stars?'#f5c518':'var(--border,#555)')+'">&#9733;</span>';var poster=r.poster?('https://family-night-api.alirezadoe8.workers.dev/img/w185'+r.poster):'';return '<div class="fn-mylist-rated-row" style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border,#1a1a1a);cursor:pointer;" onclick="openDetail('+id+',\''+String(r.type||'movie').replace(/'/g,'')+'\')">'+button('rated',id,r.type||'movie')+'<div style="width:52px;height:74px;border-radius:6px;overflow:hidden;flex-shrink:0;background:var(--button-bg,#111);">'+(poster?'<img src="'+esc(poster)+'" style="width:100%;height:100%;object-fit:cover;" loading="lazy">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;">&#127916;</div>')+'</div><div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;color:var(--text,#e0e0e0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+esc(r.title||'')+'</div><div style="margin-top:5px;font-size:16px;letter-spacing:2px;">'+stars+'</div>'+(r.opinion&&labels[r.opinion]?'<div style="font-size:11px;color:var(--primary);margin-top:4px;font-weight:600;">'+esc(labels[r.opinion])+'</div>':'')+'</div></div>';}).join('');
    }
  }
  window.FNMyListRemove=function(tab,encodedId,encodedType){
    var id=decodeURIComponent(encodedId),type=decodeURIComponent(encodedType||'movie');
    if(tab==='fav'){favorites=favorites.filter(function(v){return !(String(v.id)===id&&String(v.type||v.media_type||(v.title?'movie':'tv'))===type);});localStorage.setItem(FAV_KEY,JSON.stringify(favorites));}
    else if(tab==='watchlater'){watchlist=watchlist.filter(function(v){return !(String(v.id)===id&&String(v.type||v.media_type||(v.title?'movie':'tv'))===type);});localStorage.setItem(WATCHLIST_KEY,JSON.stringify(watchlist));}
    else if(tab==='recent'){recentlyViewed=recentlyViewed.filter(function(v){return !(String(v.id)===id&&String(v.type||v.media_type||(v.title?'movie':'tv'))===type);});localStorage.setItem(RECENTLY_KEY,JSON.stringify(recentlyViewed));}
    else if(tab==='rated'){delete personalRatings[id];localStorage.setItem(RATINGS_KEY,JSON.stringify(personalRatings));if(String(typeof curId==='undefined'?'':curId)===id&&typeof renderPersonalRating==='function')renderPersonalRating();}
    if(typeof checkFavState==='function')checkFavState();if(typeof checkWatchlistState==='function')checkWatchlistState();if(typeof updateMiniStats==='function')updateMiniStats();render();if(typeof showToast==='function')showToast(tr('Removed from this list','از همین فهرست حذف شد'));
  };
  window.FNMyListClear=function(tab){
    if(!count(tab))return;
    if(!window.confirm(tr('Clear all items from this list?','همهٔ موارد این فهرست پاک شوند؟')))return;
    if(tab==='fav'){favorites=[];localStorage.setItem(FAV_KEY,'[]');}
    else if(tab==='watchlater'){watchlist=[];localStorage.setItem(WATCHLIST_KEY,'[]');}
    else if(tab==='recent'){recentlyViewed=[];localStorage.setItem(RECENTLY_KEY,'[]');}
    else if(tab==='rated'){personalRatings={};localStorage.setItem(RATINGS_KEY,'{}');if(typeof renderPersonalRating==='function')renderPersonalRating();}
    if(typeof checkFavState==='function')checkFavState();if(typeof checkWatchlistState==='function')checkWatchlistState();if(typeof updateMiniStats==='function')updateMiniStats();render();if(typeof showToast==='function')showToast(tr('This list was cleared','این فهرست پاک شد'));
  };
  document.addEventListener('click',function(e){var b=e.target.closest('[data-fn-mylist-clear]');if(b){e.preventDefault();window.FNMyListClear(b.getAttribute('data-fn-mylist-clear'));}});
  window.switchMyListTab=switchMyListTab=function(tab){
    _myListCurrentTab=tab;tabs.forEach(function(t){var btn=document.getElementById('mylist-tab-'+t),sec=document.getElementById('mylist-section-'+t),active=t===tab;if(btn){btn.style.background=active?'var(--primary-soft)':'var(--button-bg)';btn.style.color=active?'var(--text)':'var(--sub)';btn.style.borderColor=active?'var(--primary)':'var(--border)';btn.setAttribute('aria-selected',active?'true':'false');}if(sec)sec.style.display=active?'block':'none';});render();};
  window.loadFavorites=loadFavorites=render;
  /* The former handler only opened a Telegram share URL, which is commonly popup-blocked. */
  window.shareWatchlist=shareWatchlist=async function(){
    var active=(typeof getActiveMyListData==='function')?getActiveMyListData():{title:tr('Liked','لایک‌شده'),items:data().fav};var list=active.items||[];if(!list.length){if(typeof showToast==='function')showToast(tr('This list is empty','این فهرست خالی است'));return;}
    var names=list.slice(0,12).map(function(v){return v.title||v.name||'';}).filter(Boolean);var text=(fa()?'فهرست «'+active.title+'» من در Family Night:\n':'My '+active.title+' list in Family Night:\n')+names.map(function(n){return '• '+n;}).join('\n')+(list.length>12?'\n…':'');
    try{if(navigator.share){await navigator.share({title:'Family Night',text:text});if(typeof showToast==='function')showToast(tr('List shared','فهرست به اشتراک گذاشته شد'));return;}}catch(err){if(err&&err.name==='AbortError')return;}
    try{var copied=false;if(navigator.clipboard&&window.isSecureContext){try{await Promise.race([navigator.clipboard.writeText(text),new Promise(function(_,reject){setTimeout(function(){reject(Error('clipboard timeout'));},1500);})]);copied=true;}catch(clipboardError){}}if(!copied){var ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;opacity:0;pointer-events:none;';document.body.appendChild(ta);ta.select();var ok=document.execCommand('copy');ta.remove();if(!ok)throw Error('copy');}if(typeof showToast==='function')showToast(tr('List copied to clipboard','فهرست در کلیپ‌بورد کپی شد'));}catch(e){if(typeof showToast==='function')showToast(tr('Unable to share here. Copy the list manually.','اشتراک‌گذاری در اینجا ممکن نیست؛ فهرست را دستی کپی کنید.'));}
  };
  ensureControls();
  var originalSwitch=window.switchTab;
  if(typeof originalSwitch==='function')window.switchTab=switchTab=function(tab,el){var out=originalSwitch(tab,el);if(tab==='fav')render();return out;};
  setTimeout(function(){ensureControls();render();},0);
})();


;

(function(){'use strict';
 var tr=window.tx4||function(a,b){return (typeof LANG==='undefined'||LANG==='fa')?a:b};
 function install(){
  var bar=document.querySelector('#fn-live-player .fn-live-player-bar');
  if(bar){var fs=bar.querySelector('[onclick*="fnLiveFullscreen"]');if(fs)fs.remove();}
  var q=document.getElementById('fn-live-search');if(q)q.placeholder='Search channels…';
  var c=document.getElementById('fn-live-count');if(c&&(!c.textContent||/بارگذاری|loading/i.test(c.textContent)))c.textContent=tr('در حال بارگذاری…','Loading…');
  var st=document.getElementById('fn-live-status-text');if(st&&/دریافت شبکه|getting channels|loading/i.test(st.textContent))st.textContent=tr('در حال دریافت شبکه‌ها…','Loading channels…');
 }
 window.fnLiveFullscreen=function(){var w=document.getElementById('fn-live-player');if(!w)return;var go=function(){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){});}catch(e){}};if(document.fullscreenElement){if(document.exitFullscreen)document.exitFullscreen().catch(function(){});return}if(w.requestFullscreen){w.requestFullscreen().then(go).catch(function(){})}else if(w.webkitRequestFullscreen){w.webkitRequestFullscreen();go()}};
 document.addEventListener('fullscreenchange',function(){var player=document.getElementById('fn-live-player');if(document.fullscreenElement===player){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){});}catch(e){}}});
 var old=window.fnLiveClosePlayer;window.fnLiveClosePlayer=function(){try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){})}catch(e){};return old?old.apply(this,arguments):undefined};
 install();setInterval(install,500);
})();


;

(function(){'use strict';
  var TTL=6*60*60*1000,sourceKey='fn_live_epg_data_cache_v2',channelKey='fn_live_epg_channel_cache_v2',active=null,requestNo=0;
  var defaultEndpoints=['https://iptv-org.github.io/epg/guides/us.xml.gz','https://iptv-org.github.io/epg/guides/ir.xml.gz'];
  function fa(){return typeof LANG==='undefined'||LANG==='fa'}
  function tr(a,b){return fa()?a:b}
  function esc(x){var d=document.createElement('div');d.textContent=String(x==null?'':x);return d.innerHTML}
  function norm(x){return String(x==null?'':x).toLocaleLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^\\p{L}\\p{N}]+/gu,' ').trim().replace(/\\s+/g,' ')}
  function exactId(x){return String(x==null?'':x).trim().toLocaleLowerCase()}
  function read(key,fallback){try{var x=JSON.parse(localStorage.getItem(key)||'null');return x&&typeof x==='object'?x:fallback}catch(e){return fallback}}
  function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){return false}}
  function endpoints(channel){var x=window.FN_LIVE_EPG_ENDPOINTS;if(!Array.isArray(x)){var saved=read('fn_live_epg_endpoints_v1',null);x=Array.isArray(saved)?saved:defaultEndpoints.slice()}else{x=x.slice()}var country=String(channel&&channel.country||'').trim().toLowerCase();if(country&&/^[a-z]{2}$/.test(country)){x.push('https://iptv-org.github.io/epg/guides/'+country+'.xml.gz');x.push('https://iptv-epg.org/files/epg-'+country+'.xml.gz')}x.push('https://iptv-org.github.io/epg/guides/ir.xml.gz');var seen={};return x.map(function(v){return String(v||'').trim()}).filter(function(v){if(!v||seen[v])return false;seen[v]=1;return true}).slice(0,6)}
  function status(text){var e=document.getElementById('fn-live-epg-status');if(e){e.textContent=text;e.style.display=text?'':'none'}}
  function setSummary(x){var e=document.getElementById('fn-live-epg-channel');if(e)e.textContent=x&&x.name?' · '+x.name:''}
  function cacheChannelId(x){return x&&x.id?'id:'+exactId(x.id):'name:'+norm(x&&x.name)}
  function xmlText(el,tag){var n=el&&el.getElementsByTagName(tag)[0];return n?String(n.textContent||'').trim():''}
  function parseDate(raw){var s=String(raw||'').trim(),m=s.match(/^(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{2})(?:\\s*([+-])(\\d{2})(?::?(\\d{2}))?)?/);if(m){var base=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+m[6]),off=m[7]?((+m[8]*60+(+m[9]||0))*60000)*(m[7]==='+'?1:-1):0;return new Date(base-off)}var d=new Date(s);return isNaN(d.getTime())?null:d}
  function parseFeed(text,x){var doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw Error('Invalid XMLTV');var wantedId=exactId(x&&x.id),wantedName=norm(x&&x.name),ids=[],channels=doc.getElementsByTagName('channel');for(var i=0;i<channels.length;i++){var c=channels[i],cid=exactId(c.getAttribute('id')||'');if(wantedId&&cid===wantedId)ids.push(cid)}var matchedBy=wantedId&&ids.length?'tvg-id':'';if(!ids.length&&wantedName){for(var j=0;j<channels.length;j++){var cc=channels[j],names=cc.getElementsByTagName('display-name'),ok=false;for(var k=0;k<names.length;k++){if(norm(names[k].textContent)===wantedName){ok=true;break}}if(ok)ids.push(exactId(cc.getAttribute('id')||''))}if(ids.length)matchedBy='name'}if(!ids.length&&wantedId){for(var q=0;q<channels.length;q++){var qc=channels[q],qid=exactId(qc.getAttribute('id')||'');if(qid===wantedId)ids.push(qid)}if(ids.length)matchedBy='tvg-id'}var idSet={};ids.forEach(function(id){if(id)idSet[id]=1});var programmes=doc.getElementsByTagName('programme'),out=[];for(var z=0;z<programmes.length;z++){var p=programmes[z],pid=exactId(p.getAttribute('channel')||'');if(!idSet[pid])continue;var start=parseDate(p.getAttribute('start')),end=parseDate(p.getAttribute('stop'));if(!start||!end||end<=start)continue;var title=xmlText(p,'title');if(!title)continue;out.push({start:start.getTime(),end:end.getTime(),title:title,desc:xmlText(p,'desc')})}out.sort(function(a,b){return a.start-b.start});var now=Date.now(),windowed=out.filter(function(p){return p.end>=now-36*60*60*1000&&p.start<=now+7*24*60*60*1000});return {matched:!!matchedBy&&windowed.length>0,matchedBy:matchedBy,programmes:windowed.slice(0,240)} }
  async function fetchText(url){var r=await fetch(url,{cache:'no-store',mode:'cors'});if(!r.ok)throw Error('EPG HTTP '+r.status);var isGz=/\\.gz(?:$|[?#])/i.test(url)||(r.headers.get('content-type')||'').toLowerCase().indexOf('gzip')>-1;if(isGz&&window.DecompressionStream){var stream=new Blob([await r.arrayBuffer()]).stream().pipeThrough(new DecompressionStream('gzip'));return await new Response(stream).text()}return await r.text()}
  function fresh(x){return x&&Number(x.at)>0&&Date.now()-Number(x.at)<TTL}
  function choose(programmes,now){var p=(programmes||[]).filter(function(x){return x&&isFinite(x.start)&&isFinite(x.end)&&x.end>x.start}).sort(function(a,b){return a.start-b.start}),current=null,previous=null,next=null;for(var i=0;i<p.length;i++){if(p[i].start<=now&&p[i].end>now)current=p[i];else if(p[i].end<=now)previous=p[i];else if(!next&&p[i].start>now)next=p[i]}return {previous:previous,current:current,next:next}}
  function fmt(t){try{return new Intl.DateTimeFormat(fa()?'fa-IR':'en-US',{hour:'2-digit',minute:'2-digit'}).format(new Date(t))}catch(e){return new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}}
  function render(programmes,matched){var d=document.getElementById('fn-live-epg');if(d)d.hidden=!matched;var list=document.getElementById('fn-live-epg-list');if(!list)return;list.innerHTML='';if(!matched||!programmes||!programmes.length){list.innerHTML='<div class="fn-live-epg-empty">'+esc(tr('اطلاعات برنامه موجود نیست','EPG not available'))+'</div>';return}var s=choose(programmes,Date.now()),rows=[['previous',tr('قبلی','Previous'),s.previous],['current',tr('اکنون','Now'),s.current],['next',tr('بعدی','Next'),s.next]];rows.forEach(function(row){var el=document.createElement('div');el.className='fn-live-epg-item'+(row[0]==='current'&&row[2]?' current':'');if(row[2]){var p=row[2];el.innerHTML='<div><div class="fn-live-epg-kind">'+esc(row[1])+'</div><div class="fn-live-epg-time">'+esc(fmt(p.start))+' – '+esc(fmt(p.end))+'</div></div><div><div class="fn-live-epg-name">'+esc(p.title)+'</div>'+(p.desc?'<div class="fn-live-epg-desc">'+esc(p.desc)+'</div>':'')+'</div>'}else{el.innerHTML='<div class="fn-live-epg-kind">'+esc(row[1])+'</div><div class="fn-live-epg-empty">—</div>'}list.appendChild(el)})}
  function drawLanguage(){var title=document.querySelector('[data-live-epg-label="title"]');if(title)title.textContent=tr('راهنمای برنامه','Programme guide');var d=document.getElementById('fn-live-epg');if(d&&d.open&&active)render(active.programmes,active.matched)}
  async function load(x){if(!x)return;active={channel:x,programmes:[],matched:false};var d=document.getElementById('fn-live-epg');if(d){d.hidden=true;d.open=false}setSummary(x);var serial=++requestNo;status(tr('در حال دریافت راهنمای برنامه…','Loading programme guide…'));var ck=cacheChannelId(x),cc=read(channelKey,{}),cached=cc[ck];if(fresh(cached)){active.programmes=cached.programmes||[];active.matched=!!cached.matched;render(active.programmes,active.matched);status(active.matched?tr('راهنما از حافظه بارگذاری شد','Guide loaded from cache'):tr('اطلاعات برنامه موجود نیست','EPG not available'));return}var sc=read(sourceKey,{}),eps=endpoints(x);for(var i=0;i<eps.length;i++){if(serial!==requestNo)return;var ep=eps[i],bucket=sc[ep];if(fresh(bucket)&&bucket.channels&&Object.prototype.hasOwnProperty.call(bucket.channels,ck)){var saved=bucket.channels[ck];active.programmes=saved.programmes||[];active.matched=!!saved.matched;if(active.matched)break;continue}try{var parsed=parseFeed(await fetchText(ep),x);bucket=fresh(bucket)&&bucket.channels?bucket:{at:Date.now(),channels:{}};bucket.at=Date.now();bucket.channels[ck]=parsed;sc[ep]=bucket;write(sourceKey,sc);active.programmes=parsed.programmes||[];active.matched=!!parsed.matched;if(active.matched)break}catch(e){if(i===eps.length-1)active.matched=false}}if(serial!==requestNo)return;cc[ck]={at:Date.now(),matched:active.matched,programmes:active.programmes||[]};write(channelKey,cc);render(active.programmes,active.matched);status(active.matched?tr('راهنما به‌روز شد','Guide updated'):tr('اطلاعات برنامه موجود نیست','EPG not available'))}
  window.fnLiveEPGLoad=function(x){load(x)};
  function init(){var d=document.getElementById('fn-live-epg');if(!d)return;d.addEventListener('toggle',function(){if(d.open){if(active)load(active.channel);else status(tr('یک شبکه را برای دریافت راهنمای برنامه پخش کنید','Play a channel to load its programme guide'))}});drawLanguage();var last='';setInterval(function(){var lang=String(typeof LANG==='undefined'?'fa':LANG);if(lang!==last){last=lang;drawLanguage()}if(d.open&&active&&active.matched)render(active.programmes,active.matched)},60000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();


;

(function(){'use strict';
  var shown=false;
  function fa(){return typeof LANG==='undefined'||LANG==='fa'}
  function usable(){var app=document.getElementById('app'),home=document.getElementById('home-tab');return !!(app&&home&&home.querySelector('header')&&(home.querySelector('.fn-mood-section, #default-sections, #fn-country-section, #movies-grid, #series-grid')||home.children.length>1))}
  function show(){if(shown||usable())return;shown=true;var box=document.getElementById('fn-app-load-error');if(!box)return;var f=fa(),title=document.getElementById('fn-app-load-error-title'),text=document.getElementById('fn-app-load-error-text'),retry=document.getElementById('fn-app-load-error-retry-label');if(title)title.textContent=f?'بارگذاری اپ کامل نشد':'The app could not finish loading';if(text)text.textContent=f?'اتصال اینترنت را بررسی کنید یا صفحه را دوباره باز کنید. اگر نسخهٔ ذخیره‌شده در دسترس باشد، اپ بدون این هشدار قابل استفاده خواهد بود.':'The page may be offline, incomplete, or need to be opened again. If a saved version is available, the app can still be used without this warning.';if(retry)retry.textContent=f?'تلاش دوباره':'Try again';box.hidden=false}
  function check(){if(!usable()&&(navigator.onLine===false||!window.__fnBooting))show()}
  function init(){setTimeout(check,12000);window.addEventListener('offline',function(){if(!usable())show()});var b=document.getElementById('fn-app-load-error-retry');if(b)b.addEventListener('click',function(){location.reload()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

