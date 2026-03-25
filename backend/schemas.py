from pydantic import BaseModel
from datetime import date
from uuid import UUID

class CourseCreate(BaseModel):
    name: str
    location: str = None
    course_rating: float
    slope_rating: int
    par: int = 72
    hole_pars: list[int] = None
    external_id: str = None

class CourseOut(BaseModel):
    id: UUID
    name: str
    location: str = None
    course_rating: float
    slope_rating: int
    par: int
    hole_pars: list[int] = None
    external_id: str = None

    model_config = {"from_attributes": True}

class RoundCreate(BaseModel):
    course_id: UUID
    played_at: date
    gross_score: int
    notes: str = None

class RoundOut(BaseModel):
    id: UUID
    course_id: UUID
    played_at: date
    gross_score: int
    notes: str = None

    model_config = {"from attributes": True}

class HoleScoreCreate(BaseModel):
    hole_number: int
    strokes: int
    par: int

class RoundCreate(BaseModel):
    course_id: UUID
    played_at: date
    gross_score: int
    notes: str = None
    hole_scores: list[HoleScoreCreate] = None