import { Router } from 'express';
import { Module } from '../models/Module';
import { Course } from '../models/Course';
import { auth } from '../middleware/auth';

const router = Router();

// Listar modulos
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find().sort({ name: 1 });
    res.json(modules);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo modulos' });
  }
});

// Obtener módulo por ID
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ message: 'ódulo no encontrado' });
    res.json(module);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo módulo' });
  }
});

// Crear módulo (profesor/admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const { name, description } = req.body;
    const m = await Module.create({ name, description, createdBy: req.user.id });
    res.status(201).json(m);
  } catch (error) {
    res.status(500).json({ message: 'Error creando módulo' });
  }
});

// Actualizar módulo (profesor/admin)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const updates = req.body;
    const m = await Module.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!m) return res.status(404).json({ message: 'Módulo no encontrado' });
    res.json(m);
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando módulo' });
  }
});

// Eliminar módulo (profesor/admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    // Optional: prevent deleting if courses exist
    const courses = await Course.find({ module: req.params.id }).limit(1);
    if (courses.length > 0) {
      return res.status(400).json({ message: 'El módulo tiene cursos. Elimina o mueve los cursos antes de eliminar el módulo.' });
    }
    await Module.findByIdAndDelete(req.params.id);
    res.json({ message: 'Módulo eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando módulo' });
  }
});

// Obtener cursos en un módulo por ID de módulo
router.get('/:id/cursos', async (req, res) => {
  try {
    const cursos = await Course.find({ module: req.params.id }).populate('badge').populate('createdBy', 'name email');
    res.json(cursos);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo cursos para el módulo' });
  }
});

export default router;
