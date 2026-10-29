function showToast(msg, duration = 2500) {
            const existing = document.getElementById('toast-msg');
            if (existing) existing.remove();
            const toast = document.createElement('div');
            toast.id = 'toast-msg';
            toast.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#222;color:white;padding:10px 18px;border-radius:24px;font-size:13px;z-index:9999;border:1px solid #444;max-width:80%;text-align:center;pointer-events:none;transition:opacity 0.3s;`;
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        // ---- 21. MINI STATS UPDATE ----
        function getWatchHistory() {
            try { return JSON.parse(localStorage.getItem('family_history_v1') || '[]'); } catch(e) { return []; }
        }
        
        function updateMiniStats() {
            var history = getWatchHistory();
            var ratingCount = Object.keys(personalRatings).length;
            var el;
            el = document.getElementById('stat-watchlist'); if(el) el.textContent = favorites.length;
            el = document.getElementById('stat-history'); if(el) el.textContent = history.length;
            el = document.getElementById('stat-hours'); if(el) el.textContent = Math.round(history.length * 1.8);
            el = document.getElementById('stat-rating-count'); if(el) el.textContent = ratingCount;
            
            // Best rated
            const bestRated = Object.entries(personalRatings)
                .filter(([,v]) => v.stars >= 4)
                .sort(([,a],[,b]) => b.stars - a.stars)
                .slice(0, 10);
            
            const myBestSection = document.getElementById('my-best-section');
            const myBestRow = document.getElementById('my-best-row');
            if (bestRated.length > 0 && myBestRow) {
                myBestSection.style.display = 'block';
                myBestRow.innerHTML = bestRated.map(([id, r]) => `
                    <div class="card" onclick="openDetail(${id}, '${r.type||'movie'}')">
                        <div class="rate-badge">⭐${r.stars}</div>
                        ${r.poster ? `<img src="${IMG+r.poster}" class="poster" loading="lazy">` : '<div class="poster" style="background:#222;display:flex;align-items:center;justify-content:center;font-size:30px;">🎬</div>'}
                        <div class="meta-info"><div class="meta-title">${r.title}</div></div>
                    </div>
                `).join('');
            }
        }
        
        // ---- 22. PATCH openDetail FOR NEW FEATURES ----
        // (merged into the main override at bottom of file)
        
        // ---- 23. DARK/LIGHT AUTO MODE ----
        function initAutoTheme() {
            // The app defaults to Soft Dark Gray on every device. A light appearance
            // is used only when the user explicitly selected it inside the app;
            // the operating system preference must not silently turn the app white.
            const saved = localStorage.getItem('color_scheme_pref');
            document.body.classList.toggle('light-mode', saved === 'light');
        }
        
        function toggleLightMode() {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('color_scheme_pref', isLight ? 'light' : 'dark');
            showToast(isLight ? '☀️ حالت روشن' : '🌙 حالت تاریک');
        }
        
        // ---- 24. MODAL SWIPE GESTURE (next/prev in list) ----
        let modalSwipeTouchStartX = 0;
        let modalCurrentItems = [];
        let modalCurrentIndex = -1;
        
        (function() {
            const modal = document.getElementById('modal');
            if (!modal) return;
            modal.addEventListener('touchstart', e => {
                modalSwipeTouchStartX = e.touches[0].clientX;
            }, { passive: true });
            modal.addEventListener('touchend', e => {
                const dx = e.changedTouches[0].clientX - modalSwipeTouchStartX;
                if (Math.abs(dx) > 80 && modalCurrentItems.length > 1 && modalCurrentIndex >= 0) {
                    if (dx < 0) {
                        // Swipe left = next
                        const nextIdx = (modalCurrentIndex + 1) % modalCurrentItems.length;
                        const next = modalCurrentItems[nextIdx];
                        if (next) { modalCurrentIndex = nextIdx; openDetail(next.id, next.type || curType); }
                    } else {
                        // Swipe right = previous
                        const prevIdx = (modalCurrentIndex - 1 + modalCurrentItems.length) % modalCurrentItems.length;
                        const prev = modalCurrentItems[prevIdx];
                        if (prev) { modalCurrentIndex = prevIdx; openDetail(prev.id, prev.type || curType); }
                    }
                }
            }, { passive: true });
        })();
        
        // ---- 25. OVERRIDE makeCard TO ADD TRENDING BADGE ----
        const _origMakeCard = makeCard;
        function makeCard(m, type) {
            if(!m.poster_path) return '';
            let title = m.title || m.name;
            if (LANG === 'fa' && title) {
                const hasForeignScript = /[\u0E00-\u0E7F\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF]/.test(title);
                if (hasForeignScript) {
                    // First try _en_title (fetched in parallel), then original_title if it's English
                    if (m._en_title && !/[\u0E00-\u0E7F\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF]/.test(m._en_title)) {
                        title = m._en_title;
                    } else {
                        const engTitle = m.original_title || m.original_name;
                        const engHasForeign = engTitle && /[\u0E00-\u0E7F\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF]/.test(engTitle);
                        title = engHasForeign ? title : (engTitle || title);
                    }
                }
            }
            const classicIranFlag = m.__iranClassic ? `<img src="${typeof IRAN_FLAG_URL !== 'undefined' ? IRAN_FLAG_URL : 'https://flagofiran.com/files/Flag_of_Iran.svg'}" alt="☀️" title="${LANG==='fa' ? 'ایران قدیم' : 'Historic Iran'}" style="width:18px;height:12px;object-fit:cover;border-radius:2px;vertical-align:1px;margin-inline-end:5px;">` : '';
            const date = (m.release_date || m.first_air_date || 'N/A').split('-')[0];
            const rate = m.vote_average ? m.vote_average.toFixed(1) : 'NR';
            const itemType = m.media_type || type || (m.title ? 'movie' : 'tv');
            
            let ageRatingHtml = '';
            if (m.age_rating_display) {
                const ageClass = m.age_rating_class || '';
                ageRatingHtml = `<div class="age-rating-badge ${ageClass}" onclick="event.stopPropagation(); filterByAgeRating('${m.age_rating}', '${itemType}')" title="${m.age_rating_tooltip || ''}">${m.age_rating_display}</div>`;
            }
            
            const tmdbId = String(m.id);
            let dlBadgeHtml = '';
            if (DL_CACHE[tmdbId] === true) {
                dlBadgeHtml = `<div class="dl-badge-card show" title="${LANG==='fa'?'قابل دانلود':'Downloadable'}"><i class="fa-solid fa-download"></i></div>`;
            } else if (DL_CACHE[tmdbId] === undefined) {
                dlBadgeHtml = `<div class="dl-badge-card dl-badge-lazy" data-tmdb="${m.id}" data-type="${itemType}"></div>`;
            }
            
            // Trending badge
            const isTrending = m.trending || (m.popularity && m.popularity > 500);
            const trendingHtml = isTrending ? '<div class="trending-badge">🔥</div>' : '';
            
            // Personal rating badge
            const myRating = personalRatings[m.id];
            const myRatingHtml = myRating ? `<div style="position:absolute;bottom:5px;right:5px;background:rgba(0,0,0,0.8);color:#f5c518;font-size:10px;padding:2px 5px;border-radius:4px;">${'★'.repeat(myRating.stars)}</div>` : '';
            
            // Build meta-sub: if rated, show year on one line and stars on another, so year is never cut off
            let metaSubHtml;
            if (myRating) {
                metaSubHtml = `<div class="meta-sub" style="flex-direction:column;gap:1px;"><span>${date}</span><span style="color:#f5c518;font-size:11px;">${'★'.repeat(myRating.stars)}</span></div>`;
            } else {
                metaSubHtml = `<div class="meta-sub"><span>${date}</span></div>`;
            }
            
            return `
                <div class="card" onclick="openDetail(${m.id}, '${itemType}')">
                    <div class="rate-badge"><i class="fa-solid fa-star"></i> ${rate}</div>
                    ${ageRatingHtml}
                    ${dlBadgeHtml}
                    ${trendingHtml}
                    ${myRatingHtml}
                    <img src="${IMG+m.poster_path}" class="poster" loading="lazy" onerror="if(!this.dataset.fnRetry){this.dataset.fnRetry=1;var _s=this.src;this.src='';var _t=this;setTimeout(function(){_t.src=_s;},700);}">
                    <div class="meta-info">
                        <div class="meta-title">${classicIranFlag}${title}</div>
                        ${metaSubHtml}
                    </div>
                </div>
            `;
        }
        
        // Home category presentation: one consistent, theme-aware icon system.
        // New categories automatically receive the neutral film icon unless mapped below.
        const HOME_CATEGORY_ICONS = {
            trending_now:'fa-fire-flame-curved', newM25:'fa-clapperboard', updates:'fa-arrows-rotate',
            tm:'fa-ranking-star', ts:'fa-trophy', miniseries:'fa-layer-group', emmy:'fa-award',
            oscar:'fa-star', golden_globe:'fa-globe', academy_award:'fa-medal', survival:'fa-person-running',
            '20s':'fa-calendar-days', '30s':'fa-calendar-days', '40s':'fa-calendar-days', '50s':'fa-calendar-days',
            '60s':'fa-calendar-days', '70s':'fa-calendar-days', '80s':'fa-calendar-days', '90s':'fa-calendar-days',
            '00s':'fa-calendar-days', '10s':'fa-calendar-days', act:'fa-bolt', com:'fa-face-laugh', hor:'fa-ghost',
            dra:'fa-masks-theater', heartbreak_loss:'fa-heart-crack', sci:'fa-rocket', ani:'fa-images',
            anime:'fa-dragon', rom:'fa-heart', fam:'fa-people-roof', sports:'fa-futbol', mental:'fa-brain',
            fan:'fa-hat-wizard', war:'fa-shield-halved', bio:'fa-user-tie', book:'fa-book-open', docs:'fa-film',
            romcom:'fa-heart-circle-plus', parody:'fa-theater-masks', christmas_time:'fa-tree',
            apocalypse:'fa-skull-crossbones', iran:'fa-landmark', iran_pre1978:'brand-icon-iran', india:'fa-om',
            asia:'fa-torii-gate', a24:'brand-icon-a24', marvel:'brand-icon-marvel', marvelTV:'brand-icon-marvel-tv', dc:'brand-icon-dc',
            adult:'fa-lock', curator:'fa-wand-magic-sparkles'
        };
        function _homeCategoryTitle(value) {
            // Remove only a leading decorative emoji; badges/icons on media cards are untouched.
            return String(value || '').replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\u20E3]+\s*/u, '').trim();
        }
        function _homeCategoryIcon(id) {
            return HOME_CATEGORY_ICONS[id] || 'fa-film';
        }
        function _homeIconMarkup(id, extra='') {
            return `<i class="fa-solid ${_homeCategoryIcon(id)} sec-title-icon ${extra}" aria-hidden="true"></i>`;
        }
        function _listIconMarkup(type, q, title) {
            const x = String((type||'')+' '+(q||'')+' '+(title||'')).toLowerCase();
            let id = 'trending_now';
            if (type === 'actor_female_list' || x.includes('female') || x.includes('زن')) id = 'female';
            else if (type === 'actor_male_list' || x.includes('male') || x.includes('مرد')) id = 'male';
            else if (type === 'director_list' || x.includes('director') || x.includes('کارگردان')) id = 'director';
            else if (x.includes('company') || x.includes('studios') || x.includes('استودیو') || x.includes('شبکه')) id = 'companies';
            else if (x.includes('collection') || x.includes('مجموعه')) id = 'collections';
            else if (q === 'custom:iran_pre1978' || x.includes('ایران قدیم') || x.includes('classic iran')) id = 'iran_pre1978';
            else if (x.includes('a24')) id = 'a24'; else if (x.includes('marvel')) id = 'marvel'; else if (x.includes('dc')) id = 'dc';
            const special = {female:'fa-person-dress', male:'fa-person', director:'fa-clapperboard', companies:'fa-building', collections:'fa-boxes-stacked'};
            return special[id] ? `<i class="fa-solid ${special[id]} gg-title-icon" aria-hidden="true"></i>` : _homeIconMarkup(id,'gg-title-icon');
        }

        // ---- 26. TRENDING SECTION IN HOME ----
        // renderHome function
        function renderHome() {
            const t = TEXTS[LANG];
            const Q = (type, genre, yearMin, yearMax, origin) => {
                let q = `discover/${type}?include_adult=false&vote_count.gte=${MIN_VOTES}&sort_by=popularity.desc&without_genres=99&fn_home_mix=1`;
                if(genre) q += `&with_genres=${genre}`;
                if(origin) q += `&with_original_language=${origin}`;
                if (yearMin && yearMax) {
                    q += `&primary_release_date.gte=${yearMin}-01-01&primary_release_date.lte=${yearMax}-12-31`;
                    if (type === 'tv') q += `&first_air_date.gte=${yearMin}-01-01&first_air_date.lte=${yearMax}-12-31`;
                }
                return q;
            }
            
            const sections = [
                { id: 'trending_now', q: `trending/all/day`, t: LANG === 'fa' ? '🔥 الان داغه (Trending)' : '🔥 Trending Right Now', type: 'movie', trending: true },
                { id: 'newM25', q: `discover/movie?sort_by=primary_release_date.desc&vote_count.gte=10&include_adult=false`, t: LANG === 'fa' ? '🎬 جدیدترین فیلم‌ها' : '🎬 Latest Movies', type: 'movie' }, 
                { id: 'updates', q: `custom:updated_series`, t: t.updates, type: 'tv' },
                { id: 'tm', q: `custom:top_movies`, t: t.R_topM, type: 'movie' },
                { id: 'ts', q: `custom:top_tv`, t: t.R_topS, type: 'tv' },
                { id: 'miniseries', q: `custom:miniseries`, t: t.miniSeries, type: 'tv' },
                { id: 'emmy', q: `custom:emmy`, t: t.R_emmy, type: 'tv' },
                { id: 'oscar', q: `custom:oscar`, t: t.R_oscar, type: 'movie' },
                { id: 'golden_globe', q: `custom:golden_globe`, t: t.R_golden, type: 'mixed' },
                { id: 'academy_award', q: `custom:academy_award`, t: t.R_academy, type: 'movie' }, 
                { id: 'survival', q: `custom:survival`, t: t.R_surv, type: 'mixed' }, 
                { id: '20s', q: Q('movie', null, 1920, 1929), t: t.R_20s, type: 'movie' },
                { id: '30s', q: Q('movie', null, 1930, 1939), t: t.R_30s, type: 'movie' },
                { id: '40s', q: Q('movie', null, 1940, 1949), t: t.R_40s, type: 'movie' },
                { id: '50s', q: Q('movie', null, 1950, 1959), t: t.R_50s, type: 'movie' },
                { id: '60s', q: `custom:decade:1960:1969`, t: t.R_60s, type: 'movie' },
                { id: '70s', q: `custom:decade:1970:1979`, t: t.R_70s, type: 'movie' },
                { id: '80s', q: `custom:decade:1980:1989`, t: t.R_80s, type: 'movie' },
                { id: '90s', q: `custom:decade:1990:1999`, t: t.R_90s, type: 'movie' },
                { id: '00s', q: `custom:best_decade:2000:2009`, t: t.R_00s, type: 'movie' },
                { id: '10s', q: `custom:best_decade:2010:2020`, t: t.R_10s, type: 'movie' },
                { id: 'act', q: Q('movie', '28'), t: t.R_act, type: 'movie' },
                { id: 'com', q: Q('movie', '35'), t: t.R_com, type: 'movie' },
                { id: 'hor', q: Q('movie', '27'), t: t.R_hor, type: 'movie' },
                { id: 'dra', q: Q('movie', '18'), t: t.R_dra, type: 'movie' },
                { id: 'heartbreak_loss', q: 'custom:heartbreak_loss', t: t.R_heartbreak, type: 'mixed' },
                { id: 'sci', q: Q('movie', '878'), t: t.R_sci, type: 'movie' },
                { id: 'ani', q: Q('movie', '16'), t: t.R_ani, type: 'movie' },
                { id: 'anime', q: Q('tv', '16', null, null, 'ja'), t: t.R_anime, type: 'tv' },
                { id: 'rom', q: Q('movie', '10749'), t: t.R_rom, type: 'movie' },
                { id: 'fam', q: Q('movie', '10751'), t: t.R_fam, type: 'movie' },
                { id: 'sports', q: `custom:sports`, t: t.R_sports, type: 'movie' },
                { id: 'mental', q: `custom:mental_health`, t: t.R_mental, type: 'movie' },
                { id: 'fan', q: Q('movie', '14'), t: t.R_fan, type: 'movie' },
                { id: 'war', q: Q('movie', '10752'), t: t.R_war, type: 'movie' },
                { id: 'bio', q: Q('movie', '36'), t: t.R_bio, type: 'movie' },
                { id: 'book', q: `custom:book_adaptations`, t: t.R_book, type: 'movie' },
                { id: 'docs', q: `custom:documentaries`, t: t.R_docs, type: 'movie' },
                { id: 'romcom', q: `custom:romcom`, t: t.R_romcom, type: 'movie' },
                { id: 'parody', q: `custom:parody`, t: t.R_parody, type: 'movie' },
                { id: 'christmas_time', q: `custom:christmas_time`, t: t.R_christmas, type: 'mixed' },
                { id: 'apocalypse', q: `custom:apocalypse`, t: t.R_apocalypse, type: 'mixed' },
                { id: 'iran', q: Q('movie', null, null, null, 'fa'), t: t.R_iran, type: 'movie' },
                { id: 'iran_pre1978', q: 'custom:iran_pre1978', t: t.R_iran_pre1978, type: 'mixed' },
                { id: 'india', q: Q('movie', null, null, null, 'hi'), t: t.R_india, type: 'movie' },
                { id: 'asia', q: Q('movie', null, null, null, 'zh|ko|ja|th'), t: t.R_asia, type: 'movie' },
                { id: 'a24', q: `custom:a24`, t: t.R_a24, type: 'mixed' },
                { id: 'marvel', q: Q('movie', null, null, null).replace('sort_by=popularity.desc','sort_by=primary_release_date.desc').replace('&fn_home_mix=1','') + `&with_companies=420|7505`, t: t.R_marvel, type: 'movie' },
                { id: 'marvelTV', q: Q('tv', null, null, null).replace('sort_by=popularity.desc','sort_by=first_air_date.desc').replace('&fn_home_mix=1','') + `&with_companies=420|19551`, t: t.R_marvelTV, type: 'tv' },
                { id: 'dc', q: Q('movie', null, null, null).replace('sort_by=popularity.desc','sort_by=primary_release_date.desc').replace('&fn_home_mix=1','') + `&with_companies=429|9993|128064|2806`, t: t.R_dc, type: 'movie' },
                { id: 'adult', q: 'custom:adult', t: t.R_adult, type: 'movie', adult: true },
                { id: 'curator', q: 'curator_picks', t: t.R_curator, type: 'movie' },
            ];
            const c = document.getElementById('home-content');
            c.innerHTML = '';
            const heroContainer = document.createElement('div');
            heroContainer.className = 'hero-carousel';
            heroContainer.id = 'hero-carousel';
            c.appendChild(heroContainer);
            loadCarouselData();
            const exploreBanner = document.createElement('div');
            exploreBanner.className = 'family-explore-banner';
            exploreBanner.onclick = function () { openExplorePage(); };
            exploreBanner.innerHTML = `
                <div class="feb-bg-layer feb-active" id="feb-bg-1"></div>
                <div class="feb-bg-layer" id="feb-bg-2"></div>
                <div class="feb-overlay"></div>
                <div class="feb-content">
                    <div class="feb-icon"><i class="fa-regular fa-compass"></i><i class="fa-solid fa-film"></i></div>
                    <div class="feb-text">
                        <div class="feb-title">FAMILY NIGHT Explore</div>
                        <div class="feb-sub" id="feb-sub-text">Cinematic edits, scenes &amp; fan clips from across the web</div>
                    </div>
                    <i class="fa-solid fa-chevron-left feb-arrow"></i>
                </div>
            `;
            c.appendChild(exploreBanner);
            // Explore artwork is decorative; opening Explore loads its own feed.
            sections.forEach(s => {
                const div = document.createElement('div');
                div.className = 'section' + (s.adult ? ' adult-category-section' : '');
                let headerButton = '';
                const displayTitle = _homeCategoryTitle(s.t);
                if (s.id === 'curator') {
                    headerButton = `<span class="sec-more" onclick="openGenericGrid('movie', 'curator_picks', '${displayTitle.replace(/'/g, "\\'")}')">${t.seeAll}</span>`;
                } else if (s.adult) {
                    headerButton = `<span class="sec-more" onclick="openAdultCategory()">${t.seeAll}</span>`;
                } else {
                    const escapedQuery = s.q.replace(/'/g, "\\'");
                    headerButton = `<span class="sec-more" onclick="openGenericGrid('${s.type}', '${escapedQuery}', '${displayTitle.replace(/'/g, "\\'")}')">${t.seeAll}</span>`;
                }
                div.innerHTML = `
                    <div class="sec-head">
                        <span class="sec-title"><i class="fa-solid ${_homeCategoryIcon(s.id)} sec-title-icon" aria-hidden="true"></i><span>${displayTitle}</span></span>
                        ${headerButton}
                    </div>
                    <div class="row-scroll" id="row-${s.id}"></div>
                `;
                c.appendChild(div);
                // Fetch each row only near the viewport; expensive custom rows no longer block Home.
                if (window.fnLoadHomeRow) window.fnLoadHomeRow(s, `row-${s.id}`);
                else if (s.trending) loadTrendingRow(s.q, `row-${s.id}`);
                else if (s.adult) loadAdultRow(`row-${s.id}`);
                else loadRow(s.q, `row-${s.id}`, s.type);
            });
            // This widget triggers list + detail calls; create it only near the bottom.
            const upcomingTrigger = document.createElement('div');
            upcomingTrigger.className = 'fn-upcoming-trigger';
            c.appendChild(upcomingTrigger);
            if (window.fnDeferHomeTask) window.fnDeferHomeTask(upcomingTrigger, () => renderMonthlyUpcoming(c));
            else renderMonthlyUpcoming(c);
        }

        // ===== Official monthly releases / premieres (Home only) =====
        let _fnUpcomingRun = 0;
        let _fnUpcomingItems = {};
        function _fnEscape(value) {
            return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        }
        function _fnMonthWindow() {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            // Build local calendar dates; UTC conversion can otherwise move the first day back one day in Iran.
            const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            return { now: iso(now), start: iso(start), end: iso(end), label: new Intl.DateTimeFormat(LANG === 'fa' ? 'fa-IR' : 'en-US', { month:'long', year:'numeric' }).format(now) };
        }
        function _fnPrettyDate(iso) {
            if (!iso) return '';
            const date = new Date(iso + 'T12:00:00');
            return new Intl.DateTimeFormat(LANG === 'fa' ? 'fa-IR' : 'en-US', { day:'numeric', month:'short', year:'numeric' }).format(date);
        }
        function _fnUpcomingCopy() {
            return LANG === 'fa' ? {
                title:'✨ آثار مورد انتظار این ماه', sub:'فیلم‌ها و سریال‌های محبوب با تاریخ رسمی اکران یا پخش', source:'تاریخ رسمی TMDB', loading:'در حال بررسی برنامهٔ رسمی انتشار…', empty:'برای این ماه، اثر محبوبی با تاریخ رسمی در دسترس نیست.', coming:'به‌زودی', released:'منتشر شده', theatrical:'اکران رسمی', digital:'انتشار دیجیتال', premiere:'شروع پخش', cast:'بازیگران', noCast:'بازیگران هنوز اعلام نشده‌اند', noOverview:'خلاصهٔ رسمی هنوز منتشر نشده است.'
            } : {
                title:'✨ Most Anticipated This Month', sub:'Popular films and series with official release or premiere dates', source:'TMDB official dates', loading:'Checking the official release schedule…', empty:'No popular titles with an official date are available for this month.', coming:'Coming Soon', released:'Released', theatrical:'Official release', digital:'Digital release', premiere:'Series premiere', cast:'Cast', noCast:'Cast not announced yet', noOverview:'An official synopsis is not available yet.'
            };
        }
        async function _fnUpcomingDetails(item, window) {
            const type = item._fnType;
            try {
                const detail = await getData(`${type}/${item.id}?append_to_response=credits,release_dates`);
                if (!detail || !detail.id) return item;
                const primary = type === 'movie' ? detail.release_date : detail.first_air_date;
                let date = primary || item.release_date || item.first_air_date || '';
                let dateKind = type === 'tv' ? 'premiere' : 'theatrical';
                // A digital date is used only when TMDB records it in this calendar month.
                if (type === 'movie' && detail.release_dates && Array.isArray(detail.release_dates.results)) {
                    const digital = detail.release_dates.results.flatMap(r => r.release_dates || [])
                        .filter(r => r.type === 4 && r.release_date && r.release_date.slice(0,7) === window.start.slice(0,7))
                        .map(r => r.release_date.slice(0,10)).sort()[0];
                    if (digital) { date = digital; dateKind = 'digital'; }
                }
                // When TMDB has no localized synopsis yet, use its English official synopsis — never invented copy.
                if (!detail.overview) {
                    try { const en = await getDataEN(`${type}/${item.id}?append_to_response=credits,release_dates`); if (en && en.overview) detail.overview = en.overview; } catch (_) {}
                }
                const cast = detail.credits && Array.isArray(detail.credits.cast) ? detail.credits.cast.slice(0,3).map(x => x.name).filter(Boolean) : [];
                return Object.assign({}, item, detail, { _fnType:type, _fnDate:date, _fnDateKind:dateKind, _fnCast:cast });
            } catch (_) { return item; }
        }
        function _fnUpcomingCard(item, copy) {
            const date = item._fnDate || item.release_date || item.first_air_date || '';
            const released = !!date && date <= _fnMonthWindow().now;
            const title = item.title || item.name || '';
            const year = (date || '').slice(0,4);
            const cast = item._fnCast && item._fnCast.length ? item._fnCast.join(' · ') : copy.noCast;
            const state = released ? copy.released : copy.coming;
            const kind = copy[item._fnDateKind || (item._fnType === 'tv' ? 'premiere' : 'theatrical')];
            const img = item.poster_path ? IMG + item.poster_path : '';
            return `<button type="button" class="fn-upcoming-card ${released ? 'is-released' : ''}" onclick="openMonthlyUpcoming(${item.id}, '${item._fnType}', ${released})" aria-label="${_fnEscape(title)}">
                ${img ? `<img class="fn-upcoming-poster" src="${img}" loading="lazy" alt="${_fnEscape(title)}">` : ''}
                <span class="fn-upcoming-info"><span class="fn-upcoming-name">${_fnEscape(title)}</span><span class="fn-upcoming-meta">${_fnEscape(year)} · ${item._fnType === 'tv' ? 'TV' : 'Movie'}</span><span class="fn-upcoming-date">${_fnEscape(state)} · ${_fnEscape(kind)}: ${_fnEscape(_fnPrettyDate(date))}</span><span class="fn-upcoming-overview">${_fnEscape(item.overview || copy.noOverview)}</span><span class="fn-upcoming-cast">${_fnEscape(cast)}</span></span>
            </button>`;
        }
        async function renderMonthlyUpcoming(home) {
            const run = ++_fnUpcomingRun, w = _fnMonthWindow(), copy = _fnUpcomingCopy();
            const box = document.createElement('section');
            box.id = 'fn-upcoming-section'; box.className = 'fn-upcoming';
            box.innerHTML = `<div class="fn-upcoming-head"><div><div class="fn-upcoming-title">${copy.title}</div><div class="fn-upcoming-sub">${copy.sub} · ${_fnEscape(w.label)}</div></div><span class="fn-upcoming-source">${copy.source}</span></div><div class="fn-upcoming-status"><i class="fa-solid fa-calendar-days" style="margin-inline-end:7px;color:var(--primary)"></i>${copy.loading}</div>`;
            home.appendChild(box);
            const [movies, digitalMovies, shows] = await Promise.all([
                // Original / theatrical calendar dates
                getData(`discover/movie?primary_release_date.gte=${w.start}&primary_release_date.lte=${w.end}&sort_by=popularity.desc&vote_count.gte=5&include_adult=false`),
                // Official digital calendar dates (TMDB requires a release region for this filter).
                getData(`discover/movie?region=US&with_release_type=4&release_date.gte=${w.start}&release_date.lte=${w.end}&sort_by=popularity.desc&vote_count.gte=5&include_adult=false`),
                getData(`discover/tv?first_air_date.gte=${w.start}&first_air_date.lte=${w.end}&sort_by=popularity.desc&vote_count.gte=5&include_adult=false`)
            ]);
            if (run !== _fnUpcomingRun || !box.isConnected) return;
            const raw = [];
            (movies.results || []).forEach(x => raw.push(Object.assign({},x,{_fnType:'movie'})));
            (digitalMovies.results || []).forEach(x => raw.push(Object.assign({},x,{_fnType:'movie',_fnDigitalCalendar:true})));
            (shows.results || []).forEach(x => raw.push(Object.assign({},x,{_fnType:'tv'})));
            // Merge calendars without duplicate titles; popularity decides what earns a spot.
            const seen = new Set();
            const selected = raw.filter(x => x.poster_path && (x.popularity || 0) > 0 && !seen.has(`${x._fnType}:${x.id}`) && (seen.add(`${x._fnType}:${x.id}`), true)).sort((a,b) => (b.popularity || 0) - (a.popularity || 0)).slice(0,12);
            const rich = await Promise.all(selected.map(x => _fnUpcomingDetails(x,w)));
            if (run !== _fnUpcomingRun || !box.isConnected) return;
            const valid = rich.filter(x => {
                const d = x._fnDate || x.release_date || x.first_air_date || '';
                return d >= w.start && d <= w.end;
            }).sort((a,b) => (a._fnDate || '').localeCompare(b._fnDate || '') || (b.popularity || 0) - (a.popularity || 0));
            _fnUpcomingItems = {};
            valid.forEach(x => _fnUpcomingItems[`${x._fnType}:${x.id}`] = x);
            const row = box.querySelector('.fn-upcoming-status');
            if (!valid.length) { row.innerHTML = `<i class="fa-solid fa-calendar-xmark" style="margin-inline-end:8px;color:var(--sub)"></i>${copy.empty}`; return; }
            row.className = 'fn-upcoming-row';
            row.innerHTML = valid.map(x => _fnUpcomingCard(x, copy)).join('');
        }
        function openMonthlyUpcoming(id, type, released) {
            if (released) { openDetail(id, type); return; }
            const item = _fnUpcomingItems[`${type}:${id}`]; if (!item) return;
            const copy = _fnUpcomingCopy(), title = item.title || item.name || '', date = item._fnDate || item.release_date || item.first_air_date || '';
            let modal = document.getElementById('fn-upcoming-modal');
            if (!modal) { modal = document.createElement('div'); modal.id = 'fn-upcoming-modal'; modal.onclick = e => { if(e.target === modal) closeMonthlyUpcoming(); }; document.body.appendChild(modal); }
            const cast = item._fnCast && item._fnCast.length ? item._fnCast.join(' · ') : copy.noCast;
            modal.innerHTML = `<article class="fn-upcoming-sheet" role="dialog" aria-modal="true"><button class="fn-upcoming-close" onclick="closeMonthlyUpcoming()" aria-label="Close">×</button><div class="fn-upcoming-sheet-top">${item.poster_path ? `<img class="fn-upcoming-sheet-poster" src="${IMG_LG + item.poster_path}" alt="${_fnEscape(title)}">` : ''}<div><h3>${_fnEscape(title)}</h3><div class="fn-upcoming-meta">${_fnEscape((date || '').slice(0,4))} · ${type === 'tv' ? 'TV' : 'Movie'}</div><div class="fn-upcoming-date">${copy.coming} · ${copy[item._fnDateKind || (type === 'tv' ? 'premiere' : 'theatrical')]}: ${_fnEscape(_fnPrettyDate(date))}</div></div></div><p>${_fnEscape(item.overview || copy.noOverview)}</p><div class="fn-upcoming-sheet-cast"><strong>${copy.cast}:</strong> ${_fnEscape(cast)}</div></article>`;
            modal.classList.add('open');
        }
        function closeMonthlyUpcoming() { const m=document.getElementById('fn-upcoming-modal'); if(m) m.classList.remove('open'); }
        


        // ===== Release calendar (Home header only) =====
        // Calendar entries use TMDB's dated movie and TV discovery records. A date with
        // no official TMDB entry stays unfilled rather than assigning a title to a false date.
        let _fnCalState = null, _fnCalToken = 0, _fnCalTitles = {}, _fnCalReturnAfterDetail = false;
        const _fnCalFaMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
        const _fnCalEnMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        function _fnCalDigits(v){ return String(v||'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)); }
        function _fnCalG2J(gy,gm,gd){ return gregorianToShamsi(gy,gm,gd); }
        // Inverse of the existing Solar Hijri converter; returns a local Gregorian date.
        function _fnCalJ2G(jy,jm,jd){
            jy-=979; jm-=1; jd-=1; let jdn=365*jy+Math.floor(jy/33)*8+Math.floor((jy%33+3)/4);
            for(let i=0;i<jm;i++) jdn += i<6?31:30; jdn+=jd; let gdn=jdn+79;
            let gy=1600+400*Math.floor(gdn/146097); gdn%=146097; let leap=true;
            if(gdn>=36525){gdn--;gy+=100*Math.floor(gdn/36524);gdn%=36524;if(gdn>=365)gdn++;else leap=false;}
            gy+=4*Math.floor(gdn/1461);gdn%=1461;if(gdn>=366){leap=false;gdn--;gy+=Math.floor(gdn/365);gdn%=365;}
            const md=[31,(gy%4===0&&(gy%100!==0||gy%400===0))?29:28,31,30,31,30,31,31,30,31,30,31];let gm=0;
            while(gm<11&&gdn>=md[gm]){gdn-=md[gm++];} return {y:gy,m:gm+1,d:gdn+1};
        }
        function _fnCalIso(y,m,d){return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
        function _fnCalToday(){const n=new Date();return {y:n.getFullYear(),m:n.getMonth()+1,d:n.getDate()};}
        function _fnCalInit(){ if(_fnCalState) return; const n=_fnCalToday(); if(LANG==='fa'){const j=_fnCalG2J(n.y,n.m,n.d);_fnCalState={mode:'fa',y:j.y,m:j.m};}else _fnCalState={mode:'en',y:n.y,m:n.m}; }
        function _fnCalBounds(){const n=_fnCalToday(), j=_fnCalG2J(n.y,n.m,n.d);return {minG:{y:1900,m:1},maxG:{y:n.y,m:n.m},minJ:{y:1278,m:10},maxJ:{y:j.y,m:j.m}};}
        function _fnCalChangeMode(){const n=_fnCalToday();if(!_fnCalState){_fnCalInit();return;}if(_fnCalState.mode!==LANG){if(LANG==='fa'){const g={y:_fnCalState.y,m:_fnCalState.m,d:1},j=_fnCalG2J(g.y,g.m,g.d);_fnCalState={mode:'fa',y:j.y,m:j.m};}else{const g=_fnCalJ2G(_fnCalState.y,_fnCalState.m,1);_fnCalState={mode:'en',y:g.y,m:g.m};}}}
        function _fnCalWindow(){const st=_fnCalState;let first,last,label,days;
            if(st.mode==='fa'){const a=_fnCalJ2G(st.y,st.m,1), nm=st.m===12?{y:st.y+1,m:1}:{y:st.y,m:st.m+1}, b=_fnCalJ2G(nm.y,nm.m,1);first=new Date(a.y,a.m-1,a.d);last=new Date(b.y,b.m-1,b.d-1);days=Math.round((last-first)/86400000)+1;label=`${_fnCalFaMonths[st.m-1]} ${_fnCalFaDigits(st.y)}`;}
            else {first=new Date(st.y,st.m-1,1);last=new Date(st.y,st.m,0);days=last.getDate();label=`${_fnCalEnMonths[st.m-1]} ${st.y}`;}
            const iso=d=>_fnCalIso(d.getFullYear(),d.getMonth()+1,d.getDate());return {first,last,days,start:iso(first),end:iso(last),label};}
        function _fnCalCopy(){return LANG==='fa'?{title:'تقویم انتشار',sub:'اکران و شروع پخش رسمی فیلم و سریال',go:'انتخاب ماه',search:'انتخاب ماه و سال',loading:'در حال بررسی تاریخ‌های رسمی…',empty:'در این بازه هنوز تاریخ رسمی ثبت نشده است.',source:'داده‌های تاریخ‌دار TMDB',noDay:'برای این روز، عنوانِ تاریخ‌دارِ رسمی در TMDB ثبت نشده است.',soon:'به‌زودی'}:{title:'Release Calendar',sub:'Official movie releases and series premieres',go:'Go',search:'Month / date, e.g. 2000-08',loading:'Checking official dated releases…',empty:'No official dated releases are listed for this period yet.',source:'TMDB dated records',noDay:'No officially dated title is listed by TMDB for this day.',soon:'Coming Soon'};}
        function _fnCalShift(delta){const s=_fnCalState;if(s.mode==='fa'){s.m+=delta;if(s.m<1){s.m=12;s.y--;}if(s.m>12){s.m=1;s.y++;}}else{const d=new Date(s.y,s.m-1+delta,1);s.y=d.getFullYear();s.m=d.getMonth()+1;}renderReleaseCalendar();}
        function _fnCalAllowed(){const s=_fnCalState,b=_fnCalBounds(),v=s.mode==='fa'?s.y*100+s.m:s.y*100+s.m,min=s.mode==='fa'?b.minJ.y*100+b.minJ.m:b.minG.y*100+b.minG.m,max=s.mode==='fa'?b.maxJ.y*100+b.maxJ.m:b.maxG.y*100+b.maxG.m;return {prev:v>min,next:v<max};}
        function openReleaseCalendar(){_fnCalInit();_fnCalChangeMode();let root=document.getElementById('fn-release-calendar');if(!root){root=document.createElement('div');root.id='fn-release-calendar';root.onclick=e=>{if(e.target===root)closeReleaseCalendar();};document.body.appendChild(root);}root.classList.add('open');renderReleaseCalendar();}
        function closeReleaseCalendar(){const x=document.getElementById('fn-release-calendar');if(x)x.classList.remove('open');}
        function _fnCalFaDigits(n){return String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);}
        function openFaCalendarPicker(){
            _fnCalInit(); const b=_fnCalBounds(), st=_fnCalState, old=document.getElementById('fn-cal-picker-shade'); if(old) old.remove();
            const years=[]; for(let y=b.minJ.y;y<=b.maxJ.y;y++) years.push(`<option value="${y}" ${y===st.y?'selected':''}>${_fnCalFaDigits(y)}</option>`);
            const months=_fnCalFaMonths.map((name,i)=>`<option value="${i+1}" ${i+1===st.m?'selected':''}>${_fnCalFaDigits(i+1)} — ${name}</option>`).join('');
            const shade=document.createElement('div'); shade.id='fn-cal-picker-shade'; shade.className='fn-cal-picker-shade'; shade.onclick=e=>{if(e.target===shade)closeFaCalendarPicker();};
            shade.innerHTML=`<section class="fn-cal-picker" role="dialog" aria-modal="true" aria-label="انتخاب ماه"><h3>انتخاب ماه</h3><div class="fn-cal-picker-selects"><select id="fn-cal-fa-month" aria-label="ماه">${months}</select><select id="fn-cal-fa-year" aria-label="سال">${years.join('')}</select></div><div class="fn-cal-picker-actions"><button onclick="closeFaCalendarPicker()">انصراف</button><button class="set" onclick="setFaCalendarMonth()">تأیید</button></div></section>`;
            document.body.appendChild(shade);
        }
        function closeFaCalendarPicker(){const x=document.getElementById('fn-cal-picker-shade');if(x)x.remove();}
        function setFaCalendarMonth(){const m=+(document.getElementById('fn-cal-fa-month')||{}).value,y=+(document.getElementById('fn-cal-fa-year')||{}).value;if(!m||!y)return;const b=_fnCalBounds(),v=y*100+m,min=b.minJ.y*100+b.minJ.m,max=b.maxJ.y*100+b.maxJ.m;if(v<min)_fnCalState={mode:'fa',y:b.minJ.y,m:b.minJ.m};else if(v>max)_fnCalState={mode:'fa',y:b.maxJ.y,m:b.maxJ.m};else _fnCalState={mode:'fa',y,m};closeFaCalendarPicker();renderReleaseCalendar();}
        function fnCalendarJump(){if(LANG==='fa'){openFaCalendarPicker();return;}const el=document.getElementById('fn-cal-search');if(!el)return;let v=_fnCalDigits(el.value).trim().replace(/[.]/g,'/');let m=v.match(/^(\d{4})[-/]?(\d{1,2})/);if(!m)return;let y=+m[1],mo=+m[2];if(mo<1||mo>12)return;_fnCalState={mode:'en',y:y,m:mo};const b=_fnCalBounds(),value=y*100+mo,min=b.minG.y*100+b.minG.m,max=b.maxG.y*100+b.maxG.m;if(value<min)_fnCalState={mode:'en',y:b.minG.y,m:b.minG.m};if(value>max)_fnCalState={mode:'en',y:b.maxG.y,m:b.maxG.m};renderReleaseCalendar();}
        async function _fnCalFetch(url){const a=await Promise.all([1,2,3,4,5].map(page=>getData(`${url}&page=${page}`)));return a.flatMap(x=>x&&x.results||[]);}
        async function renderReleaseCalendar(){const root=document.getElementById('fn-release-calendar');if(!root||!root.classList.contains('open'))return;_fnCalChangeMode();const c=_fnCalCopy(),w=_fnCalWindow(),allow=_fnCalAllowed(),token=++_fnCalToken;
            const week=LANG==='fa'?['د','س','چ','پ','ج','ش','ی']:['M','T','W','T','F','S','S'];
            root.innerHTML=`<section class="fn-cal-panel" role="dialog" aria-modal="true"><div class="fn-cal-top"><button class="fn-cal-close" onclick="closeReleaseCalendar()" aria-label="Close">×</button><div class="fn-cal-top-copy"><strong>${c.title}</strong><small>${c.sub}</small></div><i class="fa-solid fa-calendar-days" style="color:var(--primary);font-size:22px"></i></div><div class="fn-cal-tools">${LANG==='fa'?`<button class="fn-cal-fa-pick" onclick="openFaCalendarPicker()"><i class="fa-solid fa-calendar-days" style="margin-inline-end:7px"></i>${_fnCalFaMonths[_fnCalState.m-1]} ${_fnCalFaDigits(_fnCalState.y)}</button>`:`<input id="fn-cal-search" class="fn-cal-search" type="month" placeholder="${c.search}" onkeydown="if(event.key==='Enter')fnCalendarJump()">`}<button class="fn-cal-go" onclick="fnCalendarJump()">${c.go}</button></div><div class="fn-cal-monthbar"><button class="fn-cal-arrow" onclick="_fnCalShift(-1)" ${allow.prev?'':'disabled'} aria-label="Previous month"><i class="fa-solid fa-chevron-left"></i></button><div class="fn-cal-monthname">${w.label}</div><button class="fn-cal-arrow" onclick="_fnCalShift(1)" ${allow.next?'':'disabled'} aria-label="Next month"><i class="fa-solid fa-chevron-right"></i></button></div><div class="fn-cal-week">${week.map(x=>`<span>${x}</span>`).join('')}</div><div class="fn-cal-loading"><span><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary);margin-inline-end:8px"></i>${c.loading}</span></div></section>`;
            const [movies,tvs]=await Promise.all([_fnCalFetch(`discover/movie?primary_release_date.gte=${w.start}&primary_release_date.lte=${w.end}&sort_by=popularity.desc&include_adult=false`),_fnCalFetch(`discover/tv?first_air_date.gte=${w.start}&first_air_date.lte=${w.end}&sort_by=popularity.desc&include_adult=false`)]);
            if(token!==_fnCalToken||!root.classList.contains('open'))return;const byDate={};[...movies.map(x=>Object.assign(x,{_fnType:'movie',_fnCalendarDate:x.release_date})),...tvs.map(x=>Object.assign(x,{_fnType:'tv',_fnCalendarDate:x.first_air_date}))].filter(x=>x.poster_path&&x._fnCalendarDate>=w.start&&x._fnCalendarDate<=w.end).sort((a,b)=>(b.popularity||0)-(a.popularity||0)).forEach(x=>{if(!byDate[x._fnCalendarDate])byDate[x._fnCalendarDate]=x;});_fnCalTitles=byDate;
            const firstWeek=(w.first.getDay()+6)%7, today=_fnCalToday(),todayIso=_fnCalIso(today.y,today.m,today.d);let cells='';for(let i=0;i<firstWeek;i++)cells+='<span></span>';for(let i=0;i<w.days;i++){let d=new Date(w.first);d.setDate(w.first.getDate()+i);const iso=_fnCalIso(d.getFullYear(),d.getMonth()+1,d.getDate()),item=byDate[iso],num=_fnCalState.mode==='fa'?_fnCalFaDigits(_fnCalG2J(d.getFullYear(),d.getMonth()+1,d.getDate()).d):d.getDate(),future=iso>todayIso,title=item?(item.title||item.name||''):'';cells+=`<button class="fn-cal-day ${item?'has-title':''} ${future?'is-future':''} ${iso===todayIso?'is-today':''}" ${item?`onclick="openReleaseCalendarItem('${iso}')" aria-label="${_fnEscape(title)}" title="${_fnEscape(title)}"`:`onclick="showReleaseCalendarEmpty('${iso}')" aria-label="${c.noDay}"`} >${item?`<img src="${IMG+item.poster_path}" loading="lazy" alt="">`:''}<span class="num">${num}</span>${item&&future?`<span class="soon">${c.soon}</span>`:''}</button>`;}
            const loader=root.querySelector('.fn-cal-loading');loader.className='fn-cal-grid';loader.innerHTML=cells;const foot=document.createElement('div');foot.className='fn-cal-foot';foot.textContent=c.source+' · '+c.noDay;root.querySelector('.fn-cal-panel').appendChild(foot);
        }
        function showReleaseCalendarEmpty(iso){const x=document.querySelector('.fn-cal-day-title')||document.createElement('div');x.className='fn-cal-day-title';x.textContent=_fnCalCopy().noDay+' ('+_fnPrettyDate(iso)+')';const p=document.querySelector('.fn-cal-panel');if(!x.parentNode)p.appendChild(x);}
        function openReleaseCalendarItem(iso){const item=_fnCalTitles[iso];if(item){_fnCalReturnAfterDetail=true;closeReleaseCalendar();openDetail(item.id,item._fnType);}}
        function fnCloseDetailModal(){const modal=document.getElementById('modal');if(modal)modal.style.display='none';if(window.__fnCountryReturn&&window.FNCountryDiscovery){window.FNCountryDiscovery.restoreAfterDetail();window.__fnCountryReturn=null;}if(_fnCalReturnAfterDetail){_fnCalReturnAfterDetail=false;openReleaseCalendar();}}

        async function loadTrendingRow(q, elId) {
            const loadingRow = fnBeginCategoryLoader(elId);
            const d = await getData(q);
            const c = document.getElementById(elId);
            fnFinishCategoryLoader(c || loadingRow);
            if (!d.results) return;
            d.results.forEach(m => {
                m.trending = true; // mark as trending
                const type = m.media_type || (m.title ? 'movie' : 'tv');
                if (type === 'person') return;
                if (!_passesHomeNRFilter(m, type)) return;
                c.innerHTML += makeCard(m, type);
            });
        }
        
        // =================== BACK BUTTON HANDLING ===================
        (function() {
            // Push initial state
            history.pushState({ page: 'app' }, '', '');
            
            window.addEventListener('popstate', function(e) {
                // Check what's open and close the topmost layer
                if (document.getElementById('player-fs').style.display !== 'none' && document.getElementById('player-fs').style.display !== '') {
                    closePlayer();
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('compare-modal').classList.contains('open')) {
                    document.getElementById('compare-modal').classList.remove('open');
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('trailer-modal').style.display === 'flex' || document.getElementById('trailer-modal').style.display === 'block') {
                    closeTrailer();
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('person-bio-modal').style.display !== 'none') {
                    document.getElementById('person-bio-modal').style.display = 'none';
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('person-gallery-modal').style.display !== 'none') {
                    document.getElementById('person-gallery-modal').style.display = 'none';
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('person-works-modal').style.display !== 'none') {
                    document.getElementById('person-works-modal').style.display = 'none';
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('modal').style.display !== 'none') {
                    document.getElementById('modal').style.display = 'none';
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('generic-grid-page').style.display === 'flex') {
                    closeGenericGrid();
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('companies-all-page').style.display === 'flex') {
                    closeCompaniesAll();
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('company-works-page').style.display === 'flex') {
                    document.getElementById('company-works-page').style.display = 'none';
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                if (document.getElementById('sidebar').classList.contains('open')) {
                    toggleMenu();
                    history.pushState({ page: 'app' }, '', '');
                    return;
                }
                // Double-back to exit (Instagram style)
                if (window._backPressedOnce) {
                    // second press within 2s — exit
                    try { window.close(); } catch(e) {}
                    setTimeout(() => { try { window.location.href = 'about:blank'; } catch(e) {} }, 100);
                    return;
                }
                window._backPressedOnce = true;
                // Show toast
                const isFA2 = LANG === 'fa';
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
                    background:rgba(30,30,30,0.95);color:white;
                    padding:12px 22px;border-radius:24px;font-size:13px;font-weight:600;
                    z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.5);
                    backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.1);
                    white-space:nowrap;transition:opacity 0.4s;font-family:inherit;
                `;
                toast.textContent = isFA2 ? 'برای خروج دوباره بک بزنید' : 'Press back again to exit';
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => { toast.remove(); window._backPressedOnce = false; }, 400);
                }, 2000);
                history.pushState({ page: 'app' }, '', '');
            });
            
            // doExitApp kept for compatibility

            function doExitApp() {
                // Try multiple exit methods across different environments
                try {
                    // Method 1: Standard window.close (works if opened by script or standalone PWA)
                    window.close();
                } catch(e1) {}
                
                // Method 2: Android WebView interface
                try {
                    if (window.Android && typeof window.Android.closeApp === 'function') {
                        window.Android.closeApp();
                        return;
                    }
                } catch(e2) {}

                // Method 3: Navigate to blank then close
                setTimeout(function() {
                    try {
                        window.location.href = 'about:blank';
                        window.close();
                    } catch(e3) {}
                }, 100);

                // Method 4: For PWA / standalone mode — show a final message
                setTimeout(function() {
                    var ov = document.getElementById('exit-confirm-overlay');
                    if (ov) {
                        ov.innerHTML = '<div style="text-align:center;padding:40px 20px;color:white;">'
                            + '<div style="font-size:50px;margin-bottom:16px;">👋</div>'
                            + '<div style="font-size:16px;font-weight:bold;margin-bottom:8px;">' + (LANG === 'fa' ? 'تا بعد! می‌تونی تب رو ببندی.' : 'Goodbye! You can close this tab.') + '</div>'
                            + '<div style="font-size:12px;color:#aaa;">' + (LANG === 'fa' ? 'مرورگر اجازه بستن خودکار رو نمیده.' : 'Browser doesn\'t allow auto-close.') + '</div>'
                            + '</div>';
                    }
                }, 500);
            }
        })();
        // =================== END BACK BUTTON HANDLING ===================
        
        // =================== PERSONALITY ANALYSIS ===================
        // =================== PERSONALITY ANALYSIS ===================
        var _pSel = { movie: [], tv: [], anime: [] };
        var _pSTout = null;

        function openPersonalityPage() {
            document.getElementById('personality-page').classList.add('open');
            history.pushState({ page: 'personality' }, '', '');
            var isFA = LANG === 'fa';
            var h = document.getElementById('txt-personality-header');
            if (h) h.textContent = isFA ? '🧠 تحلیل شخصیت سینمایی' : '🧠 Cinema Personality Analysis';
            _renderPInputUI();
        }

        function closePersonalityPage() {
            document.getElementById('personality-page').classList.remove('open');
        }

        function _renderPInputUI() {
            var fa = LANG === 'fa';
            var c = document.getElementById('personality-content');
            c.innerHTML = '<div style="padding:16px;max-width:520px;margin:0 auto;">'
                + '<div style="text-align:center;margin-bottom:20px;">'
                + '<div style="font-size:48px;margin-bottom:8px;">🎬</div>'
                + '<div style="font-size:15px;font-weight:800;color:#cc88ff;margin-bottom:6px;">'
                + (fa ? 'آثار مورد علاقه‌ات رو انتخاب کن' : 'Choose Your Favorite Works') + '</div>'
                + '<div style="font-size:12px;color:#666;line-height:1.6;">'
                + (fa ? 'هوش مصنوعی بر اساس انتخاب‌هایت شخصیتت رو تحلیل می‌کنه' : 'AI will analyze your personality based on your selections') + '</div>'
                + '</div>'
                + _buildPSection('movie', fa ? '🎬 فیلم‌های مورد علاقه' : '🎬 Favorite Movies', fa ? 'جستجوی فیلم...' : 'Search movies...')
                + _buildPSection('tv', fa ? '📺 سریال‌های مورد علاقه' : '📺 Favorite Series', fa ? 'جستجوی سریال...' : 'Search series...')
                + _buildPSection('anime', fa ? '🌸 انیمه / انیمیشن' : '🌸 Anime / Animation', fa ? 'جستجوی انیمه...' : 'Search anime...')
                + '<button onclick="_runPAnalysis()" style="width:100%;padding:16px;background:linear-gradient(135deg,#7c3aed,#4c1d95);border:none;border-radius:14px;color:white;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;margin-top:8px;">'
                + '<i class="fa-solid fa-brain"></i> ' + (fa ? '✨ تحلیل شخصیت من' : '✨ Analyze My Personality')
                + '</button>'
                + '<div style="text-align:center;font-size:11px;color:#444;margin-top:8px;">'
                + (fa ? 'حداقل ۱ اثر کافیه' : 'At least 1 work is enough') + '</div>'
                + '</div>';
        }

        function _buildPSection(type, label, ph) {
            return '<div style="margin-bottom:18px;">'
                + '<div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px;">' + label + '</div>'
                + '<div style="position:relative;">'
                + '<input type="text" id="psi-' + type + '" placeholder="' + ph + '" oninput="_pSDeb(\'' + type + '\',this.value)" '
                + 'style="width:100%;padding:10px 14px;background:#111;border:1px solid #2a2a2a;border-radius:10px;color:white;font-size:13px;font-family:inherit;box-sizing:border-box;outline:none;">'
                + '<div id="psr-' + type + '" style="display:none;position:absolute;top:100%;left:0;right:0;background:#161616;border:1px solid #2a2a2a;border-radius:10px;z-index:50;max-height:220px;overflow-y:auto;margin-top:4px;"></div>'
                + '</div>'
                + '<div id="pss-' + type + '" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;"></div>'
                + '</div>';
        }

        function _pSDeb(type, val) {
            clearTimeout(_pSTout);
            var r = document.getElementById('psr-' + type);
            if (!val || val.trim().length < 2) { if(r) r.style.display='none'; return; }
            _pSTout = setTimeout(function() { _pDoSearch(type, val.trim()); }, 400);
        }

        async function _pDoSearch(type, q) {
            var r = document.getElementById('psr-' + type);
            if (!r) return;
            r.style.display = 'block';
            r.innerHTML = '<div style="padding:10px;text-align:center;color:#555;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
            try {
                var ep = type === 'anime' ? 'search/multi?query=' + encodeURIComponent(q) : 'search/' + (type === 'movie' ? 'movie' : 'tv') + '?query=' + encodeURIComponent(q);
                var data = await getData(ep);
                var res = (data.results || []);
                if (type === 'anime') {
                    res = res.filter(function(x) {
                        return x.original_language === 'ja' || x.original_language === 'ko' || (x.genre_ids && x.genre_ids.indexOf(16) > -1);
                    }).slice(0, 6);
                } else {
                    res = res.slice(0, 8);
                }
                if (!res.length) { r.innerHTML = '<div style="padding:10px;text-align:center;color:#555;">نتیجه‌ای یافت نشد</div>'; return; }
                r.innerHTML = res.map(function(item) {
                    var t = (item.title || item.name || '?').replace(/'/g, '&#39;');
                    var y = ((item.release_date || item.first_air_date || '').split('-')[0]);
                    var p = item.poster_path ? (IMG + item.poster_path) : '';
                    return '<div onclick="_pSelItem(\'' + type + '\',' + item.id + ',\'' + t + '\',\'' + y + '\',\'' + p + '\')" '
                        + 'style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #1a1a1a;">'
                        + (p ? '<img src="' + p + '" style="width:30px;height:45px;border-radius:4px;object-fit:cover;">' : '<div style="width:30px;height:45px;background:#1e1e1e;border-radius:4px;display:flex;align-items:center;justify-content:center;">🎬</div>')
                        + '<div><div style="font-size:13px;font-weight:600;color:white;">' + t + '</div><div style="font-size:11px;color:#555;">' + (y || '') + '</div></div>'
                        + '</div>';
                }).join('');
            } catch(e) {
                r.innerHTML = '<div style="padding:10px;text-align:center;color:#555;">خطا</div>';
            }
        }

        function _pSelItem(type, id, title, year, poster) {
            if (_pSel[type].length >= 5) return;
            for (var i = 0; i < _pSel[type].length; i++) { if (_pSel[type][i].id == id) return; }
            _pSel[type].push({ id: id, title: title, year: year, poster: poster });
            var inp = document.getElementById('psi-' + type);
            var r = document.getElementById('psr-' + type);
            if (inp) inp.value = '';
            if (r) r.style.display = 'none';
            _pRenderSel(type);
        }

        function _pRemItem(type, id) {
            _pSel[type] = _pSel[type].filter(function(x) { return x.id != id; });
            _pRenderSel(type);
        }

        function _pRenderSel(type) {
            var el = document.getElementById('pss-' + type);
            if (!el) return;
            el.innerHTML = _pSel[type].map(function(item) {
                return '<div style="display:flex;align-items:center;gap:6px;background:#1a1a2a;border:1px solid #2a2a4a;border-radius:10px;padding:5px 8px;max-width:160px;">'
                    + (item.poster ? '<img src="' + item.poster + '" style="width:22px;height:33px;border-radius:3px;object-fit:cover;">' : '')
                    + '<div style="flex:1;min-width:0;"><div style="font-size:11px;font-weight:600;color:white;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">' + item.title + '</div>'
                    + '<div style="font-size:10px;color:#555;">' + (item.year || '') + '</div></div>'
                    + '<button onclick="_pRemItem(\'' + type + '\',' + item.id + ')" style="background:none;border:none;color:#555;cursor:pointer;font-size:14px;padding:0;">✕</button>'
                    + '</div>';
            }).join('');
        }

        function _extractJsonObject(txt) {
            if (!txt) return null;
            try { return JSON.parse(txt); } catch(e) {}
            var clean = String(txt).replace(/```json|```/g, '').trim();
            var sidx = clean.indexOf('{'), eidx = clean.lastIndexOf('}');
            if (sidx > -1 && eidx > sidx) { try { return JSON.parse(clean.substring(sidx, eidx + 1)); } catch(e2) {} }
            return null;
        }

        function _localPersonalityResult(fa) {
            var all = [].concat(_pSel.movie || [], _pSel.tv || [], _pSel.anime || []);
            var names = all.map(function(x){ return x.title; }).filter(Boolean);
            var hasDark = names.some(function(n){ return /dark|joker|fight|godfather|se7en|hannibal|breaking bad|true detective|shutter|black/i.test(n); });
            var hasEpic = names.some(function(n){ return /lord|rings|game of thrones|dune|avatar|star wars|inception|interstellar|gladiator/i.test(n); });
            var hasWarm = names.some(function(n){ return /friends|office|amelie|coco|up|la la|toy story|inside out/i.test(n); });
            var type = hasDark ? (fa ? 'کاوشگر سایه‌ها' : 'Shadow Explorer') : hasEpic ? (fa ? 'رویاپرداز حماسی' : 'Epic Dreamer') : hasWarm ? (fa ? 'قلب‌گرم داستان‌دوست' : 'Warm Story-Seeker') : (fa ? 'منتقد شهودی' : 'Intuitive Cinephile');
            var emoji = hasDark ? '🖤' : hasEpic ? '🚀' : hasWarm ? '✨' : '🎭';
            var desc = fa ? 'انتخاب‌هایت نشان می‌دهد بیشتر دنبال تجربه‌ای هستی که فقط سرگرم‌کننده نباشد و رد احساسی یا فکری بگذارد. تو معمولاً به شخصیت‌های چندلایه، فضای قابل لمس و داستان‌هایی جذب می‌شوی که بعد از پایان هنوز در ذهن می‌مانند. سلیقه‌ات ترکیبی از کنجکاوی، حساسیت احساسی و نیاز به کیفیت روایی است.' : 'Your choices suggest that you look for stories that do more than simply entertain. You are drawn to layered characters, memorable atmospheres, and narratives that stay in your mind after they end. Your taste blends curiosity, emotional sensitivity, and a strong need for narrative quality.';
            return { personality_type:type, personality_emoji:emoji, description:desc, traits: fa ? ['کنجکاو','احساس‌محور','جزئیات‌بین','سلیقه‌مند'] : ['Curious','Emotion-aware','Detail-oriented','Taste-driven'], if_movie:{character:fa?'تئودور توامبلی':'Theodore Twombly',actor:'Joaquin Phoenix',movie:'Her',year:'2013',reason:fa?'چون بین احساس، تنهایی و معنا دنبال ارتباط واقعی می‌گردد.':'Because he searches for real connection between emotion, solitude, and meaning.'}, if_series:{character:fa?'دان دریپر':'Don Draper',actor:'Jon Hamm',series:'Mad Men',year:'2007',reason:fa?'چون پشت ظاهر آرام، ذهنی پیچیده و داستانی چندلایه دارد.':'Because behind a composed surface, he carries a complex inner world.'}, if_anime:{character:fa?'اسپایک اشپیگل':'Spike Spiegel',show:'Cowboy Bebop',year:'1998',reason:fa?'چون ترکیبی از تنهایی، جذابیت، گذشته و انتخاب‌های سخت است.':'Because he mixes loneliness, charisma, past wounds, and difficult choices.'}, top5_movies:[{title:'Her',year:'2013',reason:fa?'احساسی، مدرن و شخصیت‌محور':'emotional and character-driven'},{title:'Arrival',year:'2016',reason:fa?'فکری و عمیق':'thoughtful and deep'},{title:'Prisoners',year:'2013',reason:fa?'تاریک و اخلاقی':'dark and morally tense'},{title:'The Prestige',year:'2006',reason:fa?'معمایی و وسواس‌گونه':'mysterious and obsessive'},{title:'La La Land',year:'2016',reason:fa?'رمانتیک و تلخ‌وشیرین':'romantic and bittersweet'}], top5_series:[{title:'True Detective',year:'2014',reason:fa?'فضاسازی و شخصیت‌پردازی قوی':'strong atmosphere and characters'},{title:'Breaking Bad',year:'2008',reason:fa?'تحول شخصیتی شدید':'intense transformation'},{title:'Dark',year:'2017',reason:fa?'پیچیده و فلسفی':'complex and philosophical'},{title:'The Bear',year:'2022',reason:fa?'پراضطراب و انسانی':'tense and human'},{title:'Fargo',year:'2014',reason:fa?'تلخ، عجیب و هوشمند':'dark, strange, and smart'}], similar_movies:[{title:'Enemy',year:'2013'},{title:'Nightcrawler',year:'2014'},{title:'Ex Machina',year:'2014'}], similar_series:[{title:'Mindhunter',year:'2017'},{title:'Severance',year:'2022'},{title:'Mr. Robot',year:'2015'}], similar_anime:[{title:'Monster',year:'2004'},{title:'Death Note',year:'2006'},{title:'Perfect Blue',year:'1997'}] };
        }

        async function _runPAnalysis() {
            var fa = LANG === 'fa';
            var tot = _pSel.movie.length + _pSel.tv.length + _pSel.anime.length;
            if (tot < 1) { alert(fa ? 'حداقل یک اثر انتخاب کن!' : 'Select at least one work!'); return; }
            var c = document.getElementById('personality-content');
            c.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;"><div style="font-size:50px;animation:brainPulse 1s ease-in-out infinite;">🧠</div><div style="color:#cc88ff;font-size:16px;font-weight:800;">' + (fa ? 'در حال تحلیل حرفه‌ای...' : 'Analyzing professionally...') + '</div><div style="color:#555;font-size:12px;text-align:center;max-width:300px;line-height:1.7;">' + (fa ? 'انتخاب‌ها، ژانرها و الگوی سلیقه‌ات بررسی می‌شود' : 'Reviewing your selections, genres, and taste pattern') + '</div></div>';
            var mv = _pSel.movie.map(function(x){return x.title+(x.year?' ('+x.year+')':'');}).join(', ') || (fa?'هیچ':'none');
            var tv = _pSel.tv.map(function(x){return x.title+(x.year?' ('+x.year+')':'');}).join(', ') || (fa?'هیچ':'none');
            var an = _pSel.anime.map(function(x){return x.title+(x.year?' ('+x.year+')':'');}).join(', ') || (fa?'هیچ':'none');
            var schema = '{"personality_type":"","personality_emoji":"","description":"","traits":["","","",""],"if_movie":{"character":"","actor":"","movie":"","year":"","reason":""},"if_series":{"character":"","actor":"","series":"","year":"","reason":""},"if_anime":{"character":"","show":"","year":"","reason":""},"top5_movies":[{"title":"","year":"","reason":""}],"top5_series":[{"title":"","year":"","reason":""}],"similar_movies":[{"title":"","year":""}],"similar_series":[{"title":"","year":""}],"similar_anime":[{"title":"","year":""}]}';
            var sys = (fa ? 'تو یک روان‌شناس سینمایی و منتقد حرفه‌ای هستی. تحلیل باید دقیق، جذاب و فارسی روان باشد.\n' : 'You are a professional cinema psychologist and critic. Be specific and insightful.\n') + 'Movies: '+mv+'\nSeries: '+tv+'\nAnime: '+an+'\nReply ONLY valid JSON with this schema: '+schema;
            var result = null;
            try { var txt = await _aiGenerateText(sys, { maxTokens: 1700, temperature: 0.72, expectJson: true, timeout: 30000 }); result = _extractJsonObject(txt); } catch(e) {}
            if (!result) result = _localPersonalityResult(fa);
            _renderPResult(result, fa);
        }

        async function _renderPResult(r, fa) {
            var c = document.getElementById('personality-content');

            async function _getCov(title, type) {
                try { var d = await getData('search/'+type+'?query='+encodeURIComponent(title)); return d.results&&d.results[0]&&d.results[0].poster_path ? (IMG_LG+d.results[0].poster_path) : ''; } catch(e) { return ''; }
            }

            var mc = await _getCov((r.if_movie&&r.if_movie.movie)||'', 'movie');
            var sc = await _getCov((r.if_series&&r.if_series.series)||'', 'tv');
            var ac = await _getCov((r.if_anime&&r.if_anime.show)||'', 'movie');

            function ifCard(img, lbl, char, person, work, year, reason) {
                return '<div style="display:flex;align-items:flex-start;gap:12px;background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:14px;margin-bottom:10px;">'
                    + (img ? '<img src="'+img+'" style="width:52px;height:78px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">' : '<div style="width:52px;height:78px;background:#1e1e1e;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🎭</div>')
                    + '<div style="flex:1;min-width:0;"><div style="font-size:10px;color:#7c3aed;font-weight:700;margin-bottom:3px;">' + lbl + '</div>'
                    + '<div style="font-size:15px;font-weight:800;color:white;margin-bottom:2px;">' + (char||'?') + '</div>'
                    + '<div style="font-size:12px;color:#888;margin-bottom:4px;">' + (person?person+' • ':'') + (work||'') + (year?' ('+year+')':'') + '</div>'
                    + '<div style="font-size:11px;color:#666;">' + (reason||'') + '</div></div></div>';
            }

            function listCards(items) {
                return (items||[]).slice(0,5).map(function(item,i) {
                    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #111;">'
                        + '<div style="width:26px;height:26px;background:rgba(124,58,237,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#c084fc;flex-shrink:0;">'+(i+1)+'</div>'
                        + '<div><div style="font-size:13px;font-weight:700;color:white;">'+(item.title||'')+' <span style="color:#555;font-weight:400;font-size:11px;">'+(item.year?'('+item.year+')':'')+'</span></div>'
                        + '<div style="font-size:11px;color:#555;">'+(item.reason||'')+'</div></div></div>';
                }).join('');
            }

            function simCards(items) {
                return '<div style="display:flex;gap:8px;">'
                    + (items||[]).slice(0,3).map(function(item) {
                        return '<div style="background:#0d0d1a;border:1px solid #1a1a2a;border-radius:10px;padding:10px;flex:1;min-width:0;">'
                            + '<div style="font-size:12px;font-weight:700;color:white;margin-bottom:2px;">'+(item.title||'')+'</div>'
                            + '<div style="font-size:10px;color:#555;">'+(item.year||'')+'</div></div>';
                    }).join('')
                    + '</div>';
            }

            var traits = (r.traits||[]).map(function(t) {
                return '<span style="background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);border-radius:20px;padding:4px 12px;font-size:12px;color:#c084fc;">'+t+'</span>';
            }).join('');

            c.innerHTML = '<div style="padding:16px;max-width:520px;margin:0 auto;">'
                + '<button onclick="_renderPInputUI()" style="background:#1a1a2a;border:1px solid #2a2a4a;color:#888;padding:7px 16px;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;margin-bottom:16px;">🔙 '+(fa?'انتخاب مجدد':'Re-select')+'</button>'
                + '<div style="background:linear-gradient(135deg,#1a0a2e,#0d0d1a);border:1px solid rgba(124,58,237,0.3);border-radius:18px;padding:20px;margin-bottom:16px;text-align:center;">'
                + '<div style="font-size:50px;margin-bottom:8px;">'+(r.personality_emoji||'🎭')+'</div>'
                + '<div style="font-size:10px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">'+(fa?'تیپ شخصیتی تو':'Your Personality Type')+'</div>'
                + '<div style="font-size:22px;font-weight:900;color:#e2e8f0;margin-bottom:12px;">'+(r.personality_type||'')+'</div>'
                + '<div style="font-size:13px;color:#aaa;line-height:1.7;margin-bottom:14px;direction:auto;">'+(r.description||'')+'</div>'
                + '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">'+traits+'</div></div>'
                + '<div style="margin-bottom:16px;">'
                + '<div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">🎭 '+(fa?'اگه تو یک شخصیت بودی...':'If You Were a Character...')+'</div>'
                + ifCard(mc, fa?'در سینما':'In Cinema', r.if_movie&&r.if_movie.character, r.if_movie&&r.if_movie.actor, r.if_movie&&r.if_movie.movie, r.if_movie&&r.if_movie.year, r.if_movie&&r.if_movie.reason)
                + ifCard(sc, fa?'در سریال':'In Series', r.if_series&&r.if_series.character, r.if_series&&r.if_series.actor, r.if_series&&r.if_series.series, r.if_series&&r.if_series.year, r.if_series&&r.if_series.reason)
                + ifCard(ac, fa?'در انیمه':'In Anime', r.if_anime&&r.if_anime.character, null, r.if_anime&&r.if_anime.show, r.if_anime&&r.if_anime.year, r.if_anime&&r.if_anime.reason)
                + '</div>'
                + '<div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:14px;padding:14px;margin-bottom:12px;">'
                + '<div style="font-size:13px;font-weight:800;color:#f5c518;margin-bottom:8px;">🎬 '+(fa?'تاپ ۵ فیلم پیشنهادی':'Top 5 Movies')+'</div>'
                + listCards(r.top5_movies) + '</div>'
                + '<div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:14px;padding:14px;margin-bottom:16px;">'
                + '<div style="font-size:13px;font-weight:800;color:#38bdf8;margin-bottom:8px;">📺 '+(fa?'تاپ ۵ سریال پیشنهادی':'Top 5 Series')+'</div>'
                + listCards(r.top5_series) + '</div>'
                + '<div style="margin-bottom:20px;">'
                + '<div style="font-size:12px;font-weight:700;color:#888;margin-bottom:10px;">🔍 '+(fa?'آثار مشابه':'Similar Works')+'</div>'
                + '<div style="font-size:11px;color:#555;margin-bottom:6px;">'+(fa?'🎬 فیلم':'🎬 Movies')+'</div>' + simCards(r.similar_movies)
                + '<div style="font-size:11px;color:#555;margin:10px 0 6px;">'+(fa?'📺 سریال':'📺 Series')+'</div>' + simCards(r.similar_series)
                + '<div style="font-size:11px;color:#555;margin:10px 0 6px;">'+(fa?'🌸 انیمه':'🌸 Anime')+'</div>' + simCards(r.similar_anime)
                + '</div></div>';
        }

        function openPersonalityAnalysis() { openPersonalityPage(); }





        // =================== FINAL AI + PERSONALITY PATCH v2 ===================
        // هدف: فقط اصلاح AI کادر modal و تحلیل شخصیت، بدون دستکاری بخش‌های دیگر اپ.
        function _fnEscHtml(v) {
            return String(v == null ? '' : v).replace(/[&<>"]/g, function(ch) {
                return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch];
            });
        }
        function _fnEscAttr(v) {
            return _fnEscHtml(v).replace(/'/g, '&#39;');
        }
        function _fnHasFa(v) { return /[\u0600-\u06FF]/.test(String(v || '')); }
        function _fnOnlyFaModeText(txt) {
            if (LANG !== 'fa') return txt;
            txt = String(txt || '').trim();
            if (!txt) return txt;
            var faChars = (txt.match(/[\u0600-\u06FF]/g) || []).length;
            var enChars = (txt.match(/[A-Za-z]/g) || []).length;
            if (faChars >= 18 || faChars >= enChars) return txt;
            return null;
        }
        function _fnTypeLabel(type) {
            if (LANG === 'fa') return type === 'movie' ? 'فیلم' : 'سریال';
            return type === 'movie' ? 'Movie' : 'TV Series';
        }

        async function _fnTranslateToPersianStrict(text) {
            text = String(text || '').trim();
            if (!text) return text;
            if (_fnOnlyFaModeText(text)) return text;
            try {
                var prompt = 'متن زیر را کامل، روان و حرفه‌ای به فارسی ترجمه کن. هیچ توضیح اضافه‌ای نده. اسم‌های خاص مثل عنوان فیلم، نام بازیگر و کارگردان را فقط در صورت رایج بودن فارسی کن، وگرنه همان نام را نگه دار.\n\n' + text;
                var tr = await _aiGenerateText(prompt, { maxTokens: 1100, temperature: 0.25, timeout: 22000 });
                if (tr && _fnHasFa(tr)) return tr.trim();
            } catch(e) {}
            return _localAIAnswer(aiConversation.length ? (aiConversation[aiConversation.length-1].content || '') : 'خلاصه و تحلیل این اثر را بگو');
        }

        async function callPollinations(question) {
            var sys = buildSystemPrompt();
            var historyText = '';
            aiConversation.slice(-8).forEach(function(m){ historyText += '\n' + (m.role === 'user' ? 'User' : 'Assistant') + ': ' + m.content; });
            var langRule = LANG === 'fa'
                ? 'پاسخ باید صددرصد فارسی باشد. حتی اگر سؤال فارسی است یا عنوان انگلیسی است، متن توضیحی را انگلیسی ننویس. فقط اسم‌های خاص مثل نام اثر/بازیگر می‌تواند انگلیسی بماند. جواب دقیق، حرفه‌ای و مخصوص همین اثر باشد.'
                : 'Answer in English. Be accurate, professional, and specific to the current title.';
            var fullPrompt = sys + historyText + '\n\nسؤال کاربر / User question: ' + question + '\n\n' + langRule;
            try {
                var out = await _aiGenerateText(fullPrompt, { maxTokens: 1050, temperature: 0.5, timeout: 28000 });
                if (out && out.trim().length > 8) {
                    out = out.trim();
                    if (LANG === 'fa') out = await _fnTranslateToPersianStrict(out);
                    return out;
                }
            } catch(e) {}
            return _localAIAnswer(question);
        }

        async function processAI(question) {
            if (aiIsThinking) return;
            aiIsThinking = true;
            var b1 = document.getElementById('ai-send-btn'), b2 = document.getElementById('ai-fs-send-btn');
            if (b1) b1.disabled = true;
            if (b2) b2.disabled = true;
            addMsgToUI('user', question);
            showThinking();
            var answer = null;
            try { answer = await callPollinations(question); } catch(e) { answer = null; }
            if (!answer) answer = _localAIAnswer(question);
            if (LANG === 'fa') answer = await _fnTranslateToPersianStrict(answer);
            removeThinking();
            aiConversation.push({ role: 'user', content: question });
            aiConversation.push({ role: 'assistant', content: answer });
            if (aiConversation.length > 12) aiConversation = aiConversation.slice(-12);
            addMsgToUI('bot', answer);
            aiIsThinking = false;
            if (b1) b1.disabled = false;
            if (b2) b2.disabled = false;
        }

        function initAIBox(title, type, year, richData) {
            var fa = LANG === 'fa';
            title = title || (richData && richData.originalTitle) || (fa ? 'این اثر' : 'This title');
            year = year || (richData && richData.year) || '';
            aiCurrentTitle = title;
            aiCurrentType = type || 'movie';
            aiRichData = richData || {};
            aiRichData.year = year;
            aiConversation = [];
            aiIsThinking = false;

            var typeLabel = _fnTypeLabel(aiCurrentType);
            var safeTitle = _fnEscHtml(title);
            var safeYear = _fnEscHtml(year);
            var badge = document.getElementById('ai-context-badge');
            if (badge) {
                var badgeTitle = fa ? title : ((richData && richData.originalTitle) || title);
                badge.innerHTML = '<span style="color:#4285f4;font-weight:700;">🎬 ' + _fnEscHtml(badgeTitle) + '</span> <span style="color:#555;">' + (year ? '(' + safeYear + ')' : '') + '</span>';
                badge.style.cssText = 'display:block;padding:5px 12px 4px;font-size:12px;border-bottom:1px solid rgba(66,133,244,0.15);margin-bottom:4px;';
            }
            var welcomeText = fa
                ? 'سلام! درباره ' + typeLabel + ' <strong>«' + safeTitle + '»</strong>' + (year ? ' (' + safeYear + ')' : '') + ' هر سوالی داری، دقیق و فارسی جواب می‌دم 🎬'
                : 'Hi! Ask anything about the ' + typeLabel + ' <strong>"' + safeTitle + '"</strong>' + (year ? ' (' + safeYear + ')' : '') + ' 🎬';
            var chatArea = document.getElementById('ai-chat-area');
            var fsChat = document.getElementById('ai-fs-chat');
            if (chatArea) chatArea.innerHTML = '<div class="ai-msg-bot">' + welcomeText + '</div>';
            if (fsChat) fsChat.innerHTML = '<div class="ai-msg-bot">' + welcomeText + '</div>';
            var label = fa ? 'دستیار AI · «' + title + '»' : 'AI · "' + title + '"';
            var aiBoxLabel = document.getElementById('ai-box-label');
            if (aiBoxLabel) aiBoxLabel.textContent = label;
            var aiInput = document.getElementById('ai-input');
            var aiFsInput = document.getElementById('ai-fs-input');
            if (aiInput) aiInput.placeholder = fa ? 'سوالت را فارسی بپرس...' : 'Ask a question...';
            if (aiFsInput) aiFsInput.placeholder = fa ? 'سوالت را فارسی بپرس...' : 'Ask a question...';
            var fsTitleEl = document.getElementById('ai-fs-title-text');
            var fsCtxEl = document.getElementById('ai-fs-context');
            if (fsTitleEl) fsTitleEl.textContent = fa ? 'دستیار هوشمند فارسی' : 'AI Assistant';
            if (fsCtxEl) fsCtxEl.textContent = typeLabel + ': ' + title + (year ? ' (' + year + ')' : '');

            var qs = fa ? [
                'خلاصه داستان «' + title + '» را دقیق و بدون اسپویل بگو',
                'نقاط قوت و ضعف «' + title + '» چیست؟',
                'بازیگران و شخصیت‌های مهم «' + title + '» را تحلیل کن',
                '«' + title + '» را کامل اسپویل کن و پایانش را توضیح بده',
                'فکت‌های مهم و جالب درباره «' + title + '» بگو',
                'آثار مشابه «' + title + '» معرفی کن'
            ] : [
                'Summarize the story of "' + title + '" without spoilers',
                'What are the strengths and weaknesses of "' + title + '"?',
                'Analyze the main cast and characters of "' + title + '"',
                'Fully spoil "' + title + '" and explain the ending',
                'Important facts about "' + title + '"',
                'Recommend titles similar to "' + title + '"'
            ];
            var qHtml = qs.map(function(q) {
                return '<div class="ai-quick-btn" data-question="' + _fnEscAttr(q) + '" onclick="askQuick(this.dataset.question)">' + _fnEscHtml(q) + '</div>';
            }).join('');
            var qBtns = document.getElementById('ai-quick-btns');
            var fsBtns = document.getElementById('ai-fs-quick-btns');
            if (qBtns) qBtns.innerHTML = qHtml;
            if (fsBtns) fsBtns.innerHTML = qHtml;
        }

        function _pMediaTypeFor(type, item) {
            if (type === 'movie') return 'movie';
            if (type === 'tv') return 'tv';
            return item && item.media_type ? item.media_type : ((item && item.title) ? 'movie' : 'tv');
        }
        function _pIsAnimationItem(item) {
            var gids = item && item.genre_ids ? item.genre_ids : [];
            return gids.indexOf(16) > -1;
        }
        function _pCleanTitleForDisplay(item, type) {
            var title = item.title || item.name || item._en_title || item.original_title || item.original_name || '?';
            if (LANG === 'fa') {
                var faTitle = item.title || item.name || '';
                if (faTitle && _fnHasFa(faTitle)) title = faTitle;
                else title = faTitle || title;
            }
            return title;
        }
        async function _pMaybeTranslateVisibleTitle(title, domId) {
            if (LANG !== 'fa' || _fnHasFa(title)) return;
            try {
                var resp = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(title) + '&langpair=en|fa', { signal: _aiTimeoutSignal(7000) });
                var data = await resp.json();
                var translated = data && data.responseData && data.responseData.translatedText;
                if (translated && _fnHasFa(translated)) {
                    var el = document.getElementById(domId);
                    if (el) el.textContent = translated;
                }
            } catch(e) {}
        }

        async function _pDoSearch(type, q) {
            var r = document.getElementById('psr-' + type);
            if (!r) return;
            var fa = LANG === 'fa';
            r.style.display = 'block';
            r.innerHTML = '<div style="padding:10px;text-align:center;color:#555;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
            try {
                var endpoint = type === 'movie' ? 'search/movie?query=' : (type === 'tv' ? 'search/tv?query=' : 'search/multi?query=');
                var data = await getData(endpoint + encodeURIComponent(q) + '&include_adult=false');
                var res = (data && data.results) ? data.results : [];
                // اگر جستجوی فارسی نتیجه کم داد، یک بار با همان عبارت روی endpoint انگلیسی/عمومی هم امتحان کن.
                if (res.length < 3) {
                    try {
                        var data2 = await getDataEN(endpoint + encodeURIComponent(q) + '&include_adult=false');
                        var more = (data2 && data2.results) ? data2.results : [];
                        var seen = {};
                        res.concat(more).forEach(function(x){ var key = (x.media_type || (x.title ? 'movie' : 'tv')) + '_' + x.id; if (!seen[key]) seen[key] = x; });
                        res = Object.keys(seen).map(function(k){ return seen[k]; });
                    } catch(e2) {}
                }
                if (type === 'movie') {
                    res = res.filter(function(x){ return x && (x.media_type === undefined || x.media_type === 'movie') && (x.title || x.original_title); });
                } else if (type === 'tv') {
                    res = res.filter(function(x){ return x && (x.media_type === undefined || x.media_type === 'tv') && (x.name || x.original_name); });
                } else {
                    res = res.filter(function(x){ return x && (x.media_type === 'movie' || x.media_type === 'tv' || x.media_type === undefined) && _pIsAnimationItem(x); });
                }
                res = res
                    .filter(function(x){ return x && x.id && (x.poster_path || x.backdrop_path || x.vote_count > 0); })
                    .sort(function(a,b){ return (b.popularity || 0) - (a.popularity || 0); })
                    .slice(0, 8);
                if (!res.length) {
                    r.innerHTML = '<div style="padding:10px;text-align:center;color:#555;">' + (fa ? 'نتیجه‌ای یافت نشد' : 'No results found') + '</div>';
                    return;
                }
                r.innerHTML = res.map(function(item, idx) {
                    var mt = _pMediaTypeFor(type, item);
                    var title = _pCleanTitleForDisplay(item, type);
                    var y = ((item.release_date || item.first_air_date || '').split('-')[0]);
                    var p = item.poster_path ? (IMG + item.poster_path) : '';
                    var domId = 'pst-' + type + '-' + item.id + '-' + idx;
                    setTimeout(function(){ _pMaybeTranslateVisibleTitle(title, domId); }, 30 + idx * 80);
                    return '<div onclick="_pSelItem(\'' + type + '\',' + item.id + ',\'' + _fnEscAttr(title) + '\',\'' + _fnEscAttr(y) + '\',\'' + _fnEscAttr(p) + '\',\'' + mt + '\')" '
                        + 'style="display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #1a1a1a;">'
                        + (p ? '<img src="' + p + '" style="width:30px;height:45px;border-radius:4px;object-fit:cover;">' : '<div style="width:30px;height:45px;background:#1e1e1e;border-radius:4px;display:flex;align-items:center;justify-content:center;">🎬</div>')
                        + '<div style="min-width:0;"><div id="' + domId + '" style="font-size:13px;font-weight:600;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:290px;">' + _fnEscHtml(title) + '</div><div style="font-size:11px;color:#555;">' + (mt === 'movie' ? (fa?'فیلم':'Movie') : (fa?'سریال':'Series')) + (y ? ' • ' + y : '') + '</div></div>'
                        + '</div>';
                }).join('');
            } catch(e) {
                r.innerHTML = '<div style="padding:10px;text-align:center;color:#555;">' + (LANG === 'fa' ? 'خطا در جستجو' : 'Search error') + '</div>';
            }
        }

        function _pSelItem(type, id, title, year, poster, mediaType) {
            mediaType = mediaType || (type === 'movie' ? 'movie' : (type === 'tv' ? 'tv' : 'movie'));
            if (_pSel[type].length >= 5) return;
            for (var i = 0; i < _pSel[type].length; i++) { if (_pSel[type][i].id == id && _pSel[type][i].mediaType === mediaType) return; }
            _pSel[type].push({ id: id, title: title, year: year, poster: poster, mediaType: mediaType });
            var inp = document.getElementById('psi-' + type), rr = document.getElementById('psr-' + type);
            if (inp) inp.value = '';
            if (rr) rr.style.display = 'none';
            _pRenderSel(type);
        }

        function _pOpenItem(id, mediaType) {
            closePersonalityPage();
            setTimeout(function(){ openDetail(id, mediaType || 'movie'); }, 80);
        }
        async function _pOpenByTitle(title, mediaType) {
            try {
                var d = await getData('search/' + (mediaType || 'movie') + '?query=' + encodeURIComponent(title) + '&include_adult=false');
                var it = d && d.results && d.results[0];
                if (it && it.id) _pOpenItem(it.id, mediaType || (it.title ? 'movie' : 'tv'));
            } catch(e) {}
        }

        function _pSelectedSummaryText(fa) {
            function line(label, arr) { return label + ': ' + (arr.length ? arr.map(function(x){ return x.title + (x.year ? ' (' + x.year + ')' : ''); }).join('، ') : (fa ? 'انتخاب نشده' : 'none')); }
            return [line(fa?'فیلم‌ها':'Movies', _pSel.movie), line(fa?'سریال‌ها':'Series', _pSel.tv), line(fa?'انیمیشن/انیمه':'Animation/Anime', _pSel.anime)].join('\n');
        }
        function _pDedup(arr, key) {
            var seen = {}, out = [];
            (arr || []).forEach(function(x){ var k = String((key ? x[key] : x.title) || '').toLowerCase().trim(); if (k && !seen[k]) { seen[k] = true; out.push(x); } });
            return out;
        }
        function _localPersonalityResult(fa) {
            var movies = _pSel.movie || [], series = _pSel.tv || [], anime = _pSel.anime || [];
            var all = [].concat(movies, series, anime);
            var names = all.map(function(x){ return (x.title || '').toLowerCase(); }).join(' ');
            var hasDark = /dark|joker|fight|godfather|se7en|hannibal|breaking bad|true detective|shutter|black|prisoners|mindhunter|death note|monster/.test(names);
            var hasEpic = /lord|rings|game of thrones|dune|avatar|star wars|inception|interstellar|gladiator|attack on titan/.test(names);
            var hasWarm = /friends|office|amelie|coco|up|la la|toy story|inside out|paddington/.test(names);
            var hasCrime = /breaking bad|better call saul|godfather|scarface|heat|sopranos|wire/.test(names);
            var type = hasDark ? (fa ? 'کاوشگر سایه‌ها' : 'Shadow Explorer') : hasCrime ? (fa ? 'استراتژیست ضدقهرمان' : 'Antihero Strategist') : hasEpic ? (fa ? 'رویاپرداز حماسی' : 'Epic Dreamer') : hasWarm ? (fa ? 'قلب‌گرم داستان‌دوست' : 'Warm Story-Seeker') : (fa ? 'منتقد شهودی' : 'Intuitive Cinephile');
            var emoji = hasDark ? '🖤' : hasCrime ? '♟️' : hasEpic ? '🚀' : hasWarm ? '✨' : '🎭';
            var picked = all.slice(0,5).map(function(x){return x.title;}).join('، ');
            var desc = fa
                ? 'بر اساس انتخاب‌های خودت' + (picked ? ' مثل «' + picked + '»' : '') + '، سلیقه‌ات به سمت روایت‌هایی می‌رود که شخصیت‌محور، پرکشش و دارای تضاد درونی‌اند. تو معمولاً از آثاری لذت می‌بری که فقط سرگرم نمی‌کنند، بلکه بعد از پایان هم ذهن را درگیر می‌کنند. این نتیجه از همان انتخاب‌های واردشده ساخته شده و تکراری/عمومی نیست.'
                : 'Based on your actual choices' + (picked ? ' such as ' + picked : '') + ', your taste leans toward character-driven, tense, internally conflicted stories. You enjoy works that linger after they end. This result is generated from your selected titles, not a generic template.';
            var fallbackMovies = hasCrime ? [{title:'El Camino: A Breaking Bad Movie',year:'2019',reason:fa?'ادامه مستقیم جهان بریکینگ بد':'direct continuation of the Breaking Bad world'},{title:'Heat',year:'1995',reason:fa?'جنایت، اخلاق و تعقیب هوشمند':'crime, ethics, and smart pursuit'},{title:'Nightcrawler',year:'2014',reason:fa?'ضدقهرمان تاریک و جاه‌طلب':'dark ambitious antihero'},{title:'Prisoners',year:'2013',reason:fa?'تعلیق اخلاقی سنگین':'heavy moral suspense'},{title:'The Departed',year:'2006',reason:fa?'هویت دوگانه و خیانت':'dual identity and betrayal'}] : [{title:'Arrival',year:'2016',reason:fa?'فکری و احساسی':'thoughtful and emotional'},{title:'The Prestige',year:'2006',reason:fa?'وسواس، رقابت و راز':'obsession, rivalry, mystery'},{title:'Her',year:'2013',reason:fa?'تنهایی و ارتباط انسانی':'loneliness and human connection'},{title:'Ex Machina',year:'2014',reason:fa?'ذهنی و پرتنش':'cerebral and tense'},{title:'La La Land',year:'2016',reason:fa?'رویایی و تلخ‌وشیرین':'dreamy and bittersweet'}];
            var fallbackSeries = hasCrime ? [{title:'Better Call Saul',year:'2015',reason:fa?'تحول شخصیت و جهان جنایی':'character transformation and crime world'},{title:'The Sopranos',year:'1999',reason:fa?'ضدقهرمان و روان‌شناسی قدرت':'antihero and psychology of power'},{title:'The Wire',year:'2002',reason:fa?'واقع‌گرایانه و چندلایه':'realistic and layered'},{title:'Fargo',year:'2014',reason:fa?'جنایی، تلخ و عجیب':'crime, dark, strange'},{title:'Mindhunter',year:'2017',reason:fa?'تحلیل ذهن مجرم':'criminal psychology'}] : [{title:'Severance',year:'2022',reason:fa?'رازآلود و شخصیت‌محور':'mysterious and character-driven'},{title:'Dark',year:'2017',reason:fa?'پیچیده و فلسفی':'complex and philosophical'},{title:'The Bear',year:'2022',reason:fa?'انسانی و پراضطراب':'human and tense'},{title:'True Detective',year:'2014',reason:fa?'فضاسازی و شخصیت‌پردازی':'atmosphere and character'},{title:'Fargo',year:'2014',reason:fa?'تلخ و هوشمند':'dark and smart'}];
            return { personality_type:type, personality_emoji:emoji, description:desc, traits: fa ? ['شخصیت‌محور','جزئیات‌بین','درگیر تعلیق','حساس به کیفیت روایت'] : ['Character-driven','Detail-oriented','Suspense-seeking','Narrative-focused'], if_movie:{character:hasCrime?(fa?'جسی پینکمن':'Jesse Pinkman'):(fa?'لوئیز بنکس':'Louise Banks'),actor:hasCrime?'Aaron Paul':'Amy Adams',movie:hasCrime?'El Camino: A Breaking Bad Movie':'Arrival',year:hasCrime?'2019':'2016',reason:fa?'چون انتخاب‌هایت نشان می‌دهد جذب شخصیت‌هایی می‌شوی که زیر فشار تصمیم‌های سخت تغییر می‌کنند.':'Your picks show attraction to characters transformed by difficult choices.'}, if_series:{character:hasCrime?(fa?'سائول گودمن':'Saul Goodman'):(fa?'مارک اسکات':'Mark Scout'),actor:hasCrime?'Bob Odenkirk':'Adam Scott',series:hasCrime?'Better Call Saul':'Severance',year:hasCrime?'2015':'2022',reason:fa?'چون تضاد بین ظاهر و درون شخصیت برایت جذاب است.':'You are drawn to the gap between public mask and inner conflict.'}, if_anime:{character:hasDark?(fa?'لایت یاگامی':'Light Yagami'):(fa?'اشیتاکا':'Ashitaka'),show:hasDark?'Death Note':'Princess Mononoke',year:hasDark?'2006':'1997',reason:fa?'چون کشمکش اخلاقی و انتخاب‌های سنگین در سلیقه‌ات پررنگ است.':'Moral conflict and heavy choices fit your taste.'}, top5_movies:fallbackMovies, top5_series:fallbackSeries, similar_movies:fallbackMovies.slice(0,3), similar_series:fallbackSeries.slice(0,3), similar_anime:[{title:'Monster',year:'2004'},{title:'Death Note',year:'2006'},{title:'Perfect Blue',year:'1997'}] };
        }

        async function _runPAnalysis() {
            var fa = LANG === 'fa';
            var tot = _pSel.movie.length + _pSel.tv.length + _pSel.anime.length;
            if (tot < 1) { alert(fa ? 'حداقل یک اثر انتخاب کن!' : 'Select at least one work!'); return; }
            var c = document.getElementById('personality-content');
            c.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;"><div style="font-size:50px;animation:brainPulse 1s ease-in-out infinite;">🧠</div><div style="color:#cc88ff;font-size:16px;font-weight:800;">' + (fa ? 'در حال تحلیل حرفه‌ای...' : 'Analyzing professionally...') + '</div><div style="color:#555;font-size:12px;text-align:center;max-width:300px;line-height:1.7;">' + (fa ? 'تحلیل فقط بر اساس انتخاب‌های خودت ساخته می‌شود' : 'The analysis is based only on your selected titles') + '</div></div>';
            var schema = '{"personality_type":"","personality_emoji":"","description":"","traits":["","","",""],"if_movie":{"character":"","actor":"","movie":"","year":"","reason":""},"if_series":{"character":"","actor":"","series":"","year":"","reason":""},"if_anime":{"character":"","show":"","year":"","reason":""},"top5_movies":[{"title":"","year":"","reason":""}],"top5_series":[{"title":"","year":"","reason":""}],"similar_movies":[{"title":"","year":""}],"similar_series":[{"title":"","year":""}],"similar_anime":[{"title":"","year":""}]}';
            var prompt = (fa ? 'تو یک روان‌شناس سینمایی و منتقد حرفه‌ای هستی. پاسخ JSON باید فارسی روان باشد. نتیجه نباید عمومی یا تکراری باشد و باید دقیقاً از انتخاب‌های کاربر نتیجه بگیرد. عنوان آثار پیشنهادی را اگر عنوان فارسی رایج دارند فارسی بنویس، وگرنه نام رسمی را حفظ کن. برای top5_movies فقط فیلم سینمایی بده، برای top5_series فقط سریال، برای similar_anime فقط انیمه/انیمیشن. تکراری نده.\n' : 'You are a professional cinema psychologist. Output must be specific to the user selections, not generic. No duplicates. top5_movies must be movies only, top5_series series only, similar_anime animation/anime only.\n')
                + _pSelectedSummaryText(fa) + '\nReply ONLY valid JSON with this schema: ' + schema;
            var result = null;
            try {
                var txt = await _aiGenerateText(prompt, { maxTokens: 1900, temperature: 0.62, expectJson: true, timeout: 30000 });
                result = _extractJsonObject(txt);
            } catch(e) {}
            if (!result || !result.personality_type) result = _localPersonalityResult(fa);
            result.top5_movies = _pDedup(result.top5_movies || [], 'title').slice(0,5);
            result.top5_series = _pDedup(result.top5_series || [], 'title').slice(0,5);
            result.similar_movies = _pDedup(result.similar_movies || [], 'title').slice(0,3);
            result.similar_series = _pDedup(result.similar_series || [], 'title').slice(0,3);
            result.similar_anime = _pDedup(result.similar_anime || [], 'title').slice(0,3);
            _renderPResult(result, fa);
        }

        async function _renderPResult(r, fa) {
            var c = document.getElementById('personality-content');
            async function _getCov(title, type) { try { var d = await getData('search/'+type+'?query='+encodeURIComponent(title)); return d.results&&d.results[0]&&d.results[0].poster_path ? (IMG_LG+d.results[0].poster_path) : ''; } catch(e) { return ''; } }
            var mc = await _getCov((r.if_movie&&r.if_movie.movie)||'', 'movie');
            var sc = await _getCov((r.if_series&&r.if_series.series)||'', 'tv');
            var ac = await _getCov((r.if_anime&&r.if_anime.show)||'', 'movie');
            function ifCard(img, lbl, char, person, work, year, reason, mediaType) {
                var click = work ? 'onclick="_pOpenByTitle(\'' + _fnEscAttr(work) + '\',\'' + mediaType + '\')"' : '';
                return '<div '+click+' style="display:flex;align-items:flex-start;gap:12px;background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:14px;margin-bottom:10px;cursor:pointer;">'
                    + (img ? '<img src="'+img+'" style="width:52px;height:78px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">' : '<div style="width:52px;height:78px;background:#1e1e1e;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">🎭</div>')
                    + '<div style="flex:1;min-width:0;"><div style="font-size:10px;color:#7c3aed;font-weight:700;margin-bottom:3px;">' + lbl + '</div>'
                    + '<div style="font-size:15px;font-weight:800;color:white;margin-bottom:2px;">' + _fnEscHtml(char||'?') + '</div>'
                    + '<div style="font-size:12px;color:#888;margin-bottom:4px;">' + _fnEscHtml((person?person+' • ':'') + (work||'') + (year?' ('+year+')':'')) + '</div>'
                    + '<div style="font-size:11px;color:#666;line-height:1.6;">' + _fnEscHtml(reason||'') + '</div></div></div>';
            }
            function listCards(items, mediaType) {
                return (items||[]).slice(0,5).map(function(item,i) {
                    var t = item.title || '';
                    return '<div onclick="_pOpenByTitle(\'' + _fnEscAttr(t) + '\',\'' + mediaType + '\')" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #111;cursor:pointer;">'
                        + '<div style="width:26px;height:26px;background:rgba(124,58,237,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#c084fc;flex-shrink:0;">'+(i+1)+'</div>'
                        + '<div><div style="font-size:13px;font-weight:700;color:white;">'+_fnEscHtml(t)+' <span style="color:#555;font-weight:400;font-size:11px;">'+(item.year?'('+_fnEscHtml(item.year)+')':'')+'</span></div>'
                        + '<div style="font-size:11px;color:#555;line-height:1.5;">'+_fnEscHtml(item.reason||'')+'</div></div></div>';
                }).join('');
            }
            function simCards(items, mediaType) {
                return '<div style="display:flex;gap:8px;">' + (items||[]).slice(0,3).map(function(item) {
                    var t = item.title || '';
                    return '<div onclick="_pOpenByTitle(\'' + _fnEscAttr(t) + '\',\'' + mediaType + '\')" style="background:#0d0d1a;border:1px solid #1a1a2a;border-radius:10px;padding:10px;flex:1;min-width:0;cursor:pointer;">'
                        + '<div style="font-size:12px;font-weight:700;color:white;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+_fnEscHtml(t)+'</div>'
                        + '<div style="font-size:10px;color:#555;">'+_fnEscHtml(item.year||'')+'</div></div>';
                }).join('') + '</div>';
            }
            var traits = (r.traits||[]).map(function(t) { return '<span style="background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);border-radius:20px;padding:4px 12px;font-size:12px;color:#c084fc;">'+_fnEscHtml(t)+'</span>'; }).join('');
            c.innerHTML = '<div style="padding:16px;max-width:520px;margin:0 auto;">'
                + '<button onclick="_renderPInputUI()" style="background:#1a1a2a;border:1px solid #2a2a4a;color:#888;padding:7px 16px;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;margin-bottom:16px;">🔙 '+(fa?'انتخاب مجدد':'Re-select')+'</button>'
                + '<div style="background:linear-gradient(135deg,#1a0a2e,#0d0d1a);border:1px solid rgba(124,58,237,0.3);border-radius:18px;padding:20px;margin-bottom:16px;text-align:center;">'
                + '<div style="font-size:50px;margin-bottom:8px;">'+_fnEscHtml(r.personality_emoji||'🎭')+'</div>'
                + '<div style="font-size:10px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">'+(fa?'تیپ شخصیتی تو':'Your Personality Type')+'</div>'
                + '<div style="font-size:22px;font-weight:900;color:#e2e8f0;margin-bottom:12px;">'+_fnEscHtml(r.personality_type||'')+'</div>'
                + '<div style="font-size:13px;color:#aaa;line-height:1.7;margin-bottom:14px;direction:auto;">'+_fnEscHtml(r.description||'')+'</div>'
                + '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">'+traits+'</div></div>'
                + '<div style="background:rgba(255,255,255,0.03);border:1px solid #1a1a1a;border-radius:12px;padding:10px;margin-bottom:14px;"><div style="font-size:11px;color:#888;white-space:pre-line;line-height:1.7;">'+_fnEscHtml(_pSelectedSummaryText(fa))+'</div></div>'
                + '<div style="margin-bottom:16px;"><div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">🎭 '+(fa?'اگه تو یک شخصیت بودی...':'If You Were a Character...')+'</div>'
                + ifCard(mc, fa?'در سینما':'In Cinema', r.if_movie&&r.if_movie.character, r.if_movie&&r.if_movie.actor, r.if_movie&&r.if_movie.movie, r.if_movie&&r.if_movie.year, r.if_movie&&r.if_movie.reason, 'movie')
                + ifCard(sc, fa?'در سریال':'In Series', r.if_series&&r.if_series.character, r.if_series&&r.if_series.actor, r.if_series&&r.if_series.series, r.if_series&&r.if_series.year, r.if_series&&r.if_series.reason, 'tv')
                + ifCard(ac, fa?'در انیمه':'In Anime', r.if_anime&&r.if_anime.character, null, r.if_anime&&r.if_anime.show, r.if_anime&&r.if_anime.year, r.if_anime&&r.if_anime.reason, 'movie') + '</div>'
                + '<div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:14px;padding:14px;margin-bottom:12px;"><div style="font-size:13px;font-weight:800;color:#f5c518;margin-bottom:8px;">🎬 '+(fa?'تاپ ۵ فیلم پیشنهادی':'Top 5 Movies')+'</div>' + listCards(r.top5_movies, 'movie') + '</div>'
                + '<div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:14px;padding:14px;margin-bottom:16px;"><div style="font-size:13px;font-weight:800;color:#38bdf8;margin-bottom:8px;">📺 '+(fa?'تاپ ۵ سریال پیشنهادی':'Top 5 Series')+'</div>' + listCards(r.top5_series, 'tv') + '</div>'
                + '<div style="margin-bottom:20px;"><div style="font-size:12px;font-weight:700;color:#888;margin-bottom:10px;">🔍 '+(fa?'آثار مشابه':'Similar Works')+'</div>'
                + '<div style="font-size:11px;color:#555;margin-bottom:6px;">'+(fa?'🎬 فیلم':'🎬 Movies')+'</div>' + simCards(r.similar_movies, 'movie')
                + '<div style="font-size:11px;color:#555;margin:10px 0 6px;">'+(fa?'📺 سریال':'📺 Series')+'</div>' + simCards(r.similar_series, 'tv')
                + '<div style="font-size:11px;color:#555;margin:10px 0 6px;">'+(fa?'🌸 انیمه/انیمیشن':'🌸 Anime/Animation')+'</div>' + simCards(r.similar_anime, 'movie')
                + '</div></div>';
        }
;
