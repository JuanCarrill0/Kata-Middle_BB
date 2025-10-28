import { Router } from 'express';
import { auth } from '../middleware/auth';
import { History } from '../models/History';
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

    // Calcular estadísticas
    const stats = {
      totalCourses: history.length,
      totalChapters: history.reduce((acc, curr) => acc + curr.completedChapters.length, 0),
      totalTime: history.reduce((acc, curr) => acc + (curr.totalTime || 0), 0),
      byCategory: Object.keys(byCategory).map(category => ({
        category,
        count: byCategory[category].length,
        lastCompleted: byCategory[category][0]?.completedAt,
      })),
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

    // Calcular estadísticas
    const stats = {
      totalCourses: history.length,
      totalChapters: history.reduce((acc: number, curr: any) => acc + curr.completedChapters.length, 0),
      totalTime: history.reduce((acc: number, curr: any) => acc + (curr.totalTime || 0), 0),
      byCategory: Object.keys(byCategory).map(category => ({
        category,
        count: byCategory[category].length,
        lastCompleted: byCategory[category][0]?.completedAt,
      })),
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