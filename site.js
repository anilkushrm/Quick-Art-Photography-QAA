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
        }, { passive: true });
        window.addEventListener('pageshow', updateHeader);
        // Desktop opens the entire menu on hover; native details keeps click/touch/keyboard support.
        const hoverMenu = window.matchMedia('(min-width:1200px) and (hover:hover) and (pointer:fine)');
        let menuCloseTimer;
        const cancelMenuClose = () => window.clearTimeout(menuCloseTimer);
        const closeCourses = () => { cancelMenuClose(); courses.open = false; };
        courses.addEventListener('pointerenter', () => {
            if (!hoverMenu.matches) return;
            cancelMenuClose();
            courses.open = true;
        });
        courses.addEventListener('pointerleave', () => {
            if (!hoverMenu.matches) return;
            cancelMenuClose();
            menuCloseTimer = window.setTimeout(() => { courses.open = false; }, 180);
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
                if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true }); }
            }
        });
        window.matchMedia('(min-width:1200px)').addEventListener('change', () => { closeNav(); closeCourses(); });
    }
    document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
    // Keep the software showcase compact so the tools support the page instead of dominating it.
    document.querySelectorAll('section').forEach(section => {
        if (section.querySelector('h2')?.textContent.includes('Pro tools used by industry leaders')) section.classList.add('qa-tools-section');
        if (section.querySelector('[data-thanks-heading]') || section.querySelector('[data-thanks-message]')) section.classList.add('qa-thanks-page');
    });
    const homeBadge = document.querySelector('.qa-home-hero .qa-hero-badge');
    if (homeBadge) homeBadge.textContent = 'New Batch Starting Soon';
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
            if (form.closest('.qa-master-hero')) {
                const heroConsent = form.querySelector('input[name="consent"]');
                if (heroConsent) heroConsent.removeAttribute('required');
            }
        }
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const status = form.querySelector('.qa-form-status');
            const button = form.querySelector('button[type="submit"]');
            const phone = form.elements.phone.value.trim();
            if (phone.replace(/\D/g, '').length < 8) { status.textContent = 'Please enter a valid phone number.'; form.elements.phone.focus(); return; }
            const data = Object.fromEntries(new FormData(form));
            data.source = form.dataset.source || 'website';
            data.consent = true;
            button.disabled = true;
            status.textContent = 'Sending your enquiry…';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);
            try {
                if (location.protocol === 'file:') throw new Error('local');
                const leadsEndpoint = ['5500', '5501', '5502', '3000'].includes(location.port) ? 'http://127.0.0.1:8000/api/leads.php' : new URL('api/leads.php', siteRoot);
                const response = await fetch(leadsEndpoint, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: controller.signal
                });
                const result = await response.json();
                if (!response.ok || !result.ok || !result.id) throw new Error('server');
                try { sessionStorage.setItem('qa-enquiry-received', 'true'); } catch (_) { }
                location.assign(new URL('thank-you/index.html', siteRoot));
            } catch (error) {
                status.replaceChildren();
                status.append(document.createTextNode('We could not confirm your enquiry. Please call +91 9939800780 or '));
                const link = document.createElement('a');
                link.href = 'mailto:support@quickartphotography.in?subject=' + encodeURIComponent('Course enquiry') + '&body=' + encodeURIComponent('Name: ' + data.name + '\nPhone: ' + phone + '\nCity: ' + (data.city || '') + '\nCourse: ' + (data.course || '') + '\nMessage: ' + (data.message || ''));
                link.textContent = 'send it by email'; status.append(link, document.createTextNode('.'));
                button.disabled = false;
            } finally { clearTimeout(timeout); }
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
    try {
        if (sessionStorage.getItem('qa-enquiry-received') === 'true') {
            const thanks = document.querySelector('[data-thanks-heading]');
            if (thanks) thanks.textContent = 'Application received';
            const message = document.querySelector('[data-thanks-message]');
            if (message) message.textContent = 'Aapka form successfully submit ho gaya hai. Hamari team aapki enquiry ke baare mein aapse sampark karegi.';
            sessionStorage.removeItem('qa-enquiry-received');
        }
    } catch (_) { }
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
        const siteScriptURL = document.currentScript?.src || [...document.scripts].find(s => /\/site\.js(?:\?|$)/.test(s.src))?.src || new URL('site.js', location.href).href;
        const siteRoot = new URL('.', siteScriptURL);
        const avatarUrl = new URL('assets/form-avatars.png', siteRoot).href;
        let proof = form.querySelector('.qa-form-proof');
        if (!proof) {
            proof = document.createElement('div'); proof.className = 'qa-form-proof';
            (form.querySelector('.qa-form-status') || button)?.after(proof);
        }
        proof.innerHTML = '<div class="qa-proof-safe"><span class="qa-proof-icon" aria-hidden="true">🔒</span> Your details are safe. Team calls within 1 hour.</div><div class="qa-proof-divider" aria-hidden="true"></div><div class="qa-proof-social"><img src="' + avatarUrl + '" alt="Enrolled Students" width="42" height="16" class="qa-proof-avatars-img" loading="lazy"><span class="qa-proof-text"><strong>1,800+</strong> enrollments · <strong class="qa-proof-rating">4.9★</strong> rated</span></div>';
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
    const scriptURL = document.currentScript?.src || [...document.scripts].find(s => /\/site\.js(?:\?|$)/.test(s.src))?.src || new URL('site.js', location.href).href;
    const popupRoot = new URL('.', scriptURL);
    const avatarUrl = new URL('assets/form-avatars.png', popupRoot).href;
    const getProofHTML = () => '<div class="qa-form-proof"><div class="qa-proof-safe"><span class="qa-proof-icon" aria-hidden="true">🔒</span> Your details are safe. Team calls within 1 hour.</div><div class="qa-proof-divider" aria-hidden="true"></div><div class="qa-proof-social"><img src="' + avatarUrl + '" alt="Enrolled Students" width="42" height="16" class="qa-proof-avatars-img" loading="lazy"><span class="qa-proof-text"><strong>1,800+</strong> enrollments · <strong class="qa-proof-rating">4.9★</strong> rated</span></div></div>';

    // Standardize proof footer on any enquiry form present on the page
    document.querySelectorAll('form.qa-enquiry').forEach(enqForm => {
        let proof = enqForm.querySelector('.qa-form-proof');
        if (!proof) {
            proof = document.createElement('div');
            proof.className = 'qa-form-proof';
            (enqForm.querySelector('.qa-form-status') || enqForm.querySelector('button[type="submit"]'))?.after(proof);
        }
        proof.innerHTML = '<div class="qa-proof-safe"><span class="qa-proof-icon" aria-hidden="true">🔒</span> Your details are safe. Team calls within 1 hour.</div><div class="qa-proof-divider" aria-hidden="true"></div><div class="qa-proof-social"><img src="' + avatarUrl + '" alt="Enrolled Students" width="42" height="16" class="qa-proof-avatars-img" loading="lazy"><span class="qa-proof-text"><strong>1,800+</strong> enrollments · <strong class="qa-proof-rating">4.9★</strong> rated</span></div>';
    });

    const path = location.pathname || '/';
    const isHome = path === '/' ||
        path === '/index.html' ||
        path.endsWith('/quickart-masterclass-final/') ||
        path.endsWith('/quickart-masterclass-final/index.html') ||
        path === popupRoot.pathname ||
        path === new URL('index.html', popupRoot).pathname;
    const isMaster = /\/master-class(?:\/index\.html|\/)?$/i.test(path) || path.includes('/master-class');

    const rail = document.createElement('div'); rail.className = 'qa-float-actions';
    const contactHref = new URL('contact-us/index.html#enquiry', popupRoot).href;
    rail.innerHTML = `<a class="qa-float-demo" href="${contactHref}"><span>▣</span> Free demo · <b>Book Now</b> <strong>→</strong></a><div class="qa-float-stack"><a class="qa-float-whatsapp" href="https://wa.me/919939800780" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">◌</a><a class="qa-float-call" href="tel:+919939800780" aria-label="Call Quick Art">⌕</a></div>`;
    if (isMaster) rail.classList.add('qa-float-show-stack');
    rail.querySelector('.qa-float-call').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.19 18a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.09 3.4 2 2 0 0 1 4.08 1.22h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.69 2.79a2 2 0 0 1-.45 2.11L8.05 9.11a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.33 1.83.57 2.79.69A2 2 0 0 1 22 16.92Z"/></svg>';
    rail.querySelector('.qa-float-whatsapp').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.6-4.6A9 9 0 1 1 21 11.5Z"/><path d="m8 7 1.5 3-1 1c1 2 2.5 3.5 4.5 4.5l1-1 3 1.5c-1 3-4 2-7-1S5 8 8 7Z"/></svg>';
    document.body.append(rail);

    // Remove the side Free Demo promotion on every page.
    rail.querySelector('.qa-float-demo')?.remove();

    // Automatic popup tracking: Har customer ko poori website pe kewal EK hi baar automatic popup dikhe
    const AUTO_POPUP_KEY = 'qaa_popup_auto_shown';
    const hasAutoPopupShown = () => {
        try {
            return localStorage.getItem(AUTO_POPUP_KEY) === 'true' ||
                   sessionStorage.getItem('qa-enquiry-received') === 'true';
        } catch (_) {
            return false;
        }
    };

    const markAutoPopupShown = () => {
        try {
            localStorage.setItem(AUTO_POPUP_KEY, 'true');
        } catch (_) {}
    };

    const showPopup = (initialCourse, isAuto = false) => {
        if (document.querySelector('.qa-popup-overlay')) return;
        markAutoPopupShown();
        const overlay = document.createElement('div'); overlay.className = 'qa-popup-overlay';
        overlay.innerHTML = '<div class="qa-popup" role="dialog" aria-modal="true" aria-labelledby="qa-popup-title"><div class="qa-popup-top"><button class="qa-popup-close" type="button" aria-label="Close popup" title="Close">✕</button><span>♔ LIMITED SEATS LEFT</span><h2 id="qa-popup-title">Get a <em>FREE</em> Course Consultation</h2><p>Leave your details — our mentor will call within 60 minutes and guide you on the best course for your goals.</p></div><form class="qa-popup-form"><input name="name" required placeholder="Your Full Name *" autocomplete="name"><input name="phone" required type="tel" placeholder="WhatsApp Number *" autocomplete="tel"><input name="city" placeholder="Your City (optional)" autocomplete="address-level2"><input name="course" placeholder="Which course are you interested in? (optional)"><button type="submit">Request Free Callback <span>→</span></button>' + getProofHTML() + '<p class="qa-popup-status" role="status"></p></form></div>';
        document.body.append(overlay);
        const close = () => overlay.remove();
        overlay.querySelector('.qa-popup-close').addEventListener('click', close);
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        const previousFocus = document.activeElement;
        overlay.querySelectorAll('input').forEach(input => input.setAttribute('aria-label', input.placeholder));
        if (initialCourse) {
            const courseField = overlay.querySelector('input[name="course"]');
            if (courseField && !courseField.value) courseField.value = initialCourse;
        }
        overlay.querySelector('input').focus();
        overlay.addEventListener('keydown', e => {
            if (e.key === 'Escape') { close(); previousFocus?.focus(); }
            if (e.key === 'Tab') {
                const nodes = [...overlay.querySelectorAll('button,input,a[href]')].filter(n => !n.disabled);
                const first = nodes[0], last = nodes[nodes.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
        overlay.querySelector('form').addEventListener('submit', async e => {
            e.preventDefault(); const form = e.currentTarget; if (!form.reportValidity()) return;
            const status = overlay.querySelector('.qa-popup-status'), button = form.querySelector('button');
            const data = Object.fromEntries(new FormData(form));
            if (data.phone.replace(/\D/g, '').length < 8) { status.textContent = 'Please enter a valid phone number.'; return; }
            data.source = 'course-popup'; data.consent = true; button.disabled = true; status.textContent = 'Sending your enquiry…';
            const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 20000);
            try {
                const popupEndpoint = ['5500', '5501', '5502', '3000'].includes(location.port) ? 'http://127.0.0.1:8000/api/leads.php' : new URL('api/leads.php', popupRoot);
                const response = await fetch(popupEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: controller.signal });
                const result = await response.json(); if (!response.ok || !result.ok || !result.id) throw new Error('save');
                try {
                    sessionStorage.setItem('qa-enquiry-received', 'true');
                    localStorage.setItem(AUTO_POPUP_KEY, 'true');
                } catch (_) { }
                location.assign(new URL('thank-you/index.html', popupRoot));
            } catch (_) { status.textContent = 'Unable to save your enquiry. Please try again or call +91 9939800780.'; button.disabled = false; }
            finally { clearTimeout(timeout); }
        });
    };

    // Connect all "Book Free Demo" buttons/links on the page to open the popup form
    document.addEventListener('click', e => {
        const trigger = e.target.closest('a, button');
        if (!trigger) return;
        if (trigger.type === 'submit' || trigger.closest('form.qa-enquiry, form.qa-popup-form')) return;

        const text = (trigger.textContent || '').trim().replace(/\s+/g, ' ');
        const isDemoCta = trigger.classList.contains('ref-demo-cta') ||
            trigger.hasAttribute('data-open-popup') ||
            /book\s+(?:free\s+)?demo/i.test(text) ||
            (trigger.classList.contains('qa-demo') && /contact-us.*#enquiry/i.test(trigger.getAttribute('href') || ''));

        if (isDemoCta) {
            e.preventDefault();
            e.stopPropagation();
            showPopup();
        }
    });

    // Page open hone ke 15 second baad popup automatically open ho — lekin har customer ko poori site pe kewal EK hi baar
    if ((isHome || isMaster) && !hasAutoPopupShown()) {
        window.setTimeout(() => {
            if (!hasAutoPopupShown() && !document.querySelector('.qa-popup-overlay')) {
                markAutoPopupShown();
                showPopup(null, true);
            }
        }, 15000);
    }
})();
(() => {
    const button = document.querySelector('.qa-motion-toggle');
    if (!button) return;
    button.addEventListener('click', () => {
        const paused = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(paused));
        button.closest('.qa-tools').classList.toggle('is-paused', paused);
        button.textContent = paused ? 'Resume motion' : 'Pause motion';
    });
})();

// Supplied visual examples complement, but never impersonate, student reviews.
(() => {
    const main = document.querySelector('main');
    if (!main || /\/(?:thank-you\/|404\.html|admin\.html|sitemap\.html)/.test(location.pathname) || (location.pathname || '').includes('/blog') || document.querySelector('link[rel="canonical"][href*="/blog/"]')) return;
    const script = [...document.scripts].find(s => /\/site\.js(?:\?|$)/.test(s.src));
    if (!script || document.getElementById('qaa-editing-examples')) return;
    const root = new URL('.', script.src);
    const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = new URL('editing-examples.css', root).href; document.head.append(style);
    const section = document.createElement('section'); section.id = 'qaa-editing-examples'; section.className = 'qaa-examples'; section.setAttribute('aria-labelledby', 'qaa-examples-title');
    const wrap = document.createElement('div'); wrap.className = 'qaa-examples-wrap';
    wrap.innerHTML = '<header class="qaa-examples-heading"><span>BEFORE &amp; AFTER</span><h2 id="qaa-examples-title">See the Difference AI Can Make</h2><p>Transform ordinary photos into professional results using modern AI editing techniques. Learn practical workflows for enhancement, retouching, color grading and creative editing.</p></header>';
    const grid = document.createElement('div'); grid.className = 'qaa-examples-grid';
    const examples = [['portrait', 'AI Portrait Enhancement', 'Natural skin retouching, lighting & professional portrait enhancement.'], ['landscape', 'AI Color Enhancement', 'Turn flat images into vibrant, cinematic and eye-catching visuals.'], ['retouch', 'AI Beauty Retouching', 'Professional skin cleanup, facial enhancement and polished results.']];
    examples.forEach(([file, title, description], i) => { const figure = document.createElement('figure'); const img = document.createElement('img'); img.src = new URL('assets/editing-example-' + file + '.webp', root).href; img.alt = title + ' — before and after editing example'; img.width = 1000; img.height = 450; img.loading = 'lazy'; img.decoding = 'async'; const caption = document.createElement('figcaption'); const copy = document.createElement('div'); const label = document.createElement('h3'); label.textContent = title; const text = document.createElement('p'); text.textContent = description; copy.append(label, text); caption.append(copy); figure.append(img, caption); grid.append(figure); });
    const actions = document.createElement('div'); actions.className = 'qaa-examples-actions'; const cta = document.createElement('a'); cta.href = new URL('courses/index.html', root).href; cta.textContent = 'Explore Our Courses →'; actions.append(cta);
    const profiles = [['Raju Sharma', 'RS', 'AI Portrait Editor'], ['Harendra Yadav', 'HY', 'Colorist'], ['Nidhi Kumari', 'NK', 'Retouching Experts']];
    [...grid.children].forEach((figure, i) => {
        const [name, initials, role] = profiles[i]; const profile = document.createElement('div'); profile.className = 'qaa-example-profile';
        const avatar = document.createElement('span'); avatar.className = 'qaa-neutral-avatar'; avatar.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>'; avatar.setAttribute('aria-hidden', 'true');
        const info = document.createElement('div'); info.className = 'qaa-profile-info'; const row = document.createElement('div'); row.className = 'qaa-profile-name-row'; const title = document.createElement('strong'); title.textContent = name; const stars = document.createElement('span'); stars.className = 'qaa-profile-stars'; stars.textContent = '★★★★★'; stars.setAttribute('role', 'img'); stars.setAttribute('aria-label', '5 out of 5 stars'); row.append(title, stars); const note = document.createElement('small'); note.textContent = role; info.append(row, note); profile.append(avatar, info); figure.querySelector('img').after(profile);
    });
    wrap.append(grid, actions); section.append(wrap);
    const whyChoose = main.querySelector('#why-choose');
    const review = [...main.querySelectorAll('section')].find(s => [...s.querySelectorAll('h2')].some(h => /community of|testimonials|student stories/i.test(h.textContent)));
    const faq = main.querySelector('#faq') || [...main.querySelectorAll('section')].find(s => [...s.querySelectorAll('h2')].some(h => /frequently asked questions/i.test(h.textContent)));
    const anchor = whyChoose || (main.querySelector('.mc-bonuses') ? (faq || review) : (review || faq));
    if (anchor) anchor.before(section); else main.append(section);
})();

(() => {
    const source = [...document.scripts].find(s => /\/site\.js(?:\?|$)/.test(s.src)); if (!source) return;
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('final-polish.css', source.src).href; document.head.append(css);
    const main = document.querySelector('main'); if (!main) return;
    const app = main.querySelector('.qaa-play-download')?.closest('section');
    const homeFaq = main.querySelector('#faq'); if (app && homeFaq) homeFaq.before(app);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window) || reduced.matches || !Element.prototype.animate) return;
    const animations = new Set();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return; observer.unobserve(entry.target); if (reduced.matches) return;
        const animation = entry.target.animate([{ opacity: .35, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' });
        animations.add(animation); animation.onfinish = () => animations.delete(animation);
    }), { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    requestAnimationFrame(() => main.querySelectorAll('section>.container,section>.ec-wrap,.qaa-examples-heading,.qaa-examples-grid>figure').forEach(node => {
        if (node.getBoundingClientRect().top > innerHeight) observer.observe(node);
    }));
    reduced.addEventListener('change', () => { if (reduced.matches) { observer.disconnect(); animations.forEach(animation => animation.cancel()); animations.clear(); } });
})();

// Premium Scroll Reveal & Stagger Animation Controller
(() => {
    if (typeof window === 'undefined') return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) return;

    const initScrollAnimation = () => {
        document.documentElement.classList.add('qa-animations-active');

        const targets = document.querySelectorAll('.qa-scroll-reveal, .qa-scroll-stagger, .qa-scroll-zoom, .qa-scroll-left, .qa-scroll-right');
        if (!targets.length) return;

        if (!('IntersectionObserver' in window)) {
            targets.forEach(el => el.classList.add('is-revealed'));
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px'
        });

        targets.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                el.classList.add('is-revealed');
            } else {
                observer.observe(el);
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollAnimation);
    } else {
        initScrollAnimation();
    }
})();

/* =========================================================================
   LIVE COURSE SYNC: Auto-sync prices, discounts, and posters from Course Builder
   ========================================================================= */
(function initLiveCourseSync() {
    const runSync = () => {
        const landingSection = document.querySelector('.course-structure-section[data-course-id]');
        const isLandingPage = !!landingSection;
        const isHubPage = !!document.querySelector('.hub-card');
        if (!isLandingPage && !isHubPage) return;

        function getRelativeRoot() {
            const segs = window.location.pathname.replace(/^\/|\/(?:index\.html)?$/g, '').split('/').filter(Boolean);
            return segs.length > 0 ? '../'.repeat(segs.length) : '';
        }

        function resolveAssetUrl(path) {
            if (!path) return '';
            if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//') || path.startsWith('data:')) return path;
            if (path.startsWith('/')) return path;
            return getRelativeRoot() + path.replace(/^\.?\//, '');
        }

        function applyCourseToLanding(course) {
            if (!course) return;

            // 1. Sync Price & Discounts
            if (course.price) {
                const salePrice = Number(course.price);
                const origPrice = Number(course.originalPrice || (salePrice * 2));
                const curStr = '₹' + salePrice.toLocaleString('en-IN');
                const origStr = '₹' + origPrice.toLocaleString('en-IN');
                const savings = origPrice > salePrice ? (origPrice - salePrice) : 0;
                const savingsStr = '₹' + savings.toLocaleString('en-IN');
                const discountPct = origPrice > salePrice ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0;

                // Price display elements
                document.querySelectorAll('.lp-current-price, .lp-pricing-price').forEach(el => {
                    el.textContent = curStr;
                });
                document.querySelectorAll('.lp-original-price, .lp-pricing-strike').forEach(el => {
                    el.textContent = origStr;
                });

                // Sticky Mobile Bottom Bar
                const stickyEl = document.querySelector('.lp-sticky-price');
                if (stickyEl) {
                    stickyEl.innerHTML = `${curStr} <span class="lp-sticky-orig">${origStr}</span>`;
                }

                // Discount Badge & Urgency Pills
                if (discountPct > 0) {
                    document.querySelectorAll('.lp-discount-badge').forEach(el => {
                        el.textContent = `${discountPct}% OFF TODAY`;
                    });
                    document.querySelectorAll('.lp-urgency-pill').forEach(el => {
                        el.textContent = `${discountPct}% OFF`;
                    });
                }

                // Urgency Banner Savings
                const urgencyBar = document.querySelector('.lp-urgency-bar');
                if (urgencyBar && savings > 0) {
                    urgencyBar.innerHTML = `🔥 सीमित समय ऑफर: <span class="lp-urgency-pill">${discountPct}% OFF</span> आज ही Enroll करें और ${savingsStr} बचाएं! <strong>ऑफर जल्द समाप्त होने वाला है।</strong>`;
                }

                // Pricing Tagline
                const tagline = document.querySelector('.lp-pricing-tagline');
                if (tagline && savings > 0) {
                    tagline.textContent = `Save ${savingsStr} Today · Instant Classroom Activation`;
                }

                // Action Buttons with Price (e.g. "⚡ Enroll Now & Start Watching — ₹4,999")
                document.querySelectorAll('.lp-btn-primary, .lp-pricing-btn, .lp-sticky-btn').forEach(btn => {
                    if (btn.textContent.includes('₹')) {
                        btn.innerHTML = btn.innerHTML.replace(/₹[\d,]+/g, curStr);
                    }
                });
            }

            // 2. Sync Poster / Thumbnail
            if (course.thumbnail) {
                const thumbUrl = resolveAssetUrl(course.thumbnail);
                document.querySelectorAll('.lp-media-thumb img, .lp-preview-img, .lp-media-card img, .lp-hero-preview img, .lp-video-poster').forEach(img => {
                    if (thumbUrl) img.src = thumbUrl;
                    if (course.title) img.alt = course.title;
                });
            }

            // 3. Sync Course Duration
            if (course.duration) {
                const durStr = formatCourseDuration(course.duration);
                const durNumMatch = durStr.match(/\d+/);
                const durNum = durNumMatch ? parseFloat(durNumMatch[0]) : null;

                // A. Hero highlight badges / chips (e.g. "65+ Hours 4K Lessons", "45+ Hours HD Video")
                document.querySelectorAll('.lp-h-item, .lp-chip').forEach(item => {
                    const textEl = item.querySelector('.lp-h-text') || item;
                    if (/\b\d+\+?\s*(?:Hours?|Hrs?)\b/i.test(textEl.textContent)) {
                        textEl.textContent = textEl.textContent.replace(/\b\d+\+?\s*(?:Hours?|Hrs?)\b/i, durStr);
                    }
                });

                // B. Stats bar KPI values (.lp-stat-val, .lp-stat-num)
                document.querySelectorAll('.lp-stat-val, .lp-stat-num').forEach(el => {
                    if (/\b\d+\+?\s*(?:Hours?|Hrs?)\b/i.test(el.textContent) || (el.id && el.id.includes('duration'))) {
                        el.textContent = durStr;
                        if (el._counterItem) {
                            el._counterItem.raw = durStr;
                            if (durNum !== null) el._counterItem.target = durNum;
                        }
                    }
                });

                // C. Curriculum section header stat (#cs-stat-duration)
                const csDur = document.getElementById('cs-stat-duration');
                if (csDur) {
                    csDur.textContent = durStr;
                }

                // D. Pricing checklist, feature bullets, & bonus items
                document.querySelectorAll('.lp-pricing-list li, .lp-pricing-card li, .lp-bonus-card li, .lp-feature-bullets li, .cs-curriculum-header').forEach(el => {
                    if (/\b\d+\+?\s*(?:Hours?|Hrs?)\b/i.test(el.innerHTML)) {
                        el.innerHTML = el.innerHTML.replace(/\b\d+\+?\s*(?:Hours?|Hrs?)\b/gi, durStr);
                    }
                });
            }

            // 4. Sync Course Description & Subtitle
            const desc = course.description || course.subtitle;
            if (desc) {
                // Hero Section description / subtitle
                document.querySelectorAll('.lp-hero-sub, .lp-hero-desc').forEach(el => {
                    el.textContent = desc;
                });
                // Curriculum header subtitle
                const csSub = document.getElementById('cs-subtitle');
                if (csSub) {
                    csSub.textContent = (course.title ? course.title + ' — ' : '') + desc;
                }
                // SEO meta tags
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) metaDesc.setAttribute('content', desc);
                const ogDesc = document.querySelector('meta[property="og:description"]');
                if (ogDesc) ogDesc.setAttribute('content', desc);
            }

            // 5. Sync Course Badge
            if (course.badge) {
                document.querySelectorAll('.lp-badge-tag').forEach(el => {
                    el.textContent = course.badge;
                });
            }
        }

        function formatCourseDuration(raw) {
            if (!raw) return '';
            const str = String(raw).trim();
            const numMatch = str.match(/\d+/);
            if (!numMatch) return str;
            const num = numMatch[0];
            if (/^\d+$/.test(str) || /^\d+\s*(?:hours?|hrs?)$/i.test(str)) {
                return num + '+ Hours';
            }
            return str;
        }

        function applyCoursesToHub(coursesList) {
            if (!Array.isArray(coursesList) || !coursesList.length) return;
            const map = {};
            coursesList.forEach(c => { if (c && c.id) map[c.id] = c; });

            document.querySelectorAll('.hub-card').forEach(card => {
                const enrollLink = card.querySelector('a.hub-btn-enroll[href*="enroll="]');
                if (!enrollLink) return;
                const match = enrollLink.href.match(/enroll=([^&#]+)/);
                if (!match) return;
                const cId = match[1];
                const course = map[cId];
                if (!course) return;

                // Sync Thumbnail
                if (course.thumbnail) {
                    const img = card.querySelector('.hub-card-thumb-wrap img');
                    if (img) img.src = resolveAssetUrl(course.thumbnail);
                }

                // Sync Duration Badge
                if (course.duration) {
                    const durStr = formatCourseDuration(course.duration);
                    card.querySelectorAll('.hub-thumb-pill').forEach(pill => {
                        if (pill.textContent.includes('Hours') || pill.textContent.includes('⏱️')) {
                            pill.textContent = '⏱️ ' + durStr;
                        }
                    });
                }

                // Sync Price
                if (course.price) {
                    const salePrice = Number(course.price);
                    const origPrice = Number(course.originalPrice || (salePrice * 2));
                    const curPriceEl = card.querySelector('.hub-cur-price');
                    const origPriceEl = card.querySelector('.hub-orig-price');
                    const badgeEl = card.querySelector('.hub-discount-badge');

                    if (curPriceEl) curPriceEl.textContent = '₹' + salePrice.toLocaleString('en-IN');
                    if (origPriceEl) origPriceEl.textContent = '₹' + origPrice.toLocaleString('en-IN');
                    if (badgeEl && origPrice > salePrice) {
                        const discountPct = Math.round(((origPrice - salePrice) / origPrice) * 100);
                        badgeEl.textContent = `${discountPct}% OFF`;
                    }
                }

                // Sync Title
                if (course.title) {
                    const titleEl = card.querySelector('.hub-card-title');
                    if (titleEl) titleEl.textContent = course.title;
                }

                // Sync Description
                const desc = course.description || course.subtitle;
                if (desc) {
                    const descEl = card.querySelector('.hub-card-desc');
                    if (descEl) descEl.textContent = desc;
                }

                // Sync Badge
                if (course.badge) {
                    const badgeEl = card.querySelector('.hub-card-badge');
                    if (badgeEl) badgeEl.textContent = course.badge.toUpperCase();
                }

                // Sync Skill Level
                if (course.level) {
                    const levelEl = card.querySelector('.hub-card-level');
                    if (levelEl) levelEl.textContent = course.level;
                }
            });

            // Sync Total Hours in Hub Trust Strip
            let totalHours = 0;
            coursesList.forEach(c => {
                if (c && c.duration) {
                    const m = String(c.duration).match(/(\d+)/);
                    if (m) totalHours += parseInt(m[1], 10);
                }
            });
            if (totalHours > 0) {
                document.querySelectorAll('.hub-trust-item').forEach(item => {
                    const lbl = item.querySelector('.hub-trust-lbl');
                    const num = item.querySelector('.hub-trust-num');
                    if (lbl && lbl.textContent.includes('Hours Content') && num) {
                        num.textContent = totalHours + '+';
                    }
                });
            }
        }

        const courseId = landingSection ? landingSection.dataset.courseId : null;

        // 1. Instant check from localStorage
        if (courseId) {
            try {
                const cached = localStorage.getItem('qaa_course_' + courseId);
                if (cached) applyCourseToLanding(JSON.parse(cached));
            } catch (_) {}
        } else if (isHubPage) {
            try {
                const localList = JSON.parse(localStorage.getItem('qaa_local_courses') || '[]');
                if (localList.length) applyCoursesToHub(localList);
            } catch (_) {}
        }

        // 2. Fetch live data from courses.json
        const jsonPath = resolveAssetUrl('data/courses.json') + '?_=' + Date.now();
        fetch(jsonPath)
            .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
            .then(courses => {
                if (!Array.isArray(courses)) return;
                if (courseId) {
                    const found = courses.find(c => c.id === courseId || c.slug === courseId);
                    if (found) applyCourseToLanding(found);
                }
                if (isHubPage) {
                    applyCoursesToHub(courses);
                }
            })
            .catch(err => console.debug('Live course sync fetch notice:', err));

        // 3. Real-time Cross-tab Sync via Storage Event
        window.addEventListener('storage', (e) => {
            if (!e.key || !e.newValue) return;
            try {
                if (courseId && e.key === 'qaa_course_' + courseId) {
                    applyCourseToLanding(JSON.parse(e.newValue));
                } else if (isHubPage && e.key === 'qaa_local_courses') {
                    applyCoursesToHub(JSON.parse(e.newValue));
                }
            } catch (_) {}
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runSync);
    } else {
        runSync();
    }
})();

// Luxury Course Feature Badges Dynamic Enhancer
(() => {
    const enhanceHighlightBadges = () => {
        document.querySelectorAll('.lp-h-item, .lp-chip').forEach(item => {
            if (item.querySelector('.lp-h-icon')) return;
            const raw = item.innerHTML.trim();
            const match = raw.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|[\uFE00-\uFE0F]|⚡|✓|📷|🎨|🎬|📈|🌐|🤖|📖|🖨️|🏆|♾️|✨|📐)\s*(.+)$/u);
            if (match) {
                item.innerHTML = '<span class="lp-h-icon">' + match[1] + '</span><span class="lp-h-text">' + match[2] + '</span>';
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enhanceHighlightBadges);
    } else {
        enhanceHighlightBadges();
    }
})();

// Animated Number Counter on Scroll (Stats Bar Countdown/Count-up Effect)
(() => {
    const initStatsCounter = () => {
        const statEls = document.querySelectorAll('.lp-stat-val, .lp-stat-num, .cs-stat-val');
        if (!statEls.length) return;

        const items = [];
        statEls.forEach(el => {
            const raw = el.textContent.trim();
            // Match leading text, numbers (with optional commas/decimals), and trailing text
            const match = raw.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
            if (match) {
                const prefix = match[1] || '';
                const numStr = match[2].replace(/,/g, '');
                const suffix = match[3] || '';
                const target = parseFloat(numStr);
                if (isNaN(target)) return;
                const hasComma = match[2].includes(',');
                const hasDot = numStr.includes('.');
                const decimals = hasDot ? (numStr.split('.')[1] || '').length : 0;

                const counterItem = {
                    el,
                    raw,
                    prefix,
                    target,
                    suffix,
                    hasComma,
                    decimals,
                    started: false
                };
                items.push(counterItem);
                el._counterItem = counterItem;

                // Set initial visual state to 0 so when page loads it starts from 0
                const initialFormatted = hasComma ? '0' : (decimals > 0 ? (0).toFixed(decimals) : '0');
                el.textContent = prefix + initialFormatted + suffix;
            } else {
                // Non-numeric items like "Lifetime" or "Zero Lag": subtle scale/glow entry
                el.style.opacity = '0.4';
                el.style.transform = 'scale(0.92)';
                el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
            }
        });

        if (!items.length) return;

        const easeOutExpo = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const runCounter = item => {
            if (item.started) return;
            item.started = true;
            let startTime = null;
            const duration = 1400; // 1.4s smooth countdown/count-up effect

            const step = timestamp => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutExpo(progress);
                const current = item.target * eased;

                let formattedNum;
                if (item.decimals > 0) {
                    formattedNum = current.toFixed(item.decimals);
                } else {
                    const rounded = Math.round(current);
                    formattedNum = item.hasComma ? rounded.toLocaleString('en-IN') : String(rounded);
                }

                item.el.textContent = item.prefix + formattedNum + item.suffix;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    item.el.textContent = item.raw;
                }
            };

            requestAnimationFrame(step);
        };

        const revealNonNumeric = () => {
            statEls.forEach(el => {
                const raw = el.textContent.trim();
                if (!/\d/.test(raw)) {
                    el.style.opacity = '1';
                    el.style.transform = 'scale(1)';
                }
            });
        };

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        items.forEach(item => runCounter(item));
                        revealNonNumeric();
                        observer.disconnect();
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });

            const container = document.querySelector('.lp-stats-bar, .cs-stats-bar, .lp-stats-grid');
            if (container) {
                observer.observe(container);
            } else {
                statEls.forEach(el => observer.observe(el));
            }
        } else {
            items.forEach(runCounter);
            revealNonNumeric();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStatsCounter);
    } else {
        initStatsCounter();
    }
})();


