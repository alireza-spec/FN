
        (function(){
            try {
                var saved = localStorage.getItem('active_theme');
                if (!saved) localStorage.setItem('active_theme','softDarkGray');
            } catch(e) {}
        })();
    
;

(function(){
  function __fnHideBoot(){try{var e=document.getElementById('app-loading-screen');if(e && e.style.display!=='none'){e.classList.add('fade-out');setTimeout(function(){e.style.display='none';},700);}}catch(_){}}
  // Primary reveal at 1.5s; redundant fallback attempts guarantee the app is never permanently
  // blocked even if the teaser animation logic itself hits an error.
  setTimeout(__fnHideBoot,1500); setTimeout(__fnHideBoot,3000); setTimeout(__fnHideBoot,5000);

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
      var isFa = (localStorage.getItem('lang') || 'fa') === 'fa';
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
      var i = 0;
      renderFeature(0);
      var stepTimer = setInterval(function(){
        i = (i + 1) % features.length;
        if (track) track.style.transform = 'translateX(-' + (i * 20) + '%)';
        renderFeature(i);
      }, 1000);
      setTimeout(function(){ clearInterval(stepTimer); }, 1500);

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

