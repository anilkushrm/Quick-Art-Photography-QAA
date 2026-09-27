// alumni/alumni.js — Official Alumni Directory Script

document.addEventListener('DOMContentLoaded', function () {
  var grid = document.getElementById('alm-cards-grid');
  var countMeta = document.getElementById('alm-count-meta');
  var searchInput = document.getElementById('alm-search-input');
  var cityFilter = document.getElementById('alm-city-filter');
  var courseFilter = document.getElementById('alm-course-filter');

  var allAlumni = [];

  function fetchAlumni() {
    fetch('../api/lms.php?action=get-alumni')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok && Array.isArray(data.alumni)) {
          allAlumni = data.alumni;
          renderAlumni();
        } else {
          showEmptyState('No alumni records available at this moment.');
        }
      })
      .catch(function (err) {
        showEmptyState('Could not load alumni directory. Please refresh.');
      });
  }

  function renderAlumni() {
    var query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    var selectedCity = (cityFilter ? cityFilter.value : 'all');
    var selectedCourse = (courseFilter ? courseFilter.value : 'all');

    var filtered = allAlumni.filter(function (alm) {
      // Search matching
      var nameMatch = (alm.name || '').toLowerCase().indexOf(query) !== -1;
      var studioMatch = (alm.studioName || '').toLowerCase().indexOf(query) !== -1;
      var cityMatch = (alm.city || '').toLowerCase().indexOf(query) !== -1;
      var roleMatch = (alm.role || '').toLowerCase().indexOf(query) !== -1;
      var matchesSearch = !query || nameMatch || studioMatch || cityMatch || roleMatch;

      // City filter
      var matchesCity = (selectedCity === 'all') || ((alm.city || '').toLowerCase().indexOf(selectedCity.toLowerCase()) !== -1);

      // Course filter
      var matchesCourse = (selectedCourse === 'all') || ((alm.course || '').toLowerCase().indexOf(selectedCourse.toLowerCase()) !== -1);

      return matchesSearch && matchesCity && matchesCourse;
    });

    if (countMeta) {
      countMeta.textContent = 'Showing ' + filtered.length + ' certified ' + (filtered.length === 1 ? 'alumnus' : 'alumni');
    }

    if (!grid) return;
    grid.innerHTML = '';

    if (filtered.length === 0) {
      showEmptyState('No graduates match your search criteria. Try a different city or keyword.');
      return;
    }

    filtered.forEach(function (alm) {
      var card = document.createElement('div');
      card.className = 'alm-card';

      var photoSrc = alm.photo || '../assets/anil-sharma.webp';
      var studioText = alm.studioName ? escapeHtml(alm.studioName) : 'Independent Editor';
      var roleText = alm.role ? escapeHtml(alm.role) : 'Certified Editor';
      var cityText = (alm.city ? escapeHtml(alm.city) : 'Siwan') + (alm.state ? ', ' + escapeHtml(alm.state) : '');
      var batchText = alm.batch ? escapeHtml(alm.batch) : 'Certified Graduate';
      var certId = alm.certId || 'QAA-VERIFIED';
      var highlight = alm.highlight ? escapeHtml(alm.highlight) : 'Specialized in 4K wedding post-production & cinematic color wheels.';

      var featuredBadgeHtml = alm.featured ? '<span class="alm-card-featured-badge">⭐ FEATURED</span>' : '';
      var igHtml = alm.instagram ? '<a href="' + escapeHtml(alm.instagram) + '" target="_blank" rel="noopener noreferrer" class="alm-social-btn">Instagram ↗</a>' : '';

      card.innerHTML =
        featuredBadgeHtml +
        '<div class="alm-card-header">' +
          '<div class="alm-avatar-wrap">' +
            '<img src="' + photoSrc + '" alt="' + escapeHtml(alm.name) + '" width="70" height="70" loading="lazy" onerror="this.src=\'../assets/anil-sharma.webp\'">' +
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
          '<a href="../portal/?cert=' + encodeURIComponent(certId) + '" class="alm-cert-pill" title="Verify Certificate">' +
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
      '<div class="alm-loading-card">' +
        '<div style="font-size:36px;margin-bottom:10px;">🔍</div>' +
        '<p style="font-size:14px;color:#94a3b8;margin:0;">' + escapeHtml(msg) + '</p>' +
      '</div>';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (searchInput) searchInput.addEventListener('input', renderAlumni);
  if (cityFilter) cityFilter.addEventListener('change', renderAlumni);
  if (courseFilter) courseFilter.addEventListener('change', renderAlumni);

  fetchAlumni();
});
