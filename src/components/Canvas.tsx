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
	focusedField: string | null
}

const PREVIEW_ZOOM = 2.2

export default function Canvas({ form, focusedField }: CanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const frameRef = useRef<HTMLDivElement>(null)
	const pageRef = useRef<HTMLDivElement>(null)
	const zoomScaleRef = useRef(1)
	const [error, setError] = useState(false)
	const [coordinateMatrix, setCoordinateMatrix] = useState<ReturnType<typeof createCoordinateMatrix> | null>(null)
	const focusedOverlay = overlayFields.find((field) => (
		field.path.join('-') === focusedField || field.combineWith?.join('-') === focusedField
	))

	useEffect(() => {
		const frame = frameRef.current
		if (!frame || !coordinateMatrix) return
		const zoom = focusedOverlay ? PREVIEW_ZOOM : 1
		zoomScaleRef.current = zoom
		if (pageRef.current) {
			pageRef.current.style.width = `${coordinateMatrix.targetWidth * zoom}px`
			pageRef.current.style.height = `${coordinateMatrix.targetHeight * zoom}px`
			pageRef.current.style.marginBlock = focusedOverlay ? `${frame.clientHeight / 2}px` : '0'
		}
		if (canvasRef.current) {
			canvasRef.current.style.width = `${coordinateMatrix.targetWidth * zoom}px`
			canvasRef.current.style.height = `${coordinateMatrix.targetHeight * zoom}px`
		}

		if (!focusedOverlay) {
			frame.scrollTo({ left: 0, top: 0, behavior: 'smooth' })
			return
		}

		window.requestAnimationFrame(() => {
			const marker = pageRef.current?.querySelector<HTMLElement>(`[data-field-path="${focusedOverlay.path.join('-')}"]`)
			const currentFrame = frameRef.current
			if (!marker || !currentFrame) return

			const markerRect = marker.getBoundingClientRect()
			const frameRect = currentFrame.getBoundingClientRect()
			const style = window.getComputedStyle(currentFrame)
			const leftInset = Number.parseFloat(style.paddingLeft)
			const rightInset = Number.parseFloat(style.paddingRight)
			const topInset = Number.parseFloat(style.paddingTop)
			const bottomInset = Number.parseFloat(style.paddingBottom)
			const centerX = (currentFrame.clientWidth - leftInset - rightInset) / 2 + leftInset
			const centerY = (currentFrame.clientHeight - topInset - bottomInset) / 2 + topInset

			currentFrame.scrollTo({
				left: currentFrame.scrollLeft + markerRect.left - frameRect.left + markerRect.width / 2 - centerX,
				top: currentFrame.scrollTop + markerRect.top - frameRect.top + markerRect.height / 2 - centerY,
				behavior: 'smooth',
			})
		})
	}, [focusedField, focusedOverlay, coordinateMatrix])

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
				canvas.style.width = `${viewport.width * zoomScaleRef.current}px`
				canvas.style.height = `${viewport.height * zoomScaleRef.current}px`
				if (pageRef.current) {
					pageRef.current.style.width = `${viewport.width * zoomScaleRef.current}px`
					pageRef.current.style.height = `${viewport.height * zoomScaleRef.current}px`
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
							return (
								<span
									className="preview-panel__value"
									data-field-path={field.path.join('-')}
									key={field.path.join('-')}
									style={coordinateMatrix ? {
										left: `${scaleCoordinate(field.x / 100 * coordinateMatrix.referenceWidth, coordinateMatrix.scaleX) * (focusedOverlay ? PREVIEW_ZOOM : 1)}px`,
										top: `${scaleCoordinate(field.y / 100 * coordinateMatrix.referenceHeight, coordinateMatrix.scaleY) * (focusedOverlay ? PREVIEW_ZOOM : 1)}px`,
										width: `${scaleCoordinate(field.width / 100 * coordinateMatrix.referenceWidth, coordinateMatrix.scaleX) * (focusedOverlay ? PREVIEW_ZOOM : 1)}px`,
										fontSize: `${Math.max(5, scaleCoordinate((field.fontSize ?? 0.72) / 100 * coordinateMatrix.referenceWidth, coordinateMatrix.uniformScale))}px`,
									} : undefined}
									title={value || undefined}
									aria-hidden="true"
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
