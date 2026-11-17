import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('Taskboard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the task list and add form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    render(<App />)
    expect(screen.getByRole('heading', { name: /ma liste/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Nouvelle tâche')).toBeInTheDocument()
    expect(await screen.findByText('Votre liste commence ici.')).toBeInTheDocument()
  })
})
