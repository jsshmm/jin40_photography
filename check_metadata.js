const sharp = require('sharp');
const path = require('path');

const imgPath = path.join(__dirname, 'images/gallery/photo1.webp');

sharp(imgPath)
    .metadata()
    .then(metadata => {
        console.log('Metadata for photo1.webp:');
        console.log(JSON.stringify(metadata, null, 2));
        if (metadata.exif) {
            console.log('EXIF data found (buffer)');
        } else {
            console.log('No EXIF data found');
        }
    })
    .catch(err => {
        console.error('Error reading metadata:', err);
    });
