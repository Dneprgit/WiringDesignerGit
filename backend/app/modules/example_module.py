"""
Пример модуля для системы проектирования проводки
Этот модуль демонстрирует, как создавать собственные модули
"""
from typing import Dict, Any, List
from .base_module import BaseModule, ConnectionModule

class ExampleConnectionModule(ConnectionModule):
    """Пример модуля для работы со связями"""
    
    def __init__(self):
        super().__init__("Example Connection Module", "1.0.0")
    
    def get_info(self) -> Dict[str, Any]:
        """Возвращает информацию о модуле"""
        return {
            "name": self.name,
            "version": self.version,
            "description": "Пример модуля для расчета параметров кабелей",
            "author": "System",
        }
    
    def initialize(self, context: Dict[str, Any]) -> bool:
        """Инициализация модуля"""
        print(f"Module {self.name} initialized")
        return True
    
    def calculate_cable_length(self, from_element: Dict[str, Any], to_element: Dict[str, Any]) -> float:
        """Расчет длины кабеля между элементами"""
        # Простой расчет по координатам
        x1, y1 = from_element.get('x', 0), from_element.get('y', 0)
        x2, y2 = to_element.get('x', 0), to_element.get('y', 0)
        
        # Евклидово расстояние (в пикселях, нужно умножить на масштаб)
        distance = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
        
        # Предполагаем масштаб 1 пиксель = 0.01 метра
        scale = 0.01
        return distance * scale
    
    def suggest_cable_section(self, power: float, distance: float) -> float:
        """Предложение сечения кабеля на основе мощности и расстояния"""
        # Упрощенная логика выбора сечения
        # Для 220В, учитывая потери и запас
        if power <= 1000:  # до 1 кВт
            if distance <= 10:
                return 1.5
            elif distance <= 20:
                return 2.5
            else:
                return 4.0
        elif power <= 2000:  # до 2 кВт
            if distance <= 10:
                return 2.5
            elif distance <= 20:
                return 4.0
            else:
                return 6.0
        else:  # более 2 кВт
            if distance <= 10:
                return 4.0
            elif distance <= 20:
                return 6.0
            else:
                return 10.0

