import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Building2, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  company: string;
  value: number;
  contact: string;
  daysInStage: number;
  probability: number;
}

interface PipelineStage {
  id: string;
  name: string;
  deals: Deal[];
  color: string;
}

const pipelineData: PipelineStage[] = [
  {
    id: "prospecting",
    name: "Prospecção",
    color: "border-t-muted-foreground",
    deals: [
      { id: "1", company: "Fintech ABC", value: 15000, contact: "João Silva", daysInStage: 5, probability: 20 },
      { id: "2", company: "E-commerce XYZ", value: 8000, contact: "Maria Santos", daysInStage: 2, probability: 15 },
    ],
  },
  {
    id: "proposal",
    name: "Proposta Enviada",
    color: "border-t-pending",
    deals: [
      { id: "3", company: "Construtora Mega", value: 25000, contact: "Carlos Oliveira", daysInStage: 8, probability: 50 },
    ],
  },
  {
    id: "negotiation",
    name: "Negociação",
    color: "border-t-warning",
    deals: [
      { id: "4", company: "Clínica Saúde+", value: 12000, contact: "Ana Lima", daysInStage: 12, probability: 70 },
      { id: "5", company: "Academia FitPro", value: 6500, contact: "Pedro Costa", daysInStage: 4, probability: 60 },
    ],
  },
  {
    id: "closed",
    name: "Fechado ✓",
    color: "border-t-profit",
    deals: [
      { id: "6", company: "Restaurante Sabor", value: 9000, contact: "Lucia Pereira", daysInStage: 0, probability: 100 },
    ],
  },
];

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="bg-card rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{deal.company}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm">
          <DollarSign className="h-3.5 w-3.5 text-profit" />
          <span className="font-semibold text-profit">
            R$ {deal.value.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-muted-foreground">
            /mês
          </span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{deal.contact}</span>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{deal.daysInStage}d</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${deal.probability}%` }}
            />
          </div>
          <span className="text-xs font-medium">{deal.probability}%</span>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const totalPipeline = pipelineData.reduce(
    (acc, stage) => acc + stage.deals.reduce((sum, deal) => sum + deal.value, 0),
    0
  );

  const weightedPipeline = pipelineData.reduce(
    (acc, stage) =>
      acc + stage.deals.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0),
    0
  );

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM - Pipeline de Vendas</h1>
            <p className="text-muted-foreground">
              Gerencie seus negócios em andamento
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Negócio
          </Button>
        </div>

        {/* Pipeline Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Pipeline Total</div>
              <div className="text-2xl font-bold">
                R$ {totalPipeline.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {pipelineData.reduce((acc, s) => acc + s.deals.length, 0)} negócios ativos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Previsão Ponderada</div>
              <div className="text-2xl font-bold text-profit">
                R$ {weightedPipeline.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Baseado na probabilidade
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
              <div className="text-2xl font-bold">32%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Média dos últimos 3 meses
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-4 gap-4">
          {pipelineData.map((stage) => (
            <div key={stage.id} className="space-y-3">
              <div className={cn("rounded-lg border-t-4 bg-muted/30 p-3", stage.color)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stage.deals.length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  R$ {stage.deals.reduce((sum, d) => sum + d.value, 0).toLocaleString('pt-BR')}
                </div>
              </div>
              
              <div className="space-y-2">
                {stage.deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
              
              <Button variant="ghost" className="w-full border-dashed border text-muted-foreground text-sm h-9">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
