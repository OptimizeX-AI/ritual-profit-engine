import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Sparkles, HelpCircle } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

export function OnboardingWizard() {
  const {
    isOpen,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    skipOnboarding,
  } = useOnboarding();

  const [highlightPos, setHighlightPos] = useState<HighlightPosition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !currentStepData) return;

    const updatePositions = () => {
      if (currentStepData.target) {
        const target = document.querySelector(currentStepData.target);
        if (target) {
          const rect = target.getBoundingClientRect();
          const padding = 8;
          
          setHighlightPos({
            top: rect.top - padding + window.scrollY,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
          });

          // Calculate tooltip position based on placement
          const tooltipWidth = 380;
          const tooltipHeight = 200;
          const gap = 16;

          let top = 0;
          let left = 0;

          switch (currentStepData.placement) {
            case "top":
              top = rect.top + window.scrollY - tooltipHeight - gap;
              left = rect.left + rect.width / 2 - tooltipWidth / 2;
              break;
            case "bottom":
              top = rect.bottom + window.scrollY + gap;
              left = rect.left + rect.width / 2 - tooltipWidth / 2;
              break;
            case "left":
              top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
              left = rect.left - tooltipWidth - gap;
              break;
            case "right":
              top = rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2;
              left = rect.right + gap;
              break;
            default:
              top = rect.bottom + window.scrollY + gap;
              left = rect.left + rect.width / 2 - tooltipWidth / 2;
          }

          // Clamp to viewport
          left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
          top = Math.max(16, top);

          setTooltipPos({ top, left });
        }
      } else {
        // Center the tooltip for steps without a target
        setHighlightPos(null);
        setTooltipPos({
          top: window.innerHeight / 2 - 100 + window.scrollY,
          left: window.innerWidth / 2 - 190,
        });
      }
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions);

    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions);
    };
  }, [isOpen, currentStep, currentStepData]);

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const content = (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Highlight cutout */}
      {highlightPos && (
        <div
          className="absolute rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-background bg-transparent z-[101] transition-all duration-300 ease-out"
          style={{
            top: highlightPos.top,
            left: highlightPos.left,
            width: highlightPos.width,
            height: highlightPos.height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
          }}
        />
      )}

      {/* Tooltip Card */}
      <Card
        ref={tooltipRef}
        className={cn(
          "absolute z-[102] w-[380px] shadow-2xl border-primary/20 bg-card animate-scale-in",
          !highlightPos && "transform"
        )}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">{currentStepData?.title}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={skipOnboarding}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStepData?.description}
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {/* Progress */}
          <div className="w-full flex items-center gap-2">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground font-medium">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="w-full flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="text-muted-foreground"
            >
              Pular tour
            </Button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
              <Button size="sm" onClick={nextStep}>
                {isLastStep ? (
                  "Começar a usar"
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );

  return createPortal(content, document.body);
}

// Floating button to restart tour
export function OnboardingTrigger() {
  const { restartOnboarding, hasCompleted } = useOnboarding();

  if (!hasCompleted) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={restartOnboarding}
      className="gap-2"
    >
      <HelpCircle className="h-4 w-4" />
      Ver tour
    </Button>
  );
}
