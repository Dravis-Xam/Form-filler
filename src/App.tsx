import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Canvas from './components/Canvas'
import Form from './components/Form/Form'
import SpreadsheetUpload from './components/SpreadsheetUpload'
import { marriageCertificateForm, type MarriageCertificateForm } from './constants/FormObject'
import './App.css'

const STORAGE_KEY = 'marriage-certificate-form'
const SECTION_IDS = ['ceremony', 'bridegroom', 'bride', 'registration'] as const
type SectionId = (typeof SECTION_IDS)[number]

function getSectionFromPath(pathname: string): SectionId {
  const section = pathname.split('/')[2]
  return SECTION_IDS.includes(section as SectionId) ? section as SectionId : SECTION_IDS[0]
}

function isWorkspacePath(pathname: string) {
  return pathname === '/workspace' || pathname.startsWith('/workspace/')
}

function loadSavedForm(): MarriageCertificateForm {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...structuredClone(marriageCertificateForm), ...JSON.parse(saved) } : structuredClone(marriageCertificateForm)
  } catch {
    return structuredClone(marriageCertificateForm)
  }
}

export default function App() {
  const [form, setForm] = useState<MarriageCertificateForm>(loadSavedForm)
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const showWorkspace = isWorkspacePath(pathname)
  const showSpreadsheetUpload = pathname === '/upload'
  const activeSection = getSectionFromPath(pathname)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
  }, [form])

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (isWorkspacePath(pathname) && !pathname.match(/^\/workspace\/(ceremony|bridegroom|bride|registration)\/?$/)) {
      const normalizedPath = '/workspace/ceremony'
      window.history.replaceState({}, '', normalizedPath)
    }
  }, [pathname])

  function navigate(path: string) {
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setPathname(path)
  }

  if (showSpreadsheetUpload) {
    return <SpreadsheetUpload onBack={() => navigate('/')} />
  }

  if (!showWorkspace) {
    return (
      <main className="hero">
        <img className="hero__background-image" src="/wedding-rings.png" alt="" aria-hidden="true" />
        <motion.div
          className="hero__content"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.12 } },
          }}
        >
          <motion.p className="hero__eyebrow" variants={reveal} transition={{ duration: 0.55, ease: 'easeOut' }}>
            Marriage certificate filler
          </motion.p>
          <motion.h1 variants={reveal} transition={{ duration: 0.65, ease: 'easeOut' }}>
            Make the paperwork<br />part simple.
          </motion.h1>
          <motion.p className="hero__description" variants={reveal} transition={{ duration: 0.55, ease: 'easeOut' }}>
            Fill out your marriage certificate with less hassle and more time for what matters.
          </motion.p>
          <motion.div className="hero__actions" variants={reveal} transition={{ duration: 0.55, ease: 'easeOut' }}>
            <button className="hero__start" type="button" onClick={() => navigate('/workspace/ceremony')}>Start</button>
            <button className="hero__existing" type="button" onClick={() => navigate('/upload')}>
              Already have the form data?
            </button>
          </motion.div>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="workspace">
      <header className="workspace__topbar">
        <a className="workspace__brand" href="/" aria-label="Marriage certificate filler home" onClick={(event) => {
          event.preventDefault()
          navigate('/')
        }}>
          <span className="workspace__brand-mark" aria-hidden="true">&amp;</span>
          <span>Certificate Studio</span>
        </a>
        <span className="workspace__status"><span />Draft saved locally</span>
      </header>
      <div className="workspace__columns">
        <Form form={form} onChange={setForm} activeTab={activeSection} onTabChange={(section) => navigate(`/workspace/${section}`)} />
        <Canvas form={form} />
      </div>
    </main>
  )
}

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}
