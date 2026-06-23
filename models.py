from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


# ======================
# USER MODEL
# ======================
class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    username = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    habits = db.relationship(
        "Habit",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(
            self.password_hash,
            password
        )

    def __repr__(self):
        return f"<User {self.username}>"



# ======================
# HABIT MODEL
# ======================
class Habit(db.Model):
    __tablename__ = "habits"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    category = db.Column(
        db.String(50),
        default="General"
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    streak = db.Column(
        db.Integer,
        default=0
    )

    completed_today = db.Column(
        db.Boolean,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    logs = db.relationship(
        "HabitLog",
        backref="habit",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Habit {self.name}>"



# ======================
# DAILY HABIT LOG
# ======================
class HabitLog(db.Model):
    __tablename__ = "habit_logs"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    date = db.Column(
        db.Date,
        default=datetime.utcnow().date
    )

    completed = db.Column(
        db.Boolean,
        default=False
    )

    habit_id = db.Column(
        db.Integer,
        db.ForeignKey("habits.id"),
        nullable=False
    )

    def __repr__(self):
        return f"<HabitLog {self.date}>"