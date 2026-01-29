import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Client {
  id: string;
  rut: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface CreateClientDTO {
  rut: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/clients"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar clientes");
      const data = await res.json();
      
      // Ordenar clientes por fecha de creación descendente (más nuevos primero)
      return data.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.fecha_creacion || 0).getTime();
        const dateB = new Date(b.createdAt || b.fecha_creacion || 0).getTime();
        return dateB - dateA; // Más nuevos primero
      });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClientDTO) => {
      const res = await fetch(getApiUrl("/clients"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      // Refetch inmediato para que aparezca al principio
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["clients"] });
      }, 100);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateClientDTO> }) => {
      const res = await fetch(getApiUrl(`/clients/${id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/clients/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
