import { Router } from 'express';
import { Module } from '../models/Module';
import { Course } from '../models/Course';
import { auth } from '../middleware/auth';

const router = Router();

// List modules
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find().sort({ name: 1 });
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching modules' });
  }
});

// Get module by id
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ message: 'Module not found' });
    res.json(module);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching module' });
  }
});

// Create module (teacher/admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, description } = req.body;
    const m = await Module.create({ name, description, createdBy: req.user.id });
    res.status(201).json(m);
  } catch (error) {
    res.status(500).json({ message: 'Error creating module' });
  }
});

// Update module
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const updates = req.body;
    const m = await Module.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!m) return res.status(404).json({ message: 'Module not found' });
    res.json(m);
  } catch (error) {
    res.status(500).json({ message: 'Error updating module' });
  }
});

// Delete module (and optionally orphan courses)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    // Optional: prevent deleting if courses exist
    const courses = await Course.find({ module: req.params.id }).limit(1);
    if (courses.length > 0) {
      return res.status(400).json({ message: 'Module has courses. Delete or move courses before deleting module.' });
    }
    await Module.findByIdAndDelete(req.params.id);
    res.json({ message: 'Module deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting module' });
  }
});

// Get courses in a module (this endpoint still respects subscription logic in courses router)
router.get('/:id/courses', async (req, res) => {
  try {
    const courses = await Course.find({ module: req.params.id }).populate('badge').populate('createdBy', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses for module' });
  }
});

export default router;
