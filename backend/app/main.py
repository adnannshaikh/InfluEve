# backend/main.py
import os, time, jwt, bcrypt
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlmodel import select, Session
from sqlalchemy import text

from .db import init_db, get_session
from .models import Brief, Influencer, Score, User  # <- User + Brief.owner_id must exist
from .schemas import BriefIn, BriefOut, InfluencerIn, InfluencerOut, ScoreOut
from .scoring import compute_scores

# --------------------------------------------------------------------------------------
# App & Config
# --------------------------------------------------------------------------------------
app = FastAPI(title="Influencer Eval MVP")
STARTED_AT = datetime.utcnow()
APP_VERSION = os.getenv("APP_VERSION", "0.0.1")
GIT_SHA = os.getenv("GIT_SHA", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# --------------------------------------------------------------------------------------
# Health / Ready
# --------------------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "influencer-eval-mvp",
        "version": APP_VERSION,
        "commit": GIT_SHA or None,
        "started_at": STARTED_AT.isoformat() + "Z",
        "uptime_seconds": (datetime.utcnow() - STARTED_AT).total_seconds(),
    }

@app.get("/ready")
def ready(session: Session = Depends(get_session)):
    try:
        session.exec(text("SELECT 1"))
        return {"ok": True, "db": "up", "version": APP_VERSION, "commit": GIT_SHA or None}
    except Exception as e:
        return {"ok": False, "db": f"down: {e.__class__.__name__}", "version": APP_VERSION}

# --------------------------------------------------------------------------------------
# JWT Auth (minimal)
# --------------------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGO = "HS256"
ACCESS_TTL = 60 * 60 * 24  # 24h

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def _verify_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())

def _create_token(user_id: int) -> str:
    payload = {"sub": str(user_id), "exp": int(time.time()) + ACCESS_TTL}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def get_current_user(session: Session = Depends(get_session), token: str = Depends(oauth2)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    u = session.get(User, uid)
    if not u:
        raise HTTPException(status_code=401, detail="User not found")
    return u

# --------------------------------------------------------------------------------------
# Auth Endpoints
# --------------------------------------------------------------------------------------
@app.post("/api/auth/signup")
def signup(email: str, password: str, session: Session = Depends(get_session)):
    exists = session.exec(select(User).where(User.email == email)).first()
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    u = User(email=email, hashed_password=_hash_pw(password))
    session.add(u)
    session.commit()
    session.refresh(u)
    return {"access_token": _create_token(u.id), "token_type": "bearer"}

@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    u = session.exec(select(User).where(User.email == form.username)).first()
    if not u or not _verify_pw(form.password, u.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    return {"access_token": _create_token(u.id), "token_type": "bearer"}

# --------------------------------------------------------------------------------------
# Briefs (scoped to current user)
# --------------------------------------------------------------------------------------
@app.post("/api/brief", response_model=BriefOut)
def save_brief(
    payload: BriefIn,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    brief = Brief(
        brand=payload.brand,
        keywords=payload.keywords,
        kpi_weights=payload.kpi_weights,
        owner_id=current_user.id,          # SCOPE: owner set
    )
    session.add(brief)
    session.commit()
    session.refresh(brief)
    return BriefOut(id=brief.id, **payload.model_dump())

@app.get("/api/brief", response_model=list[BriefOut])
def list_briefs(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    rows = session.exec(select(Brief).where(Brief.owner_id == current_user.id)).all()
    return [BriefOut(id=b.id, brand=b.brand, keywords=b.keywords, kpi_weights=b.kpi_weights) for b in rows]

@app.get("/api/brief/{brief_id}", response_model=BriefOut)
def get_brief(
    brief_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    b = session.get(Brief, brief_id)
    if not b or b.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Brief not found")
    return BriefOut(id=b.id, brand=b.brand, keywords=b.keywords, kpi_weights=b.kpi_weights)

# --------------------------------------------------------------------------------------
# Influencers (global list for now; optionally add owner_id later if needed)
# --------------------------------------------------------------------------------------
@app.post("/api/influencers", response_model=list[InfluencerOut])
def add_influencers(
    items: list[InfluencerIn],
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),  # require auth even if not owned
):
    created: list[InfluencerOut] = []
    for it in items:
        inf = Influencer(handle=it.handle, platform=it.platform)
        session.add(inf)
        session.flush()
        created.append(InfluencerOut(id=inf.id, handle=inf.handle, platform=inf.platform))
    session.commit()
    return created

@app.get("/api/influencers", response_model=list[InfluencerOut])
def list_influencers(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    rows = session.exec(select(Influencer)).all()
    return [InfluencerOut(id=r.id, handle=r.handle, platform=r.platform) for r in rows]

# --------------------------------------------------------------------------------------
# Reports (scoped by brief ownership)
# --------------------------------------------------------------------------------------
@app.get("/api/reports/{brief_id}", response_model=list[ScoreOut])
def compute_report(
    brief_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    brief = session.get(Brief, brief_id)
    if not brief or brief.owner_id != current_user.id:
        # You can also raise 404 to avoid leaking existence:
        # raise HTTPException(status_code=404, detail="Brief not found")
        return []

    influencers = session.exec(select(Influencer)).all()
    out: list[ScoreOut] = []

    for inf in influencers:
        a, r, s, roas, ti, sig = compute_scores(inf.handle, brief.kpi_weights)
        score = Score(
            influencer_id=inf.id,
            brief_id=brief_id,
            authenticity=a,
            relevance=r,
            resonance=s,
            expected_roas=roas,
            trust_index=ti,
        )
        session.add(score)
        out.append(
            ScoreOut(
                influencer_id=inf.id,
                brief_id=brief_id,
                handle=inf.handle,
                authenticity=a,
                relevance=r,
                resonance=s,
                expected_roas=roas,
                trust_index=ti,
                top_signals=sig,
            )
        )
    session.commit()
    return out
