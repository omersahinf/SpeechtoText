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
                ? 'bg-sd-hover text-sd-accent ring-1 ring-sd-accent'
                : isCompleted
                  ? 'text-sd-accent hover:text-sd-accent'
                  : 'text-neutral-500 hover:text-neutral-400'
            }`}
            onClick={() => onStepClick?.(index)}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-sd-accent text-neutral-950'
                  : isCompleted
                    ? 'bg-sd-hover text-sd-accent'
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
