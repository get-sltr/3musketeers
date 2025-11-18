export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Lime dot grid logo */}
        <div className="flex justify-center mb-8">
          <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3].map((col) => {
                const x = 15 + col * 20;
                const y = 15 + row * 20;
                const isMiddle = (row === 1 || row === 2) && (col === 1 || col === 2);
                const radius = isMiddle ? 8 : 5;
                return (
                  <circle
                    key={`${row}-${col}`}
                    cx={x}
                    cy={y}
                    r={radius}
                    fill="#ccff00"
                    className="animate-pulse"
                  />
                );
              })
            )}
          </svg>
        </div>
        
        <h1 className="text-4xl font-black text-lime-400 mb-4 tracking-wider">
          OFFLINE
        </h1>
        
        <p className="text-white/60 text-lg mb-8">
          No internet connection. Check your network and try again.
        </p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-lime-400 text-black rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300"
          style={{ boxShadow: '0 0 30px rgba(204, 255, 0, 0.3)' }}
        >
          Retry
        </button>
        
        <div className="mt-12 text-white/40 text-sm">
          <p>You can still view cached content</p>
        </div>
      </div>
    </div>
  );
}
