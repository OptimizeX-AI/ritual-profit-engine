import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Loader2, Timer } from "lucide-react";
import { useTasks, Task } from "@/hooks/useTasks";

interface TimesheetModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TimesheetModal({ task, open, onOpenChange }: TimesheetModalProps) {
  const { updateTask, isUpdating } = useTasks();
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!task) return;

    const additionalMinutes = hours * 60 + minutes;
    if (additionalMinutes <= 0) return;

    const newTotalMinutes = (task.time_spent_minutes || 0) + additionalMinutes;

    updateTask({
      id: task.id,
      time_spent_minutes: newTotalMinutes,
    });

    // Reset form
    setHours(0);
    setMinutes(0);
    setNotes("");
    onOpenChange(false);
  };

  const formatTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
  };

  const presetTimes = [
    { label: "15min", hours: 0, minutes: 15 },
    { label: "30min", hours: 0, minutes: 30 },
    { label: "1h", hours: 1, minutes: 0 },
    { label: "2h", hours: 2, minutes: 0 },
    { label: "4h", hours: 4, minutes: 0 },
    { label: "8h", hours: 8, minutes: 0 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Registrar Tempo
          </DialogTitle>
          <DialogDescription>
            {task?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current time spent */}
          <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Tempo atual:</span>
            <span className="text-lg font-semibold">
              {formatTime(task?.time_spent_minutes || 0)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {formatTime(task?.estimated_time_minutes || 0)} estimado
            </span>
          </div>

          {/* Preset buttons */}
          <div className="space-y-2">
            <Label>Adicionar tempo rápido</Label>
            <div className="flex flex-wrap gap-2">
              {presetTimes.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHours(preset.hours);
                    setMinutes(preset.minutes);
                  }}
                  className={
                    hours === preset.hours && minutes === preset.minutes
                      ? "border-primary bg-primary/10"
                      : ""
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Manual time input */}
          <div className="space-y-2">
            <Label>Ou digite manualmente</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="hours" className="text-xs text-muted-foreground">
                  Horas
                </Label>
                <Input
                  id="hours"
                  type="number"
                  min={0}
                  max={24}
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="minutes" className="text-xs text-muted-foreground">
                  Minutos
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  min={0}
                  max={59}
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {(hours > 0 || minutes > 0) && (
            <div className="p-3 rounded-lg border border-dashed border-primary/50 bg-primary/5">
              <p className="text-sm text-center">
                <span className="text-muted-foreground">Novo total: </span>
                <span className="font-semibold text-primary">
                  {formatTime((task?.time_spent_minutes || 0) + hours * 60 + minutes)}
                </span>
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que foi feito neste período..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUpdating || (hours === 0 && minutes === 0)}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Tempo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
