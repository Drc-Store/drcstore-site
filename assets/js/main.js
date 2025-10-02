// Main JS for DRC Stor - handles loader, Lottie, cards, search, auth toggle, forms, AOS init

document.addEventListener('DOMContentLoaded',function(){
  // Loader: hide when window loads or after a timeout fallback
  const loader=document.getElementById('loader');
  const hideLoader=()=>{
    if(!loader) return;
    loader.classList.add('loader-hidden');
    // remove from flow after animation
    setTimeout(()=>{if(loader && loader.parentNode) loader.parentNode.removeChild(loader)},700);
  };
  // Hide on window.load (all resources loaded)
  window.addEventListener('load',()=>hideLoader());
  // Fallback: hide after 2.5s to avoid long blocking on slow resources
  setTimeout(()=>{hideLoader()},2500);

  // Initialize Lottie animations lazily: wait until first paint to avoid blocking
  try{
    requestIdleCallback?requestIdleCallback(loadLotties,{timeout:1200}):setTimeout(loadLotties,600);
  }catch(e){setTimeout(loadLotties,600)}
  function loadLotties(){
    try{
      const heroEl=document.getElementById('lottie-hero');
      if(heroEl){lottie.loadAnimation({container:heroEl,renderer:'svg',loop:true,autoplay:true,path:'https://assets3.lottiefiles.com/packages/lf20_touohxv0.json'});}      
      const devEl=document.getElementById('lottie-dev');
      if(devEl){lottie.loadAnimation({container:devEl,renderer:'svg',loop:true,autoplay:true,path:'https://assets2.lottiefiles.com/packages/lf20_jcikwtux.json'});}      
      const aboutEl=document.getElementById('lottie-about');
      if(aboutEl){lottie.loadAnimation({container:aboutEl,renderer:'svg',loop:true,autoplay:true,path:'https://assets8.lottiefiles.com/packages/lf20_7k2c8wld.json'});}      
      const chatEl=document.getElementById('lottie-chat');
      if(chatEl){lottie.loadAnimation({container:chatEl,renderer:'svg',loop:true,autoplay:true,path:'https://assets2.lottiefiles.com/packages/lf20_iwmd6pyr.json'});}      
    }catch(err){console.warn('Lottie error',err)}
  }

  // Sample popular apps data (mock)
  const apps=[
    {id:1,name:'Chat_Kitoko',category:'I.A Congolais',desc:'Chat rapide Uniquement pour le Congolais ',img:'assets/img/app1.jpg'},   
    {id:1,name:'Zeloubet',category:'PariSportif',desc:'Paris sportif en ligne',img:'assets/img/app1.jpg'},
    {id:2,name:'Yeba_Nionso',category:'Moteur de Recherche',desc:'Faire de recherche DRC',img:'assets/img/app2.jpg'},
    {id:3,name:'Benda_Place',category:'Location véhicule',desc:'Commander votre véhicule',img:'assets/img/app3.jpg'},
    {id:4,name:'AfroChat',category:'Réseau social DRC',desc:'Discusion en ligne DRC',img:'assets/img/app4.jpg'},
  ];

  // Inject popular apps on index (with lazy loading for images)
  const popular=document.getElementById('popular-apps');
  if(popular){
    apps.slice(0,4).forEach(a=>{
      const col=document.createElement('div');col.className='col-md-6 col-lg-3';
      col.innerHTML=`<div class="card app-card p-3" data-aos="zoom-in">
        <img data-src="${a.img}" src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23e9ecef'/%3E%3C/svg%3E" class="app-thumb mb-3 lazy" alt="${a.name}" />
        <h5>${a.name}</h5>
        <p class="small text-muted">${a.desc}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge bg-primary">${a.category}</span>
          <a class="btn btn-sm btn-outline-primary" href="applications.html">Voir</a>
        </div>
      </div>`;
      popular.appendChild(col);
    });
  }
  // Populate apps grid in applications.html
  const grid=document.getElementById('apps-grid');
  const paginationContainer=document.getElementById('apps-pagination');
  const announcer=document.getElementById('apps-announcer');
  // Pagination state
  let currentPage=1;
  const itemsPerPage=6;

  // Search & filter elements (needed by getFilteredApps)
  const search=document.getElementById('search');
  const filter=document.getElementById('category-filter');

  // Helper: get filtered apps based on search + category filter
  function getFilteredApps(){
    const q=search?search.value.toLowerCase():'';
    const cat=filter?filter.value.toLowerCase():'all';
    return apps.filter(a=>{
      return (cat==='all' || a.category.toLowerCase()===cat) && (a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    });
  }

  // Render a page of apps into the grid
  function renderApps(){
    if(!grid) return;
    const filtered=getFilteredApps();
    const total=filtered.length;
    const totalPages=Math.max(1,Math.ceil(total/itemsPerPage));
    if(currentPage>totalPages) currentPage=totalPages;
    const start=(currentPage-1)*itemsPerPage;
    const pageItems=filtered.slice(start,start+itemsPerPage);

    grid.innerHTML='';
    pageItems.forEach(a=>{
      const col=document.createElement('div');col.className='col-md-6 col-lg-4';
      col.innerHTML=`<div class="card app-card p-3" data-aos="fade-up">
        <img data-src="${a.img}" src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400'%3E%3Crect width='100%25' height='100%25' fill='%23e9ecef'/%3E%3C/svg%3E" class="app-thumb mb-3 lazy" alt="${a.name}" />
        <h5>${a.name}</h5>
        <p class="small text-muted">${a.desc}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge bg-primary">${a.category}</span>
          <button class="btn btn-sm btn-primary app-download" data-appid="${a.id}" data-appname="${a.name}">Télécharger</button>
        </div>
      </div>`;
      grid.appendChild(col);
    });

  // Refresh AOS and lazy loader
  AOS.refresh();
  setTimeout(runLazyLoad,80);
  // Attach download handlers after render
  attachDownloadHandlers();

    // Render pagination controls
    renderPagination(totalPages,currentPage,total);
    // Update announcer
    updateAnnouncer(total, start, pageItems.length, currentPage, totalPages);
  }

  // Attach click handlers to download buttons: require authentication first
  function attachDownloadHandlers(){
    const buttons = Array.from(document.querySelectorAll('.app-download'));
    buttons.forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const appId = btn.getAttribute('data-appid');
        const appName = btn.getAttribute('data-appname') || 'application';
        // Simple auth check: simulated flag in localStorage
        let authed=false;
        try{authed = localStorage.getItem('drcstor_authenticated') === 'true';}catch(err){authed=false}
        if(!authed){
          // show a friendly modal prompting the user to login as a developer
          const next = encodeURIComponent(window.location.pathname + window.location.search + '#app-'+appId);
          showDownloadAuthModal({appId, appName, next});
          return;
        }
        // Simulate download for demo
        // In real app this should start a secure download from server
        try{const anchor=document.createElement('a');anchor.href = 'assets/dummy/'+appId+'.zip';anchor.download = appName+'.zip';document.body.appendChild(anchor);anchor.click();anchor.remove();}catch(err){alert('Téléchargement démarré (simulation)');}
      });
    });
  }

  // Create (once) and show a Bootstrap modal prompting the user to sign in as developer
  function showDownloadAuthModal({appId, appName, next}){
    const existing = document.getElementById('downloadAuthModal');
    if(!existing){
      const html = `
      <div class="modal fade" id="downloadAuthModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Connexion requise</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>
            <div class="modal-body">
              <p>Pour télécharger <strong id="dam-app-name"></strong>, vous devez d'abord vous connecter en tant que développeur.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
              <a id="dam-login-btn" class="btn btn-primary" href="#">Se connecter</a>
            </div>
          </div>
        </div>
      </div>`;
      const div = document.createElement('div'); div.innerHTML = html; document.body.appendChild(div.firstElementChild);
    }
    // populate and show
    const modalEl = document.getElementById('downloadAuthModal');
    if(!modalEl) return;
    const appNameEl = modalEl.querySelector('#dam-app-name'); if(appNameEl) appNameEl.textContent = appName;
    const loginBtn = modalEl.querySelector('#dam-login-btn');
    if(loginBtn){
      // navigate to auth page with next param and role=developer
      loginBtn.href = 'auth.html?next='+next+'&role=developer&app='+encodeURIComponent(appId);
    }
    const bs = new bootstrap.Modal(modalEl); bs.show();
  }

  // Build accessible pagination controls
  function renderPagination(totalPages,activePage,totalItems){
    if(!paginationContainer) return;
    paginationContainer.innerHTML='';
    const ul=document.createElement('ul');ul.className='pagination justify-content-center';

    // Prev button
    const prevLi=document.createElement('li');prevLi.className='page-item'+(activePage===1?' disabled':'');
    const prevBtn=document.createElement('button');prevBtn.className='page-link';prevBtn.type='button';
    prevBtn.setAttribute('aria-label','Page précédente');prevBtn.innerHTML='&laquo;';
    prevBtn.addEventListener('click',()=>{if(activePage>1){currentPage=activePage-1;renderApps();prevBtn.focus();}});
    prevLi.appendChild(prevBtn);ul.appendChild(prevLi);

    // Simple page window (show up to 7 pages with truncation)
    const maxButtons=7;let startPage=Math.max(1, activePage-Math.floor(maxButtons/2));
    let endPage=startPage+maxButtons-1; if(endPage>totalPages){endPage=totalPages;startPage=Math.max(1,endPage-maxButtons+1);} 
    for(let p=startPage;p<=endPage;p++){
      const li=document.createElement('li');li.className='page-item'+(p===activePage?' active':'');
      const btn=document.createElement('button');btn.className='page-link';btn.type='button';btn.textContent=p;btn.setAttribute('aria-label','Page '+p);
      if(p===activePage){btn.setAttribute('aria-current','page');}
      btn.addEventListener('click',()=>{currentPage=p;renderApps();btn.focus();});
      li.appendChild(btn);ul.appendChild(li);
    }

    // Next button
    const nextLi=document.createElement('li');nextLi.className='page-item'+(activePage===totalPages?' disabled':'');
    const nextBtn=document.createElement('button');nextBtn.className='page-link';nextBtn.type='button';
    nextBtn.setAttribute('aria-label','Page suivante');nextBtn.innerHTML='&raquo;';
    nextBtn.addEventListener('click',()=>{if(activePage<totalPages){currentPage=activePage+1;renderApps();nextBtn.focus();}});
    nextLi.appendChild(nextBtn);ul.appendChild(nextLi);

    paginationContainer.appendChild(ul);
  }

  function updateAnnouncer(total, startIndex, shownCount, page, totalPages){
    if(!announcer) return;
    if(total===0){announcer.textContent='Aucun résultat trouvé.';return}
    const from=startIndex+1; const to=startIndex+shownCount;
    announcer.textContent=`Affichage ${from}-${to} sur ${total} résultats — page ${page} sur ${totalPages}.`;
  }

  // Initial render
  renderApps();

  // Search & filter: reset to page 1 and re-render with pagination
  function applyFilter(){
    currentPage=1;
    renderApps();
  }
  if(search) search.addEventListener('input',applyFilter);
  if(filter) filter.addEventListener('change',applyFilter);
  // Auth toggle (login/register)
  const showLogin=document.getElementById('show-login');
  const showRegister=document.getElementById('show-register');
  const loginForm=document.getElementById('login-form');
  const registerForm=document.getElementById('register-form');
  const authTitle=document.getElementById('auth-title');
  if(showLogin) showLogin.addEventListener('click',()=>{if(loginForm && registerForm){loginForm.classList.remove('d-none');registerForm.classList.add('d-none');authTitle.textContent='Connexion'}});
  if(showRegister) showRegister.addEventListener('click',()=>{if(loginForm && registerForm){registerForm.classList.remove('d-none');loginForm.classList.add('d-none');authTitle.textContent="Inscription"}});
  // --- Authentication UX improvements ---
  // Password visibility toggles
  const loginToggle=document.getElementById('login-toggle');
  const loginPassword=document.getElementById('login-password');
  const regToggle=document.getElementById('reg-toggle');
  const regPassword=document.getElementById('reg-password');
  if(loginToggle && loginPassword){
    loginToggle.addEventListener('click',()=>{
      const t=loginPassword.type==='password'?'text':'password'; loginPassword.type=t; loginToggle.setAttribute('aria-pressed', t==='text');
      loginToggle.textContent = t==='text'? '🙈' : '👁️';
    });
  }
  if(regToggle && regPassword){
    regToggle.addEventListener('click',()=>{
      const t=regPassword.type==='password'?'text':'password'; regPassword.type=t; regToggle.setAttribute('aria-pressed', t==='text');
      regToggle.textContent = t==='text'? '🙈' : '👁️';
    });
  }

  // Password strength estimator (very small heuristic)
  const regStrengthText=document.getElementById('reg-strength-text');
  function estimateStrength(pw){
    let score=0; if(!pw) return {score, label:'—'};
    if(pw.length>=8) score++; if(/[A-Z]/.test(pw)) score++; if(/[0-9]/.test(pw)) score++; if(/[^A-Za-z0-9]/.test(pw)) score++;
    const labels=['Faible','Moyen','Bon','Fort']; return {score, label: labels[Math.max(0,Math.min(labels.length-1,score-1))]||'Faible'};
  }
  if(regPassword && regStrengthText){
    regPassword.addEventListener('input',e=>{
      const r=estimateStrength(e.target.value||''); regStrengthText.textContent = r.label;
    });
  }

  // Remember-me: mock using localStorage
  const rememberMe=document.getElementById('remember-me');
  const loginEmail=document.getElementById('login-email');
  if(rememberMe && loginEmail){
    // prefill if remembered
    try{const saved=localStorage.getItem('drcstor_remember'); if(saved) loginEmail.value=saved;}catch(e){}
    // on login submission we'll save when checked
  }

  // Enhanced submission UX: disable, show text feedback via announcers
  const loginAnn=document.getElementById('login-announcer');
  const regAnn=document.getElementById('reg-announcer');
  const loginSubmit=document.getElementById('login-submit');
  const regSubmit=document.getElementById('reg-submit');

  function setBtnLoading(btn,loading){
    if(!btn) return; if(loading){btn.disabled=true; btn.dataset.origText=btn.textContent; btn.textContent='Veuillez patienter…';} else {btn.disabled=false; if(btn.dataset.origText) btn.textContent=btn.dataset.origText;}
  }

  // Login handler
  if(loginForm){
    loginForm.addEventListener('submit',e=>{
      e.preventDefault();
      const email=loginEmail?loginEmail.value.trim():''; const pwd=loginPassword?loginPassword.value:'';
      if(!email || !pwd){ if(loginAnn) loginAnn.textContent='Veuillez remplir tous les champs requis.'; return; }
      // simulate server call
      setBtnLoading(loginSubmit,true);
      if(rememberMe && rememberMe.checked){ try{localStorage.setItem('drcstor_remember', email)}catch(e){} } else { try{localStorage.removeItem('drcstor_remember')}catch(e){} }
      setTimeout(()=>{
        setBtnLoading(loginSubmit,false);
        // mark as authenticated (simulation)
        try{ localStorage.setItem('drcstor_authenticated','true'); }catch(e){}
        if(loginAnn) loginAnn.textContent='Connexion réussie (simulation). Redirection…';
        // if a next param is present in URL, redirect back there
        try{
          const params = new URLSearchParams(window.location.search);
          const next = params.get('next');
          if(next){
            // decoded next may be a path+hash
            window.location.href = decodeURIComponent(next);
            return;
          }
        }catch(e){}
      },1000);
    });
  }

  // Register handler with simple validation
  if(registerForm){
    registerForm.addEventListener('submit',e=>{
      e.preventDefault();
      const name=document.getElementById('reg-name')?.value.trim();
      const email=document.getElementById('reg-email')?.value.trim();
      const pwd=regPassword?regPassword.value:'';
      if(!name || !email || !pwd){ if(regAnn) regAnn.textContent='Veuillez remplir tous les champs requis.'; return; }
      const strength=estimateStrength(pwd).score;
      if(strength<2){ if(regAnn) regAnn.textContent='Le mot de passe est trop faible.'; return; }
      setBtnLoading(regSubmit,true);
      setTimeout(()=>{
        setBtnLoading(regSubmit,false);
        if(regAnn) regAnn.textContent='Inscription réussie (simulation). Vérifiez votre email pour confirmer.';
        registerForm.reset();
      },1200);
    });
  }
  // Simple form validation with shake animation on error
  document.querySelectorAll('form').forEach(f=>{
    f.addEventListener('submit',e=>{
      e.preventDefault();
      // naive validation: check required fields
      const invalid=[...f.querySelectorAll('[required]')].some(i=>!i.value);
      if(invalid){
        f.classList.remove('animate-shake');void f.offsetWidth;f.classList.add('animate-shake');
        setTimeout(()=>f.classList.remove('animate-shake'),800);
        return;
      }
      // For demo we just show a success message
      alert('Formulaire soumis (mock)');
      f.reset();
    });
  });

  // (publish form removed — gating logic intentionally omitted)
});

// CSS-based shake defined dynamically for convenience
(function(){
  const style=document.createElement('style');style.innerHTML='@keyframes shake{0%{transform:translateX(0)}25%{transform:translateX(-6px)}50%{transform:translateX(6px)}75%{transform:translateX(-4px)}100%{transform:translateX(0)}} .animate-shake{animation:shake .7s cubic-bezier(.36,.07,.19,.97)}';document.head.appendChild(style);
})();

// Lazy load simple implementation for images with class .lazy
function runLazyLoad(){
  const lazyImages=[...document.querySelectorAll('img.lazy')];
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver((entries,obs)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const img=entry.target; img.src=img.dataset.src; img.classList.remove('lazy'); obs.unobserve(img);
        }
      });
    },{rootMargin:'200px 0px'});
    lazyImages.forEach(i=>io.observe(i));
  }else{
    // fallback: load all
    lazyImages.forEach(i=>{i.src=i.dataset.src; i.classList.remove('lazy')});
  }
}

// kick lazy loader after DOM ready
document.addEventListener('DOMContentLoaded',()=>runLazyLoad());

// Counters: animate numbers when they enter the viewport
function initCounters(){
  const counters=[...document.querySelectorAll('.counter')];
  if(!counters.length) return;
  const fmt=n=>n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
  function animate(el,target){
    const duration=1200; const start=0; const startTime=performance.now();
    function step(now){
      const t=Math.min(1,(now-startTime)/duration);
      const value=Math.floor(t*target);
      el.textContent=fmt(value);
      if(t<1) requestAnimationFrame(step); else el.textContent=fmt(target);
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver((entries,obs)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          const el=e.target; const target=parseInt(el.dataset.target,10)||0;
          animate(el,target); obs.unobserve(el);
        }
      });
    },{threshold:0.4});
    counters.forEach(c=>io.observe(c));
  }else{
    counters.forEach(c=>animate(c,parseInt(c.dataset.target,10)||0));
  }
}

document.addEventListener('DOMContentLoaded',()=>initCounters());

// Fallback image handler: replace broken images with a neutral placeholder
function attachImageFallbacks(){
  const imgs=[...document.querySelectorAll('img')];
  imgs.forEach(img=>{
    img.addEventListener('error',()=>{
      if(img.dataset.fallbackApplied) return; // avoid loop
      img.dataset.fallbackApplied='1';
      img.src='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="100%25" height="100%25" fill="%23e9ecef"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236c757d" font-size="18">image manquante</text%3E%3C/svg%3E';
      img.classList.remove('lazy');
    });
  });
}

document.addEventListener('DOMContentLoaded',()=>attachImageFallbacks());

// Contact form: validation, aria-live feedback and simulated send
(function(){
  const contactForm=document.getElementById('contact-form');
  const contactSubmit=document.getElementById('contact-submit');
  const contactFeedback=document.getElementById('contact-feedback');
  const contactInline=document.getElementById('contact-inline');
  if(!contactForm || !contactSubmit) return;

  function showInlineMessage(html,isError){
    contactInline.innerHTML = `<div class="alert ${isError? 'alert-danger':'alert-success'}">${html}</div>`;
    contactInline.setAttribute('aria-hidden','false');
    setTimeout(()=>{contactInline.innerHTML='';contactInline.setAttribute('aria-hidden','true')},4000);
  }

  contactForm.addEventListener('submit',e=>{
    e.preventDefault();
    const name=document.getElementById('contact-name')?.value.trim();
    const email=document.getElementById('contact-email')?.value.trim();
    const msg=document.getElementById('contact-message')?.value.trim();
    if(!name || !email || !msg){
      if(contactFeedback) contactFeedback.textContent='Veuillez remplir tous les champs requis.';
      showInlineMessage('Veuillez remplir tous les champs requis.', true);
      return;
    }
    // Basic email format check
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      if(contactFeedback) contactFeedback.textContent='Adresse e-mail invalide.';
      showInlineMessage('Adresse e-mail invalide.', true);
      return;
    }

    // Simulate send
    contactSubmit.disabled=true; const orig=contactSubmit.textContent; contactSubmit.textContent='Envoi…';
    if(contactFeedback) contactFeedback.textContent='Envoi en cours…';
    setTimeout(()=>{
      contactSubmit.disabled=false; contactSubmit.textContent=orig;
      if(contactFeedback) contactFeedback.textContent='Message envoyé. Nous vous répondrons sous 48 heures.';
      showInlineMessage('Merci — votre message a été envoyé.', false);
      contactForm.reset();
    },1200);
  });

  // Chat modal actions
  const startChat=document.getElementById('start-chat');
  if(startChat){
    startChat.addEventListener('click',()=>{
      const body=document.getElementById('chat-body'); if(body) body.textContent='Assistant: Bonjour ! Un membre de l’équipe vous répondra bientôt.';
      const modalEl=document.getElementById('chatModal'); if(modalEl){ const m=new bootstrap.Modal(modalEl); setTimeout(()=>m.hide(),1200); }
    });
  }
})();

// Accessible Chat assistant with intent detection and quick replies
(function(){
  const chatLog=document.getElementById('chat-log');
  const chatInput=document.getElementById('chat-input');
  const chatSend=document.getElementById('chat-send');
  const chatClear=document.getElementById('chat-clear');
  if(!chatLog || !chatInput) return;

  // Append message; optional quickReplies array of {label, payload}
  function appendMessage(who, text, quickReplies){
    const el=document.createElement('div'); el.className='chat-message '+(who==='user'?'chat-user':'chat-bot');
    el.innerHTML=`<div class="small text-muted">${who==='user'?'Vous':'Assistant'}</div><div>${text}</div>`;
    chatLog.appendChild(el);

    // If quick replies provided, render them as accessible buttons
    if(Array.isArray(quickReplies) && quickReplies.length){
      const qwrap=document.createElement('div'); qwrap.className='chat-quick-replies mt-2';
      quickReplies.forEach(q=>{
        const btn=document.createElement('button');
        btn.type='button'; btn.className='btn btn-sm btn-outline-secondary me-2 mb-2';
        btn.textContent=q.label; btn.setAttribute('data-payload',q.payload||q.label);
        btn.setAttribute('aria-label',`Répondre: ${q.label}`);
        btn.addEventListener('click',()=>{
          // simulate user clicking a suggested reply
          const val=btn.getAttribute('data-payload')||q.label; appendMessage('user',val);
          // small delay then let bot process
          setTimeout(()=>processUserMessage(val),350);
        });
        qwrap.appendChild(btn);
      });
      chatLog.appendChild(qwrap);
    }

    chatLog.scrollTop=chatLog.scrollHeight;

    // Announce short message for assistive tech
    const ann=document.createElement('div');ann.className='visually-hidden';ann.setAttribute('aria-live','polite');
    ann.textContent=`${who==='user'?'Message envoyé.':'Réponse: '+text}`;document.body.appendChild(ann);setTimeout(()=>ann.remove(),1200);
  }

  // Basic intent detection using keywords/regex
  function detectIntent(text){
    const t=text.toLowerCase();
    const intents=[
      {name:'pricing',score: t.match(/prix|tarif|coût|gratuit|abonnement/) ? 0.9:0},
      {name:'publishing',score: t.match(/publier|soumettre|mettre en ligne|envoyer l'app|mettre l app/) ? 0.9:0},
      {name:'account',score: t.match(/compte|inscri|connexion|se connecter|s'inscrire|mon compte/) ? 0.9:0},
      {name:'bug',score: t.match(/bug|erreur|problème|crash|planté|bloqu/) ? 0.9:0},
      {name:'support',score: t.match(/aide|support|contact|assistance|joindre/) ? 0.8:0},
      {name:'features',score: t.match(/fonctionnalité|fonctionnalit|feature|capacité/) ? 0.7:0},
      {name:'download',score: t.match(/télécharg|download|installer|installer l app/) ? 0.7:0}
    ];
    // also fuzzy checks for question marks and short intents
    const best=intents.reduce((a,b)=>a.score>=b.score?a:b,{name:'unknown',score:0});
    return {intent:best.name,confidence:best.score};
  }

  // Build reply based on detected intent
  function buildReplyForIntent(intent){
    switch(intent){
      case 'pricing':
        return {text:'Nos tarifs dépendent du service. Pour une estimation rapide : nous proposons des plans pour les développeurs indépendants et des forfaits entreprise — envoyez "tarifs développeur" ou "tarifs entreprise" pour plus de détails.', quick:['Tarifs développeur','Tarifs entreprise','Offres gratuites']};
      case 'publishing':
        return {text:'Pour publier une application, vous devez avoir un compte développeur. Ensuite, vous pourrez soumettre votre APK/IPA, ajouter des captures d’écran et une description. Souhaitez-vous savoir comment créer un compte développeur ?','quick':['Comment créer un compte','Guide de publication','Conditions de publication']};
      case 'account':
        return {text:'Les comptes sont gratuits. Vous pouvez vous inscrire depuis la page Connexion/Inscription. Voulez-vous que je vous explique les étapes d’inscription ?','quick':['Étapes d’inscription','Mot de passe oublié','Se connecter']};
      case 'bug':
        return {text:'Désolé d’entendre ça — pouvez-vous décrire le comportement (écran, message d’erreur) ? Vous pouvez aussi envoyer une capture d’écran à support@drcstor.cd.', quick:['Envoyer un rapport','Exemples de plantage','Contacter support']};
      case 'support':
        return {text:'Notre équipe support répond généralement sous 48 heures. Pour un contact direct : support@drcstor.cd. Voudriez-vous que je crée un message de contact prérempli ?','quick':['Créer un message','Envoyer email','Numéro de téléphone']};
      case 'features':
        return {text:'DRC Stor permet aux développeurs de distribuer des applications locales, recevoir des avis utilisateurs et suivre les installations. Cherchez-vous une fonctionnalité spécifique ?','quick':['Distribution','Avis utilisateurs','Analytics']};
      case 'download':
        return {text:'Pour télécharger une application, allez sur la page Application et cliquez sur Télécharger. Sur quelle plateforme voulez-vous l’app ?','quick':['Android','iOS','Web']};
      default:
        return {text:'Je ne suis pas sûr d’avoir compris. Pouvez-vous préciser (par ex. tarifs, publier, compte, bug) ? Voici des suggestions rapides :','quick':['Tarifs','Publier','Compte','Signaler un bug']};
    }
  }

  // Process a user message: detect intent, reply appropriately (with simulated thinking)
  function processUserMessage(text){
    const detected=detectIntent(text);
    // If confidence low, ask clarifying question with suggestions
    const replyObj = (detected.confidence>=0.65) ? buildReplyForIntent(detected.intent) : buildReplyForIntent('unknown');
    // Simulate typing delay
    setTimeout(()=>{
      appendMessage('bot',replyObj.text, replyObj.quick);
    }, 600 + Math.min(800, Math.max(0, text.length*20)));
  }

  // Wire up send / enter behavior
  chatSend && chatSend.addEventListener('click',()=>{
    const v=chatInput.value.trim(); if(!v) return; appendMessage('user',v); chatInput.value=''; processUserMessage(v);
  });
  chatInput.addEventListener('keydown',e=>{
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); chatSend && chatSend.click(); }
  });

  // Clear conversation
  chatClear && chatClear.addEventListener('click',()=>{ chatLog.innerHTML=''; chatInput.focus(); appendMessage('bot','La conversation a été effacée.'); });

  // initial greeting with suggestions
  appendMessage('bot','Bonjour ! Je suis l’assistant DRC Stor. Comment puis-je vous aider aujourd’hui ?', [
    {label:'Tarifs',payload:'prix'},
    {label:'Publier mon app',payload:'publier'},
    {label:'Problème / bug',payload:'bug'},
    {label:'Contact support',payload:'contact'}
  ]);
})();

// Navbar accessibility & mobile behavior: auto-collapse on nav link click and set aria-current
(function(){
  document.addEventListener('DOMContentLoaded',()=>{
    const nav = document.getElementById('mainNav');
    if(!nav) return;
    // set aria-current on matching link
    const links = [...nav.querySelectorAll('a.nav-link')];
    const path = location.pathname.split('/').pop() || 'index.html';
    links.forEach(a=>{
      try{
        const href = a.getAttribute('href');
        if(!href) return;
        const hrefFile = href.split('/').pop();
        if(hrefFile === path || (path === '' && hrefFile==='index.html')){
          a.setAttribute('aria-current','page'); a.classList.add('active');
        } else { a.removeAttribute('aria-current'); a.classList.remove('active'); }
        // collapse mobile menu when a link is clicked
        a.addEventListener('click',()=>{
          const bsCollapse = nav.querySelector('.collapse');
          if(bsCollapse && bsCollapse.classList.contains('show')){
            // use bootstrap's collapse via toggler
            const btn = document.querySelector('.navbar-toggler'); if(btn) btn.click();
          }
        });
      }catch(e){/* noop */}
    });
  });
})();

// 3D phone interactivity: respect reduced-motion and add subtle tilt on pointer move
(function(){
  document.addEventListener('DOMContentLoaded',()=>{
    const phone = document.querySelector('.phone-3d');
    if(!phone) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // add a helper class on body for runtime styling or JS checks
  if(prefersReduced){ document.body.classList.add('reduced-motion'); phone.style.animationPlayState='paused'; return; }
    // tilt on pointer movement (desktop)
    phone.addEventListener('pointermove', (e)=>{
      const rect = phone.getBoundingClientRect();
      const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
      const dx = (e.clientX - cx)/rect.width; const dy = (e.clientY - cy)/rect.height;
      const ry = dx*8; const rx = -dy*6;
      phone.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    phone.addEventListener('pointerleave', ()=>{ phone.style.transform='rotateX(0deg) rotateY(0deg)'; });
    // pause rotation on enter, resume on leave
  phone.addEventListener('pointerenter', ()=>{ if(!document.body.classList.contains('reduced-motion')) phone.style.animationPlayState='paused'; });
  phone.addEventListener('pointerout', ()=>{ if(!document.body.classList.contains('reduced-motion')) phone.style.animationPlayState='running'; });

    // If screens contain images, keep them; otherwise create a simple app-grid preview
    [...document.querySelectorAll('.phone-screen')].forEach((s,i)=>{
      const img = s.querySelector('img');
      if(!img){
        const grid=document.createElement('div'); grid.className='app-grid';
        for(let k=0;k<6;k++){ const t=document.createElement('div'); t.className='app-tile'; t.textContent='App '+(k+1); grid.appendChild(t); }
        s.appendChild(grid);
      } else {
        // replace image with app-grid if small thumbnail style desired
        img.addEventListener('load',()=>{
          // ensure cover fits nicely
          img.style.objectFit='cover';
        });
      }
    });
  });
})();

// Team modal handler: populate and show modal when clicking 'Voir profil'
(function(){
  document.addEventListener('DOMContentLoaded',()=>{
    const modalEl = document.getElementById('profileModal');
    if(!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    const nameEl = document.getElementById('modal-name');
    const roleEl = document.getElementById('modal-role');
    const emailEl = document.getElementById('modal-email');
    const bioEl = document.getElementById('modal-bio');
    const avatarEl = document.getElementById('modal-avatar');

    document.querySelectorAll('.view-profile').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const name = btn.getAttribute('data-name')||'';
        const role = btn.getAttribute('data-role')||'';
        const email = btn.getAttribute('data-email')||'';
        const bio = btn.getAttribute('data-bio')||'';
        // try to locate avatar from the card
        const card = btn.closest('.team-card');
        const img = card?.querySelector('img')?.src || 'assets/img/team-1.jpg';
        nameEl.textContent = name; roleEl.textContent = role; emailEl.textContent = email; emailEl.href = 'mailto:'+email; bioEl.textContent = bio; avatarEl.src = img; avatarEl.alt = name;
        modal.show();
      });
    });
  });
})();