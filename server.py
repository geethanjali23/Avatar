# --------------------------------------------------
# server.py — Full Working Version with Image Upload
# --------------------------------------------------

import os
import base64
from io import BytesIO
from datetime import datetime
from functools import wraps
from werkzeug.utils import secure_filename  # Required for file uploads

from flask import (
    Flask, request, jsonify, render_template,
    redirect, session, flash, send_from_directory, url_for
)
from flask_cors import CORS

from dotenv import load_dotenv
load_dotenv()

# ---------------------- DATABASE (MySQL) ----------------------
from flask_sqlalchemy import SQLAlchemy

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_DB = os.getenv("MYSQL_DB", "neura_db")

# Fallback for local testing if env vars are missing
if not MYSQL_USER or not MYSQL_DB:
    print("⚠ Warning: MySQL ENV variables missing. Using defaults.")

DB_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DB}"

# ---------------------- FLASK APP ----------------------
app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "supersecret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = DB_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# CONFIG FOR UPLOADS
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

CORS(app)
db = SQLAlchemy(app)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# ---------------------- MODELS ----------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    email = db.Column(db.String(200), unique=True)
    password_hash = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    bots = db.relationship("Bot", backref="owner", lazy=True)


class Bot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150))
    description = db.Column(db.Text)
    voice_type = db.Column(db.String(50), default="female")
    # Stores the web path to the image (e.g., "/static/uploads/xyz.png")
    image_url = db.Column(db.String(300), default="/static/default.png")

    owner_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ---------------------- GEMINI AI & GTTS ----------------------
# (Same as your existing code)
try:
    from gemini_client import GeminiClient
    ai = GeminiClient()
    GEMINI_OK = True
    print("✅ Gemini AI loaded")
except Exception as e:
    GEMINI_OK = False
    ai = None
    print("❌ Gemini Load Error:", e)

try:
    from gtts import gTTS
    GTTS_OK = True
except:
    print("⚠ gTTS missing — audio disabled")
    GTTS_OK = False

def tts_base64(text):
    if not GTTS_OK: return ""
    try:
        bio = BytesIO()
        gTTS(text=text, lang="en").write_to_fp(bio)
        bio.seek(0)
        return base64.b64encode(bio.read()).decode("utf-8")
    except: return ""


# ---------------------- HELPERS ----------------------
def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return redirect("/login")
        return fn(*args, **kwargs)
    return wrapper

def current_user():
    uid = session.get("user_id")
    return db.session.get(User, uid) if uid else None


# ---------------------- ROUTES ----------------------
@app.route("/")
def home():
    if "user_id" in session:
        return redirect("/dashboard")
    return render_template("index.html")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")
    
    name = request.form.get("name")
    email = request.form.get("email").lower()
    password = request.form.get("password")
    
    from werkzeug.security import generate_password_hash
    if User.query.filter_by(email=email).first():
        flash("Email already exists", "error")
        return redirect("/signup")
    
    user = User(name=name, email=email, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return redirect("/dashboard")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    
    email = request.form.get("email").lower()
    password = request.form.get("password")
    user = User.query.filter_by(email=email).first()
    
    from werkzeug.security import check_password_hash
    if not user or not check_password_hash(user.password_hash, password):
        flash("Invalid login", "error")
        return redirect("/login")
    
    session["user_id"] = user.id
    return redirect("/dashboard")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/dashboard")
@login_required
def dashboard():
    bots = Bot.query.filter_by(owner_id=current_user().id).all()
    return render_template("dashboard.html", user=current_user(), bots=bots)


# --- UPDATE: Create Bot with Image Upload ---
@app.route("/create_bot", methods=["GET", "POST"])
@login_required
def create_bot():
    if request.method == "GET":
        # Ensure you have create_bot.html (the HTML you provided)
        return render_template("create_bot.html", user=current_user())

    name = request.form.get("bot_name")
    voice = request.form.get("bot_voice") # Changed from 'voice_type' to match your HTML name
    
    # Default Image
    image_path = "/static/default.png"

    # Handle File Upload
    if 'bot_image' in request.files:
        file = request.files['bot_image']
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to filename to prevent overwrites
            unique_filename = f"{int(datetime.utcnow().timestamp())}_{filename}"
            save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(save_path)
            
            # Store the path relative to web root
            image_path = f"/static/uploads/{unique_filename}"

    bot = Bot(name=name, voice_type=voice, image_url=image_path, owner_id=current_user().id)
    db.session.add(bot)
    db.session.commit()

    return redirect(f"/talking_avatar?bot_id={bot.id}")


@app.route("/talking_avatar")
@login_required
def talking_avatar():
    bot_id = request.args.get("bot_id")
    bot = db.session.get(Bot, bot_id)
    # Security check: ensure user owns this bot
    if not bot or bot.owner_id != current_user().id:
        return redirect("/dashboard")
        
    return render_template("talking_avatar.html", user=current_user(), bot=bot)


# ---------- AI Chat ENDPOINT ----------
@app.route("/ask", methods=["POST"])
def ask_ai():
    text = request.json.get("message", "")
    reply = None
    if GEMINI_OK and ai:
        try:
            reply = ai.ask(text)
        except:
            reply = None
    if not reply:
        reply = "AI key missing or error."
    return jsonify({ "reply": reply, "audio": tts_base64(reply) })

@app.route("/greet")
def greet():
    txt = "Hello! I am your hologram AI assistant."
    return jsonify({ "greeting": txt, "audio": tts_base64(txt) })

@app.route("/models/<path:path>")
def models(path):
    return send_from_directory("static/models", path)

# ---------------------- RUN ----------------------
if __name__ == "__main__":
    print("🚀 Server running at http://127.0.0.1:5000")
    with app.app_context():
        db.create_all()
    app.run(debug=True)