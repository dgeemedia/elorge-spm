// packages/exports/payroll.ts
import ExcelJS from 'exceljs'

interface CommissionRow {
  officerName: string
  staffId: string
  branchId: string
  amount: number
  status: string
  periodMonth: number
  periodYear: number
}

export async function generatePayrollExport(
  commissions: CommissionRow[],
  period: string,
  orgName: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Elorge SPM'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet(`Payroll ${period}`)

  // Column definitions
  sheet.columns = [
    { header: 'Officer Name', key: 'name',    width: 28 },
    { header: 'Staff ID',     key: 'staffId', width: 14 },
    { header: 'Branch',       key: 'branch',  width: 20 },
    { header: 'Commission (₦)', key: 'amount', width: 18 },
    { header: 'Status',       key: 'status',  width: 14 },
    { header: 'Period',       key: 'period',  width: 14 },
  ]

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.font   = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3C6E' } }
  headerRow.height = 24

  // Data rows
  commissions.forEach((c, i) => {
    const row = sheet.addRow({
      name:    c.officerName,
      staffId: c.staffId || '—',
      branch:  c.branchId || '—',
      amount:  c.amount,
      status:  c.status,
      period:  `${c.periodMonth}/${c.periodYear}`,
    })
    if (i % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
    }
  })

  // Total row
  const totalRow = sheet.addRow({
    name: 'TOTAL',
    amount: commissions.reduce((sum, c) => sum + c.amount, 0),
  })
  totalRow.font = { bold: true }
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAEEDA' } }

  // Number format for amount column
  sheet.getColumn('amount').numFmt = '#,##0'

  return workbook.xlsx.writeBuffer() as Promise<Buffer>
}
