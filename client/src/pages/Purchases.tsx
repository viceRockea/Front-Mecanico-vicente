import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, ShoppingCart, Trash2, MoreHorizontal, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchases, useDeletePurchase, Purchase } from "@/hooks/use-purchases";
import { useProviders } from "@/hooks/use-providers";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { DataTable } from "@/components/ui/data-table";
import { createColumns, PurchaseWithTotals } from "@/components/purchases/columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Purchases() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: allPurchases = [], isLoading } = usePurchases();
  const { mutate: deletePurchaseMutation } = useDeletePurchase();
  const { toast } = useToast();

  const { data: providers = [] } = useProviders();

  // Filtros state
  const [searchValue, setSearchValue] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Selection state for Detail View
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithTotals | null>(null);

  // Verificar si es ADMIN
  const isAdmin = user?.role === "ADMIN" || user?.role === "administrador";

  // 1. Transformar datos (calcular totales)
  const purchasesWithTotals = useMemo(() => {
    return allPurchases.map((p) => {
      const subtotalNeto = p.detalles.reduce((sum, item) => {
        const cantidad = item.cantidad || 0;
        const precioUnitario = item.precio_costo_unitario || 0;
        return sum + (cantidad * precioUnitario);
      }, 0);

      const ivaCalculado = Math.round(subtotalNeto * 0.19);
      const totalCalculado = subtotalNeto + ivaCalculado;
      const totalUnits = p.detalles.reduce((sum, item) => sum + (item.cantidad || 0), 0);

      return {
        ...p,
        totalItems: p.detalles.length,
        totalUnits,
        neto: subtotalNeto,
        iva: ivaCalculado,
        total: totalCalculado
      } as PurchaseWithTotals;
    });
  }, [allPurchases]);

  // 2. Filtrar datos
  const filteredPurchases = useMemo(() => {
    return purchasesWithTotals.filter(p => {
      const matchesSearch = searchValue === "" ||
        p.proveedor.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
        (p.numero_factura?.toLowerCase() || "").includes(searchValue.toLowerCase());

      const matchesSupplier = supplierFilter === "all" ||
        p.proveedor.nombre.toLowerCase().includes(supplierFilter.toLowerCase());

      const date = new Date(p.fecha);
      const matchesMonth = monthFilter === "all" || date.getMonth().toString() === monthFilter;
      const matchesYear = yearFilter === "all" || date.getFullYear().toString() === yearFilter;

      return matchesSearch && matchesSupplier && matchesMonth && matchesYear;
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [purchasesWithTotals, searchValue, supplierFilter, monthFilter, yearFilter]);

  // Handlers
  const handleDelete = (purchase: PurchaseWithTotals) => {
    if (confirm(`¿Estás seguro de eliminar la compra de ${purchase.proveedor.nombre}?`)) {
      deletePurchaseMutation(purchase.id, {
        onSuccess: () => {
          toast({
            title: "Compra eliminada",
            description: `Compra de ${purchase.proveedor.nombre} eliminada correctamente`,
            className: "bg-red-600 text-white border-none"
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.message || "No se pudo eliminar la compra",
            variant: "destructive"
          });
        }
      });
    }
  };

  const handleView = (purchase: PurchaseWithTotals) => {
    setSelectedPurchase(purchase);
  };

  const columns = useMemo(() => createColumns(handleView, handleDelete), []);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-muted-foreground">Solo los administradores pueden ver esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Compras"
        description="Registre nuevas adquisiciones de stock y gestione proveedores."
        action={
          <Button
            className="btn-pill bg-primary shadow-lg shadow-primary/20"
            onClick={() => setLocation("/purchases/create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Compra
          </Button>
        }
      />

      {/* Buscador principal */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por proveedor o número de factura..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="bg-white border-slate-200 rounded-lg h-12 text-base pl-12 shadow-sm focus:border-primary focus:ring-primary/20"
        />
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 mb-6">
        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-600 font-medium">Filtrar por:</span>
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[220px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Proveedores</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.nombre}>
                  {provider.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Meses</SelectItem>
              <SelectItem value="0">Enero</SelectItem>
              <SelectItem value="1">Febrero</SelectItem>
              <SelectItem value="2">Marzo</SelectItem>
              <SelectItem value="3">Abril</SelectItem>
              <SelectItem value="4">Mayo</SelectItem>
              <SelectItem value="5">Junio</SelectItem>
              <SelectItem value="6">Julio</SelectItem>
              <SelectItem value="7">Agosto</SelectItem>
              <SelectItem value="8">Septiembre</SelectItem>
              <SelectItem value="9">Octubre</SelectItem>
              <SelectItem value="10">Noviembre</SelectItem>
              <SelectItem value="11">Diciembre</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[120px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p>Cargando compras...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredPurchases}
          />
        )}
      </div>

      {/* Dialog Detalle */}
      <Dialog open={!!selectedPurchase} onOpenChange={(open) => !open && setSelectedPurchase(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedPurchase && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  Detalle de Compra
                </DialogTitle>
                <div className="text-sm text-slate-500 mt-1">
                  {selectedPurchase.proveedor.nombre} • Doc: {selectedPurchase.numero_factura || "S/N"} • {new Date(selectedPurchase.fecha).toLocaleDateString('es-CL')}
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                {/* Tabla de productos */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                    Productos ({selectedPurchase.detalles.length})
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Producto</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase w-20">Cant.</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase w-32">Precio Unit.</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase w-32">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPurchase.detalles.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">
                                {item.producto?.nombre || item.nombre || 'Producto'}
                              </div>
                              {item.producto?.sku && (
                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                  SKU: {item.producto.sku}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                              {item.cantidad}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-mono text-slate-700">
                              ${(item.precio_costo_unitario || 0).toLocaleString('es-CL')}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-mono font-semibold text-slate-900">
                              ${((item.cantidad || 0) * (item.precio_costo_unitario || 0)).toLocaleString('es-CL')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Card de resumen */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
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


