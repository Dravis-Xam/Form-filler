import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import marriageCertificatePdf from '../assets/marriage.pdf'
import type { MarriageCertificateForm } from '../constants/FormObject'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

interface CanvasProps {
	form: MarriageCertificateForm
}

interface OverlayField {
	path: (string | number)[]
	combineWith?: (string | number)[]
	x: number
	y: number
	width: number
	fontSize?: number
}

const overlayFields: OverlayField[] = [
	{ path: ['ceremony', 'solemnizedAt'], x: 29, y: 19.4, width: 12 },
	{ path: ['ceremony', 'location'], x: 44, y: 19.4, width: 10 },
	{ path: ['ceremony', 'subCounty'], combineWith: ['ceremony', 'county'], x: 61, y: 19.4, width: 21 },
	{ path: ['ceremony', 'dateOfMarriage'], x: 17, y: 23.4, width: 32 },
	{ path: ['ceremony', 'marriageEntryNumber'], x: 50, y: 23.4, width: 31 },
	{ path: ['bridegroom', 'name'], x: 17, y: 27.6, width: 31 },
	{ path: ['bridegroom', 'age'], x: 55, y: 25.8, width: 11 },
	{ path: ['bridegroom', 'maritalStatus'], x: 73, y: 25.8, width: 17 },
	{ path: ['bridegroom', 'residenceAtMarriage'], x: 34, y: 32.3, width: 31 },
	{ path: ['bridegroom', 'county'], x: 56, y: 32.3, width: 11 },
	{ path: ['bridegroom', 'subCounty'], x: 73, y: 32.3, width: 17 },
	{ path: ['bridegroom', 'occupation'], x: 24, y: 35.9, width: 64 },
	{ path: ['bridegroom', 'father', 'name'], x: 26, y: 39.2, width: 31 },
	{ path: ['bridegroom', 'mother', 'name'], x: 60, y: 39.2, width: 31 },
	{ path: ['bridegroom', 'father', 'occupation'], x: 26, y: 42.5, width: 31 },
	{ path: ['bridegroom', 'mother', 'occupation'], x: 60, y: 42.5, width: 31 },
	{ path: ['bridegroom', 'father', 'residence'], x: 26, y: 45.7, width: 31 },
	{ path: ['bridegroom', 'mother', 'residence'], x: 60, y: 45.7, width: 31 },
	{ path: ['bride', 'name'], x: 17, y: 49.1, width: 31 },
	{ path: ['bride', 'age'], x: 53, y: 46.7, width: 11 },
	{ path: ['bride', 'maritalStatus'], x: 71, y: 46.7, width: 17 },
	{ path: ['bride', 'residenceAtMarriage'], x: 32, y: 53, width: 31 },
	{ path: ['bride', 'county'], x: 53, y: 53, width: 11 },
	{ path: ['bride', 'subCounty'], x: 71, y: 53, width: 17 },
	{ path: ['bride', 'occupation'], x: 23, y: 56.2, width: 64 },
	{ path: ['bride', 'father', 'name'], x: 24, y: 59.4, width: 31 },
	{ path: ['bride', 'mother', 'name'], x: 57, y: 59.4, width: 31 },
	{ path: ['bride', 'father', 'occupation'], x: 22, y: 62.5, width: 31 },
	{ path: ['bride', 'mother', 'occupation'], x: 56, y: 62.5, width: 31 },
	{ path: ['bride', 'father', 'residence'], x: 22, y: 65.5, width: 31 },
	{ path: ['bride', 'mother', 'residence'], x: 56, y: 65.5, width: 31 },
	{ path: ['registration', 'marriedIn'], x: 24, y: 71.6, width: 25 },
	{ path: ['registration', 'registrarCertificateOrSpecialLicenseNumber'], x: 63, y: 71.6, width: 19},
	{ path: ['registration', 'officiatedBy'], x: 58, y: 74.8, width: 19 },
	{ path: ['registration', 'parties', 0], x: 27, y: 78.5, width: 21 },
	{ path: ['registration', 'parties', 1], x: 27, y: 82.5, width: 21 },
	{ path: ['registration', 'witnesses', 0], x: 58, y: 78.5, width: 18 },
	{ path: ['registration', 'witnesses', 1], x: 58, y: 82.5, width: 18 },
]

function readPath(form: MarriageCertificateForm, path: (string | number)[]) {
	let value: unknown = form
	for (const part of path) {
		if (value === null || typeof value !== 'object') return ''
		value = (value as Record<string | number, unknown>)[part]
	}
	return typeof value === 'string' ? value : ''
}

function readOverlayValue(form: MarriageCertificateForm, field: OverlayField) {
	const value = readPath(form, field.path)
	const combinedValue = field.combineWith ? readPath(form, field.combineWith) : ''
	return [value, combinedValue].filter(Boolean).join(', ')
}

export default function Canvas({ form }: CanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const frameRef = useRef<HTMLDivElement>(null)
	const [error, setError] = useState(false)

	useEffect(() => {
		let disposed = false
		let renderTask: pdfjs.RenderTask | undefined
		let resizeObserver: ResizeObserver | undefined
		const loadingTask = pdfjs.getDocument({ url: marriageCertificatePdf })

		loadingTask.promise.then(async (document) => {
			const page = await document.getPage(1)
			const canvas = canvasRef.current
			const frame = frameRef.current
			const context = canvas?.getContext('2d')
			if (!canvas || !frame || !context || disposed) return

			const renderPage = () => {
				if (disposed) return
				const baseViewport = page.getViewport({ scale: 1 })
				const frameStyle = window.getComputedStyle(frame)
				const horizontalPadding = Number.parseFloat(frameStyle.paddingLeft) + Number.parseFloat(frameStyle.paddingRight)
				const scale = (frame.clientWidth - horizontalPadding) / baseViewport.width
				const viewport = page.getViewport({ scale })
				const pixelRatio = window.devicePixelRatio || 1
				canvas.width = Math.floor(viewport.width * pixelRatio)
				canvas.height = Math.floor(viewport.height * pixelRatio)
				canvas.style.width = `${viewport.width}px`
				canvas.style.height = `${viewport.height}px`
				context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
				const previousTask = renderTask
				const draw = () => {
					if (disposed) return
					renderTask = page.render({ canvas, canvasContext: context, viewport })
					renderTask.promise.catch((renderError: unknown) => {
						if (!disposed && !(renderError instanceof pdfjs.RenderingCancelledException)) setError(true)
					})
				}

				if (previousTask) {
					previousTask.cancel()
					previousTask.promise.catch(() => undefined).finally(draw)
				} else {
					draw()
				}
			}

			renderPage()
			resizeObserver = new ResizeObserver(renderPage)
			resizeObserver.observe(frame)
		}).catch((loadError: unknown) => {
			if (!disposed && !(loadError instanceof pdfjs.RenderingCancelledException)) setError(true)
		})

		return () => {
			disposed = true
			resizeObserver?.disconnect()
			renderTask?.cancel()
			void loadingTask.destroy()
		}
	}, [])

	return (
		<aside className="preview-panel" aria-label="Marriage certificate preview">
			<header className="preview-panel__header">
				<div>
					<p className="preview-panel__eyebrow">Live preview</p>
					<h2>Marriage certificate</h2>
				</div>
				<a className="preview-panel__open" href={marriageCertificatePdf} target="_blank" rel="noreferrer" aria-label="Open PDF in a new tab" title="Open PDF in a new tab">
					↗
				</a>
			</header>
			<div className="preview-panel__canvas" ref={frameRef}>
				{error ? (
					<p className="preview-panel__error">The certificate preview could not be loaded.</p>
				) : (
					<div className="preview-panel__page">
						<canvas className="preview-panel__document" ref={canvasRef} aria-label="First page of the marriage certificate" />
						{overlayFields.map((field) => {
							const value = readOverlayValue(form, field)
							if (!value) return null
							return (
								<span
									className="preview-panel__value"
									key={field.path.join('-')}
									style={{ left: `${field.x}%`, top: `${field.y}%`, width: `${field.width}%`, fontSize: `clamp(5px, ${field.fontSize ?? 0.72}cqw, 12px)` }}
									title={value}
								>
									{value}
								</span>
							)
						})}
					</div>
				)}
			</div>
		</aside>
	)
}
