from flask import (
    Flask,
    request,
    redirect,
    url_for,
    flash,
    send_from_directory
)

from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user
)

from models import db, User, Habit, HabitLog

from datetime import datetime, date, timedelta

import os

# Resolve paths to compiled React SPA in frontend/dist
base_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(base_dir, "..", "frontend", "dist")

app = Flask(
    __name__,
    static_folder=static_dir,
    static_url_path=""
)

# ==========================
# CONFIGURATION
# ==========================

app.config["SECRET_KEY"] = "habit_tracker_secret_key"

app.config["SQLALCHEMY_DATABASE_URI"] = \
    "sqlite:///database.db"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# ==========================
# LOGIN MANAGER
# ==========================

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
    return {"error": "Unauthorized access. Please log in."}, 401

# ==========================
# DATABASE CREATION
# ==========================

with app.app_context():
    db.create_all()

# ==========================
# AUTHENTICATION API
# ==========================

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return {"error": "Missing required fields"}, 400

    existing_user = User.query.filter(
        (User.username == username) |
        (User.email == email)
    ).first()

    if existing_user:
        return {"error": "User already exists"}, 400

    user = User(
        username=username,
        email=email
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return {"message": "Registration successful"}, 201

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"error": "Missing email or password"}, 400

    user = User.query.filter_by(email=email).first()

    if user and user.check_password(password):
        login_user(user)
        return {
            "message": "Logged in successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }, 200

    return {"error": "Invalid credentials"}, 401

@app.route("/api/auth/logout", methods=["POST"])
@login_required
def api_logout():
    logout_user()
    return {"message": "Logged out successfully"}, 200

@app.route("/api/auth/status", methods=["GET"])
def api_status():
    if current_user.is_authenticated:
        return {
            "authenticated": True,
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email
            }
        }, 200
    return {"authenticated": False}, 200

# ==========================
# HABITS API
# ==========================

@app.route("/api/habits", methods=["GET"])
@login_required
def api_get_habits():
    habits = Habit.query.filter_by(user_id=current_user.id).all()
    today = date.today()
    
    # Auto-update completed_today dynamically based on presence of logs for today
    for habit in habits:
        log = HabitLog.query.filter_by(habit_id=habit.id, date=today).first()
        habit.completed_today = log is not None and log.completed
        
        # Check streak break: if no log yesterday AND no log today, reset streak to 0
        yesterday = today - timedelta(days=1)
        log_yesterday = HabitLog.query.filter_by(habit_id=habit.id, date=yesterday).first()
        if not log_yesterday and not habit.completed_today:
            habit.streak = 0
            
    db.session.commit()

    total_habits = len(habits)
    completed_habits = len([h for h in habits if h.completed_today])
    completion_rate = 0
    if total_habits > 0:
        completion_rate = round((completed_habits / total_habits) * 100)

    habits_list = []
    for habit in habits:
        habits_list.append({
            "id": habit.id,
            "name": habit.name,
            "category": habit.category,
            "description": habit.description,
            "streak": habit.streak,
            "completed_today": habit.completed_today
        })

    return {
        "habits": habits_list,
        "total_habits": total_habits,
        "completed_habits": completed_habits,
        "completion_rate": completion_rate
    }, 200

@app.route("/api/habits", methods=["POST"])
@login_required
def api_add_habit():
    data = request.get_json() or {}
    name = data.get("name")
    category = data.get("category", "General")
    description = data.get("description", "")

    if not name:
        return {"error": "Missing habit name"}, 400

    habit = Habit(
        name=name,
        category=category,
        description=description,
        user_id=current_user.id
    )

    db.session.add(habit)
    db.session.commit()

    return {
        "id": habit.id,
        "name": habit.name,
        "category": habit.category,
        "description": habit.description,
        "streak": habit.streak,
        "completed_today": habit.completed_today
    }, 201

@app.route("/api/habits/<int:id>/complete", methods=["POST"])
@login_required
def api_complete_habit(id):
    habit = Habit.query.get_or_404(id)

    if habit.user_id != current_user.id:
        return {"error": "Unauthorized access"}, 403

    today = date.today()
    existing_log = HabitLog.query.filter_by(
        habit_id=habit.id,
        date=today
    ).first()

    if not existing_log:
        log = HabitLog(
            date=today,
            completed=True,
            habit_id=habit.id
        )
        db.session.add(log)
        
        habit.completed_today = True
        habit.streak += 1
        db.session.commit()

    return {
        "message": "Habit completed",
        "habit": {
            "id": habit.id,
            "name": habit.name,
            "category": habit.category,
            "description": habit.description,
            "streak": habit.streak,
            "completed_today": habit.completed_today
        }
    }, 200

@app.route("/api/habits/<int:id>", methods=["DELETE"])
@login_required
def api_delete_habit(id):
    habit = Habit.query.get_or_404(id)

    if habit.user_id != current_user.id:
        return {"error": "Unauthorized access"}, 403

    # Clean up associated logs
    HabitLog.query.filter_by(habit_id=habit.id).delete()
    
    db.session.delete(habit)
    db.session.commit()

    return {"message": "Habit Deleted"}, 200

# ==========================
# PROFILE API
# ==========================

@app.route("/api/profile", methods=["GET"])
@login_required
def api_profile():
    habits = Habit.query.filter_by(user_id=current_user.id).all()
    total_streak = sum(habit.streak for habit in habits)

    return {
        "username": current_user.username,
        "total_streak": total_streak,
        "total_habits": len(habits)
    }, 200

# ==========================
# WEEKLY ANALYTICS
# ==========================

@app.route("/api/analytics", methods=["GET"])
@login_required
def api_analytics():
    today = date.today()
    week_ago = today - timedelta(days=6)

    # Filter logs belonging to the current user's habits
    user_habit_ids = [h.id for h in Habit.query.filter_by(user_id=current_user.id).all()]
    
    logs = HabitLog.query.filter(
        HabitLog.date >= week_ago,
        HabitLog.habit_id.in_(user_habit_ids) if user_habit_ids else False
    ).all()

    daily_counts = {}
    for i in range(7):
        day = week_ago + timedelta(days=i)
        daily_counts[str(day)] = 0

    for log in logs:
        if log.completed:
            daily_counts[str(log.date)] += 1

    labels = list(daily_counts.keys())
    values = list(daily_counts.values())

    return {
        "labels": labels,
        "values": values
    }, 200

# ==========================
# STATIC FILES catch-all
# ==========================

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    return app.send_static_file("index.html")

# ==========================
# RUN APP
# ==========================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    is_prod = "RENDER" in os.environ
    app.run(
        host="0.0.0.0",
        port=port,
        debug=not is_prod
    )