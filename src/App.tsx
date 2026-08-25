import { Header } from '@/components/Header'
import { formatTunisDateLabel } from '@/utils/timezone'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Football Tonight
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatTunisDateLabel(todayKey())} · All times are Tunisia time
          </p>
        </section>
      </main>
    </div>
  )
}

function todayKey(): string {
  // Placeholder until the data layer lands; keeps the shell honest.
  const now = new Date()
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Tunis' }).format(now)
}

export default App
