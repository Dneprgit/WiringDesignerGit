from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    scale = Column(Float, default=1.0)
    floor_plan_image = Column(Text, nullable=True)  # Base64 или путь к изображению
    floor_plan_svg = Column(Text, nullable=True)  # SVG данные плана квартиры
    floor_plan_locked = Column(Integer, default=0)  # Флаг блокировки слоя плана (0 - разблокирован, 1 - заблокирован)
    elements_locked = Column(Integer, default=0)  # Флаг блокировки слоя электроэлементов (0 - разблокирован, 1 - заблокирован)
    active_layer = Column(String, default='elements')  # Активный слой: 'plan' или 'elements'
    
    elements = relationship("Element", back_populates="project", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="project", cascade="all, delete-orphan")
    panel_elements = relationship("PanelElement", back_populates="project", cascade="all, delete-orphan")

class Element(Base):
    __tablename__ = "elements"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    element_id = Column(String, nullable=False)  # Пользовательский ID
    type = Column(String, nullable=False)  # socket, switch, lamp, equipment, panel
    name = Column(String, nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    properties = Column(JSON, default={})  # Дополнительные свойства
    
    project = relationship("Project", back_populates="elements")
    connections_from = relationship("Connection", foreign_keys="Connection.from_element_id", back_populates="from_element")
    connections_to = relationship("Connection", foreign_keys="Connection.to_element_id", back_populates="to_element")
    panel_element = relationship("PanelElement", back_populates="element", uselist=False)

class PanelElement(Base):
    __tablename__ = "panel_elements"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    element_id = Column(Integer, ForeignKey("elements.id"), nullable=False)
    position_x = Column(Float, nullable=False)
    position_y = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    
    project = relationship("Project", back_populates="panel_elements")
    element = relationship("Element", back_populates="panel_element")

class Connection(Base):
    __tablename__ = "connections"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    from_element_id = Column(Integer, ForeignKey("elements.id"), nullable=False)
    to_element_id = Column(Integer, ForeignKey("elements.id"), nullable=False)
    cable_section = Column(Float, nullable=False)  # Сечение кабеля в мм²
    wire_count = Column(Integer, nullable=False)  # Количество жил
    length = Column(Float, nullable=True)  # Длина кабеля в метрах
    
    project = relationship("Project", back_populates="connections")
    from_element = relationship("Element", foreign_keys=[from_element_id], back_populates="connections_from")
    to_element = relationship("Element", foreign_keys=[to_element_id], back_populates="connections_to")

