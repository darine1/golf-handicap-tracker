from sqlalchemy import Column, String, Integer, Float, Date, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid

class Course(Base):
    __tablename__ = "courses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    location = Column(String)
    course_rating = Column(Float, nullable=False)
    slope_rating = Column(Integer, nullable=False)
    par = Column(Integer, default=72)

class Round(Base):
    __tablename__ = "rounds"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"))
    played_at = Column(Date, nullable=False)
    gross_score = Column(Integer, nullable=False)
    notes = Column(Text)

class HoleScore(Base):
    __tablename__ = "hole_scores"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    round_id = Column(UUID(as_uuid=True), ForeignKey("rounds.id"))
    hole_number = Column(Integer, nullable=False)
    strokes = Column(Integer, nullable=False)
    par = Column(Integer, nullable=False)