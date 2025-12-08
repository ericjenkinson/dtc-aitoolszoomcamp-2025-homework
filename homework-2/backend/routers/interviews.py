from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from database import get_session
from models import Interview

router = APIRouter(
    prefix="/interviews",
    tags=["interviews"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=Interview)
def create_interview(interview: Interview, session: Session = Depends(get_session)):
    session.add(interview)
    session.commit()
    session.refresh(interview)
    return interview

@router.get("/", response_model=List[Interview])
def read_interviews(offset: int = 0, limit: int = Query(default=100, le=100), session: Session = Depends(get_session)):
    interviews = session.exec(select(Interview).offset(offset).limit(limit)).all()
    return interviews

@router.get("/{interview_id}", response_model=Interview)
def read_interview(interview_id: int, session: Session = Depends(get_session)):
    interview = session.get(Interview, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@router.delete("/{interview_id}")
def delete_interview(interview_id: int, session: Session = Depends(get_session)):
    interview = session.get(Interview, interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    session.delete(interview)
    session.commit()
    return {"ok": True}
