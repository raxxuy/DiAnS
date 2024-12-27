import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { stockhistory } from '@prisma/client';

export default function ExportButtons({ 
  stockHistory, 
  code, 
  fromDate, 
  toDate 
}: { 
  stockHistory: stockhistory[], 
  code?: string, 
  fromDate: string, 
  toDate: string 
}) {
  const exportToCSV = () => {
    if (stockHistory.length === 0) return;
    
    const csvContent = [
      ['Date', 'Last Trade Price', 'Max Price', 'Min Price', 'Change', 'Volume', 'Turnover Best', 'Total Turnover'],
      ...stockHistory.map(h => [
        new Date(h.date).toLocaleDateString(),
        h.last_trade_price,
        h.max_price,
        h.min_price,
        h.percent_change,
        h.volume,
        h.turnover_best,
        h.total_turnover
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(csvContent);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${code}_market_data.csv`);
  };

  const exportToExcel = () => {
    if (stockHistory.length === 0) return;
    
    const wsData = [
      ['Date', 'Last Trade Price', 'Max Price', 'Min Price', 'Change', 'Volume', 'Turnover Best', 'Total Turnover'],
      ...stockHistory.map(h => [
        new Date(h.date).toLocaleDateString(),
        h.last_trade_price,
        h.max_price,
        h.min_price,
        h.percent_change,
        h.volume,
        h.turnover_best,
        h.total_turnover
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Market Data');
    XLSX.writeFile(wb, `${code}_market_data.xlsx`);
  };

  const exportToPDF = () => {
    if (stockHistory.length === 0) return;
    
    const doc = new jsPDF();
    
    doc.text(`Market Data - ${code}`, 14, 15);
    doc.text(`Period: ${new Date(fromDate).toLocaleDateString()} - ${new Date(toDate).toLocaleDateString()}`, 14, 25);

    const tableData = stockHistory.map(h => [
      new Date(h.date).toLocaleDateString(),
      h.last_trade_price,
      h.max_price,
      h.min_price,
      h.percent_change,
      h.volume,
      h.turnover_best,
      h.total_turnover
    ]);

    (doc as any).autoTable({
      head: [['Date', 'Last Trade Price', 'Max Price', 'Min Price', 'Change', 'Volume', 'Turnover Best', 'Total Turnover']],
      body: tableData,
      startY: 35,
    });

    doc.save(`${code}_market_data.pdf`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToCSV}
        className="export-button"
        disabled={!code || stockHistory.length === 0}
      >
        Export CSV
      </button>
      <button
        onClick={exportToExcel}
        className="export-button"
        disabled={!code || stockHistory.length === 0}
      >
        Export Excel
      </button>
      <button
        onClick={exportToPDF}
        className="export-button"
        disabled={!code || stockHistory.length === 0}
      >
        Export PDF
      </button>
    </div>
  );
} 