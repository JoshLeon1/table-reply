import Nav from '@/components/Nav'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ backgroundColor: '#F5F3F0' }}>
      {/* Subtle ambient gradient at top */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-64 opacity-30" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(224,90,40,0.12), transparent)' }} />
      <Nav />
      <main className="relative flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 animate-fade-up min-w-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
