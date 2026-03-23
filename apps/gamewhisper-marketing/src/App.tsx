import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'
import PoweredBy from './components/sections/PoweredBy'
import Problem from './components/sections/Problem'
import Demo from './components/sections/Demo'
import Credibility from './components/sections/Credibility'
import FAQ from './components/sections/FAQ'
import FinalCTA from './components/sections/FinalCTA'

export default function App() {
  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>
      <Nav />
      <main>
        <Hero />
        <PoweredBy />
        <Problem />
        <Demo />
        <WispSection />
        <Credibility />
        <FAQ />
        <FinalCTA />
      </main>
    </div>
  )
}
