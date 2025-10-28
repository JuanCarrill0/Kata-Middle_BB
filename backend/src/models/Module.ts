import { Schema, model, Document } from 'mongoose';

export interface IModule extends Document {
  name: string;
  slug?: string;
  description?: string;
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const moduleSchema = new Schema<IModule>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

moduleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

export const Module = model<IModule>('Module', moduleSchema);
