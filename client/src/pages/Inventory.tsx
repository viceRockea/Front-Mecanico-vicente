import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/hooks/use-auth";
import { AddProductDialog } from "@/components/products/AddProductDialog";
import { DataTable } from "@/components/inventory/data-table";
import { createColumns } from "@/components/inventory/columns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { VehicleModelMultiSelect } from "@/components/VehicleModelMultiSelect";
import { Loader2, DollarSign, Filter, RefreshCcw } from "lucide-react";
import type { VehicleModel } from "@/hooks/use-vehicle-models";

export default function Inventory() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "administrador";

  // Filter State
  const [stockFilter, setStockFilter] = useState("all"); // all, low, out

  // Derived Data: Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // 1. Stock Filter
      if (stockFilter === "low" && product.stock_actual > product.stock_minimo) return false;
      if (stockFilter === "out" && product.stock_actual > 0) return false;

      return true;
    });
  }, [products, stockFilter]);


  const deleteMutation = useDeleteProduct();

  // State for Edit Dialog
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Handlers
  const handleEdit = (product: any) => {
    setEditProduct(product);
    setEditOpen(true);
  };

  const handleDelete = (product: any) => {
    if (confirm(`¿Estás seguro de eliminar el producto ${product.sku}?`)) {
      deleteMutation.mutate(product.id, {
        onSuccess: () => {
          toast({
            title: "Producto eliminado",
            description: `El producto ${product.sku} ha sido eliminado.`,
            className: "bg-emerald-50 text-emerald-900 border-emerald-200"
          });
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive"
          });
        }
      });
    }
  };

  // Columns definition using memo to avoid recreation on render
  const columns = useMemo(() => createColumns(isAdmin, handleEdit, handleDelete), [isAdmin]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-slate-400 animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Cargando inventario...</p>
      </div>
    )
  }

  // Define Custom Filters UI
  const customFilters = (
    <>
      <div className="w-[1px] h-8 bg-slate-200 hidden md:block" />

      {/* STOCK FILTER */}
      <Select value={stockFilter} onValueChange={setStockFilter}>
        <SelectTrigger className="h-9 w-[160px] bg-slate-50 border-dashed">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <SelectValue placeholder="Estado Stock" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Estados</SelectItem>
          <SelectItem value="low" className="text-orange-600 font-medium">⬇️ Bajo Stock</SelectItem>
          <SelectItem value="out" className="text-red-600 font-medium">🚫 Agotado</SelectItem>
        </SelectContent>
      </Select>

      {stockFilter !== "all" && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStockFilter("all")}
          className="h-9 w-9 text-slate-400 hover:text-rose-500"
          title="Limpiar filtros"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Inventario de Repuestos"
        description="Gestión avanzada de productos, stock y precios."
        action={isAdmin ? <AddProductDialog /> : undefined}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <DataTable
          columns={columns}
          data={filteredProducts}
          categories={categories}
          searchKey="nombre"
          searchPlaceholder="Buscar por nombre, SKU, marca..."
          customFilters={customFilters}
        />
      </div>

      {/* DIÁLOGO DE EDICIÓN (Reutilizado del anterior, pero limpio) */}
      {editOpen && editProduct && (
        <EditProductDialog
          product={editProduct}
          open={editOpen}
          onOpenChange={setEditOpen}
          categories={categories}
        />
      )}
    </div>
  );
}

// COMPONENTE DIALOGO EDICIÓN (Separado para limpieza)
function EditProductDialog({ product, open, onOpenChange, categories }: { product: any; open: boolean; onOpenChange: (open: boolean) => void; categories: any[] }) {
  const { toast } = useToast();
  const updateMutation = useUpdateProduct();
  const [selectedModels, setSelectedModels] = useState<VehicleModel[]>(product.modelosCompatibles || product.compatibilidades || []);

  const form = useForm({
    defaultValues: {
      sku: product.sku,
      nombre: product.nombre,
      marca: product.marca || "",
      calidad: product.calidad || "",
      precio_venta: product.precio_venta,
      stock_actual: product.stock_actual,
      stock_minimo: product.stock_minimo,
      categoria_id: product.categoria?.id || "",
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      modelosCompatiblesIds: selectedModels.map(m => m.id),
    };

    updateMutation.mutate({ id: product.id, ...payload }, {
      onSuccess: () => {
        onOpenChange(false);
        toast({
          title: "Producto actualizado",
          description: `${data.sku} ha sido actualizado correctamente`,
          className: "bg-emerald-50 text-emerald-900 border-emerald-200"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el producto",
          variant: "destructive"
        });
      }
    });
  };

  const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const netPrice = parseInt(e.target.value) || 0;
    const grossPrice = Math.round(netPrice * 1.19);
    form.setValue("precio_venta", grossPrice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-slate-50 -mx-6 -mt-6 p-6 border-b border-slate-100 mb-4">
          <DialogTitle className="font-display text-xl flex items-center gap-2 uppercase tracking-wide text-slate-800">
            <div className="bg-blue-600 w-1 h-6 rounded-full"></div>
            Editar Producto
          </DialogTitle>
          <DialogDescription>
            Modifique los detalles del producto <span className="font-mono font-bold text-slate-900">{product.sku}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">SKU</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: FRN-001" className="uppercase font-mono font-bold text-slate-800 bg-slate-50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Marca</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Bosch" className="font-medium" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">Nombre del Producto</FormLabel>
                  <FormControl><Input {...field} placeholder="Ej: Pastillas de freno delanteras" className="font-bold text-lg text-slate-800" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Calidad</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Alta, Media" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campo de Compatibilidad */}
            <FormItem className="pt-2">
              <FormLabel className="text-xs font-bold uppercase text-slate-500">Compatibilidad (Modelos)</FormLabel>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <VehicleModelMultiSelect
                  selectedModels={selectedModels}
                  onModelsChange={setSelectedModels}
                />
              </div>
            </FormItem>

            {/* SECCIÓN PRECIOS Y STOCK */}
            <div className="p-5 bg-blue-50/30 border border-blue-100 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <DollarSign className="w-4 h-4 text-blue-700" />
                </div>
                <h4 className="font-bold text-sm text-blue-900 uppercase tracking-wide">Precios y Stock</h4>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-slate-500">Precio Neto (Ref)</FormLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      defaultValue={Math.round(product.precio_venta / 1.19)}
                      onChange={handleNetPriceChange}
                      className="bg-white pl-7"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="precio_venta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-emerald-700 uppercase">Precio Venta (IVA Inc.)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">$</span>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            className="bg-emerald-50/50 font-bold text-emerald-800 border-emerald-200 focus:border-emerald-500 pl-7 text-lg"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_actual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Stock Actual</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="bg-white font-mono font-medium" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="bg-white font-mono font-medium border-amber-200 focus:border-amber-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6">
                Cancelar
              </Button>
              <Button type="submit" className="h-11 px-8 bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 text-white" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

