"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    searchPlaceholder?: string
    categories?: { id: string, nombre: string }[]
    categoryColumn?: string
    stockColumn?: string
    actions?: React.ReactNode
    customFilters?: React.ReactNode
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey = "nombre",
    searchPlaceholder = "Buscar...",
    categories = [],
    categoryColumn = "categoria",
    stockColumn = "stock_actual",
    actions,
    customFilters
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [globalFilter, setGlobalFilter] = React.useState("")

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, columnId, filterValue) => {
            const safeValue = (() => {
                const value = row.original as any;
                const compat = value.modelosCompatibles || value.compatibilidades || [];
                const compatString = compat.map((c: any) => `${c.marca} ${c.modelo} ${c.anio}`).join(" ");

                return (
                    (value.sku || "") + " " +
                    (value.nombre || "") + " " +
                    (value.marca || "") + " " +
                    compatString
                ).toLowerCase();
            })();
            return safeValue.includes(String(filterValue).toLowerCase());
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    })

    // Set page size to 10 by default
    React.useEffect(() => {
        table.setPageSize(10);
    }, [table]);

    return (
        <div className="space-y-4">
            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">

                {/* TOP ROW: Search + Filters + Actions */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">

                    {/* LEFT & CENTER: Search + Custom Filters */}
                    <div className="flex flex-1 flex-col md:flex-row gap-3 w-full lg:w-auto items-start md:items-center flex-wrap">
                        <Input
                            placeholder={searchPlaceholder}
                            value={globalFilter ?? ""}
                            onChange={(event) =>
                                setGlobalFilter(event.target.value)
                            }
                            className="h-9 w-full md:w-[250px] bg-slate-50"
                        />

                        {/* CATEGORY SELECT (Built-in) */}
                        {categories.length > 0 && categoryColumn && (
                            <Select
                                value={(table.getColumn(categoryColumn)?.getFilterValue() as string) ?? "all"}
                                onValueChange={(value) => table.getColumn(categoryColumn)?.setFilterValue(value === "all" ? undefined : value)}
                            >
                                <SelectTrigger className="h-9 w-[180px] bg-slate-50 border-dashed">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las Categorías</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* CUSTOM INJECTED FILTERS */}
                        {customFilters}
                    </div>

                    {/* RIGHT: View Options + Actions */}
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="ml-auto h-9 border-dashed text-xs">
                                    <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
                                    Columnas
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                                <DropdownMenuLabel>Alternar columnas</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (column) =>
                                            typeof column.accessorFn !== "undefined" && column.getCanHide()
                                    )
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize text-xs"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id.replace("_", " ")}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {actions}
                    </div>
                </div>
            </div>

            {/* TABLA */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-slate-50 border-b border-slate-200">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-11 font-bold text-slate-700 text-xs uppercase tracking-tight">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="hover:bg-slate-50/60 border-b border-slate-100 last:border-0 transition-colors"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2.5">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    <div className="flex flex-col items-center justify-center p-8 opacity-60">
                                        <p className="text-sm font-semibold">No se encontraron resultados.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Intente ajustar los filtros de búsqueda.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* PAGINACIÓN */}
            <div className="flex items-center justify-end space-x-2 py-2">
                <div className="flex-1 text-sm text-muted-foreground pl-2">
                    {table.getFilteredRowModel().rows.length} producto(s) encontrados.
                </div>
                <div className="space-x-2 pr-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 w-20 text-xs"
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 w-20 text-xs"
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    )
}
