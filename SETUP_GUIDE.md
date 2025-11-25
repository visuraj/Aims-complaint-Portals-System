# College Complaint Portal - Setup Guide

This guide will help you set up and run the College Complaint Portal application, which consists of a backend API server and a frontend mobile app.

## Project Structure

```
complaint-portal/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── App.js
    ├── package.json
    ├── app.json
    ├── context/
    ├── services/
    ├── screens/
    └── assets/
```

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (comes with Node.js)
- MongoDB Atlas account (for database)
- Expo CLI (for frontend development)
- Android Studio or iOS Simulator (for testing)

## Backend Setup

### 1. Install Dependencies

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```
# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://username:password@cluster0.eryvwbp.mongodb.net/complaint_portal

# JWT Secret Key (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key

# Server Port
PORT=3003

# Email Configuration (Optional - for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Set up MongoDB Atlas

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database named `complaint_portal`
4. Update the `MONGO_URI` in your `.env` file with your actual connection string
5. Add your IP address to the IP whitelist in MongoDB Atlas (or allow access from anywhere for development)

### 4. Run the Backend Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The server will start on port 3003 by default.

## Frontend Setup

### 1. Install Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

### 2. Install Expo CLI (if not already installed)

```bash
npm install -g expo-cli
```

### 3. Configure Backend Connection

The frontend is configured to connect to the backend server. By default:
- For Android emulator: `10.0.2.2:3003`
- For iOS simulator: `localhost:3003`
- For physical devices: You'll need to use your computer's IP address

### 4. Run the Frontend App

Start the Expo development server:

```bash
npm start
```

Or run on specific platforms:

```bash
# For Android
npm run android

# For iOS
npm run ios

# For Web
npm run web
```

## Default Admin Account

The system automatically creates a default admin account on first run:

- Email: `admin@college.edu`
- Password: `admin123`

You can change these credentials in the backend `server.js` file.

## Testing the Application

### 1. Start the Backend Server

Make sure the backend server is running on port 3003.

### 2. Start the Frontend App

Start the Expo development server.

### 3. Register Users

- Register as a student or professor
- Note that new registrations require admin approval

### 4. Approve Users (Admin)

- Log in as admin
- Go to the Admin Dashboard
- Approve pending user registrations

### 5. Create and Manage Complaints

- Students can create complaints after approval
- Professors can view and update complaints assigned to them
- Admins can view all complaints and assign them to professors

## Troubleshooting

### Network Issues

If you're having trouble connecting from the mobile app to the backend:

1. Make sure both devices are on the same network
2. For Android emulator, use `10.0.2.2` as the host
3. For physical devices, use your computer's IP address
4. Check firewall settings to ensure port 3003 is accessible

### Database Connection Issues

1. Verify your MongoDB Atlas connection string
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Check that the database name is correct

### Authentication Issues

1. Ensure the JWT secret is consistent between server restarts
2. Check that user accounts are approved by admin

## Deployment

### Backend Deployment

You can deploy the backend to any Node.js hosting service:
- Heroku
- AWS Elastic Beanstalk
- DigitalOcean App Platform
- Google Cloud Run

### Frontend Deployment

For mobile app distribution:
- Build APK for Android: `expo build:android`
- Build IPA for iOS: `expo build:ios`

## API Endpoints

### Authentication
- `POST /api/register/student` - Register student
- `POST /api/register/professor` - Register professor
- `POST /api/login` - User login

### User Management (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/pending` - Get pending approvals
- `PATCH /api/users/:id/approve` - Approve user
- `PATCH /api/users/:id/reject` - Reject user

### Complaints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints/student/:id` - Get student complaints
- `GET /api/complaints/professor/:id` - Get professor complaints
- `GET /api/complaints` - Get all complaints (admin)
- `PATCH /api/complaints/:id/status` - Update complaint status
- `PATCH /api/complaints/:id/assign` - Assign complaint to professor
- `POST /api/complaints/:id/reply` - Add reply to complaint

## Features Implemented

✅ **User Authentication**
- JWT-based authentication
- Role-based access control (student, professor, admin)

✅ **User Registration & Approval**
- Separate registration flows for students and professors
- Admin approval workflow

✅ **Complaint Management**
- Create, view, and update complaints
- Status tracking (submitted, pending, in progress, solved, rejected)
- Assignment to professors

✅ **Communication**
- Reply system for complaints
- Email notifications (when configured)

✅ **Role-specific Dashboards**
- Student dashboard with complaint creation and tracking
- Professor dashboard with assigned complaints
- Admin dashboard with user management and all complaints

✅ **Mobile-first Design**
- Responsive UI for mobile devices
- Intuitive navigation

## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email notifications

### Frontend
- React Native with Expo
- Axios for API communication
- React Navigation for routing
- AsyncStorage for local storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.