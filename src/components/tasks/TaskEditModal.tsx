import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useTasks, Task, TaskStatus } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface TaskEditModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "A Fazer" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "waiting_approval", label: "Aguardando Aprovação Cliente" },
  { value: "done", label: "Concluído" },
];

export function TaskEditModal({ task, open, onOpenChange }: TaskEditModalProps) {
  const { updateTask, isUpdating } = useTasks();
  const { projects } = useProjects();
  const { members } = useTeamMembers();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    assignee_id: "",
    deadline: "",
    status: "todo" as TaskStatus,
    estimated_time_minutes: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        project_id: task.project_id || "",
        assignee_id: task.assignee_id || "",
        deadline: task.deadline || "",
        status: task.status === "late" ? "todo" : task.status,
        estimated_time_minutes: task.estimated_time_minutes,
      });
      setErrors({});
    }
  }, [task]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório";
    }
    if (!formData.project_id) {
      newErrors.project_id = "Projeto é obrigatório";
    }
    if (!formData.assignee_id) {
      newErrors.assignee_id = "Responsável é obrigatório";
    }
    if (!formData.deadline) {
      newErrors.deadline = "Prazo é obrigatório";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Descrição é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!task) return;
    if (!validate()) return;

    updateTask({
      id: task.id,
      title: formData.title,
      description: formData.description || null,
      project_id: formData.project_id || null,
      assignee_id: formData.assignee_id || null,
      deadline: formData.deadline || null,
      status: formData.status,
      estimated_time_minutes: formData.estimated_time_minutes,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
          <DialogDescription>
            Todos os campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição *</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className={errors.description ? "border-destructive" : ""}
              placeholder="Descreva detalhadamente o que deve ser feito..."
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project">Projeto *</Label>
              <Select
                value={formData.project_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, project_id: v })
                }
              >
                <SelectTrigger className={errors.project_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_id && (
                <p className="text-xs text-destructive">{errors.project_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-assignee">Responsável *</Label>
              <Select
                value={formData.assignee_id}
                onValueChange={(v) =>
                  setFormData({ ...formData, assignee_id: v })
                }
              >
                <SelectTrigger className={errors.assignee_id ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignee_id && (
                <p className="text-xs text-destructive">{errors.assignee_id}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Prazo *</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                className={errors.deadline ? "border-destructive" : ""}
              />
              {errors.deadline && (
                <p className="text-xs text-destructive">{errors.deadline}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData({ ...formData, status: v as TaskStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-estimated">Tempo Estimado (minutos)</Label>
            <Input
              id="edit-estimated"
              type="number"
              value={formData.estimated_time_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimated_time_minutes: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
