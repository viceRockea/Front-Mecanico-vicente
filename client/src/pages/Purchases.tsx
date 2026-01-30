import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, ShoppingCart, Trash2, MoreHorizontal, Eye, Filter, RefreshCcw, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchases, useDeletePurchase, Purchase } from "@/hooks/use-purchases";
import { useProviders } from "@/hooks/use-providers";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { createColumns, PurchaseWithTotals } from "@/components/purchases/columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Purchases() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: allPurchases = [], isLoading } = usePurchases();
  const { mutate: deletePurchaseMutation } = useDeletePurchase();
  const { toast } = useToast();
  const { data: providers = [] } = useProviders();

  // Estados de Tabla
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Filtros manuales
  const [searchValue, setSearchValue] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithTotals | null>(null);

  const purchasesWithTotals: PurchaseWithTotals[] = useMemo(() => {
    return allPurchases.map(p => {
      // CORRECCIÓN: Usar casting (d as any) para acceder a precio_unitario
      const neto = p.detalles.reduce((acc, d) => acc + (d.cantidad * ((d as any).precio_unitario || 0)), 0);
      const iva = Math.round(neto * 0.19);
      const total = neto + iva;
      const totalItems = p.detalles.length;
      const totalUnits = p.detalles.reduce((acc, d) => acc + d.cantidad, 0);

      return {
        ...p,
        neto,
        iva,
        total,
        totalItems,
        totalUnits
      };
    });
  }, [allPurchases]);

  const filteredPurchases = useMemo(() => {
    return purchasesWithTotals.filter(p => {
      const searchLower = searchValue.toLowerCase();
      // Casting seguro para propiedades que podrían faltar en la interfaz
      const matchesSearch =
        (p.proveedor?.nombre?.toLowerCase() || "").includes(searchLower) ||
        ((p as any).numero_factura?.toLowerCase() || "").includes(searchLower) ||
        ((p as any).folio?.toLowerCase() || "").includes(searchLower);

      // Usar p.proveedor?.id
      const matchesSupplier = supplierFilter === "all" || p.proveedor?.id === supplierFilter;

      return matchesSearch && matchesSupplier;
    });
  }, [purchasesWithTotals, searchValue, supplierFilter]);

  const handleDelete = (purchase: PurchaseWithTotals) => {
    if (confirm("¿Estás seguro de eliminar esta compra? Se revertirá el stock de los productos.")) {
      deletePurchaseMutation(purchase.id, {
        onSuccess: () => toast({ title: "Compra eliminada y stock revertido" }),
        onError: (err) => toast({ title: "Error al eliminar", description: err.message, variant: "destructive" })
      });
    }
  };

  const columns = useMemo(() => createColumns(
    (p) => setSelectedPurchase(p),
    (p) => handleDelete(p)
  ), []);

  const table = useReactTable({
    data: filteredPurchases,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Compras"
        description="Gestiona las compras realizadas y el ingreso de stock."
        action={
          <Button onClick={() => setLocation('/purchases/create')} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Nueva Compra
          </Button>
        }
      />

      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          
          {/* Buscador */}
          <div className="relative w-full lg:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por proveedor..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-1 flex-col md:flex-row gap-3 w-full lg:w-auto items-center flex-wrap lg:justify-end">
            
            {/* Filtro Proveedor */}
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="h-10 w-full md:w-[200px] bg-slate-50 border-dashed">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <SelectValue placeholder="Proveedor" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* BOTÓN COLUMNAS (AHORA AFUERA) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto h-10 bg-slate-50 border-dashed">
                  Columnas <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {(searchValue || supplierFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSearchValue(""); setSupplierFilter("all"); }}
                className="h-10 w-10 text-slate-400 hover:text-rose-500"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TABLA MANUAL */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={columns.length} className="h-24 text-center">
                   <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                 </TableCell>
               </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* DIALOGO DETALLE */}
      <Dialog open={!!selectedPurchase} onOpenChange={(o) => !o && setSelectedPurchase(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de Compra</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedPurchase.proveedor?.nombre}</h3>
                  {/* CORRECCIÓN: Casting para acceder a rut */}
                  <p className="text-slate-500">{(selectedPurchase.proveedor as any)?.rut || "Sin RUT"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-500">Fecha</p>
                  <p className="text-slate-900">{new Date(selectedPurchase.fecha).toLocaleDateString('es-CL')}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-slate-600">Producto</th>
                      <th className="py-3 px-4 text-right font-medium text-slate-600">Cantidad</th>
                      <th className="py-3 px-4 text-right font-medium text-slate-600">Precio Unit.</th>
                      <th className="py-3 px-4 text-right font-medium text-slate-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.detalles.map((d, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{d.producto?.nombre}</div>
                          <div className="text-xs text-slate-500">{d.producto?.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-right">{d.cantidad}</td>
                        {/* CORRECCIÓN: Casting para precio_unitario */}
                        <td className="py-3 px-4 text-right">${((d as any).precio_unitario || 0).toLocaleString('es-CL')}</td>
                        <td className="py-3 px-4 text-right font-medium">${(d.cantidad * ((d as any).precio_unitario || 0)).toLocaleString('es-CL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-1/3 bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-bold text-slate-700 mb-2 border-b border-slate-200 pb-2">
                    Resumen
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Subtotal (Neto)</span>
                      <span className="text-base font-mono font-medium text-slate-900">
                        ${selectedPurchase.neto.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">IVA (19%)</span>
                      <span className="text-base font-mono font-medium text-slate-900">
                        ${selectedPurchase.iva.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="pt-3 border-t-2 border-slate-300">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-mono font-bold text-primary">
                          ${selectedPurchase.total.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}