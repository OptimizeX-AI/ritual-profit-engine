import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const ONBOARDING_KEY = "erp_onboarding_completed";
const ONBOARDING_STEP_KEY = "erp_onboarding_step";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Ritual Profit Engine! 🎉",
    description: "Vamos fazer um tour rápido pelas principais funcionalidades do ERP para você aproveitar ao máximo a plataforma.",
    placement: "bottom",
  },
  {
    id: "dashboard",
    title: "Dashboard Executivo",
    description: "Aqui você tem uma visão geral do seu negócio: receita, clientes ativos, tarefas pendentes e pipeline de vendas. Tudo em tempo real.",
    target: "[data-onboarding='dashboard-kpis']",
    placement: "bottom",
  },
  {
    id: "tasks",
    title: "Suas Tarefas Ativas",
    description: "Acompanhe suas tarefas do dia, registre tempo gasto e mantenha o controle do SLA. A 'Bíblia' do seu trabalho diário.",
    target: "[data-onboarding='my-tasks']",
    placement: "top",
  },
  {
    id: "sidebar-crm",
    title: "CRM - Pipeline de Vendas",
    description: "Gerencie seus leads e oportunidades no Kanban. Arraste cards entre as etapas e acompanhe o valor ponderado do pipeline.",
    target: "[data-onboarding='nav-crm']",
    placement: "right",
  },
  {
    id: "sidebar-projetos",
    title: "Projetos & Clientes",
    description: "Cadastre clientes, crie projetos e acompanhe o consumo de horas. O 'Fuel Gauge' mostra quanto do budget já foi utilizado.",
    target: "[data-onboarding='nav-projetos']",
    placement: "right",
  },
  {
    id: "sidebar-tarefas",
    title: "Gestão de Tarefas",
    description: "Crie e gerencie todas as tarefas da equipe. Defina prazos, responsáveis e acompanhe o SLA em tempo real.",
    target: "[data-onboarding='nav-tarefas']",
    placement: "right",
  },
  {
    id: "sidebar-financeiro",
    title: "Financeiro (Admin)",
    description: "Área restrita a administradores. Gerencie receitas, despesas, contas bancárias e veja o DRE completo.",
    target: "[data-onboarding='nav-financeiro']",
    placement: "right",
  },
  {
    id: "sidebar-warroom",
    title: "War Room (Admin)",
    description: "Centro de comando executivo. Acompanhe metas, ranking de vendedores e radar de churn em tempo real.",
    target: "[data-onboarding='nav-warroom']",
    placement: "right",
  },
  {
    id: "complete",
    title: "Pronto para começar! 🚀",
    description: "Você completou o tour! Agora explore o sistema à vontade. Lembre-se: cultura é ritual. Use o ERP diariamente para melhores resultados.",
    placement: "bottom",
  },
];

interface OnboardingContextType {
  isOpen: boolean;
  currentStep: number;
  currentStepData: OnboardingStep;
  totalSteps: number;
  hasCompleted: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    
    if (!completed) {
      setHasCompleted(false);
      setCurrentStep(savedStep ? parseInt(savedStep, 10) : 0);
      // Auto-open for first-time users after a small delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompleted(true);
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      localStorage.setItem(ONBOARDING_STEP_KEY, String(next));
    } else {
      completeOnboarding();
    }
  }, [currentStep, completeOnboarding]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      localStorage.setItem(ONBOARDING_STEP_KEY, String(prev));
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < ONBOARDING_STEPS.length) {
      setCurrentStep(step);
      localStorage.setItem(ONBOARDING_STEP_KEY, String(step));
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const restartOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompleted(false);
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const openOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const closeOnboarding = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isOpen,
        currentStep,
        currentStepData: ONBOARDING_STEPS[currentStep],
        totalSteps: ONBOARDING_STEPS.length,
        hasCompleted,
        nextStep,
        prevStep,
        goToStep,
        skipOnboarding,
        completeOnboarding,
        restartOnboarding,
        openOnboarding,
        closeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
