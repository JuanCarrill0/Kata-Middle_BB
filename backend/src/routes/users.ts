import { Router } from 'express';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('completedCourses')
      .populate('badges');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      completedCourses: user.completedCourses,
      badges: user.badges,
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
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
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
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Subscribe to a module (category)
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { module } = req.body;
    if (!module) return res.status(400).json({ message: 'module is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.subscribedModules = user.subscribedModules || [];
    // Normalize comparisons by using string form
    const already = user.subscribedModules.some((m: any) => m && m.toString() === module);
    if (!already) {
      try {
        user.subscribedModules.push((new mongoose.Types.ObjectId(module)) as any);
      } catch (e) {
        // if invalid ObjectId, still push raw value
        user.subscribedModules.push(module as any);
      }
      await user.save();
    }

    res.json({ message: 'Subscribed', subscribedModules: user.subscribedModules });
  } catch (error) {
    res.status(500).json({ message: 'Error subscribing to module' });
  }
});

// Unsubscribe from a module
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { module } = req.body;
    if (!module) return res.status(400).json({ message: 'module is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

  // Remove by string comparison to support ObjectId entries
  user.subscribedModules = (user.subscribedModules || []).filter((m: any) => m.toString() !== module);
  await user.save();

    res.json({ message: 'Unsubscribed', subscribedModules: user.subscribedModules });
  } catch (error) {
    res.status(500).json({ message: 'Error unsubscribing from module' });
  }
});

// Get notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notifications');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json((user.notifications || []).sort((a: any, b: any) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Mark a notification as read
router.post('/notifications/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notif = (user.notifications || []).find((n: any) => (n as any)._id?.toString() === id);
    if (notif) notif.read = true;

    await user.save();
    res.json({ message: 'Marked read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification' });
  }
});

export default router;