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
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isPlanLocked, setIsPlanLocked] = useState(project.floor_plan_locked || false);
  const [floorPlanSvg, setFloorPlanSvg] = useState(project.floor_plan_svg || '');

  useEffect(() => {
    loadElements();
    loadConnections();
    setFloorPlanSvg(project.floor_plan_svg || '');
    setIsPlanLocked(project.floor_plan_locked || false);
  }, [project.id, project.floor_plan_svg, project.floor_plan_locked]);

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
    [project.id]
  );

  const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const connectionId = parseInt(edge.id);
    // Находим связь по ID
    getConnections(project.id).then((response) => {
      const connection = response.data.find((c) => c.id === connectionId);
      if (connection) {
        setEditingConnection(connection);
        setConnectionDialogOpen(true);
      }
    });
  }, [project.id]);

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
      // Не обрабатываем клики, если режим рисования активен или слой заблокирован
      if (isDrawingMode || isPlanLocked) return;
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
    [selectedElementType, isDrawingMode, isPlanLocked]
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
    const element = node.data.element as Element;
    setEditingElement(element);
    setElementId(element.element_id);
    setElementName(element.name);
    setElementDialogOpen(true);
  }, []);

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
    for (const node of deleted) {
      try {
        await deleteElement(parseInt(node.id));
      } catch (error) {
        console.error('Error deleting element:', error);
      }
    }
  }, []);

  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node) => {
    // Не позволяем перетаскивать элементы, если слой плана заблокирован
    if (isPlanLocked) return;
    
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
  }, [isPlanLocked]);

  const handleSvgChange = useCallback(async (svg: string) => {
    setFloorPlanSvg(svg);
    try {
      await updateProject(project.id, { floor_plan_svg: svg });
    } catch (error) {
      console.error('Error saving floor plan SVG:', error);
    }
  }, [project.id]);

  const handleToggleLock = useCallback(async () => {
    const newLockedState = !isPlanLocked;
    setIsPlanLocked(newLockedState);
    if (newLockedState) {
      setIsDrawingMode(false);
    }
    try {
      await updateProject(project.id, { floor_plan_locked: newLockedState });
    } catch (error) {
      console.error('Error updating lock state:', error);
    }
  }, [isPlanLocked, project.id]);

  const handleClearPlan = useCallback(async () => {
    if (isPlanLocked) return;
    const emptySvg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    setFloorPlanSvg(emptySvg);
    try {
      await updateProject(project.id, { floor_plan_svg: emptySvg });
    } catch (error) {
      console.error('Error clearing floor plan:', error);
    }
  }, [isPlanLocked, project.id]);

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      <ElementPalette onElementSelect={setSelectedElementType} />
      
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
          <Tooltip title={isDrawingMode ? 'Выйти из режима рисования' : 'Режим рисования плана'}>
            <ToggleButton
              value="draw"
              selected={isDrawingMode}
              onChange={() => {
                if (isPlanLocked) return;
                setIsDrawingMode(!isDrawingMode);
                setSelectedElementType(null);
              }}
              disabled={isPlanLocked}
              size="small"
            >
              <EditIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={isPlanLocked ? 'Разблокировать слой плана' : 'Заблокировать слой плана'}>
            <IconButton onClick={handleToggleLock} size="small" color={isPlanLocked ? 'primary' : 'default'}>
              {isPlanLocked ? <LockIcon /> : <LockOpenIcon />}
            </IconButton>
          </Tooltip>
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
        </Box>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodesDelete={onNodesDelete}
          onNodeDragStop={onNodeDragStop}
          onEdgeDoubleClick={onEdgeDoubleClick}
          nodeTypes={nodeTypes}
          nodesDraggable={!isPlanLocked}
          nodesConnectable={!isPlanLocked}
          elementsSelectable={!isPlanLocked}
          fitView
        >
          <Controls />
          <Background />
          <MiniMap />
          <FloorPlanLayer
            svgData={floorPlanSvg}
            isDrawing={isDrawingMode}
            isLocked={isPlanLocked}
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

