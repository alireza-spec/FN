(function(){
            'use strict';
            function byId(id){ return document.getElementById(id); }
            function isFaLang(){ return (typeof LANG !== 'undefined' ? LANG : 'fa') === 'fa'; }
            function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
            function fmtSize(bytes){
                bytes = parseInt(bytes,10);
                if(!bytes) return '';
                var mb = bytes/1048576;
                if(mb > 1024) return (mb/1024).toFixed(1)+' GB';
                return Math.round(mb)+' MB';
            }
            var ALLOWED_FORMATS = ['MPEG4','h.264','512Kb MPEG4','MPEG2','Matroska','Ogg Video','DivX','Windows Media','Cinepack','h.264 IA'];
            var pdToken = 0;

            function hideBox(){
                var box = byId('pd-dl-box');
                if(box) box.style.display = 'none';
            }
            function showStatus(msg){
                var box = byId('pd-dl-box'), st = byId('pd-dl-status'), grid = byId('pd-dl-grid');
                if(!box) return;
                box.style.display = 'block';
                if(st){ st.style.display = 'block'; st.textContent = msg; }
                if(grid){ grid.style.display = 'none'; grid.innerHTML = ''; }
                var lab = byId('pd-dl-title'); if(lab) lab.textContent = isFaLang() ? 'دانلود رایگان و قانونی (Public Domain)' : 'Free & Legal Download (Public Domain)';
                var note = byId('pd-dl-note'); if(note) note.textContent = isFaLang()
                    ? 'این فایل‌ها از آرشیو عمومی Archive.org هستند؛ چون کپی‌رایت این اثر منقضی شده، دانلود کاملاً رایگان، قانونی و بدون نیاز به ثبت‌نام است.'
                    : 'These files are hosted on the public Archive.org. Since this title\'s copyright has expired, downloading is completely free, legal, and requires no account.';
            }
            function renderGrid(identifier, items){
                var box = byId('pd-dl-box'), st = byId('pd-dl-status'), grid = byId('pd-dl-grid');
                if(!box || !grid) return;
                box.style.display = 'block';
                if(st) st.style.display = 'none';
                grid.style.display = 'grid';
                grid.innerHTML = items.slice(0,6).map(function(f){
                    var url = 'https://archive.org/download/' + identifier + '/' + encodeURIComponent(f.name);
                    var label = (f.format||'File') + (f.height ? (' · '+f.height+'p') : '') + (f.size ? (' · '+fmtSize(f.size)) : '');
                    return '<a href="'+url+'" target="_blank" rel="noopener" download '+
                        'style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:#111;border:1px solid #262626;border-radius:8px;color:#7eb8f7;text-decoration:none;font-size:12px;">' +
                        '<span style="display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-download"></i>'+label+'</span>' +
                        '<i class="fa-solid fa-arrow-down-to-bracket"></i></a>';
                }).join('');
            }
            async function checkPublicDomain(title, year, type, tmdbId, token){
                try {
                    if ((type !== 'movie' && type !== 'tv') || !title) { hideBox(); return; }
                    var match = null;
                    var knownId = tmdbId && window.PD_ARCHIVE_IDS ? window.PD_ARCHIVE_IDS[tmdbId] : null;
                    if (knownId) {
                        match = { identifier: knownId };
                    } else if (type === 'movie') {
                        var nTitle = norm(title);
                        if (!nTitle) { hideBox(); return; }
                        showStatus(isFaLang() ? 'در حال بررسی آرشیو رایگان...' : 'Checking free archive...');
                        var q = 'mediatype:(movies) AND title:("' + title.replace(/["\\]/g,'') + '")';
                        var url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
                            '&fl[]=identifier&fl[]=title&fl[]=year&rows=8&output=json';
                        var res = await fetch(url);
                        if (token !== pdToken) return;
                        if (!res.ok) { hideBox(); return; }
                        var data = await res.json();
                        var docs = (data && data.response && data.response.docs) || [];
                        for (var i=0; i<docs.length; i++){
                            var doc = docs[i];
                            if (norm(doc.title) === nTitle && (!year || !doc.year || String(doc.year) === String(year))) { match = doc; break; }
                        }
                    }
                    if (!match) { hideBox(); return; }
                    showStatus(isFaLang() ? 'در حال بررسی آرشیو رایگان...' : 'Checking free archive...');
                    var metaRes = await fetch('https://archive.org/metadata/' + encodeURIComponent(match.identifier));
                    if (token !== pdToken) return;
                    if (!metaRes.ok) { hideBox(); return; }
                    var meta = await metaRes.json();
                    var files = (meta && meta.files) || [];
                    var items = files.filter(function(f){
                        return f.format && ALLOWED_FORMATS.indexOf(f.format) > -1 && f.size && /\.(mp4|ogv|mkv|avi|mpg|mpeg|wmv)$/i.test(f.name||'');
                    });
                    if (token !== pdToken) return;
                    if (!items.length) { hideBox(); return; }
                    items.sort(function(a,b){ return (parseInt(b.size,10)||0) - (parseInt(a.size,10)||0); });
                    renderGrid(match.identifier, items);
                } catch(e) { hideBox(); }
            }
            window.checkPublicDomainDownloads = function(title, year, type, tmdbId){
                hideBox();
                pdToken++;
                var myToken = pdToken;
                checkPublicDomain(title, year, type, tmdbId, myToken);
            };
        })();
        // =================== END PUBLIC DOMAIN FREE DOWNLOADS ===================

        // =================== PUBLIC DOMAIN BROWSE PAGE (sidebar menu, Archive.org) ===================
        (function(){
            'use strict';
            function byId(id){ return document.getElementById(id); }
            function isFaLang(){ return (typeof LANG !== 'undefined' ? LANG : 'fa') === 'fa'; }
            function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
            function fmtSize(bytes){
                bytes = parseInt(bytes,10);
                if(!bytes) return '';
                var mb = bytes/1048576;
                if(mb > 1024) return (mb/1024).toFixed(1)+' GB';
                return Math.round(mb)+' MB';
            }
            var ALLOWED_FORMATS = ['MPEG4','h.264','512Kb MPEG4','MPEG2','Matroska','Ogg Video','DivX','Windows Media','Cinepack','h.264 IA'];
            var pdPage = 1, pdLoading = false;

            var PD_MOVIE_CATEGORIES = [
                { value: 'all', collections: ['feature_films','moviesandfilms','silent_films','animationandcartoons','prelinger'], fa: 'همه دسته‌ها', en: 'All Categories' },
                { value: 'feature_films', collections: ['feature_films'], fa: 'فیلم‌های سینمایی', en: 'Feature Films' },
                { value: 'moviesandfilms', collections: ['moviesandfilms'], fa: 'آرشیو عمومی فیلم', en: 'General Film Archive' },
                { value: 'silent_films', collections: ['silent_films'], fa: 'سینمای صامت', en: 'Silent Films' },
                { value: 'animationandcartoons', collections: ['animationandcartoons'], fa: 'انیمیشن', en: 'Animation' },
                { value: 'prelinger', collections: ['prelinger'], fa: 'آموزشی و صنعتی (Prelinger)', en: 'Educational/Industrial (Prelinger)' }
            ];

            window.openPublicDomainPage = function(){
                var page = byId('pd-grid-page');
                if (!page) return;
                page.style.display = 'flex';
                var lab = byId('pd-grid-title'); if(lab) lab.textContent = isFaLang() ? 'دانلود رایگان (Public Domain)' : 'Free Downloads (Public Domain)';
                var typeSel = byId('pd-type-select');
                if (typeSel) {
                    typeSel.innerHTML = isFaLang() ?
                        '<option value="movie">فیلم سینمایی</option><option value="tv">سریال</option>' :
                        '<option value="movie">Movies</option><option value="tv">TV Series</option>';
                    typeSel.value = 'movie';
                }
                var slab = byId('pd-sort-label'); if(slab) slab.textContent = isFaLang() ? 'مرتب‌سازی' : 'Sort';
                var sel = byId('pd-sort-select');
                if (sel) {
                    sel.innerHTML = isFaLang() ?
                        '<option value="popular">محبوب‌ترین</option><option value="newest">جدیدترین</option><option value="oldest">قدیمی‌ترین</option><option value="top_rated">بالاترین امتیاز</option>' :
                        '<option value="popular">Most Popular</option><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="top_rated">Top Rated</option>';
                }
                buildPDCategoryOptions();
                var content = byId('pd-grid-content'); if (content) content.innerHTML = '';
                var moreBtn = byId('pd-grid-more'); if (moreBtn) moreBtn.textContent = isFaLang() ? 'بیشتر' : 'Load More';
                pdArchivePage = 1;
                loadPDGrid(true);
            };
            function buildPDCategoryOptions(){
                var typeSel = byId('pd-type-select');
                var contentType = typeSel ? typeSel.value : 'movie';
                var catRow = byId('pd-cat-row');
                var catSel = byId('pd-cat-select');
                if (!catSel) return;
                if (contentType === 'tv') {
                    if (catRow) catRow.style.display = 'none';
                    return;
                }
                if (catRow) catRow.style.display = 'flex';
                var prevVal = catSel.value || 'all';
                catSel.innerHTML = PD_MOVIE_CATEGORIES.map(function(c){
                    return '<option value="'+c.value+'">'+(isFaLang()?c.fa:c.en)+'</option>';
                }).join('');
                catSel.value = prevVal;
                if (catSel.value !== prevVal) catSel.value = 'all';
            }
            window.closePDGridPage = function(){
                var page = byId('pd-grid-page');
                if (page) page.style.display = 'none';
            };

            var pdArchivePage = 1;
            var PD_MIN_PER_LOAD = 12;
            var PD_MAX_INTERNAL_FETCHES = 6;
            var PD_FETCH_ROWS = 50;

            window.loadPDGrid = async function(reset){
                if (pdLoading) return;
                pdLoading = true;
                var content = byId('pd-grid-content'), status = byId('pd-grid-status'), more = byId('pd-grid-more');
                var loadingAnim = byId('pd-loading-anim'), loadingText = byId('pd-loading-text');
                if (reset) { pdArchivePage = 1; if (content) content.innerHTML = ''; }
                if (more) more.style.display = 'none';
                if (status) status.textContent = '';
                if (loadingText) loadingText.textContent = isFaLang() ? 'در حال جستجوی آرشیو قانونی...' : 'Searching the legal archive...';
                if (loadingAnim) loadingAnim.style.display = 'flex';
                try {
                    var sel = byId('pd-sort-select');
                    var sortMode = sel ? sel.value : 'popular';
                    var typeSel = byId('pd-type-select');
                    var contentType = typeSel ? typeSel.value : 'movie';
                    buildPDCategoryOptions();
                    var catSel = byId('pd-cat-select');
                    var catVal = (contentType === 'movie' && catSel) ? catSel.value : 'all';
                    var catDef = PD_MOVIE_CATEGORIES.find(function(c){ return c.value === catVal; }) || PD_MOVIE_CATEGORIES[0];
                    var collections = contentType === 'tv' ? ['classic_tv'] : catDef.collections;
                    var collQuery = '(' + collections.map(function(c){ return 'collection:('+c+')'; }).join(' OR ') + ')';
                    var q = collQuery + ' AND mediatype:(movies)';
                    // Archive.org's own 'year' field is frequently wrong (scan/upload date, not the film's
                    // real release year), so sorting the SOURCE query by year returns mostly junk that
                    // never matches TMDB. We always pull from Archive.org by its most reliable order
                    // (downloads desc = real, well-described items) and do the actual newest/oldest/top-rated
                    // sorting ourselves afterward using each item's real TMDB release date/rating.
                    var findFn = contentType === 'tv' ? findCuratorTVShow : findCuratorMovie;
                    var dateField = contentType === 'tv' ? 'first_air_date' : 'release_date';
                    // For non-popularity sorts we need a bigger matched pool so the client-side sort has
                    // enough real spread to be meaningful (not just re-ordering the same 12 popular items).
                    var poolTarget = (sortMode === 'popular') ? PD_MIN_PER_LOAD : PD_MIN_PER_LOAD * 2;
                    var maxAttempts = (sortMode === 'popular') ? PD_MAX_INTERNAL_FETCHES : Math.ceil(PD_MAX_INTERNAL_FETCHES * 1.5);

                    window.PD_ARCHIVE_IDS = window.PD_ARCHIVE_IDS || {};
                    var resolved = [];
                    var attempts = 0;
                    var exhausted = false;
                    // Keep pulling additional pages from Archive.org internally until we have
                    // enough TMDB-matched items to show a full grid, instead of a near-empty one.
                    while (resolved.length < poolTarget && attempts < maxAttempts && !exhausted) {
                        var url = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
                            '&fl[]=identifier&fl[]=title&fl[]=year&fl[]=avg_rating&fl[]=downloads' +
                            '&sort[]=' + encodeURIComponent('downloads desc') +
                            '&rows=' + PD_FETCH_ROWS + '&page=' + pdArchivePage + '&output=json';
                        var res = await fetch(url);
                        attempts++;
                        if (!res.ok) break;
                        var data = await res.json();
                        var docs = (data && data.response && data.response.docs) || [];
                        pdArchivePage++;
                        if (!docs.length) { exhausted = true; break; }
                        var validDocs = docs.filter(function(doc){ return doc.identifier && doc.title; });
                        var matches = await Promise.all(validDocs.map(function(doc){
                            return findFn({ title: doc.title, year: doc.year }).then(function(m){ return { doc: doc, movie: m }; }).catch(function(){ return { doc: doc, movie: null }; });
                        }));
                        matches.forEach(function(pair){
                            if (pair.movie && !window.PD_ARCHIVE_IDS[pair.movie.id]) resolved.push(pair);
                        });
                    }
                    // Sort strictly by real TMDB data (accurate rating/vote-count/date), not Archive.org's own fields.
                    if (sortMode === 'top_rated') {
                        resolved.sort(function(a,b){
                            var av = (a.movie.vote_average||0), bv = (b.movie.vote_average||0);
                            if (bv !== av) return bv - av;
                            return (b.movie.vote_count||0) - (a.movie.vote_count||0);
                        });
                    } else if (sortMode === 'newest') {
                        resolved.sort(function(a,b){ return (b.movie[dateField]||'').localeCompare(a.movie[dateField]||''); });
                    } else if (sortMode === 'oldest') {
                        resolved.sort(function(a,b){ return (a.movie[dateField]||'').localeCompare(b.movie[dateField]||''); });
                    } else {
                        resolved.sort(function(a,b){ return (b.movie.popularity||0) - (a.movie.popularity||0); });
                    }
                    var shown = 0;
                    resolved.forEach(function(pair){
                        window.PD_ARCHIVE_IDS[pair.movie.id] = pair.doc.identifier;
                        if (content) content.insertAdjacentHTML('beforeend', makeCard(pair.movie, contentType));
                        shown++;
                    });
                    var totalShownNow = content ? content.children.length : shown;
                    if (status) status.textContent = totalShownNow ? '' : (isFaLang() ? 'موردی با اطلاعات کامل پیدا نشد.' : 'No items with full data found.');
                    if (more) more.style.display = (!exhausted) ? 'block' : 'none';
                } catch(e) {
                    if (status) status.textContent = isFaLang() ? 'خطا در بارگذاری آرشیو. دوباره تلاش کن.' : 'Failed to load archive. Try again.';
                } finally {
                    pdLoading = false;
                    if (loadingAnim) loadingAnim.style.display = 'none';
                }
            };

            function renderPDCard(doc){
                var thumb = 'https://archive.org/services/img/' + encodeURIComponent(doc.identifier);
                var rate = doc.avg_rating ? parseFloat(doc.avg_rating).toFixed(1) : (isFaLang() ? 'بدون امتیاز' : 'NR');
                var year = doc.year || (isFaLang() ? 'نامشخص' : 'N/A');
                var titleJs = String(doc.title).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
                return '<div class="card" onclick="openPDDetail(\'' + doc.identifier.replace(/'/g,"\\'") + '\',\'' + titleJs + '\',\'' + year + '\')">' +
                    '<div class="rate-badge"><i class="fa-solid fa-star"></i> ' + esc(rate) + '</div>' +
                    '<img src="' + thumb + '" class="poster" loading="lazy" onerror="this.style.background=\'#1a1a1a\'">' +
                    '<div class="meta-info">' +
                    '<div class="meta-title">' + esc(doc.title) + '</div>' +
                    '<div class="meta-sub"><span>' + esc(year) + '</span></div>' +
                    '</div></div>';
            }

            window.openPDDetail = async function(identifier, title, year){
                var modal = byId('pd-detail-modal'), titleEl = byId('pd-detail-title'), body = byId('pd-detail-body');
                if (!modal) return;
                modal.style.display = 'flex';
                if (titleEl) titleEl.textContent = title + (year ? ' (' + year + ')' : '');
                if (body) body.innerHTML = '<div style="color:#888;font-size:12px;">' + (isFaLang() ? 'در حال بارگذاری لینک‌ها...' : 'Loading download links...') + '</div>';
                try {
                    var res = await fetch('https://archive.org/metadata/' + encodeURIComponent(identifier));
                    if (!res.ok) throw new Error('bad response');
                    var meta = await res.json();
                    var files = (meta && meta.files) || [];
                    var items = files.filter(function(f){
                        return f.format && ALLOWED_FORMATS.indexOf(f.format) > -1 && f.size && /\.(mp4|ogv|mkv|avi|mpg|mpeg|wmv)$/i.test(f.name||'');
                    });
                    items.sort(function(a,b){ return (parseInt(b.size,10)||0) - (parseInt(a.size,10)||0); });
                    if (!items.length) {
                        if (body) body.innerHTML = '<div style="color:#888;font-size:12px;">' + (isFaLang() ? 'فایل دانلود قابل‌قبولی برای این اثر پیدا نشد.' : 'No suitable download file found for this title.') + '</div>';
                        return;
                    }
                    if (body) body.innerHTML = items.slice(0,8).map(function(f){
                        var url = 'https://archive.org/download/' + identifier + '/' + encodeURIComponent(f.name);
                        var label = (f.format||'File') + (f.height ? (' · ' + f.height + 'p') : '') + (f.size ? (' · ' + fmtSize(f.size)) : '');
                        return '<a href="' + url + '" target="_blank" rel="noopener" download style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;color:#7eb8f7;text-decoration:none;font-size:12px;">' +
                            '<span style="display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-download"></i>' + esc(label) + '</span>' +
                            '<i class="fa-solid fa-arrow-down-to-bracket"></i></a>';
                    }).join('') + '<p style="font-size:11px;color:#666;margin-top:4px;line-height:1.6;">' +
                        (isFaLang() ? 'این اثر روی Archive.org به‌صورت رایگان و قانونی منتشر شده (کپی‌رایتش منقضی شده) — بدون نیاز به ثبت‌نام.' : 'This title is hosted freely and legally on Archive.org (copyright expired) — no account needed.') + '</p>';
                } catch(e) {
                    if (body) body.innerHTML = '<div style="color:#888;font-size:12px;">' + (isFaLang() ? 'خطا در بارگذاری لینک‌ها.' : 'Failed to load links.') + '</div>';
                }
            };
            window.closePDDetail = function(){
                var modal = byId('pd-detail-modal');
                if (modal) modal.style.display = 'none';
            };
        })();
        // =================== END PUBLIC DOMAIN BROWSE PAGE ===================



        // =================== FINAL PATCH v7: LIGHT DOWNLOADS + STRICT DETAIL AI + EN PERSONALITY ===================
        (function(){
            'use strict';
            function byId(id){ return document.getElementById(id); }
            function clean(s){ return String(s == null ? '' : s).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim(); }
            function escHtml(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
            function escAttr(s){ return String(s == null ? '' : s).replace(/[&"'<>]/g,function(c){return {'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c];}); }
            function isFa(){ return (window.LANG || LANG) === 'fa'; }
            function titleIsBad(t){ t = clean(t).toLowerCase(); return !t || t === 'این اثر' || t === 'this title' || t === 'this work' || t === 'اثر' || t === 'title'; }
            function modalYear(){ return clean((byId('d-year')||{}).textContent||''); }
            function modalTitle(){
                var sec = clean((byId('d-title-secondary')||{}).textContent||'');
                var main = clean((byId('d-title')||{}).textContent||'');
                // In FA UI the secondary title is usually English; prefer it for AI identity.
                // In EN UI the secondary title is a native/foreign-language title — never use it as the primary identifier.
                if (isFa() && sec && /[A-Za-z0-9]/.test(sec)) return sec;
                return main || sec;
            }
            function removeDownloadUI(){
                // Downloads are data-driven; do not remove or hide their UI.
            }
            // Keep the real download index/database intact. The button is shown only after
            // the current title is resolved against those real records.
            document.addEventListener('DOMContentLoaded', removeDownloadUI);

            var detailToken = 0;
            var detailContext = { token:0, id:null, type:'movie' };
            function hardResetAI(label){
                try {
                    aiConversation = [];
                    aiIsThinking = false;
                    aiCurrentTitle = label || '';
                    aiRichData = {};
                    var q = byId('ai-quick-btns'), fq = byId('ai-fs-quick-btns');
                    if(q){ q.innerHTML=''; q.removeAttribute('data-ai-key'); }
                    if(fq){ fq.innerHTML=''; fq.removeAttribute('data-ai-key'); }
                    var c = byId('ai-chat-area'), fc = byId('ai-fs-chat');
                    var msg = isFa() ? 'در حال آماده‌سازی دستیار همین اثر...' : 'Preparing this title assistant...';
                    if(c) c.innerHTML = '<div class="ai-msg-bot">'+msg+'</div>';
                    if(fc) fc.innerHTML = '<div class="ai-msg-bot">'+msg+'</div>';
                    var lab = byId('ai-box-label'); if(lab) lab.textContent = isFa() ? 'دستیار AI' : 'AI Assistant';
                    var badge = byId('ai-context-badge'); if(badge){ badge.innerHTML=''; badge.style.display='none'; }
                    var inp = byId('ai-input'); if(inp) inp.value='';
                    var finp = byId('ai-fs-input'); if(finp) finp.value='';
                    var b1 = byId('ai-send-btn'), b2=byId('ai-fs-send-btn'); if(b1) b1.disabled=false; if(b2) b2.disabled=false;
                } catch(e) {}
            }
            function finalQuestions(title, year, type){
                var fa = isFa();
                var ctx = title + (year ? ' ('+year+')' : '');
                var qs = fa ? [
                    'خلاصه داستان «'+ctx+'» را دقیق و بدون اسپویل بگو',
                    'نقاط قوت و ضعف «'+ctx+'» چیست؟',
                    'بازیگران و شخصیت‌های مهم «'+ctx+'» را تحلیل کن',
                    'پایان «'+ctx+'» را با اسپویل توضیح بده',
                    'فکت‌های جالب و مطمئن درباره «'+ctx+'» بگو',
                    'آثار مشابه «'+ctx+'» معرفی کن'
                ] : [
                    'Summarize "'+ctx+'" without spoilers',
                    'What are the strengths and weaknesses of "'+ctx+'"?',
                    'Analyze the main cast and characters of "'+ctx+'"',
                    'Explain the ending of "'+ctx+'" with spoilers',
                    'Important confirmed facts about "'+ctx+'"',
                    'Recommend titles similar to "'+ctx+'"'
                ];
                return qs.map(function(x){ return '<div class="ai-quick-btn" data-question="'+escAttr(x)+'" onclick="askQuick(this.dataset.question)">'+escHtml(x)+'</div>'; }).join('');
            }
            function finalInitAIBox(title, type, year, rich){
                try {
                    rich = rich || {};
                    // Always identify by English/original title when available.
                    var exactTitle = clean(rich.originalTitle) || clean(rich.englishTitle) || clean(title) || modalTitle();
                    if (titleIsBad(exactTitle)) exactTitle = modalTitle() || (isFa() ? 'این اثر' : 'this title');
                    var exactYear = clean(year) || clean(rich.year) || modalYear();
                    var exactType = type || rich.mediaType || (typeof curType !== 'undefined' ? curType : 'movie') || 'movie';
                    aiCurrentTitle = exactTitle;
                    aiCurrentType = exactType;
                    aiRichData = rich;
                    aiRichData.originalTitle = exactTitle;
                    aiRichData.year = exactYear;
                    aiRichData.tmdbId = rich.tmdbId || detailContext.id || (typeof curId !== 'undefined' ? curId : '');
                    aiConversation = [];
                    aiIsThinking = false;
                    var fa = isFa();
                    var typeLabelFa = exactType === 'tv' ? 'سریال' : 'فیلم';
                    var typeLabelEn = exactType === 'tv' ? 'TV Series' : 'Movie';
                    var ctx = exactTitle + (exactYear ? ' ('+exactYear+')' : '');
                    var label = fa ? 'دستیار AI · «'+ctx+'»' : 'AI · "'+ctx+'"';
                    var lab = byId('ai-box-label'); if(lab) lab.textContent = label;
                    var badge = byId('ai-context-badge');
                    if(badge){
                        badge.innerHTML = '<span style="color:#7eb8f7;font-weight:900;">🎬 '+escHtml(exactTitle)+'</span>' + (exactYear ? ' <span style="color:#777;">('+escHtml(exactYear)+')</span>' : '') + ' <span style="color:#555;">'+(fa?typeLabelFa:typeLabelEn)+'</span>';
                        badge.style.cssText = 'display:block;padding:6px 12px 5px;font-size:12px;border-bottom:1px solid rgba(66,133,244,0.18);margin-bottom:6px;direction:ltr;text-align:left;';
                    }
                    var welcome = fa
                        ? 'سلام! این کادر مخصوص <strong>'+escHtml(typeLabelFa)+' «'+escHtml(ctx)+'»</strong> است. هر سوالی بپرسی فقط درباره همین اثر و به فارسی جواب می‌دهم.'
                        : 'Hi! This assistant is locked to <strong>'+escHtml(typeLabelEn)+' "'+escHtml(ctx)+'"</strong>. Ask anything about this exact title.';
                    var c = byId('ai-chat-area'), fc = byId('ai-fs-chat');
                    if(c) c.innerHTML = '<div class="ai-msg-bot">'+welcome+'</div>';
                    if(fc) fc.innerHTML = '<div class="ai-msg-bot">'+welcome+'</div>';
                    var html = finalQuestions(exactTitle, exactYear, exactType);
                    var key = exactType+'|'+exactTitle+'|'+exactYear+'|'+aiRichData.tmdbId;
                    var q = byId('ai-quick-btns'), fq = byId('ai-fs-quick-btns');
                    if(q){ q.innerHTML = html; q.setAttribute('data-ai-key',key); q.style.display='flex'; }
                    if(fq){ fq.innerHTML = html; fq.setAttribute('data-ai-key',key); fq.style.display='flex'; }
                    var inp = byId('ai-input'), finp = byId('ai-fs-input');
                    if(inp) inp.placeholder = fa ? 'سوالت را فارسی بپرس...' : 'Ask a question...';
                    if(finp) finp.placeholder = fa ? 'سوالت را فارسی بپرس...' : 'Ask a question...';
                    var ft = byId('ai-fs-title-text'); if(ft) ft.textContent = fa ? 'دستیار AI · '+ctx : 'AI · '+ctx;
                    var fctx = byId('ai-fs-context'); if(fctx) fctx.textContent = (fa?typeLabelFa:typeLabelEn)+': '+ctx;
                } catch(e) { console.log('v7 finalInitAIBox error', e); }
            }
            window.initAIBox = initAIBox = finalInitAIBox;

            async function buildExactRich(id, type, token){
                try {
                    if (token !== detailContext.token || String(id) !== String(detailContext.id)) return;
                    var results = await Promise.all([
                        getData(type+'/'+id+'?append_to_response=external_ids').catch(function(){return null;}),
                        getDataEN(type+'/'+id+'?append_to_response=external_ids').catch(function(){return null;}),
                        getData(type+'/'+id+'/credits').catch(function(){return null;}),
                        getData(type+'/'+id+'/keywords').catch(function(){return null;})
                    ]);
                    var d=results[0], den=results[1], cr=results[2], kw=results[3];
                    if (token !== detailContext.token || String(id) !== String(detailContext.id)) return;
                    var title = clean(den && (den.title || den.name)) || clean(d && (d.original_title || d.original_name)) || clean(d && (d.title || d.name)) || modalTitle();
                    if (titleIsBad(title)) title = modalTitle();
                    var year = clean(((den && (den.release_date || den.first_air_date)) || (d && (d.release_date || d.first_air_date)) || '').split('-')[0]) || modalYear();
                    var cast = cr && cr.cast ? cr.cast.slice(0,10).map(function(x){return x.name;}).filter(Boolean).join(', ') : '';
                    var directors = cr && cr.crew ? cr.crew.filter(function(x){return x.job === 'Director' || x.department === 'Directing';}).slice(0,5).map(function(x){return x.name;}).filter(Boolean).join(', ') : '';
                    var rawKw = kw ? (kw.keywords || kw.results || []) : [];
                    var rich = {
                        tmdbId:id,
                        imdbId:(d && d.external_ids && d.external_ids.imdb_id) || (den && den.external_ids && den.external_ids.imdb_id) || '',
                        mediaType:type,
                        originalTitle:title,
                        englishTitle:title,
                        year:year,
                        overview: clean((den && den.overview) || (d && d.overview) || (byId('d-desc')||{}).textContent || ''),
                        overviewFa: isFa() ? clean((byId('d-desc')||{}).textContent || '') : '',
                        genres: d && d.genres ? d.genres.map(function(g){return g.name;}).join(', ') : '',
                        cast:cast,
                        directors:directors,
                        rating:d && d.vote_average ? Number(d.vote_average).toFixed(1) : '',
                        runtime:d && d.runtime ? d.runtime+' min' : (d && d.number_of_seasons ? d.number_of_seasons+' seasons' : ''),
                        countries:d && d.production_countries ? d.production_countries.map(function(c){return c.name;}).join(', ') : '',
                        keywords: rawKw.slice(0,20).map(function(k){return k.name;}).filter(Boolean).join(', '),
                        status:d && d.status || ''
                    };
                    finalInitAIBox(title, type, year, rich);
                    removeDownloadUI();
                } catch(e) { console.log('v7 buildExactRich error', e); }
            }
            var previousOpenDetail = typeof openDetail === 'function' ? openDetail : null;
            if (previousOpenDetail && !previousOpenDetail.__v7Wrapped) {
                openDetail = async function(id, type){
                    if (type === 'person_works') return previousOpenDetail.apply(this, arguments);
                    detailToken += 1;
                    detailContext = { token: detailToken, id:id, type:type || 'movie' };
                    hardResetAI('');
                    removeDownloadUI();
                    var result = await previousOpenDetail.apply(this, arguments);
                    removeDownloadUI();
                    var token = detailContext.token;
                    buildExactRich(id, type || 'movie', token);
                    setTimeout(function(){ buildExactRich(id, type || 'movie', token); }, 500);
                    setTimeout(function(){ buildExactRich(id, type || 'movie', token); }, 1400);
                    setTimeout(function(){ buildExactRich(id, type || 'movie', token); }, 2600);
                    return result;
                };
                openDetail.__v7Wrapped = true;
            }
            // Prevent any stale/delayed old initializer from keeping a previous title.
            setInterval(function(){
                try {
                    removeDownloadUI();
                    var q=byId('ai-quick-btns'), lab=byId('ai-box-label');
                    if(!detailContext.id || !q || !lab) return;
                    var shown = clean(lab.textContent || '');
                    if (shown && aiCurrentTitle && shown.indexOf(aiCurrentTitle) === -1 && byId('modal') && byId('modal').style.display === 'block') {
                        buildExactRich(detailContext.id, detailContext.type, detailContext.token);
                    }
                } catch(e) {}
            }, 2200);

            window.buildSystemPrompt = buildSystemPrompt = function(){
                var r = aiRichData || {};
                var fa = isFa();
                var title = clean(r.originalTitle) || clean(aiCurrentTitle) || modalTitle();
                var year = clean(r.year) || modalYear();
                var typeLabel = aiCurrentType === 'tv' ? (fa ? 'سریال' : 'TV Series') : (fa ? 'فیلم' : 'Movie');
                var facts = [
                    'Exact English Title: '+title,
                    year ? 'Year: '+year : '',
                    'Type: '+typeLabel,
                    r.tmdbId ? 'TMDB ID: '+r.tmdbId : '',
                    r.imdbId ? 'IMDb ID: '+r.imdbId : '',
                    r.genres ? 'Genres: '+r.genres : '',
                    r.directors ? 'Director(s): '+r.directors : '',
                    r.cast ? 'Main Cast: '+r.cast : '',
                    r.runtime ? 'Runtime/Seasons: '+r.runtime : '',
                    r.rating ? 'Rating: '+r.rating+'/10' : '',
                    r.keywords ? 'Keywords: '+r.keywords : '',
                    r.overview ? 'Official synopsis: '+r.overview : 'Official synopsis: not available'
                ].filter(Boolean).join('\n');
                return fa ? ('تو دستیار تخصصی سینما هستی. فقط درباره همین اثر دقیق جواب بده و با اثر قبلی یا هم‌نام اشتباه نگیر. پاسخ باید کاملاً فارسی باشد، اما نام خاص اثر را می‌توانی انگلیسی نگه داری.\n\n'+facts) : ('You are a specialized cinema assistant. Answer ONLY about this exact current title; never use a previous title.\n\n'+facts);
            };
            window._localAIAnswer = _localAIAnswer = function(question){
                var fa = isFa(), r = aiRichData || {}, q = clean(question).toLowerCase();
                var title = clean(r.originalTitle) || clean(aiCurrentTitle) || modalTitle() || (fa?'این اثر':'this title');
                var year = clean(r.year) || modalYear();
                var ctx = title + (year ? ' ('+year+')' : '');
                var typFa = aiCurrentType === 'tv' ? 'سریال' : 'فیلم';
                var typEn = aiCurrentType === 'tv' ? 'TV series' : 'movie';
                var overview = fa ? (clean(r.overviewFa) || clean(r.overview)) : clean(r.overview);
                var genres = clean(r.genres) || (fa?'نامشخص':'Unknown');
                var cast = clean(r.cast);
                var dirs = clean(r.directors);
                var rating = clean(r.rating) || (fa?'نامشخص':'Unknown');
                if (fa) {
                    var intro = '<strong>«'+escHtml(ctx)+'»</strong> یک '+typFa+' با ژانر/فضای '+escHtml(genres)+' است.';
                    if (/خلاصه|داستان|summary|plot|چیه/.test(q)) return intro+'<br><br><strong>خلاصه:</strong> '+escHtml(overview || 'خلاصه رسمی کافی برای این عنوان در دسترس نیست؛ بنابراین داستان ساختگی نمی‌سازم.')+(dirs?'<br><br><strong>کارگردان:</strong> '+escHtml(dirs):'')+(cast?'<br><strong>بازیگران مهم:</strong> '+escHtml(cast):'');
                    if (/بازیگر|شخصیت|cast|character/.test(q)) return '<strong>بازیگران و شخصیت‌های «'+escHtml(ctx)+'»:</strong><br>'+(cast?escHtml(cast):'در داده فعلی بازیگران اصلی کامل ثبت نشده‌اند.')+(dirs?'<br><br><strong>کارگردان/عوامل:</strong> '+escHtml(dirs):'')+'<br><br>این پاسخ فقط برای همین عنوان است، نه اثر قبلی.';
                    if (/نقطه|قوت|ضعف|نقد|review|strength|weak/.test(q)) return '<strong>نقد کوتاه «'+escHtml(ctx)+'»:</strong><br><br><strong>نقاط قوت احتمالی:</strong> ایده و فضای '+escHtml(genres)+'، ظرفیت جذب مخاطب هدف، و امتیاز ثبت‌شده '+escHtml(rating)+'/10.<br><br><strong>ریسک/ضعف احتمالی:</strong> اگر روایت یا شخصیت‌پردازی به اندازه ایده اصلی پرداخت نشده باشد، اثر ممکن است برای بعضی مخاطب‌ها کم‌عمق به نظر برسد.';
                    if (/فکت|مطمئن|fact|trivia/.test(q)) return '<strong>فکت‌های مطمئن درباره «'+escHtml(ctx)+'»:</strong><br>• عنوان انگلیسی: '+escHtml(title)+'<br>• سال: '+escHtml(year||'نامشخص')+'<br>• نوع: '+escHtml(typFa)+'<br>• ژانرها: '+escHtml(genres)+'<br>• امتیاز: '+escHtml(rating)+'/10'+(r.runtime?'<br>• مدت/فصل: '+escHtml(r.runtime):'')+(r.tmdbId?'<br>• TMDB ID: '+escHtml(r.tmdbId):'');
                    if (/اسپویل|پایان|ending|spoiler/.test(q)) return '<strong>پایان و اسپویل «'+escHtml(ctx)+'»:</strong><br>من فقط بر اساس اطلاعات رسمی همین عنوان جواب می‌دهم. '+escHtml(overview || 'در داده فعلی خلاصه رسمی کافی برای توضیح پایان وجود ندارد، پس پایان ساختگی نمی‌سازم.');
                    if (/مشابه|پیشنهاد|similar|recommend/.test(q)) return '<strong>پیشنهادهای مشابه «'+escHtml(ctx)+'»:</strong><br>بهترین پیشنهادها باید از نظر ژانر و حال‌وهوا به '+escHtml(genres)+' نزدیک باشند. برای پیشنهاد دقیق‌تر می‌توانی بپرسی: «از نظر فضا مشابهش چی ببینم؟» یا «از نظر داستان مشابهش چی هست؟»';
                    return intro+'<br><br>'+escHtml(overview || 'اطلاعات رسمی کافی برای توضیح داستان موجود نیست.')+'<br><br>این پاسخ مخصوص همین عنوان است و از کش اثر قبلی استفاده نشده.';
                }
                var introEn = '<strong>'+escHtml(ctx)+'</strong> is a '+typEn+' in/around '+escHtml(genres)+'.';
                if (/summary|plot|story/.test(q)) return introEn+'<br><br><strong>Summary:</strong> '+escHtml(overview || 'No reliable official synopsis is available for this exact title, so I will not invent plot details.')+(dirs?'<br><br><strong>Director(s):</strong> '+escHtml(dirs):'')+(cast?'<br><strong>Main cast:</strong> '+escHtml(cast):'');
                if (/cast|character/.test(q)) return '<strong>Cast/characters for '+escHtml(ctx)+':</strong><br>'+(cast?escHtml(cast):'The current data does not list the main cast.')+(dirs?'<br><br><strong>Director(s):</strong> '+escHtml(dirs):'');
                if (/strength|weak|review/.test(q)) return '<strong>Short review for '+escHtml(ctx)+':</strong><br><br><strong>Strengths:</strong> clear '+escHtml(genres)+' identity and audience appeal. Rating: '+escHtml(rating)+'/10.<br><br><strong>Possible weakness:</strong> it depends on whether the script and character work fully support the central idea.';
                if (/fact|trivia/.test(q)) return '<strong>Confirmed facts about '+escHtml(ctx)+':</strong><br>• Title: '+escHtml(title)+'<br>• Year: '+escHtml(year||'Unknown')+'<br>• Type: '+escHtml(typEn)+'<br>• Genres: '+escHtml(genres)+'<br>• Rating: '+escHtml(rating)+'/10'+(r.runtime?'<br>• Runtime/seasons: '+escHtml(r.runtime):'');
                return introEn+'<br><br>'+escHtml(overview || 'No reliable official synopsis is available for this exact title.');
            };
            window.processAI = processAI = async function(question){
                if (aiIsThinking) return;
                aiIsThinking = true;
                var b1=byId('ai-send-btn'), b2=byId('ai-fs-send-btn'); if(b1) b1.disabled=true; if(b2) b2.disabled=true;
                try { addMsgToUI('user', question); showThinking(); } catch(e) {}
                var answer = '';
                try { answer = await callPollinations(question); } catch(e) { answer=''; }
                if (!answer || (isFa() && /\b(this title|unknown|the current data|i will not invent)\b/i.test(String(answer)))) answer = _localAIAnswer(question);
                if (isFa() && !/[\u0600-\u06FF]/.test(String(answer))) answer = _localAIAnswer(question);
                try { removeThinking(); aiConversation.push({role:'user',content:question}); aiConversation.push({role:'assistant',content:answer}); if(aiConversation.length>12) aiConversation=aiConversation.slice(-12); addMsgToUI('bot', answer); } catch(e) {}
                aiIsThinking = false; if(b1) b1.disabled=false; if(b2) b2.disabled=false;
            };
            window.askQuick = askQuick = async function(question){ await processAI(question); };

            // English/Persian personality output: no Persian text when app language is English.
            function selectedAllV7(){ return [].concat((_pSel&&_pSel.movie)||[], (_pSel&&_pSel.tv)||[], (_pSel&&_pSel.anime)||[]); }
            async function enrichSelectionsV7(){
                var all = selectedAllV7();
                for (var i=0;i<all.length;i++){
                    var it=all[i]; var mt=it.mediaType || (it.type==='anime'?'tv':(it.type||'movie')) || 'movie';
                    try { var d = await getData(mt+'/'+it.id); if(d){ it.genres=(d.genres||[]).map(function(g){return g.name;}).join(' '); it.overview=d.overview||it.overview||''; it.vote=d.vote_average||''; it.mediaType=mt; } } catch(e) {}
                }
            }
            function themeV7(){
                var text = selectedAllV7().map(function(x){return [x.title,x.genres,x.overview].join(' ');}).join(' ').toLowerCase();
                var s={comedy:0,music:0,horror:0,mystery:0,action:0,animation:0,drama:0,romance:0};
                function add(k, words, w){ words.forEach(function(a){ if(text.indexOf(a)>-1) s[k]+=w; }); }
                add('comedy',['comedy','sitcom','funny','humor','humour','family','feel-good','کمدی','خنده','فان'],5);
                add('music',['music','musical','song','concert','موسیقی','موزیک'],5);
                add('horror',['horror','terror','supernatural','slasher','وحشت','ترسناک'],5);
                add('mystery',['mystery','thriller','suspense','crime','راز','معمایی','جنایی'],4);
                add('action',['action','adventure','fight','war','اکشن','ماجراجویی'],4);
                add('animation',['animation','anime','انیمیشن','انیمه'],5);
                add('romance',['romance','romantic','love','عاشقانه'],4);
                add('drama',['drama','درام'],2);
                if((_pSel.anime||[]).length) s.animation += 2;
                var best='drama', val=-1; Object.keys(s).forEach(function(k){ if(s[k]>val){best=k;val=s[k];} });
                return best;
            }
            function o(a){ return {title:a[0],year:a[1],reason:a[2]}; }
            function personalityV7(fa){
                var names = selectedAllV7().map(function(x){return x.title+(x.year?' ('+x.year+')':'');}).join(fa?'، ':', ');
                var t=themeV7();
                var EN={
                    comedy:{type:'Feel-Good Explorer',emoji:'😄',desc:'Your picks lean toward humor, warmth, lighter rhythm, and characters that are fun to spend time with. You seem to value timing, chemistry, and a good mood after watching.',traits:['playful','warm','character-driven','easygoing'],movies:[['The Nice Guys','2016','fast comic chemistry'],['Game Night','2018','fun mystery energy'],['Little Miss Sunshine','2006','warm human comedy'],['Paddington 2','2017','pure feel-good charm'],['Superbad','2007','friendship comedy']],series:[['Ted Lasso','2020','optimistic and funny'],['Brooklyn Nine-Nine','2013','ensemble workplace comedy'],['The Office','2005','awkward sitcom energy'],['Parks and Recreation','2009','warm community humor'],['Modern Family','2009','family comedy']],anime:[['Spy x Family','2022','family comedy action'],['Kaguya-sama: Love Is War','2019','romantic mind-game comedy'],['Nichijou','2011','surreal comedy']]},
                    music:{type:'Stage-Soul Dreamer',emoji:'🎵',desc:'Your choices point to performance, rhythm, ambition and emotional spotlight moments. You connect with stories about talent, pressure, identity and the cost of becoming iconic.',traits:['expressive','rhythmic','ambitious','emotional'],movies:[['Bohemian Rhapsody','2018','music biopic energy'],['Rocketman','2019','stylized performer story'],['La La Land','2016','dreams and music'],['Whiplash','2014','obsession with craft'],['A Star Is Born','2018','fame and feeling']],series:[['Daisy Jones & The Six','2023','band drama'],['The Get Down','2016','youth and music'],['Atlanta','2016','music and identity'],['Empire','2015','power and music']],anime:[['Nana','2006','music and relationships'],['Kids on the Slope','2012','jazz and growing up'],['Carole & Tuesday','2019','hopeful music journey']]},
                    horror:{type:'Dark Suspense Seeker',emoji:'🕯️',desc:'Your taste is drawn to dread, hidden threat, unsettling atmosphere and stories that keep the mind alert. Mood matters to you as much as plot.',traits:['brave','atmospheric','tension-loving','curious'],movies:[['Get Out','2017','social horror'],['Barbarian','2022','unpredictable horror'],['It Follows','2014','slow dread'],['Hereditary','2018','family terror'],['The Night House','2020','grief and mystery']],series:[['From','2022','nightmarish town mystery'],['The Haunting of Hill House','2018','family horror'],['Midnight Mass','2021','philosophical horror'],['Channel Zero','2016','nightmare anthology']],anime:[['Another','2012','curse mystery'],['Parasyte: The Maxim','2014','body horror survival'],['Higurashi','2006','violent mystery']]},
                    mystery:{type:'Puzzle-Minded Watcher',emoji:'🧩',desc:'You like layered storytelling, clues, unreliable surfaces and endings that leave something to unpack. You enjoy being mentally involved, not just entertained.',traits:['analytical','detail-focused','curious','twist-friendly'],movies:[['The Prestige','2006','rivalry and secrets'],['Memento','2000','memory puzzle'],['Shutter Island','2010','psychological mystery'],['Gone Girl','2014','media and manipulation'],['Prisoners','2013','moral suspense']],series:[['Severance','2022','identity mystery'],['Dark','2017','time puzzle'],['Twin Peaks','1990','surreal mystery'],['Lost','2004','island mysteries']],anime:[['Perfect Blue','1997','identity thriller'],['Erased','2016','time and mystery'],['Paranoia Agent','2004','social paranoia']]},
                    action:{type:'Adrenaline Viewer',emoji:'⚡',desc:'Your picks favor momentum, stakes, spectacle and decisive characters. You enjoy stories that move fast and reward energy.',traits:['bold','fast-paced','hero-driven','spectacle-loving'],movies:[['Mad Max: Fury Road','2015','pure kinetic action'],['John Wick','2014','stylized combat'],['Top Gun: Maverick','2022','heroic spectacle'],['Mission: Impossible - Fallout','2018','stunts and tension'],['The Raid','2011','martial arts intensity']],series:[['Reacher','2022','direct action'],['The Boys','2019','violent superhero satire'],['Warrior','2019','martial arts drama'],['Andor','2022','rebellion tension']],anime:[['Demon Slayer','2019','emotion and battles'],['Jujutsu Kaisen','2020','supernatural action'],['Attack on Titan','2013','survival war']]},
                    animation:{type:'Imaginative World-Jumper',emoji:'🎨',desc:'You are drawn to expressive worlds, emotional color, stylized characters and stories where imagination carries real feeling.',traits:['imaginative','emotional','world-loving','adventurous'],movies:[['Spider-Man: Into the Spider-Verse','2018','creative and energetic'],['Spirited Away','2001','dreamlike fantasy'],['How to Train Your Dragon','2010','friendship adventure'],['The Mitchells vs. the Machines','2021','fun family chaos'],['Your Name','2016','emotion and fate']],series:[['Avatar: The Last Airbender','2005','growth and world-building'],['Arcane','2021','style and tragedy'],['Blue Eye Samurai','2023','identity and revenge'],['Adventure Time','2010','surreal adventure']],anime:[['Spy x Family','2022','fun family action'],['Mob Psycho 100','2016','emotion and growth'],['Fullmetal Alchemist: Brotherhood','2009','brotherhood and philosophy']]},
                    romance:{type:'Emotion-First Romantic',emoji:'❤️',desc:'Your taste values connection, vulnerability, emotional payoff and characters whose choices are shaped by love, longing or intimacy.',traits:['empathetic','romantic','feeling-led','relationship-focused'],movies:[['About Time','2013','love and family'],['Before Sunrise','1995','conversation and chemistry'],['Pride & Prejudice','2005','classic romance'],['La La Land','2016','dreams and love'],['The Big Sick','2017','warm modern romance']],series:[['Normal People','2020','intimate relationship drama'],['Heartstopper','2022','gentle romance'],['Outlander','2014','romance and history']],anime:[['Your Name','2016','fate and longing'],['Kaguya-sama: Love Is War','2019','romantic comedy'],['Fruits Basket','2019','healing relationships']]},
                    drama:{type:'Story-Driven Empath',emoji:'🎭',desc:'Your choices suggest you value character growth, emotional honesty and stories that leave a thoughtful aftertaste.',traits:['empathetic','story-focused','reflective','character-led'],movies:[['Good Will Hunting','1997','growth and healing'],['The Shawshank Redemption','1994','hope and friendship'],['The Truman Show','1998','identity and freedom'],['Manchester by the Sea','2016','grief and silence'],['About Time','2013','love and family']],series:[['The Bear','2022','pressure and growth'],['This Is Us','2016','family emotion'],['Six Feet Under','2001','life and death'],['Succession','2018','family and power']],anime:[['A Silent Voice','2016','forgiveness and repair'],['Violet Evergarden','2018','grief and emotion'],['March Comes in Like a Lion','2016','loneliness and growth']]}
                };
                var FA={
                    comedy:{type:'رفیق حال‌خوب‌کن',emoji:'😄',desc:'انتخاب‌هایت بیشتر به سمت کمدی، انرژی مثبت، شخصیت‌های دوست‌داشتنی و روایت‌های سبک‌تر می‌رود. برای تو جذابیت اصلی در ریتم، شوخی، رابطه بین شخصیت‌ها و حس خوب بعد از تماشا است.',traits:['شوخ‌طبع','حال‌خوب‌جو','شخصیت‌دوست','ریتم‌پسند']},
                    music:{type:'روحیه صحنه و ریتم',emoji:'🎵',desc:'سلیقه‌ات به اجرا، موسیقی، شهرت، استعداد و پشت‌صحنه زندگی هنرمندها نزدیک است.',traits:['ریتم‌دوست','احساسی','اجرامحور','کاریزماپسند']},
                    horror:{type:'شکارچی هیجان تاریک',emoji:'🕯️',desc:'از تعلیق، تهدید پنهان، فضای کابوس‌وار و رازهای ناراحت‌کننده لذت می‌بری.',traits:['تعلیق‌طلب','فضاسازپسند','رازدوست','شجاع']},
                    mystery:{type:'کاوشگر رازها',emoji:'🧩',desc:'سلیقه‌ات به سمت معما، ابهام، کشف تدریجی حقیقت و روایت‌هایی می‌رود که ذهن را درگیر می‌کنند.',traits:['رازجو','جزئیات‌بین','ذهن‌درگیر','تعلیق‌پسند']},
                    action:{type:'تماشاگر آدرنالین',emoji:'⚡',desc:'انتخاب‌هایت به ریتم تند، قهرمان‌محوری، تعقیب، نبرد و لحظه‌های پرانرژی نزدیک است.',traits:['هیجان‌طلب','پرریتم','قهرمان‌دوست','اکشن‌پسند']},
                    animation:{type:'خیال‌پرداز پرانرژی',emoji:'🎨',desc:'انتخاب‌هایت به دنیاهای رنگی، ایده‌های خیال‌انگیز، شخصیت‌های خاص و روایت‌های احساسی نزدیک است.',traits:['خیال‌پرداز','احساس‌گرا','جهان‌دوست','ماجراجو']},
                    romance:{type:'رمانتیک احساس‌محور',emoji:'❤️',desc:'ارتباط، آسیب‌پذیری، احساس و رابطه‌های انسانی برایت پررنگ است.',traits:['همدل','رمانتیک','احساس‌محور','رابطه‌دوست']},
                    drama:{type:'احساس‌گرای داستان‌محور',emoji:'🎭',desc:'شخصیت‌پردازی، رشد درونی، رابطه‌های انسانی و روایت احساسی برایت مهم است.',traits:['شخصیت‌محور','احساس‌گرا','روایت‌دوست','عمق‌پسند']}
                };
                var en = EN[t] || EN.drama;
                var base = fa ? (FA[t] || FA.drama) : en;
                var desc = base.desc + (fa ? '\n\nاین تحلیل بر اساس انتخاب‌های فعلی تو ساخته شده: ' : '\n\nThis analysis is based on your current selections: ') + (names || (fa?'انتخاب‌های فعلی':'current picks'));
                return {personality_type:base.type, personality_emoji:base.emoji, description:desc, traits:base.traits, if_movie:{character:en.movies[0][0],movie:en.movies[0][0],year:en.movies[0][1],reason:en.movies[0][2]}, if_series:{character:en.series[0][0],series:en.series[0][0],year:en.series[0][1],reason:en.series[0][2]}, if_anime:{character:en.anime[0][0],show:en.anime[0][0],year:en.anime[0][1],reason:en.anime[0][2]}, top5_movies:en.movies.map(o), top5_series:en.series.map(o), similar_movies:en.movies.slice(0,3).map(o), similar_series:en.series.slice(0,3).map(o), similar_anime:en.anime.map(o)};
            }
            window._localPersonalityResult = _localPersonalityResult = function(fa){ return personalityV7(!!fa); };
            window._runPAnalysis = _runPAnalysis = async function(){
                var fa = isFa();
                var total = ((_pSel.movie||[]).length + (_pSel.tv||[]).length + (_pSel.anime||[]).length);
                if(total < 1){ alert(fa?'حداقل یک اثر انتخاب کن!':'Select at least one work!'); return; }
                var c = byId('personality-content');
                if(c) c.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px"><div style="font-size:56px;animation:brainPulse 1s infinite">🧠</div><div style="color:#cc88ff;font-size:16px;font-weight:900">'+(fa?'در حال تحلیل با هوش مصنوعی...':'Analyzing with AI...')+'</div><div style="color:#888;font-size:12px;text-align:center;max-width:300px;line-height:1.7;">'+(fa?'تحلیل بر اساس انتخاب‌ها، ژانرها و حس‌وحال آثار ساخته می‌شود، نه از روی قالب آماده.':'Built from your picks, their genres and mood — not from a canned template.')+'</div></div>';
                try { await enrichSelectionsV7(); } catch(e) {}
                var detail = selectedAllV7().map(function(x){ return (x.title||'') + (x.year?' ('+x.year+')':'') + (x.genres?' ['+x.genres+']':'') + (x.overview?' \u2014 '+String(x.overview).slice(0,180):''); }).join(fa?'\u061b ':'; ');
                var schema = '{"personality_type":"","personality_emoji":"","description":"","traits":["","","",""],"if_movie":{"character":"","actor":"","movie":"","year":"","reason":""},"if_series":{"character":"","actor":"","series":"","year":"","reason":""},"if_anime":{"character":"","show":"","year":"","reason":""},"top5_movies":[{"title":"","year":"","reason":""}],"top5_series":[{"title":"","year":"","reason":""}],"similar_movies":[{"title":"","year":""}],"similar_series":[{"title":"","year":""}],"similar_anime":[{"title":"","year":""}]}';
                var prompt = (fa ? 'تو روان‌شناس سینمایی حرفه‌ای هستی. فقط JSON معتبر برگردان، بدون هیچ متن اضافه. تحلیل باید دقیقاً از همین انتخاب‌ها، ژانرها و حس‌وحال (وایب) آن‌ها بیاید: چه فضایی، چه احساسی و چه نوع داستانی دنبال می‌کند، چرا این آثار را دوست دارد، و چه چیزی او را خسته می‌کند. description باید ۳ تا ۵ جمله مشخص و شخصی باشد و نام حداقل دو اثر انتخاب‌شده را ببرد، نه جملات کلی و تکراری. traits چهار ویژگی مشخص از سلیقه او باشد. شخصیت‌ها (if_movie/if_series/if_anime) باید شخصیت‌هایی باشند که واقعاً شبیه کاربرند و reason آن‌ها را به انتخاب‌هایش وصل کند. پیشنهادها باید آثار واقعی و شناخته‌شده باشند: top5_movies دقیقاً ۵ فیلم، top5_series دقیقاً ۵ سریال، similar_movies ۳ فیلم، similar_series ۳ سریال، similar_anime ۳ انیمه/انیمیشن. هیچ‌کدام از آثار انتخاب‌شده نباشند، هیچ تکراری نداشته باشند، فقط فیلم در فیلد فیلم، فقط سریال در فیلد سریال، فقط انیمه/انیمیشن در فیلد انیمه باشد، و reason هرکدام کوتاه (زیر ۱۲ کلمه) باشد. عنوان همه آثار پیشنهادی را به انگلیسی اصلی و کامل بنویس (بدون ترکیب فارسی و انگلیسی در یک عنوان)، فقط description و reason و traits فارسی باشند، و هیچ کاراکتری از زبان دیگری (مثل چینی) نیاور.\n' : 'You are a professional cinema psychologist. Reply ONLY valid JSON, no extra text. The analysis must come exactly from these picks, their genres and their vibe/mood: what atmosphere, feeling and story type they seek, why they love these works, and what bores them. The description must be 3-5 specific, personal sentences naming at least two of the picks, not generic phrases. Traits must be four specific taste traits. The if_movie/if_series/if_anime characters must really match the user, with reasons tied to the picks. Recommendations must be real, well-known titles, NONE of the already-selected titles, no duplicates, movies only in movie fields, series only in series fields, anime/animation only in anime fields, and each reason under 12 words.\n') + 'Picks: ' + detail + '\nSchema: ' + schema;
                var result = null;
                try {
                    var txt = await _aiGenerateText(prompt, { maxTokens: 2000, temperature: 0.6, expectJson: true, timeout: 60000 });
                    result = _extractJsonObject(txt);
                } catch(e) {}
                if (!result || !result.personality_type) {
                    if (c) c.innerHTML = '<div style="padding:24px;max-width:520px;margin:0 auto;text-align:center;"><div style="font-size:44px;margin-bottom:12px;">⚠️</div><div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:8px;">'+(fa?'هوش مصنوعی الان جواب نداد':'AI did not answer right now')+'</div><div style="font-size:12px;color:#999;line-height:1.8;margin-bottom:16px;">'+(fa?'انتخاب‌هایت حفظ شده. دوباره تلاش کن؛ نتیجه از روی قالب آماده ساخته نمی‌شود.':'Your picks are saved. Try again — no canned template will be used.')+'</div><button onclick="_runPAnalysis()" style="padding:14px 28px;background:linear-gradient(135deg,#7c3aed,#4c1d95);border:none;border-radius:14px;color:white;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;">🔄 '+(fa?'تلاش مجدد':'Try again')+'</button></div>';
                    return;
                }
                result.top5_movies = _pDedup(result.top5_movies || [], 'title').slice(0,5);
                result.top5_series = _pDedup(result.top5_series || [], 'title').slice(0,5);
                result.similar_movies = _pDedup(result.similar_movies || [], 'title').slice(0,4);
                result.similar_series = _pDedup(result.similar_series || [], 'title').slice(0,4);
                result.similar_anime = _pDedup(result.similar_anime || [], 'title').slice(0,4);
                try { _pSaveResult(result); } catch(e) {}
                await _renderPResult(result, fa);
            };
            // If saved result language does not match current language, rebuild on open with saved selections.
            var prevOpenPersonality = typeof openPersonalityPage === 'function' ? openPersonalityPage : null;
            if(prevOpenPersonality){
                openPersonalityPage = function(){
                    prevOpenPersonality.apply(this, arguments);
                    setTimeout(function(){
                        try {
                            var c=byId('personality-content'); if(!c) return;
                            var txt=clean(c.textContent||'');
                            if((!isFa() && /[\u0600-\u06FF]/.test(txt)) || (isFa() && /YOUR CINEMA TYPE/.test(txt))){
                                // FN-FIX3: never rebuild with a canned template; the user re-runs the AI analysis instead.
                            }
                        } catch(e) {}
                    }, 120);
                };
            }
        })();
        // =================== END FINAL PATCH v7 ===================


// =================== REVIEWS FINAL HOTFIX v14: TMDB reviews only + IMDb score, no Letterboxd/RT ===================
(function(){
    function _rvFa(){ try{return LANG==='fa';}catch(e){return false;} }
    function _rvEsc(v){ return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];}); }
    function _rvCut(t,n){ t=String(t||''); return t.length>n ? t.slice(0,n)+'...' : t; }
    function _rvTitle(){ try{return curTitle || (_rvFa()?'نظرات کاربران':'User Reviews');}catch(e){return _rvFa()?'نظرات کاربران':'User Reviews';} }

    function _rvCleanHeader(){
        try{
            var tabs=document.getElementById('review-tabs');
            if(tabs){
                tabs.innerHTML='<button id="rtab-tmdb" onclick="_rTab(\'tmdb\')" style="flex:1;padding:10px 4px;background:#01b4e4;border:none;color:#000;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">'+(_rvFa()?'نظرات TMDB':'TMDB Reviews')+'</button>';
            }
        }catch(e){}
        try{
            ['rtab-imdb','rtab-lb'].forEach(function(id){var el=document.getElementById(id); if(el) el.remove();});
            var lb=document.getElementById('lb-score-txt');
            if(lb){
                var box=lb.closest('div[style*="display:flex"]');
                if(box){ var sep=box.previousElementSibling; if(sep && /width\s*:\s*1px/.test(sep.getAttribute('style')||'')) sep.remove(); box.remove(); }
            }
        }catch(e){}
    }

    function _rvSetLoading(){
        _rvCleanHeader();
        var list=document.getElementById('reviews-list');
        if(list) list.innerHTML='<div style="text-align:center;padding:44px 20px;color:#555;"><i class="fa-solid fa-spinner fa-spin" style="font-size:26px;color:#01b4e4;margin-bottom:12px;display:block;"></i>'+(_rvFa()?'در حال دریافت نظرات TMDB...':'Loading TMDB reviews...')+'</div>';
    }

    function _rvScoreTMDB(){
        try{
            var scoreEl=document.getElementById('d-rate');
            var score=parseFloat(scoreEl?scoreEl.textContent:0)||0;
            var pct=Math.round(score*10), circ=131.9;
            var ring=document.getElementById('score-ring'), txt=document.getElementById('score-percent-text'), votes=document.getElementById('score-vote-count');
            if(txt) txt.textContent=pct ? (pct+'%') : '—';
            if(ring){ ring.style.strokeDashoffset=circ-(circ*pct/100); ring.style.stroke=pct>=70?'#21d07a':pct>=40?'#d2d531':'#db2360'; }
            var count=document.getElementById('d-count')?document.getElementById('d-count').innerText:'';
            if(votes) votes.textContent=count||'';
        }catch(e){}
    }

    async function _rvScoreIMDb(){
        try{
            var ring=document.getElementById('imdb-ring'), txt=document.getElementById('imdb-score-txt'), votes=document.getElementById('imdb-vote-txt');
            if(txt) txt.textContent='—'; if(votes) votes.textContent=''; if(ring) ring.style.strokeDashoffset='131.9';
            var id=(typeof curImdb!=='undefined' && curImdb) ? curImdb : '';
            if(!id && typeof getDataEN==='function'){
                try{ var ext=await getDataEN(curType+'/'+curId+'/external_ids'); id=ext&&ext.imdb_id; }catch(e){}
            }
            if(!id) return;
            var urls=[
                'https://www.omdbapi.com/?i='+encodeURIComponent(id)+'&apikey=564727fa',
                'https://corsproxy.io/?'+encodeURIComponent('https://www.omdbapi.com/?i='+encodeURIComponent(id)+'&apikey=564727fa')
            ];
            for(var i=0;i<urls.length;i++){
                try{
                    var r=await fetch(urls[i],{cache:'no-store',signal:AbortSignal.timeout(9000)});
                    if(!r.ok) continue;
                    var d=await r.json();
                    var s=parseFloat(d&&d.imdbRating);
                    if(s && !isNaN(s)){
                        var pct=Math.round(s*10), circ=131.9;
                        if(ring) ring.style.strokeDashoffset=circ-(circ*pct/100);
                        if(txt) txt.textContent=s.toFixed(1);
                        if(votes && d.imdbVotes && d.imdbVotes!=='N/A') votes.textContent=d.imdbVotes;
                        return;
                    }
                }catch(e){}
            }
            // Fallback to the app's old IMDb scraper if OMDb is blocked.
            try{ if(typeof window._oldRScoreIMDb==='function') await window._oldRScoreIMDb(); }catch(e){}
        }catch(e){}
    }

    async function _rvFetchTMDBReviews(){
        var results=[];
        try{
            if(typeof getDataEN==='function'){
                var d=await getDataEN(curType+'/'+curId+'/reviews?page=1');
                if(d && Array.isArray(d.results) && d.results.length) return d.results;
            }
        }catch(e){}
        try{
            if(typeof BASE!=='undefined' && typeof API!=='undefined'){
                var endpoints=[
                    BASE+'/'+curType+'/'+curId+'/reviews?page=1&api_key='+encodeURIComponent(API)+'&language=en-US',
                    BASE+'/'+curType+'/'+curId+'/reviews?page=1&api_key='+encodeURIComponent(API)
                ];
                for(var ei=0; ei<endpoints.length; ei++){
                    var url=endpoints[ei];
                    var urls=[url,'https://corsproxy.io/?'+encodeURIComponent(url),'https://api.allorigins.win/raw?url='+encodeURIComponent(url)];
                    for(var i=0;i<urls.length;i++){
                        try{
                            var r=await fetch(urls[i],{cache:'no-store',signal:AbortSignal.timeout(11000)});
                            if(!r.ok) continue;
                            var txt=await r.text();
                            var data=JSON.parse(txt);
                            if(data && Array.isArray(data.results) && data.results.length) return data.results;
                            if(data && Array.isArray(data.results)) results=data.results;
                        }catch(e){}
                    }
                }
            }
        }catch(e){}
        return results || [];
    }

    function _rvEmpty(){
        var list=document.getElementById('reviews-list'); if(!list) return;
        list.innerHTML='<div style="text-align:center;padding:48px 22px;color:#555;line-height:1.9;font-size:14px;"><div style="font-size:38px;margin-bottom:10px;">🔵</div><b>TMDB</b><br>'+(_rvFa()?'برای این اثر فعلاً نظری در TMDB پیدا نشد.':'No TMDB reviews were found for this title right now.')+'</div>';
    }

    async function _rvTranslateText(text){
        text=String(text||''); if(!text.trim()) return '';
        var chunks=[]; for(var i=0;i<text.length;i+=450) chunks.push(text.slice(i,i+450));
        var out=[];
        for(var c=0;c<chunks.length;c++){
            try{
                var r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(chunks[c])+'&langpair=en|fa',{cache:'no-store',signal:AbortSignal.timeout(9000)});
                var d=await r.json();
                out.push((d&&d.responseData&&d.responseData.translatedText)?d.responseData.translatedText:chunks[c]);
            }catch(e){ out.push(chunks[c]); }
        }
        return out.join(' ');
    }

    function _rvRender(reviews){
        _rvCleanHeader();
        var list=document.getElementById('reviews-list'); if(!list) return;
        var valid=(reviews||[]).filter(function(r){return r && r.content && String(r.content).trim().length>10;});
        if(!valid.length){ _rvEmpty(); return; }
        var fa=_rvFa();
        list.innerHTML=valid.map(function(rev,idx){
            var id='rv14_'+idx, ad=rev.author_details||{};
            var avatar=ad.avatar_path ? (String(ad.avatar_path).indexOf('/https')===0 ? String(ad.avatar_path).slice(1) : 'https://family-night-api.alirezadoe8.workers.dev/img/w45'+ad.avatar_path) : '';
            var rating=(ad.rating || ad.rating===0) ? '<span style="background:#01b4e4;color:#000;font-size:10px;font-weight:900;padding:2px 7px;border-radius:20px;">⭐ '+_rvEsc(ad.rating)+'/10</span>' : '';
            var raw=rev.created_at||rev.updated_at||''; var date=raw;
            try{ if(raw) date=new Date(raw).toLocaleDateString(fa?'fa-IR':'en-US',{year:'numeric',month:'short',day:'numeric'}); }catch(e){}
            var full=String(rev.content||'').trim(); var short=_rvCut(full,430); var more=full.length>430;
            return '<div class="tmdb-review-card" style="background:#0d0d16;border:1px solid #1a1a24;border-radius:12px;padding:13px;margin-bottom:2px;">'
                +'<div style="display:flex;align-items:center;gap:9px;margin-bottom:9px;">'
                +(avatar?'<img src="'+_rvEsc(avatar)+'" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">':'<div style="width:34px;height:34px;border-radius:50%;background:#1a1a24;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">🔵</div>')
                +'<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:#ddd;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">'+_rvEsc(rev.author||'TMDB User')+'</div><div style="font-size:10px;color:#444;">'+_rvEsc(date)+'</div></div>'+rating+'</div>'
                +'<div id="'+id+'_txt" data-original="'+_rvEsc(full)+'" data-short="'+_rvEsc(short)+'" style="font-size:13px;color:#bbb;line-height:1.8;direction:auto;white-space:pre-wrap;text-align:start;">'+_rvEsc(short)+'</div>'
                +(more?'<button id="'+id+'_more" onclick="_rv14More(\''+id+'\')" style="background:none;border:none;color:#555;font-size:12px;cursor:pointer;padding:4px 0;font-family:inherit;text-decoration:underline;">'+(fa?'بیشتر':'Read more')+'</button>':'')
                +'<div style="border-top:1px solid #111;margin-top:9px;padding-top:8px;"><button onclick="_rv14Translate(\''+id+'\')" id="'+id+'_tr" style="background:rgba(1,180,228,0.08);border:1px solid rgba(1,180,228,0.2);color:#38bdf8;border-radius:16px;padding:4px 11px;font-size:11px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-language"></i> '+(fa?'ترجمه به فارسی':'Translate')+'</button></div>'
                +'</div>';
        }).join('');
    }

    window._rv14More=function(id){
        var el=document.getElementById(id+'_txt'), b=document.getElementById(id+'_more'); if(!el||!b) return;
        var full=(el.dataset.mode==='fa' && el.dataset.faFull) ? el.dataset.faFull : el.dataset.original;
        var short=(el.dataset.mode==='fa' && el.dataset.faShort) ? el.dataset.faShort : el.dataset.short;
        if(b.dataset.open==='1'){ el.textContent=short; b.textContent=_rvFa()?'بیشتر':'Read more'; b.dataset.open='0'; }
        else { el.textContent=full; b.textContent=_rvFa()?'کمتر':'Show less'; b.dataset.open='1'; }
    };
    window._rv14Translate=async function(id){
        var el=document.getElementById(id+'_txt'), b=document.getElementById(id+'_tr'); if(!el||!b) return;
        var orig=el.dataset.original||el.textContent;
        if(el.dataset.mode==='fa'){
            el.dataset.mode='orig'; el.textContent=_rvCut(orig,430);
            var mb=document.getElementById(id+'_more'); if(mb){ mb.dataset.open='0'; mb.textContent=_rvFa()?'بیشتر':'Read more'; }
            b.innerHTML='<i class="fa-solid fa-language"></i> '+(_rvFa()?'ترجمه به فارسی':'Translate');
            return;
        }
        if(el.dataset.faFull){
            el.dataset.mode='fa'; el.textContent=el.dataset.faShort||_rvCut(el.dataset.faFull,460);
            b.innerHTML='<i class="fa-solid fa-rotate-left"></i> '+(_rvFa()?'نمایش متن اصلی':'Show original');
            return;
        }
        b.disabled=true; b.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>';
        var faText=await _rvTranslateText(orig);
        el.dataset.faFull=faText; el.dataset.faShort=_rvCut(faText,460); el.dataset.mode='fa'; el.textContent=el.dataset.faShort;
        var mb=document.getElementById(id+'_more'); if(mb){ mb.dataset.open='0'; mb.textContent=_rvFa()?'بیشتر':'Read more'; }
        b.disabled=false; b.innerHTML='<i class="fa-solid fa-rotate-left"></i> '+(_rvFa()?'نمایش متن اصلی':'Show original');
    };

    try{ if(typeof window._oldRScoreIMDb==='undefined' && typeof _rScoreIMDb==='function') window._oldRScoreIMDb=_rScoreIMDb; }catch(e){}
    window.openReviews=async function(){
        var modal=document.getElementById('reviews-modal'), titleEl=document.getElementById('reviews-modal-title');
        if(titleEl) titleEl.textContent=_rvTitle();
        if(modal) modal.style.display='flex';
        try{ _reviewsCache={}; _rCache={}; _curRTab='tmdb'; }catch(e){}
        _rvCleanHeader(); _rvSetLoading(); _rvScoreTMDB(); _rvScoreIMDb();
        var revs=await _rvFetchTMDBReviews();
        try{ var badge=document.getElementById('reviews-count-badge'); if(badge){ if(revs.length){ badge.textContent=revs.length; badge.style.display='inline'; } else badge.style.display='none'; } }catch(e){}
        _rvRender(revs);
    };
    window._rTab=function(){ return window.openReviews(); };
    window._rTabUI=function(){ _rvCleanHeader(); };
    window._rLoad=async function(){ var revs=await _rvFetchTMDBReviews(); _rvRender(revs); };
    window._rRender=function(tab,reviews){ _rvRender(reviews||[]); };
})();
// =================== END REVIEWS FINAL HOTFIX v14 ===================


// =================== FINAL HOTFIX v15: IMDb review score + modal fullscreen buttons ===================
(function(){
    function fa(){ try{return LANG==='fa';}catch(e){return false;} }
    if(!document.getElementById('fn-persistent-fullscreen-style')){
        var pfs=document.createElement('style');pfs.id='fn-persistent-fullscreen-style';
        pfs.textContent='html.fn-persistent-fullscreen,html.fn-persistent-fullscreen body{background:#000!important;}html.fn-persistent-fullscreen body{position:fixed!important;inset:0!important;width:100%!important;height:100%!important;overflow:auto!important;}html.fn-persistent-fullscreen #modal{height:100%!important;}';
        document.head.appendChild(pfs);
    }
    function circSet(ringId, txtId, voteId, score, voteText){
        var ring=document.getElementById(ringId), txt=document.getElementById(txtId), votes=document.getElementById(voteId);
        var s=parseFloat(score);
        if(!s || isNaN(s) || s<=0){ if(txt) txt.textContent='—'; if(votes && voteText!==undefined) votes.textContent=voteText||''; if(ring) ring.style.strokeDashoffset='131.9'; return false; }
        var pct=Math.max(0,Math.min(100,Math.round(s*10))), circ=131.9;
        if(ring){ ring.style.strokeDashoffset=String(circ-(circ*pct/100)); ring.style.stroke='#f5c518'; }
        if(txt) txt.textContent=s.toFixed(1);
        if(votes && voteText!==undefined) votes.textContent=voteText||'';
        return true;
    }
    function getLocalRating(){
        try{
            var el=document.getElementById('d-rate');
            if(el){ var s=parseFloat(String(el.textContent||'').replace(/[^0-9.]/g,'')); if(s && !isNaN(s)) return s; }
        }catch(e){}
        try{ if(window.curDetail && curDetail.vote_average) return parseFloat(curDetail.vote_average); }catch(e){}
        return 0;
    }
    async function finalIMDbScore(){
        var local=getLocalRating();
        circSet('imdb-ring','imdb-score-txt','imdb-vote-txt', local, '');
        var id='';
        try{ id=(typeof curImdb!=='undefined' && curImdb) ? curImdb : ''; }catch(e){}
        if(!id){
            try{ if(typeof getDataEN==='function' && typeof curType!=='undefined' && typeof curId!=='undefined'){ var ext=await getDataEN(curType+'/'+curId+'/external_ids'); id=ext&&ext.imdb_id; } }catch(e){}
        }
        if(!id) return;
        var urls=[
            'https://www.omdbapi.com/?i='+encodeURIComponent(id)+'&apikey=564727fa',
            'https://www.omdbapi.com/?i='+encodeURIComponent(id)+'&apikey=trilogy',
            'https://www.omdbapi.com/?i='+encodeURIComponent(id)+'&apikey=f6dd47c8'
        ];
        for(var i=0;i<urls.length;i++){
            try{
                var r=await fetch(urls[i],{cache:'no-store',signal:AbortSignal.timeout(7000)});
                if(!r.ok) continue;
                var d=await r.json();
                var s=parseFloat(d&&d.imdbRating);
                if(s && !isNaN(s) && d.imdbRating!=='N/A'){
                    circSet('imdb-ring','imdb-score-txt','imdb-vote-txt',s,(d.imdbVotes&&d.imdbVotes!=='N/A')?d.imdbVotes:'');
                    return;
                }
            }catch(e){}
        }
        // If all live paths fail, keep the local score visible instead of leaving the circle blank.
        circSet('imdb-ring','imdb-score-txt','imdb-vote-txt', local, '');
    }
    window._rvScoreIMDb=finalIMDbScore;
    try{ window._rScoreIMDb=finalIMDbScore; }catch(e){}

    function cleanReviewUI(){
        try{ if(typeof _rvCleanHeader==='function') _rvCleanHeader(); }catch(e){}
        try{
            var tabs=document.getElementById('review-tabs');
            if(tabs) tabs.innerHTML='<button id="rtab-tmdb" onclick="_rTab(\'tmdb\')" style="flex:1;padding:10px 4px;background:#01b4e4;border:none;color:#000;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit;">'+(fa()?'نظرات TMDB':'TMDB Reviews')+'</button>';
        }catch(e){}
        try{
            var row=document.querySelector('#reviews-modal div[style*="overflow-x:auto"]');
            if(row){
                Array.from(row.children).forEach(function(ch){
                    var t=(ch.textContent||'').toLowerCase();
                    if(t.indexOf('letterbox')>=0 || t.indexOf('rotten')>=0) ch.remove();
                });
            }
        }catch(e){}
    }

    var oldOpen=window.openReviews;
    window.openReviews=async function(){
        var modal=document.getElementById('reviews-modal'), titleEl=document.getElementById('reviews-modal-title');
        if(titleEl){ try{ titleEl.textContent=(curTitle||'') || (fa()?'نظرات کاربران':'User Reviews'); }catch(e){} }
        if(modal) modal.style.display='flex';
        cleanReviewUI();
        try{ if(typeof _rvSetLoading==='function') _rvSetLoading(); }catch(e){}
        try{ if(typeof _rvScoreTMDB==='function') _rvScoreTMDB(); }catch(e){}
        finalIMDbScore();
        try{
            if(typeof _rvFetchTMDBReviews==='function' && typeof _rvRender==='function'){
                var revs=await _rvFetchTMDBReviews();
                var badge=document.getElementById('reviews-count-badge');
                if(badge){ if(revs&&revs.length){ badge.textContent=revs.length; badge.style.display='inline'; } else badge.style.display='none'; }
                _rvRender(revs||[]);
                cleanReviewUI(); finalIMDbScore();
                return;
            }
        }catch(e){}
        if(typeof oldOpen==='function') return oldOpen.apply(this,arguments);
    };

    var FN_FS_KEY='fn-modal-fullscreen-persisted';
    function fsSaved(){try{return localStorage.getItem(FN_FS_KEY)==='1';}catch(e){return false;}}
    function setFsVisual(on){
        try{document.documentElement.classList.toggle('fn-persistent-fullscreen',!!on);}catch(e){}
    }
    function toggleFull(){
        var on=!!document.fullscreenElement || document.documentElement.classList.contains('fn-persistent-fullscreen');
        try{
            if(on){
                try{localStorage.removeItem(FN_FS_KEY);}catch(e){}
                setFsVisual(false);
                if(document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
            }else{
                try{localStorage.setItem(FN_FS_KEY,'1');}catch(e){}
                setFsVisual(true);
                if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function(){});
            }
        }catch(e){ setFsVisual(!on); }
    }
    // Native browser fullscreen cannot be restored after a reload without a user gesture;
    // the persisted app-level fullscreen keeps the site visually full-screen instead.
    try{if(fsSaved())setFsVisual(true);}catch(e){}
    document.addEventListener('fullscreenchange',function(){
        if(!document.fullscreenElement && fsSaved()) setFsVisual(true);
    });
    window.toggleAnyFullscreen=toggleFull;
    function makeBtn(host, closeSel){
        if(!host || host.querySelector('.fn-modal-fs-btn')) return;
        var btn=document.createElement('div');
        btn.className='fn-modal-fs-btn';
        btn.innerHTML='<i class="fa-solid fa-expand"></i>';
        btn.title='Fullscreen';
        btn.onclick=function(ev){ ev.stopPropagation(); toggleFull(); };
        /* Test and utility pages: keep one fullscreen button beside the close button, never floating over the title. */
        if(['quiz-page','personality-page','compare-modal','detailed-stats-modal','soundtracks-modal','backdrops-modal','posters-modal'].indexOf(host.id)>-1){
            var th=host.querySelector(".quiz-header,.personality-header,.compare-header,.ss-header, [style*='position:sticky']");
            var tc=th && th.querySelector("button,[onclick*='close'],[onclick*='Close'],.quiz-close");
            if(th && tc){
                btn.setAttribute('style','position:static;width:34px;height:34px;flex:0 0 34px;border-radius:50%;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.2);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;font-size:14px;');
                tc.insertAdjacentElement('afterend',btn); return;
            }
        }
        /* Reviews only: keep one 34x34 fullscreen button directly beside the 34x34 close button. */
        if(host.id==='reviews-modal'){
            var header=host.firstElementChild;
            var close=header && header.querySelector('button[onclick*="closeReviews"]');
            if(!header || !close) return;
            close.style.cssText='width:34px;height:34px;padding:0;border-radius:50%;background:#1e1e1e;color:white;border:none;font-size:16px;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;flex:0 0 34px;';
            btn.setAttribute('style','position:static;width:34px;height:34px;flex:0 0 34px;border-radius:50%;background:rgba(0,0,0,0.72);border:1px solid rgba(255,255,255,0.2);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;font-size:14px;backdrop-filter:blur(6px);box-shadow:0 4px 15px rgba(0,0,0,0.45);');
            close.insertAdjacentElement('afterend',btn);
            return;
        }
        var base='position:fixed;top:20px;left:68px;width:40px;height:40px;border-radius:50%;background:rgba(0,0,0,0.72);border:1px solid rgba(255,255,255,0.2);color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999;font-size:17px;backdrop-filter:blur(6px);box-shadow:0 4px 15px rgba(0,0,0,0.45);';
        btn.setAttribute('style',base);
        host.appendChild(btn);
    }
    function addFullscreenButtons(){
        ['modal','person-bio-modal','reviews-modal','generic-grid-page','companies-all-page','company-works-page','quiz-page','compare-modal','soundtracks-modal','backdrops-modal','posters-modal','detailed-stats-modal','personality-page'].forEach(function(id){
            var el=document.getElementById(id); if(el) makeBtn(el);
        });
    }
    var mo=null;
    function startFSObserver(){
        addFullscreenButtons();
        try{
            if(mo) return;
            mo=new MutationObserver(function(){ addFullscreenButtons(); });
            mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
        }catch(e){}
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startFSObserver); else startFSObserver();
    setTimeout(startFSObserver,800); setTimeout(startFSObserver,2500);
})();
// =================== END FINAL HOTFIX v15 ===================

    // Collapsible Mood panel: presentation only; genre buttons and existing pickMood behaviour remain untouched.
    function toggleMoodPanel(){
        var section=document.getElementById('mood-section'), btn=document.getElementById('mood-toggle');
        if(!section || !btn) return;
        var open=section.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
    }
;
