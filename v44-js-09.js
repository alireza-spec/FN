function syncGlobalHeaderControls() {
            try {
                document.querySelectorAll('.fn-lang-mini-text').forEach(el => { el.textContent = LANG === 'fa' ? 'FA' : 'EN'; });
                const mainLangIcon = document.getElementById('lang-toggle-icon');
                if (mainLangIcon) mainLangIcon.textContent = LANG === 'fa' ? 'FA' : 'EN';
            } catch(e) {}
        }
        document.addEventListener('DOMContentLoaded', function(){ setTimeout(syncGlobalHeaderControls, 250); setTimeout(syncGlobalHeaderControls, 1200); });

        // ---- 5. PERSONAL RATING SYSTEM ----
        const RATINGS_KEY = 'family_personal_ratings_v1';
        let personalRatings = JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}');
        
        function setPersonalRating(stars) {
            haptic(15);
            if (!curId) return;
            var prevRating = personalRatings[curId];
            var prevOpinion = prevRating ? prevRating.opinion : null;
            personalRatings[curId] = {
                stars: stars,
                title: curTitle,
                type: curType,
                poster: curDataForFav ? curDataForFav.poster_path : null,
                date: new Date().toISOString(),
                opinion: prevOpinion || null
            };
            localStorage.setItem(RATINGS_KEY, JSON.stringify(personalRatings));

            renderPersonalRating();
            renderOpinionChips();
            updateMiniStats();
            showToast(LANG === 'fa' ? (stars + ' \u0633\u062A\u0627\u0631\u0647 \u062B\u0628\u062A \u0634\u062F') : (stars + ' star rated'));
        }

        function setRatingOpinion(opinion) {
            haptic(10);
            if (!curId || !personalRatings[curId]) return;
            personalRatings[curId].opinion = opinion;
            localStorage.setItem(RATINGS_KEY, JSON.stringify(personalRatings));
            renderOpinionChips();
            var isFA = LANG === 'fa';
            showToast(isFA ? '\u0646\u0638\u0631 \u0634\u0645\u0627 \u062B\u0628\u062A \u0634\u062F!' : 'Opinion saved!');
        }

        function renderOpinionChips() {
            var isFA = LANG === 'fa';
            var chipsDiv = document.getElementById('opinion-chips');
            if (!chipsDiv) return;
            if (!curId || !personalRatings[curId] || !personalRatings[curId].stars) {
                chipsDiv.style.display = 'none';
                return;
            }
            var currentOpinion = personalRatings[curId].opinion || null;
            var opinions = isFA
                ? [
                    { key: 'loved', label: 'سلیقم بود، خوشم اومد' },
                    { key: 'ok', label: 'بد نبود، سرگرم شدم' },
                    { key: 'disliked', label: 'خوشم نیومد، اتلاف وقت بود' },
                    { key: 'notmytaste', label: 'سلیقم نبود، بدم اومد' }
                  ]
                : [
                    { key: 'loved', label: 'My taste, loved it' },
                    { key: 'ok', label: 'Not bad, was entertained' },
                    { key: 'disliked', label: 'Disliked, waste of time' },
                    { key: 'notmytaste', label: 'Not my taste, disliked it' }
                  ];
            var html = '<div style="font-size:11px;color:#888;margin-bottom:8px;">' + (isFA ? 'نظرت رو ثبت کن (اختیاری):' : 'Add your opinion (optional):') + '</div>';
            html += '<div style="display:flex;flex-direction:column;gap:6px;">';
            opinions.forEach(function(op) {
                var isActive = currentOpinion === op.key;
                var key = op.key;
                html += '<button onclick="setRatingOpinion(\'' + key + '\')" style="text-align:' + (isFA ? 'right' : 'left') + ';padding:10px 14px;border-radius:10px;border:1.5px solid ' + (isActive ? 'var(--primary)' : 'rgba(255,255,255,0.1)') + ';background:' + (isActive ? 'rgba(229,9,20,0.18)' : 'rgba(255,255,255,0.04)') + ';color:' + (isActive ? 'white' : '#bbb') + ';font-size:13px;cursor:pointer;font-family:inherit;transition:0.15s;width:100%;font-weight:' + (isActive ? '700' : '400') + ';">' + (isActive ? '&#10003; ' : '') + op.label + '</button>';
            });
            html += '</div>';
            chipsDiv.style.display = 'block';
            chipsDiv.innerHTML = html;
        }
        
        function clearPersonalRating() {
            if (!curId) return;
            delete personalRatings[curId];
            localStorage.setItem(RATINGS_KEY, JSON.stringify(personalRatings));
            renderPersonalRating();
            var chipsDiv = document.getElementById('opinion-chips');
            if (chipsDiv) chipsDiv.style.display = 'none';
            updateMiniStats();
        }
        
        function renderPersonalRating() {
            const rating = personalRatings[curId] ? personalRatings[curId].stars : 0;
            for (let i = 1; i <= 5; i++) {
                const star = document.getElementById(`star-${i}`);
                if (star) {
                    star.textContent = i <= rating ? '★' : '☆';
                    star.classList.toggle('active', i <= rating);
                }
            }
            renderOpinionChips();
        }
        
        // ---- 6. SHARE MEDIA ----
        let shareMediaBusy = false;
        async function shareMedia() {
            if (shareMediaBusy) return;
            shareMediaBusy = true;
            // Prevent accidental repeated taps while artwork/native share UI is being prepared.
            setTimeout(() => { shareMediaBusy = false; }, 12000);
            haptic(15);
            if (!curTitle) return;

            const data = curDataForFav || {};
            const imdbUrl = curImdb ? `https://www.imdb.com/title/${curImdb}` : '';
            const year = (data.release_date || data.first_air_date || '').split('-')[0] || '—';
            const rating = data.vote_average != null && !isNaN(Number(data.vote_average))
                ? Number(data.vote_average).toFixed(1) : '—';
            const genres = (data.genres || []).map(g => g.name).filter(Boolean).join(', ') || '—';
            const directors = curShareCredits && curShareCredits.crew
                ? curShareCredits.crew.filter(c => c.job === 'Director').map(c => c.name).filter(Boolean).slice(0, 3).join(', ')
                : '';
            const starring = curShareCredits && curShareCredits.cast
                ? curShareCredits.cast.map(c => c.name).filter(Boolean).slice(0, 8).join(', ')
                : '';
            const storyline = (data.overview || data.tagline || '—').replace(/\s+/g, ' ').trim();
            const text = `🎬 ${curTitle} (${year})
⭐ IMDb: ${rating}/10
🎭 Genre: ${genres}
🔖 Storyline: ${storyline}

👤 Director: ${directors || '—'}
👥 Starring: ${starring || '—'}

${imdbUrl ? '🔗 ' + imdbUrl : '🔗 IMDb link unavailable'}
🎞️ via «FAMILY NIGHT»`;

            // Share an editorial-style poster card first. Text remains attached to the image share
            // and is also used unchanged when the device cannot share files.
            try {
                const blob = await buildFNShareCard({
                    title: curTitle, year, rating, genres, storyline,
                    directors: directors || '—', starring: starring || '—'
                });
                if (blob) {
                    const file = new File([blob], 'family-night-' + Date.now() + '.png', { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: curTitle, text });
                        return;
                    }
                }
            } catch (e) { /* use the reliable text share below */ }

            if (navigator.share) {
                navigator.share({ title: curTitle, text }).catch(() => {});
            } else {
                const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(imdbUrl || 'https://www.imdb.com')}&text=${encodeURIComponent(text)}`;
                window.open(tgUrl, '_blank');
            }
        }

        // Builds a tall, Pinterest/Telegram-friendly share card with the poster and full key details.
        function buildFNShareCard(info) {
            return new Promise((resolve) => {
                try {
                    const W = 900, H = 1480;
                    const canvas = document.createElement('canvas');
                    canvas.width = W; canvas.height = H;
                    const ctx = canvas.getContext('2d');
                    const cs = getComputedStyle(document.documentElement);
                    const primary = (cs.getPropertyValue('--primary') || '#E50914').trim() || '#E50914';

                    function roundRect(x, y, w, h, r) {
                        ctx.beginPath(); ctx.moveTo(x + r, y);
                        ctx.arcTo(x + w, y, x + w, y + h, r);
                        ctx.arcTo(x + w, y + h, x, y + h, r);
                        ctx.arcTo(x, y + h, x, y, r);
                        ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
                    }
                    function fitText(str, maxWidth) {
                        let value = String(str || '—');
                        while (ctx.measureText(value).width > maxWidth && value.length > 3) value = value.slice(0, -4) + '…';
                        return value;
                    }
                    function wrap(str, x, y, maxWidth, lineHeight, maxLines) {
                        const words = String(str || '—').split(/\s+/), lines = [];
                        let line = '';
                        words.forEach(word => {
                            const test = line ? line + ' ' + word : word;
                            if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
                            else line = test;
                        });
                        if (line) lines.push(line);
                        const shown = lines.slice(0, maxLines || 3);
                        if (lines.length > shown.length) shown[shown.length - 1] = shown[shown.length - 1].replace(/…?$/, '…');
                        shown.forEach((lineText, i) => ctx.fillText(lineText, x, y + i * lineHeight));
                        return shown.length;
                    }
                    function finish(posterImg) {
                        const bg = ctx.createLinearGradient(0, 0, 0, H);
                        bg.addColorStop(0, '#17191f'); bg.addColorStop(0.62, '#0b0c10'); bg.addColorStop(1, '#030304');
                        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
                        const pw = 610, ph = 820, px = (W - pw) / 2, py = 58;
                        if (posterImg) {
                            ctx.save(); roundRect(px, py, pw, ph, 28); ctx.clip();
                            // Preserve the poster's original portrait ratio; never stretch a cover.
                            const scale = Math.min(pw / posterImg.naturalWidth, ph / posterImg.naturalHeight);
                            const dw = posterImg.naturalWidth * scale, dh = posterImg.naturalHeight * scale;
                            ctx.drawImage(posterImg, px + (pw - dw) / 2, py + (ph - dh) / 2, dw, dh); ctx.restore();
                            ctx.save(); roundRect(px, py, pw, ph, 28); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
                        } else {
                            ctx.fillStyle = '#25262b'; roundRect(px, py, pw, ph, 28); ctx.fill();
                            ctx.fillStyle = '#777'; ctx.font = '700 30px Arial'; ctx.textAlign = 'center'; ctx.fillText('FAMILY NIGHT', W/2, py + ph/2);
                        }
                        ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 39px Arial';
                        const titleLines = wrap(info.title, W/2, 946, 790, 46, 2);
                        ctx.fillStyle = primary; ctx.font = '800 27px Arial';
                        ctx.fillText(`${info.year}   ★ ${info.rating}/10`, W/2, 946 + titleLines * 46 + 30);

                        ctx.textAlign = 'left'; ctx.font = '700 22px Arial'; ctx.fillStyle = '#f5c518';
                        ctx.fillText('GENRE', 55, 1075); ctx.fillText('DIRECTOR', 55, 1160); ctx.fillText('STARRING', 55, 1245);
                        ctx.fillStyle = '#f0f0f0'; ctx.font = '500 22px Arial';
                        ctx.fillText(fitText(info.genres, 790), 55, 1108);
                        ctx.fillText(fitText(info.directors, 790), 55, 1193);
                        ctx.fillText(fitText(info.starring, 790), 55, 1278);
                        ctx.fillStyle = '#aeb1b8'; ctx.font = '500 19px Arial';
                        wrap('STORYLINE: ' + info.storyline, 55, 1332, 790, 27, 3);
                        ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '900 25px Arial'; ctx.fillText('🎞️ via «FAMILY NIGHT»', W/2, 1450);
                        canvas.toBlob(resolve, 'image/png');
                    }
                    // Try the artwork sources in order. Some upcoming titles have no usable
                    // poster_path, so the already displayed detail backdrop is the reliable fallback.
                    const visiblePoster = document.getElementById('d-img');
                    const posterPath = curDataForFav && curDataForFav.poster_path;
                    const backdropPath = curDataForFav && curDataForFav.backdrop_path;
                    // TMDB itself sends Access-Control-Allow-Origin: *; use it first so
                    // the card also works when Family Night is opened from a file/App WebView.
                    // The existing Family Night image paths remain as fallbacks.
                    const artworkUrls = [
                        // Use portrait poster artwork only. A landscape backdrop must never be
                        // substituted into the cover slot because it changes the cover's appearance.
                        posterPath ? 'https://image.tmdb.org/t/p/w500' + posterPath : '',
                        posterPath && typeof IMG_LG !== 'undefined' ? IMG_LG + posterPath : '',
                        visiblePoster && (visiblePoster.currentSrc || visiblePoster.src)
                    ].filter((url, index, all) => url && url.indexOf('data:image') !== 0 && all.indexOf(url) === index);

                    const loadArtwork = (index) => {
                        if (index >= artworkUrls.length) { finish(null); return; }
                        const url = artworkUrls[index];
                        // Load as an anonymous CORS image first. This is the browser/WebView-safe path:
                        // it avoids fetch restrictions while keeping the canvas exportable.
                        const image = new Image();
                        image.crossOrigin = 'anonymous';
                        image.onload = () => finish(image);
                        image.onerror = async () => {
                            // Keep Blob loading only as a backup for browsers that reject CORS images.
                            let objectUrl = '';
                            try {
                                const response = await fetch(url, { cache: 'no-store' });
                                if (!response.ok) throw new Error('artwork request failed');
                                const imageBlob = await response.blob();
                                if (!/^image\//.test(imageBlob.type)) throw new Error('not an image');
                                objectUrl = URL.createObjectURL(imageBlob);
                                const blobImage = new Image();
                                blobImage.onload = () => {
                                    finish(blobImage);
                                    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
                                };
                                blobImage.onerror = () => { URL.revokeObjectURL(objectUrl); loadArtwork(index + 1); };
                                blobImage.src = objectUrl;
                            } catch (e) {
                                if (objectUrl) URL.revokeObjectURL(objectUrl);
                                loadArtwork(index + 1);
                            }
                        };
                        image.src = url;
                    };
                    loadArtwork(0);
                } catch (e) { resolve(null); }
            });
        }
        
        // ---- 7. KEYWORD TAGS ----
        function renderKeywords(keywords) {
            const section = document.getElementById('keywords-section');
            const row = document.getElementById('keywords-row');
            if (!keywords || keywords.length === 0) { section.style.display = 'none'; return; }
            
            section.style.display = 'block';
            // Keywords always in English
            const labelEl = document.getElementById('txt-keywords-label');
            if (labelEl) labelEl.textContent = '🏷️ Keywords';
            
            row.innerHTML = keywords.slice(0, 20).map(k => {
                // Always use English name for keywords
                let enName = k.name || '';
                if (k.name) {
                    const found = ALL_KEYWORDS && ALL_KEYWORDS.find(ak => ak.en.toLowerCase() === k.name.toLowerCase() || ak.id === k.id);
                    if (found) enName = found.en;
                }
                return `<span class="keyword-tag" onclick="searchByKeyword(${k.id}, '${enName.replace(/'/g, '')}')">
                    ${enName}
                </span>`;
            }).join('');
        }
        
        let genericGridOpenedFromModal = false;
        
        function searchByKeyword(keywordId, name) {
            haptic(15);
            // Mark that we opened generic grid from within the modal
            genericGridOpenedFromModal = document.getElementById('modal').style.display !== 'none';
            document.getElementById('modal').style.display = 'none';
            // Find proper display name
            const kwEntry = ALL_KEYWORDS && ALL_KEYWORDS.find(ak => ak.id === keywordId || ak.en.toLowerCase() === (name||'').toLowerCase());
            const displayName = (LANG === 'fa' && kwEntry) ? kwEntry.fa : (kwEntry ? kwEntry.en : name);
            openGenericGrid('movie', `discover/movie?with_keywords=${keywordId}&sort_by=vote_average.desc&vote_count.gte=50`, `🏷️ ${displayName}`);
        }
        
        function closeGenericGrid() {
            document.getElementById('generic-grid-page').style.display='none';
            // If we came from modal (keyword tag click), re-open modal
            if (genericGridOpenedFromModal) {
                genericGridOpenedFromModal = false;
                document.getElementById('modal').style.display = 'block';
            }
        }
        
        // ---- 8. BUDGET & BOX OFFICE ----
        function renderBudgetBoxOffice(d) {
            const box = document.getElementById('budget-box');
            const hasData = d.budget > 0 || d.revenue > 0;
            if (!hasData) { box.style.display = 'none'; return; }
            
            box.style.display = 'flex';
            box.style.flexWrap = 'wrap';
            
            const budgetItem = document.getElementById('budget-item');
            const revenueItem = document.getElementById('revenue-item');
            const profitItem = document.getElementById('profit-item');

            if (d.budget > 0) {
                document.getElementById('budget-value').textContent = formatMoney(d.budget);
                budgetItem.style.display = '';
            } else {
                budgetItem.style.display = 'none';
            }
            if (d.revenue > 0) {
                document.getElementById('revenue-value').textContent = formatMoney(d.revenue);
                revenueItem.style.display = '';
            } else {
                revenueItem.style.display = 'none';
            }
            // Show profit if both exist
            if (d.budget > 0 && d.revenue > 0) {
                const profit = d.revenue - d.budget;
                const profitVal = document.getElementById('profit-value');
                if (profitVal) {
                    profitVal.textContent = (profit >= 0 ? '+' : '') + formatMoney(Math.abs(profit));
                    profitVal.style.color = profit >= 0 ? '#4ade80' : '#f87171';
                }
                if (profitItem) profitItem.style.display = '';
            } else {
                if (profitItem) profitItem.style.display = 'none';
            }
        }
        
        function formatMoney(amount) {
            if (amount >= 1e9) return '$' + (amount/1e9).toFixed(1) + 'B';
            if (amount >= 1e6) return '$' + (amount/1e6).toFixed(0) + 'M';
            if (amount >= 1e3) return '$' + (amount/1e3).toFixed(0) + 'K';
            return '$' + amount;
        }
        
        // ---- 9. COLLECTION / FRANCHISE ----
        async function loadCollection(d) {
            const section = document.getElementById('collection-section');
            const row = document.getElementById('collection-row');
            const nameEl = document.getElementById('collection-name');
            
            if (!d.belongs_to_collection) { section.style.display = 'none'; return; }
            
            section.style.display = 'block';
            const col = d.belongs_to_collection;
            nameEl.textContent = col.name || '';
            row.innerHTML = '';
            
            try {
                const colData = await getData(`collection/${col.id}`);
                if (colData && colData.parts) {
                    colData.parts
                        .sort((a,b) => (a.release_date||'').localeCompare(b.release_date||''))
                        .forEach(part => {
                            if (part.poster_path) row.innerHTML += makeCard(part, 'movie');
                        });
                }
            } catch(e) {
                section.style.display = 'none';
            }
        }
        
        // ---- 10. IMDb SCORE ANIMATION ----
        function animateScore(targetScore) {
            const el = document.getElementById('d-rate');
            if (!el) return;
            const target = parseFloat(targetScore);
            let current = 0;
            const steps = 30;
            const increment = target / steps;
            let step = 0;
            const timer = setInterval(() => {
                step++;
                current = Math.min(current + increment, target);
                el.textContent = current.toFixed(1);
                if (step >= steps) { clearInterval(timer); el.textContent = target.toFixed(1); }
            }, 30);
            el.classList.add('imdb-animated');
        }
        
        // ---- 11. CINEMATIC MODE ----
        let cinematicMode = false;
        function toggleCinematicMode(enable) {
            cinematicMode = enable;
            const glow = document.getElementById('cinematic-glow');
            if (enable) {
                glow.classList.add('active');
            } else {
                glow.classList.remove('active');
            }
        }
        // Auto enable when trailer plays
        const origPlayTrailer = window.playTrailer;
        
        // ---- 12. NETWORK INDICATOR ----
        const netIndicator = document.getElementById('network-indicator');
        window.addEventListener('offline', () => {
            netIndicator.style.display = 'block';
        });
        window.addEventListener('online', () => {
            netIndicator.style.display = 'none';
        });
        if (!navigator.onLine) netIndicator.style.display = 'block';
        
        // ---- 13. VOICE SEARCH ----
        let voiceRecognition = null;
        function startVoiceSearch() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                showToast(LANG === 'fa' ? 'جستجوی صوتی پشتیبانی نمی‌شود' : 'Voice search not supported');
                return;
            }
            haptic(20);
            const btn = document.getElementById('voice-search-btn');
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            voiceRecognition = new SpeechRecognition();
            voiceRecognition.lang = LANG === 'fa' ? 'fa-IR' : 'en-US';
            voiceRecognition.continuous = false;
            voiceRecognition.interimResults = false;
            
            btn.classList.add('listening');
            voiceRecognition.start();
            
            voiceRecognition.onresult = function(e) {
                const text = e.results[0][0].transcript;
                const input = document.getElementById('search-input');
                input.value = text;
                doLiveSearch(text);
                btn.classList.remove('listening');
            };
            voiceRecognition.onerror = voiceRecognition.onend = function() {
                btn.classList.remove('listening');
            };
        }
        
        // ---- 14. QUOTE OF THE DAY ----
        const QUOTES = [
            // ── Classic Hollywood ──
            { text: "Why so serious?", source: "The Dark Knight (2008)", fa: "چرا اینقدر جدی؟" },
            { text: "You can't handle the truth!", source: "A Few Good Men (1992)", fa: "تو تاب تحمل حقیقت رو نداری!" },
            { text: "I'll be back.", source: "The Terminator (1984)", fa: "برمی‌گردم." },
            { text: "Houston, we have a problem.", source: "Apollo 13 (1995)", fa: "هوستون، ما یه مشکل داریم." },
            { text: "May the Force be with you.", source: "Star Wars (1977)", fa: "نیرو با تو باشد." },
            { text: "Here's looking at you, kid.", source: "Casablanca (1942)", fa: "به تو نگاه می‌کنم، عزیزم." },
            { text: "Life is like a box of chocolates — you never know what you're gonna get.", source: "Forrest Gump (1994)", fa: "زندگی مثل یه جعبه شکلاته — هیچ‌وقت نمی‌دونی چی توشه." },
            { text: "Get busy living, or get busy dying.", source: "The Shawshank Redemption (1994)", fa: "یا سرگرم زندگی کردن باش، یا سرگرم مردن." },
            { text: "You shall not pass!", source: "The Lord of the Rings: The Fellowship of the Ring (2001)", fa: "رد نخواهی شد!" },
            { text: "With great power comes great responsibility.", source: "Spider-Man (2002)", fa: "قدرت بزرگ، مسئولیت بزرگ می‌آوره." },
            { text: "Hasta la vista, baby.", source: "Terminator 2: Judgment Day (1991)", fa: "خداحافظ، عزیزم." },
            { text: "We accept the love we think we deserve.", source: "The Perks of Being a Wallflower (2012)", fa: "ما عشقی رو که فکر می‌کنیم لایقشیم قبول می‌کنیم." },
            { text: "You is kind, you is smart, you is important.", source: "The Help (2011)", fa: "تو مهربونی، تو باهوشی، تو مهمی." },
            { text: "Don't let anyone ever make you feel like you don't deserve what you want.", source: "10 Things I Hate About You (1999)", fa: "نذار کسی بهت احساس بده که لایق چیزی که می‌خوای نیستی." },
            // ── The Godfather & Crime ──
            { text: "I'm gonna make him an offer he can't refuse.", source: "The Godfather (1972)", fa: "پیشنهادی بهش می‌دم که نتونه ردش کنه." },
            { text: "Keep your friends close, but your enemies closer.", source: "The Godfather Part II (1974)", fa: "دوستانت رو نزدیک نگه دار، اما دشمنانت رو نزدیک‌تر." },
            { text: "Leave the gun. Take the cannoli.", source: "The Godfather (1972)", fa: "اسلحه رو بذار. کانولی رو بردار." },
            { text: "Just when I thought I was out, they pull me back in.", source: "The Godfather Part III (1990)", fa: "درست وقتی فکر می‌کردم بیرون اومدم، دوباره می‌کشنم تو." },
            { text: "You talking to me?", source: "Taxi Driver (1976)", fa: "داری با من حرف می‌زنی؟" },
            { text: "Say hello to my little friend!", source: "Scarface (1983)", fa: "به دوست کوچیک من سلام کن!" },
            // ── Drama & Classics ──
            { text: "After all, tomorrow is another day.", source: "Gone with the Wind (1939)", fa: "به هر حال، فردا روز دیگه‌ایه." },
            { text: "I feel the need — the need for speed!", source: "Top Gun (1986)", fa: "احساس نیاز می‌کنم — نیاز به سرعت!" },
            { text: "Nobody puts Baby in a corner.", source: "Dirty Dancing (1987)", fa: "هیچ‌کس بیبی رو گوشه‌ای نمی‌ذاره." },
            { text: "I'm the king of the world!", source: "Titanic (1997)", fa: "من پادشاه دنیام!" },
            { text: "It's not who I am underneath, but what I do that defines me.", source: "Batman Begins (2005)", fa: "این تعریف من نیست که زیر همه‌چیز کی هستم، بلکه کارهامه." },
            { text: "Why do we fall? So we can learn to pick ourselves up.", source: "Batman Begins (2005)", fa: "چرا می‌افتیم؟ تا یاد بگیریم خودمون رو بلند کنیم." },
            { text: "Some birds aren't meant to be caged.", source: "The Shawshank Redemption (1994)", fa: "بعضی پرنده‌ها برای قفس نیستن." },
            { text: "Hope is a good thing, maybe the best of things, and no good thing ever dies.", source: "The Shawshank Redemption (1994)", fa: "امید چیز خوبیه، شاید بهترین چیز، و هیچ چیز خوبی هرگز نمی‌میره." },
            // ── Sci-Fi & Thriller ──
            { text: "I am your father.", source: "The Empire Strikes Back (1980)", fa: "من پدر تو هستم." },
            { text: "There's no place like home.", source: "The Wizard of Oz (1939)", fa: "هیچ‌جایی مثل خونه نیست." },
            { text: "A census taker once tried to test me. I ate his liver with some fava beans and a nice Chianti.", source: "The Silence of the Lambs (1991)", fa: "یه بار یه نفر سعی کرد منو امتحان کنه. جگرشو با لوبیا و شراب خوردم." },
            { text: "Life finds a way.", source: "Jurassic Park (1993)", fa: "زندگی راهی پیدا می‌کنه." },
            { text: "What we do in life echoes in eternity.", source: "Gladiator (2000)", fa: "کاری که در زندگی انجام می‌دیم در ابدیت طنین می‌اندازه." },
            { text: "Are you not entertained?!", source: "Gladiator (2000)", fa: "آیا سرگرم نشدید؟!" },
            { text: "My precious.", source: "The Lord of the Rings: The Two Towers (2002)", fa: "گنجینه‌ام." },
            { text: "One does not simply walk into Mordor.", source: "The Lord of the Rings: The Fellowship of the Ring (2001)", fa: "کسی به سادگی وارد موردور نمی‌شه." },
            { text: "Not all those who wander are lost.", source: "The Lord of the Rings (2001)", fa: "همه کسانی که سرگردانند گم نشدن." },
            // ── The Matrix ──
            { text: "There is no spoon.", source: "The Matrix (1999)", fa: "قاشقی وجود نداره." },
            { text: "What is real? How do you define real?", source: "The Matrix (1999)", fa: "واقعی چیه؟ چطور واقعی رو تعریف می‌کنی؟" },
            { text: "I know kung fu.", source: "The Matrix (1999)", fa: "کونگ فو بلدم." },
            { text: "Free your mind.", source: "The Matrix (1999)", fa: "ذهنت رو آزاد کن." },
            { text: "Reality is that which, when you stop believing in it, doesn't go away.", source: "Blade Runner (1982)", fa: "واقعیت چیزیه که وقتی باورش نکنی، از بین نمی‌ره." },
            { text: "I've seen things you people wouldn't believe.", source: "Blade Runner (1982)", fa: "چیزایی دیدم که شما باور نمی‌کنید." },
            // ── Inception & Nolan ──
            { text: "You mustn't be afraid to dream a little bigger, darling.", source: "Inception (2010)", fa: "نباید از بزرگ‌تر رویا دیدن بترسی، عزیزم." },
            { text: "An idea is like a virus. Resilient. Highly contagious.", source: "Inception (2010)", fa: "یه ایده مثل ویروسه. سرسخت. خیلی مسری." },
            { text: "A dream within a dream.", source: "Inception (2010)", fa: "رویایی درون رویا." },
            { text: "Love is the one thing that transcends time and space.", source: "Interstellar (2014)", fa: "عشق تنها چیزیه که از زمان و فضا فراتر می‌ره." },
            { text: "We used to look up at the sky and wonder at our place in the stars. Now we just look down and worry about our place in the dirt.", source: "Interstellar (2014)", fa: "قبلاً به آسمان نگاه می‌کردیم و جایگاهمون رو بین ستاره‌ها تصور می‌کردیم. حالا فقط به زمین نگاه می‌کنیم." },
            // ── Romance ──
            { text: "You had me at hello.", source: "Jerry Maguire (1996)", fa: "با همون «سلام» منو داشتی." },
            { text: "You complete me.", source: "Jerry Maguire (1996)", fa: "تو منو کامل می‌کنی." },
            { text: "To me, you are perfect.", source: "Love Actually (2003)", fa: "برای من، تو کاملی." },
            { text: "As you wish.", source: "The Princess Bride (1987)", fa: "هر طور که بخوای." },
            { text: "I wish I could hate you.", source: "The Notebook (2004)", fa: "کاش می‌تونستم ازت متنفر باشم." },
            { text: "If you're a bird, I'm a bird.", source: "The Notebook (2004)", fa: "اگه تو پرنده‌ای، منم پرنده‌ام." },
            { text: "You make me want to be a better man.", source: "As Good as It Gets (1997)", fa: "تو منو ترغیب می‌کنی که مرد بهتری باشم." },
            { text: "Love means never having to say you're sorry.", source: "Love Story (1970)", fa: "عشق یعنی هیچ‌وقت مجبور نباشی عذرخواهی کنی." },
            // ── Fight Club ──
            { text: "It's only after we've lost everything that we're free to do anything.", source: "Fight Club (1999)", fa: "فقط بعد از اینکه همه چیزو از دست دادیم، آزاد می‌شیم هر کاری بکنیم." },
            { text: "The first rule of Fight Club is: you do not talk about Fight Club.", source: "Fight Club (1999)", fa: "قانون اول فایت کلاب اینه که از فایت کلاب حرف نمی‌زنی." },
            { text: "We buy things we don't need with money we don't have to impress people we don't like.", source: "Fight Club (1999)", fa: "چیزایی می‌خریم که نیاز نداریم با پولی که نداریم تا آدمایی رو تحت تأثیر بذاریم که دوستشون نداریم." },
            // ── Harry Potter ──
            { text: "It does not do to dwell on dreams and forget to live.", source: "Harry Potter and the Philosopher's Stone (2001)", fa: "درست نیست که در رویاها غوطه‌ور بشیم و از زندگی کردن غافل بشیم." },
            { text: "It is our choices that show what we truly are, far more than our abilities.", source: "Harry Potter and the Chamber of Secrets (2002)", fa: "این انتخاب‌هامونه که نشون می‌ده واقعاً کی هستیم، خیلی بیشتر از توانایی‌هامون." },
            { text: "Always.", source: "Harry Potter and the Deathly Hallows (2011)", fa: "همیشه." },
            { text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.", source: "Harry Potter and the Prisoner of Azkaban (2004)", fa: "حتی در تاریک‌ترین زمان‌ها هم می‌شه شادی پیدا کرد، اگه فقط یادت باشه چراغ رو روشن کنی." },
            { text: "After all this time? Always.", source: "Harry Potter and the Deathly Hallows (2011)", fa: "بعد از این همه وقت؟ همیشه." },
            // ── Marvel / DC ──
            { text: "I am Iron Man.", source: "Iron Man (2008)", fa: "من آیرون من هستم." },
            { text: "Part of the journey is the end.", source: "Avengers: Endgame (2019)", fa: "بخشی از سفر، پایانه." },
            { text: "I can do this all day.", source: "Captain America: The First Avenger (2011)", fa: "می‌تونم تمام روز ادامه بدم." },
            { text: "We are Groot.", source: "Guardians of the Galaxy (2014)", fa: "ما گروت هستیم." },
            { text: "Whatever it takes.", source: "Avengers: Endgame (2019)", fa: "هر طور که بشه." },
            { text: "I choose to run towards my problems, and not away from them.", source: "Thor: Ragnarok (2017)", fa: "من انتخاب می‌کنم به سمت مشکلاتم بدوم، نه ازشون فرار کنم." },
            // ── Game of Thrones ──
            { text: "Winter is coming.", source: "Game of Thrones (2011)", fa: "زمستان داره میاد." },
            { text: "I drink and I know things.", source: "Game of Thrones (2011)", fa: "می‌نوشم و می‌دونم." },
            { text: "A Lannister always pays his debts.", source: "Game of Thrones (2011)", fa: "لنیستر همیشه بدهیش رو پس می‌ده." },
            { text: "All men must die.", source: "Game of Thrones (2011)", fa: "همه مردان باید بمیرند." },
            { text: "When you play the game of thrones, you win or you die.", source: "Game of Thrones (2011)", fa: "وقتی بازی تخت‌ها رو بازی می‌کنی، یا می‌بری یا می‌میری." },
            { text: "The night is dark and full of terrors.", source: "Game of Thrones (2011)", fa: "شب تاریک و پر از وحشته." },
            { text: "Chaos isn't a pit. Chaos is a ladder.", source: "Game of Thrones (2011)", fa: "آشوب چاه نیست. آشوب یه نردبونه." },
            // ── Breaking Bad ──
            { text: "I am not in danger, Skyler. I am the danger.", source: "Breaking Bad (2008)", fa: "من در خطر نیستم، اسکایلر. من خود خطرم." },
            { text: "I am the one who knocks.", source: "Breaking Bad (2008)", fa: "منم که می‌زنم." },
            { text: "Say my name.", source: "Breaking Bad (2008)", fa: "اسمم رو بگو." },
            { text: "Science, bitch!", source: "Breaking Bad (2008)", fa: "علمه، احمق!" },
            { text: "Stay out of my territory.", source: "Breaking Bad (2008)", fa: "از قلمروی من بیرون بمون." },
            { text: "I did it for me. I liked it. I was good at it. And I was really… I was alive.", source: "Breaking Bad (2008)", fa: "برای خودم انجام دادم. دوستش داشتم. توش خوب بودم. و واقعاً... زنده بودم." },
            // ── Friends ──
            { text: "We were on a break!", source: "Friends (1994)", fa: "ما داشتیم استراحت می‌کردیم!" },
            { text: "How you doin'?", source: "Friends (1994)", fa: "حالت چطوره؟" },
            { text: "They don't know that we know they know we know.", source: "Friends (1994)", fa: "نمی‌دونن که ما می‌دونیم که اون‌ها می‌دونن که ما می‌دونیم." },
            // ── The Office ──
            { text: "That's what she said.", source: "The Office (2005)", fa: "این رو اون گفت." },
            { text: "I am Beyoncé, always.", source: "The Office (2005)", fa: "من همیشه بیانسه‌ام." },
            { text: "Identity theft is not a joke, Jim!", source: "The Office (2005)", fa: "سرقت هویت شوخی نیست، جیم!" },
            { text: "Would I rather be feared or loved? Easy — both. I want people to be afraid of how much they love me.", source: "The Office (2005)", fa: "ترجیح می‌دم بترسن یا دوستم داشته باشن؟ راحتن — هر دو." },
            // ── Pulp Fiction & Tarantino ──
            { text: "Ezekiel 25:17. The path of the righteous man…", source: "Pulp Fiction (1994)", fa: "حزقیال ۲۵:۱۷. مسیر مرد درستکار..." },
            { text: "Royale with Cheese.", source: "Pulp Fiction (1994)", fa: "رویال با پنیر." },
            { text: "You know what they call a Quarter Pounder with Cheese in Paris? Royale with Cheese.", source: "Pulp Fiction (1994)", fa: "می‌دونی در پاریس به کوارتر پاندر با پنیر چی می‌گن؟ رویال با پنیر." },
            { text: "Revenge is a dish best served cold.", source: "Kill Bill (2003)", fa: "انتقام بهتره سرد سرو بشه." },
            // ── Forrest Gump ──
            { text: "Stupid is as stupid does.", source: "Forrest Gump (1994)", fa: "احمق کسیه که کار احمقانه می‌کنه." },
            { text: "I'm not a smart man, but I know what love is.", source: "Forrest Gump (1994)", fa: "آدم باهوشی نیستم، ولی می‌دونم عشق چیه." },
            { text: "Run, Forrest, run!", source: "Forrest Gump (1994)", fa: "بدو، فارست، بدو!" },
            // ── Joker & Dark Knight ──
            { text: "Madness, as you know, is like gravity — all it takes is a little push.", source: "The Dark Knight (2008)", fa: "دیوانگی، همون‌طور که می‌دونی، مثل جاذبه‌ست — فقط یه هل کوچیک لازمه." },
            { text: "Some men just want to watch the world burn.", source: "The Dark Knight (2008)", fa: "بعضی آدم‌ها فقط می‌خوان دنیا رو بسوزونن." },
            { text: "If you're good at something, never do it for free.", source: "The Dark Knight (2008)", fa: "اگه در کاری مهارت داری، هرگز مجانی انجامش نده." },
            { text: "I used to think that my life was a tragedy, but now I realize it's a comedy.", source: "Joker (2019)", fa: "قبلاً فکر می‌کردم زندگیم یه تراژدیه، اما حالا می‌فهمم که کمدیه." },
            // ── World Cinema ──
            { text: "Every wall is a door.", source: "Parasite (2019)", fa: "هر دیواری یه دره." },
            { text: "You know what kind of plan never fails? No plan.", source: "Parasite (2019)", fa: "می‌دونی چه جور برنامه‌ای هرگز شکست نمی‌خوره؟ بی‌برنامگی." },
            { text: "La vita è bella.", source: "Life is Beautiful (1997)", fa: "زندگی زیباست." },
            { text: "Whoever saves one life saves the world entire.", source: "Schindler's List (1993)", fa: "هر کس یک جان نجات دهد، گویی تمام جهان را نجات داده." },
            { text: "The world is full of nice people. If you can't find one, be one.", source: "Cinema Paradiso (1988)", fa: "دنیا پر از آدم‌های خوبه. اگه نمی‌تونی پیداشون کنی، خودت یکی باش." },
            // ── Anime & Animation ──
            { text: "The world is not beautiful, and therefore it is.", source: "Kino's Journey", fa: "دنیا زیبا نیست. به همین خاطر زیباست." },
            { text: "People's dreams never end!", source: "One Piece", fa: "رویاهای آدم‌ها هرگز تموم نمیشن!" },
            { text: "I'll take a potato chip... and eat it!", source: "Death Note (2006)", fa: "یه چیپس برمی‌دارم... و می‌خورمش!" },
            { text: "No matter how deep the night, it always turns to day, eventually.", source: "One Piece", fa: "هر چقدر شب عمیق باشه، در نهایت به روز تبدیل میشه." },
            { text: "Believe in the me that believes in you.", source: "Gurren Lagann", fa: "به منی ایمان داشته باش که به تو ایمان داره." },
            { text: "The only way to truly escape the mundane is for you to constantly be evolving.", source: "Ghost in the Shell (1995)", fa: "تنها راه فرار واقعی از پیش‌پاافتادگی اینه که دائماً در حال تکامل باشی." },
            // ── Succession ──
            { text: "I'm going to be the eldest son I never got to be.", source: "Succession (2018)", fa: "قراره اون پسر ارشدی باشم که هرگز نشدم." },
            { text: "You are not serious people.", source: "Succession (2018)", fa: "شما آدم‌های جدی نیستید." },
            // ── Better Call Saul / The Wire ──
            { text: "It's all good, man.", source: "Better Call Saul (2015)", fa: "همه چیز خوبه." },
            { text: "Omar's coming.", source: "The Wire (2002)", fa: "اومار داره میاد." },
            { text: "A man's got to have a code.", source: "The Wire (2002)", fa: "آدم باید یه کد داشته باشه." },
            // ── Chernobyl ──
            { text: "What is the cost of lies? It's not that we'll mistake them for the truth.", source: "Chernobyl (2019)", fa: "هزینه دروغ‌ها چیه؟ اینه که ممکنه با حقیقت اشتباهشون بگیریم." },
            { text: "Every lie we tell incurs a debt to the truth.", source: "Chernobyl (2019)", fa: "هر دروغی که می‌گیم یه بدهی به حقیقت ایجاد می‌کنه." },
            // ── Modern Movies ──
            { text: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.", source: "Rocky Balboa (2006)", fa: "مهم نیست چقدر محکم می‌زنی. مهمه چقدر محکم می‌خوری و به جلو ادامه می‌دی." },
            { text: "Everything everywhere all at once.", source: "Everything Everywhere All at Once (2022)", fa: "همه چیز، همه جا، همه با هم." },
            { text: "We are all capable of the most extraordinary things.", source: "1917 (2019)", fa: "همه ما قادریم کارهای استثنایی انجام بدیم." },
            { text: "Just keep swimming.", source: "Finding Nemo (2003)", fa: "فقط به شنا کردن ادامه بده." },
            { text: "To infinity and beyond!", source: "Toy Story (1995)", fa: "تا بی‌نهایت و فراتر از اون!" },
            { text: "You can't sit with us!", source: "Mean Girls (2004)", fa: "نمی‌تونی اینجا بشینی!" },
            { text: "On Wednesdays we wear pink.", source: "Mean Girls (2004)", fa: "چهارشنبه‌ها صورتی می‌پوشیم." },
            { text: "I volunteer as tribute.", source: "The Hunger Games (2012)", fa: "من داوطلب می‌شم." },
            // ── Notebook / Fault in Our Stars ──
            { text: "So it's not gonna be easy. It's going to be really hard. We're gonna have to work at this every day.", source: "The Notebook (2004)", fa: "پس آسون نیست. واقعاً سخته. باید هر روز روش کار کنیم." },
            { text: "Okay? Okay.", source: "The Fault in Our Stars (2014)", fa: "خوبه؟ خوبه." },
            { text: "I fell in love the way you fall asleep: slowly, and then all at once.", source: "The Fault in Our Stars (2014)", fa: "عاشق شدم همون‌طور که به خواب می‌ری: آروم آروم، و بعد یه‌دفعه." },
            // ── Wall Street & Finance ──
            { text: "Greed, for lack of a better word, is good.", source: "Wall Street (1987)", fa: "طمع، برای نبود کلمه بهتر، خوبه." },
            { text: "The market can stay irrational longer than you can stay solvent.", source: "Margin Call (2011)", fa: "بازار می‌تونه غیرمنطقی بمونه بیشتر از اینکه تو بتونی حلال باشی." },
            // ── The Truman Show / Eternal Sunshine ──
            { text: "In case I don't see ya, good afternoon, good evening and goodnight!", source: "The Truman Show (1998)", fa: "در صورتی که نبینمت، خداحافظ بعدازظهر، خداحافظ عصر، و شب بخیر!" },
            { text: "How about this for a paradox: the brain is a mind-blowing organ.", source: "Eternal Sunshine of the Spotless Mind (2004)", fa: "این یه پارادوکسه: مغز یه عضو شگفت‌انگیزه." },
            { text: "Meet me in Montauk.", source: "Eternal Sunshine of the Spotless Mind (2004)", fa: "توی مونتاک پیداُم کن." },
            // ── Whiplash ──
            { text: "There are no two words in the English language more harmful than 'good job'.", source: "Whiplash (2014)", fa: "هیچ دو کلمه‌ای در انگلیسی مضرتر از 'کار خوبی کردی' نیست." },
            { text: "Not quite my tempo.", source: "Whiplash (2014)", fa: "دقیقاً تمپوی من نیست." },
            // ── No Country for Old Men ──
            { text: "What's the most you ever lost on a coin toss?", source: "No Country for Old Men (2007)", fa: "بیشترین چیزی که تو یه شیر یا خط از دست دادی چی بود؟" },
            { text: "You don't have to do this.", source: "No Country for Old Men (2007)", fa: "مجبور نیستی این کارو بکنی." },
            // ── Dune ──
            { text: "I must not fear. Fear is the mind-killer.", source: "Dune (2021)", fa: "نباید بترسم. ترس قاتل ذهن است." },
            { text: "The spice must flow.", source: "Dune (2021)", fa: "ادویه باید جاری بشه." },
            // ── Oppenheimer ──
            { text: "Now I am become Death, the destroyer of worlds.", source: "Oppenheimer (2023)", fa: "حالا من مرگ شده‌ام، نابودکننده جهان‌ها." },
            { text: "I don't know if we can be trusted with such a thing.", source: "Oppenheimer (2023)", fa: "نمی‌دونم آیا می‌تونیم به چنین چیزی اعتماد بشه." },
            // ── The Prestige ──
            { text: "Are you watching closely?", source: "The Prestige (2006)", fa: "با دقت نگاه می‌کنی؟" },
            { text: "Every magic trick consists of three acts.", source: "The Prestige (2006)", fa: "هر شعبده‌بازی از سه پرده تشکیل می‌شه." },
            // ── Gran Torino / Eastwood ──
            { text: "Get off my lawn.", source: "Gran Torino (2008)", fa: "از چمنم برو بیرون." },
            { text: "Go ahead, make my day.", source: "Sudden Impact (1983)", fa: "بزن به جاده، روزم رو بساز." },
            // ── Cast Away / Wilson ──
            { text: "I'm going to make fire.", source: "Cast Away (2000)", fa: "قراره آتیش درست کنم." },
            // ── The Pursuit of Happyness ──
            { text: "Don't ever let somebody tell you you can't do something. You got a dream, you gotta protect it.", source: "The Pursuit of Happyness (2006)", fa: "هرگز نذار کسی بهت بگه نمی‌تونی کاری بکنی. اگه رویا داری، باید ازش محافظت کنی." },
            // ── Moonlight ──
            { text: "At some point, you gotta decide for yourself who you gonna be.", source: "Moonlight (2016)", fa: "در یه نقطه‌ای باید خودت تصمیم بگیری که کی می‌خوای باشی." },
            // ── La La Land ──
            { text: "Here's to the ones who dream, foolish as they may seem.", source: "La La Land (2016)", fa: "به کسانی که رویا می‌بینند، هر چقدر هم که احمقانه به نظر برسه." },
            { text: "City of stars, are you shining just for me?", source: "La La Land (2016)", fa: "شهر ستاره‌ها، آیا فقط برای من می‌درخشی؟" },
            // ── Arrival ──
            { text: "If you could see your whole life from start to finish, would you change things?", source: "Arrival (2016)", fa: "اگه می‌تونستی تمام زندگیت رو از اول تا آخر ببینی، چیزی رو عوض می‌کردی؟" },
            // ── The Martian ──
            { text: "I'm going to have to science the shit out of this.", source: "The Martian (2015)", fa: "باید با علم از پسش بربیام." },
            // ── 12 Angry Men ──
            { text: "It's always difficult to keep personal prejudice out of a thing like this.", source: "12 Angry Men (1957)", fa: "همیشه سخته که تعصب شخصی رو از چنین چیزی دور نگه داری." },
            // ── Gravity ──
            { text: "I know — I get it now. The hardest part about being lost, is knowing that somewhere, someone is trying to find you.", source: "Gravity (2013)", fa: "می‌فهمم — حالا می‌فهمم. سخت‌ترین قسمت گم بودن اینه که بدونی یه جایی کسی داره دنبالت می‌گرده." },
            // ── Schindler's List ──
            { text: "Whoever saves one life saves the world entire.", source: "Schindler's List (1993)", fa: "هر کس یک جان نجات دهد، گویی تمام جهان را نجات داده." },
            { text: "Power is when we have every justification to kill, and we don't.", source: "Schindler's List (1993)", fa: "قدرت اینه که هر توجیهی برای کشتن داشته باشیم، و نکشیم." },
            // ── Braveheart ──
            { text: "They may take our lives, but they'll never take our freedom!", source: "Braveheart (1995)", fa: "شاید زندگیمون رو بگیرن، اما هرگز آزادیمون رو نخواهند گرفت!" },
            // ── The Social Network ──
            { text: "A million dollars isn't cool. You know what's cool? A billion dollars.", source: "The Social Network (2010)", fa: "یه میلیون دلار باحال نیست. می‌دونی چی باحاله؟ یه میلیارد دلار." },
            { text: "I need the algorithm by Monday.", source: "The Social Network (2010)", fa: "تا دوشنبه الگوریتم رو می‌خوام." },
            // ── The Grand Budapest Hotel ──
            { text: "You see, there are still faint glimmers of civilization left in this barbaric slaughterhouse.", source: "The Grand Budapest Hotel (2014)", fa: "می‌بینی، هنوز نشانه‌های کمرنگی از تمدن در این کشتارگاه وحشیانه باقی مونده." },
            // ── Se7en ──
            { text: "What's in the box?!", source: "Se7en (1995)", fa: "توی جعبه چیه؟!" },
            // ── Good Will Hunting ──
            { text: "It's not your fault.", source: "Good Will Hunting (1997)", fa: "تقصیر تو نیست." },
            { text: "Real loss is only possible when you love something more than you love yourself.", source: "Good Will Hunting (1997)", fa: "از دست دادن واقعی فقط وقتی ممکنه که چیزی رو بیشتر از خودت دوست داشته باشی." },
            // ── Inside Out ──
            { text: "Do you ever look at someone and wonder, what is going on inside their head?", source: "Inside Out (2015)", fa: "تا حالا به کسی نگاه کردی و گفتی، توی ذهنش داره چی می‌گذره؟" },
            { text: "Crying helps me slow down and obsess over the weight of life's problems.", source: "Inside Out (2015)", fa: "گریه کمکم می‌کنه کند بشم و به سنگینی مشکلات زندگی فکر کنم." },
            // ── Persian Cinema ──
            { text: "زندگی آرزوهای ماست که روی پرده نقره‌ای می‌افتن.", source: "ممبان (1974)", fa: "زندگی آرزوهای ماست که روی پرده نقره‌ای می‌افتن." },
            { text: "من جایی رو نمی‌شناسم که بهش بگم خونه.", source: "گاو (1969)", fa: "من جایی رو نمی‌شناسم که بهش بگم خونه." },
            { text: "این دنیا برای خودشه، نه برای ما.", source: "دایی‌جان ناپلئون (1976)", fa: "این دنیا برای خودشه، نه برای ما." },
            { text: "آدم باید به اندازه‌ای که نفس می‌کشه، زندگی کنه.", source: "مادر (1989)", fa: "آدم باید به اندازه‌ای که نفس می‌کشه، زندگی کنه." },
            { text: "عشق یعنی بی‌قیدی.", source: "لیلا (1996)", fa: "عشق یعنی بی‌قیدی." },
            // ── Ted Lasso / Squid Game ──
            { text: "Taking on a challenge is a lot like riding a horse. If you're comfortable while you're doing it, you're probably doing it wrong.", source: "Ted Lasso (2020)", fa: "پذیرفتن یه چالش خیلی شبیه سواری روی اسبه. اگه راحتی، احتمالاً اشتباه انجامش می‌دی." },
            { text: "Believe.", source: "Ted Lasso (2020)", fa: "باور کن." },
            { text: "I'd rather have a life of 'oh wells' than a life of 'what ifs'.", source: "Ted Lasso (2020)", fa: "ترجیح می‌دم زندگیم پر از 'خب باشه' باشه تا 'ای کاش'." },
            { text: "In this game, the weak are prey.", source: "Squid Game (2021)", fa: "توی این بازی، ضعیف‌ها طعمه‌ان." },
            // ── Top Gun Maverick ──
            { text: "Don't think. Just do.", source: "Top Gun: Maverick (2022)", fa: "فکر نکن. فقط انجامش بده." },
            { text: "It's not the plane, it's the pilot.", source: "Top Gun: Maverick (2022)", fa: "هواپیما مهم نیست، خلبانه." },
        ];
        // ─── QOTD STATE ───────────────────────────────────────────────────────────
        let qotdCurrentId   = null;
        let qotdCurrentType = 'movie';
        let _qotdSeenIdx    = [];   // anti-repeat tracker

        function openQOTDDetail() {
            if (qotdCurrentId) openDetail(qotdCurrentId, qotdCurrentType);
        }

        // Pick a random unseen quote index
        function _nextQOTDIdx() {
            if (_qotdSeenIdx.length >= QUOTES.length) _qotdSeenIdx = [];
            let idx, tries = 0;
            do { idx = Math.floor(Math.random() * QUOTES.length); tries++; }
            while (_qotdSeenIdx.includes(idx) && tries < 60);
            _qotdSeenIdx.push(idx);
            return idx;
        }

        // Fetch backdrop + poster from TMDB
        async function setQOTDBackground(title) {
            try {
                const srcTitle = title.replace(/\s*\(\d{4}\)$/, '');
                let item = null;
                let sd = await getData(`search/movie?query=${encodeURIComponent(srcTitle)}&page=1`);
                if (sd && sd.results && sd.results.length > 0) {
                    item = sd.results[0]; qotdCurrentId = item.id; qotdCurrentType = 'movie';
                } else {
                    sd = await getData(`search/tv?query=${encodeURIComponent(srcTitle)}&page=1`);
                    if (sd && sd.results && sd.results.length > 0) {
                        item = sd.results[0]; qotdCurrentId = item.id; qotdCurrentType = 'tv';
                    }
                }
                if (item) {
                    const bgEl = document.getElementById('qotd-bg');
                    if (bgEl && item.backdrop_path) {
                        bgEl.style.backgroundImage = `url(${IMG_LG}${item.backdrop_path})`;
                        bgEl.classList.add('loaded');
                    }
                    let posterEl = document.getElementById('qotd-poster-img');
                    if (!posterEl) {
                        posterEl = document.createElement('img');
                        posterEl.id = 'qotd-poster-img';
                        posterEl.className = 'qotd-poster-hint';
                        posterEl.onclick = (e) => { e.stopPropagation(); openQOTDDetail(); };
                        const section = document.getElementById('qotd-section');
                        if (section) section.appendChild(posterEl);
                    }
                    posterEl.src   = item.poster_path ? IMG_SM + item.poster_path : '';
                    posterEl.style.display = item.poster_path ? 'block' : 'none';
                }
            } catch(e) {}
        }

        // Update UI labels based on current language
        function _updateQOTDUI() {
            const isFa = (typeof LANG !== 'undefined' && LANG === 'fa') ||
                         document.body.classList.contains('lang-fa');
            const translateBtn  = document.getElementById('qotd-translate-btn');
            const translateLbl  = document.getElementById('qotd-translate-label');
            const copyLbl       = document.getElementById('qotd-copy-label');
            const shareLbl      = document.getElementById('qotd-share-label');
            if (translateBtn) translateBtn.style.display = isFa ? 'flex' : 'none';
            if (translateLbl && !window._qotdTranslated) translateLbl.textContent = isFa ? 'فارسی' : 'Translate';
            if (copyLbl)  copyLbl.textContent  = isFa ? 'کپی'      : 'Copy';
            if (shareLbl) shareLbl.textContent = isFa ? 'اشتراک'   : 'Share';
        }

        // Display a quote
        async function _displayQOTD(quote) {
            window._currentQOTD  = quote;
            window._qotdTranslated = false;

            document.getElementById('qotd-text').textContent = '"' + quote.text + '"';
            const srcEl = document.getElementById('qotd-source');
            if (srcEl) srcEl.innerHTML = '— <span style="color:#ffffff;text-decoration:underline;text-underline-offset:2px;">' + quote.source + '</span>';

            const faEl = document.getElementById('qotd-fa-text');
            if (faEl) { faEl.style.display = 'none'; faEl.textContent = ''; }

            _updateQOTDUI();

            // Background fade-in
            qotdCurrentId = null;
            const bgEl = document.getElementById('qotd-bg');
            if (bgEl) { bgEl.classList.remove('loaded'); bgEl.style.backgroundImage = ''; }
            await setQOTDBackground(quote.source);
        }

        async function refreshQOTD() {
            const idx   = _nextQOTDIdx();
            const quote = QUOTES[idx];
            localStorage.setItem('qotd_' + new Date().toDateString(), JSON.stringify(quote));
            await _displayQOTD(quote);
        }

        async function loadQuoteOfDay(forceNew) {
            const today    = new Date().toDateString();
            const cacheKey = 'qotd_' + today;
            let quote;
            if (!forceNew) {
                try { const c = localStorage.getItem(cacheKey); if (c) quote = JSON.parse(c); } catch(e) {}
            }
            if (!quote) { quote = QUOTES[_nextQOTDIdx()]; localStorage.setItem(cacheKey, JSON.stringify(quote)); }
            await _displayQOTD(quote);

            // Auto-rotate every 60 seconds
            if (window._qotdAutoTimer) clearInterval(window._qotdAutoTimer);
            window._qotdAutoTimer = setInterval(async () => {
                await refreshQOTD();
            }, 60000);
        }

        async function translateQOTD() {
            const q     = window._currentQOTD;
            const faEl  = document.getElementById('qotd-fa-text');
            const tLbl  = document.getElementById('qotd-translate-label');
            if (!q || !faEl) return;

            if (window._qotdTranslated) {
                faEl.style.display = 'none';
                if (tLbl) tLbl.textContent = 'فارسی';
                window._qotdTranslated = false;
                return;
            }

            if (q.fa) {
                faEl.textContent   = '« ' + q.fa + ' »';
                faEl.style.display = 'block';
                if (tLbl) tLbl.textContent = 'انگلیسی';
                window._qotdTranslated = true;
                return;
            }

            // Fallback: MyMemory API
            if (tLbl) tLbl.textContent = '...';
            try {
                const resp = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.text)}&langpair=en|fa`);
                const data = await resp.json();
                const tr   = data.responseData && data.responseData.translatedText;
                if (tr && tr !== q.text) {
                    faEl.textContent = '« ' + tr + ' »'; faEl.style.display = 'block';
                    if (tLbl) tLbl.textContent = 'انگلیسی';
                    window._qotdTranslated = true; q.fa = tr;
                } else { if (tLbl) tLbl.textContent = 'فارسی'; }
            } catch(e) { if (tLbl) tLbl.textContent = 'فارسی'; }
        }

        function copyQOTD() {
            const q = window._currentQOTD;
            if (!q) return;
            const isFa  = document.body.classList.contains('lang-fa');
            const faRaw = document.getElementById('qotd-fa-text');
            const faStr = (faRaw && faRaw.textContent && faRaw.style.display !== 'none') ? faRaw.textContent : (q.fa || '');
            let text;
            if (isFa) {
                text = `"${q.text}"\n${faStr ? '\n' + faStr + '\n' : ''}— ${q.source}\n\n⭐ via Family Night`;
            } else {
                text = `"${q.text}"\n— ${q.source}\n\n⭐ via Family Night`;
            }
            const doFeedback = () => {
                const lbl = document.getElementById('qotd-copy-label');
                const orig = lbl ? lbl.textContent : '';
                if (lbl) lbl.textContent = isFa ? 'کپی شد!' : 'Copied!';
                setTimeout(() => { if (lbl) lbl.textContent = orig; }, 2000);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(doFeedback).catch(() => {
                    const ta = document.createElement('textarea');
                    ta.value = text; document.body.appendChild(ta); ta.select();
                    document.execCommand('copy'); document.body.removeChild(ta); doFeedback();
                });
            } else {
                const ta = document.createElement('textarea');
                ta.value = text; document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta); doFeedback();
            }
        }

        async function shareQOTD() {
            const q    = window._currentQOTD;
            if (!q) return;
            const isFa = document.body.classList.contains('lang-fa');
            const faEl = document.getElementById('qotd-fa-text');
            const faStr = (faEl && faEl.textContent && faEl.style.display !== 'none')
                          ? faEl.textContent : (q.fa ? '« ' + q.fa + ' »' : '');
            const shareText = isFa
                ? `"${q.text}"\n\n${faStr}\n\n— ${q.source}\n\n⭐ via Family Night`
                : `"${q.text}"\n\n— ${q.source}\n\n⭐ via Family Night`;
            if (navigator.share) {
                try { await navigator.share({ title: 'Family Night', text: shareText }); } catch(e) {}
            } else {
                navigator.clipboard && navigator.clipboard.writeText(shareText).catch(() => {});
                const lbl = document.getElementById('qotd-share-label');
                const orig = lbl ? lbl.textContent : '';
                if (lbl) lbl.textContent = isFa ? 'کپی شد!' : 'Copied!';
                setTimeout(() => { if (lbl) lbl.textContent = orig; }, 2000);
            }
        }

        // Watch for language class changes and refresh QOTD labels
        (function() {
            const obs = new MutationObserver(() => _updateQOTDUI());
            obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        })();
        // ─────────────────────────────────────────────────────────────────────────
        // ---- 15. TIME CAPSULE ----
        // Shamsi (Solar Hijri) date converter
        function gregorianToShamsi(gy, gm, gd) {
            const g_d_m = [31,28,31,30,31,30,31,31,30,31,30,31];
            let jy, jm, jd;
            gy -= 1600; gm -= 1; gd -= 1;
            let g_day_no = 365*gy + Math.floor((gy+3)/4) - Math.floor((gy+99)/100) + Math.floor((gy+399)/400);
            for(let i=0; i<gm; i++) g_day_no += g_d_m[i];
            if(gm>1 && ((gy+1600)%4===0 && ((gy+1600)%100!==0 || (gy+1600)%400===0))) g_day_no++;
            g_day_no += gd;
            let j_day_no = g_day_no - 79;
            let j_np = Math.floor(j_day_no/12053);
            j_day_no %= 12053;
            jy = 979 + 33*j_np + 4*Math.floor(j_day_no/1461);
            j_day_no %= 1461;
            if(j_day_no >= 366) { jy += Math.floor((j_day_no-1)/365); j_day_no = (j_day_no-1)%365; }
            let i;
            for(i=0; i<11 && j_day_no >= [31,29,31,30,31,30,31,29,31,30,31][i]; ++i) j_day_no -= [31,29,31,30,31,30,31,29,31,30,31][i];
            jm = i+1; jd = j_day_no+1;
            return { y: jy, m: jm, d: jd };
        }
        
        function getTodayDateText() {
            const now = new Date();
            const gy = now.getFullYear(), gm = now.getMonth()+1, gd = now.getDate();
            const months_en = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const months_fa = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
            const shamsi = gregorianToShamsi(gy, gm, gd);
            if (LANG === 'fa') {
                return `${gd} ${months_en[gm-1]} ${gy} | ${shamsi.d} ${months_fa[shamsi.m-1]} ${shamsi.y}`;
            } else {
                return `${months_en[gm-1]} ${gd}, ${gy}`;
            }
        }
        
        // Get Tehran date (UTC+3:30)
        function getTehranDate() {
            const now = new Date();
            // Tehran is UTC+3:30 = 210 minutes
            const tehranOffset = 210;
            const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
            const tehranMs = utcMs + tehranOffset * 60000;
            return new Date(tehranMs);
        }
        

        
        // ---- 16. SMART CACHE ----
        const API_CACHE = {};
        const API_CACHE_TTL = 5 * 60 * 1000; // 5 min
        
        // ---- 17. COMPARE TWO MOVIES ----
        let compareItems = [];
        
        function addToCompare() {
            haptic(20);
            if (!curId || !curDataForFav) return;
            
            const item = {
                id: curId,
                type: curType,
                title: curTitle,
                data: curDataForFav
            };
            
            if (compareItems.length === 0) {
                compareItems.push(item);
                showToast(LANG === 'fa' ? `"${curTitle}" برای مقایسه انتخاب شد. اثر دوم رو باز کن!` : `"${curTitle}" selected. Open another to compare!`);
            } else if (compareItems.length === 1) {
                if (compareItems[0].id === curId) {
                    showToast(LANG === 'fa' ? 'یک اثر دیگر انتخاب کن!' : 'Select a different title!');
                    return;
                }
                compareItems.push(item);
                showCompareModal();
            }
        }

        // ---- Compare search picker: pick the 2nd title via live search instead of manual navigation ----
        let comparePickerTimeout = null;
        function openComparePicker() {
            haptic(20);
            if (!curId || !curDataForFav) return;
            compareItems = [{ id: curId, type: curType, title: curTitle, data: curDataForFav }];
            const picker = document.getElementById('compare-picker');
            const titleEl = document.getElementById('cmp-picker-title');
            const input = document.getElementById('cmp-picker-input');
            const results = document.getElementById('cmp-picker-results');
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-code-compare" style="color:var(--primary,#E50914);margin-left:6px;"></i>' + (LANG === 'fa' ? 'انتخاب اثر دوم برای مقایسه' : 'Pick a second title to compare');
            if (input) { input.value = ''; input.placeholder = LANG === 'fa' ? 'نام فیلم یا سریال...' : 'Movie or TV show name...'; }
            if (results) results.innerHTML = '';
            if (picker) picker.style.display = 'flex';
            setTimeout(() => { if (input) input.focus(); }, 200);
        }
        function closeComparePicker() {
            const picker = document.getElementById('compare-picker');
            if (picker) picker.style.display = 'none';
        }
        function doCompareSearch(q) {
            if (comparePickerTimeout) clearTimeout(comparePickerTimeout);
            const results = document.getElementById('cmp-picker-results');
            if (!q || q.trim().length === 0) {
                if (results) results.innerHTML = '';
                return;
            }
            if (results) results.innerHTML = '<div style="padding:20px;text-align:center;color:#555;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary,#E50914);"></i></div>';
            comparePickerTimeout = setTimeout(async () => {
                try {
                    let d = await getData('search/multi?query=' + encodeURIComponent(q));
                    let allResults = (d && d.results) ? d.results : [];
                    // Also search English when query has non-Latin/non-Persian script, same fallback as the main Search tab
                    if (/[^\x00-\x7F\u0600-\u06FF]/.test(q)) {
                        try {
                            const dEn = await getData('search/multi?query=' + encodeURIComponent(q) + '&language=en-US');
                            if (dEn && dEn.results) {
                                const existingIds = new Set(allResults.map(r => r.id));
                                dEn.results.forEach(r => { if (!existingIds.has(r.id)) allResults.push(r); });
                            }
                        } catch(e2) {}
                    }
                    allResults = allResults.filter(r => r && (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path && r.id !== curId);
                    allResults.sort((a,b) => (b.popularity||0) - (a.popularity||0));
                    renderComparePickerResults(allResults.slice(0, 20));
                } catch(e) {
                    if (results) results.innerHTML = '<div style="padding:20px;text-align:center;color:#555;font-size:12px;">' + (LANG==='fa'?'خطا در جستجو':'Search error') + '</div>';
                }
            }, 250);
        }
        function renderComparePickerResults(list) {
            const results = document.getElementById('cmp-picker-results');
            if (!results) return;
            if (!list.length) {
                results.innerHTML = '<div style="padding:20px;text-align:center;color:#555;font-size:12px;">' + (LANG==='fa'?'موردی پیدا نشد':'No results found') + '</div>';
                return;
            }
            results.innerHTML = list.map(r => {
                const title = r.title || r.name || '?';
                const year = ((r.release_date || r.first_air_date || '').split('-')[0]) || '—';
                const rate = r.vote_average ? r.vote_average.toFixed(1) : '—';
                const poster = r.poster_path ? (IMG + r.poster_path) : '';
                return `<div onclick="selectCompareResult(${r.id}, '${r.media_type}')" style="display:flex;align-items:center;gap:12px;background:#1c1c1c;border-radius:12px;padding:8px;cursor:pointer;">
                    <img src="${poster}" style="width:46px;height:66px;object-fit:cover;border-radius:6px;background:#0d0d0d;flex-shrink:0;">
                    <div style="flex:1;min-width:0;">
                        <div style="color:#fff;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
                        <div style="color:#999;font-size:11px;margin-top:3px;display:flex;align-items:center;gap:8px;">
                            <span>${year}</span>
                            <span><i class="fa-solid fa-star" style="color:#f5c518;"></i> ${rate}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
        async function selectCompareResult(id, type) {
            haptic(20);
            if (compareItems.length !== 1 || compareItems[0].id === id) return;
            const results = document.getElementById('cmp-picker-results');
            if (results) results.innerHTML = '<div style="padding:20px;text-align:center;color:#555;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--primary,#E50914);"></i></div>';
            try {
                const fd = await getData(type + '/' + id + '?append_to_response=external_ids');
                if (!fd || !fd.id) throw new Error('no data');
                compareItems.push({ id: id, type: type, title: fd.title || fd.name || '', data: fd });
                closeComparePicker();
                showCompareModal();
            } catch(e) {
                if (results) results.innerHTML = '<div style="padding:20px;text-align:center;color:#555;font-size:12px;">' + (LANG==='fa'?'خطا در بارگذاری اطلاعات':'Failed to load details') + '</div>';
            }
        }
        
        async function showCompareModal() {
            const modal = document.getElementById('compare-modal');
            const content = document.getElementById('compare-content');
            modal.classList.add('open');
            
            const [a, b] = compareItems;
            const aData = a.data;
            const bData = b.data;
            
            const aYear = (aData.release_date || aData.first_air_date || '').split('-')[0];
            const bYear = (bData.release_date || bData.first_air_date || '').split('-')[0];
            const aRate = parseFloat(aData.vote_average || 0);
            const bRate = parseFloat(bData.vote_average || 0);
            const aVotes = parseInt(aData.vote_count || 0);
            const bVotes = parseInt(bData.vote_count || 0);
            const aRuntime = aData.runtime || 0;
            const bRuntime = bData.runtime || 0;
            
            // Show initial content
            content.innerHTML = `
                <div class="compare-col">
                    <img src="${IMG_LG + aData.poster_path}" class="compare-poster" loading="lazy">
                    <div class="compare-name">${a.title}</div>
                </div>
                <div class="compare-col">
                    <img src="${IMG_LG + bData.poster_path}" class="compare-poster" loading="lazy">
                    <div class="compare-name">${b.title}</div>
                </div>
                <div class="compare-col" style="background:#0d0d0d; grid-column:1/-1; text-align:center; padding:10px; color:#666; font-size:12px;">
                    <i class="fa-solid fa-spinner fa-spin"></i> ${LANG === 'fa' ? 'در حال بارگذاری اطلاعات کامل...' : 'Loading full data...'}
                </div>
            `;
            
            const winStyle = 'color:#4ade80; font-weight:900;';
            const loseStyle = 'color:#888;';
            
            const row = (label, aVal, bVal, aWin) => {
                const aIsWin = aWin === true;
                const bIsWin = aWin === false;
                return `
                    <div class="compare-col" style="background:#0d0d0d;">
                        <div class="compare-row">
                            <div class="compare-key">${label}</div>
                            <div class="compare-val" style="${aIsWin ? winStyle : loseStyle}">${aVal} ${aIsWin ? '✓' : ''}</div>
                        </div>
                    </div>
                    <div class="compare-col" style="background:#0d0d0d;">
                        <div class="compare-row">
                            <div class="compare-key">${label}</div>
                            <div class="compare-val" style="${bIsWin ? winStyle : loseStyle}">${bVal} ${bIsWin ? '✓' : ''}</div>
                        </div>
                    </div>
                `;
            };
            
            // Fetch additional data from OMDb for both
            let aOmdb = null, bOmdb = null;
            try {
                const aImdb = aData.external_ids ? aData.external_ids.imdb_id : null;
                const bImdb = bData.external_ids ? bData.external_ids.imdb_id : null;
                if (aImdb) { const r = await fetch(`https://www.omdbapi.com/?i=${aImdb}&apikey=f6dd47c8`); aOmdb = await r.json(); }
                if (bImdb) { const r = await fetch(`https://www.omdbapi.com/?i=${bImdb}&apikey=f6dd47c8`); bOmdb = await r.json(); }
            } catch(e) {}
            
            // Parse OMDb data
            const getRTScore = (omdb) => {
                if (!omdb || !omdb.Ratings) return null;
                const rt = omdb.Ratings.find(r => r.Source === 'Rotten Tomatoes');
                return rt ? parseInt(rt.Value) : null;
            };
            const getMetaScore = (omdb) => omdb && omdb.Metascore && omdb.Metascore !== 'N/A' ? parseInt(omdb.Metascore) : null;
            const getAwards = (omdb) => {
                if (!omdb || !omdb.Awards || omdb.Awards === 'N/A') return { wins: 0, noms: 0 };
                const winsM = omdb.Awards.match(/(\d+)\s+win/i);
                const nomsM = omdb.Awards.match(/(\d+)\s+nomination/i);
                return { wins: winsM ? parseInt(winsM[1]) : 0, noms: nomsM ? parseInt(nomsM[1]) : 0 };
            };
            
            const aRT = getRTScore(aOmdb);
            const bRT = getRTScore(bOmdb);
            const aMeta = getMetaScore(aOmdb);
            const bMeta = getMetaScore(bOmdb);
            const aAwards = getAwards(aOmdb);
            const bAwards = getAwards(bOmdb);
            
            const colorRT = (score) => {
                if (score === null) return '—';
                const color = score >= 75 ? '#4ade80' : score >= 60 ? '#facc15' : '#f87171';
                return `<span style="color:${color};font-weight:bold;">${score}%</span>`;
            };
            const colorMeta = (score) => {
                if (score === null) return '—';
                const color = score >= 61 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171';
                return `<span style="background:${color};color:${score>=61?'#000':'#000'};padding:2px 6px;border-radius:4px;font-weight:bold;">${score}</span>`;
            };
            
            content.innerHTML = `
                <div class="compare-col">
                    <img src="${IMG_LG + aData.poster_path}" class="compare-poster" loading="lazy">
                    <div class="compare-name">${a.title}</div>
                </div>
                <div class="compare-col">
                    <img src="${IMG_LG + bData.poster_path}" class="compare-poster" loading="lazy">
                    <div class="compare-name">${b.title}</div>
                </div>
                ${row('📅 ' + (LANG==='fa'?'سال':'Year'), aYear, bYear, parseInt(aYear||0) > parseInt(bYear||0))}
                ${row('⭐ IMDb', aRate.toFixed(1), bRate.toFixed(1), aRate >= bRate)}
                ${row('🗳️ ' + (LANG==='fa'?'آرا':'Votes'), aVotes.toLocaleString(), bVotes.toLocaleString(), aVotes >= bVotes)}
                ${aRuntime > 0 || bRuntime > 0 ? row('⏱️ ' + (LANG==='fa'?'مدت':'Runtime'), aRuntime ? aRuntime+'min' : '—', bRuntime ? bRuntime+'min' : '—', aRuntime >= bRuntime) : ''}
                ${aRT !== null || bRT !== null ? `
                <div class="compare-col" style="background:#0d0d0d;">
                    <div class="compare-row">
                        <div class="compare-key">🍅 Rotten Tomatoes</div>
                        <div class="compare-val">${colorRT(aRT)}</div>
                    </div>
                </div>
                <div class="compare-col" style="background:#0d0d0d;">
                    <div class="compare-row">
                        <div class="compare-key">🍅 Rotten Tomatoes</div>
                        <div class="compare-val">${colorRT(bRT)}</div>
                    </div>
                </div>` : ''}
                ${aMeta !== null || bMeta !== null ? `
                <div class="compare-col" style="background:#0d0d0d;">
                    <div class="compare-row">
                        <div class="compare-key">🎯 Metacritic</div>
                        <div class="compare-val">${colorMeta(aMeta)}</div>
                    </div>
                </div>
                <div class="compare-col" style="background:#0d0d0d;">
                    <div class="compare-row">
                        <div class="compare-key">🎯 Metacritic</div>
                        <div class="compare-val">${colorMeta(bMeta)}</div>
                    </div>
                </div>` : ''}
                ${row('🏆 ' + (LANG==='fa'?'جوایز کسب‌شده':'Awards Won'), aAwards.wins.toString(), bAwards.wins.toString(), aAwards.wins >= bAwards.wins)}
                ${row('🎖️ ' + (LANG==='fa'?'نامزدی‌ها':'Nominations'), aAwards.noms.toString(), bAwards.noms.toString(), aAwards.noms >= bAwards.noms)}
                <div style="grid-column:1/-1; padding:16px;">
                    <button id="compare-ai-btn" onclick="runCompareAI()" style="width:100%;padding:14px;background:linear-gradient(135deg,#1a0a33,#3a1070);border:1px solid rgba(168,85,247,0.4);border-radius:14px;color:white;font-size:14px;font-weight:bold;cursor:pointer;font-family:'Vazirmatn',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;transition:0.2s;">
                        <div style="width:22px;height:22px;background:linear-gradient(135deg,#7c3aed,#4285f4,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;">✦</div>
                        ${LANG==='fa' ? 'از هوش مصنوعی بپرس کدام بهتره؟' : 'Ask AI: Which one is better?'}
                    </button>
                    <div id="compare-ai-result" style="display:none;margin-top:14px;padding:14px;background:rgba(100,50,200,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:12px;">
                        <div style="font-size:11px;color:#a855f7;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                            <div style="width:16px;height:16px;background:linear-gradient(135deg,#7c3aed,#4285f4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">✦</div>
                            ${LANG==='fa' ? 'نظر هوش مصنوعی' : 'AI Analysis'}
                        </div>
                        <div id="compare-ai-text" style="font-size:13px;color:#e0e0e0;line-height:1.8;white-space:pre-wrap;"></div>
                    </div>
                </div>
            `;
            
            compareItems = [];
            // Store data for AI analysis
            window._compareDataForAI = { a, b, aData, bData, aRate, bRate, aVotes, bVotes, aRuntime, bRuntime, aAwards, bAwards, aRT, bRT, aMeta, bMeta, aYear, bYear };
        }
        
        // ---- AI COMPARE FUNCTION ----
        async function runCompareAI() {
            const btn = document.getElementById('compare-ai-btn');
            const resultBox = document.getElementById('compare-ai-result');
            const textEl = document.getElementById('compare-ai-text');
            if (!window._compareDataForAI || !btn || !resultBox || !textEl) return;

            const cd = window._compareDataForAI;
            const isFA = LANG === 'fa';
            
            btn.disabled = true;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isFA ? 'در حال تحلیل...' : 'Analyzing...'}`;
            
            resultBox.style.display = 'block';
            textEl.innerHTML = '<div style="display:flex;gap:4px;align-items:center;padding:8px 0;"><div style="width:8px;height:8px;border-radius:50%;background:#a855f7;animation:aiDotBounce 1.2s ease infinite;"></div><div style="width:8px;height:8px;border-radius:50%;background:#4285f4;animation:aiDotBounce 1.2s ease infinite;animation-delay:0.2s;"></div><div style="width:8px;height:8px;border-radius:50%;background:#06b6d4;animation:aiDotBounce 1.2s ease infinite;animation-delay:0.4s;"></div></div>';
            
            const prompt = isFA 
                ? `دو اثر سینمایی زیر را مقایسه کن و بگو کدام بهتر است:

اثر اول: "${cd.a.title}" (${cd.aYear})
- امتیاز IMDb: ${cd.aRate.toFixed(1)}
- آرا: ${cd.aVotes.toLocaleString()}
- مدت: ${cd.aRuntime ? cd.aRuntime + ' دقیقه' : 'نامشخص'}
- جوایز کسب‌شده: ${cd.aAwards.hasData ? cd.aAwards.wins : 'نامشخص'}
- نامزدی: ${cd.aAwards.hasData ? cd.aAwards.noms : 'نامشخص'}
${cd.aRT !== null ? '- Rotten Tomatoes: ' + cd.aRT + '%' : ''}
${cd.aMeta !== null ? '- Metacritic: ' + cd.aMeta : ''}

اثر دوم: "${cd.b.title}" (${cd.bYear})
- امتیاز IMDb: ${cd.bRate.toFixed(1)}
- آرا: ${cd.bVotes.toLocaleString()}
- مدت: ${cd.bRuntime ? cd.bRuntime + ' دقیقه' : 'نامشخص'}
- جوایز کسب‌شده: ${cd.bAwards.hasData ? cd.bAwards.wins : 'نامشخص'}
- نامزدی: ${cd.bAwards.hasData ? cd.bAwards.noms : 'نامشخص'}
${cd.bRT !== null ? '- Rotten Tomatoes: ' + cd.bRT + '%' : ''}
${cd.bMeta !== null ? '- Metacritic: ' + cd.bMeta : ''}

لطفاً به فارسی تحلیل کن: مزایا و معایب هر کدام را بنویس، برای چه مخاطبی کدام بهتر است، و در نهایت نظر کلی خودت را بگو. حدوداً ۲۰۰-۳۰۰ کلمه.`
                : `Compare these two films and tell me which is better:

Film 1: "${cd.a.title}" (${cd.aYear})
- IMDb: ${cd.aRate.toFixed(1)}
- Votes: ${cd.aVotes.toLocaleString()}
- Runtime: ${cd.aRuntime ? cd.aRuntime + ' min' : 'N/A'}
- Awards Won: ${cd.aAwards.hasData ? cd.aAwards.wins : 'unknown'}
- Nominations: ${cd.aAwards.hasData ? cd.aAwards.noms : 'unknown'}
${cd.aRT !== null ? '- Rotten Tomatoes: ' + cd.aRT + '%' : ''}
${cd.aMeta !== null ? '- Metacritic: ' + cd.aMeta : ''}

Film 2: "${cd.b.title}" (${cd.bYear})
- IMDb: ${cd.bRate.toFixed(1)}
- Votes: ${cd.bVotes.toLocaleString()}
- Runtime: ${cd.bRuntime ? cd.bRuntime + ' min' : 'N/A'}
- Awards Won: ${cd.bAwards.hasData ? cd.bAwards.wins : 'unknown'}
- Nominations: ${cd.bAwards.hasData ? cd.bAwards.noms : 'unknown'}
${cd.bRT !== null ? '- Rotten Tomatoes: ' + cd.bRT + '%' : ''}
${cd.bMeta !== null ? '- Metacritic: ' + cd.bMeta : ''}

Analyze the pros and cons of each, for whom each is better, and give your overall verdict. About 200-300 words.`;

            // Typewriter effect function
            function typeWriter(text, el, delay = 12) {
                let i = 0;
                el.textContent = '';
                const interval = setInterval(() => {
                    if (i < text.length) {
                        el.textContent += text[i];
                        i++;
                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        clearInterval(interval);
                    }
                }, delay);
            }

            let aiText = null;

            // FN-CF-AI: Cloudflare first, then Pollinations below (kept as backup).
            try { const cfT = await _aiGenerateText(prompt, { maxTokens: 700, temperature: 0.7, timeout: 45000 }); if (cfT && cfT.length > 30) aiText = cfT; } catch(eCF) {}
            // Method 1: Pollinations GET (only if Cloudflare gave nothing)
            if (!aiText) try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 20000);
                const r = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai-large&seed=42&nologo=true', { signal: ctrl.signal });
                clearTimeout(tid);
                if (r.ok) { const t = await r.text(); if (t && t.length > 30) aiText = t; }
            } catch(e) {}

            // Method 2: Pollinations POST
            if (!aiText || aiText.length < 50) {
                try {
                    const ctrl2 = new AbortController();
                    const tid2 = setTimeout(() => ctrl2.abort(), 20000);
                    const r2 = await fetch('https://text.pollinations.ai/openai', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl2.signal,
                        body: JSON.stringify({ model: 'openai-large', messages: [{ role: 'user', content: prompt }], max_tokens: 700, temperature: 0.7 })
                    });
                    clearTimeout(tid2);
                    if (r2.ok) { const d2 = await r2.json(); aiText = d2.choices && d2.choices[0] && d2.choices[0].message && d2.choices[0].message.content; }
                } catch(e2) {}
            }

            // Method 3: DuckDuckGo AI fallback
            if (!aiText || aiText.length < 50) {
                try {
                    // Build a local analysis based on the data
                    const aScore = cd.aRate * 10 + (cd.aVotes / 10000) + cd.aAwards.wins * 5 + cd.aAwards.noms * 2 + (cd.aRT || 0) * 0.3 + (cd.aMeta || 0) * 0.2;
                    const bScore = cd.bRate * 10 + (cd.bVotes / 10000) + cd.bAwards.wins * 5 + cd.bAwards.noms * 2 + (cd.bRT || 0) * 0.3 + (cd.bMeta || 0) * 0.2;
                    const winner = aScore >= bScore ? cd.a.title : cd.b.title;
                    const loser = aScore >= bScore ? cd.b.title : cd.a.title;
                    if (isFA) {
                        aiText = `📊 تحلیل بر اساس داده‌های موجود:\n\n🎬 ${cd.a.title} (${cd.aYear})\nامتیاز IMDb: ${cd.aRate.toFixed(1)} | آرا: ${cd.aVotes.toLocaleString()} | جوایز: ${cd.aAwards.hasData ? cd.aAwards.wins : '—'} | نامزدی: ${cd.aAwards.hasData ? cd.aAwards.noms : '—'}${cd.aRT!==null?' | RT: '+cd.aRT+'%':''}${cd.aMeta!==null?' | MC: '+cd.aMeta:''}\n\n🎬 ${cd.b.title} (${cd.bYear})\nامتیاز IMDb: ${cd.bRate.toFixed(1)} | آرا: ${cd.bVotes.toLocaleString()} | جوایز: ${cd.bAwards.hasData ? cd.bAwards.wins : '—'} | نامزدی: ${cd.bAwards.hasData ? cd.bAwards.noms : '—'}${cd.bRT!==null?' | RT: '+cd.bRT+'%':''}${cd.bMeta!==null?' | MC: '+cd.bMeta:''}\n\n🏆 نتیجه: بر اساس مجموع امتیازات، آرا، جوایز و نامزدی‌ها، "${winner}" در مجموع امتیاز بالاتری دارد. البته این یک مقایسه عددی است و سلیقه شخصی در انتخاب نهایی اهمیت دارد.`;
                    } else {
                        aiText = `📊 Data-based Analysis:\n\n🎬 ${cd.a.title} (${cd.aYear})\nIMDb: ${cd.aRate.toFixed(1)} | Votes: ${cd.aVotes.toLocaleString()} | Awards: ${cd.aAwards.hasData ? cd.aAwards.wins : '—'} | Noms: ${cd.aAwards.hasData ? cd.aAwards.noms : '—'}${cd.aRT!==null?' | RT: '+cd.aRT+'%':''}${cd.aMeta!==null?' | MC: '+cd.aMeta:''}\n\n🎬 ${cd.b.title} (${cd.bYear})\nIMDb: ${cd.bRate.toFixed(1)} | Votes: ${cd.bVotes.toLocaleString()} | Awards: ${cd.bAwards.hasData ? cd.bAwards.wins : '—'} | Noms: ${cd.bAwards.hasData ? cd.bAwards.noms : '—'}${cd.bRT!==null?' | RT: '+cd.bRT+'%':''}${cd.bMeta!==null?' | MC: '+cd.bMeta:''}\n\n🏆 Verdict: Based on combined ratings, vote counts, awards and nominations, "${winner}" scores higher overall. This is a quantitative comparison — personal taste still plays a role in your final choice.`;
                    }
                } catch(e3) {}
            }

            btn.disabled = false;
            btn.innerHTML = `<div style="width:22px;height:22px;background:linear-gradient(135deg,#7c3aed,#4285f4,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;">✦</div> ${isFA ? 'تحلیل مجدد' : 'Re-analyze'}`;

            if (aiText && aiText.length > 20) {
                aiText = aiText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/^#{1,3}\s/gm, '').trim();
                // FN-FIX3: show at once (typewriter took ~20s for a long answer and raced with translate).
                window._compareAiOriginal = aiText;
                window._compareAiTranslated = null;
                textEl.textContent = aiText;
                var tw = document.getElementById('compare-ai-translate-wrap'); if (tw) tw.style.display = 'block';
                var tb = document.getElementById('compare-ai-translate-btn'); if (tb) { tb.disabled = false; tb.textContent = isFA ? '🌐 Translate to English' : '🌐 ترجمه به فارسی'; }
            } else {
                textEl.textContent = isFA ? 'خطا در دریافت تحلیل. لطفاً دوباره تلاش کنید.' : 'Could not get AI analysis. Please try again.';
            }
        }
        // FN-FIX3: translate the compare AI text to the other language in one tap, via Cloudflare AI.
        window.translateCompareAI = async function() {
            var textEl = document.getElementById('compare-ai-text');
            var btn = document.getElementById('compare-ai-translate-btn');
            if (!textEl || !window._compareAiOriginal) return;
            var appFa = (typeof LANG !== 'undefined' && LANG === 'fa');
            if (window._compareAiTranslated) {
                textEl.textContent = window._compareAiOriginal;
                window._compareAiTranslated = null;
                if (btn) btn.textContent = appFa ? '🌐 Translate to English' : '🌐 ترجمه به فارسی';
                return;
            }
            var toFa = !appFa;
            if (btn) { btn.disabled = true; btn.textContent = toFa ? '⏳ در حال ترجمه...' : '⏳ Translating...'; }
            try {
                var prompt = toFa
                    ? 'Translate the following film comparison analysis to fluent, natural Persian. Keep film titles in their original English form. Do not add, remove or invent facts. Keep the same structure and verdict.\n\n' + window._compareAiOriginal
                    : 'Translate the following film comparison analysis to fluent, natural English. Keep film titles in their original form. Do not add, remove or invent facts. Keep the same structure and verdict.\n\n' + window._compareAiOriginal;
                var tr = await _aiGenerateText(prompt, { maxTokens: 900, temperature: 0.2, timeout: 45000 });
                if (tr && tr.trim().length > 20) {
                    window._compareAiTranslated = tr.trim();
                    textEl.textContent = tr.trim();
                    if (btn) btn.textContent = toFa ? '↩️ نمایش متن اصلی' : '↩️ Show original';
                } else if (btn) btn.textContent = toFa ? '🌐 ترجمه به فارسی (ناموفق، دوباره بزن)' : '🌐 Translate to English (failed, try again)';
            } catch(e) { if (btn) btn.textContent = toFa ? '🌐 ترجمه ناموفق بود، دوباره تلاش کن' : '🌐 Translation failed, try again'; }
            if (btn) btn.disabled = false;
        };
        // =================== END AI COMPARE ===================
        function getActiveMyListData() {
            var tab = _myListCurrentTab || 'fav';
            var isFA = LANG === 'fa';
            if (tab === 'rated') {
                return { key: 'rated', title: isFA ? 'امتیازداده' : 'Rated', items: Object.keys(personalRatings || {}).map(function(id) { var rating = personalRatings[id]; return Object.assign({ id: id }, rating); }) };
            }
            if (tab === 'watchlater') return { key: 'watch-later', title: isFA ? 'بعداً ببینم' : 'Watch Later', items: watchlist || [] };
            if (tab === 'recent') return { key: 'recently', title: isFA ? 'اخیراً دیده‌شده' : 'Recently', items: recentlyViewed || [] };
            return { key: 'liked', title: isFA ? 'لایک‌شده' : 'Liked', items: favorites || [] };
        }

        function exportWatchlist() {
            haptic(15);
            var activeList = getActiveMyListData();
            const data = {
                list: activeList.key,
                items: activeList.items,
                exportDate: new Date().toISOString(),
                app: 'Family Night v13'
            };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'family-night-' + activeList.key + '.json';
            a.click();
            URL.revokeObjectURL(url);
            showToast(LANG === 'fa' ? '✅ لیست صادر شد' : '✅ List exported');
        }
        
        function shareWatchlist() {
            haptic(15);
            var activeList = getActiveMyListData();
            if (activeList.items.length === 0) {
                showToast(LANG === 'fa' ? 'لیست خالی است!' : 'This list is empty!');
                return;
            }
            let text = LANG === 'fa' ? ('🎬 لیست ' + activeList.title + ' من:\n\n') : ('🎬 My ' + activeList.title + ' List:\n\n');
            activeList.items.slice(0, 15).forEach((f, i) => {
                text += `${i+1}. ${f.title || f.name}\n`;
            });
            text += '\n— via Family Night';
            
            const tgUrl = `https://t.me/share/url?url=https://t.me/HashtagAlireza&text=${encodeURIComponent(text)}`;
            window.open(tgUrl, '_blank');
        }
        
        // ---- 19. ACHIEVEMENTS / BADGES ----
        const BADGES = [
            { id: 'cinema_buff', icon: '🎬', name: 'سینماگر', nameEn: 'Cinema Buff', desc: '10 movies in list / ۱۰ فیلم به لیست', threshold: 10, check: () => favorites.length >= 10 },
            { id: 'critic', icon: '⭐', name: 'منتقد', nameEn: 'Critic', desc: '10 ratings / ۱۰ امتیاز', threshold: 10, check: () => Object.keys(personalRatings).length >= 10 },
            { id: 'explorer', icon: '🌍', name: 'کاشف', nameEn: 'Explorer', desc: '50 watched / ۵۰ فیلم دیده', threshold: 50, check: () => getWatchHistory().length >= 50 },
            { id: 'binge', icon: '📺', name: 'سریال‌باز', nameEn: 'Binge Watcher', desc: '5 series in list / ۵ سریال', threshold: 5, check: () => favorites.filter(f => f.type === 'tv').length >= 5 },
            { id: 'history_buff', icon: '🕰️', name: 'تاریخ‌دان', nameEn: 'History Buff', desc: '10+ searches / ۱۰۰ جستجو', threshold: 100, check: () => searchHistory.length >= 10 },
            { id: 'perfectionist', icon: '💎', name: 'کمال‌گرا', nameEn: 'Perfectionist', desc: '5 stars to 5 films / ۵ ستاره ۵ فیلم', threshold: 5, check: () => Object.values(personalRatings).filter(r => r.stars === 5).length >= 5 },
        ];
        
        function openBadges() {
            const isFa = LANG === 'fa';
            const earnedCount = BADGES.filter(b => b.check()).length;
            
            const BADGE_ICONS = {
                cinema_buff: 'fa-solid fa-film',
                critic: 'fa-solid fa-star-half-stroke',
                explorer: 'fa-solid fa-earth-americas',
                binge: 'fa-solid fa-tv',
                history_buff: 'fa-solid fa-clock-rotate-left',
                perfectionist: 'fa-solid fa-gem',
            };
            
            const grid = document.createElement('div');
            grid.className = 'badge-grid';
            
            BADGES.forEach((b, idx) => {
                const earned = b.check();
                const iconClass = BADGE_ICONS[b.id] || 'fa-solid fa-trophy';
                const card = document.createElement('div');
                card.className = `badge-card ${earned ? 'earned' : 'locked'}`;
                card.style.animationDelay = `${idx * 0.07}s`;
                card.style.animation = `badge-card-in 0.5s cubic-bezier(0.23,1,0.32,1) both`;
                card.innerHTML = `
                    <div class="badge-icon-wrap">
                        <div class="badge-lock-ring"></div>
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="badge-name">${earned ? b.name : (isFa ? b.name : (b.nameEn || b.name))}</div>
                    <div class="badge-desc">${b.desc}</div>
                    <div class="badge-progress">${earned ? (isFa ? '✦ UNLOCKED' : '✦ UNLOCKED') : (isFa ? '🔒 قفل' : '🔒 LOCKED')}</div>
                `;
                grid.appendChild(card);
            });
            
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:700;overflow-y:auto;';
            overlay.innerHTML = `
                <div class="badge-overlay-header">
                    <div>
                        <div class="badge-overlay-title">${isFa ? '🏆 افتخارات من' : '🏆 My Achievements'}</div>
                    </div>
                    <div class="badge-close-btn" onclick="this.closest('div[style]').remove()">
                        <i class="fa-solid fa-times" style="color:white;font-size:14px;"></i>
                    </div>
                </div>
                <div class="badge-summary">
                    <div>
                        <div class="badge-summary-count">${earnedCount}/${BADGES.length}</div>
                        <div class="badge-summary-label">${isFa ? 'افتخارات کسب شده' : 'Badges Earned'}</div>
                    </div>
                    <div style="flex:1;">
                        <div class="badge-progress-bar-wrap" style="margin:0;">
                            <div class="badge-progress-bar-fill" style="width:${Math.round(earnedCount/BADGES.length*100)}%"></div>
                        </div>
                        <div style="font-size:10px;color:#555;margin-top:5px;">${Math.round(earnedCount/BADGES.length*100)}% ${isFa?'کامل':'Complete'}</div>
                    </div>
                </div>
            `;
            overlay.querySelector('.badge-summary').after(grid);
            document.body.appendChild(overlay);
        }
;
