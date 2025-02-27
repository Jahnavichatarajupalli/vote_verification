# Voter Verification System

A secure web application for voter verification using facial recognition technology.

## Features
- Polling Officer Authentication
- Voting Slip Verification using OCR
- Facial Recognition for Voter Authentication
- Secure Database Integration
- JWT-based Authentication

## Tech Stack
- Frontend: React.js
- Backend: Node.js & Express.js
- Database: MongoDB
- Authentication: JWT
- OCR: Tesseract.js
- Facial Recognition: DeepFace

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   ```

2. Create a .env file in the root directory with:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

3. Run the application:
   ```bash
   # Run backend and frontend concurrently
   npm run dev-full
   
   # Run backend only
   npm run dev
   
   # Run frontend only
   npm run client
   ```

## Security Measures
- Password Hashing using bcrypt
- JWT for secure authentication
- CORS enabled
- Input validation and sanitization
- Secure HTTP-only cookies
