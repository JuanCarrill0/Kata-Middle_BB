import { Schema, model, Document } from 'mongoose';

interface EarnedBadge {
  user: Schema.Types.ObjectId;
  earnedAt: Date;
}

export interface IBadge extends Document {
  name: string;
  description: string;
  image?: string;
  course: Schema.Types.ObjectId;
  earnedBy: EarnedBadge[];
  createdAt: Date;
  updatedAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: false, // Hacemos la imagen opcional
      default: 'default-badge.png' // Imagen por defecto
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    earnedBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      earnedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
  }
);

export const Badge = model<IBadge>('Badge', badgeSchema);