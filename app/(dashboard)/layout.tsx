import Nav from '@/components/Nav'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col">
      <Nav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-5 py-6 sm:py-10 animate-fade-in">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <footer className="max-w-5xl mx-auto w-full px-5 py-4 border-t border-[#E8E4DC]">
        <p className="text-[11px] text-[#CCC] text-center">
          Powered by{' '}
          <span className="font-medium text-[#BBB]">Claude AI</span>
          {' '}· TableReply
        </p>
      </footer>
    </div>
  )
}
