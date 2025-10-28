import { Router } from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Badge } from '../models/Badge';
import { History } from '../models/History';
import { auth } from '../middleware/auth';
import { upload, uploadToMinio, minioClient } from '../middleware/upload';
// Notifications will be stored in-app on User.notifications; no email sending here.
import mongoose from 'mongoose';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ObjectId, GridFSBucket } = require('mongodb');

const router = Router();

// Get all courses - now requires auth. Users must be subscribed to module to view courses.
router.get('/', auth, async (req, res) => {
  try {
    // Teachers and admins can see all courses
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      const courses = await Course.find()
        .populate('badge')
        .populate('createdBy', 'name email');
      return res.json(courses);
    }

    // Regular users: only courses whose module is in their subscribedModules
    const user = await User.findById(req.user.id).select('subscribedModules').lean();
    const subs = (user && (user as any).subscribedModules) || [];
    if (!subs || subs.length === 0) return res.json([]);

    // Normalize subscription ids to ObjectId when possible for the $in query
    const subsIds = subs.map((s: any) => {
      try {
        if (typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s)) return new mongoose.Types.ObjectId(s);
        return s;
      } catch (e) {
        return s;
      }
    });

    const courses = await Course.find({ module: { $in: subsIds } })
      .populate('badge')
      .populate('createdBy', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

// Get course by ID - requires auth and subscription for regular users
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('badge')
      .populate('createdBy', 'name email')
      .populate('module');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      return res.json(course);
    }

    // regular user: check subscription
    const user = await User.findById(req.user.id).select('subscribedModules').lean();
    const subs = (user && (user as any).subscribedModules) || [];
    // Determine module id string robustly. If module is populated, use its _id.
    let moduleId: string | null = null;
    if ((course as any).module) {
      const mod = (course as any).module;
      if (typeof mod === 'object') {
        moduleId = (mod._id ? mod._id.toString() : (mod.id ? mod.id.toString() : mod.toString()));
      } else {
        moduleId = mod.toString();
      }
    } else {
      moduleId = (course as any).category || null;
    }

    if (!moduleId) return res.status(403).json({ message: 'Course not accessible' });

    const allowed = subs.some((s: any) => s && s.toString() === moduleId);
    if (!allowed) return res.status(403).json({ message: 'Not subscribed to this module' });

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

    // Determine module: prefer explicit module id; if category string provided, try to find/create Module
    let moduleId = req.body.module;
    if (!moduleId && req.body.category) {
      // lazy-require Module to avoid circular deps
      // Accept either a module id or a category/name string.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Module } = require('../models/Module');
      let m = null;
      try {
        // If category looks like an ObjectId, try to find by _id first
        if (/^[a-fA-F0-9]{24}$/.test(req.body.category)) {
          m = await Module.findById(req.body.category);
        }
      } catch (e) {
        // ignore invalid id errors
        m = null;
      }

      if (!m) {
        // Fallback to find by name
        m = await Module.findOne({ name: req.body.category });
      }

      if (!m) {
        // If still not found, create using the provided string as name
        m = await Module.create({ name: req.body.category, description: '' , createdBy: req.user.id});
      }
      moduleId = m._id;
    }

    const course = await Course.create({
      ...req.body,
      module: moduleId,
      thumbnail: req.file?.filename,
      createdBy: req.user.id,
    });

    res.status(201).json(course);

    // Create in-app notifications for users subscribed to this course's module/category
    (async () => {
      try {
        // determine module id to notify subscribers
        const moduleIdToNotify = (course as any).module || null;
        if (!moduleIdToNotify) return;

        const recipients = await User.find({ subscribedModules: moduleIdToNotify }).select('_id');
        if (!recipients || recipients.length === 0) return;
        const appUrl = process.env.APP_URL || `http://localhost:5174`;
        const courseUrl = `${appUrl}/courses/${(course as any)._id || (course as any).id}`;
        const message = `Nuevo curso disponible: ${course.title}`;

        // push notification object into each user's notifications array
        await Promise.all(recipients.map((r: any) =>
          User.updateOne(
            { _id: r._id },
            { $push: { notifications: { message, link: courseUrl, module: moduleIdToNotify, course: course._id, read: false, createdAt: new Date() } } }
          ).exec()
        ));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[notify] error creating in-app notifications', e);
      }
    })();
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
  const course = await Course.findById(courseId).populate('module');
    if (!course) return res.status(404).json({ message: 'Course not found' });

  // try to find chapter by subdoc id or fallback to _id string
  const chapterDoc = (course as any).chapters.id ? (course as any).chapters.id(chapterId) : undefined;
  const chapterExists = chapterDoc || (course as any).chapters.find((c: any) => (c as any)._id?.toString() === chapterId || (c as any).id === chapterId);
    if (!chapterExists) return res.status(404).json({ message: 'Chapter not found' });

    // Update user progress
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create progress entry for this course
    let courseProgress: any = (user as any).progress.find((p: any) => p.courseId.toString() === courseId);
    if (!courseProgress) {
      courseProgress = {
        courseId: new mongoose.Types.ObjectId(courseId),
        completedChapters: [] as string[],
      };
      (user as any).progress.push(courseProgress);
    }

    // Add chapterId (string) to completed chapters if not already present
    courseProgress.completedChapters = courseProgress.completedChapters || [];
    if (!courseProgress.completedChapters.includes(chapterId)) {
      courseProgress.completedChapters.push(chapterId);
    }

    // Buscar o crear entrada en el historial
    let history = await History.findOne({ user: userId, course: course._id });
    if (!history) {
      // store the module name in history.category for reporting; fall back to legacy category
      const moduleName = (course as any).module?.name || (course as any).category || '';
      history = new History({
        user: userId,
        course: course._id,
        category: moduleName,
        completedChapters: []
      });
    }

    // Añadir capítulo completado al historial si no existe
    const chapterInHistory = history.completedChapters.find(
      ch => ch.chapterId.toString() === chapterId
    );
    
    if (!chapterInHistory) {
      const foundChapter = course.chapters.find(ch => (ch as any)._id.toString() === chapterId);
      history.completedChapters.push({
        chapterId: new mongoose.Types.ObjectId(chapterId) as any,
        completedAt: new Date(),
        title: foundChapter?.title || 'Capítulo'
      });
    }

    // Si todos los capítulos están completados
    if (courseProgress.completedChapters.length === course.chapters.length) {
      // Añadir curso a completedCourses si no está ya
      if (!user.completedCourses.includes(course._id)) {
        user.completedCourses.push(course._id);
        
        // Marcar fecha de finalización en el historial
        history.completedAt = new Date();
        
        // Crear o actualizar la insignia del curso
        let badge = await Badge.findOne({ course: course._id });
        if (!badge) {
          badge = await Badge.create({
            name: `${course.title} - Completado`,
            description: `Insignia otorgada por completar el curso ${course.title}`,
            course: course._id
          });
        }

        // Verificar si el usuario ya tiene la insignia
        const hasEarned = badge.earnedBy.some(eb => eb.user.toString() === userId);
        if (!hasEarned) {
          // Otorgar la insignia al usuario
          badge.earnedBy.push({
            user: new mongoose.Types.ObjectId(userId) as any,
            earnedAt: new Date()
          });
          await badge.save();

          // Añadir la insignia al usuario si no la tiene
          if (!user.badges.includes(badge._id)) {
            user.badges.push(badge._id);
          }
        }
      }
    }

    await history.save();

    await user.save();
    
    // Obtener datos actualizados del usuario con campos populados
    const updatedUser = await User.findById(userId)
      .populate({
        path: 'badges',
        populate: { path: 'course', select: 'title' }
      })
      .populate('completedCourses');

    return res.json({ 
      message: courseProgress.completedChapters.length === course.chapters.length
        ? '¡Curso completado! Has ganado una insignia.'
        : 'Capítulo completado',
      user: updatedUser
    });
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
