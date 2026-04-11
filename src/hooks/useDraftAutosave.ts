import { useEffect, useRef, useCallback } from "react";

export interface DraftPayload {
  form: Record<string, unknown>;
  instruments: Record<string, unknown>[];
  measurements: Record<string, unknown>[];
  spdDevices: Record<string, unknown>[];
  currentStep: number;
  savedAt: number;
}

const DRAFT_PREFIX = "draft:";
const DEBOUNCE_MS = 3000;

function draftKey(reportId: string | undefined): string {
  return `${DRAFT_PREFIX}${reportId ?? "new"}`;
}

export function loadLocalDraft(reportId: string | undefined): DraftPayload | null {
  try {
    const raw = localStorage.getItem(draftKey(reportId));
    if (!raw) return null;
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
}

export function clearLocalDraft(reportId: string | undefined) {
  try {
    localStorage.removeItem(draftKey(reportId));
  } catch { /* noop */ }
}

export function useDraftAutosave(
  reportId: string | undefined,
  form: Record<string, unknown>,
  instruments: Record<string, unknown>[],
  measurements: Record<string, unknown>[],
  spdDevices: Record<string, unknown>[],
  currentStep: number,
  enabled: boolean,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const save = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const payload: DraftPayload = {
        form,
        instruments,
        measurements,
        spdDevices,
        currentStep,
        savedAt: Date.now(),
      };
      localStorage.setItem(draftKey(reportId), JSON.stringify(payload));
    } catch { /* storage full or unavailable */ }
  }, [reportId, form, instruments, measurements, spdDevices, currentStep]);

  useEffect(() => {
    if (!enabled) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [save, enabled]);
}
