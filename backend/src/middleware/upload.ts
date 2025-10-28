import multer from 'multer';
import { Client } from 'minio';
import * as crypto from 'crypto';
import path from 'path';
import mongoose from 'mongoose';

// Reemplazar uuid con una función personalizada
const generateId = () => crypto.randomBytes(16).toString('hex');

// Configure MinIO client - use localhost when running outside Docker
const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || (isDocker ? 'minio' : 'localhost'),
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

// Middleware to upload files: videos -> MinIO; others -> GridFS
export const uploadToMinio = async (req: any, res: any, next: any) => {
  if (!req.files) return next();

  try {
    // Access the raw MongoDB db for GridFS
    const db = mongoose.connection.db;
    // use dynamic require to avoid TS types issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GridFSBucket } = require('mongodb');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    for (const field in req.files) {
      for (const file of req.files[field]) {
        const isVideo = file.mimetype.startsWith('video/');

        if (isVideo) {
          // upload to MinIO
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
          // store in GridFS
          const uploadStream = bucket.openUploadStream(file.originalname, {
            contentType: file.mimetype,
          });

          // write buffer and await finish
          await new Promise<void>((resolve, reject) => {
            uploadStream.end(file.buffer, (err: any) => {
              if (err) return reject(err);
              resolve();
            });
          });

          const fileId = uploadStream.id as any;
          // store file id so it can be served later
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