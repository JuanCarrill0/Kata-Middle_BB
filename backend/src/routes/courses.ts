import { Router } from 'express';
import { Course } from '../models/Course';
import { User } from '../models/User';
import { Badge } from '../models/Badge';
import { History } from '../models/History';
import { auth } from '../middleware/auth';
import { upload, uploadToMinio, minioClient } from '../middleware/upload';
import mongoose from 'mongoose';
const { ObjectId, GridFSBucket } = require('mongodb');

const router = Router();

//Obtener todos los cursos - requiere autenticación
router.get('/', auth, async (req, res) => {
  try {
    // Los profesores y administradores pueden ver todos los cursos
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      const courses = await Course.find()
        .populate('badge')
        .populate('createdBy', 'name email');
      return res.json(courses);
    }

    // Los usuarios regulares solo pueden ver los cursos cuyo módulo está en sus módulos suscritos
    const user = await User.findById(req.user.id).select('subscribedModules').lean();
    const subs = (user && (user as any).subscribedModules) || [];
    if (!subs || subs.length === 0) return res.json([]);

    // Normalizar ids de subscripción
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

// Obtener un curso por ID - requiere autenticación
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

    // usuario regular: verificar suscripción al módulo del curso
    const user = await User.findById(req.user.id).select('subscribedModules').lean();
    const subs = (user && (user as any).subscribedModules) || [];
    // determinar el id del módulo del curso
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

// crear un nuevo curso (solo admin o teacher)
router.post('/', auth, upload.single('thumbnail'), uploadToMinio, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // determine module id: from body.module or body.category
    let moduleId = req.body.module;
    if (!moduleId && req.body.category) {
      const { Module } = require('../models/Module');
      let m = null;
      try {
        // si la categoría es un id válido, buscar por id
        if (/^[a-fA-F0-9]{24}$/.test(req.body.category)) {
          m = await Module.findById(req.body.category);
        }
      } catch (e) {
        // ignorar errores de id no válidos
        m = null;
      }

      if (!m) {
        // retornar por nombre
        m = await Module.findOne({ name: req.body.category });
      }

      if (!m) {
        // si aun no se encuentra, crear nuevo módulo
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

    // Crear notificaciones en la aplicación para usuarios suscritos al módulo/categoría de este curso
    (async () => {
      try {
        // determinar el id del módulo para notificar a los suscriptores
        const moduleIdToNotify = (course as any).module || null;
        if (!moduleIdToNotify) return;

        const recipients = await User.find({ subscribedModules: moduleIdToNotify }).select('_id');
        if (!recipients || recipients.length === 0) return;
        const appUrl = process.env.APP_URL || `http://localhost:5174`;
        const courseUrl = `${appUrl}/courses/${(course as any)._id || (course as any).id}`;
        const message = `Nuevo curso disponible: ${course.title}`;

        // enviar notificaciones
        await Promise.all(recipients.map((r: any) =>
          User.updateOne(
            { _id: r._id },
            { $push: { notifications: { message, link: courseUrl, module: moduleIdToNotify, course: course._id, read: false, createdAt: new Date() } } }
          ).exec()
        ));
      } catch (e) {
        console.error('error creando en la notificación', e);
      }
    })();
  } catch (error) {
    res.status(500).json({ message: 'Error creando curso' });
  }
});

// añadir capítulo a un curso (solo admin o teacher)
router.post('/:id/chapters', auth, upload.fields([{ name: 'files', maxCount: 20 }]), uploadToMinio, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Curso no encontrado' });

    const { title, description } = req.body;

    const files = (req.files && (req.files as any).files) || [];

    const mimeToType = (mimetype: string) => {
      if (mimetype === 'application/pdf') return 'pdf';
      if (mimetype.startsWith('video/')) return 'video';
      if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'presentation';
      // retornar tipo por defecto
      if (mimetype.startsWith('image/')) return 'presentation';
      return 'pdf';
    };

    const content = files.map((f: any) => {
      const type = mimeToType(f.mimetype);
      let url = f.filename;
      if (f.storage === 'gridfs') {
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
    // retornar mensaje de error detallado si está disponible
    const msg = (error && (error as any).message) ? (error as any).message : 'Error añadiendo capítulo';
    const stack = (error && (error as any).stack) ? (error as any).stack : undefined;
    res.status(500).json({ message: msg, stack });
  }
});

// completar un capítulo de un curso (requiere autenticación)
router.post('/:courseId/chapters/:chapterId/complete', auth, async (req, res) => {
  try {
    const { courseId, chapterId } = req.params;
  const course = await Course.findById(courseId).populate('module');
    if (!course) return res.status(404).json({ message: 'Curso no encontrado' });

  // tratar de encontrar el capítulo por id
  const chapterDoc = (course as any).chapters.id ? (course as any).chapters.id(chapterId) : undefined;
  const chapterExists = chapterDoc || (course as any).chapters.find((c: any) => (c as any)._id?.toString() === chapterId || (c as any).id === chapterId);
    if (!chapterExists) return res.status(404).json({ message: 'Capítulo no encontrado' });

    // actualizar el progreso del usuario
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Buscar o crear progreso del curso
    let courseProgress: any = (user as any).progress.find((p: any) => p.courseId.toString() === courseId);
    if (!courseProgress) {
      courseProgress = {
        courseId: new mongoose.Types.ObjectId(courseId),
        completedChapters: [] as string[],
      };
      (user as any).progress.push(courseProgress);
    }

    // añadir capítulo completado si no existe
    courseProgress.completedChapters = courseProgress.completedChapters || [];
    if (!courseProgress.completedChapters.includes(chapterId)) {
      courseProgress.completedChapters.push(chapterId);
    }

    // Buscar o crear entrada en el historial
    let history = await History.findOne({ user: userId, course: course._id });
    if (!history) {
      // almacenar el historial con el nombre del módulo o categoría
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
    console.error('Error marcando capítulo como completado', error);
    return res.status(500).json({ message: error?.message || 'Error completando capítulo' });
  }
});

// borrar un capítulo de un curso (solo admin o teacher)
router.delete('/:courseId/chapters/:chapterId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { courseId, chapterId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Curso no encontrado' });

    let chapter: any = undefined;

    try {
      chapter = (course as any).chapters.id ? (course as any).chapters.id(chapterId) : undefined;
    } catch (_) {
    }
    
    if (!chapter) {
      chapter = (course as any).chapters.find((c: any) => (c as any)._id?.toString() === chapterId || (c as any).id === chapterId);
    }
    if (!chapter) return res.status(404).json({ message: 'Capítulo no encontrado' });

    // Eliminar archivos asociados al capítulo
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

    // remover el capítulo del curso
    chapter.remove();
    await course.save();
    res.json({ message: 'Capítulo eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error eliminando capítulo' });
  }
});

// Eliminar un curso (solo admin o teacher)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Curso no encontrado' });

    // Eliminar miniatura si está presente (almacenada como clave de MinIO)
    if ((course as any).thumbnail) {
      try {
        await minioClient.removeObject(process.env.MINIO_BUCKET || 'capacitaciones', (course as any).thumbnail);
      } catch (e: any) {
        console.warn('Error eliminando miniatura', e?.message || e);
      }
    }

    // Eliminar archivos de capítulos
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
            console.warn('Error eliminando objeto de minio', url, e?.message || e);
          }
        }
      }
    }

    await course.deleteOne();
    res.json({ message: 'Curso eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error eliminando curso' });
  }
});

export default router;
