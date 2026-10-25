import { useRef, useState, type ReactNode } from 'react'
import type { MarriageCertificateForm } from '../../constants/FormObject'
import InputGroup from './InputGroup'
import Tabs, { type FormTab } from '../Tabs'
import { printMarriageDraft } from '../../utils/generateMarriageDraft'

const tabs: FormTab[] = [
	{ id: 'ceremony', label: 'Ceremony' },
	{ id: 'bridegroom', label: 'Bridegroom' },
	{ id: 'bride', label: 'Bride' },
	{ id: 'registration', label: 'Registration' },
]

interface FormProps {
	form: MarriageCertificateForm
	onChange: (form: MarriageCertificateForm) => void
	activeTab: string
	onTabChange: (tabId: string) => void
	onFieldFocus: (fieldId: string) => void
}

function formatLabel(value: string) {
	return value
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/^./, (character) => character.toUpperCase())
}

function countFields(value: unknown): { total: number; filled: number } {
	if (typeof value === 'string') {
		return { total: 1, filled: value.trim() ? 1 : 0 }
	}

	if (Array.isArray(value)) {
		return value.reduce((count, item) => {
			const child = countFields(item)
			return { total: count.total + child.total, filled: count.filled + child.filled }
		}, { total: 0, filled: 0 })
	}

	if (value && typeof value === 'object') {
		return Object.values(value).reduce((count, item) => {
			const child = countFields(item)
			return { total: count.total + child.total, filled: count.filled + child.filled }
		}, { total: 0, filled: 0 })
	}

	return { total: 0, filled: 0 }
}

function findFirstEmptyPath(value: unknown, path: (string | number)[] = []): (string | number)[] | null {
	if (typeof value === 'string') return value.trim() ? null : path

	if (Array.isArray(value)) {
		for (let index = 0; index < value.length; index += 1) {
			const emptyPath = findFirstEmptyPath(value[index], [...path, index])
			if (emptyPath) return emptyPath
		}
	}

	if (value && typeof value === 'object') {
		for (const [key, child] of Object.entries(value)) {
			const emptyPath = findFirstEmptyPath(child, [...path, key])
			if (emptyPath) return emptyPath
		}
	}

	return null
}

function setValueAtPath(source: unknown, path: (string | number)[], value: string): unknown {
	const [key, ...remaining] = path
	if (key === undefined) return value

	if (Array.isArray(source)) {
		const next = [...source]
		const index = Number(key)
		next[index] = setValueAtPath(source[index], remaining, value)
		return next
	}

	if (source && typeof source === 'object') {
		const record = source as Record<string, unknown>
		return { ...record, [key]: setValueAtPath(record[String(key)], remaining, value) }
	}

	return source
}

export default function Form({ form, onChange, activeTab, onTabChange, onFieldFocus }: FormProps) {
	const [isPrinting, setIsPrinting] = useState(false)
	const [printError, setPrintError] = useState('')
	const firstIncompleteRef = useRef<HTMLInputElement>(null)
	const { total, filled } = countFields(form)
	const progress = total ? Math.round((filled / total) * 100) : 0
	const incompletePath = findFirstEmptyPath(form)
	const isComplete = incompletePath === null
	const safeActiveTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id
	const safeActiveIndex = tabs.findIndex((tab) => tab.id === safeActiveTab)
	const safeActiveSection = form[safeActiveTab as keyof MarriageCertificateForm]

	function updateField(path: (string | number)[], value: string) {
		onChange(setValueAtPath(form, path, value) as MarriageCertificateForm)
	}

	function goToIncompleteField() {
		if (!incompletePath) return
		onTabChange(String(incompletePath[0]))
		window.requestAnimationFrame(() => {
			firstIncompleteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
			firstIncompleteRef.current?.focus({ preventScroll: true })
		})
	}

	async function handlePrint() {
		setIsPrinting(true)
		setPrintError('')
		try {
			await printMarriageDraft(form)
		} catch (error) {
			setPrintError(error instanceof Error ? error.message : 'Could not generate the certificate PDF.')
		} finally {
			setIsPrinting(false)
		}
	}

	function renderFields(value: unknown, path: (string | number)[]): ReactNode {
		if (typeof value === 'string') {
			const key = String(path[path.length - 1])
			const label = /^\d+$/.test(key)
				? `${formatLabel(String(path[path.length - 2] ?? 'Field'))} ${Number(key) + 1}`
				: formatLabel(key)
			return (
				<InputGroup
					id={path.join('-')}
					key={path.join('-')}
					label={label}
					inputRef={incompletePath?.join('-') === path.join('-') ? firstIncompleteRef : undefined}
					onFocus={() => onFieldFocus(path.join('-'))}
					type={key === 'dateOfMarriage' ? 'date' : 'text'}
					value={value}
					onChange={(nextValue) => updateField(path, nextValue)}
				/>
			)
		}

		if (Array.isArray(value)) {
			return value.map((item, index) => renderFields(item, [...path, index]))
		}

		if (value && typeof value === 'object') {
			return Object.entries(value).map(([key, child]) => {
				const childPath = [...path, key]
				if (typeof child === 'string' || Array.isArray(child)) {
					return renderFields(child, childPath)
				}

				return (
					<section className="form-subsection" key={childPath.join('-')}>
						<h3 className="form-subsection__title">{formatLabel(key)}</h3>
						<div className="form-fields">{renderFields(child, childPath)}</div>
					</section>
				)
			})
		}

		return null
	}

	return (
		<section className="form-panel" aria-labelledby="form-title">
			<header className="form-header">
				<p className="form-header__eyebrow">Marriage certificate</p>
				<div className="form-header__title-row">
					<div>
						<h1 id="form-title">Certificate details</h1>
						<p className="form-header__step">Step {safeActiveIndex + 1} of {tabs.length}</p>
					</div>
					<span className="form-header__percent">{progress}%</span>
				</div>
				<div
					className="form-progress"
					role="progressbar"
					aria-label="Form completion"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={progress}
				>
					<span className="form-progress__value" style={{ width: `${progress}%` }} />
				</div>
			</header>

			<Tabs tabs={tabs} activeTab={safeActiveTab} onSelect={onTabChange} />

			<div
				className="form-panel__body"
				id={`panel-${safeActiveTab}`}
				role="tabpanel"
				aria-labelledby={`tab-${safeActiveTab}`}
			>
				<div className="form-fields">{renderFields(safeActiveSection, [safeActiveTab])}</div>
			</div>

			<footer className="form-footer">
				<button
					className="form-footer__button form-footer__button--secondary"
					type="button"
					disabled={safeActiveIndex === 0}
					onClick={() => onTabChange(tabs[safeActiveIndex - 1].id)}
				>
					Previous
				</button>
				{safeActiveIndex < tabs.length - 1 ? (
					<button
						className="form-footer__button form-footer__button--primary"
						type="button"
						onClick={() => onTabChange(tabs[safeActiveIndex + 1].id)}
					>
						Continue <span aria-hidden="true">→</span>
					</button>
				) : isComplete ? (
					<button className="form-footer__button form-footer__button--primary" type="button" disabled={isPrinting} onClick={() => void handlePrint()}>
						{isPrinting ? 'Preparing PDF…' : 'Print'}
					</button>
				) : (
					<button className="form-footer__button" type="button" onClick={goToIncompleteField}>
						Go to incomplete part
					</button>
				)}
			</footer>
			{printError && <p className="form-footer__error" role="alert">{printError}</p>}
		</section>
	)
}
