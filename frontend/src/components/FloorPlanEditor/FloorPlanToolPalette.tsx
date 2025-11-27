import React from 'react';
import { Box, Paper, Typography, ToggleButton } from '@mui/material';
import {
  Home as HomeIcon,
  Kitchen as KitchenIcon,
  Bathtub as BathtubIcon,
  DoorFront as DoorIcon,
  Window as WindowIcon,
  Square as SquareIcon,
  Chair as ChairIcon,
  Bed as BedIcon,
  Kitchen as FurnitureIcon,
  Straighten as WallIcon,
} from '@mui/icons-material';

export type FloorPlanToolType = 
  | 'room_kitchen'
  | 'room_living'
  | 'room_bedroom'
  | 'room_bathroom'
  | 'room_corridor'
  | 'room_bedroom2'
  | 'wall'
  | 'door'
  | 'window'
  | 'furniture_table'
  | 'furniture_chair'
  | 'furniture_bed'
  | 'furniture_wardrobe'
  | 'furniture_sofa'
  | null;

interface FloorPlanToolPaletteProps {
  selectedTool: FloorPlanToolType;
  onToolSelect: (tool: FloorPlanToolType) => void;
}

const roomTools: { type: FloorPlanToolType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'room_kitchen', label: 'Кухня', icon: <KitchenIcon />, color: '#FFE082' },
  { type: 'room_living', label: 'Зал', icon: <HomeIcon />, color: '#A5D6A7' },
  { type: 'room_bedroom', label: 'Спальня', icon: <BedIcon />, color: '#CE93D8' },
  { type: 'room_bathroom', label: 'Ванная', icon: <BathtubIcon />, color: '#90CAF9' },
  { type: 'room_corridor', label: 'Коридор', icon: <SquareIcon />, color: '#E0E0E0' },
  { type: 'room_bedroom2', label: 'Спальня 2', icon: <BedIcon />, color: '#F48FB1' },
];

const structureTools: { type: FloorPlanToolType; label: string; icon: React.ReactNode }[] = [
  { type: 'wall', label: 'Стена', icon: <WallIcon /> },
  { type: 'door', label: 'Дверь', icon: <DoorIcon /> },
  { type: 'window', label: 'Окно', icon: <WindowIcon /> },
];

const furnitureTools: { type: FloorPlanToolType; label: string; icon: React.ReactNode }[] = [
  { type: 'furniture_table', label: 'Стол', icon: <SquareIcon /> },
  { type: 'furniture_chair', label: 'Стул', icon: <ChairIcon /> },
  { type: 'furniture_bed', label: 'Кровать', icon: <BedIcon /> },
  { type: 'furniture_wardrobe', label: 'Шкаф', icon: <SquareIcon /> },
  { type: 'furniture_sofa', label: 'Диван', icon: <FurnitureIcon /> },
];

const FloorPlanToolPalette: React.FC<FloorPlanToolPaletteProps> = ({
  selectedTool,
  onToolSelect,
}) => {
  return (
    <Paper sx={{ p: 2, width: 220, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Инструменты плана
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Комнаты */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Комнаты
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {roomTools.map((tool) => (
              <ToggleButton
                key={tool.type}
                value={tool.type || ''}
                selected={selectedTool === tool.type}
                onChange={() => onToolSelect(selectedTool === tool.type ? null : tool.type)}
                size="small"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  height: 70,
                  p: 1,
                  borderColor: tool.color,
                  '&.Mui-selected': {
                    backgroundColor: tool.color,
                    borderWidth: 2,
                  },
                }}
              >
                {tool.icon}
                <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                  {tool.label}
                </Typography>
              </ToggleButton>
            ))}
          </Box>
        </Box>

        {/* Структурные элементы */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Структура
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {structureTools.map((tool) => (
              <ToggleButton
                key={tool.type}
                value={tool.type || ''}
                selected={selectedTool === tool.type}
                onChange={() => onToolSelect(selectedTool === tool.type ? null : tool.type)}
                size="small"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  height: 70,
                  p: 1,
                }}
              >
                {tool.icon}
                <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                  {tool.label}
                </Typography>
              </ToggleButton>
            ))}
          </Box>
        </Box>

        {/* Мебель */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Мебель
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {furnitureTools.map((tool) => (
              <ToggleButton
                key={tool.type}
                value={tool.type || ''}
                selected={selectedTool === tool.type}
                onChange={() => onToolSelect(selectedTool === tool.type ? null : tool.type)}
                size="small"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  height: 70,
                  p: 1,
                }}
              >
                {tool.icon}
                <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5 }}>
                  {tool.label}
                </Typography>
              </ToggleButton>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default FloorPlanToolPalette;

