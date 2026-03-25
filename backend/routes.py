from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from uuid import UUID
from typing import List
import models, schemas, handicap
import httpx
import os

router = APIRouter()

GOLF_API_KEY = os.getenv("GOLF_API_KEY")
GOLF_API_BASE = "https://api.golfcourseapi.com/v1"

# --- Golf API Routes ---

@router.get("/courses/search")
async def search_courses(q: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{GOLF_API_BASE}/search",
            params={"search_query": q},
            headers={"Authorization": f"Key {GOLF_API_KEY}"}
        )
    data = res.json()
    courses = data.get("courses", [])
    return [
        {
            "id": c["id"],
            "club_name": c["club_name"],
            "course_name": c["course_name"],
            "location": c.get("location", {})
        }
        for c in courses
    ]

@router.get("/courses/details/{external_id}")
async def get_course_details(external_id: int):
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{GOLF_API_BASE}/courses/{external_id}",
            headers={"Authorization": f"Key {GOLF_API_KEY}"}
        )
    data = res.json()
    course_data = data.get("course", data)
    tees_data = course_data.get("tees", {})
    tees = tees_data.get("male", [])
    if not tees:
        tees = tees_data.get("female", [])
    if not tees:
        return {"error": "No tee data found"}
    tee = next((t for t in tees if t["tee_name"].lower() == "white"), tees[0])
    holes = tee.get("holes", [])
    hole_pars = [h["par"] for h in holes]
    return {
        "external_id": course_data["id"],
        "club_name": course_data["club_name"],
        "course_name": course_data["course_name"],
        "location": course_data.get("location", {}),
        "tee_name": tee["tee_name"],
        "course_rating": tee["course_rating"],
        "slope_rating": tee["slope_rating"],
        "par_total": tee["par_total"],
        "hole_pars": hole_pars,
        "available_tees": [t["tee_name"] for t in tees]
    }

# --- Course Routes ---

@router.post("/courses", response_model=schemas.CourseOut)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    db_course = models.Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.get("/courses", response_model=list[schemas.CourseOut])
def get_courses(db: Session = Depends(get_db)):
    return db.query(models.Course).all()

# --- Round Routes ---
class HoleScoreIn(BaseModel):
    hole_number: int
    strokes: int
    par: int

@router.post("/rounds")
def add_round(round_in: schemas.RoundCreate, db: Session = Depends(get_db)):
    course = db.query(models.Course).filter(
        models.Course.id == round_in.course_id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db_round = models.Round(
        course_id=round_in.course_id,
        played_at=round_in.played_at,
        gross_score=round_in.gross_score,
        notes=round_in.notes
    )
    db.add(db_round)
    db.commit()
    db.refresh(db_round)

    if round_in.hole_scores:
        for hs in round_in.hole_scores:
            db_hole = models.HoleScore(
                round_id=db_round.id,
                hole_number=hs.hole_number,
                strokes=hs.strokes,
                par=hs.par
            )
            db.add(db_hole)
        db.commit()

    all_rounds = db.query(models.Round).all()
    differentials = []
    for r in all_rounds:
        c = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        diff = handicap.calculate_score_differential(
            r.gross_score, c.course_rating, c.slope_rating
        )
        differentials.append(diff)

    index = handicap.calculate_handicap_index(differentials)

    return {
        "round_saved": True,
        "score_differential": handicap.calculate_score_differential(
            round_in.gross_score, course.course_rating, course.slope_rating
        ),
        "handicap_index": index,
        "total_rounds": len(all_rounds),
        "rounds_until_handicap": max(0, 3 - len(all_rounds))
    }

@router.get("/rounds")
def get_rounds(db: Session = Depends(get_db)):
    all_rounds = db.query(models.Round).order_by(models.Round.played_at.desc()).all()
    result = []
    for r in all_rounds:
        c = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        diff = handicap.calculate_score_differential(
            r.gross_score, c.course_rating, c.slope_rating
        )
        result.append({
            "id": r.id,
            "course_name": c.name,
            "played_at": r.played_at,
            "gross_score": r.gross_score,
            "score_differential": diff,
            "notes": r.notes
        })
    return result

@router.get("/handicap")
def get_handicap(db: Session = Depends(get_db)):
    all_rounds = db.query(models.Round).all()
    if not all_rounds:
        return {"handicap_index": None, "message": "No rounds recorded yet"}
    
    differentials = []
    for r in all_rounds:
        c = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        diff = handicap.calculate_score_differential(
            r.gross_score, c.course_rating, c.slope_rating
        )
        differentials.append(diff)

    index = handicap.calculate_handicap_index(differentials)
    rounds_needed = max(0, 3 - len(all_rounds))

    return {
        "handicap_index": index,
        "total_rounds": len(all_rounds),
        "rounds_until_handicap": rounds_needed,
        "message": f"Need {rounds_needed} more rounds" if rounds_needed > 0 else "Handicap active"
    }

@router.delete("/rounds/{round_id}")
def delete_round(round_id: UUID, db: Session = Depends(get_db)):
    round = db.query(models.Round).filter(models.Round.id == round_id).first()
    if not round:
        raise HTTPException(status_code=404, detail="Round not found")
    db.delete(round)
    db.commit()
    return {"deleted": True}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    all_rounds = db.query(models.Round).all()
    if not all_rounds:
        return {"message": "No rounds yet"}
    
    # Gross score stats
    gross_scores = [r.gross_score for r in all_rounds]
    differentials = []
    course_counts = {}
    for r in all_rounds:
        c = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        diff = handicap.calculate_score_differential(
            r.gross_score, c.course_rating, c.course_rating
        )

        differentials.append(diff)
        course_name = c.name
        course_counts[course_name] = course_counts.get(course_name, 0) + 1

        best_round = db.query(models.Round).order_by(models.Round.gross_score.asc()).first()
        worst_round = db.query(models.Round).order_by(models.Round.gross_score.desc()).first()
        best_course = db.query(models.Course).filter(models.Course.id == best_round.course_id).first()
        worst_course = db.query(models.Course).filter(models.Course.id == worst_round.course_id).first()

        # Hole stats
        all_hole_scores = db.query(models.HoleScore).all()
        hole_stats = None

        if all_hole_scores:
            rounds_with_holes = len(set(hs.round_id for hs in all_hole_scores))
            eagles = sum(1 for hs in all_hole_scores if hs.strokes <= hs.par - 2)
            birdies = sum(1 for hs in all_hole_scores if hs.strokes == hs.par - 1)
            pars = sum(1 for hs in all_hole_scores if hs.strokes == hs.par)
            bogeys = sum(1 for hs in all_hole_scores if hs.strokes == hs.par + 1)
            doubles = sum(1 for hs in all_hole_scores if hs.strokes == hs.par + 2)
            triples_plus = sum(1 for hs in all_hole_scores if hs.strokes >= hs.par + 3)

            hole_stats = {
                "rounds_with_hole_data": rounds_with_holes,
                "avg_eagles_per_round": round(eagles / rounds_with_holes, 2),
                "avg_birdies_per_round": round(birdies / rounds_with_holes, 2),
                "avg_pars_per_round": round(pars / rounds_with_holes, 2),
                "avg_bogeys_per_round": round(bogeys / rounds_with_holes, 2),
                "avg_doubles_per_round": round(doubles / rounds_with_holes, 2),
                "avg_triples_plus_per_round": round(triples_plus / rounds_with_holes, 2),
            }

        return {
            "total_rounds": len(all_rounds),
            "scoring_average": round(sum(gross_scores) / len(gross_scores), 1),
            "best_round": {
                "score": best_round.gross_score,
                "course": best_course.name,
                "date": best_round.played_at
            },
            "worst_round": {
                "score": worst_round.gross_score,
                "course": worst_course.name,
                "date": worst_round.played_at
            },
            "avg_differential": round(sum(differentials) / len(differentials), 1),
            "rounds_per_course": course_counts,
            "hole_stats": hole_stats
        }