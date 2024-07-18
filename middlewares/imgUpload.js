const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: './images/', // Define the destination folder
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Initialize upload variable
const upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 }, // Limit file size to 1MB
})

module.exports = upload;