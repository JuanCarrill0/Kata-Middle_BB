import { Router } from 'express';
import { auth } from '../middleware/auth';
import { History } from '../models/History';
import { Module } from '../models/Module';
import { Course } from '../models/Course';

const router = Router();

// Obtener historial del usuario actual
router.get('/my-history', auth, async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .populate('course', 'title description category')
      .sort({ completedAt: -1 });

    // Agrupar por categoría
    const byCategory: { [key: string]: any[] } = {};
    history.forEach(entry => {
      if (!byCategory[entry.category]) {
        byCategory[entry.category] = [];
      }
      byCategory[entry.category].push(entry);
    });

    // Para evitar contar el mismo curso múltiples veces (si existieran duplicados),
    // calculamos por categoría el conjunto de courseIds completados y usamos su tamaño.
    const statsByCategory = await Promise.all(Object.keys(byCategory).map(async (category) => {
      const entries = byCategory[category];

      // Mapear courseId -> título (usar la primera entrada encontrada)
      const courseMap: { [courseId: string]: { id: string, title: string, lastCompleted?: Date } } = {};
      entries.forEach(e => {
        const courseId = String(((e.course as any)?._id) || e.course);
        if (!courseMap[courseId]) {
          courseMap[courseId] = { id: courseId, title: e.course?.title || '' };
        }
        // Mantener la fecha más reciente de completado para ese curso
        if (!courseMap[courseId].lastCompleted || (e.completedAt && new Date(e.completedAt) > new Date(courseMap[courseId].lastCompleted!))) {
          courseMap[courseId].lastCompleted = e.completedAt;
        }
      });

      const uniqueCourseIds = Object.keys(courseMap);
      const count = uniqueCourseIds.length;

      // La última fecha completada en el módulo (entre todas las entradas)
      const lastCompleted = entries.reduce((acc, cur) => {
        const d = cur.completedAt ? new Date(cur.completedAt) : null;
        if (!d) return acc;
        if (!acc || d > acc) return d;
        return acc;
      }, null as Date | null);

      const completedCourses = uniqueCourseIds.map(id => ({ id, title: courseMap[id].title }));

      // Calcular total de cursos existentes en la plataforma para este módulo
      let totalCourses = 0;
      try {
        const modDoc = await Module.findOne({ name: category }).lean();
        const orConditions: any[] = [];
        if (modDoc && modDoc._id) {
          orConditions.push({ module: modDoc._id });
        }
        orConditions.push({ category: category });
        totalCourses = await Course.countDocuments({ $or: orConditions });
      } catch (e) {
        // Fallback: si falla la consulta, contar todos los cursos como antes
        const allCourses = await Course.find().populate('module', 'name').lean();
        totalCourses = allCourses.filter((c: any) => {
          const modName = c.module && c.module.name ? String(c.module.name) : null;
          const catName = c.category ? String(c.category) : null;
          return (modName && modName.toLowerCase() === String(category).toLowerCase()) || (catName && catName.toLowerCase() === String(category).toLowerCase());
        }).length;
      }

      return {
        category,
        count,
        lastCompleted,
        totalCourses,
        completedCourses,
      };
    }));

    // Total de cursos completados (únicos) por el usuario
  const uniqueCoursesAll = new Set(history.map(h => String(((h.course as any)?._id) || h.course)));
    const stats = {
      totalCourses: uniqueCoursesAll.size,
      totalChapters: history.reduce((acc, curr) => acc + curr.completedChapters.length, 0),
      totalTime: history.reduce((acc, curr) => acc + (curr.totalTime || 0), 0),
      byCategory: statsByCategory,
    };

    res.json({ history, stats });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error al obtener el historial' });
  }
});
const fetchMyHistory = async (req: any, res: any) => {
  try {
    const history = await History.find({ user: req.user.id })
      .populate('course', 'title description category')
      .sort({ completedAt: -1 });

    // Agrupar por categoría
    const byCategory: { [key: string]: any[] } = {};
    history.forEach((entry: any) => {
      if (!byCategory[entry.category]) {
        byCategory[entry.category] = [];
      }
      byCategory[entry.category].push(entry);
    });

    // Calcular estadísticas (contando cursos únicos por categoría)
    const statsByCategory = await Promise.all(Object.keys(byCategory).map(async (category) => {
      const entries = byCategory[category];

      const courseMap: { [courseId: string]: { id: string, title: string, lastCompleted?: Date } } = {};
      entries.forEach((e: any) => {
        const courseId = String(((e.course as any)?._id) || e.course);
        if (!courseMap[courseId]) {
          courseMap[courseId] = { id: courseId, title: e.course?.title || '' };
        }
        if (!courseMap[courseId].lastCompleted || (e.completedAt && new Date(e.completedAt) > new Date(courseMap[courseId].lastCompleted!))) {
          courseMap[courseId].lastCompleted = e.completedAt;
        }
      });

      const uniqueCourseIds = Object.keys(courseMap);
      const lastCompleted = entries.reduce((acc: Date | null, cur: any) => {
        const d = cur.completedAt ? new Date(cur.completedAt) : null;
        if (!d) return acc;
        if (!acc || d > acc) return d;
        return acc;
      }, null as Date | null);

      // calcular totalCourses para este módulo (por nombre de módulo / categoría)
      let totalCourses = 0;
      try {
        const modDoc = await Module.findOne({ name: category }).lean();
        const orConditions: any[] = [];
        if (modDoc && modDoc._id) {
          orConditions.push({ module: modDoc._id });
        }
        orConditions.push({ category: category });
        totalCourses = await Course.countDocuments({ $or: orConditions });
      } catch (e) {
        const allCourses = await Course.find().populate('module', 'name').lean();
        totalCourses = allCourses.filter((c: any) => {
          const modName = c.module && c.module.name ? String(c.module.name) : null;
          const catName = c.category ? String(c.category) : null;
          return (modName && modName.toLowerCase() === String(category).toLowerCase()) || (catName && catName.toLowerCase() === String(category).toLowerCase());
        }).length;
      }

      return {
        category,
        count: uniqueCourseIds.length,
        lastCompleted,
        totalCourses,
        completedCourses: uniqueCourseIds.map(id => ({ id, title: courseMap[id].title })),
      };
    }));

    const uniqueCoursesAll = new Set(history.map(h => String(((h.course as any)?._id) || h.course)));
    const stats = {
      totalCourses: uniqueCoursesAll.size,
      totalChapters: history.reduce((acc: number, curr: any) => acc + curr.completedChapters.length, 0),
      totalTime: history.reduce((acc: number, curr: any) => acc + (curr.totalTime || 0), 0),
      byCategory: statsByCategory,
    };

    res.json({ history, stats });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error al obtener el historial' });
  }
};

router.get('/my-history', auth, fetchMyHistory);

// Alias compatible: /me
router.get('/me', auth, fetchMyHistory);

// Obtener historial detallado de un curso específico
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const history = await History.findOne({ 
      user: req.user.id,
      course: req.params.courseId,
    })
      .populate('course', 'title description category')
      .populate('completedChapters.chapterId');

    if (!history) {
      return res.status(404).json({ message: 'No se encontró el historial para este curso' });
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching course history:', error);
    res.status(500).json({ message: 'Error al obtener el historial del curso' });
  }
});

// Para administradores: ver historial de todos los usuarios
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const history = await History.find()
      .populate('user', 'name email')
      .populate('course', 'title description category')
      .sort({ completedAt: -1 });

    res.json(history);
  } catch (error) {
    console.error('Error fetching all history:', error);
    res.status(500).json({ message: 'Error al obtener el historial' });
  }
});

export default router;