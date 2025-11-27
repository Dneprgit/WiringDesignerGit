from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = models.Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    # Преобразуем integer в boolean
    db_project.floor_plan_locked = bool(db_project.floor_plan_locked)
    db_project.elements_locked = bool(db_project.elements_locked)
    return db_project

@router.get("/", response_model=List[schemas.Project])
def get_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = db.query(models.Project).offset(skip).limit(limit).all()
    # Преобразуем integer в boolean
    for project in projects:
        project.floor_plan_locked = bool(project.floor_plan_locked)
        project.elements_locked = bool(project.elements_locked)
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Преобразуем integer в boolean
    project.floor_plan_locked = bool(project.floor_plan_locked)
    project.elements_locked = bool(project.elements_locked)
    return project

@router.put("/{project_id}", response_model=schemas.Project)
def update_project(project_id: int, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.dict(exclude_unset=True)
    # Конвертируем boolean в integer для SQLite
    if 'floor_plan_locked' in update_data:
        update_data['floor_plan_locked'] = 1 if update_data['floor_plan_locked'] else 0
    if 'elements_locked' in update_data:
        update_data['elements_locked'] = 1 if update_data['elements_locked'] else 0
    
    for field, value in update_data.items():
        setattr(db_project, field, value)
    
    db.commit()
    db.refresh(db_project)
    # Преобразуем integer в boolean
    db_project.floor_plan_locked = bool(db_project.floor_plan_locked)
    db_project.elements_locked = bool(db_project.elements_locked)
    return db_project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted"}

