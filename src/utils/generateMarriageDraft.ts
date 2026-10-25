import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { MarriageCertificateForm } from '../constants/FormObject'
import { overlayFields, readOverlayValue } from './overlayFields'

const originalPdfUrl = new URL('../assets/marriage.pdf', import.meta.url).href
const defaultFontSize = 8
const minimumFontSize = 4

export async function generateMarriageDraft(form: MarriageCertificateForm): Promise<Uint8Array> {
	const response = await fetch(originalPdfUrl)
	if (!response.ok) throw new Error(`Could not load the original certificate (HTTP ${response.status}).`)

	const pdfDocument = await PDFDocument.load(await response.arrayBuffer())
	const page = pdfDocument.getPage(0)
	if (!page) throw new Error('The original certificate does not contain a page to fill.')

	const font = await pdfDocument.embedFont(StandardFonts.Helvetica)
	const { width: pageWidth, height: pageHeight } = page.getSize()

	for (const field of overlayFields) {
		const value = readOverlayValue(form, field).trim()
		if (!value) continue

		const x = (field.x / 100) * pageWidth
		const fieldWidth = (field.width / 100) * pageWidth
		const top = (field.y / 100) * pageHeight
		let fontSize = defaultFontSize
		let fittedValue = value

		while (font.widthOfTextAtSize(fittedValue, fontSize) > fieldWidth && fontSize > minimumFontSize) {
			fontSize = Math.max(minimumFontSize, fontSize - 0.25)
		}

		if (font.widthOfTextAtSize(fittedValue, fontSize) > fieldWidth) {
			const characters = Array.from(value)
			while (characters.length > 1 && font.widthOfTextAtSize(`${characters.join('')}…`, fontSize) > fieldWidth) {
				characters.pop()
			}
			fittedValue = characters.length < Array.from(value).length ? `${characters.join('')}…` : characters.join('')
		}

		const textHeight = font.heightAtSize(fontSize)
		page.drawText(fittedValue, {
			x,
			y: pageHeight - top - textHeight,
			font,
			size: fontSize,
			color: rgb(0.07, 0.07, 0.07),
		})
	}

	return pdfDocument.save()
}

export async function exportMarriageDraft(form: MarriageCertificateForm): Promise<void> {
	const bytes = await generateMarriageDraft(form)
	const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = 'marriage-certificate-draft.pdf'
	document.body.appendChild(link)
	link.click()
	link.remove()
	window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function printMarriageDraft(form: MarriageCertificateForm): Promise<void> {
	const printWindow = window.open('', '_blank')
	if (!printWindow) {
		await exportMarriageDraft(form)
		return
	}

	try {
		const bytes = await generateMarriageDraft(form)
		const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
		const pdfUrl = URL.createObjectURL(blob)
		printWindow.location.replace(pdfUrl)
	} catch (error) {
		printWindow.close()
		throw error
	}
}
