# 📬 QuickDM – Smart Cold Messaging Assistant
**QuickDM** is an intelligent platform that helps users craft and schedule cold messages across platforms with AI-powered personalization. Whether you're a founder, recruiter, freelancer, or growth marketer — QuickDM helps you reach out smarter and faster.
# Link 
https://quickdm-g1lk.onrender.com/  
⚠️ Note: This project is currently optimized for desktop view. Mobile responsiveness improvements are in progress.
# Screenshots of my website
<img width="1903" height="700" alt="image" src="https://github.com/user-attachments/assets/821f8c2f-c1e5-41d0-889f-ae643a450ce5" />  
<img width="1882" height="879" alt="image" src="https://github.com/user-attachments/assets/b7a0b2b1-3d6f-4279-8408-a6e4d8ac74ba" />  
<img width="1545" height="828" alt="image" src="https://github.com/user-attachments/assets/20415029-c70b-4b16-a3f7-60711c7a6324" />  
<img width="1131" height="797" alt="image" src="https://github.com/user-attachments/assets/0192f886-2d68-41c6-aee1-3f72c168eac0" />  




## ✨ Features

- 🔐 **User Authentication**
  - Manual Sign Up / Login
  - Google OAuth Integration

- ✍️ **Cold Email Generator**
  - Role-based & platform-specific message generation
  - Custom tone, language, and style options
  - OpenAI-powered personalization engine

- 📄 **Email Templates**
  - Save & reuse cold email templates
  - Preview and edit in a clean UI

- 📅 **Message Scheduler**
  - Schedule messages with date/time, and time zone
  - Notification via:
    - Gmail (Nodemailer)
  - `node-cron` powered task scheduler

- 📜 **History View**
  - View scheduled messages
  - Copy, edit, resend, or reschedule them
### ⚙️ Prerequisites

- Node.js and npm
- MongoDB instance (local or Atlas)
- OpenAI API key
- Google OAuth credentials
# Set up your own env file  
MONGODB_URL=  
GOOGLE_CLIENT_ID=  
GOOGLE_CLIENT_SECRET=  
OPENROUTER_API_KEY=  
EMAIL_USER=  
EMAIL_PASS=  
BASE_URL=  
VAPID_PUBLIC_KEY=  
VAPID_PRIVATE_KEY=  
GOOGLE_REDIRECT_URI=  
SECRET=  
# Tech stack
Frontend: HTML, CSS, JavaScript, EJS  
Backend: Node.js, Express.js  
Database: MongoDB with Mongoose  
Auth: Passport.js with Google OAuth  
AI Integration: OpenAI API  
Scheduling: node-cron  
Notifications: Nodemailer  
