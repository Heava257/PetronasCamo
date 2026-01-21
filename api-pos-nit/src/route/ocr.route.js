const { scanSlip } = require("../controller/ocr.controller");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage: storage });

module.exports = (app) => {
    app.post("/api/ocr/scan", upload.single('image'), scanSlip);
};
