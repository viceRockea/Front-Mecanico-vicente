
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useWorkOrders, useDeleteWorkOrder, useCreateWorkOrder, useServicesCatalog, type CreateWorkOrderDTO, type WorkOrder } from "@/hooks/use-work-orders";
import { useVehicles } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "@/components/work-orders/columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Car, User, Calendar, DollarSign } from "lucide-react";
import { Plus, Search, FileText, Loader2, Wrench, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusBadge } from "@/components/StatusBadge";

export default function WorkOrders() {
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const { mutate: deleteWorkOrder } = useDeleteWorkOrder();
  const { data: vehicles = [] } = useVehicles();
  const { toast } = useToast();

  // Client-side join logic
  const ordersWithVehicleRef = useMemo(() => {
    return workOrders.map((wo: any) => {
      let vehicleInfo = wo.vehiculo;

      // Intentar recuperar info si está plana o con keys en inglés
      if (!vehicleInfo || !vehicleInfo.marca) {
        // Primero buscar en el objeto 'vehicle' si existe
        if (wo.vehicle) {
          vehicleInfo = {
            ...wo.vehicle,
            marca: wo.vehicle.brand || wo.vehicle.make || wo.vehicle.marca,
            modelo: wo.vehicle.model || wo.vehicle.modelo,
            kilometraje: wo.vehicle.mileage || wo.vehicle.kilometraje,
            patente: wo.vehicle.licensePlate || wo.vehicle.patente
          };
        } else {
          // Si no, buscar en la lista global de vehículos
          const found = vehicles.find((v: any) => v.patente === wo.patente_vehiculo);
          if (found) {
            vehicleInfo = { ...found, marca: found.marca, modelo: found.modelo };
          } else {
            // Fallback a propiedades planas
            vehicleInfo = {
              marca: wo.vehiculo_marca || wo.brand || wo.make || "Sin Marca",
              modelo: wo.vehiculo_modelo || wo.model || "Sin Modelo",
              kilometraje: wo.vehiculo_kilometraje || wo.mileage || wo.kilometraje
            };
          }
        }
      }

      return {
        ...wo,
        vehiculo: vehicleInfo
      };
    });
  }, [workOrders, vehicles]);

  // Filtrado
  const filteredOrders = useMemo(() => {
    return ordersWithVehicleRef.filter((wo: any) => {
      const searchLower = search.toLowerCase();
      return (
        wo.numero_orden_papel?.toString().toLowerCase().includes(searchLower) ||
        wo.cliente?.nombre?.toLowerCase().includes(searchLower) ||
        wo.patente_vehiculo?.toLowerCase().includes(searchLower)
      );
    });
  }, [ordersWithVehicleRef, search]);

  const handleDelete = (wo: WorkOrder) => {
    if (confirm(`¿Estás seguro de eliminar la orden #${wo.numero_orden_papel}?`)) {
      deleteWorkOrder(wo.id, {
        onSuccess: () => toast({ title: "Orden eliminada realizada" }),
        onError: () => toast({ title: "Error al eliminar", variant: "destructive" })
      });
    }
  };

  const handleEdit = (wo: WorkOrder) => {
    alert("Editar no implementado aún");
  };

  const columns = useMemo(() => createColumns(
    (wo) => setSelectedOrder(wo),
    (wo) => handleEdit(wo),
    (wo) => handleDelete(wo)
  ), []);

  const selectedOrderWithVehicle = useMemo(() => {
    if (!selectedOrder) return null;
    const wo = selectedOrder as any;

    // Misma lógica de enriquecimiento para el detalle
    if (wo.vehiculo && wo.vehiculo.marca && wo.vehiculo.marca !== "Sin Marca") {
      return wo;
    }
    const found = vehicles.find((v: any) => v.patente === wo.patente_vehiculo);
    if (found) {
      return {
        ...wo,
        vehiculo: {
          ...found,
          marca: found.marca,
          modelo: found.modelo,
          patente: found.patente,
          kilometraje: found.kilometraje || wo.kilometraje || wo.vehiculo?.kilometraje
        }
      };
    }
    return wo;
  }, [selectedOrder, vehicles]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de Trabajo"
        description="Gestione las órdenes de trabajo, seguimiento y facturación."
        action={<CreateWorkOrderDialog />}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, patente o número de orden..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-12 text-base rounded-xl border-slate-200 shadow-sm focus:border-primary focus:ring-primary/20"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredOrders}
        />
      </div>

      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          {selectedOrderWithVehicle && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">Detalle de Orden #{selectedOrderWithVehicle?.numero_orden_papel}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Información del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Nombre</Label>
                        <p className="font-semibold text-lg">{selectedOrderWithVehicle.cliente?.nombre || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">RUT</Label>
                        <p className="font-semibold font-mono">{selectedOrderWithVehicle.cliente?.rut || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Teléfono</Label>
                        <p className="font-semibold">{selectedOrderWithVehicle.cliente?.telefono || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="font-semibold">{selectedOrderWithVehicle.cliente?.email || "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      Información del Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Patente</Label>
                        <p className="font-semibold font-mono text-lg">{selectedOrderWithVehicle.patente_vehiculo || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Marca</Label>
                        <p className="font-semibold">{selectedOrderWithVehicle.vehiculo?.marca || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Modelo</Label>
                        <p className="font-semibold">{selectedOrderWithVehicle.vehiculo?.modelo || "—"}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Kilometraje</Label>
                        <p className="font-semibold">{selectedOrderWithVehicle.vehiculo?.kilometraje ? selectedOrderWithVehicle.vehiculo.kilometraje.toLocaleString('es-CL') + ' km' : "—"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Detalles de la Orden
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Fecha de Ingreso</Label>
                        <p className="font-semibold">{new Date(selectedOrderWithVehicle.fecha_ingreso).toLocaleDateString('es-CL')}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Estado</Label>
                        <div className="mt-1">
                          <StatusBadge status={selectedOrderWithVehicle.estado} />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Realizado Por</Label>
                        <p className="font-semibold">{selectedOrderWithVehicle.realizado_por || "—"}</p>
                      </div>
                      {selectedOrderWithVehicle.revisado_por && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Revisado Por</Label>
                          <p className="font-semibold">{selectedOrderWithVehicle.revisado_por}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" />
                      Servicios Realizados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedOrderWithVehicle.detalles && selectedOrderWithVehicle.detalles.length > 0 ? (
                      <div className="space-y-3">
                        {selectedOrderWithVehicle.detalles.map((detalle: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-md border border-slate-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-primary">{idx + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-base text-slate-900">{detalle.servicio_nombre}</p>
                                  {detalle.descripcion && (
                                    <div className="mt-2 p-3 bg-white rounded border border-slate-200">
                                      <p className="text-xs text-muted-foreground font-medium mb-1">Descripción del trabajo:</p>
                                      <p className="text-sm text-slate-700 leading-relaxed">
                                        {detalle.descripcion}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4 flex-shrink-0">
                                <p className="font-mono font-bold text-lg text-primary">${detalle.precio.toLocaleString('es-CL')}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="pt-4 mt-4 border-t-2 border-slate-200">
                          <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg">
                            <span className="text-lg font-bold text-slate-700">Total a Cobrar:</span>
                            <span className="text-2xl font-bold text-primary">${selectedOrderWithVehicle.total_cobrado.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay servicios registrados en esta orden</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}


function CreateWorkOrderDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createWorkOrder, isPending } = useCreateWorkOrder();
  const { data: servicesCatalog = [], isLoading: isLoadingCatalog } = useServicesCatalog();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      numero_orden_papel: 0,
      realizado_por: "",
      revisado_por: "",
      cliente_rut: "",
      cliente_nombre: "",
      cliente_email: "",
      cliente_telefono: "",
      vehiculo_patente: "",
      vehiculo_marca: "",
      vehiculo_modelo: "",
      vehiculo_km: 0,
    },
  });

  // Estado dinámico para servicios basado en el catálogo
  const [services, setServices] = useState<Record<string, { checked: boolean; precio: number; descripcion: string; product_sku?: string; cantidad_producto?: number }>>({
    "Cambio Pastillas": { checked: false, precio: 0, descripcion: "" },
    "Cambio Discos": { checked: false, precio: 0, descripcion: "" },
    "Rectificado": { checked: false, precio: 0, descripcion: "" },
    "Cambio Líquido Frenos": { checked: false, precio: 0, descripcion: "" },
    "Revisión Sistema Completo": { checked: false, precio: 0, descripcion: "" },
    "Cambio Zapatas Traseras": { checked: false, precio: 0, descripcion: "" },
    "Purga Sistema Frenos": { checked: false, precio: 0, descripcion: "" },
    "Revisión ABS": { checked: false, precio: 0, descripcion: "" },
    "Otros": { checked: false, precio: 0, descripcion: "" },
  });

  const calcularTotal = () => {
    return Object.values(services).reduce((total, service) => {
      return service.checked ? total + (service.precio || 0) : total;
    }, 0);
  };

  const onSubmit = (data: any) => {
    // Validar campos obligatorios del vehículo
    if (!data.vehiculo_patente || !data.vehiculo_marca || !data.vehiculo_modelo) {
      toast({
        title: "Campos requeridos",
        description: "Debes completar Patente, Marca y Modelo del vehículo.",
        variant: "destructive",
      });
      return;
    }

    // Convertir los servicios seleccionados a items
    const items = Object.entries(services)
      .filter(([_, service]) => service.checked)
      .map(([serviceName, service]) => ({
        servicio_nombre: serviceName,
        descripcion: service.descripcion || '',
        precio: service.precio,
        ...(service.product_sku && { product_sku: service.product_sku }),
        ...(service.cantidad_producto && { cantidad_producto: service.cantidad_producto }),
      }));

    const payload: CreateWorkOrderDTO = {
      numero_orden_papel: data.numero_orden_papel,
      realizado_por: data.realizado_por || undefined,
      revisado_por: data.revisado_por || undefined,
      // Cliente - como objeto
      cliente: {
        nombre: data.cliente_nombre.trim(),
        rut: data.cliente_rut.trim(),
        email: data.cliente_email?.trim() || undefined,
        telefono: data.cliente_telefono?.trim() || undefined,
      },
      // Vehículo - como objeto
      vehiculo: {
        patente: data.vehiculo_patente.trim(),
        marca: data.vehiculo_marca.trim(),
        modelo: data.vehiculo_modelo.trim(),
        kilometraje: data.vehiculo_km || 0,
      },
      // Items
      items,
    };

    console.log("🚗 Datos del vehículo a enviar:", {
      patente: data.vehiculo_patente,
      marca: data.vehiculo_marca,
      modelo: data.vehiculo_modelo,
      kilometraje: data.vehiculo_km,
    });
    console.log("📦 Payload completo:", payload);

    createWorkOrder(payload, {
      onSuccess: () => {
        toast({
          title: "Orden Creada",
          description: "La orden de trabajo ha sido creada exitosamente. El cliente se ha registrado automáticamente.",
        });
        setOpen(false);
        form.reset();
        // Resetear servicios también
        setServices({
          "Cambio Pastillas": { checked: false, precio: 0, descripcion: "" },
          "Cambio Discos": { checked: false, precio: 0, descripcion: "" },
          "Rectificado": { checked: false, precio: 0, descripcion: "" },
          "Cambio Líquido Frenos": { checked: false, precio: 0, descripcion: "" },
          "Revisión Sistema Completo": { checked: false, precio: 0, descripcion: "" },
          "Cambio Zapatas Traseras": { checked: false, precio: 0, descripcion: "" },
          "Purga Sistema Frenos": { checked: false, precio: 0, descripcion: "" },
          "Revisión ABS": { checked: false, precio: 0, descripcion: "" },
          "Otros": { checked: false, precio: 0, descripcion: "" },
        });
      },
      onError: (error: any) => {
        console.error("Error al crear orden:", error); // Debug
        toast({
          title: "Error",
          description: error.message || "No se pudo crear la orden de trabajo.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Orden
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Orden de Trabajo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Número de Orden y Responsables */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="numero_orden_papel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Orden</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="1001"
                        maxLength={8}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                          field.onChange(parseInt(value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="realizado_por"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Realizado Por</FormLabel>
                    <FormControl>
                      <Input placeholder="Carlos González" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="revisado_por"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revisado Por (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Pedro Supervisor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información del Cliente */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente_rut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="12.345.678-9"
                          {...field}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9kK]/g, '');
                            if (value.length > 9) value = value.slice(0, 9);

                            if (value.length > 1) {
                              const dv = value.slice(-1);
                              const numbers = value.slice(0, -1);
                              value = numbers.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + '-' + dv;
                            }

                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+56 9 1234 5678"
                          value={field.value ? (field.value.startsWith('+56 9 ') ? field.value : '+56 9 ' + field.value) : '+56 9 '}
                          onChange={(e) => {
                            let value = e.target.value;

                            // Asegurar que siempre empiece con +56 9
                            if (!value.startsWith('+56 9 ')) {
                              value = '+56 9 ';
                            }

                            field.onChange(value);
                          }}
                          onFocus={(e) => {
                            // Si está vacío al hacer foco, poner el prefijo
                            if (!e.target.value || e.target.value === '') {
                              field.onChange('+56 9 ');
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan.perez@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información del Vehículo */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Datos del Vehículo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehiculo_patente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Patente
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="AB-1234"
                          className="uppercase font-mono"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehiculo_marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Marca
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Toyota"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehiculo_modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Modelo
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Corolla"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehiculo_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilometraje</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="50.000"
                          value={field.value ? field.value.toLocaleString('es-CL') : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(parseInt(value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Servicios */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Servicios a Realizar
              </h3>
              {isLoadingCatalog && (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Cargando servicios...</p>
                </div>
              )}
              {!isLoadingCatalog && (
                <div className="space-y-3">
                  {servicesCatalog.map((serviceName) => (
                    <div key={serviceName} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={services[serviceName]?.checked || false}
                          onCheckedChange={(checked) =>
                            setServices(prev => ({
                              ...prev,
                              [serviceName]: { ...prev[serviceName], checked: !!checked, precio: prev[serviceName]?.precio || 0, descripcion: prev[serviceName]?.descripcion || '' }
                            }))
                          }
                        />
                        <label className="flex-1 cursor-pointer font-medium">
                          {serviceName}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">$</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            className="w-32 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={!services[serviceName]?.checked}
                            value={
                              services[serviceName]?.precio
                                ? services[serviceName].precio.toLocaleString('es-CL')
                                : ''
                            }
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              const numValue = parseInt(value) || 0;
                              setServices(prev => ({
                                ...prev,
                                [serviceName]: { ...prev[serviceName], precio: numValue, checked: prev[serviceName]?.checked || false, descripcion: prev[serviceName]?.descripcion || '' }
                              }))
                            }}
                          />
                        </div>
                      </div>
                      {services[serviceName]?.checked && (
                        <Input
                          placeholder="Descripción del servicio (opcional)..."
                          className="text-sm"
                          value={services[serviceName]?.descripcion || ''}
                          onChange={(e) =>
                            setServices(prev => ({
                              ...prev,
                              [serviceName]: { ...prev[serviceName], descripcion: e.target.value, checked: prev[serviceName]?.checked || false, precio: prev[serviceName]?.precio || 0 }
                            }))
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-slate-700 uppercase tracking-wide">Total a Cobrar</span>
                <span className="text-3xl font-bold text-primary">${calcularTotal().toLocaleString('es-CL')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Orden"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
