import { Inbox } from 'lucide-react'

export default function EmptyState({
  title = 'Nothing here yet',
  description = '',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 px-4">
      <Inbox className="w-12 h-12 text-gray-300" />
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 text-center max-w-xs">{description}</p>
      )}
      {action && action}
    </div>
  )
}