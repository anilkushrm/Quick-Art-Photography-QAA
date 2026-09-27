// alumni/alumni.js — Official Alumni Directory & Video Testimonials Script

var currentAlumniList = [];
var activeCourseCategory = 'all';

document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('alm-cards-grid');
  var countMeta = document.getElementById('alm-count-meta');
  var searchInput = document.getElementById('alm-search-input');
  var cityFilter = document.getElementById('alm-city-filter');
  var categoryTabs = document.querySelectorAll('.alm-tab-btn');

  // Fetch verified alumni from API / JSON
  function fetchAlumni() {
    fetch('../api/lms.php?action=get-alumni')
      .then(function (res) {
        if (!res.ok) throw new Error('API failed');
        return res.json();
      })
      .then(function (data) {
        if (data.ok && Array.isArray(data.alumni) && data.alumni.length > 0) {
          currentAlumniList = data.alumni;
          renderAlumni();
        } else {
          loadFallbackAlumni();
        }
      })
      .catch(function () {
        loadFallbackAlumni();
      });
  }

  function loadFallbackAlumni() {
    fetch('../data/alumni.json')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (Array.isArray(data) && data.length > 0) {
          currentAlumniList = data;
        } else {
          currentAlumniList = getDefaultAlumniList();
        }
        renderAlumni();
      })
      .catch(function () {
        currentAlumniList = getDefaultAlumniList();
        renderAlumni();
      });
  }

  function renderAlumni() {
    var query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    var selectedCity = (cityFilter ? cityFilter.value : 'all');

    var filtered = currentAlumniList.filter(function (alm) {
      // 1. Text Search matching
      var nameMatch = (alm.name || '').toLowerCase().indexOf(query) !== -1;
      var studioMatch = (alm.studioName || '').toLowerCase().indexOf(query) !== -1;
      var cityMatch = (alm.city || '').toLowerCase().indexOf(query) !== -1;
      var roleMatch = (alm.role || '').toLowerCase().indexOf(query) !== -1;
      var matchesSearch = !query || nameMatch || studioMatch || cityMatch || roleMatch;

      // 2. City Filter
      var matchesCity = (selectedCity === 'all') || 
                        ((alm.city || '').toLowerCase().indexOf(selectedCity.toLowerCase()) !== -1) ||
                        ((alm.state || '').toLowerCase().indexOf(selectedCity.toLowerCase()) !== -1);

      // 3. Category Tab Filter
      var matchesCategory = true;
      if (activeCourseCategory !== 'all') {
        var catLower = activeCourseCategory.toLowerCase();
        var courseStr = (alm.course || '').toLowerCase();
        var roleStr = (alm.role || '').toLowerCase();
        var batchStr = (alm.batch || '').toLowerCase();
        matchesCategory = courseStr.indexOf(catLower) !== -1 || roleStr.indexOf(catLower) !== -1 || batchStr.indexOf(catLower) !== -1;
      }

      return matchesSearch && matchesCity && matchesCategory;
    });

    if (countMeta) {
      countMeta.textContent = 'Showing ' + filtered.length + ' certified ' + (filtered.length === 1 ? 'alumnus' : 'alumni');
    }

    if (!grid) return;
    grid.innerHTML = '';

    if (filtered.length === 0) {
      showEmptyState('No graduates match your search criteria. Try a different city or category.');
      return;
    }

    filtered.forEach(function (alm) {
      var card = document.createElement('div');
      card.className = 'alm-card';

      var photoSrc = alm.photo || '../assets/alumni/alumni_rahul_kumar.jpg';
      var studioText = alm.studioName ? escapeHtml(alm.studioName) : 'Independent Creative Studio';
      var roleText = alm.role ? escapeHtml(alm.role) : 'Certified Editor';
      var cityText = (alm.city ? escapeHtml(alm.city) : 'Siwan') + (alm.state ? ', ' + escapeHtml(alm.state) : '');
      var batchText = alm.batch ? escapeHtml(alm.batch) : '14-Week Studio Batch';
      var certId = alm.certId || 'QAA-2025-VERIFIED';
      var highlight = alm.highlight ? escapeHtml(alm.highlight) : 'Specialized in 4K wedding post-production & cinematic skin tone color wheels.';

      var featuredBadgeHtml = alm.featured ? '<span class="alm-card-featured-badge">⭐ FEATURED</span>' : '';
      var igHtml = alm.instagram ? '<a href="' + escapeHtml(alm.instagram) + '" target="_blank" rel="noopener noreferrer" class="alm-social-btn">Instagram ↗</a>' : '';

      card.innerHTML =
        featuredBadgeHtml +
        '<div class="alm-card-header">' +
          '<div class="alm-avatar-wrap">' +
            '<img src="' + photoSrc + '" alt="' + escapeHtml(alm.name) + '" width="72" height="72" loading="lazy" onerror="this.src=\'../assets/anil-sharma.webp\'">' +
          '</div>' +
          '<div class="alm-card-meta">' +
            '<h3>' + escapeHtml(alm.name) + '</h3>' +
            '<div class="alm-studio-tag">🎬 ' + studioText + '</div>' +
            '<div class="alm-role-tag">' + roleText + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="alm-badges-row">' +
          '<span class="alm-loc-badge">📍 ' + cityText + '</span>' +
          '<span class="alm-batch-badge">🎓 ' + batchText + '</span>' +
        '</div>' +
        '<div class="alm-highlight-quote">“' + highlight + '”</div>' +
        '<div class="alm-card-footer">' +
          '<a href="../portal/?cert=' + encodeURIComponent(certId) + '" class="alm-cert-pill" title="Verify ISO Certificate">' +
            '<span>🛡️ ' + certId + '</span>' +
          '</a>' +
          igHtml +
        '</div>';

      grid.appendChild(card);
    });
  }

  function showEmptyState(msg) {
    if (!grid) return;
    grid.innerHTML =
      '<div class="alm-empty-card">' +
        '<div style="font-size:36px;margin-bottom:12px;">🔍</div>' +
        '<p style="font-size:15px;color:#cbd5e1;margin:0 0 10px 0;font-weight:700;">No Alumni Found</p>' +
        '<p style="font-size:13.5px;color:#94a3b8;margin:0;">' + escapeHtml(msg) + '</p>' +
      '</div>';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Category Tabs click listeners
  if (categoryTabs) {
    categoryTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        categoryTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        activeCourseCategory = tab.getAttribute('data-course') || 'all';
        renderAlumni();
      });
    });
  }

  // Search Input listener
  if (searchInput) {
    searchInput.addEventListener('input', renderAlumni);
  }

  // City Filter listener
  if (cityFilter) {
    cityFilter.addEventListener('change', renderAlumni);
  }

  // Initialize
  fetchAlumni();
});

// Video Modal Player logic
function openAlumniVideo(videoId, title) {
  var modal = document.getElementById('alm-video-modal');
  var container = document.getElementById('alm-video-frame-container');
  var titleEl = document.getElementById('alm-modal-video-title');

  if (!modal || !container) return;

  if (titleEl && title) {
    titleEl.textContent = title;
  }

  container.innerHTML = '<iframe src="https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?autoplay=1&rel=0&modestbranding=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeAlumniVideo() {
  var modal = document.getElementById('alm-video-modal');
  var container = document.getElementById('alm-video-frame-container');

  if (modal) modal.style.display = 'none';
  if (container) container.innerHTML = '';
  document.body.style.overflow = '';
}

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeAlumniVideo();
  }
});

// Fallback alumni records
function getDefaultAlumniList() {
  return [
    {
      id: "alm_001",
      name: "Rahul Kumar",
      photo: "../assets/alumni/alumni_rahul_kumar.jpg",
      studioName: "Sharma Digital Studio & Films",
      role: "Founder & Lead Colorist",
      city: "Siwan",
      state: "Bihar",
      batch: "14-Week Offline Studio Batch 2025",
      course: "14-Week Wedding Filmmaking & Color Grading",
      certId: "QAA-2025-0914",
      instagram: "https://instagram.com/",
      highlight: "Siwan station road par apna full 4K editing studio setup kiya. Monthly 40+ wedding teasers deliver karte hain signature cinematic skin tones ke sath.",
      featured: true
    },
    {
      id: "alm_002",
      name: "Vikas Singh",
      photo: "../assets/alumni/alumni_vikas_singh.jpg",
      studioName: "Maa Sharda Cine Production",
      role: "Cinematographer & Colorist",
      city: "Gopalganj",
      state: "Bihar",
      batch: "Offline Lab Batch 2025",
      course: "Cinematic Camera Shoot & DaVinci Resolve",
      certId: "QAA-2025-0428",
      instagram: "https://instagram.com/",
      highlight: "Sony FX3 & A7M4 multi-cam setup ke master. Gorakhpur aur Gopalganj me premium destination wedding shoots handle karte hain.",
      featured: true
    },
    {
      id: "alm_003",
      name: "Pooja Kumari",
      photo: "../assets/alumni/alumni_pooja_kumari.jpg",
      studioName: "Creative Pixel Album Studio",
      role: "Senior Album Designer & Retoucher",
      city: "Patna",
      state: "Bihar",
      batch: "Offline Lab Batch 2024",
      course: "Karizma & Canvera Album Designing",
      certId: "QAA-2024-1102",
      instagram: "https://instagram.com/",
      highlight: "Patna me leading photo printing labs ke sath tie-up. 12x36 metallic spread aur high-end frequency separation retouching me expert.",
      featured: true
    },
    {
      id: "alm_004",
      name: "Amit Tiwari",
      photo: "../assets/alumni/alumni_amit_tiwari.jpg",
      studioName: "Tiwari Digital Media",
      role: "Lead Video Editor & Drone Pilot",
      city: "Chapra",
      state: "Bihar",
      batch: "Master Class Batch 2024",
      course: "Premiere Pro, Edius & Wedding Video Editing",
      certId: "QAA-2024-0618",
      instagram: "https://instagram.com/",
      highlight: "Chapra market me top studio run kar rahe hain. Har lagan season me high-speed fast teaser cut and wedding documentary deliver karte hain.",
      featured: true
    },
    {
      id: "alm_005",
      name: "Manish Pandey",
      photo: "../assets/alumni/alumni_manish_pandey.jpg",
      studioName: "Shree Wedding Photography",
      role: "Studio Owner & Director",
      city: "Muzaffarpur",
      state: "Bihar",
      batch: "Master Class Batch 2024",
      course: "Wedding Album Design & Commercial Filmmaking",
      certId: "QAA-2024-0230",
      instagram: "https://instagram.com/",
      highlight: "Purani traditional photography lab ko upgrade karke modern 4K multi-cam production unit me convert kiya. 5 editors ki team lead kar rahe hain.",
      featured: false
    },
    {
      id: "alm_006",
      name: "Rohit Verma",
      photo: "../assets/alumni/alumni_rohit_verma.jpg",
      studioName: "CineCraft Digital Ballia",
      role: "Senior Video Editor",
      city: "Ballia",
      state: "Uttar Pradesh",
      batch: "Master Class Batch 2025",
      course: "Video Editing & AI Automation",
      certId: "QAA-2025-0955",
      instagram: "https://instagram.com/",
      highlight: "Academy ke hostel me rahkar course kiya. Ballia aur Varanasi wedding market me top video editor ke roop me high-ticket shoots edit kar rahe hain.",
      featured: false
    },
    {
      id: "alm_007",
      name: "Suraj Sharma",
      photo: "../assets/alumni/alumni_suraj_raxaul.jpg",
      studioName: "Suraj Digital Cine World",
      role: "Lead Wedding Filmmaker",
      city: "Raxaul",
      state: "Bihar",
      batch: "Offline Lab Batch 2024",
      course: "14-Week Wedding Filmmaking & Color Grading",
      certId: "QAA-2024-0812",
      instagram: "https://instagram.com/",
      highlight: "Raxaul aur Indo-Nepal border area me sabse popular wedding film creator. Slow-motion gimbal shots aur high-end color grading expert.",
      featured: true
    },
    {
      id: "alm_008",
      name: "Ravi Raj",
      photo: "../assets/alumni/alumni_ravi_gaya.jpg",
      studioName: "Magadh Motion Pictures",
      role: "Founder & DaVinci Colorist",
      city: "Gaya",
      state: "Bihar",
      batch: "Offline Studio Batch 2025",
      course: "Cinematic Camera Shoot & DaVinci Resolve",
      certId: "QAA-2025-0319",
      instagram: "https://instagram.com/",
      highlight: "Gaya se Siwan campus aakar seekha. Aaj Bodh Gaya aur Patna ke luxury weddings ke liye full cinema-style teasers bana rahe hain.",
      featured: true
    }
  ];
}
