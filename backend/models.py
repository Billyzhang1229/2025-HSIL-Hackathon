from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Staff(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(80), nullable=False, default="Nurse")
    stress_level = db.Column(db.String(20), default="Normal")  # Normal, High, Critical
    current_heart_rate = db.Column(db.Integer, default=70)
    current_hrv = db.Column(db.Integer, default=50)  # Heart Rate Variability
    # New fields for MWI calculation
    sleep_hours_last_night = db.Column(db.Float, default=7.0, nullable=True)
    current_steadiness = db.Column(
        db.Float, default=0.85, nullable=True
    )  # Example: 0-1 scale
    current_sleep_index = db.Column(
        db.Float, default=7.0, nullable=True
    )  # Example: 0-10 scale
    mental_wellness_index = db.Column(
        db.Float, default=75.0, nullable=True
    )  # Example: 0-100 scale
    last_update = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "stress_level": self.stress_level,
            "current_heart_rate": self.current_heart_rate,
            "current_hrv": self.current_hrv,
            "sleep_hours_last_night": self.sleep_hours_last_night,
            "current_steadiness": self.current_steadiness,
            "current_sleep_index": self.current_sleep_index,
            "mental_wellness_index": self.mental_wellness_index,
            "last_update": self.last_update.isoformat() if self.last_update else None,
        }


class WearableData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey("staff.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    heart_rate = db.Column(db.Integer)
    hrv = db.Column(db.Integer)  # Heart Rate Variability
    # Add fields for historical tracking
    steadiness = db.Column(db.Float, nullable=True)
    sleep_index = db.Column(db.Float, nullable=True)
    mwi = db.Column(db.Float, nullable=True)
    steps = db.Column(db.Integer, default=0)

    staff = db.relationship("Staff", backref=db.backref("wearable_data", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "staff_id": self.staff_id,
            "timestamp": self.timestamp.isoformat(),
            "heart_rate": self.heart_rate,
            "hrv": self.hrv,
            "steadiness": self.steadiness,
            "sleep_index": self.sleep_index,
            "mwi": self.mwi,
            "steps": self.steps,
        }
