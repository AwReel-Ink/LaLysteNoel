// Animations supplémentaires et effets visuels

// Animation de confettis pour les actions réussies
function showConfetti() {
    const confettiCount = 50;
    const colors = ['#E00000', '#0D5C00', '#FFDD00'];
    
    for (let i = 0; i < confettiCount; i++) {
        createConfetti(colors[Math.floor(Math.random() * colors.length)]);
    }
}

function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = color;
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    confetti.style.opacity = '1';
    confetti.style.zIndex = '10000';
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';
    
    document.body.appendChild(confetti);
    
    const duration = 3000;
    const startTime = Date.now();
    const endY = window.innerHeight + 10;
    const rotation = Math.random() * 360;
    const drift = (Math.random() - 0.5) * 100;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            confetti.style.top = (progress * endY) + 'px';
            confetti.style.transform = `translateX(${drift * progress}px) rotate(${rotation * progress}deg)`;
            confetti.style.opacity = 1 - progress;
            requestAnimationFrame(animate);
        } else {
            confetti.remove();
        }
    }
    
    animate();
}

// Animation d'envoi au Père Noël
function initSantaAnimation() {
    const animation = document.getElementById('santa-animation');
    
    // Créer des flocons de neige animés
    const snowflakes = animation.querySelectorAll('.snowflake');
    snowflakes.forEach((flake, index) => {
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDelay = (index * 0.3) + 's';
        flake.style.animationDuration = (2 + Math.random() * 2) + 's';
    });
}

// Effet de pulsation pour les boutons importants
function addPulseEffect(element) {
    element.style.animation = 'pulse 1.5s ease-in-out infinite';
}

// Effet de secousse (pour les erreurs)
function shakeElement(elementId) {
    const element = document.getElementById(elementId);
    element.style.animation = 'shake 0.5s';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Initialiser les animations au chargement
document.addEventListener('DOMContentLoaded', () => {
    initSantaAnimation();
    
    // Ajouter des transitions douces sur tous les boutons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        btn.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
    });
});

// Animation de chargement de l'image
function showImageLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #0D5C00;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            "></div>
            <p style="margin-top: 10px; color: #0D5C00;">Chargement...</p>
        </div>
    `;
}

// Animation de succès
function showSuccessAnimation(message) {
    const successDiv = document.createElement('div');
    successDiv.style.position = 'fixed';
    successDiv.style.top = '50%';
    successDiv.style.left = '50%';
    successDiv.style.transform = 'translate(-50%, -50%)';
    successDiv.style.background = 'rgba(13, 92, 0, 0.95)';
    successDiv.style.color = 'white';
    successDiv.style.padding = '30px';
    successDiv.style.borderRadius = '20px';
    successDiv.style.fontSize = '20px';
    successDiv.style.zIndex = '10001';
    successDiv.style.textAlign = 'center';
    successDiv.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    successDiv.innerHTML = `<div style="font-size: 50px; margin-bottom: 10px;">✅</div>${message}`;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.transition = 'opacity 0.5s';
        successDiv.style.opacity = '0';
        setTimeout(() => successDiv.remove(), 500);
    }, 2000);
}
