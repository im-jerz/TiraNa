function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sage animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-teal animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-2xl font-bold tracking-widest uppercase text-charcoal">TiraNa</h1>
          <p className="text-sm text-gray-400 tracking-wide">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default Loading
