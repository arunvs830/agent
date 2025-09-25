// Gaming Website JavaScript

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollEffects();
    initGameCards();
    initContactForm();
    initAnimations();
});

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle mobile menu
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Change navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(0, 0, 0, 0.98)';
        } else {
            navbar.style.background = 'rgba(0, 0, 0, 0.95)';
        }
    });
}

// Scroll effects and animations
function initScrollEffects() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.game-card, .news-card, .review-card');
    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Add CSS for scroll animations
    const style = document.createElement('style');
    style.textContent = `
        .game-card, .news-card, .review-card {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.6s ease;
        }
        
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// Game card interactions
function initGameCards() {
    const gameCards = document.querySelectorAll('.game-card');
    const gameButtons = document.querySelectorAll('.btn-game');

    // Add hover effects
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Game button click handlers
    gameButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const gameCard = this.closest('.game-card');
            const gameName = gameCard.querySelector('h3').textContent;
            
            // Create a fun click effect
            createClickEffect(this);
            
            // Show a fun alert (in a real app, this would navigate to the game)
            setTimeout(() => {
                showGameModal(gameName);
            }, 300);
        });
    });
}

// Contact form functionality
function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            if (name && email && message) {
                // Simulate form submission
                showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                this.reset();
            } else {
                showNotification('Please fill in all fields.', 'error');
            }
        });
    }

    // Social links interaction
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            createClickEffect(this);
            const platform = this.querySelector('i').classList[1].split('-')[1];
            showNotification(`Opening ${platform.toUpperCase()}... (Demo mode)`, 'info');
        });
    });
}

// Initialize animations and interactive elements
function initAnimations() {
    // Floating icons animation
    const floatingIcons = document.querySelectorAll('.floating-icon');
    floatingIcons.forEach((icon, index) => {
        // Add random movement
        setInterval(() => {
            const randomX = Math.random() * 20 - 10;
            const randomY = Math.random() * 20 - 10;
            icon.style.transform = `translate(${randomX}px, ${randomY}px)`;
        }, 3000 + index * 1000);
    });

    // Hero buttons interaction
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    heroButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            createClickEffect(this);
            
            if (this.textContent.includes('Explore')) {
                document.querySelector('#games').scrollIntoView({ behavior: 'smooth' });
            } else if (this.textContent.includes('Reviews')) {
                document.querySelector('#reviews').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // News cards interaction
    const readMoreLinks = document.querySelectorAll('.read-more');
    readMoreLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const newsTitle = this.closest('.news-card').querySelector('h3').textContent;
            showNewsModal(newsTitle);
        });
    });

    // Add particle effect to hero section
    createParticleEffect();
}

// Utility functions
function createClickEffect(element) {
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = '';
    }, 150);
}

function showGameModal(gameName) {
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>🎮 ${gameName}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <p>Get ready to dive into an amazing gaming experience!</p>
                <p>This is a demo - in a real gaming site, this would launch the game or take you to the game page.</p>
                <div class="game-features">
                    <div class="feature">⚡ Fast-paced action</div>
                    <div class="feature">🎯 Challenging gameplay</div>
                    <div class="feature">🏆 Achievements system</div>
                    <div class="feature">👥 Multiplayer support</div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary">Start Playing (Demo)</button>
                <button class="btn btn-secondary close-modal">Maybe Later</button>
            </div>
        </div>
    `;

    // Add modal styles
    const modalStyles = `
        <style>
            .game-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            }
            
            .modal-content {
                background: linear-gradient(145deg, #1a1a2e, #16213e);
                border-radius: 20px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(0, 212, 255, 0.3);
                animation: slideIn 0.3s ease;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .modal-header h2 {
                color: #00d4ff;
                margin: 0;
                font-family: 'Orbitron', monospace;
            }
            
            .close-modal {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 2rem;
                cursor: pointer;
                transition: color 0.3s ease;
            }
            
            .close-modal:hover {
                color: #ff6b6b;
            }
            
            .modal-body p {
                color: #b0b0b0;
                margin-bottom: 1rem;
                line-height: 1.6;
            }
            
            .game-features {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 0.5rem;
                margin: 1.5rem 0;
            }
            
            .feature {
                background: rgba(0, 212, 255, 0.1);
                padding: 0.5rem;
                border-radius: 8px;
                color: #ffffff;
                font-size: 0.9rem;
            }
            
            .modal-footer {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
                flex-wrap: wrap;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from { transform: translateY(-50px) scale(0.9); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
        </style>
    `;

    document.head.insertAdjacentHTML('beforeend', modalStyles);
    document.body.appendChild(modal);

    // Close modal functionality
    const closeButtons = modal.querySelectorAll('.close-modal');
    const startButton = modal.querySelector('.btn-primary');

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.remove();
        });
    });

    startButton.addEventListener('click', () => {
        showNotification(`Starting ${gameName}... (Demo mode)`, 'success');
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function showNewsModal(newsTitle) {
    showNotification(`Opening article: "${newsTitle}" (Demo mode)`, 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const notificationStyles = `
            <style id="notification-styles">
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 10px;
                    color: white;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
                    max-width: 300px;
                    font-weight: 500;
                }
                
                .notification-success {
                    background: linear-gradient(45deg, #4ecdc4, #44a08d);
                }
                
                .notification-error {
                    background: linear-gradient(45deg, #ff6b6b, #ee5a52);
                }
                
                .notification-info {
                    background: linear-gradient(45deg, #00d4ff, #0099cc);
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', notificationStyles);
    }

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function createParticleEffect() {
    const hero = document.querySelector('.hero');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(0, 212, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            animation: particleFloat ${5 + Math.random() * 10}s linear infinite;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 5}s;
        `;
        hero.appendChild(particle);
    }

    // Add particle animation styles
    const particleStyles = `
        <style>
            @keyframes particleFloat {
                0% {
                    transform: translateY(0px) translateX(0px);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
                    opacity: 0;
                }
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', particleStyles);
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Add loaded styles
    const loadedStyles = `
        <style>
            body {
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            
            body.loaded {
                opacity: 1;
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', loadedStyles);
});

// Easter egg - Konami code
let konamiCode = [];
const konami = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konami.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.join(',') === konami.join(',')) {
        activateEasterEgg();
        konamiCode = [];
    }
});

function activateEasterEgg() {
    showNotification('🎮 Konami Code Activated! You found the secret! 🎉', 'success');
    
    // Add rainbow effect to the logo
    const logo = document.querySelector('.nav-logo');
    logo.style.animation = 'rainbowText 2s ease-in-out infinite';
    
    const rainbowStyles = `
        <style>
            @keyframes rainbowText {
                0% { color: #ff0000; }
                16.66% { color: #ff8000; }
                33.33% { color: #ffff00; }
                50% { color: #00ff00; }
                66.66% { color: #0080ff; }
                83.33% { color: #8000ff; }
                100% { color: #ff0000; }
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', rainbowStyles);
    
    setTimeout(() => {
        logo.style.animation = 'glow 2s ease-in-out infinite alternate';
    }, 10000);
}