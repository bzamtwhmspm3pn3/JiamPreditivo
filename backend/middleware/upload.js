// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Configurar armazenamento
const storage = multer.memoryStorage(); // Usar memória para desenvolvimento

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ];
  
  const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use CSV, Excel ou JSON.'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  }
});

module.exports = upload;