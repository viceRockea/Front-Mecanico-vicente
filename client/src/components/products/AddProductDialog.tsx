import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { VehicleModelMultiSelect } from "@/components/VehicleModelMultiSelect";
import { VehicleModel } from "@/hooks/use-vehicle-models";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, DollarSign, Package } from "lucide-react";

const productSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio"),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  marca: z.string().min(1, "La marca es obligatoria"),
  calidad: z.string().optional(),
  precio_venta: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  stock_actual: z.coerce.number().min(0, "El stock no puede ser negativo"),
  stock_minimo: z.coerce.number().min(1, "El stock mínimo debe ser al menos 1"),
  categoria_id: z.string().min(1, "Debes seleccionar una categoría"),
});

type ProductFormValues = z.infer<typeof productSchema>;

// INTERFACE ACTUALIZADA CON onProductCreated
interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: (product: any) => void; // <--- NUEVA PROP
}

export function AddProductDialog({ open, onOpenChange, onProductCreated }: AddProductDialogProps) {
  const { mutate: createProduct, isPending } = useCreateProduct();
  const { data: categories = [] } = useCategories();
  const { toast } = useToast();
  const [selectedModels, setSelectedModels] = useState<VehicleModel[]>([]);
  const [netPriceDisplay, setNetPriceDisplay] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      nombre: "",
      marca: "",
      calidad: "",
      precio_venta: 0,
      stock_actual: 0,
      stock_minimo: 5,
      categoria_id: "",
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    createProduct(
      {
        ...data,
        modelosCompatiblesIds: selectedModels.map((m) => m.id),
      },
      {
        onSuccess: (newProduct) => {
          toast({
            title: "Producto creado",
            description: `Se ha creado el producto ${data.nombre} exitosamente.`,
            className: "bg-emerald-50 text-emerald-900 border-emerald-200",
          });
          form.reset();
          setNetPriceDisplay("");
          setSelectedModels([]);
          onOpenChange(false);
          
          // LLAMADA AL CALLBACK SI EXISTE
          if (onProductCreated) {
            onProductCreated(newProduct);
          }
        },
        onError: (error: any) => {
          toast({
            title: "Error al crear",
            description: error.message || "Ocurrió un error inesperado.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleNetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const netValue = parseInt(rawValue) || 0;
    setNetPriceDisplay(netValue > 0 ? netValue.toLocaleString("es-CL") : "");
    const grossPrice = Math.round(netValue * 1.19);
    form.setValue("precio_venta", grossPrice);
  };

  const handleGrossChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (val: number) => void) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    const grossValue = parseInt(rawValue) || 0;
    onChange(grossValue);
    const netValue = Math.round(grossValue / 1.19);
    setNetPriceDisplay(netValue > 0 ? netValue.toLocaleString("es-CL") : "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-slate-50 -mx-6 -mt-6 p-6 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800">
                Nuevo Producto
              </DialogTitle>
              <DialogDescription>
                Ingresa los detalles del nuevo repuesto para el inventario.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">SKU / Código</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="EJ: PAST-001"
                        className="uppercase font-mono font-bold bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                      />
                    </FormControl>
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
                    <FormControl>
                      <Input {...field} placeholder="Ej: Bosch, Brembo..." />
                    </FormControl>
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
                  <FormControl>
                    <Input {...field} placeholder="Ej: Pastillas de Freno Delanteras" className="text-lg font-medium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
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
                    <FormLabel className="text-xs font-bold uppercase text-slate-500">Calidad / Tipo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Cerámica, Semimetálica" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormItem className="pt-2">
              <FormLabel className="text-xs font-bold uppercase text-slate-500">Compatibilidad (Vehículos)</FormLabel>
              <div className="bg-slate-50 p-1 rounded-lg border border-slate-200">
                <VehicleModelMultiSelect selectedModels={selectedModels} onModelsChange={setSelectedModels} />
              </div>
            </FormItem>

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 p-1 rounded-md">
                  <DollarSign className="w-4 h-4 text-blue-700" />
                </div>
                <h4 className="font-bold text-sm text-blue-900 uppercase tracking-wide">Precios y Stock Inicial</h4>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <FormLabel className="text-xs font-medium text-slate-500">Precio Neto (Ref)</FormLabel>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input
                      type="text"
                      placeholder="0"
                      value={netPriceDisplay}
                      onChange={handleNetChange}
                      className="bg-white pl-7 border-slate-200"
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
                            {...field}
                            type="text"
                            value={field.value ? field.value.toLocaleString("es-CL") : ""}
                            onChange={(e) => handleGrossChange(e, field.onChange)}
                            className="bg-emerald-50 font-bold text-emerald-800 border-emerald-200 focus:border-emerald-500 pl-7"
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
                      <FormLabel className="text-xs font-bold uppercase text-slate-500">Stock Inicial</FormLabel>
                      <FormControl><Input {...field} type="number" min="0" className="bg-white" /></FormControl>
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
                      <FormControl><Input {...field} type="number" min="1" className="bg-white" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending} className="h-11 px-6">Cancelar</Button>
              <Button type="submit" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-200 text-white" disabled={isPending}>
                {isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>) : (<><Plus className="w-4 h-4 mr-2" />Crear Producto</>)}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}