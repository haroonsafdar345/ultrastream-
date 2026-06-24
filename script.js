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
                if (url.includes('/shorts/')) {
                    throw new Error('Sorry, only long videos are supported. Shorts are not supported.');
                }
                return match[1];
            }
        }

        throw new Error('Please enter a valid YouTube link');
    }

    static async checkIfShort(videoId) {
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
        
        const progress = this.notification.querySelector('.notification-progress');
        progress.style.animation = 'none';
        progress.offsetHeight;
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
        this.playerContainer.innerHTML = '';
        this.currentVideoId = videoId;

        const iframe = document.createElement('iframe');
        iframe.id = 'youtube-player';
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&fs=1`;
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'fullscreen; autoplay; encrypted-media; picture-in-picture');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
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
        new ParticleSystem();
        
        this.playBtn.addEventListener('click', () => this.handlePlay());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handlePlay();
        });
        this.closePlayer.addEventListener('click', () => this.closeVideo());
        
        setTimeout(() => this.urlInput.focus(), 500);
    }

    async handlePlay() {
        const url = this.urlInput.value;
        this.hideError();
        
        try {
            const videoId = YouTubeValidator.validateAndExtract(url);
            this.setLoading(true);
            
            const isShort = await YouTubeValidator.checkIfShort(videoId);
            if (isShort) {
                throw new Error('Sorry, only long videos are supported. Shorts are not supported.');
            }
            
            await this.player.loadVideo(videoId);
            this.showPlayer();
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

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
        20%, 40%, 60%, 80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

document.addEventListener('DOMContentLoaded', () => {
    new UltraStreamApp();
});

// PWA Install
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    
    setTimeout(() => {
        if (confirm('Install UltraStream as an app?')) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User installed the app');
                }
                deferredPrompt = null;
            });
        }
    }, 10000);
});
