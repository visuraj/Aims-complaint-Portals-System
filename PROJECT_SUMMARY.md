# Complaint Portal Project Summary

## Overview

The Complaint Portal is a comprehensive mobile application built with React Native and Expo that allows students to submit complaints, professors to handle them, and administrators to manage the entire system. The application features role-based access control, real-time complaint tracking, and a complete assignment workflow.

## Key Features

### Student Features
- **Account Registration** - Students can register with their college ID and course information
- **Complaint Submission** - Submit detailed complaints with topics, descriptions, and course information
- **Complaint Tracking** - View status updates and replies to their complaints
- **Profile Management** - Manage personal information and view complaint history

### Professor Features
- **Account Registration** - Professors can register with their professor ID and department
- **Complaint Assignment** - View complaints assigned to them or in their department
- **Status Updates** - Update complaint status (Pending, In Progress, Solved)
- **Reply System** - Communicate with students through the complaint system
- **Profile Management** - Manage personal information and view assigned complaints

### Admin Features
- **User Management** - Approve or reject student and professor registrations
- **Complaint Management** - View all complaints and assign them to professors
- **Assignment Workflow** - Assign complaints to professors with department filtering
- **Status Management** - Update complaint status and add administrative replies
- **System Oversight** - Complete visibility into all system activities

## Recent Enhancements

### Complaint Assignment Feature
- **Direct Assignment** - Assign complaints to professors directly from the complaint list
- **Department Filtering** - Filter professors by department for easier selection
- **Professor Grouping** - Professors are grouped by department in the assignment dropdown
- **Visual Feedback** - Clear indicators for assignment status and loading states

## Technology Stack

### Frontend
- **React Native** - Cross-platform mobile application framework
- **Expo** - Development environment and toolchain
- **React Navigation** - Navigation between screens
- **React Native Paper** - UI component library
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data storage
- **Mongoose** - MongoDB object modeling tool
- **JWT** - Authentication and authorization
- **Bcrypt.js** - Password hashing
- **Nodemailer** - Email notifications

### Development Tools
- **TypeScript** - Type checking for JavaScript
- **Nodemon** - Automatic server restart during development
- **Concurrently** - Run multiple commands simultaneously
- **Dotenv** - Environment variable management

## Architecture

### Client-Server Architecture
The application follows a client-server architecture with:
- **Mobile Client** - React Native application running on mobile devices
- **API Server** - Node.js/Express server handling business logic
- **Database** - MongoDB storing all application data

### Role-Based Access Control
The system implements role-based access control with three distinct roles:
- **Students** - Can submit complaints and view their own complaints
- **Professors** - Can view and manage complaints assigned to them
- **Administrators** - Have full access to all system features

## Data Models

### User Model
- **Name** - User's full name
- **Email** - Unique email address
- **Password** - Hashed password
- **Role** - Student, Professor, or Admin
- **Status** - Pending, Approved, or Rejected
- **Additional Fields** - Role-specific information (collegeId, course, department, professorId)

### Complaint Model
- **Student Information** - Reference to student who submitted the complaint
- **Complaint Details** - Topic, description, course, department
- **Status** - Submitted, Pending, In Progress, Solved, Rejected
- **Assignment** - Assigned professor information
- **Replies** - Threaded communication between users
- **Attachments** - File attachments to complaints

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register/student` - Student registration
- `POST /api/register/professor` - Professor registration
- `GET /api/auth/me` - Get current user information

### User Management (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/pending` - Get pending users
- `PATCH /api/users/:id/approve` - Approve user
- `PATCH /api/users/:id/reject` - Reject user

### Complaint Management
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints` - Get all complaints (Admin)
- `GET /api/complaints/student/:id` - Get student's complaints
- `GET /api/complaints/professor/:id` - Get professor's complaints
- `PATCH /api/complaints/:id/assign` - Assign complaint to professor
- `PATCH /api/complaints/:id/status` - Update complaint status
- `POST /api/complaints/:id/reply` - Add reply to complaint

## Deployment

### Requirements
- Node.js v14 or higher
- MongoDB Atlas account or local MongoDB instance
- Expo account for mobile deployment
- Email service for notifications (Gmail recommended)

### Environment Variables
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (default: 3003)
- `EMAIL_USER` - Email address for notifications
- `EMAIL_PASS` - Email password or app-specific password

## Testing

### Automated Tests
- API endpoint testing with Jest
- Integration tests for key workflows
- Unit tests for service functions

### Manual Testing
- User registration and approval workflow
- Complaint submission and assignment workflow
- Status updates and reply system
- Role-based access control verification

## Future Enhancements

### Planned Features
- **Push Notifications** - Real-time notifications for complaint updates
- **File Attachments** - Support for image and document attachments
- **Analytics Dashboard** - Visual reporting of complaint trends
- **Advanced Search** - Enhanced filtering and search capabilities
- **Multi-language Support** - Localization for different languages

### Technical Improvements
- **Performance Optimization** - Database indexing and query optimization
- **Security Enhancements** - Additional validation and security measures
- **Code Refactoring** - Modularization and code organization improvements
- **Documentation** - Comprehensive API and user documentation

## Troubleshooting

### Common Issues
- **Network Connectivity** - Ensure backend server is running and accessible
- **Authentication Errors** - Verify user credentials and account status
- **Database Connection** - Check MongoDB connection string and network access
- **Port Conflicts** - Change server port if 3003 is already in use

### Debugging Steps
1. Check server logs for error messages
2. Verify environment variables are correctly set
3. Test API endpoints with tools like Postman
4. Check network connectivity between client and server
5. Review MongoDB Atlas IP whitelist settings

## Contributing

### Development Setup
1. Clone the repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Start development servers with `npm run dev-full`

### Code Standards
- Follow existing code style and patterns
- Write clear, descriptive commit messages
- Add tests for new functionality
- Update documentation when making changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For support or questions, please contact the development team.