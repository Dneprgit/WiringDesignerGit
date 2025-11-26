import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useTable } from 'react-table';
import {
  getElements,
  getConnections,
  getPanelElements,
  updateElement,
  updateConnection,
  updatePanelElement,
  exportPDF,
  exportExcel,
} from '../../services/api';
import type { Element, Connection, PanelElement } from '../../types/models';
import type { Project } from '../../types/models';
import EditableTable from './EditableTable';

interface TablesViewProps {
  project: Project;
}

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
      id={`table-tabpanel-${index}`}
      aria-labelledby={`table-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const TablesView: React.FC<TablesViewProps> = ({ project }) => {
  const [tabValue, setTabValue] = useState(0);
  const [elements, setElements] = useState<Element[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [panelElements, setPanelElements] = useState<PanelElement[]>([]);

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      const [elementsRes, connectionsRes, panelRes] = await Promise.all([
        getElements(project.id),
        getConnections(project.id),
        getPanelElements(project.id),
      ]);
      
      setElements(elementsRes.data);
      setConnections(connectionsRes.data);
      setPanelElements(panelRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await exportPDF(project.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${project.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await exportExcel(project.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_${project.id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const elementsColumns = [
    { Header: 'ID', accessor: 'element_id' },
    { Header: 'Тип', accessor: 'type' },
    { Header: 'Название', accessor: 'name' },
    { Header: 'X', accessor: 'x' },
    { Header: 'Y', accessor: 'y' },
  ];

  const connectionsColumns = [
    { Header: 'От элемента', accessor: 'from_element_id' },
    { Header: 'К элементу', accessor: 'to_element_id' },
    { Header: 'Сечение (мм²)', accessor: 'cable_section' },
    { Header: 'Количество жил', accessor: 'wire_count' },
    { Header: 'Длина (м)', accessor: 'length' },
  ];

  const panelColumns = [
    { Header: 'ID элемента', accessor: 'element_id' },
    { Header: 'Позиция X', accessor: 'position_x' },
    { Header: 'Позиция Y', accessor: 'position_y' },
    { Header: 'Ширина', accessor: 'width' },
    { Header: 'Высота', accessor: 'height' },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Элементы" />
          <Tab label="Связи" />
          <Tab label="Элементы щита" />
        </Tabs>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportPDF}
          >
            Экспорт PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportExcel}
          >
            Экспорт Excel
          </Button>
        </Box>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <EditableTable
          data={elements}
          columns={elementsColumns}
          onUpdate={async (rowIndex, columnId, value) => {
            const element = elements[rowIndex];
            await updateElement(element.id, { [columnId]: value });
            loadData();
          }}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <EditableTable
          data={connections}
          columns={connectionsColumns}
          onUpdate={async (rowIndex, columnId, value) => {
            const connection = connections[rowIndex];
            await updateConnection(connection.id, { [columnId]: value });
            loadData();
          }}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <EditableTable
          data={panelElements}
          columns={panelColumns}
          onUpdate={async (rowIndex, columnId, value) => {
            const panelElement = panelElements[rowIndex];
            await updatePanelElement(panelElement.id, { [columnId]: value });
            loadData();
          }}
        />
      </TabPanel>
    </Box>
  );
};

export default TablesView;

