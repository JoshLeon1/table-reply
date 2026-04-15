import Nav from '@/components/Nav'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F6F3', overflowX: 'clip' }}>
      {/* Subtle ambient gradient at top */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-96 opacity-40" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(224,90,40,0.06), transparent)' }} />
      <Nav />
      {/* Spacer so content clears the fixed nav (64px nav + safe-area-inset-top for iOS notch) */}
      <div className="flex-shrink-0" style={{ height: 'calc(64px + env(safe-area-inset-top))' }} />
      <main className="relative flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 min-w-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
