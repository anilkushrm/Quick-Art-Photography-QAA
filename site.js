/* Plain JavaScript: shared navigation, progressive enhancement and real lead submission. */
(() => {
 'use strict';
 const scriptURL = document.currentScript?.src || new URL('site.js', location.href).href;
 const siteRoot = new URL('.', scriptURL);
 const header = document.querySelector('.qa-header');
 if (header) {
  if ((location.pathname || '/') === '/' || (location.pathname || '').endsWith('/index.html')) header.classList.add('qa-home-header');
  const toggle = header.querySelector('.qa-mobile');
  const nav = header.querySelector('.qa-nav');
  const courses = header.querySelector('.qa-courses');
  if (nav && nav.querySelectorAll) {
   const links = [...nav.querySelectorAll(':scope > a')];
   const blog = links.find(a => a.textContent.trim() === 'Blog');
   const faq = links.find(a => a.textContent.trim() === 'FAQ');
   const about = links.find(a => a.textContent.trim() === 'About');
   if (blog) blog.remove();
   if (faq) faq.remove();
   if (!nav.querySelector('.qa-resources')) {
    const resources = document.createElement('details'); resources.className = 'qa-resources';
    resources.innerHTML = `<summary>Resources <span class="qa-chevron" aria-hidden="true">⌄</span></summary><div class="qa-resources-menu"><a href="${about?.getAttribute('href') || '../about-us/index.html'}">About Us</a><a href="${blog?.getAttribute('href') || '../blog/index.html'}">Blog</a><a href="${faq?.getAttribute('href') || '../index.html#faq'}">FAQ</a><a href="https://play.google.com/store/apps/details?id=com.lmwkkjh799.classes&amp;hl=en" target="_blank" rel="noreferrer">Download Our App</a><a href="https://www.youtube.com/@QuickartPhotographyAcademy/videos" target="_blank" rel="noreferrer">YouTube</a><a href="https://wa.me/919939800780" target="_blank" rel="noreferrer">WhatsApp</a></div>`;
   const contact = links.find(a => a.textContent.trim() === 'Contact');
   if (contact && nav.insertBefore) nav.insertBefore(resources, contact); else nav.append(resources);
   }
   const resourcesMenu = nav.querySelector('.qa-resources');
   if (resourcesMenu) {
    let resourcesCloseTimer;
    resourcesMenu.addEventListener('pointerenter', () => { window.clearTimeout(resourcesCloseTimer); resourcesMenu.open = true; });
    resourcesMenu.addEventListener('pointerleave', () => { resourcesCloseTimer = window.setTimeout(() => { resourcesMenu.open = false; }, 180); });
    resourcesMenu.addEventListener('focusin', () => window.clearTimeout(resourcesCloseTimer));
    resourcesMenu.addEventListener('focusout', () => { resourcesCloseTimer = window.setTimeout(() => { if (!resourcesMenu.contains(document.activeElement)) resourcesMenu.open = false; }, 0); });
   }
  }
  // Keep the mega menu labels and chips aligned with the approved reference header.
  if (courses && courses.querySelectorAll) {
   const labels = courses.querySelectorAll('.qa-mega-title p, .qa-tag-group h3');
   if (labels[0]) labels[0].textContent = 'POPULAR PROGRAMS';
   if (labels[1]) labels[1].textContent = 'BY CAREER';
   if (labels[2]) labels[2].textContent = 'BY SOFTWARE';
   if (labels[3]) labels[3].textContent = 'BY MODE';
   const groups = courses.querySelectorAll('.qa-tag-group');
   const addChip = (group, text, href) => { if (group && ![...group.querySelectorAll('a')].some(a => a.textContent.trim() === text)) { const a = document.createElement('a'); a.href = href; a.textContent = text; group.querySelector('div')?.append(a); } };
   addChip(groups[0], 'Content Creator', 'https://quickartphotography.in/courses/index.html');
   addChip(groups[1], 'After Effects', 'https://quickartphotography.in/courses/video-editing/index.html');
   addChip(groups[1], 'AI Tools', 'https://quickartphotography.in/courses/ai-wedding-filmmaking/index.html');
   addChip(groups[2], 'Weekend Batch', 'https://quickartphotography.in/contact-us/index.html');
  }
  document.documentElement.classList.add('qa-js');
  // Transparent dark header at the top; a light floating bar after scrolling.
  let scrollScheduled = false;
  const updateHeader = () => {
   header.classList.toggle('qa-scrolled', window.scrollY > 32);
   scrollScheduled = false;
  };
  updateHeader();
  window.addEventListener('scroll', () => {
   if (!scrollScheduled) {
    scrollScheduled = true;
    window.requestAnimationFrame(updateHeader);
   }
  }, {passive: true});
  window.addEventListener('pageshow', updateHeader);
  // Desktop opens the entire menu on hover; native details keeps click/touch/keyboard support.
  const hoverMenu = window.matchMedia('(min-width:1200px) and (hover:hover) and (pointer:fine)');
  let menuCloseTimer;
  const cancelMenuClose = () => window.clearTimeout(menuCloseTimer);
  const closeCourses = () => {cancelMenuClose(); courses.open = false;};
  courses.addEventListener('pointerenter', () => {
   if (!hoverMenu.matches) return;
   cancelMenuClose();
   courses.open = true;
  });
  courses.addEventListener('pointerleave', () => {
   if (!hoverMenu.matches) return;
   cancelMenuClose();
   menuCloseTimer = window.setTimeout(() => {courses.open = false;}, 180);
  });
  courses.addEventListener('focusin', cancelMenuClose);
  courses.addEventListener('focusout', () => {
   cancelMenuClose();
   menuCloseTimer = window.setTimeout(() => {
    if (!courses.contains(document.activeElement)) courses.open = false;
   }, 0);
  });
  hoverMenu.addEventListener('change', closeCourses);
  const closeNav = () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => {
   const open = toggle.getAttribute('aria-expanded') !== 'true';
   toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
  });
  document.addEventListener('click', event => {
   if (!header.contains(event.target)) { closeCourses(); closeNav(); }
  });
  header.addEventListener('keydown', event => {
   if (event.key !== 'Escape') return;
   if (courses.open) { closeCourses(); courses.querySelector('summary').focus(); }
   else { closeNav(); toggle.focus(); }
  });
  header.addEventListener('click', event => {
   const link = event.target.closest('a');
   if (!link) return;
   closeCourses(); closeNav();
   const destination = new URL(link.href);
   if (destination.pathname === location.pathname && destination.hash) {
    const target = document.getElementById(destination.hash.slice(1));
    if (target) { target.setAttribute('tabindex','-1'); target.focus({preventScroll:true});target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true}); }
   }
  });
  window.matchMedia('(min-width:1200px)').addEventListener('change', () => {closeNav(); closeCourses();});
 }
 document.querySelectorAll('[data-year]').forEach(node => {node.textContent = String(new Date().getFullYear());});
 // Keep the software showcase compact so the tools support the page instead of dominating it.
 document.querySelectorAll('section').forEach(section => {
  if (section.querySelector('h2')?.textContent.includes('Pro tools used by industry leaders')) section.classList.add('qa-tools-section');
  if (section.querySelector('[data-thanks-heading]')) section.classList.add('qa-thanks-page');
 });
 const homeBadge = document.querySelector('.qa-home-hero .qa-hero-badge');
 if (homeBadge) homeBadge.textContent = 'New Batch Starting Soon · Wedding Editing & Album Design';
 if ((location.pathname || '').includes('/contact-us/')) document.querySelector('main')?.classList.add('qa-contact-page');
 if ((location.pathname || '').includes('/courses/video-editing/')) document.querySelector('main')?.classList.add('qa-video-page');
 if ((location.pathname || '').includes('/courses/album-design/')) document.querySelector('main')?.classList.add('qa-album-page');
 if ((location.pathname || '').includes('/courses/ai-wedding-filmmaking/')) document.querySelector('main')?.classList.add('qa-ai-page');
 // Match the Master Class hero to the cinematic campaign layout while keeping the page content factual.
 if ((location.pathname || '').includes('/master-class/')) {
  const hero = document.querySelector('main > section.relative.bg-ink');
  if (hero) {
   hero.classList.add('qa-master-hero');
   const heroGrid = hero.querySelector('.container.relative > .grid');
   if (heroGrid) { heroGrid.classList.add('qa-master-hero-grid'); heroGrid.style.gridTemplateColumns = 'minmax(0,1.08fr) minmax(390px,.72fr)'; heroGrid.style.alignItems = 'center'; }
   const badge = hero.querySelector('.container.relative .lg\\:col-span-3 > .inline-flex span');
   if (badge) badge.textContent = 'Limited seats · New batch starting soon';
   const countdown = hero.querySelector('.lg\\:col-span-3 .mt-9');
   if (countdown && !countdown.children.length) {
    countdown.className = 'qa-countdown';
    countdown.innerHTML = '<p>⏳ Early-bird pricing ends in</p><div class="qa-countdown-grid" role="timer" aria-label="Time remaining for early-bird pricing"><div><strong data-countdown-days>05</strong><span>Days</span></div><div><strong data-countdown-hours>00</strong><span>Hours</span></div><div><strong data-countdown-minutes>00</strong><span>Min</span></div><div><strong data-countdown-seconds>00</strong><span>Sec</span></div></div>';
    const timerKey = 'qa-masterclass-first-visit-deadline-v1';
    const duration = 5 * 86400000;
    let deadline;
    try {
     const stored = localStorage.getItem(timerKey);
     deadline = Number(stored);
     if (!stored || !Number.isFinite(deadline) || deadline <= 0) {
      deadline = Date.now() + duration;
      localStorage.setItem(timerKey, String(deadline));
     }
    } catch (_) {
     // Do not show a resettable deadline when persistent storage is unavailable.
     countdown.hidden = true;
    }
    if (!countdown.hidden) {
     let timerId;
     const tick = () => {
      const sec = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      const set = (name, value) => { countdown.querySelector(`[data-countdown-${name}]`).textContent = String(value).padStart(2, '0'); };
      set('days', Math.floor(sec / 86400)); set('hours', Math.floor(sec % 86400 / 3600)); set('minutes', Math.floor(sec % 3600 / 60)); set('seconds', sec % 60);
      if (sec === 0) { countdown.querySelector('p').textContent = 'Planning timer complete — ask about the next batch'; window.clearInterval(timerId); }
     };
     tick();
     if (deadline > Date.now()) timerId = window.setInterval(tick, 1000);
    }
   }
  }
 }
 // The homepage keeps four clear reasons in one row; remove the duplicate placeholder card.
 const reasonsHeading = [...document.querySelectorAll('h2')].find(node => node.textContent.includes('Five reasons students pick Quick Art'));
 if (reasonsHeading) {
  const grid = reasonsHeading.closest('section')?.querySelector('.mt-14');
  const projectCard = grid && [...grid.children].find(card => card.textContent.trim() === 'Project practice');
  if (projectCard) projectCard.remove();
 }
 document.querySelectorAll('[data-lead-form]').forEach(form => {
  const requestedCourse = new URLSearchParams(location.search).get('course');
  const courseField = form.elements.course;
  if (requestedCourse && requestedCourse.length <= 120 && courseField) {
   if (courseField.tagName === 'SELECT' && ![...courseField.options].some(option => option.value === requestedCourse)) {
    courseField.add(new Option(requestedCourse, requestedCourse));
   }
   courseField.value = requestedCourse;
  }
  // The Master Class already has its section heading above the form; keep the form compact.
  if ((location.pathname || '').includes('/master-class/')) {
   form.classList.add('qa-master-form');
   form.querySelector('.qa-kicker')?.remove();
   form.querySelector('h2')?.remove();
   const intro = form.querySelector(':scope > p:not(.qa-form-status)');
   intro?.remove();
  }
  form.addEventListener('submit', async event => {
   event.preventDefault();
   if (!form.reportValidity()) return;
   const status = form.querySelector('.qa-form-status');
   const button = form.querySelector('button[type="submit"]');
   const phone = form.elements.phone.value.trim();
   if (phone.replace(/\D/g,'').length < 8) {status.textContent = 'Please enter a valid phone number.';form.elements.phone.focus();return;}
   const data = Object.fromEntries(new FormData(form));
   data.source = form.dataset.source || 'website';
   data.consent = true;
   button.disabled = true;
   status.textContent = 'Sending your enquiry…';
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 20000);
   try {
    if (location.protocol === 'file:') throw new Error('local');
    const response = await fetch(new URL('api/leads.php',siteRoot), {
     method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal
    });
    const result = await response.json();
    if (!response.ok || !result.ok || !result.id) throw new Error('server');
    try {sessionStorage.setItem('qa-enquiry-received','true');} catch (_) {}
    location.assign(new URL('thank-you/index.html',siteRoot));
   } catch (error) {
    status.replaceChildren();
    status.append(document.createTextNode('We could not confirm your enquiry. Please call +91 9939800780 or '));
    const link = document.createElement('a');
    link.href = 'mailto:support@quickartphotography.in?subject='+encodeURIComponent('Course enquiry')+'&body='+encodeURIComponent('Name: '+data.name+'\nPhone: '+phone+'\nCity: '+(data.city||'')+'\nCourse: '+(data.course||'')+'\nMessage: '+(data.message||''));
    link.textContent = 'send it by email';status.append(link,document.createTextNode('.'));
    button.disabled = false;
   } finally {clearTimeout(timeout);}
  });
 });
 // Contact page map: keep the Google embed lazy and preserve the supplied map URL.
 if ((location.pathname || '').includes('/contact-us/')) {
  const contactColumn = document.querySelector('#enquiry .qa-split > div');
  const contactLayout = document.querySelector('#enquiry > .container');
  if (contactColumn && contactLayout && !contactLayout.querySelector('.qa-map-wrap')) {
   const wrap = document.createElement('div'); wrap.className = 'qa-map-wrap';
   const link = document.createElement('a'); link.className = 'qa-map-link'; link.href = 'https://www.google.com/maps/search/?api=1&query=Quick+Art+Photography+Academy+Siwan'; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Open in Maps ↗';
   const map = document.createElement('iframe'); map.title = 'Quick Art Photography Academy location map'; map.src = 'https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3579.006652023136!2d84.33479439999999!3d26.228973399999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1788979519455!5m2!1sen!2sin'; map.loading = 'lazy'; map.referrerPolicy = 'strict-origin-when-cross-origin'; map.allowFullscreen = true;
   wrap.append(link, map); contactLayout.append(wrap);
  }
 }
 const thanks = document.querySelector('[data-thanks-heading]');
 if (thanks) {
  try {if (sessionStorage.getItem('qa-enquiry-received') === 'true') {thanks.textContent='Application received';const message=document.querySelector('[data-thanks-message]');if(message)message.textContent='Aapka form successfully submit ho gaya hai. Hamari team aapki enquiry ke baare mein aapse sampark karegi.';sessionStorage.removeItem('qa-enquiry-received');}} catch (_) {}
 }
})();
document.addEventListener('DOMContentLoaded', () => {
 const hero = document.querySelector('.qa-master-hero');
 hero?.querySelectorAll('span').forEach((node) => {
  if (/^\s*12\s*\+\s*2\s*weeks\s*$/i.test(node.textContent)) node.remove();
 });
 hero?.querySelectorAll('*').forEach((node) => {
  if (node.children.length === 0 && /1,800\+ students trained at Quick Art Photography Academy/i.test(node.textContent)) {
   node.remove();
  }
 });
 const form = hero?.querySelector('form.qa-enquiry');
 if (form) {
  const label = form.querySelector('.qa-kicker'); if (label) label.textContent = 'FREE DEMO CLASS';
  const title = form.querySelector('h2'); if (title) title.textContent = 'Book your seat today';
  const copy = form.querySelector('h2 + p'); if (copy) copy.textContent = 'Meet the mentor, tour the studio, and see the exact editing workflow — completely free.';
  const button = form.querySelector('button'); if (button) button.innerHTML = '🎬 Book My Seat Now <span aria-hidden="true">→</span>';
  if (!form.querySelector('.qa-form-proof')) {
   const proof = document.createElement('div'); proof.className = 'qa-form-proof';
   proof.innerHTML = '<div>🔒 Your details are safe. Team calls within 1 hour.</div><p><strong>1,800+</strong> enrollments · <strong>4.9★</strong> rated</p>';
   (form.querySelector('.qa-form-status') || button)?.after(proof);
  }
 }
 const price = hero?.querySelector('.tabular-nums');
 if (price && !hero.querySelector('.qa-price-original')) {
  const priceBlock = price.closest('.mt-7');
 if (priceBlock) priceBlock.innerHTML = '<div class="qa-price-row"><s class="qa-price-original">₹49,999</s><strong class="qa-price-current">₹ 35,000</strong><span class="qa-price-save">SAVE 30%</span></div>';
  const paymentNote = priceBlock?.nextElementSibling;
  if (paymentNote) paymentNote.textContent = 'EMI available from ₹2,500 / month';
 }
});
(() => {
 'use strict';
 if (!document.body) return;
 const path = location.pathname || '/';
 const popupRoot = new URL('.', document.currentScript.src);
 const isHome = path === popupRoot.pathname || path === new URL('index.html',popupRoot).pathname;
 const isMaster = path.includes('/master-class/');
 const rail = document.createElement('div'); rail.className = 'qa-float-actions';
 const contactHref = new URL('contact-us/index.html#enquiry', new URL('.', document.currentScript.src)).href;
 rail.innerHTML = `<a class="qa-float-demo" href="${contactHref}"><span>▣</span> Free demo · <b>Book Now</b> <strong>→</strong></a><div class="qa-float-stack"><a class="qa-float-whatsapp" href="https://wa.me/919939800780" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">◌</a><a class="qa-float-call" href="tel:+919939800780" aria-label="Call Quick Art">⌕</a></div>`;
 if (isMaster) rail.classList.add('qa-float-show-stack');
 rail.querySelector('.qa-float-call').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 18a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 3.4 2 2 0 0 1 4.08 1.22h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.69 2.79a2 2 0 0 1-.45 2.11L8.05 9.11a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.33 1.83.57 2.79.69A2 2 0 0 1 22 16.92Z"/></svg>';
 rail.querySelector('.qa-float-whatsapp').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z"/><path d="m8 7 1.5 3-1 1c1 2 2.5 3.5 4.5 4.5l1-1 3 1.5c-1 3-4 2-7-1S5 8 8 7Z"/></svg>';
 document.body.append(rail);

 let seen = false; try { seen = localStorage.getItem('qa-career-popup-seen') === 'true'; } catch (_) {}


 const showPopup = () => {
  if(document.querySelector('.qa-popup-overlay')) return;
  try {localStorage.setItem('qa-career-popup-seen','true');} catch (_) {}
  const overlay = document.createElement('div'); overlay.className = 'qa-popup-overlay';
  overlay.innerHTML = '<div class="qa-popup" role="dialog" aria-modal="true" aria-labelledby="qa-popup-title"><button class="qa-popup-close" type="button" aria-label="Close">×</button><div class="qa-popup-top"><span>♔ LIMITED SEATS LEFT</span><h2 id="qa-popup-title">Get a <em>FREE</em> Career Consultation</h2><p>Leave your details — our mentor will call within 60 minutes and guide you on the best course for your goals.</p></div><form class="qa-popup-form"><input name="name" required placeholder="Your Full Name *" autocomplete="name"><input name="phone" required type="tel" placeholder="WhatsApp Number *" autocomplete="tel"><input name="city" placeholder="Your City (optional)" autocomplete="address-level2"><input name="course" placeholder="Which course are you interested in? (optional)"><button type="submit">Request Free Callback <span>→</span></button><small>🔒 Your details are private. We’ll never spam you.<br>Or WhatsApp us directly at <a href="https://wa.me/919939800780">+91 9939800780</a></small><p class="qa-popup-status" role="status"></p></form></div>';
  document.body.append(overlay); const close = () => overlay.remove(); overlay.querySelector('.qa-popup-close').addEventListener('click', close); overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  const previousFocus=document.activeElement;
  overlay.querySelectorAll('input').forEach(input=>input.setAttribute('aria-label',input.placeholder));
  overlay.querySelector('input').focus();
  overlay.addEventListener('keydown',e=>{
   if(e.key==='Escape'){close();previousFocus?.focus();}
   if(e.key==='Tab'){
    const nodes=[...overlay.querySelectorAll('button,input,a[href]')].filter(n=>!n.disabled);
    const first=nodes[0],last=nodes[nodes.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
   }
  });
  overlay.querySelector('form').addEventListener('submit', async e => {
   e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;
   const status=overlay.querySelector('.qa-popup-status'),button=form.querySelector('button');
   const data=Object.fromEntries(new FormData(form));
   if(data.phone.replace(/\D/g,'').length<8){status.textContent='Please enter a valid phone number.';return;}
   data.source='career-popup';data.consent=true;button.disabled=true;status.textContent='Sending your enquiry…';
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
   try{
    const response=await fetch(new URL('api/leads.php',popupRoot),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
    const result=await response.json();if(!response.ok||!result.ok||!result.id)throw new Error('save');
    try{sessionStorage.setItem('qa-enquiry-received','true');}catch(_){}
    location.assign(new URL('thank-you/index.html',popupRoot));
   }catch(_){status.textContent='Unable to save your enquiry. Please try again or call +91 9939800780.';button.disabled=false;}
   finally{clearTimeout(timeout);}
  });
 };
 // Remove the side Free Demo promotion on every page.
 rail.querySelector('.qa-float-demo')?.remove();
 if((isHome||isMaster)&&!seen)window.setTimeout(showPopup,1800);
})();
(() => {
 const button=document.querySelector('.qa-motion-toggle');
 if(!button)return;
 button.addEventListener('click',()=>{
  const paused=button.getAttribute('aria-pressed')!=='true';
  button.setAttribute('aria-pressed',String(paused));
  button.closest('.qa-tools').classList.toggle('is-paused',paused);
  button.textContent=paused?'Resume motion':'Pause motion';
 });
})();

// Supplied visual examples complement, but never impersonate, student reviews.
(() => {
 const main=document.querySelector('main');
 if(!main||/\/(?:thank-you\/|404\.html|admin\.html|sitemap\.html)/.test(location.pathname))return;
 const script=[...document.scripts].find(s=>/\/site\.js(?:\?|$)/.test(s.src));
 if(!script||document.getElementById('qaa-editing-examples'))return;
 const root=new URL('.',script.src);
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('editing-examples.css',root).href;document.head.append(style);
 const section=document.createElement('section');section.id='qaa-editing-examples';section.className='qaa-examples';section.setAttribute('aria-labelledby','qaa-examples-title');
 const wrap=document.createElement('div');wrap.className='qaa-examples-wrap';
 wrap.innerHTML='<header class="qaa-examples-heading"><span>BEFORE &amp; AFTER</span><h2 id="qaa-examples-title">See the Difference AI Can Make</h2><p>Transform ordinary photos into professional results using modern AI editing techniques. Learn practical workflows for enhancement, retouching, color grading and creative editing.</p></header>';
 const grid=document.createElement('div');grid.className='qaa-examples-grid';
 const examples=[['portrait','AI Portrait Enhancement','Natural skin retouching, lighting & professional portrait enhancement.'],['landscape','AI Color Enhancement','Turn flat images into vibrant, cinematic and eye-catching visuals.'],['retouch','AI Beauty Retouching','Professional skin cleanup, facial enhancement and polished results.']];
 examples.forEach(([file,title,description],i)=>{const figure=document.createElement('figure');const img=document.createElement('img');img.src=new URL('assets/editing-example-'+file+'.webp',root).href;img.alt=title+' — before and after editing example';img.width=1000;img.height=450;img.loading='lazy';img.decoding='async';const caption=document.createElement('figcaption');const copy=document.createElement('div');const label=document.createElement('h3');label.textContent=title;const text=document.createElement('p');text.textContent=description;copy.append(label,text);caption.append(copy);figure.append(img,caption);grid.append(figure);});
 const actions=document.createElement('div');actions.className='qaa-examples-actions';const cta=document.createElement('a');cta.href=new URL('courses/index.html',root).href;cta.textContent='Explore Our Courses →';actions.append(cta);
 const profiles=[['Raju Sharma','RS','AI Portrait Editor'],['Harendra Yadav','HY','Colorist'],['Nidhi Kumari','NK','Retouching Experts']];
 [...grid.children].forEach((figure,i)=>{
  const [name,initials,role]=profiles[i];const profile=document.createElement('div');profile.className='qaa-example-profile';
  const avatar=document.createElement('span');avatar.className='qaa-neutral-avatar';avatar.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>'; avatar.setAttribute('aria-hidden','true');
  const info=document.createElement('div');info.className='qaa-profile-info';const row=document.createElement('div');row.className='qaa-profile-name-row';const title=document.createElement('strong');title.textContent=name;const stars=document.createElement('span');stars.className='qaa-profile-stars';stars.textContent='★★★★★';stars.setAttribute('role','img');stars.setAttribute('aria-label','5 out of 5 stars');row.append(title,stars);const note=document.createElement('small');note.textContent=role;info.append(row,note);profile.append(avatar,info);figure.querySelector('img').after(profile);
 });
 wrap.append(grid,actions);section.append(wrap);
 const review=[...main.querySelectorAll('section')].find(s=>[...s.querySelectorAll('h2')].some(h=>/community of|testimonials|student stories/i.test(h.textContent)));
 const faq=main.querySelector('#faq')||[...main.querySelectorAll('section')].find(s=>[...s.querySelectorAll('h2')].some(h=>/frequently asked questions/i.test(h.textContent)));
 const anchor=main.querySelector('.mc-bonuses')?(faq||review):(review||faq);
 if(anchor)anchor.before(section);else main.append(section);
})();

(() => {
 const source=[...document.scripts].find(s=>/\/site\.js(?:\?|$)/.test(s.src));if(!source)return;
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('final-polish.css',source.src).href;document.head.append(css);
 const main=document.querySelector('main');if(!main)return;
 const app=main.querySelector('.qaa-play-download')?.closest('section');
 const homeFaq=main.querySelector('#faq');if(app&&homeFaq)homeFaq.before(app);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!('IntersectionObserver' in window)||reduced.matches||!Element.prototype.animate)return;
 const animations=new Set();
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;observer.unobserve(entry.target);if(reduced.matches)return;
  const animation=entry.target.animate([{opacity:.35,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:480,easing:'cubic-bezier(.22,1,.36,1)'});
  animations.add(animation);animation.onfinish=()=>animations.delete(animation);
 }),{threshold:0,rootMargin:'0px 0px -24px 0px'});
 requestAnimationFrame(()=>main.querySelectorAll('section>.container,section>.ec-wrap,.qaa-examples-heading,.qaa-examples-grid>figure').forEach(node=>{
  if(node.getBoundingClientRect().top>innerHeight)observer.observe(node);
 }));
 reduced.addEventListener('change',()=>{if(reduced.matches){observer.disconnect();animations.forEach(animation=>animation.cancel());animations.clear();}});
})();
