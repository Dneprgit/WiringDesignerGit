import React, { useState, useEffect } from 'react';
import { Box, Container, Tabs, Tab, AppBar, Toolbar, Typography } from '@mui/material';
import { getProjects, type Project } from './services/api';
import FloorPlanEditor from './components/FloorPlanEditor/FloorPlanEditor';
import PanelEditor from './components/PanelEditor/PanelEditor';
import TablesView from './components/TablesView/TablesView';
import ProjectSelector from './components/ProjectSelector/ProjectSelector';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}
    >
      {value === index && <Box sx={{ p: 3, height: '100%' }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(response.data);
      if (response.data.length > 0 && !currentProject) {
        setCurrentProject(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Проектирование проводки 220В
          </Typography>
          <ProjectSelector
            projects={projects}
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
            onProjectCreated={loadProjects}
          />
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="main tabs">
          <Tab label="План квартиры" />
          <Tab label="Щит" />
          <Tab label="Таблицы" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {currentProject ? (
            <FloorPlanEditor project={currentProject} />
          ) : (
            <Typography>Выберите или создайте проект</Typography>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {currentProject ? (
            <PanelEditor project={currentProject} />
          ) : (
            <Typography>Выберите или создайте проект</Typography>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {currentProject ? (
            <TablesView project={currentProject} />
          ) : (
            <Typography>Выберите или создайте проект</Typography>
          )}
        </TabPanel>
      </Box>
    </Box>
  );
}

export default App;

