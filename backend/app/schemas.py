from pydantic import BaseModel, Field
from typing import List, Dict

class BriefIn(BaseModel):
    brand: str
    keywords: List[str] = Field(default_factory=list)
    kpi_weights: Dict[str, float] = Field(
        default_factory=lambda: {"authenticity":0.25, "relevance":0.25, "resonance":0.25, "return":0.25}
    )

class BriefOut(BriefIn):
    id: int

class InfluencerIn(BaseModel):
    handle: str
    platform: str = "instagram"

class InfluencerOut(InfluencerIn):
    id: int

class ScoreOut(BaseModel):
    influencer_id: int
    brief_id: int
    handle: str    
    authenticity: float
    relevance: float
    resonance: float
    expected_roas: float
    trust_index: float
    top_signals: list[str] = []
