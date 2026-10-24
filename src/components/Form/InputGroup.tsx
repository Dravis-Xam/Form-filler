import type { ChangeEvent } from 'react'
import { motion, useReducedMotion } from 'motion/react'

export interface InputGroupProps {
	id: string
	label: string
	value: string
	type?: 'text' | 'date' | 'number'
	onChange: (value: string) => void
}

export default function InputGroup({ id, label, value, type = 'text', onChange }: InputGroupProps) {
	const reduceMotion = useReducedMotion()
	const inputOrder = id.split('-').reduce((order, segment) => order + segment.charCodeAt(0), 0) % 8

	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		onChange(event.target.value)
	}

	return (
		<motion.div
			className="input-group"
			initial={reduceMotion ? false : { opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, delay: reduceMotion ? 0 : inputOrder * 0.025, ease: 'easeOut' }}
		>
			<label className="input-group__label" htmlFor={id}>{label}</label>
			<input
				className="input-group__control"
				id={id}
				name={id}
				type={type}
				value={value}
				onChange={handleChange}
			/>
		</motion.div>
	)
}
