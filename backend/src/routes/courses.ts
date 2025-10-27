import { Router } from 'express';
import { Course } from '../models/Course';
import { auth } from '../middleware/auth';
import { upload, uploadToMinio, minioClient } from '../middleware/upload';
import mongoose from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ObjectId, GridFSBucket } = require('mongodb');

const router = Router();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('badge')
      .populate('createdBy', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('badge')
      .populate('createdBy', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course' });
  }
});

// Create course (admin only)
router.post('/', auth, upload.single('thumbnail'), uploadToMinio, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const course = await Course.create({
      ...req.body,
      thumbnail: req.file?.filename,
      createdBy: req.user.id,
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error creating course' });
  }
});

// Add chapter with files to a course (admin only)
router.post('/:id/chapters', auth, upload.fields([{ name: 'files', maxCount: 20 }]), uploadToMinio, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { title, description } = req.body;

    // Map uploaded files to chapter content entries
    const files = (req.files && (req.files as any).files) || [];

    const mimeToType = (mimetype: string) => {
      if (mimetype === 'application/pdf') return 'pdf';
      if (mimetype.startsWith('video/')) return 'video';
      if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'presentation';
      // fallback based on prefix
      if (mimetype.startsWith('image/')) return 'presentation';
      return 'pdf';
    };

    const content = files.map((f: any) => {
      const type = mimeToType(f.mimetype);
      let url = f.filename;
      if (f.storage === 'gridfs') {
        // GridFS served through backend
        url = `/api/files/${f.filename}`;
      }
      return { type, url };
    });

    course.chapters.push({
      title,
      description,
      content,
    });

    await course.save();

    res.status(201).json(course);
  } catch (error) {
    console.error('Error in POST /:id/chapters', error);
    // Return the actual error message to help debugging in dev
    const msg = (error && (error as any).message) ? (error as any).message : 'Error adding chapter';
    const stack = (error && (error as any).stack) ? (error as any).stack : undefined;
    res.status(500).json({ message: msg, stack });
  }
});

// Complete course chapter
router.post('/:courseId/chapters/:chapterId/complete', auth, async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // try to find chapter by subdoc id or fallback to _id string
    const chapter = (course as any).chapters.id ? (course as any).chapters.id(chapterId) : undefined;
    const chapterExists = chapter || (course as any).chapters.find((c: any) => (c as any)._id?.toString() === chapterId || (c as any).id === chapterId);
    if (!chapterExists) return res.status(404).json({ message: 'Chapter not found' });

    // NOTE: user progress tracking is not implemented in the User model yet.
    // For now, accept the completion request and return success. This avoids 404s
    // from the frontend when users mark chapters as completed.
    return res.json({ message: 'Chapter marked completed' });
  } catch (error: any) {
    console.error('Error marking chapter complete', error);
    return res.status(500).json({ message: error?.message || 'Error completing chapter' });
  }
});

// Delete a chapter from a course (admin or teacher)
router.delete('/:courseId/chapters/:chapterId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { courseId, chapterId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    let chapter: any = undefined;
    // try Mongoose subdocument id helper, fallback to find by _id or id string
    try {
      chapter = (course as any).chapters.id ? (course as any).chapters.id(chapterId) : undefined;
    } catch (_) {
      // ignore
    }
    if (!chapter) {
      chapter = (course as any).chapters.find((c: any) => (c as any)._id?.toString() === chapterId || (c as any).id === chapterId);
    }
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

    // Delete associated files: if url starts with /api/files/ -> GridFS id; else assume MinIO key
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    for (const content of chapter.content || []) {
      const url: string = content.url || '';
      if (url.startsWith('/api/files/')) {
        const idStr = url.replace('/api/files/', '');
        try {
          await bucket.delete(new ObjectId(idStr));
        } catch (e: any) {
          console.warn('Failed deleting gridfs file', idStr, e?.message || e);
        }
      } else if (typeof url === 'string' && url.length > 0) {
        try {
          await minioClient.removeObject(process.env.MINIO_BUCKET || 'capacitaciones', url);
        } catch (e: any) {
          console.warn('Failed deleting minio object', url, e?.message || e);
        }
      }
    }

    // remove chapter from array
    chapter.remove();
    await course.save();
    res.json({ message: 'Chapter deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting chapter' });
  }
});

// Delete a course (admin or teacher)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Delete thumbnail if present (stored as MinIO key)
    if ((course as any).thumbnail) {
      try {
        await minioClient.removeObject(process.env.MINIO_BUCKET || 'capacitaciones', (course as any).thumbnail);
      } catch (e: any) {
        console.warn('Failed deleting thumbnail', e?.message || e);
      }
    }

    // Delete chapter files
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    for (const chapter of course.chapters || []) {
      for (const content of chapter.content || []) {
        const url: string = content.url || '';
        if (url.startsWith('/api/files/')) {
          const idStr = url.replace('/api/files/', '');
          try {
            await bucket.delete(new ObjectId(idStr));
          } catch (e: any) {
            console.warn('Failed deleting gridfs file', idStr, e?.message || e);
          }
        } else if (typeof url === 'string' && url.length > 0) {
          try {
            await minioClient.removeObject(process.env.MINIO_BUCKET || 'capacitaciones', url);
          } catch (e: any) {
            console.warn('Failed deleting minio object', url, e?.message || e);
          }
        }
      }
    }

    await course.deleteOne();
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting course' });
  }
});

export default router;
