// Variables globales
let currentScreen = 'main-menu';
let currentListId = null;
let currentGiftId = null;
let currentProfileId = null;
let tempImageData = null;
let tempProfileImageData = null;
let isEditingProfile = false;

// Initialisation de l'application
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await storage.init();
        setTimeout(() => {
            document.getElementById('loader').classList.add('hidden');
        }, 1500);
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        alert('Erreur lors du chargement de l\'application');
    }
});

// Navigation entre écrans
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;

    // Charger les données selon l'écran
    if (screenId === 'profiles-menu') {
        loadProfiles();
    } else if (screenId === 'lists-menu') {
        loadLists();
    }
}

// === GESTION DES PROFILS ===

async function loadProfiles() {
    const container = document.getElementById('profiles-container');
    const profiles = await storage.getProfiles();

    if (profiles.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Aucun profil créé. Créez votre premier profil enfant !</p></div>';
        return;
    }

    container.innerHTML = '';
    profiles.forEach(profile => {
        const age = calculateAge(profile.birthdate);
        const profileDiv = document.createElement('div');
        profileDiv.className = 'profile-item';
        profileDiv.innerHTML = `
            ${profile.image ? 
                (profile.image.startsWith('data:') ? 
                    `<img src="${profile.image}" class="profile-avatar" alt="${profile.name}">` :
                    `<div class="profile-emoji">${profile.image}</div>`) :
                `<div class="profile-emoji">👶</div>`
            }
            <div class="profile-item-info">
                <h3>${profile.name}</h3>
                <p>${age} ans</p>
            </div>
            <div class="profile-item-actions">
                <button class="btn-edit" onclick="editProfile(${profile.id})">✏️</button>
                <button class="btn-delete" onclick="deleteProfileConfirm(${profile.id})">🗑️</button>
            </div>
        `;
        container.appendChild(profileDiv);
    });
}

function calculateAge(birthdate) {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function showCreateProfile() {
    isEditingProfile = false;
    currentProfileId = null;
    document.getElementById('profile-modal-title').textContent = '➕ Créer un profil';
    document.getElementById('profile-name').value = '';
    document.getElementById('profile-birthdate').value = '';
    document.getElementById('profile-image-preview').innerHTML = '';
    tempProfileImageData = null;
    document.getElementById('profile-modal').classList.add('active');
}

async function editProfile(id) {
    isEditingProfile = true;
    currentProfileId = id;
    const profiles = await storage.getProfiles();
    const profile = profiles.find(p => p.id === id);
    
    if (profile) {
        document.getElementById('profile-modal-title').textContent = '✏️ Modifier le profil';
        document.getElementById('profile-name').value = profile.name;
        document.getElementById('profile-birthdate').value = profile.birthdate;
        
        if (profile.image) {
            if (profile.image.startsWith('data:')) {
                document.getElementById('profile-image-preview').innerHTML = 
                    `<img src="${profile.image}" alt="Preview" style="max-width: 200px; border-radius: 10px;">`;
            } else {
                document.getElementById('profile-image-preview').innerHTML = 
                    `<div style="font-size: 80px;">${profile.image}</div>`;
            }
            tempProfileImageData = profile.image;
        }
        
        document.getElementById('profile-modal').classList.add('active');
    }
}

async function saveProfile() {
    const name = document.getElementById('profile-name').value.trim();
    const birthdate = document.getElementById('profile-birthdate').value;

    if (!name || !birthdate) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }

    const profile = {
        name,
        birthdate,
        image: tempProfileImageData || '👶'
    };

    try {
        if (isEditingProfile && currentProfileId) {
            await storage.updateProfile(currentProfileId, profile);
        } else {
            await storage.addProfile(profile);
        }
        
        closeModal('profile-modal');
        loadProfiles();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde du profil');
    }
}

async function deleteProfileConfirm(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce profil et toutes ses listes ?')) {
        try {
            // Supprimer toutes les listes associées
            const lists = await storage.getLists();
            const profileLists = lists.filter(l => l.profileId === id);
            
            for (const list of profileLists) {
                // Supprimer tous les cadeaux de la liste
                const gifts = await storage.getGiftsByList(list.id);
                for (const gift of gifts) {
                    await storage.deleteGift(gift.id);
                }
                await storage.deleteList(list.id);
            }
            
            await storage.deleteProfile(id);
            loadProfiles();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du profil');
        }
    }
}

function handleProfileImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        tempProfileImageData = e.target.result;
        document.getElementById('profile-image-preview').innerHTML = 
            `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; border-radius: 10px;">`;
    };
    reader.readAsDataURL(file);
}

function showEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
}

function selectEmoji(emoji) {
    tempProfileImageData = emoji;
    document.getElementById('profile-image-preview').innerHTML = 
        `<div style="font-size: 80px;">${emoji}</div>`;
    document.getElementById('emoji-picker').style.display = 'none';
}

// === GESTION DES LISTES ===

async function loadLists() {
    const container = document.getElementById('lists-container');
    const profiles = await storage.getProfiles();
    const lists = await storage.getLists();

    if (profiles.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Créez d\'abord un profil enfant pour commencer !</p></div>';
        return;
    }

    container.innerHTML = '';
    
    for (const profile of profiles) {
        const profileLists = lists.filter(l => l.profileId === profile.id);
        const listDiv = document.createElement('div');
        listDiv.className = 'list-item';
        listDiv.onclick = () => openList(profile.id, profile.name);
        
        const giftCount = profileLists.length > 0 ? 
            (await storage.getGiftsByList(profileLists[0].id)).length : 0;
        
        listDiv.innerHTML = `
            <div class="list-item-info">
                <h3>Liste de ${profile.name}</h3>
                <p>${giftCount} cadeau(x)</p>
            </div>
            <div style="font-size: 24px;">🎁</div>
        `;
        container.appendChild(listDiv);
    }
}

async function showCreateListMenu() {
    const profiles = await storage.getProfiles();

    if (profiles.length === 0) {
        showNotification('Veuillez d\'abord créer un profil enfant', 'error');
        showScreen('profiles-menu');
        return;
    }

    // Créer un dialogue de sélection avec avertissement
    const container = document.getElementById('lists-container');
    const selectDiv = document.createElement('div');
    selectDiv.className = 'profile-selector';
    selectDiv.innerHTML = `
        <h3 style="color: white; text-align: center; margin: 20px 0;">
            🎄 Créer une nouvelle liste
        </h3>
        <p style="color: #FFDD00; text-align: center; margin: 10px 20px; font-size: 14px;">
            ⚠️ Attention : Créer une nouvelle liste supprimera l'ancienne liste de cet enfant.
        </p>
        <h4 style="color: white; text-align: center; margin: 15px 0;">
            Sélectionnez un enfant :
        </h4>
    `;

    profiles.forEach(profile => {
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        btn.textContent = `📝 Créer une liste pour ${profile.name}`;
        btn.onclick = () => confirmNewList(profile.id, profile.name);
        selectDiv.appendChild(btn);
    });

    // Bouton retour
    const backBtn = document.createElement('button');
    backBtn.className = 'menu-btn secondary';
    backBtn.textContent = '← Retour';
    backBtn.onclick = () => loadLists();
    selectDiv.appendChild(backBtn);

    container.innerHTML = '';
    container.appendChild(selectDiv);
}

async function confirmNewList(profileId, profileName) {
    // Vérifier si une liste existe déjà
    const lists = await storage.getLists();
    const existingList = lists.find(list => list.profileId === profileId);

    if (existingList) {
        // ✅ CORRECTION : Récupérer les cadeaux depuis storage
        const gifts = await storage.getGiftsByList(existingList.id);
        const giftsCount = gifts.length;

        // Créer modal de confirmation
        const container = document.getElementById('lists-container');
        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'profile-selector';
        confirmDiv.innerHTML = `
            <h3 style="color: white; text-align: center; margin: 20px;">
                ⚠️ Confirmation
            </h3>
            <p style="color: white; text-align: center; margin: 20px; font-size: 16px;">
                Une liste existe déjà pour <strong>${profileName}</strong> avec <strong>${giftsCount} cadeau(x)</strong>.
            </p>
            <p style="color: #E00000; text-align: center; margin: 20px; font-size: 15px; font-weight: bold;">
                Êtes-vous sûr de vouloir la supprimer et créer une nouvelle liste ?
            </p>
        `;

        // Bouton confirmer
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'menu-btn';
        confirmBtn.style.background = '#E00000';
        confirmBtn.textContent = '✓ Oui, créer une nouvelle liste';
        confirmBtn.onclick = () => createNewList(profileId, profileName, existingList.id);
        confirmDiv.appendChild(confirmBtn);

        // Bouton annuler
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'menu-btn secondary';
        cancelBtn.textContent = '✗ Annuler';
        cancelBtn.onclick = () => showCreateListMenu();
        confirmDiv.appendChild(cancelBtn);

        container.innerHTML = '';
        container.appendChild(confirmDiv);
    } else {
        // Pas de liste existante, créer directement
        await createNewList(profileId, profileName, null);
    }
}

async function createNewList(profileId, profileName, oldListId) {
    try {
        // Supprimer l'ancienne liste si elle existe
        if (oldListId) {
            // Supprimer tous les cadeaux de l'ancienne liste
            const oldGifts = await storage.getGiftsByList(oldListId);
            for (const gift of oldGifts) {
                await storage.deleteGift(gift.id);
            }
            
            // Supprimer la liste elle-même
            await storage.deleteList(oldListId);
            console.log('Ancienne liste et ses cadeaux supprimés');
        }

        // Créer la nouvelle liste vide
        const newList = {
            profileId: profileId,
            profileName: profileName,
            createdAt: new Date().toISOString(),
            wisdomLevel: 50
        };

        const newListId = await storage.addList(newList);

        // Notification avec confettis
        alert('🎄 Nouvelle liste créée avec succès !');
        
        // Afficher les confettis si la fonction existe
        if (typeof showConfetti === 'function') {
            showConfetti();
        }

        // Ouvrir directement la nouvelle liste
        openList(profileId, profileName);

    } catch (error) {
        console.error('Erreur lors de la création de la nouvelle liste:', error);
        alert('❌ Erreur lors de la création de la liste');
    }
}

// === EFFETS VISUELS ===

function showConfetti() {
    const confettiCount = 50;
    const colors = ['#E00000', '#00A651', '#FFDD00', '#FFFFFF'];
    const duration = 3000;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: -20px;
                left: ${Math.random() * 100}%;
                opacity: 1;
                z-index: 99999;
                border-radius: 50%;
                pointer-events: none;
            `;
            document.body.appendChild(confetti);
            
            const fallDuration = 2000 + Math.random() * 2000;
            const drift = (Math.random() - 0.5) * 100;
            
            confetti.animate([
                { 
                    transform: 'translateY(0) translateX(0) rotate(0deg)', 
                    opacity: 1 
                },
                { 
                    transform: `translateY(${window.innerHeight + 20}px) translateX(${drift}px) rotate(${360 * (Math.random() * 3)}deg)`, 
                    opacity: 0 
                }
            ], {
                duration: fallDuration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
            
            setTimeout(() => confetti.remove(), fallDuration);
        }, i * 30);
    }
}

async function openList(profileId, profileName) {
    currentProfileId = profileId;
    const lists = await storage.getLists();
    let list = lists.find(l => l.profileId === profileId);
    
    // Créer la liste si elle n'existe pas
    if (!list) {
        const newListId = await storage.addList({
            profileId,
            wisdomLevel: 50,
            createdAt: new Date().toISOString()
        });
        list = { id: newListId, profileId, wisdomLevel: 50 };
    }
    
    currentListId = list.id;
    document.getElementById('list-title').textContent = `Liste de ${profileName}`;
    document.getElementById('wisdom-slider').value = list.wisdomLevel || 50;
    updateWisdomColor(list.wisdomLevel || 50);
    
    await loadGifts();
    showScreen('list-view');
}

async function loadGifts() {
    const container = document.getElementById('gifts-grid');
    const gifts = await storage.getGiftsByList(currentListId);

    if (gifts.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>Aucun cadeau ajouté. Cliquez sur "Ajouter un cadeau" !</p></div>';
        return;
    }

    container.innerHTML = '';
    gifts.forEach(gift => {
        const giftCard = document.createElement('div');
        giftCard.className = 'gift-card';
        giftCard.onclick = () => showGiftDetail(gift.id);
        giftCard.innerHTML = `
            <div class="gift-name">${gift.name}</div>
            <div class="gift-image-container">
                ${gift.image ? `<img src="${gift.image}" class="gift-image" alt="${gift.name}">` : '<div style="padding: 40%; color: #ccc;">🎁</div>'}
            </div>
        `;
        container.appendChild(giftCard);
    });
}

function updateWisdomColor(value) {
    const wisdomValue = document.getElementById('wisdom-value');
    if (value < 33) {
        wisdomValue.textContent = '😢';
    } else if (value < 66) {
        wisdomValue.textContent = '😐';
    } else {
        wisdomValue.textContent = '😊';
    }
    
    // Sauvegarder le niveau
    if (currentListId) {
        storage.getList(currentListId).then(list => {
            list.wisdomLevel = parseInt(value);
            storage.updateList(currentListId, list);
        });
    }
}

// === GESTION DES CADEAUX ===

function showAddGift() {
    document.getElementById('gift-name').value = '';
    document.getElementById('gift-brand').value = '';
    document.getElementById('image-preview').innerHTML = '';
    tempImageData = null;
    document.getElementById('add-gift-modal').classList.add('active');
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 10MB par image recommandé)
    if (file.size > 10 * 1024 * 1024) {
        alert('L\'image est trop grande. Taille maximum : 10MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        tempImageData = e.target.result;
        document.getElementById('image-preview').innerHTML = 
            `<img src="${e.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
}

// === GESTION DES IMAGES PAR URL ===

function showUrlInput() {
    const container = document.getElementById('url-input-container');
    const urlInput = document.getElementById('image-url');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        urlInput.focus();
    } else {
        container.style.display = 'none';
        urlInput.value = '';
    }
}

function loadImageFromUrl() {
    const url = document.getElementById('image-url').value.trim();
    const preview = document.getElementById('image-preview');
    
    if (!url) {
        alert('⚠️ Veuillez entrer une URL d\'image');
        return;
    }

    // Vérifier si c'est une URL valide
    try {
        new URL(url);
    } catch (e) {
        alert('⚠️ URL invalide\nExemple: https://example.com/image.jpg');
        return;
    }

    // ⭐ MÉTHODE SIMPLE : Stockage direct sans test
    tempImageData = url;
    preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22><text x=%2250%%25%22 y=%2250%%25%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22white%22>❌ Image non chargée</text></svg>'">`;
    
    // Masquer le champ URL
    document.getElementById('url-input-container').style.display = 'none';
    document.getElementById('image-url').value = '';
}

async function saveGift() {
    const name = document.getElementById('gift-name').value.trim();
    const brand = document.getElementById('gift-brand').value.trim();

    if (!name) {
        alert('Veuillez entrer un nom pour le cadeau');
        return;
    }

    const gift = {
        listId: currentListId,
        name,
        brand,
        image: tempImageData,
        createdAt: new Date().toISOString()
    };

    try {
        await storage.addGift(gift);
        closeModal('add-gift-modal');
        await loadGifts();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        alert('Erreur lors de la sauvegarde du cadeau');
    }
}

async function showGiftDetail(giftId) {
    currentGiftId = giftId;
    const gifts = await storage.getGiftsByList(currentListId);
    const gift = gifts.find(g => g.id === giftId);

    if (gift) {
        document.getElementById('detail-gift-name').textContent = gift.name;
        document.getElementById('detail-gift-brand').textContent = 
            gift.brand ? `Marque : ${gift.brand}` : '';
        
        // ⭐ Gérer URL et base64
        const imgElement = document.getElementById('detail-gift-image');
        if (gift.image) {
            imgElement.src = gift.image;
            if (gift.isUrl) {
                imgElement.setAttribute('crossorigin', 'anonymous');
            }
            imgElement.style.display = 'block';
        } else {
            imgElement.style.display = 'none';
        }
        
        document.getElementById('gift-detail-modal').classList.add('active');
    }
}

async function deleteGift() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce cadeau ?')) {
        try {
            await storage.deleteGift(currentGiftId);
            closeModal('gift-detail-modal');
            await loadGifts();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du cadeau');
        }
    }
}

// === ANIMATIONS ===

async function sendListToSanta() {
    showSantaAnimation();
    setTimeout(() => {
        hideSantaAnimation();
        alert('🎅 Votre liste a bien été envoyée au Père Noël ! 🎄');
    }, 3500);
}

async function sendAllLists() {
    const lists = await storage.getLists();
    if (lists.length === 0) {
        alert('Aucune liste à envoyer');
        return;
    }
    
    showSantaAnimation();
    setTimeout(() => {
        hideSantaAnimation();
        alert('🎅 Toutes les listes ont été envoyées au Père Noël ! 🎄');
    }, 3500);
}

function showSantaAnimation() {
    document.getElementById('santa-animation').classList.add('active');
}

function hideSantaAnimation() {
    document.getElementById('santa-animation').classList.remove('active');
}

// === PARTAGE PDF ===

async function shareList() {
    try {
        const list = await storage.getList(currentListId);
        const gifts = await storage.getGiftsByList(currentListId);
        const profiles = await storage.getProfiles();
        const profile = profiles.find(p => p.id === list.profileId);

        if (!profile) {
            showNotification('❌ Profil introuvable', 'error');
            return;
        }

        const urlImages = gifts.filter(g => g.image && g.image.startsWith('http')).length;
        
        // ✅ Loader si images à convertir
        let loader = null;
        if (urlImages > 0) {
            loader = document.createElement('div');
            loader.id = 'pdf-loader';
            loader.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                            background: rgba(0,0,0,0.8); display: flex; align-items: center; 
                            justify-content: center; z-index: 9999; color: white; font-size: 20px;">
                    <div style="text-align: center;">
                        <div style="font-size: 50px; margin-bottom: 20px;">⏳</div>
                        <div>Préparation du PDF...</div>
                        <div style="font-size: 14px; margin-top: 10px; opacity: 0.7;">
                            ${urlImages} image(s) à convertir
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(loader);
        }

        try {
            // ✅ Générer et partager
            await generatePDF(profile, gifts, list.wisdomLevel);
        } finally {
            // ✅ Retirer le loader
            if (loader && loader.parentNode) {
                document.body.removeChild(loader);
            }
        }

    } catch (error) {
        console.error('❌ Erreur partage:', error);
        showNotification('❌ Erreur lors du partage', 'error');
        
        const loader = document.getElementById('pdf-loader');
        if (loader) document.body.removeChild(loader);
    }
}

// === MODAL ===

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Fermer les modales en cliquant à l'extérieur
window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};
