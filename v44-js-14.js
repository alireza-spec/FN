
/* ===== v26 stable people see-all/search final safe override ===== */
(function(){
  'use strict';
  const PERSON_TYPES = new Set(['actor_male_list','actor_female_list','director_list']);
  const DIRECTOR_SEEDS = [525,138,1032,488,240,7467,578,2710,137427,2636,21684,10930,5602,4762,5655,12453,1243,1152,9341,11401,223,16767,2045,11218,1776,1204,11614,608,10099,2303,3325,4483,1223,1769,1466,6773,8643,6548,8556,5363,9168,15217,108,3110,533,5953,8502,1532,4500,2700,2673,17710,10601,2226,664,14392,131291,8413,17825,5162,17831,21183,5658,17697,10828,103664,4965,11482,9304,8836,183774,4765,12835,4774,45400,5606,3556,6088,2172,18055,7623,17832,1779];
  const MALE_SEEDS = [6193,287,31,1158,3894,13240,6384,192,2963,73457,500,380,3223,1892,1333,117642,976,5049,65731,18277,3,71580,16828,2888,10980,17276,18918,118,85,2037,111,1100,84497,131,8293,60,1009377,2524,7060,13242,11856,5293,18999,504,1461,3063,28846,51329,109,8784,17832,16851,37917,6383,134,132,1896,1245,74568,819,62,23659,8783,8691,6972,9281,2227,234352,103,3895];
  const FEMALE_SEEDS = [1245,54693,3895,2227,112,5064,11701,976,11891,234352,72129,3194176,103,156,1813,1373737,8691,35742,1283,4784,9273,204,1920,2231,7219,140,1267329,550843,83002,2524,6161,17605,82242,1397778,1275259,224513,203,18277,131,126,18918,129,4775,23659,125025,10990,19079,227454,1437491,550843,2049994,136532,1397778,974169,21657,5292,3136,19537,114,117642,11148,3293,2229,453,56734,18277];
  const FA_TO_EN = Object.assign({}, (window.PERSON_FA_TO_EN || {}), {'جیمز':'James','فرانکو':'Franco','سیدنی':'Sydney','سویینی':'Sweeney','سوئینی':'Sweeney','کریستوفر':'Christopher','نولان':'Nolan','دیوید':'David','فینچر':'Fincher','مارتین':'Martin','اسکورسیزی':'Scorsese','استیون':'Steven','اسپیلبرگ':'Spielberg','کوئنتین':'Quentin','تارانتینو':'Tarantino','لئوناردو':'Leonardo','دی کاپریو':'DiCaprio','تام':'Tom','هاردی':'Hardy','هلند':'Holland','رابرت':'Robert','دنیرو':'De Niro','داونی':'Downey','برد':'Brad','پیت':'Pitt','جانی':'Johnny','دپ':'Depp','اما':'Emma','استون':'Stone','ناتالی':'Natalie','پورتمن':'Portman','مارگو':'Margot','رابی':'Robbie','اسکارلت':'Scarlett','یوهانسون':'Johansson','آنجلینا':'Angelina','جولی':'Jolie','ویلنوو':'Villeneuve','هیچکاک':'Hitchcock','کوبریک':'Kubrick','ریدلی':'Ridley','اسکات':'Scott','جیم':'Jim','کری':'Carrey','ویل':'Will','اسمیت':'Smith','دنزل':'Denzel','واشنگتن':'Washington','مورگان':'Morgan','فریمن':'Freeman','جکی':'Jackie','چان':'Chan','آل':'Al','پاچینو':'Pacino','کیت':'Kate','وینسلت':'Winslet','مریل':'Meryl','استریپ':'Streep','بن':'Ben','افلک':'Affleck','مت':'Matt','دیمون':'Damon','وونگ':'Wong','کار وای':'Kar Wai','پارک':'Park','چان ووک':'Chan-wook','هیروکازو':'Hirokazu','کورئیدا':'Kore-eda','بونگ':'Bong','جون هو':'Joon-ho','جین':'Jane','کمپیون':'Campion','گرتا':'Greta','گرویگ':'Gerwig','پتی':'Patty','جنکینز':'Jenkins','سوفیا':'Sofia','کاپولا':'Coppola'});
  const detailCache = new Map(), pageCache = new Map();
  let state = {type:null, page:1, query:'', session:0, loading:false, seen:new Set(), searchTimer:null};
  const originalOpen = window.openGenericGrid, originalLoadMore = window.loadMoreGeneric, originalLoadData = window.loadGenericData;
  function isPersonType(t){ return PERSON_TYPES.has(t); }
  function isFa(){ return window.LANG === 'fa'; }
  function dataFn(){ return (typeof window.getDataEN === 'function') ? window.getDataEN : window.getData; }
  function container(){ return document.getElementById('gg-content'); }
  function moreBtn(){ return document.getElementById('btn-more-g'); }
  function esc(s){ return String(s||'').replace(/[&<>'"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function norm(s){ return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[آأإ]/g,'ا').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim(); }
  function escapeRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function translateQuery(q){ let out=String(q||'').trim(); Object.keys(FA_TO_EN).sort((a,b)=>b.length-a.length).forEach(k=>{ out=out.replace(new RegExp(escapeRe(k),'g'), FA_TO_EN[k]); }); return out.trim(); }
  function nameScore(name,q){ const n=norm(name), query=norm(q); if(!query) return 1; if(!n) return 0; const tokens=n.split(' ').filter(Boolean), qs=query.split(' ').filter(Boolean), compact=n.replace(/\s+/g,''), qcompact=query.replace(/\s+/g,''); if(n===query) return 1500; if(n.startsWith(query)) return 1400; if(tokens.some(t=>t===query)) return 1320; if(tokens.some(t=>t.startsWith(query))) return 1250; if(n.includes(query)) return 1100; if(compact.includes(qcompact)) return 1000; if(qs.length>1){ let ok=true,pref=0; for(const part of qs){ const hit=tokens.some(t=>t.startsWith(part)||t.includes(part)); if(!hit) ok=false; if(tokens.some(t=>t.startsWith(part))) pref++; } if(ok) return 800+pref*80; } return 0; }
  function seedIds(type){ return type==='director_list'?DIRECTOR_SEEDS:(type==='actor_female_list'?FEMALE_SEEDS:MALE_SEEDS); }
  function titleFor(type,title){ if(title) return title; if(type==='director_list') return isFa()?'کارگردان‌های مطرح':'Major Directors'; if(type==='actor_female_list') return isFa()?'ستارگان سینما (زن)':'Cinema Legends (Female)'; return isFa()?'ستارگان سینما (مرد)':'Cinema Legends (Male)'; }
  function placeholder(type){ if(type==='director_list') return isFa()?'جستجوی کارگردان... نام فارسی یا انگلیسی':'Search directors...'; if(type==='actor_female_list') return isFa()?'جستجوی بازیگر زن... نام فارسی یا انگلیسی':'Search actresses...'; return isFa()?'جستجوی بازیگر مرد... نام فارسی یا انگلیسی':'Search actors...'; }
  async function safeGet(path,ms=6500){ if(pageCache.has(path)) return pageCache.get(path); try{ const fn=dataFn(); const res=await Promise.race([fn(path), new Promise(r=>setTimeout(()=>r(null),ms))]); if(res) pageCache.set(path,res); return res; }catch(e){ return null; } }
  async function detail(idOrObj,ms=4200){ const id=(typeof idOrObj==='object')?idOrObj.id:idOrObj; if(!id) return idOrObj||null; if(detailCache.has(id)) return Object.assign({}, idOrObj||{}, detailCache.get(id)); const d=await safeGet('person/'+id+'?append_to_response=combined_credits',ms); const merged=Object.assign({}, idOrObj||{}, d||{}); if(d) detailCache.set(id,d); return merged; }
  function isDirector(p){ if(!p) return false; if(DIRECTOR_SEEDS.includes(Number(p.id))) return true; if(p.known_for_department==='Directing') return true; const crew=(p.combined_credits&&p.combined_credits.crew)||[]; return crew.some(c=>['Director','Creator'].includes(c.job) || c.department==='Directing'); }
  function valid(p,type){ if(!p||!p.id||!p.profile_path) return false; if(type==='actor_male_list') return p.gender===2; if(type==='actor_female_list') return p.gender===1; if(type==='director_list') return isDirector(p); return true; }
  function score(p,type){ const pop=Number(p.popularity||0); const known=(p.known_for||[]).reduce((s,x)=>s+(Number(x.popularity||0))+(Number(x.vote_count||0)*0.01)+(Number(x.vote_average||0)*3),0); if(type==='director_list') return (DIRECTOR_SEEDS.includes(Number(p.id))?10000:0)+(p.known_for_department==='Directing'?3000:0)+pop+known; return pop+known; }
  function personCard(p){ if(typeof window.makePersonCard==='function') return window.makePersonCard(p); const img=p.profile_path?IMG+p.profile_path:''; return `<div class="actor-card" onclick="openPersonBio(${p.id})"><img class="actor-img" src="${img}"><div class="actor-name">${esc(p.name)}</div></div>`; }
  function render(list,append){ const c=container(); if(!c) return; if(!append) c.innerHTML=''; const unique=[]; for(const p of list){ if(!p||state.seen.has(p.id)) continue; state.seen.add(p.id); unique.push(p); } if(!append&&!unique.length){ c.innerHTML=`<div class="person-empty-state">${isFa()?'نتیجه‌ای پیدا نشد.':'No people found.'}</div>`; } else { c.insertAdjacentHTML('beforeend', unique.map(personCard).join('')); } const b=moreBtn(); if(b) b.style.display=state.query?'none':'block'; }
  function loading(){ const c=container(); if(c) c.innerHTML=`<div class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);display:block;margin-bottom:10px;"></i>${isFa()?'در حال بارگذاری...':'Loading...'}</div>`; }
  function setup(type,title){ document.getElementById('modal')&&(document.getElementById('modal').style.display='none'); document.getElementById('person-works-modal')&&(document.getElementById('person-works-modal').style.display='none'); const page=document.getElementById('generic-grid-page'); if(page) page.style.display='flex'; const t=document.getElementById('gg-title'); if(t) t.innerHTML=_listIconMarkup(type,'',title)+'<span>'+String(title||'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))+'</span>'; const c=container(); if(c){ c.className='person-grid-container'; c.innerHTML=''; } const sort=document.getElementById('gg-sort-bar'); if(sort) sort.style.display='none'; const bar=document.getElementById('gg-person-search-bar'); if(bar) bar.style.display='block'; const input=document.getElementById('gg-person-search-input'); if(input){ input.value=''; input.placeholder=placeholder(type); input.setAttribute('dir','auto'); } const clear=document.getElementById('gg-person-search-clear'); if(clear) clear.style.display='none'; const b=moreBtn(); if(b){ b.style.display='block'; b.innerText=isFa()?'نمایش بیشتر':'Load More'; } }
  async function fetchPopular(start,count){ const jobs=[]; for(let i=0;i<count;i++) jobs.push(safeGet('person/popular?page='+(start+i),6500)); const pages=await Promise.all(jobs); return pages.flatMap(d=>(d&&d.results)||[]); }
  async function loadSeeds(type,session){ const arr=await Promise.all(seedIds(type).map(id=>detail(id,3500))); if(session!==state.session) return []; return arr.filter(p=>valid(p,type)).sort((a,b)=>score(b,type)-score(a,type)); }
  async function loadPeople(append=false){ const session=state.session,type=state.type; if(!isPersonType(type)||state.loading) return; state.loading=true; try{ if(!append){ state.seen=new Set(); loading(); } let seeds=[]; if(!append){ seeds=await loadSeeds(type,session); if(session!==state.session) return; if(seeds.length) render(seeds.slice(0,72),false); } const popular=await fetchPopular((state.page-1)*5+1,type==='director_list'?5:6); if(session!==state.session) return; let list=[]; if(type==='director_list'){ const cand=popular.filter(p=>p.known_for_department==='Directing'); const det=await Promise.all(cand.map(p=>detail(p,2600))); if(session!==state.session) return; list=det.filter(p=>valid(p,type)); } else list=popular.filter(p=>valid(p,type)); list.sort((a,b)=>score(b,type)-score(a,type)); if(list.length) render(list.slice(0,80),append||!!(container()&&container().querySelector('.actor-card,.director-card,.cast-card'))); const b=moreBtn(); if(b) b.style.display='block'; } finally{ if(session===state.session) state.loading=false; } }
  async function searchPeople(q){ const session=state.session,type=state.type; if(!isPersonType(type)) return; state.query=String(q||'').trim(); state.seen=new Set(); const clear=document.getElementById('gg-person-search-clear'); if(clear) clear.style.display=state.query?'block':'none'; if(!state.query){ state.page=1; return loadPeople(false); } const c=container(); if(c) c.innerHTML=`<div class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;color:var(--primary);display:block;margin-bottom:10px;"></i>${isFa()?'در حال جستجو...':'Searching...'}</div>`; const b=moreBtn(); if(b) b.style.display='none'; const en=translateQuery(state.query); const terms=[state.query,en].filter(Boolean).filter((v,i,a)=>a.findIndex(x=>norm(x)===norm(v))===i); let all=[]; const seeds=await loadSeeds(type,session); if(session!==state.session) return; all.push(...seeds); for(const term of terms){ const pages=await Promise.all([1,2,3].map(pg=>safeGet('search/person?query='+encodeURIComponent(term)+'&include_adult=false&page='+pg,6500))); if(session!==state.session) return; for(const d of pages){ if(d&&d.results) all.push(...d.results); } } const seen=new Set(), final=[]; for(const raw of all){ if(!raw||!raw.id||seen.has(raw.id)) continue; seen.add(raw.id); let p=raw; if(type==='director_list'||p.gender==null) p=await detail(raw,3200); if(session!==state.session) return; if(!valid(p,type)) continue; const s=Math.max(nameScore(p.name,state.query),nameScore(p.name,en)); if(s>0) final.push(Object.assign({},p,{_matchScore:s})); } final.sort((a,b)=>(b._matchScore-a._matchScore)||(score(b,type)-score(a,type))); render(final.slice(0,120),false); }
  window.searchGenericPeople=function(q){ if(state.searchTimer) clearTimeout(state.searchTimer); state.searchTimer=setTimeout(()=>searchPeople(q),120); };
  window.clearGenericPersonSearch=function(){ const inp=document.getElementById('gg-person-search-input'); if(inp) inp.value=''; const clear=document.getElementById('gg-person-search-clear'); if(clear) clear.style.display='none'; state.query=''; state.page=1; loadPeople(false); };
  function activeGenericType(){ try { if (typeof genericType !== 'undefined' && genericType) return genericType; } catch(e){} return window.genericType || state.type; }
  window.openGenericGrid=function(type,q,title){
    if(!isPersonType(type)){
      // Important: reset the people See All state before opening any media/category grid.
      // Without this, the wrapped loadGenericData could keep the last actor/actress list and show people inside Home categories.
      state.session++; state.type=null; state.query=''; state.loading=false; state.seen=new Set();
      window.genericType=type; window.genericQuery=q; window.genericPage=1; window.genericPersonSearchQuery='';
      const bar=document.getElementById('gg-person-search-bar'); if(bar) bar.style.display='none';
      const c=container(); if(c) c.className='grid-container';
      return originalOpen?originalOpen(type,q,title):undefined;
    }
    state.session++; state.type=type; state.page=1; state.query=''; state.loading=false; state.seen=new Set(); window.genericType=type; window.genericQuery=q; window.genericPage=1; window.genericContentType='person_list'; window.genericPersonSearchQuery=''; setup(type,title); loadPeople(false);
  };
  window.loadMoreGeneric=function(){ const t=activeGenericType(); if(isPersonType(t)){ state.page++; window.genericPage=state.page; return loadPeople(true); } return originalLoadMore?originalLoadMore():undefined; };
  window.loadGenericData=function(){ const t=activeGenericType(); if(isPersonType(t)) return loadPeople(false); return originalLoadData?originalLoadData():undefined; };
})();


/* =================== V31 NEWS REDIRECT + TESTS QUIZ PATCH =================== */
(function(){
    // News: keep cards only, no in-app article embed. Use person image as fallback thumbnail.
    window.renderPersonNewsList = function(items) {
        const list = document.getElementById('pn-list');
        if (!list) return;
        if (!items || !items.length) {
            list.innerHTML = '';
            const empty = document.getElementById('pn-empty');
            if (empty) {
                empty.style.display = 'block';
                empty.innerHTML = LANG === 'fa'
                    ? 'فعلاً خبر قابل‌دریافت برای این شخص پیدا نشد. کمی بعد دوباره امتحان کن.'
                    : 'No live news could be loaded for this person right now. Try again later.';
            }
            return;
        }
        const empty = document.getElementById('pn-empty');
        if (empty) empty.style.display = 'none';
        const personImg = (window.currentPersonNewsPerson && currentPersonNewsPerson.profile_path) ? (IMG + currentPersonNewsPerson.profile_path) : '';
        list.innerHTML = items.map((n, i) => {
            const useImg = n.image || personImg;
            const img = useImg
                ? `<img class="person-news-thumb" src="${_newsEscapeHtml(useImg)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;person-news-thumb-fallback&quot;><i class=&quot;fa-solid fa-newspaper&quot;></i></div>'">`
                : `<div class="person-news-thumb-fallback"><i class="fa-solid fa-newspaper"></i></div>`;
            const summary = n.summary || (LANG === 'fa' ? 'برای خواندن خبر کامل، گزینه Read یا خود کارت را بزن.' : 'Tap the card or Read to open the original source.');
            return `<div class="person-news-card" data-news-idx="${i}" onclick="openPersonNewsArticle(${i})">
                ${img}
                <div style="min-width:0;flex:1;">
                    <div class="person-news-title" id="pn-title-${i}">${_newsEscapeHtml(n.title)}</div>
                    <div class="person-news-meta">
                        <span class="person-news-source-pill">${_newsEscapeHtml(n.source || 'News')}</span>
                        <span>${_newsEscapeHtml(_newsDateLabel(n.date))}</span>
                    </div>
                    <div class="person-news-desc" id="pn-desc-${i}">${_newsEscapeHtml(summary)}</div>
                    <div class="person-news-actions" onclick="event.stopPropagation()">
                        ${LANG === 'fa' ? `<button class="person-news-small-btn red" onclick="translateNewsCard(${i})" id="pn-tr-${i}">ترجمه به فارسی</button>` : `<button class="person-news-small-btn" onclick="translateNewsCard(${i})" id="pn-tr-${i}">Translate to Persian</button>`}
                        <button class="person-news-small-btn" onclick="openPersonNewsArticle(${i})">${LANG === 'fa' ? 'Read / خواندن منبع' : 'Read'}</button>
                    </div>
                </div>
            </div>`;
        }).join('');
        const btn = document.getElementById('pn-translate-all-btn');
        if (btn) btn.style.display = LANG === 'fa' ? 'inline-flex' : 'none';
    };
    window.openPersonNewsArticle = function(i) {
        const n = (window.currentPersonNews || [])[i];
        if (!n || !n.url) return;
        try { window.open(n.url, '_blank'); }
        catch(e) { location.href = n.url; }
    };

    // Tests tab language
    window.renderTestsQuizHome = function(){
        const isFa = LANG === 'fa';
        const set = (id, fa, en) => { const el = document.getElementById(id); if (el) el.innerText = isFa ? fa : en; };
        const home = document.getElementById('tests-home-panel');
        const levels = document.getElementById('quiz-level-panel');
        if (home) home.style.display = 'grid';
        const mainHero = document.querySelector('#tests-tab > .tests-wrap > .tests-hero');
        if (mainHero) mainHero.style.display = '';
        if (levels) levels.style.display = 'none';
        set('txt-tests-head', 'تست و کوییز', 'Tests & Quiz');
        set('tests-main-title', 'تست و کوییز', 'Tests & Quiz');
        set('tests-main-sub', 'تحلیل شخصیت سینمایی و کوییزهای سرگرم‌کننده فیلم و سریال.', 'Personality analysis and fun cinema/series quizzes.');
        set('tests-personality-title', 'تحلیل شخصیت', 'Personality Analysis');
        set('tests-personality-desc', 'بر اساس فیلم‌ها، سریال‌ها و انیمه‌های محبوبت تحلیل بگیر.', 'Analyze your taste based on favorite movies, series and anime.');
        set('tests-movie-title', 'کوییز سینمایی', 'Movie Quiz');
        set('tests-movie-desc', 'سطح فیلم‌باز بودنت را با سؤال‌های تستی بسنج.', 'Test how much of a real movie fan you are.');
        set('tests-series-title', 'کوییز سریالی', 'Series Quiz');
        set('tests-series-desc', 'دانش سریال‌بازی‌ات را در چند سطح امتحان کن.', 'Measure your series knowledge across levels.');
        const nav = document.getElementById('nav-tests'); if (nav) nav.innerText = isFa ? 'تست' : 'Tests';
    };

    const QUIZ_LEVELS = {
        easy:   { fa:'آسان', en:'Easy', time:60, color:'#20d070' },
        medium: { fa:'متوسط', en:'Medium', time:40, color:'#f5c518' },
        hard:   { fa:'سخت', en:'Hard', time:30, color:'#e50914' },
        master: { fa:'سلطان فیلم‌بازها', en:'Movie Master', seriesFa:'سلطان سریال‌بازها', seriesEn:'Series Master', time:25, color:'#d4af37' }
    };

    const MOVIE_FACTS = {
        easy: [
            {type:'director', title:'Fight Club', correct:'David Fincher', wrong:['Christopher Nolan','Quentin Tarantino']},
            {type:'director', title:'Titanic', correct:'James Cameron', wrong:['Steven Spielberg','Peter Jackson']},
            {type:'director', title:'The Dark Knight', correct:'Christopher Nolan', wrong:['Zack Snyder','Sam Raimi']},
            {type:'director', title:'Pulp Fiction', correct:'Quentin Tarantino', wrong:['Martin Scorsese','Guy Ritchie']},
            {type:'role', title:'The Dark Knight', actor:'Heath Ledger', correct:'Joker', wrong:['Batman','Harvey Dent']},
            {type:'role', title:'Titanic', actor:'Leonardo DiCaprio', correct:'Jack Dawson', wrong:['Cal Hockley','Tommy Ryan']},
            {type:'actorIn', actor:'Robert Downey Jr.', correct:'Iron Man', wrong:['Man of Steel','The Batman']},
            {type:'actorIn', actor:'Tom Hanks', correct:'Forrest Gump', wrong:['The Matrix','Gladiator']},
            {type:'genre', title:'Toy Story', correct:'Animation', wrong:['Horror','War']},
            {type:'genre', title:'The Conjuring', correct:'Horror', wrong:['Rom-com','Musical']},
            {type:'bestPicture', year:'1994', correct:'Forrest Gump', wrong:['Pulp Fiction','The Shawshank Redemption']},
            {type:'director', title:'Jurassic Park', correct:'Steven Spielberg', wrong:['George Lucas','Ridley Scott']},
            {type:'role', title:'Pirates of the Caribbean', actor:'Johnny Depp', correct:'Jack Sparrow', wrong:['Will Turner','Barbossa']},
            {type:'actorIn', actor:'Keanu Reeves', correct:'The Matrix', wrong:['Inception','Blade Runner']},
            {type:'director', title:'Avatar', correct:'James Cameron', wrong:['Peter Jackson','Denis Villeneuve']},
            {type:'genre', title:'La La Land', correct:'Musical romance', wrong:['Gangster crime','Zombie horror']}
        ],
        medium: [
            {type:'director', title:'Se7en', correct:'David Fincher', wrong:['David Lynch','Michael Mann']},
            {type:'director', title:'Goodfellas', correct:'Martin Scorsese', wrong:['Francis Ford Coppola','Brian De Palma']},
            {type:'director', title:'Blade Runner 2049', correct:'Denis Villeneuve', wrong:['Ridley Scott','Alex Garland']},
            {type:'director', title:'The Grand Budapest Hotel', correct:'Wes Anderson', wrong:['Noah Baumbach','Spike Jonze']},
            {type:'role', title:'The Godfather', actor:'Al Pacino', correct:'Michael Corleone', wrong:['Sonny Corleone','Tom Hagen']},
            {type:'role', title:'The Silence of the Lambs', actor:'Anthony Hopkins', correct:'Hannibal Lecter', wrong:['Buffalo Bill','Jack Crawford']},
            {type:'actorIn', actor:'Natalie Portman', correct:'Black Swan', wrong:['Gone Girl','Arrival']},
            {type:'actorIn', actor:'Joaquin Phoenix', correct:'Joker', wrong:['The Batman','Logan']},
            {type:'bestPicture', year:'2008', correct:'Slumdog Millionaire', wrong:['The Curious Case of Benjamin Button','Milk']},
            {type:'bestPicture', year:'2019', correct:'Parasite', wrong:['1917','Joker']},
            {type:'genre', title:'No Country for Old Men', correct:'Neo-western thriller', wrong:['Teen romance','Space opera']},
            {type:'director', title:'Whiplash', correct:'Damien Chazelle', wrong:['Bennett Miller','Tom McCarthy']},
            {type:'role', title:'Gladiator', actor:'Russell Crowe', correct:'Maximus', wrong:['Commodus','Proximo']},
            {type:'actorIn', actor:'Amy Adams', correct:'Arrival', wrong:['Gravity','Interstellar']},
            {type:'director', title:'Mad Max: Fury Road', correct:'George Miller', wrong:['James Mangold','Neill Blomkamp']},
            {type:'genre', title:'Knives Out', correct:'Mystery comedy', wrong:['Historical epic','Superhero fantasy']}
        ],
        hard: [
            {type:'director', title:'Incendies', correct:'Denis Villeneuve', wrong:['Asghar Farhadi','Nuri Bilge Ceylan']},
            {type:'director', title:'Memories of Murder', correct:'Bong Joon-ho', wrong:['Park Chan-wook','Na Hong-jin']},
            {type:'director', title:'A Separation', correct:'Asghar Farhadi', wrong:['Jafar Panahi','Abbas Kiarostami']},
            {type:'director', title:'Stalker', correct:'Andrei Tarkovsky', wrong:['Ingmar Bergman','Akira Kurosawa']},
            {type:'role', title:'There Will Be Blood', actor:'Daniel Day-Lewis', correct:'Daniel Plainview', wrong:['Eli Sunday','Henry Brands']},
            {type:'role', title:'No Country for Old Men', actor:'Javier Bardem', correct:'Anton Chigurh', wrong:['Llewelyn Moss','Ed Tom Bell']},
            {type:'actorIn', actor:'Song Kang-ho', correct:'Parasite', wrong:['Oldboy','The Wailing']},
            {type:'actorIn', actor:'Mads Mikkelsen', correct:'Another Round', wrong:['The Square','Force Majeure']},
            {type:'bestPicture', year:'1975', correct:'One Flew Over the Cuckoo’s Nest', wrong:['Jaws','Barry Lyndon']},
            {type:'bestPicture', year:'1984', correct:'Amadeus', wrong:['A Passage to India','The Killing Fields']},
            {type:'genre', title:'Mulholland Drive', correct:'Surreal mystery', wrong:['Sports comedy','War documentary']},
            {type:'director', title:'The Hunt (2012)', correct:'Thomas Vinterberg', wrong:['Lars von Trier','Susanne Bier']},
            {type:'role', title:'Inglourious Basterds', actor:'Christoph Waltz', correct:'Hans Landa', wrong:['Aldo Raine','Donny Donowitz']},
            {type:'actorIn', actor:'Tony Leung Chiu-wai', correct:'In the Mood for Love', wrong:['Yi Yi','A Brighter Summer Day']},
            {type:'director', title:'The Lobster', correct:'Yorgos Lanthimos', wrong:['Ruben Östlund','Luca Guadagnino']},
            {type:'genre', title:'City of God', correct:'Crime drama', wrong:['Fantasy musical','Courtroom thriller']}
        ],
        master: [
            {type:'director', title:'Pickpocket', correct:'Robert Bresson', wrong:['Jean-Pierre Melville','Jacques Becker']},
            {type:'director', title:'Taste of Cherry', correct:'Abbas Kiarostami', wrong:['Mohsen Makhmalbaf','Majid Majidi']},
            {type:'director', title:'Come and See', correct:'Elem Klimov', wrong:['Sergei Bondarchuk','Mikhail Kalatozov']},
            {type:'director', title:'The Wages of Fear', correct:'Henri-Georges Clouzot', wrong:['Jean Renoir','François Truffaut']},
            {type:'role', title:'Persona', actor:'Liv Ullmann', correct:'Elisabet Vogler', wrong:['Alma','Karin']},
            {type:'role', title:'The Third Man', actor:'Orson Welles', correct:'Harry Lime', wrong:['Holly Martins','Major Calloway']},
            {type:'actorIn', actor:'Toshiro Mifune', correct:'Rashomon', wrong:['Tokyo Story','Ikiru']},
            {type:'actorIn', actor:'Anatoly Solonitsyn', correct:'Andrei Rublev', wrong:['Come and See','Solaris (2002)']},
            {type:'bestPicture', year:'1960', correct:'The Apartment', wrong:['Psycho','Spartacus']},
            {type:'bestPicture', year:'1942', correct:'Mrs. Miniver', wrong:['Casablanca','Citizen Kane']},
            {type:'genre', title:'The Color of Pomegranates', correct:'Poetic biographical art film', wrong:['Police procedural','Romantic comedy']},
            {type:'director', title:'Vivre sa vie', correct:'Jean-Luc Godard', wrong:['Éric Rohmer','Claude Chabrol']},
            {type:'role', title:'Sunset Blvd.', actor:'Gloria Swanson', correct:'Norma Desmond', wrong:['Betty Schaefer','Margo Channing']},
            {type:'actorIn', actor:'Bibi Andersson', correct:'Wild Strawberries', wrong:['The 400 Blows','La Dolce Vita']},
            {type:'director', title:'Bicycle Thieves', correct:'Vittorio De Sica', wrong:['Roberto Rossellini','Federico Fellini']},
            {type:'genre', title:'M', correct:'German crime thriller', wrong:['Silent slapstick comedy','American western']}
        ]
    };

    const SERIES_FACTS = {
        easy: [
            {type:'network', title:'Breaking Bad', correct:'AMC', wrong:['HBO','Netflix']},
            {type:'network', title:'Game of Thrones', correct:'HBO', wrong:['AMC','FX']},
            {type:'network', title:'Stranger Things', correct:'Netflix', wrong:['Disney+','Apple TV+']},
            {type:'seasons', title:'Breaking Bad', correct:'5 seasons', wrong:['4 seasons','8 seasons']},
            {type:'role', title:'Breaking Bad', actor:'Bryan Cranston', correct:'Walter White', wrong:['Jesse Pinkman','Saul Goodman']},
            {type:'role', title:'Game of Thrones', actor:'Emilia Clarke', correct:'Daenerys Targaryen', wrong:['Cersei Lannister','Arya Stark']},
            {type:'actorIn', actor:'Pedro Pascal', correct:'The Mandalorian', wrong:['Better Call Saul','The Bear']},
            {type:'actorIn', actor:'Millie Bobby Brown', correct:'Stranger Things', wrong:['The Last of Us','Euphoria']},
            {type:'genre', title:'The Office', correct:'Mockumentary comedy', wrong:['Crime thriller','Fantasy epic']},
            {type:'network', title:'The Boys', correct:'Amazon Prime Video', wrong:['Hulu','HBO']},
            {type:'role', title:'The Boys', actor:'Antony Starr', correct:'Homelander', wrong:['Billy Butcher','Frenchie']},
            {type:'seasons', title:'Friends', correct:'10 seasons', wrong:['6 seasons','12 seasons']},
            {type:'network', title:'The Mandalorian', correct:'Disney+', wrong:['Netflix','HBO']},
            {type:'role', title:'Friends', actor:'Jennifer Aniston', correct:'Rachel Green', wrong:['Monica Geller','Phoebe Buffay']},
            {type:'actorIn', actor:'Steve Carell', correct:'The Office', wrong:['Succession','Lost']},
            {type:'genre', title:'The Walking Dead', correct:'Zombie horror drama', wrong:['Legal comedy','Medical sitcom']}
        ],
        medium: [
            {type:'network', title:'Better Call Saul', correct:'AMC', wrong:['HBO','Showtime']},
            {type:'network', title:'Succession', correct:'HBO', wrong:['Netflix','FX']},
            {type:'network', title:'The Bear', correct:'FX/Hulu', wrong:['CBS','Peacock']},
            {type:'seasons', title:'Better Call Saul', correct:'6 seasons', wrong:['5 seasons','8 seasons']},
            {type:'role', title:'Better Call Saul', actor:'Bob Odenkirk', correct:'Jimmy McGill / Saul Goodman', wrong:['Mike Ehrmantraut','Howard Hamlin']},
            {type:'role', title:'Succession', actor:'Jeremy Strong', correct:'Kendall Roy', wrong:['Roman Roy','Tom Wambsgans']},
            {type:'actorIn', actor:'Jeremy Allen White', correct:'The Bear', wrong:['Severance','Barry']},
            {type:'actorIn', actor:'Adam Scott', correct:'Severance', wrong:['Mr. Robot','Dark']},
            {type:'genre', title:'Dark', correct:'Sci-fi mystery', wrong:['Political satire','Hospital drama']},
            {type:'network', title:'Fargo', correct:'FX', wrong:['AMC','HBO']},
            {type:'role', title:'Peaky Blinders', actor:'Cillian Murphy', correct:'Thomas Shelby', wrong:['Arthur Shelby','Alfie Solomons']},
            {type:'seasons', title:'The Sopranos', correct:'6 seasons', wrong:['4 seasons','9 seasons']},
            {type:'network', title:'Sherlock', correct:'BBC One', wrong:['ITV','HBO']},
            {type:'role', title:'Sherlock', actor:'Benedict Cumberbatch', correct:'Sherlock Holmes', wrong:['John Watson','Jim Moriarty']},
            {type:'actorIn', actor:'Rami Malek', correct:'Mr. Robot', wrong:['Mindhunter','True Detective']},
            {type:'genre', title:'Chernobyl', correct:'Historical disaster drama', wrong:['Teen fantasy','Animated comedy']}
        ],
        hard: [
            {type:'network', title:'The Wire', correct:'HBO', wrong:['FX','AMC']},
            {type:'network', title:'Mad Men', correct:'AMC', wrong:['HBO','NBC']},
            {type:'network', title:'Twin Peaks', correct:'ABC', wrong:['CBS','Fox']},
            {type:'seasons', title:'The Wire', correct:'5 seasons', wrong:['6 seasons','3 seasons']},
            {type:'role', title:'The Wire', actor:'Idris Elba', correct:'Stringer Bell', wrong:['Omar Little','Jimmy McNulty']},
            {type:'role', title:'Mad Men', actor:'Jon Hamm', correct:'Don Draper', wrong:['Roger Sterling','Pete Campbell']},
            {type:'actorIn', actor:'Kyle MacLachlan', correct:'Twin Peaks', wrong:['The Leftovers','Fleabag']},
            {type:'actorIn', actor:'Matthew McConaughey', correct:'True Detective', wrong:['Mindhunter','Fargo']},
            {type:'genre', title:'The Leftovers', correct:'Mystery drama', wrong:['Space western','Courtroom comedy']},
            {type:'network', title:'The Americans', correct:'FX', wrong:['Hulu','Netflix']},
            {type:'role', title:'True Detective', actor:'Matthew McConaughey', correct:'Rust Cohle', wrong:['Marty Hart','Ray Velcoro']},
            {type:'seasons', title:'Fleabag', correct:'2 seasons', wrong:['1 season','4 seasons']},
            {type:'network', title:'Fleabag', correct:'BBC Three / BBC One', wrong:['HBO','AMC']},
            {type:'role', title:'The Americans', actor:'Keri Russell', correct:'Elizabeth Jennings', wrong:['Paige Jennings','Martha Hanson']},
            {type:'actorIn', actor:'Carrie Coon', correct:'The Leftovers', wrong:['Mad Men','The Wire']},
            {type:'genre', title:'Mindhunter', correct:'Crime psychological thriller', wrong:['Sitcom','Fantasy adventure']}
        ],
        master: [
            {type:'network', title:'Deadwood', correct:'HBO', wrong:['AMC','Showtime']},
            {type:'network', title:'The Shield', correct:'FX', wrong:['NBC','CBS']},
            {type:'network', title:'Halt and Catch Fire', correct:'AMC', wrong:['HBO','Netflix']},
            {type:'seasons', title:'Deadwood', correct:'3 seasons', wrong:['5 seasons','2 seasons']},
            {type:'role', title:'Deadwood', actor:'Ian McShane', correct:'Al Swearengen', wrong:['Seth Bullock','Cy Tolliver']},
            {type:'role', title:'The Shield', actor:'Michael Chiklis', correct:'Vic Mackey', wrong:['Shane Vendrell','Dutch Wagenbach']},
            {type:'actorIn', actor:'Lee Pace', correct:'Halt and Catch Fire', wrong:['The Americans','Justified']},
            {type:'actorIn', actor:'Tatiana Maslany', correct:'Orphan Black', wrong:['Killing Eve','The Good Wife']},
            {type:'genre', title:'Atlanta', correct:'Surreal comedy-drama', wrong:['Medical procedural','Historical western']},
            {type:'network', title:'Rectify', correct:'SundanceTV', wrong:['Starz','TNT']},
            {type:'role', title:'Orphan Black', actor:'Tatiana Maslany', correct:'Multiple clones', wrong:['Alicia Florrick','Villanelle']},
            {type:'seasons', title:'The Leftovers', correct:'3 seasons', wrong:['5 seasons','7 seasons']},
            {type:'network', title:'Killing Eve', correct:'BBC America', wrong:['HBO','FX']},
            {type:'role', title:'Halt and Catch Fire', actor:'Mackenzie Davis', correct:'Cameron Howe', wrong:['Donna Clark','Bosworth']},
            {type:'actorIn', actor:'Walton Goggins', correct:'Justified', wrong:['Rectify','Deadwood']},
            {type:'genre', title:'BoJack Horseman', correct:'Adult animated tragicomedy', wrong:['Police drama','Cooking competition']}
        ]
    };

    function qText(f, mode) {
        const fa = LANG === 'fa';
        const isSeries = mode === 'series';
        if (f.type === 'director') return fa ? `کارگردان «${f.title}» کیست؟` : `Who directed ${f.title}?`;
        if (f.type === 'role') return fa ? `${f.actor} در «${f.title}» نقش چه شخصیتی را بازی کرد؟` : `Which character did ${f.actor} play in ${f.title}?`;
        if (f.type === 'actorIn') return fa ? `${f.actor} در کدام ${isSeries?'سریال':'فیلم'} بازی کرده است؟` : `Which ${isSeries?'series':'movie'} starred ${f.actor}?`;
        if (f.type === 'genre') return fa ? `ژانر اصلی «${f.title}» کدام است؟` : `Which genre best fits ${f.title}?`;
        if (f.type === 'bestPicture') return fa ? `برنده اسکار بهترین فیلم سال ${f.year} کدام بود؟` : `Which film won the Oscar for Best Picture in ${f.year}?`;
        if (f.type === 'network') return fa ? `«${f.title}» از کدام شبکه یا سرویس پخش شد؟` : `Which network or streamer released ${f.title}?`;
        if (f.type === 'seasons') return fa ? `«${f.title}» چند فصل دارد؟` : `How many seasons does ${f.title} have?`;
        return f.title;
    }
    function shuffle(arr) {
        const a = arr.slice();
        for (let i=a.length-1;i>0;i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
        return a;
    }

    // Extra verified quiz facts. These expand the bank heavily so repeat questions are far less likely.
    const MOVIE_EXTRA_FACTS = {
        easy: [
            {type:'director', title:'Home Alone', correct:'Chris Columbus', wrong:['John Hughes','Joe Dante']},
            {type:'director', title:'E.T. the Extra-Terrestrial', correct:'Steven Spielberg', wrong:['George Lucas','Robert Zemeckis']},
            {type:'director', title:'The Matrix', correct:'The Wachowskis', wrong:['James Cameron','Christopher Nolan']},
            {type:'director', title:'Back to the Future', correct:'Robert Zemeckis', wrong:['Steven Spielberg','Ron Howard']},
            {type:'director', title:'Forrest Gump', correct:'Robert Zemeckis', wrong:['Frank Darabont','Rob Reiner']},
            {type:'director', title:'The Lion King', correct:'Roger Allers and Rob Minkoff', wrong:['John Lasseter','Brad Bird']},
            {type:'role', title:'Forrest Gump', actor:'Tom Hanks', correct:'Forrest Gump', wrong:['Bubba Blue','Lieutenant Dan']},
            {type:'role', title:'The Matrix', actor:'Keanu Reeves', correct:'Neo', wrong:['Morpheus','Agent Smith']},
            {type:'role', title:'Iron Man', actor:'Robert Downey Jr.', correct:'Tony Stark', wrong:['Steve Rogers','Bruce Banner']},
            {type:'role', title:'Harry Potter', actor:'Daniel Radcliffe', correct:'Harry Potter', wrong:['Ron Weasley','Draco Malfoy']},
            {type:'role', title:'The Lord of the Rings', actor:'Elijah Wood', correct:'Frodo Baggins', wrong:['Aragorn','Legolas']},
            {type:'actorIn', actor:'Emma Watson', correct:'Harry Potter', wrong:['Twilight','The Hunger Games']},
            {type:'actorIn', actor:'Tobey Maguire', correct:'Spider-Man', wrong:['Batman Begins','Iron Man']},
            {type:'actorIn', actor:'Harrison Ford', correct:'Indiana Jones', wrong:['The Terminator','Top Gun']},
            {type:'actorIn', actor:'Will Smith', correct:'Men in Black', wrong:['The Dark Knight','Avatar']},
            {type:'genre', title:'Finding Nemo', correct:'Animated adventure', wrong:['Crime thriller','War drama']},
            {type:'genre', title:'Rocky', correct:'Sports drama', wrong:['Sci-fi horror','Political thriller']},
            {type:'genre', title:'The Hangover', correct:'Comedy', wrong:['Historical drama','Superhero action']},
            {type:'bestPicture', year:'1997', correct:'Titanic', wrong:['Good Will Hunting','L.A. Confidential']},
            {type:'bestPicture', year:'2003', correct:'The Lord of the Rings: The Return of the King', wrong:['Lost in Translation','Mystic River']},
            {type:'bestPicture', year:'2012', correct:'Argo', wrong:['Life of Pi','Lincoln']},
            {type:'bestPicture', year:'2016', correct:'Moonlight', wrong:['La La Land','Arrival']},
            {type:'director', title:'The Avengers', correct:'Joss Whedon', wrong:['Jon Favreau','James Gunn']},
            {type:'role', title:'Star Wars', actor:'Mark Hamill', correct:'Luke Skywalker', wrong:['Han Solo','Obi-Wan Kenobi']}
        ],
        medium: [
            {type:'director', title:'The Departed', correct:'Martin Scorsese', wrong:['Michael Mann','David Fincher']},
            {type:'director', title:'American Beauty', correct:'Sam Mendes', wrong:['Alexander Payne','Paul Thomas Anderson']},
            {type:'director', title:'The Social Network', correct:'David Fincher', wrong:['Aaron Sorkin','Bennett Miller']},
            {type:'director', title:'Django Unchained', correct:'Quentin Tarantino', wrong:['Robert Rodriguez','Spike Lee']},
            {type:'director', title:'Inception', correct:'Christopher Nolan', wrong:['Denis Villeneuve','Darren Aronofsky']},
            {type:'director', title:'Arrival', correct:'Denis Villeneuve', wrong:['Christopher Nolan','Alex Garland']},
            {type:'director', title:'Her', correct:'Spike Jonze', wrong:['Charlie Kaufman','Michel Gondry']},
            {type:'director', title:'Black Swan', correct:'Darren Aronofsky', wrong:['David Cronenberg','Luca Guadagnino']},
            {type:'role', title:'Joker', actor:'Joaquin Phoenix', correct:'Arthur Fleck', wrong:['Bruce Wayne','Murray Franklin']},
            {type:'role', title:'The Departed', actor:'Leonardo DiCaprio', correct:'Billy Costigan', wrong:['Colin Sullivan','Frank Costello']},
            {type:'role', title:'The Matrix', actor:'Laurence Fishburne', correct:'Morpheus', wrong:['Neo','Agent Smith']},
            {type:'role', title:'The Godfather', actor:'Marlon Brando', correct:'Vito Corleone', wrong:['Michael Corleone','Tom Hagen']},
            {type:'actorIn', actor:'Jake Gyllenhaal', correct:'Nightcrawler', wrong:['Gone Girl','The Revenant']},
            {type:'actorIn', actor:'Ryan Gosling', correct:'Drive', wrong:['Prisoners','Her']},
            {type:'actorIn', actor:'Saoirse Ronan', correct:'Lady Bird', wrong:['Black Swan','Gone Girl']},
            {type:'actorIn', actor:'Daniel Kaluuya', correct:'Get Out', wrong:['Moonlight','Creed']},
            {type:'genre', title:'Prisoners', correct:'Crime thriller', wrong:['Romantic musical','Space opera']},
            {type:'genre', title:'Hereditary', correct:'Psychological horror', wrong:['Buddy comedy','Legal drama']},
            {type:'bestPicture', year:'2006', correct:'The Departed', wrong:['Babel','Little Miss Sunshine']},
            {type:'bestPicture', year:'2010', correct:'The King’s Speech', wrong:['The Social Network','Black Swan']},
            {type:'bestPicture', year:'2014', correct:'Birdman', wrong:['Boyhood','Whiplash']},
            {type:'bestPicture', year:'2020', correct:'Nomadland', wrong:['Minari','The Father']},
            {type:'director', title:'The Prestige', correct:'Christopher Nolan', wrong:['M. Night Shyamalan','David Fincher']},
            {type:'role', title:'Whiplash', actor:'J. K. Simmons', correct:'Terence Fletcher', wrong:['Andrew Neiman','Jim Neiman']}
        ],
        hard: [
            {type:'director', title:'Oldboy', correct:'Park Chan-wook', wrong:['Bong Joon-ho','Kim Jee-woon']},
            {type:'director', title:'Burning', correct:'Lee Chang-dong', wrong:['Hong Sang-soo','Bong Joon-ho']},
            {type:'director', title:'Yi Yi', correct:'Edward Yang', wrong:['Hou Hsiao-hsien','Wong Kar-wai']},
            {type:'director', title:'A Prophet', correct:'Jacques Audiard', wrong:['Michael Haneke','François Ozon']},
            {type:'director', title:'The Piano Teacher', correct:'Michael Haneke', wrong:['Lars von Trier','Ulrich Seidl']},
            {type:'director', title:'Dogtooth', correct:'Yorgos Lanthimos', wrong:['Athina Rachel Tsangari','Ruben Östlund']},
            {type:'director', title:'The Lives of Others', correct:'Florian Henckel von Donnersmarck', wrong:['Fatih Akin','Christian Petzold']},
            {type:'director', title:'Son of Saul', correct:'László Nemes', wrong:['Béla Tarr','Cristian Mungiu']},
            {type:'role', title:'Oldboy', actor:'Choi Min-sik', correct:'Oh Dae-su', wrong:['Lee Woo-jin','Mr. Han']},
            {type:'role', title:'Parasite', actor:'Choi Woo-shik', correct:'Kim Ki-woo', wrong:['Kim Ki-taek','Park Dong-ik']},
            {type:'role', title:'The Master', actor:'Joaquin Phoenix', correct:'Freddie Quell', wrong:['Lancaster Dodd','Val Dodd']},
            {type:'role', title:'Phantom Thread', actor:'Daniel Day-Lewis', correct:'Reynolds Woodcock', wrong:['Cyril Woodcock','Alma Elson']},
            {type:'actorIn', actor:'Isabelle Huppert', correct:'The Piano Teacher', wrong:['Amélie','Portrait of a Lady on Fire']},
            {type:'actorIn', actor:'Emmanuelle Riva', correct:'Amour', wrong:['Blue Is the Warmest Colour','Elle']},
            {type:'actorIn', actor:'Tahar Rahim', correct:'A Prophet', wrong:['Incendies','The Hunt']},
            {type:'genre', title:'Dogtooth', correct:'Absurdist psychological drama', wrong:['Superhero fantasy','Sports documentary']},
            {type:'bestPicture', year:'1972', correct:'The Godfather', wrong:['Cabaret','Deliverance']},
            {type:'bestPicture', year:'1988', correct:'Rain Man', wrong:['Dangerous Liaisons','Mississippi Burning']},
            {type:'bestPicture', year:'1991', correct:'The Silence of the Lambs', wrong:['JFK','Beauty and the Beast']},
            {type:'bestPicture', year:'2000', correct:'Gladiator', wrong:['Traffic','Crouching Tiger, Hidden Dragon']},
            {type:'director', title:'The Handmaiden', correct:'Park Chan-wook', wrong:['Bong Joon-ho','Hirokazu Kore-eda']},
            {type:'genre', title:'The Hunt (2012)', correct:'Psychological drama', wrong:['Creature feature','Space adventure']},
            {type:'director', title:'The Secret in Their Eyes', correct:'Juan José Campanella', wrong:['Alejandro Amenábar','Pablo Larraín']},
            {type:'actorIn', actor:'Penélope Cruz', correct:'Volver', wrong:['Roma','Ida']}
        ],
        master: [
            {type:'director', title:'Au Hasard Balthazar', correct:'Robert Bresson', wrong:['Carl Theodor Dreyer','Luis Buñuel']},
            {type:'director', title:'L’Avventura', correct:'Michelangelo Antonioni', wrong:['Federico Fellini','Luchino Visconti']},
            {type:'director', title:'The Passion of Joan of Arc', correct:'Carl Theodor Dreyer', wrong:['F. W. Murnau','Jean Renoir']},
            {type:'director', title:'Tokyo Story', correct:'Yasujirō Ozu', wrong:['Akira Kurosawa','Kenji Mizoguchi']},
            {type:'director', title:'Ugetsu', correct:'Kenji Mizoguchi', wrong:['Yasujirō Ozu','Mikio Naruse']},
            {type:'director', title:'The 400 Blows', correct:'François Truffaut', wrong:['Jean-Luc Godard','Claude Chabrol']},
            {type:'director', title:'A Brighter Summer Day', correct:'Edward Yang', wrong:['Hou Hsiao-hsien','Tsai Ming-liang']},
            {type:'director', title:'Close-Up', correct:'Abbas Kiarostami', wrong:['Mohsen Makhmalbaf','Asghar Farhadi']},
            {type:'role', title:'The Rules of the Game', actor:'Marcel Dalio', correct:'Robert de la Chesnaye', wrong:['Octave','Marceau']},
            {type:'role', title:'The Passion of Joan of Arc', actor:'Renée Jeanne Falconetti', correct:'Joan of Arc', wrong:['Isabeau','Catherine']},
            {type:'actorIn', actor:'Setsuko Hara', correct:'Tokyo Story', wrong:['Rashomon','Ugetsu']},
            {type:'actorIn', actor:'Jean-Pierre Léaud', correct:'The 400 Blows', wrong:['Breathless','Army of Shadows']},
            {type:'actorIn', actor:'Gunnar Björnstrand', correct:'The Seventh Seal', wrong:['The 400 Blows','Tokyo Story']},
            {type:'genre', title:'Last Year at Marienbad', correct:'Surreal art-house mystery', wrong:['Noir heist thriller','Family adventure']},
            {type:'bestPicture', year:'1950', correct:'All About Eve', wrong:['Sunset Blvd.','Born Yesterday']},
            {type:'bestPicture', year:'1954', correct:'On the Waterfront', wrong:['Rear Window','Seven Brides for Seven Brothers']},
            {type:'bestPicture', year:'1962', correct:'Lawrence of Arabia', wrong:['To Kill a Mockingbird','The Music Man']},
            {type:'bestPicture', year:'1979', correct:'Kramer vs. Kramer', wrong:['Apocalypse Now','All That Jazz']},
            {type:'director', title:'The Spirit of the Beehive', correct:'Víctor Erice', wrong:['Carlos Saura','Luis García Berlanga']},
            {type:'genre', title:'Sansho the Bailiff', correct:'Japanese period tragedy', wrong:['American screwball comedy','Italian giallo']},
            {type:'director', title:'Jeanne Dielman, 23 quai du Commerce, 1080 Bruxelles', correct:'Chantal Akerman', wrong:['Agnès Varda','Claire Denis']},
            {type:'actorIn', actor:'Delphine Seyrig', correct:'Last Year at Marienbad', wrong:['Persona','The Apartment']}
        ]
    };
    const SERIES_EXTRA_FACTS = {
        easy: [
            {type:'network', title:'Wednesday', correct:'Netflix', wrong:['HBO','Apple TV+']},
            {type:'network', title:'The Last of Us', correct:'HBO', wrong:['AMC','Netflix']},
            {type:'network', title:'House of the Dragon', correct:'HBO', wrong:['Prime Video','FX']},
            {type:'network', title:'Loki', correct:'Disney+', wrong:['Netflix','HBO']},
            {type:'network', title:'Money Heist', correct:'Netflix', wrong:['Hulu','BBC One']},
            {type:'seasons', title:'Game of Thrones', correct:'8 seasons', wrong:['6 seasons','10 seasons']},
            {type:'seasons', title:'Stranger Things', correct:'4 seasons', wrong:['2 seasons','7 seasons']},
            {type:'role', title:'The Last of Us', actor:'Pedro Pascal', correct:'Joel Miller', wrong:['Tommy Miller','Bill']},
            {type:'role', title:'Wednesday', actor:'Jenna Ortega', correct:'Wednesday Addams', wrong:['Enid Sinclair','Morticia Addams']},
            {type:'role', title:'Loki', actor:'Tom Hiddleston', correct:'Loki', wrong:['Thor','Mobius']},
            {type:'role', title:'Stranger Things', actor:'David Harbour', correct:'Jim Hopper', wrong:['Steve Harrington','Mike Wheeler']},
            {type:'actorIn', actor:'Kit Harington', correct:'Game of Thrones', wrong:['Breaking Bad','The Office']},
            {type:'actorIn', actor:'Antony Starr', correct:'The Boys', wrong:['Succession','Sherlock']},
            {type:'actorIn', actor:'Bryan Cranston', correct:'Breaking Bad', wrong:['Friends','Lost']},
            {type:'genre', title:'Friends', correct:'Sitcom', wrong:['Zombie horror','Crime mystery']},
            {type:'genre', title:'The Last of Us', correct:'Post-apocalyptic drama', wrong:['Workplace sitcom','Legal thriller']},
            {type:'network', title:'The Witcher', correct:'Netflix', wrong:['HBO','CBS']},
            {type:'role', title:'The Witcher', actor:'Henry Cavill', correct:'Geralt of Rivia', wrong:['Jaskier','Vesemir']},
            {type:'seasons', title:'The Office (US)', correct:'9 seasons', wrong:['5 seasons','12 seasons']},
            {type:'network', title:'The Big Bang Theory', correct:'CBS', wrong:['HBO','Netflix']}
        ],
        medium: [
            {type:'network', title:'Barry', correct:'HBO', wrong:['FX','Netflix']},
            {type:'network', title:'Severance', correct:'Apple TV+', wrong:['Prime Video','HBO']},
            {type:'network', title:'The Crown', correct:'Netflix', wrong:['BBC One','HBO']},
            {type:'network', title:'Euphoria', correct:'HBO', wrong:['Hulu','The CW']},
            {type:'network', title:'Black Mirror', correct:'Channel 4 / Netflix', wrong:['AMC','HBO']},
            {type:'seasons', title:'Succession', correct:'4 seasons', wrong:['3 seasons','6 seasons']},
            {type:'seasons', title:'Dark', correct:'3 seasons', wrong:['2 seasons','5 seasons']},
            {type:'role', title:'Mr. Robot', actor:'Rami Malek', correct:'Elliot Alderson', wrong:['Tyrell Wellick','Whiterose']},
            {type:'role', title:'Severance', actor:'Adam Scott', correct:'Mark Scout', wrong:['Dylan George','Irving Bailiff']},
            {type:'role', title:'The Bear', actor:'Jeremy Allen White', correct:'Carmy Berzatto', wrong:['Richie Jerimovich','Marcus Brooks']},
            {type:'role', title:'Fargo', actor:'Billy Bob Thornton', correct:'Lorne Malvo', wrong:['Lester Nygaard','Lou Solverson']},
            {type:'actorIn', actor:'Zendaya', correct:'Euphoria', wrong:['The Crown','Dark']},
            {type:'actorIn', actor:'Bill Hader', correct:'Barry', wrong:['The Bear','Severance']},
            {type:'actorIn', actor:'Claire Foy', correct:'The Crown', wrong:['Succession','Fargo']},
            {type:'genre', title:'Barry', correct:'Dark comedy crime drama', wrong:['Medical soap opera','Space opera']},
            {type:'genre', title:'Severance', correct:'Sci-fi psychological thriller', wrong:['Teen sitcom','Western miniseries']},
            {type:'network', title:'The Queen’s Gambit', correct:'Netflix', wrong:['HBO','FX']},
            {type:'role', title:'The Queen’s Gambit', actor:'Anya Taylor-Joy', correct:'Beth Harmon', wrong:['Jolene','Alma Wheatley']},
            {type:'seasons', title:'Sherlock', correct:'4 seasons', wrong:['2 seasons','7 seasons']},
            {type:'network', title:'Narcos', correct:'Netflix', wrong:['HBO','AMC']}
        ],
        hard: [
            {type:'network', title:'Six Feet Under', correct:'HBO', wrong:['Showtime','FX']},
            {type:'network', title:'Boardwalk Empire', correct:'HBO', wrong:['AMC','Starz']},
            {type:'network', title:'Mr Inbetween', correct:'FX Australia', wrong:['HBO','Netflix']},
            {type:'network', title:'The Knick', correct:'Cinemax', wrong:['Showtime','AMC']},
            {type:'network', title:'Borgen', correct:'DR1', wrong:['BBC Two','Netflix']},
            {type:'seasons', title:'Six Feet Under', correct:'5 seasons', wrong:['3 seasons','7 seasons']},
            {type:'seasons', title:'Boardwalk Empire', correct:'5 seasons', wrong:['4 seasons','6 seasons']},
            {type:'role', title:'Boardwalk Empire', actor:'Steve Buscemi', correct:'Nucky Thompson', wrong:['Jimmy Darmody','Al Capone']},
            {type:'role', title:'The Americans', actor:'Matthew Rhys', correct:'Philip Jennings', wrong:['Stan Beeman','Oleg Burov']},
            {type:'role', title:'The Leftovers', actor:'Justin Theroux', correct:'Kevin Garvey', wrong:['Matt Jamison','John Murphy']},
            {type:'role', title:'Mindhunter', actor:'Jonathan Groff', correct:'Holden Ford', wrong:['Bill Tench','Ed Kemper']},
            {type:'actorIn', actor:'Michael K. Williams', correct:'The Wire', wrong:['Mad Men','Twin Peaks']},
            {type:'actorIn', actor:'Jon Hamm', correct:'Mad Men', wrong:['The Wire','Deadwood']},
            {type:'actorIn', actor:'Jodie Comer', correct:'Killing Eve', wrong:['The Americans','Fargo']},
            {type:'genre', title:'The Knick', correct:'Historical medical drama', wrong:['Animated sci-fi','Legal sitcom']},
            {type:'genre', title:'Borgen', correct:'Political drama', wrong:['Fantasy horror','Cooking show']},
            {type:'network', title:'Normal People', correct:'BBC Three / Hulu', wrong:['HBO','Netflix']},
            {type:'role', title:'Normal People', actor:'Paul Mescal', correct:'Connell Waldron', wrong:['Nick Conway','Jamie']},
            {type:'seasons', title:'Mindhunter', correct:'2 seasons', wrong:['4 seasons','5 seasons']},
            {type:'network', title:'Pachinko', correct:'Apple TV+', wrong:['Netflix','HBO']}
        ],
        master: [
            {type:'network', title:'Dekalog', correct:'TVP', wrong:['BBC Two','ARTE']},
            {type:'network', title:'The Bureau', correct:'Canal+', wrong:['Netflix','BBC One']},
            {type:'network', title:'Gomorrah', correct:'Sky Atlantic', wrong:['RAI 1','HBO']},
            {type:'network', title:'The Bridge', correct:'SVT1 / DR1', wrong:['BBC America','Netflix']},
            {type:'network', title:'Babylon Berlin', correct:'Sky 1 / Das Erste', wrong:['ZDF','HBO']},
            {type:'seasons', title:'Dekalog', correct:'1 season', wrong:['3 seasons','5 seasons']},
            {type:'seasons', title:'The Bureau', correct:'5 seasons', wrong:['2 seasons','7 seasons']},
            {type:'role', title:'The Bureau', actor:'Mathieu Kassovitz', correct:'Guillaume Debailly / Malotru', wrong:['Henri Duflot','Raymond Sisteron']},
            {type:'role', title:'Gomorrah', actor:'Marco D’Amore', correct:'Ciro Di Marzio', wrong:['Gennaro Savastano','Pietro Savastano']},
            {type:'role', title:'The Bridge', actor:'Sofia Helin', correct:'Saga Norén', wrong:['Sarah Lund','Birgitte Nyborg']},
            {type:'actorIn', actor:'Sofie Gråbøl', correct:'The Killing', wrong:['The Bridge','Borgen']},
            {type:'actorIn', actor:'Ulrich Thomsen', correct:'Banshee', wrong:['Rectify','Deadwood']},
            {type:'actorIn', actor:'Thure Lindhardt', correct:'The Bridge', wrong:['Gomorrah','The Shield']},
            {type:'genre', title:'Dekalog', correct:'Moral drama anthology', wrong:['Superhero comedy','Police reality show']},
            {type:'genre', title:'Gomorrah', correct:'Italian crime drama', wrong:['Period romance','Sci-fi sitcom']},
            {type:'network', title:'I, Claudius', correct:'BBC2', wrong:['ITV','HBO']},
            {type:'role', title:'I, Claudius', actor:'Derek Jacobi', correct:'Claudius', wrong:['Augustus','Tiberius']},
            {type:'seasons', title:'The Prisoner', correct:'1 season', wrong:['4 seasons','6 seasons']},
            {type:'network', title:'The Prisoner', correct:'ITV', wrong:['BBC One','CBS']},
            {type:'genre', title:'The Prisoner', correct:'Surreal spy-fi allegory', wrong:['Teen vampire romance','Medical comedy']}
        ]
    };

    function expandedFacts(mode, level) {
        const base = ((mode === 'movie' ? MOVIE_FACTS : SERIES_FACTS)[level] || []);
        const extra = ((mode === 'movie' ? MOVIE_EXTRA_FACTS : SERIES_EXTRA_FACTS)[level] || []);
        const seen = new Set();
        return [...base, ...extra].filter(f => {
            const key = [f.type, f.title || '', f.actor || '', f.year || '', f.correct].join('|').toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return f.correct && Array.isArray(f.wrong) && f.wrong.length >= 2 && !f.wrong.includes(f.correct);
        });
    }
    function buildQuizPool(mode, level) {
        const facts = expandedFacts(mode, level);
        return facts.map((f, idx) => ({ id: `${mode}_${level}_${idx}_${f.type}_${f.title || f.actor || f.year}_${f.correct}`, q: qText(f, mode), options: shuffle([f.correct, ...(f.wrong||[])]).slice(0,3), answer: f.correct }));
    }
    function pickQuizQuestions(mode, level) {
        let pool = buildQuizPool(mode, level);
        const usedKey = `fn_quiz_used_${mode}_${level}`;
        let used = [];
        try { used = JSON.parse(localStorage.getItem(usedKey) || '[]'); } catch(e) {}
        let fresh = pool.filter(q => !used.includes(q.id));
        let selectedPool = fresh;
        if (fresh.length < 10) {
            // only when a full cycle is exhausted, fill the remaining slots from the older questions;
            // this keeps repeats as rare as possible while never breaking the quiz.
            const recycled = shuffle(pool.filter(q => used.includes(q.id)));
            selectedPool = [...fresh, ...recycled];
            if (fresh.length === 0) used = [];
        }
        const selected = shuffle(selectedPool).slice(0, 10);
        localStorage.setItem(usedKey, JSON.stringify([...used, ...selected.map(q=>q.id)].slice(-3000)));
        return selected;
    }

    let quizState = null;
    let quizTimer = null;

    window.openQuizHome = function(mode) {
        const isFa = LANG === 'fa';
        const home = document.getElementById('tests-home-panel');
        const levels = document.getElementById('quiz-level-panel');
        if (home) home.style.display = 'none';
        const mainHero = document.querySelector('#tests-tab > .tests-wrap > .tests-hero');
        if (mainHero) mainHero.style.display = 'none';
        if (levels) levels.style.display = 'block';
        const title = document.getElementById('quiz-level-title');
        const sub = document.getElementById('quiz-level-sub');
        if (title) title.innerText = mode === 'movie' ? (isFa ? 'کوییز سینمایی' : 'Movie Quiz') : (isFa ? 'کوییز سریالی' : 'Series Quiz');
        if (sub) sub.innerText = isFa ? 'سطح را انتخاب کن. هر آزمون ۱۰ سوال دارد و نتیجه ذخیره می‌شود.' : 'Choose a level. Each test has 10 questions and your result is saved.';
        const back = document.getElementById('quiz-back-label'); if (back) back.innerText = isFa ? '← بازگشت' : '← Back';
        const grid = document.getElementById('quiz-level-grid');
        if (!grid) return;
        grid.innerHTML = Object.keys(QUIZ_LEVELS).map(level => makeQuizLevelCard(mode, level)).join('');
    };
    function makeQuizLevelCard(mode, level) {
        const isFa = LANG === 'fa';
        const cfg = QUIZ_LEVELS[level];
        const name = level === 'master'
            ? (mode === 'series' ? (isFa ? cfg.seriesFa : cfg.seriesEn) : (isFa ? cfg.fa : cfg.en))
            : (isFa ? cfg.fa : cfg.en);
        const res = getQuizResult(mode, level);
        const scoreHtml = res ? miniScoreCircle(res.score) : '';
        const timeTxt = isFa ? `${cfg.time} ثانیه` : `${cfg.time}s`;
        const meta = isFa ? `۱۰ سوال • ${timeTxt} • هر سوال ۲ نمره` : `10 questions • ${timeTxt} • 2 points each`;
        const last = res ? (isFa ? `آخرین نمره: ${res.score}/20` : `Last score: ${res.score}/20`) : (isFa ? 'هنوز تست ندادی' : 'No result yet');
        return `<div class="quiz-level-card" onclick="openQuizLevelOptions('${mode}','${level}')">
            <div class="quiz-level-name">${name}</div>
            <div class="quiz-level-meta">${meta}</div>
            <div class="quiz-level-last">${last}</div>
            ${scoreHtml ? `<div class="quiz-level-score">${scoreHtml}</div>` : ''}
        </div>`;
    }
    function getQuizResult(mode, level) {
        try { return JSON.parse(localStorage.getItem(`fn_quiz_result_${mode}_${level}`) || 'null'); } catch(e) { return null; }
    }
    function scoreColor(score) {
        if (score >= 18) return '#d4af37';
        if (score >= 15) return '#20d070';
        if (score >= 10) return '#f5c518';
        return '#e50914';
    }
    function miniScoreCircle(score) {
        const c = scoreColor(score), pct = Math.max(0, Math.min(1, score/20)), dash = 100 - pct*100;
        return `<svg viewBox="0 0 36 36" width="42" height="42"><circle cx="18" cy="18" r="15.5" fill="none" stroke="#222" stroke-width="4"/><circle cx="18" cy="18" r="15.5" fill="none" stroke="${c}" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="${dash}" stroke-linecap="round" transform="rotate(-90 18 18)"/><text x="18" y="21" text-anchor="middle" fill="#fff" font-size="9" font-weight="900">${score}</text></svg>`;
    }

    let pendingQuizAction = null;
    window.openQuizLevelOptions = function(mode, level) {
        const res = getQuizResult(mode, level);
        if (!res) return window.startQuiz(mode, level);
        pendingQuizAction = {mode, level};
        const isFa = LANG === 'fa';
        const modal = document.getElementById('quiz-level-action-modal');
        const title = document.getElementById('qlas-title');
        const retry = document.getElementById('qlas-retry');
        const result = document.getElementById('qlas-result');
        const share = document.getElementById('qlas-share');
        const cancel = document.getElementById('qlas-cancel');
        if (title) title.innerText = quizTitle(mode, level) + ' • ' + (isFa ? `آخرین نمره ${res.score}/20` : `Last score ${res.score}/20`);
        if (retry) retry.innerText = isFa ? 'آزمون مجدد با سوالات تازه' : 'Retake with new questions';
        if (result) result.innerText = isFa ? 'برگشت به نتایج قبلی' : 'Back to saved result';
        if (share) share.innerText = isFa ? 'اشتراک‌گذاری نتیجه' : 'Share result';
        if (cancel) cancel.innerText = isFa ? 'بستن' : 'Close';
        if (modal) modal.classList.add('open');
    };
    window.closeQuizLevelOptions = function(ev){ if(ev && ev.target && ev.target.classList && ev.target.classList.contains('quiz-level-action-modal')) closeQuizLevelOptionsDirect(); };
    window.closeQuizLevelOptionsDirect = function(){ const m=document.getElementById('quiz-level-action-modal'); if(m) m.classList.remove('open'); };
    window.quizOptionRetry = function(){ if(!pendingQuizAction) return; const a=pendingQuizAction; closeQuizLevelOptionsDirect(); window.startQuiz(a.mode,a.level); };
    window.quizOptionResult = function(){ if(!pendingQuizAction) return; const a=pendingQuizAction; closeQuizLevelOptionsDirect(); const res=getQuizResult(a.mode,a.level); if(res) renderQuizResult(res); else window.startQuiz(a.mode,a.level); const page=document.getElementById('quiz-page'); if(page) page.classList.add('open'); const title=document.getElementById('quiz-page-title'); if(title) title.innerText=quizTitle(a.mode,a.level); };
    window.quizOptionShare = function(){ if(!pendingQuizAction) return; const res=getQuizResult(pendingQuizAction.mode,pendingQuizAction.level); if(!res) return; const isFa=LANG==='fa'; const txt=isFa ? `نتیجه تست من در Family Night: ${res.score}/20 | جواب درست: ${res.correct} از 10 | غلط/بی‌پاسخ: ${res.wrong}` : `My Family Night quiz result: ${res.score}/20 | Correct: ${res.correct}/10 | Wrong/unanswered: ${res.wrong}`; if(navigator.share) navigator.share({text:txt}).catch(()=>{}); else navigator.clipboard?.writeText(txt).then(()=>alert(isFa?'نتیجه کپی شد':'Result copied')); };

    window.startQuiz = function(mode, level) {
        const questions = pickQuizQuestions(mode, level);
        quizState = { mode, level, questions, idx:0, correct:0, wrong:0, answered:false, ended:false, startedAt:Date.now(), remaining:QUIZ_LEVELS[level].time };
        const page = document.getElementById('quiz-page');
        if (page) page.classList.add('open');
        const title = document.getElementById('quiz-page-title');
        if (title) title.innerText = quizTitle(mode, level);
        renderQuizQuestion();
        startQuizTimer();
    };
    function quizTitle(mode, level) {
        const isFa = LANG === 'fa'; const cfg = QUIZ_LEVELS[level];
        const base = mode === 'movie' ? (isFa ? 'کوییز سینمایی' : 'Movie Quiz') : (isFa ? 'کوییز سریالی' : 'Series Quiz');
        const lvl = level === 'master' ? (mode === 'series' ? (isFa ? cfg.seriesFa : cfg.seriesEn) : (isFa ? cfg.fa : cfg.en)) : (isFa ? cfg.fa : cfg.en);
        return `${base} • ${lvl}`;
    }
    function startQuizTimer() {
        clearInterval(quizTimer);
        quizTimer = setInterval(() => {
            if (!quizState || quizState.ended) return;
            quizState.remaining -= 1;
            updateQuizTimerUI();
            if (quizState.remaining <= 0) timeUpQuiz();
        }, 1000);
        updateQuizTimerUI();
    }
    function updateQuizTimerUI() {
        if (!quizState) return;
        const rem = Math.max(0, quizState.remaining);
        const total = QUIZ_LEVELS[quizState.level].time;
        const pct = rem / total;
        const circle = document.getElementById('quiz-timer-progress');
        const label = document.getElementById('quiz-timer-label');
        if (circle) {
            circle.style.strokeDashoffset = 188.5 * (1 - pct);
            circle.style.stroke = rem <= 5 ? '#e50914' : (quizState.level === 'master' ? '#d4af37' : '#20d070');
        }
        if (label) label.innerText = rem;
    }
    function renderQuizQuestion() {
        if (!quizState) return;
        const isFa = LANG === 'fa';
        const q = quizState.questions[quizState.idx];
        const content = document.getElementById('quiz-page-content');
        if (!content) return;
        quizState.answered = false;
        content.innerHTML = `<div class="quiz-timer-wrap">
            <div class="quiz-timer-circle"><svg width="64" height="64" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="none" stroke="#222" stroke-width="5"/><circle id="quiz-timer-progress" cx="32" cy="32" r="30" fill="none" stroke="#20d070" stroke-width="5" stroke-dasharray="188.5" stroke-dashoffset="0" stroke-linecap="round"/></svg><div class="quiz-timer-label" id="quiz-timer-label">${quizState.remaining}</div></div>
            <div><div class="quiz-progress-text">${isFa ? 'سوال' : 'Question'} ${quizState.idx+1} / 10</div><div style="color:#666;font-size:11px;margin-top:4px;">${isFa ? 'هر جواب درست ۲ نمره دارد' : 'Each correct answer gives 2 points'}</div></div>
        </div>
        <div class="quiz-question-card">
            <div class="quiz-question-text">${q.q}</div>
            <div id="quiz-options">${q.options.map((op, i) => `<div class="quiz-option" onclick="selectQuizAnswer(${i})" data-op="${op.replace(/"/g,'&quot;')}"><span class="qo-dot"></span><span>${op}</span></div>`).join('')}</div>
        </div>
        <div id="quiz-timeup-box" style="display:none;" class="quiz-timeup"><div style="font-size:28px;margin-bottom:8px;">⏱️</div><b>${isFa ? 'زمان تمام شد!' : 'Time is up!'}</b><br><button class="quiz-action-btn primary" style="margin-top:12px;" onclick="finishQuiz()">${isFa ? 'مشاهده نتیجه' : 'Show result'}</button></div>`;
        updateQuizTimerUI();
    }
    window.selectQuizAnswer = function(optionIndex) {
        if (!quizState || quizState.ended || quizState.answered) return;
        quizState.answered = true;
        const q = quizState.questions[quizState.idx];
        const opts = [...document.querySelectorAll('.quiz-option')];
        opts.forEach(el => el.style.pointerEvents = 'none');
        const selected = opts[optionIndex];
        const selectedText = selected ? selected.dataset.op : '';
        const correct = selectedText === q.answer;
        opts.forEach(el => {
            if (el.dataset.op === q.answer) { el.classList.add('correct'); el.querySelector('.qo-dot').innerHTML = '<i class="fa-solid fa-check"></i>'; }
        });
        if (correct) { quizState.correct++; playQuizSound(true); }
        else {
            quizState.wrong++;
            if (selected) { selected.classList.add('wrong'); selected.querySelector('.qo-dot').innerHTML = '<i class="fa-solid fa-xmark"></i>'; }
            playQuizSound(false); if (navigator.vibrate) navigator.vibrate(120);
        }
        setTimeout(() => {
            if (!quizState || quizState.ended) return;
            quizState.idx++;
            if (quizState.idx >= quizState.questions.length) finishQuiz(); else renderQuizQuestion();
        }, correct ? 650 : 950);
    };
    function playQuizSound(ok) {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            const ctx = new Ctx();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.type = ok ? 'sine' : 'square'; osc.frequency.value = ok ? 740 : 180;
            gain.gain.value = 0.05; osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); setTimeout(()=>{osc.stop(); ctx.close();}, ok ? 120 : 180);
        } catch(e) {}
    }
    function timeUpQuiz() {
        if (!quizState || quizState.ended) return;
        quizState.ended = true;
        clearInterval(quizTimer);
        document.querySelectorAll('.quiz-option').forEach(el => el.style.pointerEvents = 'none');
        const box = document.getElementById('quiz-timeup-box'); if (box) box.style.display = 'block';
        if (navigator.vibrate) navigator.vibrate([90, 80, 90]);
    }
    window.finishQuiz = function() {
        if (!quizState) return;
        quizState.ended = true;
        clearInterval(quizTimer);
        const score = quizState.correct * 2;
        const result = { score, correct: quizState.correct, wrong: 10 - quizState.correct, mode: quizState.mode, level: quizState.level, date: Date.now() };
        localStorage.setItem(`fn_quiz_result_${quizState.mode}_${quizState.level}`, JSON.stringify(result));
        renderQuizResult(result);
    };
    function renderQuizResult(res) {
        const isFa = LANG === 'fa';
        const c = scoreColor(res.score); const pct = res.score/20; const dash = 440 - 440*pct;
        let title = isFa ? 'نتیجه آزمون' : 'Quiz Result';
        let desc = '';
        if (res.score >= 18) desc = isFa ? 'درخشان! واقعاً در سطح سلطان هستی.' : 'Outstanding! You are truly at master level.';
        else if (res.score >= 15) desc = isFa ? 'خیلی خوب بود؛ دانش سینمایی/سریالی قوی داری.' : 'Great result; your cinema/series knowledge is strong.';
        else if (res.score >= 10) desc = isFa ? 'قابل قبول بود؛ هنوز جای پیشرفت داری.' : 'Not bad; there is still room to improve.';
        else desc = isFa ? 'نیاز به تمرین بیشتر داری؛ دوباره امتحان کن.' : 'You need more practice; try again.';
        const levelName = quizTitle(res.mode, res.level);
        const content = document.getElementById('quiz-page-content');
        content.innerHTML = `<div class="quiz-result-card">
            <div class="quiz-score-ring ${res.score>=18?'gold quiz-gold-shine':''}"><svg width="170" height="170" viewBox="0 0 170 170"><circle cx="85" cy="85" r="70" fill="none" stroke="#222" stroke-width="14"/><circle cx="85" cy="85" r="70" fill="none" stroke="${c}" stroke-width="14" stroke-dasharray="440" stroke-dashoffset="${dash}" stroke-linecap="round"/></svg><div class="quiz-score-number"><strong>${res.score}</strong><span>/ 20</span></div></div>
            <div class="quiz-result-title">${title}</div>
            <div class="quiz-result-desc">${levelName}<br>${desc}<br>${isFa ? 'درست' : 'Correct'}: ${res.correct} • ${isFa ? 'غلط/بی‌پاسخ' : 'Wrong/unanswered'}: ${res.wrong}</div>
            <div class="quiz-action-row">
                <button class="quiz-action-btn primary" onclick="startQuiz('${res.mode}','${res.level}')">${isFa ? 'تست مجدد' : 'Try again'}</button>
                <button class="quiz-action-btn" onclick="shareQuizResult()">${isFa ? 'اشتراک‌گذاری نتیجه' : 'Share result'}</button>
                <button class="quiz-action-btn" onclick="closeQuizPage(); openQuizHome('${res.mode}')">${isFa ? 'بازگشت به سطح‌ها' : 'Back to levels'}</button>
            </div>
        </div>`;
    }
    window.shareQuizResult = function() {
        if (!quizState) return;
        const res = getQuizResult(quizState.mode, quizState.level) || {score: quizState.correct*2, correct: quizState.correct, wrong: 10-quizState.correct, mode: quizState.mode, level: quizState.level};
        const isFa = LANG === 'fa';
        const txt = isFa ? `نتیجه تست من در Family Night: ${res.score}/20 | جواب درست: ${res.correct} از 10` : `My Family Night quiz result: ${res.score}/20 | Correct answers: ${res.correct}/10`;
        if (navigator.share) navigator.share({text: txt}).catch(()=>{});
        else navigator.clipboard?.writeText(txt).then(()=>alert(isFa?'نتیجه کپی شد':'Result copied'));
    };
    window.closeQuizPage = function() {
        clearInterval(quizTimer); quizState = null;
        const page = document.getElementById('quiz-page'); if (page) page.classList.remove('open');
    };

    // update labels after initial load
    setTimeout(renderTestsQuizHome, 500);
})();
/* =================== END V31 PATCH =================== */



;

/* ===== v39 safe Persian-mode direction and language button fix ===== */
(function(){
  function isFaMode(){
    try { return (typeof LANG !== 'undefined' && LANG === 'fa') || localStorage.getItem('lang') === 'fa'; }
    catch(e){ return false; }
  }
  function setAutoDir(id){
    try { var el = document.getElementById(id); if(el) el.setAttribute('dir','auto'); } catch(e){}
  }
  function applyFaSafeLayout(){
    try {
      var fa = isFaMode();
      document.documentElement.lang = fa ? 'fa' : 'en';
      document.documentElement.dir = 'ltr';
      if (document.body) {
        document.body.setAttribute('dir','ltr');
        document.body.classList.toggle('lang-fa', fa);
        document.body.classList.toggle('lang-en', !fa);
      }
      ['d-title','d-title-fa','d-title-secondary','d-desc','ai-input','ai-fs-input','ai-box-label','ai-context-badge','qotd-text','qotd-fa-text','search-input'].forEach(setAutoDir);
      var mainLangIcon = document.getElementById('lang-toggle-icon');
      if (mainLangIcon) mainLangIcon.textContent = fa ? 'EN' : 'FA';
      document.querySelectorAll('.fn-lang-mini-text').forEach(function(el){ el.textContent = fa ? 'EN' : 'FA'; });
    } catch(e) {}
  }
  var oldApplyLang = (typeof applyLang === 'function') ? applyLang : null;
  if (oldApplyLang && !oldApplyLang.__faSafeWrapped) {
    applyLang = function(){
      var r = oldApplyLang.apply(this, arguments);
      applyFaSafeLayout();
      setTimeout(applyFaSafeLayout, 80);
      return r;
    };
    applyLang.__faSafeWrapped = true;
  }
  var oldOpenDetail = (typeof openDetail === 'function') ? openDetail : null;
  if (oldOpenDetail && !oldOpenDetail.__faSafeWrapped) {
    openDetail = async function(){
      var r = await oldOpenDetail.apply(this, arguments);
      applyFaSafeLayout();
      setTimeout(applyFaSafeLayout, 120);
      setTimeout(applyFaSafeLayout, 600);
      return r;
    };
    openDetail.__faSafeWrapped = true;
  }
  document.addEventListener('DOMContentLoaded', function(){ applyFaSafeLayout(); setTimeout(applyFaSafeLayout, 300); setTimeout(applyFaSafeLayout, 1400); });
  window.addEventListener('load', function(){ applyFaSafeLayout(); setTimeout(applyFaSafeLayout, 500); });
})();

