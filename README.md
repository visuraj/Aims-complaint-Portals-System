# College Complaint Portal

A comprehensive mobile application for managing college complaints built with Node.js, Express, MongoDB, and React Native (Expo).

## 🎯 Overview

The College Complaint Portal is a full-stack application that allows students to submit complaints, professors to manage assigned complaints, and administrators to oversee the entire system. The application features role-based access control, real-time complaint tracking, and a responsive mobile-first design.

## 🚀 Features

### User Roles
1. **Student**
   - Register and login (pending admin approval)
   - Create new complaints with details and attachments
   - View and track their complaints
   - Communicate through replies

2. **Professor**
   - Login after admin approval
   - View complaints assigned to their department
   - Update complaint status (in progress, solved, rejected)
   - Communicate with students through replies

3. **Admin**
   - Login with default credentials
   - Approve/reject user registrations
   - View all complaints
   - Assign complaints to professors
   - Manage the entire system

### Core Functionality
- **JWT Authentication** - Secure login and session management
- **Role-based Access Control** - Different permissions for each user type
- **Complaint Management** - Create, track, and resolve complaints
- **Real-time Updates** - Instant status changes and notifications
- **Email Notifications** - Automated emails for important events
- **File Attachments** - Support for images and documents
- **Mobile-first Design** - Optimized for smartphones and tablets

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Token-based authentication
- **Bcrypt.js** - Password hashing
- **Nodemailer** - Email notifications
- **Multer** - File uploads

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development environment
- **Axios** - HTTP client
- **React Navigation** - Screen navigation
- **AsyncStorage** - Local data storage

## 📁 Project Structure

```
complaint-portal/
├── backend/
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── .env.example       # Environment variables template
└── frontend/
    ├── App.js             # Main app component
    ├── package.json       # Frontend dependencies
    ├── app.json           # Expo configuration
    ├── context/           # Authentication context
    ├── services/          # API service layer
    ├── screens/           # Screen components
    └── assets/            # Images and static files
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB Atlas account
- Expo CLI

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd complaint-portal
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Configuration

1. **MongoDB Atlas:**
   - Create a cluster and database
   - Update the `MONGO_URI` in `.env`

2. **Environment Variables:**
   - `MONGO_URI` - MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT
   - `PORT` - Server port (default: 3003)
   - `EMAIL_USER` - SMTP email (optional)
   - `EMAIL_PASS` - SMTP password (optional)

## 📱 Usage

### Default Admin Account
- Email: `admin@college.edu`
- Password: `admin123`

### User Flows

1. **Student Registration:**
   - Register as student with college ID and course
   - Wait for admin approval
   - Login and create complaints

2. **Professor Registration:**
   - Register as professor with department
   - Wait for admin approval
   - Login and manage assigned complaints

3. **Admin Management:**
   - Login as admin
   - Approve pending users
   - Monitor all complaints
   - Assign complaints to professors

## 📞 API Endpoints

### Authentication
- `POST /api/register/student` - Student registration
- `POST /api/register/professor` - Professor registration
- `POST /api/login` - User login

### User Management
- `GET /api/users` - Get all users (admin)
- `GET /api/users/pending` - Get pending approvals (admin)
- `PATCH /api/users/:id/approve` - Approve user (admin)
- `PATCH /api/users/:id/reject` - Reject user (admin)

### Complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/student/:id` - Get student complaints
- `GET /api/complaints/professor/:id` - Get professor complaints
- `GET /api/complaints` - Get all complaints (admin)
- `PATCH /api/complaints/:id/status` - Update complaint status
- `PATCH /api/complaints/:id/assign` - Assign to professor (admin)
- `POST /api/complaints/:id/reply` - Add reply

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS protection
- Rate limiting (implementation pending)

## 📈 Future Enhancements

- [ ] Push notifications
- [ ] File upload improvements
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Offline support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## 📧 Support

For support, email [your-email] or open an issue in the repository.

## 🙏 Acknowledgements

- Thanks to all contributors who have helped build this project
- Inspired by real-world college complaint management needs