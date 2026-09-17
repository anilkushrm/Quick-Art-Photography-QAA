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
  const url = `../api/lms.php?action=${encodeURIComponent(action)}`;
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
  ['view-login', 'view-dashboard', 'view-classroom'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(`view-${viewName}`).classList.remove('hidden');

  const guestNav = document.getElementById('header-guest-nav');
  const userNav = document.getElementById('header-user-nav');

  if (viewName === 'login') {
    guestNav.classList.remove('hidden');
    userNav.classList.add('hidden');
  } else {
    guestNav.classList.add('hidden');
    userNav.classList.remove('hidden');
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
    document.getElementById('otp-phone-display').textContent = `+91 ${phone}`;
    
    // If dev/demo OTP is returned, display helper banner
    const devBanner = document.getElementById('dev-otp-banner');
    if (res.devOtp) {
      document.getElementById('dev-otp-val').textContent = res.devOtp;
      devBanner.classList.remove('hidden');
      document.getElementById('input-otp').value = res.devOtp;
    } else {
      devBanner.classList.add('hidden');
    }

    document.getElementById('form-phone').classList.add('hidden');
    document.getElementById('form-otp').classList.remove('hidden');
    document.getElementById('input-otp').focus();
    toast('OTP code sent successfully!');
  } catch (err) {
    toast(err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Send OTP Code <span aria-hidden="true">→</span>';
  }
});

function resetToPhoneStep() {
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
    toast('New OTP sent to your number!');
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
  switchView('login');
  toast('You have been logged out.');
}

// ---------- 2. Dashboard View ----------

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

    // Header User details
    const shortName = currentStudent.name.split(' ')[0];
    document.getElementById('nav-user-name').textContent = currentStudent.name;
    document.getElementById('nav-user-phone').textContent = `+91 ${currentStudent.phone}`;
    document.getElementById('nav-user-avatar').textContent = shortName.charAt(0).toUpperCase();

    // Dashboard greetings & stats
    document.getElementById('dash-greeting').textContent = `Namaste, ${shortName}!`;
    document.getElementById('stat-enrolled-count').textContent = meRes.stats.enrolledCoursesCount;
    document.getElementById('stat-completed-count').textContent = meRes.stats.completedLessonsCount;

    const courses = coursesRes.courses || [];
    document.getElementById('courses-count-label').textContent = `${courses.length} Active Courses`;

    if (courses.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1/-1; padding: 40px; text-align: center; background: var(--bg-card); border-radius: 20px;">
          <h3>No courses assigned yet</h3>
          <p class="muted" style="margin: 8px 0 20px;">Contact academy support at +91 9939800780 to activate your batch access.</p>
          <a href="../contact-us/index.html" class="btn btn-gold">Contact Academy Support →</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = courses.map(c => `
      <article class="course-card">
        <div class="course-thumb-wrap">
          <img src="../${c.thumbnail || 'assets/editing-timeline.jpg'}" alt="${escapeHtml(c.title)}" loading="lazy" />
          ${c.badge ? `<span class="course-badge">${escapeHtml(c.badge)}</span>` : ''}
        </div>
        <div class="course-card-body">
          <span class="course-cat">${escapeHtml(c.category || 'Course')}</span>
          <h3 class="course-card-title">${escapeHtml(c.title)}</h3>
          <p class="course-card-sub">${escapeHtml(c.subtitle || '')}</p>
          
          <div class="course-progress-block">
            <div class="course-progress-header">
              <span>${c.completedCount} of ${c.totalLessons} lessons completed</span>
              <span>${c.progressPercent}%</span>
            </div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" style="width: ${c.progressPercent}%"></div>
            </div>
          </div>

          <div class="course-card-footer">
            <button type="button" class="btn btn-gold" style="flex: 1" onclick="openCourseClassroom('${c.id}')">
              ${c.completedCount > 0 ? 'Resume Course →' : 'Start Learning →'}
            </button>
            ${c.isCompleted ? `
              <button type="button" class="btn btn-outline" onclick="openCertificateModalFromCard('${escapeHtml(c.title)}')">
                🎓 Certificate
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `).join('');

  } catch (err) {
    if (err.message.includes('login') || err.message.includes('expired')) {
      logoutStudent();
    } else {
      grid.innerHTML = `<div class="card" style="padding: 24px; color: var(--red);">Failed to load courses: ${err.message}</div>`;
    }
  }
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

    document.getElementById('player-course-category').textContent = (currentCourse.category || 'VIDEO EDITING').toUpperCase();
    document.getElementById('player-course-title').textContent = currentCourse.title;
    document.getElementById('player-progress-badge').textContent = `${currentCourse.progressPercent}% Complete`;

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
  try {
    const res = await lmsApi(`get-lesson&courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`);
    currentLesson = res.lesson;

    // Highlight active lesson in curriculum sidebar
    document.querySelectorAll('.lesson-list-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`nav-les-${lessonId}`);
    if (activeEl) activeEl.classList.add('active');

    // Title & duration
    document.getElementById('lesson-title').textContent = currentLesson.title;
    document.getElementById('lesson-duration-badge').textContent = `⏱ ${currentLesson.duration || 'Video'}`;

    // Mount Video Player
    const videoMount = document.getElementById('video-mount');
    videoMount.innerHTML = '';

    if (currentLesson.videoType === 'bunny_stream') {
      // Bunny.net Stream Iframe embed
      const iframe = document.createElement('iframe');
      iframe.src = currentLesson.streamUrl;
      iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      videoMount.appendChild(iframe);
    } else {
      // Standard video tag (MP4 / HLS)
      const video = document.createElement('video');
      video.src = currentLesson.streamUrl;
      video.controls = true;
      video.autoplay = false;
      video.playsInline = true;
      videoMount.appendChild(video);
    }

    // Configure Anti-Piracy Watermark
    const watermarkEl = document.getElementById('watermark-overlay');
    if (res.watermark?.enabled) {
      watermarkEl.classList.remove('hidden');
      document.getElementById('watermark-text').textContent = res.watermark.text;
    } else {
      watermarkEl.classList.add('hidden');
    }

    // Toggle Complete Button State
    updateCompleteBtnState(currentLesson.isCompleted);

    // Notes
    document.getElementById('lesson-notes-text').innerHTML = currentLesson.summary
      ? `<p>${escapeHtml(currentLesson.summary)}</p>`
      : '<p class="muted">No specific notes for this video. Follow along with your editor timeline.</p>';

    // Resources
    const resList = document.getElementById('lesson-resources-list');
    if (currentLesson.resources && currentLesson.resources.length > 0) {
      resList.innerHTML = currentLesson.resources.map(r => `
        <div class="resource-item">
          <span>📁 <b>${escapeHtml(r.name)}</b></span>
          <a href="${escapeHtml(r.url)}" download class="btn-sm btn-outline">Download File ⬇</a>
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

    toast(newState ? 'Lesson marked as completed! 🎉' : 'Lesson marked as uncompleted.');

    if (newState && pct < 100) {
      goToNextLesson();
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
    toast('You have reached the end of this course! 🎓');
    updateCertificateUnlockState();
  }
}

function updateCertificateUnlockState() {
  const box = document.getElementById('certificate-unlock-box');
  if (currentCourse && currentCourse.progressPercent >= 100) {
    box.classList.remove('hidden');
  } else {
    box.classList.add('hidden');
  }
}

// ---------- 4. Certificate Generator ----------

function openCertificateModal() {
  if (!currentCourse || !currentStudent) return;
  document.getElementById('cert-student-name').textContent = currentStudent.name || 'Student';
  document.getElementById('cert-course-name').textContent = currentCourse.title;
  document.getElementById('cert-date-val').textContent = new Date().toLocaleDateString('en-US', {
    month: 'long', year: 'numeric'
  });
  document.getElementById('cert-id-val').textContent = `ID: QAA-${currentCourse.id.slice(-6).toUpperCase()}-${currentStudent.phone.slice(-4)}`;
  document.getElementById('modal-certificate').classList.add('show');
}

function openCertificateModalFromCard(courseTitle) {
  if (!currentStudent) return;
  document.getElementById('cert-student-name').textContent = currentStudent.name || 'Student';
  document.getElementById('cert-course-name').textContent = courseTitle;
  document.getElementById('cert-date-val').textContent = new Date().toLocaleDateString('en-US', {
    month: 'long', year: 'numeric'
  });
  document.getElementById('cert-id-val').textContent = `ID: QAA-CERT-${currentStudent.phone.slice(-4)}`;
  document.getElementById('modal-certificate').classList.add('show');
}

function closeCertificateModal() {
  document.getElementById('modal-certificate').classList.remove('show');
}

// ---------- Video Playback Controls ----------

function setVideoSpeed(rate) {
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.speed-btn')).find(b => b.textContent.includes(`${rate}`));
  if (btn) btn.classList.add('active');

  const video = document.querySelector('#video-mount video');
  if (video) {
    video.playbackRate = rate;
    toast(`Speed: ${rate}x`);
  } else {
    // If iframe, postMessage for Bunny player if applicable
    const iframe = document.querySelector('#video-mount iframe');
    if (iframe) {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'setPlaybackRate', rate }), '*');
      toast(`Speed: ${rate}x`);
    }
  }
}

function skipVideo(delta) {
  const video = document.querySelector('#video-mount video');
  if (video) {
    video.currentTime = Math.max(0, video.currentTime + delta);
    toast(`${delta > 0 ? '+' : ''}${delta}s`);
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
    if (!selected) {
      allAnswered = false;
    } else if (parseInt(selected.value, 10) === q.answer) {
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
              <button type="button" class="btn btn-gold btn-block" onclick="closeCatalogModal(); openCheckoutModal('${c.id}')">
                Enroll Now →
              </button>
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

// ---------- 6. Instant Checkout Modal ----------

let activeCheckoutCourse = null;

async function openCheckoutModal(courseId) {
  try {
    const res = await fetch('../api/lms.php?action=catalog').then(r => r.json());
    const course = (res.catalog || []).find(c => c.id === courseId);
    if (!course) {
      toast('Course not found', false);
      return;
    }
    activeCheckoutCourse = course;

    document.getElementById('checkout-course-id').value = course.id;
    document.getElementById('checkout-course-title').textContent = course.title;
    document.getElementById('checkout-course-price').textContent = `₹${course.price.toLocaleString()}`;
    document.getElementById('checkout-course-orig').textContent = `₹${course.originalPrice.toLocaleString()}`;
    document.getElementById('btn-pay-amount').textContent = `₹${course.price.toLocaleString()}`;

    // Auto-fill student details if already logged in
    if (currentStudent) {
      document.getElementById('checkout-name').value = currentStudent.name || '';
      document.getElementById('checkout-phone').value = currentStudent.phone || '';
      document.getElementById('checkout-email').value = currentStudent.email || '';
    }

    document.getElementById('modal-checkout').classList.add('show');
  } catch (err) {
    toast(`Could not open checkout: ${err.message}`, false);
  }
}

function closeCheckoutModal() {
  document.getElementById('modal-checkout').classList.remove('show');
}

// Payment method option click
document.querySelectorAll('.pay-option').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
  });
});

// Checkout Form Submission
document.getElementById('form-checkout').addEventListener('submit', async (e) => {
  e.preventDefault();
  const courseId = document.getElementById('checkout-course-id').value;
  const name = document.getElementById('checkout-name').value.trim();
  const phone = document.getElementById('checkout-phone').value.replace(/\D/g, '');
  const email = document.getElementById('checkout-email').value.trim();
  const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'UPI';

  if (phone.length < 10) {
    toast('Please enter a valid 10-digit mobile number', false);
    return;
  }

  const btn = document.getElementById('btn-complete-enroll');
  btn.disabled = true;
  btn.textContent = 'Processing Enrollment…';

  try {
    const res = await fetch('../api/lms.php?action=checkout-enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, name, phone, email, paymentMethod })
    }).then(r => r.json());

    if (!res.ok) throw new Error(res.error || 'Enrollment failed');

    // Save student token & log in immediately
    studentToken = res.token;
    localStorage.setItem(TOKEN_KEY, studentToken);
    currentStudent = res.student;

    closeCheckoutModal();
    toast('🎉 Payment successful! Course unlocked.');

    // Open classroom directly
    await openCourseClassroom(courseId);

  } catch (err) {
    toast(`Payment error: ${err.message}`, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Pay <span id="btn-pay-amount">₹${activeCheckoutCourse?.price?.toLocaleString() || '4,999'}</span> &amp; Start Learning Now →`;
  }
});

// Lesson Tabs Switcher (Updated to include quiz)
document.querySelectorAll('.lesson-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.lesson-tab').forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    const target = e.target.dataset.ltab;
    ['notes', 'resources', 'quiz', 'support'].forEach(t => {
      const el = document.getElementById(`ltab-${t}`);
      if (el) el.classList.toggle('hidden', t !== target);
    });
    if (target === 'quiz' && currentCourse) {
      renderQuiz(currentCourse);
    }
  });
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function verifyCertificateById(certId) {
  try {
    const res = await fetch(`../api/lms.php?action=verify-certificate&id=${encodeURIComponent(certId)}`).then(r => r.json());
    if (res.ok && res.certificate && res.certificate.valid) {
      document.getElementById('cert-student-name').textContent = res.certificate.studentName || 'Student';
      document.getElementById('cert-course-name').textContent = res.certificate.courseTitle || 'Masterclass';
      document.getElementById('cert-date-val').textContent = 'Verified Official';
      document.getElementById('cert-id-val').textContent = `ID: ${res.certificate.certificateId}`;
      document.getElementById('modal-certificate').classList.add('show');
      toast('✅ Official Certificate Verified!');
    } else {
      toast(res.certificate?.message || 'Certificate ID invalid or not found', false);
      switchView('login');
    }
  } catch (err) {
    toast(`Verification failed: ${err.message}`, false);
    switchView('login');
  }
}

// ---------- Initial Bootstrap ----------

async function initStudentSession() {
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
    switchView('login');
    if (enrollParam) {
      openCheckoutModal(enrollParam);
    } else if (catalogParam) {
      openCatalogModal();
    }
    return;
  }

  try {
    await loadDashboard();
    if (courseParam) {
      await openCourseClassroom(courseParam);
    } else if (enrollParam) {
      openCheckoutModal(enrollParam);
    } else if (catalogParam) {
      openCatalogModal();
    }
  } catch (err) {
    logoutStudent();
    if (enrollParam) openCheckoutModal(enrollParam);
    else if (catalogParam) openCatalogModal();
  }
}

initStudentSession();

