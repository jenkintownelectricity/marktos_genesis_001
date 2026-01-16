import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { DNASequence } from '@/types';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface DataGridProps {
  data: DNASequence[];
  onSelect: (sequence: DNASequence) => void;
}

const columnHelper = createColumnHelper<DNASequence>();

export function DataGrid({ data, onSelect }: DataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('data.rating', {
        header: 'Rating',
        cell: (info) => (
          <span className={`rating-badge rating-${info.getValue()}`}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('data.crit_temp_C', {
        header: 'Temp (C)',
        cell: (info) => `${info.getValue()}°C`,
      }),
      columnHelper.accessor('data.thickness_mm', {
        header: 'Thickness',
        cell: (info) => `${info.getValue()} mm`,
      }),
      columnHelper.accessor('data.max_section_factor', {
        header: 'Max Ap/V',
        cell: (info) => `${info.getValue()} m⁻¹`,
      }),
      columnHelper.accessor('data.exposure', {
        header: 'Exposure',
        cell: (info) => (
          <span className="text-gray-600">
            {info.getValue() === '3S' ? '3-Sided' : '4-Sided'}
          </span>
        ),
      }),
      columnHelper.accessor('id', {
        header: 'DNA ID',
        cell: (info) => (
          <span className="dna-sequence truncate max-w-xs block">
            {info.getValue()}
          </span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      {header.column.getIsSorted() === 'asc' && (
                        <ChevronUpIcon className="h-4 w-4" />
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row.original)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{' '}
          of {data.length.toLocaleString()}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="btn-secondary text-sm py-1 px-3 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
