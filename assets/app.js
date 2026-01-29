// assets/app.js
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const now = () => new Date();

  function safeText(str){ return (str ?? '').toString(); }

  function setWatermark(){
    const wm = SD.brand?.watermarkText || SD.brand?.academyName || 'أكاديمية عايد';
    document.body.setAttribute('data-watermark', wm);
  }

  function setActiveNav(){
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.nav a, .drawer nav a').forEach(a=>{
      const href = (a.getAttribute('href')||'').toLowerCase();
      if(!href) return;
      if(href === path) a.classList.add('active');
    });
  }

  // Soft navigation (optional) — View Transitions API if available
  function setupSoftNav(){
    if(!SD.ui?.enableSoftNav) return;

    document.addEventListener('click', (e)=>{
      const a = e.target.closest('a');
      if(!a) return;
      const href = a.getAttribute('href') || '';
      if(!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if(href.startsWith('#')) return; // local anchor
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // Only .html pages
      if(!href.endsWith('.html') && !href.endsWith('.html#') && !href.includes('.html#')) return;

      // Same page?
      const current = (location.pathname.split('/').pop() || 'index.html');
      if(href.split('#')[0] === current) return;

      e.preventDefault();

      const go = ()=>{ window.location.href = href; };

      if(document.startViewTransition){
        try{
          document.startViewTransition(()=>go());
        }catch(_){ go(); }
      }else{
        document.documentElement.style.opacity = '0.98';
        setTimeout(go, 60);
      }
    });
  }

  function setupDrawer(){
    const btn = $('[data-open-drawer]');
    const closeBtn = $('[data-close-drawer]');
    const backdrop = $('.drawer-backdrop');
    const drawer = $('.drawer');

    const open = ()=>{
      backdrop?.classList.add('open');
      drawer?.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = ()=>{
      backdrop?.classList.remove('open');
      drawer?.classList.remove('open');
      document.body.style.overflow = '';
    };

    btn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    backdrop?.addEventListener('click', close);
    $$('.drawer a').forEach(a=>a.addEventListener('click', close));
  }

  // Toasts
  function createToast(text){
    const host = $('.toast-container');
    if(!host) return;
    const wrap = document.createElement('div');
    wrap.className = 'toast';
    wrap.innerHTML = `
      <div class="bubble" aria-hidden="true">⭐</div>
      <div>
        <p>${escapeHtml(text)}</p>
        <small>قبل لحظات</small>
      </div>
    `;
    host.appendChild(wrap);
    setTimeout(()=>{ wrap.style.opacity='0'; wrap.style.transform='translateY(6px)'; }, 5200);
    setTimeout(()=>{ wrap.remove(); }, 6100);
  }

  function setupToasts(){
    if(!SD.ui?.enableToasts) return;
    const list = window.NOTIFICATIONS_TEXT || [];
    if(!Array.isArray(list) || list.length === 0) return;

    const interval = Math.max(6500, SD.ui?.toastsIntervalMs || 9000);

    // Start after a short delay (avoid annoying user instantly)
    let timer = null;
    const tick = ()=>{
      const item = list[Math.floor(Math.random()*list.length)];
      if(item) createToast(item);
      timer = setTimeout(tick, interval);
    };

    setTimeout(tick, 2500);

    // Stop when tab hidden (performance)
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){
        if(timer) clearTimeout(timer);
        timer = null;
      }else{
        if(!timer) setTimeout(tick, 1400);
      }
    });
  }

  // Simple assistant (menu + canned answers)
  function setupAssistant(){
    const fab = $('.assistant-fab');
    const panel = $('.assistant-panel');
    const close = $('[data-close-assistant]');
    const chat = $('.chat');
    const input = $('#assistantInput');
    const send = $('#assistantSend');

    const quick = $$('.chip[data-q]');
    const push = (text, who='bot')=>{
      if(!chat) return;
      const b = document.createElement('div');
      b.className = 'bubble' + (who==='me' ? ' me':'');
      b.innerHTML = escapeHtml(text).replace(/\n/g,'<br>');
      chat.appendChild(b);
      chat.scrollTop = chat.scrollHeight;
    };

    const open = ()=>{
      panel?.classList.add('open');
      if(chat && chat.children.length === 0){
        push(`هلا وغلا 👋\nأنا مساعد التسجيل من ${SD.brand?.academyName || 'أكاديمية عايد'}.\nاختر أحد الخيارات السريعة أو اكتب سؤالك.`);
      }
    };
    const shut = ()=> panel?.classList.remove('open');

    fab?.addEventListener('click', ()=> panel?.classList.contains('open') ? shut() : open());
    close?.addEventListener('click', shut);

    quick.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const q = btn.getAttribute('data-q');
        handleQuestion(q);
      });
    });

    function handleQuestion(q){
      const qq = safeText(q).toLowerCase();
      push(q, 'me');

      const tg = SD.brand?.telegramUrl || 'https://t.me/' + (SD.brand?.telegramUsername || '');
      const bank = SD.bank || {};
      const price = SD.pricing || {};
      const models = (SD.exam?.modelsReference || []).join('، ');

      let answer = "";
      if(qq.includes('السعر') || qq.includes('كم') || qq.includes('خصم')){
        answer = `سعر الدورة الآن: ${price.discountPrice} ${price.currency} (بدل ${price.officialPrice} ${price.currency}) — العرض لمدة 7 أيام.\nبعد انتهاء العرض يرجع السعر الرسمي تلقائياً.`;
      }else if(qq.includes('التسجيل') || qq.includes('اشترك') || qq.includes('الدفع')){
        answer = `خطوات الاشتراك سهلة:\n1) ابدأ اختبار تحديد المستوى (50 سؤال).\n2) تظهر لك الخطة + زر التسجيل.\n3) حوّل على البيانات الرسمية داخل صفحة التسجيل.\n4) عبّي النموذج وارفع الإيصال — وبزر واحد تفتح لك رسالة جاهزة على تيليجرام للتأكيد.`;
      }else if(qq.includes('الاختبار') || qq.includes('تحديد المستوى') || qq.includes('كم سؤال')){
        answer = `اختبار تحديد المستوى عندنا 50 سؤال (Grammar/Reading/Listening) — أسئلة محاكاة مبنية على نمط النماذج الحديثة حتى نموذج ${models}.\nبعد الاختبار تطلع لك نتيجة + خطة تناسب وقتك.`;
      }else if(qq.includes('التحويل') || qq.includes('الايبان') || qq.includes('الحساب')){
        answer = `بيانات التحويل الرسمية:\n• البنك: ${bank.bankName}\n• رقم الحساب: ${bank.accountNumber}\n• الآيبان: ${bank.iban}\n• المستفيد: ${bank.beneficiary}\n\nتنبيه: لا تحول لأي جهة غير هذه البيانات.`;
      }else if(qq.includes('استرجاع') || qq.includes('استرداد')){
        answer = `سياسة الاسترجاع موجودة داخل صفحة التسجيل (نافذة منبثقة) — وتوضح الحالات المقبولة وخطوات الطلب.\nتقدر تفتحها من زر “سياسة الاسترجاع” داخل نفس الصفحة.`;
      }else if(qq.includes('تواصل') || qq.includes('دعم') || qq.includes('مشكلة')){
        answer = `أكيد — صفحة الدعم تساعدك ترسل تفاصيل مشكلتك بشكل مرتب.\nممكن تفتح صفحة الدعم الآن: support.html\nأو تواصل عبر تيليجرام: ${tg}`;
      }else{
        answer = `وصلني سؤالك ✅\nلأفضل توجيه: قل لي “موعد اختبارك” و”أضعف قسم” و”هدفك” — وأنا أوجهك للخطوة الجاية داخل الموقع.\n(إذا تبغى تأكيد دفع: جهّز الإيصال ثم ادخل صفحة التسجيل بعد الاختبار).`;
      }

      setTimeout(()=>push(answer,'bot'), 350);
    }

    function handleFreeText(){
      const v = safeText(input?.value).trim();
      if(!v) return;
      input.value = "";
      handleQuestion(v);
    }
    send?.addEventListener('click', handleFreeText);
    input?.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handleFreeText(); });
  }

  // Install banner
  function setupInstallBanner(){
    if(!SD.ui?.enableInstallBanner) return;

    const banner = $('.install-banner');
    const btn = $('#installBtn');
    const close = $('#installClose');
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e)=>{
      e.preventDefault();
      deferredPrompt = e;
      banner?.classList.add('show');
    });

    btn?.addEventListener('click', async ()=>{
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      try{ await deferredPrompt.userChoice; }catch(_){}
      deferredPrompt = null;
      banner?.classList.remove('show');
    });

    close?.addEventListener('click', ()=> banner?.classList.remove('show'));

    // iOS hint (no beforeinstallprompt)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if(isIOS && !isInStandalone){
      // Show a gentle hint once
      const key = 'ayed_install_ios_hint_v1';
      if(!localStorage.getItem(key)){
        localStorage.setItem(key, '1');
        setTimeout(()=>{
          banner?.classList.add('show');
          const p = banner?.querySelector('.txt .t p');
          if(p){
            p.textContent = 'على iPhone: افتح مشاركة Safari ثم اختر “Add to Home Screen” لتثبيت الموقع كتطبيق.';
          }
          if(btn) btn.classList.add('hidden'); // no prompt on iOS
        }, 1400);
      }
    }
  }

  // SW register (PWA)
  function registerSW(){
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }

  // Helpers
  function escapeHtml(str){
    return safeText(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    setWatermark();
    setActiveNav();
    setupSoftNav();
    setupDrawer();
    setupToasts();
    setupAssistant();
    setupInstallBanner();
    registerSW();
  });

})();
