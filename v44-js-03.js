function populateKeywordsSidebar() {
            const list = document.getElementById('sb-keywords-list');
            list.innerHTML = '<div style="padding:10px 20px;color:#888;font-size:11px;">' + (LANG === 'fa' ? 'در حال بارگذاری...' : 'Loading...') + '</div>';
            
            // Sort alphabetically by current language
            const sorted = [...ALL_KEYWORDS].sort((a, b) => {
                const nameA = LANG === 'fa' ? a.fa : a.en;
                const nameB = LANG === 'fa' ? b.fa : b.en;
                return nameA.localeCompare(nameB, LANG === 'fa' ? 'fa' : 'en');
            });
            
            // Remove duplicates by ID (keep first occurrence after sort)
            const seenIds = new Set();
            const seenEn = new Set();
            const unique = sorted.filter(k => {
                if (seenIds.has(k.id) || seenEn.has(k.en)) return false;
                seenIds.add(k.id);
                seenEn.add(k.en);
                return true;
            });
            
            list.innerHTML = unique.map(k => {
                const displayName = LANG === 'fa' ? k.fa : k.en;
                const subName = LANG === 'fa' ? `<span style="font-size:10px;color:#666;margin-right:4px;">${k.en}</span>` : '';
                return `<div class="sb-sub-item" onclick="searchByKeyword(${k.id}, '${k.en.replace(/'/g,"\\'")}'); toggleMenu()">
                    ${displayName} ${subName}
                </div>`;
            }).join('');
        }
        function populateSidebar() {
            const t = TEXTS[LANG];
            const genres = [
                {id:'28', n:t.R_act || (LANG==='fa'?'اکشن':'Action')},
                {id:'35', n:t.R_com || (LANG==='fa'?'کمدی':'Comedy')},
                {id:'27', n:t.R_hor || (LANG==='fa'?'ترسناک':'Horror')},
                {id:'18', n:t.R_dra || (LANG==='fa'?'درام':'Drama')},
                {id:'878', n:t.R_sci || (LANG==='fa'?'علمی تخیلی':'Sci-Fi')},
                {id:'16', n:t.R_ani || (LANG==='fa'?'انیمیشن':'Animation')},
                {id:'10749', n:t.R_rom || (LANG==='fa'?'عاشقانه':'Romance')},
                {id:'53', n: LANG==='fa' ? 'هیجان‌انگیز':'Thriller'},
                {id:'80', n: LANG==='fa' ? 'جنایی':'Crime'},
                {id:'99', n:t.R_doc || (LANG==='fa'?'مستند':'Documentary')},
                {id:'10751', n:t.R_fam || (LANG==='fa'?'خانوادگی':'Family')},
                {id:'14', n:t.R_fan || (LANG==='fa'?'فانتزی':'Fantasy')},
                {id:'36', n:t.R_bio || (LANG==='fa'?'تاریخی':'History')},
                {id:'10752', n:t.R_war || (LANG==='fa'?'جنگی':'War')},
                {id:'9648', n: LANG==='fa' ? 'رمز و راز':'Mystery'},
                {id:'12', n: LANG==='fa' ? 'ماجراجویی':'Adventure'},
                {id:'10402', n: LANG==='fa' ? 'موزیکال':'Music'},
                {id:'37', n: LANG==='fa' ? 'وسترن':'Western'},
                {id:'10770', n: LANG==='fa' ? 'فیلم تلویزیونی':'TV Movie'},
                {id:'anime_movie', n: LANG==='fa' ? 'انیمه (سینمایی)':'Anime Movies'},
                {id:'anime_series', n: LANG==='fa' ? 'انیمه (سریال)':'Anime Series'},

            ];
            const list = document.getElementById('sb-cats');
            list.innerHTML = '';
            genres.forEach(g => {
                let fn = '';
                const gn = g.n.replace(/'/g, "\'");
                if (g.id === 'anime_movie') {
                    fn = "openGenericGrid('movie','discover/movie?with_genres=16&with_original_language=ja&sort_by=popularity.desc','" + gn + "');toggleMenu()";
                } else if (g.id === 'anime_series') {
                    fn = "openGenericGrid('tv','discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc','" + gn + "');toggleMenu()";
                } else if (g.id === 'live_action_movie') {
                    fn = "openGenericGrid('movie','discover/movie?without_genres=16&sort_by=popularity.desc','" + gn + "');toggleMenu()";
                } else if (g.id === 'live_action_series') {
                    fn = "openGenericGrid('tv','discover/tv?without_genres=16&sort_by=popularity.desc','" + gn + "');toggleMenu()";
                } else {
                    fn = "openGenericGrid('movie','discover/movie?with_genres=" + g.id + "&sort_by=popularity.desc','" + gn + "');toggleMenu()";
                }
                list.innerHTML += '<div class="sb-sub-item" onclick="' + fn + '">' + _homeIconMarkup((g.id==='28'?'act':g.id==='35'?'com':g.id==='27'?'hor':g.id==='18'?'dra':g.id==='878'?'sci':g.id==='16'?'ani':g.id==='10749'?'rom':g.id==='10751'?'fam':g.id==='14'?'fan':g.id==='36'?'bio':g.id==='10752'?'war':g.id==='99'?'docs':'trending_now')) + _homeCategoryTitle(g.n) + '</div>';
            });

            // ── Append every category that exists on the Home page so the
            // sidebar Categories list mirrors Home exactly. Uses the same
            // query strings as renderHome()'s sections array. ──
            const homeCats = [
                { q: `trending/all/day`, t: LANG === 'fa' ? '🔥 الان داغه (Trending)' : '🔥 Trending Right Now', type: 'movie' },
                { q: `discover/movie?sort_by=primary_release_date.desc&vote_count.gte=10&include_adult=false`, t: LANG === 'fa' ? '🎬 جدیدترین فیلم‌ها' : '🎬 Latest Movies', type: 'movie' },
                { q: `custom:updated_series`, t: t.updates, type: 'tv' },
                { q: `custom:top_movies`, t: t.R_topM, type: 'movie' },
                { q: `custom:top_tv`, t: t.R_topS, type: 'tv' },
                { q: `custom:miniseries`, t: t.miniSeries, type: 'tv' },
                { q: `custom:emmy`, t: t.R_emmy, type: 'tv' },
                { q: `custom:oscar`, t: t.R_oscar, type: 'movie' },
                { q: `custom:golden_globe`, t: t.R_golden, type: 'mixed' },
                { q: `custom:academy_award`, t: t.R_academy, type: 'movie' },
                { q: `custom:survival`, t: t.R_surv, type: 'mixed' },
                { q: _homeCatQ('movie', null, 1920, 1929), t: t.R_20s, type: 'movie' },
                { q: _homeCatQ('movie', null, 1930, 1939), t: t.R_30s, type: 'movie' },
                { q: _homeCatQ('movie', null, 1940, 1949), t: t.R_40s, type: 'movie' },
                { q: _homeCatQ('movie', null, 1950, 1959), t: t.R_50s, type: 'movie' },
                { q: `custom:decade:1960:1969`, t: t.R_60s, type: 'movie' },
                { q: `custom:decade:1970:1979`, t: t.R_70s, type: 'movie' },
                { q: `custom:decade:1980:1989`, t: t.R_80s, type: 'movie' },
                { q: `custom:decade:1990:1999`, t: t.R_90s, type: 'movie' },
                { q: `custom:best_decade:2000:2009`, t: t.R_00s, type: 'movie' },
                { q: `custom:best_decade:2010:2020`, t: t.R_10s, type: 'movie' },
                { q: _homeCatQ('movie', '28'), t: t.R_act, type: 'movie' },
                { q: _homeCatQ('movie', '35'), t: t.R_com, type: 'movie' },
                { q: _homeCatQ('movie', '27'), t: t.R_hor, type: 'movie' },
                { q: _homeCatQ('movie', '18'), t: t.R_dra, type: 'movie' },
                { q: 'custom:heartbreak_loss', t: t.R_heartbreak, type: 'mixed' },
                { q: _homeCatQ('movie', '878'), t: t.R_sci, type: 'movie' },
                { q: _homeCatQ('movie', '16'), t: t.R_ani, type: 'movie' },
                { q: _homeCatQ('tv', '16', null, null, 'ja'), t: t.R_anime, type: 'tv' },
                { q: _homeCatQ('movie', '10749'), t: t.R_rom, type: 'movie' },
                { q: _homeCatQ('movie', '10751'), t: t.R_fam, type: 'movie' },
                { q: `custom:sports`, t: t.R_sports, type: 'movie' },
                { q: `custom:mental_health`, t: t.R_mental, type: 'movie' },
                { q: _homeCatQ('movie', '14'), t: t.R_fan, type: 'movie' },
                { q: _homeCatQ('movie', '10752'), t: t.R_war, type: 'movie' },
                { q: _homeCatQ('movie', '36'), t: t.R_bio, type: 'movie' },
                { q: `custom:documentaries`, t: t.R_docs, type: 'movie' },
                { q: `custom:romcom`, t: t.R_romcom, type: 'movie' },
                { q: `custom:parody`, t: t.R_parody, type: 'movie' },
                { q: `custom:christmas_time`, t: t.R_christmas, type: 'mixed' },
                { q: `custom:apocalypse`, t: t.R_apocalypse, type: 'mixed' },
                { q: _homeCatQ('movie', null, null, null, 'fa'), t: t.R_iran, type: 'movie' },
                { q: 'custom:iran_pre1978', t: t.R_iran_pre1978, type: 'mixed' },
                { q: _homeCatQ('movie', null, null, null, 'hi'), t: t.R_india, type: 'movie' },
                { q: _homeCatQ('movie', null, null, null, 'zh|ko|ja|th'), t: t.R_asia, type: 'movie' },
                { q: `custom:a24`, t: t.R_a24, type: 'mixed' },
                { q: _homeCatQ('movie', null, null, null).replace('sort_by=popularity.desc','sort_by=primary_release_date.desc').replace('&fn_home_mix=1','') + `&with_companies=420|7505`, t: t.R_marvel, type: 'movie' },
                { q: _homeCatQ('tv', null, null, null).replace('sort_by=popularity.desc','sort_by=first_air_date.desc').replace('&fn_home_mix=1','') + `&with_companies=420|19551`, t: t.R_marvelTV, type: 'tv' },
                { q: _homeCatQ('movie', null, null, null).replace('sort_by=popularity.desc','sort_by=primary_release_date.desc').replace('&fn_home_mix=1','') + `&with_companies=429|9993|128064|2806`, t: t.R_dc, type: 'movie' },
                { q: 'custom:adult', t: t.R_adult, type: 'movie', adult: true },
                { q: 'curator_picks', t: t.R_curator, type: 'movie' },
            ];
            list.innerHTML += '<div style="padding:10px 14px 6px;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid #222;margin-top:6px;">' + (LANG === 'fa' ? 'دسته‌بندی‌های صفحه اصلی' : 'Home Categories') + '</div>';
            homeCats.forEach(c => {
                if (!c.t) return;
                const titleEsc = String(c.t).replace(/'/g, "\\'");
                const qEsc = c.q.replace(/'/g, "\\'");
                const fn2 = c.adult
                    ? "openAdultCategory();toggleMenu()"
                    : "openGenericGrid('" + c.type + "','" + qEsc + "','" + titleEsc + "');toggleMenu()";
                list.innerHTML += '<div class="sb-sub-item" onclick="' + fn2 + '">' + _homeIconMarkup(c.id || ((String(c.t).includes('Marvel')||String(c.t).includes('مارول'))?'marvel':String(c.t).includes('A24')?'a24':String(c.t).includes('دی‌سی')||String(c.t).includes('DC')?'dc':'trending_now')) + _homeCategoryTitle(c.t) + '</div>';
            });
            
            // Populate Countries Sidebar
            const countriesList = document.getElementById('sb-countries-list');
            countriesList.innerHTML = '';
            const countries = [
                {code:'US', name_fa:'ایالات متحده', name_en:'United States'},
                {code:'GB', name_fa:'بریتانیا', name_en:'United Kingdom'},
                {code:'IR', name_fa:'ایران', name_en:'Iran'},
                {code:'AF', name_fa:'افغانستان', name_en:'Afghanistan'},
                {code:'AL', name_fa:'آلبانی', name_en:'Albania'},
                {code:'DZ', name_fa:'الجزایر', name_en:'Algeria'},
                {code:'AR', name_fa:'آرژانتین', name_en:'Argentina'},
                {code:'AM', name_fa:'ارمنستان', name_en:'Armenia'},
                {code:'AU', name_fa:'استرالیا', name_en:'Australia'},
                {code:'AT', name_fa:'اتریش', name_en:'Austria'},
                {code:'AZ', name_fa:'آذربایجان', name_en:'Azerbaijan'},
                {code:'BH', name_fa:'بحرین', name_en:'Bahrain'},
                {code:'BD', name_fa:'بنگلادش', name_en:'Bangladesh'},
                {code:'BY', name_fa:'بلاروس', name_en:'Belarus'},
                {code:'BE', name_fa:'بلژیک', name_en:'Belgium'},
                {code:'BZ', name_fa:'بلیز', name_en:'Belize'},
                {code:'BO', name_fa:'بولیوی', name_en:'Bolivia'},
                {code:'BA', name_fa:'بوسنی و هرزگوین', name_en:'Bosnia and Herzegovina'},
                {code:'BW', name_fa:'بوتسوانا', name_en:'Botswana'},
                {code:'BR', name_fa:'برزیل', name_en:'Brazil'},
                {code:'BN', name_fa:'برونئی', name_en:'Brunei'},
                {code:'BG', name_fa:'بلغارستان', name_en:'Bulgaria'},
                {code:'BF', name_fa:'بورکینافاسو', name_en:'Burkina Faso'},
                {code:'KH', name_fa:'کامبوج', name_en:'Cambodia'},
                {code:'CM', name_fa:'کامرون', name_en:'Cameroon'},
                {code:'CA', name_fa:'کانادا', name_en:'Canada'},
                {code:'CL', name_fa:'شیلی', name_en:'Chile'},
                {code:'CN', name_fa:'چین', name_en:'China'},
                {code:'CO', name_fa:'کلمبیا', name_en:'Colombia'},
                {code:'CR', name_fa:'کاستاریکا', name_en:'Costa Rica'},
                {code:'HR', name_fa:'کرواسی', name_en:'Croatia'},
                {code:'CU', name_fa:'کوبا', name_en:'Cuba'},
                {code:'CY', name_fa:'قبرس', name_en:'Cyprus'},
                {code:'CZ', name_fa:'جمهوری چک', name_en:'Czechia'},
                {code:'DK', name_fa:'دانمارک', name_en:'Denmark'},
                {code:'DO', name_fa:'جمهوری دومینیکن', name_en:'Dominican Republic'},
                {code:'EC', name_fa:'اکوادور', name_en:'Ecuador'},
                {code:'EG', name_fa:'مصر', name_en:'Egypt'},
                {code:'SV', name_fa:'السالوادور', name_en:'El Salvador'},
                {code:'EE', name_fa:'استونی', name_en:'Estonia'},
                {code:'ET', name_fa:'اتیوپی', name_en:'Ethiopia'},
                {code:'FJ', name_fa:'فیجی', name_en:'Fiji'},
                {code:'FI', name_fa:'فنلاند', name_en:'Finland'},
                {code:'FR', name_fa:'فرانسه', name_en:'France'},
                {code:'GA', name_fa:'گابن', name_en:'Gabon'},
                {code:'GE', name_fa:'گرجستان', name_en:'Georgia'},
                {code:'DE', name_fa:'آلمان', name_en:'Germany'},
                {code:'GH', name_fa:'غنا', name_en:'Ghana'},
                {code:'GR', name_fa:'یونان', name_en:'Greece'},
                {code:'GT', name_fa:'گواتمالا', name_en:'Guatemala'},
                {code:'HT', name_fa:'هائیتی', name_en:'Haiti'},
                {code:'HN', name_fa:'هندوراس', name_en:'Honduras'},
                {code:'HK', name_fa:'هنگ کنگ', name_en:'Hong Kong'},
                {code:'HU', name_fa:'مجارستان', name_en:'Hungary'},
                {code:'IS', name_fa:'ایسلند', name_en:'Iceland'},
                {code:'IN', name_fa:'هند', name_en:'India'},
                {code:'ID', name_fa:'اندونزی', name_en:'Indonesia'},
                {code:'IQ', name_fa:'عراق', name_en:'Iraq'},
                {code:'IE', name_fa:'ایرلند', name_en:'Ireland'},
                {code:'IL', name_fa:'اسرائیل', name_en:'Israel'},
                {code:'IT', name_fa:'ایتالیا', name_en:'Italy'},
                {code:'JM', name_fa:'جامائیکا', name_en:'Jamaica'},
                {code:'JP', name_fa:'ژاپن', name_en:'Japan'},
                {code:'JO', name_fa:'اردن', name_en:'Jordan'},
                {code:'KZ', name_fa:'قزاقستان', name_en:'Kazakhstan'},
                {code:'KE', name_fa:'کنیا', name_en:'Kenya'},
                {code:'KW', name_fa:'کویت', name_en:'Kuwait'},
                {code:'KG', name_fa:'قرقیزستان', name_en:'Kyrgyzstan'},
                {code:'LA', name_fa:'لائوس', name_en:'Laos'},
                {code:'LV', name_fa:'لتونی', name_en:'Latvia'},
                {code:'LB', name_fa:'لبنان', name_en:'Lebanon'},
                {code:'LY', name_fa:'لیبی', name_en:'Libya'},
                {code:'LT', name_fa:'لیتوانی', name_en:'Lithuania'},
                {code:'LU', name_fa:'لوکزامبورگ', name_en:'Luxembourg'},
                {code:'MO', name_fa:'ماکائو', name_en:'Macau'},
                {code:'MG', name_fa:'ماداگاسکار', name_en:'Madagascar'},
                {code:'MY', name_fa:'مالزی', name_en:'Malaysia'},
                {code:'MV', name_fa:'مالدیو', name_en:'Maldives'},
                {code:'ML', name_fa:'مالی', name_en:'Mali'},
                {code:'MT', name_fa:'مالت', name_en:'Malta'},
                {code:'MX', name_fa:'مکزیک', name_en:'Mexico'},
                {code:'MD', name_fa:'مولداوی', name_en:'Moldova'},
                {code:'MN', name_fa:'مغولستان', name_en:'Mongolia'},
                {code:'ME', name_fa:'مونته‌نگرو', name_en:'Montenegro'},
                {code:'MA', name_fa:'مراکش', name_en:'Morocco'},
                {code:'MZ', name_fa:'موزامبیک', name_en:'Mozambique'},
                {code:'MM', name_fa:'میانمار', name_en:'Myanmar'},
                {code:'NA', name_fa:'نامیبیا', name_en:'Namibia'},
                {code:'NP', name_fa:'نپال', name_en:'Nepal'},
                {code:'NL', name_fa:'هلند', name_en:'Netherlands'},
                {code:'NZ', name_fa:'نیوزیلند', name_en:'New Zealand'},
                {code:'NI', name_fa:'نیکاراگوئه', name_en:'Nicaragua'},
                {code:'NE', name_fa:'نیجر', name_en:'Niger'},
                {code:'NG', name_fa:'نیجریه', name_en:'Nigeria'},
                {code:'MK', name_fa:'مقدونیه شمالی', name_en:'North Macedonia'},
                {code:'NO', name_fa:'نروژ', name_en:'Norway'},
                {code:'OM', name_fa:'عمان', name_en:'Oman'},
                {code:'PK', name_fa:'پاکستان', name_en:'Pakistan'},
                {code:'PA', name_fa:'پاناما', name_en:'Panama'},
                {code:'PG', name_fa:'پاپوآ گینه نو', name_en:'Papua New Guinea'},
                {code:'PY', name_fa:'پاراگوئه', name_en:'Paraguay'},
                {code:'PE', name_fa:'پرو', name_en:'Peru'},
                {code:'PH', name_fa:'فیلیپین', name_en:'Philippines'},
                {code:'PL', name_fa:'لهستان', name_en:'Poland'},
                {code:'PT', name_fa:'پرتغال', name_en:'Portugal'},
                {code:'PR', name_fa:'پورتوریکو', name_en:'Puerto Rico'},
                {code:'QA', name_fa:'قطر', name_en:'Qatar'},
                {code:'RO', name_fa:'رومانی', name_en:'Romania'},
                {code:'RU', name_fa:'روسیه', name_en:'Russia'},
                {code:'RW', name_fa:'رواندا', name_en:'Rwanda'},
                {code:'SA', name_fa:'عربستان سعودی', name_en:'Saudi Arabia'},
                {code:'SN', name_fa:'سنگال', name_en:'Senegal'},
                {code:'RS', name_fa:'صربستان', name_en:'Serbia'},
                {code:'SG', name_fa:'سنگاپور', name_en:'Singapore'},
                {code:'SK', name_fa:'اسلواکی', name_en:'Slovakia'},
                {code:'SI', name_fa:'اسلوونی', name_en:'Slovenia'},
                {code:'SO', name_fa:'سومالی', name_en:'Somalia'},
                {code:'ZA', name_fa:'آفریقای جنوبی', name_en:'South Africa'},
                {code:'KR', name_fa:'کره جنوبی', name_en:'South Korea'},
                {code:'ES', name_fa:'اسپانیا', name_en:'Spain'},
                {code:'LK', name_fa:'سریلانکا', name_en:'Sri Lanka'},
                {code:'SD', name_fa:'سودان', name_en:'Sudan'},
                {code:'SE', name_fa:'سوئد', name_en:'Sweden'},
                {code:'CH', name_fa:'سوئیس', name_en:'Switzerland'},
                {code:'SY', name_fa:'سوریه', name_en:'Syria'},
                {code:'TW', name_fa:'تایوان', name_en:'Taiwan'},
                {code:'TJ', name_fa:'تاجیکستان', name_en:'Tajikistan'},
                {code:'TZ', name_fa:'تانزانیا', name_en:'Tanzania'},
                {code:'TH', name_fa:'تایلند', name_en:'Thailand'},
                {code:'TG', name_fa:'توگو', name_en:'Togo'},
                {code:'TT', name_fa:'ترینیداد و توباگو', name_en:'Trinidad and Tobago'},
                {code:'TN', name_fa:'تونس', name_en:'Tunisia'},
                {code:'TR', name_fa:'ترکیه', name_en:'Turkey'},
                {code:'TM', name_fa:'ترکمنستان', name_en:'Turkmenistan'},
                {code:'AE', name_fa:'امارات', name_en:'UAE'},
                {code:'UG', name_fa:'اوگاندا', name_en:'Uganda'},
                {code:'UA', name_fa:'اوکراین', name_en:'Ukraine'},
                {code:'UY', name_fa:'اروگوئه', name_en:'Uruguay'},
                {code:'UZ', name_fa:'ازبکستان', name_en:'Uzbekistan'},
                {code:'VE', name_fa:'ونزوئلا', name_en:'Venezuela'},
                {code:'VN', name_fa:'ویتنام', name_en:'Vietnam'},
                {code:'YE', name_fa:'یمن', name_en:'Yemen'},
                {code:'ZM', name_fa:'زامبیا', name_en:'Zambia'},
                {code:'ZW', name_fa:'زیمباوه', name_en:'Zimbabwe'},
            ];
            countries.forEach(c => {
                const name = LANG === 'fa' ? c.name_fa : c.name_en;
                const flagUrl = c.code === 'IR' 
                    ? 'https://flagofiran.com/files/Flag_of_Iran.svg'
                    : `https://flagcdn.com/w20/${c.code.toLowerCase()}.png`;
                countriesList.innerHTML += `
                    <div class="sb-sub-item" onclick="openRandomCountryGrid('${c.code}', '${name}'); toggleMenu()" style="display:flex; align-items:center; gap:8px;">
                        <img src="${flagUrl}" style="width:20px; height:15px; border-radius:2px;" loading="lazy" onerror="this.style.display='none'">
                        ${name}
                    </div>
                `;
            });
            
            // Reset keywords list so it regenerates with new language
            const kwList = document.getElementById('sb-keywords-list');
            if (kwList) kwList.innerHTML = '';
        }

        // --- HOME ---
        // renderHome is defined later in the v13 new features section
        
        // --- HERO CAROUSEL (20 Titles, Auto-Play 3s) ---
        async function loadCarouselData() {
            const url = `trending/all/day`;
            const d = await getData(url);
            if (d.results && d.results.length > 0) {
                carouselData = d.results.filter(m => m.backdrop_path && (m.media_type === 'movie' || m.media_type === 'tv')).slice(0, 20);
                renderCarousel();
                startCarouselTimer();
            }
        }
        
        function renderCarousel() {
            const con = document.getElementById('hero-carousel');
            
            let slidesHtml = carouselData.map((m, i) => {
                let title = m.title || m.name;
                // In FA mode, if title still has non-Persian/non-Latin foreign chars, use English title
                if (LANG === 'fa' && title && /[\u0E00-\u0E7F\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF]/.test(title)) {
                    if (m._en_title && !/[\u0E00-\u0E7F\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF]/.test(m._en_title)) {
                        title = m._en_title;
                    } else {
                        const engTitle = m.original_title || m.original_name || title;
                        const engHasForeign = /[\u0E00-\u0E7F\u0900-\u097F\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0400-\u04FF]/.test(engTitle);
                        title = engHasForeign ? title : engTitle;
                    }
                }
                const date = (m.release_date || m.first_air_date || '').split('-')[0];
                const type = m.media_type || (m.title ? 'movie' : 'tv');
                // Genre lookup
                const genreMap = {28:'Action',12:'Adventure',16:'Animation',35:'Comedy',80:'Crime',99:'Documentary',18:'Drama',10751:'Family',14:'Fantasy',36:'History',27:'Horror',10402:'Music',9648:'Mystery',10749:'Romance',878:'Sci-Fi',10770:'TV Movie',53:'Thriller',10752:'War',37:'Western'};
                const genres = (m.genre_ids || []).slice(0,2).map(g => genreMap[g] || '').filter(Boolean).join(' · ');
                const overview = (m.overview || '').substring(0, 90) + ((m.overview||'').length > 90 ? '...' : '');
                const _bgUrl = IMG_BG.replace('/w1280', '/w780') + m.backdrop_path;
                const _isNear = (i === 0 || i === carouselData.length - 1 || i === 1);
                return `
                    <div class="slide ${i === 0 ? 'active' : ''}" id="slide-${i}"
                         onclick="openCarouselItem(${i})"
                         data-bg="${_bgUrl}"
                         style="${_isNear ? 'background-image: url(' + _bgUrl + ');' : ''}">
                        <div class="hero-card-hint">${LANG === 'fa' ? 'برای جزئیات لمس کن' : 'Tap for details'}</div>
                        <div class="slide-overlay">
                            <div class="slide-title">${title}</div>
                            <div class="slide-meta">
                                <span><i class="fa-solid fa-star" style="color:gold"></i> ${m.vote_average.toFixed(1)}</span>
                                <span>${date}</span>
                                <span style="border:1px solid #eee; padding:0 4px; border-radius:3px; font-size:10px;">${type.toUpperCase()}</span>
                                ${genres ? `<span style="color:#ccc;font-size:10px;">${genres}</span>` : ''}
                            </div>
                            ${overview ? `<div style="font-size:11px;color:#ccc;margin-top:5px;line-height:1.4;max-width:90%;">${overview}</div>` : ''}
                            <div class="slide-extra-info" id="slide-info-${i}" style="margin-top:6px;font-size:10px;color:#bbb;"></div>
                        </div>
                    </div>
                `;
            }).join('');
            const dotsHtml = `<div class="hero-carousel-dots" id="hero-carousel-dots">${carouselData.map((_, i) => `<button class="hero-dot ${i === 0 ? 'active' : ''}" onclick="event.stopPropagation(); goToSlide(${i}); startCarouselTimer();" aria-label="Slide ${i + 1}"></button>`).join('')}</div>`;
            con.innerHTML = slidesHtml + dotsHtml;
            applyCarouselDeckClasses();
            
            // Credits are optional decoration and are fetched only after the visitor changes slide.
            
            // Add swipe support
            initCarouselSwipe(con);
        }
        
        async function loadSlideCredits(id, type, slideIdx) {
            try {
                const credits = await getData(`${type}/${id}/credits`);
                const el = document.getElementById(`slide-info-${slideIdx}`);
                if (!el || !credits) return;
                
                let html = '';
                // Director
                const directors = (credits.crew || []).filter(c => c.job === 'Director').slice(0,1);
                if (directors.length > 0) {
                    html += `<span style="color:#f5c518;">🎬 ${directors[0].name}</span>`;
                }
                // Top 3 cast
                const cast = (credits.cast || []).slice(0, 3);
                if (cast.length > 0) {
                    if (html) html += ' &nbsp;|&nbsp; ';
                    html += `👤 ${cast.map(c => c.name).join(', ')}`;
                }
                if (html) el.innerHTML = html;
            } catch(e) {}
        }
        
        function applyCarouselDeckClasses() {
            if (!carouselData || !carouselData.length) return;
            const total = carouselData.length;
            const prevIdx = (curSlideIdx - 1 + total) % total;
            const nextIdx = (curSlideIdx + 1) % total;
            document.querySelectorAll('.slide').forEach((s, i) => {
                s.classList.remove('active', 'prev', 'next', 'hidden-card');
                if (i === curSlideIdx) s.classList.add('active');
                else if (i === prevIdx) s.classList.add('prev');
                else if (i === nextIdx) s.classList.add('next');
                else s.classList.add('hidden-card');
                // FN-HERO: only visible deck cards fetch their backdrop; hidden slides
                // load theirs when they rotate into active/prev/next (no 20x w1280 burst).
                if ((i === curSlideIdx || i === prevIdx || i === nextIdx) && s.dataset.bg && !s.style.backgroundImage) {
                    s.style.backgroundImage = 'url(' + s.dataset.bg + ')';
                }
                // FN-FIX2: preload the slide after next, so the next rotation already has its image.
                if (i === (nextIdx + 1) % total && s.dataset.bg && !s.style.backgroundImage) {
                    var _pre = new Image(); _pre.src = s.dataset.bg;
                }
            });
            document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === curSlideIdx));
        }

        const _fnCarouselCreditsLoaded = new Set();
        function loadCarouselCreditsForSlide(idx) {
            const item = carouselData && carouselData[idx];
            if (!item || _fnCarouselCreditsLoaded.has(idx)) return;
            _fnCarouselCreditsLoaded.add(idx);
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            loadSlideCredits(item.id, type, idx);
        }
        function goToSlide(idx) {
            if (!carouselData || !carouselData.length) return;
            curSlideIdx = ((idx % carouselData.length) + carouselData.length) % carouselData.length;
            applyCarouselDeckClasses();
            loadCarouselCreditsForSlide(curSlideIdx);
        }

        function openCarouselItem(idx) {
            if (carouselSwipeBlocked) return;
            const item = carouselData && carouselData[idx];
            if (!item) return;
            const type = item.media_type || (item.title ? 'movie' : 'tv');
            if (type !== 'movie' && type !== 'tv') return;
            startCarouselTimer();
            openDetail(item.id, type);
        }
        
        function nextSlide() {
            goToSlide(curSlideIdx + 1);
        }
        
        function prevSlide() {
            goToSlide(curSlideIdx - 1);
        }
        
        function startCarouselTimer() {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 4000); 
        }
        
        let carouselSwipeBlocked = false;
        
        function initCarouselSwipe(el) {
            let touchStartX = 0;
            let touchStartY = 0;
            let isSwiping = false;
            
            el.addEventListener('touchstart', function(e) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isSwiping = false;
                carouselSwipeBlocked = false;
            }, { passive: true });
            
            el.addEventListener('touchmove', function(e) {
                const dx = e.touches[0].clientX - touchStartX;
                const dy = e.touches[0].clientY - touchStartY;
                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
                    isSwiping = true;
                    carouselSwipeBlocked = true;
                }
            }, { passive: true });
            
            el.addEventListener('touchend', function(e) {
                if (!isSwiping) { carouselSwipeBlocked = false; return; }
                const dx = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(dx) > 40) {
                    if (dx > 0) {
                        prevSlide();
                    } else {
                        nextSlide();
                    }
                    startCarouselTimer();
                }
                isSwiping = false;
                setTimeout(() => { carouselSwipeBlocked = false; }, 300);
            }, { passive: true });
        }
        
        // Genres to exclude from TV listings (talk shows, reality, news, soap opera)
        const TV_EXCLUDED_GENRE_IDS = new Set([10767, 10764, 10763, 10766]);
        
        function isTVShowExcluded(item) {
            if (!item.genre_ids) return false;
            return item.genre_ids.some(gid => TV_EXCLUDED_GENRE_IDS.has(gid));
        }
        

        // =================== SMART HOME CATEGORY ENGINE (v17) ===================
        const SMART_ROW_CACHE = {};
        const CUSTOM_PAGE_SIZE = 20;
        const OMDB_RATING_KEYS = ['f6dd47c8','564727fa','trilogy'];
        // Curated, year-stamped winner records. These are award winners only;
        // the year is the ceremony year and controls the default newest-first order.
        const EMMY_WINNER_TITLES = [
            {title:'The Pitt',year:2025},{title:'The Studio',year:2025},{title:'Adolescence',year:2025},
            {title:'Shogun',year:2024},{title:'Hacks',year:2024},{title:'Baby Reindeer',year:2024},
            {title:'Succession',year:2023},{title:'The Bear',year:2023},{title:'Beef',year:2023},
            {title:'Ted Lasso',year:2022},{title:'Squid Game',year:2022},{title:'The White Lotus',year:2022},
            {title:'The Crown',year:2021},{title:'The Queen\'s Gambit',year:2021},{title:'Mare of Easttown',year:2021},
            {title:'Schitt\'s Creek',year:2020},{title:'Watchmen',year:2020},{title:'Succession',year:2020},
            {title:'Fleabag',year:2019},{title:'Chernobyl',year:2019},{title:'Game of Thrones',year:2019},
            {title:'The Marvelous Mrs. Maisel',year:2018},{title:'The Assassination of Gianni Versace',year:2018},
            {title:'The Handmaid\'s Tale',year:2017},{title:'Big Little Lies',year:2017},{title:'Veep',year:2017},
            {title:'Game of Thrones',year:2016},{title:'Veep',year:2016},{title:'Fargo',year:2014},
            {title:'Breaking Bad',year:2014},{title:'Modern Family',year:2014},{title:'Homeland',year:2012},
            {title:'Mad Men',year:2008},{title:'30 Rock',year:2007},{title:'The Sopranos',year:2004},
            {title:'The West Wing',year:2001},{title:'The Practice',year:1998},{title:'Frasier',year:1994}
        ];
        const GOLDEN_GLOBE_WINNER_TITLES = [
            {title:'The Brutalist',year:2025,type:'movie'},{title:'Emilia Pérez',year:2025,type:'movie'},{title:'Flow',year:2025,type:'movie'},
            {title:'Shogun',year:2025,type:'tv'},{title:'Hacks',year:2025,type:'tv'},{title:'Baby Reindeer',year:2025,type:'tv'},
            {title:'Oppenheimer',year:2024,type:'movie'},{title:'Poor Things',year:2024,type:'movie'},{title:'Anatomy of a Fall',year:2024,type:'movie'},
            {title:'Succession',year:2024,type:'tv'},{title:'The Bear',year:2024,type:'tv'},{title:'Beef',year:2024,type:'tv'},
            {title:'The Fabelmans',year:2023,type:'movie'},{title:'The Banshees of Inisherin',year:2023,type:'movie'},{title:'RRR',year:2023,type:'movie'},
            {title:'The Fabelmans',year:2023,type:'movie'},{title:'House of the Dragon',year:2023,type:'tv'},{title:'Abbott Elementary',year:2023,type:'tv'},
            {title:'The Power of the Dog',year:2022,type:'movie'},{title:'West Side Story',year:2022,type:'movie'},{title:'Encanto',year:2022,type:'movie'},
            {title:'Succession',year:2020,type:'tv'},{title:'Fleabag',year:2020,type:'tv'},{title:'Chernobyl',year:2020,type:'tv'},
            {title:'1917',year:2020,type:'movie'},{title:'Once Upon a Time in Hollywood',year:2020,type:'movie'},
            {title:'Green Book',year:2019,type:'movie'},{title:'Bohemian Rhapsody',year:2019,type:'movie'},{title:'Roma',year:2019,type:'movie'},
            {title:'The Americans',year:2019,type:'tv'},{title:'The Marvelous Mrs. Maisel',year:2018,type:'tv'},
            {title:'La La Land',year:2017,type:'movie'},{title:'Moonlight',year:2017,type:'movie'},{title:'The Crown',year:2017,type:'tv'},
            {title:'Mad Max: Fury Road',year:2016,type:'movie'},{title:'The Revenant',year:2016,type:'movie'},{title:'Mr. Robot',year:2016,type:'tv'},
            {title:'Boyhood',year:2015,type:'movie'},{title:'Birdman',year:2015,type:'movie'},{title:'The Affair',year:2015,type:'tv'},
            {title:'12 Years a Slave',year:2014,type:'movie'},{title:'Breaking Bad',year:2014,type:'tv'},
            {title:'Argo',year:2013,type:'movie'},{title:'Homeland',year:2013,type:'tv'}
        ];
        // Curated heartbreak/loss titles: only stories whose central emotional
        // engine is romantic heartbreak, separation, bereavement, or profound loss.
        // A curated pool is intentional here; broad romance/grief keywords pollute
        // this category with unrelated dramas.
        const HEARTBREAK_LOSS_TITLES = [
            {title:'La La Land',year:2016,type:'movie'},{title:'500 Days of Summer',year:2009,type:'movie'},
            {title:'Manchester by the Sea',year:2016,type:'movie'},{title:'Casablanca',year:1942,type:'movie'},
            {title:'Eternal Sunshine of the Spotless Mind',year:2004,type:'movie'},{title:'Blue Valentine',year:2010,type:'movie'},
            {title:'Marriage Story',year:2019,type:'movie'},{title:'Past Lives',year:2023,type:'movie'},
            {title:'Atonement',year:2007,type:'movie'},{title:'Brokeback Mountain',year:2005,type:'movie'},
            {title:'Titanic',year:1997,type:'movie'},{title:'The Notebook',year:2004,type:'movie'},
            {title:'The Fault in Our Stars',year:2014,type:'movie'},{title:'Me Before You',year:2016,type:'movie'},
            {title:'Love Story',year:1970,type:'movie'},{title:'Brief Encounter',year:1945,type:'movie'},
            {title:'In the Mood for Love',year:2000,type:'movie'},{title:'Her',year:2013,type:'movie'},
            {title:'Lost in Translation',year:2003,type:'movie'},{title:'Never Let Me Go',year:2010,type:'movie'},
            {title:'Amour',year:2012,type:'movie'},{title:'The Bridges of Madison County',year:1995,type:'movie'},
            {title:'Revolutionary Road',year:2008,type:'movie'},{title:'One Day',year:2011,type:'movie'},
            {title:'The Light Between Oceans',year:2016,type:'movie'},{title:'If Beale Street Could Talk',year:2018,type:'movie'},
            {title:'The Remains of the Day',year:1993,type:'movie'},{title:'The English Patient',year:1996,type:'movie'},
            {title:'The Umbrellas of Cherbourg',year:1964,type:'movie'},{title:'The Worst Person in the World',year:2021,type:'movie'},
            {title:'The Last Five Years',year:2014,type:'movie'},{title:'Like Crazy',year:2011,type:'movie'},
            {title:'The Spectacular Now',year:2013,type:'movie'},{title:'All the Bright Places',year:2020,type:'movie'},
            {title:'A Star Is Born',year:2018,type:'movie'},{title:'The Broken Circle Breakdown',year:2012,type:'movie'},
            {title:'The Farewell',year:2019,type:'movie'},{title:'Still Alice',year:2014,type:'movie'},
            {title:'The Father',year:2020,type:'movie'},{title:'Room',year:2015,type:'movie'},
            {title:'Grave of the Fireflies',year:1988,type:'movie'},
            {title:'Normal People',year:2020,type:'tv'},{title:'Scenes from a Marriage',year:2021,type:'tv'},
            {title:'One Day',year:2024,type:'tv'},{title:'Fleabag',year:2016,type:'tv'},
            {title:'This Is Us',year:2016,type:'tv'},{title:'Six Feet Under',year:2001,type:'tv'},
            {title:'After Life',year:2019,type:'tv'},{title:'Maid',year:2021,type:'tv'},
            {title:'The Leftovers',year:2014,type:'tv'},{title:'From Scratch',year:2022,type:'tv'},
            {title:'The Affair',year:2014,type:'tv'},{title:"The Time Traveler's Wife",year:2022,type:'tv'}
        ];
        const OSCAR_WINNER_TITLES = [
            {title:'One Battle After Another',year:2025},{title:'Sentimental Value',year:2025},
            {title:'Anora',year:2024},{title:"I'm Still Here",year:2024},{title:'Oppenheimer',year:2023},{title:'The Zone of Interest',year:2023},
            {title:'Everything Everywhere All at Once',year:2022},{title:'All Quiet on the Western Front',year:2022},{title:'CODA',year:2021},{title:'Drive My Car',year:2021},
            {title:'Nomadland',year:2020},{title:'Another Round',year:2020},{title:'Parasite',year:2019},{title:'Green Book',year:2018},{title:'Roma',year:2018},
            {title:'The Shape of Water',year:2017},{title:'A Fantastic Woman',year:2017},{title:'Moonlight',year:2016},{title:'The Salesman',year:2016},
            {title:'Spotlight',year:2015},{title:'Son of Saul',year:2015},{title:'Birdman',year:2014},{title:'Ida',year:2013},
            {title:'12 Years a Slave',year:2013},{title:'The Great Beauty',year:2013},{title:'Argo',year:2012},{title:'Amour',year:2012},
            {title:'The Artist',year:2011},{title:'A Separation',year:2011},{title:"The King's Speech",year:2010},{title:'In a Better World',year:2010},
            {title:'The Hurt Locker',year:2009},{title:'The Secret in Their Eyes',year:2009},{title:'Slumdog Millionaire',year:2008},{title:'Departures',year:2008},
            {title:'No Country for Old Men',year:2007},{title:'The Counterfeiters',year:2007},{title:'The Departed',year:2006},{title:'The Lives of Others',year:2006},
            {title:'Crash',year:2005},{title:'Tsotsi',year:2005},{title:'Million Dollar Baby',year:2004},{title:'The Sea Inside',year:2004},
            {title:'The Lord of the Rings: The Return of the King',year:2003},{title:'The Barbarian Invasions',year:2003},
            {title:'Chicago',year:2002},{title:'Nowhere in Africa',year:2001},{title:'A Beautiful Mind',year:2001},{title:'Crouching Tiger, Hidden Dragon',year:2000},
            {title:'Gladiator',year:2000},{title:'All About My Mother',year:1999},{title:'American Beauty',year:1999},{title:'Life Is Beautiful',year:1997},
            {title:'Shakespeare in Love',year:1998},{title:'Titanic',year:1997},{title:'The English Patient',year:1996},{title:'Braveheart',year:1995},
            {title:'Forrest Gump',year:1994},{title:'Schindler\'s List',year:1993},{title:'Unforgiven',year:1992},{title:'The Silence of the Lambs',year:1991},
            {title:'Dances with Wolves',year:1990},{title:'Driving Miss Daisy',year:1989},{title:'Rain Man',year:1988},{title:'The Last Emperor',year:1987},
            {title:'Platoon',year:1986},{title:'Out of Africa',year:1985},{title:'Amadeus',year:1984},{title:'Terms of Endearment',year:1983},
            {title:'Gandhi',year:1982},{title:'Chariots of Fire',year:1981},{title:'Ordinary People',year:1980},{title:'Kramer vs. Kramer',year:1979},
            {title:'The Deer Hunter',year:1978},{title:'Annie Hall',year:1977},{title:'Rocky',year:1976},{title:"One Flew Over the Cuckoo's Nest",year:1975},
            {title:'The Godfather Part II',year:1974},{title:'The Sting',year:1973},{title:'The Godfather',year:1972},{title:'The French Connection',year:1971},
            {title:'Patton',year:1970},{title:'Midnight Cowboy',year:1969},{title:'Oliver!',year:1968},{title:'In the Heat of the Night',year:1967},
            {title:'A Man for All Seasons',year:1966},{title:'The Sound of Music',year:1965},{title:'My Fair Lady',year:1964},{title:'Tom Jones',year:1963},
            {title:'Lawrence of Arabia',year:1962},{title:'West Side Story',year:1961},{title:'The Apartment',year:1960},{title:'Ben-Hur',year:1959},
            {title:'Gigi',year:1958},{title:'The Bridge on the River Kwai',year:1957},{title:'Around the World in 80 Days',year:1956},
            {title:'Marty',year:1955},{title:'On the Waterfront',year:1954},{title:'From Here to Eternity',year:1953},{title:'The Greatest Show on Earth',year:1952},
            {title:'An American in Paris',year:1951},{title:'All About Eve',year:1950},{title:"All the King's Men",year:1949},{title:'Hamlet',year:1948},
            {title:"Gentleman's Agreement",year:1947},{title:'The Best Years of Our Lives',year:1946},{title:'The Lost Weekend',year:1945},{title:'Going My Way',year:1944},
            {title:'Casablanca',year:1942},{title:'Mrs. Miniver',year:1942},{title:'How Green Was My Valley',year:1941},{title:'Rebecca',year:1940},
            {title:'Gone with the Wind',year:1939},{title:'You Can\'t Take It with You',year:1938},{title:'The Life of Emile Zola',year:1937},{title:'The Great Ziegfeld',year:1936},
            {title:'Mutiny on the Bounty',year:1935},{title:'It Happened One Night',year:1934},{title:'Cavalcade',year:1933},{title:'Grand Hotel',year:1932},
            {title:'Cimarron',year:1931},{title:'All Quiet on the Western Front',year:1930},{title:'The Broadway Melody',year:1929},{title:'Wings',year:1927}
        ];

        function _uniqById(arr) {
            const seen = new Set();
            return (arr || []).filter(x => x && x.id && !seen.has(x.id) && seen.add(x.id));
        }
        function _normalizeAwardTitle(s) {
            return String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
        }
        function _awardTitleMatches(result, wanted) {
            const target = _normalizeAwardTitle(wanted);
            return !!result && [result.title, result.name, result.original_title, result.original_name]
                .some(v => _normalizeAwardTitle(v) === target);
        }
        function _awardResultHasRequestedType(result, type) {
            if (!result) return false;
            if (type === 'tv') return !!(result.first_air_date || result.media_type === 'tv') && !result.release_date;
            if (type === 'movie') return !!(result.release_date || result.media_type === 'movie') && !result.first_air_date;
            return true;
        }
        const EMMY_EXACT_TV_IDS = { 'fargo|2014': 60622 };
        function _uniqByWork(arr) {
            const seen = new Set();
            return (arr || []).filter(x => {
                if (!x || !x.id) return false;
                const label = _normalizeAwardTitle(x.title || x.name);
                const year = _releaseYearOf(x, x.media_type) || x.__awardYear || 0;
                const key = label + '|' + year;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }
        function _releaseYearOf(item, type) {
            const d = type === 'tv' ? (item.first_air_date || item.release_date || '') : (item.release_date || item.first_air_date || '');
            return parseInt((d || '').slice(0,4)) || 0;
        }
        function _applySmartSort(items, type, mode, defaultMode) {
            const m = mode === 'rating' ? 'imdb' : (mode === 'popularity' ? 'popularity' : (mode && mode !== 'default' ? mode : defaultMode));
            const arr = [...(items || [])];
            if (m === 'newest') arr.sort((a,b)=>_releaseYearOf(b,type)-_releaseYearOf(a,type) || (b.vote_count||0)-(a.vote_count||0));
            else if (m === 'oldest') arr.sort((a,b)=>_releaseYearOf(a,type)-_releaseYearOf(b,type) || (b.vote_count||0)-(a.vote_count||0));
            else if (m === 'popular') arr.sort((a,b)=>(b.vote_count||0)-(a.vote_count||0) || (b.popularity||0)-(a.popularity||0));
            else if (m === 'popularity') arr.sort((a,b)=>(b.popularity||0)-(a.popularity||0) || (b.vote_count||0)-(a.vote_count||0));
            else if (m === 'relevance') arr.sort((a,b)=>(b.__themeRel||0)-(a.__themeRel||0) || (b.vote_average||0)-(a.vote_average||0) || (b.vote_count||0)-(a.vote_count||0));
            else if (m === 'random') arr.sort(()=>Math.random()-0.5);
            else if (m === 'recent_popular') arr.sort((a,b)=>{
                const ad = Date.parse(a.next_episode_to_air?.air_date || a.last_air_date || a.first_air_date || '') || 0;
                const bd = Date.parse(b.next_episode_to_air?.air_date || b.last_air_date || b.first_air_date || '') || 0;
                return bd-ad || (b.popularity||0)-(a.popularity||0) || (b.vote_count||0)-(a.vote_count||0);
            });
            else arr.sort((a,b)=>(b._imdbRating||b.vote_average||0)-(a._imdbRating||a.vote_average||0) || (b.vote_count||0)-(a.vote_count||0));
            return arr;
        }
        async function _fetchDiscoverPages(query, pages=3) {
            // FN-v43: pages are independent, so fetch them together instead of
            // one after another (8 sequential pages = 8x latency on a slow link).
            // Promise.all preserves page order, so the pool order is unchanged.
            const jobs = [];
            for(let i=1;i<=pages;i++) jobs.push(getData(query + (query.includes('?') ? '&' : '?') + 'page=' + i).catch(() => null));
            const all = await Promise.all(jobs);
            let out=[];
            all.forEach(d => { if(d && d.results) out = out.concat(d.results); });
            return _uniqById(out);
        }
        async function _fetchTitleList(list, type, page, perPage) {
            const start=(page-1)*perPage, end=Math.min(start+perPage, list.length), out=[];
            for(let i=start;i<end;i++) {
                try {
                    const x=list[i];
                    const d=await getData(`search/${type}?query=${encodeURIComponent(x.title)}&year=${x.year}`);
                    let best=(d.results||[]).find(r=>_releaseYearOf(r,type)===x.year) || (d.results||[])[0];
                    if(best) out.push(best);
                } catch(e) {}
            }
            return out;
        }
        function _isRatedWork(item) {
            // TMDB's unrated/NR entries have no usable audience rating. They are
            // not playable catalogue works for these curated rows, so never show them.
            return !!(item && Number(item.vote_average) > 0 && Number(item.vote_count || 0) > 0);
        }
        async function _fetchAwardList(list, page, perPage, defaultType = 'movie') {
            const start=(page-1)*perPage, end=Math.min(start+perPage, list.length), out=[];
            for(let i=start;i<end;i++) { try {
                const x=list[i], type=x.type || defaultType;
                const forcedId = type === 'tv' ? EMMY_EXACT_TV_IDS[_normalizeAwardTitle(x.title)+'|'+x.year] : null;
                let results = [];
                if (forcedId) {
                    try { const forced = await getData(`tv/${forcedId}`); if (forced) results = [forced]; } catch(e) {}
                }
                if (!results.length) {
                    const d=await getData(`search/${type}?query=${encodeURIComponent(x.title)}&year=${x.year}`);
                    results = d.results || [];
                }
                // Never accept a title-only match from the wrong media type.
                // This prevents the Fargo feature film from entering Emmy.
                const candidates=results.filter(r => _isRatedWork(r) && _awardTitleMatches(r, x.title) && _awardResultHasRequestedType(r, type));
                const best=candidates.find(r=>_releaseYearOf(r,type)===x.year) || candidates[0];
                if(best) { best.media_type=type; best.__awardYear=x.year; out.push(best); }
            } catch(e) {} }
            return out;
        }
        async function _enrichIMDbRatings(items, type, max=60) {
            // FN-v43: on Home only the first 20 cards are shown, so enriching
            // 100-120 titles (external_ids + OMDb each) kept the skeleton up
            // for minutes. Home caps at the 40 strongest candidates; the
            // rating then still sorts those 40, and See All is unaffected.
            if (typeof window !== 'undefined' && window.__fnHomeEnrich) max = Math.min(max, 40);
            const slice = items.slice(0, max);
            await Promise.all(slice.map(async it => {
                try {
                    const ext = await getData(`${type}/${it.id}/external_ids`);
                    const imdbId = ext && ext.imdb_id;
                    if(!imdbId) return;
                    it.imdb_id = imdbId;
                    const cached = localStorage.getItem('fn_imdb_rating_'+imdbId);
                    if(cached) { it._imdbRating = parseFloat(cached) || 0; return; }
                    for(const key of OMDB_RATING_KEYS) {
                        try {
                            const _omdbCtl = new AbortController();
                            const _omdbTimer = setTimeout(() => _omdbCtl.abort(), 4000);
                            let r;
                            try { r = await fetch(`https://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${key}`, { signal: _omdbCtl.signal }); }
                            finally { clearTimeout(_omdbTimer); }
                            const j = await r.json();
                            if(j && j.imdbRating && j.imdbRating !== 'N/A') {
                                it._imdbRating = parseFloat(j.imdbRating) || 0;
                                localStorage.setItem('fn_imdb_rating_'+imdbId, String(it._imdbRating));
                                break;
                            }
                        } catch(e) { if (e && e.name === 'AbortError') break; }
                    }
                } catch(e) {}
            }));
            return items;
        }
        // ── Universal NR filter for Home page: hide items with no rating,
        // EXCEPT genuine real 2026 titles that simply haven't been rated yet ──
        function _passesHomeNRFilter(item, type) {
            if (item && item.vote_average && item.vote_average > 0) return true;
            const y = _releaseYearOf(item, type);
            return y === 2026;
        }

        // ── Global discover-query builder mirroring the local Q() used
        // inside renderHome(); duplicated (not shared by reference) so the
        // sidebar category list can build identical queries without any
        // risk of altering renderHome's own behavior. ──
        function _homeCatQ(type, genre, yearMin, yearMax, origin) {
            let q = `discover/${type}?include_adult=false&vote_count.gte=${MIN_VOTES}&sort_by=popularity.desc&without_genres=99&fn_home_mix=1`;
            if (genre) q += `&with_genres=${genre}`;
            if (origin) q += `&with_original_language=${origin}`;
            if (yearMin && yearMax) {
                q += `&primary_release_date.gte=${yearMin}-01-01&primary_release_date.lte=${yearMax}-12-31`;
                if (type === 'tv') q += `&first_air_date.gte=${yearMin}-01-01&first_air_date.lte=${yearMax}-12-31`;
            }
            return q;
        }

        // ── Dynamic TMDB keyword resolver (cached) — STRICT exact-match only.
        // No loose fallback to results[0]: an inexact keyword match (e.g.
        // "sport" matching an unrelated keyword) would silently pollute a
        // category with unrelated titles. ──
        const _kwIdCache = {};
        async function _resolveKeywordIds(terms) {
            const ids = [];
            for (const term of terms) {
                try {
                    if (_kwIdCache[term]) { ids.push(_kwIdCache[term]); continue; }
                    const d = await getData(`search/keyword?query=${encodeURIComponent(term)}`);
                    const results = (d && d.results) || [];
                    const exact = results.find(k => (k.name || '').toLowerCase() === term.toLowerCase());
                    _kwIdCache[term] = exact ? exact.id : null;
                    if (exact) ids.push(exact.id);
                } catch(e) { _kwIdCache[term] = null; }
            }
            return [...new Set(ids)];
        }

        // ── SPORTS category: only films/series where sport is the CENTRAL
        // subject — any sport, any country. Documentaries excluded entirely
        // except well-known, highly-rated SOCCER documentaries. Reality/talk
        // shows excluded via isTVShowExcluded(). Tight keyword list + strict
        // matching + a meaningful vote threshold keeps out unrelated titles
        // (action films that merely feature a sports scene, animated films
        // with a sports subplot, etc). ──
        let _sportsItemsCache = null;
        async function _getSportsItems() {
            if (_sportsItemsCache) return _sportsItemsCache;
            const kwIds = await _resolveKeywordIds([
                'sport','football','soccer','basketball','baseball','boxing','wrestling',
                'rugby','tennis','formula one','motorsport','mixed martial arts',
                'cricket','golf','cycling','ice hockey','volleyball','dodgeball',
                'american football','marathon','skiing','surfing','sports drama'
            ]);
            let pool = [];
            if (kwIds.length) {
                const kw = kwIds.join('|');
                const movQ = `discover/movie?with_keywords=${kw}&without_genres=99&vote_count.gte=30&sort_by=popularity.desc&include_adult=false`;
                const tvQ  = `discover/tv?with_keywords=${kw}&without_genres=99&vote_count.gte=30&sort_by=popularity.desc&include_adult=false`;
                const [movItems, tvItems] = await Promise.all([
                    _fetchDiscoverPages(movQ, 6),
                    _fetchDiscoverPages(tvQ, 4)
                ]);
                movItems.forEach(m => { m.media_type = 'movie'; });
                tvItems.forEach(t => { t.media_type = 'tv'; });
                pool = pool.concat(movItems, tvItems.filter(x => !isTVShowExcluded(x)));
            }
            // Well-known, highly-rated SOCCER documentaries — the one allowed exception
            const soccerKwIds = await _resolveKeywordIds(['soccer', 'football']);
            if (soccerKwIds.length) {
                const docQ = `discover/movie?with_genres=99&with_keywords=${soccerKwIds.join('|')}&vote_count.gte=150&sort_by=vote_average.desc&include_adult=false`;
                const docs = await _fetchDiscoverPages(docQ, 2);
                docs.forEach(d => { d.media_type = 'movie'; });
                pool = pool.concat(docs);
            }
            pool = _uniqById(pool).filter(it => _passesHomeNRFilter(it, it.media_type));
            _sportsItemsCache = pool;
            return pool;
        }

        // ── MENTAL HEALTH category: films/series centered on psychological
        // illness — psychosis, dissociative/multiple personality, addiction,
        // obsession, hallucination, phobia, anxiety, depression, etc.
        // No documentaries, no reality shows, no NR (except real 2026 titles). ──
        let _mentalItemsCache = null;
        async function _getMentalHealthItems() {
            if (_mentalItemsCache) return _mentalItemsCache;
            const kwIds = await _resolveKeywordIds([
                'mental illness','psychiatric hospital','psychosis','schizophrenia',
                'multiple personality','dissociative identity disorder','drug addiction',
                'depression','obsession','hallucination','phobia','anxiety disorder',
                'bipolar disorder','eating disorder','mental breakdown','psychotherapy',
                'trauma','ptsd','sociopath','psychopath','panic attack'
            ]);
            let pool = [];
            if (kwIds.length) {
                const kw = kwIds.join('|');
                const movQ = `discover/movie?with_keywords=${kw}&without_genres=99&vote_count.gte=15&sort_by=popularity.desc&include_adult=false`;
                const tvQ  = `discover/tv?with_keywords=${kw}&without_genres=99&vote_count.gte=15&sort_by=popularity.desc&include_adult=false`;
                const [movItems, tvItems] = await Promise.all([
                    _fetchDiscoverPages(movQ, 6),
                    _fetchDiscoverPages(tvQ, 4)
                ]);
                movItems.forEach(m => { m.media_type = 'movie'; });
                tvItems.forEach(t => { t.media_type = 'tv'; });
                pool = pool.concat(movItems, tvItems.filter(x => !isTVShowExcluded(x)));
            }
            pool = _uniqById(pool).filter(it => _passesHomeNRFilter(it, it.media_type));
            _mentalItemsCache = pool;
            return pool;
        }

        // ── DOCUMENTARIES category: genre=99, excludes reality/talk shows,
        // NR excluded (unless real 2026), default sort = most popular/voted. ──
        let _docsItemsCache = null;
        async function _getDocumentaryItems() {
            if (_docsItemsCache) return _docsItemsCache;
            const movQ = `discover/movie?with_genres=99&vote_count.gte=30&sort_by=popularity.desc&include_adult=false`;
            const tvQ  = `discover/tv?with_genres=99&vote_count.gte=30&sort_by=popularity.desc&include_adult=false`;
            const [movItems, tvItems] = await Promise.all([
                _fetchDiscoverPages(movQ, 8),
                _fetchDiscoverPages(tvQ, 6)
            ]);
            movItems.forEach(m => { m.media_type = 'movie'; });
            tvItems.forEach(t => { t.media_type = 'tv'; });
            let pool = movItems.concat(tvItems.filter(x => !isTVShowExcluded(x)));
            pool = _uniqById(pool).filter(it => _passesHomeNRFilter(it, it.media_type));
            _docsItemsCache = pool;
            return pool;
        }

        // ── BOOK / NOVEL ADAPTATIONS ──
        // Use only exact TMDB adaptation keywords; no genre or loose title matching.
        // This keeps the Home row limited to titles explicitly tagged as literary adaptations.
        let _bookAdaptationItemsCache = null;
        async function _getBookAdaptationItems() {
            if (_bookAdaptationItemsCache) return _bookAdaptationItemsCache;
            const keywordIds = await _resolveKeywordIds([
                'based on novel', 'based on book', 'literary adaptation',
                'based on novel or book'
            ]);
            if (!keywordIds.length) return [];
            const keywordQuery = keywordIds.join('|');
            const [movieItems, tvItems] = await Promise.all([
                _fetchDiscoverPages(`discover/movie?with_keywords=${keywordQuery}&vote_count.gte=10&without_genres=99&include_adult=false&sort_by=popularity.desc`, 8),
                _fetchDiscoverPages(`discover/tv?with_keywords=${keywordQuery}&vote_count.gte=10&without_genres=99&include_adult=false&sort_by=popularity.desc`, 6)
            ]);
            movieItems.forEach(x => { x.media_type = 'movie'; });
            tvItems.forEach(x => { x.media_type = 'tv'; });
            _bookAdaptationItemsCache = _uniqById(movieItems.concat(tvItems.filter(x => !isTVShowExcluded(x))))
                .filter(x => _passesHomeNRFilter(x, x.media_type));
            const moviesForIMDb = _bookAdaptationItemsCache.filter(x => x.media_type === 'movie');
            const seriesForIMDb = _bookAdaptationItemsCache.filter(x => x.media_type === 'tv');
            await Promise.all([
                _enrichIMDbRatings(moviesForIMDb, 'movie', 80),
                _enrichIMDbRatings(seriesForIMDb, 'tv', 60)
            ]);
            return _bookAdaptationItemsCache;
        }

        // ── ADULT (18+) category ──
        // Titles load like every other row, but remain visually obscured until age confirmation.
        const ADULT_CATEGORY_CONSENT_KEY = 'fn_adult_category_18_confirmed';
        function hasAdultCategoryConsent() {
            try { return localStorage.getItem(ADULT_CATEGORY_CONSENT_KEY) === 'yes'; } catch(e) { return false; }
        }
        function _adultGateCopy() {
            return LANG === 'fa'
                ? { button: 'من ۱۸ سال یا بیشتر دارم', note: 'برای نمایش آثار بزرگسال، سن خود را تأیید کنید' }
                : { button: "I'm 18 or older", note: 'Confirm your age to reveal adult titles' };
        }
        function enableAdultCategoryAccess() {
            try { localStorage.setItem(ADULT_CATEGORY_CONSENT_KEY, 'yes'); } catch(e) {}
            document.querySelectorAll('.adult-category-section').forEach(x => x.classList.remove('adult-locked'));
            document.querySelectorAll('#generic-grid-page').forEach(x => x.classList.remove('adult-grid-locked'));
            document.querySelectorAll('.adult-age-gate').forEach(x => x.remove());
            return true;
        }
        function applyAdultRowGate(row) {
            const section = row && row.closest('.adult-category-section');
            if (!section || hasAdultCategoryConsent()) return;
            section.classList.add('adult-locked');
            if (section.querySelector('.adult-age-gate')) return;
            const copy = _adultGateCopy();
            const gate = document.createElement('button');
            gate.type = 'button'; gate.className = 'adult-age-gate adult-row-age-gate';
            gate.innerHTML = `<i class="fa-solid fa-lock"></i><span>${copy.button}</span><small>${copy.note}</small>`;
            gate.setAttribute('onclick', 'enableAdultCategoryAccess()');
            section.appendChild(gate);
        }
        function applyAdultGridGate() {
            const page = document.getElementById('generic-grid-page');
            const content = document.getElementById('gg-content');
            if (!page || !content || hasAdultCategoryConsent()) return;
            page.classList.add('adult-grid-locked');
            if (content.querySelector('.adult-age-gate')) return;
            const copy = _adultGateCopy();
            const gate = document.createElement('button');
            gate.type = 'button'; gate.className = 'adult-age-gate adult-grid-age-gate';
            gate.innerHTML = `<i class="fa-solid fa-lock"></i><span>${copy.button}</span><small>${copy.note}</small>`;
            gate.setAttribute('onclick', 'enableAdultCategoryAccess()');
            content.appendChild(gate);
        }
        function openAdultCategory() {
            const title = (TEXTS[LANG] && TEXTS[LANG].R_adult) || '🔞 Adults Only (18+)';
            openGenericGrid('movie', 'custom:adult', title);
        }
        // This category deliberately uses only the following exact TMDB keywords.
        // It does not alter the keyword/tags of any title or any other category.
        const ADULT_CATEGORY_KEYWORD_TERMS = [
            'adult', 'sex', 'sexual desire', 'sexual relationship', 'erotic',
            'erotic romance', 'nudity', 'female nudity', 'male frontal nudity', 'seduction'
        ];
        let _adultKeywordItemsCache = null;
        async function _getAdultKeywordItems() {
            if (_adultKeywordItemsCache) return _adultKeywordItemsCache;
            const ids = await _resolveKeywordIds(ADULT_CATEGORY_KEYWORD_TERMS);
            if (!ids.length) return [];
            const keywords = ids.join('|');
            const [movies, shows] = await Promise.all([
                _fetchDiscoverPages(`discover/movie?with_keywords=${keywords}&sort_by=popularity.desc&include_adult=false`, 8),
                _fetchDiscoverPages(`discover/tv?with_keywords=${keywords}&sort_by=popularity.desc&include_adult=false`, 4)
            ]);
            const seen = new Set();
            const addUnique = (item, media_type) => {
                if (!item || !item.id || !item.poster_path) return null;
                const key = `${media_type}:${item.id}`;
                if (seen.has(key)) return null;
                seen.add(key);
                return { ...item, media_type };
            };
            _adultKeywordItemsCache = movies.map(x => addUnique(x, 'movie')).filter(Boolean)
                .concat(shows.map(x => addUnique(x, 'tv')).filter(x => x && !isTVShowExcluded(x)));
            return _adultKeywordItemsCache;
        }

        // Cinematic per-category loader. It is only a temporary presentation layer;
        // category data, queries, ordering and interactions remain unchanged.
        function fnBeginCategoryLoader(elId) {
            const row = document.getElementById(elId);
            if (!row) return null;
            const isFa = LANG === 'fa';
            row.classList.add('fn-row-is-loading');
            row.setAttribute('aria-busy', 'true');
            row.innerHTML = `<div class="fn-row-loader" role="status" aria-live="polite">
                <div class="fn-row-loader-core"><div class="fn-row-reel"></div><div class="fn-row-loader-copy">${isFa ? 'در حال آماده‌سازی پرده' : 'Preparing the screen'}<small>${isFa ? 'لحظه‌ای دیگر…' : 'Just a moment…'}</small></div></div>
                <div class="fn-row-loader-cards"><div class="fn-row-loader-card"><div class="fn-row-loader-lines"></div></div><div class="fn-row-loader-card"><div class="fn-row-loader-lines"></div></div><div class="fn-row-loader-card"><div class="fn-row-loader-lines"></div></div><div class="fn-row-loader-card"><div class="fn-row-loader-lines"></div></div></div>
            </div>`;
            return row;
        }
        function fnFinishCategoryLoader(row) {
            if (!row) return;
            row.classList.remove('fn-row-is-loading');
            row.removeAttribute('aria-busy');
            row.innerHTML = '';
        }

        async function loadAdultRow(elId) {
            const row = fnBeginCategoryLoader(elId);
            if (!row) return;
            // Show the age gate immediately; titles continue loading underneath it.
            applyAdultRowGate(row);
            const d = await getCustomCategoryResults('custom:adult', 1, 'default');
            fnFinishCategoryLoader(row);
            if (d && d.results) d.results.slice(0, 20).forEach(m => { row.insertAdjacentHTML('beforeend', makeCard(m, m.media_type || 'movie')); });
            applyAdultRowGate(row);
        }

        const _seasonalCategoryCache = {};
        async function _getThemeCategoryItems(kind) {
            const cacheKey = kind + '|' + LANG;
            if (_seasonalCategoryCache[cacheKey]) return _seasonalCategoryCache[cacheKey];
            const terms = kind === 'christmas_time'
                ? ['christmas','santa claus','christmas eve','christmas movie','holiday','xmas','christmas party','christmas spirit']
                : kind === 'apocalypse'
                    ? ['apocalypse','post-apocalyptic','end of the world','dystopia','nuclear holocaust','pandemic','zombie apocalypse','disaster']
                    : ['survival','stranded','trapped','hunted','escape','wilderness survival','castaway','hostage','isolation','killer'];
            const ids = await _resolveKeywordIds(terms);
            let all = [];
            for (let termIndex = 0; termIndex < ids.length; termIndex++) {
                const id = ids[termIndex];
                const relevance = ids.length - termIndex;
                const [movies, shows] = await Promise.all([
                    _fetchDiscoverPages(`discover/movie?with_keywords=${id}&vote_count.gte=10&sort_by=popularity.desc&include_adult=false`, 4),
                    _fetchDiscoverPages(`discover/tv?with_keywords=${id}&vote_count.gte=10&sort_by=popularity.desc&include_adult=false&without_genres=99,10763,10764,10767,10766`, 4)
                ]);
                all.push(...movies.map(x => ({...x, media_type:'movie', __themeRel:relevance})), ...shows.map(x => ({...x, media_type:'tv', __themeRel:relevance})));
            }
            const seen = new Set();
            const unique = all.filter(x => {
                if (!x || !x.id || !x.poster_path || !_isRatedWork(x) || (x.media_type === 'tv' && isTVShowExcluded(x))) return false;
                const key = `${x.media_type}:${x.id}`;
                if (seen.has(key)) return false;
                seen.add(key); return true;
            });
            _seasonalCategoryCache[cacheKey] = unique;
            return unique;
        }

        async function getCustomCategoryResults(q, page=1, mode='default') {
            const perPage = CUSTOM_PAGE_SIZE;
            const [_, kind, a, b] = q.split(':');
            const key = [q, page, mode, LANG, (typeof window !== 'undefined' && window.__fnHomeEnrich) ? 'home40' : 'full'].join('|');
            if(SMART_ROW_CACHE[key]) return SMART_ROW_CACHE[key];
            let items=[], total=999, type='movie', defaultMode='imdb';
            if(kind === 'updated_series') {
                type='tv'; defaultMode='recent_popular';
                const base = [
                    `tv/on_the_air?sort_by=popularity.desc`,
                    `tv/airing_today?sort_by=popularity.desc`,
                    `discover/tv?first_air_date.gte=2025-01-01&first_air_date.lte=2026-12-31&sort_by=popularity.desc&vote_count.gte=40&include_adult=false`
                ];
                for(const qq of base) items = items.concat(await _fetchDiscoverPages(qq, 2));
                items = _uniqById(items).filter(x=>!isTVShowExcluded(x) && !((x.genre_ids||[]).includes(99)));
            } else if(kind === 'top_movies') {
                type='movie'; defaultMode='imdb';
                items = await _fetchDiscoverPages(`movie/top_rated?vote_count.gte=25000&include_adult=false`, 8);
                items = await _enrichIMDbRatings(items, type, 100); total=250;
            } else if(kind === 'top_tv') {
                type='tv'; defaultMode='imdb';
                items = await _fetchDiscoverPages(`tv/top_rated?vote_count.gte=2500&include_adult=false&without_genres=99,10763,10764,10767,10766`, 8);
                items = items.filter(x=>!isTVShowExcluded(x) && !((x.genre_ids||[]).includes(99)));
                items = await _enrichIMDbRatings(items, type, 100); total=250;
            } else if(kind === 'miniseries') {
                type='tv'; defaultMode='imdb';
                items = await _fetchDiscoverPages(`discover/tv?with_type=2&without_genres=99,10763,10764,10767,10766&vote_count.gte=100&sort_by=vote_average.desc&include_adult=false`, 8);
                items = items.filter(x=>!isTVShowExcluded(x) && !((x.genre_ids||[]).includes(99)));
                items = await _enrichIMDbRatings(items, type, 120);
            } else if(kind === 'emmy' || kind === 'golden_globe' || kind === 'academy_award') {
                // Award categories resolve only their verified winner records. The
                // complete winner pool is sorted before pagination, so every grid
                // sort/filter remains truthful and the default is newest ceremony first.
                const awardList = kind === 'emmy' ? EMMY_WINNER_TITLES : (kind === 'golden_globe' ? GOLDEN_GLOBE_WINNER_TITLES : OSCAR_WINNER_TITLES.map(x=>({...x,type:'movie'})));
                type = kind === 'emmy' ? 'tv' : (kind === 'golden_globe' ? 'mixed' : 'movie');
                const resolved = kind === 'academy_award' ? await _fetchTitleList(awardList,'movie',1,awardList.length) : await _fetchAwardList(awardList,1,awardList.length, kind === 'emmy' ? 'tv' : 'movie');
                // No NR/unrated placeholders in Emmy or Golden Globe rows.
                const ratedResolved = _uniqById(resolved.filter(_isRatedWork));
                const sorted = [...ratedResolved].sort((x,y) => {
                    const ay=x.__awardYear||_releaseYearOf(x,x.media_type||type), by=y.__awardYear||_releaseYearOf(y,y.media_type||type);
                    if (mode === 'oldest') return ay-by || String(x.title||x.name).localeCompare(String(y.title||y.name));
                    if (mode === 'popular') return (y.vote_count||0)-(x.vote_count||0)||(y.popularity||0)-(x.popularity||0)||by-ay;
                    if (mode === 'rating' || mode === 'imdb') return (y.vote_average||0)-(x.vote_average||0)||(y.vote_count||0)-(x.vote_count||0)||by-ay;
                    return by-ay || String(x.title||x.name).localeCompare(String(y.title||y.name));
                });
                const start=(page-1)*perPage;
                return {results:sorted.slice(start,start+perPage),total_pages:Math.max(1,Math.ceil(sorted.length/perPage)),type};
            } else if(kind === 'oscar') {
                type='movie'; defaultMode='newest';
                const sorted = [...OSCAR_WINNER_TITLES].sort((x,y)=>y.year-x.year);
                items = await _fetchTitleList(sorted, 'movie', page, perPage);
                const payload={results:items,total_pages:Math.ceil(sorted.length/perPage),type}; SMART_ROW_CACHE[key]=payload; return payload;
            } else if(kind === 'decade') {
                type='movie'; defaultMode='imdb';
                const start=a, end=b;
                items = await _fetchDiscoverPages(`discover/movie?primary_release_date.gte=${start}-01-01&primary_release_date.lte=${end}-12-31&vote_count.gte=1000&sort_by=vote_average.desc&include_adult=false`, 8);
                items = await _enrichIMDbRatings(items, type, 100);
            } else if(kind === 'best_decade') {
                // Best-of-decade rows use a stricter quality gate than ordinary decade rows.
                // This keeps low-rated, lightly-voted titles out of a category explicitly
                // labelled "Best", while retaining the existing See All sort behavior.
                type='movie'; defaultMode='imdb';
                const start=a, end=b;
                items = await _fetchDiscoverPages(`discover/movie?primary_release_date.gte=${start}-01-01&primary_release_date.lte=${end}-12-31&vote_count.gte=1000&vote_average.gte=7&sort_by=vote_average.desc&include_adult=false`, 8);
                items = items.filter(x => (x.vote_average || 0) >= 7 && (x.vote_count || 0) >= 1000);
                items = await _enrichIMDbRatings(items, type, 100);
            } else if(kind === 'romcom') {
                type='movie'; defaultMode='random';
                items = await _fetchDiscoverPages(`discover/movie?with_genres=35,10749&vote_count.gte=300&sort_by=popularity.desc&include_adult=false`, 6);
            } else if(kind === 'parody') {
                type='movie'; defaultMode='random';
                // Build one stable, unique pool so Home's 20 cards and every
                // See All page never reshuffle into duplicates between pages.
                if (!window._parodyStablePool || window._parodyStablePoolLang !== LANG) {
                    const kwIds = await _resolveKeywordIds(['parody', 'spoof']);
                    const kw = kwIds.join('|');
                    let parodyPool = kw ? await _fetchDiscoverPages(`discover/movie?with_keywords=${kw}&vote_count.gte=300&sort_by=popularity.desc&include_adult=false`, 6) : [];
                    parodyPool = _uniqById(parodyPool).filter(it => _passesHomeNRFilter(it, 'movie'));
                    const seed = 73129;
                    parodyPool.sort((x,y) => {
                        const sx = _homeMixScore(x, 'movie', seed), sy = _homeMixScore(y, 'movie', seed);
                        return sy - sx;
                    });
                    window._parodyStablePool = parodyPool;
                    window._parodyStablePoolLang = LANG;
                }
                const start = (page - 1) * perPage;
                const pageItems = window._parodyStablePool.slice(start, start + perPage);
                const payload = {results: pageItems, total_pages: Math.max(1, Math.ceil(window._parodyStablePool.length / perPage)), type};
                SMART_ROW_CACHE[key] = payload;
                return payload;
            } else if(kind === 'survival' || kind === 'christmas_time' || kind === 'apocalypse') {
                type='mixed'; defaultMode=kind === 'survival' ? 'relevance' : 'imdb';
                items = await _getThemeCategoryItems(kind);
            } else if(kind === 'a24') {
                type='mixed'; defaultMode='random';
                if (!window._a24StablePool || window._a24StablePoolLang !== LANG) {
                    const [movies, shows] = await Promise.all([
                        _fetchDiscoverPages('discover/movie?with_companies=41077&vote_count.gte=1&include_adult=false&sort_by=popularity.desc', 20),
                        _fetchDiscoverPages('discover/tv?with_companies=41077&vote_count.gte=1&include_adult=false&sort_by=popularity.desc', 20)
                    ]);
                    const pool = _uniqByWork(movies.map(x=>({...x,media_type:'movie'})).concat(shows.map(x=>({...x,media_type:'tv'}))))
                        .filter(x => x.poster_path && _isRatedWork(x) && !(x.media_type === 'tv' && isTVShowExcluded(x)));
                    pool.sort((a,b) => (((a.id*7919)%100000) - ((b.id*7919)%100000)));
                    window._a24StablePool = pool;
                    window._a24StablePoolLang = LANG;
                }
                items = window._a24StablePool;
} else if(kind === 'heartbreak_loss') {
                type='mixed'; defaultMode='random';
                // Keep the hand-picked classics, then expand with a large pool of
                // strongly matching heartbreak/grief keywords. The quality gates
                // prevent generic romance and unrated placeholders from leaking in.
                const curated = await _fetchAwardList(HEARTBREAK_LOSS_TITLES, 1, HEARTBREAK_LOSS_TITLES.length);
                if (!window._heartbreakStablePool || window._heartbreakStablePoolLang !== LANG) {
                    const keywordNames = ['heartbreak','grief','mourning','bereavement','death of a loved one','separation','widow','tragic love','unrequited love','terminal illness'];
                    const keywordIds = await _resolveKeywordIds(keywordNames);
                    const keywordQuery = keywordIds.join('|');
                    const queries = keywordIds.slice(0, 10).flatMap(k => [
                        {q:`discover/movie?with_keywords=${k}&with_genres=18&vote_count.gte=20&vote_average.gte=6&sort_by=popularity.desc&include_adult=false`, type:'movie'},
                        {q:`discover/tv?with_keywords=${k}&with_genres=18&vote_count.gte=20&vote_average.gte=6&sort_by=popularity.desc&include_adult=false`, type:'tv'}
                    ]);
                    let expanded = [];
                    for (const source of queries) expanded = expanded.concat((await _fetchDiscoverPages(source.q, 4)).map(x => ({...x, media_type:source.type})));
                    expanded = _uniqById(expanded).filter(x => _isRatedWork(x) && x.poster_path && !((x.genre_ids||[]).includes(99)) && (!x.media_type || x.media_type === 'movie' || x.media_type === 'tv'));
                    const all = _uniqByWork(curated.concat(expanded));
                    window._heartbreakStablePool = all;
                    window._heartbreakStablePoolLang = LANG;
                }
                items = window._heartbreakStablePool.map(x => ({...x, __heartbreakLoss:true}));
            } else if(kind === 'iran_pre1978') {
                type='mixed'; defaultMode='random';
                const historicBase = 'with_original_language=fa&with_origin_country=IR&primary_release_date.lte=1977-12-31&first_air_date.lte=1977-12-31&vote_count.gte=1&include_adult=false&without_genres=99';
                const [historicMovies, historicSeries] = await Promise.all([
                    _fetchDiscoverPages(`discover/movie?${historicBase}&sort_by=popularity.desc`, 10),
                    _fetchDiscoverPages(`discover/tv?${historicBase}&sort_by=popularity.desc&without_genres=99,10763,10764,10767,10766`, 10)
                ]);
                items = historicMovies.map(x => ({...x, media_type:'movie', __iranClassic:true}))
                    .concat(historicSeries.map(x => ({...x, media_type:'tv', __iranClassic:true})))
                    .filter(x => !isTVShowExcluded(x));
            } else if(kind === 'adult') {
                type='mixed'; defaultMode='random';
                // Dedicated keyword-based source: includes films and series with
                // explicit adult-theme keywords, even when TMDB's adult flag is absent.
                items = await _getAdultKeywordItems();
            } else if(kind === 'sports') {
                type='movie'; defaultMode='random';
                items = await _getSportsItems();
            } else if(kind === 'mental_health') {
                type='movie'; defaultMode='random';
                items = await _getMentalHealthItems();
            } else if(kind === 'documentaries') {
                type='movie'; defaultMode='popular';
                items = await _getDocumentaryItems();
            } else if(kind === 'book_adaptations') {
                type='mixed'; defaultMode='imdb';
                items = await _getBookAdaptationItems();
            }
            // The adult category has already been narrowed solely by its exact
            // keyword list; all other categories retain their existing home filter.
            items = (kind === 'adult')
                ? items.filter(it => it && it.poster_path)
                : items.filter(it => _passesHomeNRFilter(it, it.media_type || type));
            items = _applySmartSort(_uniqById(items), type, mode, defaultMode);
            if(total===250) items = items.slice(0,250);
            const start=(page-1)*perPage;
            const payload={results:items.slice(start,start+perPage), total_pages:Math.max(1, Math.ceil(Math.min(total, items.length || total)/perPage)), type};
            SMART_ROW_CACHE[key]=payload;
            return payload;
        }
        const HOME_MIX_CACHE = {};
        function _homeMixScore(item, type, seed) {
            const year = _releaseYearOf(item, type);
            const vote = Math.log10((item.vote_count || 0) + 10);
            const pop = Math.log10((item.popularity || 0) + 1);
            const recent = Math.max(0, Math.min(1, (year - 1950) / 76));
            let h = ((item.id || 0) * 9301 + seed * 49297) % 233280;
            const random = h / 233280;
            return vote * 0.38 + recent * 0.30 + pop * 0.20 + random * 0.12;
        }
        async function getHomeMixedResults(q, page=1, mode='default', type='movie') {
            const clean = q.replace(/&fn_home_mix=1/g, '');
            const key = clean + '|' + LANG;
            if (!HOME_MIX_CACHE[key]) {
                const items = await _fetchDiscoverPages(clean, 3);
                const seed = Math.floor(Math.random() * 100000);
                const unique = _uniqById(items).filter(x => _passesHomeNRFilter(x, x.media_type || type) && !(type === 'tv' && isTVShowExcluded(x)));
                HOME_MIX_CACHE[key] = { seed, items: unique.sort((a,b) => _homeMixScore(b,type,seed) - _homeMixScore(a,type,seed)) };
            }
            const pool = HOME_MIX_CACHE[key].items;
            let sorted = [...pool];
            if (mode === 'newest') sorted.sort((a,b)=>_releaseYearOf(b,type)-_releaseYearOf(a,type)||(b.vote_count||0)-(a.vote_count||0));
            else if (mode === 'popular') sorted.sort((a,b)=>(b.vote_count||0)-(a.vote_count||0)||(b.popularity||0)-(a.popularity||0));
            else if (mode === 'oldest') sorted.sort((a,b)=>_releaseYearOf(a,type)-_releaseYearOf(b,type)||(b.vote_count||0)-(a.vote_count||0));
            const start=(page-1)*CUSTOM_PAGE_SIZE;
            return {results: sorted.slice(start,start+CUSTOM_PAGE_SIZE), total_pages:Math.max(1,Math.ceil(sorted.length/CUSTOM_PAGE_SIZE)), type};
        }

        async function loadRow(q, elId, type) {
            const loadingRow = fnBeginCategoryLoader(elId);
            // Mixed Home categories use one unique pool for Home and See All.
            if (q && q.includes('&fn_home_mix=1')) {
                const d = await getHomeMixedResults(q, 1, 'default', type);
                const c = document.getElementById(elId);
                fnFinishCategoryLoader(c);
                if (d && d.results) d.results.forEach(m => c.innerHTML += makeCard(m, type));
                return;
            }
            // Special handling for Curator's Pick
            if (q && q.startsWith('custom:')) {
                const homeMode = q.startsWith('custom:best_decade:') ? 'random' : 'default';
                window.__fnHomeEnrich = true;
                let d;
                try { d = await getCustomCategoryResults(q, 1, homeMode); }
                finally { window.__fnHomeEnrich = false; }
                const c = document.getElementById(elId);
                fnFinishCategoryLoader(c);
                if(d && d.results) d.results.slice(0, 20).forEach(m => { const cardType = d.type === 'mixed' ? (m.media_type || 'movie') : (d.type || type); if (cardType === 'tv' && isTVShowExcluded(m)) return; c.innerHTML += makeCard(m, cardType); });
                return;
            }
            if (q === 'curator_picks') {
                fnFinishCategoryLoader(loadingRow);
                await loadCuratorPicks(elId);
                return;
            }
            const d = await getData(q);
            const c = document.getElementById(elId);
            fnFinishCategoryLoader(c);
            if(!d.results) return;
            d.results.forEach(m => {
                // Filter out talk shows, reality shows, news for TV sections
                if (type === 'tv' && isTVShowExcluded(m)) return;
                // Universal Home NR filter: hide unrated items unless a genuine 2026 release
                if (!_passesHomeNRFilter(m, m.media_type || type)) return;
                c.innerHTML += makeCard(m, type);
            });
        }
        // makeCard is defined later in the v13 new features section with enhanced badges
        
        function makePersonCard(p) {
            if (!p.profile_path) return '';
            const isDirector = p.known_for_department === 'Directing';
            return `
                <div class="actor-card" onclick="openDetail(${p.id}, 'person_works')">
                    <img src="${IMG + p.profile_path}" class="actor-img ${isDirector ? 'director-img' : ''}" loading="lazy">
                    ${isDirector ? `<span class="director-label">Dir</span>` : ''}
                    <div class="actor-name">${p.name}</div>
                </div>
            `;
        }
        
        // Helper function to check if title matches letter filter
        function matchesLetterFilter(title, letterFilter) {
            if (!letterFilter || letterFilter === '') return true;
            
            const trimmedTitle = title.trim();
            if (!trimmedTitle) return false;
            
            const firstChar = trimmedTitle.charAt(0).toUpperCase();
            
            if (letterFilter === '0-9') {
                // Only match if title STARTS with a number (not words inside)
                return /^[0-9]/.test(firstChar);
            } else {
                // For letters, check first character of the title OR any word in the title
                // This allows finding "The Walking Dead" with W
                const words = trimmedTitle.split(/\s+/);
                for (const word of words) {
                    const wordFirstChar = word.charAt(0).toUpperCase();
                    if (wordFirstChar === letterFilter.toUpperCase()) return true;
                }
                return false;
            }
        }
        
        // --- DISCOVERY STATE ---
        let discDefaultMode = false;
        let discDefaultSeenIds = new Set();
        let discDefaultPriorityIds = [];
        let discDefaultPriorityIndex = 0;
        let discDefaultPriorityDone = false;
        let discShownIds = new Set(); // Track ALL shown items to prevent duplicates

        // --- DISCOVERY LOGIC ---
        function updateDiscovery(type) {
            discType = type; discPage = 1;
            const prefix = type === 'movie' ? 'm' : 's';

            const sort    = document.getElementById(prefix+'-sort').value;
            const genre   = document.getElementById(prefix+'-genre').value;
            const country = document.getElementById(prefix+'-country').value;
            const yearEl  = document.getElementById(prefix+'-year');
            const yearVal = yearEl ? yearEl.value : '';
            const letterEl = document.getElementById(prefix+'-letter');
            const letterVal = letterEl ? letterEl.value : '';

            // Check if any extra filters are active
            const hasGenre = genre && genre !== '' && genre !== '__all_genres__';
            const hasYear  = yearVal && yearVal !== '' && yearVal !== '__all_years__';
            const hasLetter = letterVal && letterVal !== '';
            // __none__ = no country filter (show all countries)
            const hasCountry = country && country !== '__none__' && country !== '__default__';

            // discDefaultMode is NEVER used now - always use normal runDiscovery
            discDefaultMode = false;

            // Build base TMDB discover query
            let q = `discover/${type}?include_adult=false&vote_count.gte=1`;

            // Handle sort
            if (sort === 'random') {
                q += `&sort_by=popularity.desc`;
                window.useRandomSort = true;
            } else {
                window.useRandomSort = false;
                let sortVal = sort;
                if (type === 'tv' && sort === 'revenue.desc') sortVal = 'popularity.desc';
                q += `&sort_by=${sortVal}`;
            }

            // Add country filter only if a specific country is selected
            if (hasCountry) {
                q += `&with_origin_country=${country}`;
            }

            if (hasGenre) {
                q += `&with_genres=${genre}`;
            }

            if (hasYear) {
                if (yearVal.includes('s')) {
                    const start = parseInt(yearVal.replace('s',''));
                    const end = start + 9;
                    if (type === 'movie') {
                        q += `&primary_release_date.gte=${start}-01-01&primary_release_date.lte=${end}-12-31`;
                    } else {
                        q += `&first_air_date.gte=${start}-01-01&first_air_date.lte=${end}-12-31`;
                    }
                } else {
                    if (type === 'movie') q += `&primary_release_year=${yearVal}`;
                    else q += `&first_air_date_year=${yearVal}`;
                }
            }

            discQuery = q;
            
            // Store letter filter separately for client-side filtering
            window.currentLetterFilter = letterVal;

            // Reset paging state AND shown IDs
            discDefaultSeenIds = new Set();
            discDefaultPriorityIds = [];
            discDefaultPriorityIndex = 0;
            discDefaultPriorityDone = false;
            discShownIds = new Set();

            const c = document.getElementById(type === 'movie' ? 'movies-grid' : 'series-grid');
            
            if (discPage === 1) {
                c.innerHTML = '';
            }
            
            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'discovery-loading';
            loadingDiv.style.cssText = 'grid-column:1/-1;text-align:center;padding:30px;';
            loadingDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);"></i><br><p style="margin-top:10px;color:#888;font-size:13px;">' + (LANG === 'fa' ? 'در حال جستجو...' : 'Searching...') + '</p>';
            c.appendChild(loadingDiv);
            
            // Run discovery
            runDiscovery(c);
        }

        async function loadMoreDiscovery(type) {
            const container = document.getElementById(type === 'movie' ? 'movies-grid' : 'series-grid');
            
            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'discovery-loading';
            loadingDiv.style.cssText = 'grid-column:1/-1;text-align:center;padding:30px;';
            loadingDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);"></i><br><p style="margin-top:10px;color:#888;font-size:13px;">' + (LANG === 'fa' ? 'در حال بارگذاری...' : 'Loading...') + '</p>';
            container.appendChild(loadingDiv);
            
            discPage++;
            runDiscovery(container);
        }

        async function runDiscovery(container) {
            {
                const letterFilter = window.currentLetterFilter;
                const hasLetterFilter = letterFilter && letterFilter !== '';
                
                // If letter filter is active, we need to fetch MORE pages to get enough results
                const pagesToFetch = hasLetterFilter ? 20 : 1;
                let allResults = [];
                
                for (let p = 0; p < pagesToFetch; p++) {
                    const currentPage = discPage + p;
                    let d = await getData(`${discQuery}&page=${currentPage}`);
                    
                    // If no results on page 1, retry with relaxed vote_count for sparse countries/genres
                    if ((!d || !d.results || d.results.length === 0) && currentPage === 1) {
                        const relaxedQ = discQuery.replace('vote_count.gte=10', 'vote_count.gte=1');
                        d = await getData(`${relaxedQ}&page=${currentPage}`);
                    }
                    
                    if (d && d.results && d.results.length > 0) {
                        allResults = allResults.concat(d.results);
                    } else if (currentPage === 1) {
                        // No results at all
                        break;
                    }
                    
                    // Small delay to avoid rate limiting
                    if (p > 0 && p % 5 === 0) {
                        await new Promise(r => setTimeout(r, 100));
                    }
                }
                
                // Remove loading indicator
                const loadingEl = document.getElementById('discovery-loading');
                if (loadingEl) loadingEl.remove();
                
                if (allResults.length > 0) {
                    // Apply letter filter if active
                    let filteredResults = allResults;
                    if (hasLetterFilter) {
                        filteredResults = allResults.filter(m => {
                            const title = (m.title || m.name || '').trim();
                            return matchesLetterFilter(title, letterFilter);
                        });
                    }
                    
                    // Remove duplicates using BOTH the results set AND the global shown IDs
                    const seen = new Set();
                    filteredResults = filteredResults.filter(m => {
                        if (seen.has(m.id) || discShownIds.has(m.id)) return false;
                        seen.add(m.id);
                        discShownIds.add(m.id); // Add to global set
                        return true;
                    });
                    
                    // Apply random sort if enabled, otherwise sort by rating
                    let sorted;
                    if (window.useRandomSort) {
                        // Fisher-Yates shuffle for truly random order
                        sorted = filteredResults.slice();
                        for (let i = sorted.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
                        }
                    } else {
                        // Sort: items with no rating (NR) go to the very bottom
                        sorted = filteredResults.slice().sort((a, b) => {
                            const aHasRating = a.vote_average && a.vote_average > 0 && a.vote_count && a.vote_count >= 10;
                            const bHasRating = b.vote_average && b.vote_average > 0 && b.vote_count && b.vote_count >= 10;
                            if (aHasRating && !bHasRating) return -1;
                            if (!aHasRating && bHasRating) return 1;
                            return 0;
                        });
                    }
                    
                    const prevCount = container.children.length;
                    
                    // Show 18 items
                    const itemsToShow = sorted.slice(0, 18);
                    
                    itemsToShow.forEach(m => {
                        if (discType === 'tv' && isTVShowExcluded(m)) return;
                        container.innerHTML += makeCard(m, discType);
                    });
                    
                    if (container.children.length === prevCount && discPage === 1) {
                        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#666;"><i class="fa-solid fa-film" style="font-size:40px;margin-bottom:15px;display:block;"></i><p>${LANG === 'fa' ? 'نتیجه‌ای یافت نشد. فیلترها را تغییر دهید.' : 'No results found. Try different filters.'}</p></div>`;
                    }
                } else if (discPage === 1) {
                    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#666;"><i class="fa-solid fa-film" style="font-size:40px;margin-bottom:15px;display:block;"></i><p>${LANG === 'fa' ? 'نتیجه‌ای یافت نشد. فیلترها را تغییر دهید.' : 'No results found. Try different filters.'}</p></div>`;
                }
            }
        }
;
