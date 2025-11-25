# How to Run the Complaint Portal Application

## Understanding the Architecture

This application has two separate parts:
1. **Backend API Server** - Node.js + Express.js + MongoDB (runs on your computer)
2. **Frontend Mobile App** - Expo React Native (runs on your mobile device)

## Correct Way to Run the Application

### Option 1: Run Backend and Frontend Separately (Recommended)

#### 1. Start the Backend Server
Open a terminal/command prompt and run:
```bash
npm run server
```
or for development with auto-restart:
```bash
npm run dev-server
```

This starts the backend API server on `http://localhost:3003`

#### 2. Start the Frontend Mobile App
Open another terminal/command prompt and run:
```bash
npm run expo
```

This starts the Expo development server. Scan the QR code with Expo Go on your mobile device.

### Option 2: Run Both Together
```bash
npm run dev-full
```

This runs both the backend server and frontend Expo server simultaneously using `concurrently`.

## Common Issues and Solutions

### Issue: "You attempted to import the Node standard library module 'path'"

**Cause**: Trying to run Node.js backend code through Expo
**Solution**: Run the backend and frontend separately as shown above

### Issue: "Port already in use"

**Cause**: Another application is using port 3003
**Solution**: Change the PORT in your `.env` file to a different number (e.g., 3002, 4000, etc.)

### Issue: MongoDB connection failed

**Cause**: Incorrect credentials or network issues
**Solution**: 
1. Verify your MongoDB connection string in `.env`
2. Ensure your IP is whitelisted in MongoDB Atlas
3. Check your internet connection

## Testing the Backend API

You can test if your backend is running by visiting:
- `http://localhost:3003/` - Main API endpoint
- `http://localhost:3003/health` - Health check

## Mobile App Access

After starting both servers:
1. Ensure your computer and mobile device are on the same Wi-Fi network
2. Open Expo Go app on your mobile device
3. Scan the QR code shown in the terminal
4. The app will load on your device

**Important**: The mobile app expects the backend API to be running on port 3003. If you change the port in your `.env` file, you must also update the `API_BASE_URL` in `services/MongoDBService.ts` to match.

## Default Accounts

### Admin Account
- **Email**: `asthikshetty9999@gmail.com`
- **Password**: `123456`

### Test Registration
You can register new accounts as:
- **Student**
- **Professor**

Note: New registrations require admin approval before login.

## Troubleshooting

### If the mobile app doesn't connect to the backend:
1. Check that the backend server is running
2. Verify the API_BASE_URL in `services/MongoDBService.ts` matches your backend URL
3. Ensure both devices are on the same network
4. Check firewall settings

### If you see deprecation warnings:
These are normal and don't affect functionality:
- `DEP0040: The 'punycode' module is deprecated` - This is a Node.js internal warning and can be ignored

### If you change the backend port:
1. Update the PORT value in `.env`
2. Update the `API_BASE_URL` in `services/MongoDBService.ts` to match the new port
3. Restart both servers