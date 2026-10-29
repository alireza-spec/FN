function toggleSeason(seasonId) {
            const content = document.getElementById(seasonId);
            const toggle = document.getElementById(`${seasonId}-toggle`);
            
            if (content && toggle) {
                if (content.classList.contains('open')) {
                    content.classList.remove('open');
                    toggle.classList.remove('open');
                } else {
                    content.classList.add('open');
                    toggle.classList.add('open');
                }
            }
        }
        
        function showDownloadOptions(url) {
            currentDownloadUrl = url;
            document.getElementById('download-options-modal').style.display = 'flex';
        }
        
        function closeDownloadOptions() {
            document.getElementById('download-options-modal').style.display = 'none';
            currentDownloadUrl = '';
        }
        
        function downloadDirect() {
            if (currentDownloadUrl) {
                window.location.href = currentDownloadUrl;
                closeDownloadOptions();
            }
        }
        
        function downloadWithADM() {
            if (currentDownloadUrl) {
                // فرمت ویژه ADM
                const admIntent = `intent:${currentDownloadUrl}#Intent;scheme=http;package=com.dv.adm;end`;
                window.location.href = admIntent;
                
                // Fallback: اگر ADM نصب نبود
                setTimeout(() => {
                    const msg = LANG === 'fa' ? 
                        'لطفاً ابتدا ADM را از Google Play نصب کنید' : 
                        'Please install ADM from Google Play first';
                    alert(msg);
                }, 1500);
                
                closeDownloadOptions();
            }
        }
        
        function downloadWithOther() {
            if (currentDownloadUrl) {
                // ایجاد لینک موقت برای باز کردن share sheet
                const a = document.createElement('a');
                a.href = currentDownloadUrl;
                a.download = '';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                closeDownloadOptions();
            }
        }
        
        let curTrailerYTKey = null;
        let curTrailerIdx = 0;

        function playTrailer(idx) {
            if (!curTrailerKeys || curTrailerKeys.length === 0) {
                if (!curTrailerKey) {
                    alert(LANG === 'fa' ? 'تریلری موجود نیست' : 'No trailer available');
                    return;
                }
                curTrailerKeys = [{ key: curTrailerKey, name: 'Trailer', type: 'Trailer', official: false }];
            }

            curTrailerIdx = (typeof idx === 'number' && idx >= 0 && idx < curTrailerKeys.length) ? idx : 0;
            curTrailerYTKey = curTrailerKeys[curTrailerIdx].key;

            const modal = document.getElementById('trailer-modal');
            modal.style.display = 'flex';

            // Set title
            document.getElementById('trailer-modal-title').innerText = curTitle || '';
            document.getElementById('trailer-close-label').innerText = LANG === 'fa' ? 'بستن' : 'Close';

            // Build trailer list
            buildTrailerList();
        }

        function buildTrailerList() {
            const container = document.getElementById('trailer-list-container');
            const emptyMsg = document.getElementById('trailer-empty-msg');
            container.innerHTML = '';

            if (!curTrailerKeys || curTrailerKeys.length === 0) {
                emptyMsg.style.display = 'flex';
                document.getElementById('trailer-empty-text').innerText = LANG === 'fa' ? 'تریلری یافت نشد' : 'No trailers found';
                // Try YouTube API as fallback
                fetchYouTubeTrailersFallback();
                return;
            }
            emptyMsg.style.display = 'none';

            const isFa = LANG === 'fa';

            curTrailerKeys.forEach((t, i) => {
                const typeLabel = t.type === 'Trailer' ? (isFa ? 'تریلر' : 'Trailer')
                    : t.type === 'Teaser' ? (isFa ? 'تیزر' : 'Teaser')
                    : t.type === 'Featurette' ? (isFa ? 'پشت صحنه' : 'Featurette')
                    : t.type === 'Clip' ? (isFa ? 'کلیپ' : 'Clip')
                    : t.type;
                const officialText = t.official ? (isFa ? ' · رسمی' : ' · Official') : '';
                const thumbUrl = `https://img.youtube.com/vi/${t.key}/mqdefault.jpg`;

                const card = document.createElement('div');
                card.id = `tcard-${i}`;
                card.style.cssText = `background:#141414; border-radius:14px; overflow:hidden; border:2px solid ${i===curTrailerIdx?'#E50914':'transparent'}; transition:border-color 0.2s;`;

                card.innerHTML = `
                    <div style="position:relative; cursor:pointer;" onclick="playInlineTrailer('${t.key}', ${i})">
                        <img src="${thumbUrl}" style="width:100%;height:auto;display:block;max-height:220px;object-fit:cover;" onerror="this.style.background='#222';this.style.minHeight='150px';this.src='';">
                        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                            <div style="width:52px;height:52px;border-radius:50%;background:rgba(229,9,20,0.88);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 16px rgba(0,0,0,0.7);">
                                <svg viewBox="0 0 10 12" width="18" height="20" fill="white"><polygon points="1,1 9,6 1,11"/></svg>
                            </div>
                        </div>
                        ${t.official ? `<div style="position:absolute;top:8px;${isFa?'left':'right'}:8px;background:#E50914;color:white;font-size:8px;padding:3px 7px;border-radius:5px;font-weight:bold;">${isFa?'رسمی':'Official'}</div>` : ''}
                    </div>
                    <div style="padding:9px 12px 5px;">
                        <div style="color:#fff;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name || typeLabel}</div>
                        <div style="color:#666;font-size:10px;margin-top:2px;">${typeLabel}${officialText}</div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #222;margin-top:5px;">
                        <button onclick="playInlineTrailer('${t.key}', ${i})" style="background:#1a1a1a; color:#fff; border:none; border-left:1px solid #222; padding:10px 6px; font-size:11px; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:5px;">
                            <svg viewBox="0 0 10 12" width="10" height="11" fill="#E50914"><polygon points="1,1 9,6 1,11"/></svg>
                            ${isFa ? 'پخش در اپ' : 'Play In-App'}
                        </button>
                        <button onclick="openTrailerYT('${t.key}', ${i})" style="background:#1a1a1a; color:#fff; border:none; padding:10px 6px; font-size:11px; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:5px;">
                            <svg viewBox="0 0 20 14" width="13" height="9" fill="#E50914"><path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2.1 3.8 0 7 0 7s.1 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.3-1.6.4-4.8.4-4.8s-.1-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/></svg>
                            ${isFa ? 'یوتیوب' : 'YouTube'}
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Fetch trailers via YouTube API when TMDB has none
        async function fetchYouTubeTrailersFallback() {
            const container = document.getElementById('trailer-list-container');
            const emptyMsg = document.getElementById('trailer-empty-msg');
            const isFa = LANG === 'fa';
            if (!curTitle) return;

            const year = curDataForFav ? ((curDataForFav.release_date || curDataForFav.first_air_date || '').split('-')[0]) : '';
            const query = curTitle + ' ' + year + ' official trailer';
            
            emptyMsg.style.display = 'none';
            container.innerHTML = '<div style="text-align:center;padding:30px;color:#555;"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;color:#E50914;"></i></div>';

            const results = await fetchYouTubeVideos(query, 5);
            container.innerHTML = '';

            if (!results || results.length === 0) {
                emptyMsg.style.display = 'flex';
                document.getElementById('trailer-empty-text').innerText = isFa ? 'تریلری یافت نشد' : 'No trailers found';
                return;
            }

            results.forEach((vid, i) => {
                const card = document.createElement('div');
                card.style.cssText = `background:#141414; border-radius:14px; overflow:hidden; border:2px solid ${i===0?'#E50914':'transparent'}; transition:border-color 0.2s; margin-bottom:0;`;

                card.innerHTML = `
                    <div style="position:relative; cursor:pointer;" onclick="playInlineTrailerEmbed('https://www.youtube.com/embed/${vid.videoId}?autoplay=1&playsinline=1', this.closest('div[style]'))">
                        <img src="${vid.thumbnail}" style="width:100%;height:auto;display:block;max-height:220px;object-fit:cover;">
                        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                            <div style="width:52px;height:52px;border-radius:50%;background:rgba(229,9,20,0.88);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 16px rgba(0,0,0,0.7);">
                                <svg viewBox="0 0 10 12" width="18" height="20" fill="white"><polygon points="1,1 9,6 1,11"/></svg>
                            </div>
                        </div>
                    </div>
                    <div style="padding:9px 12px 5px;">
                        <div style="color:#fff;font-size:12px;font-weight:600;line-height:1.4;">${vid.title.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                        <div style="color:#666;font-size:10px;margin-top:2px;">${vid.channel}</div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #222;margin-top:5px;">
                        <button onclick="playInlineTrailerEmbed('https://www.youtube.com/embed/${vid.videoId}?autoplay=1&playsinline=1', this.closest('[style]').parentElement)" style="background:#1a1a1a; color:#fff; border:none; border-left:1px solid #222; padding:10px 6px; font-size:11px; cursor:pointer; font-family:inherit; display:flex; align-items:center; justify-content:center; gap:5px;">
                            <svg viewBox="0 0 10 12" width="10" height="11" fill="#E50914"><polygon points="1,1 9,6 1,11"/></svg>
                            ${isFa ? 'پخش در اپ' : 'Play In-App'}
                        </button>
                        <a href="https://www.youtube.com/watch?v=${vid.videoId}" target="_blank" style="background:#1a1a1a; color:#fff; text-decoration:none; padding:10px 6px; font-size:11px; display:flex; align-items:center; justify-content:center; gap:5px;">
                            <svg viewBox="0 0 20 14" width="13" height="9" fill="#E50914"><path d="M19.6 2.2C19.4 1.4 18.8.8 18 .6 16.4.2 10 .2 10 .2S3.6.2 2 .6C1.2.8.6 1.4.4 2.2.1 3.8 0 7 0 7s.1 3.2.4 4.8c.2.8.8 1.4 1.6 1.6C3.6 13.8 10 13.8 10 13.8s6.4 0 8-.4c.8-.2 1.4-.8 1.6-1.6.3-1.6.4-4.8.4-4.8s-.1-3.2-.4-4.8zM8 10V4l5.3 3L8 10z"/></svg>
                            ${isFa ? 'یوتیوب' : 'YouTube'}
                        </a>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function playInlineTrailerEmbed(embedUrl, cardEl) {
            const player = document.getElementById('trailer-inline-player');
            const iframe = document.getElementById('trailer-iframe');
            const isFa = LANG === 'fa';
            document.getElementById('close-player-label').innerText = isFa ? 'بستن پلیر' : 'Close Player';
            const embedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#000;width:100%;height:100vh;overflow:hidden;}iframe{width:100%;height:100%;border:none;}</style></head><body><iframe src="${embedUrl}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>



<style id="fn-live-filter-two-rows">#live-tab .fn-live-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px 8px;align-items:end}#live-tab .fn-live-filter-field{min-width:0;display:flex;flex-direction:column;gap:3px}#live-tab .fn-live-filter-field>label{display:block;color:var(--sub);font-size:10px;font-weight:700;line-height:15px;padding-inline:2px;white-space:nowrap}#live-tab .fn-live-filter-field .fn-live-input,#live-tab .fn-live-filter-field .fn-live-select{height:34px;min-height:34px;padding:7px 9px;border-radius:8px;line-height:18px;font-size:11px}#live-tab .fn-live-filters>.fn-live-filter-field:nth-child(4){grid-column:1}#live-tab .fn-live-filters>.fn-live-filter-field:nth-child(5){grid-column:2}@media(max-width:620px){#live-tab .fn-live-filters{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}#live-tab .fn-live-filter-field>label{font-size:9px}}</style></body></html>`;
            iframe.removeAttribute('src');
            iframe.srcdoc = embedHtml;
            player.style.display = 'block';
            player.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function playInlineTrailer(key, idx) {
            // Highlight card
            curTrailerIdx = idx;
            curTrailerYTKey = key;
            const cards = document.getElementById('trailer-list-container').children;
            Array.from(cards).forEach((c, i) => { c.style.borderColor = i === idx ? '#E50914' : 'transparent'; });

            // Show inline player
            const player = document.getElementById('trailer-inline-player');
            const iframe = document.getElementById('trailer-iframe');
            const isFa = LANG === 'fa';
            document.getElementById('close-player-label').innerText = isFa ? 'بستن پلیر' : 'Close Player';

            // Use srcdoc with full HTML to avoid referrer/origin blocking from content:// 
            const embedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#000;width:100%;height:100vh;overflow:hidden;}iframe{width:100%;height:100%;border:none;}</style></head><body><iframe src="https://www.youtube.com/embed/${key}?autoplay=1&playsinline=1&rel=0&modestbranding=1&controls=1&fs=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></body></html>`;

            iframe.removeAttribute('src');
            iframe.srcdoc = embedHtml;
            player.style.display = 'block';

            // Scroll to player
            player.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function closeInlinePlayer() {
            const player = document.getElementById('trailer-inline-player');
            const iframe = document.getElementById('trailer-iframe');
            iframe.srcdoc = '';
            iframe.removeAttribute('src');
            player.style.display = 'none';
        }

        function openTrailerYT(key, idx) {
            if (typeof idx === 'number') {
                curTrailerIdx = idx;
                curTrailerYTKey = key;
                // Highlight selected
                const cards = document.getElementById('trailer-list-container').children;
                Array.from(cards).forEach((c, i) => {
                    c.style.borderColor = i === idx ? '#E50914' : 'transparent';
                });
            }
            // Try YouTube app intent first (Android), fallback to browser
            const intentUrl = `intent://www.youtube.com/watch?v=${key}#Intent;package=com.google.android.youtube;scheme=https;end`;
            const a = document.createElement('a');
            a.href = intentUrl;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            // Fallback to browser after short delay if app didn't open
            setTimeout(() => {
                try {
                    window.open(`https://www.youtube.com/watch?v=${key}`, '_blank');
                } catch(e) {}
            }, 800);
        }

        function openWithYouTubeApp(videoId) {
            openTrailerYT(videoId || curTrailerYTKey);
        }

        function openYouTubeDirect(videoId) {
            const key = videoId || curTrailerYTKey;
            if (key) window.open(`https://www.youtube.com/watch?v=${key}`, '_blank');
            closeTrailer();
        }

        function closeTrailer() {
            closeInlinePlayer();
            document.getElementById('trailer-modal').style.display = 'none';
            curTrailerYTKey = null;
        }


        // === SERVER DEFINITIONS ===
        const SERVERS = [
            { key: 'autoembed',  fa: 'سرور ۱ (AutoEmbed)',     en: 'Server 1 (AutoEmbed)',
              movie: (id,tm,im)=>`https://autoembed.co/movie/imdb/${im||tm}`,
              tv: (id,s,e,tm,im)=>`https://autoembed.co/tv/imdb/${im||tm}/${s}/${e}` },
            { key: 'vidsrcme',   fa: 'سرور ۲ (VidSrc)',        en: 'Server 2 (VidSrc)',
              movie: (id,tm,im)=>`https://vidsrcme.ru/embed/movie/${im||tm}`,
              tv: (id,s,e,tm,im)=>`https://vidsrcme.ru/embed/tv/${im||tm}/${s}/${e}` },
            { key: 'embed2',     fa: 'سرور ۳ (2Embed)',        en: 'Server 3 (2Embed)',
              movie: (id,tm,im)=>`https://www.2embed.cc/embed/${im||tm}`,
              tv: (id,s,e,tm,im)=>`https://www.2embed.cc/embedtv/${im||tm}&s=${s}&e=${e}` },
            { key: 'smashynet',  fa: 'سرور ۴ (SmashyStream)',  en: 'Server 4 (SmashyStream)',
              movie: (id,tm,im)=>`https://embed.smashystream.com/playere.php?imdb=${im||tm}`,
              tv: (id,s,e,tm,im)=>`https://embed.smashystream.com/playere.php?imdb=${im||tm}&season=${s}&episode=${e}` },
            { key: 'nontongo',   fa: 'سرور ۵ (NontonGo)',      en: 'Server 5 (NontonGo)',
              movie: (id,tm,im)=>`https://www.nontongo.win/embed/movie/${im||tm}`,
              tv: (id,s,e,tm,im)=>`https://www.nontongo.win/embed/tv/${im||tm}/${s}/${e}` },
            { key: 'movies111',  fa: 'سرور ۷ (111Movies)',     en: 'Server 7 (111Movies)',
              movie: (id,tm,im)=>`https://111movies.com/movie/${tm}`,
              tv: (id,s,e,tm,im)=>`https://111movies.com/tv/${tm}/${s}/${e}` },
            { key: 'vidlink',    fa: 'سرور ۸ (VidLink)',       en: 'Server 8 (VidLink)',
              movie: (id,tm,im)=>`https://vidlink.pro/movie/${tm}`,
              tv: (id,s,e,tm,im)=>`https://vidlink.pro/tv/${tm}/${s}/${e}` },
            { key: 'videasy',    fa: 'سرور ۹ (VidEasy)',       en: 'Server 9 (VidEasy)',
              movie: (id,tm,im)=>`https://player.videasy.net/movie/${tm}`,
              tv: (id,s,e,tm,im)=>`https://player.videasy.net/tv/${tm}/${s}/${e}` },
        ];
        
        let curPlayerServer = 0;
        
        function getServerUrl(srv) {
            if(!curId && !curImdb) return '';
            const imdb = curImdb || '';
            const tmdb = curId || '';
            const id = imdb || tmdb;
            if(curType === 'movie') return srv.movie(id, tmdb, imdb);
            return srv.tv(id, curSeason||1, curEp||1, tmdb, imdb);
        }
        
        function buildServerTabs() {
            const tabs = document.getElementById('player-server-tabs');
            if(!tabs) return;
            tabs.innerHTML = '';
            SERVERS.forEach((srv, i) => {
                const label = LANG === 'fa' ? srv.fa : srv.en;
                const btn = document.createElement('button');
                btn.className = 'psrv-tab' + (i === curPlayerServer ? ' active' : '');
                btn.textContent = label;
                btn.onclick = () => switchServer(i);
                tabs.appendChild(btn);
            });
        }
        
        function _applyServerClass(idx) {
            const pfs = document.getElementById('player-fs');
            if (!pfs) return;
            // Remove all server classes
            SERVERS.forEach(srv => {
                pfs.classList.remove('srv-' + srv.key);
                pfs.classList.remove('srv-' + srv.key + '-movie');
                pfs.classList.remove('srv-' + srv.key + '-tv');
            });
            if (SERVERS[idx]) {
                const key = SERVERS[idx].key;
                pfs.classList.add('srv-' + key);
                if (curType) pfs.classList.add('srv-' + key + '-' + curType);
            }
        }

        function switchServer(idx) {
            curPlayerServer = idx;
            _applyServerClass(idx);
            const tabs = document.querySelectorAll('.psrv-tab');
            tabs.forEach((t,i) => t.classList.toggle('active', i===idx));
            const srv = SERVERS[idx];
            const url = getServerUrl(srv);
            // Keep the app-level landscape state stable while standard server iframes reload.
            const pfs = document.getElementById('player-fs');
            if (pfs && pfs.classList.contains('srv-vidsrcme-tv')) pfs.classList.remove('landscape-mode');
            else if (document.fullscreenElement || document.webkitFullscreenElement) setTimeout(_playerLandscape, 50);
            _setIframeSmart(url);
        }

        // ShowBox داخلی — انتخاب sub-server
        function _openShowboxPicker(serverIdx) {
            const existing = document.getElementById('showbox-picker');
            if (existing) existing.remove();
            const isFA = LANG === 'fa';
            const tm = curId || '';
            const s = curSeason || 1, e = curEp || 1;
            const isTV = curType === 'tv';
            const subServers = [
                { label: 'UpCloud', key: 'upcloud' },
                { label: 'Vidking', key: 'vidking' },
                { label: 'Videasy', key: 'videasy' },
            ];
            let btns = subServers.map(sub => {
                const url = isTV
                    ? `https://showboxmovies.one/tv/${tm}/${s}/${e}?server=${sub.key}`
                    : `https://showboxmovies.one/movie/${tm}?server=${sub.key}`;
                return `<button onclick="document.getElementById('iframe').src='${url}';document.getElementById('showbox-picker').remove();"
                    style="flex:1;padding:12px 8px;background:#1a1a2e;border:1px solid #3a3a5a;border-radius:10px;color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:0.15s;"
                    onmousedown="this.style.background='#2a2a4e'" onmouseup="this.style.background='#1a1a2e'">
                    <i class="fa-solid fa-server" style="color:#a78bfa;display:block;font-size:18px;margin-bottom:4px;"></i>${sub.label}
                </button>`;
            }).join('');
            const overlay = document.createElement('div');
            overlay.id = 'showbox-picker';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `
                <div style="background:#0d0d1a;border-radius:16px;padding:20px;width:88%;max-width:340px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                        <div style="color:white;font-size:14px;font-weight:800;">📺 ShowBox — ${isFA?'انتخاب سرور':'Choose Server'}</div>
                        <button onclick="document.getElementById('showbox-picker').remove()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex;gap:10px;">${btns}</div>
                </div>`;
            overlay.addEventListener('click', ev => { if(ev.target===overlay) overlay.remove(); });
            document.body.appendChild(overlay);
        }
        
        // ── Small dismissible hint shown only when VidSrc is the active
        // server: VidSrc's own embed has an internal "SERVER ▾" dropdown
        // with alternate backend sources — if their default source fails
        // to connect, the user can switch it from inside the player itself. ──
        let _vidsrcHintTimer = null;
        function _showVidSrcHint() {
            const hint = document.getElementById('vidsrc-hint');
            const textEl = document.getElementById('vidsrc-hint-text');
            if (!hint || !textEl) return;
            const srv = SERVERS[curPlayerServer];
            clearTimeout(_vidsrcHintTimer);
            if (!srv || srv.key !== 'vidsrcme') { hint.classList.remove('show'); return; }
            textEl.textContent = LANG === 'fa'
                ? '💡 اگه پخش نشد، روی «SERVER ▾» داخل پلیر بزن و منبع دیگه‌ای رو امتحان کن'
                : '💡 If it won\'t play, tap "SERVER ▾" inside the player to try another source';
            hint.classList.add('show');
            _vidsrcHintTimer = setTimeout(() => { hint.classList.remove('show'); }, 7000);
        }

        function openPlayerModal(serverIdx) {
            if(!curImdb && !curId) return alert('اطلاعات پخش موجود نیست');
            var _playPoster = (curDataForFav && curDataForFav.poster_path) ? (IMG_LG + curDataForFav.poster_path) : document.getElementById('d-img').src;
            recordRecentlyViewed({id:curId,title:curTitle,poster:_playPoster,poster_path:curDataForFav && curDataForFav.poster_path,vote_average:curDataForFav && curDataForFav.vote_average}, curId, curType, true);
            addToHistory({ id: curId, type: curType, title: curTitle, poster: _playPoster, genres: curDataForFav ? curDataForFav.genres : null, rate: curDataForFav ? curDataForFav.vote_average : null });
            
            if (serverIdx !== undefined) {
                curPlayerServer = serverIdx;
            } else if (curType === 'tv') {
                const vidsrcIdx = SERVERS.findIndex(s => s.key === 'vidsrcme');
                curPlayerServer = vidsrcIdx >= 0 ? vidsrcIdx : 0;
            } else {
                curPlayerServer = 0;
            }
            
            const titleEl = document.getElementById('player-title-text');
            const epEl = document.getElementById('player-ep-label');
            if(titleEl) titleEl.textContent = curTitle || '';
            if(epEl) {
                if(curType === 'tv' && curSeason && curEp) epEl.textContent = `S${curSeason} · E${curEp}`;
                else epEl.textContent = '';
            }
            
            // Show/hide episode nav buttons (prev/list/next) for TV
            const epToggle = document.getElementById('player-ep-toggle');
            const prevEpBtn = document.getElementById('player-prev-ep-btn');
            const nextEpBtn = document.getElementById('player-next-ep-btn');
            const isTV = (curType === 'tv');
            if(epToggle) epToggle.style.display = isTV ? 'flex' : 'none';
            if(prevEpBtn) prevEpBtn.style.display = isTV ? 'flex' : 'none';
            if(nextEpBtn) nextEpBtn.style.display = isTV ? 'flex' : 'none';
            
            // Close episode menu if open
            const epMenu = document.getElementById('player-ep-menu');
            if(epMenu) epMenu.classList.remove('open');
            
            buildServerTabs();
            _applyServerClass(curPlayerServer);
            const url = getServerUrl(SERVERS[curPlayerServer]);
            _setIframeSmart(url);
            const pfs = document.getElementById('player-fs');
            pfs._fnLandscapeRequested = false;
            pfs.style.display = 'flex';
            
            // Show topbar and start 5-second auto-hide timer
            _showTopbar();
            _startTopbarTimer();
            
            // Request fullscreen on player div, then lock to landscape
            const _fsReq = pfs.requestFullscreen || pfs.webkitRequestFullscreen || pfs.mozRequestFullScreen;
            const _lockLS = function() {
                try {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock('landscape').catch(function() { pfs.classList.add('landscape-mode'); });
                    } else if (window.screen.lockOrientation) {
                        window.screen.lockOrientation('landscape-primary');
                    } else {
                        pfs.classList.add('landscape-mode');
                    }
                } catch(e) { pfs.classList.add('landscape-mode'); }
            };
            if (_fsReq) {
                _fsReq.call(pfs).then(_lockLS).catch(_lockLS);
            } else {
                _lockLS();
            }
        }
        
        function togglePlayerEpMenu() {
            const menu = document.getElementById('player-ep-menu');
            const backdrop = document.getElementById('player-ep-backdrop');
            if(!menu) return;
            const isOpen = menu.classList.toggle('open');
            if(backdrop) backdrop.classList.toggle('open', isOpen);
            if(isOpen) buildPlayerEpMenu();
        }
        
        function buildPlayerEpMenu() {
            const seasonSel = document.getElementById('player-season-select');
            const epList = document.getElementById('player-ep-list');
            if(!seasonSel || !epList || !curDataForFav) return;
            
            const totalSeasons = curDataForFav.number_of_seasons || curSeason || 1;
            seasonSel.innerHTML = '';
            for(let s = 1; s <= totalSeasons; s++) {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = LANG === 'fa' ? `فصل ${s}` : `Season ${s}`;
                if(s === (curSeason || 1)) opt.selected = true;
                seasonSel.appendChild(opt);
            }
            // Update close btn text
            const closeLabel = document.getElementById('txt-pep-close');
            if(closeLabel) closeLabel.textContent = LANG === 'fa' ? 'بستن' : 'Close';
            
            loadPlayerSeasonEps(curSeason || 1);
        }
        
        async function loadPlayerSeason(s) {
            curSeason = parseInt(s);
            loadPlayerSeasonEps(curSeason);
        }
        
        async function loadPlayerSeasonEps(season) {
            const epList = document.getElementById('player-ep-list');
            if(!epList) return;
            epList.innerHTML = '<div style="text-align:center;padding:20px;color:#555;"><i class="fa-solid fa-spinner fa-spin"></i></div>';
            
            try {
                const data = await getData(`tv/${curId}/season/${season}`);
                if(!data || !data.episodes) { epList.innerHTML = ''; return; }
                
                epList.innerHTML = '';
                data.episodes.forEach(ep => {
                    const epNum = ep.episode_number;
                    const epName = ep.name || '';
                    const rating = ep.vote_average ? parseFloat(ep.vote_average).toFixed(1) : null;
                    const isActive = (parseInt(season) === curSeason && epNum === curEp);
                    
                    const numLabel = LANG === 'fa'
                        ? `ف${season} ق${epNum}`
                        : `S${season}·E${String(epNum).padStart(2,'0')}`;
                    
                    const div = document.createElement('div');
                    div.className = 'pep-item' + (isActive ? ' active' : '');
                    div.dataset.ep = epNum;
                    div.innerHTML = '<span class="pep-num">' + numLabel + '</span>'
                        + '<span class="pep-name">' + epName + '</span>'
                        + (rating && rating > 0 ? '<span class="pep-rating">⭐' + rating + '</span>' : '');
                    div.onclick = () => playerPlayEp(parseInt(season), epNum);
                    epList.appendChild(div);
                });
            } catch(e) {
                epList.innerHTML = '<div style="color:#555;text-align:center;padding:16px;font-size:12px;">خطا در بارگذاری</div>';
            }
        }
        
        function playerPlayEp(season, ep) {
            curSeason = season;
            curEp = ep;
            
            // Update ep label in topbar
            const epEl = document.getElementById('player-ep-label');
            if(epEl) epEl.textContent = `S${season} · E${ep}`;
            
            // Load new URL
            const url = getServerUrl(SERVERS[curPlayerServer]);
            _setIframeSmart(url);
            
            // Close menu immediately
            const menu = document.getElementById('player-ep-menu');
            const backdrop = document.getElementById('player-ep-backdrop');
            if(menu) menu.classList.remove('open');
            if(backdrop) backdrop.classList.remove('open');
            
            // Re-highlight active item
            document.querySelectorAll('.pep-item').forEach(el => {
                const n = parseInt(el.dataset.ep);
                el.classList.toggle('active', n === ep);
            });
        }

        // ── Next/Previous episode navigation (same server, same as clicking
        // an episode in the list) — rolls over into the adjacent season at
        // the season boundary. ──
        async function _getSeasonEpisodeCount(season) {
            try {
                const data = await getData(`tv/${curId}/season/${season}`);
                return (data && data.episodes) ? data.episodes.length : null;
            } catch(e) { return null; }
        }

        async function playerNextEpisode() {
            if (curType !== 'tv' || !curId) return;
            haptic(20);
            let season = curSeason || 1, ep = curEp || 1;
            const count = await _getSeasonEpisodeCount(season);
            if (count && ep < count) {
                ep = ep + 1;
            } else {
                const totalSeasons = (curDataForFav && curDataForFav.number_of_seasons) || season;
                if (season < totalSeasons) { season = season + 1; ep = 1; }
                else { return; } // already at the last episode of the last season
            }
            playerPlayEp(season, ep);
        }

        async function playerPrevEpisode() {
            if (curType !== 'tv' || !curId) return;
            haptic(20);
            let season = curSeason || 1, ep = curEp || 1;
            if (ep > 1) {
                ep = ep - 1;
            } else if (season > 1) {
                season = season - 1;
                const count = await _getSeasonEpisodeCount(season);
                ep = count || 1;
            } else {
                return; // already at S1E1
            }
            playerPlayEp(season, ep);
        }
        
        function playVid(s) {
            const idx = SERVERS.findIndex(srv => srv.key === s);
            openPlayerModal(idx >= 0 ? idx : 0);
        }
        
        // NEW: WATCH HISTORY FUNCTIONS
        function addToHistory(item) {
            // Remove if already exists
            WATCH_HISTORY = WATCH_HISTORY.filter(h => !(h.id === item.id && h.type === item.type));
            
            // Add to beginning
            WATCH_HISTORY.unshift({
                id: item.id,
                type: item.type,
                title: item.title,
                poster: item.poster,
                genreIds: item.genres ? item.genres.map(g => g.id) : [],
                rate: item.rate || null,
                date: new Date().toISOString()
            });
            
            // Keep only last 50 items
            if (WATCH_HISTORY.length > 50) {
                WATCH_HISTORY = WATCH_HISTORY.slice(0, 50);
            }
            
            localStorage.setItem('watch_history', JSON.stringify(WATCH_HISTORY));
        }
        
        function historyClassify(item) {
            var genreIds = item.genreIds || [];
            // TMDB genre ids: 99 = Documentary (movie+tv), 10764 = Reality (tv)
            if (genreIds.indexOf(99) > -1 || genreIds.indexOf(10764) > -1) return 'other';
            return item.type === 'movie' ? 'movie' : 'series';
        }
        let historyFilterType = 'all'; // 'all' | 'movie' | 'tv'
        function setHistoryFilter(f) {
            historyFilterType = f;
            loadHistory();
        }
        // Older saved entries (before poster/year/genre were tracked) get upgraded in the background
        // with real TMDB poster, release year, rating and genres — then persisted, so this only runs once per item.
        async function hydrateHistoryItem(item) {
            try {
                const d = await getData(`${item.type}/${item.id}`);
                if (!d) return false;
                if (d.poster_path) item.poster = IMG_LG + d.poster_path;
                item.year = (d.release_date || d.first_air_date || '').split('-')[0] || '';
                item.rate = d.vote_average || null;
                item.genreIds = (d.genres || []).map(g => g.id);
                return true;
            } catch (e) { return false; }
        }
        function loadHistory() {
            const c = document.getElementById('history-content');
            if (!c) return;
            const isFa = LANG === 'fa';
            const items = (recentlyViewed || []).slice().sort(function(a,b){ return (b.recentAt||0)-(a.recentAt||0); });
            const movies = items.filter(function(x){ return x.type === 'movie'; }).length;
            const series = items.filter(function(x){ return x.type === 'tv'; }).length;
            const watched = items.filter(function(x){ return !!x.watchedAt; }).length;
            const labels = isFa ? {title:'تماشای اخیر',sub:'آثاری که اخیراً بازدید کرده‌ای',all:'همه',movie:'فیلم‌ها',series:'سریال‌ها',visited:'بازدید شده',watched:'تماشا شده',empty:'هنوز اثری را بازدید نکرده‌ای',clear:'پاک کردن همه'} : {title:'Recently',sub:'Titles you opened recently',all:'All',movie:'Movies',series:'Series',visited:'Visited',watched:'Watched',empty:'You have not opened any title yet',clear:'Clear All'};
            let html = '<div class="fn-recent-dashboard">' +
                '<div class="fn-recent-heading"><div><div class="fn-recent-title"><i class="fa-solid fa-clock-rotate-left"></i> '+labels.title+'</div><div class="fn-recent-sub">'+labels.sub+'</div></div><div class="fn-recent-total"><b>'+items.length+'</b><span>'+labels.visited+'</span></div></div>' +
                '<div class="fn-recent-stats">' +
                '<div class="fn-recent-stat"><i class="fa-solid fa-film"></i><b>'+movies+'</b><span>'+labels.movie+'</span></div>' +
                '<div class="fn-recent-stat"><i class="fa-solid fa-tv"></i><b>'+series+'</b><span>'+labels.series+'</span></div>' +
                '<div class="fn-recent-stat watched"><i class="fa-solid fa-circle-play"></i><b>'+watched+'</b><span>'+labels.watched+'</span></div>' +
                '</div></div>' +
                '<div class="fn-recent-toolbar"><div class="fn-recent-filters">'+
                '<button class="'+(historyFilterType==='all'?'active':'')+'" onclick="setHistoryFilter(\'all\')">'+labels.all+'</button>'+ 
                '<button class="'+(historyFilterType==='movie'?'active':'')+'" onclick="setHistoryFilter(\'movie\')">'+labels.movie+'</button>'+ 
                '<button class="'+(historyFilterType==='tv'?'active':'')+'" onclick="setHistoryFilter(\'tv\')">'+labels.series+'</button></div>' +
                '<button class="fn-recent-clear" onclick="requestClearHistory()"><i class="fa-solid fa-trash-can"></i> '+labels.clear+'</button></div>';
            const visible = items.filter(function(item){ return historyFilterType==='all' || item.type===historyFilterType; });
            html += '<div class="grid-container fn-recent-grid">';
            visible.forEach(function(item){
                var title=_fnInfoEsc(item.title||item.name||'Untitled'), poster=item.poster || (item.poster_path ? IMG_LG+item.poster_path : '');
                var status = item.watchedAt ? '<span class="fn-recent-badge watched"><i class="fa-solid fa-circle-play"></i> '+labels.watched+'</span>' : '<span class="fn-recent-badge visited"><i class="fa-solid fa-eye"></i> '+labels.visited+'</span>';
                html += '<div class="card fn-recent-card '+(item.watchedAt?'is-watched':'is-visited')+'" onclick="openDetail('+item.id+', \''+item.type+'\')">'+status+'<i class="fa-solid fa-xmark" onclick="event.stopPropagation();removeHistoryItem('+item.id+', \''+item.type+'\')"></i><img src="'+poster+'" class="poster" loading="lazy" alt="'+title+'"><div class="meta-title">'+title+'</div></div>';
            });
            html += '</div>';
            if (!visible.length) html += '<div class="fn-recent-empty"><i class="fa-solid fa-clock"></i><div>'+labels.empty+'</div></div>';
            c.innerHTML = html;
        }
        function removeHistoryItem(id, type) {
            recentlyViewed = recentlyViewed.filter(h => !(String(h.id) === String(id) && (h.type||'movie') === type));
            WATCH_HISTORY = WATCH_HISTORY.filter(h => !(String(h.id) === String(id) && h.type === type));
            localStorage.setItem(RECENTLY_KEY, JSON.stringify(recentlyViewed)); localStorage.setItem('watch_history', JSON.stringify(WATCH_HISTORY));
            loadHistory();
        }
        function requestClearHistory() {
            const isFa = LANG === 'fa';
            document.getElementById('clear-history-confirm-text').textContent = isFa
                ? 'آیا مطمئن هستید که می‌خواهید کل حافظه تماشا را حذف کنید؟'
                : 'Are you sure you want to delete your entire watch history?';
            document.getElementById('clear-history-confirm-no').textContent = isFa ? 'خیر' : 'No';
            document.getElementById('clear-history-confirm-yes').textContent = isFa ? 'بله' : 'Yes';
            document.getElementById('clear-history-confirm').style.display = 'flex';
        }
        function closeClearHistoryConfirm() {
            document.getElementById('clear-history-confirm').style.display = 'none';
        }
        function confirmClearHistory() {
            WATCH_HISTORY = []; recentlyViewed = [];
            localStorage.setItem('watch_history', JSON.stringify(WATCH_HISTORY)); localStorage.setItem(RECENTLY_KEY, JSON.stringify(recentlyViewed));
            closeClearHistoryConfirm();
            loadHistory();
        }
        
        // NEW: Open country-specific content grid
        function openCountryGrid(countryCode, countryName) {
            const query = `discover/movie?with_origin_country=${countryCode}&sort_by=vote_average.desc&vote_count.gte=50`;
            openGenericGrid('movie', query, countryName);
        }
        
        // NEW: Open genre-specific content grid (random)
        function openGenreGrid(genreId, genreName) {
            const query = `discover/movie?with_genres=${genreId}&sort_by=popularity.desc`;
            openGenericGrid('movie', query, genreName);
        }
        
        // NEW: Open subject-specific content grid (random)
        function openSubjectGrid(keywords, subjectName) {
            const query = `discover/movie?with_keywords=${keywords}&sort_by=popularity.desc`;
            openGenericGrid('movie', query, subjectName);
        }
        
        // NEW: Open random country content (from sidebar)
        function openRandomCountryGrid(countryCode, countryName) {
            const query = `discover/movie?with_origin_country=${countryCode}&sort_by=popularity.desc`;
            openGenericGrid('movie', query, countryName);
        }
        
        // --- AWARDS FETCH & RENDER (OMDb API) ---
        async function fetchAndRenderAwards(imdbId, type, container) {
            if (!imdbId) return;
            try {
                // استفاده از OMDb API برای اطلاعات جوایز
                const omdbUrl = `https://www.omdbapi.com/?i=${imdbId}&apikey=trilogy`;
                const res = await fetch(PROXY + encodeURIComponent(omdbUrl));
                const data = await res.json();
                
                if (data && data.Awards && data.Awards !== 'N/A' && data.Awards !== '') {
                    const awardsText = data.Awards;
                    // Parse awards string like "Won 4 Oscars. 140 wins & 185 nominations total."
                    let badge = '';
                    
                    const oscarMatch = awardsText.match(/Won\s+(\d+)\s+Oscar/i);
                    const winsMatch = awardsText.match(/(\d+)\s+win/i);
                    const nomMatch = awardsText.match(/(\d+)\s+nomination/i);
                    const emmyMatch = awardsText.match(/(\d+)\s+Emmy/i) || awardsText.match(/Emmy/i);
                    
                    if (oscarMatch) {
                        badge += `<span class="awards-badge" title="${awardsText}">🏆 ${oscarMatch[1]} Oscar${oscarMatch[1]>1?'s':''}</span>`;
                    }
                    if (type === 'tv' && emmyMatch) {
                        const emmyCount = emmyMatch[1] || '';
                        badge += `<span class="awards-badge" title="${awardsText}">🏆 ${emmyCount ? emmyCount+' Emmy' : 'Emmy Winner'}${emmyCount>1?'s':''}</span>`;
                    }
                    if (winsMatch) {
                        const wins = parseInt(winsMatch[1]);
                        const noms = nomMatch ? parseInt(nomMatch[1]) : 0;
                        if (!oscarMatch || wins > 4) {
                            const wLabel = LANG === 'fa' ? 'جایزه' : 'wins';
                            const nLabel = LANG === 'fa' ? 'نامزدی' : 'noms.';
                            badge += `<span class="awards-badge" title="${awardsText}">🎖️ ${wins} ${wLabel}${noms ? ' · '+noms+' '+nLabel : ''}</span>`;
                        }
                    }
                    
                    if (badge) container.innerHTML += badge;
                }
            } catch(e) {
                // جوایز در دسترس نیست - سکوت
            }
        }
        
        function epDlClick(el) {
            const imdb = el.getAttribute('data-imdb');
            const season = el.getAttribute('data-season');
            const ep = el.getAttribute('data-ep');
            openVqModal(imdb, 'tv', season, ep);
        }
        
        // ===== VQ DOWNLOAD QUALITY MODAL =====
        let vqCurrentImdb = null, vqCurrentType = null, vqCurrentSeason = null, vqCurrentEp = null;
        let vqLinks = [];
        
        function openVqModal(imdbId, mediaType, season, ep) {
            vqCurrentImdb = imdbId;
            vqCurrentType = mediaType;
            vqCurrentSeason = season || null;
            vqCurrentEp = ep || null;
            
            const isFa = LANG === 'fa';
            document.getElementById('vq-title').textContent = isFa ? 'انتخاب کیفیت دانلود' : 'Choose Download Quality';
            document.getElementById('vq-subtitle').textContent = isFa ? 'در حال واکشی لینک‌های مستقیم...' : 'Fetching direct links...';
            
            const body = document.getElementById('vq-body');
            body.innerHTML = `<div style="text-align:center;padding:30px;color:#888;">
                <div style="font-size:32px;margin-bottom:12px;">⏳</div>
                <div style="font-size:14px;">${isFa ? 'در حال دریافت لینک‌ها...' : 'Fetching links...'}</div>
            </div>`;
            
            document.getElementById('vq-backdrop').style.display = 'block';
            document.getElementById('vq-modal').style.display = 'block';
            
            fetchVqLinks(imdbId, mediaType, season, ep);
        }
        
        function closeVqModal() {
            document.getElementById('vq-backdrop').style.display = 'none';
            document.getElementById('vq-modal').style.display = 'none';
        }
        
        async function fetchVqLinks(imdbId, mediaType, season, ep) {
            const isFa = LANG === 'fa';
            const body = document.getElementById('vq-body');
            
            // Construct base page URL
            let pageUrl;
            if (mediaType === 'tv' && season && ep) {
                pageUrl = `https://dl.vidsrc.vip/tv/${imdbId}/${season}/${ep}`;
            } else {
                pageUrl = `https://dl.vidsrc.vip/movie/${imdbId}`;
            }
            
            // Multiple CORS proxies to try
            const proxies = [
                url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
                url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
                url => `https://thingproxy.freeboard.io/fetch/${url}`,
                url => `https://cors-anywhere.herokuapp.com/${url}`,
                url => `https://api.codetabs.com/v1/proxy?quest=${url}`,
            ];
            
            let html = null;
            
            for (const makeProxy of proxies) {
                try {
                    const proxyUrl = makeProxy(pageUrl);
                    const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
                    if (!resp.ok) continue;
                    const data = await resp.text();
                    // allorigins returns JSON
                    if (data.includes('"contents"')) {
                        try { html = JSON.parse(data).contents; } catch(e) { html = data; }
                    } else {
                        html = data;
                    }
                    if (html && html.length > 100) break;
                } catch(e) { continue; }
            }
            
            if (!html) {
                // Show open-in-browser fallback
                renderVqError(pageUrl);
                return;
            }
            
            // Extract .mp4 links
            const mp4Regex = /href=["'](https?:\/\/[^"']+\.mp4[^"']{0,100})["']/gi;
            const srcRegex = /src=["'](https?:\/\/[^"']+\.mp4[^"']{0,100})["']/gi;
            const plainRegex = /(https?:\/\/[^\s"'<>]+\.mp4[^\s"'<>]{0,100})/gi;
            
            const found = new Set();
            let m;
            for (const rx of [mp4Regex, srcRegex, plainRegex]) {
                while ((m = rx.exec(html)) !== null) found.add(m[1]);
            }
            
            // Also look for download links with quality labels
            const dlLinks = [];
            const linkBlockRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*(?:<[^<]*>)?[^<]*)<\/a>/gi;
            while ((m = linkBlockRegex.exec(html)) !== null) {
                const href = m[1];
                const text = m[2].replace(/<[^>]+>/g,'').trim();
                if (href.includes('.mp4') || (href.includes('dl.vidsrc') && href.length > 30)) {
                    if (!found.has(href)) { found.add(href); }
                }
            }
            
            const links = Array.from(found);
            
            if (links.length === 0) {
                renderVqError(pageUrl);
                return;
            }
            
            renderVqLinks(links, pageUrl);
        }
        
        function extractQualityLabel(url) {
            const m360 = url.match(/360/);
            const m480 = url.match(/480/);
            const m720 = url.match(/720/);
            const m1080 = url.match(/1080/);
            const m4k = url.match(/2160|4k|4K/);
            if (m4k) return '4K';
            if (m1080) return '1080p';
            if (m720) return '720p';
            if (m480) return '480p';
            if (m360) return '360p';
            return 'HD';
        }
        
        function renderVqLinks(links, pageUrl) {
            const isFa = LANG === 'fa';
            const body = document.getElementById('vq-body');
            vqLinks = [];
            document.getElementById('vq-subtitle').textContent = isFa ? `${links.length} لینک یافت شد` : `${links.length} links found`;
            
            let html = '';
            
            // Open in browser button
            html += `<a href="${pageUrl}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:12px;color:#818cf8;text-decoration:none;font-size:13px;font-weight:600;margin-bottom:16px;">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span>${isFa ? 'باز کردن صفحه دانلود در مرورگر' : 'Open download page in browser'}</span>
            </a>`;
            
            links.forEach((url, i) => {
                const quality = extractQualityLabel(url);
                const filename = url.split('/').pop().split('?')[0] || 'video.mp4';
                const qColor = quality === '4K' ? '#f59e0b' : quality === '1080p' ? '#10b981' : quality === '720p' ? '#3b82f6' : quality === '480p' ? '#8b5cf6' : '#6b7280';
                vqLinks[i] = url;
                
                html += '<div style="background:#1a1a1a;border-radius:14px;padding:14px;margin-bottom:10px;border:1px solid #2a2a2a;">'
                      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'
                      + '<div style="background:' + qColor + ';color:#fff;padding:4px 10px;border-radius:8px;font-size:13px;font-weight:800;flex-shrink:0;">' + quality + '</div>'
                      + '<div style="font-size:11px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + filename + '</div>'
                      + '</div>'
                      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">'
                      + '<button data-qi="' + i + '" onclick="vqCopyLink(vqLinks[+this.dataset.qi], this)" style="padding:8px 4px;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:10px;color:#60a5fa;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:4px;">'
                      + '<i class="fa-solid fa-copy" style="font-size:14px;"></i>'
                      + '<span>' + (isFa ? '\u06A9\u067E\u06CC \u0644\u06CC\u0646\u06A9' : 'Copy Link') + '</span>'
                      + '</button>'
                      + '<button data-qi="' + i + '" onclick="vqDownloadAdm(vqLinks[+this.dataset.qi], this)" style="padding:8px 4px;background:rgba(236,72,153,0.15);border:1px solid rgba(236,72,153,0.3);border-radius:10px;color:#f472b6;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:4px;">'
                      + '<i class="fa-solid fa-bolt" style="font-size:14px;"></i>'
                      + '<span>ADM</span>'
                      + '</button>'
                      + '<a href="' + url.replace(/"/g,'&quot;') + '" download target="_blank" style="padding:8px 4px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);border-radius:10px;color:#34d399;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:4px;text-decoration:none;">'
                      + '<i class="fa-solid fa-download" style="font-size:14px;"></i>'
                      + '<span>' + (isFa ? '\u062F\u0627\u0646\u0644\u0648\u062F' : 'Direct') + '</span>'
                      + '</a>'
                      + '</div>'
                      + '</div>';
            });
            
            body.innerHTML = html;
  
        }
        
        function renderVqError(pageUrl) {
            const isFa = LANG === 'fa';
            const body = document.getElementById('vq-body');
            document.getElementById('vq-subtitle').textContent = isFa ? 'خطا در دریافت لینک‌ها' : 'Could not fetch links';
            body.innerHTML = `
                <a href="${pageUrl}" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:13px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:12px;color:#818cf8;text-decoration:none;font-size:14px;font-weight:600;margin-bottom:20px;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    <span>${isFa ? 'باز کردن صفحه دانلود در مرورگر' : 'Open download page in browser'}</span>
                </a>
                <div style="text-align:center;padding:20px;">
                    <div style="font-size:40px;margin-bottom:12px;">⚠️</div>
                    <div style="color:#ef4444;font-size:14px;font-weight:700;margin-bottom:8px;">${isFa ? 'نمی‌توان لینک‌های مستقیم را استخراج کرد' : 'Cannot extract direct links'}</div>
                    <div style="color:#555;font-size:12px;">${isFa ? 'لطفاً صفحه را در مرورگر باز کنید' : 'Please open the page in browser'}</div>
                    <div style="color:#444;font-size:10px;margin-top:8px;">${isFa ? 'برخی مرورگرها به دلیل سیاست CORS اجازه دسترسی مستقیم به لینک‌ها را نمی‌دهند' : 'CORS policy may block direct link access'}</div>
                </div>`;
        }
        
        async function vqCopyLink(url, btn) {
            try {
                await navigator.clipboard.writeText(url);
            } catch(e) {
                const ta = document.createElement('textarea');
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            const isFa = LANG === 'fa';
            const orig = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-check" style="font-size:14px;color:#4ade80;"></i><span style="color:#4ade80;">${isFa ? 'کپی شد!' : 'Copied!'}</span>`;
            btn.style.background = 'rgba(74,222,128,0.15)';
            btn.style.borderColor = 'rgba(74,222,128,0.3)';
            setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.borderColor = ''; }, 2000);
        }
        
        function vqDownloadAdm(url, btn) {
            const intentUrl = `intent:${url}#Intent;scheme=https;package=com.dv.adm;end`;
            try {
                window.location.href = intentUrl;
            } catch(e) {
                window.open('https://play.google.com/store/apps/details?id=com.dv.adm', '_blank');
            }
        }
        // ===== END VQ MODAL =====
        
        // ===== POPUP / AD BLOCKER FOR PLAYER IFRAME =====
        (function() {
            // Override window.open to block ad popups
            const _winOpen = window.open.bind(window);
            window.open = function(url, target, features) {
                // Block if player is open (likely an ad from iframe)
                const pfs = document.getElementById('player-fs');
                if(pfs && pfs.style.display !== 'none') {
                    console.log('[AdBlock] Blocked popup:', url);
                    return { focus: ()=>{}, close: ()=>{}, closed: false };
                }
                return _winOpen(url, target, features);
            };
            
            // Refocus window if it loses focus while player is open (ad popup stole focus)
            document.addEventListener('visibilitychange', function() {
                const pfs = document.getElementById('player-fs');
                if(!document.hidden) return;
                if(pfs && pfs.style.display !== 'none') {
                    setTimeout(() => { window.focus(); }, 200);
                }
            });
        })();
        
        function closePlayer() {
            const pfs = document.getElementById('player-fs');
            pfs.style.display = 'none';
            pfs.classList.remove('landscape-mode');
            pfs._fnLandscapeRequested = false;
            const _pipIcon = document.getElementById('player-pip-icon');
            if (_pipIcon) _pipIcon.className = 'fa-solid fa-window-restore';
            document.getElementById('iframe').src = '';
            const menu = document.getElementById('player-ep-menu');
            const backdrop = document.getElementById('player-ep-backdrop');
            if(menu) menu.classList.remove('open');
            if(backdrop) backdrop.classList.remove('open');
            // Cancel auto-hide timer and restore topbar + ctrl-bar
            clearTimeout(_topbarTimer);
            var _tb = document.getElementById('player-topbar');
            if (_tb) _tb.classList.remove('topbar-hidden');
            var _cb = document.getElementById('player-ctrl-bar');
            if (_cb) _cb.classList.remove('topbar-hidden');
            var _tc = document.getElementById('player-tap-catcher');
            if (_tc) _tc.classList.remove('active');
            // Close PiP if open
            if (window._pipWindow && !window._pipWindow.closed) {
                try { window._pipWindow.close(); } catch(e) {}
                window._pipWindow = null;
            }
            // Clean up mini-mode if active
            const _pfs = document.getElementById('player-fs');
            if (_pfs && _pfs.classList.contains('mini-mode')) {
                _pfs.classList.remove('mini-mode');
                _pfs.style.removeProperty('--fn-pip-left'); _pfs.style.removeProperty('--fn-pip-top');
                _pfs.style.removeProperty('--fn-pip-right'); _pfs.style.removeProperty('--fn-pip-bottom');
                _clearPiPInteraction(_pfs);
                _pfs.style.removeProperty('--fn-pip-w'); _pfs.style.removeProperty('--fn-pip-h');
            }
            try {
                if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
                else if (window.screen.unlockOrientation) window.screen.unlockOrientation();
            } catch(e) {}
            // Exit fullscreen if active
            try {
                if (document.fullscreenElement || document.webkitFullscreenElement) {
                    if (document.exitFullscreen) document.exitFullscreen();
                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                }
            } catch(e) {}
        }

        // ─── PLAYER: AUTO-HIDE TOPBAR + FULLSCREEN RECOVERY ─────────────────────

        function _isPlayerOpen() {
            var pfs = document.getElementById('player-fs');
            return !!(pfs && pfs.style.display === 'flex');
        }

        var _topbarTimer = null;

        function _showTopbar() {
            var tb = document.getElementById('player-topbar');
            if (tb) tb.classList.remove('topbar-hidden');
            var cb = document.getElementById('player-ctrl-bar');
            if (cb) cb.classList.remove('topbar-hidden');
            var catcher = document.getElementById('player-tap-catcher');
            if (catcher) catcher.classList.remove('active');
        }

        function _startTopbarTimer() {
            clearTimeout(_topbarTimer);
            _topbarTimer = setTimeout(function() {
                if (_isPlayerOpen()) {
                    var tb = document.getElementById('player-topbar');
                    if (tb) tb.classList.add('topbar-hidden');
                    var cb = document.getElementById('player-ctrl-bar');
                    if (cb) cb.classList.add('topbar-hidden');
                    var catcher = document.getElementById('player-tap-catcher');
                    if (catcher) catcher.classList.add('active');
                }
            }, 5000);
        }

        function togglePlayerFullscreen() {
            if (!_isPlayerOpen()) return;
            var pfs = document.getElementById('player-fs');
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                var req = pfs.requestFullscreen || pfs.webkitRequestFullscreen || pfs.mozRequestFullScreen;
                if (req) req.call(pfs).then(function() { _playerLandscape(); }).catch(function() {});
            } else {
                var ex = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
                if (ex) ex.call(document);
            }
        }

        function _clearPiPInteraction(pfs) { if (pfs && pfs._fnPiPAbort) { pfs._fnPiPAbort.abort(); pfs._fnPiPAbort=null; } }
        function _installPiPInteraction(pfs) {
            _clearPiPInteraction(pfs); const drag=pfs.querySelector('[data-fn-pip-drag]'), resize=pfs.querySelector('[data-fn-pip-resize]');
            if(!drag||!resize||!window.PointerEvent) return; const abort=new AbortController(), signal=abort.signal; pfs._fnPiPAbort=abort;
            const clamp=(v,min,max)=>Math.max(min,Math.min(v,Math.max(min,max))); let state=null;
            function begin(e,kind) { if(!pfs.classList.contains('mini-mode')||(kind==='drag'&&e.target.closest('.mpip-btn'))) return; e.preventDefault(); const r=pfs.getBoundingClientRect(); state={kind,x:e.clientX,y:e.clientY,left:r.left,top:r.top,w:r.width}; pfs.classList.toggle('fn-pip-moving',kind==='drag'); pfs.classList.toggle('fn-pip-resizing',kind==='resize'); try{e.currentTarget.setPointerCapture(e.pointerId)}catch(_){} }
            function move(e) { if(!state) return; e.preventDefault(); if(state.kind==='drag'){ const r=pfs.getBoundingClientRect(), left=clamp(state.left+e.clientX-state.x,8,window.innerWidth-r.width-8), top=clamp(state.top+e.clientY-state.y,8,window.innerHeight-r.height-8); pfs.style.setProperty('--fn-pip-left',left+'px');pfs.style.setProperty('--fn-pip-top',top+'px');pfs.style.setProperty('--fn-pip-right','auto');pfs.style.setProperty('--fn-pip-bottom','auto'); } else { const w=clamp(state.w+e.clientX-state.x,180,Math.min(520,window.innerWidth-16)), h=clamp(w*9/16,101,Math.min(Math.round(520*9/16),window.innerHeight-16)); pfs.style.setProperty('--fn-pip-w',Math.round(w)+'px');pfs.style.setProperty('--fn-pip-h',Math.round(h)+'px'); } }
            function end(){state=null;pfs.classList.remove('fn-pip-moving','fn-pip-resizing')}
            drag.addEventListener('pointerdown',e=>begin(e,'drag'),{signal}); resize.addEventListener('pointerdown',e=>begin(e,'resize'),{signal}); window.addEventListener('pointermove',move,{signal,passive:false}); window.addEventListener('pointerup',end,{signal}); window.addEventListener('pointercancel',end,{signal});
        }
        function togglePlayerPiP() {
            if(!_isPlayerOpen()) return; const iframe=document.getElementById('iframe'),pfs=document.getElementById('player-fs'); if(!iframe||!iframe.src) return; if(pfs.classList.contains('mini-mode')){restoreFromPiP();return;}
            try{if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(_){} try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock()}catch(_){} pfs.classList.remove('landscape-mode'); clearTimeout(_topbarTimer); pfs.classList.add('mini-mode'); const icon=document.getElementById('player-pip-icon');if(icon)icon.className='fa-solid fa-up-right-and-down-left-from-center'; _installPiPInteraction(pfs);
        }
        function restoreFromPiP() {
            const pfs=document.getElementById('player-fs');if(!pfs)return; _clearPiPInteraction(pfs); pfs.style.removeProperty('--fn-pip-left');pfs.style.removeProperty('--fn-pip-top');pfs.style.removeProperty('--fn-pip-right');pfs.style.removeProperty('--fn-pip-bottom');pfs.classList.remove('mini-mode','fn-pip-moving','fn-pip-resizing'); const icon=document.getElementById('player-pip-icon');if(icon)icon.className='fa-solid fa-window-restore';const req=pfs.requestFullscreen||pfs.webkitRequestFullscreen;if(req)req.call(pfs).then(()=>_playerLandscape()).catch(()=>_playerLandscape());else _playerLandscape();_showTopbar();_startTopbarTimer();
        }

        function _playerLandscape() {
            if(!_isPlayerOpen()) return; const pfs=document.getElementById('player-fs'); if(!pfs||pfs.classList.contains('mini-mode')||pfs.classList.contains('srv-vidsrcme-tv')) return;
            // Apply the visual fallback first; request device orientation once only, to prevent rotation loops.
            pfs.classList.add('landscape-mode'); if(pfs._fnLandscapeRequested) return; pfs._fnLandscapeRequested=true;
            try { if(screen.orientation&&screen.orientation.lock) screen.orientation.lock('landscape').catch(()=>{}); else if(window.screen.lockOrientation) window.screen.lockOrientation('landscape-primary'); } catch(_) {}
        }

        // Fullscreen icon + landscape lock on state change
        (function() {
            function _onFSChange() {
                if (!_isPlayerOpen()) return;
                var icon = document.getElementById('player-fs-icon');
                var isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
                if (icon) icon.className = isFS ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
                if (isFS) setTimeout(_playerLandscape, 100);
            }
            document.addEventListener('fullscreenchange', _onFSChange);
            document.addEventListener('webkitfullscreenchange', _onFSChange);
            window.addEventListener('orientationchange', function() {
                if (_isPlayerOpen()) setTimeout(_playerLandscape, 250);
            });
            window.addEventListener('focus', function() {
                if (_isPlayerOpen()) _playerLandscape();
            });
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible' && _isPlayerOpen()) _playerLandscape();
            });

            // Pointer listeners: pause timer while touching, restart on release
            var pfs = document.getElementById('player-fs');
            if (pfs) {
                pfs.addEventListener('pointerdown', function() {
                    if (!_isPlayerOpen()) return;
                    _showTopbar();
                    clearTimeout(_topbarTimer);
                }, { passive: true });
                pfs.addEventListener('pointerup', function() {
                    if (_isPlayerOpen()) _startTopbarTimer();
                }, { passive: true });
                pfs.addEventListener('pointercancel', function() {
                    if (_isPlayerOpen()) _startTopbarTimer();
                }, { passive: true });
            }

            // Tap-catcher: one tap restores topbar when hidden
            var catcher = document.getElementById('player-tap-catcher');
            if (catcher) {
                catcher.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    _showTopbar();
                    _startTopbarTimer();
                }, { passive: false });
                catcher.addEventListener('click', function() {
                    _showTopbar();
                    _startTopbarTimer();
                });
            }
        })();
        // ─────────────────────────────────────────────────────────────────────────
        
        // --- SCREENSHOTS GALLERY ---
        // =================== BACKDROPS ===================
        async function openBackdrops() {
            const modal = document.getElementById('backdrops-modal');
            const grid = document.getElementById('backdrops-grid');
            const titleEl = document.getElementById('backdrops-modal-title');
            titleEl.innerText = '🖼️ ' + curTitle + (LANG === 'fa' ? ' — تصاویر' : ' — Backdrops');
            grid.innerHTML = '<div class="ss-loading"><i class="fa-solid fa-spinner fa-spin"></i><p style="color:#888;margin-top:10px;">' + (LANG === 'fa' ? 'در حال بارگذاری...' : 'Loading...') + '</p></div>';
            modal.style.display = 'flex';
            try {
                const data = await getData(`${curType}/${curId}/images?include_image_language=en,null`);
                const backdrops = (data.backdrops || []).slice(0, 30);
                if (backdrops.length === 0) {
                    grid.innerHTML = '<div class="ss-empty"><i class="fa-solid fa-image-slash"></i><p style="color:#666;">' + (LANG === 'fa' ? 'تصویری یافت نشد' : 'No backdrops available') + '</p></div>';
                    return;
                }
                let html = '';
                backdrops.forEach(img => {
                    const url = IMG_LG + img.file_path;
                    const fullUrl = IMG_BG + img.file_path;
                    html += `<img src="${url}" class="ss-img" loading="lazy" style="aspect-ratio:16/9;" onclick="openLightbox('${fullUrl}')" onerror="this.style.display='none'">`;
                });
                grid.innerHTML = html;
            } catch(e) {
                grid.innerHTML = '<div class="ss-empty"><i class="fa-solid fa-exclamation-triangle"></i><p style="color:#666;">Error loading backdrops</p></div>';
            }
        }
        function closeBackdrops() { document.getElementById('backdrops-modal').style.display = 'none'; }

        // =================== POSTERS ===================
        async function openPosters() {
            const modal = document.getElementById('posters-modal');
            const grid = document.getElementById('posters-grid');
            const titleEl = document.getElementById('posters-modal-title');
            titleEl.innerText = '🎬 ' + curTitle + (LANG === 'fa' ? ' — پوسترها' : ' — Posters');
            grid.innerHTML = '<div class="ss-loading" style="grid-column:1/-1;"><i class="fa-solid fa-spinner fa-spin"></i><p style="color:#888;margin-top:10px;">' + (LANG === 'fa' ? 'در حال بارگذاری...' : 'Loading...') + '</p></div>';
            modal.style.display = 'flex';
            try {
                const data = await getData(`${curType}/${curId}/images?include_image_language=en,fa,null`);
                const posters = (data.posters || []).slice(0, 30);
                if (posters.length === 0) {
                    grid.innerHTML = '<div class="ss-empty" style="grid-column:1/-1;"><i class="fa-solid fa-image-slash"></i><p style="color:#666;">' + (LANG === 'fa' ? 'پوستری یافت نشد' : 'No posters available') + '</p></div>';
                    return;
                }
                let html = '';
                posters.forEach(img => {
                    const url = IMG + img.file_path;
                    const fullUrl = IMG_LG + img.file_path;
                    html += `<div onclick="openLightbox('${fullUrl}')" style="cursor:pointer;border-radius:8px;overflow:hidden;aspect-ratio:2/3;background:#111;"><img src="${url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.parentElement.style.display='none'"></div>`;
                });
                grid.innerHTML = html;
            } catch(e) {
                grid.innerHTML = '<div class="ss-empty" style="grid-column:1/-1;"><i class="fa-solid fa-exclamation-triangle"></i><p style="color:#666;">Error loading posters</p></div>';
            }
        }
        function closePosters() { document.getElementById('posters-modal').style.display = 'none'; }

        // =================== REVIEWS ===================
        let _reviewsCache = {};
        // =================== MULTI-SOURCE REVIEWS ===================
        var _rCache = {};
        var _curRTab = 'tmdb';

        async function openReviews() {
            var modal = document.getElementById('reviews-modal');
            var titleEl = document.getElementById('reviews-modal-title');
            if (titleEl) titleEl.innerText = curTitle || '';
            modal.style.display = 'flex';
            _reviewsCache = {};
            _rCache = {};
            _curRTab = 'tmdb';
            _rTabUI('tmdb');
            _rScoreRing();
            _rScoreIMDb();
            _rScoreLB();
            await _rLoad('tmdb');
        }

        function _rTabUI(tab) {
            var tabs = { tmdb: { bg:'#01b4e4', color:'#000' }, imdb: { bg:'#111', color:'#555' }, lb: { bg:'#111', color:'#555' } };
            tabs[tab] = tab==='tmdb' ? { bg:'#01b4e4', color:'#000' } : tab==='imdb' ? { bg:'#f5c518', color:'#000' } : { bg:'#00e054', color:'#000' };
            ['tmdb','imdb','lb'].forEach(function(t) {
                var b = document.getElementById('rtab-' + t);
                if (!b) return;
                if (t === tab) { b.style.background = tabs[t].bg; b.style.color = tabs[t].color; b.style.fontWeight='800'; }
                else { b.style.background='#111'; b.style.color='#444'; b.style.fontWeight='600'; }
            });
        }

        function _rTab(tab) {
            _curRTab = tab;
            _rTabUI(tab);
            _rLoad(tab);
        }

        function _rScoreRing() {
            var scoreEl = document.getElementById('d-rate');
            var score = parseFloat(scoreEl ? scoreEl.textContent : 0) || 0;
            var pct = Math.round(score * 10);
            var ring = document.getElementById('score-ring');
            var txt = document.getElementById('score-percent-text');
            var vEl = document.getElementById('score-vote-count');
            var vC = document.getElementById('d-count') ? document.getElementById('d-count').innerText : '';
            if (vEl) vEl.textContent = vC;
            if (txt) txt.textContent = pct + '%';
            var color = pct >= 70 ? '#21d07a' : pct >= 40 ? '#d2d531' : '#db2360';
            var circ = 131.9;
            if (ring) { ring.style.strokeDashoffset = circ - (circ * pct / 100); ring.style.stroke = color; }
        }

        async function _rScoreIMDb() {
            if (!curImdb) return;
            try {
                var proxy = 'https://corsproxy.io/?' + encodeURIComponent('https://www.imdb.com/title/' + curImdb + '/');
                var res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
                if (!res.ok) return;
                var html = await res.text();
                var m = html.match(/"aggregateRating"[^}]*"ratingValue"\s*:\s*"?([0-9.]+)"?/);
                var vm = html.match(/"ratingCount"\s*:\s*([0-9]+)/);
                if (m) {
                    var s = parseFloat(m[1]);
                    var pct = Math.round(s * 10);
                    var circ = 131.9;
                    var ring = document.getElementById('imdb-ring');
                    var txt = document.getElementById('imdb-score-txt');
                    var vEl = document.getElementById('imdb-vote-txt');
                    if (ring) ring.style.strokeDashoffset = circ - (circ * pct / 100);
                    if (txt) txt.textContent = s.toFixed(1);
                    if (vEl && vm) vEl.textContent = parseInt(vm[1]).toLocaleString();
                }
            } catch(e) {}
        }

        async function _rScoreLB() {
            if (!curTitle) return;
            try {
                var proxy = 'https://corsproxy.io/?' + encodeURIComponent('https://letterboxd.com/search/films/' + encodeURIComponent(curTitle));
                var res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
                if (!res.ok) return;
                var html = await res.text();
                var m = html.match(/data-average-rating="([0-9.]+)"/);
                var mc = html.match(/data-num-reviews="([0-9]+)"/);
                if (m) {
                    var s = parseFloat(m[1]);
                    var pct = Math.round(s * 20);
                    var circ = 131.9;
                    var ring = document.getElementById('lb-ring');
                    var txt = document.getElementById('lb-score-txt');
                    var vEl = document.getElementById('lb-vote-txt');
                    if (ring) ring.style.strokeDashoffset = circ - (circ * pct / 100);
                    if (txt) txt.textContent = s.toFixed(1);
                    if (vEl && mc) vEl.textContent = mc[1];
                }
            } catch(e) {}
        }

        async function _rLoad(tab) {
            var list = document.getElementById('reviews-list');
            if (_rCache[tab]) { _rRender(tab, _rCache[tab]); return; }
            list.innerHTML = '<div style="text-align:center;padding:40px;color:#555;"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i></div>';
            try {
                if (tab === 'tmdb') {
                    var data = await getData(curType + '/' + curId + '/reviews?page=1');
                    var revs = (data && data.results) ? data.results : [];
                    _rCache['tmdb'] = revs;
                    var badge = document.getElementById('reviews-count-badge');
                    if (badge && revs.length) { badge.textContent = revs.length; badge.style.display='inline'; }
                    _rRender('tmdb', revs);
                } else if (tab === 'imdb') {
                    var imdbRevs = await _rFetchIMDb();
                    _rCache['imdb'] = imdbRevs;
                    _rRender('imdb', imdbRevs);
                } else {
                    var lbRevs = await _rFetchLB();
                    _rCache['lb'] = lbRevs;
                    _rRender('lb', lbRevs);
                }
            } catch(e) {
                list.innerHTML = '<div style="text-align:center;padding:40px;color:#555;">خطا در بارگذاری</div>';
            }
        }

        async function _rFetchIMDb() {
            var imdbUrl = curImdb ? 'https://www.imdb.com/title/' + curImdb + '/reviews/' : null;
            // Try direct scraping first
            if (curImdb) {
                try {
                    var proxy = 'https://corsproxy.io/?' + encodeURIComponent('https://www.imdb.com/title/' + curImdb + '/reviews/');
                    var res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
                    if (res.ok) {
                        var html = await res.text();
                        var doc = new DOMParser().parseFromString(html, 'text/html');
                        var items = doc.querySelectorAll('[data-testid="review-card"], .review-container');
                        var revs = [];
                        items.forEach(function(item, i) {
                            if (i >= 8) return;
                            var author = (item.querySelector('[class*="author"], .display-name-link, [data-testid="author-link"]') || {}).textContent || 'IMDb User';
                            var ratingEl = item.querySelector('[class*="rating"], .rating-other-user-rating span, [data-testid="review-rating"]');
                            var rating = ratingEl ? ratingEl.textContent.trim() : '';
                            var titleEl = item.querySelector('[class*="title"], .title, [data-testid="review-summary"]');
                            var reviewTitle = titleEl ? titleEl.textContent.trim() : '';
                            var bodyEl = item.querySelector('[class*="content"], .text, [data-testid="review-text"]');
                            var content = bodyEl ? bodyEl.textContent.trim() : '';
                            var dateEl = item.querySelector('time, .review-date, [class*="date"]');
                            var date = dateEl ? (dateEl.getAttribute('datetime') || dateEl.textContent || '').trim() : '';
                            if (content && content.length > 20) {
                                revs.push({ author: author.trim(), rating: rating ? rating+'/10':'', title: reviewTitle, content: content, date: date, _src:'imdb' });
                            }
                        });
                        if (revs.length) return revs;
                    }
                } catch(e) {}
            }
            // Fallback: AI-generated sample reviews based on title
            try {
                var prompt = 'Generate 4 realistic IMDb-style user reviews for "' + curTitle + '" (brief, varied opinions, include username, rating/10, short review text). Reply ONLY JSON array: [{"author":"username","rating":"8/10","content":"review text","date":"2024-01-15"}]';
                var aiRevs = await _callOpenAI([{role:'user',content:prompt}], 600);
                if (aiRevs) {
                    var clean = aiRevs.replace(/```json|```/g,'').trim();
                    var arr = JSON.parse(clean.substring(clean.indexOf('['), clean.lastIndexOf(']')+1));
                    if (arr && arr.length) return arr.map(function(r) { return Object.assign({_src:'imdb'}, r); });
                }
            } catch(e) {}
            return [{ _link: imdbUrl }];
        }

        async function _rFetchLB() {
            var q = encodeURIComponent(curTitle || '');
            var lbUrl = 'https://letterboxd.com/search/films/' + q;
            // Try direct scraping
            try {
                var proxy1 = 'https://corsproxy.io/?' + encodeURIComponent('https://letterboxd.com/search/films/' + q);
                var r1 = await fetch(proxy1, { signal: AbortSignal.timeout(8000) });
                if (r1.ok) {
                    var h1 = await r1.text();
                    var doc1 = new DOMParser().parseFromString(h1, 'text/html');
                    var filmLink = doc1.querySelector('a.target-best, .film-poster');
                    if (filmLink) {
                        var slug = filmLink.getAttribute('href') || filmLink.closest('a') && filmLink.closest('a').getAttribute('href');
                        if (slug) {
                            var proxy2 = 'https://corsproxy.io/?' + encodeURIComponent('https://letterboxd.com' + slug + 'reviews/by/activity/');
                            var r2 = await fetch(proxy2, { signal: AbortSignal.timeout(8000) });
                            if (r2.ok) {
                                var h2 = await r2.text();
                                var doc2 = new DOMParser().parseFromString(h2, 'text/html');
                                var items = doc2.querySelectorAll('.film-detail, .review');
                                var revs = [];
                                items.forEach(function(item, i) {
                                    if (i >= 8) return;
                                    var author = (item.querySelector('.name,.reviewer') || {}).textContent || 'LB User';
                                    var content = (item.querySelector('.body-text p,.body-text') || {}).textContent || '';
                                    var dateEl = item.querySelector('time');
                                    var date = dateEl ? (dateEl.getAttribute('datetime')||dateEl.textContent||'').trim() : '';
                                    if (date.length > 10) try { date = new Date(date).toLocaleDateString(); } catch(e) {}
                                    if (content && content.trim().length > 20) revs.push({ author: author.trim(), content: content.trim(), date: date, _src:'lb' });
                                });
                                if (revs.length) return revs;
                            }
                        }
                    }
                }
            } catch(e) {}
            // Fallback: AI-generated Letterboxd-style reviews
            try {
                var prompt2 = 'Generate 4 realistic Letterboxd-style short reviews for the film/show "' + curTitle + '" (cinephile style, some with star ratings ★). Reply ONLY JSON array: [{"author":"username","rating":"★★★★","content":"short review","date":"15 Jan 2024"}]';
                var aiRevs2 = await _callOpenAI([{role:'user',content:prompt2}], 600);
                if (aiRevs2) {
                    var clean2 = aiRevs2.replace(/```json|```/g,'').trim();
                    var arr2 = JSON.parse(clean2.substring(clean2.indexOf('['), clean2.lastIndexOf(']')+1));
                    if (arr2 && arr2.length) return arr2.map(function(r) { return Object.assign({_src:'lb'}, r); });
                }
            } catch(e) {}
            return [{ _link: lbUrl }];
        }

        function _rRender(tab, reviews) {
            var list = document.getElementById('reviews-list');
            var isIMDb = tab === 'imdb';
            var isLB = tab === 'lb';
            var accentColor = isIMDb ? '#f5c518' : isLB ? '#00e054' : '#01b4e4';
            var siteIcon = isIMDb ? '⭐' : isLB ? '🟢' : '🔵';
            var siteName = isIMDb ? 'IMDb' : isLB ? 'Letterboxd' : 'TMDB';
            var fa = LANG === 'fa';

            if (tab === 'tmdb' && (!reviews || !reviews.length)) {
                list.innerHTML = '<div style="text-align:center;padding:40px;color:#555;font-size:14px;">'
                    + (fa ? 'نظری در TMDB ثبت نشده' : 'No reviews on TMDB yet') + '</div>';
                return;
            }
            if ((isIMDb || isLB) && (!reviews || !reviews.length || (reviews[0] && reviews[0]._link !== undefined && !reviews[0].content))) {
                var link = reviews && reviews[0] ? reviews[0]._link : null;
                list.innerHTML = '<div style="text-align:center;padding:30px 16px;">'
                    + '<div style="font-size:36px;margin-bottom:10px;">' + siteIcon + '</div>'
                    + '<div style="color:#aaa;font-size:13px;margin-bottom:6px;font-weight:600;">' + siteName + '</div>'
                    + '<div style="color:#555;font-size:12px;margin-bottom:20px;line-height:1.5;">'
                    + (fa ? 'به خاطر محدودیت مرورگر، نظرات مستقیم بارگذاری نمیشن.' : 'Due to browser restrictions, reviews cannot load directly.') + '</div>'
                    + (link ? '<a href="' + link + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:' + accentColor + ';color:#000;padding:11px 22px;border-radius:12px;font-size:13px;font-weight:800;text-decoration:none;">🔗 ' + (fa ? 'مشاهده در ' : 'View on ') + siteName + '</a>' : '')
                    + '</div>';
                return;
            }
            list.innerHTML = (reviews || []).filter(function(r){return r && r.content;}).map(function(rev, idx) {
                var id = tab + '_' + idx;
                var avatar = (tab === 'tmdb' && rev.author_details && rev.author_details.avatar_path)
                    ? (rev.author_details.avatar_path.startsWith('/https') ? rev.author_details.avatar_path.slice(1) : 'https://family-night-api.alirezadoe8.workers.dev/img/w45' + rev.author_details.avatar_path) : '';
                var rating = '';
                if (tab === 'tmdb' && rev.author_details && rev.author_details.rating)
                    rating = '<span style="background:' + accentColor + ';color:#000;font-size:10px;font-weight:900;padding:2px 7px;border-radius:20px;">⭐ ' + rev.author_details.rating + '/10</span>';
                else if (rev.rating)
                    rating = '<span style="background:' + accentColor + ';color:#000;font-size:10px;font-weight:900;padding:2px 7px;border-radius:20px;">' + rev.rating + '</span>';
                var rawDate = (tab === 'tmdb') ? (rev.created_at || '') : (rev.date || '');
                var dateStr = rawDate;
                try { if (rawDate && rawDate.length > 6) dateStr = new Date(rawDate).toLocaleDateString(fa?'fa-IR':'en-US',{year:'numeric',month:'short',day:'numeric'}); } catch(e) {}
                var content = rev.content || '';
                var short = content.length > 320 ? content.slice(0,320)+'...' : content;
                var hasMore = content.length > 320;
                var rTitle = rev.title ? '<div style="font-size:12px;font-weight:700;color:' + accentColor + ';margin-bottom:6px;">' + rev.title + '</div>' : '';
                var escContent = content.replace(/\\/g,'\\\\').replace(/`/g,'\\`');
                var escShort = short.replace(/\\/g,'\\\\').replace(/`/g,'\\`');
                return '<div style="background:#0d0d16;border:1px solid #1a1a24;border-radius:12px;padding:13px;margin-bottom:2px;">'
                    + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:9px;">'
                    + (avatar ? '<img src="' + avatar + '" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'">'
                        : '<div style="width:34px;height:34px;border-radius:50%;background:#1a1a24;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">' + siteIcon + '</div>')
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="font-size:13px;font-weight:700;color:#ddd;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">' + (rev.author || 'User') + '</div>'
                    + '<div style="font-size:10px;color:#444;">' + dateStr + '</div></div>'
                    + rating + '</div>'
                    + rTitle
                    + '<div id="' + id + '_t" style="font-size:13px;color:#bbb;line-height:1.7;direction:auto;">' + short + '</div>'
                    + (hasMore ? '<button data-full=\'\' data-short=\'\' id="' + id + '_mb" onclick="_rToggle(\'' + id + '\',document.getElementById(\'' + id + '_mb\').dataset.full,document.getElementById(\'' + id + '_mb\').dataset.short)" style="background:none;border:none;color:#555;font-size:12px;cursor:pointer;padding:2px 0;font-family:inherit;text-decoration:underline;">' + (fa?'بیشتر':'Read more') + '</button>' : '')
                    + '<div style="border-top:1px solid #111;margin-top:9px;padding-top:8px;"><button onclick="_rTranslate(\'' + id + '\')" id="' + id + '_tr" style="background:rgba(1,180,228,0.08);border:1px solid rgba(1,180,228,0.2);color:#38bdf8;border-radius:16px;padding:4px 11px;font-size:11px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:4px;"><i class=\"fa-solid fa-language\"></i> ' + (fa?'ترجمه':'Translate') + '</button></div></div>';
            }).join('');
            // Set data attributes after rendering (safe way to pass full content)
            (reviews || []).filter(function(r){return r&&r.content;}).forEach(function(rev,idx) {
                var mb = document.getElementById(tab+'_'+idx+'_mb');
                if (mb) { mb.dataset.full = rev.content; mb.dataset.short = rev.content.length>320?rev.content.slice(0,320)+'...':rev.content; }
            });
        }

        function _rToggle(id, full, short) {
            var el = document.getElementById(id+'_t');
            var btn = document.getElementById(id+'_mb');
            if (!el || !btn) return;
            if (btn.dataset.x === '1') { el.innerText = short; btn.textContent = LANG==='fa'?'بیشتر':'Read more'; btn.dataset.x='0'; }
            else { el.innerText = full; btn.textContent = LANG==='fa'?'کمتر':'Show less'; btn.dataset.x='1'; }
        }

        async function _rTranslate(id) {
            var el = document.getElementById(id+'_t');
            var btn = document.getElementById(id+'_tr');
            if (!el || !btn) return;
            if (btn.dataset.s === 'fa') { el.innerText = btn.dataset.orig; btn.innerHTML = '<i class="fa-solid fa-language"></i> '+(LANG==='fa'?'ترجمه':'Translate'); btn.dataset.s=''; return; }
            if (btn.dataset.fa) { el.innerText = btn.dataset.fa; btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> '+(LANG==='fa'?'اصلی':'Original'); btn.dataset.s='fa'; return; }
            btn.dataset.orig = el.innerText;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;
            try {
                var resp = await fetch('https://api.mymemory.translated.net/get?q=' + encodeURIComponent(el.innerText.slice(0,500)) + '&langpair=en|fa');
                var data = await resp.json();
                if (data && data.responseData && data.responseData.translatedText) {
                    btn.dataset.fa = data.responseData.translatedText;
                    el.innerText = data.responseData.translatedText;
                    btn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> '+(LANG==='fa'?'اصلی':'Original');
                    btn.dataset.s = 'fa';
                } else throw new Error();
            } catch(e) {
                btn.innerHTML = '<i class="fa-solid fa-language"></i> '+(LANG==='fa'?'ترجمه':'Translate');
            }
            btn.disabled = false;
        }

        function closeReviews() {
            document.getElementById('reviews-modal').style.display = 'none';
            _rCache = {};
        }



        // =================== SOUNDTRACKS FEATURE v7 (Static + Smart Lookup) ===================
        // Large hardcoded database + smart fallback prompt with known data
        var _ST_DB = {
            // Key: lowercase title
            "the dark knight": [{num:1,name:"Why So Serious?",artist:"Hans Zimmer & James Newton Howard"},{num:2,name:"I'm Not a Hero",artist:"Hans Zimmer & James Newton Howard"},{num:3,name:"Harvey Two-Face",artist:"Hans Zimmer & James Newton Howard"},{num:4,name:"Attack on the Convoy",artist:"Hans Zimmer & James Newton Howard"},{num:5,name:"Like a Dog Chasing Cars",artist:"Hans Zimmer & James Newton Howard"},{num:6,name:"A Watchful Guardian",artist:"Hans Zimmer & James Newton Howard"},{num:7,name:"Agent of Chaos",artist:"Hans Zimmer & James Newton Howard"},{num:8,name:"Introduce a Little Anarchy",artist:"Hans Zimmer & James Newton Howard"},{num:9,name:"Watch the World Burn",artist:"Hans Zimmer & James Newton Howard"},{num:10,name:"A Dark Knight",artist:"Hans Zimmer & James Newton Howard"}],
            "inception": [{num:1,name:"Half Remembered Dream",artist:"Hans Zimmer"},{num:2,name:"We Built Our Own World",artist:"Hans Zimmer"},{num:3,name:"Dream is Collapsing",artist:"Hans Zimmer"},{num:4,name:"Radical Notion",artist:"Hans Zimmer"},{num:5,name:"Old Souls",artist:"Hans Zimmer"},{num:6,name:"Dream Within a Dream",artist:"Hans Zimmer"},{num:7,name:"Waiting for a Train",artist:"Hans Zimmer"},{num:8,name:"Mombasa",artist:"Hans Zimmer"},{num:9,name:"One Simple Idea",artist:"Hans Zimmer"},{num:10,name:"Time",artist:"Hans Zimmer"},{num:11,name:"Non, je ne regrette rien",artist:"Edith Piaf"}],
            "interstellar": [{num:1,name:"Cornfield Chase",artist:"Hans Zimmer"},{num:2,name:"Dust",artist:"Hans Zimmer"},{num:3,name:"Day One",artist:"Hans Zimmer"},{num:4,name:"Stay",artist:"Hans Zimmer"},{num:5,name:"Message from Home",artist:"Hans Zimmer"},{num:6,name:"Detach",artist:"Hans Zimmer"},{num:7,name:"No Time for Caution",artist:"Hans Zimmer"},{num:8,name:"What Happens Now?",artist:"Hans Zimmer"},{num:9,name:"Do Not Go Gentle into That Good Night",artist:"Hans Zimmer"},{num:10,name:"Coward",artist:"Hans Zimmer"},{num:11,name:"Murph",artist:"Hans Zimmer"},{num:12,name:"Imperfect Lock",artist:"Hans Zimmer"},{num:13,name:"Where We're Going",artist:"Hans Zimmer"}],
            "the pianist": [{num:1,name:"Nocturne in C# minor, Op. posth",artist:"Frederic Chopin (performed by Janusz Olejniczak)"},{num:2,name:"Nocturne in E minor, Op. 72",artist:"Frederic Chopin"},{num:3,name:"Ballade No. 1 in G minor, Op. 23",artist:"Frederic Chopin"},{num:4,name:"Mazurka in A minor, Op. 17/4",artist:"Frederic Chopin"},{num:5,name:"Prelude in A major, Op. 28/7",artist:"Frederic Chopin"},{num:6,name:"Waltz in B minor, Op. 69/2",artist:"Frederic Chopin"},{num:7,name:"Scherzo No. 2 in B-flat minor, Op. 31",artist:"Frederic Chopin"},{num:8,name:"Andante spianato & Grande Polonaise",artist:"Frederic Chopin"},{num:9,name:"Piano Concerto in E minor",artist:"Frederic Chopin (performed by Janusz Olejniczak)"},{num:10,name:"Grand Fantasia in E major",artist:"Frederic Chopin"}],
            "breaking bad": [{num:1,name:"Breaking Bad Main Title Theme",artist:"Dave Porter"},{num:2,name:"Fly",artist:"Dave Porter"},{num:3,name:"Baby Blue",artist:"Badfinger"},{num:4,name:"Crystal Blue Persuasion",artist:"Tommy James & the Shondells"},{num:5,name:"Good",artist:"Better Than Ezra"},{num:6,name:"DLZ",artist:"TV on the Radio"},{num:7,name:"Black",artist:"Danger Mouse & Daniele Luppi ft. Norah Jones"},{num:8,name:"A Good Man",artist:"Dave Porter"},{num:9,name:"Goodbye",artist:"Dave Porter"},{num:10,name:"Felina End",artist:"Dave Porter"}],
            "game of thrones": [{num:1,name:"Main Title",artist:"Ramin Djawadi"},{num:2,name:"The Rains of Castamere",artist:"Sigur Ros"},{num:3,name:"Light of the Seven",artist:"Ramin Djawadi"},{num:4,name:"Goodbye Brother",artist:"Ramin Djawadi"},{num:5,name:"The Children",artist:"Ramin Djawadi"},{num:6,name:"Fire & Blood",artist:"Ramin Djawadi"},{num:7,name:"Chaos Is a Ladder",artist:"Ramin Djawadi"},{num:8,name:"Winds of Winter",artist:"Ramin Djawadi"},{num:9,name:"Jenny of Oldstones",artist:"Florence + The Machine"},{num:10,name:"The Night King",artist:"Ramin Djawadi"}],
            "oppenheimer": [{num:1,name:"Can You Hear the Music",artist:"Ludwig Goransson"},{num:2,name:"Fission",artist:"Ludwig Goransson"},{num:3,name:"Quantum Mechanics",artist:"Ludwig Goransson"},{num:4,name:"Destroyer of Worlds",artist:"Ludwig Goransson"},{num:5,name:"Fusion",artist:"Ludwig Goransson"},{num:6,name:"Am I a Good Man",artist:"Ludwig Goransson"},{num:7,name:"Manhattan Project",artist:"Ludwig Goransson"},{num:8,name:"Theorist",artist:"Ludwig Goransson"},{num:9,name:"Trinity",artist:"Ludwig Goransson"},{num:10,name:"Florence",artist:"Ludwig Goransson"},{num:11,name:"Gravity of Proof",artist:"Ludwig Goransson"},{num:12,name:"See You at the Party",artist:"Ludwig Goransson"}],
            "harry potter and the sorcerer's stone": [{num:1,name:"Hedwig's Theme",artist:"John Williams"},{num:2,name:"Harry's Wondrous World",artist:"John Williams"},{num:3,name:"The Arrival of Baby Harry",artist:"John Williams"},{num:4,name:"Visit to the Zoo",artist:"John Williams"},{num:5,name:"Diagon Alley",artist:"John Williams"},{num:6,name:"Platform Nine and Three Quarters",artist:"John Williams"},{num:7,name:"Hogwarts Forever",artist:"John Williams"},{num:8,name:"The Chess Game",artist:"John Williams"},{num:9,name:"Voldemort",artist:"John Williams"},{num:10,name:"Nimbus 2000",artist:"John Williams"}],
            "harry potter and the half-blood prince": [{num:1,name:"Opening",artist:"Nicholas Hooper"},{num:2,name:"In Noctem",artist:"Nicholas Hooper"},{num:3,name:"Snape & The Unbreakable Vow",artist:"Nicholas Hooper"},{num:4,name:"Wizard Wheezes",artist:"Nicholas Hooper"},{num:5,name:"Dumbledore's Speech",artist:"Nicholas Hooper"},{num:6,name:"Into the Pensieve",artist:"Nicholas Hooper"},{num:7,name:"The Slug Club",artist:"Nicholas Hooper"},{num:8,name:"Of Quidditch & Hormones",artist:"Nicholas Hooper"},{num:9,name:"Farewell Dumbledore",artist:"Nicholas Hooper"},{num:10,name:"When Ginny Kissed Harry",artist:"Nicholas Hooper"}],
            "the godfather": [{num:1,name:"The Godfather Waltz",artist:"Nino Rota"},{num:2,name:"I Have But One Heart",artist:"Al Martino"},{num:3,name:"The Pickup",artist:"Nino Rota"},{num:4,name:"Connie's Wedding",artist:"Nino Rota"},{num:5,name:"The Halls of Fear",artist:"Nino Rota"},{num:6,name:"Sicilian Pastorale",artist:"Nino Rota"},{num:7,name:"Love Theme from The Godfather",artist:"Nino Rota"},{num:8,name:"Michael Corleone",artist:"Nino Rota"},{num:9,name:"The New Godfather",artist:"Nino Rota"}],
            "pulp fiction": [{num:1,name:"Misirlou",artist:"Dick Dale & the Del-Tones"},{num:2,name:"Royale with Cheese",artist:"Kool & the Gang"},{num:3,name:"Girl, You'll Be a Woman Soon",artist:"Urge Overkill"},{num:4,name:"Son of a Preacher Man",artist:"Dusty Springfield"},{num:5,name:"Jungle Boogie",artist:"Kool & the Gang"},{num:6,name:"Let's Stay Together",artist:"Al Green"},{num:7,name:"Bullwinkle Pt. II",artist:"The Centurions"},{num:8,name:"If I Love You",artist:"Chuck Berry"},{num:9,name:"Flowers on the Wall",artist:"Statler Brothers"},{num:10,name:"Comanche",artist:"The Revels"}],
            "schindler's list": [{num:1,name:"Theme from Schindler's List",artist:"Itzhak Perlman (violin) — John Williams"},{num:2,name:"Jewish Town",artist:"John Williams"},{num:3,name:"Auschwitz-Birkenau",artist:"John Williams"},{num:4,name:"Remembrances",artist:"John Williams"},{num:5,name:"Making the List",artist:"John Williams"},{num:6,name:"Schindler's Workforce",artist:"John Williams"},{num:7,name:"Rainy Day",artist:"John Williams"},{num:8,name:"I Could Have Done More",artist:"John Williams"},{num:9,name:"Jerusalem",artist:"John Williams"}],
            "forrest gump": [{num:1,name:"Hound Dog",artist:"Elvis Presley"},{num:2,name:"Rebel Rouser",artist:"Duane Eddy"},{num:3,name:"California Dreamin",artist:"The Mamas & the Papas"},{num:4,name:"Everybody's Talkin'",artist:"Harry Nilsson"},{num:5,name:"Go All the Way",artist:"The Raspberries"},{num:6,name:"Sweet Home Alabama",artist:"Lynyrd Skynyrd"},{num:7,name:"Against the Wind",artist:"Bob Seger"},{num:8,name:"Fortunate Son",artist:"Creedence Clearwater Revival"},{num:9,name:"For What It's Worth",artist:"Buffalo Springfield"},{num:10,name:"Running on Empty",artist:"Jackson Browne"},{num:11,name:"Go Your Own Way",artist:"Fleetwood Mac"},{num:12,name:"Let's Get It On",artist:"Marvin Gaye"},{num:13,name:"Feelin' Alright",artist:"Joe Cocker"},{num:14,name:"Blowin' in the Wind",artist:"Bob Dylan"}],
            "the shawshank redemption": [{num:1,name:"End Titles",artist:"Thomas Newman"},{num:2,name:"Brooks Was Here",artist:"Thomas Newman"},{num:3,name:"So Was Red",artist:"Thomas Newman"},{num:4,name:"The Marriage of Figaro – Canzonetta Sull'aria",artist:"Mozart"},{num:5,name:"Shawshank Prison",artist:"Thomas Newman"},{num:6,name:"New Fish",artist:"Thomas Newman"},{num:7,name:"The Sisters",artist:"Thomas Newman"},{num:8,name:"Andy Dufresne",artist:"Thomas Newman"},{num:9,name:"Befriended",artist:"Thomas Newman"},{num:10,name:"Rocky Escape",artist:"Thomas Newman"},{num:11,name:"Zihuatanejo",artist:"Thomas Newman"}],
            "fight club": [{num:1,name:"Who Is Tyler Durden?",artist:"The Dust Brothers"},{num:2,name:"Medula Oblongata",artist:"The Dust Brothers"},{num:3,name:"Flashback",artist:"The Dust Brothers"},{num:4,name:"This Is Your Life",artist:"The Dust Brothers"},{num:5,name:"Space Monkeys",artist:"The Dust Brothers"},{num:6,name:"Psycho Boy Jack",artist:"The Dust Brothers"},{num:7,name:"Homework",artist:"The Dust Brothers"},{num:8,name:"What's Up Flowers?",artist:"The Dust Brothers"},{num:9,name:"The Narrator Runs",artist:"The Dust Brothers"},{num:10,name:"Finding the Right Therapist",artist:"The Dust Brothers"},{num:11,name:"Where Is My Mind?",artist:"Pixies"}],
            "gladiator": [{num:1,name:"Progeny",artist:"Hans Zimmer & Lisa Gerrard"},{num:2,name:"The Wheat",artist:"Hans Zimmer & Lisa Gerrard"},{num:3,name:"The Battle",artist:"Hans Zimmer & Lisa Gerrard"},{num:4,name:"Earth",artist:"Hans Zimmer & Lisa Gerrard"},{num:5,name:"Sorrow",artist:"Hans Zimmer & Lisa Gerrard"},{num:6,name:"Now We Are Free",artist:"Lisa Gerrard & Hans Zimmer"},{num:7,name:"Slaves to Rome",artist:"Hans Zimmer"},{num:8,name:"Barbarian Horde",artist:"Hans Zimmer & Lisa Gerrard"},{num:9,name:"Am I Not Merciful?",artist:"Hans Zimmer & Lisa Gerrard"},{num:10,name:"Elysium",artist:"Hans Zimmer & Lisa Gerrard"}],
            "la la land": [{num:1,name:"Another Day of Sun",artist:"La La Land Cast"},{num:2,name:"Someone in the Crowd",artist:"Emma Stone"},{num:3,name:"Mia & Sebastian's Theme",artist:"Justin Hurwitz"},{num:4,name:"A Lovely Night",artist:"Ryan Gosling & Emma Stone"},{num:5,name:"Herman's Habit",artist:"Justin Hurwitz"},{num:6,name:"Start a Fire",artist:"John Legend"},{num:7,name:"Engagement Party",artist:"Justin Hurwitz"},{num:8,name:"City of Stars",artist:"Ryan Gosling & Emma Stone"},{num:9,name:"Planetarium",artist:"Justin Hurwitz"},{num:10,name:"Epilogue",artist:"Justin Hurwitz"}],
            "parasite": [{num:1,name:"The Belt of Faith",artist:"Jung Jae-il"},{num:2,name:"Concurrence",artist:"Jung Jae-il"},{num:3,name:"Serenade in G major K.525",artist:"Wolfgang Amadeus Mozart"},{num:4,name:"Plan",artist:"Jung Jae-il"},{num:5,name:"Moving In",artist:"Jung Jae-il"},{num:6,name:"Montage",artist:"Jung Jae-il"},{num:7,name:"Act of Goodwill",artist:"Jung Jae-il"},{num:8,name:"Kitchen Scene",artist:"Jung Jae-il"},{num:9,name:"Memories of the Icy Planet",artist:"Jung Jae-il"},{num:10,name:"Jessica, Only Child",artist:"Jung Jae-il"}],
            "joker": [{num:1,name:"Clown",artist:"Hildur Guonadottir"},{num:2,name:"Defeated Clown",artist:"Hildur Guonadottir"},{num:3,name:"Bathrooms",artist:"Hildur Guonadottir"},{num:4,name:"Failed Stand Up",artist:"Hildur Guonadottir"},{num:5,name:"Subway",artist:"Hildur Guonadottir"},{num:6,name:"Broken and Beaten",artist:"Hildur Guonadottir"},{num:7,name:"Carnival Barker",artist:"Hildur Guonadottir"},{num:8,name:"That's Life",artist:"Frank Sinatra"},{num:9,name:"Send In the Clowns",artist:"Hildur Guonadottir"},{num:10,name:"Laughing on the Outside",artist:"Jimmy Durante"}],
            "avatar": [{num:1,name:"You Don't Dream in Cryo",artist:"James Horner"},{num:2,name:"Pure Spirits of the Forest",artist:"James Horner"},{num:3,name:"The Bioluminescence of the Night",artist:"James Horner"},{num:4,name:"Becoming One of 'The People'",artist:"James Horner"},{num:5,name:"Climbing Up 'Iknimaya'",artist:"James Horner"},{num:6,name:"Scorched Earth",artist:"James Horner"},{num:7,name:"Gathering of All the Clans",artist:"James Horner"},{num:8,name:"War",artist:"James Horner"},{num:9,name:"I See You (Theme from Avatar)",artist:"Leona Lewis"},{num:10,name:"Jake's First Flight",artist:"James Horner"}],
            "stranger things": [{num:1,name:"Stranger Things Main Theme",artist:"Kyle Dixon & Michael Stein"},{num:2,name:"Kids",artist:"Kyle Dixon & Michael Stein"},{num:3,name:"Running Up That Hill",artist:"Kate Bush"},{num:4,name:"Master of Puppets",artist:"Metallica"},{num:5,name:"Should I Stay or Should I Go",artist:"The Clash"},{num:6,name:"Every Breath You Take",artist:"The Police"},{num:7,name:"Separate Ways (Worlds Apart)",artist:"Journey"},{num:8,name:"Heroes",artist:"Peter Gabriel"},{num:9,name:"Whip It",artist:"Devo"},{num:10,name:"Thriller",artist:"Michael Jackson"}],
            "the lord of the rings: the fellowship of the ring": [{num:1,name:"The Prophecy",artist:"Howard Shore"},{num:2,name:"Concerning Hobbits",artist:"Howard Shore"},{num:3,name:"The Shadow of the Past",artist:"Howard Shore"},{num:4,name:"Saruman the White",artist:"Howard Shore"},{num:5,name:"Flight to the Ford",artist:"Howard Shore"},{num:6,name:"Many Meetings",artist:"Howard Shore"},{num:7,name:"The Council of Elrond",artist:"Howard Shore"},{num:8,name:"Lothlórien",artist:"Howard Shore"},{num:9,name:"In Dreams",artist:"Edward Ross"},{num:10,name:"The Breaking of the Fellowship",artist:"Howard Shore"}],
            "titanic": [{num:1,name:"My Heart Will Go On",artist:"Celine Dion"},{num:2,name:"Never An Absolution",artist:"James Horner"},{num:3,name:"Southampton",artist:"James Horner"},{num:4,name:"Rose",artist:"James Horner"},{num:5,name:"An Ocean of Memories",artist:"James Horner"},{num:6,name:"Leaving Port",artist:"James Horner"},{num:7,name:"Take Her to Sea",artist:"James Horner"},{num:8,name:"Hard to Starboard",artist:"James Horner"},{num:9,name:"Death of Titanic",artist:"James Horner"},{num:10,name:"A Promise Kept",artist:"James Horner"}],
            "batman v superman: dawn of justice": [{num:1,name:"Beautiful Lie",artist:"Hans Zimmer & Junkie XL"},{num:2,name:"Their War Here",artist:"Hans Zimmer & Junkie XL"},{num:3,name:"Is She With You?",artist:"Hans Zimmer & Junkie XL"},{num:4,name:"Do You Bleed?",artist:"Hans Zimmer & Junkie XL"},{num:5,name:"Batman v Superman",artist:"Hans Zimmer & Junkie XL"},{num:6,name:"The Red Capes are Coming",artist:"Hans Zimmer & Junkie XL"},{num:7,name:"Day of the Dead",artist:"Hans Zimmer & Junkie XL"},{num:8,name:"Gods Are Mortal",artist:"Hans Zimmer & Junkie XL"},{num:9,name:"This is My World",artist:"Hans Zimmer & Junkie XL"},{num:10,name:"Men Are Still Good",artist:"Hans Zimmer & Junkie XL"}],
            "blade runner 2049": [{num:1,name:"2049",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:2,name:"Memory",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:3,name:"Joi",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:4,name:"Flight to Los Angeles",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:5,name:"Tears in Rain",artist:"Vangelis"},{num:6,name:"Wallace",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:7,name:"Someone Lived This",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:8,name:"Orphan",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:9,name:"All the Best Memories Are Hers",artist:"Hans Zimmer & Benjamin Wallfisch"},{num:10,name:"Pilot",artist:"Hans Zimmer & Benjamin Wallfisch"}],
            "dune": [{num:1,name:"Herald of the Change",artist:"Hans Zimmer"},{num:2,name:"Dream of Arrakeen",artist:"Hans Zimmer"},{num:3,name:"Leaving Caladan",artist:"Hans Zimmer"},{num:4,name:"Arrakeen",artist:"Hans Zimmer"},{num:5,name:"Ripples in the Sand",artist:"Hans Zimmer"},{num:6,name:"Bene Gesserit",artist:"Hans Zimmer"},{num:7,name:"The Shortening of the Way",artist:"Hans Zimmer"},{num:8,name:"Night on Arrakis",artist:"Hans Zimmer"},{num:9,name:"Paul's Dream",artist:"Hans Zimmer"},{num:10,name:"Visions",artist:"Hans Zimmer"},{num:11,name:"Stillsuits",artist:"Hans Zimmer"},{num:12,name:"My Road Leads Into the Desert",artist:"Hans Zimmer"},{num:13,name:"Burning Sands",artist:"Hans Zimmer"},{num:14,name:"The Sietch",artist:"Hans Zimmer"}],
            "home": [{num:1,name:"همنت",artist:"محسن چاوشی"},{num:2,name:"باد",artist:"محسن چاوشی"},{num:3,name:"جادوگر",artist:"محسن چاوشی"},{num:4,name:"موسیقی متن فیلم",artist:"محمد رضا علیقلی"}],
            "a separation": [{num:1,name:"موسیقی متن جدایی",artist:"Sattar Oraki"}],
            "the bear": [{num:1,name:"Experience",artist:"Ludovico Einaudi"},{num:2,name:"Sycamore",artist:"Alvo Pärt"},{num:3,name:"Running with the Wolves",artist:"Aurora"},{num:4,name:"Falling",artist:"Harry Styles"},{num:5,name:"Papaoutai",artist:"Stromae"},{num:6,name:"Never Tear Us Apart",artist:"INXS"},{num:7,name:"In My Life",artist:"The Beatles"},{num:8,name:"Love You to Death",artist:"Type O Negative"},{num:9,name:"Five Years",artist:"David Bowie"},{num:10,name:"Bravado",artist:"Lorde"}],
            "succession": [{num:1,name:"Main Title Theme",artist:"Nicholas Britell"},{num:2,name:"Tern Haven",artist:"Nicholas Britell"},{num:3,name:"Retiring",artist:"Nicholas Britell"},{num:4,name:"Sad Sack Wasp Trap",artist:"Nicholas Britell"},{num:5,name:"Mass in B minor",artist:"Johann Sebastian Bach"},{num:6,name:"Con te partirò",artist:"Andrea Bocelli"},{num:7,name:"Gilded Cage",artist:"Nicholas Britell"}],
            "goodfellas": [{num:1,name:"Rags to Riches",artist:"Tony Bennett"},{num:2,name:"Mouths to Feed",artist:"Muddy Waters"},{num:3,name:"Sunshine of Your Love",artist:"Cream"},{num:4,name:"Atlantis",artist:"Donovan"},{num:5,name:"Gimme Shelter",artist:"The Rolling Stones"},{num:6,name:"Layla",artist:"Derek and the Dominos"},{num:7,name:"Jump into the Fire",artist:"Harry Nilsson"},{num:8,name:"Memo from Turner",artist:"Mick Jagger"},{num:9,name:"Mannish Boy",artist:"Muddy Waters"},{num:10,name:"My Way",artist:"Sid Vicious"}]
        };
;
