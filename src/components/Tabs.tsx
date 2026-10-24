export interface FormTab {
	id: string
	label: string
}

interface TabsProps {
	tabs: FormTab[]
	activeTab: string
	onSelect: (tabId: string) => void
}

export default function Tabs({ tabs, activeTab, onSelect }: TabsProps) {
	return (
		<div className="form-tabs" role="tablist" aria-label="Certificate sections">
			{tabs.map((tab, index) => (
				<button
					className={`form-tabs__tab${activeTab === tab.id ? ' is-active' : ''}`}
					id={`tab-${tab.id}`}
					key={tab.id}
					type="button"
					role="tab"
					aria-selected={activeTab === tab.id}
					aria-controls={`panel-${tab.id}`}
					onClick={() => onSelect(tab.id)}
				>
					<span className="form-tabs__number">{String(index + 1).padStart(2, '0')}</span>
					<span className="form-tabs__label">{tab.label}</span>
				</button>
			))}
		</div>
	)
}
