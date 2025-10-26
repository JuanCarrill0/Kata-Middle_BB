import { Router } from 'express';
import { Badge } from '../models/Badge';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Get all badges
router.get('/', async (req, res) => {
  try {
    const badges = await Badge.find().populate('course', 'title');
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching badges' });
  }
});

// Create badge (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const badge = await Badge.create({
      ...req.body,
      image: req.file?.filename,
    });

    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ message: 'Error creating badge' });
  }
});

export default router;