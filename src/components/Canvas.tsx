import { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import marriageCertificatePdf from '../assets/marriage.pdf'
import type { MarriageCertificateForm } from '../constants/FormObject'
import { createCoordinateMatrix, scaleCoordinate } from '../utils/coordinateMatrix'
import { overlayFields, readOverlayValue } from '../utils/overlayFields'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

interface CanvasProps {
	form: MarriageCertificateForm
}

export default function Canvas({ form }: CanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const frameRef = useRef<HTMLDivElement>(null)
	const pageRef = useRef<HTMLDivElement>(null)
	const [error, setError] = useState(false)
	const [coordinateMatrix, setCoordinateMatrix] = useState<ReturnType<typeof createCoordinateMatrix> | null>(null)

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
				if (pageRef.current) {
					pageRef.current.style.width = `${viewport.width}px`
					pageRef.current.style.height = `${viewport.height}px`
					setCoordinateMatrix(createCoordinateMatrix(
						baseViewport.width,
						baseViewport.height,
						viewport.width,
						viewport.height,
					))
				}
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
					<div className="preview-panel__page" ref={pageRef}>
						<canvas className="preview-panel__document" ref={canvasRef} aria-label="First page of the marriage certificate" />
						{overlayFields.map((field) => {
							const value = readOverlayValue(form, field)
							if (!value) return null
							return (
								<span
									className="preview-panel__value"
									key={field.path.join('-')}
									style={coordinateMatrix ? {
										left: `${scaleCoordinate(field.x / 100 * coordinateMatrix.referenceWidth, coordinateMatrix.scaleX)}px`,
										top: `${scaleCoordinate(field.y / 100 * coordinateMatrix.referenceHeight, coordinateMatrix.scaleY)}px`,
										width: `${scaleCoordinate(field.width / 100 * coordinateMatrix.referenceWidth, coordinateMatrix.scaleX)}px`,
										fontSize: `${Math.max(5, scaleCoordinate((field.fontSize ?? 0.72) / 100 * coordinateMatrix.referenceWidth, coordinateMatrix.uniformScale))}px`,
									} : undefined}
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
