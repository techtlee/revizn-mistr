import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  adresa_ulice: string;
  adresa_obec: string;
  adresa_psc: string;
  adresa_doplnek: string;
  onPatch: (p: {
    adresa_ulice?: string;
    adresa_obec?: string;
    adresa_psc?: string;
    adresa_doplnek?: string;
  }) => void;
  disabled?: boolean;
};

export default function ObjectAddressFields({
  adresa_ulice,
  adresa_obec,
  adresa_psc,
  adresa_doplnek,
  onPatch,
  disabled,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="obj-adresa-ulice" className="text-sm font-medium">
          Ulice a číslo popisné
        </Label>
        <Input
          id="obj-adresa-ulice"
          className="mt-1"
          value={adresa_ulice}
          onChange={e => onPatch({ adresa_ulice: e.target.value })}
          disabled={disabled}
          placeholder="např. Žižkova 12"
          autoComplete="street-address"
        />
      </div>

      <div className="form-grid">
        <div>
          <Label htmlFor="obj-adresa-obec" className="text-sm font-medium">
            Obec / město
          </Label>
          <Input
            id="obj-adresa-obec"
            className="mt-1"
            value={adresa_obec}
            onChange={e => onPatch({ adresa_obec: e.target.value })}
            disabled={disabled}
            placeholder="např. Litvínov"
            autoComplete="address-level2"
          />
        </div>
        <div>
          <Label htmlFor="obj-adresa-psc" className="text-sm font-medium">
            PSČ
          </Label>
          <Input
            id="obj-adresa-psc"
            className="mt-1"
            value={adresa_psc}
            onChange={e => onPatch({ adresa_psc: e.target.value })}
            disabled={disabled}
            placeholder="např. 436 01"
            autoComplete="postal-code"
            inputMode="numeric"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="obj-adresa-doplnek" className="text-sm font-medium">
          Doplňující údaje k adrese
        </Label>
        <Input
          id="obj-adresa-doplnek"
          className="mt-1"
          value={adresa_doplnek}
          onChange={e => onPatch({ adresa_doplnek: e.target.value })}
          disabled={disabled}
          placeholder="např. část obce, orientační bod…"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
