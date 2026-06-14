from datetime import datetime
from typing import Dict, Any

from ..database import SessionLocal
from ..models import Alert

THRESHOLDS = {
    "cpu": {"high": 85.0, "critical": 95.0},
    "memory": {"high": 80.0, "critical": 90.0},
    "disk": {"high": 80.0, "critical": 90.0},
    "swap": {"high": 70.0, "critical": 85.0},
}


def _severity(value: float, high: float, critical: float) -> str:
    if value >= critical:
        return "critical"
    if value >= high:
        return "high"
    return "medium"


class AlertService:
    @staticmethod
    def check_thresholds(metrics: Dict[str, Any]):
        db = SessionLocal()
        try:
            cpu = metrics["cpu"]["percent"]
            mem = metrics["memory"]["percent"]
            disk = metrics["disk"]["percent"]
            swap = metrics["memory"]["swap_percent"]

            checks = [
                ("cpu", cpu, THRESHOLDS["cpu"]["high"], THRESHOLDS["cpu"]["critical"], f"CPU usage at {cpu:.1f}%"),
                ("memory", mem, THRESHOLDS["memory"]["high"], THRESHOLDS["memory"]["critical"], f"Memory usage at {mem:.1f}%"),
                ("disk", disk, THRESHOLDS["disk"]["high"], THRESHOLDS["disk"]["critical"], f"Disk usage at {disk:.1f}%"),
                ("swap", swap, THRESHOLDS["swap"]["high"], THRESHOLDS["swap"]["critical"], f"Swap usage at {swap:.1f}%"),
            ]

            for alert_type, value, high, critical, message in checks:
                if value >= high:
                    sev = _severity(value, high, critical)
                    existing = db.query(Alert).filter(
                        Alert.alert_type == alert_type,
                        Alert.resolved == False,
                    ).first()
                    if not existing:
                        alert = Alert(
                            alert_type=alert_type,
                            severity=sev,
                            message=message,
                            value=value,
                            threshold=high,
                        )
                        db.add(alert)
                else:
                    # Auto-resolve open alerts for this type
                    open_alerts = db.query(Alert).filter(
                        Alert.alert_type == alert_type,
                        Alert.resolved == False,
                    ).all()
                    for a in open_alerts:
                        a.resolved = True
                        a.resolved_at = datetime.now()

            db.commit()
        except Exception as e:
            print(f"[AlertService] Error: {e}")
            db.rollback()
        finally:
            db.close()

    @staticmethod
    def get_active_alerts():
        db = SessionLocal()
        try:
            return db.query(Alert).filter(Alert.resolved == False).order_by(Alert.timestamp.desc()).all()
        finally:
            db.close()

    @staticmethod
    def get_all_alerts(limit: int = 100):
        db = SessionLocal()
        try:
            return db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()
        finally:
            db.close()

    @staticmethod
    def resolve_alert(alert_id: int):
        db = SessionLocal()
        try:
            alert = db.query(Alert).filter(Alert.id == alert_id).first()
            if alert:
                alert.resolved = True
                alert.resolved_at = datetime.now()
                db.commit()
            return alert
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
