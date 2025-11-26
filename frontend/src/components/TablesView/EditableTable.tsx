import React, { useMemo, useState } from 'react';
import { useTable } from 'react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TextField,
} from '@mui/material';

interface EditableTableProps {
  data: any[];
  columns: { Header: string; accessor: string }[];
  onUpdate: (rowIndex: number, columnId: string, value: any) => Promise<void>;
}

const EditableTable: React.FC<EditableTableProps> = ({ data, columns, onUpdate }) => {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const tableColumns = useMemo(
    () =>
      columns.map((col) => ({
        Header: col.Header,
        accessor: col.accessor,
      })),
    [columns]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
    columns: tableColumns,
    data: data,
  });

  const handleCellClick = (rowIndex: number, columnId: string, value: any) => {
    setEditingCell({ rowIndex, columnId });
    setEditValue(value);
  };

  const handleCellBlur = async () => {
    if (editingCell) {
      await onUpdate(editingCell.rowIndex, editingCell.columnId, editValue);
      setEditingCell(null);
    }
  };

  const handleCellKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'auto' }}>
      <Table {...getTableProps()} size="small">
        <TableHead>
          {headerGroups.map((headerGroup) => (
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <TableCell {...column.getHeaderProps()} sx={{ fontWeight: 'bold' }}>
                  {column.render('Header')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody {...getTableBodyProps()}>
          {rows.map((row) => {
            prepareRow(row);
            return (
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  const isEditing =
                    editingCell?.rowIndex === row.index &&
                    editingCell?.columnId === cell.column.id;
                  
                  return (
                    <TableCell
                      {...cell.getCellProps()}
                      onClick={() => handleCellClick(row.index, cell.column.id, cell.value)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {isEditing ? (
                        <TextField
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyPress}
                          autoFocus
                          size="small"
                          fullWidth
                        />
                      ) : (
                        cell.render('Cell')
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default EditableTable;

