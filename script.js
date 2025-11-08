// Mobile menu functionality
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.toggle('mobile-open');
    
    // Create overlay if it doesn't exist
    if (!overlay) {
        const newOverlay = document.createElement('div');
        newOverlay.className = 'mobile-overlay';
        document.body.appendChild(newOverlay);
        
        // Close menu when overlay is clicked
        newOverlay.addEventListener('click', closeMobileMenu);
    } else {
        overlay.classList.toggle('active');
    }
}

function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.remove('mobile-open');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Navigation functionality
function setActiveNavItem(clickedItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    clickedItem.classList.add('active');
}

// Add click event listeners to navigation items
document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            setActiveNavItem(this);
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // Close mobile menu when window is resized to desktop size
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
});

// Feature launch functionality
function launchFeature(featureName) {
    // You can customize this function based on your needs
    console.log(`Launching ${featureName} feature`);
    
    // Example: Show alert for now (replace with actual functionality)
    const featureNames = {
        'veritas': 'Veritas Analyzer',
        'shieldmate': 'ShieldMate',
        'learn': 'Learn to Verify',
        'voice': 'Voice Note Analyzer'
    };
    
    alert(`${featureNames[featureName]} feature will be launched!`);
    
    // You can add actual navigation or modal opening logic here
    // For example:
    // window.location.href = `/${featureName}`;
    // or
    // openModal(featureName);
}

// Show ShieldMate message when clicked from sidebar
function showShieldMateMessage() {
    alert('ShieldMate feature will be launched soon!');
}

// Header icon functionality
document.addEventListener('DOMContentLoaded', function() {
    const bellIcon = document.querySelector('.header-icons .fa-bell');
    const userIcon = document.querySelector('.header-icons .fa-user');
    
    if (bellIcon) {
        bellIcon.addEventListener('click', function() {
            console.log('Notifications clicked');
            // Add notification functionality here
        });
    }
    
    if (userIcon) {
        userIcon.addEventListener('click', function() {
            console.log('User profile clicked');
            // Add user profile functionality here
        });
    }
});

// Smooth scrolling for better UX
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling to any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
    
    // Tab navigation for accessibility
    if (e.key === 'Tab') {
        // Ensure focus is visible
        document.body.classList.add('keyboard-navigation');
    }
});

// Remove keyboard navigation class on mouse use
document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// Add loading states for buttons
function addLoadingState(button) {
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    // Remove loading state after 2 seconds (replace with actual async operation)
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

// Enhanced launch feature function with loading state
function launchFeatureWithLoading(featureName) {
    const button = event.target;
    addLoadingState(button);
    
    // Simulate async operation
    setTimeout(() => {
        launchFeature(featureName);
    }, 1000);
}

// Utility function to check if device is mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Utility function to get current active nav item
function getCurrentActiveNavItem() {
    return document.querySelector('.nav-item.active');
}

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleMobileMenu,
        closeMobileMenu,
        setActiveNavItem,
        launchFeature,
        isMobile,
        getCurrentActiveNavItem
    };
}
