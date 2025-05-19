// Additional mobile responsiveness improvements
document.addEventListener('DOMContentLoaded', function() {
    // Add swipe functionality for mobile to open/close sidebar
    let touchStartX = 0;
    let touchEndX = 0;
    
    // Detect touch on the document
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, false);
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, false);
    
    // Handle swipe left/right
    function handleSwipe() {
        const sidebar = document.querySelector('.sidebar');
        const dashboard = document.querySelector('.dashboard');
        
        if (!sidebar || !dashboard) return;
        
        // Swipe left (close sidebar)
        if (touchEndX < touchStartX - 50 && !sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
            dashboard.classList.add('expanded');
        }
        
        // Swipe right (open sidebar)
        if (touchEndX > touchStartX + 50 && sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            dashboard.classList.remove('expanded');
        }
    }
    
    // Close modals when clicking outside on mobile
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
    
    // Improve table scrolling on mobile - add visual indicator
    const tableContainers = document.querySelectorAll('.table-container');
    
    tableContainers.forEach(container => {
        if (container.scrollWidth > container.clientWidth) {
            // Create and append scroll indicator
            const indicator = document.createElement('div');
            indicator.className = 'scroll-indicator';
            indicator.innerHTML = '<i class="fas fa-arrows-alt-h"></i> Swipe to view more';
            indicator.style.textAlign = 'center';
            indicator.style.padding = '0.5rem';
            indicator.style.color = '#666';
            indicator.style.fontSize = '0.8rem';
            container.appendChild(indicator);
            
            // Make indicator disappear after user has scrolled
            container.addEventListener('scroll', function() {
                indicator.style.display = 'none';
            }, { once: true });
        }
    });
    
    // Add viewport meta tag if not present to ensure proper scaling
    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.getElementsByTagName('head')[0].appendChild(meta);
    }
    
    // Add double-tap prevention for iOS devices
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