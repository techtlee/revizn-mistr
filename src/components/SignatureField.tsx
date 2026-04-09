import { useRef, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

interface SignatureFieldProps {
  label: string;
  value: string | null | undefined;
  onChange: (val: string) => void;
}

export default function SignatureField({ label, value, onChange }: SignatureFieldProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (sigRef.current && value && !loaded) {
      sigRef.current.fromDataURL(value);
      setLoaded(true);
    }
  }, [value, loaded]);

  const handleEnd = () => {
    if (sigRef.current) {
      onChange(sigRef.current.toDataURL());
    }
  };

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear();
      onChange("");
      setLoaded(false);
    }
  };

  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div className="border border-input rounded-md overflow-hidden bg-background">
        <SignatureCanvas
          ref={sigRef}
          penColor="#1a3a5c"
          canvasProps={{ className: "w-full", height: 120, style: { touchAction: "none" } }}
          onEnd={handleEnd}
        />
      </div>
      <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={handleClear}>
        <RotateCcw className="w-3 h-3 mr-1" /> Vymazat podpis
      </Button>
    </div>
  );
}
