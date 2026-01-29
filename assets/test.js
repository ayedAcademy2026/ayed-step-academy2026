// assets/test.js
(function(){
  'use strict';

  const SD = window.SITE_DATA || {};
  const CACHE = SD.ui?.cacheVersion || '1';

  const SESSION_KEY = 'ayed_test_session_v1';
  const RESULTS_KEY  = 'ayed_test_results_v1';
  const COMPLETED_KEY = 'ayed_test_completed_v1';
  const USER_KEY = 'ayed_user_profile_v1';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const startScreen = $('#startScreen');
  const testScreen = $('#testScreen');
  const resumeBox = $('#resumeBox');

  const startForm = $('#startForm');
  const btnStart = $('#btnStart');
  const btnResume = $('#btnResume');
  const btnReset = $('#btnReset');

  const qText = $('#qText');
  const optionsBox = $('#optionsBox');
  const explainBox = $('#explainBox');
  const progressText = $('#progressText');
  const barInner = $('#progressBarInner');
  const sideGrid = $('#qGrid');

  const btnPrev = $('#btnPrev');
  const btnNext = $('#btnNext');
  const btnFinish = $('#btnFinish');

  let bank = [];
  let bankById = new Map();
  let session = null;

  function now(){ return new Date(); }

  function loadLocal(key){ try{ return JSON.parse(localStorage.getItem(key)); }catch(_){ return null; } }
  function saveLocal(key, obj){ localStorage.setItem(key, JSON.stringify(obj)); }
  function setCompleted(){ localStorage.setItem(COMPLETED_KEY, '1'); }
  function clearCompleted(){ localStorage.removeItem(COMPLETED_KEY); }

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickQuestions(){
    const grammar = bank.filter(q=>q.section==='Grammar');
    const reading = bank.filter(q=>q.section==='Reading');
    const listening = bank.filter(q=>q.section==='Listening');

    // 50 سؤال = 20 Grammar + 20 Reading + 10 Listening (قريب من نسب STEP)
    const picked = [
      ...shuffle(grammar).slice(0, 20),
      ...shuffle(reading).slice(0, 20),
      ...shuffle(listening).slice(0, 10),
    ];
    return shuffle(picked).map(q=>q.id);
  }

  function show(el){ el?.classList.remove('hidden'); }
  function hide(el){ el?.classList.add('hidden'); }

  function updateResumeUI(){
    const saved = loadLocal(SESSION_KEY);
    if(saved && saved.questionIds?.length){
      show(resumeBox);
    }else{
      hide(resumeBox);
    }
  }

  function getUserFromForm(){
    const name = $('#name').value.trim();
    const examWindow = $('#examWindow').value;
    const region = $('#region').value;
    const prevTest = $('#prevTest').value;
    const prevScore = $('#prevScore').value.trim();
    const targetScore = $('#targetScore').value.trim();
    const weakSelf = $('#weakSelf').value;
    const studyStyle = $('#studyStyle').value;

    return {
      name,
      examWindow,
      region,
      prevTest,
      prevScore,
      targetScore,
      weakSelf,
      studyStyle,
      createdAt: now().toISOString(),
    };
  }

  function validateStart(){
    const name = $('#name').value.trim();
    if(!name){
      alert('فضلاً اكتب اسمك — عشان نطلع لك خطة شخصية ✨');
      return false;
    }
    return true;
  }

  function startNew(){
    if(!validateStart()) return;

    const user = getUserFromForm();
    saveLocal(USER_KEY, user);

    session = {
      version: 1,
      startedAt: now().toISOString(),
      user,
      questionIds: pickQuestions(),
      answers: {}, // { [id]: selectedIndex }
      current: 0
    };

    saveLocal(SESSION_KEY, session);
    hide(startScreen); show(testScreen);
    render();
  }

  function resume(){
    const saved = loadLocal(SESSION_KEY);
    if(!saved || !saved.questionIds?.length){
      startNew();
      return;
    }
    session = saved;
    hide(startScreen); show(testScreen);
    render();
  }

  function resetAll(){
    if(!confirm('أكيد تبغى تبدأ من جديد؟ سيتم حذف تقدم الاختبار الحالي.')) return;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(RESULTS_KEY);
    clearCompleted();
    updateResumeUI();
    location.reload();
  }

  function currentQ(){
    const id = session.questionIds[session.current];
    return bankById.get(id);
  }

  function render(){
    if(!session) return;
    const q = currentQ();
    if(!q) return;

    // Progress
    const idx = session.current + 1;
    const total = session.questionIds.length;
    progressText.textContent = `${idx} / ${total} — قسم: ${labelSection(q.section)}`;
    const pct = Math.round((idx/total)*100);
    barInner.style.width = pct + '%';

    // Question
    qText.textContent = q.prompt;
    optionsBox.innerHTML = '';
    explainBox.classList.add('hidden');
    explainBox.innerHTML = '';

    const selected = session.answers[q.id];
    q.options.forEach((opt, i)=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.textContent = opt;
      if(selected === i) btn.classList.add('selected');
      btn.addEventListener('click', ()=> selectAnswer(q.id, i));
      optionsBox.appendChild(btn);
    });

    // Side grid
    renderGrid();

    // Nav buttons
    btnPrev.disabled = session.current === 0;
    btnNext.disabled = session.current === total-1;
    btnFinish.classList.toggle('hidden', session.current !== total-1);

    // If answered show explanation (and highlight)
    if(typeof selected === 'number'){
      showExplanation(q, selected);
      paintOptions(q, selected);
    }
  }

  function renderGrid(){
    const total = session.questionIds.length;
    sideGrid.innerHTML = '';
    for(let i=0;i<total;i++){
      const id = session.questionIds[i];
      const q = bankById.get(id);
      const cell = document.createElement('div');
      cell.className = 'qnum';
      cell.textContent = (i+1);
      if(session.answers[id] !== undefined) cell.classList.add('answered');
      if(i === session.current) cell.classList.add('current');
      cell.title = q ? labelSection(q.section) : '';
      cell.addEventListener('click', ()=>{
        session.current = i;
        saveLocal(SESSION_KEY, session);
        render();
      });
      sideGrid.appendChild(cell);
    }
  }

  function labelSection(sec){
    if(sec === 'Grammar') return 'القواعد';
    if(sec === 'Reading') return 'القراءة';
    if(sec === 'Listening') return 'الاستماع';
    return sec;
  }

  function selectAnswer(qid, idx){
    session.answers[qid] = idx;
    saveLocal(SESSION_KEY, session);
    const q = bankById.get(qid);
    paintOptions(q, idx);
    showExplanation(q, idx);
    renderGrid();
  }

  function paintOptions(q, selectedIndex){
    const buttons = $$('.option', optionsBox);
    buttons.forEach((b, i)=>{
      b.classList.remove('selected','correct','wrong');
      if(i === selectedIndex) b.classList.add('selected');
      if(i === q.correctIndex) b.classList.add('correct');
      if(i === selectedIndex && selectedIndex !== q.correctIndex) b.classList.add('wrong');
    });
  }

  function showExplanation(q, selectedIndex){
    explainBox.classList.remove('hidden');
    const isCorrect = selectedIndex === q.correctIndex;
    const badge = isCorrect ? '✅ إجابة صحيحة' : '❌ إجابة غير صحيحة';
    const explain = q.explanation || '—';
    explainBox.innerHTML = `<b>${badge}</b><br>${escapeHtml(explain)}`;
  }

  function escapeHtml(str){
    return (str ?? '').toString()
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;');
  }

  function next(){
    if(session.current < session.questionIds.length-1){
      session.current++;
      saveLocal(SESSION_KEY, session);
      render();
    }
  }

  function prev(){
    if(session.current > 0){
      session.current--;
      saveLocal(SESSION_KEY, session);
      render();
    }
  }

  function finish(){
    // حساب النتيجة
    const total = session.questionIds.length;
    let correct = 0;

    const sections = {
      Grammar: {correct:0,total:0},
      Reading: {correct:0,total:0},
      Listening: {correct:0,total:0}
    };

    for(const id of session.questionIds){
      const q = bankById.get(id);
      if(!q) continue;
      const ans = session.answers[id];
      sections[q.section].total++;
      if(ans === q.correctIndex){
        correct++;
        sections[q.section].correct++;
      }
    }

    const percent = Math.round((correct/total)*100);

    const breakdown = {};
    for(const k of Object.keys(sections)){
      const s = sections[k];
      const p = s.total ? Math.round((s.correct/s.total)*100) : 0;
      breakdown[k] = {...s, percent:p};
    }

    // تحديد المستوى
    let level = 'Intermediate';
    if(percent >= 80) level = 'Advanced';
    else if(percent < 60) level = 'Beginner';

    // أضعف قسم
    let weakSection = 'Grammar';
    let minP = 101;
    for(const k of Object.keys(breakdown)){
      if(breakdown[k].percent < minP){
        minP = breakdown[k].percent;
        weakSection = k;
      }
    }

    const results = {
      finishedAt: now().toISOString(),
      total,
      correct,
      percent,
      level,
      weakSection,
      breakdown,
      meta: {
        modelsReference: (SD.exam?.modelsReference || []),
        note: 'أسئلة محاكاة مبنية على نمط النماذج الحديثة — وليست أسئلة قياس الرسمية.'
      }
    };

    saveLocal(RESULTS_KEY, results);
    setCompleted();

    // نخلّي الجلسة محفوظة للرجوع، لكن ننتقل للنتائج
    window.location.href = 'results.html';
  }

  async function loadBank(){
    const res = await fetch(`assets/questions.json?v=${encodeURIComponent(CACHE)}`);
    if(!res.ok) throw new Error('failed to load questions');
    bank = await res.json();
    bankById = new Map(bank.map(q=>[q.id, q]));
  }

  function initUI(){
    updateResumeUI();
    btnStart?.addEventListener('click', (e)=>{ e.preventDefault(); startNew(); });
    btnResume?.addEventListener('click', (e)=>{ e.preventDefault(); resume(); });
    btnReset?.addEventListener('click', (e)=>{ e.preventDefault(); resetAll(); });

    btnNext?.addEventListener('click', next);
    btnPrev?.addEventListener('click', prev);
    btnFinish?.addEventListener('click', finish);

    startForm?.addEventListener('submit', (e)=>{ e.preventDefault(); startNew(); });
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    initUI();
    try{
      await loadBank();
    }catch(err){
      console.error(err);
      alert('تعذر تحميل بنك الأسئلة. تأكد من رفع ملف assets/questions.json في المستودع.');
    }
  });

})();
