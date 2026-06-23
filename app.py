from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash
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

app = Flask(__name__)

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

login_manager.login_view = "login"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ==========================
# DATABASE CREATION
# ==========================

with app.app_context():
    db.create_all()


# ==========================
# HOME
# ==========================

@app.route("/")
def home():

    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    return redirect(url_for("login"))


# ==========================
# REGISTER
# ==========================

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]

        existing_user = User.query.filter(
            (User.username == username) |
            (User.email == email)
        ).first()

        if existing_user:
            flash("User already exists")
            return redirect(url_for("register"))

        user = User(
            username=username,
            email=email
        )

        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        flash("Registration successful")

        return redirect(url_for("login"))

    return render_template("register.html")


# ==========================
# LOGIN
# ==========================

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(
            email=email
        ).first()

        if user and user.check_password(password):

            login_user(user)

            return redirect(url_for("dashboard"))

        flash("Invalid credentials")

    return render_template("login.html")


# ==========================
# LOGOUT
# ==========================

@app.route("/logout")
@login_required
def logout():

    logout_user()

    return redirect(url_for("login"))


# ==========================
# DASHBOARD
# ==========================

@app.route("/dashboard")
@login_required
def dashboard():

    habits = Habit.query.filter_by(
        user_id=current_user.id
    ).all()

    total_habits = len(habits)

    completed_habits = len([
        habit for habit in habits
        if habit.completed_today
    ])

    completion_rate = 0

    if total_habits > 0:
        completion_rate = round(
            (completed_habits / total_habits) * 100
        )

    return render_template(
        "dashboard.html",
        habits=habits,
        total_habits=total_habits,
        completed_habits=completed_habits,
        completion_rate=completion_rate
    )


# ==========================
# ADD HABIT
# ==========================

@app.route("/add_habit", methods=["POST"])
@login_required
def add_habit():

    name = request.form["name"]

    category = request.form["category"]

    description = request.form["description"]

    habit = Habit(
        name=name,
        category=category,
        description=description,
        user_id=current_user.id
    )

    db.session.add(habit)

    db.session.commit()

    flash("Habit Added")

    return redirect(url_for("dashboard"))


# ==========================
# DELETE HABIT
# ==========================

@app.route("/delete_habit/<int:id>")
@login_required
def delete_habit(id):

    habit = Habit.query.get_or_404(id)

    if habit.user_id != current_user.id:
        return redirect(url_for("dashboard"))

    db.session.delete(habit)

    db.session.commit()

    flash("Habit Deleted")

    return redirect(url_for("dashboard"))


# ==========================
# COMPLETE HABIT
# ==========================

@app.route("/complete_habit/<int:id>")
@login_required
def complete_habit(id):

    habit = Habit.query.get_or_404(id)

    if habit.user_id != current_user.id:
        return redirect(url_for("dashboard"))

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

    flash("Habit Completed")

    return redirect(url_for("dashboard"))


# ==========================
# PROFILE
# ==========================

@app.route("/profile")
@login_required
def profile():

    habits = Habit.query.filter_by(
        user_id=current_user.id
    ).all()

    total_streak = sum(
        habit.streak for habit in habits
    )

    return render_template(
        "profile.html",
        total_streak=total_streak,
        habits=len(habits)
    )


# ==========================
# WEEKLY ANALYTICS
# ==========================

@app.route("/analytics")
@login_required
def analytics():

    today = date.today()

    week_ago = today - timedelta(days=6)

    logs = HabitLog.query.filter(
        HabitLog.date >= week_ago
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
    }


# ==========================
# RUN APP
# ==========================

if __name__ == "__main__":
    app.run(
        debug=True
    )