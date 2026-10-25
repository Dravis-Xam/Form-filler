export interface OverlayField {
	path: (string | number)[]
	combineWith?: (string | number)[]
	x: number
	y: number
	width: number
	fontSize?: number
}

export const overlayFields: OverlayField[] = [
	{ path: ['ceremony', 'solemnizedAt'], x: 29, y: 18.5, width: 12 },
	{ path: ['ceremony', 'location'], x: 44, y: 18.5, width: 10 },
	{ path: ['ceremony', 'subCounty'], combineWith: ['ceremony', 'county'], x: 61, y: 18.5, width: 21 },
	{ path: ['ceremony', 'dateOfMarriage'], x: 24, y: 21.6, width: 32 },
	{ path: ['ceremony', 'marriageEntryNumber'], x: 59, y: 21.6, width: 31 },
	{ path: ['bridegroom', 'name'], x: 17, y: 27.6, width: 31 },
	{ path: ['bridegroom', 'age'], x: 53, y: 24.6, width: 11 },
	{ path: ['bridegroom', 'maritalStatus'], x: 71, y: 24.6, width: 17 },
	{ path: ['bridegroom', 'residenceAtMarriage'], x: 34, y: 31.3, width: 31 },
	{ path: ['bridegroom', 'county'], x: 56, y: 31.3, width: 11 },
	{ path: ['bridegroom', 'subCounty'], x: 71, y: 31.3, width: 17 },
	{ path: ['bridegroom', 'occupation'], x: 23, y: 34.2, width: 64 },
	{ path: ['bridegroom', 'father', 'name'], x: 26, y: 37.6, width: 31 },
	{ path: ['bridegroom', 'mother', 'name'], x: 60, y: 37.6, width: 31 },
	{ path: ['bridegroom', 'father', 'occupation'], x: 23, y: 40.7, width: 31 },
	{ path: ['bridegroom', 'mother', 'occupation'], x: 58, y: 40.7, width: 31 },
	{ path: ['bridegroom', 'father', 'residence'], x: 23, y: 43.8, width: 31 },
	{ path: ['bridegroom', 'mother', 'residence'], x: 58, y: 43.8, width: 31 },
	{ path: ['bride', 'name'], x: 17, y: 49.1, width: 31 },
	{ path: ['bride', 'age'], x: 53, y: 46.9, width: 11 },
	{ path: ['bride', 'maritalStatus'], x: 71, y: 46.9, width: 17 },
	{ path: ['bride', 'residenceAtMarriage'], x: 32, y: 53.2, width: 31 },
	{ path: ['bride', 'county'], x: 53.4, y: 53.2, width: 11 },
	{ path: ['bride', 'subCounty'], x: 71, y: 53.2, width: 17 },
	{ path: ['bride', 'occupation'], x: 23, y: 56.5, width: 64 },
	{ path: ['bride', 'father', 'name'], x: 24, y: 59.6, width: 31 },
	{ path: ['bride', 'mother', 'name'], x: 57, y: 59.6, width: 31 },
	{ path: ['bride', 'father', 'occupation'], x: 22, y: 62.7, width: 31 },
	{ path: ['bride', 'mother', 'occupation'], x: 56, y: 62.7, width: 31 },
	{ path: ['bride', 'father', 'residence'], x: 22, y: 65.7, width: 31 },
	{ path: ['bride', 'mother', 'residence'], x: 56, y: 65.7, width: 31 },
	{ path: ['registration', 'marriedIn'], x: 24, y: 71.6, width: 25 },
	{ path: ['registration', 'registrarCertificateOrSpecialLicenseNumber'], x: 63, y: 71.6, width: 19 },
	{ path: ['registration', 'officiatedBy'], x: 58, y: 74.8, width: 19 },
	{ path: ['registration', 'parties', 0], x: 27, y: 78.5, width: 21 },
	{ path: ['registration', 'parties', 1], x: 27, y: 82.5, width: 21 },
	{ path: ['registration', 'witnesses', 0], x: 58, y: 78.5, width: 18 },
	{ path: ['registration', 'witnesses', 1], x: 58, y: 82.5, width: 18 },
]

export function readFormPath(form: object, path: (string | number)[]): string {
	let value: unknown = form
	for (const part of path) {
		if (value === null || typeof value !== 'object') return ''
		value = (value as Record<string | number, unknown>)[part]
	}
	return typeof value === 'string' ? value : ''
}

export function readOverlayValue(form: object, field: OverlayField): string {
	const value = readFormPath(form, field.path)
	const combinedValue = field.combineWith ? readFormPath(form, field.combineWith) : ''
	return [value, combinedValue].filter(Boolean).join(', ')
}