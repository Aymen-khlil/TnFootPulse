import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import App from '@/App'

describe('App shell', () => {
  it('renders the branded dark shell', () => {
    const html = renderToString(<App />)
    expect(html).toContain('TnFootPulse')
    expect(html).toContain('Football Tonight')
    expect(html).toContain('Tunisia')
  })
})
