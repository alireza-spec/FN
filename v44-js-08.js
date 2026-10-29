let companiesAllPage = 1;
        const COMPANIES_PER_LOAD = 10;
        
        function openCompaniesAll() {
            const page = document.getElementById('companies-all-page');
            page.style.display = 'flex';
            // Update title bilingual
            const titleSpan = page.querySelector('.gg-header span');
            if (titleSpan) titleSpan.innerHTML = '<i class="fa-solid fa-building gg-title-icon"></i>' + (LANG === 'fa' ? 'استودیوها و شبکه‌ها' : 'Studios & Networks');
            const grid = document.getElementById('companies-all-grid');
            grid.innerHTML = '';
            companiesAllPage = 1;
            renderCompaniesPage();
        }
        
        function closeCompaniesAll() {
            document.getElementById('companies-all-page').style.display = 'none';
        }
        
        function renderCompaniesPage() {
            const grid = document.getElementById('companies-all-grid');
            const start = (companiesAllPage - 1) * COMPANIES_PER_LOAD;
            const end = Math.min(start + COMPANIES_PER_LOAD, COMPANIES_CLEAN.length);
            for (let i = start; i < end; i++) {
                grid.innerHTML += makeCompanyAllCard(COMPANIES_CLEAN[i], i);
            }
            hydrateVisibleCompanyLogos(start, end);
            const moreBtn = document.getElementById('btn-more-companies');
            moreBtn.style.display = end >= COMPANIES_CLEAN.length ? 'none' : 'block';
        }
        
        function loadMoreCompanies() {
            companiesAllPage++;
            renderCompaniesPage();
        }
        
        // Company works page
        let cwCompanyId = null;
        let cwCompanyData = null;
        let cwPage = 1;
        let cwTotalPages = 1;
        let cwCurrentType = 'movie';
        let cwLoadingMore = false;
        
        async function openCompanyWorks(idx) {
            const company = COMPANIES_CLEAN[idx];
            if (!company) return;
            cwCompanyData = company;
            cwCompanyId = company.networkId || company.id;
            cwPage = 1;
            cwLoadingMore = false;
            cwTotalPages = 1;
            cwCurrentType = 'all';
            window._cwAllTotalPages = 1;
            
            const page = document.getElementById('company-works-page');
            page.style.display = 'flex';
            
            const displayName = LANG === 'fa' && company.nameFA ? company.nameFA : company.name;
            const typeName = getCompanyTypeName(company.type);
            const t = TEXTS[LANG];
            
            // Hero header
            const logoSrc = getCompanyLogoSrc(company);
            const logoHtml = logoSrc
                ? `<img src="${logoSrc}" data-company-logo-idx="${idx}" style="width:78%;height:78%;object-fit:contain;" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"><span style="font-size:32px;display:none;align-items:center;justify-content:center;">${company.emoji}</span>`
                : `<span style="font-size:32px">${company.emoji}</span>`;
            hydrateCompanyLogo(idx);
            
            document.getElementById('cw-title').innerText = displayName;
            document.getElementById('cw-content').innerHTML = `
                <div class="company-works-hero">
                    <div class="company-works-logo">${logoHtml}</div>
                    <div class="company-works-title">${displayName}</div>
                    <div class="company-works-type">${typeName}</div>${company.description ? `<div style="font-size:12px;color:#aaa;line-height:1.6;margin:6px 15px 0;text-align:center;">${company.description}</div>` : ''}
                </div>
                <div style="display:flex;gap:8px;padding:12px 15px;border-bottom:1px solid #222;background:#0a0a0a;position:sticky;top:0;z-index:5;">
                    <button onclick="cwFilterType('all')" style="flex:1;padding:10px;background:var(--primary);color:white;border:none;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer;" id="cw-btn-all">${LANG === 'fa' ? 'همه' : 'All'}</button>
                    <button onclick="cwFilterType('movie')" style="flex:1;padding:10px;background:#222;color:#aaa;border:none;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer;" id="cw-btn-movie">${t.companyMovies || '🎬 Movies'}</button>
                    <button onclick="cwFilterType('tv')" style="flex:1;padding:10px;background:#222;color:#aaa;border:none;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer;" id="cw-btn-tv">${t.companySeries || '📺 Series'}</button>
                </div>
                <div class="grid-container" id="cw-grid" style="padding-top:10px;"></div>
            `;
            
            await loadCompanyWorksData('all');
        }
        
        async function cwFilterType(type) {
            cwCurrentType = type;
            cwPage = 1;
            cwLoadingMore = false;
            window._cwAllTotalPages = 1;
            const grid = document.getElementById('cw-grid');
            if (grid) grid.innerHTML = '';
            // Update buttons
            const btnA = document.getElementById('cw-btn-all');
            const btnM = document.getElementById('cw-btn-movie');
            const btnT = document.getElementById('cw-btn-tv');
            [[btnA,'all'],[btnM,'movie'],[btnT,'tv']].forEach(([b,k]) => { if (b) { b.style.background = type === k ? 'var(--primary)' : '#222'; b.style.color = type === k ? 'white' : '#aaa'; } });
            await loadCompanyWorksData(type);
        }
        
        async function loadCompanyWorksData(type, append = false) {
            if (!cwCompanyId || !cwCompanyData) return;
            if (type === 'all') {
                const firstPage = cwPage === 1;
                window._cwAllMode = true;
                await loadCompanyWorksData('movie', !firstPage);
                await loadCompanyWorksData('tv', true);
                window._cwAllMode = false;
                const gridAll = document.getElementById('cw-grid');
                // Keep already-rendered cards in place when loading another page; only the new batch is appended.
                // The first page is already ordered by the server/curated source order.
                document.getElementById('btn-more-cw').style.display = cwPage >= (window._cwAllTotalPages || 1) ? 'none' : 'block';
                return;
            }
            const mediaType = type || cwCurrentType;
            const company = cwCompanyData;
            const grid = document.getElementById('cw-grid');
            if (!grid) return;
            
            if (cwPage === 1 && !append) {
                grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#555;"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:var(--primary);"></i><p style="margin-top:12px;font-size:12px;">Loading...</p></div>';
            }
            
            let results = [], totalPages = 1;
            const existingIds = new Set();
            
            const mergeResults = (data) => {
                if (!data || !data.results) return;
                data.results.forEach(r => {
                    if (!existingIds.has(r.id)) {
                        existingIds.add(r.id);
                        results.push(r);
                    }
                });
                if ((data.total_pages || 1) > totalPages) totalPages = data.total_pages;
            };
            
            if (mediaType === 'movie') {
                // If company has a curated title/year list, search exact titles page-by-page for accurate studio collections.
                if (company.verifiedMovieTitles && company.verifiedMovieTitles.length > 0) {
                    const pageSize = 18;
                    const start = (cwPage - 1) * pageSize;
                    const end = Math.min(start + pageSize, company.verifiedMovieTitles.length);
                    const batch = company.verifiedMovieTitles.slice(start, end);
                    for (const item of batch) {
                        await new Promise(r => setTimeout(r, 25));
                        const qTitle = encodeURIComponent(item.title);
                        const yearPart = item.year ? `&year=${item.year}` : '';
                        const sd = await getDataEN(`search/movie?query=${qTitle}${yearPart}&include_adult=false`);
                        if (sd && sd.results && sd.results.length > 0) {
                            const best = sd.results.find(r => ((r.release_date || '').slice(0,4) == String(item.year))) || sd.results[0];
                            if (best && !existingIds.has(best.id)) { existingIds.add(best.id); results.push(best); }
                        }
                    }
                    totalPages = Math.ceil(company.verifiedMovieTitles.length / pageSize);
                } else if (company.imdbIds && company.imdbIds.length > 0) {
                    const pageSize = 18;
                    const start = (cwPage - 1) * pageSize;
                    const end = Math.min(start + pageSize, company.imdbIds.length);
                    const batch = company.imdbIds.slice(start, end);
                    for (const imdbId of batch) {
                        await new Promise(r => setTimeout(r, 30)); // rate limit
                        const fd = await getData(`find/${imdbId}?external_source=imdb_id`);
                        if (fd && fd.movie_results && fd.movie_results.length > 0) {
                            fd.movie_results.forEach(r => {
                                if (!existingIds.has(r.id)) { existingIds.add(r.id); results.push(r); }
                            });
                        }
                    }
                    totalPages = Math.ceil(company.imdbIds.length / pageSize);
                    // For combined companies, also include the additional company catalog on the first page.
                    if (cwPage === 1 && company.extraIds && company.extraIds.length > 0) {
                        for (const eid of company.extraIds) {
                            if (eid !== company.companyId && eid !== company.networkId) {
                                const dx = await getData(`discover/movie?sort_by=popularity.desc&with_companies=${eid}&page=1`);
                                mergeResults(dx);
                            }
                        }
                    }
                } else {
                // Primary query with main companyId
                const d1 = await getData(`discover/movie?sort_by=popularity.desc&with_companies=${company.companyId}&page=${cwPage}`);
                mergeResults(d1);
                // Also try networkId if different
                if (company.companyId !== company.networkId) {
                    const d2 = await getData(`discover/movie?sort_by=popularity.desc&with_companies=${company.networkId}&page=${cwPage}`);
                    mergeResults(d2);
                }
                // Try extraIds for richer results (only page 1 to avoid too many requests)
                if (cwPage === 1 && company.extraIds && company.extraIds.length > 0) {
                    for (const eid of company.extraIds) {
                        if (eid !== company.companyId && eid !== company.networkId) {
                            const dx = await getData(`discover/movie?sort_by=popularity.desc&with_companies=${eid}&page=1`);
                            mergeResults(dx);
                        }
                    }
                }
                } // end else
            } else {
                // TV Series - exact title/year list or imdbIds for TV
                if (company.verifiedTvTitles && company.verifiedTvTitles.length > 0) {
                    const pageSize = 18;
                    const start = (cwPage - 1) * pageSize;
                    const end = Math.min(start + pageSize, company.verifiedTvTitles.length);
                    const batch = company.verifiedTvTitles.slice(start, end);
                    for (const item of batch) {
                        await new Promise(r => setTimeout(r, 25));
                        const qTitle = encodeURIComponent(item.title);
                        const yearPart = item.year ? `&first_air_date_year=${item.year}` : '';
                        const sd = await getDataEN(`search/tv?query=${qTitle}${yearPart}&include_adult=false`);
                        if (sd && sd.results && sd.results.length > 0) {
                            const best = sd.results.find(r => ((r.first_air_date || '').slice(0,4) == String(item.year))) || sd.results[0];
                            if (best && !existingIds.has(best.id)) { existingIds.add(best.id); results.push(best); }
                        }
                    }
                    totalPages = Math.ceil(company.verifiedTvTitles.length / pageSize);
                } else if (company.imdbTvIds && company.imdbTvIds.length > 0) {
                    const pageSize = 18;
                    const start = (cwPage - 1) * pageSize;
                    const end = Math.min(start + pageSize, company.imdbTvIds.length);
                    const batch = company.imdbTvIds.slice(start, end);
                    for (const imdbId of batch) {
                        await new Promise(r => setTimeout(r, 30));
                        const fd = await getData(`find/${imdbId}?external_source=imdb_id`);
                        if (fd && fd.tv_results && fd.tv_results.length > 0) {
                            fd.tv_results.forEach(r => {
                                if (!existingIds.has(r.id)) { existingIds.add(r.id); results.push(r); }
                            });
                        }
                    }
                    totalPages = Math.ceil(company.imdbTvIds.length / pageSize);
                } else {
                // TV Series
                if (company.isNetwork) {
                    // Primary: with_networks
                    const d1 = await getData(`discover/tv?sort_by=popularity.desc&with_networks=${company.networkId}&page=${cwPage}`);
                    mergeResults(d1);
                    // Also with_companies
                    if (cwPage === 1 && results.length < 15) {
                        const d2 = await getData(`discover/tv?sort_by=popularity.desc&with_companies=${company.companyId}&page=1`);
                        mergeResults(d2);
                    }
                } else {
                    // Primary: with_companies
                    const d1 = await getData(`discover/tv?sort_by=popularity.desc&with_companies=${company.companyId}&page=${cwPage}`);
                    mergeResults(d1);
                    // Fallback: with_networks
                    if (results.length < 5) {
                        const d2 = await getData(`discover/tv?sort_by=popularity.desc&with_networks=${company.networkId}&page=${cwPage}`);
                        mergeResults(d2);
                    }
                    // Try extraIds
                    if (cwPage === 1 && company.extraIds && company.extraIds.length > 0) {
                        for (const eid of company.extraIds) {
                            if (eid !== company.companyId && eid !== company.networkId) {
                                const dx = await getData(`discover/tv?sort_by=popularity.desc&with_companies=${eid}&page=1`);
                                mergeResults(dx);
                            }
                        }
                    }
                }
                } // end else
            }
            
            // Happy Madison: keep the curated verified titles and also merge the complete
            // TMDB production-company catalog, so the collection is not limited to a hand list.
            if (company.includeDiscoverCatalog) {
                const catalogQ = mediaType === 'movie' ? `discover/movie?sort_by=popularity.desc&with_companies=${company.companyId}&page=${cwPage}` : `discover/tv?sort_by=popularity.desc&with_companies=${company.companyId}&page=${cwPage}`;
                mergeResults(await getData(catalogQ));
            }
            // Sort merged results by popularity
            results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            
            if (cwPage === 1 && !append) grid.innerHTML = '';
            
            // Filter: must have poster AND a valid rating (no NR items)
            // Do not re-add a title already rendered by an earlier page/source.
            const renderedKeys = new Set(Array.from(grid.querySelectorAll('[data-cw-key]')).map(el => el.dataset.cwKey));
            const filtered = results.filter(m => {
                if (!m.poster_path || !m.vote_average || m.vote_average <= 0 || !m.vote_count || m.vote_count < 10) return false;
                const key = `${mediaType}:${m.id}`;
                if (renderedKeys.has(key)) return false;
                renderedKeys.add(key);
                return true;
            });
            
            if (cwPage === 1 && filtered.length === 0) {
                grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#555;"><i class="fa-solid fa-film" style="font-size:48px;margin-bottom:15px;display:block;color:#333;"></i><p style="font-size:13px;">No titles found</p></div>`;
                document.getElementById('btn-more-cw').style.display = 'none';
                return;
            }
            
            cwTotalPages = totalPages;
            filtered.forEach(m => {
                const rank = (m.vote_average || 0) * Math.log10((m.vote_count || 0) + 10) + (m.popularity || 0) * 0.002;
                const html = makeCard(m, mediaType).replace('<div class="card"', `<div class="card" data-cw-key="${mediaType}:${m.id}" data-cw-rank="${rank}"`);
                grid.innerHTML += html;
            });
            if (window._cwAllMode) {
                window._cwAllTotalPages = Math.max(window._cwAllTotalPages || 1, cwTotalPages);
            } else {
                document.getElementById('btn-more-cw').style.display = cwPage >= cwTotalPages ? 'none' : 'block';
            }
        }
        
        async function loadMoreCompanyWorks() {
            // Ignore rapid repeated taps while the current page is still being appended.
            if (cwLoadingMore) return;
            cwLoadingMore = true;
            try {
                cwPage++;
                await loadCompanyWorksData(cwCurrentType);
            } finally {
                cwLoadingMore = false;
            }
        }
        // =================== END COMPANIES ===================
        
        
        function switchTab(tab, el) {
            document.body.classList.toggle('fn-live-mode', tab === 'live');
            var liveBottomNav=document.querySelector('.nav'); if(liveBottomNav) liveBottomNav.setAttribute('aria-hidden', tab === 'live' ? 'true' : 'false');
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(tab+'-tab').classList.add('active');
            if (el) el.classList.add('active');
            try { sessionStorage.setItem('last_active_tab', tab); } catch(e) {}
            const fab = document.getElementById('fab-pick-movie');
            if (fab) fab.classList.toggle('fab-visible', tab === 'home');
            if (tab === 'movies') {
                updateDiscovery('movie');
            } else if (tab === 'series') {
                updateDiscovery('tv');
            } else if (tab === 'settings') {
                loadArchiveStats();
                initThemeStyles();
                updateMiniStats();
            }
        }
        function toggleLang() {
            // اگر مودال جزئیات یک اثر باز است، شناسه‌اش را قبل از reload ذخیره کن
            // تا بعد از تغییر زبان، همان اثر با اطلاعات واقعی (نه placeholder) دوباره باز شود.
            try {
                var _m = document.getElementById('modal');
                if (_m && _m.style.display === 'block' && typeof curId !== 'undefined' && curId && typeof curType !== 'undefined' && curType) {
                    sessionStorage.setItem('fn_reopen_detail', JSON.stringify({ id: curId, type: curType }));
                } else {
                    sessionStorage.removeItem('fn_reopen_detail');
                }
            } catch(e) {}
            LANG = LANG==='en'?'fa':'en';
            localStorage.setItem('lang', LANG);
            location.reload(); 
        }
        function setTheme(color, el) {
            document.documentElement.style.setProperty('--primary', color);
            localStorage.setItem('primary_color', color);
            PRIMARY_COLOR = color;
            if (el) {
                document.querySelectorAll('.theme-opt').forEach(c => c.classList.remove('active'));
                el.classList.add('active');
            }
        }
        
        // =================== CREATIVE THEMES ===================
        const CREATIVE_THEMES = {
            netflix: { primary:'#E50914', bg:'#000000', surface:'#121212', card:'#1c1c1c', text:'#ffffff', sub:'#b3b3b3', gold:'#f5c518', border:'#333333', input:'#222222', button:'#222222', button2:'#3d0000', onPrimary:'#ffffff', soft:'rgba(229,9,20,0.12)', soft2:'rgba(229,9,20,0.24)', light:false },
            ocean:   { primary:'#0099ff', bg:'#000d1a', surface:'#001a33', card:'#002244', text:'#f3faff', sub:'#9bc7e9', gold:'#f5c518', border:'#0b3d68', input:'#06243f', button:'#063050', button2:'#005b99', onPrimary:'#ffffff', soft:'rgba(0,153,255,0.14)', soft2:'rgba(0,153,255,0.26)', light:false },
            forest:  { primary:'#00cc55', bg:'#001a0d', surface:'#002a15', card:'#003a1e', text:'#f0fff6', sub:'#97c8aa', gold:'#f5c518', border:'#07552b', input:'#062e19', button:'#07381f', button2:'#008c3a', onPrimary:'#001a0d', soft:'rgba(0,204,85,0.14)', soft2:'rgba(0,204,85,0.26)', light:false },
            violet:  { primary:'#aa44ff', bg:'#0d001a', surface:'#1a0033', card:'#220044', text:'#fbf4ff', sub:'#c5a8dd', gold:'#f5c518', border:'#3e1760', input:'#1b0a2d', button:'#28113c', button2:'#6b21a8', onPrimary:'#ffffff', soft:'rgba(170,68,255,0.14)', soft2:'rgba(170,68,255,0.26)', light:false },
            gold:    { primary:'#ffcc00', bg:'#1a1000', surface:'#2a1a00', card:'#3d2500', text:'#fff8df', sub:'#d4b66e', gold:'#ffcc00', border:'#61420b', input:'#2f2108', button:'#3b2909', button2:'#9a6a00', onPrimary:'#1a1000', soft:'rgba(255,204,0,0.14)', soft2:'rgba(255,204,0,0.26)', light:false },
            rose:    { primary:'#ff4499', bg:'#1a0010', surface:'#2a0018', card:'#3d0025', text:'#fff2f8', sub:'#dfa4c2', gold:'#f5c518', border:'#64123d', input:'#2e0a1e', button:'#3a0c26', button2:'#a8145d', onPrimary:'#ffffff', soft:'rgba(255,68,153,0.14)', soft2:'rgba(255,68,153,0.26)', light:false },
            cyber:   { primary:'#00ffcc', bg:'#001a1a', surface:'#002626', card:'#003333', text:'#edfffb', sub:'#91d5cb', gold:'#f5c518', border:'#075f58', input:'#062f31', button:'#083a3d', button2:'#008f9c', onPrimary:'#001a1a', soft:'rgba(0,255,204,0.14)', soft2:'rgba(0,255,204,0.26)', light:false },
            ember:   { primary:'#ff6600', bg:'#1a0800', surface:'#2a0e00', card:'#3d1500', text:'#fff4ed', sub:'#d8a287', gold:'#f5c518', border:'#61270b', input:'#2f1608', button:'#3b1b08', button2:'#a33d00', onPrimary:'#ffffff', soft:'rgba(255,102,0,0.14)', soft2:'rgba(255,102,0,0.26)', light:false },
            dayMood: { primary:'#111827', bg:'#f7f8fa', surface:'#ffffff', card:'#edf0f4', text:'#111827', sub:'#5f6875', gold:'#b58900', border:'#d4dae3', input:'#ffffff', button:'#e5e9ef', button2:'#cfd6df', onPrimary:'#ffffff', soft:'rgba(17,24,39,0.08)', soft2:'rgba(17,24,39,0.16)', light:true },
            day: { primary:'#111827', bg:'#f7f8fa', surface:'#ffffff', card:'#edf0f4', text:'#111827', sub:'#5f6875', gold:'#b58900', border:'#d4dae3', input:'#ffffff', button:'#e5e9ef', button2:'#cfd6df', onPrimary:'#ffffff', soft:'rgba(17,24,39,0.08)', soft2:'rgba(17,24,39,0.16)', light:true },
            telegramDay: { primary:'#229ED9', bg:'#f5fbff', surface:'#ffffff', card:'#e7f4fd', text:'#123044', sub:'#55778c', gold:'#b88700', border:'#b8dff5', input:'#ffffff', button:'#d9efff', button2:'#87d5ff', onPrimary:'#ffffff', soft:'rgba(34,158,217,0.10)', soft2:'rgba(34,158,217,0.22)', light:true },
            softDarkGray: { primary:'#9ca3af', bg:'#15171a', surface:'#202328', card:'#2a2e34', text:'#f5f7fa', sub:'#b5bdc8', gold:'#d9b860', border:'#3b414a', input:'#242932', button:'#2c323a', button2:'#4b5563', onPrimary:'#111827', soft:'rgba(156,163,175,0.14)', soft2:'rgba(156,163,175,0.25)', light:false },
            grayBlue: { primary:'#3b82f6', bg:'#1c2430', surface:'#263241', card:'#304052', text:'#f3f8ff', sub:'#aab9cc', gold:'#d9b860', border:'#3d526a', input:'#273546', button:'#304156', button2:'#1e5bb8', onPrimary:'#ffffff', soft:'rgba(59,130,246,0.14)', soft2:'rgba(59,130,246,0.28)', light:false }
        };
        
        let activeTheme = localStorage.getItem('active_theme') || 'softDarkGray';
        
        function applyCreativeTheme(name) {
            if (name === 'day') name = 'dayMood';
            const theme = CREATIVE_THEMES[name] || CREATIVE_THEMES.softDarkGray;
            if (!theme) return;
            activeTheme = CREATIVE_THEMES[name] ? name : 'softDarkGray';
            localStorage.setItem('active_theme', activeTheme);

            const root = document.documentElement;
            root.style.setProperty('--primary', theme.primary);
            root.style.setProperty('--bg', theme.bg);
            root.style.setProperty('--surface', theme.surface);
            root.style.setProperty('--card', theme.card);
            root.style.setProperty('--text', theme.text);
            root.style.setProperty('--sub', theme.sub);
            root.style.setProperty('--gold', theme.gold || '#f5c518');
            root.style.setProperty('--border', theme.border || '#333333');
            root.style.setProperty('--input-bg', theme.input || theme.card);
            root.style.setProperty('--button-bg', theme.button || theme.card);
            root.style.setProperty('--button-2', theme.button2 || theme.primary);
            root.style.setProperty('--on-primary', theme.onPrimary || '#ffffff');
            root.style.setProperty('--primary-soft', theme.soft || 'rgba(229,9,20,0.12)');
            root.style.setProperty('--primary-soft-2', theme.soft2 || 'rgba(229,9,20,0.24)');

            if (document.body) {
                document.body.setAttribute('data-theme', activeTheme);
                document.body.setAttribute('data-theme-light', theme.light ? 'true' : 'false');
            }
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            if (metaTheme) metaTheme.setAttribute('content', theme.bg);

            localStorage.setItem('primary_color', theme.primary);
            localStorage.setItem('theme_bg', theme.bg);
            localStorage.setItem('theme_surface', theme.surface);
            localStorage.setItem('theme_card', theme.card);
            localStorage.setItem('theme_text', theme.text);
            localStorage.setItem('theme_sub', theme.sub);
            localStorage.setItem('theme_border', theme.border || '#333333');
            localStorage.setItem('theme_input', theme.input || theme.card);
            localStorage.setItem('theme_button', theme.button || theme.card);
            localStorage.setItem('theme_button2', theme.button2 || theme.primary);
            localStorage.setItem('theme_on_primary', theme.onPrimary || '#ffffff');
            localStorage.setItem('theme_soft', theme.soft || 'rgba(229,9,20,0.12)');
            localStorage.setItem('theme_soft2', theme.soft2 || 'rgba(229,9,20,0.24)');
            localStorage.setItem('theme_light', theme.light ? 'true' : 'false');
            PRIMARY_COLOR = theme.primary;
            
            document.querySelectorAll('.creative-theme-card').forEach(c => {
                c.style.opacity = '0.65';
                c.style.transform = 'scale(0.97)';
                c.style.boxShadow = 'none';
            });
            const active = document.getElementById('theme-card-' + activeTheme);
            if (active) {
                active.style.opacity = '1';
                active.style.transform = 'scale(1.03)';
                active.style.boxShadow = '0 0 0 3px var(--primary-soft), 0 10px 24px rgba(0,0,0,.25)';
            }
            updateActiveThemeMarkers();
        }
        function updateActiveThemeMarkers() {
            document.querySelectorAll('.theme-active-ring').forEach(el => el.classList.remove('theme-active-ring'));
            const settingsCard = document.getElementById('theme-card-' + activeTheme);
            if (settingsCard) settingsCard.classList.add('theme-active-ring');
            const sidebarCard = document.getElementById('sb-theme-card-' + activeTheme);
            if (sidebarCard) sidebarCard.classList.add('theme-active-ring');
        }
        
        function initThemeStyles() {
            const name = localStorage.getItem('active_theme') || activeTheme || 'softDarkGray';
            if (CREATIVE_THEMES[name]) {
                applyCreativeTheme(name);
                return;
            }
            const root = document.documentElement;
            const savedBg = localStorage.getItem('theme_bg');
            const savedSurface = localStorage.getItem('theme_surface');
            const savedCard = localStorage.getItem('theme_card');
            const savedText = localStorage.getItem('theme_text');
            const savedSub = localStorage.getItem('theme_sub');
            const savedBorder = localStorage.getItem('theme_border');
            const savedInput = localStorage.getItem('theme_input');
            const savedButton = localStorage.getItem('theme_button');
            const savedButton2 = localStorage.getItem('theme_button2');
            if (savedBg) root.style.setProperty('--bg', savedBg);
            if (savedSurface) root.style.setProperty('--surface', savedSurface);
            if (savedCard) root.style.setProperty('--card', savedCard);
            if (savedText) root.style.setProperty('--text', savedText);
            if (savedSub) root.style.setProperty('--sub', savedSub);
            if (savedBorder) root.style.setProperty('--border', savedBorder);
            if (savedInput) root.style.setProperty('--input-bg', savedInput);
            if (savedButton) root.style.setProperty('--button-bg', savedButton);
            if (savedButton2) root.style.setProperty('--button-2', savedButton2);
            if (document.body) {
                document.body.setAttribute('data-theme', name);
                document.body.setAttribute('data-theme-light', localStorage.getItem('theme_light') === 'true' ? 'true' : 'false');
            }
        }
        
        // =================== ARCHIVE STATS ===================
        async function loadArchiveStats() {
            const container = document.getElementById('stats-content');
            if (!container) return;
            
            try {
                // Count from DOWNLOADS_DB
                const dlEntries = DOWNLOADS_DB ? Object.keys(DOWNLOADS_DB) : [];
                const totalDownloadable = dlEntries.length;
                
                // Fetch counts from TMDB via discover
                const [movies, tvSeries, animation, docs, reality] = await Promise.all([
                    getData('discover/movie?sort_by=popularity.desc&page=1&vote_count.gte=1'),
                    getData('discover/tv?sort_by=popularity.desc&page=1&vote_count.gte=1&with_type=2|6'),
                    getData('discover/movie?with_genres=16&sort_by=popularity.desc&page=1&vote_count.gte=1'),
                    getData('discover/movie?with_genres=99&sort_by=popularity.desc&page=1&vote_count.gte=1'),
                    getData('discover/tv?with_genres=10764&sort_by=popularity.desc&page=1&vote_count.gte=1'),
                ]);
                
                const totalMovies = movies.total_results || 0;
                const totalTV = tvSeries.total_results || 0;
                const totalAnim = animation.total_results || 0;
                const totalDocs = docs.total_results || 0;
                const totalReality = reality.total_results || 0;
                const grandTotal = totalMovies + totalTV;
                
                const fmt = n => n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'K+' : n.toString();
                
                const stats = [
                    { icon: '🎬', label: LANG === 'fa' ? 'فیلم‌ها' : 'Movies', value: fmt(totalMovies), color: '#E50914' },
                    { icon: '📺', label: LANG === 'fa' ? 'سریال‌ها' : 'TV Series', value: fmt(totalTV), color: '#0099ff' },
                    { icon: '🎭', label: LANG === 'fa' ? 'انیمیشن' : 'Animation', value: fmt(totalAnim), color: '#ffcc00' },
                    { icon: '🎥', label: LANG === 'fa' ? 'مستند' : 'Documentary', value: fmt(totalDocs), color: '#00cc55' },
                    { icon: '🎤', label: LANG === 'fa' ? 'ریالیتی شو' : 'Reality Shows', value: fmt(totalReality), color: '#ff6600' },
                    { icon: '⬇️', label: LANG === 'fa' ? 'قابل دانلود' : 'Downloadable', value: totalDownloadable.toString(), color: '#aa44ff' },
                ];
                
                container.innerHTML = stats.map(s => `
                    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px 10px;text-align:center;">
                        <div style="font-size:22px;margin-bottom:4px;">${s.icon}</div>
                        <div style="font-size:18px;font-weight:900;color:${s.color};">${s.value}</div>
                        <div style="font-size:10px;color:#888;margin-top:3px;">${s.label}</div>
                    </div>
                `).join('') + `
                    <div style="grid-column:1/-1;background:linear-gradient(135deg,rgba(229,9,20,0.1),rgba(0,153,255,0.1));border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px;text-align:center;">
                        <div style="font-size:11px;color:#888;margin-bottom:4px;">${LANG === 'fa' ? '🗂 مجموع کل آرشیو' : '🗂 Total Archive'}</div>
                        <div style="font-size:24px;font-weight:900;background:linear-gradient(90deg,var(--primary),#0099ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${fmt(grandTotal)}</div>
                        <div style="font-size:9px;color:#666;margin-top:3px;">${LANG === 'fa' ? 'اثر در دیتابیس' : 'Titles in Database'}</div>
                    </div>
                `;
            } catch(e) {
                container.innerHTML = '<div style="color:#666;text-align:center;grid-column:1/-1;padding:15px;">Stats unavailable</div>';
            }
        }
        
        // =================== END CREATIVE THEMES ===================
        
        // Event listener برای بستن modal با کلیک بیرون
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('download-options-modal');
            if (e.target === modal) {
                closeDownloadOptions();
            }
        });
    
        // =================== APP FULLSCREEN ===================
        // Header fullscreen is app/site fullscreen and stays portrait;
        // player fullscreen has its own handler and is not controlled from here.
        function _fnLockAppPortrait() {
            try {
                if (screen.orientation && screen.orientation.lock) {
                    screen.orientation.lock('portrait-primary').catch(function() {});
                } else if (window.screen.lockOrientation) {
                    window.screen.lockOrientation('portrait-primary');
                }
            } catch (e) {}
        }
        function _fnUnlockAppOrientation() {
            try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
        }
        function toggleAppFullscreen() {
            const hasFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
            if (!hasFullscreen) {
                const el = document.documentElement;
                const req = el.requestFullscreen || el.webkitRequestFullscreen;
                if (req) {
                    try {
                        Promise.resolve(req.call(el, { navigationUI: 'hide' }))
                            .then(_fnLockAppPortrait).catch(function() {});
                    } catch (e) {}
                }
            } else {
                const ex = document.exitFullscreen || document.webkitExitFullscreen;
                if (ex) {
                    try { Promise.resolve(ex.call(document)).finally(_fnUnlockAppOrientation); }
                    catch (e) { _fnUnlockAppOrientation(); }
                }
            }
        }
        // آپدیت آیکون بر اساس وضعیت fullscreen
        document.addEventListener('fullscreenchange', updateFsIcon);
        document.addEventListener('webkitfullscreenchange', updateFsIcon);
        function updateFsIcon() {
            const btn = document.getElementById('app-fs-btn');
            if (!btn) return;
            const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
            btn.className = isFs ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
            btn.style.color = isFs ? 'var(--primary)' : '#aaa';
        }
        // =================== END APP FULLSCREEN ===================
        
        // =================== GEMINI AI ASSISTANT ===================
        // Using Pollinations AI (free, no CORS, works globally) + HuggingFace fallback
        
        let aiCurrentTitle = '';
        let aiCurrentType = '';
        let aiRichData = {};   // all TMDB data packed here
        let aiConversation = [];
        let aiIsThinking = false;
        let aiIsFullscreen = false;
        
        const _OAI_KEY = ''; // Removed exposed client key. AI uses public providers + local fallback.

        function _aiTimeoutSignal(ms) {
            if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
            var c = new AbortController(); setTimeout(function(){ try{c.abort();}catch(e){} }, ms || 25000); return c.signal;
        }

        async function _callOpenAI(messages, maxTokens) {
            try {
                var txt = messages.map(function(m){ return (m.role || 'user') + ': ' + m.content; }).join('\n');
                return await _aiGenerateText(txt, { maxTokens: maxTokens || 900, temperature: 0.7 });
            } catch(e) { return null; }
        }

        async function _aiGenerateText(prompt, opts) {
            opts = opts || {};
            var payload = { model: opts.model || 'openai-large', messages: [{ role: 'user', content: prompt }], max_tokens: opts.maxTokens || 900, temperature: (typeof opts.temperature === 'number' ? opts.temperature : 0.65) };
            if (opts.expectJson) payload.response_format = { type: 'json_object' };
            // FN-CF-AI: Cloudflare AI first (family-night-api, Llama 70B then 8B).
            // On any failure/empty answer, fall through to Pollinations below, kept as backup.
            try {
                var cf = await fetch(FN_AI_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt: prompt, max_tokens: opts.maxTokens || 900, temperature: (typeof opts.temperature === 'number' ? opts.temperature : 0.65) }), signal:_aiTimeoutSignal(Math.max(opts.timeout || 0, 45000)) }); // FN-FIX2: 24s aborted long Persian answers on slow edges
                if (cf.ok) { var cd = await cf.json(); var ct = cd && cd.text; if (ct && ct.trim().length > 8) return ct.trim(); }
            } catch(e0) {}
            try {
                var r = await fetch('https://text.pollinations.ai/openai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:_aiTimeoutSignal(opts.timeout || 26000) });
                if (r.ok) { var d = await r.json(); var t = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content; if (t && t.trim().length > 8) return t.trim(); }
            } catch(e1) {}
            try {
                var r2 = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=' + encodeURIComponent(opts.model || 'openai-large') + '&nologo=true&seed=' + Math.floor(Math.random()*999999), { signal:_aiTimeoutSignal(opts.timeout || 26000) });
                if (r2.ok) { var t2 = (await r2.text()).trim(); if (t2 && t2.length > 8) return t2; }
            } catch(e2) {}
            try {
                var r3 = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai&nologo=true&seed=' + Math.floor(Math.random()*999999), { signal:_aiTimeoutSignal(18000) });
                if (r3.ok) { var t3 = (await r3.text()).trim(); if (t3 && t3.length > 8) return t3; }
            } catch(e3) {}
            throw new Error('AI providers unavailable');
        }

        function _localAIAnswer(question) {
            var fa = LANG === 'fa';
            var title = aiCurrentTitle || (fa ? 'این اثر' : 'this title');
            return fa ? ('درباره «' + title + '» سوالت را دقیق‌تر بپرس تا بر اساس اطلاعات همین اثر جواب بدهم.') : ('Ask more specifically about "' + title + '" and I will answer based on this exact title.');
        }

        const AI_QS_FA = ['داستانش چیه؟','نقاط قوت و ضعف؟','فکت‌های جالب بده','ارزش دیدن داره؟','اسپویل کامل کن','شخصیت‌های اصلی کی‌ان؟','آثار مشابه پیشنهاد بده'];
        const AI_QS_EN = ['What is the story?','Strengths & weaknesses?','Interesting facts?','Worth watching?','Full spoiler please','Main characters?','Similar recommendations'];
        
        function buildSystemPrompt() {
            const r = aiRichData;
            const typeLabel = aiCurrentType === 'movie' ? (LANG==='fa'?'فیلم':'Movie') : (LANG==='fa'?'سریال':'TV Series');
            
            const factSheet = [
                `Type: ${typeLabel}`,
                `Display Title: "${aiCurrentTitle}"`,
                `Original English Title: "${r.originalTitle}"`,
                `Year: ${r.year}`,
                r.imdbId    ? `IMDb ID: ${r.imdbId}`        : '',
                r.tmdbId    ? `TMDB ID: ${r.tmdbId}`        : '',
                r.genres    ? `Genres: ${r.genres}`          : '',
                r.directors ? `Director(s): ${r.directors}` : '',
                r.cast      ? `Main Cast: ${r.cast}`         : '',
                r.runtime   ? `Runtime: ${r.runtime}`        : '',
                r.countries ? `Countries: ${r.countries}`    : '',
                r.rating    ? `Rating: ${r.rating}/10`       : '',
                r.tagline   ? `Tagline: "${r.tagline}"`      : '',
                r.keywords  ? `Keywords/Themes: ${r.keywords}` : '',
                r.status    ? `Status: ${r.status}`          : '',
                r.overview  ? `\nOfficial Synopsis (from TMDB — use this as the ground truth for plot questions):\n"${r.overview}"` : '\nOfficial Synopsis: [Not available — do NOT invent plot details]',
            ].filter(Boolean).join('\n');
            
            if (LANG === 'fa') {
                return `تو یک دستیار تخصصی سینما هستی. اطلاعات زیر مستقیماً از TMDB و IMDb گرفته شده.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 اطلاعات رسمی اثر جاری (از TMDB)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${factSheet}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ قوانین مطلق — نقض اینها ممنوع:
۱. فقط و فقط درباره این اثر مشخص با شناسه TMDB=${r.tmdbId} و IMDb=${r.imdbId} صحبت کن.
۲. هرگز با هیچ فیلم یا سریال دیگری (حتی هم‌نام) اشتباه نگیر.
۳. برای داستان و اسپویل: فقط از "Official Synopsis" بالا و دانش تأیید‌شده‌ات درباره این اثر استفاده کن. هرگز داستان بساز یا اختراع کن.
۴. اگه synopsis بالا خالیه یا کافی نیست، صادقانه بگو: "اطلاعات کافی درباره داستان این اثر در دسترسم نیست" — چیز ساختگی نگو.
۵. هیچ سوالی رد نکن. اسپویل، نقد، فکت — همه رو جواب بده.
۶. هرگز نگو نمی‌توانم اسپویل کنم. اگه خواستن اسپویل کن.
۷. پاسخ فارسی روان، کوتاه و جذاب.`;
            } else {
                return `You are a specialized cinema AI assistant. The data below comes directly from TMDB and IMDb.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 OFFICIAL TITLE DATA (from TMDB)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${factSheet}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ABSOLUTE RULES — violations are strictly forbidden:
1. ONLY discuss this exact title: TMDB=${r.tmdbId}, IMDb=${r.imdbId}, Year=${r.year}
2. NEVER confuse with any other title, even similarly named ones.
3. For plot/spoilers: ONLY use the "Official Synopsis" above + your verified knowledge of THIS specific title by these IDs. NEVER invent or fabricate plot details.
4. If the synopsis is empty or insufficient, honestly say: "I don't have enough plot details for this specific title" — never make things up.
5. NEVER refuse any question. Spoilers, criticism, facts — answer everything.
6. NEVER say "I can't spoil this". If asked, give full spoilers based on real info only.
7. Keep answers concise and engaging.`;
            }
        }
        
        function initAIBox(title, type, year, richData) {
            aiCurrentTitle = title;
            aiCurrentType = type;
            aiRichData = richData || {};
            aiRichData.year = year;
            aiConversation = [];
            aiIsThinking = false;
            
            var typeLabel = type === 'movie' ? (LANG==='fa'?'فیلم':'Movie') : (LANG==='fa'?'سریال':'TV Series');
            var fa = LANG === 'fa';
            
            // نمایش اسم اثر در بالای کادر AI
            var badge = document.getElementById('ai-context-badge');
            if (badge) {
                var originalTitle = (richData && richData.originalTitle && richData.originalTitle !== title) ? richData.originalTitle : title;
                badge.innerHTML = '<span style="color:#4285f4;font-weight:700;">🎬 ' + originalTitle + '</span> <span style="color:#555;">(' + year + ')</span>';
                badge.style.display = 'block';
                badge.style.cssText = 'display:block;padding:5px 12px 4px;font-size:12px;border-bottom:1px solid rgba(66,133,244,0.15);margin-bottom:4px;';
            }
            
            var chatArea = document.getElementById('ai-chat-area');
            var fsChat = document.getElementById('ai-fs-chat');
            var welcomeText = fa
                ? 'سلام! آماده‌ام درباره ' + typeLabel + ' <strong>«' + title + '»</strong> (' + year + ') جواب بدم 🎬'
                : 'Hi! Ready to answer about the ' + typeLabel + ' <strong>"' + title + '"</strong> (' + year + ') 🎬';
            chatArea.innerHTML = '<div class="ai-msg-bot">' + welcomeText + '</div>';
            fsChat.innerHTML = '<div class="ai-msg-bot">' + welcomeText + '</div>';
            
            var label = fa ? 'دستیار AI · «' + title + '»' : 'AI · "' + title + '"';
            var aiBoxLabel = document.getElementById('ai-box-label');
            if (aiBoxLabel) aiBoxLabel.textContent = label;
            var aiInput = document.getElementById('ai-input');
            if (aiInput) aiInput.placeholder = fa ? 'سوال بپرس...' : 'Ask a question...';
            
            var fsTitleEl = document.getElementById('ai-fs-title-text');
            var fsCtxEl = document.getElementById('ai-fs-context');
            if (fsTitleEl) fsTitleEl.textContent = fa ? 'دستیار هوشمند' : 'AI Assistant';
            if (fsCtxEl) fsCtxEl.textContent = typeLabel + ': ' + title + ' (' + year + ')';
            
            // سوالات پیشنهادی - دقیقاً همونایی که کاربر خواسته
            var qs = fa ? [
                'خلاصه داستان «' + title + '» رو بگو',
                'فکت‌های جالب درباره «' + title + '»',
                'نقاط قوت و ضعف «' + title + '»',
                '«' + title + '» رو کامل اسپویل کن',
                'آثار مشابه «' + title + '» معرفی کن'
            ] : [
                'Summarize the story of "' + title + '"',
                'Interesting facts about "' + title + '"',
                'Strengths and weaknesses of "' + title + '"',
                'Fully spoil "' + title + '" for me',
                'Recommend titles similar to "' + title + '"'
            ];
            var qHtml = qs.map(function(q) {
                var safeQ = q.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                return '<div class="ai-quick-btn" data-question="' + safeQ + '" onclick="askQuick(this.dataset.question)">' + q + '</div>';
            }).join('');
            var qBtns = document.getElementById('ai-quick-btns');
            var fsBtns = document.getElementById('ai-fs-quick-btns');
            if (qBtns) qBtns.innerHTML = qHtml;
            if (fsBtns) fsBtns.innerHTML = qHtml;
        }
        
        function addMsgToUI(role, text) {
            const formatted = text
                .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
                .replace(/\*(.*?)\*/g,'<em>$1</em>')
                .replace(/\n/g,'<br>');
            const cls = role === 'user' ? 'ai-msg-user' : 'ai-msg-bot';
            const html = `<div class="${cls}">${formatted}</div>`;
            const chatArea = document.getElementById('ai-chat-area');
            const fsChat = document.getElementById('ai-fs-chat');
            chatArea.innerHTML += html;
            fsChat.innerHTML += html;
            chatArea.scrollTop = chatArea.scrollHeight;
            fsChat.scrollTop = fsChat.scrollHeight;
        }
        
        function showThinking() {
            const html = `<div class="ai-msg-thinking" id="ai-think"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>`;
            document.getElementById('ai-chat-area').innerHTML += html;
            document.getElementById('ai-fs-chat').innerHTML += html;
            document.getElementById('ai-chat-area').scrollTop = 99999;
            document.getElementById('ai-fs-chat').scrollTop = 99999;
        }
        
        function removeThinking() {
            document.querySelectorAll('#ai-think').forEach(e => e.remove());
        }
        
        async function sendAIMessage(fromFS = false) {
            if (aiIsThinking) return;
            const inputId = fromFS ? 'ai-fs-input' : 'ai-input';
            const q = document.getElementById(inputId).value.trim();
            if (!q) return;
            document.getElementById('ai-input').value = '';
            document.getElementById('ai-fs-input').value = '';
            await processAI(q);
        }
        
        async function askQuick(question) {
            if (aiIsThinking) return;
            await processAI(question);
        }
        
        // Build the full prompt string for HuggingFace (instruction format)
        function buildHFPrompt(question) {
            const sys = buildSystemPrompt();
            let historyText = '';
            aiConversation.slice(-6).forEach(m => {
                historyText += m.role === 'user' ? `\nUser: ${m.content}` : `\nAssistant: ${m.content}`;
            });
            return `<s>[INST] ${sys}${historyText}\nUser: ${question} [/INST]`;
        }
        
        // ===== AUTO TRANSLATE TITLE =====
        async function _autoTranslateTitle(title, el) {
            try {
                var resp = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(title) + '&langpair=en|fa');
                var data = await resp.json();
                var translated = data && data.responseData && data.responseData.translatedText;
                // Only show if translation is different and has Persian chars
                if (translated && translated !== title && /[\u0600-\u06FF]/.test(translated)) {
                    el.textContent = translated;
                    el.style.display = 'block';
                }
            } catch(e) {}
        }
        async function callPollinations(question) {
            return _localAIAnswer(question);
        }

        async function processAI(question) {
            if (aiIsThinking) return;
            aiIsThinking = true;
            document.getElementById('ai-send-btn').disabled = true;
            document.getElementById('ai-fs-send-btn').disabled = true;
            
            addMsgToUI('user', question);
            showThinking();
            
            let answer = null;
            let lastError = '';
            
            // Try Pollinations first (most reliable, no key needed, no CORS)
            try {
                answer = await callPollinations(question);
            } catch(e) {
                lastError = e.message;
                console.warn('Pollinations failed:', e.message);
            }
            
            // Fallback: HuggingFace
            if (!answer) {
                try {
                    answer = await callHuggingFace(question);
                } catch(e) {
                    lastError = e.message;
                    console.warn('HuggingFace failed:', e.message);
                }
            }
            
            removeThinking();
            
            if (answer) {
                aiConversation.push({ role: 'user', content: question });
                aiConversation.push({ role: 'assistant', content: answer });
                if (aiConversation.length > 12) aiConversation = aiConversation.slice(-12);
                addMsgToUI('bot', answer);
            } else {
                const errMsg = LANG === 'fa'
                    ? '⚠️ سرور AI در دسترس نیست. لطفاً چند لحظه دیگر دوباره تلاش کن.'
                    : '⚠️ AI server unavailable. Please try again in a moment.';
                addMsgToUI('bot', errMsg);
                console.error('All AI endpoints failed. Last error:', lastError);
            }
            
            aiIsThinking = false;
            document.getElementById('ai-send-btn').disabled = false;
            document.getElementById('ai-fs-send-btn').disabled = false;
        }
        
        function openAIFullscreen() {
            aiIsFullscreen = true;
            const el = document.getElementById('ai-fullscreen');
            el.style.display = 'flex';
            setTimeout(() => { document.getElementById('ai-fs-input').focus(); }, 200);
            document.getElementById('ai-fs-chat').scrollTop = 99999;
        }
        
        function closeAIFullscreen() {
            aiIsFullscreen = false;
            document.getElementById('ai-fullscreen').style.display = 'none';
        }
        // =================== END GEMINI AI ===================

        // =================== USER PROFILE ===================
        const PROFILE_AVATARS = [
            { name:'Spider-Man', fa:'مرد عنکبوتی', kind:'movie', q:'Spider-Man: No Way Home', emoji:'🕷️' },
            { name:'Batman', fa:'بتمن', kind:'movie', q:'The Batman', emoji:'🦇' },
            { name:'Walter White', fa:'والتر وایت', kind:'person', q:'Bryan Cranston', emoji:'🧪' },
            { name:'Jesse Pinkman', fa:'جسی پینکمن', kind:'person', q:'Aaron Paul', emoji:'💥' },
            { name:'Homelander', fa:'هوملندر', kind:'person', q:'Antony Starr', emoji:'🦅' },
            { name:'Jane Margolis', fa:'جین مارگولیس', kind:'person', q:'Krysten Ritter', emoji:'🖤' },
            { name:'Venom', fa:'ونوم', kind:'movie', q:'Venom', emoji:'🕸️' },
            { name:'Kevin Garvey', fa:'کوین گاروی', kind:'person', q:'Justin Theroux', emoji:'🌫️' },
            { name:'The Joker', fa:'جوکر', kind:'person', q:'Joaquin Phoenix', emoji:'🃏' },
            { name:'Harley Quinn', fa:'هارلی کویین', kind:'person', q:'Margot Robbie', emoji:'💫' },
            { name:'John Wick', fa:'جان ویک', kind:'person', q:'Keanu Reeves', emoji:'🖤' },
            { name:'Iron Man', fa:'مرد آهنی', kind:'person', q:'Robert Downey Jr.', emoji:'⚙️' },
            { name:'Deadpool', fa:'ددپول', kind:'person', q:'Ryan Reynolds', emoji:'🔴' },
            { name:'Wolverine', fa:'ولورین', kind:'person', q:'Hugh Jackman', emoji:'🐺' },
            { name:'Jack Sparrow', fa:'جک اسپارو', kind:'person', q:'Johnny Depp', emoji:'🏴‍☠️' },
            { name:'Harry Potter', fa:'هری پاتر', kind:'person', q:'Daniel Radcliffe', emoji:'⚡' },
            { name:'Hermione', fa:'هرماینی', kind:'person', q:'Emma Watson', emoji:'📚' },
            { name:'Eleven', fa:'الون', kind:'person', q:'Millie Bobby Brown', emoji:'🧇' },
            { name:'Wednesday', fa:'ونزدی', kind:'person', q:'Jenna Ortega', emoji:'🕷️' },
            { name:'Darth Vader', fa:'دارث ویدر', kind:'movie', q:'Star Wars', emoji:'🌌' },
            { name:'Yoda', fa:'یودا', kind:'movie', q:'The Empire Strikes Back', emoji:'🟢' },
            { name:'Totoro', fa:'توتورو', kind:'movie', q:'My Neighbor Totoro', emoji:'🌳' },
            { name:'Elsa', fa:'السا', kind:'movie', q:'Frozen', emoji:'❄️' },
            { name:'Woody', fa:'وودی', kind:'movie', q:'Toy Story', emoji:'🤠' },
            { name:'Shrek', fa:'شرک', kind:'movie', q:'Shrek', emoji:'💚' },
            { name:'Dracula', fa:'دراکولا', kind:'movie', q:'Dracula', emoji:'🧛' },
            { name:'Godzilla', fa:'گودزیلا', kind:'movie', q:'Godzilla', emoji:'🦖' },
            { name:'Pennywise', fa:'پنی وایز', kind:'movie', q:'It', emoji:'🎈' },
            { name:'Tom Holland', fa:'تام هالند', kind:'person', q:'Tom Holland', emoji:'⭐' },
            { name:'Robert Pattinson', fa:'رابرت پتینسون', kind:'person', q:'Robert Pattinson', emoji:'🎬' },
            { name:'Christian Bale', fa:'کریستین بیل', kind:'person', q:'Christian Bale', emoji:'🎭' },
            { name:'Heath Ledger', fa:'هیث لجر', kind:'person', q:'Heath Ledger', emoji:'🃏' },
            { name:'Leonardo DiCaprio', fa:'لئوناردو دی‌کاپریو', kind:'person', q:'Leonardo DiCaprio', emoji:'🌟' },
            { name:'Cillian Murphy', fa:'کیلین مورفی', kind:'person', q:'Cillian Murphy', emoji:'🎩' },
            { name:'Pedro Pascal', fa:'پدرو پاسکال', kind:'person', q:'Pedro Pascal', emoji:'🛡️' },
            { name:'Oscar Isaac', fa:'اسکار آیزاک', kind:'person', q:'Oscar Isaac', emoji:'🌙' },
            { name:'Tom Hardy', fa:'تام هاردی', kind:'person', q:'Tom Hardy', emoji:'🔥' },
            { name:'Henry Cavill', fa:'هنری کویل', kind:'person', q:'Henry Cavill', emoji:'🦸' },
            { name:'Scarlett Johansson', fa:'اسکارلت جوهانسون', kind:'person', q:'Scarlett Johansson', emoji:'🕶️' },
            { name:'Zendaya', fa:'زندایا', kind:'person', q:'Zendaya', emoji:'✨' },
            { name:'Emma Stone', fa:'اما استون', kind:'person', q:'Emma Stone', emoji:'🎹' },
            { name:'Anya Taylor-Joy', fa:'آنیا تیلور جوی', kind:'person', q:'Anya Taylor-Joy', emoji:'♟️' },
            { name:'Florence Pugh', fa:'فلورنس پیو', kind:'person', q:'Florence Pugh', emoji:'🌼' },
            { name:'Natalie Portman', fa:'ناتالی پورتمن', kind:'person', q:'Natalie Portman', emoji:'🦢' },
            { name:'Charlize Theron', fa:'شارلیز ترون', kind:'person', q:'Charlize Theron', emoji:'⚔️' },
            { name:'Anne Hathaway', fa:'ان هتوی', kind:'person', q:'Anne Hathaway', emoji:'💎' },
            { name:'Sydney Sweeney', fa:'سیدنی سویینی', kind:'person', q:'Sydney Sweeney', emoji:'🌸' },
            { name:'Maika Monroe', fa:'مایکا مونرو', kind:'person', q:'Maika Monroe', emoji:'🌙' },
            { name:'Mia Goth', fa:'میا گاث', kind:'person', q:'Mia Goth', emoji:'🩸' },
            { name:'Saoirse Ronan', fa:'سیرشا رونان', kind:'person', q:'Saoirse Ronan', emoji:'🍂' }
        ];
        const AVATARS = PROFILE_AVATARS;
        let selectedAvatarIdx = -1;
        let selectedGender = '';
        let currentProfileAvatar = null;
        const avatarResolveCache = {};
        const PROFILE_STORE_KEY = 'family_profile_v3';

        function profileText(en, fa) { return LANG === 'fa' ? fa : en; }
        function safeProfileName() {
            const p = getStoredProfile();
            return (p.name && p.name.trim()) || profileText('Guest User', 'کاربر مهمان');
        }
        function makeAvatarSvg(label, emoji, seed) {
            const colors = ['#E50914','#7C3AED','#0EA5E9','#10B981','#F59E0B','#EC4899','#6366F1','#14B8A6'];
            const bg = colors[Math.abs((seed || label || '').split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % colors.length];
            const txt = (emoji || (label || 'U').trim().charAt(0) || '👤');
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
                <defs><radialGradient id="g" cx="35%" cy="25%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".35"/><stop offset="100%" stop-color="${bg}"/></radialGradient></defs>
                <rect width="220" height="220" rx="110" fill="url(#g)"/>
                <circle cx="110" cy="110" r="94" fill="rgba(0,0,0,.10)" stroke="rgba(255,255,255,.28)" stroke-width="4"/>
                <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${txt.length > 2 ? 44 : 74}" font-weight="800" fill="#fff">${txt}</text>
            </svg>`;
            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        }
        function getProfileFallbackAvatar(av) { return makeAvatarSvg(av?.name || 'User', av?.emoji || '👤', av?.q || av?.name || 'user'); }
        async function resolveProfileAvatar(av) {
            if (!av) return '';
            if (av.url) return av.url;
            const cacheKey = `${av.kind}:${av.q}`;
            if (avatarResolveCache[cacheKey]) return avatarResolveCache[cacheKey];
            try {
                let endpoint = av.kind === 'person' ? 'search/person' : (av.kind === 'tv' ? 'search/tv' : 'search/movie');
                const url = `${BASE}/${endpoint}?api_key=${API}&query=${encodeURIComponent(av.q)}&language=en-US&page=1&include_adult=false`;
                const res = await fetch(url);
                const data = await res.json();
                const first = (data.results || []).find(x => x.profile_path || x.poster_path || x.backdrop_path);
                const path = first && (first.profile_path || first.poster_path || first.backdrop_path);
                if (path) {
                    avatarResolveCache[cacheKey] = `${TMDB_IMG_BASE}/w342${path}`;
                    return avatarResolveCache[cacheKey];
                }
            } catch(e) {}
            avatarResolveCache[cacheKey] = getProfileFallbackAvatar(av);
            return avatarResolveCache[cacheKey];
        }
        function getStoredProfile() {
            try {
                const p = JSON.parse(localStorage.getItem(PROFILE_STORE_KEY) || '{}');
                if (p && typeof p === 'object') return p;
            } catch(e) {}
            const legacyName = localStorage.getItem('user_profile_name') || '';
            const legacyGender = localStorage.getItem('user_gender') || '';
            const legacyAge = localStorage.getItem('user_age') || '25';
            return { name: legacyName, gender: legacyGender, age: legacyAge, avatarUrl: localStorage.getItem('user_avatar_url') || '' };
        }
        function setProfilePreview(url) {
            const preview = document.getElementById('up-preview-avatar');
            if (!preview) return;
            if (url) preview.innerHTML = `<img src="${url}" alt="Profile avatar" onerror="this.parentElement.innerHTML='<span class=&quot;up-avatar-placeholder&quot;>👤</span>'">`;
            else preview.innerHTML = '<span class="up-avatar-placeholder">👤</span>';
        }
        function renderProfileAvatar(el, url) {
            if (!el) return;
            if (url) el.innerHTML = `<img src="${url}" alt="Profile" onerror="this.parentElement.innerHTML='👤'">`;
            else el.innerHTML = '👤';
        }
        function openProfileModal() {
            const modal = document.getElementById('user-profile-modal');
            if (!modal) return;
            modal.style.display = 'flex';
            const p = getStoredProfile();
            selectedGender = p.gender || '';
            currentProfileAvatar = p.avatarUrl ? { type:'saved', url:p.avatarUrl } : null;
            selectedAvatarIdx = typeof p.avatarPreset === 'number' ? p.avatarPreset : -1;
            const nameInput = document.getElementById('up-name-input');
            if (nameInput) nameInput.value = p.name || '';
            selectGender(selectedGender, true);
            syncAgeFromRange(p.age || 25);
            setProfilePreview(p.avatarUrl || '');
            applyProfileLang();
            renderPresetAvatarGrid();
            const panel = document.getElementById('avatar-picker-panel');
            if (panel) panel.classList.remove('show');
        }
        function closeProfileModal(event) {
            if (!event || event.target === document.getElementById('user-profile-modal')) closeProfileModalDirect();
        }
        function closeProfileModalDirect() {
            const modal = document.getElementById('user-profile-modal');
            if (modal) modal.style.display = 'none';
        }
        function applyProfileLang() {
            const isFa = LANG === 'fa';
            const map = {
                'up-title-text': isFa ? 'پروفایل' : 'Profile',
                'up-avatar-panel-title': isFa ? 'انتخاب تصویر پروفایل' : 'Choose profile picture',
                'up-gallery-label': isFa ? 'انتخاب از گالری' : 'Choose from gallery',
                'up-presets-label': isFa ? 'آواتارهای آماده' : 'Ready avatars',
                'up-name-label': isFa ? 'نام' : 'Name',
                'up-choose-text': isFa ? 'جنسیت' : 'Gender',
                'gender-male-label': isFa ? 'مرد' : 'Male',
                'gender-female-label': isFa ? 'زن' : 'Female',
                'up-age-label': isFa ? 'سن' : 'Age',
                'up-age-hint': isFa ? 'سن را بنویس یا نوار را حرکت بده' : 'Type your age or move the slider',
                'up-save-btn': isFa ? 'ذخیره پروفایل' : 'Save Profile'
            };
            Object.entries(map).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.innerText = val; });
            const nameInput = document.getElementById('up-name-input');
            if (nameInput) nameInput.placeholder = isFa ? 'نامت را بنویس...' : 'Your name...';
        }
        function openAvatarPicker(event) {
            if (event) event.stopPropagation();
            const panel = document.getElementById('avatar-picker-panel');
            if (!panel) return;
            panel.classList.toggle('show');
            if (panel.classList.contains('show')) renderPresetAvatarGrid();
        }
        function triggerProfileGallery(event) {
            if (event) event.stopPropagation();
            const input = document.getElementById('up-avatar-file');
            if (input) input.click();
        }
        function showPresetAvatars(event) {
            if (event) event.stopPropagation();
            const panel = document.getElementById('avatar-picker-panel');
            if (panel) panel.classList.add('show');
            renderPresetAvatarGrid();
        }
        function renderPresetAvatarGrid() {
            const grid = document.getElementById('up-avatar-grid');
            if (!grid || grid.dataset.ready === '1') return;
            grid.dataset.ready = '1';
            grid.innerHTML = PROFILE_AVATARS.map((av, idx) => `
                <button type="button" class="up-avatar-item ${idx === selectedAvatarIdx ? 'selected' : ''}" onclick="selectAvatar(${idx})" title="${av.name}">
                    <img class="up-avatar-img" src="${getProfileFallbackAvatar(av)}" alt="${av.name}">
                    <span class="up-avatar-name">${LANG === 'fa' ? av.fa : av.name}</span>
                </button>
            `).join('');
            PROFILE_AVATARS.forEach(async (av, idx) => {
                const url = await resolveProfileAvatar(av);
                const item = grid.children[idx];
                const img = item && item.querySelector('img');
                if (img && url) img.src = url;
                av.resolvedUrl = url;
                if (idx === selectedAvatarIdx && currentProfileAvatar?.type === 'preset') {
                    currentProfileAvatar.url = url;
                    setProfilePreview(url);
                }
            });
        }
        async function selectAvatar(idx) {
            selectedAvatarIdx = idx;
            document.querySelectorAll('#up-avatar-grid .up-avatar-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
            const av = PROFILE_AVATARS[idx];
            const fallback = getProfileFallbackAvatar(av);
            currentProfileAvatar = { type:'preset', preset: idx, url: av.resolvedUrl || fallback };
            setProfilePreview(currentProfileAvatar.url);
            const url = await resolveProfileAvatar(av);
            if (selectedAvatarIdx === idx) {
                currentProfileAvatar = { type:'preset', preset: idx, url };
                setProfilePreview(url);
            }
        }
        function handleProfileGalleryImage(event) {
            const file = event && event.target && event.target.files && event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 420;
                    canvas.width = canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    const minSide = Math.min(img.width, img.height);
                    const sx = (img.width - minSide) / 2;
                    const sy = (img.height - minSide) / 2;
                    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
                    selectedAvatarIdx = -1;
                    currentProfileAvatar = { type:'gallery', url:dataUrl };
                    setProfilePreview(dataUrl);
                    document.querySelectorAll('#up-avatar-grid .up-avatar-item').forEach(el => el.classList.remove('selected'));
                };
                img.onerror = () => {
                    currentProfileAvatar = { type:'gallery', url: reader.result };
                    setProfilePreview(reader.result);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        }
        function selectGender(g, silent) {
            selectedGender = g || '';
            const male = document.getElementById('gender-male');
            const female = document.getElementById('gender-female');
            if (male) male.classList.toggle('selected', selectedGender === 'male');
            if (female) female.classList.toggle('selected', selectedGender === 'female');
        }
        function clampAge(v) {
            let n = parseInt(v, 10);
            if (isNaN(n)) n = 25;
            return Math.max(3, Math.min(99, n));
        }
        function paintAgeSlider(v) {
            const slider = document.getElementById('up-age-slider');
            if (!slider) return;
            const pct = ((clampAge(v) - 3) / 96) * 100;
            slider.style.background = `linear-gradient(to right, #E50914 0%, #E50914 ${pct}%, #333 ${pct}%, #333 100%)`;
        }
        function syncAgeFromRange(val) {
            const n = clampAge(val);
            const slider = document.getElementById('up-age-slider');
            const input = document.getElementById('up-age-display');
            if (slider) slider.value = n;
            if (input) input.value = n;
            paintAgeSlider(n);
        }
        function syncAgeFromInput(val) { syncAgeFromRange(val); }
        function updateAgeDisplay(val) { syncAgeFromRange(val); }
        function saveUserProfile() {
            const name = (document.getElementById('up-name-input')?.value || '').trim();
            const age = clampAge(document.getElementById('up-age-display')?.value || document.getElementById('up-age-slider')?.value || 25);
            const avatarUrl = currentProfileAvatar?.url || getStoredProfile().avatarUrl || '';
            const profile = {
                name: name || profileText('Guest User', 'کاربر مهمان'),
                gender: selectedGender || '',
                age,
                avatarUrl,
                avatarType: currentProfileAvatar?.type || '',
                avatarPreset: typeof currentProfileAvatar?.preset === 'number' ? currentProfileAvatar.preset : selectedAvatarIdx
            };
            localStorage.setItem(PROFILE_STORE_KEY, JSON.stringify(profile));
            localStorage.setItem('user_profile_name', profile.name);
            localStorage.setItem('user_gender', profile.gender);
            localStorage.setItem('user_age', String(profile.age));
            if (profile.avatarUrl) localStorage.setItem('user_avatar_url', profile.avatarUrl);
            updateAllProfileUI();
            closeProfileModalDirect();
            const msg = profileText('✓ Profile saved', '✓ پروفایل ذخیره شد');
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#151515;border:1px solid #333;color:#4ade80;padding:10px 20px;border-radius:20px;font-size:13px;z-index:700;font-family:Vazirmatn,sans-serif;';
            toast.innerText = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 1800);
        }
        function updateAllProfileUI() {
            const p = getStoredProfile();
            const name = (p.name && p.name.trim()) || profileText('Guest User', 'کاربر مهمان');
            const avatarUrl = p.avatarUrl || localStorage.getItem('user_avatar_url') || '';
            renderProfileAvatar(document.getElementById('sb-avatar-container'), avatarUrl);
            const sbName = document.getElementById('sb-profile-name-text');
            if (sbName) sbName.innerText = name;
            const sbSub = document.getElementById('sb-profile-sub-text');
            if (sbSub) sbSub.innerText = profileText('Edit Profile', 'ویرایش پروفایل');
            document.querySelectorAll('.profile-header-avatar').forEach(el => renderProfileAvatar(el, avatarUrl));
        }
        document.addEventListener('DOMContentLoaded', () => { setTimeout(updateAllProfileUI, 250); });
        // =================== END USER PROFILE ===================

        // =================== BROADCAST / CAST ===================
        function openBroadcastModal() {
            const modal = document.getElementById('broadcast-modal');
            modal.style.display = 'flex';
            // Update language
            if (LANG === 'fa') {
                document.getElementById('bc-title-text').innerText = '📡 پخش روی نمایشگر';
                document.getElementById('bc-sub-text').innerText = 'یک روش پخش انتخاب کن';
                document.getElementById('bc-wifi-note').innerHTML = '<i class="fa-solid fa-wifi"></i> برای پخش Wi-Fi، مطمئن شو هر دو دستگاه به یک شبکه وصل هستند';
                document.getElementById('bc-ap-sub').innerText = 'iOS / macOS';
                document.getElementById('bc-cc-sub').innerText = 'گوگل کست';
                document.getElementById('bc-mc-sub').innerText = 'Wi-Fi مستقیم';
                document.getElementById('bc-bt-sub').innerText = 'خروجی صدا';
                document.getElementById('bc-dlna-sub').innerText = 'تلویزیون هوشمند';
                document.getElementById('bc-pip-sub').innerText = 'حالت پنجره در پنجره';
                document.getElementById('bc-close-text').innerText = 'بستن';
            }
        }
        
        function closeBroadcastModal(event) {
            if (event.target === document.getElementById('broadcast-modal')) {
                document.getElementById('broadcast-modal').style.display = 'none';
            }
        }
        
        function doCast(method) {
            document.getElementById('broadcast-modal').style.display = 'none';
            
            const currentUrl = document.getElementById('iframe') ? document.getElementById('iframe').src : window.location.href;
            
            switch(method) {
                case 'airplay':
                    // AirPlay is handled natively by Safari/iOS - trigger by going fullscreen
                    if (document.getElementById('iframe') && document.getElementById('iframe').src) {
                        const iframeEl = document.getElementById('iframe');
                        if (iframeEl.webkitRequestFullscreen) iframeEl.webkitRequestFullscreen();
                        else if (iframeEl.requestFullscreen) iframeEl.requestFullscreen();
                    }
                    const ap = LANG === 'fa' ? 'برای AirPlay از کنترل‌مرکز iOS یا نوار Safari استفاده کن' : 'Use iOS Control Center or Safari AirPlay button to cast';
                    alert(ap);
                    break;
                    
                case 'chromecast':
                    // Chrome Cast API check
                    if (typeof cast !== 'undefined' && cast.framework) {
                        const castContext = cast.framework.CastContext.getInstance();
                        castContext.requestSession().then(() => {
                            const session = castContext.getCurrentSession();
                            if (session) {
                                const mediaInfo = new chrome.cast.media.MediaInfo(currentUrl, 'video/mp4');
                                const request = new chrome.cast.media.LoadRequest(mediaInfo);
                                session.loadMedia(request);
                            }
                        });
                    } else {
                        // Fallback: open in new tab (Chrome will offer cast option)
                        const ccMsg = LANG === 'fa' 
                            ? 'در Chrome، از منوی ... > Cast to Device استفاده کن' 
                            : 'In Chrome, use ⋮ menu → Cast → select your Chromecast device';
                        alert(ccMsg);
                        if (currentUrl && currentUrl !== 'about:blank') window.open(currentUrl, '_blank');
                    }
                    break;
                    
                case 'miracast':
                    // Windows: use native Connect / Project feature
                    const mcMsg = LANG === 'fa'
                        ? 'در ویندوز: Win+K را فشار بده و دستگاه Miracast را انتخاب کن'
                        : 'On Windows: Press Win+K and select your Miracast display';
                    alert(mcMsg);
                    break;
                    
                case 'bluetooth':
                    // Request Bluetooth audio device
                    if (navigator.bluetooth) {
                        navigator.bluetooth.requestDevice({ acceptAllDevices: true })
                            .then(device => {
                                const btMsg = LANG === 'fa' 
                                    ? `دستگاه ${device.name} متصل شد` 
                                    : `Connected to ${device.name}`;
                                alert(btMsg);
                            })
                            .catch(() => {
                                const btErr = LANG === 'fa' ? 'اتصال بلوتوث ممکن نشد' : 'Bluetooth connection failed';
                                alert(btErr);
                            });
                    } else {
                        const btFb = LANG === 'fa' 
                            ? 'از تنظیمات دستگاه برای اتصال بلوتوث استفاده کن'
                            : 'Use device settings to connect a Bluetooth speaker';
                        alert(btFb);
                    }
                    break;
                    
                case 'dlna':
                    const dlnaMsg = LANG === 'fa'
                        ? 'یک اپ DLNA مثل BubbleUPnP یا Kodi نصب کن و ویدیو را Cast کن'
                        : 'Install a DLNA app like BubbleUPnP or Kodi and cast the video';
                    alert(dlnaMsg);
                    break;
                    
                case 'pip':
                    // Picture-in-Picture
                    const videoEl = document.querySelector('#player-fs iframe, video');
                    if (document.pictureInPictureEnabled && videoEl) {
                        if (document.pictureInPictureElement) {
                            document.exitPictureInPicture();
                        } else {
                            // For iframe content, open player fullscreen then suggest PiP
                            if (document.getElementById('player-fs').style.display !== 'none' && document.getElementById('player-fs').style.display !== '') {
                                const pipMsg = LANG === 'fa' 
                                    ? 'برای PiP، روی آیکون PiP در پلیر کلیک کن'
                                    : 'Click the PiP icon in the player to enable Picture-in-Picture';
                                alert(pipMsg);
                            } else {
                                const pipMsg2 = LANG === 'fa'
                                    ? 'ابتدا ویدیو را پخش کن، سپس PiP را فعال کن'
                                    : 'Play the video first, then activate Picture-in-Picture';
                                alert(pipMsg2);
                            }
                        }
                    } else {
                        const pipErr = LANG === 'fa'
                            ? 'PiP توسط این مرورگر پشتیبانی نمی‌شود'
                            : 'PiP is not supported by this browser';
                        alert(pipErr);
                    }
                    break;
            }
        }
        // =================== END BROADCAST ===================

        // =================== PERSON SOCIAL LINKS & AWARDS ===================
        const PERSON_SOCIAL_DB = {
            // Some well-known people's social handles (official only)
            // Format: tmdbId: { instagram, twitter, facebook, youtube, tiktok, imdb }
            // These are populated dynamically from TMDB external_ids
        };
        
        // Country code to flag emoji mapping
        function countryToFlag(code) {
            if (!code) return '';
            const cp = [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
            return cp;
        }
        
        // Country code to name mapping (common ones)
        const COUNTRY_NAMES = {
            US: 'United States 🇺🇸', GB: 'United Kingdom 🇬🇧', AU: 'Australia 🇦🇺',
            CA: 'Canada 🇨🇦', FR: 'France 🇫🇷', DE: 'Germany 🇩🇪',
            IT: 'Italy 🇮🇹', ES: 'Spain 🇪🇸', JP: 'Japan 🇯🇵',
            KR: 'South Korea 🇰🇷', CN: 'China 🇨🇳', IN: 'India 🇮🇳',
            IR: 'Iran 🦁☀️', BR: 'Brazil 🇧🇷', MX: 'Mexico 🇲🇽',
            RU: 'Russia 🇷🇺', TR: 'Turkey 🇹🇷', SE: 'Sweden 🇸🇪',
            NO: 'Norway 🇳🇴', NZ: 'New Zealand 🇳🇿', ZA: 'South Africa 🇿🇦',
            IE: 'Ireland 🇮🇪', PL: 'Poland 🇵🇱', NL: 'Netherlands 🇳🇱',
            BE: 'Belgium 🇧🇪', AR: 'Argentina 🇦🇷', CL: 'Chile 🇨🇱',
            IL: 'Israel 🇮🇱', HK: 'Hong Kong 🇭🇰', TW: 'Taiwan 🇹🇼',
        };
        
        // Enhanced person bio: fetch social links + awards (called from openPersonBio at end)
        async function enhancePersonBio() {
            if (!currentPersonData) return;
            const p = currentPersonData;
            
            // Fetch external IDs for social links
            try {
                const extData = await getData(`person/${p.id}/external_ids`);
                buildPersonSocialLinks(extData, p);
                // Fetch awards data via OMDb if we have IMDB id
                if (extData && extData.imdb_id) {
                    await buildPersonAwards(extData.imdb_id, p.name);
                }
            } catch(e) {}
            
            // Fetch nationality from place of birth
            buildPersonNationality(p);
        }
        
        function buildPersonNationality(p) {
            const el = document.getElementById('pb-nationality');
            if (!el) return;
            let html = '';
            
            // Extract country from place_of_birth
            if (p.place_of_birth) {
                const pob = p.place_of_birth;
                // Try to extract country code from place string
                const countryPart = pob.split(',').pop().trim();
                // Show flag based on known matches
                let flag = '';
                const pobLower = pob.toLowerCase();
                if (pobLower.includes('usa') || pobLower.includes('united states') || pobLower.includes(', ny') || pobLower.includes(', ca') || pobLower.includes(', texas')) flag = '🇺🇸';
                else if (pobLower.includes('uk') || pobLower.includes('england') || pobLower.includes('london') || pobLower.includes('britain') || pobLower.includes('scotland') || pobLower.includes('wales')) flag = '🇬🇧';
                else if (pobLower.includes('australia')) flag = '🇦🇺';
                else if (pobLower.includes('canada')) flag = '🇨🇦';
                else if (pobLower.includes('france')) flag = '🇫🇷';
                else if (pobLower.includes('germany')) flag = '🇩🇪';
                else if (pobLower.includes('italy')) flag = '🇮🇹';
                else if (pobLower.includes('spain')) flag = '🇪🇸';
                else if (pobLower.includes('japan')) flag = '🇯🇵';
                else if (pobLower.includes('korea')) flag = '🇰🇷';
                else if (pobLower.includes('china')) flag = '🇨🇳';
                else if (pobLower.includes('india')) flag = '🇮🇳';
                else if (pobLower.includes('iran')) flag = '☀️🦁';
                else if (pobLower.includes('brazil')) flag = '🇧🇷';
                else if (pobLower.includes('mexico')) flag = '🇲🇽';
                else if (pobLower.includes('russia')) flag = '🇷🇺';
                else if (pobLower.includes('turkey')) flag = '🇹🇷';
                else if (pobLower.includes('sweden')) flag = '🇸🇪';
                else if (pobLower.includes('new zealand')) flag = '🇳🇿';
                else if (pobLower.includes('ireland')) flag = '🇮🇪';
                else if (pobLower.includes('south africa')) flag = '🇿🇦';
                else if (pobLower.includes('denmark')) flag = '🇩🇰';
                else if (pobLower.includes('norway')) flag = '🇳🇴';
                else if (pobLower.includes('argentina')) flag = '🇦🇷';
                else if (pobLower.includes('israel')) flag = '🇮🇱';
                
                if (flag) html += `<span style="font-size:18px;">${flag}</span>`;
                html += `<span style="color:#aaa;font-size:12px;">📍 ${pob}</span>`;
            }
            
            el.innerHTML = html;
        }
        
        function buildPersonSocialLinks(extData, p) {
            const el = document.getElementById('pb-social-links');
            if (!el || !extData) return;
            
            let html = '';
            
            // Instagram
            if (extData.instagram_id) {
                html += `<a href="https://instagram.com/${extData.instagram_id}" target="_blank" class="person-social-btn psb-instagram">
                    <i class="fa-brands fa-instagram"></i> Instagram
                </a>`;
            }
            // Twitter/X
            if (extData.twitter_id) {
                html += `<a href="https://x.com/${extData.twitter_id}" target="_blank" class="person-social-btn psb-twitter">
                    <i class="fa-brands fa-x-twitter"></i> X
                </a>`;
            }
            // Facebook
            if (extData.facebook_id) {
                html += `<a href="https://facebook.com/${extData.facebook_id}" target="_blank" class="person-social-btn psb-facebook">
                    <i class="fa-brands fa-facebook"></i> Facebook
                </a>`;
            }
            // YouTube - TMDB doesn't have youtube directly but we can check
            if (extData.youtube_id) {
                html += `<a href="https://youtube.com/@${extData.youtube_id}" target="_blank" class="person-social-btn psb-youtube">
                    <i class="fa-brands fa-youtube"></i> YouTube
                </a>`;
            }
            // TikTok
            if (extData.tiktok_id) {
                html += `<a href="https://tiktok.com/@${extData.tiktok_id}" target="_blank" class="person-social-btn psb-tiktok">
                    <i class="fa-brands fa-tiktok"></i> TikTok
                </a>`;
            }
            // IMDB
            if (extData.imdb_id) {
                html += `<a href="https://imdb.com/name/${extData.imdb_id}" target="_blank" class="person-social-btn psb-imdb">
                    <i class="fa-solid fa-star"></i> IMDb
                </a>`;
            }
            
            el.innerHTML = html;
        }
        
        async function buildPersonAwards(imdbId, name) {
            if (!imdbId) return;
            const awardsBox = document.getElementById('pb-awards-box');
            const awardsList = document.getElementById('pb-awards-list');
            if (!awardsBox || !awardsList) return;
            
            try {
                const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=f6dd47c8`);
                const data = await res.json();
                
                if (data && data.Awards && data.Awards !== 'N/A') {
                    const awardsText = data.Awards;
                    let itemsHTML = '';
                    
                    // Parse Oscar wins
                    const oscarMatch = awardsText.match(/Won\s+(\d+)\s+Oscar/i);
                    if (oscarMatch) itemsHTML += `<div class="person-award-item"><span class="person-award-icon">🏆</span><span>${oscarMatch[1]} Oscar${oscarMatch[1]>1?'s':''} Won</span></div>`;
                    
                    // Parse Emmy wins
                    const emmyWin = awardsText.match(/Won\s+(\d+)\s+Primetime Emmy/i) || awardsText.match(/Won\s+(\d+)\s+Emmy/i);
                    if (emmyWin) itemsHTML += `<div class="person-award-item"><span class="person-award-icon">🏆</span><span>${emmyWin[1]} Emmy Award${emmyWin[1]>1?'s':''} Won</span></div>`;
                    
                    // Parse Golden Globe wins
                    const ggWin = awardsText.match(/Won\s+(\d+)\s+Golden Globe/i);
                    if (ggWin) itemsHTML += `<div class="person-award-item"><span class="person-award-icon">🌟</span><span>${ggWin[1]} Golden Globe${ggWin[1]>1?'s':''} Won</span></div>`;
                    
                    // Total wins & nominations
                    const winsMatch = awardsText.match(/(\d+)\s+win/i);
                    const nomsMatch = awardsText.match(/(\d+)\s+nomination/i);
                    if (winsMatch) {
                        const w = winsMatch[1]; const n = nomsMatch ? nomsMatch[1] : 0;
                        itemsHTML += `<div class="person-award-item"><span class="person-award-icon">🎖️</span><span>${w} ${LANG==='fa'?'جایزه':'wins'} ${n?'& '+n+' '+(LANG==='fa'?'نامزدی':'nominations'):''}</span></div>`;
                    }
                    
                    if (itemsHTML) {
                        awardsList.innerHTML = itemsHTML;
                        awardsBox.style.display = 'block';
                    }
                }
            } catch(e) {}
        }
        // =================== END PERSON SOCIAL ===================

        // =================== FLOATING CLOSE - MODAL SCROLL ===================
        // Make floating close visible when scrolling modal
        const modalEl = document.getElementById('modal');
        if (modalEl) {
            modalEl.addEventListener('scroll', function() {
                const floatingClose = document.getElementById('modal-floating-close');
                const staticClose = document.getElementById('modal-close-btn');
                if (floatingClose) {
                    // Show floating when scrolled down, hide when at top
                    floatingClose.style.display = this.scrollTop > 80 ? 'flex' : 'none';
                }
                // SCROLL PROGRESS BAR for modal
                const scrollTop = this.scrollTop;
                const scrollHeight = this.scrollHeight - this.clientHeight;
                const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
                document.getElementById('scroll-progress-bar').style.width = progress + '%';
            });
        }
        // Initially hide floating close
        document.addEventListener('DOMContentLoaded', () => {
            const fc = document.getElementById('modal-floating-close');
            if (fc) fc.style.display = 'none';
        });
        // =================== END FLOATING CLOSE ===================

        // =================== BROADCAST BTN LABEL LANG UPDATE ===================
        // (handled inline in applyLang below)
        // =================== END BROADCAST LANG ===================

        // ================== NEW FEATURES v13 ==================
        
        // ---- 1. HAPTIC FEEDBACK ----
        function haptic(ms = 15) {
            if (navigator.vibrate) navigator.vibrate(ms);
        }
        // Patch all card clicks for haptic
        document.addEventListener('click', function(e) {
            const card = e.target.closest('.card, .company-card, .actor-card, .mood-btn, .srv-btn');
            if (card) haptic(15);
        });
        
        // ---- 2. PULL TO REFRESH ----
        let pullStartY = 0;
        let pullDist = 0;
        let isPulling = false;
        const ptr = document.getElementById('pull-to-refresh');
        
        document.addEventListener('touchstart', function(e) {
            if (document.getElementById('home-tab').classList.contains('active') && window.scrollY === 0) {
                pullStartY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            if (!isPulling) return;
            pullDist = e.touches[0].clientY - pullStartY;
            if (pullDist > 20) {
                ptr.classList.add('visible');
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function() {
            if (!isPulling) return;
            if (pullDist > 60) {
                renderHome();
                setTimeout(() => ptr.classList.remove('visible'), 1000);
            } else {
                ptr.classList.remove('visible');
            }
            isPulling = false;
            pullDist = 0;
        }, { passive: true });
        
        // ---- 3. MOOD PICKER ----
        async function pickMood(mood, genreId) {
            // Toggle active
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
            event.currentTarget.classList.add('active');
            haptic(20);
            
            const moodRow = document.getElementById('mood-row');
            const moodResults = document.getElementById('mood-results');
            moodRow.innerHTML = '<div style="padding:15px;color:#888;font-size:12px;"><i class="fa-solid fa-spinner fa-spin"></i> در حال یافتن پیشنهاد...</div>';
            moodResults.style.display = 'block';
            
            try {
                const d = await getData(`discover/movie?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=500&page=${Math.ceil(Math.random()*5)}`);
                moodRow.innerHTML = '';
                if (d.results) {
                    // Shuffle and pick 10
                    const shuffled = d.results.sort(() => 0.5 - Math.random()).slice(0, 10);
                    shuffled.forEach(m => {
                        if (m.poster_path) moodRow.innerHTML += makeCard(m, 'movie');
                    });
                }
            } catch(e) {
                moodRow.innerHTML = '<div style="padding:15px;color:#888;">خطا در بارگذاری</div>';
            }
        }
        
        // ---- 4. RANDOM MOVIE BUTTON ----
        async function pickRandomMovie() {
            haptic(30);
            const btn = document.getElementById('random-movie-btn');
            const iconEl = btn ? btn.querySelector('.random-movie-btn-icon-wrap i') : null;
            const titleEl = document.getElementById('txt-random-btn');
            const subEl = document.getElementById('txt-random-sub');
            const oldTitle = titleEl ? titleEl.innerText : '';
            const oldSub = subEl ? subEl.innerText : '';

            const faIcons = ['fa-shuffle', 'fa-film', 'fa-clapperboard', 'fa-star', 'fa-ticket', 'fa-fire'];
            let count = 0;
            const spinInterval = setInterval(() => {
                if (iconEl) iconEl.className = 'fa-solid ' + faIcons[count % faIcons.length];
                count++;
            }, 90);

            if (titleEl) titleEl.innerText = LANG === 'fa' ? 'در حال انتخاب از Curator\'s Pick...' : "Picking from Curator's Pick...";
            if (subEl) subEl.innerText = LANG === 'fa' ? 'فقط از لیست اختصاصی خودت انتخاب می‌شود' : 'Only your curated list is used';

            try {
                const shuffled = [...CURATOR_PICKS].sort(() => 0.5 - Math.random());
                for (let i = 0; i < shuffled.length; i++) {
                    const item = normalizeCuratorPick(shuffled[i]);
                    const movie = await findCuratorMovie(item);
                    if (movie && isValidCuratorResolvedMovie(movie, item)) {
                        const lastPickId = sessionStorage.getItem('fn_last_curator_pick_id');
                        if (lastPickId && String(movie.id) === String(lastPickId) && shuffled.length > 1 && i < shuffled.length - 1) {
                            continue;
                        }
                        sessionStorage.setItem('fn_last_curator_pick_id', String(movie.id));
                        clearInterval(spinInterval);
                        if (iconEl) iconEl.className = 'fa-solid fa-clapperboard';
                        if (titleEl) titleEl.innerText = oldTitle;
                        if (subEl) subEl.innerText = oldSub;
                        openDetail(movie.id, 'movie');
                        return;
                    }
                }
                throw new Error('No valid curator movie found');
            } catch(e) {
                console.error('Curator random pick failed:', e);
                clearInterval(spinInterval);
                if (iconEl) iconEl.className = 'fa-solid fa-shuffle';
                if (titleEl) titleEl.innerText = oldTitle;
                if (subEl) subEl.innerText = LANG === 'fa' ? 'فعلاً اثر معتبر بدون NR پیدا نشد؛ دوباره امتحان کن' : 'No valid non-NR pick found. Try again.';
                setTimeout(() => { if (subEl) subEl.innerText = oldSub; }, 2500);
            }
        }

        // ── Floating "Pick a Movie for me" button (Home tab only) ──────────
        // Same behavior/source as pickRandomMovie() (random pick from
        // Curator's Pick), adapted to the small circular floating button:
        // ripple + bounce on tap, spinning icon while searching.
        async function pickRandomMovieFab() {
            haptic(30);
            const fab = document.getElementById('fab-pick-movie');
            const iconEl = document.getElementById('fab-pick-icon');
            const textEl = document.getElementById('fab-pick-text');
            if (!fab || !iconEl || !textEl) return;

            // Click ripple + bounce animation
            const ripple = document.createElement('div');
            ripple.className = 'fab-ripple';
            fab.appendChild(ripple);
            setTimeout(() => ripple.remove(), 650);
            fab.classList.remove('fab-pulse-click'); void fab.offsetWidth; fab.classList.add('fab-pulse-click');

            const oldText = textEl.innerText;
            const loadingText = LANG === 'fa' ? 'در حال انتخاب...' : 'Picking...';
            textEl.innerText = loadingText;
            fab.classList.add('fab-spinning');

            try {
                const shuffled = [...CURATOR_PICKS].sort(() => 0.5 - Math.random());
                for (let i = 0; i < shuffled.length; i++) {
                    const item = normalizeCuratorPick(shuffled[i]);
                    const movie = await findCuratorMovie(item);
                    if (movie && isValidCuratorResolvedMovie(movie, item)) {
                        const lastPickId = sessionStorage.getItem('fn_last_curator_pick_id');
                        if (lastPickId && String(movie.id) === String(lastPickId) && shuffled.length > 1 && i < shuffled.length - 1) {
                            continue;
                        }
                        sessionStorage.setItem('fn_last_curator_pick_id', String(movie.id));
                        fab.classList.remove('fab-spinning');
                        textEl.innerText = oldText;
                        openDetail(movie.id, 'movie');
                        return;
                    }
                }
                throw new Error('No valid curator movie found');
            } catch(e) {
                console.error('Curator random pick failed:', e);
                fab.classList.remove('fab-spinning');
                textEl.innerText = LANG === 'fa' ? 'دوباره امتحان کن' : 'Try again';
                setTimeout(() => { textEl.innerText = oldText; }, 2200);
            }
        }
;
