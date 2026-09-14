// Quick Art Photography Academy - Interactive Roadmap Controller
(() => {
    function initRoadmap() {
        const section = document.getElementById('curriculum');
        if (!section) return;

        const tabButtons = section.querySelectorAll('.qa-roadmap-tab-btn');
        const panels = section.querySelectorAll('.qa-tab-panel');
        const nextButtons = section.querySelectorAll('.qa-panel-next-btn[data-roadmap-tab]');

        function switchTab(targetTabId, shouldScroll = false) {
            if (!targetTabId) return;

            // Update tab buttons
            tabButtons.forEach(btn => {
                const isActive = btn.getAttribute('data-roadmap-tab') === targetTabId;
                btn.classList.toggle('is-active', isActive);
                btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            // Update panels
            panels.forEach(panel => {
                const isMatch = panel.getAttribute('data-roadmap-panel') === targetTabId;
                if (isMatch) {
                    panel.removeAttribute('hidden');
                    panel.classList.add('is-active');
                } else {
                    panel.setAttribute('hidden', '');
                    panel.classList.remove('is-active');
                }
            });

            if (shouldScroll) {
                const nav = section.querySelector('.qa-roadmap-tabs');
                if (nav) {
                    const rect = nav.getBoundingClientRect();
                    if (rect.top < 80 || rect.top > window.innerHeight - 100) {
                        nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            }
        }

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-roadmap-tab');
                switchTab(target, false);
            });
        });

        nextButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-roadmap-tab');
                switchTab(target, true);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRoadmap);
    } else {
        initRoadmap();
    }
})();
