/**
 * Animated searchlights inspired by vintage Hollywood premiere spotlights.
 * Pure CSS animations — no JS runtime cost.
 */
export default function Searchlights() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Left searchlight */}
      <div
        className="absolute -bottom-10 left-[10%] h-[140%] w-[120px] origin-bottom animate-searchlight-left"
        style={{
          background: 'linear-gradient(to top, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0.08) 40%, transparent 75%)',
          filter: 'blur(20px)',
          borderRadius: '50% 50% 0 0',
        }}
      />
      {/* Left searchlight — bright core */}
      <div
        className="absolute -bottom-10 left-[10%] h-[140%] w-[40px] origin-bottom animate-searchlight-left"
        style={{
          background: 'linear-gradient(to top, rgba(167,139,250,0.5) 0%, rgba(167,139,250,0.1) 30%, transparent 60%)',
          filter: 'blur(8px)',
          borderRadius: '50% 50% 0 0',
        }}
      />

      {/* Right searchlight */}
      <div
        className="absolute -bottom-10 right-[10%] h-[140%] w-[120px] origin-bottom animate-searchlight-right"
        style={{
          background: 'linear-gradient(to top, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0.06) 40%, transparent 75%)',
          filter: 'blur(20px)',
          borderRadius: '50% 50% 0 0',
        }}
      />
      {/* Right searchlight — bright core */}
      <div
        className="absolute -bottom-10 right-[10%] h-[140%] w-[40px] origin-bottom animate-searchlight-right"
        style={{
          background: 'linear-gradient(to top, rgba(251,191,36,0.45) 0%, rgba(251,191,36,0.08) 30%, transparent 60%)',
          filter: 'blur(8px)',
          borderRadius: '50% 50% 0 0',
        }}
      />

      {/* Center searchlight — subtle accent */}
      <div
        className="absolute -bottom-10 left-[48%] h-[140%] w-[80px] origin-bottom animate-searchlight-center"
        style={{
          background: 'linear-gradient(to top, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0.05) 35%, transparent 65%)',
          filter: 'blur(16px)',
          borderRadius: '50% 50% 0 0',
        }}
      />

      {/* Ground glow — the "source" of the searchlights */}
      <div className="absolute -bottom-4 left-[8%] h-8 w-16 rounded-full bg-violet-400/40 blur-xl" />
      <div className="absolute -bottom-4 right-[8%] h-8 w-16 rounded-full bg-amber-400/35 blur-xl" />
      <div className="absolute -bottom-4 left-[47%] h-6 w-12 rounded-full bg-indigo-400/30 blur-xl" />
    </div>
  )
}
