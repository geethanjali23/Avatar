# 🧠 Neura AI — Intelligent Holographic Workstation

Neura AI is a next-generation productivity workstation that combines a holographic AI assistant with computer vision to monitor your focus, posture, and mood. It features real-time voice interaction, an adaptive work timer, and a personalized dashboard to manage multiple AI avatars.

---

## ✨ Key Features

* 🤖 **Holographic AI Chat** — interact with a smart AI assistant powered by Google Gemini
* 🗣️ **Voice Interaction** — Speech‑to‑Text & Text‑to‑Speech (gTTS)
* 📷 **AI Posture Correction** — TensorFlow MoveNet detects slouching
* 😊 **Mood Detection** — real‑time emotional analysis using face‑api.js
* ⏱ **Adaptive Focus Timer** — auto‑pause & resume based on user presence
* 🎨 **Custom Avatars** — upload profile images for AI bots
* 🔊 **Notification Control** — enable/disable voice alerts
* 🔐 **User Authentication** — secure login & dashboard

---

## 🛠 Tech Stack

### Backend

* Python (Flask 3.0+)
* SQLAlchemy & PyMySQL
* MySQL
* Google Gemini API
* gTTS

### Frontend

* HTML5, CSS3, JavaScript
* TensorFlow.js, face‑api.js

---

## 🚀 Installation & Setup

### 1️⃣ Prerequisites

* Python 3.8+
* MySQL running locally
* Gemini API Key

### 2️⃣ Clone Repository

```bash
git clone https://github.com/geethanjali23/Avatar.git
cd Avatar
```

### 3️⃣ Create & Activate Virtual Environment

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

#### Mac/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 4️⃣ Install Requirements

```bash
pip install -r requirements.txt
```

### 5️⃣ Create .env File

```env
FLASK_ENV=development
SECRET_KEY=your_secret_key
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_HOST=localhost
MYSQL_DB=ai_bots
DB_URL=mysql+pymysql://root:your_password@localhost/ai_bots
GEMINI_API_KEY=your_api_key
```

### 6️⃣ Setup MySQL

```sql
CREATE DATABASE ai_bots;
```

### 7️⃣ Run Application

```bash
python server.py
```

➡ [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📖 Usage Guide

* Login or Create Account
* Create New Bot → upload image & set voice
* Open Chat window to start interacting
* Enable Camera to activate posture & mood AI
* Start focus timer
* Use ⚙️ settings to toggle voice notifications

---

## 📂 Project Structure

```
Avatar/
├── static/
│   ├── css/
│   ├── js/
│   ├── img/
│   ├── models/
│   └── uploads/
├── templates/
│   ├── index.html
│   ├── dashboard.html
│   ├── create_bot.html
│   ├── talking_avatar.html
│   ├── login.html
│   └── signup.html
├── gemini_client.py
├── server.py
├── requirements.txt
├── .env
└── README.md
```
### 🌐 Repository

[https://github.com/geethanjali23/Avatar.git](https://github.com/geethanjali23/Avatar.git)
