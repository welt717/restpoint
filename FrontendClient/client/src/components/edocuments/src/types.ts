export type FieldType = 'text' | 'signature' | 'checkbox' | 'radio' | 'dropdown' | 'date'

export interface TemplateField {
  id: string
  name: string
  type: FieldType
  options?: string[]   // for radio and dropdown
  page: number
  x: number
  y: number
  width: number
  height: number
}
