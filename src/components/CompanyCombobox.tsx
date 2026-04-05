import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SavedCompany } from "@/lib/formSettings";

type Props = {
  value: string;
  onValueChange: (v: string) => void;
  companies: SavedCompany[];
  onPickCompany: (c: SavedCompany) => void;
  disabled?: boolean;
  id?: string;
};

export default function CompanyCombobox({
  value,
  onValueChange,
  companies,
  onPickCompany,
  disabled,
  id,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-1">
      <Input
        id={id}
        className="flex-1"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder="Název montážní firmy"
        disabled={disabled}
        autoComplete="off"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || companies.length === 0}
            title="Vybrat z uložených firem"
            aria-label="Vybrat z uložených firem"
          >
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,28rem)] p-0" align="end">
          <Command>
            <CommandInput placeholder="Hledat firmu…" />
            <CommandList>
              <CommandEmpty>Žádná firma v nastavení.</CommandEmpty>
              <CommandGroup>
                {companies.map(c => (
                  <CommandItem
                    key={c.id}
                    value={`${c.nazev} ${c.ico} ${c.ev_opravneni}`}
                    onSelect={() => {
                      onPickCompany(c);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === c.nazev ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{c.nazev}</span>
                    {c.ico ? (
                      <span className="ml-2 text-xs text-muted-foreground truncate">IČ {c.ico}</span>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
