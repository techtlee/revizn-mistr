import { useState, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const ConfirmDialog = useCallback(
    () => (
      <AlertDialog open={open} onOpenChange={(v) => !v && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title}</AlertDialogTitle>
            {options.description && (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options.cancelLabel || "Zrušit"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                options.variant === "destructive" &&
                  buttonVariants({ variant: "destructive" }),
              )}
            >
              {options.confirmLabel || "Potvrdit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [open, options, handleConfirm, handleCancel],
  );

  return { confirm, ConfirmDialog };
}
