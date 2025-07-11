import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC'
  },
  profilePhoto: {
    type: String,
    default: null
  },
  // AI Agent for this employee
  aiAgent: {
    agentId: String,
    status: {
      type: String,
      enum: ['not_created', 'created', 'calendar_connected'],
      default: 'not_created'
    },
    createdAt: Date
  },
  // Google Calendar
  googleCalendar: {
    accessToken: String,
    refreshToken: String,
    connected: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema); 