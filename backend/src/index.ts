import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { uploadToMinio } from './middleware/upload';
import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import badgeRoutes from './routes/badges';
import userRoutes from './routes/users';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/users', userRoutes);

// Connect to MongoDB
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

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