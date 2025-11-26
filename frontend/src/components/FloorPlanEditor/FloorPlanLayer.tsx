import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useReactFlow } from 'reactflow';

interface FloorPlanLayerProps {
  svgData?: string;
  isDrawing: boolean;
  isLocked: boolean;
  onSvgChange: (svg: string) => void;
}

const FloorPlanLayer: React.FC<FloorPlanLayerProps> = ({
  svgData,
  isDrawing,
  isLocked,
  onSvgChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [paths, setPaths] = useState<string[]>([]);
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
        const pathElements = doc.querySelectorAll('path');
        const loadedPaths = Array.from(pathElements)
          .map((p) => p.getAttribute('d') || '')
          .filter((p) => p);
        setPaths(loadedPaths);
      } catch (error) {
        console.error('Error parsing SVG data:', error);
        setPaths([]);
      }
    } else {
      setPaths([]);
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

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing || isLocked || event.button !== 0) return;
      event.preventDefault();
      const point = getPointFromEvent(event);
      if (point) {
        setIsDrawingPath(true);
        setCurrentPath(`M ${point.x} ${point.y}`);
      }
    },
    [isDrawing, isLocked, getPointFromEvent]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawingPath || isLocked) return;
      const point = getPointFromEvent(event);
      if (point) {
        setCurrentPath((prev) => `${prev} L ${point.x} ${point.y}`);
      }
    },
    [isDrawingPath, isLocked, getPointFromEvent]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawingPath || isLocked) return;
    if (currentPath) {
      const newPaths = [...paths, currentPath];
      setPaths(newPaths);
      setCurrentPath('');
      
      // Сохраняем SVG
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg">${newPaths
        .map((path) => `<path d="${path}" fill="none" stroke="#666" stroke-width="2" />`)
        .join('')}</svg>`;
      onSvgChange(svgContent);
    }
    setIsDrawingPath(false);
  }, [isDrawingPath, isLocked, currentPath, paths, onSvgChange]);

  useEffect(() => {
    if (!isDrawingPath) return;

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!svgRef.current) return;
      const point = getPointFromEvent(event);
      if (point) {
        setCurrentPath((prev) => {
          if (!prev) return `M ${point.x} ${point.y}`;
          return `${prev} L ${point.x} ${point.y}`;
        });
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
  }, [isDrawingPath, getPointFromEvent, handleMouseUp]);


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
        zIndex: 1,
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
          cursor: isDrawing && !isLocked ? 'crosshair' : 'default',
          overflow: 'visible',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {paths.map((path, index) => (
            <path
              key={index}
              d={path}
              fill="none"
              stroke="#666"
              strokeWidth="2"
              pointerEvents="none"
            />
          ))}
          {currentPath && (
            <path
              d={currentPath}
              fill="none"
              stroke="#666"
              strokeWidth="2"
              pointerEvents="none"
            />
          )}
        </g>
      </svg>
    </div>
  );
};

export default FloorPlanLayer;

