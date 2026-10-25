import readExcelFile from 'read-excel-file/browser'
import { marriageCertificateForm, type MarriageCertificateForm } from '../constants/FormObject'

export interface SpreadsheetRecord {
  id: string
  sourceRow: number
  values: Record<string, string>
}

export interface ImportedWorkbook {
  sheetNames: string[]
  selectedSheet: string
  headers: string[]
  records: SpreadsheetRecord[]
}

export type FormFieldId =
  | 'ceremony.solemnizedAt'
  | 'ceremony.location'
  | 'ceremony.subCounty'
  | 'ceremony.county'
  | 'ceremony.dateOfMarriage'
  | 'ceremony.marriageEntryNumber'
  | 'bridegroom.name'
  | 'bridegroom.age'
  | 'bridegroom.maritalStatus'
  | 'bridegroom.residenceAtMarriage'
  | 'bridegroom.county'
  | 'bridegroom.subCounty'
  | 'bridegroom.occupation'
  | 'bridegroom.father.name'
  | 'bridegroom.father.occupation'
  | 'bridegroom.father.residence'
  | 'bridegroom.mother.name'
  | 'bridegroom.mother.occupation'
  | 'bridegroom.mother.residence'
  | 'bride.name'
  | 'bride.age'
  | 'bride.maritalStatus'
  | 'bride.residenceAtMarriage'
  | 'bride.county'
  | 'bride.subCounty'
  | 'bride.occupation'
  | 'bride.father.name'
  | 'bride.father.occupation'
  | 'bride.father.residence'
  | 'bride.mother.name'
  | 'bride.mother.occupation'
  | 'bride.mother.residence'
  | 'registration.marriedIn'
  | 'registration.registrarCertificateOrSpecialLicenseNumber'
  | 'registration.officiatedBy'
  | 'registration.parties.0'
  | 'registration.parties.1'
  | 'registration.witnesses.0'
  | 'registration.witnesses.1'

export type ColumnMapping = Partial<Record<FormFieldId, string>>

const fieldAliases: Record<FormFieldId, string[]> = {
  'ceremony.solemnizedAt': ['solemnized at', 'ceremony location', 'place of ceremony'],
  'ceremony.location': ['location', 'venue', 'place'],
  'ceremony.subCounty': ['ceremony subcounty', 'ceremony sub county'],
  'ceremony.county': ['ceremony county'],
  'ceremony.dateOfMarriage': ['marriage date', 'date of marriage', 'date'],
  'ceremony.marriageEntryNumber': ['marriage entry number', 'entry number'],
  'bridegroom.name': ['bridegroom name', 'groom name', 'husband', 'husband name', "husband's full name"],
  'bridegroom.age': ['groom age', 'husband age', 'bridegroom age'],
  'bridegroom.maritalStatus': ['groom marital status', 'husband marital status'],
  'bridegroom.residenceAtMarriage': ['groom residence', 'husband residence', 'bridegroom residence at marriage'],
  'bridegroom.county': ['groom county', 'husband county'],
  'bridegroom.subCounty': ['groom subcounty', 'groom sub county', 'husband subcounty', 'husband sub county'],
  'bridegroom.occupation': ['groom occupation', 'husband occupation', 'bridegroom occupation'],
  'bridegroom.father.name': ['groom father', 'groom father name', 'husband father name'],
  'bridegroom.father.occupation': ['groom father occupation', 'husband father occupation'],
  'bridegroom.father.residence': ['groom father residence', 'husband father residence'],
  'bridegroom.mother.name': ['groom mother', 'groom mother name', 'husband mother name'],
  'bridegroom.mother.occupation': ['groom mother occupation', 'husband mother occupation'],
  'bridegroom.mother.residence': ['groom mother residence', 'husband mother residence'],
  'bride.name': ['bride name', 'wife', 'wife name', "wife's full name"],
  'bride.age': ['bride age', 'wife age'],
  'bride.maritalStatus': ['bride marital status', 'wife marital status'],
  'bride.residenceAtMarriage': ['bride residence', 'wife residence', 'bride residence at marriage'],
  'bride.county': ['bride county', 'wife county'],
  'bride.subCounty': ['bride subcounty', 'bride sub county', 'wife subcounty', 'wife sub county'],
  'bride.occupation': ['bride occupation', 'wife occupation'],
  'bride.father.name': ['bride father', 'bride father name', 'wife father name'],
  'bride.father.occupation': ['bride father occupation', 'wife father occupation'],
  'bride.father.residence': ['bride father residence', 'wife father residence'],
  'bride.mother.name': ['bride mother', 'bride mother name', 'wife mother name'],
  'bride.mother.occupation': ['bride mother occupation', 'wife mother occupation'],
  'bride.mother.residence': ['bride mother residence', 'wife mother residence'],
  'registration.marriedIn': ['married in', 'registered in'],
  'registration.registrarCertificateOrSpecialLicenseNumber': ['certificate number', 'special license number', 'registrar certificate number'],
  'registration.officiatedBy': ['officiated by', 'officiant'],
  'registration.parties.0': ['party 1', 'first party', 'party one'],
  'registration.parties.1': ['party 2', 'second party', 'party two'],
  'registration.witnesses.0': ['witness 1', 'first witness', 'witness one'],
  'registration.witnesses.1': ['witness 2', 'second witness', 'witness two'],
}

function normalizeHeader(header: string): string {
  return header.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function cellToString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value == null ? '' : String(value).trim()
}

export async function importMarriageWorkbook(file: File, sheetName?: string): Promise<ImportedWorkbook> {
  const workbook = await readExcelFile(file)
  const sheetNames = workbook.map(({ sheet }) => sheet)
  if (sheetNames.length === 0) throw new Error('The workbook contains no worksheets.')

  const selectedSheet = sheetName ?? sheetNames[0]
  const worksheet = workbook.find((item) => item.sheet === selectedSheet)
  if (!worksheet) throw new Error(`Worksheet "${selectedSheet}" was not found.`)

  const rows = worksheet.data
  if (rows.length < 2) throw new Error('The worksheet must contain a header row and at least one record.')

  const headers = rows[0].map((value, index) => cellToString(value) || `Column ${index + 1}`)
  if (new Set(headers.map(normalizeHeader)).size !== headers.length) {
    throw new Error('Duplicate column headers found. Rename duplicate headers before importing.')
  }

  const records = rows.slice(1).map((cells, index) => {
    const values = Object.fromEntries(headers.map((header, columnIndex) => [header, cellToString(cells[columnIndex])]))
    return { id: `record-${index + 1}`, sourceRow: index + 2, values }
  }).filter((record) => Object.values(record.values).some(Boolean))

  if (records.length === 0) throw new Error('The worksheet contains no non-empty records.')

  return { sheetNames, selectedSheet, headers, records }
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map((header) => ({ header, normalized: normalizeHeader(header) }))
  const mapping: ColumnMapping = {}

  for (const [fieldId, aliases] of Object.entries(fieldAliases) as [FormFieldId, string[]][]) {
    const normalizedAliases = [fieldId.split('.').at(-1) ?? '', ...aliases].map(normalizeHeader)
    const matches = normalizedHeaders.filter(({ normalized }) => normalizedAliases.includes(normalized))
    if (matches.length === 1) mapping[fieldId] = matches[0].header
  }

  return mapping
}

function setFormValue(form: MarriageCertificateForm, fieldId: FormFieldId, value: string): void {
  const path = fieldId.split('.')
  let target: unknown = form

  for (const part of path.slice(0, -1)) {
    target = (target as Record<string, unknown>)[part]
  }

  const lastPart = path[path.length - 1]
  if (Array.isArray(target)) target[Number(lastPart)] = value
  else (target as Record<string, unknown>)[lastPart] = value
}

export function mapSpreadsheetRecord(
  record: SpreadsheetRecord,
  mapping: ColumnMapping,
): MarriageCertificateForm {
  const form = structuredClone(marriageCertificateForm)
  for (const [fieldId, header] of Object.entries(mapping) as [FormFieldId, string][]) {
    if (header in record.values) setFormValue(form, fieldId, record.values[header])
  }
  return form
}

export function mapSpreadsheetRecords(
  records: SpreadsheetRecord[],
  mapping: ColumnMapping,
): MarriageCertificateForm[] {
  return records.map((record) => mapSpreadsheetRecord(record, mapping))
}
