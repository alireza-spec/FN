async function runDefaultDiscovery(container) {
            const TARGET = 18; // items per load
            const letterFilter = window.currentLetterFilter;
            const hasLetterFilter = letterFilter && letterFilter !== '';
            let allCollected = []; // Collect all items first for random sort

            // --- Collect items from both phases ---
            
            // Phase 1: Priority items
            if (!discDefaultPriorityDone && discDefaultPriorityIds.length > 0) {
                while (discDefaultPriorityIndex < discDefaultPriorityIds.length && allCollected.length < TARGET * 3) {
                    const tmdbId = discDefaultPriorityIds[discDefaultPriorityIndex];
                    discDefaultPriorityIndex++;
                    
                    if (discDefaultSeenIds.has(tmdbId) || discShownIds.has(parseInt(tmdbId))) continue;
                    
                    discDefaultSeenIds.add(tmdbId);
                    try {
                        const d = await getData(`${discType}/${tmdbId}`);
                        if (d && d.id && d.poster_path) {
                            if (discType === 'tv' && isTVShowExcluded(d)) continue;
                            
                            const title = (d.title || d.name || '').trim();
                            if (hasLetterFilter && !matchesLetterFilter(title, letterFilter)) {
                                continue;
                            }
                            
                            allCollected.push(d);
                        }
                    } catch(e) {}
                    if (allCollected.length % 5 === 0) await new Promise(r => setTimeout(r, 50));
                }
                if (discDefaultPriorityIndex >= discDefaultPriorityIds.length) {
                    discDefaultPriorityDone = true;
                }
            } else if (!discDefaultPriorityDone) {
                discDefaultPriorityDone = true;
            }

            // Phase 2: Normal discover pages
            const maxPages = hasLetterFilter ? 30 : 10;
            let pageAttempts = 0;
            
            while (allCollected.length < TARGET * 3 && pageAttempts < maxPages) {
                pageAttempts++;
                const d = await getData(`${discQuery}&page=${discPage}`);
                if (!d || !d.results || d.results.length === 0) {
                    discPage++;
                    continue;
                }
                
                for (const m of d.results) {
                    const idStr = String(m.id);
                    
                    if (discDefaultSeenIds.has(idStr) || discShownIds.has(m.id)) continue;
                    if (discType === 'tv' && isTVShowExcluded(m)) continue;
                    
                    const title = (m.title || m.name || '').trim();
                    if (hasLetterFilter && !matchesLetterFilter(title, letterFilter)) {
                        continue;
                    }
                    
                    discDefaultSeenIds.add(idStr);
                    allCollected.push(m);
                    if (allCollected.length >= TARGET * 3) break;
                }
                
                discPage++;
                
                if (pageAttempts % 5 === 0) {
                    await new Promise(r => setTimeout(r, 100));
                }
            }
            
            // Remove loading indicator
            const loadingEl = document.getElementById('discovery-loading');
            if (loadingEl) loadingEl.remove();
            
            // Apply random sort if enabled
            if (window.useRandomSort && allCollected.length > 0) {
                // Fisher-Yates shuffle
                for (let i = allCollected.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allCollected[i], allCollected[j]] = [allCollected[j], allCollected[i]];
                }
            }
            
            // Take TARGET items and render
            const itemsToShow = allCollected.slice(0, TARGET);
            itemsToShow.forEach(m => {
                discShownIds.add(m.id);
                container.innerHTML += makeCard(m, discType);
            });
            
            // If no results
            if (itemsToShow.length === 0 && container.children.length === 0) {
                container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#666;"><i class="fa-solid fa-film" style="font-size:40px;margin-bottom:15px;display:block;"></i><p>${LANG === 'fa' ? 'نتیجه‌ای یافت نشد. فیلترها را تغییر دهید.' : 'No results found. Try different filters.'}</p></div>`;
            }
        }
        
        // --- SEARCH / TRENDING ACTORS (LEGENDS) ---
        async function loadTrendingActors() {
            const d = await getData('person/popular');
            const maleEl = document.getElementById('trend-male');
            const femaleEl = document.getElementById('trend-female');
            const directorEl = document.getElementById('trend-director');
            
            maleEl.innerHTML = ''; femaleEl.innerHTML = ''; directorEl.innerHTML = '';
            
            if (d.results) {
                const males = d.results.filter(p => p.gender === 2 && p.profile_path);
                const females = d.results.filter(p => p.gender === 1 && p.profile_path);
                
                males.slice(0, 10).forEach(p => maleEl.innerHTML += makePersonCard(p));
                females.slice(0, 10).forEach(p => femaleEl.innerHTML += makePersonCard(p));
                
                const famousDirectors = [
                    525, 138, 1032, 488, 7467, 2710, 608, 2636, 28974, 1702
                ];
                const promises = famousDirectors.map(id => getData(`person/${id}`));
                const directors = await Promise.all(promises);
                directors.forEach(p => {
                    if(p && p.profile_path) {
                        p.known_for_department = 'Directing'; 
                        directorEl.innerHTML += makePersonCard(p);
                    }
                });
            }
            // Load companies section
            loadCompaniesSection();
            loadFeaturedCollections();
        }
        // Search History Management
        const SEARCH_HISTORY_KEY = 'search_history';
        let searchHistory = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
        let searchTimeout = null;
        
        function saveSearchHistory(query) {
            if (!query || query.trim().length < 2) return;
            
            // Remove if already exists
            searchHistory = searchHistory.filter(h => h.toLowerCase() !== query.toLowerCase());
            
            // Add to beginning
            searchHistory.unshift(query.trim());
            
            // Keep only last 10
            searchHistory = searchHistory.slice(0, 10);
            
            // Save to localStorage
            localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
        }
        
        function renderSearchHistory() {
            const dropdown = document.getElementById('search-history-dropdown');
            const input = document.getElementById('search-input');
            
            if (searchHistory.length === 0 || input.value.trim().length > 0) {
                dropdown.style.display = 'none';
                return;
            }
            
            let html = '';
            searchHistory.forEach(term => {
                html += `
                    <div class="search-history-item" onclick="selectFromHistory('${term.replace(/'/g, "\\'")}')">
                        <i class="fa-solid fa-clock-rotate-left search-history-icon"></i>
                        <span class="search-history-text">${term}</span>
                    </div>
                `;
            });
            
            html += `
                <div class="search-history-clear" onclick="clearSearchHistory()">
                    <i class="fa-solid fa-trash"></i> ${LANG === 'fa' ? 'پاک کردن تاریخچه' : 'Clear History'}
                </div>
            `;
            
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';
        }
        
        function selectFromHistory(term) {
            const input = document.getElementById('search-input');
            input.value = term;
            document.getElementById('search-history-dropdown').style.display = 'none';
            doLiveSearch(term);
        }
        
        function clearSearchHistory() {
            searchHistory = [];
            localStorage.removeItem(SEARCH_HISTORY_KEY);
            document.getElementById('search-history-dropdown').style.display = 'none';
        }
        
        // Show history when input is focused and empty
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.addEventListener('focus', function() {
                    if (this.value.trim().length === 0) {
                        renderSearchHistory();
                    }
                });
                
                searchInput.addEventListener('blur', function() {
                    // Delay to allow clicking on history items
                    setTimeout(() => {
                        document.getElementById('search-history-dropdown').style.display = 'none';
                    }, 200);
                });
            }
        });
        
        async function doLiveSearch(q) {
            // Clear previous timeout
            if (searchTimeout) clearTimeout(searchTimeout);
            
            const msgEl = document.getElementById('search-message');
            const c = document.getElementById('search-results');
            const resultsSection = document.getElementById('search-results-section');
            const defaultSections = document.getElementById('default-sections');
            const historyDropdown = document.getElementById('search-history-dropdown');
            
            // Hide history dropdown when typing
            historyDropdown.style.display = 'none';
            
            // If empty, show default sections
            if(q.trim().length === 0) {
                resultsSection.style.display = 'none';
                defaultSections.style.display = 'block';
                c.innerHTML = '';
                msgEl.style.display = 'none';
                return;
            }
            
            // Show loading
            c.innerHTML = '';
            msgEl.style.display = 'block';
            msgEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + TEXTS[LANG].searchPh;
            resultsSection.style.display = 'block';
            defaultSections.style.display = 'none';
            
            // Debounce search
            searchTimeout = setTimeout(async () => {
                // Save to history only for searches with 2+ characters
                if (q.trim().length >= 2) {
                    saveSearchHistory(q.trim());
                }
                
                // Search with appropriate language - also search original language query
                const d = await getData(`search/multi?query=${encodeURIComponent(q)}`);
                // Also search in original language for non-Latin queries
                let dOrig = null;
                const hasNonLatin = /[^\x00-\x7F\u0600-\u06FF\u0660-\u0669 ]/.test(q);
                if (hasNonLatin) {
                    dOrig = await getData(`search/multi?query=${encodeURIComponent(q)}&language=en-US`);
                }
                
                c.innerHTML = '';
                
                // Merge dOrig results if available
                let allResults = (d.results || []);
                if (dOrig && dOrig.results) {
                    const existingIds = new Set(allResults.map(r => r.id));
                    dOrig.results.forEach(r => { if (!existingIds.has(r.id)) allResults.push(r); });
                }
                
                if (allResults.length > 0) {
                    // Sort results by smart relevance + popularity
                    const sorted = allResults.slice().sort((a, b) => {
                        const aTitle = (a.title || a.name || '').toLowerCase();
                        const bTitle = (b.title || b.name || '').toLowerCase();
                        const query = q.toLowerCase();
                        
                        // Smart score
                        const aSmartScore = smartSearchScore(aTitle, q);
                        const bSmartScore = smartSearchScore(bTitle, q);
                        if (aSmartScore !== bSmartScore) return bSmartScore - aSmartScore;
                        
                        // By popularity + vote_count weight
                        const aWeight = (a.popularity || 0) + (a.vote_count || 0) * 0.3;
                        const bWeight = (b.popularity || 0) + (b.vote_count || 0) * 0.3;
                        return bWeight - aWeight;
                    });
                    
                    // Render sorted results
                    sorted.forEach(m => {
                        // Fix media_type detection for person search
                        var mt = m.media_type;
                        if (!mt) {
                            if (modernSearchType === 'person') mt = 'person';
                            else if (m.first_air_date) mt = 'tv';
                            else if (m.profile_path && !m.poster_path) mt = 'person';
                            else mt = 'movie';
                        }
                        // Filter based on active search tab
                        if (modernSearchType === 'person' && mt !== 'person') return;
                        if (modernSearchType === 'movie' && mt !== 'movie') return;
                        if (modernSearchType === 'tv' && mt !== 'tv') return;
                        
                        if(mt === 'person') {
                            if(m.profile_path) {
                                c.innerHTML += makePersonCard(m);
                            }
                        } else if (mt === 'movie' || mt === 'tv') {
                            c.innerHTML += makeCard(m, mt);
                        }
                    });
                    msgEl.style.display = 'none';
                } else {
                    msgEl.innerText = TEXTS[LANG].noRes;
                    msgEl.style.display = 'block';
                }
            }, 300); // 300ms debounce
        }
        
        // =================== MODERN SEARCH ===================
        var modernSearchType = 'all';
        var modernSearchTimeout = null;
        var modernDropdownVisible = false;

        function setSearchType(type, btn) {
            modernSearchType = type;
            document.querySelectorAll('#search-type-tabs button').forEach(function(b) {
                b.style.background = '#1a1a1a';
                b.style.color = '#aaa';
                b.style.borderColor = '#333';
            });
            btn.style.background = 'var(--primary)';
            btn.style.color = 'white';
            btn.style.borderColor = 'rgba(229,9,20,0.6)';
            var v = document.getElementById('search-input').value.trim();
            if (v.length >= 1) doModernSearch(v);
        }

        function showSearchDropdown() {
            modernDropdownVisible = true;
            var v = document.getElementById('search-input').value.trim();
            if (v.length === 0) {
                // Show search history
                showSearchHistoryInDropdown();
            }
        }

        function hideSearchDropdownDelayed() {
            setTimeout(function() {
                var dropdown = document.getElementById('search-live-dropdown');
                if (dropdown) dropdown.style.display = 'none';
                modernDropdownVisible = false;
            }, 200);
        }

        function showSearchHistoryInDropdown() {
            var history = getSearchHistory();
            var dropdown = document.getElementById('search-live-dropdown');
            if (!dropdown) return;
            if (history.length === 0) { dropdown.style.display = 'none'; return; }
            var isFA = LANG === 'fa';
            var html = '<div style="padding:10px 14px;font-size:11px;color:#666;border-bottom:1px solid #2a2a2a;">' + (isFA ? '🕐 جستجوهای اخیر' : '🕐 Recent Searches') + '</div>';
            history.slice(0, 5).forEach(function(h) {
                html += '<div onclick="selectSearchHistory(\'' + h.replace(/'/g,'\\\'') + '\')" style="padding:12px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #222;cursor:pointer;transition:background 0.1s;" onmouseenter="this.style.background=\'#222\'" onmouseleave="this.style.background=\'transparent\'">'
                    + '<i class="fa-solid fa-clock" style="color:#555;font-size:13px;flex-shrink:0;"></i>'
                    + '<span style="flex:1;color:#ccc;font-size:13px;">' + h + '</span>'
                    + '</div>';
            });
            html += '<div onclick="clearSearchHistory()" style="padding:10px 14px;text-align:center;color:#555;font-size:11px;cursor:pointer;" onmouseenter="this.style.color=\'#E50914\'" onmouseleave="this.style.color=\'#555\'">' + (isFA ? 'پاک کردن تاریخچه' : 'Clear History') + '</div>';
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';
        }

        function selectSearchHistory(q) {
            var input = document.getElementById('search-input');
            input.value = q;
            doModernSearch(q);
        }

        function clearModernSearch() {
            var input = document.getElementById('search-input');
            input.value = '';
            document.getElementById('search-clear-btn').style.display = 'none';
            document.getElementById('search-live-dropdown').style.display = 'none';
            document.getElementById('search-results-section').style.display = 'none';
            document.getElementById('default-sections').style.display = 'block';
        }

        // ---- SMART SEARCH BOOST TABLE ----
        // Maps short/partial queries to well-known titles for intelligent ordering
        var SMART_SEARCH_BOOSTS = [
            {q:'brea', title:'Breaking Bad', score:100},
            {q:'break', title:'Breaking Bad', score:100},
            {q:'game', title:'Game of Thrones', score:95},
            {q:'got', title:'Game of Thrones', score:95},
            {q:'walk', title:'The Walking Dead', score:90},
            {q:'stran', title:'Stranger Things', score:90},
            {q:'friend', title:'Friends', score:90},
            {q:'narco', title:'Narcos', score:90},
            {q:'ozark', title:'Ozark', score:90},
            {q:'sherlock', title:'Sherlock', score:90},
            {q:'witcher', title:'The Witcher', score:90},
            {q:'mandal', title:'The Mandalorian', score:90},
            {q:'dark', title:'Dark', score:85},
            {q:'money', title:'Money Heist', score:85},
            {q:'squid', title:'Squid Game', score:95},
            {q:'avatar', title:'Avatar', score:90},
            {q:'oppenheimer', title:'Oppenheimer', score:95},
            {q:'barbie', title:'Barbie', score:90},
            {q:'inter', title:'Interstellar', score:90},
            {q:'inception', title:'Inception', score:95},
            {q:'matrix', title:'The Matrix', score:95},
            {q:'godfather', title:'The Godfather', score:95},
            {q:'shawshank', title:'The Shawshank Redemption', score:95},
            {q:'schindler', title:"Schindler's List", score:95},
            {q:'pulp', title:'Pulp Fiction', score:95},
            {q:'fight', title:'Fight Club', score:90},
            {q:'forrest', title:'Forrest Gump', score:95},
            {q:'goodfellas', title:'Goodfellas', score:95},
            {q:'silence', title:'The Silence of the Lambs', score:90},
            {q:'lord', title:'The Lord of the Rings', score:90},
            {q:'back to', title:'Back to the Future', score:90},
            {q:'joker', title:'Joker', score:90},
            {q:'parasite', title:'Parasite', score:95},
            {q:'wanda', title:'WandaVision', score:80},
            {q:'loki', title:'Loki', score:80},
            {q:'better', title:'Better Call Saul', score:85},
            {q:'sopranos', title:'The Sopranos', score:90},
            {q:'wire', title:'The Wire', score:85},
            {q:'peaky', title:'Peaky Blinders', score:90},
        ];
        
        function smartSearchScore(title, query) {
            var qLow = query.toLowerCase();
            var tLow = (title||'').toLowerCase();
            // Exact match
            if (tLow === qLow) return 1000;
            // Starts with
            if (tLow.startsWith(qLow)) return 500;
            // Check boost table
            for (var i=0; i<SMART_SEARCH_BOOSTS.length; i++) {
                var b = SMART_SEARCH_BOOSTS[i];
                if (qLow.startsWith(b.q) && tLow.includes(b.title.toLowerCase())) return b.score;
                if (b.q.startsWith(qLow) && qLow.length >= 3 && tLow.includes(b.title.toLowerCase())) return b.score - 10;
            }
            return 0;
        }

        async function doModernSearch(q) {
            if (modernSearchTimeout) clearTimeout(modernSearchTimeout);
            
            var clearBtn = document.getElementById('search-clear-btn');
            if (clearBtn) clearBtn.style.display = q.length > 0 ? 'block' : 'none';
            
            var dropdown = document.getElementById('search-live-dropdown');
            var resultsSection = document.getElementById('search-results-section');
            var defaultSections = document.getElementById('default-sections');
            
            if (q.trim().length === 0) {
                if (dropdown) dropdown.style.display = 'none';
                resultsSection.style.display = 'none';
                defaultSections.style.display = 'block';
                showSearchHistoryInDropdown();
                return;
            }
            
            defaultSections.style.display = 'none';
            
            // Show loading in dropdown
            if (dropdown) {
                dropdown.style.display = 'block';
                dropdown.innerHTML = '<div style="padding:20px;text-align:center;color:#555;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary);font-size:16px;"></i></div>';
            }
            
            modernSearchTimeout = setTimeout(async function() {
                if (q.trim().length >= 2) saveSearchHistory(q.trim());
                
                try {
                    var typeParam = modernSearchType !== 'all' ? ('search/' + modernSearchType) : 'search/multi';
                    var d = await getData(typeParam + '?query=' + encodeURIComponent(q));
                    var allResults = (d && d.results) ? d.results : [];
                    
                    // Also search in English if non-Latin
                    if (modernSearchType === 'all' && /[^\x00-\x7F\u0600-\u06FF]/.test(q)) {
                        try {
                            var dEn = await getData('search/multi?query=' + encodeURIComponent(q) + '&language=en-US');
                            if (dEn && dEn.results) {
                                var existingIds = new Set(allResults.map(function(r) { return r.id; }));
                                dEn.results.forEach(function(r) { if (!existingIds.has(r.id)) allResults.push(r); });
                            }
                        } catch(e2) {}
                    }
                    
                    // Sort by smart relevance + popularity
                    var qLow = q.toLowerCase();
                    allResults.sort(function(a, b) {
                        var aT = (a.title || a.name || '').toLowerCase();
                        var bT = (b.title || b.name || '').toLowerCase();
                        var aSmartScore = smartSearchScore(aT, q);
                        var bSmartScore = smartSearchScore(bT, q);
                        if (aSmartScore !== bSmartScore) return bSmartScore - aSmartScore;
                        // Known important titles get big boost
                        var aPop = (a.popularity || 0);
                        var bPop = (b.popularity || 0);
                        var aVotes = (a.vote_count || 0);
                        var bVotes = (b.vote_count || 0);
                        // Combined relevance: popularity + vote_count weight
                        var aWeight = aPop + aVotes * 0.5;
                        var bWeight = bPop + bVotes * 0.5;
                        // For very short queries (1-2 chars), strongly penalize obscure results
                        if (q.trim().length <= 2) {
                            if (aVotes < 500 && bVotes >= 500) return 1;
                            if (bVotes < 500 && aVotes >= 500) return -1;
                        }
                        return bWeight - aWeight;
                    });
                    
                    // Filter: for short queries, drop very obscure items from inline dropdown
                    var filteredResults = allResults;
                    if (q.trim().length <= 2) {
                        var popular = allResults.filter(function(r){ return (r.vote_count||0) >= 500 || (r.popularity||0) >= 10; });
                        filteredResults = popular.length > 0 ? popular : allResults.slice(0,5);
                    }
                    
                    renderModernDropdown(filteredResults.slice(0, 10), q, allResults);
                } catch(e) {
                    if (dropdown) dropdown.innerHTML = '<div style="padding:20px;text-align:center;color:#555;font-size:13px;">خطا در جستجو</div>';
                }
            }, 250);
        }

        function renderModernDropdown(results, query, allResults) {
            var dropdown = document.getElementById('search-live-dropdown');
            if (!dropdown) return;
            var isFA = LANG === 'fa';
            
            // Filter results based on active search type tab
            // When searching with search/person, results don't have media_type — force 'person'
            results = results.map(function(item) {
                var mt = item.media_type;
                if (!mt) {
                    if (modernSearchType === 'person') mt = 'person';
                    else if (item.first_air_date) mt = 'tv';
                    else if (item.profile_path && !item.poster_path) mt = 'person';
                    else mt = 'movie';
                    item = Object.assign({}, item, {media_type: mt});
                }
                return item;
            });
            
            if (modernSearchType !== 'all') {
                results = results.filter(function(item) {
                    var mt = item.media_type;
                    if (modernSearchType === 'person') return mt === 'person';
                    if (modernSearchType === 'movie') return mt === 'movie';
                    if (modernSearchType === 'tv') return mt === 'tv';
                    return true;
                });
            }
            
            if (!results || results.length === 0) {
                dropdown.innerHTML = '<div style="padding:24px;text-align:center;color:#555;font-size:13px;">'
                    + '<i class="fa-solid fa-search" style="font-size:24px;display:block;margin-bottom:10px;color:#333;"></i>'
                    + (isFA ? 'نتیجه‌ای یافت نشد' : 'No results found')
                    + '</div>';
                return;
            }
            
            var html = '';
            
            results.forEach(function(item) {
                var mediaType = item.media_type || (item.first_air_date ? 'tv' : (item.profile_path && !item.poster_path ? 'person' : 'movie'));
                var title = item.title || item.name || '';
                var originalTitle = item.original_title || item.original_name || '';
                var year = ((item.release_date || item.first_air_date || '')).split('-')[0];
                var poster = item.poster_path ? ('https://family-night-api.alirezadoe8.workers.dev/img/w92' + item.poster_path) : (item.profile_path ? ('https://family-night-api.alirezadoe8.workers.dev/img/w92' + item.profile_path) : '');
                var rating = item.vote_average ? item.vote_average.toFixed(1) : '';
                var runtime = '';
                
                // Type label - for persons, show actual role
                var typeLabel = '';
                var typeColor = '';
                var typeIcon = '';
                if (mediaType === 'movie') {
                    typeLabel = isFA ? 'فیلم' : 'Movie';
                    typeColor = '#E50914';
                    typeIcon = '🎬';
                } else if (mediaType === 'tv') {
                    typeLabel = isFA ? 'سریال' : 'Series';
                    typeColor = '#0099ff';
                    typeIcon = '📺';
                } else if (mediaType === 'person') {
                    // Determine if actor, director, or both
                    var dept = item.known_for_department || '';
                    var isActor = dept === 'Acting' || (item.known_for && item.known_for.length > 0 && !dept);
                    var isDirector = dept === 'Directing';
                    if (isDirector) {
                        typeLabel = isFA ? 'کارگردان' : 'Director';
                    } else if (isActor && isDirector) {
                        typeLabel = isFA ? 'بازیگر/کارگردان' : 'Actor/Director';
                    } else {
                        // Check if they appear in known_for as director
                        var knownDepts = (item.known_for || []).map(function(k){ return k.media_type; });
                        typeLabel = isFA ? 'بازیگر/کارگردان' : 'Actor/Director';
                        if (dept === 'Acting') typeLabel = isFA ? 'بازیگر' : 'Actor';
                        else if (dept === 'Directing') typeLabel = isFA ? 'کارگردان' : 'Director';
                        else if (dept === 'Production') typeLabel = isFA ? 'تهیه‌کننده' : 'Producer';
                        else typeLabel = isFA ? 'بازیگر/کارگردان' : 'Actor/Director';
                    }
                    typeColor = '#f5c518';
                    typeIcon = '👤';
                }
                
                // Genre (use first genre id mapping)
                var genreNames = {'28':'Action','12':'Adventure','16':'Animation','35':'Comedy','80':'Crime','99':'Documentary','18':'Drama','14':'Fantasy','27':'Horror','10749':'Romance','878':'Sci-Fi','53':'Thriller','10752':'War','37':'Western'};
                var genreNamesFA = {'28':'اکشن','12':'ماجراجویی','16':'انیمیشن','35':'کمدی','80':'جنایی','99':'مستند','18':'درام','14':'فانتزی','27':'ترسناک','10749':'عاشقانه','878':'علمی‌تخیلی','53':'هیجانی','10752':'جنگی','37':'وسترن'};
                var genreLabels = isFA ? genreNamesFA : genreNames;
                var genres = '';
                if (item.genre_ids && item.genre_ids.length > 0) {
                    genres = item.genre_ids.slice(0, 2).map(function(g) { return genreLabels[g] || ''; }).filter(Boolean).join(' · ');
                }
                
                var onclick = mediaType === 'person' 
                    ? 'document.getElementById(\'search-live-dropdown\').style.display=\'none\';openDetail(' + item.id + ',\'person_works\')'
                    : 'document.getElementById(\'search-live-dropdown\').style.display=\'none\';openDetail(' + item.id + ',\'' + mediaType + '\')';
                
                // Person shows differently (circular avatar)
                var posterHtml;
                if (mediaType === 'person') {
                    posterHtml = '<div style="flex-shrink:0;width:46px;height:46px;border-radius:50%;overflow:hidden;background:#1e1e1e;border:2px solid ' + typeColor + '44;">'
                        + (poster ? '<img src="' + poster + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;">' + typeIcon + '</div>')
                        + '</div>';
                } else {
                    posterHtml = '<div style="flex-shrink:0;width:46px;height:66px;border-radius:7px;overflow:hidden;background:#1e1e1e;position:relative;">'
                        + (poster ? '<img src="' + poster + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;">' + typeIcon + '</div>')
                        + '</div>';
                }
                
                html += '<div onclick="' + onclick + '" style="display:flex;align-items:center;gap:12px;padding:11px 14px;border-bottom:1px solid #222;cursor:pointer;transition:background 0.1s;" onmouseenter="this.style.background=\'#222\'" onmouseleave="this.style.background=\'transparent\'">'
                    // Poster/Avatar
                    + posterHtml
                    // Info
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:3px;">'
                    + '<div style="font-size:14px;color:#eee;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + title + '</div>'
                    + '</div>'
                    // Secondary title (if different from primary)
                    + (originalTitle && originalTitle !== title ? '<div style="font-size:11px;color:#666;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + originalTitle + '</div>' : '')
                    // Meta row
                    + '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
                    + '<span style="font-size:10px;font-weight:700;color:' + typeColor + ';background:' + typeColor + '22;padding:2px 7px;border-radius:4px;">' + typeLabel + '</span>'
                    + (year && mediaType !== 'person' ? '<span style="font-size:10px;color:#888;">' + year + '</span>' : '')
                    + (rating && mediaType !== 'person' ? '<span style="display:flex;align-items:center;gap:3px;font-size:10px;color:#f5c518;font-weight:700;"><span style="font-size:8px;font-weight:800;background:#f5c518;color:#000;padding:1px 3px;border-radius:2px;">IMDb</span>' + rating + '</span>' : '')
                    + (genres ? '<span style="font-size:10px;color:#666;">' + genres + '</span>' : '')
                    + '</div>'
                    + '</div>'
                    // Arrow
                    + '<i class="fa-solid fa-chevron-left" style="color:#444;font-size:11px;flex-shrink:0;"></i>'
                    + '</div>';
            });
            
            // "See all results" button
            html += '<div onclick="showAllSearchResults(\'' + query.replace(/'/g,'\\\'') + '\')" style="padding:12px;text-align:center;color:var(--primary);font-size:13px;font-weight:700;cursor:pointer;border-top:1px solid #2a2a2a;" onmouseenter="this.style.background=\'rgba(229,9,20,0.05)\'" onmouseleave="this.style.background=\'transparent\'">'
                + (isFA ? '🔍 نمایش همه نتایج' : '🔍 View All Results')
                + '</div>';
            
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';
        }

        function showAllSearchResults(q) {
            var dropdown = document.getElementById('search-live-dropdown');
            if (dropdown) dropdown.style.display = 'none';
            doLiveSearch(q);
        }

        // Also hook doLiveSearch to work from search input for backwards compat
        // =================== END MODERN SEARCH ===================

        // --- GENERIC GRID ---
        function _ggEsc(v) { return String(v == null ? '' : v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
        function _ggText(v) { return String(v || '').trim(); }
        function _ggYear(m) { return (m && (m.release_date || m.first_air_date) || '').split('-')[0] || '—'; }
        function _ggTitle(m) { return _ggText(m && (m.title || m.name)) || (LANG === 'fa' ? 'بدون عنوان' : 'Untitled'); }
        function showGenericLoading() {
            const el = document.getElementById('gg-loading');
            const text = document.getElementById('gg-loading-text');
            if (text) text.textContent = LANG === 'fa' ? 'در حال بارگذاری آثار...' : 'Loading titles...';
            if (el) el.style.display = 'flex';
        }
        function hideGenericLoading() {
            const el = document.getElementById('gg-loading');
            if (el) el.style.display = 'none';
        }
        async function _ggListCard(m, type) {
            const itemType = m.media_type || type || (m.title ? 'movie' : 'tv');
            let d = m;
            try {
                const path = `${itemType}/${m.id}?append_to_response=credits`;
                const full = await getData(path);
                if (full && full.id) d = Object.assign({}, m, full);
            } catch (e) {}
            const credits = d.credits || {};
            const cast = (credits.cast || []).slice(0, 4).map(x => x.name).filter(Boolean).join(', ');
            const crew = (credits.crew || []).filter(x => x.job === 'Director').slice(0, 2).map(x => x.name).filter(Boolean).join(', ');
            const no = LANG === 'fa' ? 'ذکر نشده' : 'Not available';
            const classicIranFlag = d.__iranClassic ? `<img src="${typeof IRAN_FLAG_URL !== 'undefined' ? IRAN_FLAG_URL : 'https://flagofiran.com/files/Flag_of_Iran.svg'}" alt="☀️" title="${LANG==='fa' ? 'ایران قدیم' : 'Historic Iran'}" style="width:18px;height:12px;object-fit:cover;border-radius:2px;vertical-align:1px;margin-inline-end:5px;">` : '';
            const classicIranTitle = classicIranFlag + _ggEsc(_ggTitle(d));
            const labels = LANG === 'fa'
                ? {cast:'بازیگران', director:'کارگردان', overview:'خلاصه داستان'}
                : {cast:'Cast', director:'Director', overview:'Overview'};
            const overview = _ggText(d.overview) || no;
            const ggSaved = typeof watchlist !== 'undefined' && Array.isArray(watchlist) && watchlist.some(w => String(w.id) === String(d.id) && String(w.type || 'movie') === String(itemType));
            const ggFavorite = typeof favorites !== 'undefined' && Array.isArray(favorites) && favorites.some(f => String(f.id) === String(d.id) && String(f.type || 'movie') === String(itemType));
            const ggShared = isGenericShared(d.id, itemType);
            return `<div class="gg-list-card" onclick="openDetail(${Number(d.id) || 0}, '${_ggEsc(itemType)}')">\n` +
                `<button type="button" class="gg-list-favorite${ggFavorite ? ' saved' : ''}" data-id="${Number(d.id) || 0}" data-type="${_ggEsc(itemType)}" data-title="${_ggEsc(_ggTitle(d))}" data-name="${_ggEsc(d.name || d.title || '')}" data-poster="${_ggEsc(d.poster_path || '')}" data-rating="${_ggEsc(d.vote_average || '')}" data-release="${_ggEsc(d.release_date || '')}" data-first-air="${_ggEsc(d.first_air_date || '')}" aria-label="${LANG === 'fa' ? 'افزودن به علاقه‌مندی‌ها' : 'Add to favorites'}" onclick="toggleGenericFavorite(event, this)"><i class="${ggFavorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i></button>\n` +
                `<button type="button" class="gg-list-share${ggShared ? ' shared' : ''}" data-id="${Number(d.id) || 0}" data-type="${_ggEsc(itemType)}" data-title="${_ggEsc(_ggTitle(d))}" data-poster="${_ggEsc(d.poster_path || '')}" aria-label="${LANG === 'fa' ? 'اشتراک‌گذاری' : 'Share'}" onclick="shareGenericMedia(event, this)"><i class="fa-solid fa-share-nodes"></i></button>\n` +                `<button type="button" class="gg-list-watchparty" data-id="${Number(d.id) || 0}" data-type="${_ggEsc(itemType)}" data-title="${_ggEsc(_ggTitle(d))}" aria-label="${LANG === 'fa' ? 'واچ پارتی' : 'Watch Party'}" onclick="FNWatchParty.startListWatchParty(event, this)"><i class="fa-solid fa-users"></i></button>\n` +                `<button type="button" class="gg-list-watchlater${ggSaved ? ' saved' : ''}" data-id="${Number(d.id) || 0}" data-type="${_ggEsc(itemType)}" data-title="${_ggEsc(_ggTitle(d))}" data-name="${_ggEsc(d.name || d.title || '')}" data-poster="${_ggEsc(d.poster_path || '')}" data-rating="${_ggEsc(d.vote_average || '')}" data-release="${_ggEsc(d.release_date || '')}" data-first-air="${_ggEsc(d.first_air_date || '')}" aria-label="${LANG === 'fa' ? 'ذخیره برای بعداً' : 'Save for Watch Later'}" onclick="toggleGenericWatchlist(event, this)"><i class="${ggSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i></button>\n` +
                `<img class="gg-list-poster" src="${d.poster_path ? IMG + d.poster_path : ''}" loading="lazy" alt="${_ggEsc(_ggTitle(d))}">\n` +
                `<div class="gg-list-info"><div class="gg-list-title">${classicIranTitle}</div>` +
                `<div class="gg-list-meta"><span>${_ggEsc(_ggYear(d))}</span><span>★ ${d.vote_average ? Number(d.vote_average).toFixed(1) : 'NR'}</span></div>` +
                `<div class="gg-list-detail"><b>${labels.cast}:</b> ${_ggEsc(cast || no)}</div>` +
                `<div class="gg-list-detail"><b>${labels.director}:</b> ${_ggEsc(crew || no)}</div>` +
                `<div class="gg-list-overview"><b>${labels.overview}:</b> ${_ggEsc(overview)}</div></div></div>`;
        }
        function toggleGenericWatchlist(event, button) {
            if (event) { event.preventDefault(); event.stopPropagation(); }
            if (!button || typeof watchlist === 'undefined') return;
            const id = button.dataset.id;
            const type = button.dataset.type || 'movie';
            const idx = watchlist.findIndex(w => String(w.id) === String(id) && String(w.type || 'movie') === String(type));
            if (idx > -1) {
                watchlist.splice(idx, 1);
                button.classList.remove('saved');
                button.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
                if (typeof showToast === 'function') showToast(LANG === 'fa' ? 'از تماشای بعداً حذف شد' : 'Removed from Watch Later');
            } else {
                watchlist.unshift({
                    id: Number(id) || id, type: type,
                    title: button.dataset.title || '', name: button.dataset.name || button.dataset.title || '',
                    poster_path: button.dataset.poster || '', vote_average: Number(button.dataset.rating) || 0,
                    release_date: button.dataset.release || '', first_air_date: button.dataset.firstAir || '', savedAt: Date.now()
                });
                button.classList.add('saved');
                button.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
                if (typeof showToast === 'function') showToast(LANG === 'fa' ? 'برای تماشای بعداً ذخیره شد' : 'Saved to Watch Later');
            }
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
        }
        function toggleGenericFavorite(event, button) {
            if (event) { event.preventDefault(); event.stopPropagation(); }
            if (!button || typeof favorites === 'undefined' || !Array.isArray(favorites)) return;
            const id = button.dataset.id;
            const type = button.dataset.type || 'movie';
            const idx = favorites.findIndex(f => String(f.id) === String(id) && String(f.type || 'movie') === String(type));
            if (idx > -1) {
                favorites.splice(idx, 1);
                button.classList.remove('saved');
                button.innerHTML = '<i class="fa-regular fa-heart"></i>';
            } else {
                favorites.unshift({
                    id: Number(id) || id, type: type,
                    title: button.dataset.title || '', name: button.dataset.name || button.dataset.title || '',
                    poster_path: button.dataset.poster || '', vote_average: Number(button.dataset.rating) || 0,
                    release_date: button.dataset.release || '', first_air_date: button.dataset.firstAir || ''
                });
                button.classList.add('saved');
                button.innerHTML = '<i class="fa-solid fa-heart"></i>';
            }
            localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
        }
        const GENERIC_SHARED_KEY = 'fn_generic_shared_items_v1';
        const GENERIC_SHARE_DATA_CACHE = Object.create(null);
        function getGenericShared() {
            try { const x = JSON.parse(localStorage.getItem(GENERIC_SHARED_KEY) || '{}'); return x && typeof x === 'object' ? x : {}; } catch (e) { return {}; }
        }
        function genericShareId(id, type) { return String(type || 'movie') + ':' + String(id); }
        function isGenericShared(id, type) { return !!getGenericShared()[genericShareId(id, type)]; }
        async function shareGenericMedia(event, button) {
            if (event) { event.preventDefault(); event.stopPropagation(); }
            if (!button || button.dataset.sharing === '1') return;
            const id = button.dataset.id;
            const type = button.dataset.type || 'movie';
            // Lock immediately to prevent duplicate taps, API calls and canvas work.
            button.dataset.sharing = '1';
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.classList.add('shared');
            try {
                const shared = getGenericShared();
                shared[genericShareId(id, type)] = Date.now();
                localStorage.setItem(GENERIC_SHARED_KEY, JSON.stringify(shared));
            } catch (e) {}
            try {
                const key = genericShareId(id, type);
                let d = GENERIC_SHARE_DATA_CACHE[key];
                if (!d) {
                    d = await getData(`${type}/${id}?append_to_response=credits,external_ids`);
                    if (d) GENERIC_SHARE_DATA_CACHE[key] = d;
                }
                if (!d) return;
                const old = { data: curDataForFav, credits: curShareCredits, title: curTitle, imdb: curImdb };
                try {
                    curDataForFav = d;
                    curShareCredits = d.credits || null;
                    curTitle = d.title || d.name || button.dataset.title || '';
                    curImdb = d.external_ids ? d.external_ids.imdb_id : null;
                    // Reuse the exact Open Details share path and card layout.
                    await shareMedia();
                } finally {
                    curDataForFav = old.data; curShareCredits = old.credits; curTitle = old.title; curImdb = old.imdb;
                }
            } catch (e) {}
            finally {
                button.dataset.sharing = '0';
                button.disabled = false;
                button.removeAttribute('aria-busy');
            }
        }
        async function appendGenericMedia(items, type) {
            const container = document.getElementById('gg-content');
            if (!container || !items || !items.length) return;
            hideGenericLoading();
            if (genericViewMode !== 'list') {
                items.forEach(m => {
                    const itemType = m.media_type || type || (m.title ? 'movie' : 'tv');
                    if (itemType !== 'person') container.insertAdjacentHTML('beforeend', makeCard(m, itemType));
                });
                return;
            }
            const cards = await Promise.all(items.filter(m => m && m.poster_path && m.media_type !== 'person').map(m => _ggListCard(m, type)));
            container.insertAdjacentHTML('beforeend', cards.join(''));
        }
        function setGenericViewMode(mode) {
            if (genericContentType === 'person_list') return;
            genericViewMode = mode === 'list' ? 'list' : 'grid';
            const page = document.getElementById('generic-grid-page');
            if (page) page.classList.toggle('gg-list-mode', genericViewMode === 'list');
            document.querySelectorAll('#gg-view-controls .gg-view-btn').forEach(b => b.classList.remove('active'));
            const active = document.getElementById(genericViewMode === 'list' ? 'gg-view-list' : 'gg-view-grid');
            if (active) active.classList.add('active');
            const isFa = LANG === 'fa';
            const grid = document.querySelector('#gg-view-grid span'), list = document.querySelector('#gg-view-list span');
            if (grid) grid.textContent = isFa ? 'شبکه‌ای' : 'Grid';
            if (list) list.textContent = isFa ? 'لیستی' : 'List';
            const container = document.getElementById('gg-content');
            if (container) container.innerHTML = '';
            showGenericLoading();
            genericPage = 1;
            loadGenericData();
        }
        function updateGenericViewControls(isPerson) {
            const controls = document.getElementById('gg-view-controls');
            if (controls) controls.style.display = isPerson ? 'none' : 'flex';
            const page = document.getElementById('generic-grid-page');
            if (page) page.classList.toggle('gg-list-mode', !isPerson && genericViewMode === 'list');
        }
        function openGenericGrid(type, q, title) {
            document.getElementById('modal').style.display='none'; 
            document.getElementById('person-works-modal').style.display='none';
            document.getElementById('generic-grid-page').style.display = 'flex';
            document.getElementById('gg-title').innerHTML = _listIconMarkup(type, q, title) + '<span>' + _homeCategoryTitle(title).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])) + '</span>';
            document.getElementById('gg-content').innerHTML = '';
            showGenericLoading();
            genericPage = 1; genericQuery = q; genericType = type; genericSortMode = 'default';
            updateGenericViewControls(type === 'director_list' || type === 'actor_male_list' || type === 'actor_female_list');
            const sortBar = document.getElementById('gg-sort-bar');
            const sortSelect = document.getElementById('gg-sort-select');
            const sortLabel = document.getElementById('gg-sort-label');
            if (sortSelect) {
                sortSelect.value = 'default';
                sortSelect.options[0].text = LANG === 'fa' ? 'ترتیب پیش‌فرض همین دسته‌بندی' : 'Default category order';
                sortSelect.options[1].text = LANG === 'fa' ? 'جدیدترین' : 'Newest';
                sortSelect.options[2].text = LANG === 'fa' ? 'قدیمی‌ترین' : 'Oldest';
                sortSelect.options[3].text = LANG === 'fa' ? 'بیشترین رأی' : 'Most voted';
                sortSelect.querySelectorAll('option[data-iran-classic-sort]').forEach(o => o.remove());
                if (q === 'custom:iran_pre1978' || q === 'custom:heartbreak_loss') {
                    const opts = [['random', LANG === 'fa' ? 'تصادفی' : 'Random'], ['rating', LANG === 'fa' ? 'بالاترین امتیاز' : 'Highest rated'], ['popular', LANG === 'fa' ? 'بیشترین رأی' : 'Most voted'], ['popularity', LANG === 'fa' ? 'محبوب‌ترین' : 'Most popular']];
                    opts.forEach(([value, label]) => { const o=document.createElement('option'); o.value=value; o.text=label; o.dataset.iranClassicSort='1'; sortSelect.appendChild(o); });
                }
            }
            if (sortLabel) sortLabel.innerText = LANG === 'fa' ? 'مرتب‌سازی' : 'Sort';
            if (sortBar) sortBar.style.display = (type === 'director_list' || type === 'actor_male_list' || type === 'actor_female_list') ? 'none' : 'flex';
            const personSearchBar = document.getElementById('gg-person-search-bar');
            const personSearchInput = document.getElementById('gg-person-search-input');
            const isPersonList = (type === 'director_list' || type === 'actor_male_list' || type === 'actor_female_list');
            if (personSearchBar) personSearchBar.style.display = isPersonList ? 'block' : 'none';
            if (personSearchInput) {
                personSearchInput.value = '';
                personSearchInput.placeholder = getPersonSearchPlaceholder(type);
            }
            const clearBtn = document.getElementById('gg-person-search-clear');
            if (clearBtn) clearBtn.style.display = 'none';
            genericPersonSearchQuery = '';
            
            if (isPersonList) {
                window.genericPersonSeenIds = new Set();
                window.seenDirectorIds = new Set();
                genericContentType = 'person_list';
                document.getElementById('gg-content').className = 'person-grid-container';
            } else if (q === 'curator_picks') {
                genericContentType = 'curator';
                document.getElementById('gg-content').className = 'grid-container';
            } else {
                genericContentType = 'media_list';
                document.getElementById('gg-content').className = 'grid-container';
            }
            if (q === 'custom:adult') applyAdultGridGate();
            loadGenericData();
            document.getElementById('btn-more-g').style.display = 'block';
        }
        const DIRECTOR_PRIORITY_IDS = [525, 138, 1032, 488, 240, 7467, 578, 2710, 137427, 2636, 21684, 10930, 5602, 4762, 5655, 12453, 1243, 1152, 9341, 11401, 223, 16767, 2045, 11218, 1776, 1204, 11614, 608, 10099, 2303, 3325, 4483, 1223, 1769, 1466, 6773, 8643, 6548, 8556, 5363, 9168, 15217, 108, 3110, 533, 5953, 8502, 1532, 4500, 22970];
        const PERSON_FA_TO_EN = {
            'جیمز':'James','کریستوفر':'Christopher','نولان':'Nolan','لئوناردو':'Leonardo','دی کاپریو':'DiCaprio','تام':'Tom','برد':'Brad','پیت':'Pitt','جانی':'Johnny','دپ':'Depp','کریستین':'Christian','بیل':'Bale','رابرت':'Robert','آل':'Al','پاچینو':'Pacino','دنزل':'Denzel','واشنگتن':'Washington','مورگان':'Morgan','فریمن':'Freeman','جکی':'Jackie','چان':'Chan','اسکورسیزی':'Scorsese','اسپیلبرگ':'Spielberg','تارانتینو':'Tarantino','فینچر':'Fincher','کوبریک':'Kubrick','هیچکاک':'Hitchcock','ریدلی':'Ridley','اسکات':'Scott','کامرون':'Cameron','دنی':'Denis','ویلنوو':'Villeneuve','بونگ':'Bong','پارک':'Park','استنلی':'Stanley','مارتین':'Martin','استیون':'Steven','کوئنتین':'Quentin','دیوید':'David','آنجلینا':'Angelina','جولی':'Jolie','اسکارلت':'Scarlett','مارگو':'Margot','رابی':'Robbie','کیت':'Kate','وینسلت':'Winslet','مریل':'Meryl','استریپ':'Streep','اما':'Emma','استون':'Stone','سیدنی':'Sydney','سوئینی':'Sweeney','ناتالی':'Natalie','پورتمن':'Portman'
        };
        function getPersonSearchPlaceholder(type) {
            if (type === 'director_list') return LANG === 'fa' ? 'جستجوی کارگردان... نام فارسی یا انگلیسی' : 'Search directors...';
            if (type === 'actor_female_list') return LANG === 'fa' ? 'جستجوی بازیگر زن... نام فارسی یا انگلیسی' : 'Search actresses...';
            return LANG === 'fa' ? 'جستجوی بازیگر مرد... نام فارسی یا انگلیسی' : 'Search actors...';
        }
        function normalizePersonSearchTerm(q) {
            let out = (q || '').trim();
            Object.keys(PERSON_FA_TO_EN).forEach(k => {
                if (out.includes(k)) out = out.replace(new RegExp(k, 'g'), PERSON_FA_TO_EN[k]);
            });
            return out.trim();
        }
        function personMatchesCurrentList(p, type) {
            if (!p || !p.profile_path) return false;
            if (type === 'actor_male_list') return p.gender === 2;
            if (type === 'actor_female_list') return p.gender === 1;
            if (type === 'director_list') return (p.known_for_department === 'Directing') || ((p.known_for || []).some(x => (x.media_type === 'movie' || x.media_type === 'tv')));
            return true;
        }
        function scorePersonForList(p, type) {
            const pop = Number(p.popularity || 0);
            if (type === 'director_list') {
                const deptBonus = p.known_for_department === 'Directing' ? 1000 : 0;
                const knownScore = (p.known_for || []).reduce((sum, x) => sum + (x.vote_count || 0) * 0.02 + (x.vote_average || 0) * 3, 0);
                return deptBonus + pop + knownScore;
            }
            const trendScore = (p.known_for || []).reduce((sum, x) => sum + (x.popularity || 0) + (x.vote_count || 0) * 0.01, 0);
            return pop + trendScore;
        }
        async function fetchPeoplePages(baseQuery, startPage, pages) {
            let all = [];
            for (let i = 0; i < pages; i++) {
                try {
                    const sep = baseQuery.includes('?') ? '&' : '?';
                    const d = await getData(`${baseQuery}${sep}page=${startPage + i}`);
                    if (d && d.results) all = all.concat(d.results);
                    if (d && d.total_pages && startPage + i >= d.total_pages) break;
                } catch(e) {}
            }
            return all;
        }
        async function loadGenericPeoplePage(isSearch) {
            const container = document.getElementById('gg-content');
            if (!container) return;
            const btn = document.getElementById('btn-more-g');
            if (!window.genericPersonSeenIds) window.genericPersonSeenIds = new Set();
            if (isSearch || genericPersonSearchQuery) {
                await loadGenericPersonSearch(genericPersonSearchQuery || '');
                return;
            }
            const loadingId = 'person-loading-inline';
            if (!document.getElementById(loadingId)) {
                container.insertAdjacentHTML('beforeend', `<div id="${loadingId}" class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);display:block;margin-bottom:10px;"></i>${LANG === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}</div>`);
            }
            let collected = [];
            if (genericType === 'director_list') {
                if (genericPage === 1) {
                    const directorDetails = await Promise.all(DIRECTOR_PRIORITY_IDS.map(id => getData(`person/${id}`).catch(()=>null)));
                    collected = collected.concat(directorDetails.filter(Boolean).map(p => ({...p, known_for_department:'Directing'})));
                }
                const startPage = Math.max(1, (genericPage - 1) * 5 + 1);
                let popular = await fetchPeoplePages('person/popular', startPage, 5);
                popular = popular.filter(p => p.known_for_department === 'Directing' || (p.known_for || []).some(k => k.media_type === 'movie' && (k.vote_count || 0) > 1000));
                collected = collected.concat(popular);
            } else {
                const startPage = Math.max(1, (genericPage - 1) * 4 + 1);
                collected = await fetchPeoplePages('person/popular', startPage, 4);
            }
            collected = collected
                .filter(p => personMatchesCurrentList(p, genericType))
                .sort((a,b) => scorePersonForList(b, genericType) - scorePersonForList(a, genericType));
            const unique = [];
            for (const p of collected) {
                if (!window.genericPersonSeenIds.has(p.id)) {
                    window.genericPersonSeenIds.add(p.id);
                    unique.push(p);
                }
            }
            const loading = document.getElementById(loadingId);
            if (loading) loading.remove();
            hideGenericLoading();
            if (unique.length === 0 && container.children.length === 0) {
                container.innerHTML = `<div class="person-empty-state">${LANG === 'fa' ? 'فعلاً نتیجه‌ای پیدا نشد. دوباره بارگذاری کن.' : 'No people found yet. Try loading more.'}</div>`;
            } else {
                unique.slice(0, 40).forEach(p => container.innerHTML += makePersonCard(p));
            }
            if (btn) btn.style.display = 'block';
        }
        function searchGenericPeople(q) {
            const clearBtn = document.getElementById('gg-person-search-clear');
            if (clearBtn) clearBtn.style.display = q.trim() ? 'block' : 'none';
            if (genericPersonSearchTimer) clearTimeout(genericPersonSearchTimer);
            genericPersonSearchTimer = setTimeout(async () => {
                genericPersonSearchQuery = q.trim();
                genericPage = 1;
                window.genericPersonSeenIds = new Set();
                const container = document.getElementById('gg-content');
                if (container) container.innerHTML = '';
                if (!genericPersonSearchQuery) {
                    loadGenericData();
                    return;
                }
                await loadGenericPersonSearch(genericPersonSearchQuery);
            }, 220);
        }
        function clearGenericPersonSearch() {
            const input = document.getElementById('gg-person-search-input');
            if (input) input.value = '';
            const clearBtn = document.getElementById('gg-person-search-clear');
            if (clearBtn) clearBtn.style.display = 'none';
            genericPersonSearchQuery = '';
            genericPage = 1;
            window.genericPersonSeenIds = new Set();
            const container = document.getElementById('gg-content');
            if (container) container.innerHTML = '';
            loadGenericData();
        }
        async function loadGenericPersonSearch(q) {
            const container = document.getElementById('gg-content');
            const btn = document.getElementById('btn-more-g');
            if (btn) btn.style.display = 'none';
            if (!container) return;
            const normalized = normalizePersonSearchTerm(q);
            container.innerHTML = `<div class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);display:block;margin-bottom:10px;"></i>${LANG === 'fa' ? 'در حال جستجو...' : 'Searching...'}</div>`;
            let queries = [q];
            if (normalized && normalized.toLowerCase() !== q.toLowerCase()) queries.push(normalized);
            let all = [];
            for (const term of queries) {
                try {
                    const d1 = await getData(`search/person?query=${encodeURIComponent(term)}&include_adult=false&language=en-US`);
                    if (d1 && d1.results) all = all.concat(d1.results);
                } catch(e) {}
                try {
                    const d2 = await getData(`search/person?query=${encodeURIComponent(term)}&include_adult=false&language=fa-IR`);
                    if (d2 && d2.results) all = all.concat(d2.results);
                } catch(e) {}
            }
            const seen = new Set();
            all = all.filter(p => {
                if (!personMatchesCurrentList(p, genericType)) return false;
                if (seen.has(p.id)) return false;
                seen.add(p.id);
                const n = (p.name || '').toLowerCase();
                const ql = (normalized || q).toLowerCase();
                return !ql || n.includes(ql) || n.includes((q || '').toLowerCase()) || smartSearchScore(n, q) > 0;
            }).sort((a,b) => scorePersonForList(b, genericType) - scorePersonForList(a, genericType));
            container.innerHTML = '';
            hideGenericLoading();
            if (!all.length) {
                container.innerHTML = `<div class="person-empty-state">${LANG === 'fa' ? 'شخصی با این نام در همین دسته‌بندی پیدا نشد.' : 'No matching person found in this category.'}</div>`;
                return;
            }
            all.slice(0, 60).forEach(p => container.innerHTML += makePersonCard(p));
        }

        function applyGenericSortFilter() {
            const sel = document.getElementById('gg-sort-select');
            genericSortMode = sel ? sel.value : 'default';
            genericPage = 1;
            const container = document.getElementById('gg-content');
            if (container) container.innerHTML = '';
            loadGenericData();
        }
        async function loadMoreGeneric() { 
            genericPage++;
            loadGenericData(); 
        }
        async function loadGenericData() {
            const container = document.getElementById('gg-content');
            if (genericQuery === 'custom:adult') applyAdultGridGate();
            
            if (genericQuery && genericQuery.startsWith('custom:')) {
                const d = await getCustomCategoryResults(genericQuery, genericPage, genericSortMode || 'default');
                if (d && d.results) await appendGenericMedia(d.results.filter(m => { const cardType = (d.type === 'mixed' || genericQuery === 'custom:adult') ? (m.media_type || genericType || 'movie') : (d.type || genericType); return !(cardType === 'tv' && isTVShowExcluded(m)); }), d.type === 'mixed' || genericQuery === 'custom:adult' ? genericType : (d.type || genericType));
                document.getElementById('btn-more-g').style.display = (genericPage >= (d.total_pages || 1)) ? 'none' : 'block';
                if (genericQuery === 'custom:adult') applyAdultGridGate();
                hideGenericLoading();
                return;
            }
            
            // Special handling for Curator's Pick
            if (genericContentType === 'curator') {
                const perPage = 20;

                // ── 'newest' / 'oldest': sort the static title+year list directly.
                // No TMDB resolution is needed to know the year — it's already
                // stored in CURATOR_PICKS — so this is instant, exactly like
                // the default order, and only resolves the current page. ──
                if (genericSortMode === 'newest' || genericSortMode === 'oldest') {
                    const sortedList = [...CURATOR_PICKS].sort((a, b) => {
                        const ay = normalizeCuratorPick(a).year || 0;
                        const by = normalizeCuratorPick(b).year || 0;
                        return genericSortMode === 'newest' ? (by - ay) : (ay - by);
                    });
                    let index = ((genericPage || 1) - 1) * perPage;
                    let added = 0;
                    while (index < sortedList.length && added < perPage) {
                        try {
                            const entry = sortedList[index];
                            const movie = await findCuratorMovie(entry);
                            if (movie && isValidCuratorResolvedMovie(movie, normalizeCuratorPick(entry))) {
                                await appendGenericMedia([movie], 'movie');
                                added++;
                            }
                        } catch(e) {}
                        index++;
                    }
                    document.getElementById('btn-more-g').style.display = (index >= sortedList.length) ? 'none' : 'block';
                    return;
                }

                // ── 'popular' (most voted): genuinely needs vote_count from TMDB,
                // so the full list must be resolved once (cached), then sorted+paginated. ──
                if (genericSortMode === 'popular') {
                    if (!window._curatorFullResolved || window._curatorFullResolvedLang !== LANG) {
                        const loadingId = 'curator-full-loading';
                        if (genericPage === 1 && !document.getElementById(loadingId)) {
                            container.insertAdjacentHTML('beforeend',
                                `<div id="${loadingId}" style="grid-column:1/-1;text-align:center;padding:34px 10px;color:#888;">
                                    <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;margin-bottom:10px;display:block;"></i>
                                    ${LANG === 'fa' ? 'در حال بارگذاری کامل لیست برای مرتب‌سازی...' : 'Loading the full list to sort...'}
                                </div>`);
                        }
                        const resolved = [];
                        const batchSize = 25;
                        for (let i = 0; i < CURATOR_PICKS.length; i += batchSize) {
                            const batch = CURATOR_PICKS.slice(i, i + batchSize);
                            const batchResults = await Promise.all(batch.map(async entry => {
                                try {
                                    const movie = await findCuratorMovie(entry);
                                    if (movie && isValidCuratorResolvedMovie(movie, normalizeCuratorPick(entry))) return movie;
                                } catch(e) {}
                                return null;
                            }));
                            batchResults.forEach(m => { if (m) resolved.push(m); });
                        }
                        window._curatorFullResolved = _uniqById(resolved);
                        window._curatorFullResolvedLang = LANG;
                        const ld = document.getElementById(loadingId);
                        if (ld) ld.remove();
                    }
                    let sorted = [...window._curatorFullResolved];
                    sorted.sort((a,b) => (b.vote_count||0) - (a.vote_count||0));
                    const start = (genericPage - 1) * perPage;
                    const pageItems = sorted.slice(start, start + perPage);
                    await appendGenericMedia(pageItems, 'movie');
                    document.getElementById('btn-more-g').style.display = (start + perPage >= sorted.length) ? 'none' : 'block';
                    return;
                }

                // Default order: existing lazy sequential behavior (unchanged)
                let index = ((genericPage || 1) - 1) * perPage;
                let added = 0;
                while (index < CURATOR_PICKS.length && added < perPage) {
                    try {
                        const entry = CURATOR_PICKS[index];
                        const movie = await findCuratorMovie(entry);
                        if (movie && isValidCuratorResolvedMovie(movie, normalizeCuratorPick(entry))) {
                            await appendGenericMedia([movie], 'movie');
                            added++;
                        }
                    } catch(e) {
                        console.error('Error loading curator pick:', e);
                    }
                    index++;
                }
                if(index >= CURATOR_PICKS.length) {
                    document.getElementById('btn-more-g').style.display = 'none';
                } else {
                    document.getElementById('btn-more-g').style.display = 'block';
                }
                return;
            }
            
            if (genericContentType === 'person_list') {
                await loadGenericPeoplePage(false);
                return;
            }
            
            // Home mixed categories share a unique cached pool across Home and See All.
            if (genericQuery.includes('&fn_home_mix=1')) {
                const d = await getHomeMixedResults(genericQuery, genericPage, genericSortMode || 'default', genericType);
                if (d && d.results) await appendGenericMedia(d.results, genericType);
                document.getElementById('btn-more-g').style.display = (genericPage >= (d.total_pages || 1)) ? 'none' : 'block';
                return;
            }
            // Handle trending endpoint which uses different pagination format
            const isTrendingQuery = genericQuery.startsWith('trending/');
            let effectiveQuery = genericQuery;
            if (genericSortMode && genericSortMode !== 'default' && !isTrendingQuery && genericContentType === 'media_list') {
                effectiveQuery = effectiveQuery.replace(/([?&])sort_by=[^&]*/g, '');
                const itemTypeForSort = genericType === 'tv' ? 'tv' : 'movie';
                if (genericSortMode === 'newest') effectiveQuery += itemTypeForSort === 'tv' ? '&sort_by=first_air_date.desc' : '&sort_by=primary_release_date.desc';
                else if (genericSortMode === 'oldest') effectiveQuery += itemTypeForSort === 'tv' ? '&sort_by=first_air_date.asc' : '&sort_by=primary_release_date.asc';
                else if (genericSortMode === 'popular') effectiveQuery += '&sort_by=popularity.desc';
            }
            const queryWithPage = isTrendingQuery 
                ? `${effectiveQuery}?page=${genericPage}` 
                : `${effectiveQuery}&page=${genericPage}`;
            const d = await getData(queryWithPage);
            if(!d.results) return;

            if (genericContentType === 'media_list') {
                const mediaType = genericType === 'movie' || genericType === 'tv' ? genericType : 'movie'; 
                let results = d.results || [];
                if (genericSortMode === 'popular') results = [...results].sort((a,b)=>(b.vote_count||0)-(a.vote_count||0));
                await appendGenericMedia(results, mediaType);
            }
            let totalPages = 1;
            if(d.total_pages) totalPages = d.total_pages;
            if (genericPage >= totalPages) {
                document.getElementById('btn-more-g').style.display = 'none';
            } else {
                document.getElementById('btn-more-g').style.display = 'block';
            }
        }
        // --- FAVORITES LOGIC ---
        function checkFavState() {
            const btn = document.getElementById('fav-btn');
            const exists = favorites.some(f => f.id == curId);
            if(exists) {
                btn.classList.remove('fa-regular');
                btn.classList.add('fa-solid', 'active');
            } else {
                btn.classList.remove('fa-solid', 'active');
                btn.classList.add('fa-regular');
            }
        }
        var watchlist = JSON.parse(localStorage.getItem('fn_watchlist') || '[]');
        var WATCHLIST_KEY = 'fn_watchlist';
        var RECENTLY_KEY = 'fn_recently_viewed';
        var recentlyViewed = JSON.parse(localStorage.getItem(RECENTLY_KEY) || '[]');
        // Migrate the previous playback-only history into the richer Recently list once.
        (WATCH_HISTORY || []).forEach(function(h) {
            var exists = recentlyViewed.find(function(r){ return String(r.id) === String(h.id) && (r.type || 'movie') === (h.type || 'movie'); });
            if (!exists) recentlyViewed.push({ id:h.id, type:h.type||'movie', title:h.title||'', name:h.title||'', poster_path:null, poster:h.poster, vote_average:h.rate, recentAt:Date.parse(h.date)||Date.now(), watchedAt:Date.parse(h.date)||Date.now() });
            else if (!exists.watchedAt) exists.watchedAt = Date.parse(h.date)||Date.now();
        });
        recentlyViewed = recentlyViewed.slice(0, 50);
        try { localStorage.setItem(RECENTLY_KEY, JSON.stringify(recentlyViewed)); } catch(e) {}

        function recordRecentlyViewed(data, id, type, watched) {
            if (!id || type === 'person_works') return;
            data = data || {};
            type = type || 'movie';
            var idx = recentlyViewed.findIndex(function(r) { return String(r.id) === String(id) && (r.type || 'movie') === type; });
            var old = idx > -1 ? recentlyViewed[idx] : {};
            var item = Object.assign({}, old, {
                id:id, type:type,
                title:data.title || data.name || old.title || '',
                name:data.name || data.title || old.name || '',
                poster_path:data.poster_path || old.poster_path,
                poster:data.poster || old.poster,
                vote_average:data.vote_average != null ? data.vote_average : old.vote_average,
                release_date:data.release_date || old.release_date,
                first_air_date:data.first_air_date || old.first_air_date,
                recentAt:Date.now()
            });
            if (watched) item.watchedAt = Date.now();
            if (idx > -1) recentlyViewed.splice(idx, 1);
            recentlyViewed.unshift(item);
            recentlyViewed = recentlyViewed.slice(0, 50);
            try { localStorage.setItem(RECENTLY_KEY, JSON.stringify(recentlyViewed)); } catch(e) {}
            if (document.getElementById('fav-tab') && document.getElementById('fav-tab').classList.contains('active') && _myListCurrentTab === 'recent') loadFavorites();
        }

        function toggleFav() {
            const idx = favorites.findIndex(f => f.id == curId);
            if(idx > -1) {
                favorites.splice(idx, 1);
            } else {
                favorites.unshift({
                    id: curId, type: curType,
                    title: curDataForFav.title || curDataForFav.name,
                    name: curDataForFav.name || curDataForFav.title,
                    poster_path: curDataForFav.poster_path,
                    vote_average: curDataForFav.vote_average,
                    release_date: curDataForFav.release_date,
                    first_air_date: curDataForFav.first_air_date
                });
            }
            localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
            checkFavState();
            if(document.getElementById('fav-tab').classList.contains('active')) { loadFavorites(); }
        }

        function _fnInfoEsc(v) {
            return String(v == null ? '-' : v).replace(/[&<>\"']/g, function(ch) { return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]; });
        }
        function _fnInfoDownloadAvailable() {
            var entry = (typeof DOWNLOADS_DB !== 'undefined' && curImdb) ? DOWNLOADS_DB[curImdb] : null;
            var cached = (typeof DL_CACHE !== 'undefined' && curId != null) ? DL_CACHE[String(curId)] : false;
            return !!(cached || (entry && ((entry.softsub && Object.keys(entry.softsub).length) || (entry.dubbed && Object.keys(entry.dubbed).length))));
        }
        async function openTitleInfo() {
            var d = curDataForFav;
            if (!d) return;
            var fa = LANG === 'fa', isTv = curType === 'tv';
            var title = d.title || d.name || curTitle || '-';
            var labels = fa ? {
                status:'وضعیت پخش', air:isTv?'تاریخ پخش قسمت بعدی':'تاریخ انتشار', seasons:'تعداد فصل', episodes:'تعداد قسمت', country:'کشور سازنده', language:'زبان اصلی', year:'سال ساخت', rating:'امتیاز و رأی', genre:'ژانر', runtime:'مدت زمان', download:'دانلود', age:'رده سنی', network:'شبکه پخش', pattern:'الگوی انتشار'
            } : {
                status:'Status', air:isTv?'Next Episode Air Date':'Release Date', seasons:'Seasons', episodes:'Episodes', country:'Production Country', language:'Original Language', year:'Year', rating:'Rating & Votes', genre:'Genres', runtime:'Runtime', download:'Download', age:'Age Rating', network:'Broadcast Network', pattern:'Release Pattern'
            };
            var statusMap = fa ? {'Returning Series':'در حال پخش','Ended':'پایان‌یافته','Canceled':'لغوشده','In Production':'در حال تولید','Planned':'برنامه‌ریزی‌شده','Released':'منتشرشده'} : {};
            var status = d.status ? (statusMap[d.status] || d.status) : '-';
            var releaseDate = d.release_date || d.first_air_date || '-';
            var nextAir = d.next_episode_to_air && d.next_episode_to_air.air_date;
            var date = isTv ? (nextAir || (d.last_air_date || d.first_air_date || '-')) : releaseDate;
            var airDay = nextAir ? new Date(nextAir+'T12:00:00').toLocaleDateString(fa?'fa-IR':'en-US',{weekday:'long'}) : '-';
            var countries = (d.production_countries || []).map(function(c){return c.name;}).filter(Boolean).join(fa?'، ':', ') || '-';
            var genres = (d.genres || []).map(function(g){return g.name;}).filter(Boolean).join(fa?'، ':', ') || '-';
            var networks = (d.networks || []).map(function(n){return n.name;}).filter(Boolean).join(fa?'، ':', ') || '-';
            var langNames = fa ? {'en':'انگلیسی','ko':'کره‌ای','ja':'ژاپنی','fr':'فرانسوی','de':'آلمانی','es':'اسپانیایی','it':'ایتالیایی','ru':'روسی','zh':'چینی','hi':'هندی','tr':'ترکی','fa':'فارسی'} : {'en':'English','ko':'Korean','ja':'Japanese','fr':'French','de':'German','es':'Spanish','it':'Italian','ru':'Russian','zh':'Chinese','hi':'Hindi','tr':'Turkish','fa':'Persian'};
            var originalLang = langNames[d.original_language] || d.original_language || '-';
            var rating = d.vote_average ? Number(d.vote_average).toFixed(1) + '/10' : '-';
            if (d.vote_count != null) rating += ' (' + Number(d.vote_count).toLocaleString('en-US') + (fa?' رأی':' votes') + ')';
            var runtime = '-';
            if (isTv && d.episode_run_time && d.episode_run_time.length) runtime = Math.round(d.episode_run_time.reduce(function(a,b){return a+b;},0)/d.episode_run_time.length) + (fa?' دقیقه':' min');
            else if (!isTv && d.runtime) runtime = d.runtime + (fa?' دقیقه':' min');
            var pattern = '-';
            if (isTv) {
                if (d.status === 'Returning Series' && nextAir) pattern = (fa?'پخش هفتگی؛ معمولاً ':'Weekly release; next on ') + airDay;
                else if (d.status === 'Ended' && d.last_air_date) pattern = fa?'پخش کامل شده':'Fully released';
                else if (d.status === 'In Production' || d.status === 'Planned') pattern = fa?'زمان‌بندی اعلام نشده':'Schedule not announced';
            }
            var download = false;
            var db = (typeof DOWNLOADS_DB !== 'undefined' && curImdb) ? DOWNLOADS_DB[curImdb] : null;
            download = !!(db && (db.type === 'tvSeries' || (db.softsub && Object.keys(db.softsub).length) || (db.dubbed && Object.keys(db.dubbed).length)));
            if (curImdb && typeof getIndex === 'function') {
                try { var liveIndex = await getIndex(); if (liveIndex && liveIndex[curImdb]) download = true; } catch(e) {}
            }
            var age = d.age_rating_display || d.age_rating || '-';
            if (typeof getData === 'function') {
                try {
                    var ratingData = isTv ? await getData('tv/'+d.id+'/content_ratings') : await getData('movie/'+d.id+'/release_dates');
                    if (isTv && ratingData && ratingData.results) { var rr=ratingData.results.find(function(x){return x.iso_3166_1==='US' && x.rating;}) || ratingData.results.find(function(x){return x.rating;}); if(rr) age=rr.rating; }
                    if (!isTv && ratingData && ratingData.results) { var us=ratingData.results.find(function(x){return x.iso_3166_1==='US';}) || ratingData.results[0]; var rd=us && (us.release_dates||[]).find(function(x){return x.certification;}); if(rd) age=rd.certification; }
                } catch(e) {}
            }
            var ageDisplay = age;
            var ageMap = {'G':'3+','PG':'7+','PG-13':'13+','R':'17+','NC-17':'18+','TV-Y':'3+','TV-Y7':'7+','TV-G':'6+','TV-PG':'10+','TV-14':'14+','TV-MA':'18+'};
            if (ageMap[age]) ageDisplay = ageMap[age] + ' (' + age + ')';
            var rows = [[labels.status,status],[labels.air,date],[labels.year,(releaseDate !== '-' ? releaseDate.slice(0,4) : '-')],[labels.country,countries],[labels.language,originalLang],[labels.rating,rating],[labels.genre,genres],[labels.runtime,runtime],[labels.age,ageDisplay]];
            if (isTv) rows.splice(2,0,[labels.seasons,d.number_of_seasons || '-'],[labels.episodes,d.number_of_episodes || '-'],[labels.network,networks],[labels.pattern,pattern]);
            rows.push([labels.download, download ? (fa?'دارد':'Available') : (fa?'ندارد':'Unavailable')]);
            var grid = document.getElementById('fn-title-info-grid'), heading = document.getElementById('fn-title-info-heading');
            if (heading) heading.textContent = title;
            if (grid) grid.innerHTML = rows.map(function(row){ var isDownload=row[0]===labels.download; return '<div class="fn-title-info-row"><div class="fn-title-info-label">'+_fnInfoEsc(row[0])+'</div><div class="fn-title-info-value '+(isDownload?(download?'ok':'no'):'')+'">'+_fnInfoEsc(row[1])+'</div></div>'; }).join('');
            var modal = document.getElementById('fn-title-info-modal');
            if (modal) { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); }
        }
        function closeTitleInfo() {
            var modal = document.getElementById('fn-title-info-modal');
            if (modal) { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
        }
        function toggleWatchlist() {
            haptic(12);
            if (!curId || !curDataForFav) return;
            var idx = watchlist.findIndex(function(w) { return w.id == curId; });
            if (idx > -1) {
                watchlist.splice(idx, 1);
                showToast(LANG === 'fa' ? 'از ذخیره‌شده‌ها حذف شد' : 'Removed from Watch Later');
            } else {
                watchlist.unshift({
                    id: curId, type: curType,
                    title: curDataForFav.title || curDataForFav.name,
                    name: curDataForFav.name || curDataForFav.title,
                    poster_path: curDataForFav.poster_path,
                    vote_average: curDataForFav.vote_average,
                    release_date: curDataForFav.release_date,
                    first_air_date: curDataForFav.first_air_date,
                    savedAt: Date.now()
                });
                showToast(LANG === 'fa' ? 'برای بعداً ذخیره شد' : 'Saved to Watch Later');
            }
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
            checkWatchlistState();
            if(document.getElementById('fav-tab').classList.contains('active')) { loadFavorites(); }
        }

        function checkWatchlistState() {
            var btn = document.getElementById('watchlist-btn');
            if (!btn || !curId) return;
            var inList = watchlist.findIndex(function(w) { return w.id == curId; }) > -1;
            btn.className = (inList ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark');
            btn.style.color = inList ? '#00b894' : '#777';
        }
        var _myListCurrentTab = 'fav';

        function switchMyListTab(tab) {
            _myListCurrentTab = tab;
            var tabs = ['fav', 'rated', 'watchlater', 'recent'];
            tabs.forEach(function(t) {
                var btn = document.getElementById('mylist-tab-' + t);
                var sec = document.getElementById('mylist-section-' + t);
                if (btn) {
                    if (t === tab) {
                        btn.style.background = t === 'fav' ? '#e50914' : (t === 'rated' ? '#1f1600' : (t === 'watchlater' ? '#001a12' : '#18132b'));
                        btn.style.color = 'white';
                    } else {
                        btn.style.background = '#1a1a1a';
                        btn.style.color = '#888';
                    }
                }
                if (sec) sec.style.display = t === tab ? 'block' : 'none';
            });
            loadFavorites();
        }

        function loadFavorites() {
            var isFA = LANG === 'fa';
            var tab = _myListCurrentTab || 'fav';

            if (tab === 'fav') {
                var c = document.getElementById('fav-grid');
                var emptyEl = document.getElementById('fav-empty');
                if (!c) return;
                c.innerHTML = '';
                if (favorites.length === 0) {
                    if (emptyEl) { emptyEl.style.display = 'block'; emptyEl.textContent = isFA ? '\u0644\u06CC\u0633\u062A \u062E\u0627\u0644\u06CC\u0647' : 'No favorites yet'; }
                } else {
                    if (emptyEl) emptyEl.style.display = 'none';
                    favorites.forEach(function(f) { c.innerHTML += makeCard(f, f.type || 'movie'); });
                }
            } else if (tab === 'rated') {
                var ratedEl = document.getElementById('rated-list-content');
                var ratedEmpty = document.getElementById('rated-empty');
                if (!ratedEl) return;
                var ratings = personalRatings || {};
                var ratedItems = Object.entries(ratings).sort(function(a, b) { return b[1].stars - a[1].stars; });
                if (ratedItems.length === 0) {
                    if (ratedEmpty) { ratedEmpty.style.display = 'block'; ratedEmpty.textContent = isFA ? '\u0647\u0646\u0648\u0632 \u0627\u0645\u062A\u06CC\u0627\u0632\u06CC \u062B\u0628\u062A \u0646\u0634\u062F\u0647' : 'No ratings yet'; }
                    ratedEl.innerHTML = '';
                } else {
                    if (ratedEmpty) ratedEmpty.style.display = 'none';
                    var opLabelsFA = { loved: '\u0633\u0644\u06CC\u0642\u0645 \u0628\u0648\u062F', ok: '\u0628\u062F \u0646\u0628\u0648\u062F', disliked: '\u0627\u062A\u0644\u0627\u0641 \u0648\u0642\u062A', notmytaste: '\u0633\u0644\u06CC\u0642\u0645 \u0646\u0628\u0648\u062F' };
                    var opLabelsEN = { loved: 'Loved it', ok: 'Was OK', disliked: 'Waste of time', notmytaste: 'Not my taste' };
                    var html = '';
                    ratedItems.forEach(function(entry) {
                        var id = entry[0]; var r = entry[1];
                        var stars = '';
                        for (var i = 1; i <= 5; i++) stars += (i <= r.stars ? '<span style="color:#f5c518;">&#9733;</span>' : '<span style="color:#333;">&#9733;</span>');
                        var opinionText = '';
                        if (r.opinion) {
                            var lbl = isFA ? opLabelsFA[r.opinion] : opLabelsEN[r.opinion];
                            if (lbl) opinionText = '<div style="font-size:11px;color:#00b894;margin-top:4px;font-weight:600;">' + lbl + '</div>';
                        }
                        var poster = r.poster ? ('https://family-night-api.alirezadoe8.workers.dev/img/w185' + r.poster) : '';
                        html += '<div style="display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #1a1a1a;cursor:pointer;" onclick="openDetail(' + id + ',\'' + (r.type||'movie') + '\')">'
                            + '<div style="width:52px;height:74px;border-radius:6px;overflow:hidden;flex-shrink:0;background:#111;">'
                            + (poster ? '<img src="' + poster + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;">&#127916;</div>')
                            + '</div>'
                            + '<div style="flex:1;min-width:0;">'
                            + '<div style="font-size:14px;font-weight:600;color:#e0e0e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (r.title||'') + '</div>'
                            + '<div style="margin-top:5px;font-size:16px;letter-spacing:2px;">' + stars + '</div>'
                            + opinionText
                            + '</div></div>';
                    });
                    ratedEl.innerHTML = html;
                }
            } else if (tab === 'watchlater') {
                var wg = document.getElementById('watchlater-grid');
                var wEmpty = document.getElementById('watchlater-empty');
                if (!wg) return;
                wg.innerHTML = '';
                if (watchlist.length === 0) {
                    if (wEmpty) { wEmpty.style.display = 'block'; wEmpty.textContent = isFA ? '\u0647\u06CC\u0686 \u0627\u062B\u0631\u06CC \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F\u0647' : 'Nothing saved for later'; }
                } else {
                    if (wEmpty) wEmpty.style.display = 'none';
                    watchlist.forEach(function(f) { wg.innerHTML += makeCard(f, f.type || 'movie'); });
                }
            } else if (tab === 'recent') {
                loadHistory();
            }
        }

        
        // --- AGE RATING FUNCTIONS ---
        function getAgeRatingInfo(certification, type) {
            // Age rating mapping with suggested ages and classifications
            const movieRatings = {
                'G': { display: '3+', class: 'g', tooltip: 'General Audiences (3+)' },
                'PG': { display: '7+', class: 'pg', tooltip: 'Parental Guidance (7+)' },
                'PG-13': { display: '13+', class: 'pg13', tooltip: 'Parents Strongly Cautioned (13+)' },
                'R': { display: '17+', class: 'r', tooltip: 'Restricted (17+)' },
                'NC-17': { display: '18+', class: 'nc17', tooltip: 'Adults Only (18+)' },
                'NR': { display: 'NR', class: '', tooltip: 'Not Rated' },
                'UR': { display: 'UR', class: '', tooltip: 'Unrated' }
            };
            
            const tvRatings = {
                'TV-Y': { display: '2+', class: 'tv-y', tooltip: 'All Children (2+)' },
                'TV-Y7': { display: '7+', class: 'tv-y7', tooltip: 'Directed to Older Children (7+)' },
                'TV-G': { display: '6+', class: 'tv-g', tooltip: 'General Audience (6+)' },
                'TV-PG': { display: '10+', class: 'tv-pg', tooltip: 'Parental Guidance (10+)' },
                'TV-14': { display: '14+', class: 'tv-14', tooltip: 'Parents Strongly Cautioned (14+)' },
                'TV-MA': { display: '17+', class: 'tv-ma', tooltip: 'Mature Audience (17+)' },
                'NR': { display: 'NR', class: '', tooltip: 'Not Rated' }
            };
            
            const ratings = type === 'movie' ? movieRatings : tvRatings;
            return ratings[certification] || { display: certification || 'NR', class: '', tooltip: certification || 'Not Rated' };
        }
        
        async function enrichItemWithAgeRating(item, type) {
            if (!item || item.age_rating_display) return item; // Already enriched
            
            try {
                const relData = await getData(`${type}/${item.id}/release_dates`);
                let certification = 'NR';
                
                if (type === 'movie' && relData && relData.results) {
                    // Find US rating first
                    const usRelease = relData.results.find(r => r.iso_3166_1 === 'US');
                    if (usRelease && usRelease.release_dates && usRelease.release_dates.length > 0) {
                        const rated = usRelease.release_dates.find(rd => rd.certification && rd.certification !== '');
                        if (rated) certification = rated.certification;
                    }
                }
                
                if (type === 'tv') {
                    const contentData = await getData(`${type}/${item.id}/content_ratings`);
                    if (contentData && contentData.results) {
                        const usRating = contentData.results.find(r => r.iso_3166_1 === 'US');
                        if (usRating && usRating.rating) certification = usRating.rating;
                    }
                }
                
                const ratingInfo = getAgeRatingInfo(certification, type);
                item.age_rating = certification;
                item.age_rating_display = ratingInfo.display;
                item.age_rating_class = ratingInfo.class;
                item.age_rating_tooltip = ratingInfo.tooltip;
                
            } catch (e) {
                const ratingInfo = getAgeRatingInfo('NR', type);
                item.age_rating = 'NR';
                item.age_rating_display = ratingInfo.display;
                item.age_rating_class = ratingInfo.class;
                item.age_rating_tooltip = ratingInfo.tooltip;
            }
            
            return item;
        }
        
        // Batch enrich items with age ratings (limit concurrent requests)
        async function batchEnrichWithAgeRating(items, type, batchSize = 5) {
            const results = [];
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                const enriched = await Promise.all(
                    batch.map(item => enrichItemWithAgeRating(item, type))
                );
                results.push(...enriched);
                // Small delay to avoid rate limiting
                if (i + batchSize < items.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            return results;
        }
        
        async function filterByAgeRating(rating, type) {
            document.getElementById('modal').style.display = 'none';
            document.getElementById('person-works-modal').style.display = 'none';
            
            const title = LANG === 'fa' ? `آثار با رده سنی ${rating}` : `${rating} Rated ${type === 'movie' ? 'Movies' : 'Series'}`;
            document.getElementById('gg-title').innerText = title;
            
            const container = document.getElementById('gg-content');
            container.innerHTML = '<div style="text-align:center;padding:30px;"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);"></i></div>';
            
            document.getElementById('generic-grid-page').style.display = 'flex';
            
            // Fetch and filter items with this age rating
            let allItems = [];
            for (let page = 1; page <= 5; page++) {
                const data = await getData(`discover/${type}?sort_by=popularity.desc&page=${page}&vote_count.gte=10`);
                if (data && data.results) {
                    for (const item of data.results) {
                        if (item.poster_path) {
                            await enrichItemWithAgeRating(item, type);
                            if (item.age_rating === rating) {
                                allItems.push(item);
                            }
                        }
                    }
                }
                if (allItems.length >= 20) break;
            }
            
            // Shuffle for random display
            allItems.sort(() => Math.random() - 0.5);
            
            container.innerHTML = '';
            if (allItems.length > 0) {
                container.innerHTML = '<div class="grid-container">' + allItems.slice(0, 20).map(m => makeCard(m, type)).join('') + '</div>';
            } else {
                container.innerHTML = '<div style="text-align:center;padding:50px;color:#888;">No results found</div>';
            }
        }
        
        // --- ADDITIONAL SCORES (RT & METACRITIC) ---
        async function fetchAdditionalScores(imdbId) {
            if (!imdbId) return null;
            
            try {
                // Using OMDb API to get RT and Metacritic scores
                const omdbKey = 'f6dd47c8'; // OMDb API key (you can replace with your own)
                const response = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`);
                const data = await response.json();
                
                if (data.Response === 'True') {
                    const scores = {};
                    
                    // Rotten Tomatoes
                    if (data.Ratings) {
                        const rtRating = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
                        if (rtRating) {
                            scores.rt = parseInt(rtRating.Value);
                        }
                    }
                    
                    // Metacritic
                    if (data.Metascore && data.Metascore !== 'N/A') {
                        scores.metacritic = parseInt(data.Metascore);
                    }
                    
                    return scores;
                }
            } catch (e) {
                console.log('Failed to fetch additional scores:', e);
            }
            
            return null;
        }
;
