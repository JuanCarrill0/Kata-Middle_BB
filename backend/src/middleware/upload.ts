import multer from 'multer';
import { Client } from 'minio';
import * as crypto from 'crypto';
import path from 'path';

// Reemplazar uuid con una función personalizada
const generateId = () => crypto.randomBytes(16).toString('hex');

// Configure MinIO client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',  // Usar el nombre del servicio en docker-compose
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Ensure bucket exists
const bucketName = process.env.MINIO_BUCKET || 'capacitaciones';
minioClient.bucketExists(bucketName, (err, exists) => {
  if (err) {
    console.error('Error checking bucket:', err);
    return;
  }

  if (!exists) {
    minioClient.makeBucket(bucketName, 'us-east-1', (err) => {
      if (err) {
        console.error('Error creating bucket:', err);
        return;
      }
      console.log('Bucket created successfully');
    });
  }
});

// Configure Multer for file upload
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'video/mp4',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

export const upload = {
  single: (fieldName: string) => multerUpload.single(fieldName),
  fields: (fields: { name: string, maxCount: number }[]) => multerUpload.fields(fields),
};

// Middleware to upload file to MinIO after Multer processes it
export const uploadToMinio = async (req: any, res: any, next: any) => {
  if (!req.files) return next();

  try {
    for (const field in req.files) {
      for (const file of req.files[field]) {
        const extension = path.extname(file.originalname);
        const filename = `${generateId()}${extension}`;
        
        await minioClient.putObject(
          bucketName,
          filename,
          file.buffer,
          file.size,
          file.mimetype
        );

        file.filename = filename;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};