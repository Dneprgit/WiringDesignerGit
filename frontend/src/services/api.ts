import axios from 'axios';
import type { Project, Element, PanelElement, Connection } from '../types/models';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects
export const getProjects = () => api.get<Project[]>('/projects');
export const getProject = (id: number) => api.get<Project>(`/projects/${id}`);
export const createProject = (data: { name: string; scale?: number }) => 
  api.post<Project>('/projects', data);
export const updateProject = (id: number, data: Partial<Project>) => 
  api.put<Project>(`/projects/${id}`, data);
export const deleteProject = (id: number) => api.delete(`/projects/${id}`);

// Elements
export const getElements = (projectId: number) => 
  api.get<Element[]>(`/elements/project/${projectId}`);
export const getElement = (id: number) => api.get<Element>(`/elements/${id}`);
export const createElement = (data: Omit<Element, 'id'>) => 
  api.post<Element>('/elements', data);
export const updateElement = (id: number, data: Partial<Element>) => 
  api.put<Element>(`/elements/${id}`, data);
export const deleteElement = (id: number) => api.delete(`/elements/${id}`);

// Connections
export const getConnections = (projectId: number) => 
  api.get<Connection[]>(`/connections/project/${projectId}`);
export const getConnection = (id: number) => api.get<Connection>(`/connections/${id}`);
export const createConnection = (data: Omit<Connection, 'id'>) => 
  api.post<Connection>('/connections', data);
export const updateConnection = (id: number, data: Partial<Connection>) => 
  api.put<Connection>(`/connections/${id}`, data);
export const deleteConnection = (id: number) => api.delete(`/connections/${id}`);

// Panel Elements
export const getPanelElements = (projectId: number) => 
  api.get<PanelElement[]>(`/panel/project/${projectId}`);
export const getPanelElement = (id: number) => api.get<PanelElement>(`/panel/${id}`);
export const createPanelElement = (data: Omit<PanelElement, 'id'>) => 
  api.post<PanelElement>('/panel', data);
export const updatePanelElement = (id: number, data: Partial<PanelElement>) => 
  api.put<PanelElement>(`/panel/${id}`, data);
export const deletePanelElement = (id: number) => api.delete(`/panel/${id}`);

// Export
export const exportPDF = (projectId: number) => 
  api.get(`/export/pdf/${projectId}`, { responseType: 'blob' });
export const exportExcel = (projectId: number) => 
  api.get(`/export/excel/${projectId}`, { responseType: 'blob' });

