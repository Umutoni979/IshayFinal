const multer = require('multer');
const path   = require('path');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/avatars'));
  },
  filename: (_req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${unique}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext     = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
  }
};

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('avatar');

module.exports = { uploadAvatar };
