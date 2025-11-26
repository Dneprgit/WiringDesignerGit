from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from ..modules.module_manager import ModuleManager
from ..modules.base_module import BaseModule

router = APIRouter(prefix="/api/modules", tags=["modules"])

# Глобальный менеджер модулей
module_manager = ModuleManager()

@router.get("/", response_model=List[Dict[str, Any]])
def get_modules():
    """Получить список всех загруженных модулей"""
    modules = module_manager.get_all_modules()
    return [
        {
            "name": name,
            "info": module.get_info(),
            "enabled": module.enabled,
        }
        for name, module in modules.items()
    ]

@router.get("/{module_name}", response_model=Dict[str, Any])
def get_module(module_name: str):
    """Получить информацию о конкретном модуле"""
    module = module_manager.get_module(module_name)
    if not module:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Module not found")
    
    return {
        "name": module_name,
        "info": module.get_info(),
        "enabled": module.enabled,
    }

@router.post("/{module_name}/reload")
def reload_module(module_name: str):
    """Перезагрузить модуль"""
    success = module_manager.reload_module(module_name)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Module not found or failed to reload")
    
    return {"message": f"Module {module_name} reloaded successfully"}

@router.post("/{module_name}/enable")
def enable_module(module_name: str):
    """Включить модуль"""
    module = module_manager.get_module(module_name)
    if not module:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Module not found")
    
    module.enabled = True
    return {"message": f"Module {module_name} enabled"}

@router.post("/{module_name}/disable")
def disable_module(module_name: str):
    """Отключить модуль"""
    module = module_manager.get_module(module_name)
    if not module:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Module not found")
    
    module.enabled = False
    return {"message": f"Module {module_name} disabled"}

