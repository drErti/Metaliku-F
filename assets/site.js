/* ÇELIKU-V — shared interactions */
(function(){
  "use strict";

  /* ---- Header: solid on scroll ---- */
  var hdr = document.querySelector('.hdr');
  var onDark = hdr && hdr.classList.contains('on-dark');
  function onScroll(){
    if(!hdr) return;
    var y = window.scrollY;
    if(y > 40){ hdr.classList.add('is-solid'); document.body.classList.add('tb-hide'); }
    else { hdr.classList.remove('is-solid'); document.body.classList.remove('tb-hide'); }
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- Mobile menu ---- */
  var burger = document.querySelector('.burger');
  var mmenu = document.querySelector('.mmenu');
  if(burger && mmenu){
    function setMenuOpen(open){
      mmenu.classList.toggle('open', open);
      burger.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function(){
      setMenuOpen(!mmenu.classList.contains('open'));
    });
    mmenu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        setMenuOpen(false);
      });
    });
  }

  /* ---- Scroll reveals ---- */
  var revs = document.querySelectorAll('[data-reveal],.clip-reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
    revs.forEach(function(el){ io.observe(el); });
  } else {
    revs.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---- Count-up stats ---- */
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = (el.getAttribute('data-dec')|0);
    var dur = 1600, t0 = null;
    function step(ts){
      if(!t0) t0 = ts;
      var p = Math.min((ts - t0)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      var val = target * eased;
      el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString('de-DE');
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = dec ? target.toFixed(dec) : target.toLocaleString('de-DE');
    }
    requestAnimationFrame(step);
  }
  var counts = document.querySelectorAll('[data-count]');
  if(counts.length && 'IntersectionObserver' in window){
    var io2 = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ animateCount(e.target); io2.unobserve(e.target); }
      });
    }, {threshold:.6});
    counts.forEach(function(el){ io2.observe(el); });
  } else {
    counts.forEach(function(el){ el.textContent = el.getAttribute('data-count'); });
  }

  /* ---- Subtle parallax on [data-par] ---- */
  var pars = document.querySelectorAll('[data-par]');
  if(pars.length){
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(function(){
        var vh = window.innerHeight;
        pars.forEach(function(el){
          var r = el.getBoundingClientRect();
          var amt = parseFloat(el.getAttribute('data-par')) || 0.12;
          var off = ((r.top + r.height/2) - vh/2) * -amt;
          el.style.transform = 'translateY(' + off.toFixed(1) + 'px)';
        });
        ticking = false;
      });
    }, {passive:true});
  }

  /* ---- Projects filter (projektet.html) ---- */
  var filterBar = document.querySelector('[data-filter-bar]');
  var gal = document.querySelector('.gal');
  if(filterBar && gal){
    var items = gal.querySelectorAll('[data-cat]');
    filterBar.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click', function(){
        filterBar.querySelectorAll('button').forEach(function(x){x.classList.remove('is-on');});
        b.classList.add('is-on');
        var f = b.getAttribute('data-f');
        items.forEach(function(it){
          var show = (f === 'all' || it.getAttribute('data-cat') === f);
          it.classList.toggle('is-filtered-out', !show);
        });
      });
    });
  }

  /* ---- Quote form (kontakt.html) ---- */
  var form = document.querySelector('[data-quote]');
  if(form){
    var fields = form.querySelectorAll('[required]');
    function validate(field){
      var ok = true, val = (field.value||'').trim();
      if(!val) ok = false;
      if(field.type === 'email' && val) ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val);
      field.closest('.field').classList.toggle('err', !ok);
      return ok;
    }
    fields.forEach(function(f){
      f.addEventListener('blur', function(){ validate(f); });
      f.addEventListener('input', function(){
        if(f.closest('.field').classList.contains('err')) validate(f);
      });
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var allok = true;
      fields.forEach(function(f){ if(!validate(f)) allok = false; });
      if(!allok){
        var first = form.querySelector('.field.err [required]');
        if(first) first.focus();
        return;
      }
      form.classList.add('sent');
    });
    var resetBtn = form.parentNode.querySelector('[data-reset]');
    if(resetBtn){
      resetBtn.addEventListener('click', function(){
        form.reset();
        form.classList.remove('sent');
        form.querySelectorAll('.field').forEach(function(fl){fl.classList.remove('err');});
      });
    }
  }

  /* ---- Year stamp ---- */
  document.querySelectorAll('[data-year]').forEach(function(el){
    el.textContent = new Date().getFullYear();
  });

  /* ---- Video showreel modal ---- */
  var vmodal = document.querySelector('.vmodal');
  if(vmodal){
    var openers = document.querySelectorAll('[data-video-open]');
    var closer = vmodal.querySelector('.vmodal__close');
    function openV(){ vmodal.classList.add('open'); document.body.style.overflow='hidden'; }
    function closeV(){ vmodal.classList.remove('open'); document.body.style.overflow='';
      var v = vmodal.querySelector('video'); if(v){ v.pause(); } }
    openers.forEach(function(o){ o.addEventListener('click', openV); });
    if(closer) closer.addEventListener('click', closeV);
    vmodal.addEventListener('click', function(e){ if(e.target === vmodal) closeV(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && vmodal.classList.contains('open')) closeV(); });
  }

  /* ---- Cost calculator ---- */
  var calc = document.querySelector('[data-calc]');
  if(calc){
    var TYPES = {
      logjistike:{name:'Logjistikë & Depo', kg:45, pmin:260, pmax:340, wk:0},
      prodhim:   {name:'Hale Prodhimi',     kg:60, pmin:320, pmax:430, wk:2},
      markete:   {name:'Markete & Retail',  kg:40, pmin:300, pmax:400, wk:0},
      sport:     {name:'Hale Sportive',     kg:50, pmin:290, pmax:390, wk:1},
      bujqesore: {name:'Bujqësore',         kg:30, pmin:180, pmax:250, wk:-1},
      speciale:  {name:'Projekte Speciale', kg:70, pmin:420, pmax:650, wk:4}
    };
    var st = {type:'logjistike', w:20, l:40, h:7, insul:true};
    var $ = function(s){ return calc.querySelector(s); };
    function eur(n){ return '€' + (Math.round(n/1000)*1000).toLocaleString('de-DE'); }

    function render(){
      var d = TYPES[st.type];
      var area = st.w * st.l;
      var hf = 1 + Math.max(0, st.h - 6) * 0.02;
      var ins = st.insul ? 1.08 : 1;
      var steel = area * (d.kg + Math.max(0, st.h - 6) * 1.5) / 1000;
      var pmin = area * d.pmin * hf * ins;
      var pmax = area * d.pmax * hf * ins;
      var weeks = Math.max(6, Math.ceil(area / 700) + 6 + d.wk);
      // slider value labels
      $('[data-v=w]').textContent = st.w;
      $('[data-v=l]').textContent = st.l;
      $('[data-v=h]').textContent = st.h;
      // results
      $('[data-r=price]').textContent = eur(pmin) + ' – ' + eur(pmax);
      $('[data-r=ppm]').textContent = Math.round(d.pmin*hf*ins) + '–' + Math.round(d.pmax*hf*ins) + ' €/m²';
      $('[data-r=area]').innerHTML = area.toLocaleString('de-DE') + '<span class="u">m²</span>';
      $('[data-r=steel]').innerHTML = steel.toFixed(1) + '<span class="u">t</span>';
      $('[data-r=dim]').innerHTML = st.w + '×' + st.l + '<span class="u">m</span>';
      $('[data-r=weeks]').innerHTML = weeks + '<span class="u">javë</span>';
    }
    // type tiles
    calc.querySelectorAll('.ctype').forEach(function(b){
      b.addEventListener('click', function(){
        calc.querySelectorAll('.ctype').forEach(function(x){x.classList.remove('on');});
        b.classList.add('on');
        st.type = b.getAttribute('data-t');
        render();
      });
    });
    // sliders
    ['w','l','h'].forEach(function(k){
      var el = $('[data-s='+k+']');
      if(el) el.addEventListener('input', function(){ st[k] = +el.value; render(); });
    });
    var ins = $('[data-insul]');
    if(ins) ins.addEventListener('change', function(){ st.insul = ins.checked; render(); });
    render();
  }

  /* ---- Process steps: staircase animation ---- */
  function triggerSteps(proc){
    if(proc._stepsTriggered) return;
    proc._stepsTriggered = true;
    proc.classList.add('steps-in');
    proc.querySelectorAll('.step').forEach(function(step, i){
      setTimeout(function(){ step.classList.add('in'); }, 50 + i * 140);
    });
  }
  var procs = document.querySelectorAll('[data-steps]');
  procs.forEach(function(p){
    if('IntersectionObserver' in window){
      var procIo = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(!e.isIntersecting) return;
          triggerSteps(e.target);
          procIo.disconnect();
        });
      }, {threshold:.05});
      procIo.observe(p);
    } else {
      triggerSteps(p);
    }
  });

  /* ---- Page transition ---- */
  var veil = document.createElement('div');
  veil.id = 'pg-veil';
  document.body.appendChild(veil);

  // Fade in: remove the opaque cover one frame after paint
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){ veil.classList.add('pg-in'); });
  });

  // Fade out before navigating to an internal link
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href]');
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href) return;
    // Skip anchors, external links, tel/mailto, _blank targets
    if(href.charAt(0)==='#') return;
    if(/^(https?:)?\/\/|^tel:|^mailto:/i.test(href)) return;
    if(a.target && a.target.toLowerCase()==='_blank') return;
    e.preventDefault();
    veil.classList.remove('pg-in');
    setTimeout(function(){ window.location.href = href; }, 360);
  });

})();
