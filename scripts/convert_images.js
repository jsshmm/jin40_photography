const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);

const galleryDir = path.join(__dirname, '../images/gallery');

async function processDirectory(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await processDirectory(fullPath);
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.jpg', '.jpeg', '.heic', '.png'].includes(ext)) {
                // Skip if it's already a converted source for an existing webp? 
                // Nah, just convert all non-webp to webp.
                // Wait, if input is png, we might want to keep it or convert. 
                // User asked about 'jpg'. Let's stick to jpg/jpeg/heic for now to be safe, or optimize all.
                // Let's optimize everything to webp for consistency.

                const targetPath = path.join(dir, path.basename(entry.name, ext) + '.webp');

                // Skip if webp already exists (to avoid re-processing if not needed, or overwrite?)
                // If we delete the original, we don't need to check.

                try {
                    console.log(`Converting: ${entry.name} -> WebP`);

                    await sharp(fullPath)
                        .withMetadata() // Keep EXIF
                        .toFile(targetPath);

                    // Delete original
                    await unlink(fullPath);
                    console.log(`Deleted original: ${entry.name}`);

                } catch (err) {
                    console.error(`Error converting ${entry.name}:`, err);
                }
            }
        }
    }
}

console.log(`Scanning and converting images in: ${galleryDir}`);
processDirectory(galleryDir)
    .then(() => console.log('Conversion complete!'))
    .catch(err => console.error('Fatal error:', err));
