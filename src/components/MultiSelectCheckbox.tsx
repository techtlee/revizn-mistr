import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface MultiSelectCheckboxProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectCheckbox({ label, options, selected, onChange }: MultiSelectCheckboxProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div>
      <div className="text-sm font-medium text-foreground mb-2">{label}</div>
      <div className="space-y-2">
        {options.map(opt => (
          <div key={opt} className="flex items-center gap-2">
            <Checkbox
              id={`${label}-${opt}`}
              checked={selected.includes(opt)}
              onCheckedChange={() => toggle(opt)}
            />
            <Label htmlFor={`${label}-${opt}`} className="text-sm font-normal cursor-pointer">
              {opt}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
