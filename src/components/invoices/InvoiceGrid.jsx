import React, { useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Search,
  Download,
  Send,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Mail,
} from 'lucide-react';

export default function InvoiceGrid({
  invoices = [],
  onSendInvoice,
  onViewInvoice,
  isLoading,
}) {
  const [quickFilterText, setQuickFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const gridRef = useRef(null);

  // Status badges
  const StatusRenderer = (params) => {
    const status = params.value || 'Draft';
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let Icon = Clock;

    switch (status.toLowerCase()) {
      case 'paid':
        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle;
        break;
      case 'sent':
        badgeClass = 'bg-blue-50 text-[#003087] border-blue-200';
        Icon = Mail;
        break;
      case 'overdue':
        badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = AlertCircle;
        break;
      case 'draft':
      default:
        badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
        Icon = Clock;
        break;
    }

    return (
      <div className="flex items-center h-full">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
        >
          <Icon className="w-3 h-3 shrink-0" />
          <span>{status}</span>
        </span>
      </div>
    );
  };

  // Actions Cell Renderer
  const ActionsRenderer = (params) => {
    const invoice = params.data;
    if (!invoice) return null;

    const isDraft = invoice.status?.toLowerCase() === 'draft';
    const isSent = invoice.status?.toLowerCase() === 'sent';

    return (
      <div className="flex items-center gap-1.5 h-full">
        {(isDraft || isSent) && (
          <button
            type="button"
            onClick={() => onSendInvoice?.(invoice.id)}
            title={isDraft ? 'Send invoice to customer' : 'Resend invoice email'}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#003087] hover:text-white bg-blue-50 hover:bg-[#003087] px-2.5 py-1 rounded-lg border border-blue-200/80 transition-all active:scale-95"
          >
            <Send className="w-3 h-3" />
            <span>{isDraft ? 'Send' : 'Resend'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onViewInvoice?.(invoice)}
          title="View invoice details"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200 transition-all active:scale-95"
        >
          <Eye className="w-3 h-3 text-slate-500" />
          <span>View</span>
        </button>
      </div>
    );
  };

  // Amount renderer
  const AmountRenderer = (params) => {
    const val = Number(params.value || 0);
    return (
      <div className="flex items-center justify-end h-full font-mono font-semibold text-sm text-slate-900">
        ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    );
  };

  // Invoice Number renderer with icon
  const InvoiceNumberRenderer = (params) => {
    return (
      <div className="flex items-center gap-1.5 h-full font-mono text-xs font-semibold text-[#003087]">
        <FileText className="w-3.5 h-3.5 text-slate-400" />
        <span>{params.value}</span>
      </div>
    );
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Invoice #',
        field: 'id',
        minWidth: 140,
        flex: 1.1,
        cellRenderer: InvoiceNumberRenderer,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Customer',
        field: 'customer',
        minWidth: 170,
        flex: 1.4,
        filter: 'agTextColumnFilter',
        cellClass: 'text-xs font-semibold text-slate-800 flex items-center',
      },
      {
        headerName: 'Email',
        field: 'email',
        minWidth: 180,
        flex: 1.4,
        filter: 'agTextColumnFilter',
        cellClass: 'text-xs text-slate-500 flex items-center truncate',
      },
      {
        headerName: 'Amount',
        field: 'amount',
        minWidth: 110,
        flex: 1,
        headerClass: 'ag-right-aligned-header',
        cellRenderer: AmountRenderer,
        filter: 'agNumberColumnFilter',
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 120,
        flex: 1,
        cellRenderer: StatusRenderer,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Due Date',
        field: 'dueDate',
        minWidth: 120,
        flex: 1,
        filter: 'agDateColumnFilter',
        cellClass: 'text-xs text-slate-600 flex items-center',
      },
      {
        headerName: 'Created',
        field: 'created',
        minWidth: 110,
        flex: 0.9,
        cellClass: 'text-xs text-slate-400 flex items-center',
      },
      {
        headerName: 'Actions',
        minWidth: 150,
        flex: 1.2,
        sortable: false,
        filter: false,
        cellRenderer: ActionsRenderer,
      },
    ],
    [onSendInvoice, onViewInvoice]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  // Filtered rows based on selected status tab
  const filteredData = useMemo(() => {
    if (selectedStatus === 'ALL') return invoices;
    return invoices.filter(
      (inv) => inv.status?.toLowerCase() === selectedStatus.toLowerCase()
    );
  }, [invoices, selectedStatus]);

  const handleExportCSV = () => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `payassist_invoices_${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

  const statusTabs = ['ALL', 'Paid', 'Sent', 'Draft', 'Overdue'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
          {statusTabs.map((status) => {
            const count =
              status === 'ALL'
                ? invoices.length
                : invoices.filter((i) => i.status?.toLowerCase() === status.toLowerCase()).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  selectedStatus === status
                    ? 'bg-white text-[#003087] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{status === 'ALL' ? 'All Invoices' : status}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedStatus === status
                      ? 'bg-blue-50 text-[#003087]'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search invoices..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-1 focus:ring-blue-100 text-xs rounded-xl pl-9 pr-3 py-2 outline-hidden transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* AG Grid */}
      <div className="ag-theme-alpine w-full h-[460px] rounded-xl overflow-hidden border border-slate-200/90">
        <AgGridReact
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={15}
          paginationPageSizeSelector={[10, 15, 25, 50]}
          rowSelection="single"
          animateRows={true}
          suppressCellFocus={true}
          loadingOverlayComponentParams={{ noRowsMessageFunc: () => 'No invoices found' }}
        />
      </div>
    </div>
  );
}
