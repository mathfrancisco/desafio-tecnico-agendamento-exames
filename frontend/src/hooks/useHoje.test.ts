import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHoje } from './useHoje'

describe('useHoje', () => {
  afterEach(() => vi.useRealTimers())

  it('troca a data quando passa da meia-noite na clínica', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T02:59:30Z')) // 05/11 23:59:30 na clínica
    const { result } = renderHook(() => useHoje())
    expect(result.current).toBe('2026-11-05')

    act(() => vi.advanceTimersByTime(60_000))

    expect(result.current).toBe('2026-11-06')
  })
})
