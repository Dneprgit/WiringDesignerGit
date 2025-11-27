export interface Project {
  id: number;
  name: string;
  created_at: string;
  scale: number;
  floor_plan_image?: string;
  floor_plan_svg?: string;
  floor_plan_locked?: boolean;
  elements_locked?: boolean;
  active_layer?: 'plan' | 'elements';
}

export interface Element {
  id: number;
  project_id: number;
  element_id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  properties: Record<string, any>;
}

export interface PanelElement {
  id: number;
  project_id: number;
  element_id: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

export interface Connection {
  id: number;
  project_id: number;
  from_element_id: number;
  to_element_id: number;
  cable_section: number;
  wire_count: number;
  length?: number;
}

export type ElementType = 'socket' | 'switch' | 'lamp' | 'equipment' | 'panel';

