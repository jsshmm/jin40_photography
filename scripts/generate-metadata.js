const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const exifReader = require('exif-reader');

const galleryDir = path.join(__dirname, '../images/gallery');
const outputDir = path.join(__dirname, '../data');
const outputFile = path.join(outputDir, 'metadata.json');

// Ensure data directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

function parseFractions(fraction) {
    if (!fraction) return null;
    if (typeof fraction === 'number') return fraction;
    if (Array.isArray(fraction) && fraction.length === 2) {
        return fraction[0] / fraction[1];
    }
    return fraction;
}

async function getExifData(filePath) {
    try {
        const image = sharp(filePath);
        const metadata = await image.metadata();

        const result = {
            filename: path.basename(filePath),
            width: metadata.width,
            height: metadata.height,
            format: metadata.format
        };

        if (metadata.exif) {
            try {
                const exif = exifReader(metadata.exif);

                if (exif && exif.Image) {
                    result.make = exif.Image.Make;
                    result.model = exif.Image.Model;
                }

                if (exif && exif.Photo) {
                    result.aperture = exif.Photo.FNumber;
                    result.exposureTime = exif.Photo.ExposureTime;
                    result.iso = exif.Photo.ISOSpeedRatings;
                    result.focalLength = exif.Photo.FocalLength;
                    result.lensModel = exif.Photo.LensModel;
                    result.dateTimeOriginal = exif.Photo.DateTimeOriginal;
                }
            } catch (exifErr) {
                console.warn(`Could not parse EXIF for ${filePath}:`, exifErr.message);
            }
        }

        return result;
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message);
        return null;
    }
}

const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getImagesRecursively(dir) {
    let results = [];
    const list = await readdir(dir);

    for (const file of list) {
        if (file.startsWith('.')) continue; // skip hidden files
        const filePath = path.join(dir, file);
        const stats = await stat(filePath);

        if (stats && stats.isDirectory()) {
            results = results.concat(await getImagesRecursively(filePath));
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.webp', '.jpg', '.jpeg', '.png'].includes(ext)) {
                results.push(filePath);
            }
        }
    }
    return results;
}

function parseDirectoryInfo(filePath) {
    const parentDir = path.dirname(filePath);
    const dirName = path.basename(parentDir);

    // Check if parent dir matches YYYY-Country format
    const match = dirName.match(/^(\d{4})-(.+)$/);
    if (match) {
        return {
            year: match[1],
            country: match[2]
        };
    }
    return { year: null, country: null };
}

async function run() {
    console.log('Scanning gallery recursively...');
    const allFiles = await getImagesRecursively(galleryDir);

    const metadataList = []; // Array is better for iteration

    for (const filePath of allFiles) {
        const exifData = await getExifData(filePath);
        if (exifData) {
            // Get folder info
            const folderInfo = parseDirectoryInfo(filePath);

            // Get relative path for frontend usage
            const relativePath = path.relative(galleryDir, filePath);

            metadataList.push({
                ...exifData,
                filePath: relativePath, // e.g., "2025-cambodia/photo1.webp"
                year: folderInfo.year,
                country: folderInfo.country
            });
        }
    }

    // Sort by Date Taken (descending) if available, otherwise filename
    metadataList.sort((a, b) => {
        const dateA = a.dateTimeOriginal ? new Date(a.dateTimeOriginal) : new Date(0);
        const dateB = b.dateTimeOriginal ? new Date(b.dateTimeOriginal) : new Date(0);
        return dateB - dateA;
    });

    fs.writeFileSync(outputFile, JSON.stringify(metadataList, null, 2));
    console.log(`Metadata saved to ${outputFile}. Total images: ${metadataList.length}`);
}

run();
