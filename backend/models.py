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
    last_update = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "stress_level": self.stress_level,
            "current_heart_rate": self.current_heart_rate,
            "current_hrv": self.current_hrv,
            "last_update": self.last_update.isoformat() if self.last_update else None,
        }


class WearableData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey("staff.id"), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    heart_rate = db.Column(db.Integer)
    hrv = db.Column(db.Integer)  # Heart Rate Variability
    steps = db.Column(
        db.Integer, default=0
    )  # Accumulated steps for a period might indicate fatigue

    staff = db.relationship("Staff", backref=db.backref("wearable_data", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "staff_id": self.staff_id,
            "timestamp": self.timestamp.isoformat(),
            "heart_rate": self.heart_rate,
            "hrv": self.hrv,
            "steps": self.steps,
        }
