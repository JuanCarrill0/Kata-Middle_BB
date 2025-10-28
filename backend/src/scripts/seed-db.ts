import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/training-portal';

async function main() {
  await mongoose.connect(MONGODB_URI.replace(/\/training-portal.*$/, '') + '/training-portal');
  console.log('Connected to MongoDB for seeding');

  const Module = (await import('../models/Module')).Module;
  const User = (await import('../models/User')).User;
  const Course = (await import('../models/Course')).Course;
  const Badge = (await import('../models/Badge')).Badge;
  const History = (await import('../models/History')).History;

  // Clear collections (safe for dev only)
  await Promise.all([
    Module.deleteMany({}),
    User.deleteMany({}),
    Course.deleteMany({}),
    Badge.deleteMany({}),
    History.deleteMany({}),
  ]);

  // Create modules
  const modules = await Module.insertMany([
    { name: 'Fullstack', slug: 'fullstack', description: 'Fullstack topics' },
    { name: 'APIs', slug: 'apis', description: 'API design and integrations' },
    { name: 'Cloud', slug: 'cloud', description: 'Cloud and infra' },
  ]);
  console.log('Modules created:', modules.map(m => m.name).join(', '));

  // Create users
  const password = await bcrypt.hash('Password123!', 10);
  const [teacher, student] = await User.insertMany([
    { email: 'teacher@example.com', password, name: 'Teacher One', role: 'teacher', progress: [], completedCourses: [], badges: [] },
    { email: 'student@example.com', password, name: 'Student One', role: 'user', progress: [], completedCourses: [], badges: [] },
  ]);
  console.log('Users created:', teacher.email, student.email);

  // Create courses
  const course1 = await Course.create({
    title: 'Introducción a Node.js',
    description: 'Curso básico de Node.js',
    module: modules[1]._id,
    category: 'apis',
    chapters: [
      { title: 'Instalación', description: 'Instalar Node', content: [] },
      { title: 'Módulos', description: 'Usar módulos', content: [] },
    ],
    createdBy: teacher._id,
  });

  const course2 = await Course.create({
    title: 'Fundamentos Cloud',
    description: 'Conceptos de cloud',
    module: modules[2]._id,
    category: 'cloud',
    chapters: [
      { title: 'Introducción a la nube', description: 'Conceptos clave', content: [] }
    ],
    createdBy: teacher._id,
  });

  console.log('Courses created:', course1.title, course2.title);

  // Create badge for course1
  const badge = await Badge.create({
    name: `${course1.title} - Completado`,
    description: 'Insignia por completar Node.js',
    course: course1._id,
    earnedBy: []
  });

  // Create history for student: student completed chapter 1 of course1
  await History.create({
    user: student._id,
    course: course1._id,
    category: 'apis',
    completedChapters: [
      { chapterId: new mongoose.Types.ObjectId(), completedAt: new Date(), title: 'Instalación' }
    ],
    totalTime: 10
  });

  console.log('Seed completed.');
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding failed', err);
  process.exit(1);
});
