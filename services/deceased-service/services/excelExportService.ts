import ExcelJS from 'exceljs';
import { DateTime } from 'luxon';
import fs from 'fs';
import path from 'path';
import { fileStorageService, FolderCategory } from '../../global/services/fileStorageService';

// Enhanced Professional Color Palette
const COLORS = {
  primary: 'FF1E3A5F',      // Deep Navy
  secondary: 'FF2C3E50',     // Dark Slate
  gold: 'FFD4AF37',          // Gold
  lightGold: 'FFF5E6CC',     // Light Gold for footer
  white: 'FFFFFFFF',          // White
  black: 'FF000000',         // Black for text
  border: 'FFE5E7EB',        // Border Gray
  headerBg: 'FF1E3A5F',      // Header Background
  footerBg: 'FF1A3650',      // Footer Background
  footerText: 'FFE8EDF5',    // Footer Text Color
  rowEven: 'FFFFFFFF',        // Even Row
  rowOdd: 'FFF8F9FA',        // Odd Row
  timestamp: 'FFD4AF37',     // Gold for timestamp
  documentId: 'FF9CA3AF',    // Gray for document ID
  
  // Statistics Card Colors - RESTORED
  cardBlue: 'FF667EEA',      // Purple-blue for Total Records
  cardGreen: 'FF10B981',     // Green for Male
  cardPurple: 'FF8B5CF6',    // Purple for Female
  cardOrange: 'FFF59E0B',    // Orange for Active
  cardTeal: 'FF14B8A6',      // Teal for Completed
  cardRed: 'FFEF4444',       // Red for Pending
  cardCyan: 'FF06B6D4',      // Cyan for Counties
  cardIndigo: 'FF6366F1',    // Indigo for Average Age
  cardYellow: 'FFFBBF24',    // Yellow for Revenue
  cardPink: 'FFEC4899',      // Pink for Most Common Cause
  
  // Light backgrounds for card content
  cardLightBlue: 'FFEFF6FF',
  cardLightGreen: 'FFECFDF5',
  cardLightPurple: 'FFF5F3FF',
  cardLightOrange: 'FFFFF4E6',
  cardLightTeal: 'FFF0FDFA',
  cardLightRed: 'FFFEF2F2',
  cardLightCyan: 'FFF0F9FF',
  cardLightIndigo: 'FFEEF2FF',
  cardLightYellow: 'FFFFFDF5',
  cardLightPink: 'FFFFF1F8'
};

export interface ITenantTheme {
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  accentColor?: string;
  logo?: string;
}

export interface IExportOptions {
  period: 'month' | 'quarter' | 'half_year' | 'year' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
  tenantTheme?: ITenantTheme;
  format?: 'xlsx' | 'csv';
  includeCharts?: boolean;
}

export interface IExportHistory {
  id: string;
  tenantSlug: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  generatedAt: string;
  generatedBy: string;
  period: string;
  status: 'success' | 'failed';
}

const exportHistory: IExportHistory[] = [];

export class ExcelExportService {
  private static instance: ExcelExportService;

  public static getInstance(): ExcelExportService {
    if (!ExcelExportService.instance) {
      ExcelExportService.instance = new ExcelExportService();
    }
    return ExcelExportService.instance;
  }

  getTenantTheme(tenantSlug: string): ITenantTheme {
    return {
      primaryColor: COLORS.primary,
      secondaryColor: COLORS.secondary,
      companyName: tenantSlug.replace(/-/g, ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' '),
      accentColor: COLORS.gold
    };
  }

  async generateDeceasedReport(
    records: any[], 
    options: IExportOptions, 
    generatedBy: string = 'System Administrator'
  ): Promise<{ buffer: Buffer; history: IExportHistory }> {
    const theme = options.tenantTheme || this.getTenantTheme('default');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = theme.companyName;
    workbook.lastModifiedBy = generatedBy;
    workbook.created = new Date();
    workbook.modified = new Date();
    
    const periodLabel = this.getPeriodLabel(options);
    const documentId = `RPT-${DateTime.now().toFormat('yyyyMMddHHmmss')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const generatedDateTime = DateTime.now().setZone('Africa/Nairobi');
    
    // Calculate statistics
    const totalRecords = records.length;
    const totalCharges = records.reduce((sum, r) => sum + (parseFloat(r.total_mortuary_charge) || 0), 0);
    const maleCount = records.filter(r => r.gender === 'Male').length;
    const femaleCount = records.filter(r => r.gender === 'Female').length;
    const activeCount = records.filter(r => r.status === 'active').length;
    const completedCount = records.filter(r => r.status === 'completed' || r.status === 'dispatched').length;
    const pendingCount = records.filter(r => r.status === 'pending').length;
    const countiesCount = new Set(records.map(r => r.county).filter(Boolean)).size;
    const avgAge = this.calculateAverageAge(records);
    const mostCommonCause = this.getMostCommonCause(records);

    // ============================================
    // MAIN REPORT SHEET
    // ============================================
    const sheet = workbook.addWorksheet('DECEASED REPORT', {
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        margins: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
      }
    });

    // Set consistent column widths
    sheet.columns = [
      { width: 8 },   // No
      { width: 22 },  // Deceased ID
      { width: 32 },  // Full Name
      { width: 12 },  // Gender
      { width: 14 },  // Date of Birth
      { width: 14 },  // Date of Death
      { width: 10 },  // Age
      { width: 20 },  // County
      { width: 32 },  // Cause of Death
      { width: 16 },  // Status
      { width: 20 }   // Charge
    ];

    // ============================================
    // HEADER - ONLY FUNERAL HOME NAME (Left Aligned)
    // ============================================
    
    const headerRow = sheet.addRow([]);
    sheet.mergeCells(`A${headerRow.number}:K${headerRow.number}`);
    const headerCell = headerRow.getCell(1);
    headerCell.value = theme.companyName;
    headerCell.font = { size: 22, bold: true, color: { argb: COLORS.primary }, name: 'Calibri' };
    headerCell.alignment = { horizontal: 'left', vertical: 'middle' };
    headerRow.height = 40;
    
    // Spacer
    sheet.addRow([]);
    sheet.addRow([]);
    
    // ============================================
    // DECEASED RECORDS TABLE
    // ============================================
    
    // Table Title
    const tableTitleRow = sheet.addRow([]);
    sheet.mergeCells(`A${tableTitleRow.number}:K${tableTitleRow.number}`);
    const tableTitleCell = tableTitleRow.getCell(1);
    tableTitleCell.value = '📋 DECEASED RECORDS';
    tableTitleCell.font = { size: 14, bold: true, color: { argb: COLORS.primary }, name: 'Calibri' };
    tableTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    tableTitleRow.height = 25;
    
    // TABLE HEADER
    const headers = [
      '#', 'Deceased ID', 'Full Name', 'Gender', 'Date of Birth',
      'Date of Death', 'Age', 'County', 'Cause of Death', 'Status', 'Charge (KES)'
    ];
    
    const headerTableRow = sheet.addRow(headers);
    headerTableRow.height = 32;
    
    headerTableRow.eachCell((cell, colNumber) => {
      cell.font = { size: 11, bold: true, color: { argb: COLORS.white }, name: 'Calibri' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colNumber === 10 ? COLORS.cardGreen : COLORS.headerBg }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium', color: { argb: COLORS.primary } },
        bottom: { style: 'medium', color: { argb: COLORS.primary } },
        left: { style: 'thin', color: { argb: COLORS.border } },
        right: { style: 'thin', color: { argb: COLORS.border } }
      };
    });
    
    // DATA ROWS - BLACK TEXT
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const age = this.calculateAge(record.date_of_birth, record.date_of_death);
      
      const row = sheet.addRow([
        i + 1,
        record.deceased_id || '',
        record.full_name || '',
        record.gender || '—',
        record.date_of_birth ? new Date(record.date_of_birth).toLocaleDateString() : '—',
        record.date_of_death ? new Date(record.date_of_death).toLocaleDateString() : '—',
        age,
        record.county || '—',
        record.cause_of_death || '—',
        this.formatStatus(record.status || 'active'),
        this.formatCurrency(parseFloat(record.total_mortuary_charge || 0))
      ]);
      
      row.height = 24;
      
      const bgColor = i % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd;
      row.eachCell((cell, colNum) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { 
          size: 10, 
          bold: colNum === 1 || colNum === 3 || colNum === 10, 
          color: { argb: COLORS.black }, 
          name: 'Calibri' 
        };
        cell.alignment = { vertical: 'middle' };
        if (colNum === 1 || colNum === 4 || colNum === 10) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.border } },
          bottom: { style: 'thin', color: { argb: COLORS.border } },
          left: { style: 'thin', color: { argb: COLORS.border } },
          right: { style: 'thin', color: { argb: COLORS.border } }
        };
      });
      
      const statusCell = row.getCell(10);
      statusCell.font = { size: 10, bold: true, color: { argb: this.getStatusColor(record.status) }, name: 'Calibri' };
      statusCell.alignment = { horizontal: 'center' };
      row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(11).font = { size: 10, bold: true, color: { argb: COLORS.black }, name: 'Calibri' };
    }
    
    // Spacer before analytics
    sheet.addRow([]);
    sheet.addRow([]);
    
    // ============================================
    // STATISTICAL ANALYSIS - WITH RESTORED COLORS
    // ============================================
    
    // Analytics Title
    const analyticsTitleRow = sheet.addRow([]);
    sheet.mergeCells(`A${analyticsTitleRow.number}:K${analyticsTitleRow.number}`);
    const analyticsTitleCell = analyticsTitleRow.getCell(1);
    analyticsTitleCell.value = '📊 STATISTICAL ANALYSIS';
    analyticsTitleCell.font = { size: 14, bold: true, color: { argb: COLORS.primary }, name: 'Calibri' };
    analyticsTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    analyticsTitleRow.height = 25;
    
    // ROW 1: Total Records, Male, Female, Active, Completed, Pending
    const statsRow1 = sheet.addRow([]);
    statsRow1.height = 70;
    
    // Card colors for row 1
    const row1CardColors = [
      { bg: COLORS.cardBlue, text: COLORS.white, labelColor: COLORS.white },      // Total Records
      { bg: COLORS.cardGreen, text: COLORS.white, labelColor: COLORS.white },     // Male
      { bg: COLORS.cardPurple, text: COLORS.white, labelColor: COLORS.white },    // Female
      { bg: COLORS.cardOrange, text: COLORS.white, labelColor: COLORS.white },    // Active
      { bg: COLORS.cardTeal, text: COLORS.white, labelColor: COLORS.white },      // Completed
      { bg: COLORS.cardRed, text: COLORS.white, labelColor: COLORS.white }        // Pending
    ];
    
    const statsData1 = [
      { label: '📊 TOTAL RECORDS', value: totalRecords.toLocaleString(), bold: true, size: 16 },
      { label: '👨 MALE', value: maleCount.toLocaleString(), bold: false, size: 12 },
      { label: '👩 FEMALE', value: femaleCount.toLocaleString(), bold: false, size: 12 },
      { label: '🟢 ACTIVE', value: activeCount.toLocaleString(), bold: false, size: 12 },
      { label: '✅ COMPLETED', value: completedCount.toLocaleString(), bold: false, size: 12 },
      { label: '⏳ PENDING', value: pendingCount.toLocaleString(), bold: false, size: 12 }
    ];
    
    statsData1.forEach((stat, idx) => {
      const col = idx + 1;
      const cell = sheet.getCell(statsRow1.number, col);
      
      if (idx === 0) {
        sheet.mergeCells(`A${statsRow1.number}:B${statsRow1.number}`);
      }
      
      cell.value = `${stat.label}\n${stat.value}`;
      cell.font = { 
        size: stat.size, 
        bold: stat.bold, 
        color: { argb: row1CardColors[idx].text }, 
        name: 'Calibri' 
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: row1CardColors[idx].bg }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: COLORS.white } },
        left: { style: 'thin', color: { argb: COLORS.white } },
        bottom: { style: 'medium', color: { argb: COLORS.white } },
        right: { style: 'thin', color: { argb: COLORS.white } }
      };
    });
    
    // ROW 2: Counties, Average Age, Total Revenue, Most Common Cause
    const statsRow2 = sheet.addRow([]);
    statsRow2.height = 70;
    
    const row2CardColors = [
      { bg: COLORS.cardCyan, text: COLORS.white },      // Counties
      { bg: COLORS.cardIndigo, text: COLORS.white },    // Average Age
      { bg: COLORS.cardYellow, text: COLORS.secondary }, // Total Revenue
      { bg: COLORS.cardPink, text: COLORS.white }       // Most Common Cause
    ];
    
    const statsData2 = [
      { label: '📍 COUNTIES', value: countiesCount.toLocaleString() },
      { label: '📅 AVG AGE', value: avgAge },
      { label: '💰 TOTAL REVENUE', value: `KES ${totalCharges.toLocaleString()}` },
      { label: '🏥 MOST COMMON CAUSE', value: mostCommonCause.length > 40 ? mostCommonCause.substring(0, 37) + '...' : mostCommonCause }
    ];
    
    statsData2.forEach((stat, idx) => {
      const colStart = idx === 0 ? 1 : idx === 1 ? 3 : idx === 2 ? 5 : 7;
      const colEnd = idx === 0 ? 2 : idx === 1 ? 4 : idx === 2 ? 6 : 11;
      
      sheet.mergeCells(`${this.getColumnLetter(colStart)}${statsRow2.number}:${this.getColumnLetter(colEnd)}${statsRow2.number}`);
      const cell = sheet.getCell(statsRow2.number, colStart);
      cell.value = `${stat.label}\n${stat.value}`;
      cell.font = { 
        size: idx === 2 ? 13 : 12, 
        bold: idx === 2, 
        color: { argb: row2CardColors[idx].text }, 
        name: 'Calibri' 
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: row2CardColors[idx].bg }
      };
      cell.border = {
        top: { style: 'medium', color: { argb: COLORS.white } },
        left: { style: 'thin', color: { argb: COLORS.white } },
        bottom: { style: 'medium', color: { argb: COLORS.white } },
        right: { style: 'thin', color: { argb: COLORS.white } }
      };
    });
    
    // Decorative gold line before footer
    sheet.addRow([]);
    const goldLineRow = sheet.addRow([]);
    for (let i = 1; i <= 11; i++) {
      const cell = goldLineRow.getCell(i);
      cell.border = { top: { style: 'medium', color: { argb: COLORS.gold } } };
    }
    goldLineRow.height = 6;
    
    // ============================================
    // FOOTER - 3 Column Layout
    // ============================================
    
    const footerStartRow = goldLineRow.number + 1;
    
    // Footer background
    for (let i = 1; i <= 11; i++) {
      const cell = sheet.getCell(footerStartRow, i);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.footerBg }
      };
    }
    
    // COLUMN 1: Company Info (A-C)
    sheet.mergeCells(`A${footerStartRow}:C${footerStartRow + 3}`);
    const companyCell = sheet.getCell(footerStartRow, 1);
    companyCell.value = `${theme.companyName}\n\nMortuary Management System\nProfessional & Dignified Services\n\n📞 support@mortuary.com\n🌐 www.mortuary.com`;
    companyCell.font = { size: 9, color: { argb: COLORS.gold }, name: 'Calibri' };
    companyCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    companyCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.footerBg }
    };
    
    // COLUMN 2: Document Info (D-H)
    sheet.mergeCells(`D${footerStartRow}:H${footerStartRow + 3}`);
    const docCell = sheet.getCell(footerStartRow, 4);
    docCell.value = `📄 DOCUMENT INFORMATION\n\nDocument ID: ${documentId}\nGenerated: ${generatedDateTime.toFormat('dd MMM yyyy, HH:mm:ss')}\nPeriod: ${periodLabel}\nBy: ${generatedBy}\nVersion: 2.0`;
    docCell.font = { size: 9, color: { argb: COLORS.footerText }, name: 'Calibri' };
    docCell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
    docCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.footerBg }
    };
    
    // COLUMN 3: Confidentiality (I-K)
    sheet.mergeCells(`I${footerStartRow}:K${footerStartRow + 3}`);
    const confCell = sheet.getCell(footerStartRow, 9);
    confCell.value = `🔒 CONFIDENTIALITY NOTICE\n\nPrivileged & Confidential\nUnauthorized disclosure prohibited\n\n📊 SUMMARY:\n• ${totalRecords.toLocaleString()} records\n• ${countiesCount} counties\n• KES ${totalCharges.toLocaleString()}`;
    confCell.font = { size: 9, color: { argb: COLORS.footerText }, name: 'Calibri' };
    confCell.alignment = { horizontal: 'right', vertical: 'top', wrapText: true };
    confCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.footerBg }
    };
    
    // Set footer row heights
    for (let i = 0; i < 4; i++) {
      const row = sheet.getRow(footerStartRow + i);
      row.height = i === 0 ? 28 : 22;
    }
    
    // Copyright row
    const copyrightRow = sheet.addRow([]);
    sheet.mergeCells(`A${copyrightRow.number}:K${copyrightRow.number}`);
    const copyrightCell = copyrightRow.getCell(1);
    copyrightCell.value = `© ${new Date().getFullYear()} ${theme.companyName}. All rights reserved. | System Generated Document`;
    copyrightCell.font = { size: 8, color: { argb: COLORS.gold }, name: 'Calibri', italic: true };
    copyrightCell.alignment = { horizontal: 'center', vertical: 'middle' };
    copyrightCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.footerBg }
    };
    copyrightRow.height = 20;
    
    // ============================================
    // GENERATE FILE
    // ============================================
    
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBuffer = Buffer.from(buffer);
    
    const historyId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${theme.companyName.replace(/\s/g, '_')}_Deceased_Report_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
    
    const historyRecord: IExportHistory = {
      id: historyId,
      tenantSlug: theme.companyName,
      fileName,
      fileSize: fileBuffer.length,
      recordCount: records.length,
      generatedAt: DateTime.now().toISO(),
      generatedBy,
      period: periodLabel,
      status: 'success'
    };
    
    try {
      // Use the global file storage service to save the export
      const uploadConfig = {
        tenantSlug: theme.companyName,
        category: FolderCategory.EXPORTS as any,
        subFolder: undefined
      };
      
      // Save using fileStorageService if tenantSlug is available
      if (options.tenantTheme) {
        const savedFile = await fileStorageService.saveFile(fileBuffer, fileName, {
          tenantSlug: options.tenantTheme.companyName.replace(/\s+/g, '-').toLowerCase(),
          category: FolderCategory.EXPORTS
        });
        console.log(`📊 Export saved to: ${savedFile.relativePath}`);
      } else {
        // Fallback to local exports directory
        const exportsDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportsDir)) {
          fs.mkdirSync(exportsDir, { recursive: true });
        }
        const filePath = path.join(exportsDir, fileName);
        await fs.promises.writeFile(filePath, fileBuffer);
      }
    } catch (error: any) {
      console.warn(`⚠️ Could not save file: ${error.message}`);
    }
    
    exportHistory.unshift(historyRecord);
    
    return { buffer: fileBuffer, history: historyRecord };
  }

  private getColumnLetter(col: number): string {
    let letter = '';
    while (col > 0) {
      const remainder = (col - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      col = Math.floor((col - 1) / 26);
    }
    return letter;
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'active': '● Active',
      'completed': '✓ Completed',
      'dispatched': '✈ Dispatched',
      'pending': '⏳ Pending',
      'received': '📥 Received',
      'ready': '✅ Ready'
    };
    return statusMap[status?.toLowerCase()] || status || '● Active';
  }

  private getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'active': 'FF10B981',
      'completed': 'FF3B82F6',
      'dispatched': 'FFF59E0B',
      'pending': 'FFEF4444',
      'received': 'FF8B5CF6',
      'ready': 'FF06B6D4'
    };
    return colorMap[status?.toLowerCase()] || 'FF666666';
  }

  private calculateAge(dob: string, dod: string): string {
    if (!dob || !dod) return '—';
    const birth = new Date(dob);
    const death = new Date(dod);
    let years = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      years--;
    }
    return years > 0 ? `${years} yrs` : years === 0 ? '<1 yr' : '—';
  }

  private calculateAverageAge(records: any[]): string {
    let totalYears = 0;
    let count = 0;
    for (const record of records) {
      if (record.date_of_birth && record.date_of_death) {
        const age = this.calculateAge(record.date_of_birth, record.date_of_death);
        const match = age.match(/(\d+)/);
        if (match) {
          totalYears += parseInt(match[1]);
          count++;
        }
      }
    }
    if (count === 0) return '—';
    const avg = totalYears / count;
    return `${avg.toFixed(1)} yrs`;
  }

  private getMostCommonCause(records: any[]): string {
    const causeCount = new Map<string, number>();
    for (const record of records) {
      if (record.cause_of_death) {
        const cause = record.cause_of_death;
        causeCount.set(cause, (causeCount.get(cause) || 0) + 1);
      }
    }
    if (causeCount.size === 0) return '—';
    let maxCount = 0;
    let mostCommon = '';
    for (const [cause, count] of causeCount) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = cause;
      }
    }
    return mostCommon;
  }

  private getPeriodLabel(options: IExportOptions): string {
    const period = options.period;
    const now = new Date();
    const year = now.getFullYear();

    switch (period) {
      case 'month':
        return `${now.toLocaleString('default', { month: 'long' })} ${year}`;
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${year}`;
      }
      case 'half_year': {
        const half = now.getMonth() < 6 ? 'H1' : 'H2';
        return `${half} ${year}`;
      }
      case 'year':
        return `Full Year ${year}`;
      case 'custom':
        if (options.startDate && options.endDate) {
          return `${new Date(options.startDate).toLocaleDateString()} - ${new Date(options.endDate).toLocaleDateString()}`;
        }
        return 'Custom Period';
      default:
        return 'All Time';
    }
  }

  private formatCurrency(amount: number): string {
    if (amount === 0) return '—';
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export default ExcelExportService;