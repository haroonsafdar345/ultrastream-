// ===== Particles System =====
class ParticleSystem {
    constructor() {
        this.container = document.getElementById('particles-container');
        this.particles = [];
        this.maxParticles = 50;
        this.init();
    }

    init() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.createParticle();
        }
        this.animate();
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        const opacity = Math.random() * 0.5 + 0.1;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(139, 92, 246, ${opacity});
            border-radius: 50%;
            left: ${x}%;
            top: ${y}%;
            animation: floatParticle ${duration}s ${delay}s linear infinite;
            pointer-events: none;
        `;
        
        this.container.appendChild(particle);
        this.particles.push({
            element: particle,
            x: x,
            y: y,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
        });
    }

    animate() {
        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            if (p.x > 100 || p.x < 0) p.speedX *= -1;
            if (p.y > 100 || p.y < 0) p.speedY *= -1;
            
            p.element.style.left = p.x + '%';
            p.element.style.top = p.y + '%';
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Add floating particle animation keyframes
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes floatParticle {
        0% { transform: translate(0, 0) scale(1); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0); opacity: 0; }
    }
`;
document.head.appendChild(particleStyle);

// ===== YouTube URL Validation =====
class YouTubeValidator {
    static validateAndExtract(url) {
        if (!url || url.trim() === '') {
            throw new Error('Please enter a YouTube link');
        }

        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                // Check if it's a Shorts URL
                if (url.includes('/shorts/')) {
                    throw new Error('Sorry, only long videos are supported. Shorts are not supported.');
                }
                return match[1];
            }
        }

        throw new Error('Please enter a valid YouTube link');
    }

    static async checkIfShort(videoId) {
        // This is a basic check. In production, you'd use YouTube API
        // For now, we'll assume it's a regular video if not from /shorts/
        return false;
    }
}

// ===== Notification System =====
class NotificationManager {
    constructor() {
        this.notification = document.getElementById('notification');
        this.icon = document.getElementById('notificationIcon');
        this.text = document.getElementById('notificationText');
        this.timeout = null;
    }

    show(message, type = 'info') {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.notification.classList.remove('hidden', 'success', 'error', 'info');
        this.notification.classList.add(type);

        switch(type) {
            case 'success':
                this.icon.className = 'fas fa-check-circle';
                break;
            case 'error':
                this.icon.className = 'fas fa-exclamation-triangle';
                break;
            default:
                this.icon.className = 'fas fa-info-circle';
        }

        this.text.textContent = message;
        
        // Reset animation
        const progress = this.notification.querySelector('.notification-progress');
        progress.style.animation = 'none';
        progress.offsetHeight; // Force reflow
        progress.style.animation = 'progress 3s linear forwards';

        this.timeout = setTimeout(() => {
            this.hide();
        }, 3000);
    }

    hide() {
        this.notification.classList.add('hidden');
    }
}

// ===== YouTube Player Manager =====
class YouTubePlayerManager {
    constructor() {
        this.player = null;
        this.playerContainer = document.getElementById('playerContainer');
        this.currentVideoId = null;
    }

    async loadVideo(videoId) {
        // Clear previous player
        this.playerContainer.innerHTML = '';
        this.currentVideoId = videoId;

        // Create iframe element
        const iframe = document.createElement('iframe');
        iframe.id = 'youtube-player';
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&fs=1&hd=1&vq=hd1080`;
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: inherit;
        `;

        this.playerContainer.appendChild(iframe);
        
        return new Promise((resolve, reject) => {
            iframe.onload = () => resolve();
            iframe.onerror = () => reject(new Error('Failed to load video'));
        });
    }

    destroy() {
        this.playerContainer.innerHTML = '';
        this.currentVideoId = null;
    }
}

// ===== Main Application =====
class UltraStreamApp {
    constructor() {
        this.urlInput = document.getElementById('youtubeUrl');
        this.playBtn = document.getElementById('playBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.playerSection = document.getElementById('playerSection');
        this.closePlayer = document.getElementById('closePlayer');
        
        this.notification = new NotificationManager();
        this.player = new YouTubePlayerManager();
        
        this.init();
    }

    init() {
        // Initialize particles
        new ParticleSystem();
        
        // Event listeners
        this.playBtn.addEventListener('click', () => this.handlePlay());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handlePlay();
        });
        this.closePlayer.addEventListener('click', () => this.closeVideo());
        
        // Focus input on load
        setTimeout(() => this.urlInput.focus(), 500);

        // Add button hover effect
        this.playBtn.addEventListener('mousemove', (e) => {
            const rect = this.playBtn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.playBtn.style.setProperty('--mouse-x', `${x}px`);
            this.playBtn.style.setProperty('--mouse-y', `${y}px`);
        });
    }

    async handlePlay() {
        const url = this.urlInput.value;
        
        // Hide previous errors
        this.hideError();
        
        try {
            // Validate and extract video ID
            const videoId = YouTubeValidator.validateAndExtract(url);
            
            // Show loading state
            this.setLoading(true);
            
            // Check if it's a Shorts video
            const isShort = await YouTubeValidator.checkIfShort(videoId);
            if (isShort) {
                throw new Error('Sorry, only long videos are supported. Shorts are not supported.');
            }
            
            // Load video
            await this.player.loadVideo(videoId);
            
            // Show player
            this.showPlayer();
            
            // Show success notification
            this.notification.show('Video loaded successfully!', 'success');
            
        } catch (error) {
            this.showError(error.message);
            this.notification.show(error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.playBtn.disabled = true;
            const content = this.playBtn.querySelector('.button-content');
            content.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading...</span>';
        } else {
            this.playBtn.disabled = false;
            const content = this.playBtn.querySelector('.button-content');
            content.innerHTML = '<i class="fas fa-play"></i><span>Play</span>';
        }
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Shake animation
        this.errorMessage.style.animation = 'none';
        this.errorMessage.offsetHeight;
        this.errorMessage.style.animation = 'shake 0.5s ease-in-out';
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    showPlayer() {
        this.playerSection.classList.remove('hidden');
        this.playerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    closeVideo() {
        this.player.destroy();
        this.playerSection.classList.add('hidden');
        this.urlInput.value = '';
        this.urlInput.focus();
        this.notification.show('Video closed', 'info');
    }
}

// Add shake animation
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    new UltraStreamApp();
});

// ===== Service Worker Registration (for PWA) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment in production
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
      }
