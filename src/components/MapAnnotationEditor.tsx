import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush, IText } from "fabric";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Type,
  Undo2,
  Trash2,
  Save,
  Pointer,
} from "lucide-react";

function GroundIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="3" x2="12" y2="13" />
      <line x1="5" y1="13" x2="19" y2="13" />
      <line x1="7.5" y1="17" x2="16.5" y2="17" />
      <line x1="10" y1="21" x2="14" y2="21" />
    </svg>
  );
}

type Tool = "select" | "pen" | "text" | "ground";

interface MapAnnotationEditorProps {
  imageUrl: string;
  annotations: string | null | undefined;
  onSave: (annotationsJson: string) => void;
}

const COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#000000"];

export default function MapAnnotationEditor({
  imageUrl,
  annotations,
  onSave,
}: MapAnnotationEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#ef4444");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 360;

    const fc = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "transparent",
      selection: true,
    });

    fabricRef.current = fc;

    if (annotations) {
      try {
        fc.loadFromJSON(annotations).then(() => fc.renderAll());
      } catch {
        // ignore bad JSON
      }
    }

    saveSnapshot();

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSnapshot = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    setHistory((prev) => [...prev, JSON.stringify(fc.toJSON())]);
  }, []);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    fc.off("mouse:up");
    fc.off("mouse:down");
    fc.off("mouse:move");

    if (tool === "pen") {
      fc.isDrawingMode = true;
      const brush = new PencilBrush(fc);
      brush.color = color;
      brush.width = 3;
      fc.freeDrawingBrush = brush;
      fc.selection = false;

      fc.on("mouse:up", () => saveSnapshot());
    } else {
      fc.isDrawingMode = false;

      if (tool === "select") {
        fc.selection = true;
        fc.defaultCursor = "default";
      } else {
        fc.selection = false;
        fc.defaultCursor = "crosshair";
      }

      if (tool === "text") {
        fc.on("mouse:down", (opt) => {
          if ((opt.target as any)?.type === "i-text") return;
          const pointer = fc.getScenePoint(opt.e);
          const text = new IText("Text", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 16,
            fill: color,
            fontFamily: "Arial",
            editable: true,
          });
          fc.add(text);
          fc.setActiveObject(text);
          text.enterEditing();
          text.selectAll();
          saveSnapshot();
        });
      }

      if (tool === "ground") {
        fc.on("mouse:down", (opt) => {
          if (opt.target) return;
          const pointer = fc.getScenePoint(opt.e);
          const symbol = new IText("\u23DA", {
            left: pointer.x - 12,
            top: pointer.y - 14,
            fontSize: 28,
            fill: color,
            fontFamily: "Arial, sans-serif",
            editable: false,
          });
          fc.add(symbol);
          fc.setActiveObject(symbol);
          saveSnapshot();
        });
      }
    }

    return () => {
      fc.off("mouse:up");
      fc.off("mouse:down");
      fc.off("mouse:move");
    };
  }, [tool, color, saveSnapshot]);

  const handleUndo = () => {
    const fc = fabricRef.current;
    if (!fc || history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const prev = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    fc.loadFromJSON(prev).then(() => fc.renderAll());
  };

  const handleClear = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.clear();
    fc.backgroundColor = "transparent";
    fc.renderAll();
    saveSnapshot();
  };

  const handleDeleteSelected = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const active = fc.getActiveObjects();
    if (active.length > 0) {
      active.forEach((obj) => fc.remove(obj));
      fc.discardActiveObject();
      fc.renderAll();
      saveSnapshot();
    }
  };

  const handleSave = () => {
    const fc = fabricRef.current;
    if (!fc) return;
    const data = fc.toJSON();
    (data as any).width = fc.getWidth();
    (data as any).height = fc.getHeight();
    onSave(JSON.stringify(data));
  };

  const tools: { id: Tool; icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string }[] = [
    { id: "select", icon: Pointer, label: "Vybrat" },
    { id: "pen", icon: Pen, label: "Kreslení" },
    { id: "text", icon: Type, label: "Text" },
    { id: "ground", icon: GroundIcon, label: "Uzemnění ⏚" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap overflow-x-auto pb-1 -mx-1">
        {tools.map((t) => (
          <Button
            key={t.id}
            type="button"
            variant={tool === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTool(t.id)}
            title={t.label}
          >
            <t.icon className="w-4 h-4" />
          </Button>
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        {COLORS.map((c) => (
          <Button
            key={c}
            type="button"
            variant="ghost"
            size="icon"
            className="w-7 h-7 rounded-full p-0 transition-transform"
            style={{
              backgroundColor: c,
              borderWidth: 2,
              borderColor: color === c ? "#111" : "transparent",
              transform: color === c ? "scale(1.2)" : "scale(1)",
            }}
            onClick={() => setColor(c)}
          />
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={history.length <= 1}
          title="Zpět"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDeleteSelected}
          title="Smazat vybrané"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-destructive"
        >
          Vymazat vše
        </Button>
        <div className="ml-auto">
          <Button type="button" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />
            Uložit poznámky
          </Button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative rounded-lg border overflow-hidden bg-white h-[280px] sm:h-[360px] md:h-[400px]"
      >
        <img
          src={imageUrl}
          alt="Katastrální mapa"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ zIndex: 0 }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ zIndex: 1 }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Použijte nástroje nahoře pro kreslení a přidání textu. Klikněte „Uložit
        poznámky" pro uložení.
      </p>
    </div>
  );
}
