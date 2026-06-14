from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert
from ..services.alert_service import AlertService

router = APIRouter()


@router.get("/")
async def get_alerts(
    limit: int = Query(100, le=500),
    resolved: bool = Query(None),
    db: Session = Depends(get_db),
):
    """List all alerts with optional resolved filter."""
    q = db.query(Alert)
    if resolved is not None:
        q = q.filter(Alert.resolved == resolved)
    rows = q.order_by(Alert.timestamp.desc()).limit(limit).all()
    return [_fmt(r) for r in rows]


@router.get("/active")
async def get_active_alerts():
    """List only unresolved alerts."""
    return [_fmt(a) for a in AlertService.get_active_alerts()]


@router.get("/history")
async def get_alert_history(limit: int = Query(200, le=1000)):
    return [_fmt(a) for a in AlertService.get_all_alerts(limit=limit)]


@router.put("/{alert_id}/resolve")
async def resolve_alert(alert_id: int):
    alert = AlertService.resolve_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _fmt(alert)


@router.get("/thresholds")
async def get_thresholds():
    from ..services.alert_service import THRESHOLDS
    return THRESHOLDS


@router.get("/stats")
async def alert_stats(db: Session = Depends(get_db)):
    total = db.query(Alert).count()
    active = db.query(Alert).filter(Alert.resolved == False).count()
    critical = db.query(Alert).filter(Alert.severity == "critical", Alert.resolved == False).count()
    high = db.query(Alert).filter(Alert.severity == "high", Alert.resolved == False).count()
    return {"total": total, "active": active, "critical": critical, "high": high}


def _fmt(a: Alert) -> dict:
    return {
        "id": a.id,
        "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        "alert_type": a.alert_type,
        "severity": a.severity,
        "message": a.message,
        "value": a.value,
        "threshold": a.threshold,
        "resolved": a.resolved,
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
    }
