document.addEventListener('DOMContentLoaded', function() {
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, false);

    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);

    function handleSwipe() {
        const sidebar = document.querySelector('.sidebar');
        const dashboard = document.querySelector('.dashboard');

        if (!sidebar || !dashboard) return;

        if (touchEndX < touchStartX - 50 && !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
            dashboard.classList.add('expanded');
        }

        if (touchEndX > touchStartX + 50 && sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            dashboard.classList.remove('expanded');
        }
    }

    const modals = document.querySelectorAll('.modal');

    if (modals.length > 0) {
        document.addEventListener('touchend', function(event) {
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    const tableContainers = document.querySelectorAll('.table-container');

    tableContainers.forEach(container => {
        if (container.scrollWidth > container.clientWidth) {
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '<i class="fas fa-arrows-alt-h"></i> Swipe to view more';
            indicator.style.textAlign = 'center';
            indicator.style.padding = '0.5rem';
            indicator.style.color = '#666';
            indicator.style.fontSize = '0.8rem';
            container.appendChild(indicator);

            container.addEventListener('scroll', function() {
                indicator.style.display = 'none';
            }, { once: true });
        }
    });

    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.getElementsByTagName('head')[0].appendChild(meta);
    }

    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300;
        const lastTap = document.body.getAttribute('data-last-tap') || now;
        const timeDiff = now - lastTap;

        if (timeDiff < DOUBLE_TAP_THRESHOLD) {
            event.preventDefault();
        }

        document.body.setAttribute('data-last-tap', now);
    });
});
