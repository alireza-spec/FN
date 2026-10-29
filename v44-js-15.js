
/* ===== v40.10.10 Settings accordion/readability patch ===== */
(function(){
  var FN_APP_VERSION = 'v40.10.10';
  function faMode(){ try { return (typeof LANG !== 'undefined' ? LANG : localStorage.getItem('lang')) === 'fa'; } catch(e){ return false; } }
  function esc(s){ return String(s || '').replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); }); }
  function aboutHTML(){
    var fa = faMode();
    if (fa) {
      return ''+
        '<div class="fn-about-card" dir="rtl">'+
          '<div class="fn-about-version">🚀 Family Night '+FN_APP_VERSION+'</div>'+
          '<div class="fn-about-title" id="txt-desc-t">درباره ما و اپ</div>'+
          '<p class="fn-about-text" id="txt-desc-b">Family Night یک اپ سینمایی کامل برای جستجو، کشف و مدیریت فیلم‌ها، سریال‌ها، انیمیشن‌ها و آثار محبوب است؛ با تمرکز روی تجربه سریع، زیبا، خانوادگی و قابل شخصی‌سازی.</p>'+
          '<div class="fn-about-list">'+
            '<div><strong>قابلیت‌ها:</strong> صفحه خانه هوشمند، پیشنهاد فیلم، دسته‌بندی‌ها، جستجوی پیشرفته، فیلتر کشور/ژانر/سال، لیست علاقه‌مندی، تاریخچه تماشا، امتیازدهی شخصی، آمار سینمایی، آزمون‌ها، پروفایل، تم‌های متنوع و دستیار AI برای تحلیل هر اثر.</div>'+
            '<div><strong>اطلاعات آثار:</strong> جزئیات اثر، بازیگران و عوامل، آثار مشابه، کشور تولید، ژانرها، پوسترها، تصاویر، تریلر، موسیقی متن، نظرات کاربران، کالکشن‌ها و داده‌های تکمیلی در یک صفحه منظم نمایش داده می‌شود.</div>'+
            '<div><strong>ظاهر و پوسته‌ها:</strong> تم‌ها برای حالت روشن و تیره طراحی شده‌اند و رنگ نوشته‌ها، کادرها، آیکن‌ها و پس‌زمینه‌ها با پوسته انتخاب‌شده هماهنگ می‌شوند.</div>'+
            '<div><strong>سازنده:</strong> توسعه و طراحی توسط علیرضا احمدی انجام شده است.</div>'+
            '<div><strong>حقوق و استفاده:</strong> تمام حقوق طراحی، ساختار، ایده‌ها و تغییرات اختصاصی این اپ متعلق به سازنده است. کپی‌برداری، انتشار، فروش، تغییر نام یا استفاده تجاری بدون اجازه سازنده مجاز نیست.</div>'+
            '<div><strong>نکته:</strong> برخی داده‌ها، تصاویر و اطلاعات آثار از سرویس‌های عمومی سینمایی دریافت می‌شوند و حقوق محتوای هر اثر متعلق به صاحبان اصلی آن است.</div>'+
          '</div>'+
          '<p class="fn-about-text" id="txt-copy" style="margin-top:12px;">© 2025 Game of Family / Family Night. All rights reserved.</p>'+
          '<p class="fn-about-text" id="txt-dev">Developer: <strong>Alireza Ahmadi</strong></p>'+
        '</div>';
    }
    return ''+
      '<div class="fn-about-card" dir="ltr">'+
        '<div class="fn-about-version">🚀 Family Night '+FN_APP_VERSION+'</div>'+
        '<div class="fn-about-title" id="txt-desc-t">About us & app</div>'+
        '<p class="fn-about-text" id="txt-desc-b">Family Night is a complete cinema companion for discovering, searching and organizing movies, series, animation and favorite titles, focused on a fast, beautiful, family-friendly and customizable experience.</p>'+
        '<div class="fn-about-list">'+
          '<div><strong>Features:</strong> smart home page, random movie picker, categories, advanced search, country/genre/year filters, watchlist, watch history, personal ratings, cinema stats, quizzes, user profile, multiple themes and an AI assistant for each title.</div>'+
          '<div><strong>Title pages:</strong> details, cast and crew, similar titles, production countries, genres, posters, backdrops, trailers, soundtracks, user reviews, collections and extra metadata are shown in one clean page.</div>'+
          '<div><strong>Appearance:</strong> every theme is designed for light or dark usage, with readable text, matching cards, icons, buttons and backgrounds.</div>'+
          '<div><strong>Creator:</strong> designed and developed by Alireza Ahmadi.</div>'+
          '<div><strong>Copyright and usage:</strong> the app design, structure, custom ideas and implementation belong to the creator. Copying, republishing, selling, renaming or commercial use without permission is not allowed.</div>'+
          '<div><strong>Note:</strong> some movie data, images and title information are loaded from public cinema services; each title and media asset belongs to its original rights holder.</div>'+
        '</div>'+
        '<p class="fn-about-text" id="txt-copy" style="margin-top:12px;">© 2025 Game of Family / Family Night. All rights reserved.</p>'+
        '<p class="fn-about-text" id="txt-dev">Developer: <strong>Alireza Ahmadi</strong></p>'+
      '</div>';
  }
  function panelTitle(kind){
    var fa = faMode();
    var map = { theme: fa ? 'ظاهر، زبان و پوسته‌ها' : 'Appearance, language & themes', personal: fa ? 'آمار سینمایی من' : 'My cinema stats', archive: fa ? 'آمار آرشیو' : 'Archive stats', about: fa ? 'درباره ما و اپ' : 'About us & app' };
    return map[kind] || kind;
  }
  function icon(kind){ return ({theme:'fa-palette', personal:'fa-chart-simple', archive:'fa-database', about:'fa-circle-info'}[kind] || 'fa-sliders'); }
  function makeToggle(section, kind){
    var id = section.id || ('fn-settings-panel-' + kind); section.id = id;
    if (document.querySelector('.fn-settings-toggle[data-target="'+id+'"]')) return;
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fn-settings-toggle'; btn.setAttribute('data-target', id); btn.setAttribute('data-kind', kind);
    btn.innerHTML = '<span class="fn-toggle-left"><span class="fn-toggle-icon"><i class="fa-solid '+icon(kind)+'"></i></span><span class="fn-toggle-title">'+esc(panelTitle(kind))+'</span></span><i class="fa-solid fa-chevron-down fn-toggle-chev"></i>';
    section.parentNode.insertBefore(btn, section); section.classList.add('fn-acc-panel'); section.classList.remove('open');
    btn.addEventListener('click', function(){ var open = section.classList.toggle('open'); btn.classList.toggle('open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); try { localStorage.setItem('fn_settings_'+kind+'_open', open ? '1' : '0'); } catch(e){} });
    var saved = null; try { saved = localStorage.getItem('fn_settings_'+kind+'_open'); } catch(e){}
    var shouldOpen = saved === '1'; if (saved === null && kind === 'theme') shouldOpen = true;
    if (shouldOpen) { section.classList.add('open'); btn.classList.add('open'); btn.setAttribute('aria-expanded','true'); } else { btn.setAttribute('aria-expanded','false'); }
  }
  function enhanceSettings(){
    try {
      var theme = document.getElementById('txt-theme-head')?.closest('.setting-section');
      var personal = document.getElementById('personal-stats-settings-section');
      var archive = document.getElementById('stats-section');
      var about = document.getElementById('txt-about-head')?.closest('.setting-section');
      if (theme) makeToggle(theme, 'theme'); if (personal) makeToggle(personal, 'personal'); if (archive) makeToggle(archive, 'archive'); if (about) makeToggle(about, 'about');
      var dev = about ? about.querySelector('.dev-info') : null; if (dev) { dev.setAttribute('data-v40101-about','1'); dev.innerHTML = aboutHTML(); }
      var langWide = theme ? theme.querySelector('button[onclick="toggleLang()"]') : null; if (langWide) langWide.classList.add('fn-lang-wide');
      document.querySelectorAll('#settings-tab .fn-settings-toggle').forEach(function(btn){ var kind = btn.getAttribute('data-kind'); var title = btn.querySelector('.fn-toggle-title'); if (title) title.textContent = panelTitle(kind); });
      var titleEl = document.getElementById('txt-set-head-header'); if (titleEl) titleEl.textContent = faMode() ? 'تنظیمات' : 'Settings';
      var titleMain = document.getElementById('txt-set-head'); if (titleMain) titleMain.textContent = faMode() ? 'تنظیمات' : 'Settings';
      var archiveHeader = archive ? archive.querySelector('.setting-header') : null; if (archiveHeader) archiveHeader.textContent = faMode() ? '📊 آمار آرشیو' : '📊 Archive Stats';
      try { window.FAMILY_NIGHT_VERSION = FN_APP_VERSION; } catch(e){}
    } catch(e) { console.warn('settings enhance failed', e); }
  }
  var oldApplyLang = (typeof applyLang === 'function') ? applyLang : null;
  if (oldApplyLang && !oldApplyLang.__settings40101Wrapped) { applyLang = function(){ var r = oldApplyLang.apply(this, arguments); setTimeout(enhanceSettings, 0); setTimeout(enhanceSettings, 250); return r; }; applyLang.__settings40101Wrapped = true; }
  var oldLoadArchiveStats = (typeof loadArchiveStats === 'function') ? loadArchiveStats : null;
  if (oldLoadArchiveStats && !oldLoadArchiveStats.__settings40101Wrapped) { loadArchiveStats = async function(){ var r = await oldLoadArchiveStats.apply(this, arguments); setTimeout(enhanceSettings, 0); return r; }; loadArchiveStats.__settings40101Wrapped = true; }
  document.addEventListener('DOMContentLoaded', function(){ enhanceSettings(); setTimeout(enhanceSettings, 400); setTimeout(enhanceSettings, 1400); });
  window.addEventListener('load', function(){ enhanceSettings(); setTimeout(enhanceSettings, 800); });
})();


;

/* ===== v40.10.10 Settings theme labels + flag language picker ===== */
(function(){
  var FN_APP_VERSION_40102 = 'v40.10.10';
  var UK_FLAG_URL = 'https://flagcdn.com/gb.svg';
  var IRAN_FLAG_URL_40102 = 'https://flagofiran.com/files/Flag_of_Iran.svg';
  function faMode(){
    try { return (typeof LANG !== 'undefined' ? LANG : localStorage.getItem('lang')) === 'fa'; }
    catch(e){ return false; }
  }
  function esc(s){ return String(s || '').replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  var THEME_LABELS_40102 = {
    netflix:{en:['Netflix Classic','Red · Dark · Bold'],fa:['کلاسیک نتفلیکس','قرمز · تیره · جسور']},
    ocean:{en:['Midnight Ocean','Blue · Deep · Elegant'],fa:['اقیانوس نیمه‌شب','آبی · عمیق · شیک']},
    forest:{en:['Forest Night','Green · Natural · Calm'],fa:['جنگل شب','سبز · طبیعی · آرام']},
    violet:{en:['Royal Violet','Purple · Luxe · Magic'],fa:['بنفش سلطنتی','بنفش · لوکس · جادویی']},
    gold:{en:['Golden Hour','Gold · Warm · Premium'],fa:['ساعت طلایی','طلایی · گرم · پریمیوم']},
    rose:{en:['Sunset Rose','Pink · Vibrant · Trendy'],fa:['غروب رز','صورتی · زنده · مدرن']},
    cyber:{en:['Cyberpunk','Neon · Futuristic · Edge'],fa:['سایبرپانک','نئون · آینده‌نگر · تیز']},
    ember:{en:['Ember Fire','Orange · Intense · Warm'],fa:['آتش امبر','نارنجی · گرم · پرانرژی']},
    dayMood:{en:['Day Mood','White · Gray · Black'],fa:['حال و هوای روز','سفید · خاکستری · مشکی']},
    telegramDay:{en:['Telegram Day','White · Sky Blue · Clean'],fa:['روز تلگرامی','سفید · آبی آسمانی · تمیز']},
    softDarkGray:{en:['Soft Dark Gray','Dark · Gray · Soft'],fa:['خاکستری دارک ملایم','تیره · خاکستری · نرم']},
    grayBlue:{en:['Gray Blue','Gray · Blue · Balanced'],fa:['خاکستری آبی','خاکستری · آبی · متعادل']}
  };
  function setCardLabel(id, title, sub){
    var card = document.getElementById('theme-card-' + id);
    if (!card) return;
    var children = card.children;
    if (children[2]) { children[2].textContent = title; children[2].setAttribute('dir','auto'); }
    if (children[3]) { children[3].textContent = sub; children[3].setAttribute('dir','auto'); }
  }
  function localizeThemeCards(){
    var lang = faMode() ? 'fa' : 'en';
    Object.keys(THEME_LABELS_40102).forEach(function(id){
      var arr = THEME_LABELS_40102[id][lang];
      setCardLabel(id, arr[0], arr[1]);
    });
  }
  function renderHeaderLanguageFlags(){
    var fa = faMode();
    var nextSrc = fa ? UK_FLAG_URL : IRAN_FLAG_URL_40102;
    var nextLabel = fa ? 'Switch to English' : 'تغییر زبان به فارسی';
    var fallback = fa ? 'EN' : 'FA';
    var htmlFlag = '<img class="fn-lang-flag" src="'+esc(nextSrc)+'" alt="'+esc(nextLabel)+'" onerror="var p=this.parentElement;if(p)p.textContent=\''+fallback+'\'">';
    var main = document.getElementById('lang-toggle-icon');
    if (main && main.innerHTML !== htmlFlag) { main.innerHTML = htmlFlag; main.setAttribute('title', nextLabel); }
    document.querySelectorAll('.fn-lang-mini-text').forEach(function(el){
      if (el.innerHTML !== htmlFlag) { el.innerHTML = htmlFlag; el.setAttribute('title', nextLabel); }
    });
    var mainBtn = document.getElementById('lang-toggle-btn');
    if (mainBtn) mainBtn.setAttribute('title', nextLabel);
    document.querySelectorAll('.fn-lang-mini').forEach(function(btn){ btn.setAttribute('title', nextLabel); });
  }
  function setAppLang40102(lang){
    try {
      if (typeof LANG !== 'undefined') LANG = lang;
      localStorage.setItem('lang', lang);
    } catch(e) {}
    location.reload();
  }
  window.setAppLang40102 = setAppLang40102;
  function languagePickerHTML(){
    var fa = faMode();
    var enActive = !fa, faActive = fa;
    return ''+
      '<div id="fn-settings-language-picker" class="fn-language-picker">'+
        '<button type="button" class="fn-language-toggle" aria-expanded="false">'+
          '<span class="left"><span class="badge"><i class="fa-solid fa-language"></i></span><span class="title">'+(fa?'زبان':'Language')+'</span></span>'+
          '<i class="fa-solid fa-chevron-down chev"></i>'+
        '</button>'+
        '<div class="fn-language-options">'+
          '<button type="button" class="fn-language-option '+(enActive?'active':'')+'" style="--flag-bg:url('+UK_FLAG_URL+')" onclick="setAppLang40102(\'en\')" dir="ltr">'+
            '<img src="'+UK_FLAG_URL+'" alt="United Kingdom flag"><span>English</span><small>United Kingdom</small>'+ 
          '</button>'+ 
          '<button type="button" class="fn-language-option '+(faActive?'active':'')+'" style="--flag-bg:url('+IRAN_FLAG_URL_40102+')" onclick="setAppLang40102(\'fa\')" dir="rtl">'+
            '<img src="'+IRAN_FLAG_URL_40102+'" alt="پرچم ایران"><span>فارسی</span><small>ایران</small>'+ 
          '</button>'+ 
        '</div>'+ 
      '</div>';
  }
  function installSettingsLanguagePicker(){
    var themeSection = document.getElementById('txt-theme-head');
    themeSection = themeSection ? themeSection.closest('.setting-section') : null;
    if (!themeSection) return;
    var oldBtn = themeSection.querySelector('button[onclick="toggleLang()"]');
    if (oldBtn) {
      oldBtn.classList.add('fn-lang-wide-legacy');
      if (oldBtn.parentElement) oldBtn.parentElement.classList.add('fn-lang-wide-legacy');
    }
    var holder = document.getElementById('fn-settings-language-picker');
    if (!holder) {
      var div = document.createElement('div');
      div.innerHTML = languagePickerHTML();
      var node = div.firstElementChild;
      var grid = themeSection.querySelector('[style*="grid-template-columns"]');
      var legacyWrap = oldBtn ? oldBtn.parentElement : null;
      if (legacyWrap && legacyWrap.parentNode) legacyWrap.parentNode.insertBefore(node, legacyWrap.nextSibling);
      else if (grid && grid.parentNode) grid.parentNode.insertBefore(node, grid.nextSibling);
      else themeSection.appendChild(node);
      holder = node;
    } else {
      var optionsOld = holder.querySelector('.fn-language-options');
      var isOpen = optionsOld && optionsOld.classList.contains('open');
      holder.outerHTML = languagePickerHTML();
      holder = document.getElementById('fn-settings-language-picker');
      if (isOpen && holder) {
        var t = holder.querySelector('.fn-language-toggle');
        var o = holder.querySelector('.fn-language-options');
        if (t) { t.classList.add('open'); t.setAttribute('aria-expanded','true'); }
        if (o) o.classList.add('open');
      }
    }
    if (holder && !holder.__fnLangPickerBound) {
      holder.__fnLangPickerBound = true;
      holder.addEventListener('click', function(e){
        var toggle = e.target.closest('.fn-language-toggle');
        if (!toggle) return;
        var options = holder.querySelector('.fn-language-options');
        var open = !options.classList.contains('open');
        options.classList.toggle('open', open);
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }
  function updateVersion40102(){
    try {
      window.FAMILY_NIGHT_VERSION = FN_APP_VERSION_40102;
      document.querySelectorAll('.fn-about-version').forEach(function(el){
        el.textContent = '🚀 Family Night ' + FN_APP_VERSION_40102;
      });
    } catch(e) {}
  }
  function applyAll40102(){
    localizeThemeCards();
    renderHeaderLanguageFlags();
    installSettingsLanguagePicker();
    updateVersion40102();
  }
  var oldSync = (typeof syncGlobalHeaderControls === 'function') ? syncGlobalHeaderControls : null;
  if (oldSync && !oldSync.__flags40102Wrapped) {
    syncGlobalHeaderControls = function(){
      var r = oldSync.apply(this, arguments);
      renderHeaderLanguageFlags();
      return r;
    };
    syncGlobalHeaderControls.__flags40102Wrapped = true;
  }
  var oldApplyLang40102 = (typeof applyLang === 'function') ? applyLang : null;
  if (oldApplyLang40102 && !oldApplyLang40102.__settings40102Wrapped) {
    applyLang = function(){
      var r = oldApplyLang40102.apply(this, arguments);
      setTimeout(applyAll40102, 0);
      setTimeout(applyAll40102, 250);
      return r;
    };
    applyLang.__settings40102Wrapped = true;
  }
  document.addEventListener('DOMContentLoaded', function(){
    applyAll40102();
    [80,300,700,1500,2600].forEach(function(t){ setTimeout(applyAll40102, t); });
    try {
      var settings = document.getElementById('settings-tab');
      if (settings && window.MutationObserver) {
        var pending = false;
        new MutationObserver(function(){
          if (pending) return;
          pending = true;
          setTimeout(function(){ pending = false; applyAll40102(); }, 80);
        }).observe(settings, {childList:true, subtree:true, characterData:true});
      }
    } catch(e) {}
  });
  window.addEventListener('load', function(){ applyAll40102(); setTimeout(applyAll40102, 1200); });
})();


;

/* ===== v40.10.10 safe sidebar + settings refinements ===== */
(function(){
  var FN_APP_VERSION_40104 = 'v40.10.10';
  var IR_FLAG_URL = 'https://flagofiran.com/files/Flag_of_Iran.svg';
  function faMode(){ try { return (typeof LANG !== 'undefined' ? LANG : localStorage.getItem('lang')) === 'fa'; } catch(e){ return false; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function escJs(s){ return String(s == null ? '' : s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,' '); }
  function flagUrl(code, size){
    size = size || 'w40';
    if (String(code).toUpperCase() === 'IR') return IR_FLAG_URL;
    return 'https://flagcdn.com/' + size + '/' + String(code).toLowerCase() + '.png';
  }
  var countriesData = [
    {code:'US', fa:'آمریکا', en:'United States'},
    {code:'GB', fa:'انگلیس', en:'United Kingdom'},
    {code:'IR', fa:'ایران', en:'Iran'},
    {code:'AF', fa:'افغانستان', en:'Afghanistan'}, {code:'DE', fa:'آلمان', en:'Germany'}, {code:'AR', fa:'آرژانتین', en:'Argentina'},
    {code:'ZA', fa:'آفریقای جنوبی', en:'South Africa'}, {code:'AL', fa:'آلبانی', en:'Albania'}, {code:'DZ', fa:'الجزایر', en:'Algeria'},
    {code:'AE', fa:'امارات', en:'UAE'}, {code:'ID', fa:'اندونزی', en:'Indonesia'}, {code:'UA', fa:'اوکراین', en:'Ukraine'},
    {code:'IT', fa:'ایتالیا', en:'Italy'}, {code:'IE', fa:'ایرلند', en:'Ireland'}, {code:'AZ', fa:'آذربایجان', en:'Azerbaijan'},
    {code:'ES', fa:'اسپانیا', en:'Spain'}, {code:'AU', fa:'استرالیا', en:'Australia'}, {code:'AT', fa:'اتریش', en:'Austria'},
    {code:'IL', fa:'اسرائیل', en:'Israel'}, {code:'EE', fa:'استونی', en:'Estonia'}, {code:'AM', fa:'ارمنستان', en:'Armenia'},
    {code:'JO', fa:'اردن', en:'Jordan'}, {code:'UY', fa:'اروگوئه', en:'Uruguay'}, {code:'UZ', fa:'ازبکستان', en:'Uzbekistan'},
    {code:'SK', fa:'اسلواکی', en:'Slovakia'}, {code:'SI', fa:'اسلوونی', en:'Slovenia'}, {code:'EC', fa:'اکوادور', en:'Ecuador'},
    {code:'BG', fa:'بلغارستان', en:'Bulgaria'}, {code:'BE', fa:'بلژیک', en:'Belgium'}, {code:'BD', fa:'بنگلادش', en:'Bangladesh'},
    {code:'BR', fa:'برزیل', en:'Brazil'}, {code:'PK', fa:'پاکستان', en:'Pakistan'}, {code:'PY', fa:'پاراگوئه', en:'Paraguay'},
    {code:'PT', fa:'پرتغال', en:'Portugal'}, {code:'PE', fa:'پرو', en:'Peru'}, {code:'PL', fa:'لهستان', en:'Poland'},
    {code:'TH', fa:'تایلند', en:'Thailand'}, {code:'TW', fa:'تایوان', en:'Taiwan'}, {code:'TR', fa:'ترکیه', en:'Turkey'},
    {code:'TN', fa:'تونس', en:'Tunisia'}, {code:'JP', fa:'ژاپن', en:'Japan'}, {code:'JM', fa:'جامائیکا', en:'Jamaica'},
    {code:'CZ', fa:'جمهوری چک', en:'Czech Republic'}, {code:'CN', fa:'چین', en:'China'}, {code:'DK', fa:'دانمارک', en:'Denmark'},
    {code:'RU', fa:'روسیه', en:'Russia'}, {code:'RO', fa:'رومانی', en:'Romania'}, {code:'NZ', fa:'نیوزلند', en:'New Zealand'},
    {code:'SA', fa:'عربستان', en:'Saudi Arabia'}, {code:'IQ', fa:'عراق', en:'Iraq'}, {code:'OM', fa:'عمان', en:'Oman'},
    {code:'FR', fa:'فرانسه', en:'France'}, {code:'FI', fa:'فنلاند', en:'Finland'}, {code:'PH', fa:'فیلیپین', en:'Philippines'},
    {code:'QA', fa:'قطر', en:'Qatar'}, {code:'KZ', fa:'قزاقستان', en:'Kazakhstan'}, {code:'KG', fa:'قرقیزستان', en:'Kyrgyzstan'},
    {code:'CA', fa:'کانادا', en:'Canada'}, {code:'KR', fa:'کره جنوبی', en:'South Korea'}, {code:'CO', fa:'کلمبیا', en:'Colombia'},
    {code:'KW', fa:'کویت', en:'Kuwait'}, {code:'KE', fa:'کنیا', en:'Kenya'}, {code:'GE', fa:'گرجستان', en:'Georgia'},
    {code:'GH', fa:'غنا', en:'Ghana'}, {code:'LB', fa:'لبنان', en:'Lebanon'}, {code:'LV', fa:'لتونی', en:'Latvia'},
    {code:'LT', fa:'لیتوانی', en:'Lithuania'}, {code:'HU', fa:'مجارستان', en:'Hungary'}, {code:'MA', fa:'مراکش', en:'Morocco'},
    {code:'EG', fa:'مصر', en:'Egypt'}, {code:'MX', fa:'مکزیک', en:'Mexico'}, {code:'MY', fa:'مالزی', en:'Malaysia'},
    {code:'NG', fa:'نیجریه', en:'Nigeria'}, {code:'NO', fa:'نروژ', en:'Norway'}, {code:'NP', fa:'نپال', en:'Nepal'},
    {code:'NL', fa:'هلند', en:'Netherlands'}, {code:'IN', fa:'هند', en:'India'}, {code:'HK', fa:'هنگ کنگ', en:'Hong Kong'},
    {code:'VN', fa:'ویتنام', en:'Vietnam'}, {code:'GR', fa:'یونان', en:'Greece'}, {code:'CL', fa:'شیلی', en:'Chile'},
    {code:'SE', fa:'سوئد', en:'Sweden'}, {code:'CH', fa:'سوئیس', en:'Switzerland'}, {code:'SG', fa:'سنگاپور', en:'Singapore'},
    {code:'LK', fa:'سریلانکا', en:'Sri Lanka'}, {code:'HR', fa:'کرواسی', en:'Croatia'}, {code:'RS', fa:'صربستان', en:'Serbia'},
    {code:'TZ', fa:'تانزانیا', en:'Tanzania'}, {code:'ET', fa:'اتیوپی', en:'Ethiopia'}
  ];
  function orderedCountries(){
    var fa = faMode();
    var first = fa ? ['US','GB','IR'] : ['US','GB','IR'];
    var firstSet = {};
    first.forEach(function(c){ firstSet[c] = true; });
    var head = first.map(function(code){ return countriesData.find(function(c){ return c.code === code; }); }).filter(Boolean);
    var rest = countriesData.filter(function(c){ return !firstSet[c.code]; });
    rest.sort(function(a,b){ return (fa ? a.fa.localeCompare(b.fa, 'fa') : a.en.localeCompare(b.en, 'en')); });
    return head.concat(rest);
  }
  function renderCountriesSidebar(){
    var list = document.getElementById('sb-countries-list');
    if (!list) return;
    list.innerHTML = orderedCountries().map(function(c){
      var name = faMode() ? c.fa : c.en;
      var fu = flagUrl(c.code, 'w80');
      return '<div class="sb-sub-item fn-country-item" style="--flag-bg:url('+esc(fu)+')" onclick="openRandomCountryGrid(\''+escJs(c.code)+'\', \''+escJs(name)+'\'); toggleMenu()">'
        + '<img src="'+esc(fu)+'" loading="lazy" onerror="this.style.display=\'none\'">'
        + '<span>'+esc(name)+'</span>'
        + '</div>';
    }).join('');
  }
  var themes = [
    {id:'netflix', en:'Netflix Classic', fa:'کلاسیک نتفلیکس', subEn:'Red · Dark · Bold', subFa:'قرمز · تیره · جسور', bg:'linear-gradient(135deg,#210000,#520006)', c:['#E50914','#ff4d57','#ffb3b8']},
    {id:'ocean', en:'Midnight Ocean', fa:'اقیانوس نیمه‌شب', subEn:'Blue · Deep · Elegant', subFa:'آبی · عمیق · شیک', bg:'linear-gradient(135deg,#00111f,#004b83)', c:['#0099ff','#38bdf8','#8eeaff']},
    {id:'forest', en:'Forest Night', fa:'جنگل شب', subEn:'Green · Natural · Calm', subFa:'سبز · طبیعی · آرام', bg:'linear-gradient(135deg,#001a0d,#006b33)', c:['#00cc55','#4ade80','#a7f3d0']},
    {id:'violet', en:'Royal Violet', fa:'بنفش سلطنتی', subEn:'Purple · Luxe · Magic', subFa:'بنفش · لوکس · جادویی', bg:'linear-gradient(135deg,#140022,#5b16a3)', c:['#aa44ff','#c084fc','#e9d5ff']},
    {id:'gold', en:'Golden Hour', fa:'ساعت طلایی', subEn:'Gold · Warm · Premium', subFa:'طلایی · گرم · پریمیوم', bg:'linear-gradient(135deg,#2b1a00,#8a5a00)', c:['#ffcc00','#f59e0b','#fff1a8']},
    {id:'rose', en:'Sunset Rose', fa:'غروب رز', subEn:'Pink · Vibrant · Trendy', subFa:'صورتی · زنده · مدرن', bg:'linear-gradient(135deg,#230012,#99104e)', c:['#ff4499','#fb7185','#ffc1dd']},
    {id:'cyber', en:'Cyberpunk', fa:'سایبرپانک', subEn:'Neon · Futuristic', subFa:'نئون · آینده‌نگر', bg:'linear-gradient(135deg,#002222,#008579)', c:['#00ffcc','#22d3ee','#99f6e4']},
    {id:'ember', en:'Ember Fire', fa:'آتش امبر', subEn:'Orange · Warm', subFa:'نارنجی · گرم', bg:'linear-gradient(135deg,#2a0b00,#9a3100)', c:['#ff6600','#fb923c','#fde047']},
    {id:'dayMood', en:'Day Mood', fa:'حال و هوای روز', subEn:'White · Gray · Black', subFa:'سفید · خاکستری · مشکی', bg:'linear-gradient(135deg,#f8fafc,#cbd5e1)', c:['#ffffff','#e5e7eb','#111827']},
    {id:'telegramDay', en:'Telegram Day', fa:'روز تلگرامی', subEn:'White · Sky Blue', subFa:'سفید · آبی آسمانی', bg:'linear-gradient(135deg,#f5fbff,#bfe8ff)', c:['#ffffff','#d9efff','#229ED9']},
    {id:'softDarkGray', en:'Soft Dark Gray', fa:'خاکستری دارک ملایم', subEn:'Dark · Gray · Soft', subFa:'تیره · خاکستری · نرم', bg:'linear-gradient(135deg,#15171a,#4b5563)', c:['#2a2e34','#6b7280','#d1d5db']},
    {id:'grayBlue', en:'Gray Blue', fa:'خاکستری آبی', subEn:'Gray · Blue · Balanced', subFa:'خاکستری · آبی · متعادل', bg:'linear-gradient(135deg,#1c2430,#3b82f6)', c:['#304052','#64748b','#60a5fa']}
  ];
  function renderThemesSidebar(){
    var list = document.getElementById('sb-themes-list');
    if (!list) return;
    var fa = faMode();
    list.innerHTML = themes.map(function(t){
      return '<div class="sb-sub-item fn-sidebar-theme-item" id="sb-theme-card-'+esc(t.id)+'" style="--theme-bg:'+esc(t.bg)+';--theme-c1:'+esc(t.c[0])+'" onclick="applyCreativeTheme(\''+escJs(t.id)+'\')">'
        + '<div><div class="fn-sidebar-theme-name">'+esc(fa ? t.fa : t.en)+'</div><div class="fn-sidebar-theme-sub">'+esc(fa ? t.subFa : t.subEn)+'</div></div>'
        + '<div class="fn-sidebar-swatches">'+t.c.map(function(x){ return '<span class="fn-sidebar-swatch" style="--c:'+esc(x)+'"></span>'; }).join('')+'</div>'
        + '</div>';
    }).join('');
    if (typeof updateActiveThemeMarkers === 'function') updateActiveThemeMarkers();
  }
  function renderAboutSidebar(){
    var list = document.getElementById('sb-developer-footer');
    if (!list) return;
    var fa = faMode();
    list.innerHTML = '<div class="fn-sidebar-about-box" '+(fa?'dir="rtl"':'dir="ltr"')+'>'
      + '<div class="fn-sidebar-about-title">'+(fa?'ساخته‌شده توسط علیرضا احمدی':'Powered by Alireza Ahmadi')+'</div>'
      + '<div class="fn-sidebar-social-grid">'
      + '<a class="fn-sidebar-social-btn fn-social-tg" href="https://t.me/HashtagAlireza" target="_blank" rel="noopener"><i class="fa-brands fa-telegram"></i>Telegram</a>'
      + '<a class="fn-sidebar-social-btn fn-social-in" href="https://instagram.com/HashtagAlireza" target="_blank" rel="noopener"><i class="fa-brands fa-instagram"></i>Instagram</a>'
      + '<a class="fn-sidebar-social-btn fn-social-yt" href="https://youtube.com/@HashtagAlireza" target="_blank" rel="noopener"><i class="fa-brands fa-youtube"></i>YouTube</a>'
      + '<a class="fn-sidebar-social-btn fn-social-x" href="https://twitter.com/HashtagAlireza" target="_blank" rel="noopener"><i class="fa-brands fa-x-twitter"></i>X</a>'
      + '</div></div>';
  }
  window.toggleSidebarPanel40104 = function(id){
    var l = document.getElementById(id);
    if (!l) return;
    l.style.display = (l.style.display === 'block') ? 'none' : 'block';
  };
  function ensureSidebarExtras(){
    var sb = document.getElementById('sidebar');
    var countriesList = document.getElementById('sb-countries-list');
    if (!sb || !countriesList) return;
    var topMovie = document.getElementById('sb-top250movies');
    var topSeries = document.getElementById('sb-top250series');
    [topMovie, topSeries].forEach(function(el){
      if (!el) return;
      var parent = el.parentElement;
      if (parent && !parent.querySelector('.fn-imdb-mini')) parent.insertAdjacentHTML('beforeend', '<span class="fn-imdb-mini">IMDb</span>');
    });
    document.querySelectorAll('.fn-sb-themes-title').forEach(function(x){ x.remove(); });
    document.querySelectorAll('.fn-sb-about-title').forEach(function(x){ x.remove(); });
    var sbTitle = sb.querySelector('.sb-title');
    if (sbTitle) sbTitle.textContent = faMode() ? 'منو' : 'Menu';
    renderCountriesSidebar();
    renderThemesSidebar();
    renderAboutSidebar();
  }
  function ensureSettingsLanguageFirst(){
    var settings = document.getElementById('settings-tab');
    if (!settings) return;
    var picker = document.getElementById('fn-settings-language-picker');
    if (!picker) return;
    var themeSection = document.getElementById('txt-theme-head');
    themeSection = themeSection ? themeSection.closest('.setting-section') : null;
    var firstToggle = settings.querySelector('.fn-settings-toggle');
    var langToggle = document.getElementById('fn-settings-language-main-toggle');
    var langPanel = document.getElementById('fn-settings-language-panel');
    if (!langToggle) {
      langToggle = document.createElement('button');
      langToggle.type = 'button';
      langToggle.id = 'fn-settings-language-main-toggle';
      langToggle.className = 'fn-settings-toggle';
      langToggle.innerHTML = '<span class="fn-toggle-left"><span class="fn-toggle-icon"><i class="fa-solid fa-language"></i></span><span class="fn-toggle-title"></span></span><i class="fa-solid fa-chevron-down fn-toggle-chev"></i>';
      langToggle.addEventListener('click', function(){
        var p = document.getElementById('fn-settings-language-panel');
        if (!p) return;
        var open = p.classList.toggle('open');
        langToggle.classList.toggle('open', open);
        langToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    if (!langPanel) {
      langPanel = document.createElement('div');
      langPanel.id = 'fn-settings-language-panel';
      langPanel.className = 'setting-section fn-acc-panel';
    }
    langPanel.appendChild(picker);
    var container = (firstToggle && firstToggle.parentNode) ? firstToggle.parentNode : (themeSection ? themeSection.parentNode : settings);
    var ref = container.querySelector('#fn-settings-language-main-toggle') || firstToggle || themeSection || container.firstChild;
    if (!document.getElementById('fn-settings-language-main-toggle')) container.insertBefore(langToggle, ref);
    if (langToggle.nextSibling !== langPanel) container.insertBefore(langPanel, langToggle.nextSibling);
    var title = langToggle.querySelector('.fn-toggle-title');
    if (title) title.textContent = faMode() ? 'زبان' : 'Language';
    if (!langToggle.classList.contains('open')) langToggle.setAttribute('aria-expanded','false');
    // Default all settings sections closed. User can open each one manually.
    settings.querySelectorAll('.fn-settings-toggle.open').forEach(function(btn){ if (btn.id !== 'fn-settings-language-main-toggle') btn.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
    settings.querySelectorAll('.fn-acc-panel.open').forEach(function(panel){ if (panel.id !== 'fn-settings-language-panel') panel.classList.remove('open'); });
    // Keep language panel closed by default too unless user opened it this session.
    if (!langToggle.__userOpened) { langPanel.classList.remove('open'); langToggle.classList.remove('open'); langToggle.setAttribute('aria-expanded','false'); }
    var oldClick = langToggle.onclick;
    if (!langToggle.__trackOpenBound) {
      langToggle.__trackOpenBound = true;
      langToggle.addEventListener('click', function(){ langToggle.__userOpened = true; }, true);
    }
  }
  function updateVersion(){
    try { window.FAMILY_NIGHT_VERSION = FN_APP_VERSION_40104; } catch(e){}
    document.querySelectorAll('.fn-about-version').forEach(function(el){ el.textContent = '🚀 Family Night ' + FN_APP_VERSION_40104; });
  }
  function runAll(){
    try { ensureSidebarExtras(); ensureSettingsLanguageFirst(); updateVersion(); } catch(e){ console.warn('v40.10.10 patch failed', e); }
  }
  var oldPopulate = (typeof populateSidebar === 'function') ? populateSidebar : null;
  if (oldPopulate && !oldPopulate.__v40104Wrapped) {
    populateSidebar = function(){ var r = oldPopulate.apply(this, arguments); setTimeout(runAll, 0); return r; };
    populateSidebar.__v40104Wrapped = true;
  }
  var oldApply = (typeof applyLang === 'function') ? applyLang : null;
  if (oldApply && !oldApply.__v40104Wrapped) {
    applyLang = function(){ var r = oldApply.apply(this, arguments); setTimeout(runAll, 0); setTimeout(runAll, 250); return r; };
    applyLang.__v40104Wrapped = true;
  }
  var oldTheme = (typeof applyCreativeTheme === 'function') ? applyCreativeTheme : null;
  if (oldTheme && !oldTheme.__v40104Wrapped) {
    applyCreativeTheme = function(){ var r = oldTheme.apply(this, arguments); setTimeout(runAll, 0); return r; };
    applyCreativeTheme.__v40104Wrapped = true;
  }
  document.addEventListener('DOMContentLoaded', function(){ runAll(); [80,250,700,1400,2600].forEach(function(t){ setTimeout(runAll, t); }); });
  window.addEventListener('load', function(){ runAll(); setTimeout(runAll, 1000); });
})();


;

/* ===== v40.10.10 readability + sidebar accordion behavior ===== */
(function(){
  var FN_APP_VERSION_40105 = 'v40.10.10';
  function isFa(){ try { return (typeof LANG !== 'undefined' ? LANG : localStorage.getItem('lang')) === 'fa'; } catch(e){ return false; } }
  function setVersion(){
    try { window.FAMILY_NIGHT_VERSION = FN_APP_VERSION_40105; } catch(e){}
    document.querySelectorAll('.fn-about-version').forEach(function(el){ el.textContent = '🚀 Family Night ' + FN_APP_VERSION_40105; });
  }
  function fixSettingsLanguageTitle(){
    var btn = document.getElementById('fn-settings-language-main-toggle');
    if (!btn) return;
    var title = btn.querySelector('.fn-toggle-title');
    if (title) {
      title.textContent = isFa() ? 'زبان' : 'Language';
      title.style.color = 'var(--text)';
      title.style.opacity = '1';
      title.style.visibility = 'visible';
      title.style.display = 'inline-block';
    }
  }
  function enhanceSearchReadability(){
    var search = document.getElementById('search-tab');
    if (!search) return;
    var light = document.body.classList.contains('theme-light') || /^(day|telegramDay)$/.test(document.body.getAttribute('data-theme') || '');
    if (!light) return;
    search.querySelectorAll('.actor-name,.company-name,.company-type,.m-title,.sec-title,.search-history-text,.search-history-clear').forEach(function(el){
      el.style.color = '#111827';
      el.style.opacity = '1';
    });
    search.querySelectorAll('.sec-more,.search-history-icon').forEach(function(el){
      el.style.color = '#4b5563';
      el.style.opacity = '1';
    });
  }
  window.toggleSidebarPanel40105 = function(id){
    var target = document.getElementById(id);
    if (!target) return;
    var sidebar = document.getElementById('sidebar') || document;
    var wasOpen = target.style.display === 'block' || target.classList.contains('fn-sb-open');
    sidebar.querySelectorAll('.sb-sub-list').forEach(function(panel){
      panel.style.display = 'none';
      panel.classList.remove('fn-sb-open');
    });
    sidebar.querySelectorAll('.sb-item.fn-sb-toggle-open').forEach(function(item){ item.classList.remove('fn-sb-toggle-open'); });
    if (!wasOpen) {
      target.style.display = 'block';
      target.classList.add('fn-sb-open');
      var trigger = sidebar.querySelector('[onclick*="'+id+'"]');
      if (trigger) trigger.classList.add('fn-sb-toggle-open');
    }
  };
  function upgradeSidebarToggles(){
    var sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    sidebar.querySelectorAll('[onclick*="toggleSidebarPanel40104"]').forEach(function(el){
      var onclick = el.getAttribute('onclick') || '';
      onclick = onclick.replace(/toggleSidebarPanel40104/g, 'toggleSidebarPanel40105');
      el.setAttribute('onclick', onclick);
    });
    sidebar.querySelectorAll('.sb-item').forEach(function(item){
      var onclick = item.getAttribute('onclick') || '';
      var m = onclick.match(/toggleSub\(['"]([^'"]+)['"]\)/);
      if (m && !item.__fnSingleOpenBound) {
        item.__fnSingleOpenBound = true;
        item.addEventListener('click', function(){
          var keepId = m[1];
          setTimeout(function(){
            sidebar.querySelectorAll('.sb-sub-list').forEach(function(panel){
              if (panel.id !== keepId && panel.style.display === 'block') panel.style.display = 'none';
            });
          }, 0);
        }, true);
      }
    });
  }
  function run(){
    try { setVersion(); fixSettingsLanguageTitle(); enhanceSearchReadability(); upgradeSidebarToggles(); } catch(e){ console.warn('v40.10.10 patch failed', e); }
  }
  var oldApplyLang = (typeof applyLang === 'function') ? applyLang : null;
  if (oldApplyLang && !oldApplyLang.__v40105Wrapped) {
    applyLang = function(){ var r = oldApplyLang.apply(this, arguments); setTimeout(run, 0); setTimeout(run, 300); return r; };
    applyLang.__v40105Wrapped = true;
  }
  var oldTheme = (typeof applyCreativeTheme === 'function') ? applyCreativeTheme : null;
  if (oldTheme && !oldTheme.__v40105Wrapped) {
    applyCreativeTheme = function(){ var r = oldTheme.apply(this, arguments); setTimeout(run, 0); setTimeout(run, 300); return r; };
    applyCreativeTheme.__v40105Wrapped = true;
  }
  document.addEventListener('DOMContentLoaded', function(){ run(); [100,350,800,1600,2800].forEach(function(t){ setTimeout(run, t); }); });
  window.addEventListener('load', function(){ run(); setTimeout(run, 900); });
})();


;

/* ===== v40.10.10 Search tab Hollywood-first people priority ===== */
(function(){
  'use strict';
  var FN_APP_VERSION_40106 = 'v40.10.10';
  var PERSON_TYPES = { actor_male_list: true, actor_female_list: true };
  var EN_COUNTRIES = { US:true, GB:true, CA:true, AU:true, NZ:true, IE:true };
  var cache = new Map();
  var detailCache = new Map();
  var hwState = { active:false, type:null, page:1, seen:new Set(), query:'' };

  var MALE_HOLLYWOOD_SEEDS = [
    500, 6193, 287, 6384, 3223, 1892, 31, 192, 3894, 1158, 380, 976, 85, 60, 131,
    73968, 74568, 73457, 1136406, 1253360, 1009377, 2037, 30614, 2524, 504, 10980,
    1190668, 130640, 2035102, 119894, 37625, 1023139, 819, 3, 2888, 17276, 819,
    11856, 18918, 18999, 5293, 62, 23659, 118, 2963, 1333, 1100, 65731
  ];
  var FEMALE_HOLLYWOOD_SEEDS = [
    505710, 974169, 1373737, 115440, 234352, 1245, 1397778, 224513, 54693, 72129,
    550843, 524, 90633, 10990, 36594, 136532, 112, 5064, 11701, 156, 1813,
    9273, 204, 1920, 2231, 140, 1267329, 83002, 6161, 17605, 82242, 1275259,
    203, 126, 129, 4775, 125025, 19079, 227454, 1437491, 2049994, 21657, 3136,
    19537, 114, 11148, 3293, 453, 56734
  ];

  function isFa(){ return window.LANG === 'fa'; }
  function dataFn(){ return (typeof window.getDataEN === 'function') ? window.getDataEN : window.getData; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  async function safeGet(path, ms){
    ms = ms || 6500;
    if (cache.has(path)) return cache.get(path);
    try {
      var fn = dataFn();
      if (typeof fn !== 'function') return null;
      var res = await Promise.race([fn(path), new Promise(function(resolve){ setTimeout(function(){ resolve(null); }, ms); })]);
      if (res) cache.set(path, res);
      return res;
    } catch(e) { return null; }
  }
  async function personDetail(p, seedRank){
    if (!p || !p.id) return null;
    var id = Number(p.id);
    if (detailCache.has(id)) return Object.assign({}, p, detailCache.get(id), seedRank != null ? {_seedRank:seedRank,_curatedHollywood:true} : {});
    var d = await safeGet('person/' + id, 3500);
    var merged = Object.assign({}, p, d || {}, seedRank != null ? {_seedRank:seedRank,_curatedHollywood:true} : {});
    if (d && d.id) detailCache.set(id, d);
    return merged;
  }
  function isActorType(type){ return !!PERSON_TYPES[type]; }
  function matchesGender(p,type){
    if (!p || !p.profile_path) return false;
    return type === 'actor_male_list' ? Number(p.gender) === 2 : Number(p.gender) === 1;
  }
  function mediaIsHollywood(m){
    if (!m) return false;
    var langs = [m.original_language, m.language].filter(Boolean).map(function(x){ return String(x).toLowerCase(); });
    var countries = Array.isArray(m.origin_country) ? m.origin_country : (m.production_countries || []).map(function(c){ return c && (c.iso_3166_1 || c); });
    var englishLang = langs.indexOf('en') !== -1;
    var englishCountry = countries.some(function(c){ return EN_COUNTRIES[String(c || '').toUpperCase()]; });
    return englishLang || englishCountry;
  }
  function itemYear(m){
    var date = (m && (m.release_date || m.first_air_date)) || '';
    var y = parseInt(String(date).slice(0,4), 10);
    return isNaN(y) ? 0 : y;
  }
  function trendMediaScore(m){
    if (!m) return 0;
    var y = itemYear(m);
    var now = new Date().getFullYear();
    var recency = 0;
    if (y >= now - 1) recency = 480;
    else if (y >= now - 3) recency = 300;
    else if (y >= now - 6) recency = 140;
    return Number(m.popularity || 0) + Number(m.vote_count || 0) * 0.025 + Number(m.vote_average || 0) * 8 + recency;
  }
  function hollywoodScore(p){
    var known = Array.isArray(p.known_for) ? p.known_for : [];
    var h = known.filter(mediaIsHollywood);
    var hScore = h.reduce(function(sum,m){ return sum + trendMediaScore(m); }, 0);
    var globalKnown = known.reduce(function(sum,m){ return sum + trendMediaScore(m) * 0.15; }, 0);
    var latinName = /^[\x00-\x7F\u00C0-\u024F\s'.-]+$/.test(String(p.name || '')) ? 180 : 0;
    var curated = p._curatedHollywood ? Math.max(0, 6000 - Number(p._seedRank || 0) * 18) : 0;
    var hollywoodBonus = h.length ? 3600 + h.length * 450 : 0;
    var firstHollywood = (known[0] && mediaIsHollywood(known[0])) ? 1200 : 0;
    return curated + hollywoodBonus + firstHollywood + latinName + Number(p.popularity || 0) * 4 + hScore + globalKnown;
  }
  function sortPeople(list){ return list.sort(function(a,b){ return hollywoodScore(b) - hollywoodScore(a); }); }
  function personCard(p){
    if (typeof window.makePersonCard === 'function') return window.makePersonCard(p);
    if (typeof makePersonCard === 'function') return makePersonCard(p);
    var IMG = window.IMG || 'https://family-night-api.alirezadoe8.workers.dev/img/w185';
    return '<div class="actor-card" onclick="openDetail('+Number(p.id)+', \'person_works\')"><img src="'+IMG+esc(p.profile_path)+'" class="actor-img" loading="lazy"><div class="actor-name">'+esc(p.name)+'</div></div>';
  }
  async function seedPeople(type){
    var ids = type === 'actor_female_list' ? FEMALE_HOLLYWOOD_SEEDS : MALE_HOLLYWOOD_SEEDS;
    var jobs = ids.map(function(id, idx){ return personDetail({id:id}, idx).catch(function(){ return null; }); });
    var out = await Promise.all(jobs);
    return out.filter(function(p){ return matchesGender(p, type); });
  }
  async function trendingPeople(type, page){
    page = page || 1;
    var all = [];
    var seedList = page === 1 ? await seedPeople(type) : [];
    all = all.concat(seedList);
    var jobs = [];
    for (var t=1; t<=2; t++) jobs.push(safeGet('trending/person/week?page=' + t, 6500));
    var start = Math.max(1, (page - 1) * 5 + 1);
    for (var p=0; p<6; p++) jobs.push(safeGet('person/popular?page=' + (start+p), 6500));
    var pages = await Promise.all(jobs);
    pages.forEach(function(d){ if (d && d.results) all = all.concat(d.results); });
    var seen = new Set(), final = [];
    for (var i=0; i<all.length; i++) {
      var person = all[i];
      if (!person || !person.id || seen.has(person.id)) continue;
      seen.add(person.id);
      if (matchesGender(person, type)) final.push(person);
    }
    return sortPeople(final);
  }
  function placeholder(type){
    if (type === 'actor_female_list') return isFa() ? 'جستجوی بازیگر زن... نام فارسی یا انگلیسی' : 'Search actresses...';
    return isFa() ? 'جستجوی بازیگر مرد... نام فارسی یا انگلیسی' : 'Search actors...';
  }
  function titleFor(type, title){
    if (title) return title;
    return type === 'actor_female_list' ? (isFa() ? 'ستارگان سینما (زن)' : 'Cinema Legends (Female)') : (isFa() ? 'ستارگان سینما (مرد)' : 'Cinema Legends (Male)');
  }
  function setupPeoplePage(type,title){
    var modal = document.getElementById('modal'); if (modal) modal.style.display = 'none';
    var pw = document.getElementById('person-works-modal'); if (pw) pw.style.display = 'none';
    var page = document.getElementById('generic-grid-page'); if (page) page.style.display = 'flex';
    var ttl = document.getElementById('gg-title'); if (ttl) ttl.innerText = titleFor(type,title);
    var content = document.getElementById('gg-content'); if (content) { content.className = 'person-grid-container'; content.innerHTML = ''; }
    var sort = document.getElementById('gg-sort-bar'); if (sort) sort.style.display = 'none';
    var bar = document.getElementById('gg-person-search-bar'); if (bar) bar.style.display = 'block';
    var inp = document.getElementById('gg-person-search-input'); if (inp) { inp.value = ''; inp.placeholder = placeholder(type); inp.setAttribute('dir','auto'); }
    var clear = document.getElementById('gg-person-search-clear'); if (clear) clear.style.display = 'none';
    var more = document.getElementById('btn-more-g'); if (more) { more.style.display = 'block'; more.innerText = isFa() ? 'نمایش بیشتر' : 'Load More'; }
    try { genericType = type; genericPage = 1; genericQuery = 'person/popular'; genericContentType = 'person_list'; genericPersonSearchQuery = ''; } catch(e) {}
  }
  function renderTo(container, list, append, limit){
    if (!container) return;
    if (!append) container.innerHTML = '';
    var html = [];
    var added = 0;
    for (var i=0; i<list.length && added<limit; i++) {
      var p = list[i];
      if (!p || !p.id || hwState.seen.has(p.id)) continue;
      hwState.seen.add(p.id);
      html.push(personCard(p));
      added++;
    }
    if (html.length) container.insertAdjacentHTML('beforeend', html.join(''));
    if (!append && !html.length) container.innerHTML = '<div class="person-empty-state">' + (isFa() ? 'نتیجه‌ای پیدا نشد.' : 'No people found.') + '</div>';
  }
  async function loadHollywoodGrid(append){
    var container = document.getElementById('gg-content');
    if (!container || !hwState.type) return;
    if (!append) { hwState.seen = new Set(); container.innerHTML = '<div class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--primary);display:block;margin-bottom:10px;"></i>' + (isFa() ? 'در حال بارگذاری ستارگان هالیوودی...' : 'Loading Hollywood trending stars...') + '</div>'; }
    var list = await trendingPeople(hwState.type, hwState.page);
    renderTo(container, list, !!append, 54);
    var more = document.getElementById('btn-more-g'); if (more) more.style.display = 'block';
  }
  async function searchHollywoodPeople(q){
    var raw = String(q || '').trim();
    hwState.query = raw;
    var clear = document.getElementById('gg-person-search-clear'); if (clear) clear.style.display = raw ? 'block' : 'none';
    if (!raw) { hwState.page = 1; return loadHollywoodGrid(false); }
    var container = document.getElementById('gg-content');
    if (container) container.innerHTML = '<div class="person-empty-state"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;color:var(--primary);display:block;margin-bottom:10px;"></i>' + (isFa() ? 'در حال جستجو...' : 'Searching...') + '</div>';
    var terms = [raw];
    try { if (typeof normalizePersonSearchTerm === 'function') { var en = normalizePersonSearchTerm(raw); if (en && en.toLowerCase() !== raw.toLowerCase()) terms.push(en); } } catch(e) {}
    var all = await seedPeople(hwState.type);
    for (var i=0; i<terms.length; i++) {
      var d = await safeGet('search/person?query=' + encodeURIComponent(terms[i]) + '&include_adult=false&page=1', 6500);
      if (d && d.results) all = all.concat(d.results);
      var d2 = await safeGet('search/person?query=' + encodeURIComponent(terms[i]) + '&include_adult=false&page=2', 6500);
      if (d2 && d2.results) all = all.concat(d2.results);
    }
    var qn = raw.toLowerCase();
    var seen = new Set(), final=[];
    all.forEach(function(p){
      if (!p || !p.id || seen.has(p.id) || !matchesGender(p, hwState.type)) return;
      seen.add(p.id);
      var name = String(p.name || '').toLowerCase();
      if (name.indexOf(qn) !== -1 || qn.length < 2) final.push(p);
    });
    hwState.seen = new Set();
    renderTo(container, sortPeople(final), false, 100);
  }
  async function renderSearchRows(){
    var maleEl = document.getElementById('trend-male');
    var femaleEl = document.getElementById('trend-female');
    if (!maleEl || !femaleEl) return;
    maleEl.innerHTML = '<div class="person-empty-state" style="min-width:160px;padding:20px 10px;">' + (isFa() ? 'در حال بارگذاری...' : 'Loading...') + '</div>';
    femaleEl.innerHTML = maleEl.innerHTML;
    var lists = await Promise.all([trendingPeople('actor_male_list',1), trendingPeople('actor_female_list',1)]);
    hwState.seen = new Set();
    maleEl.innerHTML = lists[0].slice(0, 12).map(personCard).join('');
    femaleEl.innerHTML = lists[1].slice(0, 12).map(personCard).join('');
    try { if (typeof enhanceSearchReadability === 'function') enhanceSearchReadability(); } catch(e) {}
  }

  var oldTrending = window.loadTrendingActors;
  window.loadTrendingActors = async function(){
    try { if (typeof oldTrending === 'function') await oldTrending.apply(this, arguments); } catch(e) {}
    try { await renderSearchRows(); } catch(e) { console.warn('v40.10.10 search row patch failed', e); }
  };

  var oldOpen = window.openGenericGrid;
  window.openGenericGrid = function(type,q,title){
    if (!isActorType(type)) {
      hwState.active = false;
      return oldOpen ? oldOpen.apply(this, arguments) : undefined;
    }
    hwState.active = true; hwState.type = type; hwState.page = 1; hwState.query = ''; hwState.seen = new Set();
    setupPeoplePage(type,title);
    loadHollywoodGrid(false);
  };
  var oldMore = window.loadMoreGeneric;
  window.loadMoreGeneric = function(){
    if (hwState.active && isActorType(hwState.type)) { hwState.page++; try { genericPage = hwState.page; } catch(e) {} return loadHollywoodGrid(true); }
    return oldMore ? oldMore.apply(this, arguments) : undefined;
  };
  var oldSearch = window.searchGenericPeople;
  window.searchGenericPeople = function(q){
    if (hwState.active && isActorType(hwState.type)) {
      if (window.__fnHwSearchTimer) clearTimeout(window.__fnHwSearchTimer);
      window.__fnHwSearchTimer = setTimeout(function(){ searchHollywoodPeople(q); }, 150);
      return;
    }
    return oldSearch ? oldSearch.apply(this, arguments) : undefined;
  };
  var oldClear = window.clearGenericPersonSearch;
  window.clearGenericPersonSearch = function(){
    if (hwState.active && isActorType(hwState.type)) {
      var inp = document.getElementById('gg-person-search-input'); if (inp) inp.value = '';
      var clear = document.getElementById('gg-person-search-clear'); if (clear) clear.style.display = 'none';
      hwState.query = ''; hwState.page = 1; hwState.seen = new Set();
      return loadHollywoodGrid(false);
    }
    return oldClear ? oldClear.apply(this, arguments) : undefined;
  };
  function setVersion(){
    document.querySelectorAll('.dev-info').forEach(function(el){ if (/v\d+\.\d+\.\d+/.test(el.innerHTML)) el.innerHTML = el.innerHTML.replace(/v\d+\.\d+\.\d+/g, FN_APP_VERSION_40106); });
    document.querySelectorAll('[data-fn-version], .fn-app-version, #fn-app-version').forEach(function(el){ el.textContent = FN_APP_VERSION_40106; });
  }
  var oldLang = (typeof applyLang === 'function') ? applyLang : null;
  if (oldLang && !oldLang.__v40106Wrapped) {
    applyLang = function(){ var r = oldLang.apply(this, arguments); setTimeout(function(){ setVersion(); if (document.getElementById('search-tab') && document.getElementById('trend-male')) renderSearchRows(); }, 250); return r; };
    applyLang.__v40106Wrapped = true;
  }
  document.addEventListener('DOMContentLoaded', function(){ setVersion(); setTimeout(setVersion, 600); });
  window.addEventListener('load', function(){ setVersion(); setTimeout(function(){ if (document.getElementById('search-tab') && document.getElementById('trend-male')) renderSearchRows(); }, 900); });
})();


;

(function(){
  'use strict';
  var FN_VER = 'v40.10.10';
  function isFa(){ try { return (typeof LANG !== 'undefined' ? LANG : localStorage.getItem('lang')) === 'fa'; } catch(e){ return false; } }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
  function ratingsObj(){ try { return JSON.parse(localStorage.getItem('family_personal_ratings_v1') || '{}') || {}; } catch(e){ return {}; } }
  function ratingBadgeHtml(stars){
    stars = Math.max(1, Math.min(5, Number(stars)||0));
    if (!stars) return '';
    return '<div class="fn-my-rating-badge-card" title="My rating"><div class="fn-rating-star">★<span class="fn-rating-num">'+stars+'</span></div></div>';
  }
  function extractCardId(card){
    var oc = card && card.getAttribute ? (card.getAttribute('onclick') || '') : '';
    var m = oc.match(/openDetail\((\d+)/);
    return m ? String(m[1]) : '';
  }
  function cleanCardStars(card){
    if (!card || !card.querySelectorAll) return;
    try {
      card.querySelectorAll('div[style*="bottom:5px"],div[style*="bottom: 5px"]').forEach(function(el){
        if ((el.textContent || '').indexOf('★') > -1) el.remove();
      });
      card.querySelectorAll('.meta-sub span').forEach(function(el){
        if ((el.textContent || '').indexOf('★') > -1) el.remove();
      });
      card.querySelectorAll('.meta-sub').forEach(function(el){
        if ((el.textContent || '').match(/[★☆]{1,5}/)) {
          Array.from(el.childNodes).forEach(function(n){ if ((n.textContent || '').match(/[★☆]/)) n.remove(); });
        }
      });
    } catch(e) {}
  }
  function refreshVisibleRatingBadges(root){
    var scope = root && root.querySelectorAll ? root : document;
    var rs = ratingsObj();
    try {
      scope.querySelectorAll('.card').forEach(function(card){
        cleanCardStars(card);
        var id = extractCardId(card);
        var r = id && rs[id] ? rs[id] : null;
        var stars = r && Number(r.stars) > 0 ? Number(r.stars) : 0;
        var old = card.querySelector('.fn-my-rating-badge-card');
        if (!stars) { if (old) old.remove(); return; }
        if (!old) {
          card.insertAdjacentHTML('afterbegin', ratingBadgeHtml(stars));
        } else {
          var num = old.querySelector('.fn-rating-num');
          if (num) num.textContent = String(stars);
        }
      });
    } catch(e) {}
  }
  function patchMakeCard(){
    if (typeof makeCard !== 'function' || makeCard.__fn401010) return;
    var oldMake = makeCard;
    makeCard = function(m, type){
      var html = oldMake.apply(this, arguments);
      try {
        var id = m && m.id != null ? String(m.id) : '';
        var r = id ? ratingsObj()[id] : null;
        var stars = r && Number(r.stars) > 0 ? Number(r.stars) : 0;
        html = String(html || '');
        html = html.replace(/<div style="position:absolute;bottom:5px;right:5px;background:rgba\(0,0,0,0\.8\);color:#f5c518;font-size:10px;padding:2px 5px;border-radius:4px;">[\s\S]*?<\/div>/g, '');
        html = html.replace(/<span style="color:#f5c518;font-size:11px;">[\s\S]*?<\/span>/g, '');
        html = html.replace(/<div class="meta-sub" style="flex-direction:column;gap:1px;">\s*<span>([\s\S]*?)<\/span>\s*<\/div>/g, '<div class="meta-sub"><span>$1</span></div>');
        if (stars) html = html.replace(/(<div class="card"[^>]*>)/, '$1' + ratingBadgeHtml(stars));
      } catch(e) {}
      return html;
    };
    makeCard.__fn401010 = true;
  }
  function showOpinion(open, scrollIt){
    var chips = document.getElementById('opinion-chips');
    if (!chips) return;
    if (open) {
      chips.classList.remove('fn-opinion-collapsed');
      chips.classList.add('fn-opinion-open');
      chips.style.display = 'block';
      if (scrollIt) setTimeout(function(){ try { chips.scrollIntoView({behavior:'smooth', block:'center'}); } catch(e){} }, 80);
    } else {
      chips.classList.add('fn-opinion-collapsed');
      chips.classList.remove('fn-opinion-open');
      chips.style.display = 'none';
    }
  }
  function patchRatingFunctions(){
    try {
      if (typeof renderPersonalRating === 'function' && !renderPersonalRating.__fn401010) {
        var oldRender = renderPersonalRating;
        renderPersonalRating = function(){
          var out = oldRender.apply(this, arguments);
          if (!window.__fn401010KeepOpinionOpen) showOpinion(false, false);
          return out;
        };
        renderPersonalRating.__fn401010 = true;
      }
      if (typeof setPersonalRating === 'function' && !setPersonalRating.__fn401010) {
        var oldSet = setPersonalRating;
        setPersonalRating = function(stars){
          window.__fn401010KeepOpinionOpen = true;
          var out = oldSet.apply(this, arguments);
          window.__fn401010KeepOpinionOpen = false;
          try { if (typeof renderOpinionChips === 'function') renderOpinionChips(); } catch(e) {}
          showOpinion(true, true);
          setTimeout(function(){ refreshVisibleRatingBadges(document); try { if (typeof loadFavorites === 'function') loadFavorites(); } catch(e){} }, 100);
          return out;
        };
        setPersonalRating.__fn401010 = true;
      }
      if (typeof setRatingOpinion === 'function' && !setRatingOpinion.__fn401010) {
        var oldOp = setRatingOpinion;
        setRatingOpinion = function(opinion){
          var out = oldOp.apply(this, arguments);
          showOpinion(false, false);
          setTimeout(function(){ refreshVisibleRatingBadges(document); }, 80);
          return out;
        };
        setRatingOpinion.__fn401010 = true;
      }
      if (typeof clearPersonalRating === 'function' && !clearPersonalRating.__fn401010) {
        var oldClear = clearPersonalRating;
        clearPersonalRating = function(){
          var out = oldClear.apply(this, arguments);
          showOpinion(false, false);
          setTimeout(function(){ refreshVisibleRatingBadges(document); try { if (typeof loadFavorites === 'function') loadFavorites(); } catch(e){} }, 100);
          return out;
        };
        clearPersonalRating.__fn401010 = true;
      }
      if (typeof loadFavorites === 'function' && !loadFavorites.__fn401010) {
        var oldLoadFav = loadFavorites;
        loadFavorites = function(){
          var out = oldLoadFav.apply(this, arguments);
          setTimeout(function(){ refreshVisibleRatingBadges(document); }, 60);
          return out;
        };
        loadFavorites.__fn401010 = true;
      }
    } catch(e) { console.warn('v40.10.10 rating patch failed', e); }
  }
  document.addEventListener('click', function(e){
    var target = e.target;
    if (!target || !target.closest) return;
    var sec = target.closest('#personal-rating-section');
    if (!sec || target.closest('.star-btn,.personal-rating-clear,#opinion-chips')) return;
    var chips = document.getElementById('opinion-chips');
    var open = chips && chips.style.display !== 'none' && !chips.classList.contains('fn-opinion-collapsed');
    if (!open) { try { if (typeof renderOpinionChips === 'function') renderOpinionChips(); } catch(e){} }
    showOpinion(!open, false);
  });

  var knownAwards = {
    tt0068646:{wins:31,noms:31}, tt0071562:{wins:17,noms:20}, tt0111161:{wins:21,noms:43}, tt0468569:{wins:163,noms:164},
    tt0108052:{wins:91,noms:49}, tt0110912:{wins:69,noms:72}, tt0137523:{wins:12,noms:38}, tt0109830:{wins:51,noms:75},
    tt0167260:{wins:215,noms:124}, tt0120737:{wins:125,noms:127}, tt0167261:{wins:130,noms:138}, tt1375666:{wins:159,noms:220},
    tt0133093:{wins:42,noms:52}, tt0816692:{wins:44,noms:148}, tt0120815:{wins:79,noms:75}, tt0080684:{wins:27,noms:20},
    tt0944947:{wins:397,noms:650}, tt0903747:{wins:154,noms:247}, tt7366338:{wins:84,noms:61}, tt1475582:{wins:93,noms:184}
  };
  function parseAwards(text){
    text = String(text || '');
    var wins = 0, noms = 0;
    var m = text.match(/(\d+)\s+wins?/i); if (m) wins = parseInt(m[1],10) || 0;
    m = text.match(/(\d+)\s+nominations?/i); if (m) noms = parseInt(m[1],10) || 0;
    var won = text.match(/Won\s+(\d+)\s+(?:Oscars?|Primetime Emmys?|Emmys?|Golden Globes?|BAFTAs?)/ig) || [];
    if (!wins) won.forEach(function(x){ var n = x.match(/\d+/); if(n) wins += parseInt(n[0],10)||0; });
    var nom = text.match(/Nominated\s+for\s+(\d+)\s+(?:Oscars?|Primetime Emmys?|Emmys?|Golden Globes?|BAFTAs?)/ig) || [];
    if (!noms) nom.forEach(function(x){ var n = x.match(/\d+/); if(n) noms += parseInt(n[0],10)||0; });
    return {wins:wins,noms:noms,raw:text};
  }
  async function fetchOmdb(imdbId){
    if (!imdbId) return null;
    try { var c = localStorage.getItem('fn_omdb_awards_' + imdbId); if (c) { var pc = JSON.parse(c); if (pc && pc.Response === 'True') return pc; } } catch(e) {}
    // FN-FIX3: worker proxy first (server-side key, works in Iran); direct OMDb only as fallback.
    // The old code fetched OMDb with an empty/dead key, so every title showed 0 awards.
    var urls = ['https://family-night-api.alirezadoe8.workers.dev/v1/omdb?i=' + encodeURIComponent(imdbId),
                'https://www.omdbapi.com/?i=' + encodeURIComponent(imdbId) + '&apikey=trilogy'];
    for (var ui = 0; ui < urls.length; ui++) {
      try {
        var r = await fetch(urls[ui]);
        if (r && r.ok) { var d = await r.json(); if (d && d.Response === 'True') { try { localStorage.setItem('fn_omdb_awards_' + imdbId, JSON.stringify(d)); } catch(e2){} return d; } }
      } catch(e) {}
    }
    return null;
  }
  async function ensureFullData(item){
    var d = item && item.data ? item.data : {};
    try {
      if ((!d.external_ids || !d.external_ids.imdb_id) && typeof getData === 'function' && item && item.type && item.id) {
        var fd = await getData(item.type + '/' + item.id + '?append_to_response=external_ids');
        if (fd) d = Object.assign({}, d, fd);
      }
    } catch(e) {}
    return d || {};
  }
  function imdbId(d){ return d && d.external_ids && d.external_ids.imdb_id ? d.external_ids.imdb_id : ''; }
  function runtime(d){ return d && (Number(d.runtime)|| (d.episode_run_time && Number(d.episode_run_time[0])) || 0); }
  function awards(imdb, omdb){ var hasOmdb = !!(omdb && omdb.Response === 'True' && omdb.Awards && omdb.Awards !== 'N/A'); var a = parseAwards(omdb && omdb.Awards); var hasKnown = (!a.wins && !a.noms) && imdb && knownAwards[imdb]; if (hasKnown) a = knownAwards[imdb]; return {wins:Number(a.wins)||0,noms:Number(a.noms)||0,hasData:!!(hasOmdb || hasKnown)}; }
  function rt(omdb){ var r = omdb && omdb.Ratings && omdb.Ratings.find(function(x){ return x.Source === 'Rotten Tomatoes'; }); return r ? parseInt(r.Value,10) : null; }
  function meta(omdb){ return omdb && omdb.Metascore && omdb.Metascore !== 'N/A' ? parseInt(omdb.Metascore,10) : null; }
  function posterUrl(d){ var base = (typeof IMG_LG !== 'undefined' ? IMG_LG : 'https://family-night-api.alirezadoe8.workers.dev/img/w500'); return d && d.poster_path ? base + d.poster_path : ''; }
  function patchCompare(){
    if (typeof showCompareModal !== 'function' || showCompareModal.__fn401010) return;
    showCompareModal = async function(){
      var modal = document.getElementById('compare-modal');
      var content = document.getElementById('compare-content');
      if (!modal || !content || typeof compareItems === 'undefined' || !compareItems || compareItems.length < 2) return;
      modal.classList.add('open');
      var a = compareItems[0], b = compareItems[1];
      var fa = isFa();
      content.innerHTML = '<div class="compare-col" style="grid-column:1/-1;text-align:center;padding:18px;color:#999;"><i class="fa-solid fa-spinner fa-spin"></i> '+(fa?'در حال تکمیل اطلاعات مقایسه...':'Completing comparison data...')+'</div>';
      var ad = await ensureFullData(a), bd = await ensureFullData(b);
      a.data = ad; b.data = bd;
      var ay = (ad.release_date || ad.first_air_date || '').split('-')[0];
      var by = (bd.release_date || bd.first_air_date || '').split('-')[0];
      var ar = parseFloat(ad.vote_average || 0), br = parseFloat(bd.vote_average || 0);
      var av = parseInt(ad.vote_count || 0, 10), bv = parseInt(bd.vote_count || 0, 10);
      var aru = runtime(ad), bru = runtime(bd);
      var ai = imdbId(ad), bi = imdbId(bd);
      var om = await Promise.all([fetchOmdb(ai), fetchOmdb(bi)]);
      var aa = awards(ai, om[0]), ba = awards(bi, om[1]);
      var art = rt(om[0]), brt = rt(om[1]), amet = meta(om[0]), bmet = meta(om[1]);
      var winStyle='color:#4ade80;font-weight:900;', loseStyle='color:#888;';
      function cell(label, val, win){ return '<div class="compare-col" style="background:#0d0d0d;"><div class="compare-row"><div class="compare-key">'+label+'</div><div class="compare-val" style="'+(win?winStyle:loseStyle)+'">'+val+(win?' ✓':'')+'</div></div></div>'; }
      function row(label, left, right, aWin){ return cell(label,left,aWin===true)+cell(label,right,aWin===false); }
      function colorRT(s){ if(s===null || isNaN(s)) return '—'; var c=s>=75?'#4ade80':s>=60?'#facc15':'#f87171'; return '<span style="color:'+c+';font-weight:bold;">'+s+'%</span>'; }
      function colorMeta(s){ if(s===null || isNaN(s)) return '—'; var c=s>=61?'#4ade80':s>=40?'#facc15':'#f87171'; return '<span style="background:'+c+';color:#000;padding:2px 6px;border-radius:4px;font-weight:bold;">'+s+'</span>'; }
      content.innerHTML = ''+
        '<div class="compare-col"><img src="'+esc(posterUrl(ad))+'" class="compare-poster" loading="lazy"><div class="compare-name">'+esc(a.title)+'</div></div>'+
        '<div class="compare-col"><img src="'+esc(posterUrl(bd))+'" class="compare-poster" loading="lazy"><div class="compare-name">'+esc(b.title)+'</div></div>'+
        row('📅 '+(fa?'سال':'Year'), esc(ay||'—'), esc(by||'—'), parseInt(ay||0,10) > parseInt(by||0,10))+
        row('⭐ IMDb', ar.toFixed(1), br.toFixed(1), ar >= br)+
        row('🗳️ '+(fa?'آرا':'Votes'), av.toLocaleString(), bv.toLocaleString(), av >= bv)+
        ((aru||bru) ? row('⏱️ '+(fa?'مدت':'Runtime'), aru?aru+'min':'—', bru?bru+'min':'—', aru >= bru) : '')+
        ((art!==null||brt!==null) ? cell('🍅 Rotten Tomatoes', colorRT(art), false).replace(/style="color:#888;"/,'') + cell('🍅 Rotten Tomatoes', colorRT(brt), false).replace(/style="color:#888;"/,'') : '')+
        ((amet!==null||bmet!==null) ? cell('🎯 Metacritic', colorMeta(amet), false).replace(/style="color:#888;"/,'') + cell('🎯 Metacritic', colorMeta(bmet), false).replace(/style="color:#888;"/,'') : '')+
        row('🏆 '+(fa?'جوایز کسب‌شده':'Awards Won'), aa.hasData ? String(aa.wins) : '—', ba.hasData ? String(ba.wins) : '—', (aa.hasData && ba.hasData) ? aa.wins >= ba.wins : false)+
        row('🎖️ '+(fa?'نامزدی‌ها':'Nominations'), aa.hasData ? String(aa.noms) : '—', ba.hasData ? String(ba.noms) : '—', (aa.hasData && ba.hasData) ? aa.noms >= ba.noms : false)+
        '<div class="compare-awards-source">'+(fa?'منبع جوایز: OMDb/IMDb summary.':'Awards source: OMDb/IMDb summary.')+((!aa.hasData || !ba.hasData) ? (fa?' اثری که هنوز داده جوایز ندارد با \u2014 نشان داده می‌شود، نه صفر.':' Titles with no awards data yet show \u2014, not 0.') : '')+'</div>'+
        '<div style="grid-column:1/-1;padding:16px;"><button id="compare-ai-btn" onclick="runCompareAI()" style="width:100%;padding:14px;background:linear-gradient(135deg,#1a0a33,#3a1070);border:1px solid rgba(168,85,247,0.4);border-radius:14px;color:white;font-size:14px;font-weight:bold;cursor:pointer;font-family:\'Vazirmatn\',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;transition:0.2s;"><div style="width:22px;height:22px;background:linear-gradient(135deg,#7c3aed,#4285f4,#06b6d4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;">✦</div>'+(fa?'از هوش مصنوعی بپرس کدام بهتره؟':'Ask AI: Which one is better?')+'</button><div id="compare-ai-result" style="display:none;margin-top:14px;padding:14px;background:rgba(100,50,200,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:12px;"><div style="font-size:11px;color:#a855f7;margin-bottom:8px;display:flex;align-items:center;gap:6px;"><div style="width:16px;height:16px;background:linear-gradient(135deg,#7c3aed,#4285f4);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;color:white;">✦</div>'+(fa?'نظر هوش مصنوعی':'AI Analysis')+'</div><div id="compare-ai-text" style="font-size:13px;color:#e0e0e0;line-height:1.8;white-space:pre-wrap;"></div></div><div id="compare-ai-translate-wrap" style="display:none;margin-top:10px;text-align:center;"><button id="compare-ai-translate-btn" onclick="translateCompareAI()" style="padding:10px 18px;background:#1a1a2a;border:1px solid rgba(168,85,247,0.4);border-radius:999px;color:#e0e0e0;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">'+(fa?'🌐 Translate to English':'🌐 ترجمه به فارسی')+'</button></div></div>';
      compareItems = [];
      window._compareDataForAI = { a:a, b:b, aData:ad, bData:bd, aRate:ar, bRate:br, aVotes:av, bVotes:bv, aRuntime:aru, bRuntime:bru, aAwards:aa, bAwards:ba, aRT:art, bRT:brt, aMeta:amet, bMeta:bmet, aYear:ay, bYear:by };
    };
    showCompareModal.__fn401010 = true;
  }
  function updateVersion(){
    try { document.querySelectorAll('.fn-about-version').forEach(function(el){ el.textContent = '🚀 Family Night ' + FN_VER; }); } catch(e) {}
  }
  function init(){
    patchMakeCard(); patchRatingFunctions(); patchCompare(); updateVersion(); refreshVisibleRatingBadges(document); showOpinion(false,false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.addEventListener('load', function(){ setTimeout(init, 200); setTimeout(function(){ refreshVisibleRatingBadges(document); updateVersion(); }, 1200); });
})();

