from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, handicap

router = APIRouter()

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

@router.post("/rounds")
def add_round(round_in: schemas.RoundCreate, db: Session = Depends(get_db)):
    #Make sure the course exists
    course = db.query(models.Course).filter(
        models.Course.id == round_in.course_id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    #save the round
    db_round = models.Round(**round_in.model_dump())
    db.add(db_round)
    db.commit()
    db.refresh(db_round)

    # Recalculate handicap from all rounds
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