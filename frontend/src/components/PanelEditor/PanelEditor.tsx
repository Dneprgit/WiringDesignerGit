import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { getPanelElements, createPanelElement, updatePanelElement, deletePanelElement, getElements } from '../../services/api';
import type { Project, PanelElement, Element } from '../../types/models';

interface PanelEditorProps {
  project: Project;
}

interface DraggablePanelElement extends PanelElement {
  element?: Element;
  isDragging?: boolean;
}

const PanelEditor: React.FC<PanelEditorProps> = ({ project }) => {
  const [panelElements, setPanelElements] = useState<DraggablePanelElement[]>([]);
  const [availableElements, setAvailableElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const [editingPanelElement, setEditingPanelElement] = useState<DraggablePanelElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 50, height: 50 });

  useEffect(() => {
    loadPanelElements();
    loadAvailableElements();
  }, [project.id]);

  const loadPanelElements = async () => {
    try {
      const response = await getPanelElements(project.id);
      const elements = response.data;
      
      // Загружаем информацию об элементах
      const elementsWithData = await Promise.all(
        elements.map(async (panelElem) => {
          try {
            const elemResponse = await getElements(project.id);
            const elem = elemResponse.data.find((e) => e.id === panelElem.element_id);
            return { ...panelElem, element: elem };
          } catch {
            return panelElem;
          }
        })
      );
      
      setPanelElements(elementsWithData);
    } catch (error) {
      console.error('Error loading panel elements:', error);
    }
  };

  const loadAvailableElements = async () => {
    try {
      const response = await getElements(project.id);
      setAvailableElements(response.data);
    } catch (error) {
      console.error('Error loading elements:', error);
    }
  };

  const handlePanelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setPosition({ x, y });
    setEditingPanelElement(null);
    setSelectedElement(null);
    setDialogOpen(true);
  };

  const handleElementClick = (panelElement: DraggablePanelElement) => {
    setEditingPanelElement(panelElement);
    setSelectedElement(panelElement.element_id);
    setPosition({ x: panelElement.position_x, y: panelElement.position_y });
    setSize({ width: panelElement.width, height: panelElement.height });
    setDialogOpen(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!selectedElement) return;
    
    try {
      if (editingPanelElement) {
        await updatePanelElement(editingPanelElement.id, {
          position_x: position.x,
          position_y: position.y,
          width: size.width,
          height: size.height,
        });
      } else {
        await createPanelElement({
          project_id: project.id,
          element_id: selectedElement,
          position_x: position.x,
          position_y: position.y,
          width: size.width,
          height: size.height,
        });
      }
      
      setDialogOpen(false);
      loadPanelElements();
    } catch (error) {
      console.error('Error saving panel element:', error);
    }
  };

  const handleDelete = async () => {
    if (!editingPanelElement) return;
    
    try {
      await deletePanelElement(editingPanelElement.id);
      setDialogOpen(false);
      loadPanelElements();
    } catch (error) {
      console.error('Error deleting panel element:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      <Paper sx={{ p: 2, width: 300 }}>
        <Typography variant="h6" gutterBottom>
          Элементы щита
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
          {panelElements.map((panelElem) => (
            <Paper
              key={panelElem.id}
              sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => handleElementClick(panelElem)}
            >
              <Typography variant="body2">
                {panelElem.element?.element_id || `Элемент ${panelElem.element_id}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {panelElem.element?.name || ''}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
      
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Paper
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            bgcolor: '#f5f5f5',
            border: '2px solid #ccc',
            cursor: 'crosshair',
          }}
          onClick={handlePanelClick}
        >
          {panelElements.map((panelElem) => (
            <Paper
              key={panelElem.id}
              sx={{
                position: 'absolute',
                left: panelElem.position_x,
                top: panelElem.position_y,
                width: panelElem.width,
                height: panelElem.height,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'move',
                border: '1px solid #000',
                '&:hover': { opacity: 0.8 },
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleElementClick(panelElem);
              }}
            >
              <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.7rem' }}>
                {panelElem.element?.element_id || panelElem.element_id}
              </Typography>
            </Paper>
          ))}
        </Paper>
      </Box>
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPanelElement ? 'Редактировать элемент щита' : 'Добавить элемент в щит'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Элемент</InputLabel>
            <Select
              value={selectedElement || ''}
              label="Элемент"
              onChange={(e) => setSelectedElement(e.target.value as number)}
              disabled={!!editingPanelElement}
            >
              {availableElements.map((elem) => (
                <MenuItem key={elem.id} value={elem.id}>
                  {elem.element_id} - {elem.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Позиция X"
              type="number"
              value={position.x}
              onChange={(e) => setPosition({ ...position, x: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Позиция Y"
              type="number"
              value={position.y}
              onChange={(e) => setPosition({ ...position, y: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Ширина"
              type="number"
              value={size.width}
              onChange={(e) => setSize({ ...size, width: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <TextField
              label="Высота"
              type="number"
              value={size.height}
              onChange={(e) => setSize({ ...size, height: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {editingPanelElement && (
            <Button onClick={handleDelete} color="error">
              Удалить
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateOrUpdate} variant="contained" disabled={!selectedElement}>
            {editingPanelElement ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PanelEditor;

