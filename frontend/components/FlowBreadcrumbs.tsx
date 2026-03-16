import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

type FlowStep = 'search' | 'preferences' | 'results';

const STEPS: { key: FlowStep; label: string }[] = [
  { key: 'search', label: 'Search' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'results', label: 'Results' },
];

export function FlowBreadcrumbs({
  currentStep,
  onGoToSearch,
  onGoToPreferences,
}: {
  currentStep: FlowStep;
  onGoToSearch: () => void;
  onGoToPreferences?: () => void;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const callbacks: Partial<Record<FlowStep, () => void>> = {
    search: onGoToSearch,
    preferences: onGoToPreferences,
  };

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <span key={step.key} className="contents">
              <BreadcrumbItem>
                {isActive && <BreadcrumbPage>{step.label}</BreadcrumbPage>}
                {isCompleted && (
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      callbacks[step.key]?.();
                    }}
                  >
                    {step.label}
                  </BreadcrumbLink>
                )}
                {!isActive && !isCompleted && (
                  <span className="text-muted-foreground/50">{step.label}</span>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
