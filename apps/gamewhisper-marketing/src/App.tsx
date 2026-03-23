import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'
import PoweredBy from './components/sections/PoweredBy'
import BenefitStrip from './components/sections/BenefitStrip'
import Problem from './components/sections/Problem'
import HowItWorks from './components/sections/HowItWorks'
import UseCases from './components/sections/UseCases'
import Demo from './components/sections/Demo'
import WispSection from './components/sections/WispSection'
import Comparison from './components/sections/Comparison'
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
        <BenefitStrip />
        <Problem />
        <HowItWorks />
        <UseCases />
        <Demo />
        <WispSection />
        <Comparison />
        <Credibility />
        <FAQ />
        <FinalCTA />
      </main>
    </div>
  )
}
