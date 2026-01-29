import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Trash2, Edit } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkOrder } from "@/hooks/use-work-orders"

export const createColumns = (
    onView: (wo: WorkOrder) => void,
    onEdit: (wo: WorkOrder) => void,
    onDelete: (wo: WorkOrder) => void
): ColumnDef<WorkOrder>[] => [
        {
            accessorKey: "numero_orden_papel",
            header: "N° Orden",
            cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("numero_orden_papel") || "S/N"}</span>,
        },
        {
            accessorKey: "cliente.nombre",
            header: "Cliente",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{row.original.cliente?.nombre || "N/A"}</span>
                    <span className="text-xs text-slate-500">{row.original.patente_vehiculo}</span>
                </div>
            ),
        },
        {
            id: "vehiculo",
            header: "Vehículo",
            cell: ({ row }) => {
                const wo = row.original
                // Lógica de fallback para vehículo (coherente con lo que teníamos)
                const marca = wo.vehiculo?.marca || (wo as any).vehiculo_marca || (wo as any).marca || ""
                const modelo = wo.vehiculo?.modelo || (wo as any).vehiculo_modelo || (wo as any).modelo || ""
                const patente = wo.patente_vehiculo || wo.vehiculo?.patente || ""

                return (
                    <div className="flex flex-col">
                        {patente && <span className="font-bold text-slate-800 font-mono text-xs mb-0.5">{patente}</span>}
                        {marca || modelo ? (
                            <span className="text-sm text-slate-600">{marca} {modelo}</span>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Marca/Modelo no registrados</span>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "fecha_ingreso",
            header: "Ingreso",
            cell: ({ row }) => {
                const date = new Date(row.getValue("fecha_ingreso"))
                return <span className="text-slate-600">{date.toLocaleDateString("es-CL")}</span>
            },
        },
        {
            accessorKey: "estado",
            header: "Estado",
            cell: ({ row }) => {
                const estado = row.getValue("estado") as string
                return (
                    <Badge variant={estado === "FINALIZADA" ? "default" : estado === "EN_PROCESO" ? "secondary" : "outline"}>
                        {estado}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "total_cobrado",
            header: "Total",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("total_cobrado") || "0")
                const formatted = new Intl.NumberFormat("es-CL", {
                    style: "currency",
                    currency: "CLP",
                }).format(amount)
                return <div className="font-bold text-slate-700">{formatted}</div>
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const wo = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onView(wo)}>
                                <Eye className="mr-2 h-4 w-4" /> Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(wo)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(wo)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]
