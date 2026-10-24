import { useState } from 'react'
import Canvas from './components/Canvas'
import Form from './components/Form/Form'
import { marriageCertificateForm, type MarriageCertificateForm } from './constants/FormObject'
import './App.css'

export default function App() {
  const [form, setForm] = useState<MarriageCertificateForm>(() => structuredClone(marriageCertificateForm))

  return (
    <main className="workspace">
      <header className="workspace__topbar">
        <a className="workspace__brand" href="/" aria-label="Marriage certificate filler home">
          <span className="workspace__brand-mark" aria-hidden="true">&amp;</span>
          <span>Certificate Studio</span>
        </a>
        <span className="workspace__status"><span />Draft saved locally</span>
      </header>
      <div className="workspace__columns">
        <Form form={form} onChange={setForm} />
        <Canvas form={form} />
      </div>
    </main>
  )
}
