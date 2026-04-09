
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import CyberpunkMatrixBackground from './components/CyberpunkMatrixBackground';
import TransactionHUD from './components/TransactionHUD';
import { useLiquidityAgent } from './hooks/useLiquidityAgent';

function App() {
  const { bestPath, transactions } = useLiquidityAgent();
  const count = transactions.length;

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden font-mono">
      {/* 1. Backdrop: Generative background, z-index: 0 */}
      <CyberpunkMatrixBackground />

      {/* 2. HUD: Overlay layer, z-index: 10 */}
      <TransactionHUD bestPath={bestPath} transactions={transactions} />

      {/* 3. Content: Hero and sections, z-index: 5 */}
      <div className="relative z-5 flex flex-col items-center">
        <section id="center" className="min-h-screen flex flex-col items-center justify-center p-8">
          <div className="hero mb-8">
            <img src={heroImg} className="base animate-glow-pulse rounded-full" width="170" height="179" alt="" />
            <img src={reactLogo} className="framework" alt="React logo" />
            <img src={viteLogo} className="vite" alt="Vite logo" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-500 to-yellow-400 mb-4 animate-pulse uppercase">
              Nexus AI
            </h1>
            <p className="text-white/60">
              Autonomous Liquidity Optimization Engine
            </p>
          </div>
          <div
            className="counter px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white transition-colors"
          >
            Network Pulses: {count}
          </div>
        </section>

        <div className="ticks w-full"></div>

        <section id="next-steps" className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 p-12 text-white/80">
          <div id="docs">
            <svg className="icon w-8 h-8 mb-4 text-emerald-400" role="presentation" aria-hidden="true">
              <use href="/icons.svg#documentation-icon"></use>
            </svg>
            <h2 className="text-xl font-bold mb-2">Documentation</h2>
            <p className="text-sm opacity-60">Technical architecture and agent optimization strategies.</p>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="https://vite.dev/" target="_blank" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                  <img className="w-4 h-4" src={viteLogo} alt="" />
                  Explorer
                </a>
              </li>
              <li>
                <a href="https://react.dev/" target="_blank" className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                  <img className="w-4 h-4" src={reactLogo} alt="" />
                  Framework
                </a>
              </li>
            </ul>
          </div>
          <div id="social">
            <svg className="icon w-8 h-8 mb-4 text-purple-400" role="presentation" aria-hidden="true">
              <use href="/icons.svg#social-icon"></use>
            </svg>
            <h2 className="text-xl font-bold mb-2">Connect</h2>
            <p className="text-sm opacity-60">Join the collective of autonomous finance.</p>
            <ul className="mt-4 flex flex-wrap gap-4">
              <li>
                <a href="https://github.com/vitejs/vite" target="_blank" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4 fill-current">
                    <use href="/icons.svg#github-icon"></use>
                  </svg>
                  Source
                </a>
              </li>
              <li>
                <a href="https://chat.vite.dev/" target="_blank" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4 fill-current">
                    <use href="/icons.svg#discord-icon"></use>
                  </svg>
                  Neural
                </a>
              </li>
            </ul>
          </div>
        </section>

        <div className="ticks w-full"></div>
        <section id="spacer" className="h-24"></section>
      </div>
    </div>
  )
}

export default App
