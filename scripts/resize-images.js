const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ===== Configuration =====
const CONFIG = {
    galleryDir: path.join(__dirname, '../images/gallery'),
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 82
};

// ===== Main Process =====
async function main() {
    console.log('\n========================================');
    console.log('   Image Resize Script');
    console.log('========================================\n');
    console.log(`Max size: ${CONFIG.maxWidth}x${CONFIG.maxHeight}`);
    console.log(`Quality: ${CONFIG.quality}\n`);

    // Get all subdirectories in gallery
    const subDirs = fs.readdirSync(CONFIG.galleryDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    let totalProcessed = 0;
    let totalSizeBefore = 0;
    let totalSizeAfter = 0;

    for (const subDir of subDirs) {
        const dirPath = path.join(CONFIG.galleryDir, subDir);
        const files = fs.readdirSync(dirPath)
            .filter(f => f.toLowerCase().endsWith('.webp'));

        console.log(`\n[${subDir}] - ${files.length} images`);

        for (const file of files) {
            const filePath = path.join(dirPath, file);

            try {
                // Get original file size
                const statBefore = fs.statSync(filePath);
                const sizeBefore = statBefore.size;
                totalSizeBefore += sizeBefore;

                // Get image metadata
                const metadata = await sharp(filePath).metadata();

                // Skip if already small enough
                if (metadata.width <= CONFIG.maxWidth && metadata.height <= CONFIG.maxHeight) {
                    console.log(`  [SKIP] ${file} - already ${metadata.width}x${metadata.height}`);
                    totalSizeAfter += sizeBefore;
                    continue;
                }

                // Resize image
                const tempPath = filePath + '.tmp';
                await sharp(filePath)
                    .resize(CONFIG.maxWidth, CONFIG.maxHeight, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: CONFIG.quality })
                    .toFile(tempPath);

                // Replace original with resized
                fs.unlinkSync(filePath);
                fs.renameSync(tempPath, filePath);

                // Get new file size
                const statAfter = fs.statSync(filePath);
                const sizeAfter = statAfter.size;
                totalSizeAfter += sizeAfter;

                const reduction = ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
                console.log(`  [OK] ${file}: ${(sizeBefore/1024/1024).toFixed(1)}MB -> ${(sizeAfter/1024/1024).toFixed(1)}MB (-${reduction}%)`);

                totalProcessed++;

            } catch (error) {
                console.error(`  [ERROR] ${file}: ${error.message}`);
            }
        }
    }

    console.log('\n========================================');
    console.log(`Total processed: ${totalProcessed} images`);
    console.log(`Size before: ${(totalSizeBefore/1024/1024).toFixed(1)}MB`);
    console.log(`Size after: ${(totalSizeAfter/1024/1024).toFixed(1)}MB`);
    console.log(`Reduction: ${((1 - totalSizeAfter/totalSizeBefore) * 100).toFixed(1)}%`);
    console.log('========================================\n');
}

main().catch(console.error);
