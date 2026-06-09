import { PDFDocument, rgb } from 'pdf-lib'
import type { TemplateField } from '../../types'

interface PDFGenerationOptions {
  data?: Record<string, string>
  signature?: string
  barcode?: string
  template?: any
}

/**
 * Advanced PDF Service for document generation with Fabric.js templates
 */
export class PDFGenerationService {
  /**
   * Load existing PDF
   */
  static async loadPDF(pdfBytes: ArrayBuffer): Promise<PDFDocument> {
    return PDFDocument.load(pdfBytes)
  }

  /**
   * Create new PDF from template
   */
  static async createFromTemplate(
    width: number = 612,
    height: number = 792
  ): Promise<PDFDocument> {
    const pdfDoc = await PDFDocument.create()
    pdfDoc.addPage([width, height])
    return pdfDoc
  }

  /**
   * Add text to PDF
   */
  static async addText(
    pdfDoc: PDFDocument,
    pageIndex: number,
    text: string,
    options: {
      x?: number
      y?: number
      fontSize?: number
      color?: [number, number, number]
      fontName?: string
    } = {}
  ): Promise<void> {
    const page = pdfDoc.getPage(pageIndex)
    const {
      x = 50,
      y = 750,
      fontSize = 12,
      color = [0, 0, 0],
      fontName = 'Helvetica'
    } = options

    const font = await pdfDoc.embedFont(fontName)
    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(...color),
    })
  }

  /**
   * Add image to PDF
   */
  static async addImage(
    pdfDoc: PDFDocument,
    pageIndex: number,
    imageBytes: ArrayBuffer | Uint8Array,
    options: {
      x?: number
      y?: number
      width?: number
      height?: number
    } = {}
  ): Promise<void> {
    const page = pdfDoc.getPage(pageIndex)
    const { x = 50, y = 750, width = 100, height = 50 } = options

    const imageType = this.detectImageType(imageBytes)
    let image

    if (imageType === 'png') {
      image = await pdfDoc.embedPng(imageBytes as any)
    } else if (imageType === 'jpeg') {
      image = await pdfDoc.embedJpg(imageBytes as any)
    } else {
      throw new Error(`Unsupported image type: ${imageType}`)
    }

    page.drawImage(image, {
      x,
      y,
      width,
      height,
    })
  }

  /**
   * Add signature image
   */
  static async addSignature(
    pdfDoc: PDFDocument,
    pageIndex: number,
    signatureDataUrl: string,
    options: {
      x?: number
      y?: number
      width?: number
      height?: number
    } = {}
  ): Promise<void> {
    const page = pdfDoc.getPage(pageIndex)
    const { x = 50, y = 150, width = 200, height = 100 } = options

    const imageBytes = await fetch(signatureDataUrl).then(res =>
      res.arrayBuffer()
    )
    const image = await pdfDoc.embedPng(imageBytes)

    page.drawImage(image, {
      x,
      y,
      width,
      height,
    })
  }

  /**
   * Add barcode to PDF
   */
  static async addBarcode(
    pdfDoc: PDFDocument,
    pageIndex: number,
    barcodeDataUrl: string,
    options: {
      x?: number
      y?: number
      width?: number
      height?: number
    } = {}
  ): Promise<void> {
    const page = pdfDoc.getPage(pageIndex)
    const { x = 50, y = 200, width = 150, height = 50 } = options

    const imageBytes = await fetch(barcodeDataUrl).then(res =>
      res.arrayBuffer()
    )
    const image = await pdfDoc.embedPng(imageBytes)

    page.drawImage(image, {
      x,
      y,
      width,
      height,
    })
  }

  /**
   * Draw rectangle (for field borders)
   */
  static async addRectangle(
    pdfDoc: PDFDocument,
    pageIndex: number,
    options: {
      x?: number
      y?: number
      width?: number
      height?: number
      color?: [number, number, number]
      borderWidth?: number
    } = {}
  ): Promise<void> {
    const page = pdfDoc.getPage(pageIndex)
    const {
      x = 50,
      y = 750,
      width = 200,
      height = 50,
      color = [0, 0, 0],
      borderWidth = 1
    } = options

    page.drawRectangle({
      x,
      y: page.getHeight() - y - height,
      width,
      height,
      borderColor: rgb(...color),
      borderWidth,
    })
  }

  /**
   * Add form field to PDF
   */
  static async addFormField(
    pdfDoc: PDFDocument,
    pageIndex: number,
    field: TemplateField,
    value?: string
  ): Promise<void> {
    const page = pdfDoc.getPage(pageIndex)
    const x = field.x * page.getWidth()
    const y = page.getHeight() - (field.y * page.getHeight()) - (field.height * page.getHeight())
    const width = field.width * page.getWidth()
    const height = field.height * page.getHeight()

    // Draw field border
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1,
    })

    // Add field label/value if provided
    if (value) {
      const font = await pdfDoc.embedFont('Helvetica')
      page.drawText(value, {
        x: x + 5,
        y: y + height / 2 - 5,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      })
    }
  }

  /**
   * Generate PDF from template and data
   */
  static async generateFromTemplateAndData(
    templateData: any,
    fields: TemplateField[],
    data: Record<string, string>,
    options: PDFGenerationOptions = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await this.createFromTemplate()
    const pageIndex = 0

    // Add template background if it's an image
    if (templateData?.backgroundImage) {
      await this.addImage(pdfDoc, pageIndex, templateData.backgroundImage)
    }

    // Add form fields
    for (const field of fields) {
      const value = data[field.name] || data[field.id] || ''
      await this.addFormField(pdfDoc, pageIndex, field, value)
    }

    // Add signature if provided
    if (options.signature) {
      await this.addSignature(pdfDoc, pageIndex, options.signature)
    }

    // Add barcode if provided
    if (options.barcode) {
      await this.addBarcode(pdfDoc, pageIndex, options.barcode)
    }

    return pdfDoc.save()
  }

  /**
   * Merge multiple PDFs
   */
  static async mergePDFs(pdfBytesList: (ArrayBuffer | Uint8Array)[]): Promise<Uint8Array> {
    const firstPdfBytes = pdfBytesList[0]
    const pdfDoc = await PDFDocument.load(firstPdfBytes as any)

    for (let i = 1; i < pdfBytesList.length; i++) {
      const pdfBytes = pdfBytesList[i]
      const otherPdfDoc = await PDFDocument.load(pdfBytes as any)
      const pages = await pdfDoc.copyPages(otherPdfDoc, otherPdfDoc.getPageIndices())
      pages.forEach(page => pdfDoc.addPage(page))
    }

    return pdfDoc.save()
  }

  /**
   * Get PDF page count
   */
  static async getPageCount(pdfBytes: ArrayBuffer | Uint8Array): Promise<number> {
    const pdfDoc = await PDFDocument.load(pdfBytes as any)
    return pdfDoc.getPageCount()
  }

  /**
   * Get PDF page dimensions
   */
  static async getPageDimensions(
    pdfBytes: ArrayBuffer | Uint8Array,
    pageIndex: number = 0
  ): Promise<{ width: number; height: number }> {
    const pdfDoc = await PDFDocument.load(pdfBytes as any)
    const page = pdfDoc.getPage(pageIndex)
    return {
      width: page.getWidth(),
      height: page.getHeight(),
    }
  }

  /**
   * Detect image type from bytes
   */
  private static detectImageType(imageBytes: ArrayBuffer | Uint8Array): 'png' | 'jpeg' {
    const view = imageBytes instanceof Uint8Array ? imageBytes : new Uint8Array(imageBytes)
    // PNG signature: 89 50 4E 47
    if (view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4e && view[3] === 0x47) {
      return 'png'
    }
    // JPEG signature: FF D8 FF
    if (view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
      return 'jpeg'
    }
    return 'png' // Default to PNG
  }

  /**
   * Download PDF
   */
  static downloadPDF(pdfBytes: ArrayBuffer | Uint8Array, filename: string): void {
    const uint8Array = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
    const blob = new Blob([uint8Array as any], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }
}

export default PDFGenerationService
