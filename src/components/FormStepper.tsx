import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  shortTitle?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export default function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  const stepButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = stepButtonRefs.current[currentStep];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentStep]);

  return (
    <nav className="w-full overflow-x-auto pb-2 scroll-smooth" aria-label="Kroky formuláře">
      <ol className="flex items-center gap-1 min-w-max">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <li key={step.id} className="flex items-center">
              <button
                type="button"
                ref={el => {
                  stepButtonRefs.current[idx] = el;
                }}
                onClick={() => onStepClick(idx)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  isCurrent && "bg-primary text-primary-foreground shadow-sm",
                  isCompleted && !isCurrent && "bg-primary/10 text-primary hover:bg-primary/20",
                  !isCompleted && !isCurrent && "text-muted-foreground hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0",
                    isCurrent && "bg-primary-foreground text-primary",
                    isCompleted && !isCurrent && "bg-primary text-primary-foreground",
                    !isCompleted && !isCurrent && "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
                <span className="hidden lg:inline">{step.title}</span>
                <span className="lg:hidden">{step.shortTitle || step.title}</span>
              </button>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "w-4 h-px mx-0.5",
                  idx < currentStep ? "bg-primary" : "bg-border"
                )} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
