'use client'

import { useState } from 'react'

interface StarsProps {
  rating: number | null
  quantity?: number | null
  interactive?: boolean
  onSet?: (rating: number) => void
  size?: number
}

export default function Stars({
  rating,
  quantity,
  interactive = false,
  onSet,
  size = 14,
}: StarsProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  
  // Use hovered state if interacting, otherwise fall back to actual rating
  const displayValue = hovered ?? rating ?? 0

  return (
    <span
      style={{
        letterSpacing: 2,
        display: 'inline-flex',
        alignItems: 'center',
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      <span style={{ display: 'inline-flex', gap: '2px' }}>
        {Array.from({ length: 5 }, (_, i) => {
          // Calculate the fill percentage for the current star index (0 to 4)
          const fillAmount = Math.max(0, Math.min(1, displayValue - i))
          const fillPercentage = fillAmount * 100

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                position: 'relative',
                width: size,
                height: size,
                lineHeight: '1',
                userSelect: 'none',
              }}
            >
              {/* Background Inactive Star (SVG) */}
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                style={{
                  display: 'block',
                  fill: 'rgba(232, 220, 190, 0.18)',
                }}
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>

              {/* Foreground Filled Star with Clipping Mask */}
              {fillPercentage > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${fillPercentage}%`,
                    height: '100%',
                    overflow: 'hidden',
                    pointerEvents: 'none', // Allows hover triggers on hitboxes below
                  }}
                >
                  <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    style={{
                      display: 'block',
                      fill: '#F59E0B',
                      // Keeps the star at original aspect ratio regardless of parent's width
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: size,
                      height: size,
                    }}
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </span>
              )}

              {/* Invisible Interactive Hitboxes (split 50/50 for half-star precision) */}
              {interactive && (
                <>
                  {/* Left Half (decrements by 0.5) */}
                  <span
                    onClick={() => onSet?.(i + 0.5)}
                    onMouseEnter={() => setHovered(i + 0.5)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '50%',
                      height: '100%',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  />
                  {/* Right Half (full star increment) */}
                  <span
                    onClick={() => onSet?.(i + 1)}
                    onMouseEnter={() => setHovered(i + 1)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '50%',
                      height: '100%',
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  />
                </>
              )}
            </span>
          )
        })}
      </span>

      {/* Optional review quantity indicator */}
      {quantity != null && quantity > 0 && (
        <span
          style={{
            fontSize: '0.65rem',
            color: 'rgba(232, 220, 190, 0.5)',
            marginLeft: 6,
            letterSpacing: 0,
            fontFamily: "'Inconsolata', monospace",
          }}
        >
          ({quantity})
        </span>
      )}
    </span>
  )
}