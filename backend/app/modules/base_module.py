"""
Базовый класс для модулей системы проектирования проводки
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseModule(ABC):
    """Базовый класс для всех модулей"""
    
    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.enabled = True
    
    @abstractmethod
    def get_info(self) -> Dict[str, Any]:
        """Возвращает информацию о модуле"""
        pass
    
    @abstractmethod
    def initialize(self, context: Dict[str, Any]) -> bool:
        """Инициализация модуля с контекстом приложения"""
        pass
    
    def cleanup(self):
        """Очистка ресурсов при выгрузке модуля"""
        pass

class ElementModule(BaseModule):
    """Модуль для работы с элементами"""
    
    @abstractmethod
    def process_element(self, element_data: Dict[str, Any]) -> Dict[str, Any]:
        """Обработка элемента"""
        pass
    
    @abstractmethod
    def validate_element(self, element_data: Dict[str, Any]) -> bool:
        """Валидация элемента"""
        pass

class ConnectionModule(BaseModule):
    """Модуль для работы со связями"""
    
    @abstractmethod
    def calculate_cable_length(self, from_element: Dict[str, Any], to_element: Dict[str, Any]) -> float:
        """Расчет длины кабеля между элементами"""
        pass
    
    @abstractmethod
    def suggest_cable_section(self, power: float, distance: float) -> float:
        """Предложение сечения кабеля на основе мощности и расстояния"""
        pass

class ExportModule(BaseModule):
    """Модуль для экспорта данных"""
    
    @abstractmethod
    def export(self, project_data: Dict[str, Any], format: str) -> bytes:
        """Экспорт проекта в указанном формате"""
        pass
    
    @abstractmethod
    def get_supported_formats(self) -> List[str]:
        """Возвращает список поддерживаемых форматов"""
        pass

