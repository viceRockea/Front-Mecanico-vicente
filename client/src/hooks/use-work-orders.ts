import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface WorkOrder {
  id: string;
  numero_orden_papel: number;
  estado: "FINALIZADA" | "EN_PROCESO" | "CANCELADA";
  fecha_ingreso: string;
  total_cobrado: number;
  realizado_por: string;
  revisado_por: string | null;
  patente_vehiculo: string;
  kilometraje: number | null;
  vehiculo?: {
    patente: string;
    marca: string;
    modelo: string;
    kilometraje?: number;
  };
  cliente: {
    id: string;
    nombre: string;
    rut: string | null;
    telefono: string | null;
  };
  detalles: WorkOrderDetail[];
  createdByName: string;
  createdAt: string;
}

export interface WorkOrderDetail {
  id: string;
  servicio_nombre: string;
  descripcion: string | null;
  precio: number;
  producto: {
    id: string;
    sku: string;
    nombre: string;
  } | null;
}

export interface CreateWorkOrderDTO {
  numero_orden_papel: number;
  cliente: {
    rut: string;
    nombre: string;
    telefono?: string;
    email?: string;
  };
  vehiculo: {
    patente: string;
    marca: string;
    modelo: string;
    kilometraje?: number;
  };
  realizado_por?: string;
  revisado_por?: string;
  items: {
    servicio_nombre: string;
    descripcion?: string;
    precio: number;
    product_sku?: string;
    cantidad_producto?: number;
  }[];
}

export function useWorkOrders(search?: string) {
  return useQuery<WorkOrder[]>({
    queryKey: ["work-orders", search],
    queryFn: async () => {
      const url = search
        ? getApiUrl(`/work-orders?search=${encodeURIComponent(search)}`)
        : getApiUrl("/work-orders");

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Error al cargar órdenes de trabajo");
      const data = await res.json();

      console.log("📋 Órdenes recibidas del backend:", data);

      // Adaptar datos del backend al formato esperado
      return data.map((wo: any) => {
        const detallesArray = wo.detalles || wo.items || [];
        console.log("🔍 Procesando orden:", {
          id: wo.id,
          numero_orden: wo.numero_orden_papel,
          tiene_items: !!wo.items,
          tiene_detalles: !!wo.detalles,
          items_count: (wo.items || []).length,
          detalles_count: (wo.detalles || []).length,
          detalles_finales: detallesArray.length,
          raw_items: wo.items,
          raw_detalles: wo.detalles,
        });

        return {
          id: wo.id?.toString() || wo.id,
          numero_orden_papel: wo.numero_orden_papel || 0,
          estado: wo.estado || "EN_PROCESO",
          fecha_ingreso: wo.fecha_creacion || wo.createdAt || new Date().toISOString(),
          total_cobrado: wo.total_cobrado || 0,
          realizado_por: wo.realizado_por || "Sin asignar",
          revisado_por: wo.revisado_por || null,
          patente_vehiculo: wo.vehiculo?.patente || wo.patente_vehiculo || "N/A",
          kilometraje: wo.vehiculo?.kilometraje || null,
          // Intentar resolver el objeto vehículo de múltiples fuentes posibles
          vehiculo: (wo.vehiculo || wo.vehicle) ? {
            marca: wo.vehiculo?.marca || wo.vehicle?.marca || wo.vehicle?.brand || wo.vehicle?.make || "Sin Marca",
            modelo: wo.vehiculo?.modelo || wo.vehicle?.modelo || wo.vehicle?.model || "Sin Modelo",
            patente: wo.vehiculo?.patente || wo.vehicle?.patente || wo.vehicle?.licensePlate || "Sin Patente",
            kilometraje: wo.vehiculo?.kilometraje || wo.vehicle?.kilometraje || wo.vehicle?.mileage
          } : (wo.vehiculo_marca || wo.vehiculo_modelo || wo.patente_vehiculo || wo.marca || wo.modelo) ? {
            marca: wo.vehiculo_marca || wo.marca || "Sin Marca",
            modelo: wo.vehiculo_modelo || wo.modelo || "Sin Modelo",
            patente: wo.patente_vehiculo || wo.patente || "Sin Patente",
            kilometraje: wo.vehiculo_kilometraje || wo.kilometraje
          } : null,
          cliente: (wo.cliente || wo.client) ? {
            id: (wo.cliente?.id || wo.client?.id || "1"),
            nombre: (wo.cliente?.nombre || wo.client?.nombre || wo.client?.name),
            rut: (wo.cliente?.rut || wo.client?.rut),
            telefono: (wo.cliente?.telefono || wo.client?.telefono || wo.client?.phone),
          } : {
            id: "1",
            nombre: "Sin cliente",
            rut: null,
            telefono: null,
          },
          mecanico_asignado: wo.realizado_por ? { nombre: wo.realizado_por } : null,
          detalles: (wo.detalles || wo.items || []).map((item: any) => ({
            id: item.id?.toString() || Math.random().toString(),
            servicio_nombre: item.servicio_nombre || item.nombre || "Sin nombre",
            descripcion: item.descripcion || null,
            precio: item.precio || 0,
            producto: item.producto || item.product_sku ? {
              id: item.producto?.id || item.product_id || "0",
              sku: item.producto?.sku || item.product_sku || "",
              nombre: item.producto?.nombre || item.product_nombre || "",
            } : null,
          })),
          createdByName: wo.realizado_por || "",
          createdAt: wo.fecha_creacion || wo.createdAt || new Date().toISOString(),
        };
      });
    },
  });
}

export function useServicesCatalog() {
  return useQuery<string[]>({
    queryKey: ["services-catalog"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/work-orders/services-catalog"), {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Error al cargar catálogo de servicios");
      return res.json();
    },
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWorkOrderDTO) => {
      console.log("📤 Enviando al backend:", JSON.stringify(data, null, 2));

      const res = await fetch(getApiUrl("/work-orders"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      console.log("📥 Respuesta del backend - Status:", res.status, res.statusText);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error del backend:", errorText);

        let errorMessage = "Error al crear orden de trabajo";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          console.error("❌ Error parseado:", errorJson);
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const responseData = await res.json();
      console.log("✅ Orden creada exitosamente:", responseData);
      return responseData;
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["global-search"] });

      // Forzar refetch inmediato
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["clients"] });
        queryClient.refetchQueries({ queryKey: ["work-orders"] });
      }, 100);
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateWorkOrderDTO>) => {
      const res = await fetch(getApiUrl(`/work-orders/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar orden");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/work-orders/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar orden");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}
