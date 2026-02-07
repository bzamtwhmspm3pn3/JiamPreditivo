const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar armazenamento local para Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPG, PNG, GIF)'));
  }
};

// Middleware de upload com Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

// Função para upload para Cloudinary
const uploadToCloudinary = async (filePath, folder = 'jiam') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto'
    });
    return result;
  } catch (error) {
    console.error('Erro ao fazer upload para Cloudinary:', error);
    throw error;
  }
};

// Função para deletar do Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Erro ao deletar do Cloudinary:', error);
  }
};

// Exportar tudo de forma correta
module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary
};
