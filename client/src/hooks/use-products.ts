import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  marca: string | null;
  calidad: string | null;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  categoria: {
    id: string;
    nombre: string;
  } | null;
  modelosCompatibles?: Array<{
    id: string;
    marca: string;
    modelo: string;
    anio: number;
  }>;
  compatibilidades?: Array<{
    id: string;
    marca: string;
    modelo: string;
    anio: number;
  }>;
}

export interface CreateProductDTO {
  sku: string;
  nombre: string;
  marca?: string;
  calidad?: string;
  precio_venta: number;
  stock_actual?: number;
  stock_minimo?: number;
  categoria_id?: string;
  modelosCompatiblesIds?: string[];
}

export function useProducts(search?: string) {
  return useQuery<Product[]>({
    queryKey: ["products", search],
    queryFn: async () => {
      const url = search
        ? getApiUrl(`/products?search=${encodeURIComponent(search)}`)
        : getApiUrl("/products");

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();

      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductDTO) => {
      const res = await fetch(getApiUrl("/products"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear producto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateProductDTO>) => {
      const res = await fetch(getApiUrl(`/products/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar producto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/products/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar producto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
