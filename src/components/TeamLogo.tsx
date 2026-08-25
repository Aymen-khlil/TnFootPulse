import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Club crest with a graceful fallback (initial letter) when a provider
 * ships no logo or a broken URL. Logos come from both providers already
 * normalized onto Team.logo.
 */
function TeamLogo({
  src,
  name,
  size = 32,
  className,
}: {
  src?: string
  name: string
  size?: number
  className?: string
}) {
  const [broken, setBroken] = useState(false)
  const showImage = src !== undefined && !broken

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-elevated',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-0.5"
          onError={() => setBroken(true)}
        />
      ) : (
        <span
          className="font-bold text-muted"
          style={{ fontSize: Math.max(10, size * 0.4) }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  )
}

export { TeamLogo }
