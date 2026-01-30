import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, ArrowUpDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ClienteDetalle = {
    id: string;
    rut: string;
    nombre: string;
    telefono?: string;
    email?: string;
    total_compras: number;
    ultima_visita?: string;
};

export const createColumns = (
    onEdit: (client: ClienteDetalle) => void,
    onDelete: (client: ClienteDetalle) => void
): ColumnDef<ClienteDetalle>[] => [
        {
            accessorKey: "nombre",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium text-slate-900">{row.getValue("nombre")}</div>,
        },
        {
            accessorKey: "rut",
            header: "RUT",
            cell: ({ row }) => <div className="font-mono text-slate-600">{row.getValue("rut")}</div>,
        },
        {
            accessorKey: "telefono",
            header: "Teléfono",
            cell: ({ row }) => <div className="text-slate-600">{row.getValue("telefono") || "—"}</div>,
        },
        {
            accessorKey: "total_compras",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Total Gastado
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="font-bold text-emerald-600">
                    ${(row.getValue("total_compras") as number).toLocaleString('es-CL')}
                </div>
            ),
        },
        {
            accessorKey: "ultima_visita",
            header: "Última Visita",
            cell: ({ row }) => {
                const dateStr = row.getValue("ultima_visita") as string;
                if (!dateStr) return <span className="text-slate-400 italic">Nunca</span>;
                return <span className="text-slate-600">{new Date(dateStr).toLocaleDateString('es-CL')}</span>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const client = row.original;
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
                            <DropdownMenuItem onClick={() => onEdit(client)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(client)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];