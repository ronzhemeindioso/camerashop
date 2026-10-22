const multer = require("multer");
const path = require("path");

module.exports = multer({
    limits: { fieldSize: 100 * 1024 * 1024 },
    storage: multer.diskStorage({}),
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname).toLowerCase();
        if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
            return cb(new Error("Unsupported file type! Only .jpg, .jpeg and .png images are allowed"));
        }
        cb(null, true);
    },
});