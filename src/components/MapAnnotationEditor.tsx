import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, PencilBrush, IText, Line, Rect } from "fabric";
import { Button } from "@/components/ui/button";
import {
  Pen,
  Type,
  Minus,
  Square,
  Undo2,
  Trash2,
  Save,
  Pointer,
} from "lucide-react";

type Tool = "select" | "pen" | "text" | "line" | "rect";

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
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const tempShapeRef = useRef<Line | Rect | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;

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

      if (tool === "line" || tool === "rect") {
        fc.on("mouse:down", (opt) => {
          if (opt.target) return;
          const pointer = fc.getScenePoint(opt.e);
          drawStartRef.current = { x: pointer.x, y: pointer.y };

          if (tool === "line") {
            const line = new Line(
              [pointer.x, pointer.y, pointer.x, pointer.y],
              { stroke: color, strokeWidth: 3, selectable: true }
            );
            fc.add(line);
            tempShapeRef.current = line;
          } else {
            const rect = new Rect({
              left: pointer.x,
              top: pointer.y,
              width: 0,
              height: 0,
              stroke: color,
              strokeWidth: 2,
              fill: "transparent",
              selectable: true,
            });
            fc.add(rect);
            tempShapeRef.current = rect;
          }
        });

        fc.on("mouse:move", (opt) => {
          if (!drawStartRef.current || !tempShapeRef.current) return;
          const pointer = fc.getScenePoint(opt.e);
          const shape = tempShapeRef.current;

          if (shape instanceof Line) {
            shape.set({ x2: pointer.x, y2: pointer.y });
          } else if (shape instanceof Rect) {
            const sx = drawStartRef.current.x;
            const sy = drawStartRef.current.y;
            shape.set({
              left: Math.min(sx, pointer.x),
              top: Math.min(sy, pointer.y),
              width: Math.abs(pointer.x - sx),
              height: Math.abs(pointer.y - sy),
            });
          }
          fc.renderAll();
        });

        fc.on("mouse:up", () => {
          drawStartRef.current = null;
          tempShapeRef.current = null;
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
    const json = JSON.stringify(fc.toJSON());
    onSave(json);
  };

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: "select", icon: Pointer, label: "Vybrat" },
    { id: "pen", icon: Pen, label: "Kreslení" },
    { id: "text", icon: Type, label: "Text" },
    { id: "line", icon: Minus, label: "Čára" },
    { id: "rect", icon: Square, label: "Obdélník" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 flex-wrap">
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
          <button
            key={c}
            type="button"
            className="w-6 h-6 rounded-full border-2 transition-transform"
            style={{
              backgroundColor: c,
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
        className="relative rounded-lg border overflow-hidden bg-white"
        style={{ height: 400 }}
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
