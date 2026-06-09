import JsBarcode from 'jsbarcode'

export interface BarcodeOptions {
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'QR'
  width?: number
  height?: number
  displayValue?: boolean
  margin?: number
}

/**
 * Barcode Generation Service
 * Generates various barcode formats including QR codes
 */
export class BarcodeGeneratorService {
  /**
   * Generate barcode as data URL
   */
  static generateBarcode(
    value: string,
    options: BarcodeOptions = {}
  ): string {
    const {
      format = 'CODE128',
      width = 2,
      height = 100,
      displayValue = true,
      margin = 10
    } = options

    const canvas = document.createElement('canvas')
    
    try {
      JsBarcode(canvas, value, {
        format: format || 'CODE128',
        width,
        height,
        displayValue,
        margin,
      } as any)
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Error generating barcode:', error)
      throw new Error(`Failed to generate ${format} barcode`)
    }
  }

  /**
   * Generate QR code
   */
  static generateQRCode(
    value: string,
    options: Partial<BarcodeOptions> = {}
  ): string {
    return this.generateBarcode(value, {
      format: 'QR',
      height: options.height || 200,
      width: options.width || 2,
      margin: options.margin || 10,
      displayValue: false,
    })
  }

  /**
   * Generate CODE128 barcode
   */
  static generateCODE128(
    value: string,
    options: Partial<BarcodeOptions> = {}
  ): string {
    return this.generateBarcode(value, {
      format: 'CODE128',
      height: options.height || 100,
      width: options.width || 2,
      margin: options.margin || 10,
      displayValue: options.displayValue !== false,
    })
  }

  /**
   * Generate EAN13 barcode
   */
  static generateEAN13(
    value: string,
    options: Partial<BarcodeOptions> = {}
  ): string {
    if (!/^\d{13}$/.test(value)) {
      throw new Error('EAN13 must be exactly 13 digits')
    }
    return this.generateBarcode(value, {
      format: 'EAN13',
      height: options.height || 100,
      width: options.width || 2,
      margin: options.margin || 10,
      displayValue: options.displayValue !== false,
    })
  }

  /**
   * Generate batch of barcodes
   */
  static generateBatch(
    values: string[],
    options: BarcodeOptions = {}
  ): string[] {
    return values.map(value => this.generateBarcode(value, options))
  }

  /**
   * Generate unique barcode from document data
   */
  static generateDocumentBarcode(
    documentId: string,
    tenantId: string,
    timestamp?: Date
  ): string {
    const ts = timestamp ? timestamp.getTime() : Date.now()
    const barcodeValue = `${tenantId}-${documentId}-${ts}`.replace(/[^a-zA-Z0-9-]/g, '')
    return this.generateCODE128(barcodeValue.substring(0, 20))
  }

  /**
   * Download barcode image
   */
  static downloadBarcode(
    dataUrl: string,
    filename: string = 'barcode.png'
  ): void {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
  }

  /**
   * Validate barcode value
   */
  static validateBarcode(
    value: string,
    format: string = 'CODE128'
  ): boolean {
    switch (format.toUpperCase()) {
      case 'EAN13':
        return /^\d{13}$/.test(value)
      case 'EAN8':
        return /^\d{8}$/.test(value)
      case 'CODE39':
        return /^[A-Z0-9\- $./%+]+$/.test(value)
      case 'QR':
        return value.length > 0
      default:
        return value.length > 0
    }
  }

  /**
   * Generate barcode with embedded checksum
   */
  static generateWithChecksum(
    value: string,
    format: string = 'CODE128'
  ): string {
    if (format === 'EAN13') {
      const checksum = this.calculateEAN13Checksum(value)
      return this.generateEAN13(value + checksum)
    }
    return this.generateBarcode(value, { format: format as any })
  }

  /**
   * Calculate EAN13 checksum
   */
  private static calculateEAN13Checksum(value: string): string {
    let sum = 0
    for (let i = 0; i < value.length; i++) {
      sum += parseInt(value[i]) * (i % 2 === 0 ? 1 : 3)
    }
    const checksum = (10 - (sum % 10)) % 10
    return checksum.toString()
  }

  /**
   * Create composite barcode with text
   */
  static async createBarcodeWithLabel(
    value: string,
    label: string,
    options: BarcodeOptions = {}
  ): Promise<string> {
    const { format = 'CODE128', ...rest } = options
    const barcodeCanvas = document.createElement('canvas')
    JsBarcode(barcodeCanvas, value, {
      format: format || 'CODE128',
      ...rest,
    } as any)
    
    // Create composite canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const barcodePadding = 20
    
    canvas.width = barcodeCanvas.width + barcodePadding * 2
    canvas.height = barcodeCanvas.height + 40

    // Draw white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw barcode
    ctx.drawImage(barcodeCanvas, barcodePadding, 0)

    // Draw label
    ctx.fillStyle = 'black'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(label, canvas.width / 2, canvas.height - 10)

    return canvas.toDataURL('image/png')
  }
}

export default BarcodeGeneratorService
