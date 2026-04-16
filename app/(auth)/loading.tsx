// app/(auth)/loading.tsx

export default function AuthLoading() {
  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center"
      style={{ backgroundImage: 'radial-gradient(circle, #E4DED8 1px, transparent 1px)', backgroundSize: '24px 24px' }}
    >
      <div className="w-full max-w-[400px] px-4 animate-pulse">
        <div className="flex justify-center mb-8">
          <div className="h-8 w-32 rounded bg-surface" />
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-modal p-8">
          <div className="h-6 w-40 rounded bg-surface mb-2" />
          <div className="h-4 w-56 rounded bg-surface mb-6" />
          <div className="space-y-3">
            <div className="h-11 w-full rounded-xl bg-surface" />
            <div className="h-11 w-full rounded-xl bg-surface" />
            <div className="h-11 w-full rounded-xl bg-surface" />
          </div>
        </div>
      </div>
    </div>
  )
}
