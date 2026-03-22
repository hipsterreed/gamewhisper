import Nav from './components/sections/Nav'
import Hero from './components/sections/Hero'
import BenefitStrip from './components/sections/BenefitStrip'
import EmotionalFraming from './components/sections/EmotionalFraming'
import Problem from './components/sections/Problem'
import HowItWorks from './components/sections/HowItWorks'
import UseCases from './components/sections/UseCases'
import Features from './components/sections/Features'
import WispSection from './components/sections/WispSection'
import SupportedGames from './components/sections/SupportedGames'
import Demo from './components/sections/Demo'
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
        <BenefitStrip />
        <EmotionalFraming />
        <Problem />
        <HowItWorks />
        <UseCases />
        <Features />
        <WispSection />
        <SupportedGames />
        <Demo />
        <Comparison />
        <Credibility />
        <FAQ />
        <FinalCTA />
      </main>
    </div>
  )
}
