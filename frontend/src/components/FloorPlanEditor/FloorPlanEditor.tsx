import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Tooltip,
  ToggleButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ElementPalette from '../ElementPalette/ElementPalette';
import ConnectionEditor from '../ConnectionEditor/ConnectionEditor';
import { getElements, createElement, updateElement, deleteElement, getConnections, createConnection, updateConnection, updateProject } from '../../services/api';
import type { Project, Element, Connection as ConnectionType, ElementType } from '../../types/models';
import ElementNode from './ElementNode';
import FloorPlanLayer from './FloorPlanLayer';
import FloorPlanToolPalette, { FloorPlanToolType } from './FloorPlanToolPalette';

const nodeTypes: NodeTypes = {
  element: ElementNode,
};

interface FloorPlanEditorProps {
  project: Project;
}

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ project }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElementType, setSelectedElementType] = useState<ElementType | null>(null);
  const [editingElement, setEditingElement] = useState<Element | null>(null);
  const [elementDialogOpen, setElementDialogOpen] = useState(false);
  const [elementId, setElementId] = useState('');
  const [elementName, setElementName] = useState('');
  const [editingConnection, setEditingConnection] = useState<ConnectionType | null>(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'plan' | 'elements'>(project.active_layer || 'elements');
  const [isPlanLocked, setIsPlanLocked] = useState(project.floor_plan_locked || false);
  const [isElementsLocked, setIsElementsLocked] = useState(project.elements_locked || false);
  const [floorPlanSvg, setFloorPlanSvg] = useState(project.floor_plan_svg || '');
  const [selectedTool, setSelectedTool] = useState<FloorPlanToolType>(null);

  const isDrawingMode = activeLayer === 'plan';

  useEffect(() => {
    loadElements();
    loadConnections();
    setFloorPlanSvg(project.floor_plan_svg || '');
    setIsPlanLocked(project.floor_plan_locked || false);
    setIsElementsLocked(project.elements_locked || false);
    setActiveLayer(project.active_layer || 'elements');
  }, [project.id, project.floor_plan_svg, project.floor_plan_locked, project.elements_locked, project.active_layer]);

  const loadElements = async () => {
    try {
      const response = await getElements(project.id);
      const elements = response.data;
      
      const flowNodes: Node[] = elements.map((elem) => ({
        id: elem.id.toString(),
        type: 'element',
        position: { x: elem.x, y: elem.y },
        data: {
          label: elem.name,
          elementId: elem.element_id,
          type: elem.type,
          element: elem,
        },
      }));
      
      setNodes(flowNodes);
    } catch (error) {
      console.error('Error loading elements:', error);
    }
  };

  const loadConnections = async () => {
    try {
      const response = await getConnections(project.id);
      const connections = response.data;
      
      const flowEdges: Edge[] = connections.map((conn) => ({
        id: conn.id.toString(),
        source: conn.from_element_id.toString(),
        target: conn.to_element_id.toString(),
        label: `${conn.cable_section}мм², ${conn.wire_count} жил`,
        type: 'smoothstep',
      }));
      
      setEdges(flowEdges);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const onConnect = useCallback(
    async (params: Connection) => {
      // Не позволяем создавать связи, если активен слой плана или слой элементов заблокирован
      if (activeLayer !== 'elements' || isElementsLocked) return;
      if (!params.source || !params.target) return;
      
      try {
        const response = await createConnection({
          project_id: project.id,
          from_element_id: parseInt(params.source),
          to_element_id: parseInt(params.target),
          cable_section: 2.5,
          wire_count: 3,
        });
        setEdges((eds) => addEdge(params, eds));
        // Открываем диалог редактирования связи
        setEditingConnection(response.data);
        setConnectionDialogOpen(true);
        loadConnections();
      } catch (error) {
        console.error('Error creating connection:', error);
      }
    },
    [project.id, activeLayer, isElementsLocked]
  );

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    // Не позволяем редактировать связи, если активен слой плана или слой элементов заблокирован
    if (activeLayer !== 'elements' || isElementsLocked) return;
    
    const connectionId = parseInt(edge.id);
    // Находим связь по ID
    getConnections(project.id).then((response) => {
      const connection = response.data.find((c) => c.id === connectionId);
      if (connection) {
        setEditingConnection(connection);
        setConnectionDialogOpen(true);
      }
    });
  }, [project.id, activeLayer, isElementsLocked]);

  const handleConnectionSave = async (connectionData: Partial<ConnectionType>) => {
    if (!editingConnection) return;
    
    try {
      await updateConnection(editingConnection.id, connectionData);
      loadConnections();
    } catch (error) {
      console.error('Error updating connection:', error);
    }
  };

  const handlePaneClick = useCallback(
    async (event: React.MouseEvent) => {
      // Не обрабатываем клики, если активен слой плана или слой элементов заблокирован
      if (activeLayer !== 'elements' || isElementsLocked) return;
      if (!selectedElementType) return;
      
      const reactFlowBounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      setEditingElement(null);
      setElementId('');
      setElementName('');
      setElementDialogOpen(true);
      
      // Сохраняем позицию для создания элемента после диалога
      (window as any).pendingElementPosition = position;
      (window as any).pendingElementType = selectedElementType;
    },
    [selectedElementType, activeLayer, isElementsLocked]
  );

  const handleCreateElement = async () => {
    if (!elementId || !elementName) return;
    
    const position = (window as any).pendingElementPosition;
    const type = (window as any).pendingElementType;
    
    try {
      await createElement({
        project_id: project.id,
        element_id: elementId,
        type: type,
        name: elementName,
        x: position.x,
        y: position.y,
        properties: {},
      });
      
      setElementDialogOpen(false);
      setSelectedElementType(null);
      loadElements();
    } catch (error) {
      console.error('Error creating element:', error);
    }
  };

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Не позволяем редактировать элементы, если активен слой плана или слой элементов заблокирован
    if (activeLayer !== 'elements' || isElementsLocked) return;
    
    const element = node.data.element as Element;
    setEditingElement(element);
    setElementId(element.element_id);
    setElementName(element.name);
    setElementDialogOpen(true);
  }, [activeLayer, isElementsLocked]);

  const handleUpdateElement = async () => {
    if (!editingElement || !elementId || !elementName) return;
    
    try {
      await updateElement(editingElement.id, {
        element_id: elementId,
        name: elementName,
      });
      
      setElementDialogOpen(false);
      loadElements();
    } catch (error) {
      console.error('Error updating element:', error);
    }
  };

  const onNodesDelete = useCallback(async (deleted: Node[]) => {
    // Не позволяем удалять элементы, если активен слой плана или слой элементов заблокирован
    if (activeLayer !== 'elements' || isElementsLocked) return;
    
    for (const node of deleted) {
      try {
        await deleteElement(parseInt(node.id));
      } catch (error) {
        console.error('Error deleting element:', error);
      }
    }
  }, [activeLayer, isElementsLocked]);

  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node) => {
    // Не позволяем перетаскивать элементы, если активен слой плана или слой элементов заблокирован
    if (activeLayer !== 'elements' || isElementsLocked) return;
    
    const element = node.data.element as Element;
    if (element) {
      try {
        await updateElement(element.id, {
          x: node.position.x,
          y: node.position.y,
        });
      } catch (error) {
        console.error('Error updating element position:', error);
      }
    }
  }, [activeLayer, isElementsLocked]);

  const handleSvgChange = useCallback(async (svg: string) => {
    setFloorPlanSvg(svg);
    try {
      await updateProject(project.id, { floor_plan_svg: svg });
    } catch (error) {
      console.error('Error saving floor plan SVG:', error);
    }
  }, [project.id]);

  const handleToggleLock = useCallback(async () => {
    // Блокируем только активный слой
    if (activeLayer === 'plan') {
      const newLockedState = !isPlanLocked;
      setIsPlanLocked(newLockedState);
      if (newLockedState) {
        setSelectedTool(null);
      }
      try {
        await updateProject(project.id, { floor_plan_locked: newLockedState });
      } catch (error) {
        console.error('Error updating plan lock state:', error);
      }
    } else {
      const newLockedState = !isElementsLocked;
      setIsElementsLocked(newLockedState);
      if (newLockedState) {
        setSelectedElementType(null);
      }
      try {
        await updateProject(project.id, { elements_locked: newLockedState });
      } catch (error) {
        console.error('Error updating elements lock state:', error);
      }
    }
  }, [activeLayer, isPlanLocked, isElementsLocked, project.id]);

  const handleLayerSwitch = useCallback(async () => {
    const newLayer: 'plan' | 'elements' = activeLayer === 'plan' ? 'elements' : 'plan';
    setActiveLayer(newLayer);
    setSelectedElementType(null);
    setSelectedTool(null);
    
    try {
      await updateProject(project.id, { active_layer: newLayer });
    } catch (error) {
      console.error('Error updating active layer:', error);
    }
  }, [activeLayer, project.id]);

  const handleClearPlan = useCallback(async () => {
    if (activeLayer !== 'plan' || isPlanLocked) return;
    const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    setFloorPlanSvg(emptySvg);
    try {
      await updateProject(project.id, { floor_plan_svg: emptySvg });
    } catch (error) {
      console.error('Error clearing floor plan:', error);
    }
  }, [activeLayer, isPlanLocked, project.id]);

  const isCurrentLayerLocked = activeLayer === 'plan' ? isPlanLocked : isElementsLocked;

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {!isDrawingMode && <ElementPalette onElementSelect={setSelectedElementType} />}
      {isDrawingMode && (
        <FloorPlanToolPalette
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
        />
      )}
      
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            display: 'flex',
            gap: 1,
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: 1,
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Tooltip title={isDrawingMode ? 'Переключить на слой элементов' : 'Переключить на слой плана'}>
            <ToggleButton
              value="draw"
              selected={isDrawingMode}
              onChange={handleLayerSwitch}
              size="small"
            >
              <EditIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={isCurrentLayerLocked 
            ? `Разблокировать слой ${activeLayer === 'plan' ? 'плана' : 'элементов'}`
            : `Заблокировать слой ${activeLayer === 'plan' ? 'плана' : 'элементов'}`}>
            <IconButton onClick={handleToggleLock} size="small" color={isCurrentLayerLocked ? 'primary' : 'default'}>
              {isCurrentLayerLocked ? <LockIcon /> : <LockOpenIcon />}
            </IconButton>
          </Tooltip>
          {activeLayer === 'plan' && (
            <Tooltip title="Очистить план">
              <IconButton 
                onClick={handleClearPlan} 
                size="small" 
                disabled={isPlanLocked}
                color="error"
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={activeLayer === 'elements' ? onNodesChange : undefined}
          onEdgesChange={activeLayer === 'elements' ? onEdgesChange : undefined}
          onConnect={activeLayer === 'elements' ? onConnect : undefined}
          onPaneClick={activeLayer === 'elements' ? handlePaneClick : undefined}
          onNodeDoubleClick={activeLayer === 'elements' ? onNodeDoubleClick : undefined}
          onNodesDelete={activeLayer === 'elements' ? onNodesDelete : undefined}
          onNodeDragStop={activeLayer === 'elements' ? onNodeDragStop : undefined}
          onEdgeDoubleClick={activeLayer === 'elements' ? onEdgeDoubleClick : undefined}
          nodeTypes={nodeTypes}
          nodesDraggable={activeLayer === 'elements' && !isElementsLocked}
          nodesConnectable={activeLayer === 'elements' && !isElementsLocked}
          elementsSelectable={activeLayer === 'elements' && !isElementsLocked}
          fitView
          style={{
            pointerEvents: activeLayer === 'plan' ? 'none' : 'auto',
          }}
          panOnDrag={activeLayer === 'elements'}
          zoomOnScroll={activeLayer === 'elements'}
          zoomOnPinch={activeLayer === 'elements'}
          preventScrolling={activeLayer === 'elements'}
        >
          <Controls />
          <Background />
          <MiniMap />
          <FloorPlanLayer
            svgData={floorPlanSvg}
            isDrawing={activeLayer === 'plan'}
            isLocked={isPlanLocked}
            selectedTool={selectedTool}
            onSvgChange={handleSvgChange}
          />
        </ReactFlow>
      </Box>
      
      <Dialog open={elementDialogOpen} onClose={() => setElementDialogOpen(false)}>
        <DialogTitle>
          {editingElement ? 'Редактировать элемент' : 'Создать элемент'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="ID элемента"
            fullWidth
            variant="standard"
            value={elementId}
            onChange={(e) => setElementId(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Название"
            fullWidth
            variant="standard"
            value={elementName}
            onChange={(e) => setElementName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setElementDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={editingElement ? handleUpdateElement : handleCreateElement}
            variant="contained"
          >
            {editingElement ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <ConnectionEditor
        connection={editingConnection}
        open={connectionDialogOpen}
        onClose={() => {
          setConnectionDialogOpen(false);
          setEditingConnection(null);
        }}
        onSave={handleConnectionSave}
      />
    </Box>
  );
};

export default FloorPlanEditor;

