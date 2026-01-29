// assets/register.js
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const PRICE = SD.pricing || {};
  const SEATS = SD.seats || {};
  const BANK = SD.bank || {};

  const COMPLETED_KEY = 'ayed_test_completed_v1';
  const RESULTS_KEY  = 'ayed_test_results_v1';
  const USER_KEY = 'ayed_user_profile_v1';
  const PLAN_SUMMARY_KEY = 'ayed_plan_summary_v1';

  const SEATS_KEY = 'ayed_seats_state_v2';

  const $ = (sel, root=document) => root.querySelector(sel);

  function load(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch(_){ return null; } }
  function save(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }

  function isCompleted(){ return localStorage.getItem(COMPLETED_KEY) === '1'; }

  function fmt(n){ return new Intl.NumberFormat('ar-SA').format(n); }

  function sectionLabel(sec){
    if(sec === 'Grammar') return 'القواعد';
    if(sec === 'Reading') return 'القراءة';
    if(sec === 'Listening') return 'الاستماع';
    return sec;
  }

  function levelLabel(level){
    if(level === 'Advanced') return 'متقدم';
    if(level === 'Beginner') return 'مبتدئ';
    return 'متوسط';
  }

  // Discount timer
  function setupDiscount(){
    const ends = PRICE.discountEndsAtISO ? new Date(PRICE.discountEndsAtISO) : null;
    const elPrice = $('#priceNow');
    const elOld = $('#priceOld');
    const elEnds = $('#discountEnds');
    const elTimer = $('#discountTimer');
    const elBadge = $('#discountBadge');

    function tick(){
      const now = new Date();
      let active = true;
      if(ends && now > ends) active = false;

      if(active){
        elPrice.textContent = fmt(PRICE.discountPrice) + ' ' + PRICE.currency;
        elOld.textContent = fmt(PRICE.officialPrice) + ' ' + PRICE.currency;
        elOld.classList.remove('hidden');
        elBadge.textContent = PRICE.discountLabel || 'عرض خاص';
      }else{
        elPrice.textContent = fmt(PRICE.officialPrice) + ' ' + PRICE.currency;
        elOld.classList.add('hidden');
        elBadge.textContent = 'انتهى العرض';
      }

      if(ends){
        const diff = Math.max(0, ends - now);
        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff / (1000*60*60)) % 24);
        const m = Math.floor((diff / (1000*60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        elTimer.textContent = `${d} يوم ${h} ساعة ${m} دقيقة ${s} ثانية`;
        elEnds.textContent = ends.toLocaleString('ar-SA');
      }else{
        elTimer.textContent = '—';
        elEnds.textContent = '—';
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  // Seats counter (client-side)
  function setupSeats(){
    const elSeats = $('#seatsCount');
    const elNext = $('#seatsNextTick');
    const elNote = $('#seatsNote');

    const interval = Math.max(15, SEATS.decreaseEverySeconds || 40);
    const refillThreshold = Math.max(0, SEATS.refillThreshold || 5);
    const refillAmount = Math.max(0, SEATS.refillAmount || 50);

    // load state
    let state = load(SEATS_KEY);
    if(!state || typeof state.count !== 'number' || !state.lastTick){
      state = { count: SEATS.initial || 250, lastTick: Date.now(), refills: 0 };
      save(SEATS_KEY, state);
    }

    function applyCatchup(){
      const now = Date.now();
      const elapsed = Math.floor((now - state.lastTick) / 1000);
      if(elapsed <= 0) return;

      const steps = Math.floor(elapsed / interval);
      if(steps > 0){
        state.count = Math.max(0, state.count - steps);
        state.lastTick = state.lastTick + steps * interval * 1000;
      }

      // Auto-refill once we hit threshold
      if(state.count <= refillThreshold){
        state.count = state.count + refillAmount;
        state.refills = (state.refills || 0) + 1;
        state.lastTick = now;
        try{
          // use global toast if available
          if(window.NOTIFICATIONS_TEXT) {
            // no-op
          }
          showSeatToast(`تم فتح دفعة إضافية (+${refillAmount}) لكثرة الطلب ✅`);
        }catch(_){}
      }

      save(SEATS_KEY, state);
    }

    function showSeatToast(text){
      const host = document.querySelector('.toast-container');
      if(!host) return;
      const wrap = document.createElement('div');
      wrap.className = 'toast';
      wrap.innerHTML = `<div class="bubble">🔥</div><div><p>${escapeHtml(text)}</p><small>تحديث الآن</small></div>`;
      host.appendChild(wrap);
      setTimeout(()=>{ wrap.style.opacity='0'; wrap.style.transform='translateY(6px)'; }, 5200);
      setTimeout(()=>{ wrap.remove(); }, 6100);
    }

    function tick(){
      applyCatchup();

      elSeats.textContent = fmt(state.count);
      const remain = interval - Math.floor((Date.now() - state.lastTick)/1000);
      elNext.textContent = (remain > 0 ? remain : interval) + ' ثانية';
      elNote.textContent = 'المقاعد تُحدّث تلقائيًا وقد تُفتح دفعات إضافية حسب الطلب.';
    }

    tick();
    setInterval(tick, 1000);
  }

  // Bank copy
  function setupCopy(){
    const map = {
      bankName: BANK.bankName,
      accountNumber: BANK.accountNumber,
      iban: BANK.iban,
      beneficiary: BANK.beneficiary
    };
    document.querySelectorAll('[data-copy]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const key = btn.getAttribute('data-copy');
        const val = map[key];
        if(!val) return;
        try{
          await navigator.clipboard.writeText(val);
          btn.textContent = 'تم النسخ ✅';
          setTimeout(()=>btn.textContent='نسخ', 1200);
        }catch(_){
          prompt('انسخ القيمة:', val);
        }
      });
    });
  }

  // Modals
  function setupModals(){
    const backdrop = document.querySelector('.modal-backdrop');
    const modals = {
      terms: document.querySelector('#termsModal'),
      privacy: document.querySelector('#privacyModal'),
      refund: document.querySelector('#refundModal'),
    };

    function open(id){
      backdrop?.classList.add('open');
      modals[id]?.classList.add('open');
    }
    function close(){
      backdrop?.classList.remove('open');
      Object.values(modals).forEach(m=>m?.classList.remove('open'));
    }

    document.querySelectorAll('[data-open-modal]').forEach(b=>{
      b.addEventListener('click', ()=>{
        open(b.getAttribute('data-open-modal'));
      });
    });
    document.querySelectorAll('[data-close-modal]').forEach(b=> b.addEventListener('click', close));
    backdrop?.addEventListener('click', close);
  }

  // Registration form -> open Telegram with prepared message
  function setupForm(){
    const form = document.querySelector('#registerForm');
    if(!form) return;

    const receipt = document.querySelector('#receipt');
    const missingBox = document.querySelector('#missingReceiptBox');
    const btnGoPay = document.querySelector('#btnGoPay');

    btnGoPay?.addEventListener('click', ()=>{
      document.querySelector('#paymentCard')?.scrollIntoView({behavior:'smooth', block:'start'});
    });

    form.addEventListener('submit', (e)=>{
      e.preventDefault();

      // Gate
      if(!isCompleted()){
        alert('فضلاً: ابدأ باختبار تحديد المستوى أولاً — بعدها تتفتح لك صفحة التسجيل كاملة ✅');
        window.location.href = 'level-test.html';
        return;
      }

      const name = (document.querySelector('#studentName').value || '').trim();
      const contactType = document.querySelector('#contactType').value;
      const contactValue = (document.querySelector('#contactValue').value || '').trim();
      const examDate = document.querySelector('#examDate').value;
      const region = document.querySelector('#studentRegion').value;
      const notes = (document.querySelector('#notes').value || '').trim();

      const agree1 = document.querySelector('#agree1').checked;
      const agree2 = document.querySelector('#agree2').checked;
      const agree3 = document.querySelector('#agree3').checked;

      if(!name){
        alert('اكتب اسمك في النموذج ✨');
        document.querySelector('#studentName').focus();
        return;
      }

      // Receipt required (we cannot upload it — user will attach inside Telegram)
      const fileName = receipt?.files?.[0]?.name || '';
      if(!fileName){
        missingBox?.classList.remove('hidden');
        missingBox?.scrollIntoView({behavior:'smooth', block:'center'});
        return;
      }else{
        missingBox?.classList.add('hidden');
      }

      if(!agree1 || !agree2 || !agree3){
        alert('لازم توافق على التعهدات والسياسات قبل إرسال الطلب ✅');
        return;
      }

      // Build Telegram message
      const tgUser = SD.brand?.telegramUsername || 'Ayed_Academy_2026';
      const tgUrlBase = `https://t.me/${encodeURIComponent(tgUser)}`;

      const results = load(RESULTS_KEY);
      const user = load(USER_KEY);
      const planSummary = localStorage.getItem(PLAN_SUMMARY_KEY) || '';

      const priceNow = (new Date() <= new Date(PRICE.discountEndsAtISO)) ? PRICE.discountPrice : PRICE.officialPrice;
      const priceLabel = (new Date() <= new Date(PRICE.discountEndsAtISO)) ? 'السعر المخفض' : 'السعر الرسمي';

      const lines = [];
      lines.push(`**طلب اشتراك جديد — ${SD.brand?.courseName || 'دورة STEP'}**`);
      lines.push('');
      lines.push(`**بيانات الطالب**`);
      lines.push(`- الاسم: ${name}`);
      if(examDate) lines.push(`- موعد الاختبار: ${examDate}`);
      if(region) lines.push(`- المنطقة: ${region}`);
      if(contactValue) lines.push(`- وسيلة التواصل: ${contactType} — ${contactValue}`);
      if(notes) lines.push(`- ملاحظات: ${notes}`);
      lines.push('');
      if(results){
        lines.push(`**ملخص اختبار تحديد المستوى**`);
        lines.push(`- النسبة العامة: ${results.percent}%`);
        lines.push(`- المستوى: ${levelLabel(results.level)}`);
        lines.push(`- أضعف قسم: ${sectionLabel(results.weakSection)} (${results.breakdown[results.weakSection].percent}%)`);
        lines.push('');
      }
      if(planSummary){
        lines.push(planSummary);
        lines.push('');
      }else{
        lines.push(`**الخطة**: تظهر بعد إنهاء اختبار تحديد المستوى.`);
        lines.push('');
      }

      lines.push(`**تفاصيل الدفع**`);
      lines.push(`- ${priceLabel}: ${priceNow} ${PRICE.currency}`);
      lines.push(`- تم التحويل على البيانات الرسمية بالموقع ✅`);
      lines.push('');
      lines.push(`**بيانات التحويل (للتأكيد)**`);
      lines.push(`- البنك: ${BANK.bankName}`);
      lines.push(`- رقم الحساب: ${BANK.accountNumber}`);
      lines.push(`- الآيبان: ${BANK.iban}`);
      lines.push(`- المستفيد: ${BANK.beneficiary}`);
      lines.push('');
      lines.push(`**الإيصال**`);
      lines.push(`- تم اختيار ملف الإيصال: ${fileName}`);
      lines.push(`- *سأرفق الإيصال هنا داخل المحادثة الآن للتأكيد النهائي.*`);
      lines.push('');
      lines.push(`———`);
      lines.push(`**تنبيه لطيف**: لتسريع الرد لا تكرر الرسالة. ${SD.support?.replySla || ''}`);

      const msg = lines.join('\n');
      const tgLink = `${tgUrlBase}?text=${encodeURIComponent(msg)}`;

      // Open Telegram
      window.open(tgLink, '_blank');

      // Friendly confirmation UI
      alert('تم تجهيز رسالة التأكيد ✅\nالآن افتح تيليجرام وأرسل الرسالة ثم أرفق الإيصال داخل المحادثة.');
    });
  }

  function setupGate(){
    const lock = document.querySelector('#lockOverlay');
    const unlock = isCompleted();
    if(unlock){
      lock?.classList.add('hidden');
      document.querySelectorAll('[data-locked]').forEach(el=> el.classList.remove('hidden'));
    }else{
      lock?.classList.remove('hidden');
      document.querySelectorAll('[data-locked]').forEach(el=> el.classList.add('hidden'));
    }
  }

  function escapeHtml(str){
    return (str ?? '').toString()
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    setupGate();
    setupDiscount();
    setupSeats();
    setupCopy();
    setupModals();
    setupForm();

    // Prefill from profile
    const user = load(USER_KEY);
    if(user?.name) document.querySelector('#studentName').value = user.name;

    // Show a gentle anti-scam note
    const safety = SD.support?.safetyNote;
    if(safety){
      const el = document.querySelector('#safetyNote');
      if(el) el.textContent = safety;
    }
  });

})();
