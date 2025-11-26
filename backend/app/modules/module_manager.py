"""
Менеджер модулей для загрузки и управления плагинами
"""
import os
import importlib
import inspect
from typing import Dict, List, Type, Any
from .base_module import BaseModule

class ModuleManager:
    """Менеджер для загрузки и управления модулями"""
    
    def __init__(self, modules_directory: str = None):
        if modules_directory is None:
            # Получаем путь к директории modules
            current_dir = os.path.dirname(os.path.abspath(__file__))
            modules_directory = current_dir
        
        self.modules_directory = modules_directory
        self.loaded_modules: Dict[str, BaseModule] = {}
    
    def load_modules(self) -> List[str]:
        """Загружает все модули из директории"""
        loaded = []
        
        if not os.path.exists(self.modules_directory):
            return loaded
        
        # Получаем список файлов в директории modules
        for filename in os.listdir(self.modules_directory):
            if filename.endswith('.py') and filename != '__init__.py' and filename != 'base_module.py' and filename != 'module_manager.py':
                module_name = filename[:-3]  # Убираем .py
                try:
                    module = self.load_module(module_name)
                    if module:
                        loaded.append(module_name)
                except Exception as e:
                    print(f"Error loading module {module_name}: {e}")
        
        return loaded
    
    def load_module(self, module_name: str) -> BaseModule | None:
        """Загружает конкретный модуль"""
        try:
            # Импортируем модуль
            module_path = f"app.modules.{module_name}"
            module = importlib.import_module(module_path)
            
            # Ищем классы, наследующиеся от BaseModule
            for name, obj in inspect.getmembers(module):
                if (inspect.isclass(obj) and 
                    issubclass(obj, BaseModule) and 
                    obj != BaseModule):
                    # Создаем экземпляр модуля
                    instance = obj()
                    self.loaded_modules[module_name] = instance
                    
                    # Инициализируем модуль
                    context = {"module_manager": self}
                    instance.initialize(context)
                    
                    return instance
        except Exception as e:
            print(f"Error loading module {module_name}: {e}")
            return None
    
    def get_module(self, module_name: str) -> BaseModule | None:
        """Получает загруженный модуль по имени"""
        return self.loaded_modules.get(module_name)
    
    def get_all_modules(self) -> Dict[str, BaseModule]:
        """Возвращает все загруженные модули"""
        return self.loaded_modules.copy()
    
    def get_modules_by_type(self, module_type: Type[BaseModule]) -> List[BaseModule]:
        """Возвращает модули определенного типа"""
        return [
            module for module in self.loaded_modules.values()
            if isinstance(module, module_type)
        ]
    
    def unload_module(self, module_name: str) -> bool:
        """Выгружает модуль"""
        if module_name in self.loaded_modules:
            module = self.loaded_modules[module_name]
            module.cleanup()
            del self.loaded_modules[module_name]
            return True
        return False
    
    def reload_module(self, module_name: str) -> bool:
        """Перезагружает модуль"""
        self.unload_module(module_name)
        return self.load_module(module_name) is not None

