// assets/results.js
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const RESULTS_KEY  = 'ayed_test_results_v1';
  const USER_KEY = 'ayed_user_profile_v1';
  const PLAN_SUMMARY_KEY = 'ayed_plan_summary_v1';

  const $ = (sel, root=document) => root.querySelector(sel);

  function load(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch(_){ return null; } }
  function save(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }

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

  function starSvg(on){
    return on
      ? '<svg class="star-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.3l-6.2 3.7 1.7-7.1L2 9.2l7.3-.6L12 2l2.7 6.6 7.3.6-5.5 4.7 1.7 7.1z"/></svg>'
      : '<svg class="star-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.3l-6.2 3.7 1.7-7.1L2 9.2l7.3-.6L12 2l2.7 6.6 7.3.6-5.5 4.7 1.7 7.1z"/></svg>';
  }

  function renderStars(n){
    let html = '<span class="stars" aria-label="تقييم">';
    for(let i=1;i<=5;i++) html += starSvg(i<=n);
    html += '</span>';
    return html;
  }

  function percentBar(p){
    const pct = Math.max(0, Math.min(100, p||0));
    return `
      <div class="progressbar" style="margin-top:8px">
        <div style="width:${pct}%;"></div>
      </div>
    `;
  }

  function buildPlanSummaryText(user, results, plan){
    const models = (SD.exam?.modelsReference || []).join('، ');
    const lines = [];
    lines.push(`**ملخص نتيجة اختبار تحديد المستوى**`);
    lines.push(`- النسبة العامة: ${results.percent}%`);
    lines.push(`- المستوى المقترح: ${levelLabel(results.level)}`);
    lines.push(`- أضعف قسم: ${sectionLabel(results.weakSection)} (${results.breakdown[results.weakSection].percent}%)`);
    lines.push('');
    lines.push(`**الخطة المقترحة: ${plan.title}**`);
    if(plan.focusNote) lines.push(`- ${plan.focusNote}`);
    if(plan.levelNote) lines.push(`- ${plan.levelNote}`);
    lines.push('');
    lines.push(`**ملاحظة مهمة**`);
    lines.push(`الأسئلة محاكاة مبنية على نمط النماذج الحديثة حتى نموذج ${models} — وأي نماذج جديدة تُضاف للمشتركين داخل قنوات الدورة.`);
    return lines.join('\n');
  }

  function buildShareText(user, results, plan){
    const models = (SD.exam?.modelsReference || []).join('، ');
    const name = user?.name ? `أنا ${user.name} — ` : '';
    return `${name}نتيجتي في اختبار تحديد المستوى: ${results.percent}% (مستوى: ${levelLabel(results.level)}).\nالخطة المقترحة: ${plan.title}.\nاختبار محاكي مبني على نمط النماذج الحديثة حتى نموذج ${models}.\nرابط الموقع: ${location.origin}${location.pathname.replace('results.html','index.html')}`;
  }

  function renderPlan(plan){
    const host = $('#planHost');
    if(!host) return;

    let html = '';
    html += `<div class="card glass" style="margin-bottom:14px">
      <div class="title" style="margin-bottom:8px">
        <h2 style="margin:0">خطة مذاكرة مخصّصة</h2>
        <div class="badge">ظهرت بناءً على نتيجتك + وقت اختبارك</div>
      </div>
      <p style="margin:0;color:var(--muted);line-height:1.9">
        ${escapeHtml(plan.forWho || '')}
      </p>
      ${(plan.focusNote?`<div class="sep"></div><p style="margin:0;color:var(--muted)"><b>تركيز خاص:</b> ${escapeHtml(plan.focusNote)}</p>`:'')}
      ${(plan.levelNote?`<p style="margin:10px 0 0;color:var(--muted)"><b>ملاحظة على مستواك:</b> ${escapeHtml(plan.levelNote)}</p>`:'')}
    </div>`;

    if(plan.blocks){
      html += `<div class="grid-2">`;
      for(const b of plan.blocks){
        html += `<div class="card">
          <h3 style="margin:0 0 8px">${escapeHtml(b.label)}</h3>
          <ul style="margin:0; padding-right:18px; color:var(--muted); line-height:1.9">` +
            b.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('') +
          `</ul>
        </div>`;
      }
      html += `</div>`;
    }

    if(plan.days){
      html += `<div class="card glass" style="margin-top:14px">
        <h3 style="margin:0 0 10px">جدول الأيام</h3>
        <div class="sep"></div>
        <div style="display:grid; gap:12px">
          ${plan.days.map(d=>`
            <div class="card" style="padding:14px">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
                <div><b>اليوم ${d.day}:</b> ${escapeHtml(d.title)}</div>
                <span class="pill">مهم</span>
              </div>
              <ul style="margin:10px 0 0; padding-right:18px; color:var(--muted); line-height:1.9">
                ${d.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>`;
    }

    if(plan.weeks){
      html += `<div class="card glass" style="margin-top:14px">
        <h3 style="margin:0 0 10px">خطة على أسابيع</h3>
        <div style="display:grid; gap:12px">
          ${plan.weeks.map(w=>`
            <div class="card" style="padding:14px">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
                <div><b>الأسبوع ${w.week}:</b> ${escapeHtml(w.title)}</div>
                <span class="pill">ترتيب</span>
              </div>
              <ul style="margin:10px 0 0; padding-right:18px; color:var(--muted); line-height:1.9">
                ${w.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>`;
    }

    if(plan.items){
      html += `<div class="card glass" style="margin-top:14px">
        <h3 style="margin:0 0 10px">خطة مقترحة</h3>
        <ul style="margin:0; padding-right:18px; color:var(--muted); line-height:1.9">
          ${plan.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('')}
        </ul>
      </div>`;
    }

    if(plan.closing){
      html += `<div class="card" style="margin-top:14px">
        <b>ختام الخطة:</b>
        <p style="margin:8px 0 0; color:var(--muted); line-height:1.95">${escapeHtml(plan.closing)}</p>
      </div>`;
    }

    host.innerHTML = html;
  }

  function escapeHtml(str){
    return (str ?? '').toString()
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }

  async function sharePlan(shareText){
    if(navigator.share){
      try{
        await navigator.share({title:'خطة مذاكرة STEP', text: shareText, url: location.href});
        return;
      }catch(_){}
    }
    try{
      await navigator.clipboard.writeText(shareText);
      alert('تم نسخ الخطة ✅ شاركها الآن مع صديقك');
    }catch(_){
      prompt('انسخ النص التالي وشاركه:', shareText);
    }
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const results = load(RESULTS_KEY);
    const user = load(USER_KEY);

    const empty = $('#emptyState');
    const content = $('#resultsContent');

    if(!results){
      empty?.classList.remove('hidden');
      content?.classList.add('hidden');
      return;
    }

    empty?.classList.add('hidden');
    content?.classList.remove('hidden');

    // Header summary
    $('#userName').textContent = user?.name ? user.name : 'طالب/ـة';
    $('#overallPercent').textContent = results.percent + '%';
    $('#overallLevel').textContent = levelLabel(results.level);
    $('#weakSection').textContent = sectionLabel(results.weakSection);

    // Breakdown cards
    const b = results.breakdown || {};
    const g = b.Grammar?.percent ?? 0;
    const r = b.Reading?.percent ?? 0;
    const l = b.Listening?.percent ?? 0;

    $('#cardGrammar').innerHTML = `<b>القواعد</b> — ${g}%` + percentBar(g);
    $('#cardReading').innerHTML = `<b>القراءة</b> — ${r}%` + percentBar(r);
    $('#cardListening').innerHTML = `<b>الاستماع</b> — ${l}%` + percentBar(l);

    // Plan generation
    const plan = window.buildStudyPlan({
      examWindow: user?.examWindow || 'notBooked',
      weakFocus: results.weakSection,
      level: results.level
    });

    renderPlan(plan);

    // Store plan summary for Telegram message
    const planSummary = buildPlanSummaryText(user, results, plan);
    save(PLAN_SUMMARY_KEY, planSummary);

    // Buttons
    const shareText = buildShareText(user, results, plan);
    $('#btnShare')?.addEventListener('click', ()=> sharePlan(shareText));
    $('#btnRegister')?.addEventListener('click', ()=> window.location.href = 'register.html');

    // Friendly motivation
    const msg = `الله يوفقك يا ${user?.name || 'بطل'} ✨ — الأهم الآن: “تطبيق يومي” حتى لو 15 دقيقة.`;
    $('#motivation').textContent = msg;
    $('#ratingStars').innerHTML = renderStars(5) + ' <span style="color:var(--muted); font-weight:800">متوسط رضا الطلاب 4.9/5</span>';
  });

})();
