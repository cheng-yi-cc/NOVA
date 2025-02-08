export function Logo() {
  return (
    <div className="flex justify-center py-6">
      <h1 className="text-[#ff6b4a] text-6xl font-bold tracking-wider relative">
        <span className="relative">
          NVOA
          {/* White bandage accents */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-3 bg-white rotate-[-10deg] absolute top-1/2 transform -translate-y-1/2" />
            <div className="w-full h-3 bg-white rotate-[10deg] absolute top-1/2 transform -translate-y-1/2" />
          </div>
        </span>
      </h1>
    </div>
  )
}

