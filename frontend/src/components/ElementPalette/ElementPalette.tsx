import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import {
  Power as PowerIcon,
  Lightbulb as LightbulbIcon,
  Settings as SettingsIcon,
  ElectricalServices as ElectricalServicesIcon,
} from '@mui/icons-material';
import type { ElementType } from '../../types/models';

interface ElementPaletteProps {
  onElementSelect: (type: ElementType) => void;
}

const elementTypes: { type: ElementType; label: string; icon: React.ReactNode }[] = [
  { type: 'socket', label: 'Розетка', icon: <PowerIcon /> },
  { type: 'switch', label: 'Выключатель', icon: <LightbulbIcon /> },
  { type: 'lamp', label: 'Лампа', icon: <LightbulbIcon /> },
  { type: 'equipment', label: 'Оборудование', icon: <SettingsIcon /> },
  { type: 'panel', label: 'Щит', icon: <ElectricalServicesIcon /> },
];

const ElementPalette: React.FC<ElementPaletteProps> = ({ onElementSelect }) => {
  return (
    <Paper sx={{ p: 2, width: 200 }}>
      <Typography variant="h6" gutterBottom>
        Элементы
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {elementTypes.map((item) => (
          <IconButton
            key={item.type}
            onClick={() => onElementSelect(item.type)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              border: '1px solid #ccc',
              borderRadius: 1,
              p: 1,
            }}
          >
            {item.icon}
            <Typography variant="caption">{item.label}</Typography>
          </IconButton>
        ))}
      </Box>
    </Paper>
  );
};

export default ElementPalette;

