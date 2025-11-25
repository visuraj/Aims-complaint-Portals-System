require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// MongoDB connection - Use the URI from .env file
const MONGODB_URI = process.env.MONGO_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Nodemailer setup (bonus)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userInfo = req.user ? `User: ${req.user.email} (${req.user.role})` : 'Unauthenticated';
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${ip} - ${userInfo}`);
  next();
});

// ✅ Health check endpoint (added here)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'professor', 'admin'], required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  collegeId: { type: String },
  course: { type: String },
  department: { type: String },
  professorId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  description: { type: String, required: true },
  course: { type: String, required: true },
  department: { type: String, default: 'Unknown Department' }, // Make department optional with default
  status: {
    type: String,
    enum: ['submitted', 'pending', 'in_progress', 'solved', 'rejected'],
    default: 'submitted'
  },
  assignedProfessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedProfessorName: { type: String },
  assignedAdminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAdminName: { type: String },
  solvedByProfessorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  solvedByProfessorName: { type: String },
  replies: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ['student', 'professor', 'admin'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Routes

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Complaint Portal API Server is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      login: '/api/login',
      register: {
        student: '/api/register/student',
        professor: '/api/register/professor'
      },
      complaints: '/api/complaints'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Register Student
app.post('/api/register/student', async (req, res) => {
  try {
    const { collegeId, name, email, password, course } = req.body;
    if (!collegeId || !name || !email || !password || !course) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: 'student', collegeId, course, status: 'pending' });
    await user.save();

    res.status(201).json({
      message: 'Student registered successfully. Awaiting admin approval.',
      user: { _id: user._id, email: user.email, role: user.role, status: user.status, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register Professor
app.post('/api/register/professor', async (req, res) => {
  try {
    const { professorId, name, department, email, password } = req.body;
    if (!professorId || !name || !department || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: 'professor', professorId, department, status: 'pending' });
    await user.save();

    res.status(201).json({
      message: 'Professor registered successfully. Awaiting admin approval.',
      user: { _id: user._id, email: user.email, role: user.role, status: user.status, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(400).json({ message: 'Invalid credentials' });

    // For admin users, allow login regardless of status
    // For other users, they must be approved
    if (user.role !== 'admin' && user.status !== 'approved') {
      return res.status(400).json({ message: 'Account pending approval' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({
      message: 'Login successful',
      token,
      user: { _id: user._id, email: user.email, role: user.role, status: user.status, name: user.name, collegeId: user.collegeId, course: user.course, department: user.department, professorId: user.professorId }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Auth Check
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User management (admin)
app.get('/api/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/users/pending', authenticateToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ status: 'pending' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject users
app.patch('/api/users/:id/approve', authenticateToken, adminOnly, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    // Send email notification
    if (transporter.options.auth.user && transporter.options.auth.pass) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: updatedUser.email,
        subject: 'Account Approved',
        text: 'Your account has been approved. You can now log in to the Complaint Portal.'
      }).catch(console.error);
    }

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.patch('/api/users/:id/reject', authenticateToken, adminOnly, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    // Send email notification
    if (transporter.options.auth.user && transporter.options.auth.pass) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: updatedUser.email,
        subject: 'Account Rejected',
        text: 'Your account registration has been rejected. Please contact admin for more details.'
      }).catch(console.error);
    }

    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Complaint creation
app.post('/api/complaints', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    // Allow both students and admins to submit complaints
    if (currentUser.role !== 'student' && currentUser.role !== 'admin') return res.status(403).json({ message: 'Only students and admins can submit complaints' });

    const { topic, description, course, studentId, studentName, studentEmail } = req.body;
    let assignedProfessorId = null;
    let assignedProfessorName = null;
    let assignedAdminId = null;
    let assignedAdminName = null;
    
    // Set department based on course
    const department = course; // For now, we'll use course as department
    
    // Find a professor in the same department/course
    const professors = await User.find({ 
      role: 'professor', 
      status: 'approved', 
      $or: [
        { department: course },
        { course: course }
      ]
    });
    
    // Assign to the first available professor, but complaint will still be visible to all admins
    if (professors.length > 0) {
      assignedProfessorId = professors[0]._id;
      assignedProfessorName = professors[0].name;
    }

    // Check if student has exceeded weekly complaint limit (only for students)
    if (currentUser.role === 'student') {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust to Monday
      startOfWeek.setHours(0, 0, 0, 0); // Start of day
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999); // End of day
      
      const complaintCount = await Complaint.countDocuments({
        studentId: req.user.userId,
        createdAt: {
          $gte: startOfWeek,
          $lte: endOfWeek
        }
      });
      
      // If student has already submitted 10 complaints, reject the submission
      if (complaintCount >= 10) {
        return res.status(400).json({ 
          message: 'Weekly complaint limit exceeded. Please schedule a meeting with an admin for additional complaints.',
          limitExceeded: true
        });
      }
    }

    // Determine the student ID, name, and email
    // For students, use their own information
    // For admins, use the provided student information
    let complaintStudentId, complaintStudentName, complaintStudentEmail;
    
    if (currentUser.role === 'student') {
      complaintStudentId = req.user.userId;
      complaintStudentName = currentUser.name;
      complaintStudentEmail = currentUser.email;
    } else {
      // For admins, use the provided student information
      // Handle both formats: { studentId, studentName, studentEmail } and { id, fullName, email }
      complaintStudentId = studentId || req.body.id;
      complaintStudentName = studentName || req.body.fullName;
      complaintStudentEmail = studentEmail || req.body.email;
    }

    // Validate required fields for admin-created complaints
    if (currentUser.role === 'admin') {
      if (!complaintStudentId || !complaintStudentName || !complaintStudentEmail) {
        return res.status(400).json({ 
          message: 'Student ID, name, and email are required for admin-created complaints. ' +
                   `Received: ID=${complaintStudentId}, Name=${complaintStudentName}, Email=${complaintStudentEmail}`
        });
      }
      
      // If this is a meeting request (topic starts with [MEETING REQUEST]), assign to the admin who created it
      if (topic && topic.startsWith('[MEETING REQUEST]')) {
        assignedAdminId = currentUser._id;
        assignedAdminName = currentUser.name;
      }
    }

    const complaint = new Complaint({ 
      studentId: complaintStudentId, 
      studentName: complaintStudentName,
      studentEmail: complaintStudentEmail,
      topic, 
      description, 
      course, 
      department, // Add department field
      assignedProfessorId,
      assignedProfessorName,
      assignedAdminId,
      assignedAdminName,
      status: 'submitted' 
    });
    await complaint.save();

    // Populate complaint with student and professor details
    await complaint.populate([
      { path: 'studentId', select: 'name email' },
      { path: 'assignedProfessorId', select: 'name department' },
      { path: 'assignedAdminId', select: 'name' }
    ]);

    // Send email notification to admin and all professors in the department
    if (transporter.options.auth.user && transporter.options.auth.pass) {
      // Notify admin
      const admin = await User.findOne({ role: 'admin', status: 'approved' });
      if (admin) {
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: admin.email,
          subject: 'New Complaint Submitted',
          text: `A new complaint has been submitted by ${complaintStudentName} in department ${department}. Topic: ${topic}`
        }).catch(console.error);
      }
      
      // Notify all professors in the department
      for (const professor of professors) {
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: professor.email,
          subject: 'New Complaint in Your Department',
          text: `A new complaint has been submitted in your department: ${department}. Topic: ${topic}\n\nThis complaint is visible to all professors in the department.`
        }).catch(console.error);
      }
      
      // Also notify the specifically assigned professor if one exists
      if (assignedProfessorId) {
        const assignedProfessor = await User.findById(assignedProfessorId);
        if (assignedProfessor) {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: assignedProfessor.email,
            subject: 'New Complaint Assigned to You',
            text: `A new complaint has been specifically assigned to you: ${topic}\n\nYou are the primary handler for this complaint in department ${department}.`
          }).catch(console.error);
        }
      }
      
      // Notify the assigned admin if one exists (for meeting requests)
      if (assignedAdminId && assignedAdminId.toString() !== currentUser._id.toString()) {
        const assignedAdmin = await User.findById(assignedAdminId);
        if (assignedAdmin) {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: assignedAdmin.email,
            subject: 'Meeting Request Assigned to You',
            text: `A meeting request has been assigned to you for student ${complaintStudentName}. Topic: ${topic}`
          }).catch(console.error);
        }
      }
    }

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// File upload for complaints
app.post('/api/complaints/upload', authenticateToken, upload.single('attachment'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ attachment: fileUrl });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student complaints
app.get('/api/complaints/student/:id', authenticateToken, async (req, res) => {
  try {
    // Students can only view their own complaints
    if (req.user.role === 'student' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const complaints = await Complaint.find({ studentId: req.params.id })
      .populate('assignedProfessorId', 'name department');
      
    // Remove student personal information for students (they already know their own info)
    const sanitizedComplaints = complaints.map(complaint => {
      const complaintObj = complaint.toObject();
      // Remove student personal information for students
      delete complaintObj.studentId;
      return complaintObj;
    });
    
    res.json(sanitizedComplaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ New endpoint to get weekly complaint count for a student
app.get('/api/complaints/student/:id/weekly-count', authenticateToken, async (req, res) => {
  try {
    // Students can only view their own complaint count
    if (req.user.role === 'student' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Calculate the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust to Monday
    startOfWeek.setHours(0, 0, 0, 0); // Start of day
    
    // Calculate the end of the current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // End of day
    
    // Count complaints for the current week
    const complaintCount = await Complaint.countDocuments({
      studentId: req.params.id,
      createdAt: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    });
    
    res.json({ count: complaintCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ New endpoint to check if student has exceeded complaint limit
app.get('/api/complaints/student/:id/exceeded-limit', authenticateToken, async (req, res) => {
  try {
    // Only admins can check if a student has exceeded the limit
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Calculate the start of the current week (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust to Monday
    startOfWeek.setHours(0, 0, 0, 0); // Start of day
    
    // Calculate the end of the current week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999); // End of day
    
    // Count complaints for the current week
    const complaintCount = await Complaint.countDocuments({
      studentId: req.params.id,
      createdAt: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    });
    
    const exceeded = complaintCount >= 10;
    
    res.json({ 
      exceeded,
      count: complaintCount,
      limit: 10
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get professor complaints
app.get('/api/complaints/professor/:id', authenticateToken, async (req, defaultRes) => {
  try {
    // Professors can only view complaints assigned to them or in their course/department
    if (req.user.role === 'professor' && req.user.userId !== req.params.id) {
      return defaultRes.status(403).json({ message: 'Access denied' });
    }
    
    // Get the professor's details to find complaints in their course/department
    const professor = await User.findById(req.params.id);
    if (!professor) {
      return defaultRes.status(404).json({ message: 'Professor not found' });
    }
    
    // Find complaints assigned to this professor or in their course/department
    const complaints = await Complaint.find({
      $or: [
        { assignedProfessorId: req.params.id },
        { course: professor.department }
      ]
    })
      .populate('assignedProfessorId', 'name department');
      
    // Remove student personal information for professors
    const sanitizedComplaints = complaints.map(complaint => {
      const complaintObj = complaint.toObject();
      // Remove student personal information for professors
      delete complaintObj.studentId;
      return complaintObj;
    });
    
    defaultRes.json(sanitizedComplaints);
  } catch (error) {
    defaultRes.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update complaint status
app.patch('/api/complaints/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check permissions
    if (req.user.role === 'student' && req.user.userId !== complaint.studentId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Admins can update status for any complaint
    if (req.user.role !== 'admin') {
      // Professors can update status for complaints assigned to them or in their course/department
      if (req.user.role === 'professor') {
        const professor = await User.findById(req.user.userId);
        if (!professor) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        const isAssigned = req.user.userId === complaint.assignedProfessorId?.toString();
        const isInDepartment = professor.department === complaint.course;
        
        if (!isAssigned && !isInDepartment) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }
    
    // Only admin can mark as rejected, but professors can mark as solved
    if (status.toLowerCase() === 'rejected' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can mark complaints as rejected' });
    }
    
    const oldStatus = complaint.status;
    complaint.status = status;
    complaint.updatedAt = Date.now();
    
    // Track which professor solved the complaint
    if (status.toLowerCase() === 'solved' && req.user.role === 'professor') {
      complaint.solvedByProfessorId = req.user.userId;
      complaint.solvedByProfessorName = req.user.name;
    }
    
    await complaint.save();
    
    // Send email notification when status changes
    if (transporter.options.auth.user && transporter.options.auth.pass && oldStatus !== status) {
      // Notify student
      const student = await User.findById(complaint.studentId);
      if (student) {
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: `Complaint Status Updated: ${complaint.topic}`,
          text: `The status of your complaint "${complaint.topic}" has been updated from ${oldStatus} to ${status}.`
        }).catch(console.error);
      }
      
      // Notify admin
      const admin = await User.findOne({ role: 'admin', status: 'approved' });
      if (admin) {
        let messageText = `The status of complaint "${complaint.topic}" has been updated from ${oldStatus} to ${status} by ${req.user.name}.`;
        if (status.toLowerCase() === 'solved' && req.user.role === 'professor') {
          messageText += `\n\nSolved by Professor: ${req.user.name}`;
        }
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: admin.email,
          subject: `Complaint Status Updated: ${complaint.topic}`,
          text: messageText
        }).catch(console.error);
      }
      
      // Notify assigned professor if different from the one making the change
      if (complaint.assignedProfessorId && complaint.assignedProfessorId.toString() !== req.user.userId) {
        const assignedProfessor = await User.findById(complaint.assignedProfessorId);
        if (assignedProfessor) {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: assignedProfessor.email,
            subject: `Complaint Status Updated: ${complaint.topic}`,
            text: `The status of complaint "${complaint.topic}" has been updated from ${oldStatus} to ${status} by ${req.user.name}.`
          }).catch(console.error);
        }
      }
    }
    
    // Populate complaint with student and professor details
    await complaint.populate([
      { path: 'studentId', select: 'name email' },
      { path: 'assignedProfessorId', select: 'name department' }
    ]);
    
    // Return the complaint with properly structured replies
    const complaintObject = complaint.toObject();
    res.json({
      ...complaintObject,
      _id: complaintObject._id,
      id: complaintObject._id,
      replies: complaintObject.replies.map((r) => ({
        ...r,
        _id: r._id,
        id: r._id,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add reply to complaint
app.post('/api/complaints/:id/reply', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check permissions
    if (req.user.role === 'student' && req.user.userId !== complaint.studentId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Admins can add replies to any complaint
    if (req.user.role !== 'admin') {
      // Professors can add replies to complaints assigned to them or in their course/department
      if (req.user.role === 'professor') {
        const professor = await User.findById(req.user.userId);
        if (!professor) {
          return res.status(403).json({ message: 'Access denied' });
        }
        
        const isAssigned = req.user.userId === complaint.assignedProfessorId?.toString();
        const isInDepartment = professor.department === complaint.course;
        
        if (!isAssigned && !isInDepartment) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }
    
    // Validate message
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Get the current user's details
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If this is a reply to a meeting request and the user is an admin, 
    // assign the complaint to this admin if not already assigned
    if (complaint.topic && complaint.topic.startsWith('[MEETING REQUEST]') && 
        currentUser.role === 'admin' && !complaint.assignedAdminId) {
      complaint.assignedAdminId = currentUser._id;
      complaint.assignedAdminName = currentUser.name;
    }
    
    // Add reply
    const reply = {
      userId: req.user.userId,
      userName: currentUser.name || 'Unknown User', // Use actual user name
      userRole: req.user.role,
      message: message.trim(),
      createdAt: new Date()
    };
    
    complaint.replies.push(reply);
    complaint.updatedAt = Date.now();
    
    // Ensure department field exists (for backwards compatibility)
    if (!complaint.department) {
      complaint.department = complaint.course || 'Unknown Department';
    }
    
    await complaint.save();
    
    // Send email notification to all relevant parties
    if (transporter.options.auth.user && transporter.options.auth.pass) {
      // Notify student
      const student = await User.findById(complaint.studentId);
      if (student) {
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: `New Reply to Your Complaint: ${complaint.topic}`,
          text: `A new reply has been added to your complaint "${complaint.topic}" by ${currentUser.name} (${req.user.role}).\n\nReply: ${message}`
        }).catch(console.error);
      }
      
      // Notify admin
      const admin = await User.findOne({ role: 'admin', status: 'approved' });
      if (admin) {
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: admin.email,
          subject: `New Reply to Complaint: ${complaint.topic}`,
          text: `A new reply has been added to complaint "${complaint.topic}" by ${currentUser.name} (${req.user.role}).\n\nReply: ${message}`
        }).catch(console.error);
      }
      
      // Notify assigned professor if different from the one making the reply
      if (complaint.assignedProfessorId && complaint.assignedProfessorId.toString() !== req.user.userId) {
        const assignedProfessor = await User.findById(complaint.assignedProfessorId);
        if (assignedProfessor) {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: assignedProfessor.email,
            subject: `New Reply to Complaint: ${complaint.topic}`,
            text: `A new reply has been added to complaint "${complaint.topic}" by ${currentUser.name} (${req.user.role}).\n\nReply: ${message}`
          }).catch(console.error);
        }
      }
      
      // Notify all professors in the department (except the one who made the reply)
      try {
        const departmentProfessors = await User.find({ 
          role: 'professor', 
          status: 'approved', 
          department: complaint.department || complaint.course,
          _id: { $ne: req.user.userId } // Exclude the professor who made the reply
        });
        
        for (const prof of departmentProfessors) {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: prof.email,
            subject: `New Reply to Complaint: ${complaint.topic}`,
            text: `A new reply has been added to complaint "${complaint.topic}" by ${currentUser.name} (${req.user.role}).\n\nReply: ${message}`
          }).catch(console.error);
        }
      } catch (emailError) {
        console.error('Error sending emails to department professors:', emailError);
        // Don't fail the request if email sending fails
      }
    }
    
    // Populate complaint with student and professor details
    await complaint.populate([
      { path: 'studentId', select: 'name email' },
      { path: 'assignedProfessorId', select: 'name department' }
    ]);
    
    // Return the complaint with properly structured replies
    const complaintObject = complaint.toObject();
    res.json({
      ...complaintObject,
      _id: complaintObject._id,
      id: complaintObject._id,
      replies: complaintObject.replies.map((r) => ({
        ...r,
        _id: r._id,
        id: r._id,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Error in add reply endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all complaints (admin only)
app.get('/api/complaints', authenticateToken, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('studentId', 'name email')
      .populate('assignedProfessorId', 'name department');
      
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign complaint to professor (admin only)
app.patch('/api/complaints/:id/assign', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { professorId } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Verify professor exists and is approved
    const professor = await User.findOne({ 
      _id: professorId, 
      role: 'professor', 
      status: 'approved' 
    });
    
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found or not approved' });
    }
    
    const oldAssignedProfessorId = complaint.assignedProfessorId;
    complaint.assignedProfessorId = professorId;
    complaint.assignedProfessorName = professor.name;
    complaint.status = 'pending';
    complaint.updatedAt = Date.now();
    await complaint.save();

    // Send email notification to professor
    if (transporter.options.auth.user && transporter.options.auth.pass) {
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: professor.email,
        subject: 'New Complaint Assigned',
        text: `A new complaint has been assigned to you: ${complaint.topic}`
      }).catch(console.error);
      
      // Notify student
      const student = await User.findById(complaint.studentId);
      if (student) {
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: `Complaint Assigned to Professor: ${complaint.topic}`,
          text: `Your complaint "${complaint.topic}" has been assigned to Professor ${professor.name}.`
        }).catch(console.error);
      }
      
      // Notify previous assigned professor if different
      if (oldAssignedProfessorId && oldAssignedProfessorId.toString() !== professorId) {
        const oldProfessor = await User.findById(oldAssignedProfessorId);
        if (oldProfessor) {
          transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: oldProfessor.email,
            subject: `Complaint Reassigned: ${complaint.topic}`,
            text: `Complaint "${complaint.topic}" has been reassigned to another professor.`
          }).catch(console.error);
        }
      }
    }
    
    // Populate complaint with student and professor details
    await complaint.populate([
      { path: 'studentId', select: 'name email' },
      { path: 'assignedProfessorId', select: 'name department' }
    ]);
    
    // Return the complaint with properly structured replies
    const complaintObject = complaint.toObject();
    res.json({
      ...complaintObject,
      _id: complaintObject._id,
      id: complaintObject._id,
      replies: complaintObject.replies.map((r) => ({
        ...r,
        _id: r._id,
        id: r._id,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create default admin
const createAdminUser = async () => {
  try {
    // Use the admin credentials from .env file if available, otherwise use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'asthikshetty9999@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '123456';
    
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({ 
        name: 'Admin User', 
        email: adminEmail, 
        password: hashedPassword, 
        role: 'admin', 
        status: 'approved' 
      });
      await admin.save();
      console.log('Admin user created successfully with email:', adminEmail);
    } else {
      // Ensure existing admin user has approved status
      if (adminExists.status !== 'approved') {
        await User.findByIdAndUpdate(adminExists._id, { status: 'approved' });
        console.log('Admin user status updated to approved');
      }
      console.log('Admin user already exists with email:', adminEmail);
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// API endpoint to create an admin user (for testing purposes)
app.post('/api/create-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the admin user
    const admin = new User({ 
      name: name || 'Admin User', 
      email, 
      password: hashedPassword, 
      role: 'admin', 
      status: 'approved' 
    });
    
    await admin.save();
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: { 
        id: admin._id, 
        email: admin.email, 
        name: admin.name, 
        role: admin.role 
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`  - http://localhost:${PORT}`);
  console.log(`  - http://127.0.0.1:${PORT}`);
  console.log(`  - http://0.0.0.0:${PORT}`);
  createAdminUser();
});