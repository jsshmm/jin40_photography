const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const exifReader = require('exif-reader');
const readline = require('readline');

// ===== Configuration =====
const CONFIG = {
    inputDir: path.join(__dirname, '../images/new'),
    outputDir: path.join(__dirname, '../images/gallery'),
    metadataPath: path.join(__dirname, '../data/metadata.json'),
    supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.heic'],
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 82
};

// ===== Helper Functions =====
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

async function askQuestion(rl, question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

async function getImageFiles(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        return [];
    }

    const files = fs.readdirSync(dir);
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return CONFIG.supportedFormats.includes(ext);
    });
}

async function extractExif(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        let exif = {};

        if (metadata.exif) {
            try {
                exif = exifReader(metadata.exif);
            } catch (e) {
                console.log('  EXIF parsing failed, using defaults');
            }
        }

        return {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            // EXIF data
            make: exif.Image?.Make || exif.image?.Make || null,
            model: exif.Image?.Model || exif.image?.Model || null,
            aperture: exif.Photo?.FNumber || exif.exif?.FNumber || null,
            exposureTime: exif.Photo?.ExposureTime || exif.exif?.ExposureTime || null,
            iso: exif.Photo?.ISOSpeedRatings || exif.exif?.ISO || null,
            focalLength: exif.Photo?.FocalLength || exif.exif?.FocalLength || null,
            lensModel: exif.Photo?.LensModel || exif.exif?.LensModel || null,
            dateTimeOriginal: exif.Photo?.DateTimeOriginal || exif.exif?.DateTimeOriginal || null
        };
    } catch (error) {
        console.error('Error extracting metadata:', error.message);
        return { width: 0, height: 0 };
    }
}

async function convertToWebp(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(CONFIG.maxWidth, CONFIG.maxHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: CONFIG.quality })
            .toFile(outputPath);
        return true;
    } catch (error) {
        console.error('Error converting image:', error.message);
        return false;
    }
}

function loadMetadata() {
    if (fs.existsSync(CONFIG.metadataPath)) {
        const content = fs.readFileSync(CONFIG.metadataPath, 'utf-8');
        return JSON.parse(content);
    }
    return [];
}

function saveMetadata(metadata) {
    fs.writeFileSync(CONFIG.metadataPath, JSON.stringify(metadata, null, 2));
}

function generateFilename(index, existingFiles) {
    let num = existingFiles.length + index + 1;
    return `photo${num}.webp`;
}

// ===== Main Process =====
async function main() {
    console.log('\n========================================');
    console.log('   Photo Upload Script');
    console.log('========================================\n');

    // Check for images in input directory
    const imageFiles = await getImageFiles(CONFIG.inputDir);

    if (imageFiles.length === 0) {
        console.log(`No images found in: ${CONFIG.inputDir}`);
        console.log('\nUsage:');
        console.log('1. Put your photos in the "images/new" folder');
        console.log('2. Run: npm run add-photos');
        console.log('');
        return;
    }

    console.log(`Found ${imageFiles.length} image(s) to process.\n`);

    // Interactive prompts
    const rl = createReadlineInterface();

    const country = await askQuestion(rl, 'Country (e.g., japan, korea, vietnam): ');
    if (!country) {
        console.log('Country is required. Aborting.');
        rl.close();
        return;
    }

    let year = await askQuestion(rl, 'Year (press Enter for auto-detect from EXIF): ');

    rl.close();

    // Create output directory
    const outputSubDir = year
        ? `${year}-${country.toLowerCase()}`
        : `new-${country.toLowerCase()}`;
    const fullOutputDir = path.join(CONFIG.outputDir, outputSubDir);

    if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true });
    }

    // Get existing files in output directory
    const existingFiles = fs.existsSync(fullOutputDir)
        ? fs.readdirSync(fullOutputDir).filter(f => f.endsWith('.webp'))
        : [];

    // Load existing metadata
    const metadata = loadMetadata();

    console.log('\nProcessing images...\n');

    let successCount = 0;

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const inputPath = path.join(CONFIG.inputDir, file);

        console.log(`[${i + 1}/${imageFiles.length}] ${file}`);

        // Extract EXIF
        const exifData = await extractExif(inputPath);
        console.log(`  - Size: ${exifData.width}x${exifData.height}`);
        if (exifData.model) console.log(`  - Camera: ${exifData.model}`);

        // Determine year from EXIF if not provided
        let photoYear = year;
        if (!photoYear && exifData.dateTimeOriginal) {
            const date = new Date(exifData.dateTimeOriginal);
            photoYear = date.getFullYear().toString();
            console.log(`  - Year (from EXIF): ${photoYear}`);
        }
        if (!photoYear) {
            photoYear = new Date().getFullYear().toString();
            console.log(`  - Year (default): ${photoYear}`);
        }

        // Update output directory if year was auto-detected
        const finalOutputSubDir = `${photoYear}-${country.toLowerCase()}`;
        const finalOutputDir = path.join(CONFIG.outputDir, finalOutputSubDir);
        if (!fs.existsSync(finalOutputDir)) {
            fs.mkdirSync(finalOutputDir, { recursive: true });
        }

        // Get existing files count for this specific directory
        const dirExistingFiles = fs.readdirSync(finalOutputDir).filter(f => f.endsWith('.webp'));

        // Generate output filename
        const outputFilename = `photo${dirExistingFiles.length + 1}.webp`;
        const outputPath = path.join(finalOutputDir, outputFilename);

        // Convert to webp
        const success = await convertToWebp(inputPath, outputPath);

        if (success) {
            // Get final image dimensions
            const finalMetadata = await sharp(outputPath).metadata();

            // Create metadata entry
            const entry = {
                filename: outputFilename,
                width: finalMetadata.width,
                height: finalMetadata.height,
                format: 'webp',
                make: exifData.make,
                model: exifData.model,
                aperture: exifData.aperture,
                exposureTime: exifData.exposureTime,
                iso: exifData.iso,
                focalLength: exifData.focalLength,
                lensModel: exifData.lensModel,
                dateTimeOriginal: exifData.dateTimeOriginal ? new Date(exifData.dateTimeOriginal).toISOString() : null,
                filePath: `${finalOutputSubDir}/${outputFilename}`,
                year: photoYear,
                country: country.toLowerCase()
            };

            // Add to metadata array (at the beginning for newest first)
            metadata.unshift(entry);

            console.log(`  - Saved: ${entry.filePath}`);
            successCount++;

            // Delete original file
            fs.unlinkSync(inputPath);
            console.log(`  - Original deleted`);
        } else {
            console.log(`  - Failed to convert`);
        }

        console.log('');
    }

    // Save updated metadata
    saveMetadata(metadata);

    console.log('========================================');
    console.log(`Done! ${successCount}/${imageFiles.length} photos processed.`);
    console.log(`Metadata updated: ${CONFIG.metadataPath}`);
    console.log('========================================\n');
}

main().catch(console.error);
