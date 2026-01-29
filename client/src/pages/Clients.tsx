import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table"; // Generic DataTable
import { createColumns, ClienteDetalle } from "@/components/clients/columns"; // Import columns and type
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Car, Phone, FileText, Mail, MapPin, Calendar, DollarSign, Wrench, ChevronRight, ChevronDown, X, Check, Loader2, Edit, Trash2, Save } from "lucide-react";
import { useGlobalSearch } from "@/hooks/use-reports";
import { useClients, useUpdateClient, useDeleteClient } from "@/hooks/use-clients";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { useVehicles } from "@/hooks/use-vehicles";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteDetalle | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<ClienteDetalle | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClienteDetalle | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [showOrderDetailSheet, setShowOrderDetailSheet] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Obtener todas las órdenes de trabajo
  const { data: allWorkOrders = [] } = useWorkOrders();
  const { data: vehicles = [] } = useVehicles();

  const selectedOrderDetailWithVehicle = useMemo(() => {
    if (!selectedOrderDetail) return null;
    if (selectedOrderDetail.vehiculo && selectedOrderDetail.vehiculo.marca && selectedOrderDetail.vehiculo.marca !== "Sin Marca") {
      return selectedOrderDetail;
    }
    const found = vehicles.find((v: any) => v.patente === selectedOrderDetail.patente_vehiculo);
    if (found) {
      return {
        ...selectedOrderDetail,
        vehiculo: {
          ...found,
          marca: found.marca,
          modelo: found.modelo,
          patente: found.patente,
          kilometraje: (found as any).kilometraje || selectedOrderDetail.kilometraje || selectedOrderDetail.vehiculo?.kilometraje
        }
      };
    }
    return selectedOrderDetail;
  }, [selectedOrderDetail, vehicles]);

  const { toast } = useToast();

  // Obtener todos los clientes
  const { data: allClients = [], isLoading: isLoadingClients } = useClients();

  // Mutations
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  // Buscador global desde el backend (solo cuando hay búsqueda)
  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(debouncedSearch);

  // Debounce para búsqueda (400ms - dentro del rango 300-500ms)
  useEffect(() => {
    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const timer = setTimeout(() => {
      // Solo buscar si hay al menos 2 caracteres
      if (search.length >= 2) {
        abortControllerRef.current = new AbortController();
        setDebouncedSearch(search);
      } else {
        setDebouncedSearch("");
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [search]);

  const handleClientClick = (cliente: ClienteDetalle) => {
    setEditedClient(cliente);
    setIsEditing(false);
    setShowDetailDrawer(true);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Seleccionar cliente desde el dropdown de autocompletado
  const handleSelectFromDropdown = (cliente: ClienteDetalle) => {
    setSelectedClient(cliente);
    setSearch("");
    setDebouncedSearch("");
    setSearchFocused(false);
    // Open detailed view immediately or filter table?
    // Current logic: Just selects it. The UI probably filters.
    // Let's open the drawer if selected from dropdown?
    // The original code was: handleSelectFromDropdown -> setSelectedClient -> Clear Search.
    // It seems it was just for selection context? But `selectedClient` usage is unclear in original snippets besides clearing it.
    // Wait, original code had: `const ordenesDelCliente = editedClient ? ...`
    // And `handleClientClick` sets `editedClient`.
    // `handleSelectFromDropdown` sets `selectedClient`.
    // It seems `selectedClient` variable might be redundant if we just open drawer.
    // Let's just open drawer for consistency.
    handleClientClick(cliente);
  };

  // Limpiar selección de cliente
  const handleClearSelection = () => {
    setSelectedClient(null);
    setSearch("");
    setDebouncedSearch("");
  };

  // Iniciar edición
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedClient(selectedClient); // Wait, usually we edit `editedClient`
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Guardar cambios
  const handleSaveEdit = async () => {
    if (!editedClient) return;

    try {
      await updateClient.mutateAsync({
        id: editedClient.id,
        data: {
          nombre: editedClient.nombre,
          rut: editedClient.rut,
          telefono: editedClient.telefono,
          email: editedClient.email,
          direccion: editedClient.direccion,
        },
      });

      toast({
        title: "Cliente actualizado",
        description: "Los cambios se han guardado exitosamente",
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo actualizar el cliente",
      });
    }
  };

  // Confirmar eliminación
  const handleDeleteClick = (cliente: ClienteDetalle) => {
    setClientToDelete(cliente);
    setShowDeleteDialog(true);
  };

  // Eliminar cliente
  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await deleteClient.mutateAsync(clientToDelete.id);

      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente",
      });

      setShowDeleteDialog(false);
      setClientToDelete(null);

      // Si estaba viendo el detalle del cliente eliminado, cerrar drawer
      if (editedClient?.id === clientToDelete.id) {
        setShowDetailDrawer(false);
        setEditedClient(null);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
      });
    }
  };

  // Calcular órdenes por cliente desde los resultados de búsqueda
  const getClientOrders = (clienteNombre: string) => {
    if (!searchResults?.ordenes_recientes) return 0;
    return searchResults.ordenes_recientes.filter(
      orden => orden.cliente_nombre?.toLowerCase().includes(clienteNombre.toLowerCase())
    ).length;
  };

  // Determinar qué clientes mostrar: búsqueda global o todos
  let clientesAMostrar = allClients;

  // Si hay búsqueda, filtrar por nombre, RUT, email, teléfono
  if (search.length >= 2) {
    const searchLower = search.toLowerCase();
    clientesAMostrar = allClients.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchLower) ||
      cliente.rut.toLowerCase().includes(searchLower) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchLower)) ||
      (cliente.telefono && cliente.telefono.toLowerCase().includes(searchLower))
    );
  }

  const isLoading = isLoadingClients || (search !== debouncedSearch && search.length >= 2);

  // Estado para mostrar/ocultar dropdown de resultados
  const showSearchResults = search.length >= 2 && (searchFocused || debouncedSearch.length >= 2);
  const hasSearchResults = searchResults && searchResults.clientes && searchResults.clientes.length > 0;

  // Filtrar órdenes del cliente seleccionado (Detailed View) y enriquecer con datos de vehículo
  const ordenesDelCliente = useMemo(() => {
    if (!editedClient) return [];

    const orders = allWorkOrders.filter(
      orden => orden.cliente?.id === editedClient.id || orden.cliente?.rut === editedClient.rut
    );

    return orders.map((wo: any) => {
      let vehicleInfo = wo.vehiculo;

      // Lógica robusta de recuperación de vehículo (igual que en WorkOrders.tsx)
      if (!vehicleInfo || !vehicleInfo.marca || vehicleInfo.marca === "Sin Marca") {
        if (wo.vehicle) {
          vehicleInfo = {
            ...wo.vehicle,
            marca: wo.vehicle.brand || wo.vehicle.make || wo.vehicle.marca,
            modelo: wo.vehicle.model || wo.vehicle.modelo,
            kilometraje: wo.vehicle.mileage || wo.vehicle.kilometraje,
            patente: wo.vehicle.licensePlate || wo.vehicle.patente
          };
        } else {
          const found = vehicles.find((v: any) => v.patente === wo.patente_vehiculo);
          if (found) {
            vehicleInfo = { ...found, marca: found.marca, modelo: found.modelo };
          } else {
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
    }).sort((a: any, b: any) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime());
  }, [editedClient, allWorkOrders, vehicles]);

  const totalGastado = ordenesDelCliente.reduce((sum, orden) => {
    return sum + (orden.total_cobrado || 0);
  }, 0);

  const columns = useMemo(() => createColumns(handleClientClick), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Clientes"
        description="Búsqueda de clientes, vehículos y órdenes de trabajo."
      />

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* Búsqueda Principal con Autocompletado */}
        <div className="relative">
          {/* Input de Búsqueda */}
          {!searchFocused && !search && (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-opacity duration-200 pointer-events-none z-10" />
          )}
          {isSearching && search.length >= 2 && (
            <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin pointer-events-none z-10" />
          )}
          <Input
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => {
              // Delay para permitir clicks en resultados
              setTimeout(() => setSearchFocused(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearch("");
                setDebouncedSearch("");
                setSearchFocused(false);
              }
            }}
            className={`bg-slate-50 border-slate-200 rounded-lg h-12 text-base transition-all duration-200 ${searchFocused || search ? 'pl-4' : 'pl-14'
              }`}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Dropdown de Resultados de Búsqueda (Autocompletado) */}
          {showSearchResults && (
            <div
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {isSearching && (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Buscando clientes...</p>
                </div>
              )}

              {!isSearching && !hasSearchResults && (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Sin resultados</p>
                  <p className="text-xs mt-1">No se encontraron clientes para "{search}"</p>
                </div>
              )}

              {!isSearching && hasSearchResults && (
                <div className="py-2">
                  {/* Lista de Clientes */}
                  <div className="px-2">
                    <h4 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3 h-3" />
                      Clientes encontrados ({searchResults?.clientes?.length || 0})
                    </h4>
                    <div className="space-y-1">
                      {searchResults?.clientes?.map((cliente) => {
                        const ordenesCount = getClientOrders(cliente.nombre);
                        return (
                          <button
                            key={cliente.id}
                            onClick={() => handleSelectFromDropdown(cliente as ClienteDetalle)}
                            className="w-full text-left px-3 py-3 rounded-md hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{cliente.nombre}</p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-muted-foreground font-mono">{cliente.rut}</span>
                                  {cliente.telefono && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {cliente.telefono}
                                    </span>
                                  )}
                                </div>
                                {ordenesCount > 0 && (
                                  <p className="text-xs text-primary mt-1.5 font-medium">
                                    {ordenesCount} {ordenesCount === 1 ? 'orden anterior' : 'órdenes anteriores'}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={clientesAMostrar}
          isLoading={isLoading}
          onRowClick={handleClientClick}
        />
      </div>

      {/* Drawer de Detalle del Cliente */}
      <Sheet open={showDetailDrawer} onOpenChange={setShowDetailDrawer}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">Información del Cliente</SheetTitle>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editedClient && handleDeleteClick(editedClient)}
                      className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={updateClient.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateClient.isPending}
                      className="gap-2"
                    >
                      {updateClient.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Guardar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetHeader>

          {editedClient && (
            <div className="space-y-6 mt-6">
              {/* Información Personal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Datos Personales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div>
                      <Label htmlFor="nombre" className="text-sm text-muted-foreground">Nombre Completo</Label>
                      {isEditing ? (
                        <Input
                          id="nombre"
                          value={editedClient.nombre}
                          onChange={(e) => setEditedClient({ ...editedClient, nombre: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-semibold text-lg mt-1">{editedClient.nombre}</p>
                      )}
                    </div>

                    {/* RUT */}
                    <div>
                      <Label htmlFor="rut" className="text-sm text-muted-foreground">RUT</Label>
                      {isEditing ? (
                        <Input
                          id="rut"
                          value={editedClient.rut}
                          onChange={(e) => setEditedClient({ ...editedClient, rut: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-semibold mt-1">{editedClient.rut}</p>
                      )}
                    </div>

                    {/* Teléfono */}
                    <div>
                      <Label htmlFor="telefono" className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Teléfono
                      </Label>
                      {isEditing ? (
                        <Input
                          id="telefono"
                          value={editedClient.telefono || ""}
                          onChange={(e) => setEditedClient({ ...editedClient, telefono: e.target.value })}
                          className="mt-1"
                          placeholder="Opcional"
                        />
                      ) : (
                        <p className="font-semibold mt-1">{editedClient.telefono || "—"}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editedClient.email || ""}
                          onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                          className="mt-1"
                          placeholder="Opcional"
                        />
                      ) : (
                        <p className="font-semibold mt-1">{editedClient.email || "—"}</p>
                      )}
                    </div>

                    {/* Dirección */}
                    <div className="md:col-span-2">
                      <Label htmlFor="direccion" className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Dirección
                      </Label>
                      {isEditing ? (
                        <Input
                          id="direccion"
                          value={editedClient.direccion || ""}
                          onChange={(e) => setEditedClient({ ...editedClient, direccion: e.target.value })}
                          className="mt-1"
                          placeholder="Opcional"
                        />
                      ) : (
                        <p className="font-semibold mt-1">{editedClient.direccion || "—"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historial de Órdenes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Historial de Órdenes de Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordenesDelCliente.length > 0 ? (
                    <div className="space-y-3">
                      {ordenesDelCliente.map((orden) => {
                        const numeroOrden = orden.numero_orden_papel || 0;
                        const total = orden.total_cobrado || 0;
                        const vehicleInfo = orden.vehiculo;

                        return (
                          <div key={orden.id} className="p-3 border border-slate-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 flex-1">
                                <p className="font-semibold text-base text-primary">OT #{numeroOrden}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Car className="w-3 h-3" />
                                  <span className="font-mono">{orden.patente_vehiculo || 'N/A'}</span>
                                  {vehicleInfo && (
                                    <span>• {vehicleInfo.marca} {vehicleInfo.modelo}</span>
                                  )}
                                  <Calendar className="w-3 h-3 ml-2" />
                                  <span>{new Date(orden.fecha_ingreso).toLocaleDateString('es-CL')}</span>
                                </div>
                              </div>
                              <p className="font-bold text-xl text-primary">${total.toLocaleString('es-CL')}</p>
                            </div>

                            <div className="flex items-center justify-between">
                              {orden.estado && (
                                <Badge
                                  variant={
                                    orden.estado === "FINALIZADA" ? "default" :
                                      orden.estado === "EN_PROCESO" ? "secondary" :
                                        "outline"
                                  }
                                  className="text-xs"
                                >
                                  {orden.estado}
                                </Badge>
                              )}

                              {/* Botón para expandir/colapsar servicios */}
                              {orden.detalles && orden.detalles.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderDetail(orden);
                                    setShowOrderDetailSheet(true);
                                  }}
                                  className="h-8 gap-1.5 text-xs text-primary hover:bg-primary/5"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                  Ver Desglose ({orden.detalles.length})
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No hay órdenes registradas para este cliente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Diálogo de Confirmación para Eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{" "}
              <span className="font-semibold">{clientToDelete?.nombre}</span> y toda su información.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteClient.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteClient.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteClient.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet de Detalle de Orden */}
      <Sheet open={showOrderDetailSheet} onOpenChange={setShowOrderDetailSheet}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl">Detalle de Orden #{selectedOrderDetailWithVehicle?.numero_orden_papel}</SheetTitle>
          </SheetHeader>

          {selectedOrderDetailWithVehicle && (
            <div className="space-y-6 mt-6">
              {/* Información del Cliente */}
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
                      <p className="font-semibold text-lg">{editedClient?.nombre || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">RUT</Label>
                      <p className="font-semibold font-mono">{editedClient?.rut || "—"}</p>
                    </div>
                    {editedClient?.telefono && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Teléfono</Label>
                        <p className="font-semibold">{editedClient.telefono}</p>
                      </div>
                    )}
                    {editedClient?.email && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="font-semibold">{editedClient.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información del Vehículo */}
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
                      <p className="font-semibold font-mono text-lg">{selectedOrderDetailWithVehicle.patente_vehiculo || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Marca</Label>
                      <p className="font-semibold">{selectedOrderDetailWithVehicle.vehiculo?.marca || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Modelo</Label>
                      <p className="font-semibold">{selectedOrderDetailWithVehicle.vehiculo?.modelo || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Kilometraje</Label>
                      <p className="font-semibold">{selectedOrderDetailWithVehicle.vehiculo?.kilometraje ? selectedOrderDetailWithVehicle.vehiculo.kilometraje.toLocaleString('es-CL') + ' km' : "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de la Orden */}
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
                      <p className="font-semibold">{new Date(selectedOrderDetail.fecha_ingreso).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Estado</Label>
                      <div className="mt-1">
                        <Badge
                          variant={
                            selectedOrderDetail.estado === "FINALIZADA" ? "default" :
                              selectedOrderDetail.estado === "EN_PROCESO" ? "secondary" :
                                "outline"
                          }
                        >
                          {selectedOrderDetail.estado}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Realizado Por</Label>
                      <p className="font-semibold">{selectedOrderDetail.realizado_por || "—"}</p>
                    </div>
                    {selectedOrderDetail.revisado_por && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Revisado Por</Label>
                        <p className="font-semibold">{selectedOrderDetail.revisado_por}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Servicios Realizados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    Servicios Realizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrderDetailWithVehicle.detalles && selectedOrderDetailWithVehicle.detalles.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrderDetailWithVehicle.detalles.map((detalle: any, idx: number) => (
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

                      {/* Total */}
                      <div className="pt-4 mt-4 border-t-2 border-slate-200">
                        <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg">
                          <span className="text-lg font-bold text-slate-700">Total a Cobrar:</span>
                          <span className="text-2xl font-bold text-primary">${selectedOrderDetailWithVehicle.total_cobrado.toLocaleString('es-CL')}</span>
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
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
