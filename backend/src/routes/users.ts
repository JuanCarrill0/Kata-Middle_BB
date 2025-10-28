import { Router } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// obtener perfil de usuario
router.get('/profile', auth, async (req, res) => {
  try {
    // Poblar completedCourses y badges (con su curso) para devolver al frontend
    const user = await User.findById(req.user.id)
      .populate('completedCourses')
      .populate({ path: 'badges', populate: { path: 'course', select: 'title' } });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Mapear insignias a formato amigable para frontend
    const mappedBadges = (user.badges || []).map((b: any) => {
      // b puede ser un ObjectId o un documento poblado
      const badge = b && b._id ? b : null;
      if (!badge) return null;
      // Buscar la entrada earnedBy de este usuario en la insignia para obtener earnedAt
      const earnedEntry = Array.isArray(badge.earnedBy) ? badge.earnedBy.find((eb: any) => String(eb.user) === String(user._id)) : null;
      return {
        id: badge._id,
        name: badge.name,
        description: badge.description,
        imageUrl: badge.image || (`/badges/${badge._id}`),
        courseId: badge.course ? String(badge.course) : null,
        earnedAt: earnedEntry ? earnedEntry.earnedAt : null,
      };
    }).filter(Boolean);

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      completedCourses: (user.completedCourses || []).map((c: any) => String(c)),
      badges: mappedBadges,
      subscribedModules: (user.subscribedModules || []).map((m: any) => m.toString()),
      notifications: (user.notifications || []).map(n => ({
        message: n.message,
        link: n.link,
        module: n.module,
        course: n.course,
        read: n.read,
        createdAt: n.createdAt,
      })),
      progress: (user.progress || []).map((p: any) => ({
        courseId: p.courseId.toString(),
        completedChapters: Array.isArray(p.completedChapters) ? p.completedChapters : [],
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil' });
  }
});

// actualizar perfil de usuario
router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.avatar = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando perfil' });
  }
});

// subscribir a un módulo
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { module } = req.body;
    if (!module) return res.status(400).json({ message: 'El módulo es requerido' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.subscribedModules = user.subscribedModules || [];
    // Normalizar comparación para ObjectId y strings
    const already = user.subscribedModules.some((m: any) => m && m.toString() === module);
    if (!already) {
      try {
        user.subscribedModules.push((new mongoose.Types.ObjectId(module)) as any);
      } catch (e) {
        // si el objeto no es un ObjectId válido, agregar como string
        user.subscribedModules.push(module as any);
      }
      await user.save();
    }

    res.json({ message: 'Subscribed', subscribedModules: user.subscribedModules });
  } catch (error) {
    res.status(500).json({ message: 'error subscribiendose al modulo' });
  }
});

// desubscribir de un módulo
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { module } = req.body;
    if (!module) return res.status(400).json({ message: 'El módulo es requerido' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  user.subscribedModules = (user.subscribedModules || []).filter((m: any) => m.toString() !== module);
  await user.save();

    res.json({ message: 'Unsubscribed', subscribedModules: user.subscribedModules });
  } catch (error) {
    res.status(500).json({ message: 'Error unsubscribing from module' });
  }
});

// obtener notificaciones del usuario
router.get('/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json((user.notifications || []).sort((a: any, b: any) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)));
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo notificaciones' });
  }
});

// Marcar una notificación como leída
router.post('/notifications/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const notif = (user.notifications || []).find((n: any) => (n as any)._id?.toString() === id);
    if (notif) notif.read = true;

    await user.save();
    res.json({ message: 'Marcado como leído' });
  } catch (error) {
    res.status(500).json({ message: 'Error marcando notificación como leída' });
  }
});

export default router;