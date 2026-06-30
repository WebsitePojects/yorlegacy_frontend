type EncashmentRow = {
  id: string;
};

export function resolveEncashmentSelection(rows: EncashmentRow[], selectedId: string): string {
  return rows.some((row) => row.id === selectedId) ? selectedId : (rows[0]?.id ?? '');
}
