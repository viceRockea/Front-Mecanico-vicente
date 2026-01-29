import { useState } from "react";
import { X, Car, Plus, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateVehicleModel,
  type VehicleModel,
} from "@/hooks/use-vehicle-models";

interface VehicleModelMultiSelectProps {
  selectedModels: VehicleModel[];
  onModelsChange: (models: VehicleModel[]) => void;
  className?: string;
}

export function VehicleModelMultiSelect({
  selectedModels,
  onModelsChange,
  className,
}: VehicleModelMultiSelectProps) {
  const { toast } = useToast();

  // Use strings for manual inputs to avoid NaN warnings
  const [manualBrand, setManualBrand] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [manualYearStart, setManualYearStart] = useState("");
  const [manualYearEnd, setManualYearEnd] = useState("");

  const createModelMutation = useCreateVehicleModel();

  const handleRemoveModel = (modelId: string) => {
    onModelsChange(selectedModels.filter((m) => m.id !== modelId));
  };

  const handleCreateManual = async () => {
    if (!manualBrand || !manualModel || !manualYearStart) {
      toast({
        title: "Faltan datos",
        description: "Debe ingresar Marca, Modelo y Año de inicio.",
        variant: "destructive",
      });
      return;
    }

    const startYear = parseInt(manualYearStart);
    const endYear = manualYearEnd ? parseInt(manualYearEnd) : startYear;

    if (isNaN(startYear) || startYear < 1900 || startYear > 2100) {
      toast({
        title: "Año inválido",
        description: "El año debe ser un número entre 1900 y 2100.",
        variant: "destructive",
      });
      return;
    }

    if (endYear < startYear) {
      toast({
        title: "Rango inválido",
        description: "El año final no puede ser menor al inicial.",
        variant: "destructive",
      });
      return;
    }

    const newModels: VehicleModel[] = [];

    for (let y = startYear; y <= endYear; y++) {
      try {
        const m = await createModelMutation.mutateAsync({
          marca: manualBrand.trim().toUpperCase(),
          modelo: manualModel.trim().toUpperCase(),
          anio: y
        });
        newModels.push(m);
      } catch (e) {
        console.error(e);
      }
    }

    if (newModels.length > 0) {
      // Add only ones that are not already selected (by ID)
      // Though unlikely to collide if they are new, but good practice.
      const currentIds = new Set(selectedModels.map(m => m.id));
      const uniquenewModels = newModels.filter(m => !currentIds.has(m.id));

      if (uniquenewModels.length > 0) {
        onModelsChange([...selectedModels, ...uniquenewModels]);
        toast({
          title: "Vehículos agregados",
          description: `${uniquenewModels.length} vehículos agregados correctamente.`,
          className: "bg-emerald-50 text-emerald-900 border-emerald-200",
        });
      }

      // Reset form
      setManualBrand("");
      setManualModel("");
      setManualYearStart("");
      setManualYearEnd("");
    }
  };


  return (
    <div className={cn("space-y-4", className)}>
      {/* 1. Chips of Selected Models */}
      {/* 1. List of Selected Models */}
      {selectedModels.length > 0 ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700 uppercase">Vehículos Compatibles ({selectedModels.length})</span>
            {selectedModels.length > 1 && (
              <button
                type="button"
                onClick={() => onModelsChange([])}
                className="text-[10px] text-red-500 hover:text-red-700 uppercase font-bold"
              >
                Limpiar Todo
              </button>
            )}
          </div>
          <div className="max-h-[200px] overflow-y-auto bg-white divide-y divide-slate-100">
            {selectedModels.map((model, index) => (
              <div key={`${model.id}-${index}`} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{model.marca} {model.modelo}</p>
                    <p className="text-xs text-slate-500">Año: {model.anio}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveModel(model.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500 italic p-4 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
          No hay vehículos asociados aún. Use el formulario de abajo para agregar uno o más vehículos.
        </div>
      )}

      {/* Manual Entry Form - Always Visible */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-4 h-4 text-slate-600" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Agregar Compatibilidad</h4>
        </div>

        <div className="p-4 grid grid-cols-12 gap-3 items-end">
          <div className="col-span-12 sm:col-span-4 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Marca</label>
            <Input
              className="h-9 text-sm uppercase font-medium placeholder:normal-case"
              placeholder="Ej: Toyota"
              value={manualBrand}
              onChange={e => setManualBrand(e.target.value.toUpperCase())}
            />
          </div>
          <div className="col-span-12 sm:col-span-4 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Modelo</label>
            <Input
              className="h-9 text-sm uppercase font-medium placeholder:normal-case"
              placeholder="Ej: Yaris"
              value={manualModel}
              onChange={e => setManualModel(e.target.value.toUpperCase())}
            />
          </div>
          <div className="col-span-6 sm:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Año Desde</label>
            <Input
              type="number"
              className="h-9 text-sm"
              placeholder="2018"
              value={manualYearStart}
              onChange={e => setManualYearStart(e.target.value)}
            />
          </div>
          <div className="col-span-6 sm:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Hasta</label>
            <Input
              type="number"
              className="h-9 text-sm"
              placeholder="2022"
              value={manualYearEnd}
              onChange={e => setManualYearEnd(e.target.value)}
            />
          </div>
          <div className="col-span-12 pt-1">
            <Button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={handleCreateManual}
              disabled={createModelMutation.isPending}
            >
              {createModelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Agregar Vehículo(s)
            </Button>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <AlertCircle className="w-3 h-3" />
              <span>Se crearán automáticamente los modelos para cada año del rango.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
