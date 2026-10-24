import { useState, type ReactNode } from 'react'
import type { MarriageCertificateForm } from '../../constants/FormObject'
import InputGroup from './InputGroup'
import Tabs, { type FormTab } from '../Tabs'

const tabs: FormTab[] = [
	{ id: 'ceremony', label: 'Ceremony' },
	{ id: 'bridegroom', label: 'Bridegroom' },
	{ id: 'bride', label: 'Bride' },
	{ id: 'registration', label: 'Registration' },
]

interface FormProps {
	form: MarriageCertificateForm
	onChange: (form: MarriageCertificateForm) => void
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

export default function Form({ form, onChange }: FormProps) {
	const [activeTab, setActiveTab] = useState(tabs[0].id)
	const activeIndex = tabs.findIndex((tab) => tab.id === activeTab)
	const activeSection = form[activeTab as keyof MarriageCertificateForm]
	const { total, filled } = countFields(form)
	const progress = total ? Math.round((filled / total) * 100) : 0

	function updateField(path: (string | number)[], value: string) {
		onChange(setValueAtPath(form, path, value) as MarriageCertificateForm)
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
						<p className="form-header__step">Step {activeIndex + 1} of {tabs.length}</p>
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

			<Tabs tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />

			<div
				className="form-panel__body"
				id={`panel-${activeTab}`}
				role="tabpanel"
				aria-labelledby={`tab-${activeTab}`}
			>
				<div className="form-fields">{renderFields(activeSection, [activeTab])}</div>
			</div>

			<footer className="form-footer">
				<button
					className="form-footer__button form-footer__button--secondary"
					type="button"
					disabled={activeIndex === 0}
					onClick={() => setActiveTab(tabs[activeIndex - 1].id)}
				>
					Previous
				</button>
				<button
					className="form-footer__button form-footer__button--primary"
					type="button"
					disabled={activeIndex === tabs.length - 1}
					onClick={() => setActiveTab(tabs[activeIndex + 1].id)}
				>
					Continue
					<span aria-hidden="true">→</span>
				</button>
			</footer>
		</section>
	)
}
