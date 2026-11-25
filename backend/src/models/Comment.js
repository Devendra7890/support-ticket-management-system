import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: [true, 'Ticket reference is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment author is required'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
      minlength: [1, 'Comment message cannot be empty'],
      maxlength: [2000, 'Comment message cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

commentSchema.index({ ticket: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
