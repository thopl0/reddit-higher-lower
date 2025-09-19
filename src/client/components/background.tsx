import type React from 'react';

function BackGround({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />

      <div className="absolute inset-0 opacity-30">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(249, 115, 22, 0.4) 1px, transparent 1px),
              linear-gradient(0deg, rgba(239, 68, 68, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="absolute inset-0 opacity-25">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at center, rgba(249, 115, 22, 0.6) 1px, transparent 1px),
              radial-gradient(circle at center, rgba(239, 68, 68, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px, 96px 96px',
            backgroundPosition: '0 0, 32px 32px',
          }}
        />
      </div>

      <div className="absolute inset-0 opacity-15">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(249, 115, 22, 0.3) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(239, 68, 68, 0.2) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(34, 197, 94, 0.2) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(59, 130, 246, 0.15) 75%)
            `,
            backgroundSize: '48px 48px, 48px 48px, 48px 48px, 48px 48px',
            backgroundPosition: '0 0, 0 24px, 24px -24px, -24px 0px',
          }}
        />
      </div>

      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/20 blur-3xl animate-pulse"
        style={{
          clipPath: 'circle(50% at 50% 50%)',
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-red-500/15 blur-3xl animate-pulse"
        style={{
          clipPath: 'circle(50% at 50% 50%)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute top-1/2 right-1/3 w-56 h-56 bg-green-500/12 blur-3xl animate-pulse"
        style={{
          clipPath: 'circle(50% at 50% 50%)',
          animationDelay: '4s',
        }}
      />

      {children}

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-green-400 to-transparent" />
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-orange-400 to-transparent" />

      <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-orange-400 animate-ping" />
      <div
        className="absolute top-2/3 right-1/5 w-2 h-2 bg-red-400 animate-ping"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-1 h-1 bg-green-400 animate-ping"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-blue-400 animate-ping"
        style={{ animationDelay: '3s' }}
      />
    </div>
  );
}

export default BackGround;
