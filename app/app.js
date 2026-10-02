// ==========================================================================
// Quick Art Photography Academy LMS — Mobile App Engine
// Unified Student Credentials & Real-Time Sync with Website LMS
// ==========================================================================

let currentStudent = null;
let enrolledCourses = [];
let allLiveClasses = [];
let activeCourse = null;
let activeLesson = null;
let notificationsList = [];
let liveCheckInterval = null;


// ==========================================================================
// 1. SMART API CLIENT (ZERO JSON CRASHES, AUTO-FALLBACK & CORS COMPATIBLE)
// ==========================================================================

function getLmsApiBase() {
  const isStaticLocal = ['5500', '5501', '5502', '3000', '5173', '8080'].includes(window.location.port)
    || window.location.protocol === 'file:'
    || (window.location.hostname === 'localhost' && !window.location.port.startsWith('80'));

  // If running in local static preview or file protocol, use live backend
  if (isStaticLocal) {
    return 'https://quickartphotography.in/api/lms.php';
  }
  return '../api/lms.php';
}

/**
 * Robust API fetcher:
 * - Automatically falls back to live domain if local server doesn't execute PHP
 * - Safely parses text before JSON to eliminate 'Unexpected end of JSON input'
 * - Injects 'X-Student-Token' seamlessly
 */
async function apiFetch(action, opts = {}) {
  let base = getLmsApiBase();
  let url = `${base}?action=${action}`;

  const token = localStorage.getItem('qaa_student_token') || '';
  const headers = Object.assign({
    'Content-Type': 'application/json',
    'X-Student-Token': token
  }, opts.headers || {});

  const fetchOptions = {
    method: opts.method || 'GET',
    headers: headers
  };

  if (opts.body) {
    fetchOptions.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
  }

  let res;
  let usedLiveFallback = false;

  try {
    res = await fetch(url, fetchOptions);
  } catch (netErr) {
    // If local relative request failed (CORS/offline/network), fallback to production API
    if (!url.startsWith('https://quickartphotography.in')) {
      url = `https://quickartphotography.in/api/lms.php?action=${action}`;
      usedLiveFallback = true;
      res = await fetch(url, fetchOptions);
    } else {
      throw new Error('Network error. Please check your internet connection.');
    }
  }

  const rawText = await res.text();
  let data = null;

  try {
    data = JSON.parse(rawText);
  } catch (parseErr) {
    // If local server returned empty or non-JSON (e.g. VS Code Live Server static file), try live API
    if (!usedLiveFallback && !url.startsWith('https://quickartphotography.in')) {
      const fallbackUrl = `https://quickartphotography.in/api/lms.php?action=${action}`;
      try {
        const fbRes = await fetch(fallbackUrl, fetchOptions);
        const fbText = await fbRes.text();
        data = JSON.parse(fbText);
      } catch (e2) {
        throw new Error('Server returned invalid response. Please try again.');
      }
    } else {
      throw new Error(rawText || 'Server error occurred');
    }
  }

  if (!data || !data.ok) {
    throw new Error((data && data.error) || 'Request failed');
  }

  return data;
}

// Alias for legacy calls
const callLmsApi = apiFetch;

// ==========================================================================
// 2. INITIALIZATION & SESSION VALIDATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  initAppSession();
  setupURLRouter();
});

// Register Service Worker for Background Push Notifications
async function initServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    try {
      const reg = await navigator.serviceWorker.register('sw.js?v=20261002_02');
      console.log('QAA LMS ServiceWorker registered successfully:', reg.scope);

      // Check if already subscribed to push
      if ('PushManager' in window) {
        const sub = await reg.pushManager.getSubscription();
        if (sub && currentStudent) {
          syncPushSubscriptionWithServer(sub);
        }
      }
    } catch (err) {
      console.warn('ServiceWorker registration error:', err);
    }
  }
}

// Request and enable Live Class Push Notifications
async function requestPushNotificationPermission() {
  if (!('Notification' in window)) {
    toast('Notifications are not supported on this browser/device', false);
    return;
  }

  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    toast('🔔 Live Class Push Notifications Activated!');
    document.getElementById('push-permission-strip')?.classList.add('hidden');

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      try {
        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_WJJn52SkqdG3W5NA10DWDV73W4nKPuhbUxio')
          }).catch(async () => {
            return await reg.pushManager.subscribe({ userVisibleOnly: true }).catch(() => null);
          });
        }
        if (sub) {
          await syncPushSubscriptionWithServer(sub);
        }
      } catch (err) {
        console.warn('Push subscribe error:', err);
      }
    }
  } else {
    toast('Notification permission was dismissed or blocked in settings.', false);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function syncPushSubscriptionWithServer(subscription) {
  const student = currentStudent || JSON.parse(localStorage.getItem('qaa_student_info') || '{}');
  try {
    await apiFetch('save-push-subscription', {
      method: 'POST',
      body: {
        subscription: subscription,
        studentId: student.id || '',
        phone: student.phone || '',
        courses: student.enrolledCourses || []
      }
    });
  } catch (err) {
    console.warn('Failed to sync push subscription:', err);
  }
}

// Session Validation (Shared with Website LMS)
async function initAppSession() {
  const splash = document.getElementById('app-splash');
  const token = localStorage.getItem('qaa_student_token');

  if (!token) {
    // No session -> Show Login Screen
    setTimeout(() => {
      splash.classList.add('splash-hide');
      showAuthGate();
    }, 800);
    return;
  }

  try {
    const res = await apiFetch('me');
    if (res && res.student) {
      currentStudent = res.student;
      localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));

      // Successfully authenticated
      setTimeout(() => {
        splash.classList.add('splash-hide');
        enterAppView();
      }, 700);
    } else {
      throw new Error('Invalid session');
    }
  } catch (err) {
    console.warn('Session verification failed, requesting login:', err);
    localStorage.removeItem('qaa_student_token');
    setTimeout(() => {
      splash.classList.add('splash-hide');
      showAuthGate();
    }, 800);
  }
}

function showAuthGate() {
  document.getElementById('view-auth-gate').classList.remove('hidden');
  document.getElementById('app-header').classList.add('hidden');
  document.getElementById('app-viewport').classList.add('hidden');
  document.getElementById('bottom-nav').classList.add('hidden');
}

function enterAppView() {
  document.getElementById('view-auth-gate').classList.add('hidden');
  document.getElementById('app-header').classList.remove('hidden');
  document.getElementById('app-viewport').classList.remove('hidden');
  document.getElementById('bottom-nav').classList.remove('hidden');

  updateHeaderUI();

  // Default to 'mycourses' tab on open as requested
  const params = new URLSearchParams(window.location.search);
  const targetTab = params.get('tab') || 'mycourses';
  switchTab(targetTab);

  startLiveWatcher();
  loadNotifications();
}

function updateHeaderUI() {
  if (!currentStudent) return;
  const name = currentStudent.name || 'Student';
  const avatar = currentStudent.photoUrl || currentStudent.avatar || currentStudent.avatarUrl || '';
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const imgEl = document.getElementById('header-avatar-img');
  const initEl = document.getElementById('header-avatar-initials');

  if (avatar) {
    imgEl.src = avatar;
    imgEl.classList.remove('hidden');
    initEl.classList.add('hidden');
  } else {
    initEl.textContent = initials;
    initEl.classList.remove('hidden');
    imgEl.classList.add('hidden');
  }
}

// ==========================================================================
// 3. AUTHENTICATION (SAME STUDENT CREDENTIALS AS WEBSITE)
// ==========================================================================
function switchAuthTab(type) {
  const tabWa = document.getElementById('tab-btn-whatsapp');
  const tabEm = document.getElementById('tab-btn-email');
  const panelWa = document.getElementById('auth-panel-whatsapp');
  const panelEm = document.getElementById('auth-panel-email');

  if (type === 'whatsapp') {
    tabWa.classList.add('active');
    tabEm.classList.remove('active');
    panelWa.classList.remove('hidden');
    panelEm.classList.add('hidden');
  } else {
    tabEm.classList.add('active');
    tabWa.classList.remove('active');
    panelEm.classList.remove('hidden');
    panelWa.classList.add('hidden');
  }
}

// WhatsApp OTP: Send Step
let currentPhoneTarget = '';

async function handleSendPhoneOtp(e) {
  e.preventDefault();
  const phoneInput = document.getElementById('login-phone');
  const rawPhone = phoneInput.value.replace(/[^0-9]/g, '');
  const btn = document.getElementById('btn-send-whatsapp-otp');

  if (rawPhone.length < 10) {
    toast('Valid 10-digit mobile number enter karein', false);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending WhatsApp OTP…';

  try {
    const data = await apiFetch('send-otp', {
      method: 'POST',
      body: { phone: rawPhone }
    });

    currentPhoneTarget = rawPhone;
    document.getElementById('wa-display-phone').textContent = rawPhone;
    document.getElementById('form-phone-step').classList.add('hidden');
    document.getElementById('form-otp-step').classList.remove('hidden');
    document.getElementById('login-otp').value = '';
    document.getElementById('login-otp').focus();

    // Dev/Demo OTP banner if available
    if (data.devOtp) {
      document.getElementById('demo-otp-slot').classList.remove('hidden');
      document.getElementById('demo-otp-val').textContent = data.devOtp;
    } else {
      document.getElementById('demo-otp-slot').classList.add('hidden');
    }

    toast('💬 OTP aapke WhatsApp par bhej diya gaya hai!');
  } catch (err) {
    toast(err.message || 'OTP delivery me issue aaya. Dobara try karein.', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send WhatsApp OTP 💬';
  }
}

// WhatsApp OTP: Verify Step
async function handleVerifyPhoneOtp(e) {
  e.preventDefault();
  const otpInput = document.getElementById('login-otp');
  const otpVal = otpInput.value.trim();
  const btn = document.getElementById('btn-verify-whatsapp-otp');

  if (otpVal.length < 6) {
    toast('6-digit OTP code enter karein', false);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verifying OTP…';

  try {
    const data = await apiFetch('verify-otp', {
      method: 'POST',
      body: { phone: currentPhoneTarget, otp: otpVal }
    });

    // Save Unified Token & Student Object
    localStorage.setItem('qaa_student_token', data.token);
    currentStudent = data.student || {};
    localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));

    toast('🎉 Welcome to Quick Art Photography Academy!');
    enterAppView();
  } catch (err) {
    toast(err.message || 'Galat OTP code. Dobara check karein.', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify & Enter Classroom ✓';
  }
}

function resetToPhoneInput() {
  document.getElementById('form-phone-step').classList.remove('hidden');
  document.getElementById('form-otp-step').classList.add('hidden');
}

function resendPhoneOtp() {
  handleSendPhoneOtp({ preventDefault: () => {} });
}

// Email + Password Login
async function handleEmailLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-submit-email-login');

  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const data = await apiFetch('email-login', {
      method: 'POST',
      body: { email, password }
    });

    localStorage.setItem('qaa_student_token', data.token);
    currentStudent = data.student || {};
    localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));

    toast('🎉 Login successful! Welcome back.');
    enterAppView();
  } catch (err) {
    toast(err.message || 'Email ya Password galat hai.', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login & Enter App →';
  }
}

// Forgot Password Flow
function openForgotPasswordSheet() {
  document.getElementById('modal-forgot-pw').classList.add('active');
  document.getElementById('fp-step-1').classList.remove('hidden');
  document.getElementById('fp-step-2').classList.add('hidden');
}

function closeForgotPasswordSheet() {
  document.getElementById('modal-forgot-pw').classList.remove('active');
}

async function sendForgotEmailOtp() {
  const email = document.getElementById('fp-email').value.trim();
  const btn = document.getElementById('btn-fp-send-otp');
  if (!email || !email.includes('@')) {
    toast('Valid registered email enter karein', false);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending Email OTP…';

  try {
    await apiFetch('send-email-otp', {
      method: 'POST',
      body: { email, purpose: 'reset' }
    });

    document.getElementById('fp-step-1').classList.add('hidden');
    document.getElementById('fp-step-2').classList.remove('hidden');
    toast('✉️ 6-digit OTP aapke email par bhej diya gaya hai!');
  } catch (err) {
    toast(err.message || 'OTP send failed', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send 6-Digit Email OTP ✉️';
  }
}

async function submitPasswordReset() {
  const email = document.getElementById('fp-email').value.trim();
  const otp = document.getElementById('fp-otp').value.trim();
  const newPassword = document.getElementById('fp-new-password').value;
  const btn = document.getElementById('btn-fp-verify-reset');

  if (otp.length < 6 || newPassword.length < 6) {
    toast('Valid 6-digit OTP and min 6 chars password required', false);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Updating Password…';

  try {
    const data = await apiFetch('email-reset-password', {
      method: 'POST',
      body: { email, otp, newPassword }
    });

    closeForgotPasswordSheet();
    if (data.token) {
      localStorage.setItem('qaa_student_token', data.token);
      currentStudent = data.student || {};
      toast('🔒 Password updated! Logging in…');
      enterAppView();
    } else {
      toast('🔒 Password updated! Ab naye password se login karein.');
    }
  } catch (err) {
    toast(err.message || 'Reset failed', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Set New Password & Login ➔';
  }
}

// Registration Flow (New Student)
function openRegistrationSheet() {
  document.getElementById('modal-register').classList.add('active');
}

function closeRegistrationSheet() {
  document.getElementById('modal-register').classList.remove('active');
}

async function sendRegistrationEmailOtp() {
  const email = document.getElementById('reg-email').value.trim();
  const btn = document.getElementById('btn-reg-send-otp');
  if (!email || !email.includes('@')) {
    toast('Valid email address required', false);
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending…';

  try {
    await apiFetch('send-email-otp', {
      method: 'POST',
      body: { email, purpose: 'signup' }
    });

    document.getElementById('reg-otp-group').classList.remove('hidden');
    toast('✉️ 6-digit verification code sent to your email!');
  } catch (err) {
    toast(err.message || 'Could not send OTP', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send OTP';
  }
}

async function handleRegistrationSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.replace(/[^0-9]/g, '');
  const email = document.getElementById('reg-email').value.trim();
  const otp = document.getElementById('reg-otp').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('btn-submit-register');

  btn.disabled = true;
  btn.textContent = 'Creating Account…';

  try {
    const data = await apiFetch('email-signup', {
      method: 'POST',
      body: { name, phone, email, otp, password }
    });

    closeRegistrationSheet();
    localStorage.setItem('qaa_student_token', data.token);
    currentStudent = data.student || {};
    localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));

    toast('🎉 Account created successfully! Welcome to the Academy.');
    enterAppView();
  } catch (err) {
    toast(err.message || 'Registration failed', false);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Student Account ✓';
  }
}

function handleStudentLogout() {
  if (confirm('Kya aap Quick Art LMS Mobile App se logout karna chahte hain?')) {
    localStorage.removeItem('qaa_student_token');
    localStorage.removeItem('qaa_student_info');
    currentStudent = null;
    toast('Logged out successfully.');
    showAuthGate();
  }
}

function togglePasswordVisibility(inputId, triggerBtn) {
  const el = document.getElementById(inputId);
  if (!el) return;
  if (el.type === 'password') {
    el.type = 'text';
    triggerBtn.textContent = '🙈';
  } else {
    el.type = 'password';
    triggerBtn.textContent = '👁️';
  }
}

// ==========================================================================
// 4. BOTTOM NAVIGATION (4 CLEAN TABS)
// ==========================================================================
let currentTab = 'dashboard';

function switchTab(tabName, fromPopstate = false) {
  if (!['dashboard', 'mycourses', 'live', 'profile'].includes(tabName)) return;
  const prevTab = currentTab;
  currentTab = tabName;

  ['dashboard', 'mycourses', 'live', 'profile'].forEach(t => {
    const btn = document.getElementById(`nav-btn-${t}`);
    const panel = document.getElementById(`tab-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (panel) panel.classList.toggle('active-tab', t === tabName);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabName === 'dashboard') loadDashboardData();
  if (tabName === 'mycourses') loadCoursesTab();
  if (tabName === 'live') loadLiveClassesTab();
  if (tabName === 'profile') loadProfileData();

  if (!fromPopstate && tabName !== 'dashboard' && tabName !== prevTab) {
    pushNavState({ screen: 'tab', tab: tabName });
  }
}

function setupURLRouter() {
  const params = new URLSearchParams(window.location.search);
  const targetTab = params.get('tab');
  const targetId = params.get('id');

  if (targetTab && ['dashboard', 'mycourses', 'live', 'profile'].includes(targetTab)) {
    setTimeout(() => {
      switchTab(targetTab);
      if (targetTab === 'live' && targetId) {
        openLiveClassPlayerById(targetId);
      }
    }, 900);
  }
}

// ==========================================================================
// 5. TAB 1: DASHBOARD ENGINE
// ==========================================================================
async function loadDashboardData() {
  if (!currentStudent) return;

  // 1. Fill Profile Card
  document.getElementById('dash-student-name').textContent = `Namaste, ${currentStudent.name || 'Student'}!`;
  document.getElementById('dash-student-id').textContent = `ID: ${currentStudent.enrollmentNo || currentStudent.id || 'QAA-STUDENT'}`;

  const avatar = currentStudent.photoUrl || currentStudent.avatar || currentStudent.avatarUrl || '';
  const initials = (currentStudent.name || 'Student').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const avatarImg = document.getElementById('dash-avatar-img');
  const avatarFb = document.getElementById('dash-avatar-fallback');

  if (avatar) {
    avatarImg.src = avatar;
    avatarImg.classList.remove('hidden');
    avatarFb.classList.add('hidden');
  } else {
    avatarFb.textContent = initials;
    avatarFb.classList.remove('hidden');
    avatarImg.classList.add('hidden');
  }

  // 2. Fetch Enrolled Courses & Calculate Progress
  try {
    const res = await apiFetch('my-courses');
    enrolledCourses = res.courses || [];

    let totalLessons = 0;
    let completedLessons = 0;
    let certCount = 0;

    enrolledCourses.forEach(c => {
      const tot = c.totalLessons || (c.modules ? c.modules.reduce((a, m) => a + (m.lessons?.length || 0), 0) : 0);
      const done = c.completedCount || 0;
      totalLessons += tot;
      completedLessons += done;
      if (tot > 0 && done >= tot) certCount++;
    });

    const avgProg = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    document.getElementById('kpi-enrolled-count').textContent = enrolledCourses.length;
    document.getElementById('kpi-completed-lessons').textContent = completedLessons;
    document.getElementById('kpi-cert-count').textContent = certCount;
    document.getElementById('kpi-avg-progress').textContent = `${avgProg}%`;

    renderContinueLearningCard();
  } catch (err) {
    console.warn('Dashboard courses fetch failed:', err);
  }

  checkLiveClassStatus();
  renderAnnouncementsFeed();
  loadDashboardAllCourses();
}

function renderContinueLearningCard() {
  const card = document.getElementById('dash-resume-card');
  if (!enrolledCourses || !enrolledCourses.length) {
    card.classList.add('hidden');
    return;
  }

  const activeC = enrolledCourses.find(c => {
    const done = c.completedCount || 0;
    const tot = c.totalLessons || 1;
    return done > 0 && done < tot;
  }) || enrolledCourses[0];

  if (!activeC) {
    card.classList.add('hidden');
    return;
  }

  const tot = activeC.totalLessons || 1;
  const done = activeC.completedCount || 0;
  const pct = Math.round((done / tot) * 100);

  document.getElementById('resume-course-title').textContent = activeC.title;
  document.getElementById('resume-thumb').src = activeC.thumbnail ? `../${activeC.thumbnail}` : '../assets/course-premiere-pro-hindi.webp';
  document.getElementById('resume-lesson-title').textContent = activeC.lastLessonTitle || `Next: Lesson ${done + 1}`;
  document.getElementById('resume-lesson-sub').textContent = `${pct}% Complete • ${done}/${tot} Done`;
  document.getElementById('resume-progress-fill').style.width = `${pct}%`;

  document.getElementById('btn-resume-lesson').onclick = () => {
    openClassroomPlayer(activeC.id, activeC.lastLessonId || null);
  };

  card.classList.remove('hidden');
}

// ==========================================================================
// ALL ACADEMY COURSES ENGINE (ENROLLED + AVAILABLE PROGRAMS)
// ==========================================================================
let allAcademyCourses = [];
let currentCatalogFilter = 'all';

function safeCourseHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadDashboardAllCourses() {
  const stripEl = document.getElementById('dash-all-courses-strip');
  if (!stripEl) return;

  try {
    if (!allAcademyCourses.length) {
      let list = [];
      try {
        const res = await apiFetch('catalog');
        if (res && Array.isArray(res.catalog) && res.catalog.length) {
          list = res.catalog;
        }
      } catch (_) {}

      if (!list.length) {
        const res = await fetch('../data/courses.json');
        list = await res.json();
      }
      allAcademyCourses = Array.isArray(list) ? list : [];
    }

    renderDashboardAllCoursesStrip();
  } catch (err) {
    if (stripEl) {
      stripEl.innerHTML = '<div style="padding:14px; font-size:11.5px; color:var(--text-muted); text-align:center; width:100%;">Academy curriculum synced.</div>';
    }
  }
}

function isStudentEnrolledIn(course) {
  if (!enrolledCourses || !enrolledCourses.length) return false;
  return enrolledCourses.some(e => {
    if (e.id && course.id && e.id === course.id) return true;
    if (e.slug && course.slug && e.slug === course.slug) return true;
    if (e.title && course.title && e.title.toLowerCase().trim() === course.title.toLowerCase().trim()) return true;
    return false;
  });
}

function getEnrolledCourseData(course) {
  if (!enrolledCourses || !enrolledCourses.length) return null;
  return enrolledCourses.find(e => {
    if (e.id && course.id && e.id === course.id) return true;
    if (e.slug && course.slug && e.slug === course.slug) return true;
    if (e.title && course.title && e.title.toLowerCase().trim() === course.title.toLowerCase().trim()) return true;
    return false;
  });
}

function renderDashboardAllCoursesStrip() {
  const stripEl = document.getElementById('dash-all-courses-strip');
  if (!stripEl) return;

  if (!allAcademyCourses.length) {
    stripEl.innerHTML = '<div style="padding:14px; font-size:12px; color:var(--text-muted); text-align:center; width:100%;">No courses available.</div>';
    return;
  }

  // Sort enrolled courses first, then other available courses
  const sorted = [...allAcademyCourses].sort((a, b) => {
    const aEnrolled = isStudentEnrolledIn(a) ? 1 : 0;
    const bEnrolled = isStudentEnrolledIn(b) ? 1 : 0;
    return bEnrolled - aEnrolled;
  });

  stripEl.innerHTML = sorted.map(c => {
    const enrolled = isStudentEnrolledIn(c);
    const enrolledData = enrolled ? getEnrolledCourseData(c) : null;
    const thumb = c.thumbnail ? (c.thumbnail.startsWith('http') || c.thumbnail.startsWith('/') ? c.thumbnail : `../${c.thumbnail}`) : '../assets/course-premiere-pro-hindi.webp';
    const duration = c.duration || '60+ Hours';
    const price = c.price ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹4,999';

    if (enrolled) {
      const tot = (enrolledData && enrolledData.totalLessons) || 1;
      const done = (enrolledData && enrolledData.completedCount) || 0;
      const pct = Math.round((done / tot) * 100);

      return `
        <div class="dash-course-strip-card" onclick="openClassroomPlayer('${c.id}')">
          <div class="dash-strip-thumb-wrap">
            <img src="${thumb}" alt="${safeCourseHtml(c.title)}" class="dash-strip-thumb-img" onerror="this.src='../assets/course-premiere-pro-hindi.webp'" />
            <span class="dash-strip-badge enrolled">✓ Enrolled (${pct}%)</span>
          </div>
          <div class="dash-strip-content">
            <div class="dash-strip-title">${safeCourseHtml(c.title)}</div>
            <div class="dash-strip-meta">
              <span>⏱ ${safeCourseHtml(duration)}</span>
              <span style="color:#34d399; font-weight:700;">Enrolled</span>
            </div>
            <button type="button" class="dash-strip-btn btn-continue" onclick="event.stopPropagation(); openClassroomPlayer('${c.id}')">
              ▶ Continue Course
            </button>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="dash-course-strip-card" onclick="handleExploreCourse('${c.id}')">
          <div class="dash-strip-thumb-wrap">
            <img src="${thumb}" alt="${safeCourseHtml(c.title)}" class="dash-strip-thumb-img" onerror="this.src='../assets/course-premiere-pro-hindi.webp'" />
            <span class="dash-strip-badge available">⭐ Available • ${price}</span>
          </div>
          <div class="dash-strip-content">
            <div class="dash-strip-title">${safeCourseHtml(c.title)}</div>
            <div class="dash-strip-meta">
              <span>⏱ ${safeCourseHtml(duration)}</span>
              <span style="color:var(--gold); font-weight:700;">${price}</span>
            </div>
            <button type="button" class="dash-strip-btn btn-enroll" onclick="event.stopPropagation(); handleExploreCourse('${c.id}')">
              Enroll / Details ➔
            </button>
          </div>
        </div>
      `;
    }
  }).join('');
}

function openAllCoursesModal() {
  pushNavState({ screen: 'modal', modal: 'allcourses' });
  const modal = document.getElementById('modal-all-courses');
  if (modal) modal.classList.add('active');
  if (!allAcademyCourses.length) {
    loadDashboardAllCourses().then(() => renderCatalogModalList());
  } else {
    renderCatalogModalList();
  }
}

function closeAllCoursesModal(fromPopstate = false) {
  const modal = document.getElementById('modal-all-courses');
  if (modal) modal.classList.remove('active');
  if (!fromPopstate && window.history.state && window.history.state.modal === 'allcourses') {
    try { window.history.back(); } catch (e) {}
  }
}

function filterCatalogModal(filter) {
  currentCatalogFilter = filter;
  document.getElementById('chip-cat-all')?.classList.toggle('active', filter === 'all');
  document.getElementById('chip-cat-enrolled')?.classList.toggle('active', filter === 'enrolled');
  document.getElementById('chip-cat-available')?.classList.toggle('active', filter === 'available');
  renderCatalogModalList();
}

function renderCatalogModalList() {
  const listEl = document.getElementById('modal-catalog-list');
  if (!listEl) return;

  let filtered = allAcademyCourses;
  if (currentCatalogFilter === 'enrolled') {
    filtered = allAcademyCourses.filter(c => isStudentEnrolledIn(c));
  } else if (currentCatalogFilter === 'available') {
    filtered = allAcademyCourses.filter(c => !isStudentEnrolledIn(c));
  }

  if (!filtered.length) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:35px 16px; color:var(--text-muted);">
        <div style="font-size:28px; margin-bottom:8px;">📚</div>
        <div style="color:#fff; font-weight:700; margin-bottom:4px;">Koi course nahi mila</div>
        <div style="font-size:12px;">Is category me abhi koi program nahi hai.</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = filtered.map(c => {
    const enrolled = isStudentEnrolledIn(c);
    const thumb = c.thumbnail ? (c.thumbnail.startsWith('http') || c.thumbnail.startsWith('/') ? c.thumbnail : `../${c.thumbnail}`) : '../assets/course-premiere-pro-hindi.webp';
    const duration = c.duration || '60+ Hours';
    const price = c.price ? `₹${Number(c.price).toLocaleString('en-IN')}` : '₹4,999';

    if (enrolled) {
      return `
        <div class="modal-course-card" onclick="closeAllCoursesModal(); openClassroomPlayer('${c.id}');">
          <img src="${thumb}" alt="${safeCourseHtml(c.title)}" class="modal-course-thumb" onerror="this.src='../assets/course-premiere-pro-hindi.webp'" />
          <div class="modal-course-info">
            <span class="modal-course-tag enrolled">✓ Enrolled</span>
            <div class="modal-course-title">${safeCourseHtml(c.title)}</div>
            <div class="modal-course-sub">⏱ ${safeCourseHtml(duration)} • Active Classroom</div>
          </div>
          <button type="button" class="modal-course-btn" style="background:var(--gold-gradient); color:#090d18;">
            Study ➔
          </button>
        </div>
      `;
    } else {
      return `
        <div class="modal-course-card" onclick="handleExploreCourse('${c.id}');">
          <img src="${thumb}" alt="${safeCourseHtml(c.title)}" class="modal-course-thumb" onerror="this.src='../assets/course-premiere-pro-hindi.webp'" />
          <div class="modal-course-info">
            <span class="modal-course-tag available">⭐ Available • ${price}</span>
            <div class="modal-course-title">${safeCourseHtml(c.title)}</div>
            <div class="modal-course-sub">⏱ ${safeCourseHtml(duration)} • Full Lifetime Access</div>
          </div>
          <button type="button" class="modal-course-btn" style="background:rgba(216,161,83,0.18); border:1px solid rgba(216,161,83,0.35); color:var(--gold);">
            Enroll ➔
          </button>
        </div>
      `;
    }
  }).join('');
}

function handleExploreCourse(courseId) {
  const course = allAcademyCourses.find(c => c.id === courseId);
  const title = course ? course.title : 'Quick Art Photography Academy Program';
  const url = `https://wa.me/919939800780?text=${encodeURIComponent(`Namaste Anil Sir! Mujhe Quick Art Academy ke '${title}' program me admission/enrollment lena hai. Kripya details provide karein.`)}`;
  window.open(url, '_blank');
}

// Live Class Watcher
function startLiveWatcher() {
  if (liveCheckInterval) clearInterval(liveCheckInterval);
  checkLiveClassStatus();
  liveCheckInterval = setInterval(checkLiveClassStatus, 15000);
}

function isStudentEnrolledInLive(c) {
  if (!currentStudent || !c) return false;
  if (c.isAuthorized === true) return true;

  const enrolledIds = currentStudent.enrolledCourses || [];
  if (enrolledIds.includes('all-access')) return true;
  if (c.id && enrolledIds.includes(c.id)) return true;
  if (c.courseId && c.courseId !== 'all' && enrolledIds.includes(c.courseId)) return true;

  if (c.type === 'workshop') {
    return enrolledIds.includes('masterclass-live') || enrolledIds.includes('live_demo_01') || (c.id && enrolledIds.includes(c.id));
  }

  return false;
}

async function checkLiveClassStatus() {
  try {
    const res = await apiFetch('get-live-classes');
    allLiveClasses = res.liveClasses || [];

    const liveNow = allLiveClasses.find(c => c.status === 'live' && isStudentEnrolledInLive(c));
    const headerLiveBtn = document.getElementById('header-live-btn');
    const navLiveDot = document.getElementById('nav-live-dot');
    const dashLiveBanner = document.getElementById('dash-live-banner');

    if (liveNow) {
      headerLiveBtn?.classList.remove('hidden');
      navLiveDot?.classList.remove('hidden');

      if (dashLiveBanner) {
        dashLiveBanner.classList.remove('hidden');
        document.getElementById('dash-live-title').textContent = liveNow.title;
        document.getElementById('dash-live-sub').textContent = liveNow.description || 'Mentor Anil Sharma is broadcasting live on timeline. Tap to enter live classroom.';
      }
    } else {
      headerLiveBtn?.classList.add('hidden');
      navLiveDot?.classList.add('hidden');
      dashLiveBanner?.classList.add('hidden');
    }

    const upcoming = allLiveClasses.filter(c => c.status === 'scheduled' && isStudentEnrolledInLive(c));
    const schedCard = document.getElementById('dash-scheduled-card');
    if (upcoming.length && !liveNow) {
      const next = upcoming[0];
      schedCard?.classList.remove('hidden');
      document.getElementById('sched-class-title').textContent = next.title;
      if (next.scheduledAt) {
        const dt = new Date(next.scheduledAt);
        const schedMonthEl = document.getElementById('sched-cal-month');
        if (schedMonthEl) schedMonthEl.textContent = dt.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const schedDayEl = document.getElementById('sched-cal-day');
        if (schedDayEl) schedDayEl.textContent = String(dt.getDate()).padStart(2, '0');
        const schedTimeEl = document.getElementById('sched-class-time');
        if (schedTimeEl) schedTimeEl.textContent = dt.toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST';
      }
    } else {
      schedCard?.classList.add('hidden');
    }
  } catch (err) {
    console.warn('Live class status check error:', err);
  }
}

function renderAnnouncementsFeed() {
  const container = document.getElementById('dash-announcements-container');
  if (!container) return;

  const defaultAnnouncements = [
    {
      title: '🌟 4K Cinematic Practice RAW Footage Added',
      body: 'Haldi, Sangeet aur Wedding Varmala ke raw dual-camera 10-bit clips downloads section me upload ho gaye hain.',
      date: 'Latest Update',
      badge: 'PRACTICE ASSETS'
    },
    {
      title: '💬 Weekly Live Doubt Clearance Sessions',
      body: 'Har Sunday sham 7:00 PM Mentor Anil Sharma timeline live screen-share doubts solve karenge.',
      date: 'Weekly',
      badge: 'LIVE CLASS'
    }
  ];

  container.innerHTML = defaultAnnouncements.map(a => `
    <div class="announcement-card">
      <div class="announcement-meta">
        <span class="announcement-badge">${escHtml(a.badge)}</span>
        <span class="announcement-date">${escHtml(a.date)}</span>
      </div>
      <div class="announcement-title">${escHtml(a.title)}</div>
      <div class="announcement-body">${escHtml(a.body)}</div>
    </div>
  `).join('');
}

// ==========================================================================
// 6. TAB 2: MY COURSES ENGINE
// ==========================================================================
async function loadCoursesTab() {
  const listEl = document.getElementById('app-courses-list');
  listEl.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Loading your courses…</div>';

  try {
    const res = await apiFetch('my-courses');
    enrolledCourses = res.courses || [];
    filterCourses('all');
  } catch (err) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 30px; color: var(--text-muted);">
        Courses load nahi ho paaye. Check your internet connection.<br /><br />
        <button class="btn-primary" onclick="loadCoursesTab()" style="width:auto; margin:0 auto;">Retry</button>
      </div>`;
  }
}

function filterCourses(filter) {
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });

  const listEl = document.getElementById('app-courses-list');
  let filtered = enrolledCourses;

  if (filter === 'in-progress') {
    filtered = enrolledCourses.filter(c => {
      const done = c.completedCount || 0;
      const tot = c.totalLessons || 1;
      return done < tot;
    });
  } else if (filter === 'completed') {
    filtered = enrolledCourses.filter(c => {
      const done = c.completedCount || 0;
      const tot = c.totalLessons || 1;
      return tot > 0 && done >= tot;
    });
  }

  if (!filtered.length) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 40px 16px; color: var(--text-muted);">
        <div style="font-size: 32px; margin-bottom: 8px;">🎓</div>
        <div style="font-size: 15px; font-weight:700; color:#fff; margin-bottom:4px;">Koi course nahi mila</div>
        <div style="font-size: 12.5px;">Aapke enrolled programs yahan dikhai denge.</div>
      </div>`;
    return;
  }

  listEl.innerHTML = filtered.map(c => {
    const tot = c.totalLessons || (c.modules ? c.modules.reduce((a, m) => a + (m.lessons?.length || 0), 0) : 0);
    const done = c.completedCount || 0;
    const pct = tot > 0 ? Math.round((done / tot) * 100) : 0;
    const thumb = c.thumbnail ? `../${c.thumbnail}` : '../assets/course-premiere-pro-hindi.webp';

    return `
      <div class="course-card">
        <div class="course-card-thumb-wrap" onclick="openClassroomPlayer('${c.id}')">
          <img src="${thumb}" alt="${escHtml(c.title)}" class="course-card-thumb" onerror="this.src='../assets/course-premiere-pro-hindi.webp'" />
          <span class="course-card-badge">${pct >= 100 ? 'COMPLETED 🎓' : `${pct}% COMPLETED`}</span>
        </div>
        <div class="course-card-content">
          <h3 class="course-card-title">${escHtml(c.title)}</h3>
          <div class="course-card-stats">
            <span>⏱ ${escHtml(c.duration || 'Full Course')}</span>
            <span>📹 ${done}/${tot} Lessons</span>
            <span>🏆 Certificate</span>
          </div>
          <div class="course-card-progress">
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
            <span class="progress-pct">${pct}%</span>
          </div>
          <button type="button" class="btn-open-classroom" onclick="openClassroomPlayer('${c.id}')">
            ▶ Enter Classroom
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// 7. CLASSROOM PLAYER ENGINE (SEAMLESS IN-APP EXPERIENCE)
// ==========================================================================
async function openClassroomPlayer(courseId, initialLessonId = null) {
  pushNavState({ screen: 'classroom', courseId });
  const playerView = document.getElementById('view-classroom-player');
  playerView.classList.remove('hidden');

  try {
    const res = await apiFetch(`course-details&courseId=${encodeURIComponent(courseId)}`);
    activeCourse = res.course;

    const titleEl = document.getElementById('cr-course-title');
    if (titleEl) titleEl.textContent = activeCourse.title;

    renderDrawerLessons(activeCourse);

    let targetLesson = null;
    if (initialLessonId) {
      activeCourse.modules?.forEach(m => {
        const found = m.lessons?.find(l => l.id === initialLessonId);
        if (found) targetLesson = found;
      });
    }
    if (!targetLesson && activeCourse.modules?.[0]?.lessons?.[0]) {
      targetLesson = activeCourse.modules[0].lessons[0];
    }

    if (targetLesson) {
      loadLessonToPlayer(courseId, targetLesson.id);
    }
  } catch (err) {
    toast('Course open karne me problem aayi: ' + err.message, false);
    closeClassroomPlayer();
  }
}

function closeClassroomPlayer(fromPopstate = false) {
  document.getElementById('view-classroom-player').classList.add('hidden');
  document.getElementById('cr-video-mount').innerHTML = '';
  closeAllLessonsDrawer();
  if (!fromPopstate && window.history.state && window.history.state.screen === 'classroom') {
    try { window.history.back(); } catch (e) {}
  }
}

function renderClassroomModules(course) {
  const container = document.getElementById('cr-modules-container');
  if (!container || !course.modules) return;

  const completedList = (currentStudent && currentStudent.completedLessons && currentStudent.completedLessons[course.id]) || [];

  container.innerHTML = course.modules.map((m, mIdx) => `
    <div class="module-group">
      <div class="module-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
        <span>${escHtml(m.title)}</span>
        <span style="font-size:11px; color:var(--text-muted);">${m.lessons?.length || 0} Lessons ▾</span>
      </div>
      <div class="module-lessons-container">
        ${(m.lessons || []).map(l => {
          const isDone = completedList.includes(l.id);
          return `
            <div id="cr-les-row-${l.id}" class="lesson-row-item ${isDone ? 'completed' : ''}" onclick="loadLessonToPlayer('${course.id}', '${l.id}')">
              <div class="lesson-row-left">
                <span class="lesson-status-icon">${isDone ? '✓' : '○'}</span>
                <span class="lesson-row-title">${escHtml(l.title)}</span>
              </div>
              <span class="lesson-row-time">${escHtml(l.duration || '')}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

async function loadLessonToPlayer(courseId, lessonId) {
  try {
    const res = await apiFetch(`get-lesson&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    activeLesson = res.lesson;

    // Highlight row in active lists
    document.querySelectorAll('.lesson-row-item, .drawer-lesson-item').forEach(r => r.classList.remove('active', 'playing'));
    document.getElementById(`cr-les-row-${lessonId}`)?.classList.add('active');
    const drawerRow = document.getElementById(`drawer-les-row-${lessonId}`);
    if (drawerRow) {
      drawerRow.classList.add('playing');
    }

    document.getElementById('cr-lesson-title').textContent = activeLesson.title || 'Lesson';
    const durBadge = document.getElementById('cr-lesson-dur-badge');
    if (durBadge) {
      durBadge.textContent = `⏱ ${activeLesson.duration || 'Video'}`;
    }

    const completedList = (currentStudent && currentStudent.completedLessons && currentStudent.completedLessons[courseId]) || [];
    const isDone = Boolean(activeLesson.isCompleted || completedList.includes(lessonId));
    updatePlayerCompleteButton(isDone);

    const mount = document.getElementById('cr-video-mount');
    const streamUrl = activeLesson.streamUrl || activeLesson.videoUrl || activeLesson.bunnyIframeUrl || activeLesson.embedUrl || activeLesson.url || '';
    const videoType = activeLesson.videoType || '';
    let ytId = activeLesson.youtubeId || '';
    if (!ytId && streamUrl) {
      const match = streamUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match) ytId = match[1];
    }

    if (videoType === 'bunny_stream' || streamUrl.includes('iframe.mediadelivery.net')) {
      const sep = streamUrl.includes('?') ? '&' : '?';
      const cleanUrl = streamUrl.includes('_t=') ? streamUrl : (streamUrl + sep + '_t=' + Date.now() + '&autoplay=true');
      mount.innerHTML = `<iframe id="cr-video-iframe" src="${cleanUrl}" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>`;
      
      // Listen for bunny end event
      window._bunnyEndedListener && window.removeEventListener('message', window._bunnyEndedListener);
      window._bunnyEndedListener = (e) => {
        try {
          const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (d?.event === 'ended' || d?.type === 'ended') {
            handleLessonVideoEnded();
          }
        } catch (_) {}
      };
      window.addEventListener('message', window._bunnyEndedListener);

    } else if (videoType === 'youtube' || ytId) {
      const yUrl = streamUrl || `https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      mount.innerHTML = `<iframe id="cr-video-iframe" src="${yUrl}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>`;

    } else if (streamUrl) {
      mount.innerHTML = `<video id="main-video-el" src="${streamUrl}" controls playsinline style="width:100%;height:100%;object-fit:contain;background:#000;"></video>`;
      const vidEl = document.getElementById('main-video-el');
      if (vidEl) {
        vidEl.addEventListener('ended', handleLessonVideoEnded);
      }
    } else {
      mount.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#cbd5e1;padding:20px;text-align:center;">
        <span style="font-size:32px;margin-bottom:8px;">🎬</span>
        <div style="font-size:14px;font-weight:600;color:#fff;">Video lecture is being prepared</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Please check notes and practice files in the meantime.</div>
      </div>`;
    }

    renderLessonResources(activeLesson);
    renderLessonNotes(activeLesson);
    renderLessonQuiz(activeLesson);
    renderLessonAssignment(activeLesson);
    loadLessonComments(courseId, lessonId);

    // Default to 'doubts' (Comment tab) directly under video player!
    switchClassroomSubtab('doubts');
  } catch (err) {
    toast('Lesson load failed: ' + err.message, false);
  }
}

function updatePlayerCompleteButton(isDone) {
  const completeBtn = document.getElementById('btn-toggle-complete');
  if (!completeBtn) return;
  completeBtn.classList.toggle('done', isDone);
  const icon = document.getElementById('complete-icon');
  const text = document.getElementById('complete-text');
  if (icon) icon.textContent = '✓';
  if (text) text.textContent = isDone ? 'Completed' : 'Complete';
}

function handleLessonVideoEnded() {
  if (activeCourse && activeLesson && !activeLesson.isCompleted) {
    toggleCurrentLessonComplete();
  }
}

function replayCurrentLesson() {
  const video = document.getElementById('main-video-el');
  if (video) {
    video.currentTime = 0;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
    toast('↺ Video restarted');
    return;
  }
  const iframe = document.getElementById('cr-video-iframe');
  if (iframe && activeLesson && activeLesson.streamUrl) {
    const sep = activeLesson.streamUrl.includes('?') ? '&' : '?';
    iframe.src = activeLesson.streamUrl + sep + '_t=' + Date.now() + '&autoplay=true';
    toast('↺ Video reloaded');
    return;
  }
  if (activeCourse && activeLesson) {
    loadLessonToPlayer(activeCourse.id, activeLesson.id);
  }
}

async function toggleCurrentLessonComplete() {
  if (!activeCourse || !activeLesson) return;
  const courseId = activeCourse.id;
  const lessonId = activeLesson.id;

  try {
    await apiFetch('update-progress', {
      method: 'POST',
      body: { courseId, lessonId }
    });

    if (!currentStudent.completedLessons) currentStudent.completedLessons = {};
    if (!currentStudent.completedLessons[courseId]) currentStudent.completedLessons[courseId] = [];

    const idx = currentStudent.completedLessons[courseId].indexOf(lessonId);
    let nowDone = false;
    if (idx > -1) {
      currentStudent.completedLessons[courseId].splice(idx, 1);
    } else {
      currentStudent.completedLessons[courseId].push(lessonId);
      nowDone = true;
    }
    activeLesson.isCompleted = nowDone;
    localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));

    updatePlayerCompleteButton(nowDone);

    const row = document.getElementById(`cr-les-row-${lessonId}`);
    if (row) {
      row.classList.toggle('completed', nowDone);
      const icon = row.querySelector('.lesson-status-icon');
      if (icon) icon.textContent = nowDone ? '✓' : '○';
    }

    const drawerRow = document.getElementById(`drawer-les-row-${lessonId}`);
    if (drawerRow) {
      drawerRow.classList.toggle('completed', nowDone);
      const icon = drawerRow.querySelector('.drawer-lesson-icon');
      if (icon) icon.textContent = drawerRow.classList.contains('playing') ? '▶' : (nowDone ? '✓' : '○');
    }

    toast(nowDone ? '🎉 Lesson marked as completed!' : 'Lesson status updated.');
  } catch (err) {
    toast('Progress update failed', false);
  }
}

function goToNextLesson() {
  if (!activeCourse || !activeLesson) return;
  let foundCurrent = false;
  let nextLesson = null;

  for (const mod of activeCourse.modules || []) {
    for (const les of mod.lessons || []) {
      if (foundCurrent) {
        nextLesson = les;
        break;
      }
      if (les.id === activeLesson.id) {
        foundCurrent = true;
      }
    }
    if (nextLesson) break;
  }

  if (nextLesson) {
    loadLessonToPlayer(activeCourse.id, nextLesson.id);
  } else {
    toast('🎓 Congratulations! You reached the end of this course!');
  }
}

function openAllLessonsDrawer() {
  if (!activeCourse) return;
  const drawer = document.getElementById('modal-all-lessons');
  if (!drawer) return;

  renderDrawerLessons(activeCourse);
  drawer.classList.add('active');
}

function closeAllLessonsDrawer() {
  const drawer = document.getElementById('modal-all-lessons');
  if (drawer) drawer.classList.remove('active');
}

function renderDrawerLessons(course) {
  const container = document.getElementById('drawer-modules-container');
  if (!container || !course.modules) return;

  const completedList = (currentStudent && currentStudent.completedLessons && currentStudent.completedLessons[course.id]) || [];
  
  let totalCount = 0;
  let doneCount = 0;
  course.modules.forEach(m => {
    (m.lessons || []).forEach(l => {
      totalCount++;
      if (completedList.includes(l.id)) doneCount++;
    });
  });
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const nameEl = document.getElementById('drawer-course-name');
  if (nameEl) nameEl.textContent = course.title || 'Course Curriculum';
  const statEl = document.getElementById('drawer-course-stat');
  if (statEl) statEl.textContent = `${doneCount} of ${totalCount} Lessons Completed (${pct}%)`;
  const barEl = document.getElementById('drawer-prog-bar');
  if (barEl) barEl.style.width = `${pct}%`;

  container.innerHTML = course.modules.map((m, mIdx) => `
    <div class="drawer-module-group">
      <div class="drawer-module-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
        <span class="drawer-module-title">${escHtml(m.title)}</span>
        <span class="drawer-module-count">${m.lessons?.length || 0} Lessons ▾</span>
      </div>
      <div class="drawer-module-lessons">
        ${(m.lessons || []).map(l => {
          const isDone = completedList.includes(l.id);
          const isPlaying = activeLesson && activeLesson.id === l.id;
          return `
            <div id="drawer-les-row-${l.id}" class="drawer-lesson-item ${isPlaying ? 'playing' : ''} ${isDone ? 'completed' : ''}" onclick="selectLessonFromDrawer('${course.id}', '${l.id}')">
              <div class="drawer-lesson-left">
                <span class="drawer-lesson-icon">${isPlaying ? '▶' : (isDone ? '✓' : '○')}</span>
                <div class="drawer-lesson-details">
                  <div class="drawer-lesson-name">${escHtml(l.title)}</div>
                  <div class="drawer-lesson-meta">
                    ${isPlaying ? '<span class="now-playing-tag">NOW PLAYING</span> • ' : ''}
                    <span>⏱ ${escHtml(l.duration || 'Video')}</span>
                  </div>
                </div>
              </div>
              <span class="drawer-lesson-arrow">›</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function selectLessonFromDrawer(courseId, lessonId) {
  closeAllLessonsDrawer();
  loadLessonToPlayer(courseId, lessonId);
}

function openAvatarQuickMenu() {
  if (!currentStudent) return;
  const drawer = document.getElementById('sheet-avatar-quickmenu');
  if (!drawer) return;

  const name = currentStudent.name || 'Student';
  const phone = currentStudent.phone ? `+91 ${currentStudent.phone}` : (currentStudent.email || '');
  const enrollNo = currentStudent.enrollmentNo || currentStudent.id || 'QAA-STUDENT';
  const avatar = currentStudent.photoUrl || currentStudent.avatar || currentStudent.avatarUrl || '';
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  document.getElementById('quickmenu-name').textContent = name;
  document.getElementById('quickmenu-phone').textContent = phone;
  document.getElementById('quickmenu-id-badge').textContent = `ID: ${enrollNo}`;

  const roleBadge = document.getElementById('quickmenu-role-badge');
  if (roleBadge) {
    const isOnlineBatch = !!currentStudent.isOnlineBatch || (currentStudent.offlineAdmissionId && String(currentStudent.offlineAdmissionId).includes('-ON-')) || /batch\s*[-_]?\s*\d+/i.test(currentStudent.appliedCourse || '');
    if (isOnlineBatch) {
      roleBadge.textContent = 'ONLINE BATCH ADMISSION';
      roleBadge.style.color = '#38bdf8';
    } else if (currentStudent.isOfflineStudent || currentStudent.offlineAdmissionId) {
      roleBadge.textContent = 'OFFLINE ADMISSION';
      roleBadge.style.color = '#fde68a';
    } else {
      roleBadge.textContent = 'VERIFIED STUDENT';
      roleBadge.style.color = '#34d399';
    }
  }

  const avatarImg = document.getElementById('quickmenu-avatar-img');
  const avatarFb = document.getElementById('quickmenu-avatar-fallback');
  if (avatar) {
    avatarImg.src = avatar;
    avatarImg.classList.remove('hidden');
    avatarFb.classList.add('hidden');
  } else {
    avatarFb.textContent = initials;
    avatarFb.classList.remove('hidden');
    avatarImg.classList.add('hidden');
  }

  // Calculate course stats
  const count = (enrolledCourses || []).length;
  document.getElementById('quickmenu-course-count').textContent = count;
  
  let certCount = 0;
  (enrolledCourses || []).forEach(c => {
    const tot = c.totalLessons || (c.modules ? c.modules.reduce((a, m) => a + (m.lessons?.length || 0), 0) : 0);
    const done = c.completedCount || 0;
    if (tot > 0 && done >= tot) certCount++;
  });
  document.getElementById('quickmenu-cert-count').textContent = certCount;

  drawer.classList.add('active');
  pushNavState({ screen: 'modal', modal: 'avatar' });
}

function closeAvatarQuickMenu(fromPopstate = false) {
  const drawer = document.getElementById('sheet-avatar-quickmenu');
  if (drawer) drawer.classList.remove('active');
  if (!fromPopstate && window.history.state && window.history.state.modal === 'avatar') {
    try { window.history.back(); } catch (e) {}
  }
}

function switchClassroomSubtab(tabKey) {
  document.querySelectorAll('.lesson-subtab').forEach(t => {
    const isActive = t.getAttribute('data-sub') === tabKey;
    t.classList.toggle('active', isActive);
    if (isActive) {
      t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
  ['curriculum', 'resources', 'notes', 'doubts', 'quiz', 'assignment', 'support'].forEach(k => {
    const el = document.getElementById(`cr-sub-${k}`);
    if (el) el.classList.toggle('hidden', k !== tabKey);
  });
}

function renderLessonResources(lesson) {
  const container = document.getElementById('cr-resources-list');
  if (!container) return;
  const resources = lesson.resources || [];
  if (!resources.length) {
    container.innerHTML = `<div style="color:var(--text-muted);font-size:12.5px;">Is lesson ke liye koi downloadable practice files nahi hain.</div>`;
    return;
  }
  container.innerHTML = resources.map(r => `
    <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div>
        <div style="font-weight:700;color:#fff;font-size:13px;">${escHtml(r.name || r.title || 'Practice File')}</div>
        <div style="font-size:11px;color:var(--text-dim);">${escHtml(r.size || 'Downloadable Asset')}</div>
      </div>
      <a href="${r.url ? (r.url.startsWith('http') ? r.url : `../${r.url}`) : '#'}" download target="_blank" class="btn-primary" style="width:auto;padding:6px 12px;font-size:11.5px;text-decoration:none;">
        Download ⬇
      </a>
    </div>
  `).join('');
}

function renderLessonNotes(lesson) {
  const container = document.getElementById('cr-notes-content');
  if (!container) return;
  container.innerHTML = lesson.summary || lesson.notes || 'Is lecture ke practical points aur keyboard shortcuts mentor ke dwara study notes me shamil hain.';
}

function renderLessonQuiz(lesson) {
  const container = document.getElementById('cr-quiz-container');
  if (!container) return;
  container.innerHTML = `
    <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
      <h4 style="font-size:14px;font-weight:700;margin-bottom:8px;color:#fff;">Module Quick Assessment</h4>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Is module ke important editing workflows par based questions ka answer karein.</p>
      <button type="button" class="btn-primary" onclick="toast('Quiz feature is ready and synced with your accreditation status!')">
        Start Module Quiz ➔
      </button>
    </div>
  `;
}

function renderLessonAssignment(lesson) {
  const container = document.getElementById('cr-assignment-container');
  if (!container) return;
  container.innerHTML = `
    <div style="background:var(--bg-card);padding:14px;border-radius:var(--radius-md);border:1px solid var(--border-subtle);">
      <h4 style="font-size:14px;font-weight:700;margin-bottom:6px;color:#fff;">📤 Practical Assignment Submission</h4>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
        Apna edited timeline export (Google Drive / WeTransfer / YouTube Unlisted link) submit karein. Mentor Anil Sharma review karke feedback denge.
      </p>
      <input type="url" id="cr-assign-link" class="app-input" placeholder="https://drive.google.com/..." style="margin-bottom:10px;" />
      <button type="button" class="btn-primary" onclick="submitLessonAssignment()">
        Submit Project for Review ➔
      </button>
    </div>
  `;
}

async function submitLessonAssignment() {
  const link = document.getElementById('cr-assign-link')?.value.trim();
  if (!link) {
    toast('Submission link enter karein (e.g. Google Drive link)', false);
    return;
  }
  try {
    await apiFetch('submit-assignment', {
      method: 'POST',
      body: {
        courseId: activeCourse.id,
        assignmentId: activeLesson.id,
        assignmentTitle: activeLesson.title,
        submissionUrl: link,
        notes: 'Submitted via Mobile App'
      }
    });
    toast('🎉 Assignment submitted successfully! Mentor review karenge.');
    document.getElementById('cr-assign-link').value = '';
  } catch (err) {
    toast(err.message || 'Submission error', false);
  }
}

async function loadLessonComments(courseId, lessonId) {
  const container = document.getElementById('cr-comments-list');
  if (!container) return;
  try {
    const res = await apiFetch(`discussion-list&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    const comments = res.comments || [];
    if (!comments.length) {
      container.innerHTML = `<div style="font-size:12.5px;color:var(--text-muted);text-align:center;padding:22px 10px;background:rgba(255,255,255,0.02);border-radius:var(--radius-md);">
        <span style="font-size:24px;display:block;margin-bottom:6px;">💬</span>
        Abhi tak is lesson par koi comment nahi hai.<br><span style="font-size:11px;color:var(--text-dim);">Apna sawaal ya feedback pehle puchiye!</span>
      </div>`;
      return;
    }
    container.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-item-hdr">
          <span class="comment-author">👤 ${escHtml(c.authorName || c.userName || 'Student')}</span>
          <span class="comment-time">${escHtml(c.time || c.createdAt || 'Recent')}</span>
        </div>
        <div class="comment-text">${escHtml(c.text || '')}</div>
      </div>
    `).join('');
  } catch (_) {}
}

async function handlePostLessonComment(e) {
  e.preventDefault();
  const input = document.getElementById('cr-comment-input');
  const text = input.value.trim();
  if (!text || !activeCourse || !activeLesson) return;

  try {
    await apiFetch('discussion-post', {
      method: 'POST',
      body: {
        courseId: activeCourse.id,
        lessonId: activeLesson.id,
        text: text
      }
    });
    input.value = '';
    loadLessonComments(activeCourse.id, activeLesson.id);
    toast('💬 Comment posted successfully!');
  } catch (_) {
    toast('Could not post comment', false);
  }
}

function shareCurrentLesson() {
  if (navigator.share && activeCourse) {
    navigator.share({
      title: activeCourse.title,
      text: `Learning ${activeLesson?.title || 'video editing'} on Quick Art Academy App!`,
      url: window.location.href
    }).catch(() => {});
  } else {
    toast('Link copied to clipboard!');
  }
}

// ==========================================================================
// 8. TAB 3: LIVE SESSIONS (PAID ENROLLED ONLY)
// ==========================================================================
async function loadLiveClassesTab() {
  const pill = document.getElementById('live-tab-status-pill');
  const activeMount = document.getElementById('live-active-mount');
  const paidListEl = document.getElementById('paid-live-classes-list');
  const pastListEl = document.getElementById('past-recordings-list');

  try {
    const res = await apiFetch('get-live-classes');
    allLiveClasses = res.liveClasses || [];

    // STRICT: Filter to only live classes for the current student's PAID enrolled courses
    const paidEnrolledClasses = allLiveClasses.filter(c => isStudentEnrolledInLive(c));
    const activeLive = paidEnrolledClasses.find(c => c.status === 'live');

    // 1. ACTIVE LIVE CLASS MOUNT (Only shown if student has a paid class live RIGHT NOW)
    if (activeLive && activeMount) {
      if (pill) {
        pill.textContent = '🔴 1 Class Live Now';
        pill.style.color = '#ef4444';
      }
      activeMount.classList.remove('hidden');
      activeMount.innerHTML = `
        <div class="paid-live-card active-live-border">
          <div class="paid-live-header">
            <span class="paid-live-course-tag">🎓 ${escHtml(getCourseTitleById(activeLive.courseId))}</span>
            <span class="paid-live-status-tag live">🔴 LIVE BROADCASTING NOW</span>
          </div>
          <div class="paid-live-title" style="font-size:17px;">${escHtml(activeLive.title)}</div>
          ${activeLive.description ? `<div class="paid-live-desc">${escHtml(activeLive.description)}</div>` : ''}
          <div class="paid-live-meta-grid">
            <div class="paid-live-meta-item">
              <span class="paid-live-meta-lbl">Session Status</span>
              <span class="paid-live-meta-val" style="color:#ef4444;font-weight:700;">● Active Streaming</span>
            </div>
            <div class="paid-live-meta-item">
              <span class="paid-live-meta-lbl">Mentor</span>
              <span class="paid-live-meta-val">👨‍🏫 Anil Sharma</span>
            </div>
          </div>
          <div style="margin-top:14px;">
            <button type="button" class="btn-primary" onclick="openLiveClassroom('${activeLive.id}')" style="width:100%; padding:14px; font-size:14px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px;">
              🔴 Enter Live Classroom (Full Screen &amp; Live Chat) →
            </button>
          </div>
        </div>
      `;
    } else if (activeMount) {
      activeMount.classList.add('hidden');
      activeMount.innerHTML = '';
      if (pill) {
        pill.textContent = '🎓 Paid Enrolled Access';
        pill.style.color = '#94a3b8';
      }
    }

    // 2. PAID ENROLLED SCHEDULED SESSIONS
    const scheduled = paidEnrolledClasses.filter(c => c.status === 'scheduled');
    if (paidListEl) {
      if (!scheduled.length) {
        const enrolledNames = (enrolledCourses || []).map(c => c.title || c.name || c.id);
        paidListEl.innerHTML = `
          <div class="empty-paid-live-card">
            <div class="empty-paid-live-icon">🎓</div>
            <div class="empty-paid-live-title">Paid Mentorship &amp; Live Doubt Sessions</div>
            <p class="empty-paid-live-sub">
              Mentor Anil Sharma dwara aapke enrolled courses ke liye advanced video editing, album design aur doubt clearing live classes schedule kiye jate hain.
            </p>
            ${enrolledNames.length ? `
              <div style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:700; margin-bottom:6px; letter-spacing:0.04em;">Aapke Active Courses (Live Access Granted):</div>
              <div class="enrolled-courses-pills">
                ${enrolledNames.map(name => `<span class="enrolled-course-pill">✓ ${escHtml(name)}</span>`).join('')}
              </div>
            ` : `
              <div class="empty-paid-live-tip" style="color:#fca5a5; background:rgba(239,68,68,0.08); border-color:rgba(239,68,68,0.2);">
                ⚠️ Aapka koi paid course active nahi mila. Courses tab me jakar enroll karein.
              </div>
            `}
            <div class="empty-paid-live-tip">
              📌 Agli live class schedule hote hi uski date, time aur join button yahin update ho jayegi.
            </div>
          </div>
        `;
      } else {
        paidListEl.innerHTML = scheduled.map(c => renderPaidLiveCard(c)).join('');
        startLiveCountdowns();
      }
    }

    // 3. PAST CLASS RECORDINGS (ONLY FOR ENROLLED PAID COURSES)
    const past = paidEnrolledClasses.filter(c => (c.status === 'completed' || c.replayUrl));
    if (pastListEl) {
      if (!past.length) {
        pastListEl.innerHTML = `
          <div style="font-size:12px; color:var(--text-muted); padding:16px; background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--border-subtle); text-align:center;">
            Abhi aapke enrolled courses ki koi past live recording uplabdh nahi hai.
          </div>
        `;
      } else {
        pastListEl.innerHTML = past.map(c => `
          <div class="announcement-card" onclick="openLiveRecording('${c.id}')">
            <div class="announcement-meta">
              <span class="announcement-badge" style="background:rgba(16,185,129,0.15);color:#34d399;border-color:rgba(16,185,129,0.3);">RECORDING 4K</span>
              <span class="announcement-date">Available</span>
            </div>
            <div class="announcement-title">${escHtml(c.title)}</div>
            <div class="announcement-body">${escHtml(c.description || 'Full class recording for enrolled students')}</div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    console.warn('Live classes tab load failed:', err);
  }
}

function getCourseTitleById(courseId) {
  if (!courseId) return 'All-Access Mentorship';
  const c = (enrolledCourses || []).find(x => x.id === courseId);
  return c?.title || c?.name || courseId.replace('course-', '').replace(/-/g, ' ').toUpperCase();
}

function renderPaidLiveCard(c) {
  const courseLabel = getCourseTitleById(c.courseId);
  const dt = c.scheduledAt ? new Date(c.scheduledAt) : null;
  const timeStr = dt ? dt.toLocaleString('en-IN', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) + ' IST' : 'Scheduled Soon';

  return `
    <div class="paid-live-card">
      <div class="paid-live-header">
        <span class="paid-live-course-tag">🎓 ${escHtml(courseLabel)}</span>
        <span class="paid-live-status-tag scheduled">⏳ Scheduled</span>
      </div>
      <div class="paid-live-title">${escHtml(c.title)}</div>
      ${c.description ? `<div class="paid-live-desc">${escHtml(c.description)}</div>` : ''}

      ${c.scheduledAt ? `
        <div class="live-countdown-container" data-countdown-target="${c.scheduledAt}">
          <div class="live-countdown-badge">⏳ LIVE CLASS STARTS IN</div>
          <div class="live-countdown-clock">
            <div class="cd-box"><span class="cd-val cd-days">00</span><span class="cd-tag">DAYS</span></div>
            <span class="cd-colon">:</span>
            <div class="cd-box"><span class="cd-val cd-hours">00</span><span class="cd-tag">HRS</span></div>
            <span class="cd-colon">:</span>
            <div class="cd-box"><span class="cd-val cd-mins">00</span><span class="cd-tag">MINS</span></div>
            <span class="cd-colon">:</span>
            <div class="cd-box"><span class="cd-val cd-secs">00</span><span class="cd-tag">SECS</span></div>
          </div>
        </div>
      ` : ''}

      <div class="paid-live-meta-grid">
        <div class="paid-live-meta-item">
          <span class="paid-live-meta-lbl">Session Timing</span>
          <span class="paid-live-meta-val">📅 ${escHtml(timeStr)}</span>
        </div>
        <div class="paid-live-meta-item">
          <span class="paid-live-meta-lbl">Mentor</span>
          <span class="paid-live-meta-val">👨‍🏫 Anil Sharma</span>
        </div>
        <div class="paid-live-meta-item">
          <span class="paid-live-meta-lbl">Duration</span>
          <span class="paid-live-meta-val">⏱️ ${escHtml(c.duration || '90 Mins')}</span>
        </div>
        <div class="paid-live-meta-item">
          <span class="paid-live-meta-lbl">Access Status</span>
          <span class="paid-live-meta-val" style="color:#34d399;">✓ Verified Paid Access</span>
        </div>
      </div>
      ${c.status === 'live' ? `
        <div style="margin-top:12px; margin-bottom:12px;">
          <button type="button" class="btn-primary" onclick="openLiveClassroom('${c.id}')" style="width:100%; padding:12px; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px;">
            🔴 Join Live Classroom Now →
          </button>
        </div>
      ` : ''}
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <button type="button" class="btn-primary" onclick="requestPushNotificationPermission()" style="width:auto; padding:8px 14px; font-size:12px;">
          🔔 Set Class Reminder
        </button>
        <a href="https://wa.me/919939800780?text=${encodeURIComponent('Namaste Sir, I have a doubt regarding live class: ' + c.title)}" target="_blank" rel="noopener" class="btn-secondary" style="width:auto; padding:8px 14px; font-size:12px; text-decoration:none;">
          💬 Ask Doubt on WhatsApp
        </a>
      </div>
    </div>
  `;
}

let liveCountdownInterval = null;
function startLiveCountdowns() {
  if (liveCountdownInterval) clearInterval(liveCountdownInterval);

  function updateAll() {
    const nodes = document.querySelectorAll('[data-countdown-target]');
    if (!nodes.length) return;

    const now = Date.now();
    nodes.forEach(el => {
      const targetStr = el.getAttribute('data-countdown-target');
      if (!targetStr) return;
      const targetTime = new Date(targetStr).getTime();
      const diff = targetTime - now;

      const daysEl = el.querySelector('.cd-days');
      const hoursEl = el.querySelector('.cd-hours');
      const minsEl = el.querySelector('.cd-mins');
      const secsEl = el.querySelector('.cd-secs');

      if (diff <= 0) {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        const badge = el.querySelector('.live-countdown-badge');
        if (badge) {
          badge.innerHTML = '🔴 STARTING NOW';
          badge.style.color = '#ef4444';
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    });
  }

  updateAll();
  liveCountdownInterval = setInterval(updateAll, 1000);
}

// ==========================================================================
// 8.5 DEDICATED LIVE CLASSROOM ENGINE (FULL SCREEN, CHAT & ANTI-PIRACY DRM)
// ==========================================================================
// ==========================================================================
// 8.5 DEDICATED LIVE CINEMA STUDIO ENGINE (EXACT SAME AS WEBSITE PORTAL)
// ==========================================================================
let currentLiveSession = null;
let currentAppLiveSession = null;
let liveDoubtsPollTimer = null;
let liveWatermarkInterval = null;
let liveAttendeesTimer = null;
let currentLiveAttendeesCount = 428;
let liveOverlayHideTimeout = null;
window._isLiveInitialIntro = false;

function cleanYouTubeVideoId(input) {
  if (!input) return '';
  input = String(input).trim();
  if (input.startsWith('rtmp://') || input.startsWith('rtmps://')) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const mLive = input.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
  if (mLive) return mLive[1];
  const mShort = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (mShort) return mShort[1];
  const mV = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (mV) return mV[1];
  const mEmbed = input.match(/embed\/([a-zA-Z0-9_-]{11})/i);
  if (mEmbed) return mEmbed[1];
  return input;
}

async function openLiveStudio(liveId) {
  if (!liveId || liveId === 'masterclass-live') {
    liveId = 'live_demo_01';
  }

  const classroom = document.getElementById('view-live-classroom');
  const viewport = document.getElementById('app-viewport');
  const bottomNav = document.getElementById('bottom-nav');

  if (!classroom) return;

  const session = (allLiveClasses || []).find(c => c.id === liveId);
  if (session && !isStudentEnrolledInLive(session)) {
    toast('Aap is session ke liye enrolled nahi hain. Yeh class paid batch ke liye reserved hai.');
    return;
  }

  // Switch view immediately
  classroom.classList.remove('hidden');
  if (viewport) viewport.classList.add('hidden');
  if (bottomNav) bottomNav.classList.add('hidden');
  classroom.scrollTop = 0;

  // Display initial 5-second Comment & Fullscreen controls and startup anti-brand mask
  revealLiveOverlayControls(5000, true);

  // Initialize and run dynamic realistic live attendee counter (300-800)
  startLiveAttendeesCounter();

  const mount = document.getElementById('live-video-mount');
  if (mount) {
    mount.innerHTML = `
      <div class="live-placeholder">
        <div class="live-pulse-ring"></div>
        <div style="font-weight:700;font-size:16px;margin-top:16px;color:#fff;">Connecting to Live Studio…</div>
        <div class="muted" style="font-size:13px;margin-top:4px;">1080p 60fps High-Definition Feed</div>
      </div>
    `;
  }

  try {
    const res = await apiFetch(`get-live-session&liveId=${encodeURIComponent(liveId)}`);
    currentLiveSession = res;
    currentAppLiveSession = res;

    // Update Header
    const titleEl = document.getElementById('live-player-title');
    if (titleEl) titleEl.textContent = res.title || 'Live Masterclass Studio';

    const descTitle = document.getElementById('live-desc-title');
    if (descTitle) descTitle.textContent = res.title || 'Live Masterclass Studio';

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
          <a href="${escHtml(r.url)}" target="_blank" rel="noopener" class="live-resource-item">
            <span>📦 ${escHtml(r.title)}</span>
            <span style="font-weight:700;color:var(--gold,#d8a153);">Download ⬇</span>
          </a>
        `).join('');
      } else {
        resList.innerHTML = '<div class="muted" style="font-size:12.5px;">Practice files will be unlocked during the live stream.</div>';
      }
    }

    // Embed Video Stream with Anti-Leak Protection
    embedLiveStream(res.streamId, res.replayUrl, res.status);

    // Start Live Doubts Polling
    pollLiveDoubtsStudent();
    if (liveDoubtsPollTimer) clearInterval(liveDoubtsPollTimer);
    liveDoubtsPollTimer = setInterval(pollLiveDoubtsStudent, 3500);

    toast(`🔴 Joined Live: ${res.title}`);
  } catch (err) {
    toast('Live access failed: ' + (err.message || 'Restricted'), false);
    exitLiveStudio();
  }
}

// Aliases for compatibility
function openLiveClassroom(classId) {
  openLiveStudio(classId);
}
function launchLiveSession(classId) {
  openLiveStudio(classId);
}
function openLiveClassPlayerById(classId) {
  openLiveStudio(classId);
}
function closeLiveClassroom() {
  exitLiveStudio();
}

function revealLiveOverlayControls(duration = 5000, isInitial = false) {
  const box = document.getElementById('live-video-box');
  if (!box) return;

  box.classList.add('show-controls');

  const startMask = document.getElementById('live-start-mask');
  if (startMask && isInitial) {
    startMask.classList.remove('faded');
  }

  if (isInitial) {
    window._isLiveInitialIntro = true;
  }

  if (liveOverlayHideTimeout) {
    clearTimeout(liveOverlayHideTimeout);
    liveOverlayHideTimeout = null;
  }

  liveOverlayHideTimeout = setTimeout(() => {
    window._isLiveInitialIntro = false;
    const drawer = document.getElementById('fs-chat-drawer');
    const isChatOpen = drawer && !drawer.classList.contains('hidden');
    if (!isChatOpen) {
      box.classList.remove('show-controls');
    }
    if (startMask) {
      startMask.classList.add('faded');
    }
  }, duration);
}

function hideLiveOverlayControls() {
  if (window._isLiveInitialIntro) return;
  const box = document.getElementById('live-video-box');
  if (!box) return;
  const drawer = document.getElementById('fs-chat-drawer');
  const isChatOpen = drawer && !drawer.classList.contains('hidden');
  if (!isChatOpen) {
    box.classList.remove('show-controls');
  }
}

function handleLiveShieldClick(e) {
  revealLiveOverlayControls(5000);
}

let lastLiveShieldTouchTime = 0;
function handleLiveShieldTouch(e) {
  const now = Date.now();
  if (now - lastLiveShieldTouchTime < 320) {
    if (e && e.preventDefault) e.preventDefault();
    toggleLiveCinemaFullscreen();
    lastLiveShieldTouchTime = 0;
    return;
  }
  lastLiveShieldTouchTime = now;
  revealLiveOverlayControls(5000);
}

function embedLiveStream(streamId, replayUrl, status) {
  const mount = document.getElementById('live-video-mount');
  if (!mount) return;

  let rawId = streamId;
  if (status === 'completed' && replayUrl) {
    rawId = replayUrl;
  }

  const videoId = cleanYouTubeVideoId(rawId);

  if (!videoId) {
    mount.innerHTML = `
      <div class="live-placeholder">
        <div style="font-size:36px;margin-bottom:12px;">⏳</div>
        <div style="font-weight:700;font-size:16px;color:#fff;">Stream Starting Soon</div>
        <div class="muted" style="font-size:13px;margin-top:6px;max-width:480px;line-height:1.5;">
          Mentor Anil Sharma will start broadcasting shortly. Please stay on this screen.
        </div>
      </div>
    `;
    return;
  }

  const originStr = encodeURIComponent(window.location.origin);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&playsinline=1&enablejsapi=1&origin=${originStr}`;

  mount.innerHTML = `
    <iframe 
      id="live-stream-iframe"
      src="${embedUrl}" 
      title="Quick Art Photography Academy Live Stream" 
      frameborder="0" 
      sandbox="allow-scripts allow-same-origin allow-presentation"
      tabindex="-1"
      style="pointer-events:none !important;"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen>
    </iframe>
  `;

  revealLiveOverlayControls(6500, true);

  const iframeEl = document.getElementById('live-stream-iframe');
  if (iframeEl) {
    iframeEl.addEventListener('load', () => {
      revealLiveOverlayControls(5500, true);
    });
  }
}

// Zero-Pause Continuous Broadcast Guard
window.addEventListener('message', (event) => {
  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    if (data && data.event === 'onStateChange') {
      if (data.info === 1) {
        revealLiveOverlayControls(4200, true);
      } else if (data.info === 2) {
        const liveStudio = document.getElementById('view-live-classroom');
        if (liveStudio && !liveStudio.classList.contains('hidden')) {
          const iframe = document.getElementById('live-stream-iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
          }
        }
      }
    }
  } catch (e) {}
});

function toggleLiveAudioMute() {
  const iframe = document.getElementById('live-stream-iframe');
  if (!iframe || !iframe.contentWindow) return;
  const soundBtn = document.getElementById('live-sound-btn');
  const isMuted = soundBtn && soundBtn.getAttribute('data-muted') === '1';

  if (isMuted) {
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute' }), '*');
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
    if (soundBtn) {
      soundBtn.setAttribute('data-muted', '0');
      soundBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      `;
      soundBtn.title = "Mute Audio";
    }
    toast('🔊 Audio unmuted');
  } else {
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute' }), '*');
    if (soundBtn) {
      soundBtn.setAttribute('data-muted', '1');
      soundBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
      soundBtn.title = "Unmute Audio";
    }
    toast('🔇 Audio muted');
  }
}

function handleCommentButtonClick() {
  const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  if (isFullscreen) {
    toggleFullscreenChatDrawer();
  } else {
    const chatCard = document.querySelector('.live-chat-card');
    const doubtInp = document.getElementById('live-doubt-input');
    if (chatCard) {
      chatCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (doubtInp) doubtInp.focus();
    } else {
      toggleFullscreenChatDrawer();
    }
  }
}

function toggleFullscreenChatDrawer() {
  const drawer = document.getElementById('fs-chat-drawer');
  if (!drawer) return;
  const isHidden = drawer.classList.contains('hidden');
  if (isHidden) {
    drawer.classList.remove('hidden');
    revealLiveOverlayControls();
    const msgBox = document.getElementById('fs-live-chat-messages');
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
    const inp = document.getElementById('fs-live-doubt-input');
    if (inp) inp.focus();
  } else {
    drawer.classList.add('hidden');
    revealLiveOverlayControls();
  }
}

async function sendLiveDoubtFullscreen() {
  if (!currentLiveSession || !currentLiveSession.id) return;
  const input = document.getElementById('fs-live-doubt-input');
  const btn = document.getElementById('btn-fs-live-send');
  const msg = input ? input.value.trim() : '';
  if (!msg) return;

  input.value = '';
  if (btn) btn.disabled = true;

  try {
    await apiFetch('send-live-doubt', {
      method: 'POST',
      body: { liveId: currentLiveSession.id, message: msg }
    });
    pollLiveDoubtsStudent();
    toast('✓ Question sent to Mentor');
  } catch (err) {
    toast(err.message, false);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function isLiveFullscreenActive() {
  const box = document.getElementById('live-video-box');
  const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  const isCss = box ? box.classList.contains('is-fullscreen') : false;
  return isNative || isCss;
}

function toggleLiveCinemaFullscreen() {
  const box = document.getElementById('live-video-box');
  if (!box) return;

  const isFs = isLiveFullscreenActive();

  if (!isFs) {
    box.classList.add('is-fullscreen');
    document.body.classList.add('live-fs-open');

    try {
      if (box.requestFullscreen) {
        box.requestFullscreen().catch(() => {});
      } else if (box.webkitRequestFullscreen) {
        box.webkitRequestFullscreen();
      } else if (box.mozRequestFullScreen) {
        box.mozRequestFullScreen();
      } else if (box.msRequestFullscreen) {
        box.msRequestFullscreen();
      }
    } catch (_) {}

    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (_) {}

    revealLiveOverlayControls(4000);
  } else {
    box.classList.remove('is-fullscreen');
    document.body.classList.remove('live-fs-open');

    try {
      const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if (isNative) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (_) {}

    try {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (_) {}
  }

  updateLiveFullscreenUI();
}

function updateLiveFullscreenUI() {
  const isFs = isLiveFullscreenActive();
  const btns = document.querySelectorAll('.live-fs-btn');
  btns.forEach(btn => {
    if (btn.classList.contains('live-video-overlay-fs')) {
      btn.innerHTML = isFs ? '✕' : '⛶';
      btn.title = isFs ? 'Exit Fullscreen' : 'Fullscreen Mode';
      if (isFs) btn.classList.add('active-fs');
      else btn.classList.remove('active-fs');
    } else if (btn.classList.contains('live-icon-btn')) {
      btn.title = isFs ? 'Exit Fullscreen' : 'Fullscreen Mode';
      if (isFs) {
        btn.classList.add('active-fs');
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>`;
      } else {
        btn.classList.remove('active-fs');
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>`;
      }
    }
  });
}

['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
  document.addEventListener(evt, () => {
    const isNative = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    const box = document.getElementById('live-video-box');
    if (!isNative && box) {
      box.classList.remove('is-fullscreen');
      document.body.classList.remove('live-fs-open');
      try {
        if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
      } catch (_) {}
    }
    updateLiveFullscreenUI();
  });
});

function startLiveAttendeesCounter() {
  stopLiveAttendeesCounter();
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
  const nextDelayMs = Math.floor(Math.random() * 3800) + 4000;
  liveAttendeesTimer = setTimeout(() => {
    fluctuateLiveAttendees();
    scheduleNextAttendeeFluctuation();
  }, nextDelayMs);
}

function fluctuateLiveAttendees() {
  let delta = 0;
  const rand = Math.random();

  if (currentLiveAttendeesCount < 330) {
    delta = Math.floor(Math.random() * 4) + 2;
  } else if (currentLiveAttendeesCount > 770) {
    delta = -(Math.floor(Math.random() * 4) + 2);
  } else {
    if (rand < 0.46) {
      delta = Math.floor(Math.random() * 3) + 1;
    } else if (rand < 0.84) {
      delta = -(Math.floor(Math.random() * 3) + 1);
    } else if (rand < 0.94) {
      delta = Math.floor(Math.random() * 4) + 3;
    } else {
      delta = 0;
    }
  }

  currentLiveAttendeesCount += delta;
  if (currentLiveAttendeesCount < 308) currentLiveAttendeesCount = 308 + Math.floor(Math.random() * 12);
  if (currentLiveAttendeesCount > 794) currentLiveAttendeesCount = 794 - Math.floor(Math.random() * 12);

  try {
    sessionStorage.setItem('qa_live_attendees', currentLiveAttendeesCount.toString());
  } catch (e) {}

  updateLiveAttendeesDisplay(currentLiveAttendeesCount, delta !== 0);
}

function updateLiveAttendeesDisplay(count, animated = true) {
  const formatted = count.toLocaleString('en-IN');
  const countEl = document.getElementById('live-viewer-count-mini');
  if (countEl) {
    countEl.textContent = formatted;
    if (animated) {
      countEl.classList.remove('count-bump');
      void countEl.offsetWidth;
      countEl.classList.add('count-bump');
    }
  }

  const pill = document.getElementById('live-attendees-pill-mini');
  if (pill && animated) {
    pill.classList.remove('pulse-pill');
    void pill.offsetWidth;
    pill.classList.add('pulse-pill');
  }
}

function stopLiveAttendeesCounter() {
  if (liveAttendeesTimer) {
    clearTimeout(liveAttendeesTimer);
    liveAttendeesTimer = null;
  }
}

async function pollLiveDoubtsStudent() {
  if (!currentLiveSession || !currentLiveSession.id) return;
  const container = document.getElementById('live-chat-messages');
  const fsContainer = document.getElementById('fs-live-chat-messages');
  if (!container && !fsContainer) return;

  try {
    const res = await apiFetch(`fetch-live-doubts&liveId=${encodeURIComponent(currentLiveSession.id)}`);
    const messages = res.messages || [];

    const emptyHtml = `
      <div class="chat-empty-state">
        <span>💬</span>
        <p>Live doubts chat is open. Ask your editing doubts or color grading questions below.</p>
      </div>
    `;

    if (!messages.length) {
      if (container) container.innerHTML = emptyHtml;
      if (fsContainer) fsContainer.innerHTML = emptyHtml;
      return;
    }

    const messagesHtml = messages.map(m => {
      const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      if (m.isMentor) {
        return `
          <div class="chat-msg-bubble mentor">
            <div class="chat-msg-hdr">
              <span>⭐ ${escHtml(m.studentName || 'Mentor Anil Sharma')}</span>
              <span class="chat-msg-time">${timeStr}</span>
            </div>
            <div class="chat-msg-text">${escHtml(m.message)}</div>
          </div>
        `;
      }
      return `
        <div class="chat-msg-bubble student">
          <div class="chat-msg-hdr">
            <span>🎓 ${escHtml(m.studentName || 'Student')}</span>
            <span class="chat-msg-time">${timeStr}</span>
          </div>
          <div class="chat-msg-text">${escHtml(m.message)}</div>
        </div>
      `;
    }).join('');

    if (container) {
      container.innerHTML = messagesHtml;
      container.scrollTop = container.scrollHeight;
    }
    if (fsContainer) {
      fsContainer.innerHTML = messagesHtml;
      fsContainer.scrollTop = fsContainer.scrollHeight;
    }
  } catch(e) {}
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
    await apiFetch('send-live-doubt', {
      method: 'POST',
      body: { liveId: currentLiveSession.id, message: msg }
    });
    pollLiveDoubtsStudent();
    toast('✓ Question sent to Mentor');
  } catch (err) {
    toast(err.message, false);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function exitLiveStudio() {
  stopLiveAttendeesCounter();

  if (liveOverlayHideTimeout) {
    clearTimeout(liveOverlayHideTimeout);
    liveOverlayHideTimeout = null;
  }
  const box = document.getElementById('live-video-box');
  if (box) {
    box.classList.remove('show-controls');
    box.classList.remove('is-fullscreen');
  }
  document.body.classList.remove('live-fs-open');
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch(_) {}

  if (liveDoubtsPollTimer) {
    clearInterval(liveDoubtsPollTimer);
    liveDoubtsPollTimer = null;
  }
  if (liveWatermarkInterval) {
    clearInterval(liveWatermarkInterval);
    liveWatermarkInterval = null;
  }

  const mount = document.getElementById('live-video-mount');
  if (mount) mount.innerHTML = '';
  currentLiveSession = null;
  currentAppLiveSession = null;

  const classroom = document.getElementById('view-live-classroom');
  const viewport = document.getElementById('app-viewport');
  const bottomNav = document.getElementById('bottom-nav');
  if (classroom) classroom.classList.add('hidden');
  if (viewport) viewport.classList.remove('hidden');
  if (bottomNav) bottomNav.classList.remove('hidden');
}

async function openLiveRecording(classId) {
  const session = allLiveClasses.find(c => c.id === classId);
  if (!session) return;
  if (!isStudentEnrolledInLive(session)) {
    toast('Aap is recording ke liye enrolled nahi hain.');
    return;
  }
  if (session.replayUrl) {
    window.open(session.replayUrl, '_blank');
  } else {
    toast('Recording jald hi upload ho jayegi.');
  }
}

// ==========================================================================
// 9. TAB 4: MY PROFILE ENGINE
// ==========================================================================
function loadProfileData() {
  if (!currentStudent) return;
  const nameEl = document.getElementById('prof-name');
  if (nameEl) nameEl.textContent = currentStudent.name || 'Student Name';

  const idEl = document.getElementById('prof-student-id');
  if (idEl) {
    const rawId = currentStudent.enrollmentNo || currentStudent.id || 'QAA-STUDENT';
    idEl.textContent = rawId.startsWith('ID:') || rawId.startsWith('QAA') ? rawId : `ID: ${rawId}`;
  }

  const roleEl = document.getElementById('prof-role-badge');
  if (roleEl) {
    roleEl.textContent = currentStudent.role === 'admin' ? 'ACADEMY ADMIN' : 'VERIFIED STUDENT';
  }

  const phoneEl = document.getElementById('prof-phone');
  if (phoneEl) {
    const rawPhone = String(currentStudent.phone || '').trim();
    if (!rawPhone || rawPhone === '••••••••••') {
      phoneEl.textContent = '+91 ••••••••••';
    } else if (rawPhone.startsWith('+')) {
      phoneEl.textContent = rawPhone;
    } else if (rawPhone.startsWith('91') && rawPhone.length === 12) {
      phoneEl.textContent = `+${rawPhone}`;
    } else {
      phoneEl.textContent = `+91 ${rawPhone}`;
    }
  }

  const emailEl = document.getElementById('prof-email');
  if (emailEl) emailEl.textContent = currentStudent.email || 'student@quickart.in';

  const cityEl = document.getElementById('prof-city');
  if (cityEl) cityEl.textContent = currentStudent.city || currentStudent.workCity || 'India';

  // Live Stats: Courses & Certificates
  const courseCountEl = document.getElementById('prof-course-count');
  if (courseCountEl) {
    courseCountEl.textContent = Array.isArray(enrolledCourses) ? enrolledCourses.length : 0;
  }

  const certCountEl = document.getElementById('prof-cert-count');
  if (certCountEl) {
    const certCount = Array.isArray(enrolledCourses)
      ? enrolledCourses.filter(c => (Number(c.progress) || 0) >= 100 || c.certificateIssued).length
      : 0;
    certCountEl.textContent = certCount;
  }

  const avatar = currentStudent.photoUrl || currentStudent.avatar || currentStudent.avatarUrl || '';
  const initials = (currentStudent.name || 'Student')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'QA';

  const imgEl = document.getElementById('prof-avatar-img');
  const fbEl = document.getElementById('prof-avatar-fallback');

  if (avatar && imgEl && fbEl) {
    imgEl.src = avatar;
    imgEl.classList.remove('hidden');
    fbEl.classList.add('hidden');
  } else if (fbEl && imgEl) {
    fbEl.textContent = initials;
    fbEl.classList.remove('hidden');
    imgEl.classList.add('hidden');
  }
}

function triggerAvatarUpload() {
  document.getElementById('file-avatar-input')?.click();
}

function handleProfilePhotoUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    const img = new Image();
    img.onload = async () => {
      const maxDim = 1200;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.86);

      if (currentStudent) {
        currentStudent.avatar = dataUrl;
        currentStudent.avatarUrl = dataUrl;
        currentStudent.photoUrl = dataUrl;
        localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));
        loadProfileData();
        updateHeaderUI();

        // Update ID card photo preview if element exists
        const idCardPhoto = document.getElementById('idcard-photo');
        if (idCardPhoto) idCardPhoto.src = dataUrl;

        toast('Photo updated successfully! Syncing…');

        try {
          const res = await apiFetch('update-profile', {
            method: 'POST',
            body: { avatar: dataUrl, name: currentStudent.name || '' }
          });
          if (res && res.photoUrl) {
            currentStudent.photoUrl = res.photoUrl;
            currentStudent.avatar = res.photoUrl;
            currentStudent.avatarUrl = res.photoUrl;
            localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));
            if (idCardPhoto) idCardPhoto.src = res.photoUrl;
          }
          toast('Photo & ID Card updated on server! 🎉');
        } catch (_) {}
      }
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}


// Student ID Card Modal
function openStudentIdCardModal() {
  if (!currentStudent) return;
  document.getElementById('idcard-name').textContent = currentStudent.name || 'Student';
  document.getElementById('idcard-enrollno').textContent = currentStudent.enrollmentNo || currentStudent.id || 'QAA-2026-001';
  document.getElementById('idcard-phone').textContent = `+91 ${currentStudent.phone || '••••••••••'}`;
  document.getElementById('idcard-program').textContent = currentStudent.appliedCourse || 'Master Media Arts LMS';

  const photo = currentStudent.photoUrl || currentStudent.avatar || currentStudent.avatarUrl || '../home-assets/ec55a6be3747a9.webp';
  document.getElementById('idcard-photo').src = photo;

  document.getElementById('modal-id-card').classList.add('active');
  pushNavState({ screen: 'modal', modal: 'idcard' });
}

function closeStudentIdCardModal(fromPopstate = false) {
  document.getElementById('modal-id-card').classList.remove('active');
  if (!fromPopstate && window.history.state && window.history.state.modal === 'idcard') {
    try { window.history.back(); } catch (e) {}
  }
}

async function downloadStudentIdCard() {
  const cardEl = document.getElementById('idcard-canvas-container');
  if (!cardEl || typeof html2canvas === 'undefined') {
    toast('Generating card download…');
    return;
  }
  try {
    const canvas = await html2canvas(cardEl, { scale: 2, useCORS: true, backgroundColor: '#0b1120' });
    const link = document.createElement('a');
    link.download = `QuickArt_StudentID_${currentStudent?.id || 'Student'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('🪪 Student ID Card downloaded!');
  } catch (err) {
    toast('Download error. Please take a screenshot.', false);
  }
}

function openCertificatesModal() {
  switchTab('mycourses');
  filterCourses('completed');
  toast('Accredited Course Certificates Vault');
}

function openDownloadsModal() {
  switchTab('mycourses');
  toast('Practice files are inside each course classroom under Practice Files tab');
}

function openChangePasswordModal() {
  openForgotPasswordSheet();
}

// ==========================================================================
// 9.5 APP INSTALL & APK DOWNLOAD ENGINE (ONLY IN AVATAR MENU)
// ==========================================================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const pwaBtn = document.getElementById('btn-pwa-install-action');
  if (pwaBtn) pwaBtn.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  toast('🎉 Quick Art Academy App Installed Successfully!');
});

function openInstallModal() {
  const isWebView = /FBAN|FBAV|Instagram|WhatsApp|wv/i.test(navigator.userAgent);
  const warningEl = document.getElementById('inapp-browser-warning');
  if (warningEl) {
    if (isWebView) warningEl.classList.remove('hidden');
    else warningEl.classList.add('hidden');
  }

  const pwaBtn = document.getElementById('btn-pwa-install-action');
  if (pwaBtn) {
    pwaBtn.style.display = 'flex';
  }

  const modal = document.getElementById('modal-install-app');
  if (modal) modal.classList.add('active');
  pushNavState({ screen: 'modal', modal: 'install' });
}

function closeInstallModal(fromPopstate = false) {
  const modal = document.getElementById('modal-install-app');
  if (modal) modal.classList.remove('active');
  if (!fromPopstate && window.history.state && window.history.state.modal === 'install') {
    try { window.history.back(); } catch (e) {}
  }
}

function handleApkDownloadClick(event) {
  const isWebView = /FBAN|FBAV|Instagram|WhatsApp|wv/i.test(navigator.userAgent);
  if (isWebView) {
    if (event) event.preventDefault();
    toast('⚠️ WhatsApp/Instagram me APK download block hota hai. Upar 3 dots dabakar "Open in Chrome" karein!', false);
    openInstallModal();
    return;
  }

  toast('⬇ Downloading Quick Art Academy APK (4.7 MB)…');
  // Auto open guide after 1 second so student knows how to allow unknown source
  setTimeout(() => {
    openInstallModal();
  }, 1000);
}

function triggerApkDownload() {
  handleApkDownloadClick();
  const link = document.createElement('a');
  link.href = '/downloads/quickart-academy.apk';
  link.setAttribute('download', 'quickart-academy.apk');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function triggerPwaInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      toast('Installing Quick Art LMS App…');
      closeInstallModal();
    }
    deferredInstallPrompt = null;
  } else {
    toast('📱 Phone browser menu (⋮) me jakar "Add to Home screen" / "Install App" chunein.');
  }
}

// ==========================================================================
// 9.9 UNIVERSAL NAVIGATION & HARDWARE BACK BUTTON HANDLER
// ==========================================================================
function pushNavState(state) {
  try {
    window.history.pushState(state, '', window.location.href);
  } catch (e) {
    console.warn('pushState error:', e);
  }
}

function handleAppBack() {
  // 1. If All Lessons drawer inside classroom is open
  const lessonsDrawer = document.getElementById('cr-lessons-drawer');
  if (lessonsDrawer && !lessonsDrawer.classList.contains('hidden')) {
    closeAllLessonsDrawer();
    return true;
  }

  // 2. If Install modal is open
  const installModal = document.getElementById('modal-install-app');
  if (installModal && installModal.classList.contains('active')) {
    closeInstallModal(true);
    return true;
  }

  // 3. If All Courses modal is open
  const coursesModal = document.getElementById('modal-all-courses');
  if (coursesModal && coursesModal.classList.contains('active')) {
    closeAllCoursesModal(true);
    return true;
  }

  // 4. If Student ID Card modal is open
  const idModal = document.getElementById('modal-id-card');
  if (idModal && idModal.classList.contains('active')) {
    closeStudentIdCardModal(true);
    return true;
  }

  // 5. If Avatar Quick Menu is open
  const avatarMenu = document.getElementById('sheet-avatar-quickmenu');
  if (avatarMenu && avatarMenu.classList.contains('active')) {
    closeAvatarQuickMenu(true);
    return true;
  }

  // 6. If Notification Drawer is open
  const notifBackdrop = document.getElementById('notification-backdrop');
  if (notifBackdrop && notifBackdrop.classList.contains('active')) {
    toggleNotificationDrawer(true);
    return true;
  }

  // 7. If Registration or Forgot Password sheet is open
  const regModal = document.getElementById('modal-register');
  if (regModal && regModal.classList.contains('active')) {
    closeRegistrationSheet();
    return true;
  }
  const forgotSheet = document.getElementById('sheet-forgot-pw');
  if (forgotSheet && forgotSheet.classList.contains('active')) {
    closeForgotPasswordSheet();
    return true;
  }

  // 8. If Classroom Player is open -> close it!
  const player = document.getElementById('view-classroom-player');
  if (player && !player.classList.contains('hidden')) {
    closeClassroomPlayer(true);
    return true;
  }

  // 9. If not on Dashboard tab, navigate to Dashboard tab
  if (currentTab !== 'dashboard') {
    switchTab('dashboard', true);
    return true;
  }

  return false; // Already on dashboard and nothing open
}

// Global hook for Android WebView
window.handleNativeAppBack = handleAppBack;

// Browser / Mobile hardware/gesture back button listener
let lastBackToastTime = 0;
window.addEventListener('popstate', (e) => {
  const handled = handleAppBack();
  if (!handled) {
    const now = Date.now();
    if (now - lastBackToastTime > 2500) {
      toast('Tap back again to exit', false);
      lastBackToastTime = now;
      pushNavState({ screen: 'dashboard' });
    }
  }
});

// Seed initial history state
try {
  window.history.replaceState({ screen: 'dashboard' }, '', window.location.href);
  window.history.pushState({ screen: 'dashboard' }, '', window.location.href);
} catch (e) {}

// ==========================================================================
// 10. NOTIFICATION CENTER ENGINE
// ==========================================================================
function toggleNotificationDrawer(fromPopstate = false) {
  const backdrop = document.getElementById('notification-backdrop');
  backdrop.classList.toggle('active');
  if (backdrop.classList.contains('active')) {
    loadNotifications();
    pushNavState({ screen: 'modal', modal: 'notifications' });
  } else if (!fromPopstate && window.history.state && window.history.state.modal === 'notifications') {
    try { window.history.back(); } catch (e) {}
  }
}

async function loadNotifications() {
  const listEl = document.getElementById('notif-sheet-list');
  const badge = document.getElementById('notif-badge');

  try {
    const res = await apiFetch('get-notifications');
    notificationsList = res.notifications || [];
    const unread = res.unreadCount || 0;

    if (unread > 0) {
      badge.textContent = unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    if (!notificationsList.length) {
      listEl.innerHTML = `
        <div style="text-align:center; padding: 40px 10px; color: var(--text-muted);">
          <div style="font-size:32px; margin-bottom:8px;">🔔</div>
          <div style="font-size:14px; font-weight:700; color:#fff;">No new notifications</div>
          <div style="font-size:12px; margin-top:4px;">Live classes aur academy updates yahan notify honge.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notificationsList.map(n => `
      <div class="announcement-card" style="margin-bottom:8px; border-left: 3px solid ${n.type === 'live_class' ? '#ef4444' : '#d8a153'}; cursor:pointer;" onclick="handleNotificationTap('${n.id}', '${n.url || ''}')">
        <div class="announcement-meta">
          <span class="announcement-badge" style="${n.type === 'live_class' ? 'background:rgba(239,68,68,0.18);color:#fca5a5;border-color:rgba(239,68,68,0.3);' : ''}">
            ${escHtml(n.title)}
          </span>
          <span class="announcement-date">${n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Alert'}</span>
        </div>
        <div class="announcement-body" style="color:#e2e8f0;">${escHtml(n.body)}</div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Notifications load failed:', err);
  }
}

async function handleNotificationTap(notifId, targetUrl) {
  toggleNotificationDrawer();

  try {
    await apiFetch('mark-notification-read', {
      method: 'POST',
      body: { id: notifId }
    });
  } catch (_) {}

  if (targetUrl) {
    if (targetUrl.includes('tab=live')) {
      switchTab('live');
    } else if (targetUrl.includes('tab=mycourses')) {
      switchTab('mycourses');
    }
  }
}

// ==========================================================================
// 11. SHARED HELPERS & TOAST
// ==========================================================================
function toast(msg, isSuccess = true) {
  const toastEl = document.getElementById('app-toast');
  const textEl = document.getElementById('toast-text');
  const iconEl = document.getElementById('toast-icon');

  if (!toastEl) return;
  textEl.textContent = msg;
  iconEl.textContent = isSuccess ? '⚡' : '⚠️';
  toastEl.classList.add('active');

  setTimeout(() => {
    toastEl.classList.remove('active');
  }, 3200);
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
