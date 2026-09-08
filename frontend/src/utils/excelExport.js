import * as XLSX from 'xlsx';

export const exportReportToExcel = (fileName, sheetName, tableHeaders, tableData) => {
  // Combine headers and data
  const fullData = [tableHeaders, ...tableData];

  const worksheet = XLSX.utils.aoa_to_sheet(fullData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'DataExport');

  // Auto-width column calculation
  const colWidths = tableHeaders.map((header, colIdx) => {
    let maxLen = header.length;
    tableData.forEach(row => {
      if (row[colIdx]) {
        maxLen = Math.max(maxLen, String(row[colIdx]).length);
      }
    });
    return { wch: Math.min(40, maxLen + 4) };
  });
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${fileName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.xlsx`);
};
