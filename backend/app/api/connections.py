from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models
from ..database import get_db

router = APIRouter(prefix="/api/connections", tags=["connections"])

@router.post("/", response_model=schemas.Connection)
def create_connection(connection: schemas.ConnectionCreate, db: Session = Depends(get_db)):
    # Проверка существования проекта
    project = db.query(models.Project).filter(models.Project.id == connection.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Проверка существования элементов
    from_element = db.query(models.Element).filter(models.Element.id == connection.from_element_id).first()
    to_element = db.query(models.Element).filter(models.Element.id == connection.to_element_id).first()
    
    if not from_element or not to_element:
        raise HTTPException(status_code=404, detail="Element not found")
    
    if from_element.project_id != connection.project_id or to_element.project_id != connection.project_id:
        raise HTTPException(status_code=400, detail="Elements must belong to the same project")
    
    db_connection = models.Connection(**connection.dict())
    db.add(db_connection)
    db.commit()
    db.refresh(db_connection)
    return db_connection

@router.get("/project/{project_id}", response_model=List[schemas.Connection])
def get_connections_by_project(project_id: int, db: Session = Depends(get_db)):
    connections = db.query(models.Connection).filter(models.Connection.project_id == project_id).all()
    return connections

@router.get("/{connection_id}", response_model=schemas.Connection)
def get_connection(connection_id: int, db: Session = Depends(get_db)):
    connection = db.query(models.Connection).filter(models.Connection.id == connection_id).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection

@router.put("/{connection_id}", response_model=schemas.Connection)
def update_connection(connection_id: int, connection_update: schemas.ConnectionUpdate, db: Session = Depends(get_db)):
    db_connection = db.query(models.Connection).filter(models.Connection.id == connection_id).first()
    if not db_connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    update_data = connection_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_connection, field, value)
    
    db.commit()
    db.refresh(db_connection)
    return db_connection

@router.delete("/{connection_id}")
def delete_connection(connection_id: int, db: Session = Depends(get_db)):
    db_connection = db.query(models.Connection).filter(models.Connection.id == connection_id).first()
    if not db_connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    db.delete(db_connection)
    db.commit()
    return {"message": "Connection deleted"}

