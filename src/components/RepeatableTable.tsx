import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
  type?: "text" | "number";
}

interface RepeatableTableProps<T extends Record<string, string | number | null>> {
  columns: Column[];
  rows: T[];
  onChange: (rows: T[]) => void;
  emptyRow: T;
}

export default function RepeatableTable<T extends Record<string, string | number | null>>({
  columns,
  rows,
  onChange,
  emptyRow,
}: RepeatableTableProps<T>) {
  const addRow = () => onChange([...rows, { ...emptyRow }]);
  const removeRow = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  const updateCell = (i: number, key: string, val: string) => {
    const next = [...rows];
    const col = columns.find(c => c.key === key);
    next[i] = { ...next[i], [key]: col?.type === "number" ? (val === "" ? null : Number(val)) : val };
    onChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key} className="text-xs font-semibold">
                {col.label}
              </TableHead>
            ))}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground text-xs">
                Žádné záznamy
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map(col => (
                <TableCell key={col.key} className="px-1 py-1">
                  <Input
                    type={col.type === "number" ? "number" : "text"}
                    value={row[col.key] ?? ""}
                    onChange={(e) => updateCell(i, col.key, e.target.value)}
                    className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                  />
                </TableCell>
              ))}
              <TableCell className="px-1 py-1 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeRow(i)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={addRow}>
        <Plus className="w-3 h-3 mr-1" /> Přidat řádek
      </Button>
    </div>
  );
}
