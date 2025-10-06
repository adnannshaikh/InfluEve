from datetime import datetime
from typing import Optional, List, Dict

from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON  # store lists/dicts as real JSON columns


# ---------------------------
# Users
# ---------------------------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------
# Briefs (per-user ownership)
# ---------------------------
class Brief(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    brand: str
    keywords: List[str] = Field(sa_column=Column(JSON))
    kpi_weights: Dict[str, float] = Field(sa_column=Column(JSON))
    # Ownership (optional so old rows don't break; set on create)
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------
# Influencers (global for now)
# ---------------------------
class Influencer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    handle: str
    platform: str = "instagram"
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------
# Scores (tie influencer <-> brief)
# ---------------------------
class Score(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    influencer_id: int = Field(foreign_key="influencer.id", index=True)
    brief_id: int = Field(foreign_key="brief.id", index=True)
    authenticity: float
    relevance: float
    resonance: float
    expected_roas: float
    trust_index: float
    computed_at: datetime = Field(default_factory=datetime.utcnow)
