import type { ReactElement } from 'react'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  onStepClick?: (index: number) => void
}

export function StepIndicator({
  steps,
  currentStep,
  onStepClick
}: StepIndicatorProps): ReactElement {
  return (
    <div className="flex items-center gap-1">
      {steps.map((label, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep

        return (
          <button
            key={label}
            type="button"
            className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              isActive
                ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30'
                : isCompleted
                  ? 'text-emerald-400/60 hover:text-emerald-300'
                  : 'text-neutral-500 hover:text-neutral-400'
            }`}
            onClick={() => onStepClick?.(index)}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-400 text-neutral-950'
                  : isCompleted
                    ? 'bg-emerald-400/20 text-emerald-400'
                    : 'bg-neutral-800 text-neutral-500'
              }`}
            >
              {isCompleted ? '✓' : index + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
