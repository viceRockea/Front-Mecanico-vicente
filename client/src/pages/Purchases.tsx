import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Search, Loader2, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchases, useDeletePurchase } from "@/hooks/use-purchases";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function Purchases() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const { data: allPurchases = [], isLoading } = usePurchases();
  const { toast } = useToast();

  // Verificar si es ADMIN (compatible con ambos formatos)
  const isAdmin = user?.role === "ADMIN" || user?.role === "administrador";
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

  // Filtrado de compras
  let purchases = allPurchases.filter(p => {
    const matchesSearch = searchValue === "" ||
      p.proveedor.nombre.toLowerCase().includes(searchValue.toLowerCase()) ||
      (p.numero_factura?.toLowerCase() || "").includes(searchValue.toLowerCase());

    const matchesSupplier = supplierFilter === "all" ||
      p.proveedor.nombre.toLowerCase().includes(supplierFilter.toLowerCase());

    const date = new Date(p.fecha);
    const matchesMonth = monthFilter === "all" || date.getMonth().toString() === monthFilter;
    const matchesYear = yearFilter === "all" || date.getFullYear().toString() === yearFilter;

    return matchesSearch && matchesSupplier && matchesMonth && matchesYear;
  });

  // Ordenar por fecha descendente
  purchases = [...purchases].sort((a, b) =>
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

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
        {!searchFocused && !searchValue && (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        )}
        <Input
          placeholder=""
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="bg-white border-slate-200 rounded-lg h-12 text-base pl-14"
        />
      </div>

      <div className="card-industrial bg-white p-6 space-y-4 mb-6">
        {/* Filtros */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <span className="text-sm text-slate-600 font-medium">Filtrar por:</span>
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[220px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Proveedores</SelectItem>
              <SelectItem value="frenos chile">Frenos Chile</SelectItem>
              <SelectItem value="importadora indra">Importadora Indra</SelectItem>
              <SelectItem value="autoplanet">AutoPlanet</SelectItem>
              <SelectItem value="frenos san francisco">Frenos San Francisco</SelectItem>
              <SelectItem value="würth">Würth Chile</SelectItem>
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

      <div className="card-industrial bg-white p-6">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2 border-slate-200">
              <TableHead className="font-display font-bold text-slate-900 h-14">Proveedor</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Fecha</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Items</TableHead>
              <TableHead className="text-right font-display font-bold text-slate-900 h-14">Neto</TableHead>
              <TableHead className="text-right font-display font-bold text-slate-900 h-14">IVA</TableHead>
              <TableHead className="text-right font-display font-bold text-slate-900 h-14">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p>Cargando compras...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 text-slate-300" />
                    <p>No se encontraron compras.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <PurchaseRow key={purchase.id} purchase={purchase} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div >
  );
}

function PurchaseRow({ purchase }: { purchase: any }) {
  const { toast } = useToast();
  const deleteMutation = useDeletePurchase();
  const [showDetails, setShowDetails] = useState(false);

  // Calcular totales correctos basándose en los detalles
  const subtotalNeto = purchase.detalles.reduce((sum: number, item: any) => {
    const cantidad = item.cantidad || 0;
    const precioUnitario = item.precio_costo_unitario || 0;
    return sum + (cantidad * precioUnitario);
  }, 0);

  const ivaCalculado = Math.round(subtotalNeto * 0.19);
  const totalCalculado = subtotalNeto + ivaCalculado;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    console.log("🎯 Click en botón eliminar, ID:", purchase.id);

    if (confirm(`¿Estás seguro de eliminar la compra de ${purchase.proveedor.nombre}?`)) {
      console.log("✅ Usuario confirmó eliminación");
      deleteMutation.mutate(purchase.id, {
        onSuccess: () => {
          console.log("🎉 Compra eliminada exitosamente");
          toast({
            title: "Compra eliminada",
            description: `Compra de ${purchase.proveedor.nombre} eliminada correctamente`,
            className: "bg-red-600 text-white border-none"
          });
        },
        onError: (error: any) => {
          console.error("❌ Error al eliminar compra:", error);
          toast({
            title: "Error",
            description: error?.message || "No se pudo eliminar la compra",
            variant: "destructive"
          });
        }
      });
    } else {
      console.log("❌ Usuario canceló eliminación");
    }
  };

  return (
    <>
      <TableRow className="table-row-hover group border-b border-slate-100">
        <TableCell className="font-semibold text-slate-900">{purchase.proveedor.nombre}</TableCell>
        <TableCell className="text-slate-600">{new Date(purchase.fecha).toLocaleDateString('es-CL')}</TableCell>
        <TableCell
          onClick={() => setShowDetails(true)}
          className="cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{purchase.detalles.length} productos</span>
            <span className="text-xs text-slate-500">
              ({purchase.detalles.reduce((sum: number, item: any) => sum + (item.cantidad || 0), 0)} unidades)
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right font-mono text-slate-900">
          ${subtotalNeto.toLocaleString('es-CL')}
        </TableCell>
        <TableCell className="text-right font-mono text-slate-600">
          ${ivaCalculado.toLocaleString('es-CL')}
        </TableCell>
        <TableCell className="text-right font-mono font-bold text-slate-900">
          ${totalCalculado.toLocaleString('es-CL')}
        </TableCell>
      </TableRow>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Detalle de Compra
            </DialogTitle>
            <div className="text-sm text-slate-500 mt-1">
              {purchase.proveedor.nombre} • Doc: {purchase.numero_factura || "S/N"} • {new Date(purchase.fecha).toLocaleDateString('es-CL')}
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Tabla de productos */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Productos ({purchase.detalles.length})
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
                    {purchase.detalles.map((item: any, idx: number) => (
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
                    ${subtotalNeto.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">IVA (19%)</span>
                  <span className="text-base font-mono font-medium text-slate-900">
                    ${ivaCalculado.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="pt-3 border-t-2 border-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-mono font-bold text-primary">
                      ${totalCalculado.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

