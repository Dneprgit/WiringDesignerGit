import React from 'react';
import { Handle, Position } from 'reactflow';
import { Paper, Typography, Box } from '@mui/material';
import {
  Power as PowerIcon,
  Lightbulb as LightbulbIcon,
  Settings as SettingsIcon,
  ElectricalServices as ElectricalServicesIcon,
} from '@mui/icons-material';
import type { ElementType } from '../../types/models';

interface ElementNodeProps {
  data: {
    label: string;
    elementId: string;
    type: ElementType;
  };
}

const getIcon = (type: ElementType) => {
  switch (type) {
    case 'socket':
      return <PowerIcon />;
    case 'switch':
    case 'lamp':
      return <LightbulbIcon />;
    case 'equipment':
      return <SettingsIcon />;
    case 'panel':
      return <ElectricalServicesIcon />;
    default:
      return <PowerIcon />;
  }
};

const ElementNode: React.FC<ElementNodeProps> = ({ data }) => {
  return (
    <Paper
      sx={{
        p: 1,
        minWidth: 100,
        textAlign: 'center',
        border: '2px solid #1976d2',
        borderRadius: 1,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
        {getIcon(data.type)}
        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
          {data.elementId}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
          {data.label}
        </Typography>
      </Box>
      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default ElementNode;

