// Fonction auxiliaire pour convertir URL en base64
async function urlToBase64(url) {
    try {
        // Essai 1 : Fetch direct
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        // Essai 2 : Via proxy CORS
        try {
            const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxiedUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (proxyError) {
            console.warn(`Impossible de charger l'image: ${url}`);
            return null;
        }
    }
}

async function generatePDF(profile, gifts, wisdomLevel) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const itemsPerRow = 4;
    const itemsPerColumn = 5;
    const itemWidth = (pageWidth - (margin * 2)) / itemsPerRow;
    const itemHeight = (pageHeight - (margin * 2) - 20) / itemsPerColumn;

    // ⭐ CONVERSION DES URLS EN BASE64 AVANT GÉNÉRATION
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

    // Niveau de sagesse
    const wisdomEmoji = wisdomLevel < 33 ? '😢' : wisdomLevel < 66 ? '😐' : '😊';
    doc.setFontSize(12);
    doc.text(`Sagesse cette année : ${wisdomLevel}%`, pageWidth / 2, 18, { align: 'center' });

    let x = margin;
    let y = 30;
    let itemCount = 0;

    // ⭐ UTILISER LES CADEAUX AVEC IMAGES CONVERTIES
    for (const gift of processedGifts) {
        // Nom du cadeau
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        const textLines = doc.splitTextToSize(gift.name, itemWidth - 4);
        doc.text(textLines, x + itemWidth / 2, y, { align: 'center' });

        // Image (maintenant en base64)
        if (gift.image) {
            try {
                const imgY = y + (textLines.length * 3);
                const imgSize = Math.min(itemWidth - 4, itemHeight - (textLines.length * 3) - 4);
                doc.addImage(gift.image, 'JPEG', x + 2, imgY, imgSize, imgSize);
            } catch (error) {
                console.error('Erreur image:', error);
                // Afficher un placeholder si l'image échoue
                doc.setFontSize(20);
                doc.setTextColor(200, 200, 200);
                doc.text('🎁', x + itemWidth / 2, imgY + imgSize / 2, { align: 'center' });
            }
        } else {
            // Pas d'image : afficher un emoji cadeau
            const imgY = y + (textLines.length * 3);
            const imgSize = Math.min(itemWidth - 4, itemHeight - (textLines.length * 3) - 4);
            doc.setFontSize(30);
            doc.setTextColor(200, 200, 200);
            doc.text('🎁', x + itemWidth / 2, imgY + imgSize / 2, { align: 'center' });
        }

        // Marque si présente
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

    // Sauvegarder et partager
    const pdfBlob = doc.output('blob');
    const fileName = `Liste_Noel_${profile.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;

    // Utiliser l'API Web Share si disponible
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            await navigator.share({
                title: `Liste de Noël de ${profile.name}`,
                text: `Voici la liste de cadeaux de ${profile.name} pour Noël 🎄`,
                files: [file]
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Erreur partage:', error);
                doc.save(fileName);
            }
        }
    } else {
        doc.save(fileName);
        showNotification('📄 PDF téléchargé avec succès !', 'success');
    }
}
