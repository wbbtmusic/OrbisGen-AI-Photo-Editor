/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
        img.src = src;
    });
}

/**
 * Creates a single "photo album" page image from a collection of images.
 * @param imageData A record mapping category strings to their image data URLs.
 * @param title The main title to display on the album page.
 * @returns A promise that resolves to a data URL of the generated album page (JPEG format).
 */
export async function createAlbumPage(imageData: Record<string, string>, title: string): Promise<string> {
    const canvas = document.createElement('canvas');
    // A4 Ratio at 300 DPI
    const canvasWidth = 2480; 
    const canvasHeight = 3508;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D canvas context');
    }

    // Background
    ctx.fillStyle = '#1E1E1E'; 
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Main Title
    ctx.fillStyle = '#F5F5F5';
    ctx.textAlign = 'center';
    ctx.font = `bold 100px 'Caveat', cursive`;
    ctx.fillText(title, canvasWidth / 2, 150);

    // Subtitle
    ctx.font = `50px 'Inter', sans-serif`;
    ctx.fillStyle = '#A0A0A0';
    ctx.fillText('Generated with OrbisGen', canvasWidth / 2, 220);

    const categories = Object.keys(imageData);
    const loadedImages = await Promise.all(
        Object.values(imageData).map(url => loadImage(url))
    );

    const imagesWithCategories = categories.map((category, index) => ({
        category,
        img: loadedImages[index],
    }));

    // Grid layout calculation
    const gridRows = Math.ceil(imagesWithCategories.length / 2);
    const grid = { cols: 2, rows: gridRows, padding: 100 };
    const contentTopMargin = 300;
    const contentHeight = canvasHeight - contentTopMargin;
    const cellWidth = (canvasWidth - grid.padding * (grid.cols + 1)) / grid.cols;
    const cellHeight = (contentHeight - grid.padding * (grid.rows + 1)) / grid.rows;

    const polaroidAspectRatio = 1.2;
    const maxPolaroidWidth = cellWidth * 0.9;
    const maxPolaroidHeight = cellHeight * 0.9;

    let polaroidWidth = maxPolaroidWidth;
    let polaroidHeight = polaroidWidth * polaroidAspectRatio;

    if (polaroidHeight > maxPolaroidHeight) {
        polaroidHeight = maxPolaroidHeight;
        polaroidWidth = polaroidHeight / polaroidAspectRatio;
    }

    const imageContainerWidth = polaroidWidth * 0.9;
    const imageContainerHeight = imageContainerWidth; // Square image area

    // Drawing each polaroid
    imagesWithCategories.forEach(({ category, img }, index) => {
        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;

        const x = grid.padding * (col + 1) + cellWidth * col + (cellWidth - polaroidWidth) / 2;
        const y = contentTopMargin + grid.padding * (row + 1) + cellHeight * row + (cellHeight - polaroidHeight) / 2;
        
        ctx.save();
        ctx.translate(x + polaroidWidth / 2, y + polaroidHeight / 2);
        
        const rotation = (Math.random() - 0.5) * 0.1; // Random rotation between ~ -2.8 and +2.8 degrees
        ctx.rotate(rotation);
        
        // Polaroid shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 15;
        
        // Polaroid body
        ctx.fillStyle = '#fff';
        ctx.fillRect(-polaroidWidth / 2, -polaroidHeight / 2, polaroidWidth, polaroidHeight);
        
        ctx.shadowColor = 'transparent'; // Reset shadow for inner content
        
        // Calculate image dimensions to fit inside the polaroid's image area
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = imageContainerWidth;
        let drawHeight = drawWidth / aspectRatio;

        if (drawHeight > imageContainerHeight) {
            drawHeight = imageContainerHeight;
            drawWidth = drawHeight * aspectRatio;
        }

        const imageAreaTopMargin = (polaroidWidth - imageContainerWidth) / 2;
        const imageContainerY = -polaroidHeight / 2 + imageAreaTopMargin;
        
        const imgX = -drawWidth / 2;
        const imgY = imageContainerY + (imageContainerHeight - drawHeight) / 2;
        
        ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
        
        // Caption
        ctx.fillStyle = '#222';
        ctx.font = `60px 'Permanent Marker', cursive`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const captionAreaTop = imageContainerY + imageContainerHeight;
        const captionAreaBottom = polaroidHeight / 2;
        const captionY = captionAreaTop + (captionAreaBottom - captionAreaTop) / 2;

        ctx.fillText(category, 0, captionY);
        
        ctx.restore();
    });

    return canvas.toDataURL('image/jpeg', 0.9);
}
