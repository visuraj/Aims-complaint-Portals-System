@echo off
echo 🚀 Setting up Complaint Portal System...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v18 or higher) first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Install Firebase CLI if not installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Firebase CLI...
    npm install -g firebase-tools
)

REM Install functions dependencies
echo 📦 Installing Cloud Functions dependencies...
cd functions
npm install
cd ..

REM Create environment file if it doesn't exist
if not exist .env (
    echo 📝 Creating environment file...
    copy env.example .env
    echo ⚠️  Please update .env file with your Firebase configuration
)

echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo 1. Update firebase.ts with your Firebase configuration
echo 2. Update .env file with your settings
echo 3. Set up Firebase project and deploy functions
echo 4. Run 'npx expo start' to start the development server
echo.
echo 📖 For detailed setup instructions, see README.md
pause
