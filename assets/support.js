// assets/support.js
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const USER_KEY = 'ayed_user_profile_v1';
  const RESULTS_KEY  = 'ayed_test_results_v1';

  const $ = (sel, root=document) => root.querySelector(sel);

  function load(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch(_){ return null; } }

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

  function setupSupportForm(){
    const form = $('#supportForm');
    if(!form) return;

    // Prefill
    const user = load(USER_KEY);
    if(user?.name) $('#supName').value = user.name;

    form.addEventListener('submit', (e)=>{
      e.preventDefault();

      const name = ($('#supName').value || '').trim();
      const contact = ($('#supContact').value || '').trim();
      const type = $('#supType').value;
      const order = ($('#supOrder').value || '').trim();
      const details = ($('#supDetails').value || '').trim();
      const fileName = $('#supFile')?.files?.[0]?.name || '';

      if(!name || !details){
        alert('فضلاً اكتب اسمك + تفاصيل المشكلة بشكل واضح ✅');
        return;
      }

      const tgUser = SD.brand?.telegramUsername || 'Ayed_Academy_2026';
      const tgUrlBase = `https://t.me/${encodeURIComponent(tgUser)}`;

      const results = load(RESULTS_KEY);

      const lines = [];
      lines.push(`**طلب دعم — ${SD.brand?.academyName || 'أكاديمية عايد'}**`);
      lines.push('');
      lines.push(`**بيانات الطالب**`);
      lines.push(`- الاسم: ${name}`);
      if(contact) lines.push(`- وسيلة التواصل/الرد: ${contact}`);
      if(order) lines.push(`- رقم/مرجع الطلب (إن وجد): ${order}`);
      lines.push(`- نوع المشكلة: ${type}`);
      lines.push('');
      if(results){
        lines.push(`**معلومة تساعدنا بسرعة**`);
        lines.push(`- نتيجة اختبار تحديد المستوى: ${results.percent}%`);
        lines.push(`- المستوى: ${levelLabel(results.level)} | أضعف قسم: ${sectionLabel(results.weakSection)}`);
        lines.push('');
      }
      lines.push(`**التفاصيل**`);
      lines.push(details);
      lines.push('');
      if(fileName){
        lines.push(`**مرفق**`);
        lines.push(`- اسم الملف المختار: ${fileName}`);
        lines.push(`- *سأرفقه هنا داخل المحادثة بعد إرسال الرسالة.*`);
        lines.push('');
      }
      lines.push('———');
      lines.push(`**تنبيه مهم ضد الاحتيال**: لا تشارك بياناتك/إيصالك مع أي حساب غير الحساب الرسمي (${SD.brand?.telegramUrl || ''}). إذا شفت حساب ينتحل اسم الأكاديمية — تجاهله وبلّغ عنه فوراً.`);

      const msg = lines.join('\n');
      const tgLink = `${tgUrlBase}?text=${encodeURIComponent(msg)}`;

      window.open(tgLink, '_blank');
      alert('تم تجهيز رسالة الدعم ✅\nأرسلها في تيليجرام ثم أرفق المرفقات داخل المحادثة.');
    });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    setupSupportForm();
  });

})();
