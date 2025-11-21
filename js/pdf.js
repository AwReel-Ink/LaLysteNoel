// Fonction auxiliaire pour convertir URL en base64 avec qualité fixe 70%
async function urlToBase64(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // ✅ Taille fixe optimale pour 150 DPI
                const maxSize = 600;
                let width = img.width;
                let height = img.height;
                
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // ✅ 70% de qualité fixe
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    } catch (error) {
        // Essai avec proxy CORS
        try {
            const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxiedUrl);
            const blob = await response.blob();
            
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const maxSize = 600;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                
                img.onerror = reject;
                img.src = URL.createObjectURL(blob);
            });
        } catch (proxyError) {
            console.warn(`Impossible de charger l'image: ${url}`);
            return null;
        }
    }
}

async function generatePDF(profile, gifts, wisdomLevel) {
    const { jsPDF } = window.jspdf;
    
    // ✅ Configuration PDF optimisée 150 DPI
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true,
        putOnlyUsedFonts: true,
        precision: 2
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const itemsPerRow = 4;
    const itemsPerColumn = 5;
    const itemWidth = (pageWidth - (margin * 2)) / itemsPerRow;
    const itemHeight = (pageHeight - (margin * 2) - 20) / itemsPerColumn;

    // ✅ Conversion des images avec 70% de qualité
    const processedGifts = await Promise.all(gifts.map(async (gift) => {
        if (gift.image && gift.image.startsWith('http')) {
            const base64 = await urlToBase64(gift.image);
            return { ...gift, image: base64 };
        }
        return gift;
    }));

    // En-tête
    doc.setFillColor(224, 0, 0);
    doc.rect(0, 0, pageWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`Liste de Noël de ${profile.name}`, pageWidth / 2, 12, { align: 'center' });

    const wisdomEmoji = wisdomLevel < 33 ? '😢' : wisdomLevel < 66 ? '😐' : '😊';
    doc.setFontSize(12);
    doc.text(`Sagesse cette année : ${wisdomLevel}% ${wisdomEmoji}`, pageWidth / 2, 18, { align: 'center' });

    let x = margin;
    let y = 30;
    let itemCount = 0;

    for (const gift of processedGifts) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        const textLines = doc.splitTextToSize(gift.name, itemWidth - 4);
        doc.text(textLines, x + itemWidth / 2, y, { align: 'center' });

        if (gift.image) {
            try {
                const imgY = y + (textLines.length * 3);
                const imgSize = Math.min(itemWidth - 4, itemHeight - (textLines.length * 3) - 4);
                
                // ✅ JPEG avec compression FAST
                doc.addImage(gift.image, 'JPEG', x + 2, imgY, imgSize, imgSize, undefined, 'FAST');
            } catch (error) {
                console.error('Erreur image:', error);
                const imgY = y + (textLines.length * 3);
                const imgSize = Math.min(itemWidth - 4, itemHeight - (textLines.length * 3) - 4);
                doc.setFontSize(20);
                doc.setTextColor(200, 200, 200);
                doc.text('🎁', x + itemWidth / 2, imgY + imgSize / 2, { align: 'center' });
            }
        } else {
            const imgY = y + (textLines.length * 3);
            const imgSize = Math.min(itemWidth - 4, itemHeight - (textLines.length * 3) - 4);
            doc.setFontSize(30);
            doc.setTextColor(200, 200, 200);
            doc.text('🎁', x + itemWidth / 2, imgY + imgSize / 2, { align: 'center' });
        }

        if (gift.brand) {
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.text(gift.brand, x + itemWidth / 2, y + itemHeight - 2, { align: 'center' });
        }

        itemCount++;
        x += itemWidth;

        if (itemCount % itemsPerRow === 0) {
            x = margin;
            y += itemHeight;

            if (itemCount % (itemsPerRow * itemsPerColumn) === 0 && itemCount < processedGifts.length) {
                doc.addPage();
                y = margin;
            }
        }
    }

    // Pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Liste faite avec Amour par ${profile.name} - Page ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

        const pdfBlob = doc.output('blob');
    const fileName = `Liste_Noel_${profile.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    // ✅ Détection simplifiée du partage natif
    if (navigator.share) {
        try {
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            // ✅ Partage direct sans vérification canShare (qui peut bloquer)
            await navigator.share({
                title: `Liste de Noël de ${profile.name}`,
                text: `Voici la liste de cadeaux de ${profile.name} pour Noël 🎄`,
                files: [file]
            });
            
            // ✅ Notification uniquement si partage réussi
            if (typeof showNotification === 'function') {
                showNotification('✅ PDF partagé avec succès !', 'success');
            }
            
        } catch (error) {
            // Si l'utilisateur annule (AbortError), ne rien faire
            if (error.name === 'AbortError') {
                console.log('Partage annulé par l\'utilisateur');
                return;
            }
            
            // Si erreur réelle, fallback sur téléchargement
            console.warn('Partage non supporté, téléchargement direct:', error);
            doc.save(fileName);
            
            if (typeof showNotification === 'function') {
                showNotification('💾 PDF téléchargé sur l\'appareil', 'success');
            }
        }
    } else {
        // ✅ Fallback desktop : téléchargement direct
        doc.save(fileName);
        
        if (typeof showNotification === 'function') {
            showNotification('💾 PDF téléchargé sur l\'appareil', 'success');
        }
    }
}
