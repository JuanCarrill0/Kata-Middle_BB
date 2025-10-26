import { Schema, model, Document } from 'mongoose';

export interface IBadge extends Document {
  name: string;
  description: string;
  image: string;
  course: Schema.Types.ObjectId;
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
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Badge = model<IBadge>('Badge', badgeSchema);