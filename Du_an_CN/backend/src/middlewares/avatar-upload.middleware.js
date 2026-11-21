
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const avatarDirectory = path.resolve(
    __dirname,
    '..',
    'uploads',
    'avatars'
);

// Tạo thư mục lưu ảnh nếu chưa tồn tại.
if (!fs.existsSync(avatarDirectory)) {
    fs.mkdirSync(avatarDirectory, { recursive: true });
}

// Chỉ chấp nhận các định dạng ảnh phổ biến.
const allowedMimeTypes = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, avatarDirectory);
    },

    filename: (req, file, callback) => {
        const extension = allowedMimeTypes[file.mimetype];

        if (!extension) {
            return callback(
                new Error('Định dạng ảnh không được hỗ trợ.')
            );
        }

        const filename = `${crypto.randomUUID()}${extension}`;

        callback(null, filename);
    }
});

const fileFilter = (req, file, callback) => {
    if (!allowedMimeTypes[file.mimetype]) {
        return callback(
            new Error(
                'Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.'
            ),
            false
        );
    }

    callback(null, true);
};

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

module.exports = uploadAvatar;
    