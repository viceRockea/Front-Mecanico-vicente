import { Purchase } from "@/hooks/use-purchases";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Trash2, ShoppingCart, ArrowUpDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PurchaseWithTotals = Purchase & {
    totalItems: number;
    totalUnits: number;
    neto: number;
    iva: number;
    total: number;
};

export const createColumns = (
    onView: (purchase: PurchaseWithTotals) => void,
    onDelete: (purchase: PurchaseWithTotals) => void
): ColumnDef<PurchaseWithTotals>[] => [
        {
            accessorKey: "proveedor.nombre",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Proveedor
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="font-semibold text-slate-900">
                    {row.original.proveedor?.nombre || "Desconocido"}
                </div>
            ),
        },
        {
            accessorKey: "fecha",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Fecha
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("fecha"));
                return <div className="text-slate-600 font-medium">
                    {date.toLocaleDateString("es-CL")}
                </div>
            },
        },
        {
            accessorKey: "totalItems",
            header: "Items",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-slate-400" />
                    <span>{row.original.totalItems} ítems ({row.original.totalUnits} un.)</span>
                </div>
            ),
        },
        {
            accessorKey: "total",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Total
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const amount = row.original.total;
                return (
                    <div className="font-bold text-emerald-600">
                        ${amount.toLocaleString('es-CL')}
                    </div>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const purchase = row.original;

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
                            <DropdownMenuItem onClick={() => onView(purchase)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(purchase)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];