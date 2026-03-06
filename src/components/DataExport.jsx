import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/helpers';

/**
 * Converts an array of objects to CSV string.
 */
const toCSV = (data, columns) => {
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      let val = c.accessor(row);
      if (val === null || val === undefined) val = '';
      // Escape commas and quotes
      val = String(val).replace(/"/g, '""');
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val}"`;
      }
      return val;
    }).join(',')
  );
  return [headers, ...rows].join('\n');
};

/**
 * Generates a basic HTML document for PDF printing.
 */
const toPrintableHTML = (data, columns, title) => {
  const headerRow = columns.map(c => `<th style="border:1px solid #ddd;padding:8px;background:#f3f4f6;text-align:left;font-size:12px;">${c.label}</th>`).join('');
  const bodyRows = data.map(row => {
    const cells = columns.map(c => {
      const val = c.accessor(row) ?? '';
      return `<td style="border:1px solid #ddd;padding:8px;font-size:12px;">${val}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        p { color: #666; font-size: 12px; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Exported on ${new Date().toLocaleDateString()}</p>
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
    </html>
  `;
};

/**
 * Pre-configured column sets for different data types.
 */
export const EXPORT_COLUMNS = {
  expenses: [
    { label: 'Date', accessor: (r) => formatDate(r.date) },
    { label: 'Amount', accessor: (r) => r.amount },
    { label: 'Type', accessor: (r) => r.type || 'expense' },
    { label: 'Category', accessor: (r) => r.category },
    { label: 'Description', accessor: (r) => r.description || '' },
  ],
  mood: [
    { label: 'Date', accessor: (r) => formatDate(r.date) },
    { label: 'Mood', accessor: (r) => r.mood },
    { label: 'Factors', accessor: (r) => (r.factors || []).join('; ') },
    { label: 'Journal', accessor: (r) => r.journal || '' },
  ],
  goals: [
    { label: 'Title', accessor: (r) => r.title },
    { label: 'Category', accessor: (r) => r.category },
    { label: 'Progress', accessor: (r) => `${r.currentProgress}/${r.targetValue}` },
    { label: 'Status', accessor: (r) => r.status },
    { label: 'Deadline', accessor: (r) => r.deadline || 'N/A' },
  ],
  health: [
    { label: 'Date', accessor: (r) => formatDate(r.date) },
    { label: 'Type', accessor: (r) => r.type },
    { label: 'Duration (min)', accessor: (r) => r.duration || '' },
    { label: 'Calories', accessor: (r) => r.calories || '' },
    { label: 'Sleep (hrs)', accessor: (r) => r.hours || '' },
    { label: 'Description', accessor: (r) => r.description || '' },
  ],
  attendance: [
    { label: 'Date', accessor: (r) => formatDate(r.date) },
    { label: 'Course', accessor: (r) => r.courseName || r.course || '' },
    { label: 'Attended', accessor: (r) => r.attended ? 'Yes' : 'No' },
  ],
};

export const DataExport = ({ data = [], columns, title = 'Export', className = '' }) => {
  const [exporting, setExporting] = useState(false);

  const handleCSV = () => {
    try {
      setExporting(true);
      const csvContent = toCSV(data, columns);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const handlePDF = () => {
    try {
      setExporting(true);
      const html = toPrintableHTML(data, columns, title);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        toast.success('PDF print dialog opened');
      } else {
        toast.error('Please allow popups to export PDF');
      }
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  if (data.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 text-xs ${className}`}
          disabled={exporting}
          aria-label={`Export ${title} data`}
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Export
          <ChevronDown className="w-3 h-3" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <button
            onClick={handleCSV}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Export as CSV
          </button>
          <button
            onClick={handlePDF}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <FileText className="w-4 h-4 text-rose-400" aria-hidden="true" />
            Export as PDF
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
