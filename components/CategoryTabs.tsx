'use client'

import { useState } from "react"
import clsx from "clsx"

export interface CategoryTabItem {
  key: string
  label: string
}

export default function CategoryTabs({
  tabs,
  onChange,
  defaultValue = 'recommend'
}: {
  tabs: CategoryTabItem[]
  onChange?: (value: string) => void,
  defaultValue?: string
}) {
  const [active, setActive] = useState(defaultValue)

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 py-4 min-w-max">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActive(tab.key)
              onChange?.(tab.key)
            }}
            className={clsx(
              "px-6 py-2 rounded-full whitespace-nowrap border border-gray-200 text-base transition-all duration-150",
              active === tab.key
                ? "bg-blue-500 text-white font-semibold shadow"
                : "bg-white text-gray-800 hover:bg-blue-50"
            )}
            style={{ minWidth: 80 }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
