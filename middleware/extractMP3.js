const multer = require("multer");

const MIME_TYPE_MAP = {
  "audio/mpeg": "mp3",
  "audio/mpeg3": "mp3",
  "audio/x-mpeg-3": "mp3",
  "audio/mp3": "mp3"
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    let error = new Error("Invalid MIME type");
    if (isValid) {
      error = null;
    }
    cb(null, "mp3");
  },
  filename: (req, file, cb) => {
    const name = file.originalname
      .toLowerCase()
      .replace(/[!@#$%^&*()-=_+|;':",.<>?`]+/g, '')
      .split(" ")
      .join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, name + "." + ext);
  }
});

module.exports = multer({ storage: storage }).single("mp3");
