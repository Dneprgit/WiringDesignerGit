from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Project schemas
class ProjectBase(BaseModel):
    name: str
    scale: float = 1.0

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    scale: Optional[float] = None
    floor_plan_image: Optional[str] = None
    floor_plan_svg: Optional[str] = None
    floor_plan_locked: Optional[bool] = None

class Project(ProjectBase):
    id: int
    created_at: datetime
    floor_plan_image: Optional[str] = None
    floor_plan_svg: Optional[str] = None
    floor_plan_locked: bool = False
    
    class Config:
        from_attributes = True

# Element schemas
class ElementBase(BaseModel):
    element_id: str
    type: str
    name: str
    x: float
    y: float
    properties: Dict[str, Any] = {}

class ElementCreate(ElementBase):
    project_id: int

class ElementUpdate(BaseModel):
    element_id: Optional[str] = None
    name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    properties: Optional[Dict[str, Any]] = None

class Element(ElementBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Panel Element schemas
class PanelElementBase(BaseModel):
    element_id: int
    position_x: float
    position_y: float
    width: float
    height: float

class PanelElementCreate(PanelElementBase):
    project_id: int

class PanelElementUpdate(BaseModel):
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

class PanelElement(PanelElementBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Connection schemas
class ConnectionBase(BaseModel):
    from_element_id: int
    to_element_id: int
    cable_section: float
    wire_count: int
    length: Optional[float] = None

class ConnectionCreate(ConnectionBase):
    project_id: int

class ConnectionUpdate(BaseModel):
    cable_section: Optional[float] = None
    wire_count: Optional[int] = None
    length: Optional[float] = None

class Connection(ConnectionBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

