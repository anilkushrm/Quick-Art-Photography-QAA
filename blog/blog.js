/**
 * Quick Art Academy - Blog Interactive Controller
 * Handles live search, category filtering, count updates, and 8-card pagination.
 */
document.addEventListener('DOMContentLoaded', () => {
  const catButtons = document.querySelectorAll('.blog-cat-btn, .blog-cat-list-item, .blog-ref-cat-btn');
  const searchInputs = document.querySelectorAll('.blog-search-input');
  const articleCards = document.querySelectorAll('.blog-post-card');
  const feedCountElem = document.getElementById('blogFeedCount');
  const emptyState = document.getElementById('blogEmptyState');
  const resetBtn = document.getElementById('blogResetBtn');

  // Pagination Elements
  const paginationElem = document.getElementById('blogPagination');
  const pageNumbersElem = document.getElementById('blogPageNumbers');
  const prevBtn = document.getElementById('blogPagePrev');
  const nextBtn = document.getElementById('blogPageNext');

  const ARTICLES_PER_PAGE = 8;
  let currentPage = 1;
  let currentCategory = 'all';
  let currentQuery = '';

  function renderPagination(totalPages) {
    if (!paginationElem || !pageNumbersElem) return;

    if (totalPages <= 1) {
      paginationElem.style.display = 'none';
      return;
    }

    paginationElem.style.display = 'flex';
    pageNumbersElem.innerHTML = '';

    // Render page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.type = 'button';
      pageBtn.className = `blog-page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.setAttribute('data-page', i);
      pageBtn.setAttribute('aria-label', `Page ${i}`);
      pageBtn.textContent = i;

      pageBtn.addEventListener('click', () => {
        goToPage(i);
      });

      pageNumbersElem.appendChild(pageBtn);
    }

    // Update prev/next button states
    if (prevBtn) {
      prevBtn.disabled = currentPage <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;
    }
  }

  function goToPage(page) {
    currentPage = page;
    filterArticles();
    const feedTop = document.querySelector('.blog-controls-bar') || document.querySelector('.blog-layout-grid');
    if (feedTop) {
      feedTop.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function filterArticles() {
    const query = currentQuery.toLowerCase().trim();
    const matchingCards = [];

    articleCards.forEach((card) => {
      const cardCategory = card.getAttribute('data-category') || '';
      const cardTitle = (card.querySelector('.blog-card-title')?.textContent || '').toLowerCase();
      const cardExcerpt = (card.querySelector('.blog-card-excerpt')?.textContent || '').toLowerCase();
      const cardTags = (card.getAttribute('data-tags') || '').toLowerCase();

      const matchesCategory = currentCategory === 'all' || cardCategory === currentCategory;
      const matchesQuery = !query || 
        cardTitle.includes(query) || 
        cardExcerpt.includes(query) || 
        cardTags.includes(query);

      if (matchesCategory && matchesQuery) {
        matchingCards.push(card);
      } else {
        card.style.display = 'none';
      }
    });

    const totalCount = matchingCards.length;
    const totalPages = Math.ceil(totalCount / ARTICLES_PER_PAGE) || 1;

    if (currentPage > totalPages) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;

    matchingCards.forEach((card, index) => {
      if (index >= startIndex && index < endIndex) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    // Update count indicator
    if (feedCountElem) {
      if (totalPages > 1) {
        feedCountElem.textContent = `${totalCount} Articles · Page ${currentPage} of ${totalPages}`;
      } else {
        feedCountElem.textContent = `${totalCount} ${totalCount === 1 ? 'Article' : 'Articles'}`;
      }
    }

    // Toggle Empty State message
    if (emptyState) {
      emptyState.style.display = totalCount === 0 ? 'block' : 'none';
    }

    renderPagination(totalPages);
  }

  function setActiveCategory(cat) {
    currentCategory = cat;
    currentPage = 1; // Reset to page 1 on category change
    catButtons.forEach(btn => {
      if ((btn.getAttribute('data-category') || 'all') === cat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    filterArticles();
  }

  // Category buttons click handler
  catButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category') || 'all';
      setActiveCategory(cat);
    });
  });

  // Search inputs handler with synchronization and debounce
  searchInputs.forEach((input) => {
    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentQuery = e.target.value;
        currentPage = 1; // Reset to page 1 on new search
        searchInputs.forEach(otherInput => {
          if (otherInput !== input) {
            otherInput.value = currentQuery;
          }
        });
        filterArticles();
      }, 150);
    });
  });

  // Sidebar search button click handler
  const searchBtn = document.querySelector('.blog-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const sidebarInput = document.getElementById('blogSearchInput');
      if (sidebarInput) {
        currentQuery = sidebarInput.value;
        currentPage = 1;
        filterArticles();
        sidebarInput.focus();
      }
    });
  }

  // Prev / Next pagination buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        goToPage(currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToPage(currentPage + 1);
    });
  }

  // Reset button in empty state
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentQuery = '';
      currentPage = 1;
      searchInputs.forEach(input => { input.value = ''; });
      setActiveCategory('all');
    });
  }

  // Initialize on load
  filterArticles();
});
