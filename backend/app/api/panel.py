from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/panel", tags=["panel"])

@router.post("/", response_model=schemas.PanelElement)
def create_panel_element(panel_element: schemas.PanelElementCreate, db: Session = Depends(get_db)):
    # Проверка существования проекта
    project = db.query(models.Project).filter(models.Project.id == panel_element.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Проверка существования элемента
    element = db.query(models.Element).filter(models.Element.id == panel_element.element_id).first()
    if not element:
        raise HTTPException(status_code=404, detail="Element not found")
    
    if element.project_id != panel_element.project_id:
        raise HTTPException(status_code=400, detail="Element must belong to the same project")
    
    db_panel_element = models.PanelElement(**panel_element.dict())
    db.add(db_panel_element)
    db.commit()
    db.refresh(db_panel_element)
    return db_panel_element

@router.get("/project/{project_id}", response_model=List[schemas.PanelElement])
def get_panel_elements_by_project(project_id: int, db: Session = Depends(get_db)):
    panel_elements = db.query(models.PanelElement).filter(models.PanelElement.project_id == project_id).all()
    return panel_elements

@router.get("/{panel_element_id}", response_model=schemas.PanelElement)
def get_panel_element(panel_element_id: int, db: Session = Depends(get_db)):
    panel_element = db.query(models.PanelElement).filter(models.PanelElement.id == panel_element_id).first()
    if not panel_element:
        raise HTTPException(status_code=404, detail="Panel element not found")
    return panel_element

@router.put("/{panel_element_id}", response_model=schemas.PanelElement)
def update_panel_element(panel_element_id: int, panel_element_update: schemas.PanelElementUpdate, db: Session = Depends(get_db)):
    db_panel_element = db.query(models.PanelElement).filter(models.PanelElement.id == panel_element_id).first()
    if not db_panel_element:
        raise HTTPException(status_code=404, detail="Panel element not found")
    
    update_data = panel_element_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_panel_element, field, value)
    
    db.commit()
    db.refresh(db_panel_element)
    return db_panel_element

@router.delete("/{panel_element_id}")
def delete_panel_element(panel_element_id: int, db: Session = Depends(get_db)):
    db_panel_element = db.query(models.PanelElement).filter(models.PanelElement.id == panel_element_id).first()
    if not db_panel_element:
        raise HTTPException(status_code=404, detail="Panel element not found")
    
    db.delete(db_panel_element)
    db.commit()
    return {"message": "Panel element deleted"}

