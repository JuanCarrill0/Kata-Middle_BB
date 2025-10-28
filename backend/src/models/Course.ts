import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  // module will reference the new Module model (replaces previous category string)
  module: Schema.Types.ObjectId;
  // legacy category string (optional)
  category?: 'fullstack' | 'apis' | 'cloud' | 'data';
  chapters: {
    title: string;
    description: string;
    content: {
      type: 'video' | 'pdf' | 'presentation';
      url: string;
    }[];
  }[];
  badge: Schema.Types.ObjectId;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Keep `category` as optional legacy field for migration; prefer `module` ObjectId.
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: false },
    category: {
      type: String,
      enum: ['fullstack', 'apis', 'cloud', 'data'],
      required: false,
    },
    chapters: [{
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      content: [{
        type: {
          type: String,
          enum: ['video', 'pdf', 'presentation'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      }],
    }],
    badge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge',
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Make sure JSON output has `id` instead of `_id`, and remove __v
courseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

export const Course = model<ICourse>('Course', courseSchema);