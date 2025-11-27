import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import type { FloorPlanToolType } from './FloorPlanToolPalette';

interface FloorPlanElement {
  id: string;
  type: FloorPlanToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: string;
  data?: any;
}

interface FloorPlanLayerProps {
  svgData?: string;
  isDrawing: boolean;
  isLocked: boolean;
  selectedTool: FloorPlanToolType;
  onSvgChange: (svg: string) => void;
}

const FloorPlanLayer: React.FC<FloorPlanLayerProps> = ({
  svgData,
  isDrawing,
  isLocked,
  selectedTool,
  onSvgChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [elements, setElements] = useState<FloorPlanElement[]>([]);
  const [isDrawingElement, setIsDrawingElement] = useState(false);
  const [currentElement, setCurrentElement] = useState<Partial<FloorPlanElement> | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const { screenToFlowPosition, getViewport } = useReactFlow();

  // Обновляем viewport при изменениях
  useEffect(() => {
    const updateViewport = () => {
      setViewport(getViewport());
    };
    updateViewport();
    const interval = setInterval(updateViewport, 100);
    return () => clearInterval(interval);
  }, [getViewport]);

  useEffect(() => {
    if (svgData) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgData, 'image/svg+xml');
        const loadedElements: FloorPlanElement[] = [];
        
        // Парсим элементы с data-атрибутами
        const allElements = doc.querySelectorAll('[data-type]');
        allElements.forEach((el, index) => {
          const type = el.getAttribute('data-type') as FloorPlanToolType;
          const id = el.getAttribute('data-id') || `element-${index}`;
          
          if (el.tagName === 'rect') {
            const x = parseFloat(el.getAttribute('x') || '0');
            const y = parseFloat(el.getAttribute('y') || '0');
            const width = parseFloat(el.getAttribute('width') || '0');
            const height = parseFloat(el.getAttribute('height') || '0');
            
            loadedElements.push({
              id,
              type,
              x,
              y,
              width,
              height,
            });
          } else if (el.tagName === 'path') {
            const points = el.getAttribute('d') || '';
            
            loadedElements.push({
              id,
              type,
              x: 0,
              y: 0,
              points,
            });
          }
        });
        
        setElements(loadedElements);
      } catch (error) {
        console.error('Error parsing SVG data:', error);
        setElements([]);
      }
    } else {
      setElements([]);
    }
  }, [svgData]);

  const getPointFromEvent = useCallback(
    (event: React.MouseEvent<SVGSVGElement> | MouseEvent) => {
      if (!svgRef.current) return null;
      const point = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      return point;
    },
    [screenToFlowPosition]
  );

  const getResizeHandleAtPoint = useCallback((element: FloorPlanElement, point: { x: number; y: number }): string | null => {
    if (element.type === 'wall' || !element.width || !element.height) return null;
    
    const handleSize = 8 / viewport.zoom;
    const handles = [
      { name: 'nw', x: element.x, y: element.y },
      { name: 'ne', x: element.x + element.width, y: element.y },
      { name: 'sw', x: element.x, y: element.y + element.height },
      { name: 'se', x: element.x + element.width, y: element.y + element.height },
      { name: 'n', x: element.x + element.width / 2, y: element.y },
      { name: 's', x: element.x + element.width / 2, y: element.y + element.height },
      { name: 'w', x: element.x, y: element.y + element.height / 2 },
      { name: 'e', x: element.x + element.width, y: element.y + element.height / 2 },
    ];

    for (const handle of handles) {
      if (
        point.x >= handle.x - handleSize &&
        point.x <= handle.x + handleSize &&
        point.y >= handle.y - handleSize &&
        point.y <= handle.y + handleSize
      ) {
        return handle.name;
      }
    }
    return null;
  }, [viewport.zoom]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (isLocked || event.button !== 0) return;
      
      // Всегда останавливаем распространение события, чтобы ReactFlow его не перехватил
      event.preventDefault();
      event.stopPropagation();
      
      const point = getPointFromEvent(event);
      if (!point) return;

      // Если выбран инструмент рисования, сразу переходим к рисованию
      if (selectedTool && isDrawing) {
        setIsDrawingElement(true);
        setStartPoint(point);
        setSelectedElementId(null);
        
        if (selectedTool?.startsWith('room_') || selectedTool?.startsWith('furniture_')) {
          setCurrentElement({
            type: selectedTool,
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
          });
        } else if (selectedTool === 'wall') {
          setCurrentElement({
            type: selectedTool,
            x: point.x,
            y: point.y,
            points: `M ${point.x} ${point.y}`,
          });
        } else if (selectedTool === 'door' || selectedTool === 'window') {
          setCurrentElement({
            type: selectedTool,
            x: point.x,
            y: point.y,
            width: 0,
            height: 0,
          });
        }
        return;
      }

      // Проверяем, кликнули ли на элемент (проверяем в обратном порядке, чтобы выбрать верхний элемент)
      const clickedElement = elements.slice().reverse().find((el) => {
        if (el.type === 'wall') {
          // Для стен проверка сложнее, пока пропускаем
          return false;
        }
        if (!el.width || !el.height) return false;
        // Добавляем небольшой отступ для более легкого клика
        const padding = 2;
        return (
          point.x >= el.x - padding &&
          point.x <= el.x + el.width + padding &&
          point.y >= el.y - padding &&
          point.y <= el.y + el.height + padding
        );
      });

      if (clickedElement) {
        // Режим выбора/редактирования
        setSelectedElementId(clickedElement.id);
        
        // Проверяем, не кликнули ли на resize handle
        const handle = getResizeHandleAtPoint(clickedElement, point);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setStartPoint(point);
        } else {
          // Начинаем перетаскивание элемента
          setIsDragging(true);
          setDragOffset({
            x: point.x - clickedElement.x,
            y: point.y - clickedElement.y,
          });
        }
      } else {
        // Клик вне элемента - снимаем выделение
        setSelectedElementId(null);
      }
    },
    [isDrawing, isLocked, selectedTool, elements, getPointFromEvent, getResizeHandleAtPoint]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const point = getPointFromEvent(event);
      if (!point) return;

      if (isResizing && selectedElementId && startPoint) {
        // Режим изменения размера
        const element = elements.find((el) => el.id === selectedElementId);
        if (element && element.width && element.height && resizeHandle) {
          const newElements = elements.map((el) => {
            if (el.id === selectedElementId) {
              return resizeElement(el, resizeHandle, point);
            }
            return el;
          });
          setElements(newElements);
          setStartPoint(point);
        }
      } else if (isDragging && selectedElementId && dragOffset) {
        // Режим перетаскивания
        const newElements = elements.map((el) => {
          if (el.id === selectedElementId) {
            return {
              ...el,
              x: point.x - dragOffset.x,
              y: point.y - dragOffset.y,
            };
          }
          return el;
        });
        setElements(newElements);
      } else if (isDrawingElement && !isLocked && startPoint && currentElement) {
        // Режим рисования нового элемента
        if (currentElement.type === 'wall') {
          setCurrentElement({
            ...currentElement,
            points: `M ${startPoint.x} ${startPoint.y} L ${point.x} ${point.y}`,
          });
        } else {
          const width = point.x - startPoint.x;
          const height = point.y - startPoint.y;
          setCurrentElement({
            ...currentElement,
            width: Math.abs(width),
            height: Math.abs(height),
            x: width < 0 ? point.x : startPoint.x,
            y: height < 0 ? point.y : startPoint.y,
          });
        }
      }
    },
    [isResizing, isDragging, isDrawingElement, isLocked, selectedElementId, resizeHandle, dragOffset, startPoint, currentElement, elements, getPointFromEvent]
  );

  const resizeElement = (element: FloorPlanElement, handle: string, newPoint: { x: number; y: number }): FloorPlanElement => {
    if (!element.width || !element.height) return element;
    
    let x = element.x;
    let y = element.y;
    let width = element.width;
    let height = element.height;

    switch (handle) {
      case 'nw':
        width = width + (x - newPoint.x);
        height = height + (y - newPoint.y);
        x = Math.min(newPoint.x, element.x + element.width);
        y = Math.min(newPoint.y, element.y + element.height);
        break;
      case 'ne':
        width = newPoint.x - x;
        height = height + (y - newPoint.y);
        y = Math.min(newPoint.y, element.y + element.height);
        break;
      case 'sw':
        width = width + (x - newPoint.x);
        height = newPoint.y - y;
        x = Math.min(newPoint.x, element.x + element.width);
        break;
      case 'se':
        width = newPoint.x - x;
        height = newPoint.y - y;
        break;
      case 'n':
        height = height + (y - newPoint.y);
        y = Math.min(newPoint.y, element.y + element.height);
        break;
      case 's':
        height = newPoint.y - y;
        break;
      case 'w':
        width = width + (x - newPoint.x);
        x = Math.min(newPoint.x, element.x + element.width);
        break;
      case 'e':
        width = newPoint.x - x;
        break;
    }

    // Минимальный размер
    if (width < 10) {
      width = 10;
      if (handle.includes('w')) x = (element.x || 0) + (element.width || 0) - 10;
    }
    if (height < 10) {
      height = 10;
      if (handle.includes('n')) y = (element.y || 0) + (element.height || 0) - 10;
    }

    return { ...element, x, y, width, height };
  };

  const handleMouseUp = useCallback(() => {
    if (isResizing || isDragging) {
      // Сохраняем изменения при изменении размера или перемещении
      saveElementsToSVG(elements);
      setIsResizing(false);
      setIsDragging(false);
      setResizeHandle(null);
      setDragOffset(null);
      setStartPoint(null);
      return;
    }

    if (!isDrawingElement || isLocked || !currentElement || !currentElement.type) return;
    
    // Проверяем минимальный размер для прямоугольных элементов
    if (currentElement.type !== 'wall') {
      if (!currentElement.width || currentElement.width < 10 || !currentElement.height || currentElement.height < 10) {
        setIsDrawingElement(false);
        setCurrentElement(null);
        setStartPoint(null);
        return;
      }
    }
    
    const newElement: FloorPlanElement = {
      id: `element-${Date.now()}`,
      type: currentElement.type,
      x: currentElement.x || 0,
      y: currentElement.y || 0,
      width: currentElement.width,
      height: currentElement.height,
      points: currentElement.points,
    };
    
    const newElements = [...elements, newElement];
    setElements(newElements);
    setCurrentElement(null);
    setStartPoint(null);
    setSelectedElementId(newElement.id);
    
    // Сохраняем SVG
    saveElementsToSVG(newElements);
    setIsDrawingElement(false);
  }, [isResizing, isDragging, isDrawingElement, isLocked, currentElement, elements, onSvgChange]);

  const saveElementsToSVG = useCallback((elementsToSave: FloorPlanElement[]) => {
    const getRoomColor = (type: FloorPlanToolType): string => {
      const colors: Record<string, string> = {
        'room_kitchen': '#FFE082',
        'room_living': '#A5D6A7',
        'room_bedroom': '#CE93D8',
        'room_bedroom2': '#F48FB1',
        'room_bathroom': '#90CAF9',
        'room_corridor': '#E0E0E0',
      };
      return colors[type || ''] || '#FFFFFF';
    };

    const svgElements = elementsToSave.map((el) => {
      if (el.type?.startsWith('room_')) {
        return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${getRoomColor(el.type)}" stroke="#666" stroke-width="2" data-type="${el.type}" data-id="${el.id}" />`;
      } else if (el.type === 'wall') {
        return `<path d="${el.points}" fill="none" stroke="#333" stroke-width="3" data-type="${el.type}" data-id="${el.id}" />`;
      } else if (el.type === 'door') {
        return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height || 5}" fill="#8B4513" stroke="#654321" stroke-width="1" data-type="${el.type}" data-id="${el.id}" />`;
      } else if (el.type === 'window') {
        return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height || 5}" fill="#87CEEB" stroke="#4682B4" stroke-width="1" data-type="${el.type}" data-id="${el.id}" />`;
      } else if (el.type?.startsWith('furniture_')) {
        return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="#D3D3D3" stroke="#999" stroke-width="1" data-type="${el.type}" data-id="${el.id}" />`;
      }
      return '';
    }).filter(Boolean).join('');

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`;
    onSvgChange(svgContent);
  }, [onSvgChange]);

  // Обработка клавиши Delete для удаления выбранного элемента
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementId && !isLocked && !selectedTool) {
        event.preventDefault();
        const newElements = elements.filter((el) => el.id !== selectedElementId);
        setElements(newElements);
        setSelectedElementId(null);
        saveElementsToSVG(newElements);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, elements, isLocked, selectedTool, onSvgChange]);

  useEffect(() => {
    if (!isDrawingElement && !isDragging && !isResizing) return;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!svgRef.current) return;
      const point = getPointFromEvent(event);
      if (!point) return;

      if (isResizing && selectedElementId && startPoint && resizeHandle) {
        const element = elements.find((el) => el.id === selectedElementId);
        if (element && element.width && element.height) {
          const newElements = elements.map((el) => {
            if (el.id === selectedElementId) {
              return resizeElement(el, resizeHandle, point);
            }
            return el;
          });
          setElements(newElements);
          setStartPoint(point);
        }
      } else if (isDragging && selectedElementId && dragOffset) {
        const newElements = elements.map((el) => {
          if (el.id === selectedElementId) {
            return {
              ...el,
              x: point.x - dragOffset.x,
              y: point.y - dragOffset.y,
            };
          }
          return el;
        });
        setElements(newElements);
      } else if (isDrawingElement && startPoint && currentElement) {
        if (currentElement.type === 'wall') {
          setCurrentElement({
            ...currentElement,
            points: `M ${startPoint.x} ${startPoint.y} L ${point.x} ${point.y}`,
          });
        } else {
          const width = point.x - startPoint.x;
          const height = point.y - startPoint.y;
          setCurrentElement({
            ...currentElement,
            width: Math.abs(width),
            height: Math.abs(height),
            x: width < 0 ? point.x : startPoint.x,
            y: height < 0 ? point.y : startPoint.y,
          });
        }
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDrawingElement, isDragging, isResizing, selectedElementId, startPoint, currentElement, dragOffset, resizeHandle, elements, getPointFromEvent, handleMouseUp]);

  const renderResizeHandles = (element: FloorPlanElement) => {
    if (!element.width || !element.height || element.type === 'wall') return null;
    
    const handleSize = 8 / viewport.zoom;
    const handles = [
      { name: 'nw', x: element.x, y: element.y, cursor: 'nwse-resize' },
      { name: 'ne', x: element.x + element.width, y: element.y, cursor: 'nesw-resize' },
      { name: 'sw', x: element.x, y: element.y + element.height, cursor: 'nesw-resize' },
      { name: 'se', x: element.x + element.width, y: element.y + element.height, cursor: 'nwse-resize' },
      { name: 'n', x: element.x + element.width / 2, y: element.y, cursor: 'ns-resize' },
      { name: 's', x: element.x + element.width / 2, y: element.y + element.height, cursor: 'ns-resize' },
      { name: 'w', x: element.x, y: element.y + element.height / 2, cursor: 'ew-resize' },
      { name: 'e', x: element.x + element.width, y: element.y + element.height / 2, cursor: 'ew-resize' },
    ];

    return (
      <>
        {handles.map((handle) => (
          <rect
            key={handle.name}
            x={handle.x - handleSize / 2}
            y={handle.y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="#1976d2"
            stroke="#fff"
            strokeWidth="1"
            cursor={handle.cursor}
            pointerEvents="auto"
          />
        ))}
      </>
    );
  };

  return (
    <div
      className="react-flow__edges"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDrawing && !isLocked ? 'auto' : 'none',
        zIndex: (!isLocked && isDrawing) ? 100 : 1,
        overflow: 'visible',
      }}
    >
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: isDrawing && !isLocked && selectedTool ? 'crosshair' : 'default',
          overflow: 'visible',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {elements.map((el) => {
            const getRoomColor = (type: FloorPlanToolType): string => {
              const colors: Record<string, string> = {
                'room_kitchen': '#FFE082',
                'room_living': '#A5D6A7',
                'room_bedroom': '#CE93D8',
                'room_bedroom2': '#F48FB1',
                'room_bathroom': '#90CAF9',
                'room_corridor': '#E0E0E0',
              };
              return colors[type || ''] || '#FFFFFF';
            };

            const isSelected = el.id === selectedElementId && !selectedTool && !isLocked;
            const canEdit = !isLocked && !selectedTool;
            const canClick = !isLocked && isDrawing; // Можно кликать, когда слой плана активен

            if (el.type?.startsWith('room_')) {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill={getRoomColor(el.type)}
                    stroke={isSelected ? '#1976d2' : '#666'}
                    strokeWidth={isSelected ? '3' : '2'}
                    pointerEvents={canClick ? 'auto' : 'none'}
                    cursor={canClick ? (canEdit ? 'move' : 'pointer') : 'default'}
                    onClick={(e) => {
                      if (canClick && !selectedTool) {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                      }
                    }}
                  />
                  {isSelected && el.width && el.height && renderResizeHandles(el)}
                </g>
              );
            } else if (el.type === 'wall') {
              return (
                <g key={el.id}>
                  <path
                    d={el.points}
                    fill="none"
                    stroke={isSelected ? '#1976d2' : '#333'}
                    strokeWidth={isSelected ? '4' : '3'}
                    pointerEvents={canClick ? 'auto' : 'none'}
                    cursor={canEdit ? 'move' : 'default'}
                  />
                </g>
              );
            } else if (el.type === 'door') {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height || 5}
                    fill="#8B4513"
                    stroke={isSelected ? '#1976d2' : '#654321'}
                    strokeWidth={isSelected ? '2' : '1'}
                    pointerEvents={canClick ? 'auto' : 'none'}
                    cursor={canClick ? (canEdit ? 'move' : 'pointer') : 'default'}
                    onClick={(e) => {
                      if (canClick && !selectedTool) {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                      }
                    }}
                  />
                  {isSelected && el.width && el.height && renderResizeHandles(el)}
                </g>
              );
            } else if (el.type === 'window') {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height || 5}
                    fill="#87CEEB"
                    stroke={isSelected ? '#1976d2' : '#4682B4'}
                    strokeWidth={isSelected ? '2' : '1'}
                    pointerEvents={canClick ? 'auto' : 'none'}
                    cursor={canClick ? (canEdit ? 'move' : 'pointer') : 'default'}
                    onClick={(e) => {
                      if (canClick && !selectedTool) {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                      }
                    }}
                  />
                  {isSelected && el.width && el.height && renderResizeHandles(el)}
                </g>
              );
            } else if (el.type?.startsWith('furniture_')) {
              return (
                <g key={el.id}>
                  <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill="#D3D3D3"
                    stroke={isSelected ? '#1976d2' : '#999'}
                    strokeWidth={isSelected ? '2' : '1'}
                    pointerEvents={canClick ? 'auto' : 'none'}
                    cursor={canClick ? (canEdit ? 'move' : 'pointer') : 'default'}
                    onClick={(e) => {
                      if (canClick && !selectedTool) {
                        e.stopPropagation();
                        setSelectedElementId(el.id);
                      }
                    }}
                  />
                  {isSelected && el.width && el.height && renderResizeHandles(el)}
                </g>
              );
            }
            return null;
          })}
          
          {/* Текущий рисуемый элемент */}
          {currentElement && currentElement.type && (
            <>
              {currentElement.type === 'wall' && currentElement.points && (
                <path
                  d={currentElement.points}
                  fill="none"
                  stroke="#666"
                  strokeWidth="3"
                  strokeDasharray="5,5"
                  pointerEvents="none"
                />
              )}
              {currentElement.type !== 'wall' && currentElement.width && currentElement.height && (
                <rect
                  x={currentElement.x}
                  y={currentElement.y}
                  width={currentElement.width}
                  height={currentElement.height}
                  fill="rgba(0, 0, 0, 0.1)"
                  stroke="#666"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  pointerEvents="none"
                />
              )}
            </>
          )}
        </g>
      </svg>
    </div>
  );
};

export default FloorPlanLayer;

