import mongoose from 'mongoose';
import {
  TICKET_PRIORITIES,
  TICKET_PRIORITY_VALUES,
  TICKET_STATUSES,
  TICKET_STATUS_VALUES,
} from '../constants/ticket.js';

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    priority: {
      type: String,
      enum: {
        values: TICKET_PRIORITY_VALUES,
        message: 'Priority must be LOW, MEDIUM, HIGH, or URGENT',
      },
      default: TICKET_PRIORITIES.MEDIUM,
    },
    status: {
      type: String,
      enum: {
        values: TICKET_STATUS_VALUES,
        message: 'Status must be OPEN, IN_PROGRESS, RESOLVED, or CLOSED',
      },
      default: TICKET_STATUSES.OPEN,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ticket creator is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });
ticketSchema.index({ createdBy: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ category: 1, status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
