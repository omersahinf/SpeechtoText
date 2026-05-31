import { type FormEvent, type ReactElement, type RefObject } from 'react'

interface QuickEditProps {
  transcript: string
  instruction: string
  loading: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onInstructionChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
  onMouseEnter: () => void
}

function SparkleIcon(): ReactElement {
  return (
    <svg className="overlay-sparkle-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M6 1l1 3.5 3.5 1L7 6.5 6 10 5 6.5 1.5 5.5l3.5-1L6 1z" />
    </svg>
  )
}

function CheckIcon(): ReactElement {
  return (
    <svg className="overlay-check-icon" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M2 5.5 4.5 8 9 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function QuickEdit({
  transcript,
  instruction,
  loading,
  inputRef,
  onInstructionChange,
  onCancel,
  onSubmit,
  onMouseEnter
}: QuickEditProps): ReactElement {
  const displayTranscript =
    transcript.trim() || "Meeting'e geldim, deadline yarın. Slide'ları akşam toparlarım."

  function handleSubmit(event: FormEvent): void {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="overlay-quick-edit" onMouseEnter={onMouseEnter} onSubmit={handleSubmit}>
      <div className="overlay-quick-edit__bubble">{displayTranscript}</div>
      <label className="overlay-quick-edit__pill">
        <SparkleIcon />
        <input
          ref={inputRef}
          type="text"
          value={instruction}
          placeholder="daha resmi yaz"
          disabled={loading}
          className="overlay-quick-edit__input"
          onChange={(event) => onInstructionChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onCancel()
            }
          }}
        />
        {!instruction && <span className="overlay-quick-edit__caret" aria-hidden="true" />}
        <button
          type="submit"
          disabled={loading || !instruction.trim()}
          className="overlay-quick-edit__submit"
          aria-label="Düzenlemeyi uygula"
        >
          {loading ? '...' : <CheckIcon />}
        </button>
      </label>
    </form>
  )
}
