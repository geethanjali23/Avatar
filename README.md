🧠 Neura AI — Intelligent Holographic Workstation

Neura AI is a next-generation productivity workstation that combines a holographic AI assistant with computer vision to monitor your focus, posture, and mood. It features real-time voice interaction, an adaptive work timer, and a personalized dashboard to manage multiple AI avatars.

✨ Key Features

🤖 Holographic AI Chat: Interact with a smart AI assistant powered by Google Gemini.

🗣️ Voice Interaction: Hands-free experience with Speech-to-Text and Text-to-Speech (gTTS).

📷 AI Posture Correction: Uses TensorFlow.js (MoveNet) to detect slouching and alerts you to sit straight.

😊 Mood Detection: Real-time facial expression analysis using face-api.js to detect stress or fatigue.

⏱️ Adaptive Focus Timer:

Auto-Pause: The timer pauses automatically if you leave your desk.

Auto-Resume: Resumes instantly when you return.

🎨 Custom Avatars: Create and manage multiple bots with custom names, voices, and uploaded images.

🔊 Notification Control: Toggle voice notifications on/off in settings to customize your workspace quietness.

🔐 User System: Secure Signup, Login, and Dashboard functionality.

🛠️ Tech Stack

Backend:

Python (Flask 3.0+)

SQLAlchemy (ORM) & PyMySQL

MySQL (Database)

Google Gemini API (LLM)

gTTS (Text-to-Speech)

Frontend:

HTML5, CSS3 (Neon/Holographic UI)

JavaScript (ES6+)

AI Libraries: TensorFlow.js, Face-api.js

🚀 Installation & Setup

1. Prerequisites

Python 3.8+

MySQL Server installed and running.

A Google Gemini API Key.

2. Clone the Repository

git clone https://github.com/geethanjali23/Avatar.git
cd Avatar

3. Install Dependencies

It is highly recommended to use a virtual environment to manage dependencies.

1. Create & Activate Virtual Environment:

Windows:

python -m venv venv
venv\Scripts\activate


Mac/Linux:

python3 -m venv venv
source venv/bin/activate


2. Install Packages:

pip install -r requirements.txt


4. Configure Environment Variables

Create a .env file in the root directory with your specific configuration:

# General Config
FLASK_ENV=development
SECRET_KEY=your_super_secret_key_here

# Database Configuration
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_HOST=localhost
MYSQL_DB=ai_bots
# Optional: Full DB URL constructed in app
DB_URL=mysql+pymysql://root:your_password@localhost/ai_bots

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key


5. Database Setup

Open your MySQL client.

Create the database matching your .env file:

CREATE DATABASE ai_bots;


The application will automatically create the tables (user, bot) on the first run.

6. Run the Application

python server.py


You should see: 🚀 Server running at http://127.0.0.1:5000

📖 Usage Guide

Register/Login: Create an account to access your dashboard.

Create a Bot:

Go to the Dashboard.

Click "+ New Bot".

Upload a custom avatar image, name your bot, and select a voice type.

Start Working:

Click "Chat" on your created bot.

Grant Camera and Microphone permissions.

Set a Timer and click "Start Focus".

AI Features:

Posture: If you slouch for >30 seconds, Neura will verbally warn you.

Auto-Pause: Walk away from the camera, and the timer pauses. Sit back down, and it resumes.

Settings: Click the ⚙️ icon to toggle "Voice Notifications" if you prefer text-only alerts.

📂 Project Structure

Avatar/
├── static/
│   ├── css/               # Global styles
│   ├── js/
│   │   └── app.js         # Main frontend logic (Camera, Timer, AI)
│   ├── img/               # Default assets
│   ├── models/            # AI models (if hosted locally)
│   └── uploads/           # User uploaded avatar images
├── templates/
│   ├── index.html         # Chat interface (Landing page logic)
│   ├── dashboard.html     # User dashboard
│   ├── create_bot.html    # Bot creation form
│   ├── talking_avatar.html# Main immersive chat view
│   ├── login.html         # Auth pages
│   └── signup.html
├── gemini_client.py       # Wrapper for Google Gemini API
├── server.py              # Main Flask Backend
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
└── README.md
