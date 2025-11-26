import React, { useState } from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { createProject, type Project } from '../../services/api';

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onProjectChange: (project: Project) => void;
  onProjectCreated: () => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  currentProject,
  onProjectChange,
  onProjectCreated,
}) => {
  const [open, setOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setError('Введите название проекта');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await createProject({ name: newProjectName });
      onProjectChange(response.data);
      onProjectCreated();
      setOpen(false);
      setNewProjectName('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка при создании проекта';
      setError(errorMessage);
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Проект</InputLabel>
        <Select
          value={currentProject?.id || ''}
          label="Проект"
          onChange={(e) => {
            const project = projects.find((p) => p.id === e.target.value);
            if (project) onProjectChange(project);
          }}
        >
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        size="small"
      >
        Новый проект
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Создать новый проект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название проекта"
            fullWidth
            variant="standard"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateProject();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpen(false);
            setError(null);
            setNewProjectName('');
          }}>
            Отмена
          </Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained"
            disabled={loading || !newProjectName.trim()}
          >
            {loading ? 'Создание...' : 'Создать'}
          </Button>
        </DialogActions>
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default ProjectSelector;

