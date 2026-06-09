import api from './apiClient'
import type { TemplateField } from '../types'

export const getTemplates = () => api.get('/templates')

export const getTemplate = (id: number | string) => api.get(`/templates/${id}`)

type SaveFieldsPayload = {
  template_id: number
  fields: TemplateField[]
}

type SaveMappingPayload = {
  template_id: number
  mappings: Record<string, string>
}

type GeneratePayload = {
  template_id: number
  data: Record<string, string>
  signature?: string
}

export const uploadPdf = (payload: FormData) =>
  api.post('/upload-pdf', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const saveFields = (payload: SaveFieldsPayload) =>
  api.post('/save-fields', payload)

export const saveMapping = (payload: SaveMappingPayload) =>
  api.post('/save-mapping', payload)

export const generatePdf = (payload: GeneratePayload) => api.post('/generate-pdf', payload)
