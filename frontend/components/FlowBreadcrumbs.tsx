import type { User } from '@supabase/supabase-js';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { History, House, User as UserIcon, LogIn } from 'lucide-react';

type FlowStep = 'search' | 'preferences' | 'results';

const STEPS: { key: FlowStep; label: string }[] = [
  { key: 'search', label: 'Search' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'results', label: 'Results' },
];

interface FlowBreadcrumbsProps {
  currentStep: FlowStep;
  onGoToSearch: () => void;
  onGoToPreferences?: () => void;
  user?: User | null;
  onGoToHistory?: () => void;
  onGoToProfile?: () => void;
  onGoToAuth?: () => void;
  onGoToLanding?: () => void;
}

export function FlowBreadcrumbs({
  currentStep,
  onGoToSearch,
  onGoToPreferences,
  user,
  onGoToHistory,
  onGoToProfile,
  onGoToAuth,
  onGoToLanding,
}: FlowBreadcrumbsProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  const callbacks: Partial<Record<FlowStep, () => void>> = {
    search: onGoToSearch,
    preferences: onGoToPreferences,
  };

  return (
    <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
      <Breadcrumb>
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

      <div className="flex items-center gap-1">
        {onGoToLanding && (
          <Button variant="ghost" size="sm" onClick={onGoToLanding} aria-label="Home" title="Home">
            <House className="h-3.5 w-3.5" />
          </Button>
        )}
        {user ? (
          <>
            <Button variant="ghost" size="sm" onClick={onGoToHistory} aria-label="History" title="Search history">
              <History className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onGoToProfile} aria-label="Profile" title={user.email ?? 'Profile'}>
              <UserIcon className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={onGoToAuth} aria-label="Sign in" title="Sign in">
            <LogIn className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Sign in</span>
          </Button>
        )}
      </div>
    </div>
  );
}
