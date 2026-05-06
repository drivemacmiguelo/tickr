'use client'
interface PlaceholderTabProps {
  name: string
  emoji: string
  description: string
}

export default function PlaceholderTab({ name, emoji, description }: PlaceholderTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl opacity-30">{emoji}</div>
      <div>
        <div className="text-sm font-bold text-white">{name}</div>
        <div className="text-xs text-muted mt-1">{description}</div>
      </div>
      <div className="text-[10px] text-muted opacity-50 bg-bg3 px-4 py-2 rounded-full border border-white/5">
        Próximamente
      </div>
    </div>
  )
}
