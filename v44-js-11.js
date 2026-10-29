(function(){
            try {
                var st = document.createElement('style');
                st.textContent = '.ai-quick-questions{display:flex!important;gap:6px!important;overflow-x:auto!important;flex-wrap:nowrap!important}.ai-quick-btn{display:inline-flex!important;align-items:center!important;white-space:nowrap!important;flex-shrink:0!important}.personality-action-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.personality-reset-btn,.personality-back-btn{background:#151525;border:1px solid #2a2a4a;color:#ddd;padding:9px 14px;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px}.personality-reset-btn{background:linear-gradient(135deg,rgba(229,9,20,.18),rgba(124,58,237,.18));border-color:rgba(229,9,20,.35);color:#fff}.p-work-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.p-work-card{background:#101018;border:1px solid #202038;border-radius:14px;overflow:hidden;cursor:pointer;min-width:0}.p-work-card:active{transform:scale(.98)}.p-work-poster{width:100%;height:170px;object-fit:cover;background:#1a1a1a}.p-work-info{padding:9px}.p-work-title{font-size:12px;font-weight:800;color:#fff;line-height:1.35;min-height:34px}.p-work-year{font-size:10px;color:#888;margin-top:3px}.p-work-reason{font-size:10.5px;color:#777;line-height:1.5;margin-top:6px}';
                document.head.appendChild(st);
            } catch(e) {}
        })();

        var _pLastResult = null;
        var _P_RESULT_KEY = 'familyNight_personality_result_v4_ai'; // FN-FIX3: old v3 key held canned template results; v4 holds AI results only
        var _pOpeningDetailFromPersonality = false;

        function _isFaText(v){ return /[\u0600-\u06FF]/.test(String(v||'')); }
        function _englishLoad(v){ return (String(v||'').match(/[A-Za-z]{3,}/g)||[]).length; }
        function _visiblePersianOverview(){
            try {
                var d = document.getElementById('d-desc');
                var t = d ? (d.textContent || '').trim() : '';
                return _isFaText(t) ? t : '';
            } catch(e) { return ''; }
        }
        function _faGenreText(raw){
            var map = {'Action':'اکشن','Adventure':'ماجراجویی','Animation':'انیمیشن','Comedy':'کمدی','Crime':'جنایی','Documentary':'مستند','Drama':'درام','Family':'خانوادگی','Fantasy':'فانتزی','History':'تاریخی','Horror':'ترسناک','Music':'موزیکال','Mystery':'معمایی','Romance':'عاشقانه','Science Fiction':'علمی‌تخیلی','Sci-Fi & Fantasy':'علمی‌تخیلی و فانتزی','TV Movie':'تلویزیونی','Thriller':'هیجانی','War':'جنگی','Western':'وسترن'};
            var s = String(raw||'').split(',').map(function(x){ x=x.trim(); return map[x] || x; }).join('، ');
            return s || 'نامشخص';
        }
        function _faPersonList(raw){ return String(raw||'').replace(/, /g,'، '); }

        function _ensureAIQuickQuestions(){
            try {
                var fa = LANG === 'fa';
                var title = aiCurrentTitle || (fa ? 'این اثر' : 'this title');
                var qs = fa ? [
                    'خلاصه داستان «' + title + '» را کامل و فارسی بگو',
                    'نقاط قوت و ضعف «' + title + '» چیست؟',
                    'بازیگران و شخصیت‌های مهم «' + title + '» را تحلیل کن',
                    'پایان و اسپویل کامل «' + title + '» را توضیح بده',
                    'فکت‌های جالب و مطمئن درباره «' + title + '» بگو',
                    'آثار مشابه «' + title + '» معرفی کن'
                ] : [
                    'Summarize "' + title + '"',
                    'Strengths and weaknesses?',
                    'Analyze main cast and characters',
                    'Explain the ending with spoilers',
                    'Interesting confirmed facts',
                    'Recommend similar titles'
                ];
                var html = qs.map(function(q){ return '<div class="ai-quick-btn" data-question="' + _fnEscAttr(q) + '" onclick="askQuick(this.dataset.question)">' + _fnEscHtml(q) + '</div>'; }).join('');
                var a = document.getElementById('ai-quick-btns'), b = document.getElementById('ai-fs-quick-btns');
                if (a) { a.innerHTML = html; a.style.display='flex'; }
                if (b) { b.innerHTML = html; b.style.display='flex'; }
                var inp = document.getElementById('ai-input'), finp = document.getElementById('ai-fs-input');
                if (inp) inp.placeholder = fa ? 'سوالت را فارسی بپرس...' : 'Ask a question...';
                if (finp) finp.placeholder = fa ? 'سوالت را فارسی بپرس...' : 'Ask a question...';
            } catch(e) {}
        }

        var _oldInitAIBox_v3 = typeof initAIBox === 'function' ? initAIBox : null;
        initAIBox = function(title, type, year, richData){
            richData = richData || {};
            if (LANG === 'fa') {
                var vis = _visiblePersianOverview();
                if (vis) richData.overviewFa = vis;
            }
            if (_oldInitAIBox_v3) _oldInitAIBox_v3(title, type, year, richData);
            _ensureAIQuickQuestions();
            setTimeout(_ensureAIQuickQuestions, 150);
            setTimeout(_ensureAIQuickQuestions, 700);
        };

        _localAIAnswer = function(question) {
            var fa = LANG === 'fa', r = aiRichData || {}, q = String(question || '').toLowerCase();
            var title = aiCurrentTitle || r.originalTitle || (fa ? 'این اثر' : 'this title');
            var year = r.year || '';
            var typeLabel = aiCurrentType === 'tv' ? (fa ? 'سریال' : 'series') : (fa ? 'فیلم' : 'movie');
            var overviewFa = r.overviewFa || _visiblePersianOverview();
            var overview = fa ? (overviewFa || '') : (r.overview || overviewFa || '');
            var genres = fa ? _faGenreText(r.genres) : (r.genres || 'Unknown');
            var cast = fa ? _faPersonList(r.cast) : (r.cast || '');
            var directors = fa ? _faPersonList(r.directors) : (r.directors || '');
            var rating = r.rating ? String(r.rating) + '/10' : (fa ? 'نامشخص' : 'Unknown');
            var runtime = r.runtime || '';
            function intro(){ return fa ? '**«'+title+'»**'+(year?' ('+year+')':'')+' یک '+typeLabel+' در ژانر '+genres+' است.' : '**'+title+'**'+(year?' ('+year+')':'')+' is a '+typeLabel+' in '+genres+'.'; }
            function noPlot(){ return fa ? 'اطلاعات رسمی کافی درباره جزئیات داستان این اثر در داده‌های فعلی وجود ندارد؛ بنابراین داستان ساختگی نمی‌سازم.' : 'The current official data does not include enough plot detail, so I will not invent story points.'; }
            if (/spoiler|اسپویل|پایان|ending|کامل/.test(q)) return fa ? intro()+'\n\n**اسپویل و پایان:** '+(overview||noPlot())+'\n\nاگر خلاصه رسمی کوتاه باشد، پاسخ هم فقط بر اساس اطلاعات قطعی همین اثر داده می‌شود.' : intro()+'\n\n**Spoiler/ending:** '+(overview||noPlot());
            if (/story|plot|summary|خلاصه|داستان|چیه/.test(q)) return fa ? intro()+'\n\n**خلاصه داستان:** '+(overview||noPlot())+(directors?'\n\n**کارگردان:** '+directors:'')+(cast?'\n**بازیگران اصلی:** '+cast:'') : intro()+'\n\n**Story summary:** '+(overview||noPlot())+(directors?'\n\n**Director(s):** '+directors:'')+(cast?'\n**Main cast:** '+cast:'');
            if (/strength|weak|نقطه|قوت|ضعف|نقد|review/.test(q)) return fa ? '**تحلیل حرفه‌ای کوتاه:**\n\n**نقاط قوت:** فضای ژانری مشخص، ایده مرکزی قابل دنبال‌کردن و امتیاز '+rating+'. '+(cast?'حضور بازیگران اصلی مثل '+cast+' هم به جذابیت اثر کمک می‌کند.':'')+'\n\n**نقاط ضعف احتمالی:** اگر دنبال جزئیات داستانی بسیار کامل باشی، داده رسمی موجود ممکن است محدود باشد.\n\n**جمع‌بندی:** برای علاقه‌مندان ژانر '+genres+' گزینه قابل بررسی است.' : '**Short review:**\n\n**Strengths:** clear genre identity and rating '+rating+'.\n\n**Verdict:** worth considering for fans of '+genres+'.';
            if (/fact|جالب|trivia/.test(q)) { var fs=[fa?'عنوان: '+title:'Title: '+title, fa?'سال: '+(year||'نامشخص'):'Year: '+(year||'Unknown'), fa?'ژانر: '+genres:'Genres: '+genres, fa?'امتیاز: '+rating:'Rating: '+rating]; if(runtime) fs.push((fa?'مدت/فصل: ':'Runtime/seasons: ')+runtime); if(directors) fs.push((fa?'کارگردان: ':'Director: ')+directors); return (fa?'**فکت‌های مطمئن درباره همین اثر:**\n':'**Confirmed facts:**\n')+fs.map(function(x){return '• '+x;}).join('\n'); }
            if (/similar|recommend|پیشنهاد|مشابه/.test(q)) return fa ? '**آثار مشابه:** برای پیدا کردن نزدیک‌ترین پیشنهادها، دنبال آثاری در فضای '+genres+' بگرد. اگر بخواهی دقیق‌تر انتخاب کنم، بگو بیشتر دنبال شباهت در داستانی، حال‌وهوا، بازیگران یا ژانر هستی.' : '**Similar recommendations:** look for titles around '+genres+'.';
            if (/character|cast|بازیگر|شخصیت/.test(q)) return fa ? '**بازیگران و شخصیت‌ها:** '+(cast||'در داده‌های فعلی بازیگران اصلی ثبت نشده‌اند.')+(directors?'\n\n**کارگردان:** '+directors:'') : '**Cast/characters:** '+(cast||'The current data does not list the main cast.')+(directors?'\n\n**Director(s):** '+directors:'');
            return fa ? intro()+'\n\n'+(overview||noPlot())+'\n\nمی‌توانی درباره داستان، اسپویل، نقد، بازیگران، فکت‌ها یا آثار مشابه همین اثر بپرسی.' : intro()+'\n\n'+(overview||noPlot());
        };

        callPollinations = async function(question) {
            var fa = LANG === 'fa';
            var sys = buildSystemPrompt();
            var langRule = fa ? '\n\nقانون زبان: پاسخ باید کاملاً فارسی باشد. هیچ جمله توضیحی انگلیسی ننویس. فقط نام خاص اثر/بازیگر می‌تواند انگلیسی بماند. اگر اطلاعات کافی نیست، فارسی و صادقانه بگو.' : '\n\nLanguage rule: answer in English.';
            var fullPrompt = sys + '\n\nسؤال کاربر: ' + question + langRule;
            try {
                var out = await _aiGenerateText(fullPrompt, { maxTokens: 1200, temperature: 0.35, timeout: 26000 });
                out = String(out||'').trim();
                if (out.length > 8) {
                    if (fa && (!_isFaText(out) || _englishLoad(out) > 14)) return _localAIAnswer(question);
                    return out;
                }
            } catch(e) {}
            return _localAIAnswer(question);
        };

        processAI = async function(question) {
            if (aiIsThinking) return;
            _ensureAIQuickQuestions();
            aiIsThinking = true;
            var b1 = document.getElementById('ai-send-btn'), b2 = document.getElementById('ai-fs-send-btn');
            if (b1) b1.disabled = true; if (b2) b2.disabled = true;
            addMsgToUI('user', question); showThinking();
            var answer = null;
            try { answer = await callPollinations(question); } catch(e) { answer = null; }
            if (!answer) answer = _localAIAnswer(question);
            if (LANG === 'fa' && (!_isFaText(answer) || _englishLoad(answer) > 14)) answer = _localAIAnswer(question);
            removeThinking();
            aiConversation.push({ role: 'user', content: question });
            aiConversation.push({ role: 'assistant', content: answer });
            if (aiConversation.length > 12) aiConversation = aiConversation.slice(-12);
            addMsgToUI('bot', answer);
            aiIsThinking = false;
            if (b1) b1.disabled = false; if (b2) b2.disabled = false;
            _ensureAIQuickQuestions();
        };

        askQuick = async function(question) { if (aiIsThinking) return; _ensureAIQuickQuestions(); await processAI(question); };

        function _pSaveResult(r){ try { _pLastResult = r; localStorage.setItem(_P_RESULT_KEY, JSON.stringify({ result:r, sel:_pSel, ts:Date.now() })); } catch(e) { _pLastResult = r; } }
        function _pLoadSaved(){ try { var x = JSON.parse(localStorage.getItem(_P_RESULT_KEY)||'null'); if (x && x.result) { _pLastResult = x.result; if (x.sel) _pSel = x.sel; return x.result; } } catch(e) {} return _pLastResult; }
        function _pResetAll(){ try { localStorage.removeItem(_P_RESULT_KEY); } catch(e) {} _pLastResult=null; _pSel={movie:[],tv:[],anime:[]}; _renderPInputUI(); }

        openPersonalityPage = function() {
            var el = document.getElementById('personality-page');
            if (el) el.classList.add('open');
            history.pushState({ page: 'personality' }, '', '');
            var h = document.getElementById('txt-personality-header');
            if (h) h.textContent = LANG === 'fa' ? '🧠 تحلیل شخصیت سینمایی' : '🧠 Cinema Personality Analysis';
            var saved = _pLoadSaved();
            if (saved) _renderPResult(saved, LANG === 'fa'); else _renderPInputUI();
        };
        closePersonalityPage = function(){ var el=document.getElementById('personality-page'); if(el) el.classList.remove('open'); };

        var _oldRenderPInputUI_v3 = typeof _renderPInputUI === 'function' ? _renderPInputUI : null;
        _renderPInputUI = function(){
            if (_oldRenderPInputUI_v3) _oldRenderPInputUI_v3();
            var c = document.getElementById('personality-content');
            if (!c) return;
            var fa = LANG === 'fa';
            var wrap = document.createElement('div');
            wrap.style.cssText = 'padding:0 16px 8px;max-width:520px;margin:0 auto;';
            wrap.innerHTML = '<button class="personality-reset-btn" onclick="_pResetAll()">🔄 '+(fa?'تحلیل مجدد / شروع از اول':'New analysis / reset')+'</button>';
            c.insertBefore(wrap, c.firstChild);
        };

        var _oldRunPAnalysis_v3 = typeof _runPAnalysis === 'function' ? _runPAnalysis : null;
        _runPAnalysis = async function(){
            var fa = LANG === 'fa';
            var tot = (_pSel.movie||[]).length + (_pSel.tv||[]).length + (_pSel.anime||[]).length;
            if (tot < 1) { alert(fa ? 'حداقل یک اثر انتخاب کن!' : 'Select at least one work!'); return; }
            var c = document.getElementById('personality-content');
            if (c) c.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;"><div style="font-size:54px;animation:brainPulse 1s ease-in-out infinite;">🧠</div><div style="color:#cc88ff;font-size:16px;font-weight:800;">'+(fa?'در حال ساخت تحلیل اختصاصی...':'Building your personal analysis...')+'</div><div style="color:#666;font-size:12px;line-height:1.7;text-align:center;max-width:310px;">'+(fa?'نتیجه بر اساس انتخاب‌های خودت ساخته و ذخیره می‌شود.':'The result is based on your selections and will be saved locally.')+'</div></div>';
            var result = null;
            try {
                var schema = '{"personality_type":"","personality_emoji":"","description":"","traits":["","","",""],"if_movie":{"character":"","actor":"","movie":"","year":"","reason":""},"if_series":{"character":"","actor":"","series":"","year":"","reason":""},"if_anime":{"character":"","show":"","year":"","reason":""},"top5_movies":[{"title":"","year":"","reason":""}],"top5_series":[{"title":"","year":"","reason":""}],"similar_movies":[{"title":"","year":"","reason":""}],"similar_series":[{"title":"","year":"","reason":""}],"similar_anime":[{"title":"","year":"","reason":""}]}';
                var prompt = (fa ? 'تو روان‌شناس سینمایی حرفه‌ای هستی. خروجی فقط JSON فارسی باشد. تحلیل باید دقیقاً از انتخاب‌های کاربر بیاید، غیرتکراری باشد، پیشنهادها تکراری نباشند، top5_movies فقط فیلم، top5_series فقط سریال، similar_anime فقط انیمه/انیمیشن باشد. عنوان‌های فارسی رایج را فارسی بنویس.\n' : 'You are a professional cinema psychologist. Reply ONLY JSON. Be specific to the selected titles, no duplicates. Movies only in movie fields, series only in series fields, anime/animation only in anime fields.\n') + _pSelectedSummaryText(fa) + '\nSchema: ' + schema;
                var txt = await _aiGenerateText(prompt, { maxTokens: 2000, temperature: 0.55, expectJson: true, timeout: 30000 });
                result = _extractJsonObject(txt);
            } catch(e) {}
            if (!result || !result.personality_type) result = _localPersonalityResult(fa);
            result.top5_movies = _pDedup(result.top5_movies || [], 'title').slice(0,5);
            result.top5_series = _pDedup(result.top5_series || [], 'title').slice(0,5);
            result.similar_movies = _pDedup(result.similar_movies || [], 'title').slice(0,4);
            result.similar_series = _pDedup(result.similar_series || [], 'title').slice(0,4);
            result.similar_anime = _pDedup(result.similar_anime || [], 'title').slice(0,4);
            _pSaveResult(result);
            await _renderPResult(result, fa);
        };

        async function _pSearchTitleInfo(title, mediaType, wantAnimation){
            var out = { title:title||'', year:'', poster:'', id:null, mediaType:mediaType||'movie' };
            if (!title) return out;
            try {
                var d = await getData('search/' + (mediaType||'movie') + '?query=' + encodeURIComponent(title) + '&include_adult=false');
                var arr = (d && d.results) ? d.results : [];
                if (wantAnimation) arr = arr.filter(function(x){ return x.genre_ids && x.genre_ids.indexOf(16) > -1; });
                var it = arr[0];
                if (it) {
                    out.id = it.id;
                    out.title = (LANG==='fa' && (it.title||it.name)) ? (it.title||it.name) : (it.title || it.name || title);
                    out.year = ((it.release_date || it.first_air_date || '').split('-')[0]) || out.year;
                    out.poster = it.poster_path ? (IMG + it.poster_path) : '';
                    out.mediaType = mediaType || (it.title ? 'movie':'tv');
                }
            } catch(e) {}
            return out;
        }
        function _pOpenItem(id, mediaType) {
            _pOpeningDetailFromPersonality = true;
            var m = document.getElementById('modal');
            if (m) m.style.zIndex = '720';
            setTimeout(function(){ openDetail(id, mediaType || 'movie'); }, 60);
        }
        async function _pOpenByTitle(title, mediaType) {
            try {
                var d = await getData('search/' + (mediaType || 'movie') + '?query=' + encodeURIComponent(title) + '&include_adult=false');
                var it = d && d.results && d.results[0];
                if (it && it.id) _pOpenItem(it.id, mediaType || (it.title ? 'movie' : 'tv'));
            } catch(e) {}
        }
        async function _pWorkCard(item, mediaType, idx, wantAnimation){
            item = item || {}; var title = item.title || item.movie || item.series || item.show || '';
            var inf = await _pSearchTitleInfo(title, mediaType, wantAnimation);
            var displayTitle = inf.title || title;
            var year = inf.year || item.year || '';
            var poster = inf.poster || item.poster || '';
            var click = inf.id ? 'onclick="_pOpenItem('+inf.id+',\''+_fnEscAttr(inf.mediaType||mediaType)+'\')"' : 'onclick="_pOpenByTitle(\''+_fnEscAttr(title)+'\',\''+_fnEscAttr(mediaType)+'\')"';
            return '<div class="p-work-card" '+click+'>' + (poster ? '<img class="p-work-poster" src="'+poster+'" onerror="this.style.display=\'none\'">' : '<div class="p-work-poster" style="display:flex;align-items:center;justify-content:center;font-size:34px;">🎬</div>') + '<div class="p-work-info"><div class="p-work-title">'+_fnEscHtml(displayTitle)+'</div><div class="p-work-year">'+_fnEscHtml(year || (LANG==='fa'?'سال نامشخص':'Unknown year'))+'</div>' + (item.reason?'<div class="p-work-reason">'+_fnEscHtml(item.reason)+'</div>':'') + '</div></div>';
        }
        _renderPResult = async function(r, fa) {
            _pSaveResult(r);
            var c = document.getElementById('personality-content'); if (!c) return;
            async function ifCard(obj, label, mediaType, wantAnimation){
                obj = obj || {}; var work = obj.movie || obj.series || obj.show || '';
                var inf = await _pSearchTitleInfo(work, mediaType, wantAnimation);
                var click = inf.id ? 'onclick="_pOpenItem('+inf.id+',\''+_fnEscAttr(inf.mediaType||mediaType)+'\')"' : (work ? 'onclick="_pOpenByTitle(\''+_fnEscAttr(work)+'\',\''+_fnEscAttr(mediaType)+'\')"' : '');
                return '<div '+click+' style="display:flex;gap:12px;background:#111;border:1px solid #23233a;border-radius:16px;padding:13px;margin-bottom:10px;cursor:pointer;">' + (inf.poster?'<img src="'+inf.poster+'" style="width:58px;height:86px;border-radius:9px;object-fit:cover;flex-shrink:0;">':'<div style="width:58px;height:86px;background:#1e1e1e;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:24px;">🎭</div>') + '<div style="flex:1;min-width:0"><div style="font-size:10px;color:#c084fc;font-weight:800;margin-bottom:4px;">'+label+'</div><div style="font-size:15px;font-weight:900;color:white;">'+_fnEscHtml(obj.character||'?')+'</div><div style="font-size:12px;color:#999;margin:3px 0;">'+_fnEscHtml((obj.actor?obj.actor+' • ':'')+(inf.title||work)+(inf.year||obj.year?' ('+(inf.year||obj.year)+')':''))+'</div><div style="font-size:11px;color:#777;line-height:1.6;">'+_fnEscHtml(obj.reason||'')+'</div></div></div>';
            }
            async function grid(items, mediaType, wantAnimation){
                var html=[]; items=(items||[]).slice(0, mediaType==='tv'?5:5);
                for (var i=0;i<items.length;i++) html.push(await _pWorkCard(items[i], mediaType, i, wantAnimation));
                return '<div class="p-work-grid">'+html.join('')+'</div>';
            }
            var traits = (r.traits||[]).map(function(t){return '<span style="background:rgba(124,58,237,.2);border:1px solid rgba(124,58,237,.4);border-radius:20px;padding:5px 12px;font-size:12px;color:#d8b4fe;">'+_fnEscHtml(t)+'</span>';}).join('');
            var html = '<div style="padding:16px;max-width:560px;margin:0 auto;">'
                + '<div class="personality-action-row"><button class="personality-back-btn" onclick="closePersonalityPage()">↩️ '+(fa?'برگشت':'Back')+'</button><button class="personality-reset-btn" onclick="_pResetAll()">🔄 '+(fa?'تحلیل مجدد':'New analysis')+'</button></div>'
                + '<div style="background:radial-gradient(circle at top,rgba(124,58,237,.25),transparent 55%),linear-gradient(135deg,#160722,#080811);border:1px solid rgba(168,85,247,.35);border-radius:22px;padding:22px;margin-bottom:14px;text-align:center;box-shadow:0 10px 35px rgba(0,0,0,.45);">'
                + '<div style="font-size:54px;margin-bottom:8px;">'+_fnEscHtml(r.personality_emoji||'🎭')+'</div><div style="font-size:10px;color:#a78bfa;font-weight:900;letter-spacing:1px;margin-bottom:6px;">'+(fa?'تیپ اختصاصی تو':'YOUR CINEMA TYPE')+'</div><div style="font-size:23px;font-weight:900;color:#fff;margin-bottom:12px;">'+_fnEscHtml(r.personality_type||'')+'</div><div style="font-size:13px;color:#bbb;line-height:1.8;text-align:justify;">'+_fnEscHtml(r.description||'')+'</div><div style="display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:14px;">'+traits+'</div></div>'
                + '<div style="background:rgba(255,255,255,.035);border:1px solid #1d1d2f;border-radius:14px;padding:12px;margin-bottom:14px;"><div style="font-size:11px;color:#888;white-space:pre-line;line-height:1.8;">'+_fnEscHtml(_pSelectedSummaryText(fa))+'</div></div>'
                + '<div style="font-size:13px;font-weight:900;color:#ddd;margin:14px 0 10px;">🎭 '+(fa?'اگر تو یک شخصیت بودی':'If you were a character')+'</div>'
                + await ifCard(r.if_movie, fa?'در فیلم':'In Movie', 'movie', false)
                + await ifCard(r.if_series, fa?'در سریال':'In Series', 'tv', false)
                + await ifCard(r.if_anime, fa?'در انیمه/انیمیشن':'In Anime/Animation', 'movie', true)
                + '<div style="background:#09090e;border:1px solid #1b1b2d;border-radius:16px;padding:14px;margin:14px 0;"><div style="font-size:14px;font-weight:900;color:#f5c518;margin-bottom:10px;">🎬 '+(fa?'۵ فیلم پیشنهادی مخصوص تو':'Top Movies For You')+'</div>'+await grid(r.top5_movies,'movie',false)+'</div>'
                + '<div style="background:#09090e;border:1px solid #1b1b2d;border-radius:16px;padding:14px;margin:14px 0;"><div style="font-size:14px;font-weight:900;color:#38bdf8;margin-bottom:10px;">📺 '+(fa?'۵ سریال پیشنهادی مخصوص تو':'Top Series For You')+'</div>'+await grid(r.top5_series,'tv',false)+'</div>'
                + '<div style="background:#09090e;border:1px solid #1b1b2d;border-radius:16px;padding:14px;margin:14px 0;"><div style="font-size:14px;font-weight:900;color:#c084fc;margin-bottom:10px;">🌸 '+(fa?'انیمه/انیمیشن پیشنهادی':'Anime / Animation')+'</div>'+await grid(r.similar_anime,'movie',true)+'</div>'
                + '<div style="background:#09090e;border:1px solid #1b1b2d;border-radius:16px;padding:14px;margin:14px 0 24px;"><div style="font-size:14px;font-weight:900;color:#aaa;margin-bottom:10px;">🔍 '+(fa?'آثار مشابه دیگر':'More Similar Works')+'</div>'+await grid([].concat(r.similar_movies||[], r.similar_series||[]),'movie',false)+'</div></div>';
            c.innerHTML = html;
        };

        window.addEventListener('popstate', function(ev){
            try {
                var p = document.getElementById('personality-page');
                var modal = document.getElementById('modal');
                if (p && p.classList.contains('open') && (!modal || modal.style.display === 'none' || modal.style.display === '')) {
                    closePersonalityPage();
                    history.pushState({ page:'app' }, '', '');
                    ev.stopImmediatePropagation();
                    return false;
                }
            } catch(e) {}
        }, true);
        // =================== END FINAL AI + PERSONALITY PATCH v3 ===================

        // =================== DETAILED STATS ===================
        function openDetailedStats() {
            var modal = document.getElementById('detailed-stats-modal');
            if (!modal) return;
            modal.style.display = 'flex';
            history.pushState({ page: 'stats' }, '', '');
            renderDetailedStats();
        }

        function closeDetailedStats() {
            var modal = document.getElementById('detailed-stats-modal');
            if (modal) modal.style.display = 'none';
        }

        function renderDetailedStats() {
            var isFA = LANG === 'fa';
            var cont = document.getElementById('detailed-stats-content');
            if (!cont) return;

            var hist = getWatchHistory();
            var ratings = personalRatings || {};
            var favs = favorites || [];
            var ratingValues = Object.values(ratings);

            // Genre frequency from favorites + ratings
            var genreCount = {};
            var gNamesFA = {'28':'اکشن','18':'درام','35':'کمدی','27':'ترسناک','878':'علمی‌تخیلی','80':'جنایی','10749':'عاشقانه','99':'مستند','14':'فانتزی','53':'هیجانی','36':'تاریخی','12':'ماجراجویی','10752':'جنگی','16':'انیمیشن'};
            var gNamesEN = {'28':'Action','18':'Drama','35':'Comedy','27':'Horror','878':'Sci-Fi','80':'Crime','10749':'Romance','99':'Documentary','14':'Fantasy','53':'Thriller','36':'History','12':'Adventure','10752':'War','16':'Animation'};
            favs.forEach(function(f) { (f.genre_ids || []).forEach(function(g) { genreCount[g] = (genreCount[g] || 0) + 1; }); });
            hist.forEach(function(h) { (h.genre_ids || []).forEach(function(g) { genreCount[g] = (genreCount[g] || 0) + 0.5; }); });

            var topGenres = Object.entries(genreCount).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 6);
            var maxGenreCount = topGenres.length > 0 ? topGenres[0][1] : 1;

            // Year analysis
            var yearCount = {};
            favs.concat(hist).forEach(function(item) {
                var yr = ((item.release_date || item.first_air_date || '')).split('-')[0];
                if (yr && yr.length === 4) { yearCount[yr] = (yearCount[yr] || 0) + 1; }
            });
            var topYears = Object.entries(yearCount).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);

            // Rating distribution
            var ratingDist = {1:0, 2:0, 3:0, 4:0, 5:0};
            ratingValues.forEach(function(r) { if (r.stars >= 1 && r.stars <= 5) ratingDist[r.stars]++; });
            var totalRatings = ratingValues.length;
            var avgRating = totalRatings > 0 ? (ratingValues.reduce(function(s, r) { return s + r.stars; }, 0) / totalRatings) : 0;

            // Opinion stats
            var opinionCount = {loved:0, ok:0, disliked:0, notmytaste:0};
            ratingValues.forEach(function(r) { if (r.opinion) opinionCount[r.opinion] = (opinionCount[r.opinion] || 0) + 1; });

            // Estimated hours
            var estHours = Math.round(hist.length * 1.8);

            // Type split
            var movieCount = favs.filter(function(f) { return f.type === 'movie' || !f.type; }).length;
            var tvCount = favs.filter(function(f) { return f.type === 'tv'; }).length;

            var html = '';

            // ---- TOP NUMBERS ----
            html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;">';
            var cards = [
                { val: favs.length, lbl: isFA ? 'علاقه‌مندی' : 'Favorites', icon: '❤️' },
                { val: hist.length, lbl: isFA ? 'تماشاشده' : 'Watched', icon: '👁️' },
                { val: estHours + (isFA ? ' ساعت' : 'h'), lbl: isFA ? 'تخمین زمان' : 'Est. Hours', icon: '⏱️' },
                { val: totalRatings, lbl: isFA ? 'امتیازداده' : 'Rated', icon: '⭐' }
            ];
            cards.forEach(function(c) {
                html += '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px;text-align:center;">'
                    + '<div style="font-size:26px;margin-bottom:6px;">' + c.icon + '</div>'
                    + '<div style="font-size:22px;font-weight:bold;color:var(--primary);">' + c.val + '</div>'
                    + '<div style="font-size:11px;color:#888;margin-top:4px;">' + c.lbl + '</div>'
                    + '</div>';
            });
            html += '</div>';

            // ---- AVG RATING ----
            if (totalRatings > 0) {
                html += '<div style="background:linear-gradient(135deg,rgba(229,9,20,0.1),rgba(229,9,20,0.05));border:1px solid rgba(229,9,20,0.2);border-radius:14px;padding:16px;margin-bottom:20px;text-align:center;">'
                    + '<div style="font-size:13px;color:#aaa;margin-bottom:6px;">' + (isFA ? 'میانگین امتیاز شما' : 'Your Average Rating') + '</div>'
                    + '<div style="font-size:36px;font-weight:bold;color:var(--gold);">&#x2B50; ' + avgRating.toFixed(1) + '</div>'
                    + '<div style="font-size:11px;color:#666;margin-top:4px;">' + (isFA ? 'از ۵' : 'out of 5') + '</div>'
                    + '</div>';
            }

            // ---- GENRE CHART ----
            if (topGenres.length > 0) {
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:20px;">'
                    + '<div style="font-size:13px;font-weight:bold;color:white;margin-bottom:14px;">&#x1F3AD; ' + (isFA ? 'ژانرهای موردعلاقه' : 'Favorite Genres') + '</div>';
                topGenres.forEach(function(g) {
                    var gname = isFA ? (gNamesFA[g[0]] || g[0]) : (gNamesEN[g[0]] || g[0]);
                    var pct = Math.round((g[1] / maxGenreCount) * 100);
                    html += '<div style="margin-bottom:10px;">'
                        + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:#ddd;">' + gname + '</span><span style="color:#888;">' + Math.round(g[1]) + '</span></div>'
                        + '<div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">'
                        + '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--primary),#ff6b35);border-radius:3px;transition:width 0.5s;"></div>'
                        + '</div></div>';
                });
                html += '</div>';
            }

            // ---- MOVIE vs TV ----
            if (movieCount + tvCount > 0) {
                var moviePct = Math.round((movieCount / (movieCount + tvCount)) * 100);
                var tvPct = 100 - moviePct;
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:20px;">'
                    + '<div style="font-size:13px;font-weight:bold;color:white;margin-bottom:14px;">&#x1F3AC; ' + (isFA ? 'فیلم در مقابل سریال' : 'Movies vs Series') + '</div>'
                    + '<div style="display:flex;height:16px;border-radius:8px;overflow:hidden;margin-bottom:10px;">'
                    + '<div style="width:' + moviePct + '%;background:var(--primary);transition:width 0.5s;"></div>'
                    + '<div style="flex:1;background:#3b82f6;"></div>'
                    + '</div>'
                    + '<div style="display:flex;gap:16px;font-size:12px;">'
                    + '<span style="color:var(--primary);">&#x25A0; ' + (isFA ? 'فیلم' : 'Movies') + ' ' + moviePct + '%</span>'
                    + '<span style="color:#3b82f6;">&#x25A0; ' + (isFA ? 'سریال' : 'Series') + ' ' + tvPct + '%</span>'
                    + '</div></div>';
            }

            // ---- TOP YEARS ----
            if (topYears.length > 0) {
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:20px;">'
                    + '<div style="font-size:13px;font-weight:bold;color:white;margin-bottom:12px;">&#x1F4C5; ' + (isFA ? 'بهترین دهه/سال‌های تماشا' : 'Top Years in Your List') + '</div>';
                topYears.forEach(function(y) {
                    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);">'
                        + '<span style="color:#ddd;font-size:13px;">' + y[0] + '</span>'
                        + '<span style="color:var(--gold);font-weight:bold;font-size:13px;">' + y[1] + ' ' + (isFA ? 'اثر' : 'titles') + '</span>'
                        + '</div>';
                });
                html += '</div>';
            }

            // ---- OPINION STATS ----
            var totalOpinions = Object.values(opinionCount).reduce(function(a, b) { return a + b; }, 0);
            if (totalOpinions > 0) {
                var opLabelsFA = {loved:'سلیقم بود', ok:'سرگرم شدم', disliked:'اتلاف وقت', notmytaste:'سلیقم نبود'};
                var opLabelsEN = {loved:'Loved it', ok:'Was OK', disliked:'Waste of time', notmytaste:'Not my taste'};
                var opColors = {loved:'#22c55e', ok:'#eab308', disliked:'#ef4444', notmytaste:'#8b5cf6'};
                html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin-bottom:20px;">'
                    + '<div style="font-size:13px;font-weight:bold;color:white;margin-bottom:12px;">&#x1F4AC; ' + (isFA ? 'نظرات شما' : 'Your Opinions') + '</div>';
                Object.entries(opinionCount).forEach(function(entry) {
                    if (entry[1] === 0) return;
                    var lbl = isFA ? opLabelsFA[entry[0]] : opLabelsEN[entry[0]];
                    var pct = Math.round((entry[1] / totalOpinions) * 100);
                    html += '<div style="margin-bottom:10px;">'
                        + '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span style="color:#ddd;">' + lbl + '</span><span style="color:#888;">' + entry[1] + ' (' + pct + '%)</span></div>'
                        + '<div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">'
                        + '<div style="height:100%;width:' + pct + '%;background:' + opColors[entry[0]] + ';border-radius:3px;"></div>'
                        + '</div></div>';
                });
                html += '</div>';
            }

            html += '<div style="height:20px;"></div>';
            cont.innerHTML = html;
        }
        // =================== END DETAILED STATS ===================


        // =================== SCENES & EDITS ===================
        var _scenesInlineOpen = false;
        var isFA_g = false;

        async function openScenes() {
            var modal = document.getElementById('scenes-modal');
            var titleEl = document.getElementById('scenes-modal-title');
            var listEl = document.getElementById('scenes-list-container');
            isFA_g = LANG === 'fa';
            var isFA = isFA_g;

            modal.style.display = 'flex';
            history.pushState({ page: 'scenes' }, '', '');
            closeScenesPlayer();

            var label = isFA ? ('\u{1F3AC} \u0627\u062F\u06CC\u062A\u200C\u0647\u0627 \u0648 \u0633\u06A9\u0627\u0646\u0633: ' + (curTitle||'')) : ('\u{1F3AC} Edits & Scenes: ' + (curTitle||''));
            titleEl.textContent = label;

            listEl.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#555;">'
                + '<i class="fa-solid fa-spinner fa-spin" style="font-size:28px;color:#00e5cc;margin-bottom:14px;display:block;"></i>'
                + '<div>' + (isFA ? '\u062F\u0631 \u062D\u0627\u0644 \u062C\u0633\u062A\u062C\u0648...' : 'Searching for videos...') + '</div></div>';

            var videos = await scenesFetch(curTitle || '', curType || 'movie');
            renderScenesList(videos, isFA);
        }

        // =================== YouTube API Helper ===================
        async function fetchYouTubeVideos(query, maxResults = 6) {
            try {
                const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YT_API_KEY}`;
                const res = await fetch(url);
                if (!res.ok) return null;
                const data = await res.json();
                if (!data.items || data.items.length === 0) return null;
                return data.items.map(item => ({
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium ? item.snippet.thumbnails.medium.url : `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
                    channel: item.snippet.channelTitle
                }));
            } catch(e) {
                console.warn('YouTube API error:', e);
                return null;
            }
        }
        // =================== END YouTube API Helper ===================

        async function scenesFetch(title, type) {
            var year = curDataForFav ? ((curDataForFav.release_date || curDataForFav.first_air_date || '').split('-')[0]) : '';
            var origTitle = curDataForFav ? (curDataForFav.original_title || curDataForFav.original_name || title) : title;
            var isFA = isFA_g;

            // Only scenes/edits/BTS content - no trailers (trailers go to trailer section)
            // Try to fetch real video IDs from YouTube API
            // *** همیشه سال رو اضافه می‌کنیم تا نتایج نامرتبط نیاد ***
            const yearStr = year ? ` ${year}` : '';
            const exactTitle = origTitle && origTitle !== title ? origTitle : title;
            
            const queries = [
                { q: `"${title}"${yearStr} best scenes compilation`, label: isFA ? 'بهترین سکانس‌ها' : 'Best Scenes' },
                { q: `"${title}"${yearStr} fan edit`, label: isFA ? 'فن ادیت' : 'Fan Edit' },
                { q: `${exactTitle}${yearStr} ادیت فارسی`, label: isFA ? 'ادیت فارسی' : 'Persian Edit' },
                { q: `"${title}"${yearStr} memorable moments`, label: isFA ? 'لحظات ماندگار' : 'Memorable Moments' },
                { q: `"${title}"${yearStr} behind the scenes`, label: isFA ? 'پشت صحنه' : 'Behind The Scenes' },
                { q: `"${title}"${yearStr} official clip`, label: isFA ? 'کلیپ رسمی' : 'Official Clip' },
                { q: `"${title}"${yearStr} cast interview`, label: isFA ? 'مصاحبه بازیگران' : 'Cast Interview' },
                { q: `"${exactTitle}"${yearStr} making of`, label: isFA ? 'ساخت فیلم' : 'Making Of' },
            ];

            // Fetch real YouTube videos for each category
            var results = [];
            for (var qi = 0; qi < queries.length; qi++) {
                var q = queries[qi];
                var videos = await fetchYouTubeVideos(q.q, 3);
                if (videos && videos.length > 0) {
                    results.push({ label: q.label, videos: videos, query: q.q });
                } else {
                    // Fallback to search URL card
                    results.push({ label: q.label, videos: null, query: q.q, fallback: true });
                }
            }
            return results;
        }

        function renderScenesList(categories, isFA) {
            var listEl = document.getElementById('scenes-list-container');
            if (!categories || categories.length === 0) {
                listEl.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#555;"><div style="font-size:44px;margin-bottom:14px;">🎬</div><div>' + (isFA ? 'ویدئویی یافت نشد.' : 'No videos found.') + '</div></div>';
                return;
            }

            var title = curTitle || '';

            var html = '<div style="font-size:11px;color:#555;text-align:center;padding:6px 0 14px;">'
                + (isFA ? '🎬 ویدئوهای مرتبط از یوتیوب' : '🎬 Related YouTube Videos')
                + '</div>';

            categories.forEach(function(cat) {
                if (!cat.videos && !cat.fallback) return;

                html += '<div style="margin-bottom:18px;">';
                html += '<div style="font-size:12px;font-weight:bold;color:#00e5cc;padding:0 4px 8px;border-bottom:1px solid #1a1a1a;margin-bottom:8px;">' + cat.label + '</div>';

                if (cat.videos && cat.videos.length > 0) {
                    // Real YouTube video cards
                    cat.videos.forEach(function(vid) {
                        var ytUrl = 'https://www.youtube.com/watch?v=' + vid.videoId;
                        html += '<div style="background:#0d0d0d;border-radius:12px;margin-bottom:8px;overflow:hidden;border:1px solid #1e1e1e;">'
                            // Thumbnail
                            + '<div style="position:relative;width:100%;cursor:pointer;" onclick="openScenesPlayer(\'https://www.youtube.com/embed/' + vid.videoId + '?autoplay=1&playsinline=1\')">'
                            + '<img src="' + vid.thumbnail + '" style="width:100%;height:auto;display:block;max-height:200px;object-fit:cover;" loading="lazy" onerror="this.style.display=\'none\'">'
                            + '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">'
                            + '<div style="width:48px;height:48px;border-radius:50%;background:rgba(229,9,20,0.85);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(0,0,0,0.6);">'
                            + '<i class="fa-solid fa-play" style="color:white;font-size:18px;margin-right:-2px;"></i>'
                            + '</div></div>'
                            + '</div>'
                            // Title row
                            + '<div style="padding:8px 12px 2px;">'
                            + '<div style="font-size:12px;font-weight:600;color:#eee;line-height:1.4;">' + vid.title.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>'
                            + '<div style="font-size:10px;color:#666;margin-top:2px;">' + vid.channel + '</div>'
                            + '</div>'
                            // Action buttons
                            + '<div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #1a1a1a;margin-top:6px;">'
                            + '<button onclick="openScenesPlayer(\'https://www.youtube.com/embed/' + vid.videoId + '?autoplay=1&playsinline=1\')" style="padding:9px 6px;background:transparent;color:#00e5cc;border:none;border-left:1px solid #1a1a1a;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;">'
                            + '<i class="fa-solid fa-play"></i> ' + (isFA ? 'پخش در اپ' : 'Play In-App') + '</button>'
                            + '<a href="' + ytUrl + '" target="_blank" style="padding:9px 6px;background:transparent;color:#ff4444;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px;text-decoration:none;">'
                            + '<i class="fab fa-youtube"></i> ' + (isFA ? 'یوتیوب' : 'YouTube') + '</a>'
                            + '</div>'
                            + '</div>';
                    });
                } else {
                    // Fallback: search link card
                    var searchUrl = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(cat.query);
                    html += '<div style="background:#0d0d0d;border-radius:12px;margin-bottom:8px;overflow:hidden;border:1px solid #1e1e1e;">'
                        + '<div style="padding:16px;display:flex;align-items:center;gap:12px;">'
                        + '<div style="width:44px;height:44px;border-radius:50%;background:#ff0000;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
                        + '<i class="fab fa-youtube" style="color:white;font-size:18px;"></i></div>'
                        + '<div style="flex:1;"><div style="font-size:12px;color:#eee;font-weight:600;">' + cat.label + '</div>'
                        + '<div style="font-size:10px;color:#555;margin-top:2px;">' + cat.query + '</div></div>'
                        + '</div>'
                        + '<div style="display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #1a1a1a;">'
                        + '<button onclick="openScenesPlayer(\'' + searchUrl.replace(/'/g,'%27') + '\')" style="padding:9px 6px;background:transparent;color:#00e5cc;border:none;border-left:1px solid #1a1a1a;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;">'
                        + '<i class="fa-solid fa-play"></i> ' + (isFA ? 'پخش در اپ' : 'Play In-App') + '</button>'
                        + '<a href="' + searchUrl + '" target="_blank" style="padding:9px 6px;background:transparent;color:#ff4444;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:5px;text-decoration:none;">'
                        + '<i class="fab fa-youtube"></i> ' + (isFA ? 'یوتیوب' : 'YouTube') + '</a>'
                        + '</div></div>';
                }

                html += '</div>';
            });

            listEl.innerHTML = html;
        }


        function openScenesPlayer(embedUrl) {
            var playerDiv = document.getElementById('scenes-inline-player');
            var iframe = document.getElementById('scenes-iframe');
            if (!playerDiv || !iframe) return;
            iframe.src = embedUrl;
            playerDiv.style.display = 'block';
            playerDiv.scrollIntoView({ behavior: 'smooth' });
        }

        function closeScenesPlayer() {
            var playerDiv = document.getElementById('scenes-inline-player');
            var iframe = document.getElementById('scenes-iframe');
            if (playerDiv) playerDiv.style.display = 'none';
            if (iframe) iframe.src = '';
        }

        function closeScenes() {
            closeScenesPlayer();
            document.getElementById('scenes-modal').style.display = 'none';
        }
        // =================== END SCENES & EDITS ===================

        // =================== END PERSONALITY ANALYSIS ===================
        
        document.addEventListener('DOMContentLoaded', function() {
            // Update lang toggle icon
            const langIcon = document.getElementById('lang-toggle-icon');
            if (langIcon) langIcon.textContent = LANG === 'fa' ? 'EN' : 'FA';
            const txtPers = document.getElementById('txt-personality');
            if (txtPers) txtPers.textContent = LANG === 'fa' ? 'تحلیل شخصیت' : 'Personality';
            
            loadQuoteOfDay();
            updateMiniStats();
            initAutoTheme();
        });
        
        // Also hook into openDetail for new modal features
        const _openDetailOriginal = openDetail;
        openDetail = async function(id, type) {
            await _openDetailOriginal(id, type);
            const modal = document.getElementById('modal');
            if (type === 'person_works' || !modal) return;
            try {
                // NOTE: initAIBox is already called inside _openDetailOriginal with correct data
                // Do NOT call it again here to avoid stale aiRichData from previous item

                // Animate score
                const scoreEl = document.getElementById('d-rate');
                if (scoreEl) animateScore(parseFloat(scoreEl.textContent));
                
                // Render personal rating
                renderPersonalRating();
                
                // Get full data for budget/keywords/collection
                const d = await getData(`${type}/${id}`);
                if (!d) return;
                
                // Budget & Box Office (movie only)
                if (type === 'movie') {
                    renderBudgetBoxOffice(d);
                    loadCollection(d);
                } else {
                    document.getElementById('budget-box').style.display = 'none';
                    document.getElementById('collection-section').style.display = 'none';
                }
                
                // Keywords
                const kwData = await getData(`${type}/${id}/keywords`);
                const rawKw = kwData ? (kwData.keywords || kwData.results || []) : [];
                renderKeywords(rawKw);

                // Reviews count badge
                try {
                    const revData = await getData(`${type}/${id}/reviews?page=1`);
                    const revCount = revData && revData.results ? revData.results.length : 0;
                    const badge = document.getElementById('reviews-count-badge');
                    if (badge && revCount > 0) { badge.textContent = revCount; badge.style.display = 'inline'; }
                } catch(e) {}
                
            } catch(e) {
                console.log('New features init error:', e);
            }
        };

        async function translateDescBtn() {
            var btn = document.getElementById('translate-desc-btn');
            var descEl = document.getElementById('d-desc');
            if (!btn || !descEl) return;
            var state = btn.getAttribute('data-state') || 'original';
            var original = btn.getAttribute('data-original') || '';
            var translated = btn.getAttribute('data-translated') || '';
            var spanEl = btn.querySelector('span');
            if (state === 'translated') {
                descEl.innerText = original;
                spanEl.textContent = 'ترجمه به فارسی';
                btn.setAttribute('data-state', 'original');
                return;
            }
            if (translated) {
                descEl.innerText = translated;
                spanEl.textContent = 'نمایش متن اصلی';
                btn.setAttribute('data-state', 'translated');
                return;
            }
            spanEl.textContent = 'در حال ترجمه...';
            btn.style.pointerEvents = 'none';
            try {
                var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(original.slice(0, 500)) + '&langpair=en|fa';
                var resp = await fetch(url);
                var data = await resp.json();
                if (data && data.responseData && data.responseData.translatedText) {
                    var t = data.responseData.translatedText;
                    btn.setAttribute('data-translated', t);
                    descEl.innerText = t;
                    spanEl.textContent = 'نمایش متن اصلی';
                    btn.setAttribute('data-state', 'translated');
                } else {
                    spanEl.textContent = 'خطا در ترجمه';
                    setTimeout(function() { spanEl.textContent = 'ترجمه به فارسی'; }, 2000);
                }
            } catch(e) {
                spanEl.textContent = 'خطا در ترجمه';
                setTimeout(function() { spanEl.textContent = 'ترجمه به فارسی'; }, 2000);
            }
            btn.style.pointerEvents = '';
        }
        

        // =================== FINAL PATCH v4: AI quick questions + personality overlay/dynamic analysis ===================
        (function(){
            try {
                var st = document.createElement('style');
                st.textContent = '\n.ai-quick-questions{display:flex!important;min-height:42px!important;gap:8px!important;overflow-x:auto!important;padding:2px 0 10px!important;visibility:visible!important;opacity:1!important}.ai-quick-btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:34px!important;white-space:nowrap!important;flex:0 0 auto!important}.personality-page-detail-open #modal{z-index:950!important}.p-work-card{position:relative}.p-work-card:after{content:"";position:absolute;inset:0;border-radius:14px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03);pointer-events:none}.p-analysis-section-title{font-size:14px;font-weight:900;margin-bottom:11px;display:flex;align-items:center;gap:7px}.p-picked-chip{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:999px;padding:5px 10px;font-size:11px;color:#aaa;margin:3px}.p-work-grid{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:10px!important}.p-work-card{background:linear-gradient(180deg,#10101b,#08080d)!important;border:1px solid #24243d!important;border-radius:15px!important;overflow:hidden!important;cursor:pointer!important}.p-work-poster{width:100%!important;height:176px!important;object-fit:cover!important;background:#16161f!important}.p-work-info{padding:10px!important}.p-work-title{font-size:12px!important;font-weight:900!important;color:#fff!important;line-height:1.35!important;min-height:33px!important}.p-work-year{font-size:10px!important;color:#888!important;margin-top:3px!important}.p-work-reason{font-size:10.5px!important;color:#999!important;line-height:1.55!important;margin-top:7px!important}';
                document.head.appendChild(st);
            } catch(e) {}
        })();

        function _v4EnsureQuickQuestions(forceTitle, forceType, forceYear) {
            try {
                var fa = LANG === 'fa';
                var title = forceTitle || aiCurrentTitle || curTitle || (fa ? 'این اثر' : 'this title');
                var typ = forceType || aiCurrentType || curType || 'movie';
                var yr = forceYear || (aiRichData && aiRichData.year) || (document.getElementById('d-year') && document.getElementById('d-year').textContent) || '';
                var label = typ === 'tv' ? (fa ? 'سریال' : 'series') : (fa ? 'فیلم' : 'movie');
                if (!aiCurrentTitle) aiCurrentTitle = title;
                if (!aiCurrentType) aiCurrentType = typ;
                if (!aiRichData) aiRichData = {};
                if (yr && !aiRichData.year) aiRichData.year = yr;
                var qs = fa ? [
                    'خلاصه داستان «' + title + '» را دقیق و بدون اسپویل بگو',
                    'نقاط قوت و ضعف «' + title + '» چیست؟',
                    'شخصیت‌ها و بازیگران مهم «' + title + '» را تحلیل کن',
                    'پایان «' + title + '» را با اسپویل توضیح بده',
                    'فکت‌های جالب و مطمئن درباره «' + title + '» بگو',
                    'چند اثر مشابه «' + title + '» معرفی کن'
                ] : [
                    'Summarize "' + title + '" without spoilers',
                    'What are the strengths and weaknesses?',
                    'Analyze the main characters and cast',
                    'Explain the ending with spoilers',
                    'Tell me confirmed facts about it',
                    'Recommend similar titles'
                ];
                var html = qs.map(function(q){ return '<div class="ai-quick-btn" data-question="' + _fnEscAttr(q) + '" onclick="askQuick(this.dataset.question)">' + _fnEscHtml(q) + '</div>'; }).join('');
                var a = document.getElementById('ai-quick-btns'), b = document.getElementById('ai-fs-quick-btns');
                if (a && (!a.innerHTML.trim() || a.children.length < 3)) a.innerHTML = html;
                if (b && (!b.innerHTML.trim() || b.children.length < 3)) b.innerHTML = html;
                if (a) { a.style.display='flex'; a.style.visibility='visible'; a.style.opacity='1'; }
                if (b) { b.style.display='flex'; b.style.visibility='visible'; b.style.opacity='1'; }
                var chat = document.getElementById('ai-chat-area');
                if (chat && !chat.innerHTML.trim()) chat.innerHTML = '<div class="ai-msg-bot">' + (fa ? 'سلام! درباره ' + label + ' <strong>«' + _fnEscHtml(title) + '»</strong>' + (yr ? ' ('+_fnEscHtml(yr)+')' : '') + ' هر سوالی داری فارسی و دقیق جواب می‌دم.' : 'Hi! Ask anything about this ' + label + '.') + '</div>';
                var lab = document.getElementById('ai-box-label');
                if (lab && (!lab.textContent || lab.textContent === 'AI Assistant')) lab.textContent = fa ? 'دستیار AI · «' + title + '»' : 'AI · "' + title + '"';
            } catch(e) {}
        }

        (function(){
            var _oldOpenDetail_v4 = typeof openDetail === 'function' ? openDetail : null;
            if (_oldOpenDetail_v4 && !_oldOpenDetail_v4._v4Wrapped) {
                openDetail = async function(id, type) {
                    var fromP = !!(document.getElementById('personality-page') && document.getElementById('personality-page').classList.contains('open')) || !!_pOpeningDetailFromPersonality;
                    var ret = await _oldOpenDetail_v4.apply(this, arguments);
                    try {
                        var m = document.getElementById('modal');
                        if (m && m.style.display !== 'none') {
                            if (fromP || _pOpeningDetailFromPersonality) {
                                document.body.classList.add('personality-page-detail-open');
                                m.style.zIndex = '950';
                                m.style.position = 'fixed';
                            }
                        }
                        _v4EnsureQuickQuestions(curTitle || aiCurrentTitle, type || curType, (document.getElementById('d-year')||{}).textContent || '');
                        setTimeout(function(){ _v4EnsureQuickQuestions(curTitle || aiCurrentTitle, type || curType, (document.getElementById('d-year')||{}).textContent || ''); if (fromP) { var mm=document.getElementById('modal'); if(mm) mm.style.zIndex='950'; } }, 150);
                        setTimeout(function(){ _v4EnsureQuickQuestions(curTitle || aiCurrentTitle, type || curType, (document.getElementById('d-year')||{}).textContent || ''); if (fromP) { var mm=document.getElementById('modal'); if(mm) mm.style.zIndex='950'; } }, 900);
                    } catch(e) {}
                    return ret;
                };
                openDetail._v4Wrapped = true;
            }
            try {
                var obs = new MutationObserver(function(){
                    var m = document.getElementById('modal');
                    if (m && m.style.display !== 'none') _v4EnsureQuickQuestions(curTitle || aiCurrentTitle, curType || aiCurrentType, (document.getElementById('d-year')||{}).textContent || '');
                });
                var detailModal = document.getElementById('modal');
                if (detailModal) obs.observe(detailModal, { childList:true, subtree:true, attributes:true, attributeFilter:['style','class'] });
            } catch(e) {}
            setInterval(function(){ var m=document.getElementById('modal'); if(m && m.style.display !== 'none') _v4EnsureQuickQuestions(curTitle || aiCurrentTitle, curType || aiCurrentType, (document.getElementById('d-year')||{}).textContent || ''); }, 1200);
        })();

        (function(){
            var _oldCloseModal = typeof closeModal === 'function' ? closeModal : null;
            if (_oldCloseModal && !_oldCloseModal._v4Wrapped) {
                closeModal = function(){
                    var ret = _oldCloseModal.apply(this, arguments);
                    try { document.body.classList.remove('personality-page-detail-open'); var m=document.getElementById('modal'); if(m) m.style.zIndex='220'; if (_pOpeningDetailFromPersonality) { _pOpeningDetailFromPersonality=false; var p=document.getElementById('personality-page'); if(p) p.classList.add('open'); } } catch(e) {}
                    return ret;
                };
                closeModal._v4Wrapped = true;
            }
        })();

        function _v4Hash(s){ s=String(s||''); var h=2166136261; for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); } return Math.abs(h>>>0); }
        function _v4Pick(arr, n, seed, selectedNames){
            selectedNames = selectedNames || {};
            var copy = (arr||[]).filter(function(x){ var k=String(x.title||'').toLowerCase(); return !selectedNames[k]; });
            copy.sort(function(a,b){ return ((_v4Hash((a.title||'')+seed)%997) - (_v4Hash((b.title||'')+seed)%997)); });
            return copy.slice(0,n);
        }
        function _v4SelectedNames(){ var o={}; [].concat(_pSel.movie||[],_pSel.tv||[],_pSel.anime||[]).forEach(function(x){ o[String(x.title||'').toLowerCase()] = true; }); return o; }
        function _v4ThemeFromSelections(){
            var all=[].concat(_pSel.movie||[],_pSel.tv||[],_pSel.anime||[]), text=all.map(function(x){return (x.title||'')+' '+(x.year||'');}).join(' ').toLowerCase();
            var h=_v4Hash(text);
            var tests=[
                ['crime',/breaking|better call|godfather|soprano|wire|scarface|heat|departed|prisoners|se7en|mindhunter|true detective|fargo|joker|taxi|nightcrawler/],
                ['mystery',/dark|from|lost|severance|shutter|prestige|inception|memento|enemy|twin peaks|black mirror/],
                ['scifi',/interstellar|arrival|dune|matrix|blade runner|ex machina|star wars|avatar|alien|westworld|foundation/],
                ['warm',/friends|office|modern family|paddington|coco|up|toy story|inside out|amelie|la la land|about time/],
                ['epic',/lord|rings|game of thrones|house of the dragon|gladiator|braveheart|vikings|last kingdom|attack on titan/],
                ['anime',/anime|death note|monster|spirited|totoro|naruto|one piece|demon slayer|jujutsu|attack on titan|your name|perfect blue/],
                ['horror',/horror|conjuring|hereditary|midsommar|get out|it|exorcist|saw|from/]
            ];
            for(var i=0;i<tests.length;i++) if(tests[i][1].test(text)) return { key:tests[i][0], hash:h, text:text };
            var keys=['mystery','crime','scifi','warm','epic']; return { key:keys[h%keys.length], hash:h, text:text };
        }
        function _v4LocalPersonalityResult(fa){
            var movies=_pSel.movie||[], series=_pSel.tv||[], anime=_pSel.anime||[], all=[].concat(movies,series,anime), th=_v4ThemeFromSelections(), seed=th.hash, selected=_v4SelectedNames();
            var picked = all.map(function(x){ return x.title + (x.year?' ('+x.year+')':''); }).join('، ');
            var typeMapFa={crime:['استراتژیست ضدقهرمان','♟️'],mystery:['کاوشگر رازهای تاریک','🧩'],scifi:['ذهن آینده‌نگر','🚀'],warm:['قلب‌گرم داستان‌دوست','✨'],epic:['رویاپرداز حماسی','⚔️'],anime:['روح انیمه‌بین عمیق','🌸'],horror:['شکارچی تعلیق و ترس','🕯️']};
            var typeMapEn={crime:['Antihero Strategist','♟️'],mystery:['Mystery Seeker','🧩'],scifi:['Future-Minded Explorer','🚀'],warm:['Warm Story-Seeker','✨'],epic:['Epic Dreamer','⚔️'],anime:['Anime-Soul Explorer','🌸'],horror:['Suspense & Fear Hunter','🕯️']};
            var tm=(fa?typeMapFa:typeMapEn)[th.key] || (fa?['سینمادوست شهودی','🎭']:['Intuitive Cinephile','🎭']);
            var moodFa={crime:'تو جذب شخصیت‌هایی می‌شوی که در مرز اخلاق، قدرت و تصمیم‌های سخت حرکت می‌کنند. انتخاب‌هایت نشان می‌دهد داستان برایت وقتی جذاب می‌شود که آدم‌ها تغییر کنند و پشت ظاهرشان تضاد جدی وجود داشته باشد.',mystery:'انتخاب‌هایت نشان می‌دهد از ابهام، راز، جهان‌های بسته و روایت‌هایی که آرام‌آرام لایه‌هایشان باز می‌شود لذت می‌بری. دنبال اثری هستی که بعد از پایان هم ذهنت را درگیر کند.',scifi:'سلیقه‌ات به ایده‌های بزرگ، آینده، هویت، زمان و پرسش‌های فلسفی نزدیک است. برای تو سرگرمی وقتی ارزشمندتر می‌شود که یک مفهوم تازه یا نگاه متفاوت به انسان داشته باشد.',warm:'انتخاب‌هایت نشان می‌دهد با شخصیت‌های انسانی، رابطه‌های صمیمی و حس امید ارتباط می‌گیری. برایت مهم است اثر علاوه بر سرگرمی، حال‌وهوای ماندگار و حس خوب داشته باشد.',epic:'تو روایت‌های بزرگ، جهان‌سازی، قهرمان‌ها و مسیرهای پرریسک را دوست داری. انتخاب‌هایت نشان می‌دهد از داستان‌هایی لذت می‌بری که حس سفر، نبرد و سرنوشت دارند.',anime:'انتخاب‌هایت به جهان‌های تصویری، شخصیت‌های عاطفی و قصه‌هایی با تخیل بالا نزدیک است. تو از روایت‌هایی لذت می‌بری که هم احساسی‌اند و هم ایده بصری متفاوت دارند.',horror:'تو از تعلیق، تهدید پنهان و فضاهای ناآرام لذت می‌بری. انتخاب‌هایت نشان می‌دهد دنبال تجربه‌ای هستی که آرامشت را به‌هم بزند ولی از نظر داستانی هم محکم باشد.'};
            var moodEn={crime:'You are drawn to characters under pressure, moral conflict, power and transformation.',mystery:'You enjoy ambiguity, layered worlds and stories that keep working in your head after they end.',scifi:'Your taste leans toward big ideas, identity, time, technology and philosophical tension.',warm:'You connect with human stories, relationships, warmth and emotional aftertaste.',epic:'You like grand worlds, quests, destiny, battles and stories with scale.',anime:'You enjoy imaginative visual worlds, heightened emotion and stylized storytelling.',horror:'You seek suspense, hidden threats and unsettling atmospheres with solid storytelling.'};
            var desc=(fa?'بر اساس انتخاب‌های خودت' : 'Based on your own selections') + (picked ? (fa?' مثل «'+picked+'»، ':' such as '+picked+', ') : (fa?'، ':' ')) + (fa?moodFa[th.key]:moodEn[th.key]) + (fa?' این تحلیل از انتخاب فعلی تو ساخته شده و با تغییر انتخاب‌ها تغییر می‌کند.':' This analysis is generated from the current selection and changes when the selection changes.');
            var traitsFa={crime:['ضدقهرمان‌پسند','تحلیل‌گر قدرت','شخصیت‌محور','عاشق تنش اخلاقی'],mystery:['رازجو','جزئیات‌بین','ذهن‌درگیر','عاشق تعلیق'],scifi:['ایده‌پرداز','فلسفی‌بین','آینده‌نگر','مفهوم‌محور'],warm:['احساس‌محور','امیدجو','رابطه‌محور','لطیف‌پسند'],epic:['جهان‌دوست','حماسه‌پسند','ماجراجو','قهرمان‌محور'],anime:['خیال‌پرداز','تصویرمحور','عاطفی','خاص‌پسند'],horror:['تعلیق‌طلب','فضاسازپسند','شجاع در تماشا','رازآلود']};
            var traitsEn={crime:['Antihero-minded','Power-aware','Character-driven','Moral tension'],mystery:['Mystery-driven','Detail-focused','Thoughtful','Suspense lover'],scifi:['Idea-driven','Philosophical','Future-facing','Conceptual'],warm:['Emotion-led','Hope-seeking','Relationship-focused','Gentle taste'],epic:['World-loving','Epic-minded','Adventurous','Hero-focused'],anime:['Imaginative','Visual-minded','Emotional','Distinctive'],horror:['Suspense-seeking','Atmosphere-led','Brave viewer','Unsettling taste']};
            var pools={
                crime:{movies:[['El Camino: A Breaking Bad Movie','2019','ادامه‌ای شخصیت‌محور با فشار اخلاقی'],['Heat','1995','تقابل حرفه‌ای جنایت و قانون'],['Nightcrawler','2014','ضدقهرمان جاه‌طلب و تاریک'],['The Departed','2006','هویت دوگانه و خیانت'],['Prisoners','2013','تعلیق اخلاقی سنگین'],['Zodiac','2007','جنایت، وسواس و تحقیق']],series:[['Better Call Saul','2015','تحول شخصیت با ریتم دقیق'],['The Sopranos','1999','روان‌شناسی قدرت و خانواده'],['The Wire','2002','واقع‌گرایی چندلایه'],['Fargo','2014','جنایت تلخ و عجیب'],['Mindhunter','2017','تحلیل ذهن مجرم'],['Ozark','2017','خانواده زیر فشار جنایت']],anime:[['Monster','2004','جنایت و روان‌شناسی عمیق'],['Death Note','2006','قدرت، اخلاق و سقوط'],['Psycho-Pass','2012','جنایت در جهان آینده']]},
                mystery:{movies:[['The Prestige','2006','راز، رقابت و وسواس'],['Memento','2000','حافظه و روایت معکوس'],['Shutter Island','2010','ابهام روانی پرکشش'],['Enemy','2013','معمای هویت و ناخودآگاه'],['Gone Girl','2014','راز، رسانه و رابطه'],['The Game','1997','واقعیت مشکوک و بازی ذهنی']],series:[['Severance','2022','رازآلود و ایده‌محور'],['Dark','2017','پیچیده و فلسفی'],['Twin Peaks','1990','معمای سورئال و فضاسازی'],['From','2022','شهر کابوس‌وار و راز مرکزی'],['Lost','2004','رازهای جزیره و شخصیت‌ها'],['Black Mirror','2011','ایده‌های تاریک و مستقل']],anime:[['Perfect Blue','1997','هویت و روان‌پریشی'],['Paranoia Agent','2004','ابهام اجتماعی و ذهنی'],['Erased','2016','راز، زمان و نجات']]},
                scifi:{movies:[['Arrival','2016','زبان، زمان و احساس'],['Blade Runner 2049','2017','هویت و تنهایی آینده'],['Ex Machina','2014','هوش مصنوعی و کنترل'],['Interstellar','2014','علم، عشق و بقا'],['Children of Men','2006','آینده تاریک و امید'],['Moon','2009','تنهایی و هویت']],series:[['Severance','2022','علمی‌تخیلی روان‌شناختی'],['Westworld','2016','آگاهی و کنترل'],['Foundation','2021','آینده، سیاست و سرنوشت'],['Dark','2017','زمان و خانواده'],['Silo','2023','جامعه بسته و راز'],['The Expanse','2015','سیاست و فضا']],anime:[['Steins;Gate','2011','زمان و پیامد انتخاب'],['Ghost in the Shell','1995','هویت و تکنولوژی'],['Cowboy Bebop','1998','تنهایی در آینده']]},
                warm:{movies:[['About Time','2013','عشق، خانواده و زمان'],['Amélie','2001','لطافت و نگاه انسانی'],['Paddington 2','2017','مهربانی و شادی خالص'],['Coco','2017','خانواده و خاطره'],['Little Miss Sunshine','2006','گرمی خانواده و سفر'],['La La Land','2016','رویا و تلخی شیرین']],series:[['Ted Lasso','2020','امید و مهربانی'],['The Office','2005','کمدی انسانی محیط کار'],['Parks and Recreation','2009','دوستی و انرژی مثبت'],['Friends','1994','جمع دوستانه و نوستالژی'],['Modern Family','2009','خانواده و کمدی'],['The Bear','2022','تنش انسانی و رشد']],anime:[['Spirited Away','2001','رشد و خیال'],['My Neighbor Totoro','1988','آرامش و کودکی'],['Your Name','2016','عشق و سرنوشت']]},
                epic:{movies:[['Dune','2021','جهان‌سازی و سرنوشت'],['The Lord of the Rings: The Fellowship of the Ring','2001','سفر و دوستی'],['Gladiator','2000','افتخار و انتقام'],['Mad Max: Fury Road','2015','اکشن حماسی و بقا'],['Kingdom of Heaven','2005','ایمان، جنگ و سیاست'],['Avatar','2009','جهان تازه و مقاومت']],series:[['Game of Thrones','2011','قدرت، خاندان و نبرد'],['House of the Dragon','2022','سیاست خانوادگی و اژدها'],['The Last Kingdom','2015','هویت و جنگ'],['Vikings','2013','فتح و اسطوره'],['Rome','2005','قدرت تاریخی'],['Andor','2022','شورش و سیاست']],anime:[['Attack on Titan','2013','بقا و حقیقت‌های بزرگ'],['Princess Mononoke','1997','طبیعت، جنگ و اسطوره'],['Vinland Saga','2019','انتقام و رشد']]},
                anime:{movies:[['Spirited Away','2001','جهان خیال و بلوغ'],['Your Name','2016','احساس، زمان و تقدیر'],['Perfect Blue','1997','روان‌شناسی و هویت'],['Akira','1988','آشوب شهری و قدرت'],['A Silent Voice','2016','رشد و بخشش'],['The Boy and the Heron','2023','خیال و سوگ']],series:[['Avatar: The Last Airbender','2005','رشد و تعادل'],['Arcane','2021','رابطه، قدرت و تراژدی'],['Blue Eye Samurai','2023','انتقام و هویت'],['Cyberpunk: Edgerunners','2022','عشق و سقوط'],['Samurai Champloo','2004','سفر و سبک'],['Castlevania','2017','تاریکی و اکشن']],anime:[['Death Note','2006','قدرت و اخلاق'],['Monster','2004','روان‌شناسی جنایت'],['Fullmetal Alchemist: Brotherhood','2009','برادری و فلسفه']]},
                horror:{movies:[['Get Out','2017','ترس اجتماعی و راز'],['Hereditary','2018','خانواده و وحشت روانی'],['The Babadook','2014','سوگ و ترس'],['The Witch','2015','فضاسازی مذهبی تاریک'],['A Quiet Place','2018','بقا و سکوت'],['It Follows','2014','تهدید مداوم']],series:[['From','2022','راز و کابوس جمعی'],['The Haunting of Hill House','2018','ترس و خانواده'],['Midnight Mass','2021','ایمان و وحشت'],['Hannibal','2013','زیبایی‌شناسی تاریک'],['Archive 81','2022','آرشیو و راز'],['Penny Dreadful','2014','گوتیک و هیولا']],anime:[['Another','2012','نفرین و تعلیق'],['Higurashi: When They Cry','2006','راز روستا و ترس'],['Parasyte: The Maxim','2014','بدن، هویت و بقا']]}
            };
            function arrToObj(a){ return {title:a[0],year:a[1],reason:fa?a[2]:a[2]}; }
            var pool=pools[th.key]||pools.mystery;
            var topMovies=_v4Pick(pool.movies.map(arrToObj),5,seed,selected);
            var topSeries=_v4Pick(pool.series.map(arrToObj),5,seed+13,selected);
            var topAnime=_v4Pick(pool.anime.map(arrToObj),4,seed+29,selected);
            var ifs={crime:['جسی پینکمن','Aaron Paul','El Camino: A Breaking Bad Movie','2019','چون بین زخم گذشته و نیاز به رهایی حرکت می‌کند.','سائول گودمن','Bob Odenkirk','Better Call Saul','2015','چون پشت شوخ‌طبعی، ذهنی پیچیده و انتخاب‌هایی خاکستری دارد.','لایت یاگامی','Death Note','2006'],mystery:['تدی دنیلز','Leonardo DiCaprio','Shutter Island','2010','چون حقیقت برایش ساده و خطی نیست.','مارک اسکات','Adam Scott','Severance','2022','چون میان هویت بیرونی و درونی گیر کرده است.','ساتوشی کون','Perfect Blue','1997'],scifi:['لوئیز بنکس','Amy Adams','Arrival','2016','چون با فکر و احساس همزمان جهان را می‌فهمد.','برنارد لو','Jeffrey Wright','Westworld','2016','چون پرسش هویت و آگاهی برایش مرکزی است.','موتوکو کوساناگی','Ghost in the Shell','1995'],warm:['آملی پولن','Audrey Tautou','Amélie','2001','چون با جزئیات کوچک به جهان معنا می‌دهد.','تد لاسو','Jason Sudeikis','Ted Lasso','2020','چون با امید و مهربانی آدم‌ها را تغییر می‌دهد.','چیهیرو','Spirited Away','2001'],epic:['آراگورن','Viggo Mortensen','The Lord of the Rings: The Return of the King','2003','چون مسئولیت، وفاداری و مسیر سخت را می‌پذیرد.','جان اسنو','Kit Harington','Game of Thrones','2011','چون میان وظیفه و احساس گیر می‌کند.','ارن یگر','Attack on Titan','2013'],anime:['چیهیرو','Rumi Hiiragi','Spirited Away','2001','چون در جهانی عجیب رشد می‌کند و خود واقعی‌اش را پیدا می‌کند.','ویولت اورگاردن','Yui Ishikawa','Violet Evergarden','2018','چون از دل احساسات، زبان انسانی را یاد می‌گیرد.','ادوارد الریک','Fullmetal Alchemist: Brotherhood','2009'],horror:['دنی تورنس','Ewan McGregor','Doctor Sleep','2019','چون با ترس‌های قدیمی روبه‌رو می‌شود.','نل کرین','Victoria Pedretti','The Haunting of Hill House','2018','چون زخم خانوادگی و ترس را با هم حمل می‌کند.','شینیچی ایزومی','Parasyte: The Maxim','2014']};
            var f=ifs[th.key]||ifs.mystery;
            return { personality_type:tm[0], personality_emoji:tm[1], description:desc, traits:(fa?traitsFa:traitsEn)[th.key] || (fa?['شخصیت‌محور','جزئیات‌بین','خاص‌پسند','درگیر روایت']:['Character-driven','Detail-oriented','Distinctive','Narrative-focused']), if_movie:{character:f[0],actor:f[1],movie:f[2],year:f[3],reason:fa?f[4]:'This character matches the emotional logic of your selected works.'}, if_series:{character:f[5],actor:f[6],series:f[7],year:f[8],reason:fa?f[9]:'This series character reflects the inner conflict in your taste.'}, if_anime:{character:f[10],show:f[11],year:f[12],reason:fa?'چون با حال‌وهوای انتخاب‌های تو از نظر احساس و کشمکش هماهنگ است.':'It matches your selected mood and emotional conflict.'}, top5_movies:topMovies, top5_series:topSeries, similar_movies:_v4Pick(pool.movies.map(arrToObj),3,seed+101,selected), similar_series:_v4Pick(pool.series.map(arrToObj),3,seed+205,selected), similar_anime:topAnime };
        }
        _localPersonalityResult = function(fa){ return _v4LocalPersonalityResult(fa); };

        _runPAnalysis = async function(){
            var fa = LANG === 'fa';
            var tot = (_pSel.movie||[]).length + (_pSel.tv||[]).length + (_pSel.anime||[]).length;
            if (tot < 1) { alert(fa ? 'حداقل یک اثر انتخاب کن!' : 'Select at least one work!'); return; }
            var c=document.getElementById('personality-content');
            if(c) c.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;"><div style="font-size:56px;animation:brainPulse 1s ease-in-out infinite;">🧠</div><div style="color:#cc88ff;font-size:16px;font-weight:900;">'+(fa?'در حال ساخت تحلیل اختصاصی و غیرتکراری...':'Building a unique analysis...')+'</div><div style="color:#666;font-size:12px;max-width:320px;text-align:center;line-height:1.7;">'+(fa?'نتیجه فقط از انتخاب‌های فعلی تو ساخته می‌شود و در همین دستگاه ذخیره می‌ماند.':'The result is generated from your current selections and saved locally.')+'</div></div>';
            var result = _v4LocalPersonalityResult(fa);
            _pSaveResult(result);
            await _renderPResult(result, fa);
        };

        var _oldPOpenItem_v4 = typeof _pOpenItem === 'function' ? _pOpenItem : null;
        _pOpenItem = function(id, mediaType){
            try { _pOpeningDetailFromPersonality = true; var p=document.getElementById('personality-page'); if(p) p.classList.add('open'); } catch(e) {}
            setTimeout(function(){ openDetail(id, mediaType || 'movie'); setTimeout(function(){ var m=document.getElementById('modal'); if(m){ m.style.zIndex='950'; m.style.position='fixed'; document.body.classList.add('personality-page-detail-open'); } }, 100); }, 20);
        };
        _pOpenByTitle = async function(title, mediaType){
            try {
                _pOpeningDetailFromPersonality = true;
                var d = await getData('search/' + (mediaType || 'movie') + '?query=' + encodeURIComponent(title) + '&include_adult=false');
                var it = d && d.results && d.results[0];
                if (it && it.id) _pOpenItem(it.id, mediaType || (it.title ? 'movie' : 'tv'));
            } catch(e) {}
        };
        // =================== END FINAL PATCH v4 ===================


        // =================== FINAL PATCH v6: stable boot + exact AI per modal + smarter personality ===================
        (function(){
            if (window.__FN_FINAL_V6__) return; window.__FN_FINAL_V6__ = true;
            function ehtml(v){ try { return _fnEscHtml(String(v==null?'':v)); } catch(_) { return String(v==null?'':v).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); } }
            function eattr(v){ try { return _fnEscAttr(String(v==null?'':v)); } catch(_) { return ehtml(v).replace(/'/g,'&#39;'); } }
            function clean(v){ return String(v==null?'':v).replace(/\s+/g,' ').trim(); }
            function isFa(){ return LANG === 'fa'; }
            function visibleTitle(){
                var fa=isFa();
                var main=clean((document.getElementById('d-title')||{}).textContent||'');
                var faT=clean((document.getElementById('d-title-fa')||{}).textContent||'');
                var sec=clean((document.getElementById('d-title-secondary')||{}).textContent||'');
                if (fa) return main && main !== 'Title' ? main : (faT || sec || main || 'این اثر');
                return main || sec || faT || 'This title';
            }
            function visibleYear(){ return clean((document.getElementById('d-year')||{}).textContent||''); }
            var detailState = { id:null, type:null, token:0 };

            function resetAIPlaceholder(id,type){
                try{
                    aiConversation=[]; aiIsThinking=false; aiCurrentTitle=''; aiCurrentType=type||'movie'; aiRichData={tmdbId:id};
                    var fa=isFa();
                    var msg='<div class="ai-msg-bot">'+(fa?'در حال آماده‌سازی دستیار همین اثر...':'Preparing this title assistant...')+'</div>';
                    var c=document.getElementById('ai-chat-area'), f=document.getElementById('ai-fs-chat');
                    if(c) c.innerHTML=msg; if(f) f.innerHTML=msg;
                    var q=document.getElementById('ai-quick-btns'), fq=document.getElementById('ai-fs-quick-btns');
                    if(q){q.innerHTML='';q.setAttribute('data-ai-title','');q.style.display='flex';}
                    if(fq){fq.innerHTML='';fq.setAttribute('data-ai-title','');fq.style.display='flex';}
                    var lab=document.getElementById('ai-box-label'); if(lab) lab.textContent=fa?'دستیار AI · در حال بارگذاری':'AI · Loading';
                }catch(_){ }
            }
            function setAIQuestions(title,type,year,force){
                try{
                    var fa=isFa(); title=clean(title)||visibleTitle(); year=clean(year)||visibleYear(); type=type||aiCurrentType||'movie';
                    var label= type==='tv' ? (fa?'سریال':'series') : (fa?'فیلم':'movie');
                    var ctx = title + (year?' ('+year+')':'');
                    var qs = fa ? [
                        'خلاصه داستان «'+ctx+'» را دقیق و بدون اسپویل بگو',
                        'نقاط قوت و ضعف «'+ctx+'» چیست؟',
                        'بازیگران و شخصیت‌های مهم «'+ctx+'» را تحلیل کن',
                        'پایان «'+ctx+'» را با اسپویل توضیح بده',
                        'فکت‌های جالب و مطمئن درباره «'+ctx+'» بگو',
                        'آثار مشابه «'+ctx+'» معرفی کن'
                    ] : [
                        'Summarize "'+ctx+'" without spoilers',
                        'Strengths and weaknesses of "'+ctx+'"?',
                        'Analyze the main cast and characters of "'+ctx+'"',
                        'Explain the ending of "'+ctx+'" with spoilers',
                        'Confirmed facts about "'+ctx+'"',
                        'Recommend titles similar to "'+ctx+'"'
                    ];
                    var html=qs.map(function(x){return '<div class="ai-quick-btn" data-question="'+eattr(x)+'" onclick="askQuick(this.dataset.question)">'+ehtml(x)+'</div>';}).join('');
                    var key=title+'|'+year+'|'+type;
                    var q=document.getElementById('ai-quick-btns'), fq=document.getElementById('ai-fs-quick-btns');
                    if(q && (force || q.getAttribute('data-ai-title')!==key || q.children.length<3)){ q.innerHTML=html; q.setAttribute('data-ai-title',key); q.style.display='flex'; }
                    if(fq && (force || fq.getAttribute('data-ai-title')!==key || fq.children.length<3)){ fq.innerHTML=html; fq.setAttribute('data-ai-title',key); fq.style.display='flex'; }
                    var lab=document.getElementById('ai-box-label'); if(lab) lab.textContent = fa ? ('دستیار AI · «'+title+'»'+(year?' ('+year+')':'')) : ('AI · "'+title+'"'+(year?' ('+year+')':''));
                    var ctxEl=document.getElementById('ai-fs-context'); if(ctxEl) ctxEl.textContent=label+': '+ctx;
                }catch(_){ }
            }
            var oldInitAI = typeof initAIBox==='function' ? initAIBox : null;
            initAIBox = function(title,type,year,rich){
                try{
                    rich=rich||{};
                    // Ignore delayed init from old title.
                    if(detailState.id && rich.tmdbId && String(rich.tmdbId)!==String(detailState.id)) return;
                    title=clean(title); if(!title || title==='این اثر' || title==='This title') title=visibleTitle();
                    year=clean(year)||visibleYear()||rich.year||'';
                    if(oldInitAI) oldInitAI(title,type,year,rich);
                    var fa=isFa(); var ctx=title+(year?' ('+year+')':'');
                    aiCurrentTitle=title; aiCurrentType=type||aiCurrentType||'movie'; aiRichData=rich; aiRichData.year=year; aiRichData.tmdbId=rich.tmdbId||detailState.id;
                    var typeLabel=aiCurrentType==='tv' ? (fa?'سریال':'series') : (fa?'فیلم':'movie');
                    var welcome=fa ? ('سلام! این دستیار مخصوص '+typeLabel+' <strong>«'+ehtml(ctx)+'»</strong> است. هر سوالی درباره همین اثر بپرسی، دقیق و فارسی جواب می‌دهم.') : ('Hi! This assistant is for <strong>"'+ehtml(ctx)+'"</strong>. Ask anything about this title.');
                    var c=document.getElementById('ai-chat-area'), f=document.getElementById('ai-fs-chat');
                    if(c) c.innerHTML='<div class="ai-msg-bot">'+welcome+'</div>';
                    if(f) f.innerHTML='<div class="ai-msg-bot">'+welcome+'</div>';
                    setAIQuestions(title,aiCurrentType,year,true);
                }catch(e){ console.log('v6 initAIBox patch error', e); }
            };
            async function forceFreshAI(id,type,token){
                try{
                    if(token!==detailState.token || String(id)!==String(detailState.id)) return;
                    var d=null, cr=null, kw=null;
                    try{ d=await getData(type+'/'+id); }catch(_){ }
                    try{ cr=await getData(type+'/'+id+'/credits'); }catch(_){ }
                    try{ kw=await getData(type+'/'+id+'/keywords'); }catch(_){ }
                    if(token!==detailState.token || String(id)!==String(detailState.id)) return;
                    var title=visibleTitle() || (d&&(d.title||d.name||d.original_title||d.original_name)) || (isFa()?'این اثر':'This title');
                    var year=visibleYear() || clean(((d&&((d.release_date||d.first_air_date)||''))+'').split('-')[0]);
                    var cast=cr&&cr.cast?cr.cast.slice(0,8).map(function(x){return x.name;}).join(', '):'';
                    var directors=cr&&cr.crew?cr.crew.filter(function(x){return x.job==='Director'||x.department==='Directing';}).slice(0,4).map(function(x){return x.name;}).join(', '):'';
                    var raw=kw?(kw.keywords||kw.results||[]):[];
                    var rich={tmdbId:id,year:year,originalTitle:d&&(d.original_title||d.original_name)||title,overview:d&&d.overview||clean((document.getElementById('d-desc')||{}).textContent||''),overviewFa:isFa()?clean((document.getElementById('d-desc')||{}).textContent||''):'',genres:d&&d.genres?d.genres.map(function(g){return g.name;}).join(', '):'',cast:cast,directors:directors,rating:d&&d.vote_average?Number(d.vote_average).toFixed(1):'',runtime:d&&d.runtime?d.runtime+' min':(d&&d.number_of_seasons?d.number_of_seasons+' seasons':''),countries:d&&d.production_countries?d.production_countries.map(function(c){return c.name;}).join(', '):'',keywords:raw.slice(0,15).map(function(k){return k.name;}).join(', ')};
                    initAIBox(title,type,year,rich);
                }catch(e){ console.log('v6 force ai error',e); }
            }
            var prevOpenDetail = typeof openDetail==='function' ? openDetail : null;
            if(prevOpenDetail && !prevOpenDetail.__v6Wrapped){
                openDetail = async function(id,type){
                    type=type||'movie'; detailState={id:id,type:type,token:(detailState.token||0)+1}; var tok=detailState.token;
                    resetAIPlaceholder(id,type);
                    var ret = await prevOpenDetail.apply(this, arguments);
                    resetAIPlaceholder(id,type);
                    setTimeout(function(){ forceFreshAI(id,type,tok); },60);
                    setTimeout(function(){ forceFreshAI(id,type,tok); },450);
                    setTimeout(function(){ forceFreshAI(id,type,tok); },1200);
                    return ret;
                };
                openDetail.__v6Wrapped=true;
            }
            var oldLocalAI = typeof _localAIAnswer==='function' ? _localAIAnswer : null;
            _localAIAnswer = function(question){
                try{
                    var fa=isFa(), r=aiRichData||{}, q=String(question||'').toLowerCase();
                    var title=visibleTitle() || aiCurrentTitle || r.originalTitle || (fa?'این اثر':'this title');
                    var year=r.year||visibleYear()||''; var ctx=title+(year?' ('+year+')':'');
                    var typ=aiCurrentType==='tv'?(fa?'سریال':'series'):(fa?'فیلم':'movie');
                    var genres=r.genres||''; var cast=r.cast||''; var dirs=r.directors||''; var overview=fa?(r.overviewFa||r.overview||clean((document.getElementById('d-desc')||{}).textContent||'')):(r.overview||'');
                    function faIntro(head){return '<strong>'+head+' درباره «'+ehtml(ctx)+'»:</strong><br>';}
                    if(fa){
                        if(q.indexOf('مشابه')>-1) return faIntro('پیشنهادهای مشابه')+'با توجه به ژانرها و فضای '+typ+'، دنبال آثاری با حس نزدیک به '+ehtml(genres||'فضای همین اثر')+' باش. اگر موضوع اصلی، ریتم و لحن اثر را دوست داشتی، پیشنهاد بهتر این است سراغ آثار هم‌ژانر با امتیاز بالا و سال‌های نزدیک بروی؛ چون شباهت فقط اسم نیست، ترکیب لحن، شخصیت‌ها و ایده مرکزی مهم‌تر است.';
                        if(q.indexOf('پایان')>-1 || q.indexOf('اسپویل')>-1) return faIntro('توضیح پایان')+'من فقط بر اساس اطلاعات قطعی همین صفحه جواب می‌دهم. اگر خلاصه رسمی پایان را کامل نگفته باشد، از حدس‌زدن پایان خودداری می‌کنم. خلاصه/زمینه موجود: '+ehtml(overview||'جزئیات رسمی کافی برای پایان در دسترس نیست.') ;
                        if(q.indexOf('بازیگر')>-1 || q.indexOf('شخصیت')>-1) return faIntro('بازیگران و شخصیت‌ها')+'بازیگران/عوامل مهم ثبت‌شده: '+ehtml(cast||'اطلاعات بازیگران در این صفحه کامل نیست.')+(dirs?'<br>کارگردانی: '+ehtml(dirs):'')+'<br>تحلیل کلی: محور اثر از دل ژانر و موقعیت داستانی آن می‌آید، بنابراین بازی‌ها باید حس '+ehtml(genres||'داستان')+' را باورپذیر کنند.';
                        if(q.indexOf('نقطه')>-1 || q.indexOf('ضعف')>-1 || q.indexOf('قوت')>-1) return faIntro('نقاط قوت و ضعف')+'نقاط قوت احتمالی: ایده مرکزی مشخص، فضای '+ehtml(genres||'دراماتیک')+' و ظرفیت جذب مخاطب با موضوع اثر. نقطه ضعف احتمالی، اگر پرداخت شخصیت‌ها یا ریتم روایت با ایده اصلی هماهنگ نباشد، اثر می‌تواند سطحی به نظر برسد. امتیاز ثبت‌شده: '+ehtml(r.rating||'نامشخص')+'.';
                        if(q.indexOf('فکت')>-1 || q.indexOf('مطمئن')>-1) return faIntro('فکت‌های مطمئن')+'عنوان: '+ehtml(title)+'<br>سال: '+ehtml(year||'نامشخص')+'<br>نوع: '+ehtml(typ)+'<br>ژانرها: '+ehtml(genres||'نامشخص')+'<br>امتیاز: '+ehtml(r.rating||'نامشخص')+(r.runtime?'<br>مدت/فصل: '+ehtml(r.runtime):'');
                        return faIntro('خلاصه و تحلیل')+(overview?ehtml(overview):'خلاصه رسمی کافی برای این اثر در دسترس نیست.')+'<br><br>این پاسخ مخصوص «'+ehtml(ctx)+'» است و از اطلاعات همین صفحه ساخته شده، نه اثر قبلی.';
                    }
                    if(oldLocalAI) return oldLocalAI(question);
                    return 'This answer is about "'+ctx+'". '+(overview||'No official overview is available.');
                }catch(e){ return oldLocalAI?oldLocalAI(question):''; }
            };

            // Smarter personality analysis based on selected genres/keywords, not a fixed template.
            function selectedAll(){ return [].concat(_pSel&&_pSel.movie||[], _pSel&&_pSel.tv||[], _pSel&&_pSel.anime||[]); }
            async function enrichSelections(){
                var all=selectedAll();
                for(var i=0;i<all.length;i++){
                    var it=all[i]; if(it.__v6) continue;
                    var mt=it.mediaType || (it.type==='anime'?'tv':(it.type||'movie')) || 'movie';
                    try{ var d=await getData(mt+'/'+it.id); if(d){ it.genres=(d.genres||[]).map(function(g){return g.name;}).join(' '); it.overview=d.overview||''; it.vote=d.vote_average||''; it.mediaType=mt; } }catch(_){ }
                    it.__v6=true;
                }
            }
            function themeFromSelections(){
                var all=selectedAll(); var text=all.map(function(x){return [x.title,x.year,x.genres,x.overview].join(' ');}).join(' ').toLowerCase();
                var scores={comedy:0,fun:0,music:0,romance:0,horror:0,mystery:0,crime:0,scifi:0,action:0,animation:0,drama:0};
                function add(k, arr, w){ arr.forEach(function(a){ if(text.indexOf(a)>-1) scores[k]+=w; }); }
                add('comedy',['comedy','sitcom','funny','humor','humour','کمدی','فان','خنده'],5); add('fun',['family','adventure','feel-good','kids','انیمیشن','خانوادگی','ماجراجویی'],3);
                add('music',['music','musical','concert','song','pop','موزیک','موسیقی','خواننده'],5); add('romance',['romance','romantic','love','عاشقانه','رمانتیک'],4);
                add('horror',['horror','terror','supernatural','slasher','ترسناک','وحشت'],5); add('mystery',['mystery','thriller','suspense','راز','معمایی','هیجان'],4);
                add('crime',['crime','gangster','mafia','criminal','جنایی','مافیا'],4); add('scifi',['science fiction','sci-fi','fantasy','space','future','علمی','تخیلی','فانتزی'],4);
                add('action',['action','war','fight','martial','اکشن','جنگی'],4); add('animation',['animation','anime','انیمه','انیمیشن'],5); add('drama',['drama','درام'],2);
                // Strong category signal from selected buckets
                if((_pSel.anime||[]).length) scores.animation += 3;
                var best='drama', val=-1; Object.keys(scores).forEach(function(k){ if(scores[k]>val){best=k;val=scores[k];} });
                if(scores.comedy + scores.fun >= Math.max(val,4)) best='comedy';
                return best;
            }
            function obj(a){ return {title:a[0],year:a[1],reason:a[2]}; }
            function smartPersonality(fa){
                var all=selectedAll(), names=all.map(function(x){return x.title+(x.year?' ('+x.year+')':'');}).join('، '), theme=themeFromSelections();
                var data={
                    comedy:{type:'رفیق حال‌خوب‌کن',emoji:'😄',desc:'انتخاب‌هایت بیشتر به سمت کمدی، انرژی مثبت، شخصیت‌های دوست‌داشتنی و روایت‌های سبک‌تر می‌رود. برای تو جذابیت اصلی در ریتم، شوخی، رابطه بین شخصیت‌ها و حس خوب بعد از تماشا است؛ نه فقط پیچیدگی تاریک یا تنش سنگین.',traits:['شوخ‌طبع','حال‌خوب‌جو','شخصیت‌دوست','ریتم‌پسند'], movies:[['The Nice Guys','2016','کمدی جنایی پرانرژی'],['Game Night','2018','فان، سریع و پرپیچ'],['Little Miss Sunshine','2006','گرم و انسانی'],['Paddington 2','2017','حال‌خوب‌کن و خانوادگی'],['Superbad','2007','رفاقتی و بامزه']], series:[['Ted Lasso','2020','امید و شوخی'],['Brooklyn Nine-Nine','2013','کمدی سریع و گروهی'],['The Office','2005','کمدی موقعیت'],['Parks and Recreation','2009','گرم و مثبت'],['Modern Family','2009','خانوادگی و خنده‌دار']], anime:[['Spy x Family','2022','فان و خانوادگی'],['Kaguya-sama: Love Is War','2019','کمدی رمانتیک'],['Nichijou','2011','کمدی سورئال']]},
                    music:{type:'روحیه صحنه و ریتم',emoji:'🎵',desc:'سلیقه‌ات به اجرا، موسیقی، شهرت، استعداد و پشت‌صحنه زندگی هنرمندها نزدیک است. معمولاً آثاری را دوست داری که حس ریتم، جاه‌طلبی و لحظه‌های احساسی پررنگ داشته باشند.',traits:['ریتم‌دوست','احساسی','اجرامحور','کاریزماپسند'], movies:[['Bohemian Rhapsody','2018','زندگی‌نامه موزیکال'],['Rocketman','2019','فانتزی و موسیقی'],['La La Land','2016','رویا و موسیقی'],['Whiplash','2014','وسواس اجرا'],['A Star Is Born','2018','شهرت و رابطه']], series:[['Daisy Jones & The Six','2023','گروه موسیقی'],['The Get Down','2016','موسیقی و جوانی'],['Atlanta','2016','موسیقی و جامعه'],['Empire','2015','قدرت و موسیقی']], anime:[['Nana','2006','موسیقی و رابطه'],['Kids on the Slope','2012','جاز و بلوغ'],['Carole & Tuesday','2019','امید و اجرا']]},
                    horror:{type:'شکارچی هیجان تاریک',emoji:'🕯️',desc:'انتخاب‌هایت نشان می‌دهد از تعلیق، تهدید پنهان، فضای کابوس‌وار و رازهای ناراحت‌کننده لذت می‌بری. برای تو اتمسفر و حس خطر، گاهی مهم‌تر از اکشن مستقیم است.',traits:['تعلیق‌طلب','فضاسازپسند','رازدوست','شجاع'], movies:[['Get Out','2017','ترس اجتماعی'],['Barbarian','2022','غافلگیری و وحشت'],['It Follows','2014','تعلیق آرام'],['Hereditary','2018','وحشت خانوادگی'],['The Night House','2020','سوگ و راز']], series:[['From','2022','شهر کابوس‌وار'],['The Haunting of Hill House','2018','وحشت و خانواده'],['Midnight Mass','2021','وحشت فلسفی'],['Channel Zero','2016','کابوس آنتولوژی']], anime:[['Another','2012','نفرین و تعلیق'],['Parasyte: The Maxim','2014','بقا و وحشت'],['Higurashi','2006','راز خشن']]},
                    mystery:{type:'کاوشگر رازها',emoji:'🧩',desc:'سلیقه‌ات به سمت معما، ابهام، کشف تدریجی حقیقت و روایت‌هایی می‌رود که ذهن را درگیر می‌کنند. تو از آثاری لذت می‌بری که بعد از پایان هم جای فکر کردن بگذارند.',traits:['رازجو','جزئیات‌بین','ذهن‌درگیر','تعلیق‌پسند'], movies:[['The Prestige','2006','راز و رقابت'],['Memento','2000','حافظه و معما'],['Shutter Island','2010','ابهام روانی'],['Gone Girl','2014','راز رسانه‌ای'],['Prisoners','2013','تنش اخلاقی']], series:[['Severance','2022','هویت و راز'],['Dark','2017','زمان و معما'],['Twin Peaks','1990','راز سورئال'],['Lost','2004','رازهای جزیره']], anime:[['Perfect Blue','1997','هویت و روان'],['Erased','2016','راز و زمان'],['Paranoia Agent','2004','ابهام اجتماعی']]},
                    action:{type:'تماشاگر آدرنالین',emoji:'⚡',desc:'انتخاب‌هایت به ریتم تند، قهرمان‌محوری، تعقیب، نبرد و لحظه‌های پرانرژی نزدیک است. برای تو کشش صحنه و ضرب‌آهنگ روایت اهمیت زیادی دارد.',traits:['هیجان‌طلب','پرریتم','قهرمان‌دوست','اکشن‌پسند'], movies:[['Mad Max: Fury Road','2015','اکشن بی‌وقفه'],['John Wick','2014','اکشن استیلیزه'],['Top Gun: Maverick','2022','هیجان و قهرمانی'],['Mission: Impossible - Fallout','2018','بدلکاری و تعلیق'],['The Raid','2011','اکشن رزمی']], series:[['Reacher','2022','اکشن مستقیم'],['The Boys','2019','اکشن و طنز تلخ'],['Warrior','2019','رزمی و پرتنش'],['Andor','2022','شورش و هیجان']], anime:[['Demon Slayer','2019','نبرد و احساس'],['Jujutsu Kaisen','2020','اکشن ماورایی'],['Attack on Titan','2013','بقا و جنگ']]},
                    animation:{type:'خیال‌پرداز پرانرژی',emoji:'🎨',desc:'انتخاب‌هایت به دنیاهای رنگی، ایده‌های خیال‌انگیز، شخصیت‌های خاص و روایت‌هایی نزدیک است که هم سرگرم‌کننده‌اند و هم احساسی. تو از جهان‌سازی و حس ماجراجویی لذت می‌بری.',traits:['خیال‌پرداز','احساس‌گرا','جهان‌دوست','ماجراجو'], movies:[['Spider-Man: Into the Spider-Verse','2018','خلاق و پرانرژی'],['Spirited Away','2001','خیالی و احساسی'],['How to Train Your Dragon','2010','ماجراجویی و دوستی'],['The Mitchells vs. the Machines','2021','فان و خانوادگی'],['Your Name','2016','احساس و تقدیر']], series:[['Avatar: The Last Airbender','2005','رشد و جهان‌سازی'],['Arcane','2021','رابطه و تراژدی'],['Blue Eye Samurai','2023','هویت و انتقام'],['Adventure Time','2010','خیال و طنز']], anime:[['Spy x Family','2022','فان و خانواده'],['Mob Psycho 100','2016','رشد و احساس'],['Fullmetal Alchemist: Brotherhood','2009','برادری و فلسفه']]},
                    drama:{type:'احساس‌گرای داستان‌محور',emoji:'🎭',desc:'انتخاب‌هایت نشان می‌دهد شخصیت‌پردازی، رشد درونی، رابطه‌های انسانی و روایت احساسی برایت مهم است. تو معمولاً دنبال اثری هستی که فقط سرگرم نکند، بلکه حس و فکر هم ایجاد کند.',traits:['شخصیت‌محور','احساس‌گرا','روایت‌دوست','عمق‌پسند'], movies:[['Good Will Hunting','1997','رشد و ترمیم'],['The Shawshank Redemption','1994','امید و رفاقت'],['The Truman Show','1998','هویت و آزادی'],['Manchester by the Sea','2016','سوگ و سکوت'],['About Time','2013','عشق و خانواده']], series:[['The Bear','2022','فشار و رشد'],['This Is Us','2016','خانواده و احساس'],['Six Feet Under','2001','زندگی و مرگ'],['Succession','2018','قدرت و خانواده']], anime:[['A Silent Voice','2016','بخشش و ترمیم'],['Violet Evergarden','2018','احساس و سوگ'],['March Comes in Like a Lion','2016','تنهایی و رشد']]}
                };
                if(['romance','crime','scifi','fun'].indexOf(theme)>-1) theme = theme==='fun'?'comedy':(theme==='romance'?'drama':(theme==='crime'?'mystery':(theme==='scifi'?'animation':theme)));
                var d=data[theme]||data.drama;
                var picked=names||'انتخاب‌های فعلی';
                return { personality_type:d.type, personality_emoji:d.emoji, description:d.desc+'\n\nاین تحلیل بر اساس انتخاب‌های فعلی تو ساخته شده: '+picked, traits:d.traits, if_movie:{character:d.movies[0][0],actor:'',movie:d.movies[0][0],year:d.movies[0][1],reason:d.movies[0][2]}, if_series:{character:d.series[0][0],actor:'',series:d.series[0][0],year:d.series[0][1],reason:d.series[0][2]}, if_anime:{character:d.anime[0][0],show:d.anime[0][0],year:d.anime[0][1],reason:d.anime[0][2]}, top5_movies:d.movies.map(obj), top5_series:d.series.map(obj), similar_movies:d.movies.slice(0,3).map(obj), similar_series:d.series.slice(0,3).map(obj), similar_anime:d.anime.map(obj) };
            }
            _localPersonalityResult = function(fa){ return smartPersonality(fa); };
            var prevRun = typeof _runPAnalysis==='function' ? _runPAnalysis : null;
            _runPAnalysis = async function(){
                var fa=isFa(), total=(_pSel.movie||[]).length+(_pSel.tv||[]).length+(_pSel.anime||[]).length;
                if(total<1){ alert(fa?'حداقل یک اثر انتخاب کن!':'Select at least one work!'); return; }
                var c=document.getElementById('personality-content');
                if(c) c.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px"><div style="font-size:56px;animation:brainPulse 1s infinite">🧠</div><div style="color:#cc88ff;font-size:16px;font-weight:900">'+(fa?'در حال تحلیل واقعی انتخاب‌ها...':'Analyzing your real picks...')+'</div><div style="color:#666;font-size:12px;text-align:center;max-width:320px;line-height:1.7">'+(fa?'ژانر، حال‌وهوا، عنوان‌ها و فضای آثار انتخاب‌شده بررسی می‌شود.':'Genres, mood, titles and tone are being checked.')+'</div></div>';
                await enrichSelections();
                var result=smartPersonality(fa); try{ _pSaveResult(result); }catch(_){ }
                await _renderPResult(result,fa);
            };
        })();
;
