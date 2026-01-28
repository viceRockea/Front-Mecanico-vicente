
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    Loader2,
    Trash2,
    Check,
    Package,
    AlertTriangle,
    Car,
    X,
    CreditCard,
    Tag
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { useCreateProduct } from "@/hooks/use-products";
import { cn } from "@/lib/utils";
import { VehicleModelMultiSelect } from "@/components/VehicleModelMultiSelect";
import type { VehicleModel } from "@/hooks/use-vehicle-models";

// --- CSS UTILS ---
const NO_SPINNER_CLASS = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
const NORMAL_INPUT_CLASS = "h-10 bg-white border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all placeholder:text-slate-400";
const FIELD_LABEL_CLASS = "text-xs font-bold text-slate-500 uppercase tracking-tight mb-1.5";

// --- ESQUEMAS ZOD ---

const vehicleCompatibilitySchema = z.object({
    marca: z.string().min(1, "Requerido"),
    modelo: z.string().min(1, "Requerido"),
    anioInicio: z.coerce.number().min(1900).max(2100).optional().or(z.literal(0)),
    anioFin: z.coerce.number().min(1900).max(2100).optional().or(z.literal(0)),
}).refine(data => {
    if (data.anioFin && data.anioInicio && data.anioFin < data.anioInicio) {
        return false;
    }
    return true;
}, {
    message: "Fin < Inicio",
    path: ["anioFin"],
});

const productSchema = z.object({
    sku: z.string().min(3, "Mínimo 3").toUpperCase(),
    nombre: z.string().min(3, "Requerido"),
    marca: z.string().optional(),
    categoria_id: z.string().min(1, "Requerido"),
    calidad: z.string().optional(),

    precio_venta: z.coerce.number().min(0),
    stock_minimo: z.coerce.number().min(0),
    stock_actual: z.literal(0),

    compatibilidades: z.array(vehicleCompatibilitySchema).default([]),
});

type ProductFormValues = z.infer<typeof productSchema>;

// --- COMPONENTE PRINCIPAL ---

export function AddProductDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [selectedModels, setSelectedModels] = useState<VehicleModel[]>([]);

    const { data: categories = [] } = useCategories();
    const createProductMutation = useCreateProduct();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            sku: "",
            nombre: "",
            marca: "",
            categoria_id: "",
            calidad: "",
            precio_venta: 0,
            stock_minimo: 5,
            stock_actual: 0,
            compatibilidades: [],
        },
        mode: "onSubmit",
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "compatibilidades",
    });

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            form.reset();
            setSelectedModels([]);
        }
        setOpen(newOpen);
    };

    const onSubmit = (data: ProductFormValues) => {
        const payload = {
            sku: data.sku,
            nombre: data.nombre,
            marca: data.marca,
            calidad: data.calidad || undefined,
            precio_venta: data.precio_venta,
            stock_actual: 0,
            stock_minimo: data.stock_minimo,
            categoriaId: data.categoria_id,
            modelosCompatiblesIds: selectedModels.map(m => m.id),
        };

        createProductMutation.mutate(payload as any, { // Cast to any to bypass DTO mismatch for now
            onSuccess: () => {
                toast({
                    title: "Producto Creado",
                    description: "Se ha registrado el producto correctamente.",
                    className: "bg-emerald-50 text-emerald-900 border-emerald-200",
                });
                setOpen(false);
            },
            onError: (err: any) => {
                toast({
                    title: "Error",
                    description: err.message,
                    className: "bg-rose-50 text-rose-900 border-rose-200",
                });
            }
        });
    };

    const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const net = parseInt(e.target.value) || 0;
        const gross = Math.round(net * 1.19);
        form.setValue("precio_venta", gross);
    };

    const handleGrossPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const gross = parseInt(e.target.value) || 0;
        // If gross is entered, net is gross / 1.19
        // We assume the user wants to set the gross price specifically
        form.setValue("precio_venta", gross);
        // We can optionally update a local state for net price if we want it to be fully bidirectional visually,
        // but since the Net input is not controlled by a form field (it's independent), we might need to use a ref or state.
        // However, the Net input currently is just correct for display if calculated from gross?
        // Actually, let's make the Net input use a calculated value from `precio_venta` if we want true bi-directionality,
        // OR just simple one-way from each.
        // For simplicity: If I edit Gross, I don't strictly need to update the Net input visual unless it's controlled.
        // The current Net input is uncontrolled `onChange` but no `value` bound to state.
        // Let's rely on the user flow usually being Net -> Gross, but if they edit Gross, it updates model.
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9 btn-pill bg-primary hover:bg-primary/90 text-white shadow-sm text-xs px-4">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Nuevo Producto
                </Button>
            </DialogTrigger>

            {/* MODAL PRINCIPAL: max-w-6xl para mayor amplitud */}
            <DialogContent className="max-w-6xl h-[85vh] bg-white p-0 gap-0 border-slate-200 shadow-2xl rounded-xl flex flex-col overflow-hidden">

                {/* HEADER (Sticky/Fixed) */}
                <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-none flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-slate-800 uppercase tracking-wide">Nuevo Repuesto</DialogTitle>
                            <p className="text-xs text-slate-400 font-medium">Complete la información del producto</p>
                        </div>
                    </div>
                    {/* Duplicate X removed */}
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">

                        {/* CONTENIDO PRINCIPAL: GRID 2 COLUMNAS */}
                        <div className="flex-1 grid grid-cols-12 overflow-hidden bg-slate-50/30">

                            {/* COLUMNA IZQUIERDA: DATOS REPUESTO (Static, No Scroll desired) */}
                            {/* Usamos col-span-5 para dar más espacio a la compatibilidad que es lista larga, o 6/6 equilibrado */}
                            <div className="col-span-12 md:col-span-5 lg:col-span-5 flex flex-col h-full bg-white border-r border-slate-100 relative">
                                {/* TÍTULO STICKY */}
                                <div className="py-4 border-b border-slate-100 bg-white z-10 text-center shadow-sm">
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center justify-center gap-2">
                                        <Tag className="w-5 h-5 text-blue-500" />
                                        Datos del Repuesto
                                    </h3>
                                </div>

                                {/* FORMULARIO (Overflow hidden idealmente, si cabe) */}
                                <div className="p-6 space-y-5 flex-1 overflow-y-auto md:overflow-y-visible">
                                    {/* Nota: En pantallas muy chicas podría necesitar scroll, pero en desktop intentaremos que no */}

                                    <div className="grid grid-cols-12 gap-4">
                                        {/* SKU */}
                                        <div className="col-span-4">
                                            <FormField
                                                control={form.control}
                                                name="sku"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={FIELD_LABEL_CLASS}>SKU / Código</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="COD-001" className={cn(NORMAL_INPUT_CLASS, "font-mono uppercase font-bold text-slate-700")} />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* NOMBRE */}
                                        <div className="col-span-8">
                                            <FormField
                                                control={form.control}
                                                name="nombre"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={FIELD_LABEL_CLASS}>Nombre Producto</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Ej: Pastillas de Freno" className={cn(NORMAL_INPUT_CLASS, "font-semibold")} />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* CATEGORIA */}
                                        <div className="col-span-12">
                                            <FormField
                                                control={form.control}
                                                name="categoria_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={FIELD_LABEL_CLASS}>Categoría</FormLabel>
                                                        <div className="flex gap-2">
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger className={cn(NORMAL_INPUT_CLASS)}>
                                                                        <SelectValue placeholder="Seleccione Categoría..." />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {categories.map((cat) => (
                                                                        <SelectItem
                                                                            key={cat.id}
                                                                            value={cat.id}
                                                                            className="focus:bg-blue-50 focus:text-blue-900 cursor-pointer"
                                                                        >
                                                                            {cat.nombre}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <CreateCategoryInline onCreated={(newId) => form.setValue("categoria_id", newId)} />
                                                        </div>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* MARCA Y CALIDAD */}
                                        <div className="col-span-6">
                                            <FormField
                                                control={form.control}
                                                name="marca"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={FIELD_LABEL_CLASS}>Marca</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Ej: Bosch" className={NORMAL_INPUT_CLASS} />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="col-span-6">
                                            <FormField
                                                control={form.control}
                                                name="calidad"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className={FIELD_LABEL_CLASS}>Calidad</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} placeholder="Ej: Premium" className={NORMAL_INPUT_CLASS} />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Separator className="bg-slate-100" />

                                    {/* PRECIOS */}
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 flex items-center gap-2">
                                            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                                            Valores
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className={FIELD_LABEL_CLASS}>Neto (Ref)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                    <Input
                                                        type="number"
                                                        value={form.watch("precio_venta") ? Math.round(form.watch("precio_venta") / 1.19) : ""}
                                                        onChange={handleNetPriceChange}
                                                        placeholder="0"
                                                        className={cn(NORMAL_INPUT_CLASS, "pl-9 bg-slate-50", NO_SPINNER_CLASS)}
                                                    />
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="precio_venta"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-emerald-600 uppercase tracking-tight mb-1.5">Precio Venta</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">$</span>
                                                                <Input
                                                                    {...field}
                                                                    type="number"
                                                                    onChange={(e) => {
                                                                        field.onChange(parseInt(e.target.value));
                                                                        // Not updating Net manually here because it depends on this value via form.watch in the render above
                                                                    }}
                                                                    className={cn(NORMAL_INPUT_CLASS, "pl-9 font-bold text-emerald-700 border-emerald-200 bg-emerald-50/30 focus:border-emerald-500", NO_SPINNER_CLASS)}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="stock_minimo"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-amber-600 uppercase tracking-tight mb-1.5">Stock Mínimo</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="number"
                                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                                                className={cn(NORMAL_INPUT_CLASS, "border-amber-200 focus:border-amber-500", NO_SPINNER_CLASS)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage className="text-[10px]" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* COLUMNA DERECHA: COMPATIBILIDAD (Scrollable) */}
                            <div className="col-span-12 md:col-span-7 lg:col-span-7 flex flex-col h-full overflow-hidden bg-slate-50/50">
                                {/* TÍTULO STICKY */}
                                <div className="py-4 border-b border-slate-200 bg-white z-10 text-center shadow-sm flex-none">
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center justify-center gap-2">
                                        <Car className="w-5 h-5 text-blue-500" />
                                        Compatibilidad
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="mb-4">
                                            <p className="text-sm text-slate-600 mb-2">
                                                Seleccione los vehículos compatibles con este repuesto.
                                            </p>
                                        </div>

                                        <VehicleModelMultiSelect
                                            selectedModels={selectedModels}
                                            onModelsChange={setSelectedModels}
                                        />
                                    </div>

                                    {selectedModels.length === 0 && (
                                        <div className="mt-8 flex flex-col items-center justify-center text-center opacity-50">
                                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                                                <Car className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <h4 className="text-base font-bold text-slate-600">Repuesto Universal</h4>
                                            <p className="text-xs text-slate-400 max-w-[200px]">
                                                Si no selecciona ningún vehículo, este repuesto se considerará universal.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* FOOTER FIXED (Flex None) */}
                        <div className="border-t border-slate-200 bg-white p-4 flex justify-between items-center z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="pl-2">
                                {Object.keys(form.formState.errors).length > 0 && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-bold animate-pulse bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Revise los campos marcados en rojo
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-10 px-6 border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 h-10 px-6 font-semibold shadow-lg shadow-blue-500/20" disabled={createProductMutation.isPending}>
                                    {createProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                    Guardar Producto
                                </Button>
                            </div>
                        </div>

                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// --- SUB COMPONENTS ---

function CreateCategoryInline({ onCreated }: { onCreated: (id: string) => void }) {
    const [open, setOpen] = useState(false);
    const [newCatName, setNewCatName] = useState("");
    const createCatMutation = useCreateCategory();

    const handleCreate = () => {
        if (!newCatName.trim()) return;
        createCatMutation.mutate({ nombre: newCatName }, {
            onSuccess: (data) => {
                onCreated(data.id);
                setNewCatName("");
                setOpen(false);
            }
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 border-slate-300 bg-white hover:bg-slate-50">
                    <Plus className="w-4 h-4 text-slate-500" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="start">
                <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase">Nueva Categoría</h4>
                    <div className="flex gap-1">
                        <Input
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="Nombre..."
                            className="h-8 text-xs"
                        />
                        <Button size="sm" onClick={handleCreate} className="h-8 w-8 p-0">
                            <Check className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
