
/* ===== v22 People see-all search + strict director category patch ===== */
(function(){
  const DIRECTOR_EXTRA_IDS_V22 = [525,138,1032,488,240,7467,578,2710,137427,2636,21684,10930,5602,4762,5655,12453,1243,1152,9341,11401,223,16767,2045,11218,1776,1204,11614,608,10099,2303,3325,4483,1223,1769,1466,6773,8643,6548,8556,5363,9168,15217,108,3110,533,5953,8502,1532,4500,22970,1032,9341,525,240,2710,488,7467];
  const _personDetailCacheV22 = new Map();
  const _personCreditsCacheV22 = new Map();
  function _normV22(s){
    return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[آأإ]/g,'ا').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
  }
  function _queryToEnglishV22(q){
    let out = String(q||'').trim();
    if (typeof PERSON_FA_TO_EN !== 'undefined') {
      Object.keys(PERSON_FA_TO_EN).sort((a,b)=>b.length-a.length).forEach(k=>{
        out = out.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'), PERSON_FA_TO_EN[k]);
      });
    }
    return out.trim();
  }
  function _nameScoreV22(name, query){
    const n = _normV22(name), q = _normV22(query);
    if (!q) return 1;
    if (!n) return 0;
    const noSpaceN = n.replace(/\s+/g,''), noSpaceQ = q.replace(/\s+/g,'');
    const tokens = n.split(' ').filter(Boolean), qTokens = q.split(' ').filter(Boolean);
    if (n === q) return 1000;
    if (n.startsWith(q)) return 900;
    if (tokens.some(t=>t === q)) return 850;
    if (tokens.some(t=>t.startsWith(q))) return 800;
    if (n.includes(q)) return 700;
    if (noSpaceN.includes(noSpaceQ)) return 650;
    if (qTokens.length > 1) {
      let ok = true, prefix = 0;
      for (const qt of qTokens) {
        const match = tokens.some(t => t.startsWith(qt) || t.includes(qt));
        if (!match) ok = false;
        if (tokens.some(t => t.startsWith(qt))) prefix++;
      }
      if (ok) return 600 + prefix * 40;
    }
    return 0;
  }
  async function _detailV22(p){
    if (!p || !p.id) return p;
    if (_personDetailCacheV22.has(p.id)) return {...p, ..._personDetailCacheV22.get(p.id)};
    try {
      const d = await getDataEN(`person/${p.id}`);
      if (d && d.id) {
        _personDetailCacheV22.set(p.id, d);
        return {...p, ...d};
      }
    } catch(e){}
    return p;
  }
  async function _creditsV22(id){
    if (!id) return null;
    if (_personCreditsCacheV22.has(id)) return _personCreditsCacheV22.get(id);
    try {
      const c = await getDataEN(`person/${id}/combined_credits`);
      _personCreditsCacheV22.set(id, c || {});
      return c || {};
    } catch(e){ return {}; }
  }
  async function _isDirectorV22(p){
    if (!p || !p.id || !p.profile_path) return false;
    if (p.known_for_department === 'Directing') return true;
    if (DIRECTOR_EXTRA_IDS_V22.includes(Number(p.id))) return true;
    const c = await _creditsV22(p.id);
    const crew = (c && c.crew) || [];
    return crew.some(x => x && (x.department === 'Directing' || String(x.job||'').toLowerCase().includes('director')));
  }
  async function _validForTypeV22(p, type){
    if (!p || !p.id || !p.profile_path) return false;
    if (type === 'actor_male_list' || type === 'actor_female_list') {
      let pp = p;
      if (!pp.gender) pp = await _detailV22(p);
      return type === 'actor_male_list' ? pp.gender === 2 : pp.gender === 1;
    }
    if (type === 'director_list') return await _isDirectorV22(p);
    return true;
  }
  window.personMatchesCurrentList = function(p, type){
    if (!p || !p.profile_path) return false;
    if (type === 'actor_male_list') return p.gender === 2;
    if (type === 'actor_female_list') return p.gender === 1;
    if (type === 'director_list') return p.known_for_department === 'Directing' || DIRECTOR_EXTRA_IDS_V22.includes(Number(p.id));
    return true;
  };
  window.scorePersonForList = function(p, type){
    const pop = Number(p && p.popularity || 0);
    const knownScore = ((p && p.known_for) || []).reduce((sum,x)=> sum + Number(x.popularity||0) + Number(x.vote_count||0)*0.015 + Number(x.vote_average||0)*2,0);
    if (type === 'director_list') return (p.known_for_department === 'Directing' ? 10000 : 0) + (DIRECTOR_EXTRA_IDS_V22.includes(Number(p.id)) ? 5000 : 0) + pop + knownScore;
    return pop + knownScore;
  };
  window.loadGenericPeoplePage = async function(isSearch){
    const container = document.getElementById('gg-content');
    const btn = document.getElementById('btn-more-g');
    if (!container) return;
    if (isSearch || genericPersonSearchQuery) return loadGenericPersonSearch(genericPersonSearchQuery || '');
    if (!window.genericPersonSeenIds) window.genericPersonSeenIds = new Set();
    const loadingId='person-loading-inline-v22';
    if (!document.getElementById(loadingId)) container.insertAdjacentHTML('beforeend', `<div id="${loadingId}" class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);display:block;margin-bottom:10px;"></i>${LANG==='fa'?'در حال بارگذاری...':'Loading...'}</div>`);
    let candidates=[];
    if (genericType === 'director_list') {
      if (genericPage === 1) {
        const details = await Promise.all(DIRECTOR_EXTRA_IDS_V22.map(id=>getDataEN(`person/${id}`).catch(()=>null)));
        candidates = candidates.concat(details.filter(Boolean).map(p=>({...p,known_for_department:'Directing'})));
      }
      const start = Math.max(1, (genericPage-1)*8 + 1);
      const pages = await fetchPeoplePages('person/popular', start, 8);
      candidates = candidates.concat(pages);
    } else {
      const start = Math.max(1, (genericPage-1)*6 + 1);
      candidates = await fetchPeoplePages('person/popular', start, 6);
    }
    const out=[];
    const tempSeen=new Set();
    for (const raw of candidates) {
      if (!raw || tempSeen.has(raw.id) || window.genericPersonSeenIds.has(raw.id)) continue;
      tempSeen.add(raw.id);
      const p = await _detailV22(raw);
      if (await _validForTypeV22(p, genericType)) {
        if (genericType === 'director_list') p.known_for_department='Directing';
        out.push(p);
      }
    }
    out.sort((a,b)=>scorePersonForList(b,genericType)-scorePersonForList(a,genericType));
    const loading=document.getElementById(loadingId); if (loading) loading.remove();
    out.slice(0,48).forEach(p=>{ if(!window.genericPersonSeenIds.has(p.id)){ window.genericPersonSeenIds.add(p.id); container.innerHTML += makePersonCard(p); }});
    if (!container.children.length) container.innerHTML = `<div class="person-empty-state">${LANG==='fa'?'فعلاً نتیجه‌ای پیدا نشد. دوباره بارگذاری کن.':'No people found yet. Try loading more.'}</div>`;
    if (btn) btn.style.display='block';
  };
  window.searchGenericPeople = function(q){
    const clearBtn=document.getElementById('gg-person-search-clear');
    if(clearBtn) clearBtn.style.display = q.trim() ? 'block' : 'none';
    if (genericPersonSearchTimer) clearTimeout(genericPersonSearchTimer);
    genericPersonSearchTimer=setTimeout(async()=>{
      genericPersonSearchQuery = q.trim();
      genericPage = 1;
      window.genericPersonSeenIds = new Set();
      const container=document.getElementById('gg-content');
      if(container) container.innerHTML='';
      if(!genericPersonSearchQuery){ loadGenericData(); return; }
      await loadGenericPersonSearch(genericPersonSearchQuery);
    },140);
  };
  window.loadGenericPersonSearch = async function(q){
    const container=document.getElementById('gg-content');
    const btn=document.getElementById('btn-more-g');
    if(btn) btn.style.display='none';
    if(!container) return;
    const rawQ=String(q||'').trim();
    const enQ=_queryToEnglishV22(rawQ);
    container.innerHTML = `<div class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);display:block;margin-bottom:10px;"></i>${LANG==='fa'?'در حال جستجو...':'Searching...'}</div>`;
    const terms=[rawQ,enQ].filter(Boolean).filter((v,i,a)=>a.findIndex(x=>_normV22(x)===_normV22(v))===i);
    let all=[];
    for(const term of terms){
      for(let page=1; page<=4; page++){
        try{ const d=await getDataEN(`search/person?query=${encodeURIComponent(term)}&include_adult=false&page=${page}`); if(d&&d.results) all=all.concat(d.results); if(!d || page >= (d.total_pages||1)) break; }catch(e){break;}
      }
      if (LANG === 'fa') {
        try{ const d=await getData(`search/person?query=${encodeURIComponent(term)}&include_adult=false&page=1`); if(d&&d.results) all=all.concat(d.results); }catch(e){}
      }
    }
    const seen=new Set();
    const final=[];
    for(const raw of all){
      if(!raw || seen.has(raw.id)) continue;
      seen.add(raw.id);
      let p=await _detailV22(raw);
      if (!(await _validForTypeV22(p, genericType))) continue;
      if (genericType === 'director_list') p.known_for_department='Directing';
      const s1=_nameScoreV22(p.name, rawQ);
      const s2=enQ!==rawQ ? _nameScoreV22(p.name, enQ) : 0;
      const score=Math.max(s1,s2);
      if(score>0) final.push({...p,_matchScoreV22:score});
    }
    final.sort((a,b)=>(b._matchScoreV22-a._matchScoreV22) || (scorePersonForList(b,genericType)-scorePersonForList(a,genericType)));
    container.innerHTML='';
    if(!final.length){
      container.innerHTML=`<div class="person-empty-state">${LANG==='fa'?'شخصی با این نام در همین دسته‌بندی پیدا نشد.':'No matching person found in this category.'}</div>`;
      return;
    }
    final.slice(0,80).forEach(p=> container.innerHTML += makePersonCard(p));
  };
})();


;

/* ===== v24 robust people see-all loader/search fix (safe override only) ===== */
(function(){
  const MALE_SEED_IDS_V24 = [6193,287,85,31,3894,13240,500,3223,1245,2524,1892,12835,60,64,976,819,17178,192,16828,23659,10980,72466,74568,17051,7399,6384,10859,2231,22970,2888,31,62,190,71580,31,2037,1136406,976,13022,2524,1136406,19292,488,500];
  const FEMALE_SEED_IDS_V24 = [115440,1245,54693,112,11701,8691,3895,5064,1813,4430,116,5530,18918,119592,131,93210,974169,1813,1245,3371804,90633,550843,56734,3194176,54693,5576,41292,2049994,974169,2359226,2524];
  const DIRECTOR_SEED_IDS_V24 = [525,138,1032,488,240,7467,578,2710,137427,2636,21684,10930,5602,4762,5655,12453,1243,1152,9341,11401,223,16767,2045,11218,1776,1204,11614,608,10099,2303,3325,4483,1223,1769,1466,6773,8643,6548,8556,5363,9168,15217,108,3110,533,5953,8502,1532,4500,22970,11770,135,569,11220,21991,2687,5656,5615];
  const FA_NAME_MAP_V24 = {
    'جیمز':'James','فرانکو':'Franco','سیدنی':'Sydney','سوئینی':'Sweeney','کریستوفر':'Christopher','نولان':'Nolan','لئوناردو':'Leonardo','دی کاپریو':'DiCaprio','تام':'Tom','برد':'Brad','پیت':'Pitt','جانی':'Johnny','دپ':'Depp','کریستین':'Christian','بیل':'Bale','رابرت':'Robert','داونی':'Downey','جونیور':'Jr','آل':'Al','پاچینو':'Pacino','دنزل':'Denzel','واشنگتن':'Washington','مورگان':'Morgan','فریمن':'Freeman','جکی':'Jackie','چان':'Chan','اسکورسیزی':'Scorsese','اسپیلبرگ':'Spielberg','تارانتینو':'Tarantino','فینچر':'Fincher','کوبریک':'Kubrick','هیچکاک':'Hitchcock','ریدلی':'Ridley','اسکات':'Scott','کامرون':'Cameron','دنی':'Denis','ویلنوو':'Villeneuve','بونگ':'Bong','جون':'Joon','هو':'Ho','پارک':'Park','استنلی':'Stanley','مارتین':'Martin','استیون':'Steven','کوئنتین':'Quentin','دیوید':'David','آنجلینا':'Angelina','جولی':'Jolie','اسکارلت':'Scarlett','مارگو':'Margot','رابی':'Robbie','کیت':'Kate','وینسلت':'Winslet','مریل':'Meryl','استریپ':'Streep','اما':'Emma','استون':'Stone','ناتالی':'Natalie','پورتمن':'Portman','شارلیز':'Charlize','ترون':'Theron','زندایا':'Zendaya'
  };
  const detailCacheV24 = new Map();
  const creditCacheV24 = new Map();
  function timeout(ms){ return new Promise(resolve=>setTimeout(()=>resolve(null),ms)); }
  async function safeData(url, ms=6500){
    try { return await Promise.race([getDataEN(url), timeout(ms)]); } catch(e) { return null; }
  }
  function norm(s){
    return String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[آأإ]/g,'ا').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
  }
  function toEnglishQuery(q){
    let out=String(q||'').trim();
    const dict=(typeof PERSON_FA_TO_EN!=='undefined') ? Object.assign({}, PERSON_FA_TO_EN, FA_NAME_MAP_V24) : FA_NAME_MAP_V24;
    Object.keys(dict).sort((a,b)=>b.length-a.length).forEach(k=>{
      out=out.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'), dict[k]);
    });
    return out.trim();
  }
  function nameScore(name, query){
    const n=norm(name), q=norm(query);
    if(!q) return 1;
    if(!n) return 0;
    const nt=n.split(' ').filter(Boolean), qt=q.split(' ').filter(Boolean);
    const ns=n.replace(/\s+/g,''), qs=q.replace(/\s+/g,'');
    if(n===q) return 1000;
    if(n.startsWith(q)) return 920;
    if(nt.some(t=>t===q)) return 880;
    if(nt.some(t=>t.startsWith(q))) return 830;
    if(n.includes(q)) return 760;
    if(ns.includes(qs)) return 720;
    if(qt.length>1){
      let ok=true, prefix=0;
      for(const part of qt){
        const hit=nt.some(t=>t.startsWith(part) || t.includes(part));
        if(!hit) ok=false;
        if(nt.some(t=>t.startsWith(part))) prefix++;
      }
      if(ok) return 640 + prefix*50;
    }
    return 0;
  }
  async function detail(p){
    if(!p || !p.id) return p;
    if(detailCacheV24.has(p.id)) return Object.assign({}, p, detailCacheV24.get(p.id));
    const d=await safeData('person/'+p.id, 5500);
    if(d && d.id){ detailCacheV24.set(p.id,d); return Object.assign({}, p, d); }
    return p;
  }
  async function credits(id){
    if(!id) return {};
    if(creditCacheV24.has(id)) return creditCacheV24.get(id);
    const c=await safeData('person/'+id+'/combined_credits', 5500) || {};
    creditCacheV24.set(id,c);
    return c;
  }
  async function isDirector(p){
    if(!p || !p.id || !p.profile_path) return false;
    if(DIRECTOR_SEED_IDS_V24.includes(Number(p.id))) return true;
    if(p.known_for_department === 'Directing') return true;
    const c=await credits(p.id);
    const crew=(c&&c.crew)||[];
    const directed=crew.filter(x=>x && (x.department==='Directing' || /director/i.test(String(x.job||''))));
    return directed.length>0;
  }
  async function validFor(p,type){
    if(!p || !p.id || !p.profile_path) return false;
    let pp=p;
    if(type==='actor_male_list' || type==='actor_female_list'){
      if(!pp.gender) pp=await detail(pp);
      return type==='actor_male_list' ? pp.gender===2 : pp.gender===1;
    }
    if(type==='director_list') return await isDirector(pp);
    return true;
  }
  function score(p,type){
    const pop=Number(p&&p.popularity||0);
    const known=((p&&p.known_for)||[]).reduce((s,x)=>s+Number(x.popularity||0)+Number(x.vote_count||0)*0.02+Number(x.vote_average||0)*3,0);
    if(type==='director_list') return (DIRECTOR_SEED_IDS_V24.includes(Number(p.id))?20000:0)+(p.known_for_department==='Directing'?5000:0)+pop+known;
    return pop+known;
  }
  async function fetchPages(base,start,pages){
    const out=[];
    for(let i=0;i<pages;i++){
      const sep=base.includes('?')?'&':'?';
      const d=await safeData(base+sep+'page='+(start+i),6500);
      if(d&&d.results) out.push(...d.results);
      if(!d || (d.total_pages && start+i>=d.total_pages)) break;
    }
    return out;
  }
  function renderEmpty(text){
    const container=document.getElementById('gg-content');
    if(container) container.innerHTML='<div class="person-empty-state">'+text+'</div>';
  }
  function renderLoading(text){
    const container=document.getElementById('gg-content');
    if(container) container.innerHTML='<div class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);display:block;margin-bottom:10px;"></i>'+text+'</div>';
  }
  function cleanContainerForPeople(){
    const c=document.getElementById('gg-content');
    if(c){ c.className='person-grid-container'; }
  }
  window.personMatchesCurrentList=function(p,type){
    if(!p || !p.profile_path) return false;
    if(type==='actor_male_list') return p.gender===2;
    if(type==='actor_female_list') return p.gender===1;
    if(type==='director_list') return p.known_for_department==='Directing' || DIRECTOR_SEED_IDS_V24.includes(Number(p.id));
    return true;
  };
  window.scorePersonForList=score;
  window.loadGenericPeoplePage=async function(isSearch){
    cleanContainerForPeople();
    const container=document.getElementById('gg-content');
    const btn=document.getElementById('btn-more-g');
    if(!container) return;
    if(isSearch || genericPersonSearchQuery) return window.loadGenericPersonSearch(genericPersonSearchQuery||'');
    if(!window.genericPersonSeenIds) window.genericPersonSeenIds=new Set();
    const alreadyCount=container.querySelectorAll('.actor-card,.person-card,.cast-card').length;
    if(genericPage===1 && alreadyCount===0) renderLoading(LANG==='fa'?'در حال بارگذاری...':'Loading...');
    let candidates=[];
    if(genericType==='director_list'){
      if(genericPage===1){
        const details=await Promise.all(DIRECTOR_SEED_IDS_V24.map(id=>safeData('person/'+id,4500)));
        candidates.push(...details.filter(Boolean).map(p=>Object.assign({},p,{known_for_department:'Directing'})));
      }
      const start=Math.max(1,(genericPage-1)*6+1);
      candidates.push(...await fetchPages('person/popular',start,6));
    } else {
      if(genericPage===1){
        const ids=genericType==='actor_female_list'?FEMALE_SEED_IDS_V24:MALE_SEED_IDS_V24;
        const details=await Promise.all(ids.map(id=>safeData('person/'+id,4200)));
        candidates.push(...details.filter(Boolean));
      }
      const start=Math.max(1,(genericPage-1)*6+1);
      candidates.push(...await fetchPages('person/popular',start,7));
    }
    const localSeen=new Set();
    const final=[];
    for(const raw of candidates){
      if(!raw || !raw.id || localSeen.has(raw.id) || window.genericPersonSeenIds.has(raw.id)) continue;
      localSeen.add(raw.id);
      const p=await detail(raw);
      if(await validFor(p,genericType)) final.push(p);
    }
    final.sort((a,b)=>score(b,genericType)-score(a,genericType));
    if(genericPage===1) container.innerHTML='';
    final.slice(0,60).forEach(p=>{ if(!window.genericPersonSeenIds.has(p.id)){ window.genericPersonSeenIds.add(p.id); container.innerHTML += makePersonCard(p); }});
    if(!container.querySelector('.actor-card,.person-card,.cast-card')) renderEmpty(LANG==='fa'?'فعلاً نتیجه‌ای پیدا نشد. دوباره نمایش بیشتر را بزن.':'No people found yet. Try Load More.');
    if(btn) btn.style.display='block';
  };
  window.searchGenericPeople=function(q){
    const clearBtn=document.getElementById('gg-person-search-clear');
    if(clearBtn) clearBtn.style.display=String(q||'').trim()?'block':'none';
    if(window.genericPersonSearchTimer) clearTimeout(window.genericPersonSearchTimer);
    window.genericPersonSearchTimer=setTimeout(async()=>{
      genericPersonSearchQuery=String(q||'').trim();
      genericPage=1;
      window.genericPersonSeenIds=new Set();
      const c=document.getElementById('gg-content'); if(c) c.innerHTML='';
      if(!genericPersonSearchQuery){ await window.loadGenericPeoplePage(false); return; }
      await window.loadGenericPersonSearch(genericPersonSearchQuery);
    },120);
  };
  window.clearGenericPersonSearch=function(){
    const input=document.getElementById('gg-person-search-input'); if(input) input.value='';
    const clearBtn=document.getElementById('gg-person-search-clear'); if(clearBtn) clearBtn.style.display='none';
    genericPersonSearchQuery=''; genericPage=1; window.genericPersonSeenIds=new Set();
    const c=document.getElementById('gg-content'); if(c) c.innerHTML='';
    window.loadGenericPeoplePage(false);
  };
  window.loadGenericPersonSearch=async function(q){
    cleanContainerForPeople();
    const container=document.getElementById('gg-content');
    const btn=document.getElementById('btn-more-g');
    if(btn) btn.style.display='none';
    if(!container) return;
    const raw=String(q||'').trim();
    const en=toEnglishQuery(raw);
    renderLoading(LANG==='fa'?'در حال جستجو...':'Searching...');
    const terms=[raw,en].filter(Boolean).filter((v,i,a)=>a.findIndex(x=>norm(x)===norm(v))===i);
    let all=[];
    for(const term of terms){
      for(let page=1;page<=5;page++){
        const d=await safeData('search/person?query='+encodeURIComponent(term)+'&include_adult=false&page='+page,6500);
        if(d&&d.results) all.push(...d.results);
        if(!d || page>=(d.total_pages||1)) break;
      }
    }
    // Add curated seeds as fallback and to make prefix search like "j", "ja", "sydney" instant/reliable.
    const seedIds = genericType==='director_list' ? DIRECTOR_SEED_IDS_V24 : (genericType==='actor_female_list' ? FEMALE_SEED_IDS_V24 : MALE_SEED_IDS_V24);
    const seedDetails = await Promise.all(seedIds.map(id=>safeData('person/'+id,2600)));
    all.push(...seedDetails.filter(Boolean));
    const seen=new Set();
    const final=[];
    for(const rawP of all){
      if(!rawP || !rawP.id || seen.has(rawP.id)) continue;
      seen.add(rawP.id);
      const p=await detail(rawP);
      if(!(await validFor(p,genericType))) continue;
      if(genericType==='director_list') p.known_for_department='Directing';
      const s=Math.max(nameScore(p.name,raw), nameScore(p.name,en));
      if(s>0) final.push(Object.assign({},p,{_matchScore:s}));
    }
    final.sort((a,b)=>(b._matchScore-a._matchScore) || (score(b,genericType)-score(a,genericType)));
    container.innerHTML='';
    if(!final.length){
      renderEmpty(LANG==='fa'?'شخصی با این نام در همین دسته‌بندی پیدا نشد.':'No matching person found in this category.');
      return;
    }
    final.slice(0,100).forEach(p=>container.innerHTML += makePersonCard(p));
  };
})();

