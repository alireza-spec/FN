
(function() {
    'use strict';

    // User's own Cloudflare Worker (deployed by the user)
    var OWN_WORKER = 'https://fragrant-hall-6fc1.jamesfranco1.workers.dev/?url=';

    // Domains that are commonly filtered and need a proxy fallback
    var FILTERED_DOMAINS = [
        'api.themoviedb.org',
        'image.tmdb.org',
        'api.mymemory.translated.net',
        'text.pollinations.ai'
    ];

    // Streaming-server embed domains (used by the online player)
    var PLAYER_DOMAINS = [
        'autoembed.co', 'vidsrcme.ru', '2embed.cc', 'embed.smashystream.com',
        'nontongo.win', '111movies.com', 'vidlink.pro',
        'player.videasy.net'
    ];

    // Ordered fallback proxies for generic fetch() (API/text) calls.
    // The user's own Worker is tried first since it's the most reliable.
    var FETCH_PROXIES = [
        function(u) { return OWN_WORKER + encodeURIComponent(u); },
        function(u) { return 'https://corsproxy.io/?url=' + encodeURIComponent(u); },
        function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
        function(u) { return 'https://thingproxy.freeboard.io/fetch/' + u; }
    ];

    // Dedicated image proxy: try the user's own Worker first, then weserv.nl
    // (a generic public image CDN) as a second-line fallback.
    function imgProxyUrl(u) {
        return OWN_WORKER + encodeURIComponent(u);
    }
    function imgProxyUrl2(u) {
        var stripped = u.replace(/^https?:\/\//, '');
        return 'https://images.weserv.nl/?url=' + encodeURIComponent(stripped) + '&output=jpg';
    }

    function isFilteredUrl(u) {
        if (typeof u !== 'string') return false;
        for (var i = 0; i < FILTERED_DOMAINS.length; i++) {
            if (u.indexOf(FILTERED_DOMAINS[i]) !== -1) return true;
        }
        return false;
    }
    function isImageDomain(u) {
        return typeof u === 'string' && u.indexOf('image.tmdb.org') !== -1;
    }

    // ── fetch() interception ───────────────────────────────────────────
    // Race direct request vs a short timer; if direct hasn't resolved in
    // time (typical symptom of DNS/SNI filtering), fall back through the
    // proxy chain in order. Works whether the user is filtered or not.
    var _origFetch = window.fetch.bind(window);

    function _timeoutPromise(ms) {
        return new Promise(function(resolve) { setTimeout(function() { resolve(null); }, ms); });
    }

    function _tryProxiesSequential(url, init, idx) {
        idx = idx || 0;
        if (idx >= FETCH_PROXIES.length) return Promise.reject(new Error('all proxies failed'));
        var proxied = FETCH_PROXIES[idx](url);
        return _origFetch(proxied, init).then(function(r) {
            if (r && r.ok) return r;
            return _tryProxiesSequential(url, init, idx + 1);
        }).catch(function() {
            return _tryProxiesSequential(url, init, idx + 1);
        });
    }

    window.fetch = function(input, init) {
        var url = (typeof input === 'string') ? input : (input && input.url);
        if (!isFilteredUrl(url)) return _origFetch(input, init);

        var direct = _origFetch(input, init).catch(function() { return null; });
        return Promise.race([direct, _timeoutPromise(3000)]).then(function(res) {
            if (res && res.ok) return res;
            return _tryProxiesSequential(url, init).catch(function() {
                return direct.then(function(r) { if (r) return r; throw new Error('network unreachable'); });
            });
        });
    };

    // ── <img src> + background-image interception ───────────────────────
    function _swapToProxy(el) {
        if (!el || el.__fnProxied) return;
        if (el.tagName === 'IMG') {
            var src = el.getAttribute('src');
            if (src && isImageDomain(src) && src.indexOf('images.weserv.nl') === -1 && src.indexOf('workers.dev') === -1) {
                el.__fnProxied = true;
                var testImg = new Image();
                var fallbackTimer = setTimeout(function() {
                    el.src = imgProxyUrl(src);
                    el.onerror = function() { el.onerror = null; el.src = imgProxyUrl2(src); };
                }, 1800);
                testImg.onload = function() { clearTimeout(fallbackTimer); };
                testImg.onerror = function() {
                    clearTimeout(fallbackTimer);
                    el.src = imgProxyUrl(src);
                    el.onerror = function() { el.onerror = null; el.src = imgProxyUrl2(src); };
                };
                testImg.src = src;
            }
        }
        var styleAttr = el.getAttribute && el.getAttribute('style');
        if (styleAttr && styleAttr.indexOf('image.tmdb.org') !== -1 && styleAttr.indexOf('images.weserv.nl') === -1 && styleAttr.indexOf('workers.dev') === -1) {
            var m = styleAttr.match(/url\((['"]?)(https?:\/\/image\.tmdb\.org[^'")]+)\1\)/);
            if (m && m[2]) {
                var orig = m[2];
                (function(targetEl, origUrl) {
                    var t = new Image();
                    var ft = setTimeout(function() {
                        targetEl.style.backgroundImage = 'url(' + imgProxyUrl(origUrl) + ')';
                    }, 1800);
                    t.onload = function() { clearTimeout(ft); };
                    t.onerror = function() { clearTimeout(ft); targetEl.style.backgroundImage = 'url(' + imgProxyUrl(origUrl) + ')'; };
                    t.src = origUrl;
                })(el, orig);
            }
        }
    }

    function _scanNode(node) {
        if (!node || node.nodeType !== 1) return;
        _swapToProxy(node);
        if (node.querySelectorAll) {
            var imgs = node.querySelectorAll('img[src*="image.tmdb.org"]');
            for (var i = 0; i < imgs.length; i++) _swapToProxy(imgs[i]);
            var styled = node.querySelectorAll('[style*="image.tmdb.org"]');
            for (var j = 0; j < styled.length; j++) _swapToProxy(styled[j]);
        }
    }

    document.addEventListener('DOMContentLoaded', function() { _scanNode(document.body); });
    if (document.body) _scanNode(document.body);

    var _mo = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var mu = mutations[i];
            if (mu.type === 'childList') {
                mu.addedNodes.forEach(function(n) { _scanNode(n); });
            } else if (mu.type === 'attributes') {
                _swapToProxy(mu.target);
            }
        }
    });
    function _startObserver() {
        _mo.observe(document.body, {
            childList: true, subtree: true,
            attributes: true, attributeFilter: ['src', 'style']
        });
    }
    if (document.body) _startObserver();
    else document.addEventListener('DOMContentLoaded', _startObserver);

    setInterval(function() { _scanNode(document.body); }, 4000);

    // ── Smart iframe loader for the online player ───────────────────────
    // Tries the direct server URL first; if it hasn't fired a 'load' event
    // within 4s (typical symptom of a blocked/filtered streaming domain),
    // automatically reloads the same iframe through the user's own
    // Cloudflare Worker proxy instead.
    var _iframeLoadTimer = null;
    var _iframeLoadToken  = 0;

    function _isPlayerDomainUrl(u) {
        if (typeof u !== 'string') return false;
        for (var i = 0; i < PLAYER_DOMAINS.length; i++) {
            if (u.indexOf(PLAYER_DOMAINS[i]) !== -1) return true;
        }
        return false;
    }

    window._setIframeSmart = function(url) {
        var iframe = document.getElementById('iframe');
        if (!iframe) return;

        clearTimeout(_iframeLoadTimer);
        var myToken = ++_iframeLoadToken;

        iframe.src = url;

        if (!_isPlayerDomainUrl(url) || url.indexOf('workers.dev') !== -1) return;

        var loaded = false;
        function onLoad() { loaded = true; iframe.removeEventListener('load', onLoad); }
        iframe.addEventListener('load', onLoad);

        _iframeLoadTimer = setTimeout(function() {
            if (myToken !== _iframeLoadToken) return;
            iframe.removeEventListener('load', onLoad);
            if (!loaded) {
                iframe.src = OWN_WORKER + encodeURIComponent(url);
            }
        }, 4000);
    };

})();


;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () { /* PWA optional — app still works fully without it */ });
        });
    }


;

/* External archive loader: only the index, then the relevant archive part on demand. */
(function () {
  'use strict';
  var FN_DL_BASE='download-data/', fnDlIndex=null, fnDlIndexPromise=null, fnDlParts={};
  function esc(v){var d=document.createElement('div');d.textContent=String(v||'');return d.innerHTML;}
  function isFa(){return typeof LANG==='undefined'||LANG==='fa';}
  function T(a,b){return isFa()?a:b;}
  var fnCurrentImdb='',fnImdbCache={},fnDetailToken=0;
  function selectedImdb(){return fnCurrentImdb;}
  function syncLocale(){
    var page=document.getElementById('fn-download-page'), back=document.getElementById('fn-dl-back'), sub=document.getElementById('fn-dl-page-subtitle'), b=document.getElementById('fn-detail-download-button');
    if(page){page.style.direction=isFa()?'rtl':'ltr';page.dir=isFa()?'rtl':'ltr';}
    if(back){back.setAttribute('aria-label',T('بازگشت','Back'));back.innerHTML='<i class="fa-solid '+(isFa()?'fa-arrow-right':'fa-arrow-left')+'"></i>';}
    if(sub)sub.textContent=T('انتخاب کیفیت دانلود','Choose download quality');
    if(b){var label=b.querySelector('.fn-dl-label');if(label)label.textContent=T('دانلود','Download');}
  }
  function resolveImdb(tmdbId,type){
    if(!tmdbId||(type!=='movie'&&type!=='tv'))return Promise.resolve('');var key=type+':'+tmdbId;if(fnImdbCache[key])return Promise.resolve(fnImdbCache[key]);
    var m=document.documentElement.innerHTML.match(/const\s+API\s*=\s*['\"]([^'\"]+)['\"]/);if(!m)return Promise.resolve('');
    return fetch('https://family-night-api.alirezadoe8.workers.dev/v1/tmdb/'+type+'/'+encodeURIComponent(tmdbId)+'/external_ids').then(function(r){return r.ok?r.json():{};}).then(function(d){var x=(d&&d.imdb_id||'').toLowerCase();fnImdbCache[key]=/^tt\d+$/.test(x)?x:'';return fnImdbCache[key];}).catch(function(){return '';});
  }
  function getIndex(){if(fnDlIndex)return Promise.resolve(fnDlIndex);if(!fnDlIndexPromise)fnDlIndexPromise=fetch(FN_DL_BASE+'download-index.json',{cache:'force-cache'}).then(function(r){if(!r.ok)throw Error('index');return r.json();}).then(function(x){fnDlIndex=x||{};return fnDlIndex;});return fnDlIndexPromise;}
  function loadPart(part){if(fnDlParts[part])return Promise.resolve(fnDlParts[part]);var n=Number(part);if(n!==1&&n!==2&&n!==3)return Promise.reject(Error('archive part'));var file='archive-part-'+n+'.html';return fetch(FN_DL_BASE+file,{cache:'force-cache'}).then(function(r){if(!r.ok)throw Error('archive');return r.text();}).then(function(t){var d=new DOMParser().parseFromString(t,'text/html');fnDlParts[n]=d;return d;});}
  function recordFromArchive(doc,imdb){
    var code=Array.prototype.find.call(doc.querySelectorAll('p'),function(p){var x=(p.textContent||'').toLowerCase();return x.indexOf('imdb code:')>-1&&x.indexOf(imdb)>-1;});if(!code)return null;
    var head=code.previousElementSibling;while(head&&head.tagName!=='H3')head=head.previousElementSibling;var title=head?head.textContent.replace(/^\s*\d+\.\s*/,'').replace(/\s+start_year\s*$/i,'').trim():'',cat='',season='',groups={softsub:[],dubbed:[]},n=code.nextElementSibling;
    while(n&&n.tagName!=='H3'){var txt=(n.textContent||'').trim(),low=txt.toLowerCase();if(/soft\s*sub/.test(low))cat='softsub';else if(/dubbed/.test(low))cat='dubbed';else if(/^season\s*\d+/i.test(txt))season=txt.match(/\d+/)[0];else if(cat&&n.querySelectorAll('a').length)Array.prototype.forEach.call(n.querySelectorAll('a'),function(a){var q=(a.textContent||'').trim(),href=a.getAttribute('href')||'';if(!href||!q)return;var tail=txt.replace(q,'').replace(/^\s*\/\s*/,'').trim(),size=(tail.match(/(?:\d+(?:\.\d+)?\s*(?:GB|MB))/i)||[])[0]||'';groups[cat].push({quality:q,url:href,size:size,season:season});});n=n.nextElementSibling;}
    return {title:title,groups:groups};
  }
  function menuHtml(url,tone){var u=esc(url);return '<div class="fn-dl-methods" aria-hidden="true">'
    +'<button type="button" class="fn-dl-method" data-fn-action="copy" data-url="'+u+'"><i class="fa-regular fa-copy"></i><span>'+T('کپی لینک','Copy link')+'</span></button>'
    +'<button type="button" class="fn-dl-method" data-fn-action="adm" data-url="'+u+'"><i class="fa-solid fa-mobile-screen-button"></i><span>'+T('دانلود با ADM (اندروید)','Download with ADM (Android)')+'</span></button>'
    +'<button type="button" class="fn-dl-method fn-dl-method-primary" data-fn-action="download" data-url="'+u+'"><i class="fa-solid fa-download"></i><span>'+T('دانلود','Download')+'</span></button>'
    +'<button type="button" class="fn-dl-method fn-dl-more-toggle" data-fn-action="more"><i class="fa-solid fa-ellipsis"></i><span>'+T('بیشتر…','More…')+'</span><i class="fa-solid fa-chevron-down fn-dl-chevron"></i></button>'
    +'<div class="fn-dl-more-options">'
      +'<button type="button" class="fn-dl-method" data-fn-action="ios" data-url="'+u+'"><i class="fa-brands fa-apple"></i><span>'+T('باز کردن با IDM (iOS)','Open with IDM (iOS)')+'</span></button>'
      +'<button type="button" class="fn-dl-method" data-fn-action="desktop" data-url="'+u+'"><i class="fa-solid fa-desktop"></i><span>'+T('دانلود با دانلود منیجر (دسکتاپ)','Download with download manager (Desktop)')+'</span></button>'
      +'<button type="button" class="fn-dl-method" data-fn-action="share" data-url="'+u+'"><i class="fa-solid fa-share-nodes"></i><span>'+T('انتخاب برنامهٔ دیگر…','Choose another app…')+'</span></button>'
    +'</div></div>';}
  function groupHtml(label,icon,tone,links){if(!links.length)return '';var map={};links.forEach(function(x){(map[x.season||(isFa()?'فیلم':'Movie')]||(map[x.season||(isFa()?'فیلم':'Movie')]=[])).push(x);});var out='<section style="margin:0 0 20px;border:1px solid '+tone+';border-radius:15px;overflow:hidden;background:#101512;"><div style="padding:12px 14px;background:rgba(255,255,255,.035);font-weight:800;color:'+tone+';"><i class="fa-solid '+icon+'"></i> '+label+'</div>';
    Object.keys(map).forEach(function(s){out+='<div style="padding:12px 12px 2px;">'+((s===(isFa()?'فیلم':'Movie'))?'':'<div style="font-size:12px;color:var(--text);font-weight:bold;margin:0 2px 9px;">'+T('فصل ','Season ')+esc(s)+'</div>');map[s].forEach(function(x){var u=esc(x.url),playMenu='<div class="fn-dl-play-options"><div class="fn-dl-play-note">'+T('در اندروید، در صورت نصب‌بودن برنامه، تلاش می‌شود لینک مستقیماً در پلیر باز شود. در iOS و دسکتاپ، گزینهٔ اشتراک‌گذاری یا کپی لینک را انتخاب کنید.','On Android, the link is opened in the selected installed player when possible. On iOS and desktop, use sharing or copy the link to your player.')+'</div><button type="button" class="fn-dl-method" data-fn-action="vlc" data-url="'+u+'"><i class="fa-solid fa-play"></i><span>'+T('پخش با VLC','Play with VLC')+'</span></button><button type="button" class="fn-dl-method" data-fn-action="mx" data-url="'+u+'"><i class="fa-solid fa-play"></i><span>'+T('پخش با MX Player','Play with MX Player')+'</span></button><button type="button" class="fn-dl-method" data-fn-action="km" data-url="'+u+'"><i class="fa-solid fa-play"></i><span>'+T('پخش با KMPlayer','Play with KMPlayer')+'</span></button><button type="button" class="fn-dl-method" data-fn-action="player-share" data-url="'+u+'"><i class="fa-solid fa-share-nodes"></i><span>'+T('باز کردن با پلیر دیگر…','Open with another player…')+'</span></button></div>';out+='<div class="fn-dl-choice"><div class="fn-dl-quality" style="--fn-tone:'+tone+';"><button type="button" class="fn-dl-quality-main" data-url="'+u+'" aria-expanded="false"><i class="fa-solid fa-download" style="color:'+tone+';"></i><span style="flex:1;min-width:0;direction:ltr;text-align:left;font-size:12px;font-weight:700;">'+esc(x.quality)+'</span>'+(x.size?'<span style="font-size:11px;color:var(--sub);direction:ltr;">'+esc(x.size)+'</span>':'')+'<i class="fa-solid fa-chevron-down fn-dl-chevron"></i></button><button type="button" class="fn-dl-play-trigger" data-fn-action="play-menu" aria-label="'+T('گزینه‌های پخش','Playback options')+'" title="'+T('گزینه‌های پخش','Playback options')+'"><i class="fa-solid fa-play"></i></button></div>'+menuHtml(x.url,tone)+playMenu+'</div>';});out+='</div>';});return out+'</section>';}
  function notice(msg,ok){var n=document.getElementById('fn-dl-notice');if(!n){n=document.createElement('div');n.id='fn-dl-notice';document.body.appendChild(n);}n.textContent=msg;n.className='show '+(ok?'ok':'');clearTimeout(notice.timer);notice.timer=setTimeout(function(){n.className='';},2400);}
  function directDownload(url){var a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.download='';document.body.appendChild(a);a.click();a.remove();}
  function copyUrl(url){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(function(){notice(T('لینک کپی شد','Link copied'),true);},function(){fallbackCopy(url);});}else fallbackCopy(url);}
  function fallbackCopy(url){var t=document.createElement('textarea');t.value=url;t.style.cssText='position:fixed;opacity:0;';document.body.appendChild(t);t.select();try{document.execCommand('copy');notice(T('لینک کپی شد','Link copied'),true);}catch(e){notice(T('کپی لینک ممکن نشد','Could not copy the link'));}t.remove();}
  function shareUrl(url){if(navigator.share){navigator.share({url:url}).catch(function(){});}else{copyUrl(url);notice(T('لینک کپی شد؛ آن را در برنامهٔ دلخواه باز کنید','Link copied; open it in your preferred app'),true);}}
  function openADM(url){if(!/Android/i.test(navigator.userAgent)){notice(T('ADM برای اندروید است؛ دانلود مستقیم آغاز می‌شود','ADM is for Android; starting direct download'));directDownload(url);return;}var m=url.match(/^(https?):\/\/(.*)$/i);if(!m){directDownload(url);return;}var intent='intent://'+m[2]+'#Intent;scheme='+m[1]+';package=com.dv.adm;end';window.location.href=intent;setTimeout(function(){directDownload(url);},850);}
  function openPlayer(url,pkg,name){if(/Android/i.test(navigator.userAgent)){var m=url.match(/^(https?):\/\/(.*)$/i);if(!m){shareUrl(url);return;}var moved=false,onHide=function(){moved=document.hidden;};document.addEventListener('visibilitychange',onHide);window.location.href='intent://'+m[2]+'#Intent;scheme='+m[1]+';package='+pkg+';end';setTimeout(function(){document.removeEventListener('visibilitychange',onHide);if(!moved){notice(T(name+' نصب نیست یا این لینک را باز نمی‌کند؛ انتخاب پلیر دیگر نمایش داده شد.',name+' is unavailable or cannot open this link; choose another player.'),false);shareUrl(url);}},1100);return;}if(/iPhone|iPad|iPod/i.test(navigator.userAgent)){notice(T('از منوی اشتراک‌گذاری، پلیر نصب‌شده را انتخاب کنید.','Choose an installed player from the share menu.'),true);shareUrl(url);return;}copyUrl(url);notice(T('لینک کپی شد؛ آن را در '+name+' باز کنید.','Link copied; open it in '+name+'.'),true);}
  function bindDownloadMethods(){var box=document.getElementById('fn-dl-page-content');if(!box||box.dataset.fnBound)return;box.dataset.fnBound='1';box.addEventListener('click',function(e){var q=e.target.closest('.fn-dl-quality-main');if(q){var choice=q.closest('.fn-dl-choice'),open=choice.classList.contains('open');Array.prototype.forEach.call(box.querySelectorAll('.fn-dl-choice.open'),function(x){x.classList.remove('open');x.querySelector('.fn-dl-quality-main').setAttribute('aria-expanded','false');});if(!open){choice.classList.add('open');q.setAttribute('aria-expanded','true');}return;}var b=e.target.closest('[data-fn-action]');if(!b)return;e.stopPropagation();var action=b.getAttribute('data-fn-action'),url=b.getAttribute('data-url')||'',choice=b.closest('.fn-dl-choice');if(action==='more'){choice.classList.toggle('more-open');return;}if(action==='play-menu'){choice.classList.toggle('play-open');return;}if(action==='copy')copyUrl(url);else if(action==='adm')openADM(url);else if(action==='download'||action==='desktop')directDownload(url);else if(action==='ios'||action==='share'||action==='player-share')shareUrl(url);else if(action==='vlc')openPlayer(url,'org.videolan.vlc','VLC');else if(action==='mx')openPlayer(url,'com.mxtech.videoplayer.ad','MX Player');else if(action==='km')openPlayer(url,'com.kmplayer','KMPlayer');});}
  window.closeFNDownloadPage=function(){var p=document.getElementById('fn-download-page');if(p){p.style.display='none';p.setAttribute('aria-hidden','true');}};
  function openInternalFallback(){
    var page=document.getElementById('fn-download-page'); if(page){page.style.display='none';page.setAttribute('aria-hidden','true');}
    if(typeof renderDlButtons==='function') renderDlButtons(curTitle||'');
    var box=document.getElementById('download-links-box');
    if(box){box.style.display='block';box.scrollIntoView({behavior:'smooth',block:'center'});}
  }
  window.openFNDownloadPage=async function(){syncLocale();var page=document.getElementById('fn-download-page'),box=document.getElementById('fn-dl-page-content'),title=document.getElementById('fn-dl-page-title'),imdb=selectedImdb(),token=fnDetailToken;if(!imdb)return;title.textContent=(document.getElementById('d-title')||{}).textContent||'';box.innerHTML='<div style="text-align:center;padding:50px 15px;color:var(--sub);"><i class="fa-solid fa-spinner fa-spin" style="font-size:25px;color:var(--primary);"></i><div style="margin-top:12px;">'+T('در حال آماده‌سازی لینک‌ها…','Preparing download links…')+'</div></div>';page.style.display='block';page.setAttribute('aria-hidden','false');try{var index=await getIndex(),part=index[imdb];if(token!==fnDetailToken||imdb!==selectedImdb())return;if(!part){openInternalFallback();return;}var rec=recordFromArchive(await loadPart(part),imdb);if(token!==fnDetailToken||imdb!==selectedImdb())return;if(!rec||(!rec.groups.softsub.length&&!rec.groups.dubbed.length))throw Error('record');box.innerHTML='<div style="font-size:12px;color:var(--sub);line-height:1.8;margin-bottom:15px;">'+T('کیفیت، انکود و حجمِ موجود را انتخاب کنید.','Choose from the available quality, encode and file size.')+'</div>'+groupHtml(T('زیرنویس فارسی چسبیده','Persian hardcoded subtitles'),'fa-closed-captioning','var(--primary)',rec.groups.softsub)+groupHtml(T('دوبله فارسی','Persian dubbed'),'fa-microphone-lines','var(--primary)',rec.groups.dubbed);}catch(e){if(token!==fnDetailToken||imdb!==selectedImdb())return;if(typeof DOWNLOADS_DB!=='undefined'&&DOWNLOADS_DB[imdb]){openInternalFallback();return;}box.innerHTML='<div style="text-align:center;padding:45px 12px;color:var(--sub);line-height:2;">'+T('لینک دانلودی برای این اثر پیدا نشد یا فایل آرشیو در دسترس نیست.','No download links were found for this title, or the archive is unavailable.')+'</div>';}};
  function setDownloadButtonPending(){var b=document.getElementById('fn-detail-download-button');if(!b)return;b.style.display='flex';b.style.opacity='.55';b.style.pointerEvents='none';b.setAttribute('aria-disabled','true');syncLocale();}
  function updateButton(token){if(token!==fnDetailToken)return;var b=document.getElementById('fn-detail-download-button'),imdb=selectedImdb();if(!b)return;var db=(!imdb||typeof DOWNLOADS_DB==='undefined')?null:DOWNLOADS_DB[imdb],dbAvailable=!!(db&&((db.type==='tvSeries')||(db.softsub&&Object.keys(db.softsub).length)||(db.dubbed&&Object.keys(db.dubbed).length)));var available=!!(imdb&&((fnDlIndex&&fnDlIndex[imdb])||dbAvailable));b.style.display=available?'flex':'none';b.style.opacity='';b.style.pointerEvents=available?'':'none';b.setAttribute('aria-disabled',available?'false':'true');syncLocale();}
  function addButton(){
    var playLabel=document.getElementById('txt-hero-play'),b=document.getElementById('fn-detail-download-button');
    if(b){syncLocale();return;} if(!playLabel)return;
    var play=playLabel.parentElement, holder=play.parentElement;
    var group=document.createElement('div'); group.className='fn-play-download-group';
    holder.insertBefore(group,play); group.appendChild(play);
    b=document.createElement('div'); b.id='fn-detail-download-button'; b.setAttribute('role','button'); b.tabIndex=0;
    b.onclick=window.openFNDownloadPage;
    b.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();window.openFNDownloadPage();}};
    b.innerHTML='<div class="hero-play-circle fn-download-circle"><i class="fa-solid fa-download"></i></div><span class="fn-dl-label"></span>';
    group.appendChild(b); syncLocale();
  }
  bindDownloadMethods();
  var originalOpen=window.openDetail;if(typeof originalOpen==='function')window.openDetail=async function(){var tmdbId=arguments[0],mediaType=arguments[1],token=++fnDetailToken;fnCurrentImdb='';var r=originalOpen.apply(this,arguments);try{await r;}finally{if(token===fnDetailToken){addButton();setDownloadButtonPending();Promise.all([resolveImdb(tmdbId,mediaType),getIndex()]).then(function(result){if(token!==fnDetailToken)return;fnCurrentImdb=result[0];updateButton(token);setTimeout(function(){if(token===fnDetailToken)updateButton(token);},350);}).catch(function(){if(token!==fnDetailToken)return;var b=document.getElementById('fn-detail-download-button'),db=(typeof DOWNLOADS_DB!=='undefined'&&fnCurrentImdb&&DOWNLOADS_DB[fnCurrentImdb]),ok=!!(db&&((db.type==='tvSeries')||(db.softsub&&Object.keys(db.softsub).length)||(db.dubbed&&Object.keys(db.dubbed).length)));if(b){b.style.display=ok?'flex':'none';b.style.opacity='';b.style.pointerEvents=ok?'':'none';b.setAttribute('aria-disabled',ok?'false':'true');syncLocale();}});}}return r;};document.addEventListener('DOMContentLoaded',function(){addButton();syncLocale();bindDownloadMethods();});
})();


;

(function(){
  'use strict';
  function esc(v){var d=document.createElement('div');d.textContent=String(v==null?'':v);return d.innerHTML;}
  function detailData(){try{return (typeof curDataForFav!=='undefined'&&curDataForFav)||null;}catch(e){return null;}}
  function titleYear(d){
    if(!d)return '';
    var start=String(d.release_date||d.first_air_date||'').slice(0,4);
    if(!start)return '';
    if((typeof curType!=='undefined'&&curType==='tv')){
      var status=String(d.status||'').toLowerCase(), end=String(d.last_air_date||'').slice(0,4);
      return (end && (status==='ended'||status==='canceled'||status==='cancelled')) ? start+'-'+end : start+'-';
    }
    return start;
  }
  function putTitleYear(){
    var h=document.getElementById('d-title'),d=detailData();if(!h||!d)return;
    var title=(typeof curTitle!=='undefined'&&curTitle)||d.title||d.name||'';
    var y=titleYear(d);
    h.innerHTML=esc(title)+(y?' <span class="fn-detail-title-year">('+esc(y)+')</span>':'');
    var old=document.getElementById('d-year');if(old)old.style.display='none';
  }
  function scoreMarkup(){
    var meta=document.querySelector('#modal .m-meta');if(!meta)return null;
    var old=meta.querySelector('.fn-detail-score-row');if(old)return old;
    Array.prototype.forEach.call(meta.children,function(x){x.style.display='none';});
    var row=document.createElement('div');row.className='fn-detail-score-row';
    row.innerHTML='<span class="fn-detail-score rt">ROTTEN TOMATOES: <b class="score-value" data-score="rt">-</b></span>'+
      '<span class="fn-detail-score mc">METACRITIC: <b class="score-value" data-score="mc">-</b></span>'+
      '<span class="fn-detail-score imdb">IMDb: <b class="score-value" data-score="imdb">-</b> <span data-score="votes"></span></span>';
    meta.appendChild(row);return row;
  }
  function setScore(row,key,val){var e=row&&row.querySelector('[data-score="'+key+'"]');if(e)e.textContent=(val==null||val==='')?'-':String(val);}
  async function loadScores(row){
    var id='';try{id=(typeof curImdb!=='undefined'&&curImdb)||'';}catch(e){}
    if(!id){setScore(row,'rt',null);setScore(row,'mc',null);setScore(row,'imdb',null);setScore(row,'votes','');return;}
    var data=null,keys=['f6dd47c8','564727fa','trilogy'];
    for(var i=0;i<keys.length&&!data;i++){
      try{var r=await fetch('https://www.omdbapi.com/?i='+encodeURIComponent(id)+'&apikey='+keys[i],{cache:'no-store'});if(r.ok){var x=await r.json();if(x&&x.Response==='True')data=x;}}catch(e){}
    }
    if(!data){setScore(row,'rt',null);setScore(row,'mc',null);setScore(row,'imdb',null);setScore(row,'votes','');return;}
    var rt=null;if(Array.isArray(data.Ratings)){var rr=data.Ratings.find(function(x){return x.Source==='Rotten Tomatoes';});if(rr&&rr.Value&&rr.Value!=='N/A')rt=rr.Value.replace(/\s/g,'');}
    var mc=(data.Metascore&&data.Metascore!=='N/A')?data.Metascore:null;
    var imdb=(data.imdbRating&&data.imdbRating!=='N/A')?data.imdbRating:null;
    setScore(row,'rt',rt);setScore(row,'mc',mc);setScore(row,'imdb',imdb);setScore(row,'votes',(data.imdbVotes&&data.imdbVotes!=='N/A')?' ('+data.imdbVotes+')':'');
  }
  function compactPlayDownload(){
    var label=document.getElementById('txt-hero-play'),play=label&&label.parentElement,group=play&&play.parentElement;
    if(group&&group.classList.contains('fn-play-download-group')){group.style.setProperty('display','flex','important');group.style.setProperty('flex-direction','row','important');}
  }
  function normalizeTitles(){
    var h=document.getElementById('d-title'),fa=document.getElementById('d-title-fa'),sec=document.getElementById('d-title-secondary'),d=detailData();
    if(!h)return;
    var faMode=(typeof LANG!=='undefined'&&LANG==='fa');
    var rawMain=String((typeof curTitle!=='undefined'&&curTitle)||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
    var english=(window.__fnDetailEnglishTitle||'')||((d&&((d.title||d.name)))||rawMain);
    var native=(d&&((d.original_title||d.original_name)))||'';
    var translated=fa&&fa.textContent.trim()?fa.textContent.trim():'';
    var main=faMode?(english||rawMain):(rawMain||english);
    var second='';
    if(faMode){
      if(translated && translated!==main) second=translated;
      else if(native && native!==main && /[^A-Za-z0-9 .,!?&'’():\-]/.test(native)) second=native;
      else if(rawMain && rawMain!==main && /[^A-Za-z0-9 .,!?&'’():\-]/.test(rawMain)) second=rawMain;
    }else if(native && native!==main && /[^A-Za-z0-9 .,!?&'’():\-]/.test(native)) second=native;
    var y=titleYear(d||{});
    var e=document.createElement('span');e.textContent=main+(y?' ('+y+')':'');h.textContent='';h.appendChild(e);
    [fa,sec].forEach(function(x){if(x){x.style.fontSize=getComputedStyle(h).fontSize;x.style.color=getComputedStyle(h).color;x.style.fontWeight=getComputedStyle(h).fontWeight;x.style.lineHeight='1.2';x.style.margin='0';x.style.display='none';}});
    if(second&&sec){sec.textContent=second;sec.style.display='block';}
    if(fa)fa.style.display='none';
  }
  function moveWhereToWatch(){var w=document.getElementById('wtw-btn'),c=document.querySelector('#modal .cast-section');if(w&&c&&c.nextElementSibling!==w)c.insertAdjacentElement('afterend',w);}
  function apply(){
    putTitleYear(); normalizeTitles(); moveWhereToWatch();
    Array.prototype.forEach.call(document.querySelectorAll("#modal .additional-scores"),function(x){x.remove();});
    var row=scoreMarkup();
    if(row)loadScores(row);
    compactPlayDownload();
    /* Keep the pre-existing data-driven visibility; only change its placement. */
  }
  function resetDetailScroll(){
    try{
      /* Only reset the Open Details card; never move Home/category/tab scroll. */
      var modal=document.getElementById('modal');
      if(modal) modal.scrollTop=0;
    }catch(e){}
  }
  var oldOpen=window.openDetail;
  if(typeof oldOpen==='function'){
    window.openDetail=async function(){
      resetDetailScroll();
      var result=await oldOpen.apply(this,arguments);
      resetDetailScroll();
      setTimeout(resetDetailScroll,0);
      setTimeout(resetDetailScroll,120);
      setTimeout(apply,0);setTimeout(apply,450);return result;
    };
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(apply,300);setInterval(function(){if(document.getElementById('modal')&&document.getElementById('modal').style.display!=='none'){normalizeTitles();moveWhereToWatch();compactPlayDownload();}},700);});
})();

