// src/components/DataTable/DataTable.jsx - VERSÃO SIMPLIFICADA E FUNCIONAL
import React, { useMemo, useState } from 'react';
import { useTable, useSortBy, usePagination, useFilters } from 'react-table';
import { 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaChevronLeft, 
  FaChevronRight,
  FaFilter,
  FaTimes
} from 'react-icons/fa';

// Componente para filtro de texto SIMPLES
const TextFilter = ({ column }) => {
  const { filterValue, setFilter } = column;
  
  return (
    <input
      type="text"
      value={filterValue || ''}
      onChange={e => setFilter(e.target.value || undefined)}
      placeholder="Filtrar..."
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
    />
  );
};

// Componente para filtro de número SIMPLES
const NumberFilter = ({ column }) => {
  const { filterValue = [], setFilter } = column;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={filterValue[0] || ''}
          onChange={e => setFilter([e.target.value || undefined, filterValue[1]])}
          placeholder="Min"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        />
        <input
          type="number"
          value={filterValue[1] || ''}
          onChange={e => setFilter([filterValue[0], e.target.value || undefined])}
          placeholder="Max"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        />
      </div>
    </div>
  );
};

// Componente para converter datas do Excel
const ExcelDateFormatter = ({ value }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">—</span>;
  }
  
  const numValue = parseFloat(value);
  
  // Tentar converter número do Excel para data
  if (!isNaN(numValue) && numValue > 0) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + numValue * 86400000);
    
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const ano = date.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
  }
  
  // Tentar converter string para data
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const dia = date.getDate().toString().padStart(2, '0');
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const ano = date.getFullYear();
      return `${dia}/${mes}/${ano}`;
    }
  } catch {
    // Não é data válida
  }
  
  // Se for número, formatar
  if (!isNaN(numValue)) {
    return numValue.toLocaleString('pt-AO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }
  
  // Texto comum
  return String(value);
};

export default function DataTable({ columns, data }) {
  // Processar colunas
  const processedColumns = useMemo(() => {
    return columns.map(col => {
      const header = col.Header?.toString().toLowerCase() || '';
      const accessor = col.accessor?.toString().toLowerCase() || '';
      
      const isDateColumn = header.includes('data') || header.includes('date') || accessor.includes('data');
      const isNumericColumn = header.includes('valor') || header.includes('preço') || 
                            header.includes('custo') || header.includes('quantidade') || 
                            header.includes('total') || header.includes('número') ||
                            header.includes('saldo') || header.includes('montante');
      
      return {
        ...col,
        Cell: ({ value }) => {
          if (isDateColumn) {
            return <ExcelDateFormatter value={value} />;
          }
          
          if (value === null || value === undefined || value === '') {
            return <span className="text-gray-400">—</span>;
          }
          
          if (isNumericColumn && !isNaN(parseFloat(value))) {
            const numValue = parseFloat(value);
            return numValue.toLocaleString('pt-AO', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
          }
          
          return String(value);
        },
        Filter: isNumericColumn ? NumberFilter : TextFilter,
        filter: isNumericColumn ? 'between' : 'text'
      };
    });
  }, [columns]);

  const memoizedData = useMemo(() => data, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setAllFilters,
    state: { pageIndex, pageSize, filters }
  } = useTable(
    {
      columns: processedColumns,
      data: memoizedData,
      initialState: { 
        pageIndex: 0, 
        pageSize: 20
      }
    },
    useFilters,
    useSortBy,
    usePagination
  );

  // Limpar todos os filtros
  const clearFilters = () => {
    setAllFilters([]);
  };

  // Contar filtros ativos
  const activeFiltersCount = filters.length;

  return (
    <div className="space-y-4">
      {/* Controles de filtro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {data.length.toLocaleString('pt-AO')} registros
            </span>
          </div>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FaTimes className="text-xs" />
              Limpar {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mostrar:</span>
            <select
              className="border border-gray-300 rounded px-3 py-1 text-sm"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50, 100, 200, 500].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow">
        <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-b border-gray-200"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold" title={column.render('Header')}>
                          {column.render('Header')}
                        </span>
                        <span className="ml-2 flex-shrink-0">
                          {column.isSorted ? (
                            column.isSortedDesc ? (
                              <FaSortDown className="text-gray-600" />
                            ) : (
                              <FaSortUp className="text-gray-600" />
                            )
                          ) : (
                            <FaSort className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                          )}
                        </span>
                      </div>
                      
                      {column.canFilter && (
                        <div className="mt-1">
                          {column.render('Filter')}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
            {page.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {filters.length > 0 ? (
                    <div className="space-y-2">
                      <p>Nenhum resultado encontrado com os filtros atuais</p>
                      <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Limpar filtros para ver todos os dados
                      </button>
                    </div>
                  ) : (
                    <p>Nenhum dado disponível</p>
                  )}
                </td>
              </tr>
            ) : (
              page.map((row, i) => {
                prepareRow(row);
                return (
                  <tr 
                    {...row.getRowProps()} 
                    className="hover:bg-gray-50"
                  >
                    {row.cells.map(cell => (
                      <td
                        {...cell.getCellProps()}
                        className="px-4 py-3 text-sm text-gray-800 border-t border-gray-100"
                      >
                        {cell.render('Cell')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          Mostrando <span className="font-semibold">
            {(pageIndex * pageSize) + 1} - {Math.min((pageIndex + 1) * pageSize, data.length)}
          </span> de <span className="font-semibold">{data.length.toLocaleString('pt-AO')}</span> registros
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => gotoPage(0)}
            disabled={!canPreviousPage}
            className={`px-3 py-1 rounded ${
              !canPreviousPage
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaChevronLeft className="inline mr-1" />
            Primeira
          </button>
          
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className={`px-3 py-1 rounded ${
              !canPreviousPage
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Anterior
          </button>
          
          <span className="text-sm text-gray-700 px-2">
            Página {pageIndex + 1} de {pageOptions.length}
          </span>
          
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className={`px-3 py-1 rounded ${
              !canNextPage
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Próxima
          </button>
          
          <button
            onClick={() => gotoPage(pageCount - 1)}
            disabled={!canNextPage}
            className={`px-3 py-1 rounded ${
              !canNextPage
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Última
            <FaChevronRight className="inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}