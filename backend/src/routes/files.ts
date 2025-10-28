import { Router } from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const router = Router();

// Obtener un archivo por ID
router.get('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { GridFSBucket, ObjectId: ObjId } = require('mongodb');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const fileId = new ObjId(req.params.id);
    // Tratar el caso en que el archivo no existe
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    const file = files[0];
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Disposition', `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('error', (err: any) => {
      res.status(500).json({ message: 'Error transmitiendo archivo' });
    });
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo archivo' });
  }
});

export default router;
