import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type Norm, type NormCategory, groupNormsByCategory, CATEGORY_ORDER, getCategoryLabel } from "@/lib/norms";
import { cn } from "@/lib/utils";

interface NormSelectorProps {
  selectedNormIds: string[];
  onSelectionChange: (normIds: string[]) => void;
  disabled?: boolean;
}

export function NormSelector({ selectedNormIds, onSelectionChange, disabled = false }: NormSelectorProps) {
  const [expandedCategory, setExpandedCategory] = useState<NormCategory | null>(null);

  const {
    data: norms,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["norms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("norms")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Norm[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const groupedNorms = norms ? groupNormsByCategory(norms) : null;

  const getSelectedCategory = (): NormCategory | null => {
    if (!groupedNorms || selectedNormIds.length === 0) return null;

    for (const category of CATEGORY_ORDER) {
      const categoryIds = groupedNorms[category].map((n) => n.id);
      if (categoryIds.length === 0) continue;

      const selectedInCategory = categoryIds.filter((id) => selectedNormIds.includes(id)).length;
      if (selectedInCategory > 0) {
        return category;
      }
    }
    return null;
  };

  const selectedCategory = getSelectedCategory();

  const handleCategorySelect = (category: NormCategory) => {
    if (disabled || !groupedNorms) return;

    const categoryIds = groupedNorms[category].map((n) => n.id);

    if (selectedCategory === category) {
      setExpandedCategory(expandedCategory === category ? null : category);
    } else {
      onSelectionChange(categoryIds);
      setExpandedCategory(null);
    }
  };

  const handleToggleNorm = (normId: string) => {
    if (disabled) return;

    if (selectedNormIds.includes(normId)) {
      onSelectionChange(selectedNormIds.filter((id) => id !== normId));
    } else {
      onSelectionChange([...selectedNormIds, normId]);
    }
  };

  const toggleExpand = (category: NormCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nepodařilo se načíst seznam norem. Zkuste to prosím znovu.</AlertDescription>
      </Alert>
    );
  }

  if (!groupedNorms) return null;

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((category) => {
        const categoryNorms = groupedNorms[category];
        if (categoryNorms.length === 0) return null;

        const categoryIds = categoryNorms.map((n) => n.id);
        const selectedInCategory = categoryIds.filter((id) => selectedNormIds.includes(id)).length;
        const isSelected = selectedCategory === category;
        const isExpanded = expandedCategory === category;
        const allSelected = selectedInCategory === categoryIds.length;

        return (
          <Card
            key={category}
            className={cn(
              "cursor-pointer transition-all",
              isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50",
              disabled && "opacity-60 cursor-not-allowed"
            )}
            onClick={() => handleCategorySelect(category)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  )}
                >
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{getCategoryLabel(category)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {categoryNorms.length} {categoryNorms.length === 1 ? "norma" : categoryNorms.length < 5 ? "normy" : "norem"}
                    {isSelected && !allSelected && (
                      <span className="text-amber-600 ml-1">({selectedInCategory} vybráno)</span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => toggleExpand(category, e)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={isExpanded ? "Skrýt detaily" : "Zobrazit detaily"}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {isSelected && isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground mb-3">
                    Kliknutím můžete odznačit jednotlivé normy:
                  </p>
                  {categoryNorms.map((norm) => {
                    const isNormSelected = selectedNormIds.includes(norm.id);
                    return (
                      <div key={norm.id} className="flex items-start gap-3 py-1">
                        <Checkbox
                          id={`norm-${norm.id}`}
                          checked={isNormSelected}
                          onCheckedChange={() => handleToggleNorm(norm.id)}
                          disabled={disabled}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`norm-${norm.id}`}
                          className={cn(
                            "text-sm leading-tight cursor-pointer",
                            disabled && "cursor-not-allowed"
                          )}
                        >
                          <span className="font-medium">{norm.code}</span>
                          {norm.name && <span className="text-muted-foreground ml-1">– {norm.name}</span>}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {selectedNormIds.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-500">Vyberte kategorii norem pro pokračování.</p>
      )}
    </div>
  );
}
