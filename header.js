(() => {
 const header=document.getElementById('qaaHeader');if(!header?.classList.contains('ref-header'))return;
 // Keep shared navigation consistent across the static course pages.
  const online=header.querySelector('#ref-online');
  const album=header.querySelector('#ref-courses a[href*="album-design"]');
  if(online&&album){
   const label='Video Editing Course <small class="ref-ai-label">AI Powered</small>';
   const tab0 = online.querySelector('#ref-online-tab-0');
   if (tab0) tab0.innerHTML='<span class="ref-category-label">'+label+'</span><span aria-hidden="true">›</span>';
   const p0 = online.querySelector('#ref-online-panel-0 :is(h2, .ref-panel-title)');
   if (p0) p0.innerHTML=label;
   const design=online.querySelector('#ref-online-panel-2');
   if (design) {
     const marketing=design.cloneNode(true);marketing.id='ref-online-panel-3';marketing.setAttribute('aria-labelledby','ref-online-tab-3');
     const mTitle = marketing.querySelector(':is(h2, .ref-panel-title)');
     if (mTitle) mTitle.textContent='Digital Marketing';
     design.after(marketing);
     const onlineSample=online.querySelector('a[href*="premiere-pro-course"]')||online.querySelector('a[href*="edius-course"]')||online.querySelector('a');
     let onlineAlbumHref='online/album-design-course/';
     if(onlineSample){
      const s=onlineSample.getAttribute('href');
      if(s.includes('premiere-pro-course/'))onlineAlbumHref=s.replace('premiere-pro-course/','album-design-course/').replace('index.html','');
      else if(s.includes('edius-course/'))onlineAlbumHref=s.replace('edius-course/','album-design-course/').replace('index.html','');
      else onlineAlbumHref=s.replace(/[^/]+\/?$/,'album-design-course/').replace('index.html','');
     }
     const onlineAlbumCard=document.createElement('a');onlineAlbumCard.className='ref-course';onlineAlbumCard.href=onlineAlbumHref;
     onlineAlbumCard.innerHTML='<span class="ref-course-icon" aria-hidden="true">Ad</span><span>Wedding Album Design</span>';
     const dTitle = design.querySelector(':is(h2, .ref-panel-title)');
     if (dTitle) dTitle.textContent='Graphics Design Course';
     const dGrid = design.querySelector('.ref-card-grid');
     if (dGrid) dGrid.replaceChildren(onlineAlbumCard);
     const tab=online.querySelector('#ref-online-tab-2');
     if (tab) {
       tab.innerHTML='Graphics Design Course<span aria-hidden="true">›</span>';
       const next=tab.cloneNode(true);next.id='ref-online-tab-3';next.setAttribute('aria-controls','ref-online-panel-3');next.innerHTML='Digital Marketing<span aria-hidden="true">›</span>';tab.after(next);
     }
     const mobileOnline=header.querySelector('#ref-mobile details, .ref-mobile details, .ref-mobile-nav details');
     if(mobileOnline){
       const groups=mobileOnline.querySelectorAll('.ref-mobile-group');
       if(groups[0])groups[0].innerHTML=label;
       if(groups[2]){groups[2].textContent='Graphics Design Course';const card=onlineAlbumCard.cloneNode(true);groups[2].after(card);const heading=document.createElement('p');heading.className='ref-mobile-group';heading.textContent='Digital Marketing';card.after(heading);}
     }
     let onlineAutomationHref='online/automation-course/';
     if(onlineSample){
      const s=onlineSample.getAttribute('href');
      if(s.includes('premiere-pro-course/'))onlineAutomationHref=s.replace('premiere-pro-course/','automation-course/').replace('index.html','');
      else if(s.includes('edius-course/'))onlineAutomationHref=s.replace('edius-course/','automation-course/').replace('index.html','');
      else if(s.includes('online/'))onlineAutomationHref=s.replace(/online\/.*$/,'online/automation-course/').replace('index.html','');
      else onlineAutomationHref=s.replace(/[^/]+\/?$/,'automation-course/').replace('index.html','');
     }
     const marketingCard=marketing.querySelector('a[href*="digital-marketing-course/"]');
     if (marketingCard) {
       const marketingCards=['Google and Facebook Ads Course','SEO Course','GMB Profile Course'].map((title,i)=>{const card=marketingCard.cloneNode(true);const icon = card.querySelector('.ref-course-icon'); if (icon) icon.textContent=['Ads','SEO','GMB'][i];const span = card.querySelector('span:last-child'); if (span) span.textContent=title;return card;});
       const automationCard=marketingCard.cloneNode(true);
       automationCard.href=onlineAutomationHref;
       const aIcon = automationCard.querySelector('.ref-course-icon');
       if (aIcon) aIcon.textContent='AI';
       const aSpan = automationCard.querySelector('span:last-child');
       if (aSpan) aSpan.textContent='Studio Automation & AI CRM';
       const mGrid = marketing.querySelector('.ref-card-grid');
       if (mGrid) mGrid.replaceChildren(...marketingCards, automationCard);
       if(mobileOnline){
         mobileOnline.querySelectorAll('a[href*="website-design-course/"],a[href*="automation-course/"]').forEach(card=>card.remove());
         const oldMobileMarketing=mobileOnline.querySelector('a[href*="digital-marketing-course/"]');
         if(oldMobileMarketing){oldMobileMarketing.replaceWith(...marketingCards.map(card=>card.cloneNode(true)), automationCard.cloneNode(true));}
       }
     }
   }
  }

  // Ensure "View All Online Programs" is prominently present in all online panels & mobile nav
  if(online){
   let onlineHubHref = 'online/';
   const sampleOnline = online.querySelector('a[href*="premiere-pro-course"]') || online.querySelector('a[href*="edius-course"]');
   if(sampleOnline){
    const s = sampleOnline.getAttribute('href');
    if(s.includes('online/')){
     onlineHubHref = s.replace(/online\/.*$/, 'online/').replace('index.html','');
    } else {
     onlineHubHref = s.replace(/[^/]+\/?.*$/, './').replace('index.html','');
    }
   }

   online.querySelectorAll('.ref-panels > [role="tabpanel"]').forEach(panel => {
    let allLink = panel.querySelector('.ref-all-online');
    if(!allLink){
     allLink = document.createElement('a');
     allLink.className = 'ref-all ref-all-online';
     panel.append(allLink);
    }
    allLink.href = onlineHubHref;
    allLink.innerHTML = 'View all online programs →';
   });

   const mobileOnline = header.querySelector('#ref-mobile details, .ref-mobile details, .ref-mobile-nav details');
   if(mobileOnline){
    let allMobileLink = mobileOnline.querySelector('.ref-mobile-all-online');
    if(!allMobileLink){
     allMobileLink = document.createElement('a');
     allMobileLink.className = 'ref-mobile-all-online';
     allMobileLink.innerHTML = 'View all online programs →';
     allMobileLink.style.cssText = 'display:inline-flex;align-items:center;gap:4px;padding:6px 0;margin:12px 0 6px;background:none;border:none;color:#8c5f20;font-weight:600;font-size:13px;text-decoration:none;';
     mobileOnline.append(allMobileLink);
    }
    allMobileLink.href = onlineHubHref;
   }
  }

 const mobileNav=header.querySelector('#ref-mobile, .ref-mobile, .ref-mobile-nav');
 const campus=header.querySelector('#ref-courses');
 if(campus){
  const vCard=campus.querySelector('a[href*="courses/video-editing/"]');
  const gCard=campus.querySelector('a[href*="album-design/"]');
  const wCard=campus.querySelector('a[href*="ai-wedding-filmmaking/"]');
  if (vCard && gCard && wCard) {
    const video=vCard.cloneNode(true);
    const graphics=gCard.cloneNode(true);
    const wedding=wCard.cloneNode(true);
    const vSpan = video.querySelector('span:last-child');
    if (vSpan) vSpan.innerHTML='Video Editing Course<small class="ref-ai-label">AI Powered</small>';
    const gSpan = graphics.querySelector('span:last-child');
    if (gSpan) gSpan.textContent='Wedding Album Design';
    const wSpan = wedding.querySelector('span:last-child');
    if (wSpan) wSpan.textContent='Wedding Filmmaking Course';
    const categories=campus.querySelector('.ref-categories'),panels=campus.querySelector('.ref-panels');
    if (categories && panels) {
      categories.replaceChildren();panels.replaceChildren();
      const aiMarketing=wedding.cloneNode(true);
      const aiSpan = aiMarketing.querySelector('span:last-child');
      if (aiSpan) aiSpan.textContent='AI Marketing Course (Free)';
      const aiIcon = aiMarketing.querySelector('.ref-course-icon');
      if (aiIcon) aiIcon.textContent='AI';
      const entries=[['Video Editing Course',video,true],['Graphics Design',graphics,false],['Wedding Filmmaking Course',wedding,false],['AI Marketing Course (Free)',aiMarketing,false]];
      entries.forEach(([name,card,ai],i)=>{
       const tab=document.createElement('button');tab.type='button';tab.id='ref-courses-tab-'+i;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','ref-courses-panel-'+i);tab.setAttribute('aria-selected',String(i===0));tab.tabIndex=i===0?0:-1;
       tab.innerHTML='<span class="ref-category-label">'+name+(ai?'<small class="ref-ai-label">AI Powered</small>':'')+'</span><span aria-hidden="true">›</span>';categories.append(tab);
       const panel=document.createElement('div');panel.id='ref-courses-panel-'+i;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=i!==0;
       const heading=document.createElement('div');heading.className='ref-panel-title';heading.textContent=name;const grid=document.createElement('div');grid.className='ref-card-grid';grid.append(card);panel.append(heading,grid);panels.append(panel);
      });
      if (mobileNav) {
        const mobileCampus=[...mobileNav.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent.trim()==='On Campus Programs');
        if(mobileCampus){const summary=mobileCampus.querySelector('summary');mobileCampus.replaceChildren(summary,video.cloneNode(true));const heading=document.createElement('p');heading.className='ref-mobile-group';heading.textContent='Graphics Design';mobileCampus.append(heading,graphics.cloneNode(true),wedding.cloneNode(true),aiMarketing.cloneNode(true));}
      }
    }
  }
 }
 const contact=header.querySelector('.ref-nav>a[href*="contact-us"]');
 if(mobileNav&&contact){const cta=document.createElement('a');cta.className='ref-demo-cta';cta.href=contact.href;cta.textContent='Book Free Demo';mobileNav.append(cta);}
 const drops=[...header.querySelectorAll('.ref-dropdown')];
 header.querySelectorAll('#ref-online-tab-1,#ref-online-panel-1 :is(h2, .ref-panel-title),#ref-mobile .ref-mobile-group').forEach(label=>{
  if(label.textContent.replace('›','').trim()!=='Wedding Filmmaking')return;
  if(label.id==='ref-online-tab-1')label.firstChild.textContent='Wedding Filmmaking Course';
  else label.textContent='Wedding Filmmaking Course';
 });
 const appLink=document.createElement('a');appLink.href='https://play.google.com/store/apps/details?id=com.lmwkkjh799.classes&hl=en';appLink.target='_blank';appLink.rel='noopener noreferrer';appLink.textContent='Download Our App';
 const resources=header.querySelector('#ref-resources');if(resources)resources.append(appLink);
 const mobileResources=[...header.querySelectorAll('#ref-mobile details')].find(detail=>detail.querySelector('summary')?.textContent.trim()==='Free Resources');if(mobileResources)mobileResources.append(appLink.cloneNode(true));
 header.querySelectorAll('.ref-ai-label').forEach(label=>label.classList.add('ref-highlight-badge'));
 header.querySelectorAll('#ref-courses .ref-category-label,#ref-courses :is(h2, .ref-panel-title),#ref-mobile .ref-mobile-group').forEach(label=>{
  if(label.textContent.trim()!=='Graphics Design')return;
  const note=document.createElement('small');note.className='ref-highlight-badge ref-course-update';note.textContent='Updated Course';label.append(note);
 });
 header.querySelectorAll('#ref-online-tab-2,#ref-online-panel-2 :is(h2, .ref-panel-title),#ref-mobile .ref-mobile-group').forEach(label=>{
  if(!label.textContent.startsWith('Graphics Design Course'))return;
  const update=document.createElement('small');update.className='ref-highlight-badge ref-updated-label';update.textContent='Updated';
  if(label.id==='ref-online-tab-2'){const title=document.createElement('span');title.className='ref-category-label';title.textContent='Graphics Design Course';title.append(update);label.replaceChild(title,label.firstChild);}else label.append(update);
 });
 header.querySelectorAll('#ref-courses .ref-category-label,#ref-courses :is(h2, .ref-panel-title),#ref-courses .ref-course>span:last-child,#ref-mobile .ref-course>span:last-child').forEach(label=>{
  if(label.textContent.trim()==='AI Marketing Course (Free)'){
   label.replaceChildren(document.createTextNode('AI Marketing Course '));
   const badge=document.createElement('small');badge.className='ref-highlight-badge ref-free-badge';badge.textContent='Free';label.append(badge);
  }
 });
   function set(drop,open){
     const button=drop.querySelector('.ref-toggle');
     if(!button) return;
     const panel=document.getElementById(button.getAttribute('aria-controls'));
     if(!panel) return;
     button.setAttribute('aria-expanded',String(open));
     panel.hidden=!open;
     panel.style.display = open ? '' : 'none';
   }
   function closeAll(){
     drops.forEach(d => set(d, false));
   }
   let hoverTimer = null;

  drops.forEach(drop => {
    const toggle = drop.querySelector('.ref-toggle');
    if (!toggle) return;

    // Desktop Mouse Hover: Open megamenu on mouse hover
    drop.addEventListener('mouseenter', () => {
      if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      drops.forEach(d => { if (d !== drop) set(d, false); });
      set(drop, true);
    });

    // Desktop Mouse Hover: Close megamenu when mouse leaves with comfortable 180ms buffer
    drop.addEventListener('mouseleave', () => {
      if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        set(drop, false);
      }, 180);
    });

    // Click behavior (works for touch/mobile devices or manual clicks)
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      closeAll();
      set(drop, open);
    });

    drop.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        set(drop, false);
        toggle.focus();
      }
    });

    drop.addEventListener('focusout', event => {
      if (!drop.contains(event.relatedTarget)) set(drop, false);
    });

   const tabs=[...drop.querySelectorAll('[role=tab]')];
   function select(tab){
    tabs.forEach(t=>{
      const active=t===tab;
      t.setAttribute('aria-selected',String(active));
      t.tabIndex=active?0:-1;
      const targetPanel = document.getElementById(t.getAttribute('aria-controls'));
      if(targetPanel) {
        targetPanel.hidden=!active;
        targetPanel.style.display = active ? '' : 'none';
      }
    });
   }
   tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')select(tab);});
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowDown')next=(i+1)%tabs.length;
      else if(event.key==='ArrowUp')next=(i+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();
      select(tabs[next]);
      tabs[next].focus();
    });
   });
  });

  // Close open dropdowns immediately when hovering over other top links or brand
  header.querySelectorAll('.ref-nav > a, .ref-brand, .ref-login').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (window.matchMedia && !window.matchMedia('(hover: hover)').matches) return;
      if (hoverTimer) clearTimeout(hoverTimer);
      closeAll();
    });
  });

  // Ensure all dropdowns are strictly closed by default on initial page load
  closeAll();
  const menu = header.querySelector('#ref-mobile, .ref-mobile, .ref-mobile-nav');
  if (menu) {
    if (!menu.id) menu.id = 'ref-mobile';
    if (!menu.classList.contains('ref-mobile')) menu.classList.add('ref-mobile');
    const originalLogin = header.querySelector('.ref-login');
    const loginHref = originalLogin ? (originalLogin.getAttribute('href') || 'portal/') : 'portal/';

    // Check student logged in status from portal
    const studentToken = localStorage.getItem('qaa_student_token') || '';
    const isStudentLoggedIn = !!studentToken;

    function handleQaaLogout(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!confirm('Kya aap Quick Art Academy student portal se logout karna chahte hain?')) return;
      try {
        const token = localStorage.getItem('qaa_student_token');
        if (token) {
          fetch('/api/lms.php?action=logout', {
            method: 'POST',
            headers: { 'X-Student-Token': token }
          }).catch(() => {});
        }
      } catch (err) {}
      localStorage.removeItem('qaa_student_token');
      localStorage.removeItem('qa_user_phone');
      localStorage.removeItem('qa_user_name');
      localStorage.removeItem('qaa_student_data');
      window.location.reload();
    }
    window.qaaStudentLogout = handleQaaLogout;

    // Desktop Login / Logout State
    if (originalLogin) {
      originalLogin.removeAttribute('target');
      if (isStudentLoggedIn) {
        const authContainer = document.createElement('div');
        authContainer.className = 'ref-auth-container';
        authContainer.style.cssText = 'display:inline-flex;align-items:center;gap:8px;flex-shrink:0;';

        const classroomLink = document.createElement('a');
        classroomLink.className = 'ref-login ref-btn-classroom';
        classroomLink.href = loginHref;
        classroomLink.textContent = 'My Course →';
        classroomLink.title = 'Access My Course';
        classroomLink.style.cssText = 'background:linear-gradient(110deg,#f3d695,#d8a447);color:#17120b;border-color:#d8a447;font-weight:700;padding:0 14px;';
        classroomLink.removeAttribute('target');

        const logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'ref-login ref-btn-logout';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = 'border-color:rgba(244,63,94,0.5);color:#fda4af;background:rgba(244,63,94,0.08);padding:0 14px;cursor:pointer;';
        logoutBtn.title = 'Logout from Student Account';
        logoutBtn.onclick = handleQaaLogout;

        authContainer.append(classroomLink, logoutBtn);
        originalLogin.replaceWith(authContainer);
      }
    }

    let mobileLogin = header.querySelector('.ref-mobile-login');
    const oldMenuBtn = header.querySelector('.ref-menu-button');

    if (isStudentLoggedIn) {
      const myCourseHtml = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg><span>My Course</span>';
      if (!mobileLogin) {
        mobileLogin = document.createElement('a');
        mobileLogin.className = 'ref-mobile-login ref-mobile-mycourse-btn';
        mobileLogin.href = loginHref;
        mobileLogin.setAttribute('aria-label', 'My Course');
        mobileLogin.title = 'My Course';
        mobileLogin.innerHTML = myCourseHtml;
        if (oldMenuBtn) {
          oldMenuBtn.replaceWith(mobileLogin);
        } else {
          header.querySelector('.ref-bar')?.append(mobileLogin);
        }
      } else {
        mobileLogin.className = 'ref-mobile-login ref-mobile-mycourse-btn';
        mobileLogin.href = loginHref;
        mobileLogin.removeAttribute('target');
        mobileLogin.setAttribute('aria-label', 'My Course');
        mobileLogin.title = 'My Course';
        mobileLogin.innerHTML = myCourseHtml;
        if (oldMenuBtn) oldMenuBtn.remove();
      }
    } else {
      const loginIconHtml = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>';
      if (!mobileLogin) {
        mobileLogin = document.createElement('a');
        mobileLogin.className = 'ref-mobile-login';
        mobileLogin.href = loginHref;
        mobileLogin.setAttribute('aria-label', 'Login');
        mobileLogin.title = 'Login';
        mobileLogin.innerHTML = loginIconHtml;
        if (oldMenuBtn) {
          oldMenuBtn.replaceWith(mobileLogin);
        } else {
          header.querySelector('.ref-bar')?.append(mobileLogin);
        }
      } else {
        mobileLogin.className = 'ref-mobile-login';
        mobileLogin.href = loginHref;
        mobileLogin.removeAttribute('target');
        mobileLogin.setAttribute('aria-label', 'Login');
        mobileLogin.title = 'Login';
        mobileLogin.innerHTML = loginIconHtml;
        if (oldMenuBtn) oldMenuBtn.remove();
      }
    }

    let programsBtn = header.querySelector('.ref-mobile-programs');
    if (!programsBtn) {
      programsBtn = document.createElement('button');
      programsBtn.type = 'button';
      programsBtn.className = 'ref-mobile-programs';
      programsBtn.setAttribute('aria-label', 'Explore Programs');
      programsBtn.innerHTML = '<span>Programs</span><svg class="ref-programs-arrow" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5"></path></svg>';
      mobileLogin.before(programsBtn);
    } else if (!programsBtn.querySelector('.ref-programs-arrow')) {
      programsBtn.innerHTML = '<span>Programs</span><svg class="ref-programs-arrow" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5"></path></svg>';
    }

    if (!menu.querySelector('.ref-drawer-head')) {
      const drawerHead = document.createElement('div');
      drawerHead.className = 'ref-drawer-head';
      const brandImg = header.querySelector('.ref-brand img');
      const imgSrc = brandImg ? brandImg.getAttribute('src') : 'home-assets/ec55a6be3747a9.webp';
      drawerHead.innerHTML = `<div class="ref-drawer-title"><img src="${imgSrc}" width="30" height="30" alt="Quick Art" style="object-fit:contain;border-radius:6px;"><span>Quick <b>Art</b> <small>ACADEMY</small></span></div><button type="button" class="ref-drawer-close" aria-label="Close navigation"><span aria-hidden="true">✕</span></button>`;
      
      let studentCard = null;
      if (isStudentLoggedIn) {
        studentCard = document.createElement('div');
        studentCard.className = 'ref-drawer-student-card';
        studentCard.innerHTML = `
          <div class="ref-drawer-student-top">
            <span class="ref-drawer-student-badge">
              <span class="ref-student-online-dot"></span>
              Enrolled Student
            </span>
          </div>
        `;
      }

      const drawerBody = document.createElement('div');
      drawerBody.className = 'ref-drawer-body';
      
      const drawerActions = document.createElement('div');
      drawerActions.className = 'ref-drawer-actions';
      
      const demo = menu.querySelector('.ref-demo-cta');
      if (isStudentLoggedIn) {
        const mClassroom = document.createElement('a');
        mClassroom.className = 'ref-login ref-drawer-login ref-drawer-mycourse';
        mClassroom.href = loginHref;
        mClassroom.textContent = 'My Course →';
        mClassroom.style.cssText = 'background:linear-gradient(110deg,#f3d695,#d8a447);color:#17120b;font-weight:700;border:none;border-radius:999px;';
        
        const mLogout = document.createElement('button');
        mLogout.type = 'button';
        mLogout.className = 'ref-login ref-drawer-logout';
        mLogout.textContent = 'Logout';
        mLogout.style.cssText = 'border:1px solid rgba(244,63,94,0.45);color:#fda4af;background:rgba(244,63,94,0.12);width:100%;cursor:pointer;border-radius:999px;font-weight:700;';
        mLogout.onclick = handleQaaLogout;

        drawerActions.append(mClassroom, mLogout);
      } else {
        if (originalLogin) {
          const login = originalLogin.cloneNode(true);
          login.classList.add('ref-drawer-login');
          login.removeAttribute('target');
          login.textContent = 'Login';
          drawerActions.append(login);
        }
        if (demo) drawerActions.append(demo);
      }

      // Remove any legacy student portal button so all pages have the identical clean mobile drawer as homepage
      menu.querySelectorAll('.ref-mobile-lms').forEach(el => el.remove());

      while (menu.firstChild) drawerBody.append(menu.firstChild);
      
      if (studentCard) {
        menu.append(drawerHead, studentCard, drawerBody, drawerActions);
      } else {
        menu.append(drawerHead, drawerBody, drawerActions);
      }
    }

    let backdrop = document.querySelector('.ref-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'ref-drawer-backdrop';
      backdrop.hidden = true;
      backdrop.setAttribute('hidden', '');
      backdrop.style.display = 'none';
      document.body.appendChild(backdrop);
    }
    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }

    // Ensure all accordions start closed initially
    menu.querySelectorAll('details').forEach(d => { d.open = false; });

    function drawerState(open) {
      backdrop.hidden = !open;
      if (open) {
        backdrop.removeAttribute('hidden');
        backdrop.style.display = 'block';
        document.body.classList.add('ref-nav-locked');
      } else {
        backdrop.setAttribute('hidden', '');
        backdrop.style.display = 'none';
        document.body.classList.remove('ref-nav-locked');
      }
    }

    function openMobile() {
      // Ensure all accordions are collapsed so the clean main menu is shown
      menu.querySelectorAll('details').forEach(d => { d.open = false; });
      const drawerBody = menu.querySelector('.ref-drawer-body');
      if (drawerBody) {
        drawerBody.scrollTop = 0;
      }
      menu.hidden = false;
      menu.removeAttribute('hidden');
      menu.classList.add('ref-mobile-open');
      drawerState(true);
      if (programsBtn) {
        programsBtn.setAttribute('aria-expanded', 'true');
      }
      closeAll();
    }

    function closeMobile() {
      menu.hidden = true;
      menu.setAttribute('hidden', '');
      menu.classList.remove('ref-mobile-open');
      drawerState(false);
      if (programsBtn) {
        programsBtn.setAttribute('aria-expanded', 'false');
      }
      menu.querySelectorAll('details').forEach(d => { d.open = false; });
    }

    let lastToggleTime = 0;
    function toggleMobile(e) {
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }
      const now = Date.now();
      if (now - lastToggleTime < 350) return;
      lastToggleTime = now;

      if (menu.hidden || !menu.classList.contains('ref-mobile-open')) {
        openMobile();
      } else {
        closeMobile();
      }
    }

    if (programsBtn) {
      programsBtn.onclick = toggleMobile;
      programsBtn.ontouchend = toggleMobile;
    }

    backdrop.onclick = (e) => {
      e?.stopPropagation();
      closeMobile();
    };
    backdrop.ontouchend = (e) => {
      if (e && e.cancelable) e.preventDefault();
      e?.stopPropagation();
      closeMobile();
    };

    const closeBtn = menu.querySelector('.ref-drawer-close');
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e?.stopPropagation();
        closeMobile();
      };
      closeBtn.ontouchend = (e) => {
        if (e && e.cancelable) e.preventDefault();
        e?.stopPropagation();
        closeMobile();
      };
    }

    // Stop click events inside drawer from bubbling to document (prevents drawer closing on + / -)
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    menu.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
      if (detail.open) menu.querySelectorAll('details').forEach(other => {
        if (other !== detail) other.open = false;
      });
    }));

    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      if (a.getAttribute('href') && a.getAttribute('href') !== '#') {
        closeMobile();
      }
    }));

    header.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !menu.hidden) {
        closeMobile();
        programsBtn?.focus();
      }
    });

    document.addEventListener('click', event => {
      if (!header.contains(event.target) && !menu.contains(event.target) && !backdrop.contains(event.target)) {
        closeAll();
        closeMobile();
      }
    });

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(min-width:1151px)');
      mq?.addEventListener?.('change', () => {
        closeAll();
        closeMobile();
      });
    }

    // Dynamic header style on scroll (transitions from dark hero header to frosted light-glass over light page backgrounds)
    let scrollTicking = false;
    function updateHeaderScroll() {
      const scrolled = (window.pageYOffset || document.documentElement.scrollTop || window.scrollY || 0) > 20;
      header.classList.toggle('ref-scrolled', scrolled);
      scrollTicking = false;
    }
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateHeaderScroll);
        scrollTicking = true;
      }
    }, { passive: true });
    updateHeaderScroll();
  }
})();
