/* Family Night edge client. Load after the main application script. */
(() => {
  'use strict';
  const EDGE = window.FN_API_ORIGIN || 'https://family-night-api.alirezadoe8.workers.dev';
  const TTL = { list: 10 * 60e3, search: 5 * 60e3, detail: 24 * 3600e3 };
  const memory = new Map();
  const pending = new Map();
  let active = 0;
  const queue = [];
  const MAX_CONCURRENT = 5;
  const run = task => new Promise((resolve,reject) => { queue.push({task,resolve,reject}); pump(); });
  function pump() { while (active < MAX_CONCURRENT && queue.length) { const job=queue.shift(); active++; job.task().then(job.resolve,job.reject).finally(()=>{active--;pump();}); } }
  function language(forceEnglish) { return forceEnglish ? 'en-US' : (window.LANG === 'fa' ? 'fa-IR' : 'en-US'); }
  function key(path, lang) { return lang + ':' + path; }
  function policy(path) { return /^(movie|tv|person|collection)\/\d+(?:\?|$)/.test(path) ? TTL.detail : path.startsWith('search/') ? TTL.search : TTL.list; }
  function sessionRead(k) { try { const x=JSON.parse(sessionStorage.getItem('fn-edge:'+k)||'null'); return x && x.until>Date.now()?x:null; } catch (_) { return null; } }
  function sessionWrite(k,data,ttl) { try { sessionStorage.setItem('fn-edge:'+k,JSON.stringify({until:Date.now()+ttl,data})); } catch (_) {} }
  async function request(path, forceEnglish=false, signal) {
    const lang=language(forceEnglish), k=key(path,lang), cached=memory.get(k)||sessionRead(k);
    if(cached) { memory.set(k,cached); return cached.data; }
    if(pending.has(k)) return pending.get(k);
    const p=run(async()=>{
      const u=new URL(EDGE+'/v1/tmdb/'+path.replace(/^\//,''));
      u.searchParams.set('language',lang);
      const r=await fetch(u,{signal,headers:{Accept:'application/json'}});
      if(!r.ok) throw new Error('Edge API '+r.status);
      const data=await r.json(), entry={data,until:Date.now()+policy(path)};
      memory.set(k,entry); sessionWrite(k,data,policy(path)); return data;
    }).finally(()=>pending.delete(k));
    pending.set(k,p); return p;
  }
  async function get(path, english=false, signal) {
    try { return await request(path,english,signal); }
    catch (err) {
      const cached=memory.get(key(path,language(english)))||sessionRead(key(path,language(english)));
      if(cached) return cached.data;
      return {results:[]};
    }
  }
  // Compatible replacement: existing calls retain getData('discover/movie?...').
  window.getData = path => get(path, false);
  window.getDataEN = path => get(path, true);
  window.fnSearchController = null;
  window.fnSearchData = path => { if(window.fnSearchController) window.fnSearchController.abort(); window.fnSearchController=new AbortController(); return get(path,false,window.fnSearchController.signal); };
  window.FN_IMG = size => EDGE+'/img/'+size;

  // Home rows are independent: show all skeletons immediately, fetch the first four now,
  // and start the rest only shortly before the user can see them.
  let eagerRows = 0;
  const rowObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) return; rowObserver.unobserve(entry.target); entry.target.__fnStart && entry.target.__fnStart(); });
  }, { rootMargin: '900px 0px' }) : null;
  window.fnLoadHomeRow = (section, id) => {
    const el = document.getElementById(id); if (!el || el.dataset.fnQueued) return;
    el.dataset.fnQueued = '1';
    const start = () => {
      if (el.dataset.fnLoaded) return; el.dataset.fnLoaded='1';
      if (section.trending) window.loadTrendingRow(section.q,id);
      else if (section.adult) window.loadAdultRow(id);
      else window.loadRow(section.q,id,section.type);
    };
    el.closest('.section').__fnStart = start;
    if (eagerRows++ < 4 || !rowObserver) start(); else rowObserver.observe(el.closest('.section'));
  };
})();
