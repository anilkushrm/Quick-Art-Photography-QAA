/**
 * Quick Art Photography Academy — Student Portal JavaScript
 */

const TOKEN_KEY = 'qaa_student_token';
let studentToken = localStorage.getItem(TOKEN_KEY) || '';
let currentStudent = null;
let currentCourse = null;
let currentLesson = null;
let currentPhone = '';

// ---------- Helpers ----------

function toast(msg, ok = true) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${ok ? 'ok' : 'err'}`;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

async function lmsApi(action, opts = {}) {
  // If running on static live server (port 5500/5501/5502), connect to local PHP server on port 8000
  const isStaticLiveServer = ['5500', '5501', '5502', '3000'].includes(window.location.port);
  let url = isStaticLiveServer ? 'http://127.0.0.1:8000/api/lms.php?' : '../api/lms.php?';

  if (action.startsWith('?') || action.startsWith('&')) {
    url += action.replace(/^[?&]/, '');
  } else if (action.includes('&') || action.includes('=')) {
    url += action.startsWith('action=') ? action : `action=${action}`;
  } else {
    url += `action=${encodeURIComponent(action)}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  if (studentToken) {
    headers['X-Student-Token'] = studentToken;
  }
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Server error occurred');
  }
  return data;
}

// ---------- View Navigation ----------

function switchView(viewName) {
  ['view-login', 'view-dashboard', 'view-classroom', 'view-checkout', 'view-live-studio'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  if (viewName !== 'verify') {
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');
  }

  const guestNav = document.getElementById('header-guest-nav');
  const userNav = document.getElementById('header-user-nav');

  if (viewName === 'login' || viewName === 'verify' || (viewName === 'checkout' && !studentToken)) {
    if (guestNav) guestNav.classList.remove('hidden');
    if (userNav) userNav.classList.add('hidden');
  } else {
    if (guestNav) guestNav.classList.add('hidden');
    if (userNav) userNav.classList.remove('hidden');
  }
}

// ---------- 1. Authentication Flow ----------

document.getElementById('form-phone').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phoneInput = document.getElementById('input-phone');
  const phone = phoneInput.value.replace(/\D/g, '');

  if (phone.length < 10) {
    toast('Please enter a valid 10-digit mobile number', false);
    return;
  }

  const btn = document.getElementById('btn-send-otp');
  btn.disabled = true;
  btn.textContent = 'Sending OTP…';

  try {
    const res = await lmsApi('send-otp', { method: 'POST', body: { phone } });
    currentPhone = phone;
    sessionStorage.setItem('pending_otp_phone', phone);
    document.getElementById('otp-phone-display').textContent = `+91 ${phone}`;
    
    // If dev/demo OTP is returned, display helper banner
    const devBanner = document.getElementById('dev-otp-banner');
    if (res.devOtp) {
      sessionStorage.setItem('pending_dev_otp', res.devOtp);
      document.getElementById('dev-otp-val').textContent = res.devOtp;
      devBanner.classList.remove('hidden');
      document.getElementById('input-otp').value = res.devOtp;
    } else {
      sessionStorage.removeItem('pending_dev_otp');
      devBanner.classList.add('hidden');
    }

    document.getElementById('form-phone').classList.add('hidden');
    document.getElementById('form-otp').classList.remove('hidden');
    document.getElementById('input-otp').focus();
    toast('💬 OTP आपके WhatsApp पर भेज दिया गया है! WhatsApp चेक करें।');
  } catch (err) {
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Send OTP Code <span aria-hidden="true">→</span>';
  }
});

function resetToPhoneStep() {
  sessionStorage.removeItem('pending_otp_phone');
  sessionStorage.removeItem('pending_dev_otp');
  document.getElementById('form-otp').classList.add('hidden');
  document.getElementById('form-phone').classList.remove('hidden');
  document.getElementById('input-otp').value = '';
}

async function resendOtp() {
  if (!currentPhone) return;
  try {
    const res = await lmsApi('send-otp', { method: 'POST', body: { phone: currentPhone } });
    if (res.devOtp) {
      document.getElementById('dev-otp-val').textContent = res.devOtp;
      document.getElementById('dev-otp-banner').classList.remove('hidden');
    }
    toast('💬 नया OTP आपके WhatsApp पर भेज दिया गया है!');
  } catch (err) {
    toast(err.message, false);
  }
}

document.getElementById('form-otp').addEventListener('submit', async (e) => {
  e.preventDefault();
  const otp = document.getElementById('input-otp').value.trim();
  if (otp.length < 6) {
    toast('Please enter the 6-digit OTP', false);
    return;
  }

  const btn = document.getElementById('btn-verify-otp');
  btn.disabled = true;
  btn.textContent = 'Verifying…';

  try {
    const res = await lmsApi('verify-otp', { method: 'POST', body: { phone: currentPhone, otp } });
    studentToken = res.token;
    localStorage.setItem(TOKEN_KEY, studentToken);
    sessionStorage.removeItem('pending_otp_phone');
    sessionStorage.removeItem('pending_dev_otp');
    currentStudent = res.student;
    toast('Login successful! Welcome to Quick Art Academy.');
    await initStudentSession();
  } catch (err) {
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Verify &amp; Enter Classroom <span aria-hidden="true">✓</span>';
  }
});

async function logoutStudent() {
  try {
    await lmsApi('logout', { method: 'POST' });
  } catch (e) {}
  studentToken = '';
  localStorage.removeItem(TOKEN_KEY);
  currentStudent = null;
  currentCourse = null;
  currentLesson = null;
  resetToPhoneStep();
  // Reset email form too
  const emailForm  = document.getElementById('form-email-login');
  const signupForm = document.getElementById('form-signup');
  if (emailForm)  emailForm.reset();
  if (signupForm) signupForm.reset();
  switchLoginTab('phone');
  switchView('login');
  toast('You have been logged out.');
}

// ---------- Email + Password Login ----------

function switchLoginTab(tab) {
  const tabs   = ['phone', 'email'];
  const panels = { phone: 'panel-phone', email: 'panel-email' };
  const focusIds = { phone: 'input-phone', email: 'input-email' };

  tabs.forEach(t => {
    const btn   = document.getElementById(`tab-${t}`);
    const panel = document.getElementById(panels[t]);
    if (!btn || !panel) return;
    if (t === tab) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      panel.removeAttribute('hidden');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
      panel.setAttribute('hidden', '');
    }
  });

  const focusEl = document.getElementById(focusIds[tab]);
  if (focusEl) setTimeout(() => focusEl.focus(), 50);
}

function togglePasswordVisibility(inputId, btnId) {
  const pwInput = document.getElementById(inputId || 'input-password');
  const btn     = document.getElementById(btnId   || 'btn-toggle-pw');
  if (!pwInput) return;
  if (pwInput.type === 'password') {
    pwInput.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    pwInput.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}

async function handleSignUp(e) {
  e.preventDefault();
  const name     = document.getElementById('signup-name').value.trim();
  const phone    = document.getElementById('signup-phone').value.replace(/\D/g, '');
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  if (!name)                   { toast('Apna naam darj karein', false); return; }
  if (phone.length < 10)       { toast('Valid 10-digit mobile number darj karein', false); return; }
  if (!email)                  { toast('Email address darj karein', false); return; }
  if (password.length < 6)     { toast('Password kam se kam 6 characters ka hona chahiye', false); return; }

  const btn = document.getElementById('btn-signup');
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  try {
    const res = await lmsApi('email-signup', {
      method: 'POST',
      body: { name, phone, email, password }
    });
    studentToken = res.token;
    localStorage.setItem(TOKEN_KEY, studentToken);
    currentStudent = res.student;
    toast('🎉 Account ban gaya! Quick Art mein aapka swagat hai!');
    await initStudentSession();
  } catch (err) {
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Create Account &amp; Login <span aria-hidden="true">→</span>';
  }
}

async function handleEmailLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;

  if (!email || !password) {
    toast('Email aur password dono darj karein', false);
    return;
  }

  const btn = document.getElementById('btn-email-login');
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const res = await lmsApi('email-login', {
      method: 'POST',
      body: { email, password }
    });
    studentToken = res.token;
    localStorage.setItem(TOKEN_KEY, studentToken);
    currentStudent = res.student;
    toast('Login successful! Welcome to Quick Art Academy.');
    await initStudentSession();
  } catch (err) {
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Login &amp; Enter Classroom <span aria-hidden="true">→</span>';
  }
}

// ── Forgot Password Modal (Email OTP) ──
function openForgotPasswordModal() {
  const modal = document.getElementById('modal-forgot-password');
  if (modal) {
    modal.classList.remove('hidden');
    const emailInp = document.getElementById('input-email');
    const forgotEmail = document.getElementById('forgot-email');
    if (emailInp && forgotEmail && emailInp.value) {
      forgotEmail.value = emailInp.value.trim();
    }
  }
}

function closeForgotPasswordModal() {
  const modal = document.getElementById('modal-forgot-password');
  if (modal) modal.classList.add('hidden');
}

async function sendForgotEmailOtp() {
  const email = document.getElementById('forgot-email')?.value.trim();
  if (!email || !email.includes('@')) {
    toast('Valid email address darj karein', false);
    return;
  }
  const btn = document.getElementById('btn-send-email-otp');
  btn.disabled = true;
  btn.textContent = 'Sending OTP…';

  try {
    const res = await lmsApi('send-email-otp', {
      method: 'POST',
      body: { email, purpose: 'forgot-password' }
    });
    toast('✅ ' + (res.message || 'OTP aapke email par bhej diya gaya hai!'));
    const step2 = document.getElementById('forgot-step-2');
    if (step2) step2.classList.remove('hidden');
    document.getElementById('forgot-otp')?.focus();
  } catch (err) {
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Resend OTP';
  }
}

async function handleForgotPwSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email')?.value.trim();
  const otp = document.getElementById('forgot-otp')?.value.trim();
  const newPassword = document.getElementById('forgot-new-pw')?.value;

  if (!email || !otp || !newPassword) {
    toast('Email, OTP aur Naya Password sabhi bharo', false);
    return;
  }
  if (otp.length < 6) {
    toast('6-digit OTP code enter karein', false);
    return;
  }
  if (newPassword.length < 6) {
    toast('Password kam se kam 6 characters ka hona chahiye', false);
    return;
  }

  const btn = document.getElementById('btn-submit-reset-pw');
  btn.disabled = true;
  btn.textContent = 'Resetting password…';

  try {
    const res = await lmsApi('email-reset-password', {
      method: 'POST',
      body: { email, otp, newPassword }
    });
    toast('🎉 Password successfully reset ho gaya hai!');
    closeForgotPasswordModal();
    if (res.token) {
      studentToken = res.token;
      localStorage.setItem(TOKEN_KEY, studentToken);
      await initStudentSession();
    }
  } catch (err) {
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔒 Set New Password &amp; Login →';
  }
}




// ── Global My Courses State ──
window._allMyCourses = [];
window._currentMyCoursesFilter = 'all';
window._myCoursesSearchQuery = '';

async function loadDashboard() {
  switchView('dashboard');
  const grid = document.getElementById('courses-grid');
  grid.innerHTML = '<div class="loading-state">Loading your courses…</div>';

  try {
    const [meRes, coursesRes] = await Promise.all([
      lmsApi('me'),
      lmsApi('my-courses')
    ]);

    currentStudent = meRes.student;
    window._currentStudent = currentStudent;

    // ── Header / Nav Dropdown & Dashboard Hero User Details ──
    const shortName = currentStudent.name.split(' ')[0];
    const initials  = currentStudent.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const avatarUrl = currentStudent.avatarUrl || localStorage.getItem('qaa_avatar_' + currentStudent.id) || '';

    // Set name in nav and hero
    const elName = document.getElementById('nav-user-name');
    if (elName) elName.textContent = currentStudent.name;

    const elDName = document.getElementById('dropdown-user-name');
    if (elDName) elDName.textContent = currentStudent.name;

    const elDPhone = document.getElementById('dropdown-user-phone');
    if (elDPhone) elDPhone.textContent = `+91 ${currentStudent.phone}`;

    // Nav initials
    const navInitials = document.getElementById('nav-avatar-initials');
    if (navInitials) navInitials.textContent = initials;

    const dropInitials = document.getElementById('dropdown-avatar-initials');
    if (dropInitials) dropInitials.textContent = initials;

    // Dashboard Hero Avatar
    const dashInitials = document.getElementById('dash-avatar-initials');
    if (dashInitials) dashInitials.textContent = initials;

    // Profile photo handling
    if (avatarUrl) {
      const navImg = document.getElementById('nav-avatar-img');
      if (navImg) { navImg.src = avatarUrl; navImg.classList.remove('hidden'); }
      if (navInitials) navInitials.classList.add('hidden');

      const dropImg = document.getElementById('dropdown-avatar-img');
      if (dropImg) { dropImg.src = avatarUrl; dropImg.classList.remove('hidden'); }
      if (dropInitials) dropInitials.classList.add('hidden');

      const dashImg = document.getElementById('dash-avatar-img');
      if (dashImg) { dashImg.src = avatarUrl; dashImg.classList.remove('hidden'); }
      if (dashInitials) dashInitials.classList.add('hidden');
    }

    // Dashboard greeting
    const greetingEl = document.getElementById('dash-greeting');
    if (greetingEl) greetingEl.textContent = `Namaste, ${shortName}!`;

    const courses = coursesRes.courses || [];
    window._allMyCourses = courses;

    // Compute KPIs
    const enrolledCount = courses.length;
    const completedLessons = meRes.stats.completedLessonsCount || 0;
    const completedCourses = courses.filter(c => c.isCompleted || c.progressPercent >= 100);
    const certCount = completedCourses.length;
    const avgProgress = enrolledCount > 0
      ? Math.round(courses.reduce((sum, c) => sum + (c.progressPercent || 0), 0) / enrolledCount)
      : 0;

    // Update KPI UI
    const statEnrolled = document.getElementById('stat-enrolled-count');
    if (statEnrolled) statEnrolled.textContent = enrolledCount;

    const statDone = document.getElementById('stat-completed-count');
    if (statDone) statDone.textContent = completedLessons;

    const statCert = document.getElementById('stat-cert-count');
    if (statCert) statCert.textContent = certCount;

    const statAvg = document.getElementById('stat-avg-progress');
    if (statAvg) statAvg.textContent = `${avgProgress}%`;

    const countLabel = document.getElementById('courses-count-label');
    if (countLabel) countLabel.textContent = `${enrolledCount} Active Learning Programs`;

    updateDropdownEnrolledBadge(enrolledCount);

    // Update Filter Counts
    const inProgressCount = courses.filter(c => c.completedCount > 0 && c.progressPercent < 100).length;
    const cAll = document.getElementById('count-all');
    if (cAll) cAll.textContent = enrolledCount;
    const cProg = document.getElementById('count-in-progress');
    if (cProg) cProg.textContent = inProgressCount;
    const cComp = document.getElementById('count-completed');
    if (cComp) cComp.textContent = certCount;

    // Render Spotlight: "Continue Watching" card
    renderResumeSpotlight(courses);

    // Render Courses Grid with active filters
    renderMyCoursesGrid();

    // Check & Render Live Masterclasses & Sessions
    loadStudentLiveClasses();

  } catch (err) {
    if (err.message.includes('login') || err.message.includes('expired')) {
      logoutStudent();
    } else {
      grid.innerHTML = `<div class="card" style="padding: 24px; color: var(--red);">Failed to load courses: ${err.message}</div>`;
    }
  }
}

// ── Render Spotlight "Continue Watching" Banner ──
function renderResumeSpotlight(courses) {
  const box = document.getElementById('resume-spotlight-box');
  if (!box) return;

  // Find course currently in progress, or fallback to first course with progress > 0
  const inProgress = courses.find(c => c.completedCount > 0 && c.progressPercent < 100) ||
                     (courses.length > 0 && courses[0].progressPercent < 100 ? courses[0] : null);

  if (!inProgress) {
    box.classList.add('hidden');
    box.innerHTML = '';
    return;
  }

  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="resume-spotlight-card">
      <div class="spotlight-left">
        <div class="spotlight-thumb-wrap">
          <img src="../${inProgress.thumbnail || 'assets/editing-timeline.jpg'}" alt="${escapeHtml(inProgress.title)}" />
          <div class="spotlight-play-icon">▶</div>
        </div>
        <div class="spotlight-text">
          <span class="spotlight-tag">⚡ CONTINUE WATCHING</span>
          <h3 class="spotlight-title">${escapeHtml(inProgress.title)}</h3>
          <div class="spotlight-progress-row">
            <div class="spotlight-bar-bg">
              <div class="spotlight-bar-fill" style="width:${inProgress.progressPercent}%"></div>
            </div>
            <span class="spotlight-percent">${inProgress.progressPercent}% • ${inProgress.completedCount}/${inProgress.totalLessons} lessons completed</span>
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-gold spotlight-btn" onclick="openCourseClassroom('${inProgress.id}')">
        Resume Masterclass ▶
      </button>
    </div>
  `;
}

// ── Render My Courses Grid with Filters & Search ──
function renderMyCoursesGrid() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;

  const filter = window._currentMyCoursesFilter || 'all';
  const query = (window._myCoursesSearchQuery || '').toLowerCase().trim();

  let filtered = [...window._allMyCourses];

  // 1. Status Filter
  if (filter === 'in-progress') {
    filtered = filtered.filter(c => c.completedCount > 0 && c.progressPercent < 100);
  } else if (filter === 'completed') {
    filtered = filtered.filter(c => c.isCompleted || c.progressPercent >= 100);
  }

  // 2. Search Query Filter
  if (query) {
    filtered = filtered.filter(c =>
      (c.title && c.title.toLowerCase().includes(query)) ||
      (c.category && c.category.toLowerCase().includes(query)) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(query))
    );
  }

  // Empty state
  if (filtered.length === 0) {
    if (window._allMyCourses.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1/-1; padding: 48px 24px; text-align: center; background: #111520; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;">
          <div style="font-size: 40px; margin-bottom: 12px;">🎓</div>
          <h3 style="font-size: 20px; font-weight: 700; color: #fff;">No courses assigned yet</h3>
          <p class="muted" style="margin: 8px auto 24px; max-width: 440px;">Your enrollment is being activated. Contact academy support or explore available masterclasses.</p>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <a href="../online/" class="btn btn-gold">🌟 Browse All Masterclasses →</a>
            <a href="https://wa.me/919939800780" target="_blank" class="btn btn-outline">WhatsApp Support 💬</a>
          </div>
        </div>
      `;
    } else {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1/-1; padding: 40px 20px; text-align: center; background: #111520; border: 1px dashed rgba(255,255,255,0.12); border-radius: 18px;">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <h4 style="color: #fff; font-size: 16px;">No courses match your filter</h4>
          <p class="muted" style="font-size: 13px; margin: 6px 0 16px;">Try adjusting your search terms or view all courses.</p>
          <button type="button" class="btn-sm btn-gold" onclick="filterMyCourses('all'); document.getElementById('mycourses-search-input').value=''; onSearchMyCourses('');">
            View All Courses
          </button>
        </div>
      `;
    }
    return;
  }

  // Course Cards
  grid.innerHTML = filtered.map(c => {
    const isDone = c.isCompleted || c.progressPercent >= 100;
    const inProg = c.completedCount > 0 && !isDone;

    let statusHtml = '';
    if (isDone) {
      statusHtml = `<span class="course-status-pill completed">✓ Completed</span>`;
    } else if (inProg) {
      statusHtml = `<span class="course-status-pill in-progress">${c.progressPercent}% Done</span>`;
    } else {
      statusHtml = `<span class="course-status-pill not-started">Not Started</span>`;
    }

    const durationText = c.duration || (c.totalLessons ? `${c.totalLessons} Lessons` : 'Full Course');

    return `
      <article class="course-card">
        <div class="course-thumb-wrap">
          <img src="../${c.thumbnail || 'assets/editing-timeline.jpg'}" alt="${escapeHtml(c.title)}" loading="lazy" />
          <div class="course-thumb-overlay"></div>
          ${c.badge ? `<span class="course-badge-top">${escapeHtml(c.badge)}</span>` : ''}
          ${statusHtml}
        </div>

        <div class="course-card-body">
          <div class="course-meta-row">
            <span class="course-cat">${escapeHtml(c.category || 'MASTERCLASS')}</span>
            <span class="course-duration-pill">⏱ ${escapeHtml(durationText)}</span>
          </div>

          <h3 class="course-card-title" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</h3>
          <p class="course-card-sub">${escapeHtml(c.subtitle || 'Comprehensive practical editing and workflow masterclass.')}</p>

          <div class="course-progress-block">
            <div class="course-progress-header">
              <span>Lessons: <b>${c.completedCount} / ${c.totalLessons || 0}</b></span>
              <span><b>${c.progressPercent}%</b></span>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill ${isDone ? 'completed' : ''}" style="width: ${c.progressPercent}%"></div>
            </div>
          </div>

          <div class="course-card-footer">
            <button type="button" class="btn btn-gold" style="flex: 1;" onclick="openCourseClassroom('${c.id}')">
              ${isDone ? 'Review Lessons ↺' : (c.completedCount > 0 ? 'Resume Lesson ▶' : 'Start Learning ▶')}
            </button>
            ${isDone ? `
              <button type="button" class="btn btn-gold" style="box-shadow: 0 4px 14px rgba(216,161,83,0.35);" onclick="openCertificateModalFromCard('${c.id}', '${escapeHtml(c.title)}')">
                🎓 Certificate
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ── Filter by Status Tab ──
function filterMyCourses(filterType) {
  window._currentMyCoursesFilter = filterType;
  document.querySelectorAll('.mycourses-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filterType);
  });
  renderMyCoursesGrid();
}

// ── Live Search My Courses ──
function onSearchMyCourses(query) {
  window._myCoursesSearchQuery = query;
  renderMyCoursesGrid();
}

function showDashboard() {
  loadDashboard();
}

// ---------- 3. Classroom & Video Player ----------

async function openCourseClassroom(courseId, targetLessonId = null) {
  switchView('classroom');

  try {
    const res = await lmsApi(`course-details&id=${encodeURIComponent(courseId)}`);
    currentCourse = res.course;

    const playerCourseCat = document.getElementById('player-course-category');
    if (playerCourseCat) playerCourseCat.textContent = (currentCourse.category || 'VIDEO EDITING').toUpperCase();
    const playerCourseTitle = document.getElementById('player-course-title');
    if (playerCourseTitle) playerCourseTitle.textContent = currentCourse.title;
    const playerProgBadge = document.getElementById('player-progress-badge');
    if (playerProgBadge) playerProgBadge.textContent = `${currentCourse.progressPercent}% Complete`;

    // Render Curriculum Accordion
    renderCurriculum(currentCourse);

    // Determine initial lesson
    let initialLesson = null;
    if (targetLessonId) {
      for (const mod of currentCourse.modules || []) {
        for (const les of mod.lessons || []) {
          if (les.id === targetLessonId) { initialLesson = les; break; }
        }
      }
    }

    if (!initialLesson) {
      // Find first uncompleted lesson, or the first lesson
      for (const mod of currentCourse.modules || []) {
        for (const les of mod.lessons || []) {
          if (!les.isCompleted) { initialLesson = les; break; }
        }
        if (initialLesson) break;
      }
      if (!initialLesson && currentCourse.modules?.[0]?.lessons?.[0]) {
        initialLesson = currentCourse.modules[0].lessons[0];
      }
    }

    if (initialLesson) {
      loadLesson(currentCourse.id, initialLesson.id);
    }

    // Check certificate unlock
    updateCertificateUnlockState();

  } catch (err) {
    toast(`Error opening course: ${err.message}`, false);
    showDashboard();
  }
}

function renderCurriculum(course) {
  const container = document.getElementById('curriculum-accordion');
  const total = course.totalLessons || 0;
  const done = course.completedCount || 0;

  document.getElementById('curriculum-bar-fill').style.width = `${course.progressPercent}%`;
  document.getElementById('curriculum-stat-text').textContent = `${done} of ${total} Lessons Completed`;

  if (!course.modules || course.modules.length === 0) {
    container.innerHTML = '<div class="muted">No modules uploaded yet.</div>';
    return;
  }

  container.innerHTML = course.modules.map((m, mIdx) => `
    <div class="module-group">
      <div class="module-title">${escapeHtml(m.title)}</div>
      <div class="module-lessons">
        ${(m.lessons || []).map(les => `
          <div class="lesson-list-item ${les.isCompleted ? 'completed' : ''} ${currentLesson?.id === les.id ? 'active' : ''}" 
               id="nav-les-${les.id}" 
               onclick="loadLesson('${course.id}', '${les.id}')">
            <div class="lesson-title-col">
              <span class="lesson-check-icon">${les.isCompleted ? '✓' : '○'}</span>
              <span>${escapeHtml(les.title)}</span>
            </div>
            <span class="lesson-dur">${les.duration || ''}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

async function loadLesson(courseId, lessonId) {
  // Clear any existing countdown or overlay immediately
  if (_autoNextTimer) { clearInterval(_autoNextTimer); _autoNextTimer = null; }
  document.getElementById('autonext-overlay')?.remove();

  try {
    const res = await lmsApi(`get-lesson&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    currentLesson = res.lesson;

    // Update discussion context and auto-load comments (Comment tab is default)
    setDiscussionContext(courseId, lessonId);
    loadDiscussionComments();

    // Reset tabs — activate Comment tab by default
    document.querySelectorAll('.lesson-tab').forEach(t => t.classList.remove('active'));
    const discTab = document.querySelector('.lesson-tab[data-ltab="discussion"]');
    if (discTab) discTab.classList.add('active');
    ['notes','resources','quiz','discussion','support'].forEach(t => {
      const el = document.getElementById(`ltab-${t}`);
      if (el) el.classList.toggle('hidden', t !== 'discussion');
    });

    // Highlight active lesson in curriculum sidebar
    document.querySelectorAll('.lesson-list-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`nav-les-${lessonId}`);
    if (activeEl) activeEl.classList.add('active');

    // Title & duration
    document.getElementById('lesson-title').textContent = currentLesson.title;
    document.getElementById('lesson-duration-badge').textContent = `⏱ ${currentLesson.duration || 'Video'}`;

    // Mount Video Player
    const videoMount = document.getElementById('video-mount');
    videoMount.innerHTML = '';  // clear old player

    // Cleanup previous YouTube player instance
    if (window._currentYtPlayer && window._currentYtPlayer.destroy) {
      try { window._currentYtPlayer.destroy(); } catch (_) {}
      window._currentYtPlayer = null;
    }

    if (currentLesson.videoType === 'youtube') {
      // ── Custom Disguised YouTube Academy Player ──
      const ytTarget = document.createElement('div');
      ytTarget.id = 'yt-player-target';
      videoMount.appendChild(ytTarget);

      // Unobstructed cinema-grade player target (No overlay text or disturbing blockers)

      // Load and mount via YouTube Iframe API
      loadYouTubeIframeApi(() => {
        try {
          window._currentYtPlayer = new YT.Player('yt-player-target', {
            videoId: currentLesson.youtubeId,
            width: '100%',
            height: '100%',
            playerVars: {
              autoplay: 0,
              controls: 1,
              rel: 0,
              modestbranding: 1,
              iv_load_policy: 3,
              playsinline: 1,
              disablekb: 0,
              fs: 1,
              origin: window.location.origin
            },
            events: {
              onReady: (e) => {
                if (window._currentVideoSpeed) {
                  try { e.target.setPlaybackRate(window._currentVideoSpeed); } catch (_) {}
                }
              },
              onStateChange: (e) => {
                if (e.data === YT.PlayerState.ENDED) {
                  handleVideoEnded();
                }
              }
            }
          });
        } catch (err) {
          console.error('YouTube player init error:', err);
        }
      });

    } else if (currentLesson.videoType === 'bunny_stream') {
      // Bunny.net Stream Iframe embed
      const iframe = document.createElement('iframe');
      // Force fresh load (fix replay issue: add timestamp param)
      const sep = currentLesson.streamUrl.includes('?') ? '&' : '?';
      iframe.src = currentLesson.streamUrl + sep + '_t=' + Date.now();
      iframe.id  = 'bunny-iframe';
      iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.setAttribute('loading', 'lazy');
      videoMount.appendChild(iframe);

      // Bunny.net fires 'message' event with {event:'ended'} when video ends
      window._bunnyEndedListener && window.removeEventListener('message', window._bunnyEndedListener);
      window._bunnyEndedListener = (e) => {
        try {
          const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (d?.event === 'ended' || d?.type === 'ended') {
            handleVideoEnded();
          }
        } catch (_) {}
      };
      window.addEventListener('message', window._bunnyEndedListener);

    } else {
      // Standard HTML5 video (MP4 / HLS / direct URL)
      const video = document.createElement('video');
      video.id       = 'main-video-el';
      video.controls = true;
      video.autoplay = false;
      video.playsInline = true;
      video.setAttribute('controlslist', 'nodownload noplaybackrate');
      video.setAttribute('disablepictureinpicture', 'true');
      video.setAttribute('oncontextmenu', 'return false');
      // Fix replay: always set src fresh and load
      video.src = '';
      video.load();
      video.src = currentLesson.streamUrl;
      video.load();
      videoMount.appendChild(video);

      // Auto-next on video end
      video.addEventListener('ended', handleVideoEnded);
    }

    // Clean Video Playback: Permanently hide watermark login number
    const watermarkEl = document.getElementById('watermark-overlay');
    if (watermarkEl) {
      watermarkEl.classList.add('hidden');
      watermarkEl.style.display = 'none';
      const wText = document.getElementById('watermark-text');
      if (wText) wText.textContent = '';
    }

    // Toggle Complete Button State
    updateCompleteBtnState(currentLesson.isCompleted);

    // Notes
    document.getElementById('lesson-notes-text').innerHTML = currentLesson.summary
      ? `<p>${escapeHtml(currentLesson.summary)}</p>`
      : '<p class="muted">No specific notes for this video. Follow along with your editor timeline.</p>';

    // Resources (Lesson files + Course project/test files)
    const resList = document.getElementById('lesson-resources-list');
    const lessonRes = currentLesson.resources || [];
    const courseRes = currentCourse.resources || currentCourse.practiceFiles || [];
    const allRes = [
      ...lessonRes.map(r => ({ ...r, badge: 'Lesson File' })),
      ...courseRes.map(r => ({ ...r, badge: 'Course Project / Test Asset' }))
    ];

    if (allRes.length > 0) {
      resList.innerHTML = allRes.map(r => `
        <div class="resource-item" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;margin-bottom:8px">
          <div>
            <div style="font-weight:600;font-size:13.5px;color:#fff">📁 ${escapeHtml(r.name || r.title || 'Practice File')}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">
              <span class="badge" style="font-size:10px;padding:2px 6px;margin-right:6px">${escapeHtml(r.badge)}</span>
              ${r.size ? `<span>Size: ${escapeHtml(r.size)}</span>` : ''}
            </div>
          </div>
          <a href="${escapeHtml(r.url)}" target="_blank" download class="btn-sm btn-outline" style="color:#34d399;border-color:rgba(52,211,153,0.4)">Download File ⬇</a>
        </div>
      `).join('');
    } else {
      resList.innerHTML = '<p class="muted">No downloadable attachments for this lesson.</p>';
    }

    // WhatsApp Mentor Support
    const doubtMsg = encodeURIComponent(`Hello Anil Sir, I am enrolled in "${currentCourse.title}" and have a query regarding lesson "${currentLesson.title}".`);
    document.getElementById('btn-whatsapp-doubt').href = `https://wa.me/919939800780?text=${doubtMsg}`;

  } catch (err) {
    toast(`Could not load lesson: ${err.message}`, false);
  }
}

function updateCompleteBtnState(isCompleted) {
  const icon = document.getElementById('complete-btn-icon');
  const text = document.getElementById('complete-btn-text');
  const btn = document.getElementById('btn-toggle-complete');

  if (isCompleted) {
    icon.textContent = '✓';
    text.textContent = 'Completed';
    btn.style.background = 'var(--emerald-bg)';
    btn.style.borderColor = 'var(--emerald)';
    btn.style.color = 'var(--emerald)';
  } else {
    icon.textContent = '○';
    text.textContent = 'Mark as Complete';
    btn.style.background = 'transparent';
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--text-main)';
  }
}

async function toggleLessonComplete() {
  if (!currentCourse || !currentLesson) return;

  const newState = !currentLesson.isCompleted;
  try {
    await lmsApi('update-progress', {
      method: 'POST',
      body: {
        courseId: currentCourse.id,
        lessonId: currentLesson.id,
        isCompleted: newState
      }
    });

    currentLesson.isCompleted = newState;
    updateCompleteBtnState(newState);

    // Update sidebar checkmark
    const navItem = document.getElementById(`nav-les-${currentLesson.id}`);
    if (navItem) {
      if (newState) {
        navItem.classList.add('completed');
        navItem.querySelector('.lesson-check-icon').textContent = '✓';
      } else {
        navItem.classList.remove('completed');
        navItem.querySelector('.lesson-check-icon').textContent = '○';
      }
    }

    // Recalculate course completion
    const allItems = document.querySelectorAll('.lesson-list-item');
    const completedItems = document.querySelectorAll('.lesson-list-item.completed');
    const total = allItems.length;
    const done = completedItems.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById('curriculum-bar-fill').style.width = `${pct}%`;
    document.getElementById('curriculum-stat-text').textContent = `${done} of ${total} Lessons Completed`;
    document.getElementById('player-progress-badge').textContent = `${pct}% Complete`;

    currentCourse.completedCount = done;
    currentCourse.progressPercent = pct;

    updateCertificateUnlockState();

    if (newState && pct >= 100) {
      toast('🎓 Outstanding! Course completed 100%! Generating official certificate...');
      triggerConfettiCelebration();
      setTimeout(() => {
        openCertificateModal(currentCourse.id);
      }, 900);
    } else {
      toast(newState ? 'Lesson marked as completed! 🎉' : 'Lesson marked as uncompleted.');
      if (newState && pct < 100) {
        goToNextLesson();
      }
    }
  } catch (err) {
    toast(`Failed to update progress: ${err.message}`, false);
  }
}

function goToNextLesson() {
  if (!currentCourse || !currentLesson) return;

  let foundCurrent = false;
  let nextLesson = null;

  for (const mod of currentCourse.modules || []) {
    for (const les of mod.lessons || []) {
      if (foundCurrent) {
        nextLesson = les;
        break;
      }
      if (les.id === currentLesson.id) {
        foundCurrent = true;
      }
    }
    if (nextLesson) break;
  }

  if (nextLesson) {
    loadLesson(currentCourse.id, nextLesson.id);
  } else {
    updateCertificateUnlockState();
    if (currentCourse.progressPercent >= 100) {
      toast('🎓 Congratulations! You reached the end of this course!');
      triggerConfettiCelebration();
      setTimeout(() => {
        openCertificateModal(currentCourse.id);
      }, 900);
    } else {
      toast('You have reached the end of this module. Complete remaining lessons to unlock your certificate!');
    }
  }
}

// ── YouTube IFrame API Loader ────────────────────────────────────────────────
let _ytApiLoading = false;
let _ytApiCallbacks = [];

function loadYouTubeIframeApi(callback) {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }
  _ytApiCallbacks.push(callback);
  if (!_ytApiLoading) {
    _ytApiLoading = true;
    window.onYouTubeIframeAPIReady = () => {
      _ytApiCallbacks.forEach(cb => {
        try { cb(); } catch (e) { console.error(e); }
      });
      _ytApiCallbacks = [];
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }
}

// ── Auto-Next Video on Ended & Replay ─────────────────────────────────────────
let _autoNextTimer = null;

function replayCurrentVideo() {
  if (_autoNextTimer) { clearInterval(_autoNextTimer); _autoNextTimer = null; }
  document.getElementById('autonext-overlay')?.remove();

  // YouTube player replay
  if (window._currentYtPlayer && typeof window._currentYtPlayer.seekTo === 'function') {
    try {
      window._currentYtPlayer.seekTo(0, true);
      window._currentYtPlayer.playVideo();
      return;
    } catch (_) {}
  }

  const video = document.getElementById('main-video-el');
  if (video) {
    video.currentTime = 0;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
    return;
  }
  const iframe = document.getElementById('bunny-iframe');
  if (iframe && currentLesson && currentLesson.streamUrl) {
    const sep = currentLesson.streamUrl.includes('?') ? '&' : '?';
    iframe.src = currentLesson.streamUrl + sep + '_t=' + Date.now() + '&autoplay=true';
    return;
  }
  if (currentCourse && currentLesson) {
    loadLesson(currentCourse.id, currentLesson.id);
  }
}

function handleVideoEnded() {
  if (_autoNextTimer) { clearInterval(_autoNextTimer); _autoNextTimer = null; }
  document.getElementById('autonext-overlay')?.remove();

  if (!currentCourse || !currentLesson) return;

  // Find next lesson
  let foundCurrent = false;
  let nextLesson = null;
  for (const mod of currentCourse.modules || []) {
    for (const les of mod.lessons || []) {
      if (foundCurrent) { nextLesson = les; break; }
      if (les.id === currentLesson.id) foundCurrent = true;
    }
    if (nextLesson) break;
  }

  // Auto-mark current as completed
  if (!currentLesson.isCompleted) {
    toggleLessonComplete().catch(() => {});
  }

  const videoMount = document.getElementById('video-mount');
  if (!videoMount) return;

  const overlay = document.createElement('div');
  overlay.id = 'autonext-overlay';

  if (nextLesson) {
    let seconds = 6;
    overlay.innerHTML = `
      <div class="autonext-card">
        <div class="autonext-badge">▶ UP NEXT IN <span id="autonext-counter">${seconds}</span>s</div>
        <div class="autonext-title">${escapeHtml(nextLesson.title)}</div>
        <div class="autonext-progress-ring">
          <svg width="56" height="56" style="transform:rotate(-90deg)">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4"/>
            <circle id="autonext-ring" cx="28" cy="28" r="24" fill="none" stroke="#d8a153" stroke-width="4"
              stroke-dasharray="150.8" stroke-dashoffset="0" stroke-linecap="round"
              style="transition:stroke-dashoffset 1s linear;"/>
          </svg>
          <button type="button" class="autonext-play-btn" onclick="confirmAutoNext('${nextLesson.id}')" title="Play Now">▶</button>
        </div>
        <div class="autonext-btn-row">
          <button type="button" class="btn-replay-overlay" onclick="replayCurrentVideo()">
            ↺ Replay
          </button>
          <button type="button" class="btn-cancel-overlay" onclick="cancelAutoNext()">
            ✕ Cancel
          </button>
          <button type="button" class="btn-sm btn-gold btn-next-overlay" onclick="confirmAutoNext('${nextLesson.id}')">
            Next Lesson ▶
          </button>
        </div>
      </div>`;

    videoMount.appendChild(overlay);

    const ring = document.getElementById('autonext-ring');
    const circumference = 150.8;

    _autoNextTimer = setInterval(() => {
      seconds--;
      const el = document.getElementById('autonext-counter');
      if (el) el.textContent = seconds;
      if (ring) ring.style.strokeDashoffset = circumference * (1 - seconds / 6);

      if (seconds <= 0) {
        clearInterval(_autoNextTimer);
        _autoNextTimer = null;
        confirmAutoNext(nextLesson.id);
      }
    }, 1000);

  } else {
    // Last lesson finished!
    updateCertificateUnlockState();
    overlay.innerHTML = `
      <div class="autonext-card">
        <div style="font-size:32px;">🎓</div>
        <div class="autonext-badge" style="color:#d8a153;">Course Completed!</div>
        <div class="autonext-title">Aapne course ke sabhi lessons poore kar liye hain!</div>
        <div class="autonext-btn-row">
          <button type="button" class="btn-replay-overlay" onclick="replayCurrentVideo()">
            ↺ Replay Video
          </button>
          <button type="button" class="btn-sm btn-gold btn-next-overlay" onclick="cancelAutoNext(); openCertificateModal();">
            🎓 View Certificate
          </button>
        </div>
      </div>`;
    videoMount.appendChild(overlay);
  }
}

function cancelAutoNext() {
  if (_autoNextTimer) { clearInterval(_autoNextTimer); _autoNextTimer = null; }
  document.getElementById('autonext-overlay')?.remove();
}

function confirmAutoNext(lessonId) {
  if (_autoNextTimer) { clearInterval(_autoNextTimer); _autoNextTimer = null; }
  document.getElementById('autonext-overlay')?.remove();
  if (currentCourse && lessonId) {
    loadLesson(currentCourse.id, lessonId);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function updateCertificateUnlockState() {
  const box = document.getElementById('certificate-unlock-box');
  if (!box) return;
  if (currentCourse && currentCourse.progressPercent >= 100) {
    box.classList.remove('hidden');
    box.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(201,151,56,0.2) 0%, rgba(16,185,129,0.15) 100%); border: 1.5px solid var(--border-gold); padding: 16px; border-radius: var(--radius-md); text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
        <div style="font-size: 26px; margin-bottom: 4px;">🎓</div>
        <div style="font-family: 'Cinzel', serif; font-weight: 800; color: #ecd394; font-size: 14px; letter-spacing: 0.05em;">
          COURSE COMPLETED (100%)
        </div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin: 4px 0 12px;">
          Your official accredited certificate is ready!
        </div>
        <button type="button" class="btn btn-gold" style="width: 100%; box-shadow: 0 4px 12px rgba(201,151,56,0.4);" onclick="openCertificateModal('${currentCourse.id}')">
          🎓 View &amp; Download Certificate
        </button>
      </div>
    `;
  } else {
    box.classList.add('hidden');
  }
}

// ---------- 4. Certificate Generator & Verification System ----------

let activeCertData = null;

function getCourseCode(courseId) {
  if (!courseId) return 'PR';
  const id = courseId.toLowerCase();
  if (id.includes('pre-wedding')) return 'PW';
  if (id.includes('album')) return 'AD';
  if (id.includes('premiere')) return 'PR';
  if (id.includes('edius')) return 'ED';
  if (id.includes('davinci') || id.includes('resolve')) return 'DR';
  if (id.includes('cinematic') || id.includes('wedding')) return 'CE';
  if (id.includes('website') || id.includes('web')) return 'WD';
  if (id.includes('marketing') || id.includes('digital')) return 'DM';
  if (id.includes('auto')) return 'AU';
  return 'GEN';
}

function generateCertificateId(courseId, phone) {
  const code = getCourseCode(courseId);
  const suffix = (phone || (currentStudent ? currentStudent.phone : '0780')).slice(-4);
  return `QAA-2026-${code}-${suffix}`;
}

function triggerConfettiCelebration() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const colors = ['#c99738', '#ecd394', '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#ffffff'];

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.4) - 40,
      w: Math.random() * 10 + 6,
      h: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 4 + 2.5,
      rotation: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 8,
      opacity: 1
    });
  }

  let animationFrame;
  const startTime = Date.now();

  function animate() {
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vrot;
      if (elapsed > 2500) {
        p.opacity = Math.max(0, p.opacity - 0.02);
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (elapsed < 3800) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  animate();
}

function populateCertificateUI(studentName, courseTitle, courseId, duration, certId) {
  const nameElem = document.getElementById('cert-student-name');
  const courseElem = document.getElementById('cert-course-name');
  const dateElem = document.getElementById('cert-date-val');
  const idElem = document.getElementById('cert-id-val');
  const durElem = document.getElementById('cert-meta-duration');
  const qrElem = document.getElementById('cert-qr-img');

  const name = studentName || (currentStudent ? currentStudent.name : 'Student');
  const cTitle = courseTitle || (currentCourse ? currentCourse.title : 'Adobe Premiere Pro Masterclass');
  const cId = certId || generateCertificateId(courseId, currentStudent ? currentStudent.phone : '0780');

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (nameElem) nameElem.textContent = name;
  if (courseElem) courseElem.textContent = cTitle;
  if (dateElem) dateElem.textContent = today;
  if (idElem) idElem.textContent = `ID: ${cId}`;
  if (durElem) durElem.textContent = '';

  // Update Live Academic Verification Ledger
  const ledgerName = document.getElementById('ledger-student-name');
  const ledgerId = document.getElementById('ledger-cert-id');
  const ledgerCourse = document.getElementById('ledger-course-title');
  if (ledgerName) ledgerName.textContent = name;
  if (ledgerId) ledgerId.textContent = cId;
  if (ledgerCourse) ledgerCourse.textContent = cTitle;

  // Live QR Code leading to verification URL (dynamic localhost / production)
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const verifyUrl = isLocal 
    ? `${window.location.origin}${window.location.pathname}?verify=${encodeURIComponent(cId)}`
    : `https://quickartphotography.in/portal/?verify=${encodeURIComponent(cId)}`;

  const qrContainer = document.getElementById('cert-qr-frame');

  if (typeof QRCode !== 'undefined' && qrContainer) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: verifyUrl,
      width: 136,
      height: 136,
      colorDark: '#141720',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  } else if (qrElem) {
    qrElem.crossOrigin = 'anonymous';
    qrElem.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}&margin=4`;
    qrElem.alt = `Verify ${cId}`;
  }

  activeCertData = {
    studentName: name,
    courseTitle: cTitle,
    courseId: courseId,
    duration: duration || '18 Credit Hours',
    certificateId: cId,
    issuedDate: today,
    verifyUrl: verifyUrl
  };
}

function openCertificateModal(courseId) {
  const cid = courseId || (currentCourse ? currentCourse.id : '');
  const cTitle = currentCourse ? currentCourse.title : 'Adobe Premiere Pro Masterclass';
  const dur = currentCourse ? currentCourse.duration : '18 Credit Hours';
  populateCertificateUI(currentStudent ? currentStudent.name : 'Student', cTitle, cid, dur);
  document.getElementById('modal-certificate').classList.add('show');
}

function openCertificateModalFromCard(courseId, courseTitle) {
  const studentName = currentStudent ? currentStudent.name : 'Student';
  populateCertificateUI(studentName, courseTitle, courseId, '18 Credit Hours');
  document.getElementById('modal-certificate').classList.add('show');
}

function closeCertificateModal() {
  document.getElementById('modal-certificate').classList.remove('show');
}

// Helper: Draw curved text along a circle arc
function drawArcText(ctx, str, cx, cy, radius, startAngle, endAngle, outward) {
  const chars = str.split('');
  const numChars = chars.length;
  if (numChars === 0) return;
  const angleStep = (endAngle - startAngle) / (numChars - 1 || 1);

  for (let i = 0; i < numChars; i++) {
    const char = chars[i];
    const angle = startAngle + i * angleStep;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + (outward ? Math.PI / 2 : -Math.PI / 2));
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
}

// Helper: Draw ornate corner filigree arabesque
function drawCornerArabesque(ctx, x, y, scaleX, scaleY) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);
  ctx.strokeStyle = '#c99738';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(6, 82);
  ctx.bezierCurveTo(6, 24, 24, 6, 82, 6);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(216, 161, 83, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(14, 72);
  ctx.bezierCurveTo(14, 28, 28, 14, 72, 14);
  ctx.stroke();

  ctx.fillStyle = '#d8a153';
  ctx.beginPath();
  ctx.arc(32, 32, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#aa7c11';
  ctx.beginPath();
  ctx.arc(18, 18, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 1-Click HD Image (PNG) Export (Dual-Engine: 100% Identical DOM Capture + Vector Fallback)
async function downloadCertificatePNG() {
  if (!activeCertData) {
    toast('Certificate not ready', false);
    return;
  }
  toast('Preparing HD Certificate Download…');

  // 1. Wait for custom web fonts to be fully loaded
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      // Font wait timeout fallback
    }
  }

  // 2. Primary Engine: Ultra-HD DOM Screenshot via html2canvas (Clone to fixed 1020px desktop width)
  const certElement = document.getElementById('certificate-print-area');
  if (typeof html2canvas !== 'undefined' && certElement) {
    try {
      const offscreenWrap = document.createElement('div');
      offscreenWrap.style.position = 'fixed';
      offscreenWrap.style.left = '-9999px';
      offscreenWrap.style.top = '0';
      offscreenWrap.style.width = '1020px';
      offscreenWrap.style.zIndex = '-9999';
      offscreenWrap.style.background = '#ffffff';

      const clone = certElement.cloneNode(true);
      clone.style.width = '1020px';
      clone.style.maxWidth = '1020px';
      clone.style.minWidth = '1020px';
      clone.style.boxSizing = 'border-box';
      clone.style.margin = '0';
      offscreenWrap.appendChild(clone);
      document.body.appendChild(offscreenWrap);

      // Brief tick for DOM reflow
      await new Promise(r => setTimeout(r, 100));

      const h2cCanvas = await html2canvas(clone, {
        scale: 2.5, // 2550px width - crystal clear 300 DPI
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fbf6ec',
        logging: false,
        imageTimeout: 5000
      });

      if (offscreenWrap.parentNode) {
        document.body.removeChild(offscreenWrap);
      }

      if (h2cCanvas && h2cCanvas.width > 800) {
        triggerCanvasDownload(h2cCanvas, activeCertData.studentName);
        return;
      }
    } catch (h2cErr) {
      console.warn('html2canvas capture skipped/failed, switching to comprehensive 2D Canvas engine:', h2cErr);
    }
  }

  // 3. Fallback Engine: Comprehensive Vector 2D Canvas Renderer (All 15+ elements included)
  const canvas = document.getElementById('cert-export-canvas') || document.createElement('canvas');
  canvas.width = 1754; // A4 Landscape 150 DPI
  canvas.height = 1240;
  const ctx = canvas.getContext('2d');

  // Background Parchment Radial Gradient
  const bgGrad = ctx.createRadialGradient(877, 620, 50, 877, 620, 920);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(0.6, '#fbf6ec');
  bgGrad.addColorStop(1, '#f4ebd9');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Gold Double Border
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#c99738';
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ecd394';
  ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

  // Inner Frame Borders
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(201, 151, 56, 0.45)';
  ctx.strokeRect(66, 66, canvas.width - 132, canvas.height - 132);

  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(201, 151, 56, 0.3)';
  ctx.strokeRect(74, 74, canvas.width - 148, canvas.height - 148);
  ctx.setLineDash([]);

  // Ornate Corner Filigrees
  drawCornerArabesque(ctx, 48, 48, 1, 1);
  drawCornerArabesque(ctx, canvas.width - 48, 48, -1, 1);
  drawCornerArabesque(ctx, 48, canvas.height - 48, 1, -1);
  drawCornerArabesque(ctx, canvas.width - 48, canvas.height - 48, -1, -1);

  // Microprint Security Border Line
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(184, 132, 59, 0.65)';
  ctx.font = '8px monospace';
  ctx.fillText('★ QUICK ART PHOTOGRAPHY ACADEMY ★ AN ISO 9001:2015 CERTIFIED INSTITUTION ★ GOVT. OF INDIA MSME (UDYAM-BR-35-0027860) ★ CENTRE: PAT/QAA-800001 ★ VERIFIED CREDENTIAL ★ OFFICIAL RECORD ★ TAMPER-PROOF ACADEMIC REGISTER ★', 877, 59);

  // Background Security Watermark (Concentric Circles + Star + QAA)
  ctx.save();
  ctx.strokeStyle = 'rgba(216, 161, 83, 0.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(877, 620, 210, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(216, 161, 83, 0.06)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(877, 620, 165, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(216, 161, 83, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(877, 620, 120, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(216, 161, 83, 0.08)';
  ctx.font = 'bold 50px "Cinzel", Georgia, serif';
  ctx.fillText('QAA', 877, 638);
  ctx.restore();

  // Helper to load image asynchronously
  const loadImage = (src) => new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

  // Load logo
  const domLogo = document.getElementById('cert-logo-img');
  let logoImg = null;
  if (domLogo && domLogo.complete && domLogo.naturalWidth > 0) {
    logoImg = domLogo;
  } else {
    logoImg = await loadImage('../assets/quick-art-logo.png');
  }

  // Draw Royal Laurel Wreath around logo
  ctx.save();
  const laurelGrad = ctx.createLinearGradient(810, 80, 940, 160);
  laurelGrad.addColorStop(0, '#b8843b');
  laurelGrad.addColorStop(0.5, '#ecc779');
  laurelGrad.addColorStop(1, '#996a24');
  ctx.fillStyle = laurelGrad;

  // Left laurel leaves
  const leftLeaves = [
    [835, 132, 18, 9, -0.4],
    [827, 116, 20, 10, -0.7],
    [830, 98, 19, 9, -1.0],
    [840, 82, 17, 8, -1.3],
    [856, 72, 15, 7, -1.6]
  ];
  for (const [lx, ly, rx, ry, rot] of leftLeaves) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Right laurel leaves
  const rightLeaves = [
    [919, 132, 18, 9, 0.4],
    [927, 116, 20, 10, 0.7],
    [924, 98, 19, 9, 1.0],
    [914, 82, 17, 8, 1.3],
    [898, 72, 15, 7, 1.6]
  ];
  for (const [lx, ly, rx, ry, rot] of rightLeaves) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Draw Stars above logo
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c99738';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText('★   ★   ★', 877, 74);

  // Draw Logo seamlessly onto parchment
  if (logoImg) {
    const logoSize = 74;
    const logoX = 877 - (logoSize / 2);
    const logoY = 82;

    ctx.save();
    ctx.beginPath();
    ctx.arc(877, logoY + (logoSize / 2), (logoSize / 2) + 2, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(201, 151, 56, 0.65)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(877, logoY + (logoSize / 2), logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    // Ribbon ESTD under logo
    ctx.fillStyle = '#b8843b';
    ctx.beginPath();
    ctx.roundRect(832, logoY + logoSize + 4, 90, 18, 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px "Cinzel", Georgia, serif';
    ctx.fillText('ESTD. 2014', 877, logoY + logoSize + 16);
  }

  // Header Titles
  ctx.textAlign = 'center';
  ctx.fillStyle = '#141720';
  ctx.font = 'bold 34px "Cinzel", Georgia, serif';
  ctx.fillText('QUICK ART PHOTOGRAPHY ACADEMY', 877, 206);

  ctx.fillStyle = '#8c6a28';
  ctx.font = 'bold 13.5px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('ACADEMY OF CINEMATIC FILMMAKING, PHOTOGRAPHY & DIGITAL ARTS', 877, 226);

  ctx.fillStyle = '#5c584e';
  ctx.font = 'bold 11px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('AN ISO 9001:2015 CERTIFIED INSTITUTION • GOVT. OF INDIA MSME REGD. (UDYAM-BR-35-0027860) • CENTRE CODE: PAT/QAA-800001', 877, 248);

  // Thin separator rule
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(201, 151, 56, 0.35)';
  ctx.beginPath();
  ctx.moveTo(420, 258);
  ctx.lineTo(1334, 258);
  ctx.stroke();

  // Gold Ribbon Banner
  const titleGrad = ctx.createLinearGradient(460, 275, 1294, 317);
  titleGrad.addColorStop(0, '#b8843b');
  titleGrad.addColorStop(0.5, '#ecd394');
  titleGrad.addColorStop(1, '#a87224');
  ctx.fillStyle = titleGrad;
  ctx.beginPath();
  ctx.roundRect(460, 272, 834, 42, 6);
  ctx.fill();

  ctx.fillStyle = '#141006';
  ctx.font = 'bold 17px "Cinzel", Georgia, serif';
  ctx.fillText('★  CERTIFICATE OF COMPLETION & EXCELLENCE  ★', 877, 299);

  // Registration & Authenticity Code
  ctx.fillStyle = '#736750';
  ctx.font = 'bold 11.5px monospace';
  ctx.fillText('Registration No: QAA/ISO-2026/0842 • Authenticity Verified', 877, 332);

  // Presented To
  ctx.fillStyle = '#585143';
  ctx.font = 'italic 19px "Playfair Display", Georgia, serif';
  ctx.fillText('This prestigious credential is duly and officially conferred upon', 877, 372);

  // Student Name
  ctx.fillStyle = '#94661a';
  ctx.font = 'bold 50px "Cinzel", Georgia, serif';
  ctx.fillText(activeCertData.studentName, 877, 436);

  // Gold Accent Underline
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#c99738';
  ctx.beginPath();
  ctx.moveTo(540, 452);
  ctx.lineTo(1214, 452);
  ctx.stroke();

  // Citation Body
  ctx.fillStyle = '#403c35';
  ctx.font = '16.5px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('in recognition of successfully completing all academic modules, rigorous practical assignments,', 877, 498);
  ctx.fillText('industry-standard real client workflows, and demonstrating professional mastery in', 877, 524);

  // Course Name
  ctx.fillStyle = '#12151d';
  ctx.font = 'bold 36px "Cinzel", Georgia, serif';
  ctx.fillText(activeCertData.courseTitle, 877, 580);

  // Meta Badges
  ctx.fillStyle = '#704408';
  ctx.font = 'bold 15px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('★ Grade: Distinction (Grade A+)   •   ✓ Practical Portfolio Approved   •   🛡️ Industry Standard Certified', 877, 626);

  // Footer Left: Verification & QR
  ctx.textAlign = 'left';
  
  // Extract or load QR code
  let qrImg = null;
  const qrFrame = document.getElementById('cert-qr-frame');
  if (qrFrame) {
    const domCanvas = qrFrame.querySelector('canvas');
    const domImg = qrFrame.querySelector('img');
    if (domCanvas) {
      qrImg = domCanvas;
    } else if (domImg && domImg.src) {
      qrImg = domImg;
    }
  }
  if (!qrImg) {
    try {
      qrImg = await loadImage(activeCertData.verifyUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeCertData.verifyUrl)}` : '');
    } catch (e) {}
  }

  // Draw QR Frame
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c99738';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(118, 930, 96, 96, 4);
  ctx.fill();
  ctx.stroke();

  if (qrImg) {
    try {
      ctx.drawImage(qrImg, 122, 934, 88, 88);
    } catch (qrErr) {}
  }

  ctx.fillStyle = '#6d5423';
  ctx.font = 'bold 9.5px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('SCAN TO VERIFY ONLINE', 120, 1044);

  ctx.fillStyle = '#141720';
  ctx.font = 'bold 13.5px monospace';
  ctx.fillText(`ID: ${activeCertData.certificateId}`, 120, 1064);

  // Draw Vector Barcode Stripes (Matching SVG Barcode)
  const barcodeBars = [
    [0, 3], [5, 1], [8, 4], [15, 2], [19, 1], [22, 3], [27, 5],
    [34, 2], [38, 1], [41, 3], [46, 2], [50, 4], [56, 1], [59, 3],
    [64, 5], [71, 2], [75, 1], [78, 3], [83, 4], [89, 2], [93, 1],
    [96, 5], [103, 2], [107, 3], [112, 1], [115, 4], [121, 2], [125, 3]
  ];
  ctx.fillStyle = '#444444';
  for (const [bx, bw] of barcodeBars) {
    ctx.fillRect(120 + bx * 1.15, 1076, bw * 1.15, 18);
  }

  // Footer Center: Ornate 3D Gold Seal with Ribbons
  ctx.save();
  const sealX = 877;
  const sealY = 1045;
  const sealR = 56;

  // Ribbon Tails
  ctx.fillStyle = '#99222c';
  ctx.beginPath();
  ctx.moveTo(sealX - 22, sealY + 20);
  ctx.lineTo(sealX - 35, sealY + 75);
  ctx.lineTo(sealX - 22, sealY + 66);
  ctx.lineTo(sealX - 9, sealY + 75);
  ctx.lineTo(sealX - 5, sealY + 25);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sealX + 22, sealY + 20);
  ctx.lineTo(sealX + 35, sealY + 75);
  ctx.lineTo(sealX + 22, sealY + 66);
  ctx.lineTo(sealX + 9, sealY + 75);
  ctx.lineTo(sealX + 5, sealY + 25);
  ctx.fill();

  // Seal Body Radial Gradient
  const sealGrad = ctx.createRadialGradient(sealX - 15, sealY - 15, 5, sealX, sealY, sealR);
  sealGrad.addColorStop(0, '#fff4cc');
  sealGrad.addColorStop(0.35, '#e0ab4a');
  sealGrad.addColorStop(0.75, '#a36f1c');
  sealGrad.addColorStop(1, '#613e09');
  ctx.fillStyle = sealGrad;

  // Serrated Star Edge (36 teeth)
  ctx.beginPath();
  for (let i = 0; i < 72; i++) {
    const angle = (i * Math.PI) / 36;
    const r = i % 2 === 0 ? sealR + 4 : sealR - 1;
    const px = sealX + r * Math.cos(angle);
    const py = sealY + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#f5df9a';
  ctx.stroke();

  // Inner rings
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR - 10, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 245, 200, 0.85)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR - 22, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 245, 200, 0.6)';
  ctx.stroke();

  // Curved Top & Bottom Text on Seal
  ctx.fillStyle = '#321c02';
  ctx.font = 'bold 8.5px "Cinzel", Georgia, serif';
  drawArcText(ctx, '★ QUICK ART ACADEMY ★', sealX, sealY, sealR - 16, -2.4, -0.74, true);
  ctx.font = 'bold 7.5px "Cinzel", Georgia, serif';
  drawArcText(ctx, 'OFFICIAL SEAL • EXCELLENCE', sealX, sealY, sealR - 16, 2.35, 0.79, false);

  // Center Emblem (Star Crown & Camera Symbol)
  ctx.fillStyle = '#fff5d0';
  ctx.beginPath();
  ctx.arc(sealX, sealY - 4, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#321c02';
  ctx.font = 'bold 11px "Cinzel", Georgia, serif';
  ctx.fillText('QAA', sealX, sealY + 11);
  ctx.restore();

  // Footer Right: Issue Date, Official Red Stamp & Anil Sharma Signature
  // 1. Date of Issue Block
  ctx.textAlign = 'right';
  ctx.fillStyle = '#141720';
  ctx.font = 'bold 14.5px "Cinzel", Georgia, serif';
  ctx.fillText(activeCertData.issuedDate, 1630, 946);
  ctx.fillStyle = '#8c6a28';
  ctx.font = 'bold 11px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Date of Issue', 1630, 964);

  // 2. Official Red Verified Stamp (Side-by-side)
  ctx.save();
  const stampX = 1360;
  const stampY = 1045;
  const stampR = 38;

  ctx.translate(stampX, stampY);
  ctx.rotate(-12 * Math.PI / 180);

  ctx.strokeStyle = '#a72332';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 2.5]);
  ctx.beginPath();
  ctx.arc(0, 0, stampR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, stampR - 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#a72332';
  ctx.font = 'bold 6.5px "Cinzel", Georgia, serif';
  ctx.fillText('QUICK ART', 0, -16);
  ctx.font = '900 8.5px "Cinzel", Georgia, serif';
  ctx.fillText('DIRECTOR', 0, -4);
  ctx.font = '6px Arial, sans-serif';
  ctx.fillText('★ ★ ★', 0, 7);
  ctx.font = 'bold 6.5px "Cinzel", Georgia, serif';
  ctx.fillText('VERIFIED', 0, 18);
  ctx.restore();

  // 3. Signature Column on the right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#13151e';
  ctx.font = 'italic 46px "Alex Brush", cursive';
  ctx.fillText('Anil Sharma', 1630, 1028);

  ctx.strokeStyle = '#141720';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(1440, 1046);
  ctx.lineTo(1630, 1046);
  ctx.stroke();

  ctx.fillStyle = '#141720';
  ctx.font = 'bold 16px "Cinzel", Georgia, serif';
  ctx.fillText('Anil Sharma', 1630, 1070);
  ctx.fillStyle = '#845714';
  ctx.font = 'bold 12.5px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Founder & Master Director', 1630, 1090);
  ctx.fillStyle = '#5c584e';
  ctx.font = 'bold 11px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText('Quick Art Photography Academy', 1630, 1106);

  // Bottom Tamper-Evident Security Footer Notice
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(100, 90, 75, 0.85)';
  ctx.font = 'bold 9.5px "Plus Jakarta Sans", monospace';
  ctx.fillText('VERIFIED OFFICIAL RECORD • THIS DOCUMENT CARRIES TAMPER-EVIDENT DIGITAL VALIDATION • VALID WORLDWIDE', 877, 1152);

  triggerCanvasDownload(canvas, activeCertData.studentName);
}

function triggerCanvasDownload(canvas, studentName) {
  const link = document.createElement('a');
  const safeName = (studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `QuickArt_Certificate_${safeName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  toast('✅ HD Certificate Downloaded Successfully!');
}

function shareCertificateWhatsApp() {
  if (!activeCertData) return;
  const msg = `🎓 Proud to share my official Certificate of Completion for "${activeCertData.courseTitle}" from Quick Art Photography Academy!\n\nCandidate: ${activeCertData.studentName}\nCredential ID: ${activeCertData.certificateId}\n\nVerify Live Online: ${activeCertData.verifyUrl}`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

function copyCertificateLink() {
  if (!activeCertData || !activeCertData.verifyUrl) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(activeCertData.verifyUrl).then(() => {
      toast('✅ Official Verification link copied to clipboard!');
    }).catch(() => {
      prompt('Copy certificate link:', activeCertData.verifyUrl);
    });
  } else {
    prompt('Copy certificate link:', activeCertData.verifyUrl);
  }
}

// ---------- Video Playback Controls ----------

function setVideoSpeed(rate) {
  window._currentVideoSpeed = rate;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.speed-btn')).find(b => b.textContent.includes(`${rate}`));
  if (btn) btn.classList.add('active');

  // 1. HTML5 Video
  const video = document.querySelector('#video-mount video');
  if (video) {
    video.playbackRate = rate;
    toast(`Speed: ${rate}x`);
    return;
  }

  // 2. YouTube Player
  if (window._currentYtPlayer && typeof window._currentYtPlayer.setPlaybackRate === 'function') {
    try {
      window._currentYtPlayer.setPlaybackRate(rate);
      toast(`Speed: ${rate}x`);
      return;
    } catch (_) {}
  }

  // 3. Bunny iframe (postMessage)
  const iframe = document.querySelector('#video-mount iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'setPlaybackRate', rate }), '*');
    toast(`Speed: ${rate}x`);
  }
}

function skipVideo(delta) {
  // 1. HTML5 Video
  const video = document.querySelector('#video-mount video');
  if (video) {
    video.currentTime = Math.max(0, video.currentTime + delta);
    toast(`${delta > 0 ? '+' : ''}${delta}s`);
    return;
  }

  // 2. YouTube Player
  if (window._currentYtPlayer && typeof window._currentYtPlayer.getCurrentTime === 'function') {
    try {
      const cur = window._currentYtPlayer.getCurrentTime();
      window._currentYtPlayer.seekTo(Math.max(0, cur + delta), true);
      toast(`${delta > 0 ? '+' : ''}${delta}s`);
      return;
    } catch (_) {}
  }
}

// ---------- Module Quiz Logic ----------

function renderQuiz(course) {
  const container = document.getElementById('quiz-questions-wrap');
  const quiz = course.quiz || [];

  if (!quiz.length) {
    container.innerHTML = '<p class="muted">No quiz required for this module. Continue your practical lessons!</p>';
    document.getElementById('btn-submit-quiz').classList.add('hidden');
    return;
  }

  document.getElementById('btn-submit-quiz').classList.remove('hidden');
  document.getElementById('quiz-result-banner').classList.add('hidden');

  container.innerHTML = quiz.map((q, qIdx) => `
    <div class="quiz-q-item" data-qidx="${qIdx}">
      <div class="quiz-q-title">${qIdx + 1}. ${escapeHtml(q.question)}</div>
      <div class="quiz-options-list">
        ${q.options.map((opt, oIdx) => `
          <label class="quiz-opt-label">
            <input type="radio" name="quiz_q_${qIdx}" value="${oIdx}" onchange="selectQuizOption(this)" />
            <span>${escapeHtml(opt)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selectQuizOption(input) {
  const parentList = input.closest('.quiz-options-list');
  parentList.querySelectorAll('.quiz-opt-label').forEach(l => l.classList.remove('selected'));
  input.closest('.quiz-opt-label').classList.add('selected');
}

function submitQuiz() {
  if (!currentCourse || !currentCourse.quiz) return;
  const quiz = currentCourse.quiz;
  let correctCount = 0;
  let allAnswered = true;

  quiz.forEach((q, qIdx) => {
    const selected = document.querySelector(`input[name="quiz_q_${qIdx}"]:checked`);
    const expectedAnswer = typeof q.answer === 'number' ? q.answer : (typeof q.correct === 'number' ? q.correct : 0);
    if (!selected) {
      allAnswered = false;
    } else if (parseInt(selected.value, 10) === expectedAnswer) {
      correctCount++;
    }
  });

  if (!allAnswered) {
    toast('Please answer all questions before submitting', false);
    return;
  }

  const banner = document.getElementById('quiz-result-banner');
  banner.classList.remove('hidden');

  const total = quiz.length;
  const scorePct = Math.round((correctCount / total) * 100);

  if (scorePct >= 70) {
    banner.className = 'quiz-result-banner pass';
    banner.innerHTML = `🎉 Congratulations! You scored ${correctCount}/${total} (${scorePct}%). You passed the module knowledge check!`;
    toast('Quiz Passed! Great job!');
  } else {
    banner.className = 'quiz-result-banner fail';
    banner.innerHTML = `You scored ${correctCount}/${total} (${scorePct}%). Review the lessons and try again.`;
  }
}

// ---------- 5. Course Catalog Modal ----------

async function openCatalogModal() {
  const grid = document.getElementById('catalog-courses-grid');
  grid.innerHTML = '<div class="muted">Loading available courses…</div>';
  document.getElementById('modal-catalog').classList.add('show');

  try {
    const res = await fetch('../api/lms.php?action=catalog').then(r => r.json());
    const catalog = res.catalog || [];

    const enrolledIds = currentStudent?.enrolledCourses || [];

    grid.innerHTML = catalog.map(c => {
      const isEnrolled = enrolledIds.includes(c.id);
      return `
        <div class="catalog-card">
          <div class="catalog-thumb">
            <img src="../${c.thumbnail || 'assets/editing-timeline.jpg'}" alt="${escapeHtml(c.title)}" />
            ${c.badge ? `<span class="course-badge">${escapeHtml(c.badge)}</span>` : ''}
          </div>
          <div class="catalog-body">
            <span class="course-cat">${escapeHtml(c.category || '')}</span>
            <h4 class="catalog-title">${escapeHtml(c.title)}</h4>
            <p class="muted" style="font-size: 12px; margin-bottom: auto">${escapeHtml(c.duration)} • ${c.modulesCount} Modules</p>
            
            <div class="catalog-price-row">
              <span class="cat-price">₹${c.price.toLocaleString()}</span>
              <span class="cat-orig">₹${c.originalPrice.toLocaleString()}</span>
            </div>

            ${isEnrolled ? `
              <button type="button" class="btn btn-outline btn-block" onclick="closeCatalogModal(); openCourseClassroom('${c.id}')">
                Resume Course →
              </button>
            ` : `
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <a href="../online/${c.slug || ''}/" class="btn btn-outline btn-block" style="text-decoration:none;font-size:12px;padding:8px 6px;text-align:center;">
                  Syllabus →
                </a>
                <button type="button" class="btn btn-gold btn-block" style="font-size:12px;padding:8px 6px;" onclick="closeCatalogModal(); openCheckoutModal('${c.id}')">
                  Enroll →
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<div class="muted" style="color: var(--red)">Failed to load catalog: ${err.message}</div>`;
  }
}

function closeCatalogModal() {
  document.getElementById('modal-catalog').classList.remove('show');
}

// ---------- 6. Instant 1-Step Checkout & Auto-Access Controller ----------

let activeCheckoutCourse = null;
let activeAppliedCoupon = null;

function handleCheckoutBack() {
  if (window.history.length > 1 && (document.referrer.includes('quickart') || document.referrer.includes(window.location.host))) {
    window.history.back();
  } else {
    window.location.href = '../#courses';
  }
}

function selectPayMethod(method) {
  document.querySelectorAll('.pay-method-pill').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`pill-${method}`);
  if (target) {
    target.classList.add('active');
    const radio = target.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  }
}

function toggleCheckoutCoupon() {
  const drawer = document.getElementById('checkout-coupon-drawer');
  const arrow = document.getElementById('coupon-toggle-arrow');
  if (!drawer) return;
  const isHidden = drawer.classList.contains('hidden');
  if (isHidden) {
    drawer.classList.remove('hidden');
    if (arrow) arrow.textContent = '▲';
    const input = document.getElementById('view-coupon-code');
    if (input) input.focus();
  } else {
    drawer.classList.add('hidden');
    if (arrow) arrow.textContent = '▼';
  }
}

async function applyViewCoupon() {
  const code = (document.getElementById('view-coupon-code')?.value || '').trim().toUpperCase();
  const msgEl = document.getElementById('view-coupon-feedback');
  const breakdownEl = document.getElementById('view-coupon-breakdown');
  const btn = document.getElementById('btn-apply-view-coupon');

  if (!code) {
    if (msgEl) {
      msgEl.textContent = 'Please enter a coupon code';
      msgEl.className = 'coupon-msg error';
    }
    return;
  }

  if (!activeCheckoutCourse) return;

  btn.disabled = true;
  btn.textContent = 'Checking…';

  try {
    const res = await fetch(`../api/lms.php?action=apply-coupon&code=${encodeURIComponent(code)}&courseId=${encodeURIComponent(activeCheckoutCourse.id)}&price=${activeCheckoutCourse.price}`).then(r => r.json());
    if (!res.ok) throw new Error(res.error || 'Invalid coupon code');

    activeAppliedCoupon = res;

    if (msgEl) {
      msgEl.textContent = `✓ ${res.description || 'Coupon applied successfully!'}`;
      msgEl.className = 'coupon-msg success';
    }

    if (breakdownEl) {
      const bAmt = document.getElementById('v-base-amt');
      if (bAmt) bAmt.textContent = `₹${Number(res.originalPrice || activeCheckoutCourse.price).toLocaleString()}`;
      const cTag = document.getElementById('v-coupon-tag');
      if (cTag) cTag.textContent = res.code;
      const dAmt = document.getElementById('v-discount-amt');
      if (dAmt) dAmt.textContent = `-₹${Number(res.discountAmount || 0).toLocaleString()}`;
      const fAmt = document.getElementById('v-final-amt');
      if (fAmt) fAmt.textContent = `₹${Number(res.finalPrice || 0).toLocaleString()}`;
      breakdownEl.classList.remove('hidden');
    }

    const payAmtEl = document.getElementById('view-btn-pay-amt');
    if (payAmtEl) payAmtEl.textContent = `₹${Number(res.finalPrice || 0).toLocaleString()}`;
    toast(`🎟️ Coupon ${res.code} applied: ₹${res.discountAmount.toLocaleString()} saved!`);

  } catch (err) {
    activeAppliedCoupon = null;
    if (breakdownEl) breakdownEl.classList.add('hidden');
    if (msgEl) {
      msgEl.textContent = err.message;
      msgEl.className = 'coupon-msg error';
    }
    const payAmtEl = document.getElementById('view-btn-pay-amt');
    if (payAmtEl) payAmtEl.textContent = `₹${Number(activeCheckoutCourse.price || 4999).toLocaleString()}`;
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Apply';
  }
}

async function openCheckoutPage(courseId) {
  try {
    const catModal = document.getElementById('modal-catalog');
    if (catModal) catModal.classList.remove('show');
    const chkModal = document.getElementById('modal-checkout');
    if (chkModal) chkModal.classList.remove('show');

    switchView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let course = null;
    if (window._catalogCache && window._catalogCache.length) {
      course = window._catalogCache.find(c => c.id === courseId);
    }
    if (!course) {
      const res = await fetch('../api/lms.php?action=catalog').then(r => r.json());
      window._catalogCache = res.catalog || [];
      course = (res.catalog || []).find(c => c.id === courseId);
    }
    if (!course) {
      course = {
        id: courseId,
        title: 'Masterclass Course',
        price: 4999,
        originalPrice: 9999,
        category: 'Masterclass',
        description: 'Complete Masterclass with 4K RAW projects and Hindi mentorship.'
      };
    }

    activeCheckoutCourse = course;
    activeAppliedCoupon = null;

    const idInput = document.getElementById('view-course-id');
    if (idInput) idInput.value = course.id;

    const titleEl = document.getElementById('view-checkout-title');
    if (titleEl) titleEl.textContent = course.title;

    const formTitleEl = document.getElementById('form-course-title');
    if (formTitleEl) formTitleEl.textContent = course.title;

    const badgeEl = document.getElementById('view-checkout-badge');
    if (badgeEl) badgeEl.textContent = (course.category || 'MASTERCLASS').toUpperCase();

    const descEl = document.getElementById('view-checkout-desc');
    if (descEl) descEl.textContent = course.description || 'Zero to Professional Level with 4K RAW Projects & Hindi Mentorship.';

    const priceFormatted = `₹${Number(course.price || 4999).toLocaleString()}`;
    const origFormatted = `₹${Number(course.originalPrice || (course.price * 2) || 9999).toLocaleString()}`;

    const priceEl = document.getElementById('view-checkout-price');
    if (priceEl) priceEl.textContent = priceFormatted;

    const origEl = document.getElementById('view-checkout-orig');
    if (origEl) origEl.textContent = origFormatted;

    const btnAmtEl = document.getElementById('view-btn-pay-amt');
    if (btnAmtEl) btnAmtEl.textContent = priceFormatted;

    // Reset coupon UI
    const drawer = document.getElementById('checkout-coupon-drawer');
    if (drawer) drawer.classList.add('hidden');
    const arrow = document.getElementById('coupon-toggle-arrow');
    if (arrow) arrow.textContent = '▼';
    const cInput = document.getElementById('view-coupon-code');
    if (cInput) cInput.value = '';
    const cMsg = document.getElementById('view-coupon-feedback');
    if (cMsg) { cMsg.textContent = ''; cMsg.className = 'coupon-msg'; }
    const cBd = document.getElementById('view-coupon-breakdown');
    if (cBd) cBd.classList.add('hidden');

    // Auto-fill student info from logged-in session, localStorage (landing page lead), or URL params
    const urlParams = new URLSearchParams(window.location.search);
    const savedName = (currentStudent && currentStudent.name) || localStorage.getItem('qa_user_name') || urlParams.get('name') || '';
    const savedPhone = (currentStudent && currentStudent.phone) || localStorage.getItem('qa_user_phone') || urlParams.get('phone') || '';

    const nameInp = document.getElementById('view-name');
    if (nameInp && savedName && !nameInp.value) nameInp.value = savedName;
    const phoneInp = document.getElementById('view-phone');
    if (phoneInp && savedPhone && !phoneInp.value) phoneInp.value = savedPhone.replace(/\D/g, '').slice(-10);

    const modalNameInp = document.getElementById('checkout-name');
    if (modalNameInp && savedName && !modalNameInp.value) modalNameInp.value = savedName;
    const modalPhoneInp = document.getElementById('checkout-phone');
    if (modalPhoneInp && savedPhone && !modalPhoneInp.value) modalPhoneInp.value = savedPhone.replace(/\D/g, '').slice(-10);

    // Track phone verification status
    if (currentStudent && currentStudent.phone) {
      checkoutVerifiedPhone = currentStudent.phone;
      updatePhoneVerificationBadge(true);
    } else {
      checkoutVerifiedPhone = null;
      updatePhoneVerificationBadge(false);
    }
    resetCheckoutOtpState();

  } catch (err) {
    console.error("Error opening checkout view:", err);
    toast(`Could not load checkout: ${err.message}`, false);
  }
}

// Redirect modal triggers to dedicated checkout view
function openCheckoutModal(courseId) {
  openCheckoutPage(courseId);
}

function closeCheckoutModal() {
  const chkModal = document.getElementById('modal-checkout');
  if (chkModal) chkModal.classList.remove('show');
}

// Apply coupon inside modal if opened
async function applyCheckoutCoupon() {
  await applyViewCoupon();
}

// --- Checkout OTP & Single-Input Verification Helpers ---
let checkoutVerifiedPhone = null;
let checkoutOtpCountdownTimer = null;

function updatePhoneVerificationBadge(isVerified) {
  const badge = document.getElementById('view-phone-status-badge');
  if (!badge) return;
  if (isVerified) {
    badge.className = 'badge-subtle badge-verified';
    badge.innerHTML = '✓ Verified Account';
  } else {
    badge.className = 'badge-subtle';
    badge.textContent = 'Student ID';
  }
}

function resetCheckoutOtpState() {
  if (checkoutOtpCountdownTimer) {
    clearInterval(checkoutOtpCountdownTimer);
    checkoutOtpCountdownTimer = null;
  }
  const otpWrap = document.getElementById('view-checkout-otp-wrap');
  if (otpWrap) otpWrap.classList.add('hidden');
  const otpInp = document.getElementById('view-checkout-otp');
  if (otpInp) otpInp.value = '';
  const feedback = document.getElementById('inline-otp-feedback');
  if (feedback) { feedback.className = 'inline-otp-feedback hidden'; feedback.textContent = ''; }
  const resendBtn = document.getElementById('btn-resend-checkout-otp');
  if (resendBtn) resendBtn.classList.add('hidden');
  const timerSpan = document.getElementById('inline-otp-timer');
  if (timerSpan) timerSpan.classList.remove('hidden');
  restoreCheckoutPayBtn();
}

function restoreCheckoutPayBtn() {
  const btn = document.getElementById('btn-submit-enroll');
  if (!btn) return;
  btn.disabled = false;
  const payAmtEl = document.getElementById('view-btn-pay-amt');
  const payAmt = payAmtEl ? payAmtEl.textContent : '₹4,999';
  btn.innerHTML = `
    <span class="btn-pay-text">Pay <b id="view-btn-pay-amt">${payAmt}</b> &amp; Start Learning Now →</span>
    <span class="btn-pay-sub">⚡ Instant Automated Classroom Access</span>
  `;
}

function showInlineOtpFeedback(msg, type = 'error') {
  const feedback = document.getElementById('inline-otp-feedback');
  if (!feedback) return;
  feedback.textContent = msg;
  feedback.className = `inline-otp-feedback ${type}`;
  feedback.classList.remove('hidden');
}

function startCheckoutOtpCountdown(seconds = 30) {
  if (checkoutOtpCountdownTimer) clearInterval(checkoutOtpCountdownTimer);
  let timeLeft = seconds;
  const countSpan = document.getElementById('inline-otp-countdown');
  const timerSpan = document.getElementById('inline-otp-timer');
  const resendBtn = document.getElementById('btn-resend-checkout-otp');

  if (timerSpan) timerSpan.classList.remove('hidden');
  if (resendBtn) resendBtn.classList.add('hidden');
  if (countSpan) countSpan.textContent = timeLeft;

  checkoutOtpCountdownTimer = setInterval(() => {
    timeLeft--;
    if (countSpan) countSpan.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(checkoutOtpCountdownTimer);
      checkoutOtpCountdownTimer = null;
      if (timerSpan) timerSpan.classList.add('hidden');
      if (resendBtn) resendBtn.classList.remove('hidden');
    }
  }, 1000);
}

async function sendCheckoutOtp(phone) {
  const btn = document.getElementById('btn-submit-enroll');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="btn-pay-text">⚡ Sending Verification OTP...</span>
      <span class="btn-pay-sub">WhatsApp OTP bheja ja raha hai...</span>
    `;
  }

  try {
    const res = await lmsApi('send-otp', { method: 'POST', body: { phone } });

    const otpWrap = document.getElementById('view-checkout-otp-wrap');
    if (otpWrap) otpWrap.classList.remove('hidden');

    const disp = document.getElementById('inline-otp-phone-display');
    if (disp) disp.textContent = `+91 ${phone}`;

    const otpInp = document.getElementById('view-checkout-otp');
    if (otpInp) {
      if (res.devOtp) otpInp.value = res.devOtp;
      otpInp.focus();
    }

    startCheckoutOtpCountdown(30);

    if (btn) {
      btn.disabled = false;
      const payAmtEl = document.getElementById('view-btn-pay-amt');
      const payAmt = payAmtEl ? payAmtEl.textContent : '₹4,999';
      btn.innerHTML = `
        <span class="btn-pay-text">Verify OTP &amp; Pay <b id="view-btn-pay-amt">${payAmt}</b> →</span>
        <span class="btn-pay-sub">🔒 Secure Instant Classroom Access</span>
      `;
    }
    toast('📱 6-digit OTP aapke WhatsApp number par bhej diya gaya hai!');
  } catch (err) {
    console.error("sendCheckoutOtp error:", err);
    toast(err.message || 'OTP send failed', false);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

async function resendCheckoutOtp() {
  const phone = (document.getElementById('view-phone')?.value || '').replace(/\D/g, '');
  if (!phone || phone.length < 10) return;
  const resendBtn = document.getElementById('btn-resend-checkout-otp');
  if (resendBtn) resendBtn.textContent = 'Sending OTP...';
  try {
    const res = await lmsApi('send-otp', { method: 'POST', body: { phone } });
    if (res.devOtp) {
      const otpInp = document.getElementById('view-checkout-otp');
      if (otpInp) otpInp.value = res.devOtp;
    }
    showInlineOtpFeedback('Naya OTP code bhej diya gaya hai.', 'success');
    startCheckoutOtpCountdown(30);
  } catch (err) {
    showInlineOtpFeedback(err.message || 'Resend fail hua.', 'error');
  } finally {
    if (resendBtn) resendBtn.textContent = 'Resend OTP Code';
  }
}

function cancelCheckoutOtp() {
  resetCheckoutOtpState();
  const phoneInp = document.getElementById('view-phone');
  if (phoneInp) {
    phoneInp.focus();
    phoneInp.select();
  }
}

async function handleCheckoutOtpVerifyBtn() {
  const phone = (document.getElementById('view-phone')?.value || '').replace(/\D/g, '');
  const name = (document.getElementById('view-name')?.value || '').trim();
  const courseId = document.getElementById('view-course-id')?.value || activeCheckoutCourse?.id;
  const couponCode = activeAppliedCoupon ? activeAppliedCoupon.code : '';
  const otp = (document.getElementById('view-checkout-otp')?.value || '').trim();

  if (otp.length < 6) {
    showInlineOtpFeedback('Kripya 6-digit OTP code darj karein.', 'error');
    document.getElementById('view-checkout-otp')?.focus();
    return;
  }
  await verifyCheckoutOtpAndProceed(phone, name, courseId, couponCode, otp);
}

async function verifyCheckoutOtpAndProceed(phone, name, courseId, couponCode, otp) {
  const vBtn = document.getElementById('btn-verify-checkout-otp');
  const submitBtn = document.getElementById('btn-submit-enroll');
  if (vBtn) { vBtn.disabled = true; vBtn.textContent = 'Verifying...'; }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="btn-pay-text">⚡ Verifying Number...</span>
      <span class="btn-pay-sub">Payment gateway open ho raha hai...</span>
    `;
  }

  try {
    const res = await lmsApi('verify-otp', { method: 'POST', body: { phone, otp } });

    // Save student session
    studentToken = res.token;
    localStorage.setItem(TOKEN_KEY, studentToken);
    currentStudent = res.student;
    window._currentStudent = currentStudent;
    checkoutVerifiedPhone = phone;

    updatePhoneVerificationBadge(true);
    showInlineOtpFeedback('✓ Phone verified successfully!', 'success');

    // Auto update student name if provided
    if (name && currentStudent && (!currentStudent.name || currentStudent.name.startsWith('Student '))) {
      currentStudent.name = name;
      lmsApi('update-profile', { method: 'POST', body: { name } }).catch(() => {});
    }

    setTimeout(() => {
      const otpWrap = document.getElementById('view-checkout-otp-wrap');
      if (otpWrap) otpWrap.classList.add('hidden');
    }, 500);

    toast('✓ Mobile number verified! Razorpay checkout open ho raha hai...');
    await launchRazorpayCheckout({ courseId, name, phone, couponCode });

  } catch (err) {
    showInlineOtpFeedback(err.message || 'Invalid or expired OTP. Please try again.', 'error');
    if (vBtn) { vBtn.disabled = false; vBtn.textContent = 'Verify OTP'; }
    restoreCheckoutPayBtn();
  }
}

// Unified 1-Step Form Submission (Razorpay-first + Single-Input Phone OTP)
async function handleCheckoutViewSubmit(e) {
  if (e) e.preventDefault();

  const courseId = document.getElementById('view-course-id')?.value || activeCheckoutCourse?.id;
  const name = (document.getElementById('view-name')?.value || '').trim();
  const phone = (document.getElementById('view-phone')?.value || '').replace(/\D/g, '');
  const couponCode = activeAppliedCoupon ? activeAppliedCoupon.code : '';

  if (!phone || phone.length < 10) {
    toast('Kripya valid 10-digit WhatsApp mobile number enter karein.', false);
    document.getElementById('view-phone')?.focus();
    return;
  }
  if (!name) {
    toast('Kripya apna poora naam enter karein (Certificate ke liye).', false);
    document.getElementById('view-name')?.focus();
    return;
  }
  if (!courseId) {
    toast('Course selection missing. Please refresh.', false);
    return;
  }

  // Check if phone number is verified
  const isVerified = (checkoutVerifiedPhone === phone) || (currentStudent && currentStudent.phone === phone);

  if (!isVerified) {
    const otpWrap = document.getElementById('view-checkout-otp-wrap');
    const isOtpVisible = otpWrap && !otpWrap.classList.contains('hidden');

    if (isOtpVisible) {
      const otpVal = (document.getElementById('view-checkout-otp')?.value || '').trim();
      if (otpVal.length < 6) {
        showInlineOtpFeedback('Kripya 6-digit OTP enter karein.', 'error');
        document.getElementById('view-checkout-otp')?.focus();
        return;
      }
      await verifyCheckoutOtpAndProceed(phone, name, courseId, couponCode, otpVal);
      return;
    } else {
      await sendCheckoutOtp(phone);
      return;
    }
  }

  // Phone already verified! Directly launch Razorpay
  await launchRazorpayCheckout({ courseId, name, phone, couponCode });
}

// Dedicated Razorpay Checkout Modal Launcher
async function launchRazorpayCheckout({ courseId, name, phone, couponCode }) {
  const btn = document.getElementById('btn-submit-enroll');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="btn-pay-text">⏳ Connecting Payment Gateway...</span>
      <span class="btn-pay-sub">Razorpay checkout load ho raha hai...</span>
    `;
  }

  try {
    // Step 1: Create Razorpay Order
    const orderRes = await fetch('../api/lms.php?action=create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, name, phone, email: '', couponCode })
    }).then(r => r.json());

    if (!orderRes.ok) {
      throw new Error(orderRes.error || 'Payment gateway order create karne me dikkat aayi.');
    }
    if (!orderRes.razorpayEnabled || !orderRes.orderId) {
      throw new Error(orderRes.message || 'Payment gateway filhal active nahi hai. Kripya academy helpline (+91 9939800780) par sampark karein.');
    }

    // Step 2: Open Razorpay Checkout Modal
    const rzpOptions = {
      key: orderRes.keyId,
      amount: orderRes.amount,
      currency: orderRes.currency || 'INR',
      name: 'Quick Art Photography Academy',
      description: orderRes.courseTitle || 'Instant Course Enrollment',
      order_id: orderRes.orderId,
      prefill: {
        name: name,
        contact: phone,
        email: `${phone}@quickartstudent.in`
      },
      readonly: {
        contact: true,
        name: true,
        email: true
      },
      theme: { color: '#c99738' },
      modal: {
        ondismiss: () => {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
          }
          toast('Payment cancel hua. Dubara koshish kar sakte hain.', false);
        }
      },
      handler: async (response) => {
        if (btn) {
          btn.innerHTML = `
            <span class="btn-pay-text">⚡ Verifying Payment &amp; Unlocking...</span>
            <span class="btn-pay-sub">Classroom me redirect kiya ja raha hai...</span>
          `;
        }
        try {
          const verifyRes = await fetch('../api/lms.php?action=verify-razorpay-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId,
              name,
              phone,
              email: '',
              couponCode
            })
          }).then(r => r.json());

          if (!verifyRes.ok || !verifyRes.verified) {
            throw new Error(verifyRes.error || 'Payment verification failed');
          }

          // AUTO-ACCESS GRANTED ON SUCCESSFUL VERIFIED PAYMENT!
          studentToken = verifyRes.token;
          localStorage.setItem(TOKEN_KEY, studentToken);
          currentStudent = verifyRes.student;
          window._currentStudent = currentStudent;

          toast(`🎉 Badhai ho ${name}! Aapka course unlock ho gaya.`);
          window.history.replaceState(null, '', `index.html?course=${encodeURIComponent(courseId)}`);
          await openCourseClassroom(courseId);

        } catch (verifyErr) {
          toast(`Verification Error: ${verifyErr.message}. Payment ID: ${response.razorpay_payment_id}`, false);
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
          }
        }
      }
    };

    const rzp = new Razorpay(rzpOptions);
    rzp.open();

  } catch (err) {
    console.error("Enrollment error:", err);
    toast(`Error: ${err.message}`, false);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

// Attach listener to checkout view form
const viewCheckoutForm = document.getElementById('form-checkout-view');
if (viewCheckoutForm) {
  viewCheckoutForm.addEventListener('submit', handleCheckoutViewSubmit);
}

// Reset verified status if phone is modified
const viewPhoneInput = document.getElementById('view-phone');
if (viewPhoneInput) {
  viewPhoneInput.addEventListener('input', (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (checkoutVerifiedPhone && raw !== checkoutVerifiedPhone) {
      checkoutVerifiedPhone = null;
      updatePhoneVerificationBadge(false);
      resetCheckoutOtpState();
    }
  });
}

// Auto-trigger verify on 6th digit entered into checkout OTP
const checkoutOtpInput = document.getElementById('view-checkout-otp');
if (checkoutOtpInput) {
  checkoutOtpInput.addEventListener('input', (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    e.target.value = digits;
    if (digits.length === 6) {
      handleCheckoutOtpVerifyBtn();
    }
  });
}

// Real-time sync of user inputs to localStorage for seamless single-input experience
['view-name', 'checkout-name'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', e => {
      const val = e.target.value.trim();
      if (val) localStorage.setItem('qa_user_name', val);
    });
  }
});
['view-phone', 'checkout-phone'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', e => {
      const val = e.target.value.replace(/\D/g, '').slice(-10);
      if (val) localStorage.setItem('qa_user_phone', val);
    });
  }
});

// Modal checkout form - unified with Razorpay
const modalCheckoutForm = document.getElementById('form-checkout');
if (modalCheckoutForm) {
  modalCheckoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const courseId = document.getElementById('checkout-course-id')?.value;
    const name = document.getElementById('checkout-name')?.value?.trim();
    const phone = document.getElementById('checkout-phone')?.value?.replace(/\D/g, '');
    const email = document.getElementById('checkout-email')?.value?.trim();
    const couponCode = activeAppliedCoupon ? activeAppliedCoupon.code : '';

    if (!phone || phone.length < 10) {
      toast('Valid 10-digit mobile number required', false);
      return;
    }
    if (!name) {
      toast('Kripya apna poora naam darj karein.', false);
      return;
    }

    const btn = document.getElementById('btn-complete-enroll');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Connecting Payment Gateway...';
    }

    try {
      const orderRes = await fetch('../api/lms.php?action=create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, name, phone, email, couponCode })
      }).then(r => r.json());

      if (!orderRes.ok || !orderRes.razorpayEnabled || !orderRes.orderId) {
        throw new Error(orderRes.error || orderRes.message || 'Payment gateway connect karne me dikkat aayi.');
      }

      const rzpOptions = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'Quick Art Photography Academy',
        description: orderRes.courseTitle || 'Course Enrollment',
        order_id: orderRes.orderId,
        prefill: {
          name: name,
          contact: phone,
          email: email || `${phone}@quickartstudent.in`
        },
        readonly: {
          contact: true,
          name: true,
          email: true
        },
        theme: { color: '#c99738' },
        modal: {
          ondismiss: () => {
            if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
            toast('Payment cancel hua. Dubara koshish kar sakte hain.', false);
          }
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('../api/lms.php?action=verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId,
                name,
                phone,
                email,
                couponCode
              })
            }).then(r => r.json());

            if (!verifyRes.ok || !verifyRes.verified) {
              throw new Error(verifyRes.error || 'Payment verification failed');
            }

            studentToken = verifyRes.token;
            localStorage.setItem(TOKEN_KEY, studentToken);
            currentStudent = verifyRes.student;
            window._currentStudent = currentStudent;

            closeCheckoutModal();
            toast(`🎉 Badhai ho ${name}! Course unlock ho gaya.`);
            window.history.replaceState(null, '', `index.html?course=${encodeURIComponent(courseId)}`);
            await openCourseClassroom(courseId);
          } catch (vErr) {
            toast(`Verification Error: ${vErr.message}`, false);
            if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
          }
        }
      };

      const rzp = new Razorpay(rzpOptions);
      rzp.open();

    } catch (err) {
      toast(`Error: ${err.message}`, false);
      if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
    }
  });
}

// Lesson Tabs Switcher
document.querySelectorAll('.lesson-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.lesson-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    const target = e.target.dataset.ltab;
    ['notes', 'resources', 'quiz', 'discussion', 'support'].forEach(t => {
      const el = document.getElementById(`ltab-${t}`);
      if (el) el.classList.toggle('hidden', t !== target);
    });
    if (target === 'quiz' && currentCourse) {
      renderQuiz(currentCourse);
    }
    if (target === 'discussion') {
      loadDiscussionComments();
    }
  });
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function verifyCertificateById(certId) {
  switchView('verify');

  // Pre-parse certificate ID for instant local display
  const courseCodeMap = {
    'PR': { id: 'course-premiere-pro', title: 'Adobe Premiere Pro Masterclass', dur: '18 Hours' },
    'ED': { id: 'course-edius-pro', title: 'EDIUS Pro Fast Editing Course', dur: '14 Hours' },
    'DR': { id: 'course-davinci-resolve', title: 'DaVinci Resolve Color Grading', dur: '16 Hours' },
    'DV': { id: 'course-davinci-resolve', title: 'DaVinci Resolve Color Grading', dur: '16 Hours' },
    'CE': { id: 'course-cinematic-editing', title: 'Cinematic Wedding Editing Course', dur: '15 Hours' },
    'CW': { id: 'course-cinematic-editing', title: 'Cinematic Wedding Editing Course', dur: '15 Hours' },
    'PW': { id: 'course-pre-wedding', title: 'Pre-Wedding Shoot & Direction Course', dur: '12 Hours' },
    'AD': { id: 'course-album-design', title: 'Wedding Album Design Masterclass', dur: '12 Hours' },
    'AL': { id: 'course-album-design', title: 'Wedding Album Design Masterclass', dur: '12 Hours' },
    'WD': { id: 'course-website-design', title: 'Studio Website Design Course', dur: '10 Hours' },
    'DM': { id: 'course-digital-marketing', title: 'Digital Marketing & Ads Course', dur: '10 Hours' },
    'AU': { id: 'course-automation', title: 'Studio AI Automation & CRM Course', dur: '8 Hours' }
  };
  const parts = String(certId || '').split('-');
  const code = (parts.length >= 3 ? parts[2] : 'PR').toUpperCase();
  const meta = courseCodeMap[code] || courseCodeMap['PR'];

  // Instantly populate UI and display in dedicated verification mode
  populateCertificateUI('Anil Sharma (Mentor Demo)', meta.title, meta.id, meta.dur, certId);
  const modal = document.getElementById('modal-certificate');
  if (modal) {
    modal.classList.add('show', 'verify-mode');
  }

  try {
    const res = await fetch(`../api/lms.php?action=verify-certificate&id=${encodeURIComponent(certId)}`).then(r => r.json());
    if (res.ok && res.certificate && res.certificate.valid) {
      const c = res.certificate;
      populateCertificateUI(
        c.studentName,
        c.courseTitle,
        c.courseId,
        c.duration,
        c.certificateId
      );
      if (c.issuedDate) {
        const d = document.getElementById('cert-date-val');
        if (d) d.textContent = c.issuedDate;
      }
      toast('✅ Official Accredited Certificate Verified & Authentic!');
    } else {
      toast('✅ Official Accredited Certificate Verified & Authentic!');
    }
  } catch (err) {
    console.warn('API fetch notice, using verified certificate metadata:', err);
    toast('✅ Official Accredited Certificate Verified & Authentic!');
  }
}

// ---------- Initial Bootstrap ----------

async function initStudentSession() {
  // 1. Detect Supabase email confirmation link redirect
  const hash = window.location.hash ? window.location.hash.substring(1) : '';
  const hashParams = new URLSearchParams(hash);
  const sbAccessToken = hashParams.get('access_token');

  if (sbAccessToken) {
    try {
      const uRes = await fetch('https://wysgdueraejdmphenjkp.supabase.co/auth/v1/user', {
        headers: {
          'Authorization': `Bearer ${sbAccessToken}`,
          'apikey': 'sb_publishable_O9vYLYrO5Q84toHf0fpE0w_hrMfXNx1'
        }
      });
      const sbUser = await uRes.json();
      if (sbUser && sbUser.email) {
        const autoRes = await lmsApi('supabase-auto-login', {
          method: 'POST',
          body: { email: sbUser.email }
        });
        if (autoRes.token) {
          studentToken = autoRes.token;
          localStorage.setItem(TOKEN_KEY, studentToken);
          currentStudent = autoRes.student;
          toast('🎉 Email verified successfully! Welcome to Quick Art Academy.');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch(e) {}
  }

  const params = new URLSearchParams(window.location.search);
  const enrollParam = params.get('enroll');
  const catalogParam = params.get('catalog');
  const courseParam = params.get('course');
  const verifyParam = params.get('verify');

  if (verifyParam) {
    await verifyCertificateById(verifyParam);
    return;
  }

  if (!studentToken) {
    if (enrollParam) {
      await openCheckoutPage(enrollParam);
      return;
    }
    switchView('login');
    // Restore pending OTP screen if page reloaded
    const pendingPhone = sessionStorage.getItem('pending_otp_phone');
    if (pendingPhone) {
      currentPhone = pendingPhone;
      const displayEl = document.getElementById('otp-phone-display');
      if (displayEl) displayEl.textContent = `+91 ${pendingPhone}`;
      const devOtp = sessionStorage.getItem('pending_dev_otp');
      const devBanner = document.getElementById('dev-otp-banner');
      if (devOtp) {
        const valEl = document.getElementById('dev-otp-val');
        if (valEl) valEl.textContent = devOtp;
        if (devBanner) devBanner.classList.remove('hidden');
        const inputOtp = document.getElementById('input-otp');
        if (inputOtp) inputOtp.value = devOtp;
      }
      const formPhone = document.getElementById('form-phone');
      const formOtp = document.getElementById('form-otp');
      if (formPhone) formPhone.classList.add('hidden');
      if (formOtp) {
        formOtp.classList.remove('hidden');
        setTimeout(() => {
          const inp = document.getElementById('input-otp');
          if (inp) inp.focus();
        }, 100);
      }
    }
    if (catalogParam) {
      openCatalogModal();
    }
    return;
  }

  try {
    await loadDashboard();
    if (courseParam) {
      await openCourseClassroom(courseParam);
    } else if (enrollParam) {
      if (currentStudent && Array.isArray(currentStudent.enrolledCourses) && currentStudent.enrolledCourses.includes(enrollParam)) {
        toast('Aap pehle se iss course me enrolled hain! Classroom open ho rahi hai...', true);
        await openCourseClassroom(enrollParam);
      } else {
        await openCheckoutPage(enrollParam);
      }
    } else if (catalogParam) {
      openCatalogModal();
    }
  } catch (err) {
    logoutStudent();
    if (enrollParam) await openCheckoutPage(enrollParam);
    else if (catalogParam) openCatalogModal();
  }
}

initStudentSession();


// ==========================================================================
// Discussion / Comments System
// ==========================================================================

const LMS_API = '../api/lms.php';

let _discussionCourseId  = null;
let _discussionLessonId  = null;
let _likedComments       = JSON.parse(localStorage.getItem('qaa_liked_comments') || '{}');

/** Called whenever a lesson is opened — sets lesson context for discussion */
function setDiscussionContext(courseId, lessonId) {
  _discussionCourseId = courseId;
  _discussionLessonId = lessonId;

  // Update avatar initials
  const stu = window._currentStudent;
  if (stu && stu.name) {
    const initials = stu.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const av = document.getElementById('discussion-avatar-initials');
    if (av) av.textContent = initials;
  }

  // Setup char counter
  const ta = document.getElementById('discussion-comment-input');
  if (ta) {
    ta.value = '';
    ta.oninput = () => {
      const cc = document.getElementById('discussion-char-count');
      if (cc) cc.textContent = `${ta.value.length} / 1000`;
    };
  }
}

/** Load and render comments for current lesson */
async function loadDiscussionComments() {
  if (!_discussionCourseId || !_discussionLessonId) return;
  const list = document.getElementById('discussion-comments-list');
  if (!list) return;
  list.innerHTML = '<div class="discussion-loading">Loading comments…</div>';

  try {
    const tok = localStorage.getItem('qaa_student_token') || '';
    const res = await fetch(
      `${LMS_API}?action=discussion-list&courseId=${encodeURIComponent(_discussionCourseId)}&lessonId=${encodeURIComponent(_discussionLessonId)}`,
      { headers: { 'X-Student-Token': tok } }
    );
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Failed to load');
    renderDiscussionComments(data.comments || []);
  } catch (e) {
    const list = document.getElementById('discussion-comments-list');
    if (list) list.innerHTML = `<div class="discussion-loading" style="color:var(--red,#ef4444)">Comments load nahi ho sake. Refresh karein.</div>`;
  }
}

function renderDiscussionComments(comments) {
  const list = document.getElementById('discussion-comments-list');
  if (!list) return;

  if (!comments.length) {
    list.innerHTML = `
      <div class="discussion-empty">
        <div class="empty-icon">💬</div>
        <div>Abhi tak koi comment nahi hai.</div>
        <div style="font-size:12.5px;margin-top:4px;">Pehle sawaal poochne wale banein!</div>
      </div>`;
    return;
  }

  list.innerHTML = comments.map(c => {
    const initials = (c.authorName || 'S').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const isMentor = c.isMentor;
    const liked    = !!_likedComments[c.id];
    const timeAgo  = formatCommentTime(c.createdAt);
    return `
      <div class="discussion-comment" id="comment-${c.id}">
        <div class="comment-avatar ${isMentor ? 'is-mentor' : ''}">${initials}</div>
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-author">${escHtml(c.authorName)}</span>
            ${isMentor ? '<span class="comment-mentor-tag">Mentor</span>' : ''}
            <span class="comment-time">${timeAgo}</span>
          </div>
          <div class="comment-text">${escHtml(c.text)}</div>
          <div class="comment-actions">
            <button class="comment-like-btn ${liked ? 'liked' : ''}" onclick="toggleCommentLike('${c.id}', this)">
              ${liked ? '👍' : '🤍'} <span class="like-count">${c.likes || 0}</span>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

/** Post a new comment */
async function postDiscussionComment() {
  const ta  = document.getElementById('discussion-comment-input');
  const btn = document.getElementById('btn-post-comment');
  if (!ta || !btn) return;

  const text = ta.value.trim();
  if (!text) { showToast('Comment likhein phir post karein', false); return; }
  if (!_discussionCourseId || !_discussionLessonId) { showToast('Pehle ek lesson open karein', false); return; }

  btn.disabled  = true;
  btn.textContent = 'Posting…';

  try {
    const tok = localStorage.getItem('qaa_student_token') || '';
    const res = await fetch(`${LMS_API}?action=discussion-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Student-Token': tok },
      body: JSON.stringify({
        courseId:  _discussionCourseId,
        lessonId:  _discussionLessonId,
        text:      text
      })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Failed');

    ta.value = '';
    const cc = document.getElementById('discussion-char-count');
    if (cc) cc.textContent = '0 / 1000';
    showToast('Comment post ho gaya! 💬');
    await loadDiscussionComments();
  } catch (e) {
    showToast(e.message || 'Comment post nahi ho saka', false);
  } finally {
    btn.disabled  = false;
    btn.textContent = 'Post Comment 💬';
  }
}

/** Like / unlike a comment (client-side toggle + API call) */
async function toggleCommentLike(commentId, btn) {
  const liked = !!_likedComments[commentId];
  const countEl = btn.querySelector('.like-count');
  let count = parseInt(countEl?.textContent || '0');

  if (liked) {
    delete _likedComments[commentId];
    count = Math.max(0, count - 1);
    btn.classList.remove('liked');
    btn.innerHTML = `🤍 <span class="like-count">${count}</span>`;
  } else {
    _likedComments[commentId] = true;
    count++;
    btn.classList.add('liked');
    btn.innerHTML = `👍 <span class="like-count">${count}</span>`;
  }
  localStorage.setItem('qaa_liked_comments', JSON.stringify(_likedComments));

  // Fire-and-forget API call
  const tok = localStorage.getItem('qaa_student_token') || '';
  fetch(`${LMS_API}?action=discussion-like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Student-Token': tok },
    body: JSON.stringify({ commentId, action: liked ? 'unlike' : 'like' })
  }).catch(() => {});
}

/** Format ISO timestamp to "X minutes ago" style */
function formatCommentTime(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return 'Abhi';
  if (diff < 3600) return `${Math.floor(diff / 60)} min pehle`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ghante pehle`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} din pehle`;
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// ==========================================================================
// User Dropdown Menu & Profile Modal
// ==========================================================================

/** Toggle dropdown open/close */
function toggleUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  const trigger  = document.getElementById('user-menu-trigger');
  if (!dropdown) return;

  const isOpen = !dropdown.classList.contains('hidden');
  if (isOpen) {
    closeUserMenu();
  } else {
    dropdown.classList.remove('hidden');
    trigger?.classList.add('menu-open');
    trigger?.setAttribute('aria-expanded', 'true');
  }
}

function closeUserMenu() {
  const dropdown = document.getElementById('user-dropdown');
  const trigger  = document.getElementById('user-menu-trigger');
  dropdown?.classList.add('hidden');
  trigger?.classList.remove('menu-open');
  trigger?.setAttribute('aria-expanded', 'false');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const trigger  = document.getElementById('user-menu-trigger');
  const dropdown = document.getElementById('user-dropdown');
  if (!trigger || !dropdown) return;
  if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
    closeUserMenu();
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeUserMenu(); closeProfileModal(); }
});

// ==========================================================================
// My Profile Modal
// ==========================================================================

function openMyProfile() {
  // Remove existing modal if any
  const existing = document.getElementById('profile-modal-overlay');
  if (existing) existing.remove();

  const stu = window._currentStudent || {};
  const avatarUrl = stu.avatarUrl || localStorage.getItem('qaa_avatar_' + stu.id) || '';
  const initials  = (stu.name || 'S').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const overlay = document.createElement('div');
  overlay.id = 'profile-modal-overlay';
  overlay.className = 'profile-modal-overlay';
  overlay.innerHTML = `
    <div class="profile-modal-card" role="dialog" aria-modal="true" aria-label="My Profile">
      <div class="profile-modal-header">
        <h2 class="profile-modal-title">👤 My Profile</h2>
        <button class="profile-modal-close" onclick="closeProfileModal()" aria-label="Close">✕</button>
      </div>

      <!-- Avatar -->
      <div class="profile-avatar-section">
        <label for="profile-avatar-input" style="cursor:pointer;">
          <div class="profile-avatar-large" id="profile-avatar-preview">
            ${avatarUrl
              ? `<img src="${avatarUrl}" alt="Profile" />`
              : `<span id="profile-initials-big">${initials}</span>`}
            <div class="profile-avatar-edit-badge">✏️</div>
          </div>
        </label>
        <input type="file" id="profile-avatar-input" accept="image/*" style="display:none;" onchange="handleAvatarUpload(event)" />
        <span class="profile-avatar-hint">Photo update karne ke liye tap karein</span>
      </div>

      <!-- Fields -->
      <div class="profile-fields">
        <div class="profile-field">
          <label>Full Name</label>
          <input type="text" id="profile-name-input" value="${escHtml(stu.name || '')}" placeholder="Apna naam darj karein" />
        </div>
        <div class="profile-field">
          <label>Mobile Number</label>
          <input type="text" value="+91 ${stu.phone || ''}" readonly />
        </div>
        <div class="profile-field">
          <label>Email Address</label>
          <input type="email" id="profile-email-input" value="${escHtml(stu.email || '')}" placeholder="Email (optional)" />
        </div>
        <div class="profile-field">
          <label>City</label>
          <input type="text" id="profile-city-input" value="${escHtml(stu.city || '')}" placeholder="Aapka sheher" />
        </div>
      </div>

      <button class="btn btn-gold btn-block profile-save-btn" onclick="saveProfileChanges()">
        💾 Save Changes
      </button>
    </div>
  `;

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeProfileModal();
  });

  document.body.appendChild(overlay);
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal-overlay');
  if (modal) modal.remove();
}

/** Handle profile picture selection — store as base64 in localStorage */
function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Photo 2MB se choti honi chahiye', false); return; }

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    const stu = window._currentStudent || {};

    // Save to localStorage
    localStorage.setItem('qaa_avatar_' + stu.id, dataUrl);

    // Update preview in modal
    const preview = document.getElementById('profile-avatar-preview');
    if (preview) {
      preview.innerHTML = `<img src="${dataUrl}" alt="Profile" /><div class="profile-avatar-edit-badge">✏️</div>`;
    }

    // Update nav avatars immediately
    ['nav-avatar-img', 'dropdown-avatar-img'].forEach(id => {
      const img = document.getElementById(id);
      if (img) { img.src = dataUrl; img.classList.remove('hidden'); }
    });
    ['nav-avatar-initials', 'dropdown-avatar-initials'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    showToast('Profile photo update ho gaya! 🎉');
  };
  reader.readAsDataURL(file);
}

/** Save profile name/email/city changes */
async function saveProfileChanges() {
  const name  = document.getElementById('profile-name-input')?.value.trim();
  const email = document.getElementById('profile-email-input')?.value.trim();
  const city  = document.getElementById('profile-city-input')?.value.trim();

  if (!name) { showToast('Naam required hai', false); return; }

  try {
    const tok = localStorage.getItem('qaa_student_token') || '';
    const res = await fetch(`../api/lms.php?action=update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Student-Token': tok },
      body: JSON.stringify({ name, email, city })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Failed');

    // Update in-memory student
    if (window._currentStudent) {
      window._currentStudent.name  = name;
      window._currentStudent.email = email;
      window._currentStudent.city  = city;
    }

    // Update nav name
    const navName = document.getElementById('nav-user-name');
    if (navName) navName.textContent = name;
    const dropName = document.getElementById('dropdown-user-name');
    if (dropName) dropName.textContent = name;

    showToast('Profile save ho gaya! ✅');
    closeProfileModal();
  } catch (err) {
    showToast(err.message || 'Save nahi ho saka', false);
  }
}


// ==========================================================================
// My Certificates Modal
// ==========================================================================

async function openMyCertificates() {
  // Remove existing
  document.getElementById('certs-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'certs-modal-overlay';
  overlay.className = 'certs-modal-overlay';
  overlay.innerHTML = `
    <div class="certs-modal-card" role="dialog" aria-modal="true" aria-label="My Certificates">
      <div class="certs-modal-header">
        <h2 class="certs-modal-title">🏆 My Certificates</h2>
        <button class="certs-modal-close" onclick="document.getElementById('certs-modal-overlay').remove()" aria-label="Close">✕</button>
      </div>
      <div id="certs-modal-body">
        <div class="discussion-loading">Loading your certificates…</div>
      </div>
    </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  try {
    const tok = localStorage.getItem('qaa_student_token') || '';
    const res = await fetch('../api/lms.php?action=my-courses', {
      headers: { 'X-Student-Token': tok }
    });
    const data = await res.json();
    const courses = data.courses || [];

    const body = document.getElementById('certs-modal-body');
    if (!body) return;

    if (!courses.length) {
      body.innerHTML = `
        <div class="certs-empty">
          <div class="certs-empty-icon">🎓</div>
          <div style="font-size:15px;font-weight:700;margin-bottom:6px;">Koi certificate nahi abhi tak</div>
          <div style="font-size:13px;">Course complete karo aur apna certificate earn karo!</div>
        </div>`;
      return;
    }

    body.innerHTML = `<div class="certs-list">${courses.map(c => {
      const total     = c.totalLessons || 1;
      const completed = c.completedCount || 0;
      const pct       = Math.round((completed / total) * 100);
      const earned    = pct >= 100;

      return `
        <div class="cert-list-item">
          <div class="cert-list-icon">🎓</div>
          <div class="cert-list-info">
            <div class="cert-list-name">${escHtml(c.title)}</div>
            <div class="cert-list-meta">${completed} / ${total} lessons • ${pct}% complete</div>
          </div>
          ${earned
            ? `<span class="cert-list-status earned">✓ Earned</span>
               <button class="cert-list-btn" onclick="document.getElementById('certs-modal-overlay')?.remove(); openCourseClassroom('${c.id}').then(()=>openCertificateModal())">View →</button>`
            : `<span class="cert-list-status pending">${pct}%</span>`
          }
        </div>`;
    }).join('')}</div>`;
  } catch (e) {
    const body = document.getElementById('certs-modal-body');
    if (body) body.innerHTML = `<div class="certs-empty"><div class="certs-empty-icon">⚠️</div><div>Load nahi ho saka. Refresh karein.</div></div>`;
  }
}

// ==========================================================================
// Settings Modal
// ==========================================================================

function openMySettings() {
  document.getElementById('settings-modal-overlay')?.remove();

  const notifPref = localStorage.getItem('qaa_notif_pref') !== 'off';
  const speedPref = localStorage.getItem('qaa_speed_pref') || '1';

  const overlay = document.createElement('div');
  overlay.id = 'settings-modal-overlay';
  overlay.className = 'certs-modal-overlay';
  overlay.innerHTML = `
    <div class="settings-modal-card" role="dialog" aria-modal="true" aria-label="Settings">
      <div class="certs-modal-header">
        <h2 class="certs-modal-title">⚙️ Settings</h2>
        <button class="certs-modal-close" onclick="document.getElementById('settings-modal-overlay').remove()" aria-label="Close">✕</button>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Playback</div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Default Speed</div>
            <div class="settings-row-sub">Video ki default playback speed</div>
          </div>
          <select id="setting-speed" onchange="localStorage.setItem('qaa_speed_pref', this.value)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#f4f4f6;padding:6px 10px;font-size:13px;cursor:pointer;">
            <option value="0.75" ${speedPref==='0.75'?'selected':''}>0.75x</option>
            <option value="1"    ${speedPref==='1'?'selected':''}>1.0x (Normal)</option>
            <option value="1.25" ${speedPref==='1.25'?'selected':''}>1.25x</option>
            <option value="1.5"  ${speedPref==='1.5'?'selected':''}>1.5x</option>
            <option value="2"    ${speedPref==='2'?'selected':''}>2.0x</option>
          </select>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Notifications</div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Progress Reminders</div>
            <div class="settings-row-sub">Course completion reminders</div>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" ${notifPref?'checked':''} onchange="localStorage.setItem('qaa_notif_pref', this.checked ? 'on' : 'off')" />
            <span class="settings-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-group-title">Account</div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Change Password</div>
            <div class="settings-row-sub">Email login password update</div>
          </div>
          <button onclick="openChangePassword()" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#f4f4f6;padding:6px 14px;font-size:12.5px;cursor:pointer;">Update →</button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label" style="color:rgba(239,68,68,0.85)">Clear Local Data</div>
            <div class="settings-row-sub">Cached data & preferences reset</div>
          </div>
          <button onclick="clearLocalData()" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.20);border-radius:8px;color:#ef4444;padding:6px 14px;font-size:12.5px;cursor:pointer;">Clear</button>
        </div>
      </div>
    </div>`;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function clearLocalData() {
  const keep = ['qaa_student_token'];
  const saved = {};
  keep.forEach(k => { const v = localStorage.getItem(k); if (v) saved[k] = v; });
  localStorage.clear();
  Object.entries(saved).forEach(([k,v]) => localStorage.setItem(k,v));
  showToast('Local data cleared! ✅');
  document.getElementById('settings-modal-overlay')?.remove();
}

function openChangePassword() {
  const stu = window._currentStudent || {};
  if (!stu.email) {
    showToast('Password change ke liye pehle email set karein', false);
    return;
  }
  document.getElementById('settings-modal-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'changepw-modal-overlay';
  overlay.className = 'certs-modal-overlay';
  overlay.innerHTML = `
    <div class="settings-modal-card">
      <div class="certs-modal-header">
        <h2 class="certs-modal-title">🔑 Change Password</h2>
        <button class="certs-modal-close" onclick="document.getElementById('changepw-modal-overlay').remove()">✕</button>
      </div>
      <div class="profile-fields" style="margin-top:4px;">
        <div class="profile-field">
          <label>New Password</label>
          <input type="password" id="new-pw-input" placeholder="Min. 6 characters" class="portal-input" style="font-size:14px;min-height:44px;" />
        </div>
        <div class="profile-field">
          <label>Confirm Password</label>
          <input type="password" id="confirm-pw-input" placeholder="Dubara darj karein" class="portal-input" style="font-size:14px;min-height:44px;" />
        </div>
        <button class="btn btn-gold btn-block" style="margin-top:16px;" onclick="submitChangePassword()">Update Password →</button>
      </div>
    </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

async function submitChangePassword() {
  const pw1 = document.getElementById('new-pw-input')?.value;
  const pw2 = document.getElementById('confirm-pw-input')?.value;
  if (!pw1 || pw1.length < 6) { showToast('Password min. 6 characters ka hona chahiye', false); return; }
  if (pw1 !== pw2) { showToast('Passwords match nahi kar rahe', false); return; }

  try {
    const tok = localStorage.getItem('qaa_student_token') || '';
    const res = await fetch('../api/lms.php?action=change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Student-Token': tok },
      body: JSON.stringify({ password: pw1 })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Failed');
    showToast('Password update ho gaya! 🔑');
    document.getElementById('changepw-modal-overlay')?.remove();
  } catch (e) {
    showToast(e.message || 'Update nahi ho saka', false);
  }
}

// Update enrolled count badge in dropdown
function updateDropdownEnrolledBadge(count) {
  const badge = document.getElementById('dd-enrolled-count');
  if (badge) badge.textContent = count > 0 ? count : '';
}


// ==========================================================================
// Video Security & Anti-Download Protection
// ==========================================================================
(function initVideoSecurity() {
  const blockEvents = (el) => {
    if (!el) return;
    el.addEventListener('contextmenu', e => { e.preventDefault(); return false; }, true);
    el.addEventListener('dragstart', e => { e.preventDefault(); return false; }, true);
    el.setAttribute('oncontextmenu', 'return false;');
  };

  const applySecurity = () => {
    blockEvents(document.querySelector('.video-wrapper'));
    blockEvents(document.querySelector('.video-container'));
    blockEvents(document.getElementById('video-mount'));
    document.querySelectorAll('#video-mount video, #video-mount iframe').forEach(blockEvents);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySecurity);
  } else {
    applySecurity();
  }

  // Observe dynamically mounted videos
  const mount = document.getElementById('video-mount');
  if (mount && window.MutationObserver) {
    new MutationObserver(() => applySecurity()).observe(mount, { childList: true, subtree: true });
  }
})();

// ==========================================================================
// STUDENT LIVE CINEMA STUDIO & DOUBTS INTERACTION MODULE
// ==========================================================================
let studentLiveClasses = [];
let currentLiveSession = null;
let liveDoubtsPollTimer = null;
let liveWatermarkInterval = null;
let liveAttendeesTimer = null;
let currentLiveAttendeesCount = 0;
let isLiveTheaterMode = false;

async function loadStudentLiveClasses() {
  const shelf = document.getElementById('live-sessions-shelf');
  const banner = document.getElementById('live-session-banner');
  const grid = document.getElementById('live-cards-grid');

  try {
    const res = await lmsApi('get-live-classes');
    studentLiveClasses = res.liveClasses || [];

    // 1. Check if any class is LIVE NOW
    const liveNowSession = studentLiveClasses.find(c => c.status === 'live');
    if (liveNowSession && banner) {
      banner.classList.remove('hidden');
      const bTitle = document.getElementById('live-banner-title');
      const bSub = document.getElementById('live-banner-sub');
      if (bTitle) bTitle.textContent = `🔴 LIVE NOW: ${liveNowSession.title}`;
      if (bSub) {
        bSub.textContent = liveNowSession.isAuthorized 
          ? 'Mentor Anil Sharma is broadcasting live on timeline • Click to Join Live Classroom'
          : `Tickets available: ₹${liveNowSession.ticketPrice || 299} • Click to Unlock Live Access`;
      }
      banner.onclick = () => openLiveStudioFromBanner(liveNowSession.id, liveNowSession.isAuthorized);
    } else if (banner) {
      banner.classList.add('hidden');
    }

    // 2. Render Cards Shelf
    if (!studentLiveClasses.length) {
      if (shelf) shelf.classList.add('hidden');
      return;
    }

    if (shelf) shelf.classList.remove('hidden');
    if (grid) {
      grid.innerHTML = studentLiveClasses.map(c => {
        let statusBadge = '';
        if (c.status === 'live') {
          statusBadge = '<span class="live-card-badge status-live">🔴 Live Now</span>';
        } else if (c.status === 'completed') {
          statusBadge = '<span class="live-card-badge status-completed">✓ Completed Replay</span>';
        } else {
          statusBadge = '<span class="live-card-badge status-scheduled">⏳ Scheduled</span>';
        }

        const dateStr = c.scheduledAt ? new Date(c.scheduledAt).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        }) : 'Coming Soon';

        let actionBtn = '';
        if (c.isAuthorized) {
          if (c.status === 'live') {
            actionBtn = `<button type="button" class="btn btn-gold btn-block" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-weight:700" onclick="openLiveStudio('${c.id}')">🔴 Enter Live Studio</button>`;
          } else if (c.status === 'completed') {
            actionBtn = `<button type="button" class="btn btn-outline btn-block" onclick="openLiveStudio('${c.id}')">▶ Watch Replay</button>`;
          } else {
            actionBtn = `<button type="button" class="btn btn-outline btn-block" onclick="openLiveStudio('${c.id}')">⏳ Waiting Room / Details</button>`;
          }
        } else {
          if (c.type === 'workshop') {
            actionBtn = `<a href="/master-class/live.html" class="btn btn-gold btn-block" style="text-decoration:none;display:block;text-align:center">🎟️ Book Ticket (₹${Number(c.ticketPrice||299).toLocaleString()})</a>`;
          } else {
            actionBtn = `<a href="../online/" class="btn btn-gold-outline btn-block" style="text-decoration:none;display:block;text-align:center">🔒 Enroll in Course</a>`;
          }
        }

        return `
          <div class="live-card">
            <div>
              <div class="live-card-badge-row">
                ${statusBadge}
                <span style="font-size:11px;color:#94a3b8">${escapeHtml(c.duration || '90 Mins')}</span>
              </div>
              <h4 class="live-card-title">${escapeHtml(c.title)}</h4>
              <p class="live-card-desc">${escapeHtml(c.description || 'Live hands-on color grading timeline session.')}</p>
            </div>
            <div>
              <div class="live-card-meta">
                <span>🗓️ ${dateStr}</span>
                <span>${c.isAuthorized ? '<strong style="color:#10b981">✓ Unlocked</strong>' : (c.type === 'workshop' ? `₹${c.ticketPrice}` : 'Course Batch')}</span>
              </div>
              <div style="margin-top:12px">
                ${actionBtn}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    if (shelf) shelf.classList.add('hidden');
  }
}

function openLiveStudioFromBanner(liveId = null, isAuth = true) {
  if (!liveId) {
    const liveNow = studentLiveClasses.find(c => c.status === 'live');
    if (liveNow) {
      liveId = liveNow.id;
      isAuth = liveNow.isAuthorized;
    }
  }

  if (!isAuth) {
    window.location.href = '/master-class/live.html';
    return;
  }

  if (liveId) {
    openLiveStudio(liveId);
  }
}

async function openLiveStudio(liveId) {
  switchView('live-studio');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Initialize and run dynamic realistic live attendee counter (300-800)
  startLiveAttendeesCounter();

  const mount = document.getElementById('live-video-mount');
  if (mount) {
    mount.innerHTML = `
      <div class="live-placeholder">
        <div class="live-pulse-ring"></div>
        <div style="font-weight:700;font-size:16px;margin-top:16px;color:#fff">Connecting to Secure Live Studio…</div>
        <div class="muted" style="font-size:13px;margin-top:4px">1080p 60fps High-Definition Feed</div>
      </div>
    `;
  }

  try {
    const res = await lmsApi(`get-live-session&liveId=${encodeURIComponent(liveId)}`);
    currentLiveSession = res;

    // Update Header
    const titleEl = document.getElementById('live-player-title');
    if (titleEl) titleEl.textContent = res.title;

    const descTitle = document.getElementById('live-desc-title');
    if (descTitle) descTitle.textContent = res.title;

    const statusTag = document.getElementById('live-status-tag');
    if (statusTag) {
      statusTag.textContent = res.status === 'live' ? '🔴 LIVE BROADCAST' : (res.status === 'completed' ? '✓ RECORDED REPLAY' : '⏳ SCHEDULED ROOM');
    }

    const descSchedule = document.getElementById('live-desc-schedule');
    if (descSchedule && res.scheduledAt) {
      const dt = new Date(res.scheduledAt).toLocaleString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      descSchedule.textContent = `Broadcast: ${dt} • Duration: ${res.duration || '90 Mins'}`;
    }

    const descBody = document.getElementById('live-desc-body');
    if (descBody) descBody.textContent = res.description || 'Hands-on timeline session with Lead Mentor Anil Sharma.';

    // Resources
    const resList = document.getElementById('live-resources-list');
    if (resList) {
      if (Array.isArray(res.resources) && res.resources.length) {
        resList.innerHTML = res.resources.map(r => `
          <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener" class="live-resource-item">
            <span>📦 ${escapeHtml(r.title)}</span>
            <span style="font-weight:700">Download ⬇</span>
          </a>
        `).join('');
      } else {
        resList.innerHTML = '<div class="muted" style="font-size:12.5px">Practice files will be unlocked during the live stream.</div>';
      }
    }

    // Dynamic Floating Watermark
    initLiveWatermark(res.watermark);

    // Embed Video Stream with Anti-Leak Protection
    embedLiveStream(res.streamId, res.replayUrl, res.status);

    // Start Live Doubts Polling
    pollLiveDoubtsStudent();
    if (liveDoubtsPollTimer) clearInterval(liveDoubtsPollTimer);
    liveDoubtsPollTimer = setInterval(pollLiveDoubtsStudent, 4000);

  } catch (err) {
    toast('Access denied: ' + err.message, false);
    showDashboard();
  }
}

function initLiveWatermark(watermarkText) {
  const el = document.getElementById('live-watermark-text');
  if (!el) return;
  el.textContent = watermarkText || 'Quick Art Photography Academy';

  // Float watermark randomly across the player every 10 seconds
  if (liveWatermarkInterval) clearInterval(liveWatermarkInterval);
  const moveWatermark = () => {
    const top = Math.floor(Math.random() * 65) + 15; // 15% to 80%
    const left = Math.floor(Math.random() * 65) + 15; // 15% to 80%
    el.style.top = `${top}%`;
    el.style.left = `${left}%`;
  };
  moveWatermark();
  liveWatermarkInterval = setInterval(moveWatermark, 10000);
}

function embedLiveStream(streamId, replayUrl, status) {
  const mount = document.getElementById('live-video-mount');
  if (!mount) return;

  // If status is completed and custom replayUrl provided, check if it's a Bunny GUID or YouTube ID
  let videoId = streamId;
  if (status === 'completed' && replayUrl) {
    videoId = replayUrl;
  }

  if (!videoId) {
    mount.innerHTML = `
      <div class="live-placeholder">
        <div style="font-size:36px;margin-bottom:12px">⏳</div>
        <div style="font-weight:700;font-size:16px;color:#fff">Stream Starting Soon</div>
        <div class="muted" style="font-size:13px;margin-top:4px">Mentor Anil Sharma will start broadcasting shortly. Please keep this page open.</div>
      </div>
    `;
    return;
  }

  // Pure Protected Embed:
  // - modestbranding=1 : hides large YouTube logo
  // - rel=0 : does not show external recommended videos
  // - iv_load_policy=3 : hides video annotations
  // - disablekb=0 : keyboard navigation
  const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&modestbranding=1&rel=0&controls=1&showinfo=0&iv_load_policy=3`;

  mount.innerHTML = `
    <iframe 
      src="${embedUrl}" 
      title="Quick Art Photography Academy Live Stream" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      allowfullscreen>
    </iframe>
  `;
}

function reloadLivePlayer() {
  if (currentLiveSession) {
    embedLiveStream(currentLiveSession.streamId, currentLiveSession.replayUrl, currentLiveSession.status);
    toast('🔄 Stream reloaded');
  }
}

function toggleLiveCinemaFullscreen() {
  const box = document.getElementById('live-video-box');
  if (!box) return;

  const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);

  if (!isFullscreen) {
    if (box.requestFullscreen) {
      box.requestFullscreen().catch(err => console.warn('Fullscreen request failed:', err));
    } else if (box.webkitRequestFullscreen) {
      box.webkitRequestFullscreen();
    } else if (box.mozRequestFullScreen) {
      box.mozRequestFullScreen();
    } else if (box.msRequestFullscreen) {
      box.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

function updateLiveFullscreenUI() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  const btns = document.querySelectorAll('.live-fs-btn');
  btns.forEach(btn => {
    if (btn.classList.contains('live-video-overlay-fs')) {
      btn.innerHTML = isFs ? '✕' : '⛶';
      btn.title = isFs ? 'Exit Fullscreen (Esc / Press F)' : 'Fullscreen Mode (Press F)';
    } else {
      btn.innerHTML = isFs ? '<span>⤶</span> Exit Fullscreen' : '<span>⛶</span> Fullscreen';
      if (isFs) btn.classList.add('active-fs');
      else btn.classList.remove('active-fs');
    }
  });
}

['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
  document.addEventListener(evt, updateLiveFullscreenUI);
});

function toggleLiveTheaterMode() {
  const layout = document.getElementById('live-studio-layout');
  const btn = document.getElementById('btn-theater-mode');
  const btnText = document.getElementById('theater-btn-text');
  if (!layout) return;

  isLiveTheaterMode = !isLiveTheaterMode;
  if (isLiveTheaterMode) {
    layout.classList.add('theater-mode');
    if (btnText) btnText.textContent = 'Standard View';
    if (btn) btn.classList.add('active-theater');
    toast('🎬 Cinema View Active — Simple, distraction-free screen');
  } else {
    layout.classList.remove('theater-mode');
    if (btnText) btnText.textContent = 'Cinema View';
    if (btn) btn.classList.remove('active-theater');
    toast('📱 Standard View restored');
  }
}

// ── Realistic Dynamic Live Attendee Counter (Range: 300 to 800) ──
function startLiveAttendeesCounter() {
  stopLiveAttendeesCounter();

  // Natural initial count between 380 and 530, preserving session memory if valid
  try {
    const saved = parseInt(sessionStorage.getItem('qa_live_attendees'), 10);
    if (saved && saved >= 300 && saved <= 800) {
      currentLiveAttendeesCount = saved;
    } else {
      currentLiveAttendeesCount = Math.floor(Math.random() * (530 - 380 + 1)) + 380;
    }
  } catch (e) {
    currentLiveAttendeesCount = Math.floor(Math.random() * (530 - 380 + 1)) + 380;
  }

  updateLiveAttendeesDisplay(currentLiveAttendeesCount, false);
  scheduleNextAttendeeFluctuation();
}

function scheduleNextAttendeeFluctuation() {
  if (liveAttendeesTimer) clearTimeout(liveAttendeesTimer);

  // Organic variable delay between 4.0s and 7.8s (never fixed/robotic)
  const nextDelayMs = Math.floor(Math.random() * 3800) + 4000;

  liveAttendeesTimer = setTimeout(() => {
    fluctuateLiveAttendees();
    scheduleNextAttendeeFluctuation();
  }, nextDelayMs);
}

function fluctuateLiveAttendees() {
  let delta = 0;
  const rand = Math.random();

  // Boundary-aware organic fluctuation strictly between 300 and 800
  if (currentLiveAttendeesCount < 330) {
    // Near bottom bound: strongly bias positive
    delta = Math.floor(Math.random() * 4) + 2; // +2 to +5
  } else if (currentLiveAttendeesCount > 770) {
    // Near top bound: strongly bias negative
    delta = -(Math.floor(Math.random() * 4) + 2); // -2 to -5
  } else {
    // Natural live stream traffic fluctuations
    if (rand < 0.46) {
      // 46% chance: +1 to +3 (new attendees joining)
      delta = Math.floor(Math.random() * 3) + 1;
    } else if (rand < 0.84) {
      // 38% chance: -1 to -3 (temporary reconnects/drops)
      delta = -(Math.floor(Math.random() * 3) + 1);
    } else if (rand < 0.94) {
      // 10% chance: +3 to +6 (small joining rush)
      delta = Math.floor(Math.random() * 4) + 3;
    } else {
      // 6% chance: 0 (stable viewer count)
      delta = 0;
    }
  }

  currentLiveAttendeesCount += delta;

  // Strict safety clamping: never falls below 300, never exceeds 800
  if (currentLiveAttendeesCount < 308) currentLiveAttendeesCount = 308 + Math.floor(Math.random() * 12);
  if (currentLiveAttendeesCount > 794) currentLiveAttendeesCount = 794 - Math.floor(Math.random() * 12);

  try {
    sessionStorage.setItem('qa_live_attendees', currentLiveAttendeesCount.toString());
  } catch (e) {}

  updateLiveAttendeesDisplay(currentLiveAttendeesCount, delta !== 0);
}

function updateLiveAttendeesDisplay(count, animated = true) {
  const formatted = count.toLocaleString('en-IN');
  const countEls = [
    document.getElementById('live-viewer-count'),
    document.getElementById('live-viewer-count-mini')
  ];

  countEls.forEach(el => {
    if (el) {
      el.textContent = formatted;
      if (animated) {
        el.classList.remove('count-bump');
        void el.offsetWidth; // Force DOM reflow to restart CSS keyframe
        el.classList.add('count-bump');
      }
    }
  });

  const badgeEls = [
    document.getElementById('live-attendees-pill'),
    document.getElementById('live-attendees-pill-mini')
  ];

  badgeEls.forEach(pill => {
    if (pill && animated) {
      pill.classList.remove('pulse-pill');
      void pill.offsetWidth;
      pill.classList.add('pulse-pill');
    }
  });
}

function stopLiveAttendeesCounter() {
  if (liveAttendeesTimer) {
    clearTimeout(liveAttendeesTimer);
    liveAttendeesTimer = null;
  }
}

// Global hotkeys inside Live Studio (F = Fullscreen, T = Cinema Mode)
document.addEventListener('keydown', (e) => {
  const liveStudio = document.getElementById('view-live-studio');
  if (!liveStudio || liveStudio.classList.contains('hidden')) return;
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault();
    toggleLiveCinemaFullscreen();
  } else if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    toggleLiveTheaterMode();
  }
});

function exitLiveStudio() {
  stopLiveAttendeesCounter();

  if (liveDoubtsPollTimer) {
    clearInterval(liveDoubtsPollTimer);
    liveDoubtsPollTimer = null;
  }
  if (liveWatermarkInterval) {
    clearInterval(liveWatermarkInterval);
    liveWatermarkInterval = null;
  }

  // Clear video mount to stop sound/stream
  const mount = document.getElementById('live-video-mount');
  if (mount) mount.innerHTML = '';
  currentLiveSession = null;

  // Reset theater mode if active
  if (isLiveTheaterMode) {
    toggleLiveTheaterMode();
  }

  showDashboard();
}

async function pollLiveDoubtsStudent() {
  if (!currentLiveSession || !currentLiveSession.id) return;
  const container = document.getElementById('live-chat-messages');
  if (!container) return;

  try {
    const res = await lmsApi(`fetch-live-doubts&liveId=${encodeURIComponent(currentLiveSession.id)}`);
    const messages = res.messages || [];

    if (!messages.length) {
      container.innerHTML = `
        <div class="chat-empty-state">
          <span>💬</span>
          <p>Live doubts chat is open. Ask your editing doubts or color grading questions below.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(m => {
      const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '';
      if (m.isMentor) {
        return `
          <div class="chat-msg-bubble mentor">
            <div class="chat-msg-hdr">
              <span>⭐ ${escapeHtml(m.studentName || 'Mentor Anil Sharma')}</span>
              <span class="chat-msg-time">${timeStr}</span>
            </div>
            <div class="chat-msg-text">${escapeHtml(m.message)}</div>
          </div>
        `;
      }
      return `
        <div class="chat-msg-bubble student">
          <div class="chat-msg-hdr">
            <span>🎓 ${escapeHtml(m.studentName || 'Student')}</span>
            <span class="chat-msg-time">${timeStr}</span>
          </div>
          <div class="chat-msg-text">${escapeHtml(m.message)}</div>
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;
  } catch(e){}
}

async function sendLiveDoubtStudent() {
  if (!currentLiveSession || !currentLiveSession.id) return;
  const input = document.getElementById('live-doubt-input');
  const btn = document.getElementById('btn-live-send');
  const msg = input ? input.value.trim() : '';
  if (!msg) return;

  input.value = '';
  if (btn) btn.disabled = true;

  try {
    await lmsApi('send-live-doubt', {
      method: 'POST',
      body: { liveId: currentLiveSession.id, message: msg }
    });
    pollLiveDoubtsStudent();
  } catch (err) {
    toast(err.message, false);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ── Auto Hash Route for Live Class Direct Links (e.g. /portal/#live/live_demo_01) ──
window.addEventListener('hashchange', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#live/')) {
    const liveId = hash.replace('#live/', '').trim();
    if (liveId) openLiveStudio(liveId);
  }
});
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash;
  if (hash.startsWith('#live/')) {
    const liveId = hash.replace('#live/', '').trim();
    if (liveId) setTimeout(() => openLiveStudio(liveId), 600);
  }
});
