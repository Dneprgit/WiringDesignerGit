import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import type { Connection } from '../../types/models';

interface ConnectionEditorProps {
  connection: Connection | null;
  open: boolean;
  onClose: () => void;
  onSave: (connection: Partial<Connection>) => Promise<void>;
}

const ConnectionEditor: React.FC<ConnectionEditorProps> = ({
  connection,
  open,
  onClose,
  onSave,
}) => {
  const [cableSection, setCableSection] = useState(connection?.cable_section || 2.5);
  const [wireCount, setWireCount] = useState(connection?.wire_count || 3);
  const [length, setLength] = useState(connection?.length || 0);

  React.useEffect(() => {
    if (connection) {
      setCableSection(connection.cable_section);
      setWireCount(connection.wire_count);
      setLength(connection.length || 0);
    }
  }, [connection]);

  const handleSave = async () => {
    if (!connection) return;
    
    await onSave({
      cable_section: cableSection,
      wire_count: wireCount,
      length: length > 0 ? length : undefined,
    });
    
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Редактировать связь (кабель)</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Сечение кабеля (мм²)"
          type="number"
          fullWidth
          variant="standard"
          value={cableSection}
          onChange={(e) => setCableSection(parseFloat(e.target.value) || 0)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Количество жил"
          type="number"
          fullWidth
          variant="standard"
          value={wireCount}
          onChange={(e) => setWireCount(parseInt(e.target.value) || 0)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Длина (м)"
          type="number"
          fullWidth
          variant="standard"
          value={length}
          onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionEditor;

