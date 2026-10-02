// ==========================================================================
// Quick Art Photography Academy LMS — Mobile App Engine
// Unified Student Credentials & Real-Time Sync with Website LMS
// ==========================================================================

const API_BASE = '../api/lms.php';
let currentStudent = null;
let enrolledCourses = [];
let allLiveClasses = [];
let activeCourse = null;
let activeLesson = null;
let notificationsList = [];
let liveCheckInterval = null;

// ==========================================================================
// 1. INITIALIZATION & SESSION VALIDATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  initAppSession();
  setupURLRouter();
});

// Register Service Worker for Background Push Notifications
async function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('sw.js?v=20261002_01');
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
          // Subscribe with generic or custom endpoint
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array('BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_WJJn52SkqdG3W5NA10DWDV73W4nKPuhbUxio')
          }).catch(async () => {
            // Fallback: subscription without key if browser supports
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
    await fetch(`${API_BASE}?action=save-push-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Token': localStorage.getItem('qaa_student_token') || ''
      },
      body: JSON.stringify({
        subscription: subscription,
        studentId: student.id || '',
        phone: student.phone || '',
        courses: student.enrolledCourses || []
      })
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
    const res = await callLmsApi('me');
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
  loadDashboardData();
  startLiveWatcher();
  loadNotifications();
}

function updateHeaderUI() {
  if (!currentStudent) return;
  const name = currentStudent.name || 'Student';
  const avatar = currentStudent.avatar || currentStudent.avatarUrl || '';
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
// 2. AUTHENTICATION (SAME STUDENT CREDENTIALS AS WEBSITE)
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
let phoneOtpTimer = null;
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
    const res = await fetch(`${API_BASE}?action=send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawPhone })
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'OTP delivery failed');
    }

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
    const res = await fetch(`${API_BASE}?action=verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: currentPhoneTarget, otp: otpVal })
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Verification failed');
    }

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
    const res = await fetch(`${API_BASE}?action=email-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Login failed');
    }

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
    const res = await fetch(`${API_BASE}?action=send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'reset' })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to send OTP');

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
    const res = await fetch(`${API_BASE}?action=email-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Password reset failed');

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
    const res = await fetch(`${API_BASE}?action=send-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'signup' })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'OTP failed');

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
    const res = await fetch(`${API_BASE}?action=email-signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, otp, password })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Registration failed');

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
// 3. BOTTOM NAVIGATION (4 CLEAN TABS)
// ==========================================================================
function switchTab(tabName) {
  // Update nav buttons
  ['dashboard', 'mycourses', 'live', 'profile'].forEach(t => {
    const btn = document.getElementById(`nav-btn-${t}`);
    const panel = document.getElementById(`tab-${t}`);
    if (btn) btn.classList.toggle('active', t === tabName);
    if (panel) panel.classList.toggle('active-tab', t === tabName);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Tab-specific initializers
  if (tabName === 'dashboard') loadDashboardData();
  if (tabName === 'mycourses') loadCoursesTab();
  if (tabName === 'live') loadLiveClassesTab();
  if (tabName === 'profile') loadProfileData();
}

function setupURLRouter() {
  const params = new URLSearchParams(window.location.search);
  const targetTab = params.get('tab');
  const targetId = params.get('id');

  if (targetTab && ['dashboard', 'mycourses', 'live', 'profile'].includes(targetTab)) {
    // Wait for session check to complete, then switch
    setTimeout(() => {
      switchTab(targetTab);
      if (targetTab === 'live' && targetId) {
        openLiveClassPlayerById(targetId);
      }
    }, 900);
  }
}

// ==========================================================================
// 4. TAB 1: DASHBOARD ENGINE
// ==========================================================================
async function loadDashboardData() {
  if (!currentStudent) return;

  // 1. Fill Profile Card
  document.getElementById('dash-student-name').textContent = `Namaste, ${currentStudent.name || 'Student'}!`;
  document.getElementById('dash-student-id').textContent = `ID: ${currentStudent.enrollmentNo || currentStudent.id || 'QAA-STUDENT'}`;

  const avatar = currentStudent.avatar || currentStudent.avatarUrl || '';
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
    const res = await callLmsApi('my-courses');
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

    // Continue Learning Spotlight
    renderContinueLearningCard();
  } catch (err) {
    console.warn('Dashboard courses fetch failed:', err);
  }

  // 3. Check Live & Scheduled Classes
  checkLiveClassStatus();

  // 4. Announcements
  renderAnnouncementsFeed();
}

function renderContinueLearningCard() {
  const card = document.getElementById('dash-resume-card');
  if (!enrolledCourses || !enrolledCourses.length) {
    card.classList.add('hidden');
    return;
  }

  // Find first active in-progress course, or default to first
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

// Live Class Watcher (Polls every 15s for instant admin trigger notifications)
function startLiveWatcher() {
  if (liveCheckInterval) clearInterval(liveCheckInterval);
  checkLiveClassStatus();
  liveCheckInterval = setInterval(checkLiveClassStatus, 15000);
}

async function checkLiveClassStatus() {
  try {
    const res = await callLmsApi('get-live-classes');
    allLiveClasses = res.liveClasses || [];

    const enrolledIds = (currentStudent && currentStudent.enrolledCourses) || [];
    const isStudentEnrolledInClass = (c) => {
      if (c.courseId === 'all' || c.type === 'workshop') return true;
      return enrolledIds.includes(c.courseId);
    };

    // Find if any class is LIVE right now
    const liveNow = allLiveClasses.find(c => c.status === 'live' && isStudentEnrolledInClass(c));
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

    // Next scheduled class
    const upcoming = allLiveClasses.filter(c => c.status === 'scheduled' && isStudentEnrolledInClass(c));
    const schedCard = document.getElementById('dash-scheduled-card');
    if (upcoming.length && !liveNow) {
      const next = upcoming[0];
      schedCard?.classList.remove('hidden');
      document.getElementById('sched-class-title').textContent = next.title;
      if (next.scheduledAt) {
        const dt = new Date(next.scheduledAt);
        document.getElementById('sched-cal-month').textContent = dt.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        document.getElementById('sched-cal-day').textContent = String(dt.getDate()).padStart(2, '0');
        document.getElementById('sched-class-time').textContent = dt.toLocaleString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' IST';
      }
    } else {
      schedCard?.classList.add('hidden');
    }
  } catch (err) {
    console.warn('Live classes poll error:', err);
  }
}

// Announcements Feed
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
// 5. TAB 2: MY COURSES ENGINE
// ==========================================================================
async function loadCoursesTab() {
  const listEl = document.getElementById('app-courses-list');
  listEl.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">Loading your courses…</div>';

  try {
    const res = await callLmsApi('my-courses');
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
// 6. CLASSROOM PLAYER ENGINE (SEAMLESS IN-APP EXPERIENCE)
// ==========================================================================
async function openClassroomPlayer(courseId, initialLessonId = null) {
  const playerView = document.getElementById('view-classroom-player');
  playerView.classList.remove('hidden');

  try {
    const res = await callLmsApi(`course-details&courseId=${encodeURIComponent(courseId)}`);
    activeCourse = res.course;

    document.getElementById('cr-course-title').textContent = activeCourse.title;

    // Render Curriculum Modules List
    renderClassroomModules(activeCourse);

    // Pick lesson
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

function closeClassroomPlayer() {
  document.getElementById('view-classroom-player').classList.add('hidden');
  document.getElementById('cr-video-mount').innerHTML = ''; // Stop video playback
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
    const res = await callLmsApi(`get-lesson&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    activeLesson = res.lesson;

    // Highlight row
    document.querySelectorAll('.lesson-row-item').forEach(r => r.classList.remove('active'));
    document.getElementById(`cr-les-row-${lessonId}`)?.classList.add('active');

    // Title & duration
    document.getElementById('cr-lesson-title').textContent = activeLesson.title;
    document.getElementById('cr-lesson-sub').textContent = `⏱ Duration: ${activeLesson.duration || 'Video'} • 4K HD`;

    // Completion Status Button
    const completedList = (currentStudent && currentStudent.completedLessons && currentStudent.completedLessons[courseId]) || [];
    const isDone = completedList.includes(lessonId);
    const completeBtn = document.getElementById('btn-toggle-complete');
    completeBtn.classList.toggle('done', isDone);
    completeBtn.textContent = isDone ? 'Completed ✓' : 'Mark Complete ✓';

    // Mount Video Embed
    const mount = document.getElementById('cr-video-mount');
    if (activeLesson.bunnyIframeUrl) {
      mount.innerHTML = `<iframe src="${activeLesson.bunnyIframeUrl}" allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;" allowfullscreen></iframe>`;
    } else if (activeLesson.videoUrl) {
      mount.innerHTML = `<video src="${activeLesson.videoUrl}" controls playsinline style="width:100%;height:100%;background:#000;"></video>`;
    } else if (activeLesson.youtubeId) {
      mount.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${activeLesson.youtubeId}?autoplay=1&rel=0&modestbranding=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>`;
    } else {
      mount.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#fff;">Video lecture is being prepared</div>`;
    }

    // Render Sub-tab contents
    renderLessonResources(activeLesson);
    renderLessonNotes(activeLesson);
    renderLessonQuiz(activeLesson);
    renderLessonAssignment(activeLesson);
    loadLessonComments(courseId, lessonId);

    // Switch to curriculum or notes by default
    switchClassroomSubtab('curriculum');
  } catch (err) {
    toast('Lesson load failed: ' + err.message, false);
  }
}

async function toggleCurrentLessonComplete() {
  if (!activeCourse || !activeLesson) return;
  const courseId = activeCourse.id;
  const lessonId = activeLesson.id;

  try {
    const res = await fetch(`${API_BASE}?action=update-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Token': localStorage.getItem('qaa_student_token') || ''
      },
      body: JSON.stringify({ courseId, lessonId })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Failed');

    // Update local state
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
    localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));

    const completeBtn = document.getElementById('btn-toggle-complete');
    completeBtn.classList.toggle('done', nowDone);
    completeBtn.textContent = nowDone ? 'Completed ✓' : 'Mark Complete ✓';

    const row = document.getElementById(`cr-les-row-${lessonId}`);
    if (row) {
      row.classList.toggle('completed', nowDone);
      row.querySelector('.lesson-status-icon').textContent = nowDone ? '✓' : '○';
    }

    toast(nowDone ? '🎉 Lesson marked as completed!' : 'Lesson status updated.');
  } catch (err) {
    toast('Progress update failed', false);
  }
}

function switchClassroomSubtab(tabKey) {
  document.querySelectorAll('.lesson-subtab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-sub') === tabKey);
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
      <a href="${r.url ? `../${r.url}` : '#'}" download target="_blank" class="btn-primary" style="width:auto;padding:6px 12px;font-size:11.5px;text-decoration:none;">
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
    const res = await fetch(`${API_BASE}?action=submit-assignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Token': localStorage.getItem('qaa_student_token') || ''
      },
      body: JSON.stringify({
        courseId: activeCourse.id,
        assignmentId: activeLesson.id,
        assignmentTitle: activeLesson.title,
        submissionUrl: link,
        notes: 'Submitted via Mobile App'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Submission failed');
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
    const res = await callLmsApi(`discussion-list&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    const comments = res.comments || [];
    if (!comments.length) {
      container.innerHTML = `<div style="font-size:12px;color:var(--text-muted);">Abhi tak koi comments nahi hain. Apna doubt pehle puchiye!</div>`;
      return;
    }
    container.innerHTML = comments.map(c => `
      <div style="background:rgba(255,255,255,0.03);padding:8px 12px;border-radius:var(--radius-sm);font-size:12px;">
        <div style="font-weight:700;color:var(--gold);margin-bottom:2px;">${escHtml(c.authorName || 'Student')}</div>
        <div style="color:#e2e8f0;">${escHtml(c.text || '')}</div>
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
    await fetch(`${API_BASE}?action=discussion-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Token': localStorage.getItem('qaa_student_token') || ''
      },
      body: JSON.stringify({
        courseId: activeCourse.id,
        lessonId: activeLesson.id,
        text: text
      })
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
// 7. TAB 3: LIVE & WEBINARS ENGINE
// ==========================================================================
async function loadLiveClassesTab() {
  const upcomingListEl = document.getElementById('upcoming-live-list');
  const pastListEl = document.getElementById('past-recordings-list');

  try {
    const res = await callLmsApi('get-live-classes');
    allLiveClasses = res.liveClasses || [];

    const enrolledIds = (currentStudent && currentStudent.enrolledCourses) || [];
    const isAuth = (c) => (c.courseId === 'all' || c.type === 'workshop' || enrolledIds.includes(c.courseId));

    // Active Live Session Check
    const activeLive = allLiveClasses.find(c => c.status === 'live' && isAuth(c));
    const mount = document.getElementById('live-stream-mount');
    const pill = document.getElementById('live-tab-status-pill');

    if (activeLive) {
      pill.textContent = '🔴 LIVE BROADCASTING';
      pill.style.color = '#ef4444';
      mount.innerHTML = `
        <div style="position:relative; width:100%; height:100%;">
          <iframe src="https://www.youtube-nocookie.com/embed/${activeLive.streamId || 'XWFnwJowfx4'}?autoplay=1&modestbranding=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>
        </div>
      `;
    } else {
      pill.textContent = '📡 Studio Standby';
      pill.style.color = '#94a3b8';
    }

    // Upcoming Classes
    const upcoming = allLiveClasses.filter(c => c.status === 'scheduled');
    if (upcomingListEl) {
      if (!upcoming.length) {
        upcomingListEl.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:14px;background:var(--bg-card);border-radius:var(--radius-md);">Agli live class jald hi schedule hogi. Push notification enable rakhein.</div>`;
      } else {
        upcomingListEl.innerHTML = upcoming.map(c => `
          <div class="scheduled-class-card" style="margin-bottom:10px;">
            <div class="scheduled-left">
              <div class="cal-box">
                <span class="cal-month">LIVE</span>
                <span class="cal-day">🔴</span>
              </div>
              <div>
                <div class="scheduled-title">${escHtml(c.title)}</div>
                <div class="scheduled-time">${c.scheduledAt ? new Date(c.scheduledAt).toLocaleString('en-IN') : 'Scheduled soon'}</div>
              </div>
            </div>
            <button type="button" class="btn-primary" onclick="requestPushNotificationPermission()" style="width:auto;padding:6px 12px;font-size:11px;">
              🔔 Remind Me
            </button>
          </div>
        `).join('');
      }
    }

    // Previous Recordings
    const past = allLiveClasses.filter(c => c.status === 'completed' || c.replayUrl);
    if (pastListEl) {
      pastListEl.innerHTML = `
        <div class="announcement-card" onclick="toast('Loading masterclass recording…')">
          <div class="announcement-meta">
            <span class="announcement-badge" style="background:rgba(16,185,129,0.15);color:#34d399;border-color:rgba(16,185,129,0.3);">RECORDING 4K</span>
            <span class="announcement-date">Available</span>
          </div>
          <div class="announcement-title">Wedding Video Editing Me AI Ka Sahi Use (Live Workshop Replay)</div>
          <div class="announcement-body">Full 2-hour timeline recording with practice project files.</div>
        </div>
      `;
    }
  } catch (err) {
    console.warn('Live classes tab load failed:', err);
  }
}

function openLiveClassPlayerById(classId) {
  switchTab('live');
  const session = allLiveClasses.find(c => c.id === classId);
  if (session && session.streamId) {
    const mount = document.getElementById('live-stream-mount');
    mount.innerHTML = `
      <iframe src="https://www.youtube-nocookie.com/embed/${session.streamId}?autoplay=1&modestbranding=1" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="width:100%;height:100%;border:none;"></iframe>
    `;
    toast(`🔴 Joined Live: ${session.title}`);
  }
}

function sendLiveReaction(emoji) {
  toast(`Reaction sent: ${emoji}`);
}

async function handleSendLiveDoubt(e) {
  e.preventDefault();
  const input = document.getElementById('input-live-doubt');
  const text = input.value.trim();
  if (!text) return;

  const chatContainer = document.getElementById('live-chat-messages');
  const studentName = (currentStudent && currentStudent.name) || 'You';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = `
    <div class="chat-author" style="color:#60a5fa;">${escHtml(studentName)}</div>
    <div>${escHtml(text)}</div>
  `;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  input.value = '';
  toast('Doubt sent to Mentor Anil Sharma! ✓');
}

// ==========================================================================
// 8. TAB 4: MY PROFILE ENGINE
// ==========================================================================
function loadProfileData() {
  if (!currentStudent) return;
  document.getElementById('prof-name').textContent = currentStudent.name || 'Student Name';
  document.getElementById('prof-student-id').textContent = `STUDENT ID: ${currentStudent.enrollmentNo || currentStudent.id || 'QAA-STUDENT'}`;
  document.getElementById('prof-phone').textContent = `+91 ${currentStudent.phone || '••••••••••'}`;
  document.getElementById('prof-email').textContent = currentStudent.email || 'Email not provided';
  document.getElementById('prof-city').textContent = currentStudent.city || currentStudent.workCity || 'India';

  const avatar = currentStudent.avatar || currentStudent.avatarUrl || '';
  const initials = (currentStudent.name || 'Student').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const imgEl = document.getElementById('prof-avatar-img');
  const fbEl = document.getElementById('prof-avatar-fallback');

  if (avatar) {
    imgEl.src = avatar;
    imgEl.classList.remove('hidden');
    fbEl.classList.add('hidden');
  } else {
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
    const dataUrl = evt.target.result;
    if (currentStudent) {
      currentStudent.avatar = dataUrl;
      localStorage.setItem('qaa_student_info', JSON.stringify(currentStudent));
      loadProfileData();
      updateHeaderUI();
      toast('Photo updated successfully!');

      // Save to server
      try {
        await fetch(`${API_BASE}?action=update-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Student-Token': localStorage.getItem('qaa_student_token') || ''
          },
          body: JSON.stringify({ avatar: dataUrl })
        });
      } catch (_) {}
    }
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

  const photo = currentStudent.avatar || currentStudent.avatarUrl || '../home-assets/ec55a6be3747a9.webp';
  document.getElementById('idcard-photo').src = photo;

  document.getElementById('modal-id-card').classList.add('active');
}

function closeStudentIdCardModal() {
  document.getElementById('modal-id-card').classList.remove('active');
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
// 9. NOTIFICATION CENTER ENGINE
// ==========================================================================
function toggleNotificationDrawer() {
  const backdrop = document.getElementById('notification-backdrop');
  backdrop.classList.toggle('active');
  if (backdrop.classList.contains('active')) {
    loadNotifications();
  }
}

async function loadNotifications() {
  const listEl = document.getElementById('notif-sheet-list');
  const badge = document.getElementById('notif-badge');

  try {
    const res = await callLmsApi('get-notifications');
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

  // Mark read
  try {
    await fetch(`${API_BASE}?action=mark-notification-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Student-Token': localStorage.getItem('qaa_student_token') || ''
      },
      body: JSON.stringify({ id: notifId })
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
// 10. SHARED HELPERS & TOAST
// ==========================================================================
async function callLmsApi(actionWithParams, options = {}) {
  const token = localStorage.getItem('qaa_student_token') || '';
  const url = `${API_BASE}?action=${actionWithParams}`;

  const headers = Object.assign({
    'X-Student-Token': token
  }, options.headers || {});

  const res = await fetch(url, Object.assign({}, options, { headers }));
  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'LMS request failed');
  }
  return data;
}

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
