import type { Timeframe } from '../types/boxoffice'
import clsx from 'clsx'

interface TimeframeSelectorProps {
  value: Timeframe
  onChange: (t: Timeframe) => void
}

const OPTIONS: { label: string; value: Timeframe }[] = [
  { label: 'Weekend',  value: 'weekend'  },
  { label: 'Weekly',   value: 'weekly'   },
  { label: 'Daily',    value: 'daily'    },
  { label: 'Monthly',  value: 'monthly'  },
]

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex border-b border-surface-600 w-full sm:w-auto overflow-x-auto">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          id={`tf-btn-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'btn-tab whitespace-nowrap -mb-[2px]',
            value === opt.value ? 'btn-tab-active' : 'btn-tab-inactive',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
