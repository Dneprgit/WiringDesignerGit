# Система проектирования проводки 220В

Веб-приложение для проектирования электропроводки 220В в квартире с графическим редактором плана, расстановкой элементов, управлением связями, компоновкой щита, базой данных и экспортом отчетов.

## Структура проекта

- `backend/` - FastAPI приложение с REST API
- `frontend/` - React + TypeScript веб-интерфейс

## Установка и запуск

### Backend

```bash
cd backend

# Создание виртуального окружения (если еще не создано)
python -m venv venv

# Активация виртуального окружения
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Запуск сервера
uvicorn app.main:app --reload
```

API будет доступен по адресу: http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Функциональность

- Создание и управление проектами
- Графический редактор плана квартиры
- Расстановка элементов (розетки, выключатели, лампы, оборудование)
- Создание связей между элементами с указанием параметров кабеля
- Компоновка элементов в щите
- Табличный вид с возможностью редактирования
- Экспорт в PDF и Excel
- Модульная система для подключения плагинов

## Технологии

- Backend: FastAPI, SQLAlchemy, SQLite
- Frontend: React, TypeScript, React Flow, Material-UI
- Экспорт: ReportLab (PDF), openpyxl (Excel)

## Модульная система

Система поддерживает модульную архитектуру. Модули должны наследоваться от базовых классов в `backend/app/modules/base_module.py`:

- `BaseModule` - базовый класс для всех модулей
- `ElementModule` - модули для работы с элементами
- `ConnectionModule` - модули для работы со связями
- `ExportModule` - модули для экспорта

Пример модуля находится в `backend/app/modules/example_module.py`.

