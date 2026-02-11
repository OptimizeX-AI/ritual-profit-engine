import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, Settings, Target, FolderKanban, BookOpen, DollarSign,
  BarChart3, Swords, AlertTriangle, Lightbulb, ArrowRight, Users,
  Clock, Gauge, Building2, CheckCircle2
} from "lucide-react";

interface Lesson {
  title: string;
  content: string;
  link?: { label: string; href: string };
  highlight?: { type: "warning" | "tip"; text: string };
}

interface Phase {
  number: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  lessons: Lesson[];
}

const phases: Phase[] = [
  {
    number: 1,
    title: "Configuração Inicial",
    subtitle: "Fundação",
    icon: Settings,
    gradient: "from-blue-500/10 to-cyan-500/10",
    lessons: [
      {
        title: "Criar sua conta e entender o onboarding",
        content: "Ao criar sua conta, o sistema automaticamente provisiona sua organização, perfil e papel de administrador. O tour guiado aparecerá na primeira vez para apresentar cada módulo. Você pode reiniciá-lo a qualquer momento clicando em \"Tour\" na barra lateral.",
        highlight: { type: "tip", text: "Dica: O primeiro usuário cadastrado é automaticamente administrador da organização." },
      },
      {
        title: "Configurar equipe (custo hora, funções, comissões)",
        content: "Acesse Equipe para cadastrar os membros da sua agência. Para cada membro, defina: função (assistente, closer, gestor, dono), custo hora (usado no cálculo de rentabilidade), comissão de vendas (% sobre deals fechados) e capacidade semanal em horas.",
        link: { label: "Ir para Equipe", href: "/settings/team" },
        highlight: { type: "warning", text: "Importante: O custo hora é a base do cálculo de rentabilidade. Sem ele, o sistema não consegue calcular o custo real de mão de obra por cliente." },
      },
      {
        title: "Cadastrar contas bancárias no Financeiro",
        content: "No módulo Financeiro, cadastre suas contas bancárias (banco, agência, conta, saldo inicial). Cada transação paga será vinculada a uma conta e o saldo atualiza automaticamente via trigger no banco de dados.",
        link: { label: "Ir para Financeiro", href: "/financeiro" },
      },
      {
        title: "O plano de contas Baker já vem pronto",
        content: "Ao criar sua organização, o sistema automaticamente popula um plano de contas baseado na metodologia de David C. Baker, com categorias pré-definidas: receitas (Fee Mensal, Projeto Pontual, Success Fee), custos variáveis (Impostos, Comissões, Taxas), custos diretos (Freelancers, Hospedagem, Mídia/Repasse) e custos fixos (Folha, Pró-labore, Aluguel, Softwares, Marketing).",
        highlight: { type: "tip", text: "Dica: Você pode adicionar novas categorias, mas evite alterar as padrão para manter a compatibilidade com o DRE gerencial." },
      },
    ],
  },
  {
    number: 2,
    title: "Captação e Vendas",
    subtitle: "CRM",
    icon: Target,
    gradient: "from-green-500/10 to-emerald-500/10",
    lessons: [
      {
        title: "Como criar deals no pipeline Kanban",
        content: "No CRM, clique em \"Novo Deal\" para criar uma oportunidade. Preencha: empresa, contato, valor estimado (em centavos), data prevista de fechamento e vendedor responsável. O deal nasce na coluna Prospecção com 10% de probabilidade.",
        link: { label: "Ir para CRM", href: "/crm" },
      },
      {
        title: "Registrar origem do lead",
        content: "Cada deal deve ter uma origem registrada: Ads (mídia paga), Indicação (referral), Outbound (prospecção ativa) ou Orgânico (inbound natural). Isso alimenta análises de atribuição para entender qual canal traz mais receita.",
        highlight: { type: "tip", text: "Dica: A origem aparece como badge colorido no card do deal, facilitando a análise visual do pipeline." },
      },
      {
        title: "Mover deals entre colunas",
        content: "Arraste os cards entre as colunas do Kanban. Cada coluna tem uma probabilidade automática: Prospecção (10%), Proposta (40%), Negociação (70%), Fechado (100%), Perdido (0%). A probabilidade é usada para calcular o pipeline ponderado na War Room.",
      },
      {
        title: "Fechar deal: comissão automática + projeto",
        content: "Ao arrastar um deal para \"Fechado\", duas coisas acontecem automaticamente: 1) O sistema provisiona a comissão de vendas como despesa pendente (categoria \"Comissões de Vendas\"), calculada com base no percentual configurado no perfil do vendedor. 2) Um modal aparece para criar o projeto associado, definindo nome, cliente e horas vendidas.",
        link: { label: "Ir para CRM", href: "/crm" },
        highlight: { type: "warning", text: "Regra crítica: A comissão é provisionada automaticamente via função PostgreSQL. Não é possível fechar um deal sem vendedor atribuído." },
      },
      {
        title: "Registrar motivo de perda obrigatório",
        content: "Quando um deal é movido para \"Perdido\", o sistema obriga a seleção de um motivo: Preço, Escopo, Concorrente, Timing, Sem Orçamento, Mudança de Decisor ou Outro. Essa informação é essencial para análise de perdas e ajuste de estratégia comercial.",
      },
    ],
  },
  {
    number: 3,
    title: "Entrega e Operação",
    subtitle: "Projetos + Tarefas",
    icon: FolderKanban,
    gradient: "from-purple-500/10 to-violet-500/10",
    lessons: [
      {
        title: "Entender o projeto criado: budget e fuel gauge",
        content: "Todo projeto nasce com um budget inicial (horas contratadas). O Fuel Gauge mostra visualmente o consumo: Verde (< 80%), Amarelo (80-100%), Laranja (100-120%), Vermelho (> 120% = over-servicing). O budget atual pode ser diferente do inicial se houver aditivos aprovados.",
        link: { label: "Ir para Projetos", href: "/projetos" },
        highlight: { type: "warning", text: "Over-servicing: Quando o gauge passa de 120%, significa que a equipe está trabalhando mais do que foi contratado — isso corrói a rentabilidade do cliente." },
      },
      {
        title: "Criar tarefas com dono, prazo e descrição",
        content: "No módulo Bíblia (Tarefas), crie tarefas vinculadas a projetos. Campos obrigatórios: título, dono (assignee), prazo (deadline) e descrição. Tarefas sem dono ou prazo são bloqueadas pelo sistema. A estimativa de tempo é usada no cálculo de capacidade da equipe.",
        link: { label: "Ir para Bíblia", href: "/tarefas" },
      },
      {
        title: "Usar o timesheet para registrar horas",
        content: "O Timesheet permite registrar horas trabalhadas por tarefa. Esse registro alimenta diretamente o cálculo de rentabilidade: horas trabalhadas × custo hora do membro = custo de mão de obra do projeto.",
        link: { label: "Ir para Timesheet", href: "/timesheet" },
      },
      {
        title: "Entender a pausa de SLA (aguardando cliente)",
        content: "Quando uma tarefa é movida para o status \"Aguardando Cliente\", o SLA é pausado automaticamente via trigger. O tempo parado não conta contra a equipe. Ao sair desse status, o sistema registra o total de minutos pausados.",
        highlight: { type: "tip", text: "Dica: Use esse recurso para proteger sua equipe de atrasos causados por clientes. O badge \"Pausado (Cliente)\" aparece visualmente na tarefa." },
      },
      {
        title: "Solicitar aditivos quando o escopo muda",
        content: "Se o escopo do projeto muda, registre um aditivo (Change Order) com as horas adicionais e valor. O aditivo pode ser marcado como \"aprovado pelo cliente\" e automaticamente soma as horas ao budget atual do projeto via trigger.",
        link: { label: "Ir para Projetos", href: "/projetos" },
      },
      {
        title: "Monitorar capacidade da equipe",
        content: "A tela de Capacidade mostra a utilização de cada membro: horas alocadas vs. capacidade semanal. Status: Verde (< 80% = disponível), Amarelo (80-100% = atenção), Vermelho (> 100% = sobrecarga, risco de burnout).",
        link: { label: "Ir para Capacidade", href: "/capacidade" },
      },
    ],
  },
  {
    number: 4,
    title: "Gestão Financeira",
    subtitle: "Inteligência Financeira",
    icon: DollarSign,
    gradient: "from-amber-500/10 to-yellow-500/10",
    lessons: [
      {
        title: "Lançar receitas e despesas operacionais",
        content: "No módulo Financeiro, lance receitas (Fee Mensal, Projeto Pontual) e despesas (Folha, Freelancers, etc.). Cada transação precisa de: descrição, categoria, valor, data e conta bancária. Vincule despesas a projetos para classificá-las como custo direto.",
        link: { label: "Ir para Financeiro", href: "/financeiro" },
      },
      {
        title: "Entender a regra de Repasse",
        content: "Repasse é o valor de mídia (ex: Google Ads, Meta Ads) que passa pela agência mas NÃO é receita própria. Quando marcado como repasse, o sistema força nature = 'não operacional', excluindo o valor do DRE e do cálculo de rentabilidade. O repasse apenas afeta o fluxo de caixa e saldo bancário.",
        highlight: { type: "warning", text: "REGRA INVIOLÁVEL: Repasse NUNCA entra no DRE. Se sua agência fatura R$ 100k mas R$ 60k é mídia, sua receita real é R$ 40k. Confundir isso distorce toda a gestão financeira." },
      },
      {
        title: "Custo direto vs. custo fixo",
        content: "Custo direto é vinculado a um projeto específico (ex: freelancer contratado para um job). Custo fixo é da operação geral (ex: aluguel, folha). A diferença é fundamental: custo direto entra na rentabilidade do cliente, custo fixo entra no DRE geral. O sistema classifica automaticamente: se a transação tem project_id, é custo direto.",
      },
      {
        title: "Como o saldo bancário atualiza automaticamente",
        content: "Quando uma transação muda para status \"pago\", um trigger no banco de dados atualiza o saldo da conta bancária vinculada: receitas somam, despesas subtraem. Se o pagamento é revertido, a operação inversa é aplicada automaticamente.",
        highlight: { type: "tip", text: "Dica: O saldo mostrado no sistema é sempre o saldo real (saldo inicial + movimentações pagas). Transações pendentes não afetam o saldo." },
      },
    ],
  },
  {
    number: 5,
    title: "Inteligência e Relatórios",
    subtitle: "Analytics",
    icon: BarChart3,
    gradient: "from-indigo-500/10 to-blue-500/10",
    lessons: [
      {
        title: "Ler o DRE Gerencial de 7 linhas",
        content: "O DRE (Demonstrativo de Resultado do Exercício) da sua agência tem 7 linhas: (+) Receita Bruta, (-) Impostos, (-) Custos Variáveis = Margem de Contribuição, (-) Custos Fixos, (-) Investimentos = Lucro Líquido Operacional. O percentual de impostos é configurável nas configurações da organização.",
        link: { label: "Ir para Relatórios", href: "/relatorios" },
      },
      {
        title: "Entender a fórmula de rentabilidade por cliente",
        content: "Rentabilidade = Receita do Cliente − Custos Diretos − Custo de Mão de Obra. O custo de mão de obra é calculado como: Σ(horas trabalhadas × custo hora do membro). A margem percentual é: (Lucro ÷ Receita) × 100. Clientes com margem negativa estão dando prejuízo.",
        link: { label: "Ir para Relatórios", href: "/relatorios" },
        highlight: { type: "warning", text: "Atenção: Se o custo hora dos membros não estiver configurado, a rentabilidade será artificialmente alta (custo de mão de obra = zero)." },
      },
      {
        title: "Usar drill-down por categoria no DRE",
        content: "No DRE avançado, cada linha é expansível. Clique para ver o detalhamento por categoria (ex: dentro de Custos Fixos, quanto é Folha, quanto é Aluguel, quanto é Software). Isso permite identificar exatamente onde está o desperdício.",
      },
    ],
  },
  {
    number: 6,
    title: "Rituais de Gestão",
    subtitle: "War Room",
    icon: Swords,
    gradient: "from-red-500/10 to-rose-500/10",
    lessons: [
      {
        title: "Definir metas mensais",
        content: "Na War Room, defina metas mensais para: faturamento (receita alvo), vendas (número de deals fechados) e pipeline (valor total de oportunidades ativas). Os gauges mostram o progresso em tempo real, comparando realizado vs. meta.",
        link: { label: "Ir para War Room", href: "/war-room" },
      },
      {
        title: "Acompanhar ranking de vendedores",
        content: "O ranking mostra cada vendedor ordenado por receita trazida, com colunas: deals fechados, receita total e ticket médio. Use para identificar quem está performando e quem precisa de suporte. Pergunta-chave: \"Quem está carregando o piano?\"",
        link: { label: "Ir para War Room", href: "/war-room" },
      },
      {
        title: "Usar o Churn Radar para renovar contratos",
        content: "O Churn Radar identifica automaticamente clientes com contratos vencendo nos próximos 60 dias. Níveis de risco: Crítico (< 15 dias, vermelho), Alto (15-30 dias, laranja), Médio (30-60 dias, amarelo). Use para antecipar conversas de renovação e evitar perda de receita recorrente.",
        link: { label: "Ir para War Room", href: "/war-room" },
        highlight: { type: "warning", text: "Regra de ouro: Todo contrato com menos de 30 dias para vencer deveria ter uma reunião de renovação já agendada." },
      },
    ],
  },
];

export default function Curso() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Curso de Uso do Sistema</h1>
              <p className="text-sm text-muted-foreground">
                Siga as 6 fases para implantar e operar o Agency Profit Planner
              </p>
            </div>
          </div>
        </div>

        {/* Phases */}
        {phases.map((phase) => (
          <Card key={phase.number} className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${phase.gradient} border-b`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-sm font-bold text-foreground shadow-sm">
                    {phase.number}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {phase.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <phase.icon className="h-5 w-5 text-muted-foreground" />
                  <Badge variant="secondary">{phase.lessons.length} lições</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {phase.lessons.map((lesson, idx) => (
                  <AccordionItem key={idx} value={`${phase.number}-${idx}`} className="border-b last:border-0">
                    <AccordionTrigger className="px-6 py-4 text-sm font-medium hover:no-underline">
                      <div className="flex items-center gap-2 text-left">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                        {lesson.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lesson.content}
                      </p>

                      {lesson.highlight && (
                        <div
                          className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                            lesson.highlight.type === "warning"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {lesson.highlight.type === "warning" ? (
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <span>{lesson.highlight.text}</span>
                        </div>
                      )}

                      {lesson.link && (
                        <Button asChild variant="outline" size="sm">
                          <Link to={lesson.link.href}>
                            {lesson.link.label}
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
