import { Router } from 'express';
import { User } from '../models/User';
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

export default router;