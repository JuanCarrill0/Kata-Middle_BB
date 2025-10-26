import { Router } from 'express';
import { Course } from '../models/Course';
import { auth } from '../middleware/auth';
import { upload } from '../middleware/upload';

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
router.post('/', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
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

// Complete course chapter
router.post('/:id/complete-chapter/:chapterIndex', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const user = req.user;
    const chapterIndex = parseInt(req.params.chapterIndex);

    // Add chapter completion to user's progress
    await user.updateOne({
      $addToSet: {
        [`courseProgress.${course._id}.completedChapters`]: chapterIndex,
      },
    });

    // Check if all chapters are completed
    const progress = user.courseProgress?.get(course._id.toString());
    const allChaptersCompleted = progress?.completedChapters.length === course.chapters.length;

    if (allChaptersCompleted) {
      // Add course to completed courses and award badge
      await user.updateOne({
        $addToSet: {
          completedCourses: course._id,
          badges: course.badge,
        },
      });
    }

    res.json({ message: 'Chapter completed', allChaptersCompleted });
  } catch (error) {
    res.status(500).json({ message: 'Error completing chapter' });
  }
});

export default router;