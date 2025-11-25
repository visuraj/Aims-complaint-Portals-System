# Quick Start Guide

## Getting the Complaint Portal Running

Follow these steps to get your Complaint Portal system up and running quickly.

## Prerequisites

Make sure you have these installed:
- Node.js (v14 or higher)
- npm (comes with Node.js)
- Git
- Expo Go app on your mobile device

## Step-by-Step Instructions

### 1. Install Dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

This will install all backend and frontend dependencies.

### 2. Verify MongoDB Connection

Test your MongoDB connection with:

```bash
npm run test-db
```

You should see a success message if everything is configured correctly.

**Note**: If you get a connection error, check that:
- Your IP address is whitelisted in MongoDB Atlas
- Special characters in your password are URL encoded (e.g., "@" becomes "%40")

### 3. Start the Complete System

Run both the backend server and Expo frontend simultaneously:

```bash
npm run dev-full
```

This command starts:
- Backend API server on `http://localhost:3003` (port changed from 3001)
- Expo development server for the mobile app

### 4. Access the Mobile App

1. Wait for the QR code to appear in the terminal
2. Open Expo Go app on your mobile device
3. Scan the QR code
4. The app will load on your device

## Default Accounts

### Admin Account
- **Email**: `asthikshetty9999@gmail.com`
- **Password**: `123456`

### Test Registration
You can register new accounts as:
- **Student**
- **Professor**

Note: New registrations require admin approval before login.

## Testing the System

1. **Login as Admin** using the default credentials
2. **Approve** any pending student/professor registrations
3. **Register** a new student or professor account
4. **Login** with the newly approved account
5. **Submit** a test complaint as a student
6. **Respond** to the complaint as a professor or admin

## Troubleshooting

### If the app doesn't load on your phone:
- Ensure both your computer and phone are on the same Wi-Fi network
- Check that firewalls aren't blocking the connection
- Try restarting the development server

### If you get MongoDB connection errors:
- Verify your IP is whitelisted in MongoDB Atlas
- Double-check the username and password in `.env`
- Ensure special characters in passwords are URL encoded
- Verify the `complaint_portal` database exists

### If login fails:
- Make sure you've approved the user account as admin
- Check that the backend server is running
- Verify your network connection

### If you see "Port already in use" error:
- The system now uses port 3003 instead of 3001
- If port 3003 is also in use, change the PORT value in `.env`

## Next Steps

1. Explore all features of the system
2. Review the code in the `screens/` directory to understand the UI
3. Check the `server.js` file to understand the backend logic
4. Modify the system to add new features as needed

## Need Help?

- Check the detailed [SETUP_GUIDE.md](SETUP_GUIDE.md)
- Review the [README.md](README.md) for more information
- Look at the [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for an overview