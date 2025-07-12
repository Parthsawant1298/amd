import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const bossSchema = new mongoose.Schema({
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
  // Boss AI Agent
  bossAgent: {
    agentId: String,
    status: {
      type: String,
      enum: ['not_created', 'created', 'active'],
      default: 'not_created'
    },
    createdAt: Date
  },
  // Boss specific fields
  company: {
    type: String,
    required: true
  },
  position: {
    type: String,
    default: 'Manager'
  },
  // Google Calendar for boss
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
bossSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
bossSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.models.Boss || mongoose.model('Boss', bossSchema); 