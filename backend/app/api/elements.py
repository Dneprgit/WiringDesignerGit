from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/elements", tags=["elements"])

@router.post("/", response_model=schemas.Element)
def create_element(element: schemas.ElementCreate, db: Session = Depends(get_db)):
    # Проверка существования проекта
    project = db.query(models.Project).filter(models.Project.id == element.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_element = models.Element(**element.dict())
    db.add(db_element)
    db.commit()
    db.refresh(db_element)
    return db_element

@router.get("/project/{project_id}", response_model=List[schemas.Element])
def get_elements_by_project(project_id: int, db: Session = Depends(get_db)):
    elements = db.query(models.Element).filter(models.Element.project_id == project_id).all()
    return elements

@router.get("/{element_id}", response_model=schemas.Element)
def get_element(element_id: int, db: Session = Depends(get_db)):
    element = db.query(models.Element).filter(models.Element.id == element_id).first()
    if not element:
        raise HTTPException(status_code=404, detail="Element not found")
    return element

@router.put("/{element_id}", response_model=schemas.Element)
def update_element(element_id: int, element_update: schemas.ElementUpdate, db: Session = Depends(get_db)):
    db_element = db.query(models.Element).filter(models.Element.id == element_id).first()
    if not db_element:
        raise HTTPException(status_code=404, detail="Element not found")
    
    update_data = element_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_element, field, value)
    
    db.commit()
    db.refresh(db_element)
    return db_element

@router.delete("/{element_id}")
def delete_element(element_id: int, db: Session = Depends(get_db)):
    db_element = db.query(models.Element).filter(models.Element.id == element_id).first()
    if not db_element:
        raise HTTPException(status_code=404, detail="Element not found")
    
    db.delete(db_element)
    db.commit()
    return {"message": "Element deleted"}

