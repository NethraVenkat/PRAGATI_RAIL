import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportReportToPDF = (reportTitle, dataSummary, tableHeaders, tableData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Header background bar
  doc.setFillColor(30, 58, 138); // Railway Blue
  doc.rect(0, 0, 210, 24, 'F');

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PRAGATI-RAIL — INDIAN RAILWAYS', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Maintenance Block Schedule & Inter-Division Optimization', 14, 18);

  // Document metadata right aligned
  doc.setFontSize(8);
  doc.text(`Generated: ${timestamp}`, 196, 12, { align: 'right' });
  doc.text('Ministry of Railways • National Platform', 196, 18, { align: 'right' });

  // Report Section Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, 34);

  // Summary box
  if (dataSummary && dataSummary.length > 0) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 38, 182, 22, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    let xPos = 20;
    dataSummary.forEach((item, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}: `, xPos, 48);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.value}`, xPos + (item.label.length * 2.2) + 2, 48);
      xPos += 60;
      if ((idx + 1) % 3 === 0) {
        xPos = 20;
      }
    });
  }

  // Table
  autoTable(doc, {
    startY: dataSummary ? 66 : 42,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`PRAGATI-RAIL System Report • Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.pdf`);
};
