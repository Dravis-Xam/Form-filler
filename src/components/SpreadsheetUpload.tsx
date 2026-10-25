import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import {
  importMarriageWorkbook,
  type ImportedWorkbook,
} from '../handlers/ExcelInput'

interface SpreadsheetUploadProps {
  onBack: () => void
}

export default function SpreadsheetUpload({ onBack }: SpreadsheetUploadProps) {
  const reduceMotion = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const [workbook, setWorkbook] = useState<ImportedWorkbook | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const reveal = reduceMotion ? undefined : { opacity: 0, y: 14 }
  const enter = { opacity: 1, y: 0 }

  async function handleFile(file?: File) {
    if (!file) return
    setError('')
    setIsLoading(true)
    setFileName(file.name)
    try {
      setWorkbook(await importMarriageWorkbook(file))
    } catch (importError) {
      setWorkbook(null)
      setError(importError instanceof Error ? importError.message : 'Could not read this spreadsheet.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    void handleFile(event.dataTransfer.files[0])
  }

  async function handleSheetChange(event: ChangeEvent<HTMLSelectElement>) {
    const sheet = event.target.value
    const file = inputRef.current?.files?.[0]
    if (file) await handleFileForSheet(file, sheet)
  }

  async function handleFileForSheet(file: File, sheet: string) {
    setError('')
    setIsLoading(true)
    try {
      setWorkbook(await importMarriageWorkbook(file, sheet))
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Could not read this worksheet.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="upload-page">
      <motion.header
        className="upload-page__topbar"
        initial={reveal}
        animate={enter}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <button className="upload-page__back" type="button" onClick={onBack} aria-label="Back to home">
          <span aria-hidden="true">←</span> Home
        </button>
        <span className="upload-page__brand"><span aria-hidden="true">&amp;</span> Certificate Studio</span>
      </motion.header>

      <section className="upload-page__content" aria-labelledby="upload-title">
        <motion.div
          className="upload-page__heading"
          initial={reveal}
          animate={enter}
          transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.08, ease: 'easeOut' }}
        >
          <p className="upload-page__eyebrow">Spreadsheet import</p>
          <h1 id="upload-title">Bring your records in.</h1>
          <p>Upload an Excel workbook to review its sheets, columns, and records.</p>
        </motion.div>

        <input
          ref={inputRef}
          className="upload-page__file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          aria-label="Choose an Excel workbook"
        />

        <motion.div
          className="upload-dropzone"
          initial={reveal}
          animate={enter}
          transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.16, ease: 'easeOut' }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <span className="upload-dropzone__icon" aria-hidden="true">⇧</span>
          <h2>{fileName || 'Choose a workbook'}</h2>
          <p>{isLoading ? 'Reading workbook…' : 'Excel workbook · .xlsx or .xls'}</p>
          <button className="upload-dropzone__button" type="button" disabled={isLoading} onClick={() => inputRef.current?.click()}>
            {isLoading ? 'Importing…' : 'Browse files'}
          </button>
        </motion.div>

        {error && (
          <motion.p className="upload-page__error" role="alert" initial={reveal} animate={enter}>
            {error}
          </motion.p>
        )}

        {workbook && (
          <motion.section
            className="upload-summary"
            aria-label="Imported workbook summary"
            initial={reveal}
            animate={enter}
            transition={{ duration: 0.45, delay: reduceMotion ? 0 : 0.1, ease: 'easeOut' }}
          >
            <div className="upload-summary__header">
              <div>
                <p className="upload-summary__eyebrow">Workbook ready</p>
                <h2>{workbook.selectedSheet}</h2>
              </div>
              <span className="upload-summary__count">{workbook.records.length} records</span>
            </div>
            {workbook.sheetNames.length > 1 && (
              <label className="upload-summary__sheet-label">
                Worksheet
                <select value={workbook.selectedSheet} onChange={(event) => void handleSheetChange(event)}>
                  {workbook.sheetNames.map((sheet) => <option key={sheet} value={sheet}>{sheet}</option>)}
                </select>
              </label>
            )}
            <div className="upload-summary__columns">
              <h3>Columns ({workbook.headers.length})</h3>
              <ul>
                {workbook.headers.map((header) => <li key={header}>{header}</li>)}
              </ul>
            </div>
            <p className="upload-summary__next">Column mapping and record preview will be available in the next step.</p>
          </motion.section>
        )}
      </section>
    </main>
  )
}
