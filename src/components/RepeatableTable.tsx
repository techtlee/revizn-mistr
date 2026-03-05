import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="text-left px-2 py-2 bg-muted font-semibold text-foreground border border-border text-xs">
                {col.label}
              </th>
            ))}
            <th className="w-10 px-2 py-2 bg-muted border border-border" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + 1} className="px-3 py-3 text-center text-muted-foreground text-xs border border-border">
                Žádné záznamy
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key} className="px-1 py-1 border border-border">
                  <Input
                    type={col.type === "number" ? "number" : "text"}
                    value={row[col.key] ?? ""}
                    onChange={(e) => updateCell(i, col.key, e.target.value)}
                    className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                  />
                </td>
              ))}
              <td className="px-1 py-1 border border-border text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeRow(i)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={addRow}>
        <Plus className="w-3 h-3 mr-1" /> Přidat řádek
      </Button>
    </div>
  );
}
