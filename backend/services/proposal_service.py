import uuid
from datetime import datetime

# تخزين مؤقت بالذاكرة (MVP) - لاحقاً يتحول لـ Database
PROPOSALS: dict[str, dict] = {}


def create_proposal(data: dict) -> dict:
    proposal_id = str(uuid.uuid4())
    record = {
        "proposal_id": proposal_id,
        "status": "PENDING",  # PENDING / APPROVED / REJECTED / EXECUTED / FAILED
        "created_at": datetime.utcnow().isoformat(),
        **data,
    }
    PROPOSALS[proposal_id] = record
    return record


def get_proposal(proposal_id: str) -> dict | None:
    return PROPOSALS.get(proposal_id)


def list_proposals(user_id: str) -> list[dict]:
    return [p for p in PROPOSALS.values() if p.get("user_id") == user_id]


def update_status(proposal_id: str, status: str) -> dict | None:
    p = PROPOSALS.get(proposal_id)
    if not p:
        return None
    p["status"] = status
    p["updated_at"] = datetime.utcnow().isoformat()
    return p
