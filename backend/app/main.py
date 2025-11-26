from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .api import projects, elements, connections, panel, export, modules
from .modules.module_manager import ModuleManager

app = FastAPI(title="Wiring Designer API", version="1.0.0")

# CORS middleware для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация БД
@app.on_event("startup")
async def startup_event():
    init_db()
    # Загрузка модулей при старте
    modules.module_manager.load_modules()

# Подключение роутеров
app.include_router(projects.router)
app.include_router(elements.router)
app.include_router(connections.router)
app.include_router(panel.router)
app.include_router(export.router)
app.include_router(modules.router)

@app.get("/")
def root():
    return {"message": "Wiring Designer API"}

