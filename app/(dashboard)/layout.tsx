import Nav from '@/components/Nav'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F6F3] flex flex-col overflow-x-hidden">
      <Nav />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 animate-fade-up">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}
