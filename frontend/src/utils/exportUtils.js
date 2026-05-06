import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportCSV = (filename, headers, rows) => {
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportPDF = (filename, title, headers, rows) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [249, 115, 22], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });
  doc.save(`${filename}.pdf`);
};
