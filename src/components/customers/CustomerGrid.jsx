import React, { useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Search, Download, Crown, UserCheck, UserX, ArrowRight } from 'lucide-react';

export default function CustomerGrid({ customers = [], onCustomerSelect, selectedCustomerId }) {
  const [quickFilterText, setQuickFilterText] = useState('');
  const gridRef = useRef(null);

  // Status Badge Renderer
  const StatusRenderer = (params) => {
    const status = params.value || 'Active';
    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let Icon = UserCheck;

    if (status === 'VIP') {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      Icon = Crown;
    } else if (status === 'Inactive') {
      badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
      Icon = UserX;
    }

    return (
      <div className="flex items-center h-full">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}>
          <Icon className="w-3 h-3 shrink-0" />
          <span>{status}</span>
        </span>
      </div>
    );
  };

  // Name with Avatar
  const NameRenderer = (params) => {
    const name = params.value || 'Customer';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const isVIP = params.data?.status === 'VIP';

    return (
      <div className="flex items-center gap-2.5 h-full">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
            isVIP
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-blue-50 text-[#003087] border border-blue-200'
          }`}
        >
          {initials}
        </div>
        <div className="flex flex-col truncate">
          <span className="font-semibold text-slate-900 text-xs truncate">{name}</span>
          {params.data?.company && (
            <span className="text-[10px] text-slate-400 truncate">{params.data.company}</span>
          )}
        </div>
      </div>
    );
  };

  // Spending Renderer
  const SpendingRenderer = (params) => {
    const val = Number(params.value || 0);
    const isHigh = val >= 10000;

    return (
      <div className="flex items-center justify-end h-full font-mono text-xs font-bold">
        <span className={isHigh ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}>
          ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    );
  };

  // Column Definitions
  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Customer Name',
        field: 'name',
        minWidth: 190,
        flex: 1.5,
        cellRenderer: NameRenderer,
        filter: 'agTextColumnFilter',
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
        headerName: 'Total Spent',
        field: 'totalSpent',
        minWidth: 120,
        flex: 1.1,
        headerClass: 'ag-right-aligned-header',
        cellRenderer: SpendingRenderer,
        filter: 'agNumberColumnFilter',
        sort: 'desc',
      },
      {
        headerName: 'Orders',
        field: 'transactions',
        minWidth: 90,
        flex: 0.8,
        filter: 'agNumberColumnFilter',
        cellClass: 'text-xs font-mono text-slate-700 flex items-center justify-center',
      },
      {
        headerName: 'First Purchase',
        field: 'firstPurchase',
        minWidth: 120,
        flex: 1,
        filter: 'agDateColumnFilter',
        cellClass: 'text-xs text-slate-500 flex items-center',
      },
      {
        headerName: 'Last Purchase',
        field: 'lastPurchase',
        minWidth: 120,
        flex: 1,
        filter: 'agDateColumnFilter',
        cellClass: 'text-xs text-slate-600 flex items-center font-medium',
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 110,
        flex: 1,
        cellRenderer: StatusRenderer,
        filter: 'agTextColumnFilter',
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const handleExportCSV = () => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `payassist_customers_${new Date().toISOString().split('T')[0]}.csv`,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
      {/* Grid Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Customer Directory</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Click any customer row to inspect purchase history and contact profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Search customers..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#003087] focus:ring-1 focus:ring-blue-100 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all text-slate-800 placeholder-slate-400"
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
      <div className="ag-theme-alpine w-full h-[480px] rounded-xl overflow-hidden border border-slate-200/90 cursor-pointer">
        <AgGridReact
          ref={gridRef}
          rowData={customers}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={15}
          paginationPageSizeSelector={[10, 15, 25, 50]}
          rowSelection="single"
          animateRows={true}
          onRowClicked={(event) => onCustomerSelect?.(event.data)}
          suppressCellFocus={true}
        />
      </div>
    </div>
  );
}
