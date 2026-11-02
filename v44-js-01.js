
        (function(){
            try {
                var saved = localStorage.getItem('active_theme');
                if (!saved) localStorage.setItem('active_theme','softDarkGray');
            } catch(e) {}
        })();
    
;

(function(){
  function __fnHideBoot(){try{var e=document.getElementById('app-loading-screen');if(e && e.style.display!=='none'){e.classList.add('fade-out');setTimeout(function(){e.style.display='none';},700);} if (window.__fnSplashStepTimer) { clearInterval(window.__fnSplashStepTimer); window.__fnSplashStepTimer = null; }}catch(_){}}
  // Hide the boot splash only once the Home first paint is done, so the
  // user never sits on a half-empty Home after the splash animation ends.
  // Minimum 1.5s (the splash itself stays visible); 12s safety cap so a
  // broken Home can never trap the user on the splash forever. Home
  // readiness = renderHome finished AND (a row already has cards, or
  // 2.5s passed since the shell rendered, covering failed live rows).
  (function(){
    var __fnBootStart = Date.now();
    var __fnBootTimer = setInterval(function(){
      try {
        var elapsed = Date.now() - __fnBootStart;
        var shellAt = window.__fnHomeShellAt || 0;
        var rowFilled = false;
        if (shellAt) {
          var rows = document.querySelectorAll('#home-content .row-scroll');
          for (var i = 0; i < rows.length; i++) { if (rows[i].children.length > 0) { rowFilled = true; break; } }
        }
        var ready = shellAt && (rowFilled || (Date.now() - shellAt > 2500));
        if ((ready && elapsed >= 1500) || elapsed >= 12000) {
          clearInterval(__fnBootTimer);
          __fnHideBoot();
        }
      } catch(_) { clearInterval(__fnBootTimer); __fnHideBoot(); }
    }, 200);
  })();

  var FEATURES_FA = [
    { icon:'fa-magnifying-glass', text:'جستجوی آنی و کشف هوشمند فیلم و سریال' },
    { icon:'fa-film', text:'آرشیو کامل و به‌روز جهانی فیلم و سریال' },
    { icon:'fa-layer-group', text:'بیش از ۲۰۰ مجموعه و فرنچایز واقعی سینمایی' },
    { icon:'fa-compass', text:'اکسپلور سینمایی — ادیت و صحنه از سراسر وب' },
    { icon:'fa-brain', text:'تست، کوییز و دستیار هوشمند فیلم' }
  ];
  var FEATURES_EN = [
    { icon:'fa-magnifying-glass', text:'Instant search & smart movie discovery' },
    { icon:'fa-film', text:'A complete, up-to-date global archive' },
    { icon:'fa-layer-group', text:'200+ real movie collections & franchises' },
    { icon:'fa-compass', text:'Cinematic Explore — edits & scenes from the web' },
    { icon:'fa-brain', text:'Trivia quizzes & an AI movie assistant' }
  ];

  function initSplash(){
    try {
      var track = document.getElementById('splash-phone-track');
      var featureWrap = document.getElementById('splash-feature-wrap');
      var fill = document.getElementById('splash-progress-fill');
      var pct = document.getElementById('splash-progress-pct');
      var isFa = (localStorage.getItem('lang') || 'en') === 'fa';
      var features = isFa ? FEATURES_FA : FEATURES_EN;

      function renderFeature(i){
        if (!featureWrap) return;
        var f = features[i];
        featureWrap.innerHTML = '<div class="splash-feature-item" id="splash-feature-item">' +
            '<i class="fa-solid ' + f.icon + ' splash-feature-icon"></i>' +
            '<div class="splash-feature-text">' + f.text + '</div>' +
        '</div>';
        requestAnimationFrame(function(){
          var el = document.getElementById('splash-feature-item');
          if (el) el.classList.add('show');
        });
      }

      // Swipe through the 5 phone screens and rotate the matching feature line together, once per second.
      // Keeps cycling until the boot splash hides (js01 gate), instead of
      // freezing on the last feature while Home is still loading.
      var i = 0;
      renderFeature(0);
      var stepTimer = setInterval(function(){
        i = (i + 1) % features.length;
        if (track) track.style.transform = 'translateX(-' + (i * 20) + '%)';
        renderFeature(i);
      }, 1000);
      window.__fnSplashStepTimer = stepTimer;

      // Percentage-synced progress bar — reaches exactly 100% at the 1.5s mark.
      var elapsed = 0;
      var pctTimer = setInterval(function(){
        elapsed += 50;
        var p = Math.min(100, Math.round((elapsed / 1500) * 100));
        if (fill) fill.style.width = p + '%';
        if (pct) pct.textContent = p + '%';
        if (p >= 100) clearInterval(pctTimer);
      }, 50);
    } catch(_) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSplash);
  else initSplash();
})();

