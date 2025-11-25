import mongoose from 'mongoose';

// MongoDB connection string - Use the URI from .env file
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_portal';

// MongoDB connection function
export const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// MongoDB models
import { Schema, model } from 'mongoose';

// User Schema
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor', 'admin'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  fullName: { type: String, required: true },
  // Student specific fields
  collegeId: { type: String },
  course: { type: String },
  // Professor specific fields
  department: { type: String },
  professorId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Complaint Schema
const complaintSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  topic: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['submitted', 'pending', 'in_progress', 'solved', 'rejected'], 
    default: 'submitted' 
  },
  assignedProfessorId: { type: Schema.Types.ObjectId, ref: 'User' },
  assignedProfessorName: { type: String },
  assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  solvedByProfessorId: { type: Schema.Types.ObjectId, ref: 'User' },
  solvedByProfessorName: { type: String },
  replies: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ['student', 'professor', 'admin'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Export models
export const User = model('User', userSchema);
export const Complaint = model('Complaint', complaintSchema);

export default mongoose;
