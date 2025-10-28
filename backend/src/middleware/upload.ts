import multer from 'multer';
import { Client } from 'minio';
import * as crypto from 'crypto';
import path from 'path';
import mongoose from 'mongoose';

// Reemplazar uuid con una función personalizada
const generateId = () => crypto.randomBytes(16).toString('hex');

// Configuración del cliente MinIO - usar localhost cuando se ejecuta fuera de Docker
const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || (isDocker ? 'minio' : 'localhost'),
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Crear bucket si no existe
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

// Configuración de Multer para la subida de archivos
const storage = multer.memoryStorage();

// Filtro de archivos permitidos
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

// Middleware para subir archivos a MinIO o GridFS
export const uploadToMinio = async (req: any, res: any, next: any) => {
  if (!req.files) return next();

  try {
    // Accesso a la base de datos de MongoDB
    const db = mongoose.connection.db;
    const { GridFSBucket } = require('mongodb');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    for (const field in req.files) {
      for (const file of req.files[field]) {
        const isVideo = file.mimetype.startsWith('video/');

        if (isVideo) {
          // subir con MinIO
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
          file.storage = 'minio';
        } else {
          // almacenar en GridFS
          const uploadStream = bucket.openUploadStream(file.originalname, {
            contentType: file.mimetype,
          });

          // escribe un buffer en el stream
          await new Promise<void>((resolve, reject) => {
            uploadStream.end(file.buffer, (err: any) => {
              if (err) return reject(err);
              resolve();
            });
          });

          const fileId = uploadStream.id as any;
          // guardar el id de GridFS en el archivo
          file.filename = fileId.toString();
          file.storage = 'gridfs';
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};