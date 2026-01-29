import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreatePurchase, type CreatePurchaseDTO } from "@/hooks/use-purchases";
import { useProviders, useCreateProvider } from "@/hooks/use-providers";
import { useProducts } from "@/hooks/use-products";
import { AddProductDialog } from "@/components/products/AddProductDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Loader2, Trash2, Search, Plus, ArrowLeft, Package, User, FileText, Calendar, Building2 } from "lucide-react";
import { useLocation } from "wouter";

export default function CreatePurchase() {
  const [, setLocation] = useLocation();
  const [providerOpen, setProviderOpen] = useState(false);
  const [createProviderModalOpen, setCreateProviderModalOpen] = useState(false);
  const [searchProvider, setSearchProvider] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [selectedProviderName, setSelectedProviderName] = useState<string>("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

  // QUICK ADD PRODUCT STATES
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [creatingProductForIndex, setCreatingProductForIndex] = useState<number | null>(null);

  // IVA Toggle
  const [includeIva, setIncludeIva] = useState(true);

  const { mutate: createPurchase, isPending } = useCreatePurchase();
  const { data: products = [] } = useProducts();
  const { data: providers = [] } = useProviders();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      numero_documento: "",
      tipo_documento: "FACTURA" as const,
      proveedor_nombre: "",
      items: [] as any[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Filtrar proveedores por búsqueda
  const filteredProviders = providers.filter(p =>
    p.nombre.toLowerCase().includes(searchProvider.toLowerCase()) ||
    (p.telefono?.toLowerCase() || "").includes(searchProvider.toLowerCase()) ||
    (p.email?.toLowerCase() || "").includes(searchProvider.toLowerCase())
  );

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(p =>
    p.sku.toLowerCase().includes(productSearchValue.toLowerCase()) ||
    p.nombre.toLowerCase().includes(productSearchValue.toLowerCase()) ||
    (p.marca?.toLowerCase() || "").includes(productSearchValue.toLowerCase())
  );

  // Calcular totales automáticamente
  const watchItems = form.watch("items");
  const calculatedNeto = (watchItems as any[]).reduce((sum, item) => {
    const cantidad = parseInt(item.cantidad) || 0;
    const precio = parseInt(item.precio_costo) || 0;
    return sum + (cantidad * precio);
  }, 0);
  const calculatedIVA = includeIva ? Math.round(calculatedNeto * 0.19) : 0;
  const calculatedTotal = calculatedNeto + calculatedIVA;

  const onSubmit = (data: any) => {
    // Validar que haya un proveedor
    if (!selectedProviderName || !selectedProviderName.trim()) {
      toast({
        title: "Falta Información",
        description: "Por favor seleccione un proveedor para continuar.",
        className: "bg-amber-50 text-amber-900 border-amber-200"
      });
      return;
    }

    // Validar que haya al menos un ítem
    if (!data.items || data.items.length === 0) {
      toast({
        title: "Sin Productos",
        description: "Agregue al menos un producto a la lista.",
        className: "bg-amber-50 text-amber-900 border-amber-200"
      });
      return;
    }

    // Construir payload
    const payload: CreatePurchaseDTO = {
      proveedor_nombre: selectedProviderName,
      numero_documento: data.numero_documento?.trim() || undefined,
      tipo_documento: data.tipo_documento || "FACTURA",
      items: data.items.map((item: any) => ({
        sku: item.sku?.trim() || "",
        nombre: item.nombre?.trim() || "",
        marca: item.marca?.trim() || undefined,
        calidad: item.calidad?.trim() || undefined,
        cantidad: parseInt(item.cantidad) || 1,
        precio_costo: parseInt(item.precio_costo) || 0,
        precio_venta_sugerido: 0,
        modelos_compatibles_ids: undefined,
      })),
    };

    createPurchase(payload, {
      onSuccess: () => {
        form.reset();
        setLocation("/purchases");
        toast({
          title: "Compra registrada",
          description: "Inventario actualizado correctamente.",
          className: "bg-emerald-50 text-emerald-900 border-emerald-200"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error al registrar",
          description: error.message || "Ocurrió un problema al guardar.",
          className: "bg-rose-50 text-rose-900 border-rose-200"
        });
      }
    });
  };

  const handleAddProductFromSearch = (product: any, index?: number) => {
    // Si viene un índice, actualizamos esa fila
    if (index !== undefined) {
      form.setValue(`items.${index}.sku`, product.sku);
      form.setValue(`items.${index}.nombre`, product.nombre);
      form.setValue(`items.${index}.marca`, product.marca || "");
      form.setValue(`items.${index}.precio_costo`, Math.round(product.precio_venta / 1.19)); // Sugerimos precio neto basado en venta
      return;
    }

    // Si no, agregamos nueva fila (comportamiento anterior)
    const newItem = {
      sku: product.sku,
      nombre: product.nombre,
      marca: product.marca || "",
      calidad: "",
      cantidad: 1,
      precio_costo: Math.round(product.precio_venta / 1.19),
    };

    append(newItem);
    setProductSearchOpen(false);
    setProductSearchValue("");
    toast({
      title: "Producto agregado",
      description: `${product.nombre}`,
      className: "bg-blue-50 text-blue-900 border-blue-100"
    });
  };

  const handleProductCreated = (newProduct: any) => {
    if (creatingProductForIndex !== null) {
      // Rellenar la fila que estaba editando
      const index = creatingProductForIndex;
      form.setValue(`items.${index}.sku`, newProduct.sku);
      form.setValue(`items.${index}.nombre`, newProduct.nombre);
      form.setValue(`items.${index}.marca`, newProduct.marca || "");
      form.setValue(`items.${index}.cantidad`, 1); // Set default quantity to 1

      // Asumimos que si lo acaba de crear, el costo quizás no está definido, o usamos precio venta neto como referencia
      if (newProduct.precio_venta) {
        form.setValue(`items.${index}.precio_costo`, Math.round(newProduct.precio_venta / 1.19));
      }

      toast({
        title: "Producto asignado",
        description: `Se asignó ${newProduct.nombre} a la línea ${index + 1}`,
        className: "bg-emerald-50 text-emerald-900 border-emerald-200"
      });
    } else {
      // If creating from main button (not row specific), append new row
      const newItem = {
        sku: newProduct.sku,
        nombre: newProduct.nombre,
        marca: newProduct.marca || "",
        calidad: "",
        cantidad: 1,
        precio_costo: newProduct.precio_venta ? Math.round(newProduct.precio_venta / 1.19) : 0,
      };
      append(newItem);
      toast({
        title: "Producto agregado",
        description: `${newProduct.nombre}`,
        className: "bg-blue-50 text-blue-900 border-blue-100"
      });
    }
    setCreatingProductForIndex(null);
  };

  return (
    <>
      {/* Header Simplificado */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/purchases")}
              className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Nueva Compra
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-slate-50/50 pb-20">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-7xl mx-auto px-6 py-8 space-y-8">

            {/* Grid Superior: Info Doc y Proveedor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Columna Izquierda: Datos del Documento */}


              {/* Columna Derecha: Selección de Proveedor */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Proveedor
                </h2>

                <div className="flex-1">
                  {!selectedProviderName ? (
                    <div className="h-full flex flex-col justify-center">
                      <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between h-14 text-base font-normal border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all group"
                          >
                            <span className="flex items-center gap-3 text-slate-500 group-hover:text-blue-600">
                              <Search className="w-5 h-5 opacity-50" />
                              Buscar o seleccionar proveedor...
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 border-slate-200 shadow-xl" align="start">
                          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                            <h4 className="font-semibold text-slate-900 text-sm">Seleccionar Proveedor</h4>
                          </div>
                          <Command>
                            <CommandInput
                              placeholder="Buscar proveedor..."
                              value={searchProvider}
                              onValueChange={setSearchProvider}
                              className="h-11 border-none"
                            />
                            <CommandList>
                              <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                                No encontrado.
                                <button
                                  type="button"
                                  onClick={() => setCreateProviderModalOpen(true)}
                                  className="block mx-auto mt-2 text-blue-600 font-medium hover:underline"
                                >
                                  + Crear "{searchProvider}"
                                </button>
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredProviders.map((provider) => (
                                  <CommandItem
                                    key={provider.id}
                                    value={provider.nombre}
                                    onSelect={() => {
                                      setSelectedProviderId(provider.id);
                                      setSelectedProviderName(provider.nombre);
                                      setProviderOpen(false);
                                      setSearchProvider("");
                                    }}
                                    className="cursor-pointer py-3 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {provider.nombre.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">{provider.nombre}</p>
                                        {provider.telefono && <p className="text-xs text-slate-400">{provider.telefono}</p>}
                                      </div>
                                      {selectedProviderId === provider.id && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <div className="mt-4 text-center">
                        <p className="text-xs text-slate-400">¿No encuentra al proveedor?</p>
                        <Button
                          variant="ghost"
                          onClick={() => setCreateProviderModalOpen(true)}
                          className="text-blue-600 h-auto p-0 text-sm font-medium hover:underline"
                        >
                          Crear nuevo proveedor
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex items-center justify-between group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                          <Building2 className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">Proveedor Seleccionado</p>
                          <h3 className="text-lg font-bold text-slate-900">{selectedProviderName}</h3>
                          <div className="flex gap-3 mt-1 text-sm text-slate-500">
                            {/* Aquí podríamos mostrar más info si la tuviéramos en el state seleccionado */}
                            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Verificado</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => { setSelectedProviderName(""); setSelectedProviderId(""); }}
                        className="text-slate-400 hover:text-slate-600 hover:bg-white"
                      >
                        Cambiar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de Ítems (Tabla) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Detalle de Productos</h2>
                  <p className="text-sm text-slate-500">Agregue los ítems de la factura de compra</p>
                </div>

                {/* Botones de acción: Agregar existente o Crear nuevo */}
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                  {/* Botón 1: Crear Nuevo Producto (Directo) */}
                  <Button
                    type="button"
                    onClick={() => {
                      setCreatingProductForIndex(null);
                      setIsAddProductOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Nuevo
                  </Button>

                  {/* Botón 2: Buscador (Popover) */}
                  <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" size="sm" className="w-full md:w-auto justify-between bg-slate-800 text-white hover:bg-slate-700">
                        <span className="flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Buscar y Agregar...
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="end">
                      <Command>
                        <CommandInput
                          placeholder="Buscar por nombre o SKU..."
                          value={productSearchValue}
                          onValueChange={setProductSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty className="py-4 text-center text-sm text-slate-500">
                            No encontrado.
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setProductSearchOpen(false);
                                setCreatingProductForIndex(null);
                                setIsAddProductOpen(true);
                              }}
                              className="text-blue-600 hover:underline p-0 h-auto"
                            >
                              + Crear "{productSearchValue}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup heading="Resultados">
                            {filteredProducts.slice(0, 10).map((product) => (
                              <CommandItem
                                key={product.id}
                                onSelect={() => handleAddProductFromSearch(product)}
                                className="cursor-pointer data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-900"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div>
                                    <p className="font-medium">{product.nombre}</p>
                                    <p className="text-xs text-slate-500">SKU: {product.sku} • Stock: {product.stock_actual}</p>
                                  </div>
                                  <Plus className="w-4 h-4 text-blue-500" />
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="w-[120px] font-bold text-slate-700">SKU</TableHead>
                      <TableHead className="min-w-[250px] font-bold text-slate-700">Producto</TableHead>
                      <TableHead className="w-[150px] font-bold text-slate-700">Marca</TableHead>
                      <TableHead className="w-[140px] font-bold text-slate-700 text-center">Cant.</TableHead>
                      <TableHead className="w-[180px] font-bold text-slate-700 text-right">Costo Unit.</TableHead>
                      <TableHead className="w-[180px] font-bold text-slate-700 text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-48 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                              <Package className="w-8 h-8 text-slate-300" />
                            </div>
                            <p>No hay productos en la lista.</p>
                            <Button variant="outline" size="sm" onClick={() => setProductSearchOpen(true)}>
                              Buscar producto
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      fields.map((field, index) => {
                        const cantidad = form.watch(`items.${index}.cantidad`) || 0;
                        const costo = form.watch(`items.${index}.precio_costo`) || 0;
                        const subtotal = cantidad * costo;

                        return (
                          <TableRow key={field.id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <Input
                                {...form.register(`items.${index}.sku`)}
                                className="h-8 text-xs font-mono bg-white uppercase"
                                placeholder="SKU"
                              />
                            </TableCell>
                            <TableCell>
                              <TableCell>
                                <ProductCombobox
                                  value={form.watch(`items.${index}.nombre`)}
                                  products={products}
                                  onSelect={(product) => handleAddProductFromSearch(product, index)}
                                  onCreateNew={() => {
                                    setCreatingProductForIndex(index);
                                    setIsAddProductOpen(true);
                                  }}
                                />
                              </TableCell>
                            </TableCell>
                            <TableCell>
                              <Input
                                {...form.register(`items.${index}.marca`)}
                                className="h-8 text-xs bg-white"
                                placeholder="Marca"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={form.watch(`items.${index}.cantidad`) ? form.watch(`items.${index}.cantidad`).toLocaleString('es-CL') : ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  form.setValue(`items.${index}.cantidad`, parseInt(val) || 0);
                                }}
                                className="h-8 text-sm text-center bg-white"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                                <Input
                                  type="text"
                                  {...form.register(`items.${index}.precio_costo`, {
                                    valueAsNumber: true,
                                    setValueAs: (v) => v === '' ? 0 : parseInt(v)
                                  })}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    form.setValue(`items.${index}.precio_costo`, parseInt(val) || 0);
                                  }}
                                  className="h-8 text-sm text-right pl-6 font-mono bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium text-slate-700">
                              ${subtotal.toLocaleString('es-CL')}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>


              </div>
            </div>

            {/* Sección Inferior: Resumen y Acciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                {/* Espacio para observaciones o notas futuras */}
              </div>

              {fields.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 ml-auto w-full md:w-[400px]">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Resumen Financiero
                  </h3>
                  <div className="space-y-3">
                    {/* IVA Toggle Switch */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <Label htmlFor="iva-mode" className="text-sm font-medium text-slate-700 cursor-pointer">
                        ¿Incluir IVA?
                      </Label>
                      <Switch
                        id="iva-mode"
                        checked={includeIva}
                        onCheckedChange={setIncludeIva}
                      />
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal Neto</span>
                      <span className="font-mono">${calculatedNeto.toLocaleString('es-CL')}</span>
                    </div>
                    <div className={`flex justify-between ${includeIva ? 'text-slate-500' : 'text-slate-300 decoration-slate-300'}`}>
                      <span>IVA (19%)</span>
                      <span className="font-mono">${calculatedIVA.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between items-baseline">
                      <span className="text-lg font-bold text-slate-900">Total a Pagar</span>
                      <span className="text-2xl font-bold text-primary">${calculatedTotal.toLocaleString('es-CL')}</span>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/purchases")}
                      className="h-12 border-slate-300 text-slate-600"
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-blue-500/20"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar Compra"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </form>
        </Form>

        {/* Modal para crear proveedor */}
        <CreateProviderModal
          open={createProviderModalOpen}
          onOpenChange={setCreateProviderModalOpen}
          onProviderCreated={(providerName) => {
            setSelectedProviderName(providerName);
            form.setValue("proveedor_nombre", providerName);
            setCreateProviderModalOpen(false);
            setProviderOpen(false);
            setSearchProvider("");
          }}
        />
        <AddProductDialog
          open={isAddProductOpen}
          onOpenChange={setIsAddProductOpen}
          onProductCreated={handleProductCreated}
        />
      </div>
    </>
  );
}

// --- SUB-COMPONENT: Product Combobox for Table Rows ---
function ProductCombobox({
  value,
  products,
  onSelect,
  onCreateNew
}: {
  value: string,
  products: any[],
  onSelect: (p: any) => void,
  onCreateNew: () => void
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter locally to avoid heavy rerenders if generic
  const filtered = products.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 10); // Limit results

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          className={cn(
            "h-8 w-full justify-start text-left font-normal px-2 bg-white border border-slate-200",
            !value && "text-slate-400"
          )}
        >
          {value || "Buscar producto..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar nombre o SKU..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-3 text-center">
              <p className="text-xs text-slate-500 mb-2">No encontrado.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100"
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Crear Nuevo
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {filtered.map(product => (
                <CommandItem
                  key={product.id}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                  className="text-sm cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{product.nombre}</span>
                    <span className="text-[10px] text-slate-400">{product.sku}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === product.nombre ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Modal minimalista para crear proveedor
function CreateProviderModal({
  open,
  onOpenChange,
  onProviderCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProviderCreated: (providerName: string) => void;
}) {
  const createProviderMutation = useCreateProvider();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      nombre: "",
      telefono: "+569",
      email: "",
    },
  });

  const onSubmit = (data: any) => {
    const cleanData = {
      nombre: data.nombre,
      ...(data.telefono && { telefono: data.telefono }),
      ...(data.email && { email: data.email }),
    };

    createProviderMutation.mutate(cleanData, {
      onSuccess: (newProvider) => {
        toast({
          title: "Proveedor creado",
          description: `${newProvider.nombre} ha sido agregado`,
          className: "bg-emerald-50 text-emerald-900 border-emerald-200"
        });
        form.reset();
        onProviderCreated(newProvider.nombre);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el proveedor",
          className: "bg-rose-50 text-rose-900 border-rose-200"
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crear Nuevo Proveedor</DialogTitle>
          <div className="text-sm text-slate-500 mt-1">Complete los datos del proveedor</div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <FormField
              control={form.control}
              name="nombre"
              rules={{ required: "El nombre es obligatorio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Nombre del Proveedor *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Frenos Chile" className="h-11 bg-slate-50 border-slate-200 focus:bg-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: +56912345678"
                      className="h-11 bg-slate-50 border-slate-200 focus:bg-white font-mono"
                      onFocus={(e) => {
                        if (e.target.value === '' || e.target.value === '+569') {
                          field.onChange('+569');
                        }
                      }}
                    />
                  </FormControl>
                  <div className="text-xs text-slate-500 mt-1">Opcional</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              rules={{
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email inválido"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-slate-700">Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="Ej: contacto@proveedor.cl" className="h-11 bg-slate-50 border-slate-200 focus:bg-white" />
                  </FormControl>
                  <div className="text-xs text-slate-500 mt-1">Opcional</div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createProviderMutation.isPending}
                className="flex-1 h-11 bg-primary hover:bg-primary/90"
              >
                {createProviderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Proveedor"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
