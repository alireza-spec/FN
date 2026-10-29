function stLookup(title) {
            var key = (title || '').toLowerCase().trim();
            // Direct match
            if (_ST_DB[key]) return _ST_DB[key];
            // Partial match
            for (var k in _ST_DB) {
                if (key.includes(k) || k.includes(key)) return _ST_DB[k];
            }
            return null;
        }

        // YouTube player state for soundtracks
        var stYTPlayer = null;
        var stYTCurrentIdx = 0;
        var stYTVideos = [];
        var stYTPlaylistId = null;

        async function openSoundtracks() {
            var modal = document.getElementById('soundtracks-modal');
            var contentEl = document.getElementById('st-content');
            var bgEl = document.getElementById('st-bg');
            var titleEl = document.getElementById('st-modal-title');
            var isFA = LANG === 'fa';
            var miniPlayer = document.getElementById('st-mini-player');
            var ytEmbed = document.getElementById('st-yt-embed');

            var posterSrc = document.getElementById('d-img') ? document.getElementById('d-img').src : '';
            if (posterSrc) bgEl.style.backgroundImage = 'url(' + posterSrc + ')';
            titleEl.textContent = (isFA ? '🎵 موسیقی متن: ' : '🎵 Soundtracks: ') + (curTitle || '');
            modal.classList.add('open');
            history.pushState({ page: 'soundtracks' }, '', '');

            // Reset player
            if (ytEmbed) ytEmbed.style.display = 'none';
            if (miniPlayer) miniPlayer.style.display = 'none';
            stYTVideos = [];
            stYTCurrentIdx = 0;

            contentEl.innerHTML = '<div class="st-loading"><i class="fa-solid fa-compact-disc fa-spin" style="font-size:32px;color:#a855f7;"></i>'
                + '<p style="color:#a855f7;margin-top:14px;">' + (isFA ? 'در حال جستجوی موسیقی متن...' : 'Searching soundtracks...') + '</p></div>';

            var year = curDataForFav ? ((curDataForFav.release_date || curDataForFav.first_air_date || '').split('-')[0]) : '';
            var originalTitle = curDataForFav ? (curDataForFav.original_title || curDataForFav.original_name || curTitle || '') : (curTitle || '');
            
            // Search YouTube for official soundtrack playlist
            var ytVideos = await fetchYTSoundtrackVideos(curTitle || '', originalTitle, year);

            if (!ytVideos || ytVideos.length === 0) {
                var searchQ = encodeURIComponent((curTitle || '') + ' official soundtrack');
                contentEl.innerHTML = '<div style="text-align:center;padding:60px 20px;position:relative;z-index:2;">'
                    + '<div style="font-size:52px;margin-bottom:14px;">🎵</div>'
                    + '<div style="color:#777;font-size:14px;margin-bottom:16px;">' + (isFA ? 'موسیقی متن یافت نشد.' : 'No soundtrack found.') + '</div>'
                    + '<a href="https://www.youtube.com/results?search_query=' + searchQ + '" target="_blank" style="display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:rgba(255,0,0,0.15);border:1px solid rgba(255,0,0,0.3);border-radius:20px;color:#ff6666;font-size:13px;text-decoration:none;">'
                    + '<svg viewBox="0 0 20 14" width="16" height="11" fill="currentColor"><path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2.1 3.8 0 7 0 7s.1 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.3-1.6.4-4.8.4-4.8s-.1-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/></svg>'
                    + (isFA ? 'جستجو در یوتیوب' : 'Search on YouTube') + '</a>'
                    + '</div>';
                return;
            }
            
            stYTVideos = ytVideos;
            renderYTSoundtrackList(ytVideos, isFA);
        }

        async function fetchYTSoundtrackVideos(title, originalTitle, year) {
            // Try multiple search queries to find best results
            var queries = [
                title + ' ' + year + ' official soundtrack',
                title + ' original motion picture soundtrack',
                originalTitle + ' ' + year + ' soundtrack',
                title + ' full soundtrack album',
            ];
            
            for (var qi = 0; qi < queries.length; qi++) {
                try {
                    var url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + encodeURIComponent(queries[qi]) + '&type=video&maxResults=15&videoCategoryId=10&key=' + YT_API_KEY;
                    var r = await fetch(url);
                    if (!r.ok) continue;
                    var data = await r.json();
                    if (data && data.items && data.items.length > 0) {
                        // Filter to get most relevant - prioritize official soundtrack videos
                        var vids = data.items.map(function(item) {
                            return {
                                videoId: item.id.videoId,
                                title: item.snippet.title,
                                channel: item.snippet.channelTitle,
                                thumbnail: (item.snippet.thumbnails.medium || item.snippet.thumbnails.default || {}).url || '',
                                publishedAt: item.snippet.publishedAt
                            };
                        });
                        // Filter out unrelated
                        var titleLower = title.toLowerCase();
                        var filtered = vids.filter(function(v) {
                            var vtl = v.title.toLowerCase();
                            return vtl.includes('soundtrack') || vtl.includes('ost') || vtl.includes('score') || vtl.includes('theme') || vtl.includes('music');
                        });
                        if (filtered.length >= 3) return filtered;
                        if (vids.length >= 3) return vids.slice(0, 10);
                    }
                } catch(e) {}
            }
            return null;
        }

        function renderYTSoundtrackList(videos, isFA) {
            var contentEl = document.getElementById('st-content');
            var miniPlayer = document.getElementById('st-mini-player');
            
            var html = '<div style="position:relative;z-index:2;padding-bottom:10px;">';
            html += '<div style="font-size:11px;color:rgba(255,255,255,0.35);text-align:center;padding:8px 0 14px;">'
                + videos.length + ' ' + (isFA ? 'قطعه' : 'tracks') + '</div>';
            
            videos.forEach(function(v, i) {
                var even = i % 2 === 0;
                html += '<div class="st-yt-track" id="st-track-' + i + '" onclick="playSTTrack(' + i + ')" style="display:flex;align-items:center;gap:12px;padding:11px 14px;background:' + (even ? 'rgba(255,255,255,0.025)' : 'transparent') + ';border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:background 0.15s;">'
                    + '<div style="position:relative;flex-shrink:0;width:64px;height:48px;border-radius:6px;overflow:hidden;">'
                    + '<img src="' + v.thumbnail + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.src=\'\';this.parentElement.style.background=\'#2d0060\';">'
                    + '<div class="st-play-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);">'
                    + '<div style="width:22px;height:22px;border-radius:50%;background:rgba(168,85,247,0.9);display:flex;align-items:center;justify-content:center;">'
                    + '<svg viewBox="0 0 10 12" width="8" height="9" fill="white"><polygon points="1,1 9,6 1,11"/></svg>'
                    + '</div></div></div>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="font-size:13px;color:#e0e0e0;font-weight:600;margin-bottom:3px;line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">' + (v.title || '') + '</div>'
                    + '<div style="font-size:11px;color:#666;">' + (v.channel || '') + '</div>'
                    + '</div>'
                    + '<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">'
                    + '<div style="width:28px;height:28px;border-radius:50%;background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.3);display:flex;align-items:center;justify-content:center;color:#a855f7;font-size:11px;" id="st-track-icon-' + i + '">'
                    + '<svg viewBox="0 0 10 12" width="9" height="10" fill="currentColor"><polygon points="1,1 9,6 1,11"/></svg></div>'
                    + '<a href="https://www.youtube.com/watch?v=' + v.videoId + '" target="_blank" onclick="event.stopPropagation()" style="width:28px;height:28px;border-radius:50%;background:rgba(255,0,0,0.12);border:1px solid rgba(255,0,0,0.25);display:flex;align-items:center;justify-content:center;color:#ff5555;font-size:10px;text-decoration:none;" title="YouTube">'
                    + '<svg viewBox="0 0 20 14" width="12" height="8" fill="currentColor"><path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2.1 3.8 0 7 0 7s.1 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.3-1.6.4-4.8.4-4.8s-.1-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/></svg>'
                    + '</a></div>'
                    + '</div>';
            });
            html += '</div>';
            contentEl.innerHTML = html;
        }

        function playSTTrack(idx) {
            if (!stYTVideos || idx < 0 || idx >= stYTVideos.length) return;
            stYTCurrentIdx = idx;
            var v = stYTVideos[idx];
            var miniPlayer = document.getElementById('st-mini-player');
            var ytEmbed = document.getElementById('st-yt-embed');
            var isFA = LANG === 'fa';

            // Highlight active track
            document.querySelectorAll('[id^="st-track-"]').forEach(function(el, i) {
                if (el.id.startsWith('st-track-') && !el.id.startsWith('st-track-icon-')) {
                    el.style.background = 'transparent';
                    el.style.borderLeft = 'none';
                }
            });
            var activeTrack = document.getElementById('st-track-' + idx);
            if (activeTrack) {
                activeTrack.style.background = 'rgba(168,85,247,0.12)';
                activeTrack.style.borderLeft = '3px solid #a855f7';
            }

            // Update mini player
            document.getElementById('st-np-title').textContent = v.title || '';
            document.getElementById('st-np-artist').textContent = v.channel || '';
            document.getElementById('st-np-label').textContent = isFA ? '🎵 در حال پخش' : '🎵 Now Playing';
            
            // Set cover art
            var coverEl = document.getElementById('st-cover-art');
            if (coverEl && v.thumbnail) {
                coverEl.style.backgroundImage = 'url(' + v.thumbnail + ')';
                coverEl.style.backgroundSize = 'cover';
                coverEl.innerHTML = '';
            }
            
            // Update play icon in list
            document.querySelectorAll('[id^="st-track-icon-"]').forEach(function(el) {
                el.innerHTML = '<svg viewBox="0 0 10 12" width="9" height="10" fill="currentColor"><polygon points="1,1 9,6 1,11"/></svg>';
                el.style.color = '#a855f7';
            });
            var activeIcon = document.getElementById('st-track-icon-' + idx);
            if (activeIcon) {
                activeIcon.innerHTML = '<i class="fa-solid fa-volume-high" style="font-size:10px;"></i>';
                activeIcon.style.color = '#a855f7';
            }

            // Embed YouTube player
            var embedHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#000;width:100%;height:100%;overflow:hidden;}iframe{width:100%;height:100%;border:none;}</style>\n</head><body><iframe src="https://www.youtube.com/embed/' + v.videoId + '?autoplay=1&playsinline=1&rel=0&modestbranding=1" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></body></html>';
            
            if (ytEmbed) {
                ytEmbed.style.display = 'block';
                ytEmbed.innerHTML = '<div style="position:relative;width:100%;padding-top:56.25%;background:#000;border-radius:12px;overflow:hidden;margin-bottom:8px;">'
                    + '<iframe id="st-yt-iframe" style="position:absolute;inset:0;width:100%;height:100%;border:none;" srcdoc="' + embedHtml.replace(/"/g, '&quot;') + '" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>'
                    + '</div>'
                    + '<button onclick="stClosePlayer()" style="width:100%;background:#1a1a1a;color:#aaa;border:none;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;font-family:inherit;margin-bottom:6px;">'
                    + (isFA ? '✕ بستن پلیر' : '✕ Close Player') + '</button>';
            }

            if (miniPlayer) {
                miniPlayer.style.display = 'block';
                document.getElementById('st-pp-icon').className = 'fa-solid fa-pause';
            }
        }

        function stClosePlayer() {
            var ytEmbed = document.getElementById('st-yt-embed');
            var miniPlayer = document.getElementById('st-mini-player');
            if (ytEmbed) { ytEmbed.innerHTML = ''; ytEmbed.style.display = 'none'; }
            if (miniPlayer) miniPlayer.style.display = 'none';
            document.querySelectorAll('[id^="st-track-"]').forEach(function(el) {
                if (!el.id.startsWith('st-track-icon-')) {
                    el.style.background = 'transparent';
                    el.style.borderLeft = 'none';
                }
            });
        }

        function stTogglePlay() {
            // Toggle play/pause in iframe - just close/reopen
            var iframe = document.getElementById('st-yt-iframe');
            if (!iframe) { if (stYTCurrentIdx >= 0) playSTTrack(stYTCurrentIdx); return; }
        }

        function stNext() {
            if (stYTVideos.length === 0) return;
            var nextIdx = (stYTCurrentIdx + 1) % stYTVideos.length;
            playSTTrack(nextIdx);
        }

        function stPrev() {
            if (stYTVideos.length === 0) return;
            var prevIdx = (stYTCurrentIdx - 1 + stYTVideos.length) % stYTVideos.length;
            playSTTrack(prevIdx);
        }

        function stSeek(e) {} // placeholder

        async function stFetchFromAI(title, originalTitle, year, type) {
            var prompt = 'List the official soundtrack tracks for the ' + (type === 'tv' ? 'TV show' : 'film') + ' "' + title + '"' + (originalTitle && originalTitle !== title ? ' (also known as: ' + originalTitle + ')' : '') + (year ? ' (' + year + ')' : '') + '. Include original score compositions and licensed songs used in the film/show. Return ONLY a JSON array, no text before or after: [{"num":1,"name":"Exact Track Name","artist":"Composer or Artist Name"}]. If you do not know this film, return an empty array []';
            
            function parseResult(text) {
                if (!text) return null;
                var p = stParseJSON(text);
                if (p && p.length > 0) {
                    // Filter out obviously wrong results
                    var valid = p.filter(function(t) { return t.name && t.name.length > 1 && t.name !== 'Track 1'; });
                    if (valid.length > 0) return stNormalizeTracks(valid);
                }
                return null;
            }

            // FN-CF-AI: Cloudflare first, then Pollinations below (kept as backup).
            try { var cfT = await _aiGenerateText(prompt, { maxTokens: 2000, temperature: 0.1, timeout: 45000 }); var cfR = parseResult(cfT); if (cfR) return cfR; } catch(eCF) {}
            // METHOD 1: Pollinations GET
            try {
                var r = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai-large&seed=7&nologo=true', { signal: AbortSignal.timeout(25000) });
                if (r.ok) { var t = await r.text(); var res = parseResult(t); if (res) return res; }
            } catch(e) {}
            // METHOD 2: Pollinations POST
            try {
                var r2 = await fetch('https://text.pollinations.ai/openai', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(25000),
                    body: JSON.stringify({ model: 'openai-large', messages: [
                        { role: 'system', content: 'You are a film music expert. Return ONLY valid JSON arrays. Never return explanatory text.' },
                        { role: 'user', content: prompt }
                    ], max_tokens: 2000, temperature: 0.1 })
                });
                if (r2.ok) { var d2 = await r2.json(); var raw2 = d2.choices && d2.choices[0] && d2.choices[0].message && d2.choices[0].message.content; var res2 = parseResult(raw2); if (res2) return res2; }
            } catch(e2) {}
            // METHOD 3: Try with a simpler, more focused prompt
            try {
                var simplePrompt = 'Soundtrack tracklist for "' + title + '" ' + (year||'') + ' as JSON array: [{"num":1,"name":"track name","artist":"artist"}]';
                var r3 = await fetch('https://text.pollinations.ai/' + encodeURIComponent(simplePrompt) + '?model=openai&seed=3&nologo=true', { signal: AbortSignal.timeout(20000) });
                if (r3.ok) { var t3 = await r3.text(); var res3 = parseResult(t3); if (res3) return res3; }
            } catch(e3) {}
            return null;
        }

        function stParseJSON(raw) {
            if (!raw) return null;
            var clean = raw.replace(/```json|```/g, '').trim();
            var a1 = clean.indexOf('['), a2 = clean.lastIndexOf(']');
            if (a1 >= 0 && a2 > a1) { try { var arr = JSON.parse(clean.substring(a1, a2+1)); if (Array.isArray(arr) && arr.length > 0) return arr; } catch(e) {} }
            var j1 = clean.indexOf('{'), j2 = clean.lastIndexOf('}');
            if (j1 >= 0 && j2 > j1) { try { var obj = JSON.parse(clean.substring(j1,j2+1)); var a = obj.tracks||obj.soundtrack||obj.tracklist; if (Array.isArray(a)&&a.length>0) return a; } catch(e) {} }
            return null;
        }

        function stNormalizeTracks(arr) {
            return arr.map(function(t, i) {
                return { num: t.num||t.number||(i+1), name: t.name||t.title||t.track||('Track '+(i+1)), artist: t.artist||t.composer||t.by||'' };
            });
        }

        function renderStTrackList(tracks) {
            var isFA = LANG === 'fa';
            var html = '<div style="position:relative;z-index:2;padding-bottom:30px;">';
            html += '<div style="font-size:11px;color:rgba(255,255,255,0.35);text-align:center;padding:8px 0 16px;">'
                + tracks.length + ' ' + (isFA ? 'قطعه' : 'tracks') + '</div>';
            tracks.forEach(function(t, i) {
                var even = i % 2 === 0;
                var ytQuery = encodeURIComponent((t.name||'') + ' ' + (t.artist||''));
                var ytUrl = 'https://www.youtube.com/results?search_query=' + ytQuery;
                html += '<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;background:' + (even ? 'rgba(255,255,255,0.02)' : 'transparent') + ';border-bottom:1px solid rgba(255,255,255,0.05);">'
                    + '<div style="min-width:26px;text-align:center;font-size:12px;color:rgba(168,85,247,0.6);font-weight:700;">' + (t.num||(i+1)) + '</div>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="font-size:14px;color:#e0e0e0;font-weight:600;margin-bottom:2px;">' + (t.name||'') + '</div>'
                    + '<div style="font-size:12px;color:#777;">' + (t.artist||'') + '</div>'
                    + '</div>'
                    + '<a href="' + ytUrl + '" target="_blank" onclick="event.stopPropagation()" style="width:32px;height:32px;border-radius:50%;background:rgba(255,0,0,0.15);border:1px solid rgba(255,0,0,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ff4444;font-size:12px;text-decoration:none;" title="' + (isFA ? 'جستجو در یوتیوب' : 'Search on YouTube') + '">'
                    + '<svg viewBox="0 0 20 14" width="13" height="9" fill="currentColor"><path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2.1 3.8 0 7 0 7s.1 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.3-1.6.4-4.8.4-4.8s-.1-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/></svg>'
                    + '</a>'
                    + '</div>';
            });
            html += '</div>';
            var el = document.getElementById('st-content');
            if (el) el.innerHTML = html;
        }

        function closeSoundtracks() {
            document.getElementById('soundtracks-modal').classList.remove('open');
        }
        // =================== END SOUNDTRACKS ===================



        
        function openLightbox(url) {
            const lb = document.getElementById('ss-lightbox');
            document.getElementById('ss-lightbox-img').src = url;
            lb.style.display = 'flex';
        }
        
        function closeLightbox() {
            document.getElementById('ss-lightbox').style.display = 'none';
            document.getElementById('ss-lightbox-img').src = '';
        }
        
        // --- RUNTIME FORMATTER ---
        function formatRuntime(minutes, isApprox) {
            if (!minutes || minutes <= 0) return null;
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            let label = '';
            if (h > 0 && m > 0) label = `${h}h ${m}m`;
            else if (h > 0) label = `${h}h`;
            else label = `${m}m`;
            return { label, isApprox: !!isApprox };
        }
        
        // --- AWARDS FORMATTER ---
        function formatAwards(data, type) {
            // Parse TMDB award data from external_ids or awards field
            // We'll fetch from OMDb-style summary embedded in TMDB
            // TMDB doesn't have direct award data - we extract from known fields
            return null; // Will be filled in openDetail via separate fetch
        }
        
        // --- LAZY DOWNLOAD BADGE CHECKER (after page renders) ---
        // Only marks items that have real Download Box entries in DOWNLOADS_DB (softsub or dubbed)
        // Does NOT mark items that only have internal download (VidSrc VIP) - all items have that
        async function checkLazyDlBadges() {
            const lazyBadges = document.querySelectorAll('.dl-badge-lazy');
            const batch = Array.from(lazyBadges).slice(0, 30);
            let cacheChanged = false;
            for (const badge of batch) {
                const tmdbId = badge.getAttribute('data-tmdb');
                const type = badge.getAttribute('data-type');
                if (!tmdbId || badge.dataset.checked) continue;
                badge.dataset.checked = '1';
                
                // Skip if already in cache
                if (DL_CACHE[tmdbId] !== undefined) {
                    if (DL_CACHE[tmdbId] === true) {
                        badge.classList.remove('dl-badge-lazy');
                        badge.innerHTML = '<i class="fa-solid fa-download"></i>';
                        badge.classList.add('show');
                    } else {
                        badge.remove();
                    }
                    continue;
                }
                
                try {
                    const d = await getData(`${type}/${tmdbId}?append_to_response=external_ids`);
                    if (d && d.external_ids && d.external_ids.imdb_id) {
                        const imdbId = d.external_ids.imdb_id;
                        // Only true if DOWNLOADS_DB has real download links (softsub/dubbed), NOT just internal
                        const dbEntry = DOWNLOADS_DB && DOWNLOADS_DB[imdbId];
                        const hasDl = !!(dbEntry && (
                            (dbEntry.softsub && Object.keys(dbEntry.softsub).length > 0) ||
                            (dbEntry.dubbed && Object.keys(dbEntry.dubbed).length > 0)
                        ));
                        DL_CACHE[tmdbId] = hasDl;
                        cacheChanged = true;
                        if (hasDl) {
                            badge.classList.remove('dl-badge-lazy');
                            badge.innerHTML = '<i class="fa-solid fa-download"></i>';
                            badge.classList.add('show');
                        } else {
                            badge.remove();
                        }
                    } else {
                        DL_CACHE[tmdbId] = false;
                        cacheChanged = true;
                        badge.remove();
                    }
                } catch(e) {}
                // Small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 150));
            }
            if (cacheChanged) {
                try { localStorage.setItem('dl_cache', JSON.stringify(DL_CACHE)); } catch(e) {}
            }
            // Continue checking remaining badges after a short pause
            const remaining = document.querySelectorAll('.dl-badge-lazy');
            if (remaining.length > 0) {
                setTimeout(checkLazyDlBadges, 500);
            }
        }
        // =================== COMPANIES DATA & LOGIC ===================
        // TMDB verified IDs. isNetwork:true → with_networks for TV; companyId → with_companies for movies
        // extraIds: additional TMDB company IDs to merge results (for studios with multiple subsidiaries)
        const COMPANIES_DB = [
            // ── STREAMING PLATFORMS ──
            { name:'Netflix',              nameFA:'نتفلیکس',               type:'Streaming',   isNetwork:true,  networkId:213,   companyId:213,   extraIds:[],
              logo:'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/netflix.svg',                                                      bg:'#E50914', emoji:'N', noInvert:true },
            { name:'HBO',                  nameFA:'اچ‌بی‌اُ',               type:'Cable TV',    isNetwork:true,  networkId:49,    companyId:3268,  extraIds:[49],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/HBO_logo.svg/800px-HBO_logo.svg.png',                                bg:'#ffffff', emoji:'H', noInvert:true },
            { name:'Max',                  nameFA:'مکس',                   type:'Streaming',   isNetwork:true,  networkId:3268,  companyId:174,   extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/HBO_Max_Logo.svg/800px-HBO_Max_Logo.svg.png',                        bg:'#7B2FBE', emoji:'M', noInvert:true },
            { name:'Disney+',              nameFA:'دیزنی‌پلاس',             type:'Streaming',   isNetwork:true,  networkId:2739,  companyId:2,     extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/800px-Disney%2B_logo.svg.png',                    bg:'#b3d4f5', emoji:'D', noInvert:true },
            { name:'Apple TV+',            nameFA:'اپل تی‌وی‌پلاس',         type:'Streaming',   isNetwork:true,  networkId:2552,  companyId:2724,  extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Apple_TV_Plus_Logo.svg/800px-Apple_TV_Plus_Logo.svg.png',             bg:'#f5c518', emoji:'🍎', noInvert:true },
            { name:'Amazon Prime Video',   nameFA:'آمازون پرایم ویدیو',      type:'Streaming',   isNetwork:true,  networkId:1024,  companyId:19996, extraIds:[20580],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Amazon_Prime_Video_logo.svg/800px-Amazon_Prime_Video_logo.svg.png',  bg:'#ffffff', emoji:'A', noInvert:true },
            { name:'Hulu',                 nameFA:'هولو',                   type:'Streaming',   isNetwork:true,  networkId:453,   companyId:37853, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Hulu_Logo.svg/800px-Hulu_Logo.svg.png',                              bg:'#1CE783', emoji:'H', noInvert:true },
            { name:'Paramount+',           nameFA:'پارامونت‌پلاس',           type:'Streaming',   isNetwork:true,  networkId:4330,  companyId:4171,  extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Paramount_Plus_logo.svg/800px-Paramount_Plus_logo.svg.png',          bg:'#0064FF', emoji:'P', noInvert:true },
            { name:'Peacock',              nameFA:'پیکاک',                  type:'Streaming',   isNetwork:true,  networkId:3353,  companyId:10342, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/NBCUniversal_Peacock_Logo.svg/800px-NBCUniversal_Peacock_Logo.svg.png', bg:'#ffffff', emoji:'🦚', noInvert:true },
            { name:'MGM+',                 nameFA:'ام‌جی‌ام پلاس',            type:'Streaming',   isNetwork:true,  networkId:922,   companyId:8411,  extraIds:[8411],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/MGM%2B_logo.svg/800px-MGM%2B_logo.svg.png',                         bg:'#111111', emoji:'M+', noInvert:true },
            // ── MAJOR STUDIOS ──
            { name:'Warner Bros.',         nameFA:'وارنر برادرز',            type:'Studio',      isNetwork:false, networkId:174,   companyId:174,   extraIds:[2785,3172],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Warner_Bros_logo.svg/800px-Warner_Bros_logo.svg.png',                 bg:'#1a1a6e', emoji:'W', noInvert:true },
            { name:'Universal Pictures',   nameFA:'یونیورسال پیکچرز',        type:'Studio',      isNetwork:false, networkId:33,    companyId:33,    extraIds:[10201],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Universal_Pictures_logo.svg/800px-Universal_Pictures_logo.svg.png',   bg:'#000000', emoji:'U', noInvert:true },
            { name:'Columbia Pictures',    nameFA:'کلمبیا پیکچرز',           type:'Studio',      isNetwork:false, networkId:25,    companyId:5,     extraIds:[25],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Columbia_Pictures_logo.svg/800px-Columbia_Pictures_logo.svg.png',     bg:'#3c91d4', emoji:'C', noInvert:true },
            { name:'Marvel Studios',       nameFA:'مارول استودیوز',           type:'Studio',      isNetwork:false, networkId:420,   companyId:420,   extraIds:[7505],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/800px-Marvel_Logo.svg.png',                          bg:'#1b2838', emoji:'M', noInvert:true },
            { name:'Walt Disney Pictures', nameFA:'والت دیزنی پیکچرز',       type:'Studio',      isNetwork:false, networkId:2,     companyId:2,     extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Walt_Disney_Pictures_logo.svg/800px-Walt_Disney_Pictures_logo.svg.png', bg:'#001F5F', emoji:'D', noInvert:true },
            { name:'Paramount Pictures',   nameFA:'پارامونت پیکچرز',          type:'Studio',      isNetwork:false, networkId:4171,  companyId:4171,  extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Paramount_Pictures_2014.svg/800px-Paramount_Pictures_2014.svg.png',   bg:'#0033A0', emoji:'P', noInvert:true },
            { name:'Sony Pictures',        nameFA:'سونی پیکچرز',             type:'Studio',      isNetwork:false, networkId:34,    companyId:34,    extraIds:[5,7576],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Sony_logo.svg/800px-Sony_logo.svg.png',                              bg:'#000000', emoji:'S', noInvert:true },
            { name:'20th Century Studios', nameFA:'قرن بیستم استودیوز',       type:'Studio',      isNetwork:false, networkId:25,    companyId:127928,extraIds:[25],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/20th_Century_Studios_2020.svg/800px-20th_Century_Studios_2020.svg.png', bg:'#00224e', emoji:'2', noInvert:true },
            { name:'MGM',                  nameFA:'ام‌جی‌ام',                 type:'Studio',      isNetwork:false, networkId:8411,  companyId:8411,  extraIds:[16,1270,7352],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/MGM_logo_%282012%29.svg/800px-MGM_logo_%282012%29.svg.png',           bg:'#8b0000', emoji:'M', noInvert:true },
            { name:'TriStar Pictures',      nameFA:'تری‌استار پیکچرز',          type:'Studio',      isNetwork:false, networkId:559,   companyId:559,   extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/TriStar_Pictures_logo.svg/800px-TriStar_Pictures_logo.svg.png',       bg:'#101010', emoji:'T', noInvert:true },
            { name:'Lionsgate',            nameFA:'لاینزگیت',                type:'Studio',      isNetwork:false, networkId:521,   companyId:521,   extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Lionsgate_logo.svg/800px-Lionsgate_logo.svg.png',                    bg:'#000000', emoji:'L', noInvert:true },
            { name:'A24',                  nameFA:'ای‌۲۴',                    type:'Studio',      isNetwork:false, networkId:41077, companyId:41077, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/A24_logo_black.svg/800px-A24_logo_black.svg.png',                    bg:'#000000', emoji:'A' },
            { name:'New Line Cinema',      nameFA:'نیو لاین سینما',           type:'Studio',      isNetwork:false, networkId:12,    companyId:12,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/New_Line_Cinema_Logo.svg/800px-New_Line_Cinema_Logo.svg.png',         bg:'#c8102e', emoji:'N', noInvert:true },
            { name:'Pixar',                nameFA:'پیکسار',                  type:'Animation',   isNetwork:false, networkId:3,     companyId:3,     extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Pixar_logo.svg/800px-Pixar_logo.svg.png',                            bg:'#0078b4', emoji:'P', noInvert:true },
            { name:'DreamWorks Animation', nameFA:'دریم‌ورکز انیمیشن',        type:'Animation',   isNetwork:false, networkId:6194,  companyId:6194,  extraIds:[521,14],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/DreamWorks_Animation_2021_%28white%29.svg/800px-DreamWorks_Animation_2021_%28white%29.svg.png', bg:'#1a3a6e', emoji:'D', noInvert:true },
            { name:'DC Studios',           nameFA:'دی‌سی استودیوز',           type:'Studio',      isNetwork:false, networkId:9993,  companyId:9993,  extraIds:[174,429],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/DC_Comics_logo.svg/800px-DC_Comics_logo.svg.png',                    bg:'#0057B7', emoji:'D', noInvert:true },
            { name:'Miramax',              nameFA:'میراماکس',                type:'Studio',      isNetwork:false, networkId:14,    companyId:14,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Miramax_Logo.svg/800px-Miramax_Logo.svg.png',                        bg:'#1a1a1a', emoji:'M', noInvert:true },
            // ── TV NETWORKS ──
            { name:'FX',                   nameFA:'اف‌ایکس',                 type:'Cable TV',    isNetwork:true,  networkId:55,    companyId:55,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/FX_International_logo.svg/800px-FX_International_logo.svg.png',       bg:'#000000', emoji:'F', noInvert:true },
            { name:'NBC',                  nameFA:'ان‌بی‌سی',                 type:'Network',     isNetwork:true,  networkId:6,     companyId:13,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/NBC_logo.svg/800px-NBC_logo.svg.png',                                bg:'#000000', emoji:'N', noInvert:true },
            { name:'CBS',                  nameFA:'سی‌بی‌اس',                 type:'Network',     isNetwork:true,  networkId:16,    companyId:16,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/CBS_logo.svg/800px-CBS_logo.svg.png',                                bg:'#ffffff', emoji:'C', noInvert:true },
            { name:'Showtime',             nameFA:'شوتایم',                  type:'Cable TV',    isNetwork:true,  networkId:67,    companyId:67,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Showtime.svg/800px-Showtime.svg.png',                                bg:'#000000', emoji:'S', noInvert:true },
            { name:'AMC',                  nameFA:'ای‌ام‌سی',                 type:'Cable TV',    isNetwork:true,  networkId:174,   companyId:174,   extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/AMC_logo_2019.svg/800px-AMC_logo_2019.svg.png',                       bg:'#000000', emoji:'A', noInvert:true },
            // ── INDIE & SPECIALTY ──
            { name:'Focus Features',       nameFA:'فوکوس فیچرز',             type:'Studio',      isNetwork:false, networkId:1537,  companyId:1537,  extraIds:[10146],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Focus_Features.png/240px-Focus_Features.png',                             bg:'#1a1a1a', emoji:'F', noInvert:true },
            { name:'Blumhouse Productions',nameFA:'بلوم‌هاوس',               type:'Studio',      isNetwork:false, networkId:3172,  companyId:3172,  extraIds:[],
              logo:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 240'%3E%3Crect width='800' height='240' rx='24' fill='%231a1a1a'/%3E%3Cpath d='M100 62h45v116h-45zM85 62h75M85 178h75M145 62c42 0 42 55 0 55h-45M145 117c50 0 50 61 0 61h-45' fill='none' stroke='white' stroke-width='14'/%3E%3Ctext x='215' y='112' font-family='Arial,sans-serif' font-size='56' font-weight='900' fill='white'%3EBLUMHOUSE%3C/text%3E%3Ctext x='218' y='165' font-family='Arial,sans-serif' font-size='34' letter-spacing='5' fill='%23bbbbbb'%3EPRODUCTIONS%3C/text%3E%3C/svg%3E", bg:'#1a1a1a', emoji:'👻', noInvert:true,
              description:'Known for high-concept, micro-budget horror and thriller productions.',
              verifiedMovieTitles:[{title:'Paranormal Activity',year:2007},{title:'Paranormal Activity 2',year:2010},{title:'Paranormal Activity 3',year:2011},{title:'Paranormal Activity 4',year:2012},{title:'Paranormal Activity: The Marked Ones',year:2014},{title:'Paranormal Activity: The Ghost Dimension',year:2015},{title:'The Purge',year:2013},{title:'The Purge: Anarchy',year:2014},{title:'The Purge: Election Year',year:2016},{title:'The First Purge',year:2018},{title:'The Forever Purge',year:2021},{title:'Insidious',year:2010},{title:'Insidious: Chapter 2',year:2013},{title:'Insidious: Chapter 3',year:2015},{title:'Insidious: The Last Key',year:2018},{title:'Insidious: The Red Door',year:2023},{title:'Sinister',year:2012},{title:'Sinister 2',year:2015},{title:'Get Out',year:2017},{title:'Happy Death Day',year:2017},{title:'Happy Death Day 2U',year:2019},{title:'Upgrade',year:2018},{title:'Truth or Dare',year:2018},{title:'Unfriended',year:2014},{title:'Unfriended: Dark Web',year:2018},{title:'Halloween',year:2018},{title:'Halloween Kills',year:2021},{title:'Halloween Ends',year:2022},{title:'The Invisible Man',year:2020},{title:'Freaky',year:2020},{title:'M3GAN',year:2022},{title:'M3GAN 2.0',year:2025},{title:'Five Nights at Freddy’s',year:2023},{title:'The Black Phone',year:2021},{title:'The Black Phone 2',year:2025},{title:'Imaginary',year:2024},{title:'Night Swim',year:2024},{title:'Speak No Evil',year:2024},{title:'Afraid',year:2024},{title:'Wolf Man',year:2025},{title:'The Exorcist: Believer',year:2023},{title:'The Visit',year:2015},{title:'Ouija',year:2014},{title:'Ouija: Origin of Evil',year:2016},{title:'Cam',year:2018},{title:'Stephanie',year:2017},{title:'The Gift',year:2015},{title:'Ma',year:2019},{title:'Black Christmas',year:2019},{title:'Bloodlines',year:2025}],
              verifiedTvTitles:[{title:'The Purge',year:2018},{title:'Into the Dark',year:2018},{title:'Sharp Objects',year:2018},{title:'The Good Lord Bird',year:2020},{title:'Welcome to the Blumhouse',year:2020},{title:'The Horror of Dolores Roach',year:2023}] },
            { name:'Amblin Entertainment', nameFA:'امبلین انترتینمنت',        type:'Production',  isNetwork:false, networkId:56,    companyId:56,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Amblin_Entertainment_logo.png/220px-Amblin_Entertainment_logo.png',        bg:'#192560', emoji:'🌙', noInvert:true },
            { name:'Working Title Films',  nameFA:'ورکینگ تایتل فیلمز',       type:'Studio',      isNetwork:false, networkId:10163, companyId:10163, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Working_Title_Films_logo.svg/800px-Working_Title_Films_logo.svg.png',  bg:'#1a1a1a', emoji:'🎥', noInvert:true },
            { name:'Neon',                 nameFA:'نئون',                    type:'Distribution',isNetwork:false, networkId:23297, companyId:23297, extraIds:[167337,92829],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Neon_%28company%29_logo.svg/800px-Neon_%28company%29_logo.svg.png',   bg:'#cc00cc', emoji:'💡', noInvert:true },
            { name:'Bad Robot',            nameFA:'بد روبات',                type:'Production',  isNetwork:false, networkId:11461, companyId:11461, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/a/aa/Bad_Robot_logo.png/220px-Bad_Robot_logo.png',                             bg:'#1a1a1a', emoji:'🤖', noInvert:true },
            // ── MORE PRODUCTION COMPANIES ──
            { name:'Happy Madison Productions', nameFA:'هپی مدیسون',          type:'Production',  isNetwork:false, networkId:9865,  companyId:9865,  extraIds:[4906,9865],
              logo:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 240'%3E%3Crect width='800' height='240' rx='24' fill='%232a1500'/%3E%3Ccircle cx='120' cy='120' r='68' fill='%23f5a623'/%3E%3Cpath d='M82 108q38 48 76 0M94 91h2m48 0h2' stroke='%232a1500' stroke-width='10' fill='none' stroke-linecap='round'/%3E%3Ctext x='215' y='112' font-family='Arial,sans-serif' font-size='58' font-weight='900' fill='white'%3EHAPPY%3C/text%3E%3Ctext x='215' y='174' font-family='Arial,sans-serif' font-size='52' font-weight='900' fill='%23f5a623'%3EMADISON%3C/text%3E%3C/svg%3E", bg:'#2a1500', emoji:'😄', noInvert:true,
              verifiedMovieTitles:[{title:'Deuce Bigalow: Male Gigolo',year:1999},{title:'Little Nicky',year:2000},{title:'Joe Dirt',year:2001},{title:'The Animal',year:2001},{title:'Mr. Deeds',year:2002},{title:'The Master of Disguise',year:2002},{title:'Eight Crazy Nights',year:2002},{title:'The Hot Chick',year:2002},{title:'Anger Management',year:2003},{title:'Dickie Roberts: Former Child Star',year:2003},{title:'50 First Dates',year:2004},{title:'The Longest Yard',year:2005},{title:'Deuce Bigalow: European Gigolo',year:2005},{title:"Grandma's Boy",year:2006},{title:'The Benchwarmers',year:2006},{title:'Click',year:2006},{title:'Reign Over Me',year:2007},{title:'I Now Pronounce You Chuck & Larry',year:2007},{title:'Strange Wilderness',year:2008},{title:"You Don't Mess with the Zohan",year:2008},{title:'The House Bunny',year:2008},{title:'Bedtime Stories',year:2008},{title:'Paul Blart: Mall Cop',year:2009},{title:'Funny People',year:2009},{title:'The Shortcut',year:2009},{title:'Grown Ups',year:2010},{title:'Just Go with It',year:2011},{title:'Zookeeper',year:2011},{title:'Bucky Larson: Born to Be a Star',year:2011},{title:'Jack and Jill',year:2011},{title:"That's My Boy",year:2012},{title:'Here Comes the Boom',year:2012},{title:'Grown Ups 2',year:2013},{title:'Blended',year:2014},{title:'Paul Blart: Mall Cop 2',year:2015},{title:'Joe Dirt 2: Beautiful Loser',year:2015},{title:'Pixels',year:2015},{title:'The Ridiculous 6',year:2015},{title:'The Do-Over',year:2016},{title:'Sandy Wexler',year:2017},{title:'The Week Of',year:2018},{title:'Father of the Year',year:2018},{title:'Murder Mystery',year:2019},{title:'The Wrong Missy',year:2020},{title:'Hubie Halloween',year:2020},{title:'Home Team',year:2022},{title:'Hustle',year:2022},{title:'Murder Mystery 2',year:2023},{title:'The Out-Laws',year:2023},{title:'You Are So Not Invited to My Bat Mitzvah',year:2023},{title:'Leo',year:2023},{title:'Kinda Pregnant',year:2025},{title:'Happy Gilmore 2',year:2025},{title:'Roommates',year:2026},{title:"Don't Say Good Luck",year:2026},{title:'Dad Camp',year:2026}],
              includeDiscoverCatalog:true,
              verifiedTvTitles:[{title:'Rules of Engagement',year:2007},{title:'The Gong Show with Dave Attell',year:2008},{title:"Nick Swardson's Pretend Time",year:2010},{title:'Breaking In',year:2011},{title:'The Goldbergs',year:2013}],
              imdbIds:['tt0142235','tt0202470','tt0264395','tt0269461','tt0311289','tt0318374','tt0368052','tt0368271','tt0421823','tt0432337','tt0437946','tt0479884','tt0497465','tt0499549','tt0762108','tt0800080','tt0800369','tt0810819','tt0836199','tt1001508','tt1267297','tt1510650','tt1623690','tt1772341','tt1860213','tt1905041','tt2098628','tt2199571','tt2310332','tt2401645','tt3553976','tt4327210','tt6763664','tt8078800','tt9474732','tt0120731','tt0160127','tt0181649','tt0299706','tt0349944'],
              imdbTvIds:['tt0756104','tt2400736','tt1831575','tt1615919','tt0319061'] },
            { name:'Illumination',         nameFA:'ایلومینیشن',               type:'Animation',   isNetwork:false, networkId:6704,  companyId:6704,  extraIds:[33],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Illumination_logo.svg/800px-Illumination_logo.svg.png',               bg:'#000000', emoji:'🌟', noInvert:true },
            { name:'Legendary Pictures',   nameFA:'لجندری پیکچرز',            type:'Studio',      isNetwork:false, networkId:923,   companyId:923,   extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/7/72/Legendary_Entertainment_logo.png/220px-Legendary_Entertainment_logo.png',  bg:'#1a1a1a', emoji:'⚔️', noInvert:true },
            { name:'Skydance Media',       nameFA:'اسکای‌دنس مدیا',            type:'Production',  isNetwork:false, networkId:67303, companyId:67303, extraIds:[4171,174,33],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Skydance_Media_logo.svg/800px-Skydance_Media_logo.svg.png',           bg:'#1a2a4a', emoji:'🚀', noInvert:true },
            { name:'Village Roadshow',     nameFA:'ویلیج رودشو',              type:'Studio',      isNetwork:false, networkId:79,    companyId:79,    extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/9/9b/Village_Roadshow_Pictures_logo.png/220px-Village_Roadshow_Pictures_logo.png', bg:'#1a1a1a', emoji:'🎪', noInvert:true },
            { name:'Regency Enterprises',  nameFA:'ریجنسی انترپرایزز',         type:'Production',  isNetwork:false, networkId:508,   companyId:508,   extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Regency_Enterprises.png/220px-Regency_Enterprises.png',                   bg:'#1a1a1a', emoji:'👑', noInvert:true },
            { name:'Plan B Entertainment', nameFA:'پلن‌بی انترتینمنت',         type:'Production',  isNetwork:false, networkId:1885,  companyId:1885,  extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/c/c1/Plan_B_Entertainment_logo.png/220px-Plan_B_Entertainment_logo.png',        bg:'#1a1a1a', emoji:'🎭', noInvert:true },
            { name:'Imagine Entertainment', nameFA:'ایمجین انترتینمنت',        type:'Production',  isNetwork:false, networkId:289,   companyId:289,   extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/1/1e/Imagine_Entertainment_logo.png/220px-Imagine_Entertainment_logo.png',      bg:'#1a1a1a', emoji:'💭', noInvert:true },
            { name:'Annapurna Pictures',   nameFA:'آنه‌پورنا پیکچرز',          type:'Studio',      isNetwork:false, networkId:19726, companyId:19726, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Annapurna_Pictures_logo.svg/800px-Annapurna_Pictures_logo.svg.png',   bg:'#3d0045', emoji:'🏔️', noInvert:true },
            { name:'Searchlight Pictures', nameFA:'سرچ‌لایت پیکچرز',           type:'Studio',      isNetwork:false, networkId:7295,  companyId:7295,  extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Searchlight_Pictures_logo.svg/800px-Searchlight_Pictures_logo.svg.png', bg:'#1a1a1a', emoji:'🔦', noInvert:true },
            { name:'BBC Studios',          nameFA:'بی‌بی‌سی استودیوز',          type:'Network',     isNetwork:true,  networkId:4,     companyId:1287,  extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/BBC_logo.svg/800px-BBC_logo.svg.png',                                 bg:'#000000', emoji:'📺', noInvert:true },
            { name:'Studio Ghibli',        nameFA:'استودیو جیبلی',             type:'Animation',   isNetwork:false, networkId:10342, companyId:10342, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/en/thumb/c/ca/Studio_Ghibli_logo.svg/800px-Studio_Ghibli_logo.svg.png',                  bg:'#ffffff', emoji:'🌿', noInvert:true },
            { name:'Janus Films',          nameFA:'یانوس فیلمز',              type:'Distribution',isNetwork:false, networkId:11576, companyId:11576, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Janus_Films_logo.svg/800px-Janus_Films_logo.svg.png',                 bg:'#1a1a1a', emoji:'🎭', noInvert:true,
              imdbIds:['tt0050976','tt0050986','tt0060827','tt0055499','tt0057530','tt0057611','tt0083922','tt0048641','tt0053976','tt0069467','tt0042876','tt0047478','tt0044741','tt0055630','tt0056443','tt0050613','tt0051808','tt0057565','tt0058888','tt0089881','tt0047528','tt0050783','tt0053779','tt0056801','tt0071129','tt0058898','tt0053619','tt0054130','tt0056736','tt0058003','tt0060176','tt0053198','tt0055031','tt0054389','tt0063136','tt0070460','tt0058604','tt0053472','tt0057345','tt0059592','tt0058892','tt0062480','tt0064612','tt0064122','tt0091288','tt0052893','tt0054632','tt0058946','tt0065234','tt0064040','tt0062229','tt0047892','tt0046268','tt0046911','tt0038348','tt0041719','tt0062136','tt0050706','tt0022100','tt0017136','tt0019254','tt0010323','tt0013442','tt0015864','tt0027977','tt0021749','tt0032553','tt0044837','tt0012349','tt0018773','tt0031885','tt0028950','tt0045274','tt0040522','tt0038890','tt0046478','tt0047445','tt0046438','tt0041154','tt0043465','tt0053397','tt0053134','tt0053114','tt0055237','tt0058279','tt0058430','tt0056058','tt0058625','tt0053146','tt0048473','tt0048956','tt0052572','tt0100234','tt0120265'] },
            { name:'Mosfilm',              nameFA:'موسفیلم',                  type:'Studio',      isNetwork:false, networkId:2566,  companyId:2566,  extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Mosfilm_logo.svg/800px-Mosfilm_logo.svg.png',                         bg:'#8b1a1a', emoji:'🎬', noInvert:true,
              imdbIds:['tt0015648','tt0029850','tt0037824','tt0040222','tt0050634','tt0052600','tt0056111','tt0060107','tt0063794','tt0069293','tt0072443','tt0075404','tt0079944','tt0079579','tt0091251','tt0091341','tt0110598','tt0120125','tt0851578','tt0488478','tt2318405','tt1966566','tt2802154','tt14874020','tt0062484','tt0065955','tt0069628','tt0073807','tt0066549','tt0071411','tt0079200','tt0076729','tt0076391','tt0073179','tt0072659','tt0087640','tt0092590','tt0088007','tt0090924','tt1101026','tt1343703','tt3039926','tt10147644','tt2188337','tt6537376','tt5541240','tt5624096','tt5278868','tt0049226','tt0046300','tt0049348','tt0039004','tt0062759','tt0067141','tt0066495','tt0084715','tt0091360','tt0087091','tt0405045','tt0403358','tt0409904','tt0416044','tt0454123','tt1578887','tt0403645','tt4084744','tt4731148','tt8060328','tt6673840','tt6537238','tt8820590','tt11905962','tt12536294','tt14539740','tt0049707','tt0050503','tt0058743','tt0059172','tt0060581','tt0079604'] },
            { name:'Dharma Productions × Yash Raj Films', nameFA:'دارما پروداکشنز × یاش راج فیلمز', type:'Production', isNetwork:false, networkId:2464, companyId:2464, extraIds:[1569],
              logo:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 280'%3E%3Crect width='1000' height='280' rx='26' fill='%231a0a2e'/%3E%3Ccircle cx='125' cy='140' r='72' fill='%23e9b44c'/%3E%3Cpath d='M125 76c-20 38-20 90 0 128M61 140c38-20 90-20 128 0M81 96c28 9 56 37 65 65M169 96c-28 9-56 37-65 65' stroke='%231a0a2e' stroke-width='9' fill='none'/%3E%3Ctext x='225' y='126' font-family='Georgia,serif' font-size='55' font-weight='700' fill='white'%3EDHARMA%3C/text%3E%3Ctext x='225' y='184' font-family='Arial,sans-serif' font-size='35' letter-spacing='3' fill='%23e9b44c'%3EPRODUCTIONS%3C/text%3E%3Cline x1='600' y1='45' x2='600' y2='235' stroke='%23ffffff' stroke-opacity='.35' stroke-width='3'/%3E%3Ctext x='635' y='135' font-family='Arial,sans-serif' font-size='62' font-weight='900' fill='%23f2c14e'%3EYRF%3C/text%3E%3Ctext x='635' y='184' font-family='Arial,sans-serif' font-size='24' letter-spacing='2' fill='white'%3EYASH RAJ FILMS%3C/text%3E%3C/svg%3E", bg:'#1a0a2e', emoji:'🎬', noInvert:true,
              imdbIds:['tt0172684','tt0248126','tt0347304','tt0449994','tt1185420','tt1324059','tt1114677','tt1188996','tt1849718','tt1605790','tt2172071','tt2178470','tt2704740','tt2372678','tt3678938','tt3322420','tt3859980','tt4253292','tt4900716','tt5061072','tt4559006','tt5946128','tt6277440','tt6692354','tt7098658','tt7638348','tt7212726','tt6264938','tt6988116','tt8519370','tt8504014','tt10350626','tt10295212','tt9531772','tt13841850','tt10857164','tt13131350','tt14295590','tt14993250','tt16333130','tt3173910','tt6277462','tt28259207','tt27510174','tt1505467','tt1483375','tt0420332','tt0101258'] },
            { name:'ABC', nameFA:'ای‌بی‌سی', type:'Broadcast Network', isNetwork:true, networkId:2, companyId:2, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ABC-Logo.svg/512px-ABC-Logo.svg.png', bg:'#111111', emoji:'abc', noInvert:true },
            { name:'The CW', nameFA:'دِ سی‌دبلیو', type:'Broadcast Network', isNetwork:true, networkId:71, companyId:71, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/The_CW_Logo.svg/512px-The_CW_Logo.svg.png', bg:'#111111', emoji:'CW', noInvert:true },
            { name:'StudioCanal', nameFA:'استودیوکانال', type:'Studio', isNetwork:false, networkId:694, companyId:694, extraIds:[],
              logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/StudioCanal_logo.svg/512px-StudioCanal_logo.svg.png', bg:'#111111', emoji:'SC', noInvert:true },
        ];
        const COMPANIES_CLEAN = COMPANIES_DB.filter(c => !['Neon', 'Imagine Entertainment'].includes(c.name));
        
        function getCompanyTypeName(type) {
            const t = TEXTS[LANG];
            return (t.companyTypes && t.companyTypes[type]) || type;
        }

        // Real logo resolver: first use TMDB official logo_path, then local/remote fallback.
        const COMPANY_LOGO_CACHE_KEY = 'fn_company_logo_cache_v2';
        function getCompanyLogoCache() {
            try { return JSON.parse(localStorage.getItem(COMPANY_LOGO_CACHE_KEY) || '{}'); } catch(e) { return {}; }
        }
        function setCompanyLogoCache(cache) {
            try { localStorage.setItem(COMPANY_LOGO_CACHE_KEY, JSON.stringify(cache)); } catch(e) {}
        }
        function companyCacheKey(company) {
            return (company.isNetwork ? 'network_' : 'company_') + (company.isNetwork ? company.networkId : company.companyId);
        }
        function getCompanyLogoSrc(company) {
            if (!company) return '';
            if (company._tmdbLogo) return company._tmdbLogo;
            const cache = getCompanyLogoCache();
            const cached = cache[companyCacheKey(company)];
            if (cached) return cached;
            return company.logo || '';
        }
        function companyLogoFilter(company) {
            // Keep official logo colors; use a high-contrast mat + dual light/dark shadow instead of color inversion.
            return 'filter:drop-shadow(0 1px 1px rgba(255,255,255,.95)) drop-shadow(0 -1px 1px rgba(0,0,0,.85)) drop-shadow(1px 0 1px rgba(255,255,255,.65)) drop-shadow(-1px 0 1px rgba(0,0,0,.65));';
        }
        async function resolveCompanyLogo(company) {
            if (!company) return '';
            const cacheKey = companyCacheKey(company);
            const cache = getCompanyLogoCache();
            if (cache[cacheKey]) { company._tmdbLogo = cache[cacheKey]; return cache[cacheKey]; }
            const tryEndpoints = [];
            if (company.isNetwork && company.networkId) tryEndpoints.push(`network/${company.networkId}`);
            if (company.companyId) tryEndpoints.push(`company/${company.companyId}`);
            if (!company.isNetwork && company.networkId && company.networkId !== company.companyId) tryEndpoints.push(`company/${company.networkId}`);
            if (company.extraIds && company.extraIds.length) {
                company.extraIds.slice(0, 2).forEach(id => { if (id && id !== company.companyId) tryEndpoints.push(`company/${id}`); });
            }
            for (const ep of tryEndpoints) {
                try {
                    const d = await getDataEN(ep);
                    if (d && d.logo_path) {
                        const logo = `${TMDB_IMG_BASE}/w300${d.logo_path}`;
                        company._tmdbLogo = logo;
                        cache[cacheKey] = logo;
                        setCompanyLogoCache(cache);
                        return logo;
                    }
                } catch(e) {}
            }
            return company.logo || '';
        }
        async function hydrateCompanyLogo(idx) {
            const company = COMPANIES_CLEAN[idx];
            if (!company) return;
            const logo = await resolveCompanyLogo(company);
            if (!logo) return;
            document.querySelectorAll(`[data-company-logo-idx=\"${idx}\"]`).forEach(img => {
                if (img) {
                    if (img.src !== logo) img.src = logo;
                    img.style.filter = 'drop-shadow(0 1px 1px rgba(255,255,255,.95)) drop-shadow(0 -1px 1px rgba(0,0,0,.85)) drop-shadow(1px 0 1px rgba(255,255,255,.65)) drop-shadow(-1px 0 1px rgba(0,0,0,.65))';
                    img.style.display = 'block';
                }
            });
        }
        function hydrateVisibleCompanyLogos(start, end) {
            for (let i = start; i < end; i++) hydrateCompanyLogo(i);
        }

        // Render company card (small for horizontal scroll)
        function makeCompanyCard(company, idx) {
            const bgColor = company.bg || '#000000';
            const isWhiteBg = bgColor === '#ffffff' || bgColor === '#f0f0f0';
            const emojiColor = isWhiteBg ? '#000' : '#fff';
            const imgFilter = companyLogoFilter(company);
            const logoSrc = getCompanyLogoSrc(company);
            const logoHtml = logoSrc 
                ? `<img src="${logoSrc}" data-company-logo-idx="${idx}" class="company-logo-img" loading="lazy" style="${imgFilter}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"><span class="company-emoji" style="display:none;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:${emojiColor};">${company.emoji}</span>`
                : `<span class="company-emoji" style="font-size:20px;font-weight:900;color:${emojiColor};">${company.emoji}</span>`;
            const displayName = LANG === 'fa' && company.nameFA ? company.nameFA : company.name;
            const typeName = getCompanyTypeName(company.type);
            return `
                <div class="company-card" onclick="openCompanyWorks(${idx})">
                    <div class="company-logo-wrap" style="background:${bgColor};">
                        ${logoHtml}
                    </div>
                    <div class="company-name">${displayName}</div>
                    <div class="company-type">${typeName}</div>
                </div>
            `;
        }

        // Render company card for grid (all view)
        function makeCompanyAllCard(company, idx) {
            const bgColor = company.bg || '#000000';
            const logoBg = `background:${bgColor};`;
            const imgFilter = companyLogoFilter(company);
            const logoSrc = getCompanyLogoSrc(company);
            const logoHtml = logoSrc 
                ? `<img src="${logoSrc}" data-company-logo-idx="${idx}" style="width:78%;height:78%;object-fit:contain;${imgFilter}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"><span class="co-emoji" style="display:none">${company.emoji}</span>`
                : `<span class="co-emoji">${company.emoji}</span>`;
            const displayName = LANG === 'fa' && company.nameFA ? company.nameFA : company.name;
            const typeName = getCompanyTypeName(company.type);
            return `
                <div class="company-all-card" onclick="openCompanyWorks(${idx})">
                    <div class="company-all-logo" style="${logoBg}">
                        ${logoHtml}
                    </div>
                    <div class="company-all-name">${displayName}</div>
                    <div class="company-all-type">${typeName}</div>
                </div>
            `;
        }
        
        // Load first 10 companies in horizontal scroll
        function loadCompaniesSection() {
            const el = document.getElementById('trend-companies');
            if (!el) return;
            el.innerHTML = '';
            // Update section title bilingual
            const titleEl = document.getElementById('txt-companies-trend');
            if (titleEl) titleEl.innerText = (LANG === 'fa' ? 'استودیوها و شبکه‌ها' : 'Studios & Networks');
            COMPANIES_CLEAN.slice(0, 10).forEach((c, i) => {
                // Find real index in COMPANIES_CLEAN
                el.innerHTML += makeCompanyCard(c, i);
            });
            hydrateVisibleCompanyLogos(0, Math.min(10, COMPANIES_CLEAN.length));
        }

        // =================== COLLECTIONS (real TMDB collection data, resolved live) ===================
        // Reusable cinematic loading indicator (same visual language as Free Downloads' loader).
        function cineLoaderHTML(text) {
            return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:40px 20px 26px;width:100%;">
                <div class="pd-cine-loader">
                    <div class="pd-cine-reel"></div>
                    <div class="pd-cine-dot"></div><div class="pd-cine-dot"></div><div class="pd-cine-dot"></div><div class="pd-cine-dot"></div>
                    <div class="pd-cine-clap"><i class="fa-solid fa-clapperboard"></i></div>
                </div>
                <div style="color:var(--text,#fff);font-size:13px;font-weight:700;">${text}</div>
            </div>`;
        }
        function cleanCollectionName(name) {
            if (!name) return '';
            return name.replace(/\s*(Collection|Saga|Trilogy|Duology|Tetralogy|Series)\s*$/i, '').trim();
        }
        function makeCollectionStackCard(coll) {
            const parts = (coll.parts || []).filter(p => p.poster_path);
            const withBackdrop = (coll.parts || []).filter(p => p.backdrop_path);
            const pick = withBackdrop.length ? withBackdrop[Math.floor(Math.random() * withBackdrop.length)] : null;
            const bgUrl = pick ? (IMG_BG + pick.backdrop_path) : (coll.backdrop_path ? (IMG_BG + coll.backdrop_path) : (coll.poster_path ? (IMG_LG + coll.poster_path) : ''));
            const name = cleanCollectionName(coll.name);
            return `
                <div class="collection-card" onclick="openCollectionDetail(${coll.id})">
                    <div class="collection-stack">
                        <div class="stack-layer layer-3"></div>
                        <div class="stack-layer layer-2"></div>
                        <img class="stack-layer layer-1" src="${bgUrl}" loading="lazy">
                        <div class="stack-count"><i class="fa-solid fa-layer-group"></i> ${parts.length}</div>
                    </div>
                    <div class="collection-name">${name}</div>
                </div>
            `;
        }
        const FEATURED_COLLECTION_QUERIES = [
            'The Godfather Collection', 'Harry Potter Collection', 'The Lord of the Rings Collection',
            'X-Men Collection', 'The Hobbit Collection', 'The Hunger Games Collection',
            'John Wick Collection', 'Star Wars Collection', 'The Maze Runner Collection', 'Mission: Impossible Collection'
        ];
        async function resolveBestCollection(query) {
            try {
                const s = await getData(`search/collection?query=${encodeURIComponent(query)}`);
                const candidates = (s && s.results ? s.results : []).filter(r => r.poster_path).slice(0, 4);
                if (!candidates.length) return null;
                const fulls = await Promise.all(candidates.map(c => getData(`collection/${c.id}`).catch(() => null)));
                const valid = fulls.filter(f => f && f.parts && f.parts.filter(p => p.poster_path).length >= 2);
                if (!valid.length) return null;
                // Score by total vote_count across parts: a real blockbuster franchise vastly
                // outweighs an unofficial "making of"/documentary/side collection with the same name.
                valid.forEach(f => { f._score = (f.parts || []).reduce((sum, p) => sum + (p.vote_count || 0), 0); });
                valid.sort((a, b) => b._score - a._score);
                return valid[0];
            } catch (e) { return null; }
        }
        async function loadFeaturedCollections() {
            const el = document.getElementById('trend-collections');
            if (!el) return;
            const titleEl = document.getElementById('txt-collections-trend');
            if (titleEl) titleEl.innerText = (LANG === 'fa' ? 'مجموعه‌ها' : 'Collections');
            const allEl = document.getElementById('txt-collections-all');
            if (allEl) allEl.innerText = LANG === 'fa' ? 'مشاهده همه' : 'See All';
            if (el.dataset.loaded === '1') return;
            el.innerHTML = cineLoaderHTML(LANG === 'fa' ? 'در حال بارگذاری مجموعه‌ها...' : 'Loading collections...');
            try {
                const found = await Promise.all(FEATURED_COLLECTION_QUERIES.map(q => resolveBestCollection(q)));
                el.innerHTML = '';
                found.filter(Boolean).forEach(coll => { el.innerHTML += makeCollectionStackCard(coll); });
                el.dataset.loaded = '1';
            } catch (e) { el.innerHTML = ''; }
        }

        function closeCollectionDetail() {
            document.getElementById('collection-detail-page').style.display = 'none';
        }
        async function openCollectionDetail(id) {
            const page = document.getElementById('collection-detail-page');
            const grid = document.getElementById('collection-detail-grid');
            const titleEl = document.getElementById('collection-detail-title');
            page.style.display = 'flex';
            grid.innerHTML = cineLoaderHTML(LANG === 'fa' ? 'در حال بارگذاری مجموعه...' : 'Loading collection...');
            titleEl.innerText = '...';
            try {
                const full = await getData(`collection/${id}`);
                if (!full) { grid.innerHTML = ''; return; }
                titleEl.innerText = cleanCollectionName(full.name);
                const parts = (full.parts || [])
                    .filter(p => p.poster_path && p.release_date)
                    .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
                grid.innerHTML = parts.map(p => makeCard(p, 'movie')).join('');
            } catch (e) { grid.innerHTML = ''; }
        }

        // ---- All Collections (See All): curated list of ~180 well-known franchises, ----
        // ---- resolved live via the same proven resolveBestCollection() used for the featured 10. ----
        const ALL_COLLECTIONS_NAMES = [
            'The Godfather Collection','Star Wars Collection','Harry Potter Collection','The Lord of the Rings Collection',
            'The Hobbit Collection','The Dark Knight Collection','Avengers Collection','Iron Man Collection',
            'Captain America Collection','Thor Collection','Spider-Man Collection','The Amazing Spider-Man Collection',
            'Guardians of the Galaxy Collection','Black Panther Collection','Doctor Strange Collection','Deadpool Collection',
            'Ant-Man Collection','Captain Marvel Collection','X-Men Collection','Wolverine Collection',
            'Fantastic Four Collection','Batman Collection','Superman Collection','Justice League Collection',
            'Wonder Woman Collection','Aquaman Collection','The Suicide Squad Collection','Joker Collection',
            'Jurassic Park Collection','Jurassic World Collection','Fast & Furious Collection','Mission: Impossible Collection',
            'John Wick Collection','Indiana Jones Collection','Back to the Future Collection','The Matrix Collection',
            'Terminator Collection','Alien Collection','Predator Collection','Alien vs. Predator Collection',
            'Rocky Collection','Creed Collection','Rambo Collection','Die Hard Collection',
            'Men in Black Collection','Pirates of the Caribbean Collection','Transformers Collection','Ocean\'s Collection',
            'The Bourne Collection','Kingsman Collection','Sherlock Holmes Collection','Mad Max Collection',
            'Planet of the Apes Collection','Godzilla Collection','King Kong Collection','MonsterVerse Collection',
            'Cloverfield Collection','A Quiet Place Collection','The Purge Collection','Now You See Me Collection',
            'Taken Collection','The Expendables Collection','300 Collection','Kick-Ass Collection',
            'The Karate Kid Collection','Rush Hour Collection','Bad Boys Collection','Lethal Weapon Collection',
            'National Treasure Collection','Night at the Museum Collection','The Mummy Collection','The Chronicles of Narnia Collection',
            'Percy Jackson Collection','Divergent Collection','The Maze Runner Collection','The Hunger Games Collection',
            'Twilight Collection','Fifty Shades Collection','Pitch Perfect Collection','The Hangover Collection',
            '22 Jump Street Collection','Ghostbusters Collection','Zoolander Collection','Anchorman Collection',
            'Austin Powers Collection','Scary Movie Collection','American Pie Collection','Legally Blonde Collection',
            'Bring It On Collection','Meet the Parents Collection','Jumanji Collection','Despicable Me Collection',
            'Minions Collection','Shrek Collection','Trolls Collection','Sing Collection',
            'The Boss Baby Collection','The Croods Collection','Puss in Boots Collection','Madagascar Collection',
            'Ice Age Collection','Kung Fu Panda Collection','How to Train Your Dragon Collection','Cars Collection',
            'Toy Story Collection','Finding Nemo Collection','The Incredibles Collection','Frozen Collection',
            'Monsters, Inc. Collection','Up Collection','Inside Out Collection','Coco Collection',
            'Zootopia Collection','Wreck-It Ralph Collection','Moana Collection','Encanto Collection',
            'Alvin and the Chipmunks Collection','Smurfs Collection','Scooby-Doo Collection','Garfield Collection',
            'Paddington Collection','Sonic the Hedgehog Collection','The Conjuring Collection','Insidious Collection',
            'Paranormal Activity Collection','Saw Collection','Halloween Collection','Friday the 13th Collection',
            'A Nightmare on Elm Street Collection','Scream Collection','Final Destination Collection','Resident Evil Collection',
            'Underworld Collection','Blade Collection','The Purge Collection','Annabelle Collection',
            'It Collection','The Grudge Collection','The Ring Collection','Child\'s Play Collection',
            'Evil Dead Collection','Hellraiser Collection','American Horror Story Collection','Cabin in the Woods Collection',
            'The Equalizer Collection','John Rambo Collection','Sicario Collection','Kill Bill Collection',
            'Sin City Collection','Escape Room Collection','Now You See Me Collection','Baby Driver Collection',
            'Knives Out Collection','The Purge Collection','Dune Collection','Blade Runner Collection',
            'Tron Collection','Independence Day Collection','Men in Black Collection','Star Trek Collection',
            'Interstellar Collection','Gravity Collection','The Martian Collection','Edge of Tomorrow Collection',
            'World War Z Collection','I Am Legend Collection','District 9 Collection','Arrival Collection',
            'Kingsman Collection','The Equalizer Collection','Sherlock Gnomes Collection','Paddington Collection',
            'Downton Abbey Collection','Bridget Jones Collection','Mamma Mia Collection','La La Land Collection',
            'A Star Is Born Collection','Rocketman Collection','Bohemian Rhapsody Collection','Grease Collection',
            'High School Musical Collection','Step Up Collection','Magic Mike Collection','Dirty Dancing Collection',
            'The Fast and the Furious Collection','Need for Speed Collection','Gran Turismo Collection','Ford v Ferrari Collection',
            'Cars Collection','Talladega Nights Collection','Days of Thunder Collection','Rush Collection',
            'Miss Congeniality Collection','The Proposal Collection','Bride Wars Collection','27 Dresses Collection',
            'Crazy Rich Asians Collection','To All the Boys Collection','The Kissing Booth Collection','Set It Up Collection',
            'Enchanted Collection','Maleficent Collection','Cinderella Collection','Beauty and the Beast Collection',
            'Aladdin Collection','The Lion King Collection','Mulan Collection','Snow White Collection',
            'Alice in Wonderland Collection','The Jungle Book Collection','Peter Pan Collection','Dumbo Collection',
            'Lilo & Stitch Collection','Brave Collection','Cars Collection','A Bug\'s Life Collection',
            'Ratatouille Collection','WALL-E Collection','The Good Dinosaur Collection','Onward Collection',
            'Soul Collection','Luca Collection','Turning Red Collection','Elemental Collection'
        ];
        let allCollectionsIndex = 0;
        let allCollectionsSeenIds = new Set();
        let allCollectionsLoading = false;
        let allCollectionsExhausted = false;
        function openAllCollectionsPage() {
            allCollectionsIndex = 0;
            allCollectionsSeenIds = new Set();
            allCollectionsExhausted = false;
            document.getElementById('all-collections-grid').innerHTML = '';
            document.getElementById('all-collections-status').innerHTML = '';
            document.getElementById('txt-all-collections-title').innerHTML = '<i class="fa-solid fa-boxes-stacked gg-title-icon"></i>' + (LANG === 'fa' ? 'مجموعه‌ها' : 'Collections');
            document.getElementById('btn-more-collections').style.display = 'block';
            document.getElementById('all-collections-page').style.display = 'flex';
            loadMoreAllCollections();
        }
        function closeAllCollectionsPage() {
            document.getElementById('all-collections-page').style.display = 'none';
        }
        async function loadMoreAllCollections() {
            if (allCollectionsLoading || allCollectionsExhausted) return;
            allCollectionsLoading = true;
            const grid = document.getElementById('all-collections-grid');
            const status = document.getElementById('all-collections-status');
            const moreBtn = document.getElementById('btn-more-collections');
            status.innerHTML = cineLoaderHTML(LANG === 'fa' ? 'در حال یافتن مجموعه‌ها...' : 'Finding collections...');
            let added = 0;
            try {
                // Walk the curated name list in batches until at least 12 new, real collections are rendered.
                while (added < 12 && allCollectionsIndex < ALL_COLLECTIONS_NAMES.length) {
                    const batch = ALL_COLLECTIONS_NAMES.slice(allCollectionsIndex, allCollectionsIndex + 12);
                    allCollectionsIndex += batch.length;
                    const resolved = await Promise.all(batch.map(name => resolveBestCollection(name)));
                    resolved.filter(Boolean).forEach(coll => {
                        if (allCollectionsSeenIds.has(coll.id)) return;
                        allCollectionsSeenIds.add(coll.id);
                        grid.insertAdjacentHTML('beforeend', makeCollectionStackCard(coll));
                        added++;
                    });
                }
                if (allCollectionsIndex >= ALL_COLLECTIONS_NAMES.length) allCollectionsExhausted = true;
            } catch (e) {
                // fall through — whatever was already appended to the grid stays; status below reflects outcome.
            } finally {
                status.innerHTML = '';
                if (added === 0 && grid.children.length === 0) {
                    status.innerText = allCollectionsExhausted
                        ? (LANG === 'fa' ? 'موردی پیدا نشد.' : 'No collections found.')
                        : (LANG === 'fa' ? 'خطا در بارگذاری. دوباره تلاش کن.' : 'Failed to load. Try again.');
                }
                if (allCollectionsExhausted) moreBtn.style.display = 'none';
                allCollectionsLoading = false;
            }
        }
        // =================== END COLLECTIONS ===================

        // =================== WHERE TO WATCH (LEGAL) — Watchmode ===================
        (function(){
            'use strict';
            function byId(id){ return document.getElementById(id); }
            function isFa(){ return (typeof LANG !== 'undefined' ? LANG : 'fa') === 'fa'; }
            function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

            var WATCHMODE_API_KEY = '4vJoB2Ou4EViTDkrLoqzEqFjz9cngFFjjihCP6Rr';
            var sourcesLogoCache = null; // fetched once, maps source_id -> {name, logo}

            async function getSourcesLogoMap(){
                if (sourcesLogoCache) return sourcesLogoCache;
                try {
                    var res = await fetch('https://api.watchmode.com/v1/sources/?apiKey=' + WATCHMODE_API_KEY);
                    var data = await res.json();
                    var map = {};
                    (Array.isArray(data) ? data : []).forEach(function(s){
                        map[s.id] = { name: s.name, logo: s.logo_100px || s.logo || '' };
                    });
                    sourcesLogoCache = map;
                } catch(e) { sourcesLogoCache = {}; }
                return sourcesLogoCache;
            }

            var TYPE_LABELS = {
                free: { fa: 'رایگان (با تبلیغ)', en: 'Free (Ad-supported)' },
                sub: { fa: 'اشتراکی', en: 'Subscription' },
                rent: { fa: 'کرایه‌ای', en: 'Rent' },
                buy: { fa: 'خرید', en: 'Buy' },
                tve: { fa: 'شبکه تلویزیونی', en: 'TV Provider' }
            };

            window.openWhereToWatch = async function(){
                if (!curId || !curType) return;
                var page = byId('wtw-page');
                var content = byId('wtw-content');
                var title = byId('wtw-page-title');
                title.textContent = isFa() ? 'کجا تماشا کنم' : 'Where to Watch';
                page.style.display = 'flex';
                content.innerHTML = cineLoaderHTML(isFa() ? 'در حال بررسی پلتفرم‌ها...' : 'Checking platforms...');
                try {
                    var field = curType === 'tv' ? 'tmdb_tv_id' : 'tmdb_movie_id';
                    var searchRes = await fetch('https://api.watchmode.com/v1/search/?apiKey=' + WATCHMODE_API_KEY + '&search_field=' + field + '&search_value=' + curId);
                    var searchData = await searchRes.json();
                    var match = searchData && searchData.title_results && searchData.title_results.length ? searchData.title_results[0] : null;
                    if (!match) {
                        content.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:40px 20px;">' +
                            (isFa() ? 'اطلاعات پخش قانونی برای این اثر پیدا نشد.' : 'No legal streaming info found for this title.') + '</div>';
                        return;
                    }
                    var sourcesRes = await fetch('https://api.watchmode.com/v1/title/' + match.id + '/sources/?apiKey=' + WATCHMODE_API_KEY);
                    var sources = await sourcesRes.json();
                    if (!Array.isArray(sources) || !sources.length) {
                        content.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:40px 20px;">' +
                            (isFa() ? 'در حال حاضر هیچ پلتفرم قانونی‌ای برای این اثر ثبت نشده.' : 'No legal platforms are currently listed for this title.') + '</div>';
                        return;
                    }
                    var logoMap = await getSourcesLogoMap();
                    // De-duplicate by source+type (Watchmode often lists per-region/per-format variants)
                    var seen = {};
                    var groups = { free: [], sub: [], rent: [], buy: [], tve: [] };
                    sources.forEach(function(s){
                        var key = s.source_id + '_' + s.type;
                        if (seen[key]) return;
                        seen[key] = true;
                        if (groups[s.type]) groups[s.type].push(s);
                    });
                    var order = ['free','sub','rent','buy','tve'];
                    var html = '';
                    order.forEach(function(type){
                        if (!groups[type].length) return;
                        html += '<div style="font-size:12px;font-weight:800;color:var(--sub,#999);margin:16px 0 8px;">' + esc(TYPE_LABELS[type][isFa()?'fa':'en']) + '</div>';
                        html += '<div style="display:flex;flex-direction:column;gap:8px;">';
                        groups[type].forEach(function(s){
                            var logo = logoMap[s.source_id] ? logoMap[s.source_id].logo : '';
                            var url = s.web_url || s.ios_url || s.android_url || '#';
                            var priceTxt = s.price ? (' · $' + s.price) : '';
                            html += '<a href="' + esc(url) + '" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;background:var(--card,#1c1c1c);border-radius:12px;padding:10px 14px;text-decoration:none;">' +
                                (logo ? '<img src="' + esc(logo) + '" style="width:36px;height:36px;border-radius:8px;object-fit:contain;background:#fff;">' : '<div style="width:36px;height:36px;border-radius:8px;background:#333;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-tv" style="color:#999;"></i></div>') +
                                '<span style="flex:1;color:var(--text,#fff);font-size:13px;font-weight:700;">' + esc(s.name) + priceTxt + '</span>' +
                                '<i class="fa-solid fa-arrow-up-right-from-square" style="color:var(--sub,#999);font-size:12px;"></i>' +
                                '</a>';
                        });
                        html += '</div>';
                    });
                    content.innerHTML = html || ('<div style="text-align:center;color:#888;font-size:13px;padding:40px 20px;">' + (isFa() ? 'موردی پیدا نشد.' : 'Nothing found.') + '</div>');
                } catch(e) {
                    content.innerHTML = '<div style="text-align:center;color:#888;font-size:13px;padding:40px 20px;">' +
                        (isFa() ? 'خطا در بارگذاری اطلاعات پخش.' : 'Failed to load streaming info.') + '</div>';
                }
            };
            window.closeWhereToWatch = function(){
                byId('wtw-page').style.display = 'none';
            };
        })();
        // =================== END WHERE TO WATCH ===================

        // =================== BACKUP & RESTORE ===================
        var FN_BACKUP_KEYS = [
            'family_favs_v2', 'fn_watchlist', 'watch_history', 'explore_likes', 'explore_saved_items',
            'active_theme', 'lang', 'color_scheme_pref', 'primary_color',
            'theme_bg', 'theme_border', 'theme_button', 'theme_button2', 'theme_card', 'theme_input',
            'theme_light', 'theme_on_primary', 'theme_soft', 'theme_soft2', 'theme_sub', 'theme_surface', 'theme_text',
            'user_age', 'user_gender', 'user_avatar_url', 'user_profile_name'
        ];
        function exportFNBackup() {
            try {
                var data = {};
                FN_BACKUP_KEYS.forEach(function(k) {
                    var v = localStorage.getItem(k);
                    if (v !== null) data[k] = v;
                });
                var payload = { app: 'Family Night', version: 1, exportedAt: new Date().toISOString(), data: data };
                var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'family-night-backup-' + new Date().toISOString().slice(0, 10) + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
            } catch (e) {
                alert(LANG === 'fa' ? 'خطا در ساخت فایل پشتیبان.' : 'Failed to create backup file.');
            }
        }
        function handleFNImportFile(input) {
            var file = input.files && input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var payload = JSON.parse(e.target.result);
                    var data = (payload && payload.data) ? payload.data : payload;
                    if (!data || typeof data !== 'object') throw new Error('invalid');
                    var restored = 0;
                    Object.keys(data).forEach(function(k) {
                        if (FN_BACKUP_KEYS.indexOf(k) > -1) {
                            localStorage.setItem(k, data[k]);
                            restored++;
                        }
                    });
                    if (!restored) throw new Error('empty');
                    alert(LANG === 'fa' ? 'اطلاعات با موفقیت بازیابی شد. اپ رفرش می‌شود...' : 'Data restored successfully. Reloading the app...');
                    location.reload();
                } catch (err) {
                    alert(LANG === 'fa' ? 'این فایل پشتیبان معتبر نیست.' : 'This backup file is not valid.');
                } finally {
                    input.value = '';
                }
            };
            reader.onerror = function() {
                alert(LANG === 'fa' ? 'خطا در خواندن فایل.' : 'Failed to read the file.');
                input.value = '';
            };
            reader.readAsText(file);
        }
        // =================== END BACKUP & RESTORE ===================

        // =================== FAMILY NIGHT EXPLORE ===================
        (function(){
            'use strict';
            function byId(id){ return document.getElementById(id); }
            function isFa(){ return (typeof LANG !== 'undefined' ? LANG : 'fa') === 'fa'; }
            function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

            // Only Dailymotion works with no setup. Add your own free keys below to enable the rest —
            // getting a key takes a few minutes and each source is skipped silently if left empty.
            // YouTube:  https://console.cloud.google.com/apis/library/youtube.googleapis.com
            // Vimeo:    https://developer.vimeo.com/apps
            // Tumblr:   https://www.tumblr.com/oauth/apps
            // Klipy:    https://klipy.com/developers
            var EXPLORE_KEYS = {
                vimeo: '',
                tumblr: '1wAxRSxiskw3fSWzMeLQ4AUgfId3ME1kkTwL2CEQtZ1AJ8OgT5',
                klipy: ''
            };

            function fmtViews(n){
                n = parseInt(n,10) || 0;
                if (n >= 1000000) return (n/1000000).toFixed(1).replace(/\.0$/,'') + 'M';
                if (n >= 1000) return (n/1000).toFixed(1).replace(/\.0$/,'') + 'K';
                return String(n);
            }

            // ---------------- Banner: crossfading cinematic backdrops ----------------
            var febTimer = null, febToggle = false;
            async function initExploreBannerBg(){
                var sub = byId('feb-sub-text');
                if (sub) sub.textContent = isFa()
                    ? 'کلیپ‌ها و ادیت‌های سینمایی از سراسر وب'
                    : 'Cinematic edits, scenes & fan clips from across the web';
                try {
                    var d = await getData('trending/movie/week');
                    var backdrops = (d.results||[]).filter(function(m){ return m.backdrop_path; }).map(function(m){ return IMG_BG + m.backdrop_path; });
                    if (!backdrops.length) return;
                    var l1 = byId('feb-bg-1'), l2 = byId('feb-bg-2');
                    if (!l1 || !l2) return;
                    var i = 0;
                    l1.style.backgroundImage = 'url(' + backdrops[0] + ')';
                    if (febTimer) clearInterval(febTimer);
                    febTimer = setInterval(function(){
                        i = (i + 1) % backdrops.length;
                        var next = febToggle ? l1 : l2;
                        var cur = febToggle ? l2 : l1;
                        next.style.backgroundImage = 'url(' + backdrops[i] + ')';
                        next.classList.add('feb-active');
                        cur.classList.remove('feb-active');
                        febToggle = !febToggle;
                    }, 3000);
                } catch(e) {}
            }
            window.initExploreBannerBg = initExploreBannerBg;

            // ---------------- Source fetchers (each isolated — a failure never breaks the others) ----------------
            async function fetchDailymotion(q){
                try {
                    var res = await fetch('https://api.dailymotion.com/videos?search=' + encodeURIComponent(q + ' edit') +
                        '&fields=id,title,thumbnail_720_url,owner.username,owner.avatar_240_url,views_total,description&limit=8&family_filter=true');
                    var data = await res.json();
                    return (data.list||[]).map(function(v){
                        return { source:'dailymotion', id:v.id, thumb:v.thumbnail_720_url, title:v.title,
                            caption:v.description||v.title, channelName:v['owner.username']||'Dailymotion',
                            channelAvatar:v['owner.avatar_240_url']||'', viewCount:v.views_total||0, embedType:'dailymotion' };
                    }).filter(function(x){ return x.thumb; });
                } catch(e){ return []; }
            }
            async function fetchYouTube(q){
                if (typeof YT_API_KEY === 'undefined' || !YT_API_KEY) return [];
                try {
                    var res = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&safeSearch=strict&q=' + encodeURIComponent(q + ' edit') + '&key=' + YT_API_KEY);
                    var data = await res.json();
                    var items = data.items || [];
                    if (!items.length) return [];
                    var ids = items.map(function(i){ return i.id.videoId; }).join(',');
                    var statsMap = {};
                    try {
                        var statsRes = await fetch('https://www.googleapis.com/youtube/v3/videos?part=statistics&id=' + ids + '&key=' + YT_API_KEY);
                        var statsData = await statsRes.json();
                        (statsData.items||[]).forEach(function(v){ statsMap[v.id] = v.statistics.viewCount; });
                    } catch(e2){}
                    return items.map(function(i){
                        return { source:'youtube', id:i.id.videoId, thumb:i.snippet.thumbnails.high ? i.snippet.thumbnails.high.url : i.snippet.thumbnails.default.url,
                            title:i.snippet.title, caption:i.snippet.description || i.snippet.title, channelName:i.snippet.channelTitle,
                            channelAvatar:'', viewCount:statsMap[i.id.videoId]||0, embedType:'youtube' };
                    });
                } catch(e){ return []; }
            }
            async function fetchVimeo(q){
                if (!EXPLORE_KEYS.vimeo) return [];
                try {
                    var res = await fetch('https://api.vimeo.com/videos?query=' + encodeURIComponent(q) + '&per_page=8', {
                        headers: { Authorization: 'Bearer ' + EXPLORE_KEYS.vimeo }
                    });
                    var data = await res.json();
                    return (data.data||[]).map(function(v){
                        var pic = v.pictures && v.pictures.sizes && v.pictures.sizes.length ? v.pictures.sizes[v.pictures.sizes.length-1].link : '';
                        var avatar = v.user && v.user.pictures && v.user.pictures.sizes && v.user.pictures.sizes.length ? v.user.pictures.sizes[0].link : '';
                        return { source:'vimeo', id:(v.uri||'').split('/').pop(), thumb:pic, title:v.name,
                            caption:v.description||v.name, channelName:v.user?v.user.name:'Vimeo',
                            channelAvatar:avatar, viewCount:v.stats?v.stats.plays:0, embedType:'vimeo' };
                    }).filter(function(x){ return x.thumb; });
                } catch(e){ return []; }
            }
            async function fetchTumblr(q){
                if (!EXPLORE_KEYS.tumblr) return [];
                try {
                    var res = await fetch('https://api.tumblr.com/v2/tagged?tag=' + encodeURIComponent(q) + '&api_key=' + EXPLORE_KEYS.tumblr + '&filter=text');
                    var data = await res.json();
                    return (data.response||[]).filter(function(p){ return p.type==='video' || p.type==='photo'; }).map(function(p){
                        var thumb = p.type==='photo' ? (p.photos && p.photos[0] ? p.photos[0].original_size.url : '') : (p.thumbnail_url||'');
                        return { source:'tumblr', id:p.id, thumb:thumb, title:p.summary||'', caption:p.summary||'',
                            channelName:p.blog_name, channelAvatar:'https://api.tumblr.com/v2/blog/'+p.blog_name+'.tumblr.com/avatar/128',
                            viewCount:p.note_count||0,
                            embedType: p.type==='video' ? 'video_file' : 'image',
                            videoUrl: p.type==='video' ? (p.video_url||'') : '' };
                    }).filter(function(x){ return x.thumb; });
                } catch(e){ return []; }
            }
            async function fetchKlipy(q){
                if (!EXPLORE_KEYS.klipy) return [];
                try {
                    var res = await fetch('https://api.klipy.com/v1/search?q=' + encodeURIComponent(q) + '&api_key=' + EXPLORE_KEYS.klipy + '&limit=8');
                    var data = await res.json();
                    var list = data.data || data.results || [];
                    return list.map(function(c){
                        return { source:'klipy', id:c.id, thumb:(c.images&&c.images.preview?c.images.preview.url:c.thumbnail||''),
                            title:c.title||'', caption:c.title||'', channelName:'Klipy', channelAvatar:'',
                            viewCount:0, embedType:'video_file', videoUrl:(c.images&&c.images.original_mp4?c.images.original_mp4.url:c.mp4||'') };
                    }).filter(function(x){ return x.thumb; });
                } catch(e){ return []; }
            }

            async function fetchTrendingSeeds(){
                try {
                    var d = await getData('trending/all/day');
                    var names = (d.results||[]).map(function(x){ return x.title || x.name; }).filter(Boolean);
                    return names.length ? names : ['cinematic edit','movie scene'];
                } catch(e){ return ['cinematic edit','movie scene']; }
            }
            function shuffle(arr){
                for (var i = arr.length - 1; i > 0; i--) {
                    var j = Math.floor(Math.random() * (i + 1));
                    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
                }
                return arr;
            }

            var exploreFeed = [];
            var exploreLoading = false;

            async function buildExploreFeed(customQuery){
                var seeds = customQuery ? [customQuery] : shuffle(await fetchTrendingSeeds()).slice(0, 6);
                var fetchers = [fetchDailymotion, fetchYouTube, fetchVimeo, fetchTumblr, fetchKlipy];
                var jobs = [];
                seeds.forEach(function(seed){
                    fetchers.forEach(function(fn){ jobs.push(fn(seed)); });
                });
                var results = await Promise.all(jobs);
                var pool = [];
                results.forEach(function(arr){ pool = pool.concat(arr); });
                return shuffle(pool);
            }

            function renderExploreGrid(items, append){
                var grid = byId('explore-grid');
                if (!append) grid.innerHTML = '';
                var html = items.map(function(item, idx){
                    var globalIdx = exploreFeed.indexOf(item);
                    return '<div class="explore-item" onclick="openExplorePlayer(' + globalIdx + ')">' +
                        '<div class="ei-source">' + esc(item.source) + '</div>' +
                        (item.embedType==='image' ? '' : '<div class="ei-badge"><i class="fa-solid fa-play"></i></div>') +
                        '<img src="' + item.thumb + '" loading="lazy" onerror="this.parentElement.style.display=\'none\'">' +
                        '<div class="ei-views"><i class="fa-regular fa-eye"></i> ' + fmtViews(item.viewCount) + '</div>' +
                        '</div>';
                }).join('');
                grid.innerHTML += html;
            }

            window.openExplorePage = async function(){
                byId('explore-page').style.display = 'flex';
                byId('explore-tab-feed-txt').textContent = isFa() ? 'اکسپلور' : 'Explore';
                byId('explore-tab-saved-txt').textContent = isFa() ? 'ذخیره‌شده‌ها' : 'Saved';
                byId('explore-tab-liked-txt').textContent = isFa() ? 'لایک‌شده‌ها' : 'Liked';
                byId('explore-search-input').placeholder = isFa() ? 'اسم فیلم یا سریال...' : 'Search a movie or show...';
                switchExploreTab('feed');
                if (!exploreFeed.length) await loadExploreFeed();
            };
            window.closeExplorePage = function(){
                byId('explore-page').style.display = 'none';
            };
            window.switchExploreTab = function(tab){
                byId('explore-tab-feed').classList.toggle('active', tab==='feed');
                byId('explore-tab-saved').classList.toggle('active', tab==='saved');
                byId('explore-tab-liked').classList.toggle('active', tab==='liked');
                byId('explore-grid').style.display = tab==='feed' ? 'grid' : 'none';
                byId('explore-saved-grid').style.display = tab==='saved' ? 'grid' : 'none';
                byId('explore-liked-grid').style.display = tab==='liked' ? 'grid' : 'none';
                if (tab==='saved') renderSavedGrid();
                if (tab==='liked') renderLikedGrid();
            };

            async function loadExploreFeed(customQuery){
                if (exploreLoading) return;
                exploreLoading = true;
                var status = byId('explore-status');
                status.innerHTML = cineLoaderHTML(isFa() ? 'در حال یافتن محتوا...' : 'Finding content...');
                byId('explore-grid').innerHTML = '';
                try {
                    exploreFeed = await buildExploreFeed(customQuery);
                    status.innerHTML = '';
                    if (!exploreFeed.length) {
                        status.innerText = isFa() ? 'چیزی پیدا نشد. بعداً دوباره امتحان کن.' : 'Nothing found. Try again later.';
                    } else {
                        renderExploreGrid(exploreFeed, false);
                    }
                } catch(e) {
                    status.innerHTML = '';
                    status.innerText = isFa() ? 'خطا در بارگذاری.' : 'Failed to load.';
                } finally {
                    exploreLoading = false;
                }
            }
            window.loadExploreFeed = loadExploreFeed;

            // ---------------- Search ----------------
            window.toggleExploreSearch = function(){
                var bar = byId('explore-search-bar');
                var showing = bar.style.display === 'flex';
                bar.style.display = showing ? 'none' : 'flex';
                if (!showing) byId('explore-search-input').focus();
            };
            window.runExploreSearch = function(){
                var q = byId('explore-search-input').value.trim();
                if (!q) return;
                switchExploreTab('feed');
                loadExploreFeed(q);
            };
            window.clearExploreSearch = function(){
                byId('explore-search-input').value = '';
                byId('explore-search-bar').style.display = 'none';
                loadExploreFeed();
            };

            // ---------------- Pull to refresh ----------------
            (function(){
                var startY = 0, pulling = false;
                var area = null, indicator = null;
                document.addEventListener('DOMContentLoaded', bind);
                bind();
                function bind(){
                    area = byId('explore-scroll-area');
                    indicator = byId('explore-pull-indicator');
                    if (!area || area.dataset.ptrBound) return;
                    area.dataset.ptrBound = '1';
                    area.addEventListener('touchstart', function(e){
                        if (area.scrollTop <= 0) { startY = e.touches[0].clientY; pulling = true; }
                    }, { passive:true });
                    area.addEventListener('touchmove', function(e){
                        if (!pulling) return;
                        var dy = e.touches[0].clientY - startY;
                        if (dy > 0 && area.scrollTop <= 0) {
                            indicator.style.height = Math.min(60, dy/1.5) + 'px';
                        }
                    }, { passive:true });
                    area.addEventListener('touchend', function(){
                        if (!pulling) return;
                        pulling = false;
                        var h = parseInt(indicator.style.height,10) || 0;
                        indicator.style.height = '0px';
                        if (h >= 50) loadExploreFeed();
                    });
                }
            })();

            // ---------------- Player ----------------
            var curExploreIndex = -1;
            var curExploreItem = null;
            var explorePlaying = true;
            var exploreMuted = false;
            var lastTapTime = 0;
            var exploreDuration = 0;

            function getLikes(){ try { return JSON.parse(localStorage.getItem('explore_likes')||'{}'); } catch(e){ return {}; } }
            function setLikes(o){ localStorage.setItem('explore_likes', JSON.stringify(o)); }
            function getSavedMap(){ try { return JSON.parse(localStorage.getItem('explore_saved_items')||'{}'); } catch(e){ return {}; } }
            function setSavedMap(o){ localStorage.setItem('explore_saved_items', JSON.stringify(o)); }
            function itemKey(item){ return item.source + '_' + item.id; }

            window.openExplorePlayer = function(idx){
                var item = exploreFeed[idx];
                if (!item) return;
                curExploreIndex = idx;
                curExploreItem = item;
                byId('explore-player').style.display = 'flex';
                loadExploreMedia(item);
            };
            window.closeExplorePlayer = function(){
                byId('explore-player').style.display = 'none';
                byId('explore-player-media').innerHTML = '';
            };
            function loadExploreMedia(item){
                var media = byId('explore-player-media');
                var origin = encodeURIComponent(location.origin || '');
                exploreDuration = 0;
                if (item.embedType === 'youtube') {
                    media.innerHTML = '<iframe id="exp-yt-frame" src="https://www.youtube.com/embed/' + item.id + '?autoplay=1&playsinline=1&controls=0&rel=0&modestbranding=1&enablejsapi=1&origin=' + origin + '" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
                    // Establishing the "listening" handshake makes the embedded player start
                    // autonomously broadcasting state/progress — no extra external script needed.
                    setTimeout(function(){
                        var f = byId('exp-yt-frame');
                        if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({event:'listening', id: 'exp-yt-frame'}), '*');
                    }, 400);
                } else if (item.embedType === 'vimeo') {
                    media.innerHTML = '<iframe id="exp-vimeo-frame" src="https://player.vimeo.com/video/' + item.id + '?autoplay=1&muted=0&controls=0&background=0" allow="autoplay; fullscreen"></iframe>';
                    setTimeout(function(){
                        var f = byId('exp-vimeo-frame');
                        if (!f || !f.contentWindow) return;
                        ['play','pause','ended','timeupdate'].forEach(function(ev){
                            f.contentWindow.postMessage(JSON.stringify({method:'addEventListener', value:ev}), '*');
                        });
                    }, 400);
                } else if (item.embedType === 'dailymotion') {
                    media.innerHTML = '<iframe id="exp-dm-frame" src="https://www.dailymotion.com/embed/video/' + item.id + '?autoplay=1&mute=0&controls=0&ui-start-screen-info=0&queue-enable=false" allow="autoplay; fullscreen"></iframe>';
                    setTimeout(function(){
                        var f = byId('exp-dm-frame');
                        if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({command:'muted', parameters:[false]}), '*');
                    }, 600);
                } else if (item.embedType === 'video_file' && item.videoUrl) {
                    media.innerHTML = '<video id="exp-video-file" src="' + item.videoUrl + '" autoplay playsinline></video>';
                    setTimeout(function(){
                        var v = byId('exp-video-file');
                        if (!v) return;
                        v.addEventListener('ended', function(){ v.currentTime = 0; v.play(); });
                    }, 50);
                } else {
                    media.innerHTML = '<img src="' + item.thumb + '" style="width:100%;height:100%;object-fit:contain;">';
                }
                explorePlaying = true;
                exploreMuted = false;
                var centerIcon = byId('explore-center-icon');
                centerIcon.style.transition = 'none';
                centerIcon.style.opacity = '0';
                byId('explore-mute-icon').className = 'fa-solid fa-volume-high';
                byId('explore-player-avatar').src = item.channelAvatar || ('https://ui-avatars.com/api/?background=333&color=fff&name=' + encodeURIComponent(item.channelName||'?'));
                byId('explore-player-channel').textContent = item.channelName || '';
                byId('explore-player-caption').textContent = item.caption || item.title || '';
                byId('explore-player-views').textContent = fmtViews(item.viewCount) + (isFa() ? ' بازدید' : ' views');
                var likes = getLikes();
                var liked = !!likes[itemKey(item)];
                var likeIcon = byId('explore-like-icon');
                likeIcon.className = liked ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart';
                byId('explore-like-count').textContent = fmtViews((liked?1:0) + Math.floor((item.viewCount||0)/137));
                var saves = getSavedMap();
                var saved = !!saves[itemKey(item)];
                byId('explore-save-icon').className = saved ? 'fa-solid fa-bookmark saved' : 'fa-regular fa-bookmark';
            }

            // ---- Real end-of-video detection (drives Instagram-style auto-replay-from-start) ----
            window.addEventListener('message', function(e){
                var data = e.data;
                if (typeof data !== 'string') return;
                var msg;
                try { msg = JSON.parse(data); } catch(err){ return; }
                var yt = byId('exp-yt-frame'), vm = byId('exp-vimeo-frame');
                // YouTube: raw infoDelivery carries playerState (0 = ended).
                if (msg.event === 'infoDelivery' && msg.info) {
                    if (typeof msg.info.duration === 'number') exploreDuration = msg.info.duration;
                    if (msg.info.playerState === 0 && yt && yt.contentWindow) {
                        yt.contentWindow.postMessage(JSON.stringify({event:'command', func:'seekTo', args:[0,true]}), '*');
                        yt.contentWindow.postMessage(JSON.stringify({event:'command', func:'playVideo', args:[]}), '*');
                    }
                }
                // Vimeo: explicit subscribed events.
                if (msg.event === 'ended' && vm && vm.contentWindow) {
                    vm.contentWindow.postMessage(JSON.stringify({method:'setCurrentTime', value:0}), '*');
                    vm.contentWindow.postMessage(JSON.stringify({method:'play'}), '*');
                }
                // Dailymotion: best-effort — its embed posts a plain "video_end"/"end" event on completion.
                if (msg.event === 'video_end' || msg.event === 'end') {
                    var dm = byId('exp-dm-frame');
                    if (dm && dm.contentWindow) {
                        dm.contentWindow.postMessage(JSON.stringify({command:'seek', parameters:[0]}), '*');
                        dm.contentWindow.postMessage(JSON.stringify({command:'play'}), '*');
                    }
                }
            });

            function showCenterIcon(iconClass, persist){
                var el = byId('explore-center-icon');
                var i = el.querySelector('i');
                i.className = iconClass;
                el.style.transition = 'none';
                el.style.opacity = '1';
                if (!persist) {
                    void el.offsetWidth;
                    el.style.transition = 'opacity 0.35s ease';
                    el.style.opacity = '0';
                }
            }

            window.handleExploreTap = function(e){
                var now = Date.now();
                if (now - lastTapTime < 320) {
                    // double tap = like
                    var likes = getLikes();
                    likes[itemKey(curExploreItem)] = curExploreItem;
                    setLikes(likes);
                    byId('explore-like-icon').className = 'fa-solid fa-heart liked';
                    var burst = byId('explore-heart-burst');
                    var rect = byId('explore-tap-layer').getBoundingClientRect();
                    burst.style.left = (e.clientX - rect.left - 45) + 'px';
                    burst.style.top = (e.clientY - rect.top - 45) + 'px';
                    burst.classList.remove('burst'); void burst.offsetWidth; burst.classList.add('burst');
                } else {
                    lastTapTime = now;
                    setTimeout(function(){
                        if (Date.now() - lastTapTime >= 300) toggleExplorePlayPause();
                    }, 320);
                }
            };
            function toggleExplorePlayPause(){
                explorePlaying = !explorePlaying;
                var yt = byId('exp-yt-frame'), vm = byId('exp-vimeo-frame'), dm = byId('exp-dm-frame'), vf = byId('exp-video-file');
                try {
                    if (yt && yt.contentWindow) yt.contentWindow.postMessage(JSON.stringify({event:'command', func: explorePlaying?'playVideo':'pauseVideo', args:[]}), '*');
                    if (vm && vm.contentWindow) vm.contentWindow.postMessage(JSON.stringify({method: explorePlaying?'play':'pause'}), '*');
                    if (dm && dm.contentWindow) dm.contentWindow.postMessage(JSON.stringify({command: explorePlaying?'play':'pause'}), '*');
                    if (vf) { explorePlaying ? vf.play() : vf.pause(); }
                } catch(e) {}
                // Instagram-style feedback: paused → icon appears and stays; resumed → icon flashes then fades fast.
                if (!explorePlaying) showCenterIcon('fa-solid fa-play', true);
                else showCenterIcon('fa-solid fa-play', false);
            }
            window.toggleExploreMute = function(){
                exploreMuted = !exploreMuted;
                byId('explore-mute-icon').className = exploreMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
                var yt = byId('exp-yt-frame'), vm = byId('exp-vimeo-frame'), dm = byId('exp-dm-frame'), vf = byId('exp-video-file');
                try {
                    if (yt && yt.contentWindow) yt.contentWindow.postMessage(JSON.stringify({event:'command', func: exploreMuted?'mute':'unMute', args:[]}), '*');
                    if (vm && vm.contentWindow) vm.contentWindow.postMessage(JSON.stringify({method:'setVolume', value: exploreMuted?0:1}), '*');
                    if (dm && dm.contentWindow) dm.contentWindow.postMessage(JSON.stringify({command:'muted', parameters:[exploreMuted]}), '*');
                    if (vf) vf.muted = exploreMuted;
                } catch(e) {}
            };

            // ---- Vertical swipe navigation between feed items (Reels-style), with live drag-follow ----
            (function(){
                var sy = 0, sx = 0, tracking = false, dragEls = [];
                document.addEventListener('DOMContentLoaded', bindSwipe);
                bindSwipe();
                function getDragEls(){
                    return [byId('explore-player-media'), document.querySelector('.explore-player-sidebar'), document.querySelector('.explore-player-caption')].filter(Boolean);
                }
                function setDrag(px, animated){
                    dragEls.forEach(function(el){
                        el.style.transition = animated ? 'transform 0.25s ease' : 'none';
                        el.style.transform = 'translateY(' + px + 'px)';
                    });
                }
                function bindSwipe(){
                    var layer = byId('explore-tap-layer');
                    if (!layer || layer.dataset.swipeBound) return;
                    layer.dataset.swipeBound = '1';
                    layer.addEventListener('touchstart', function(e){
                        sy = e.touches[0].clientY; sx = e.touches[0].clientX; tracking = true;
                        dragEls = getDragEls();
                    }, { passive:true });
                    layer.addEventListener('touchmove', function(e){
                        if (!tracking) return;
                        var dy = e.touches[0].clientY - sy;
                        var dx = e.touches[0].clientX - sx;
                        if (Math.abs(dy) > Math.abs(dx)) {
                            var atStart = dy > 0 && curExploreIndex === 0;
                            var atEnd = dy < 0 && curExploreIndex >= exploreFeed.length - 1;
                            setDrag(atStart || atEnd ? dy * 0.25 : dy * 0.65, false);
                        }
                    }, { passive:true });
                    layer.addEventListener('touchend', function(e){
                        if (!tracking) return;
                        tracking = false;
                        var dy = e.changedTouches[0].clientY - sy;
                        var dx = e.changedTouches[0].clientX - sx;
                        var winH = window.innerHeight || 800;
                        if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.5 &&
                            ((dy < 0 && curExploreIndex < exploreFeed.length - 1) || (dy > 0 && curExploreIndex > 0))) {
                            var dir = dy < 0 ? -1 : 1;
                            var els = dragEls;
                            els.forEach(function(el){ el.style.transition = 'transform 0.22s ease'; el.style.transform = 'translateY(' + (dir * winH) + 'px)'; });
                            setTimeout(function(){
                                openExplorePlayer(curExploreIndex - dir);
                                var newEls = getDragEls();
                                newEls.forEach(function(el){ el.style.transition = 'none'; el.style.transform = 'translateY(' + (dir * -winH) + 'px)'; });
                                void byId('explore-tap-layer').offsetWidth;
                                requestAnimationFrame(function(){
                                    newEls.forEach(function(el){ el.style.transition = 'transform 0.28s ease'; el.style.transform = 'translateY(0)'; });
                                });
                            }, 220);
                        } else {
                            setDrag(0, true);
                        }
                    });
                }
            })();

            window.toggleExploreLike = function(){
                if (!curExploreItem) return;
                var likes = getLikes();
                var key = itemKey(curExploreItem);
                var liked = !likes[key];
                if (liked) likes[key] = curExploreItem; else delete likes[key];
                setLikes(likes);
                byId('explore-like-icon').className = liked ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart';
            };
            window.toggleExploreSave = function(){
                if (!curExploreItem) return;
                var saves = getSavedMap();
                var key = itemKey(curExploreItem);
                var nowSaved;
                if (saves[key]) { delete saves[key]; nowSaved = false; }
                else { saves[key] = curExploreItem; nowSaved = true; }
                setSavedMap(saves);
                byId('explore-save-icon').className = nowSaved ? 'fa-solid fa-bookmark saved' : 'fa-regular fa-bookmark';
            };
            window.shareExploreItem = function(){
                if (!curExploreItem) return;
                var url = curExploreItem.source === 'youtube' ? ('https://www.youtube.com/watch?v=' + curExploreItem.id)
                    : curExploreItem.source === 'vimeo' ? ('https://vimeo.com/' + curExploreItem.id)
                    : curExploreItem.source === 'dailymotion' ? ('https://www.dailymotion.com/video/' + curExploreItem.id)
                    : (curExploreItem.videoUrl || curExploreItem.thumb);
                if (navigator.share) { navigator.share({ title: curExploreItem.title, url: url }).catch(function(){}); }
                else { navigator.clipboard && navigator.clipboard.writeText(url); alert(isFa() ? 'لینک کپی شد' : 'Link copied'); }
            };
            function renderSavedGrid(){
                var grid = byId('explore-saved-grid');
                var saves = getSavedMap();
                var items = Object.keys(saves).map(function(k){ return saves[k]; });
                if (!items.length) {
                    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:12px;padding:30px;">' +
                        (isFa() ? 'هنوز چیزی ذخیره نکردی.' : 'Nothing saved yet.') + '</div>';
                    return;
                }
                grid.innerHTML = items.map(function(item, i){
                    var tempIdx = exploreFeed.length + i;
                    exploreFeed[tempIdx] = item; // ensure playable even if not in the current live feed
                    return '<div class="explore-item" onclick="openExplorePlayer(' + tempIdx + ')">' +
                        '<div class="ei-source">' + esc(item.source) + '</div>' +
                        '<img src="' + item.thumb + '" loading="lazy">' +
                        '<div class="ei-views"><i class="fa-regular fa-eye"></i> ' + fmtViews(item.viewCount) + '</div>' +
                        '</div>';
                }).join('');
            }
            function renderLikedGrid(){
                var grid = byId('explore-liked-grid');
                var likes = getLikes();
                var items = Object.keys(likes).map(function(k){ return likes[k]; }).filter(function(x){ return x && x.thumb; });
                if (!items.length) {
                    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#888;font-size:12px;padding:30px;">' +
                        (isFa() ? 'هنوز چیزی لایک نکردی.' : 'Nothing liked yet.') + '</div>';
                    return;
                }
                grid.innerHTML = items.map(function(item, i){
                    var tempIdx = exploreFeed.length + 1000 + i;
                    exploreFeed[tempIdx] = item;
                    return '<div class="explore-item" onclick="openExplorePlayer(' + tempIdx + ')">' +
                        '<div class="ei-source">' + esc(item.source) + '</div>' +
                        '<img src="' + item.thumb + '" loading="lazy">' +
                        '<div class="ei-views"><i class="fa-regular fa-eye"></i> ' + fmtViews(item.viewCount) + '</div>' +
                        '</div>';
                }).join('');
            }
        })();
;
