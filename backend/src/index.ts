import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { uploadToMinio } from './middleware/upload';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import badgeRoutes from './routes/badges';
import userRoutes from './routes/users';
import fileRoutes from './routes/files';
import historyRoutes from './routes/history';
import moduleRoutes from './routes/modules';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Error manejando middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!' });
});

// verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/modules', moduleRoutes);

// connexion a la base de datos y arranque del servidor
const startServer = async () => {
  try {
    const raw = process.env.MONGODB_URI;
    if (!raw) {
      throw new Error('MONGODB_URI not set');
    }

    // asegurar que la base de datos usada es 'training-portal'
    let mongoUri = raw;
    if (!raw.includes('/training-portal')) {
      const qIdx = raw.indexOf('?');
      if (qIdx === -1) {
        mongoUri = raw.replace(/\/*$/, '') + '/training-portal';
      } else {
        mongoUri = raw.slice(0, qIdx).replace(/\/*$/, '') + '/training-portal' + raw.slice(qIdx);
      }
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB (db: training-portal)');

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();