import Nav from '@/components/Nav'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#ECEAE6] flex flex-col overflow-x-hidden">
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-5 py-6 sm:py-10 animate-fade-in">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

    </div>
  )
}
