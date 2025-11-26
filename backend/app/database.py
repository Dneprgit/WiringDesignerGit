from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./wiring_designer.db")

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def migrate_db():
    """Миграция базы данных для добавления новых колонок"""
    inspector = inspect(engine)
    if 'projects' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('projects')]
        
        with engine.begin() as conn:
            # Добавляем floor_plan_svg, если его нет
            if 'floor_plan_svg' not in columns:
                try:
                    conn.execute(text('ALTER TABLE projects ADD COLUMN floor_plan_svg TEXT'))
                    print("Added floor_plan_svg column to projects table")
                except Exception as e:
                    print(f"Error adding floor_plan_svg column: {e}")
            
            # Добавляем floor_plan_locked, если его нет
            if 'floor_plan_locked' not in columns:
                try:
                    conn.execute(text('ALTER TABLE projects ADD COLUMN floor_plan_locked INTEGER DEFAULT 0'))
                    print("Added floor_plan_locked column to projects table")
                except Exception as e:
                    print(f"Error adding floor_plan_locked column: {e}")

def init_db():
    Base.metadata.create_all(bind=engine)
    # Выполняем миграции после создания таблиц
    migrate_db()

