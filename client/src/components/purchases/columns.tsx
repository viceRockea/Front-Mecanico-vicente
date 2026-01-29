import { Purchase } from "@/hooks/use-purchases";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Trash2, ShoppingCart } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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
            header: "Proveedor",
            cell: ({ row }) => (
                <div className="font-semibold text-slate-900">
                    {row.original.proveedor?.nombre || "Desconocido"}
                </div>
            ),
        },
        {
            accessorKey: "fecha",
            header: "Fecha",
            cell: ({ row }) => {
                const date = new Date(row.getValue("fecha"));
                return <div className="text-slate-600">{date.toLocaleDateString('es-CL')}</div>;
            },
        },
        {
            id: "items",
            header: "Items",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{row.original.totalItems} productos</span>
                    <span className="text-xs text-slate-500">
                        ({row.original.totalUnits} u)
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "neto",
            header: ({ column }) => (
                <div className="text-right">Neto</div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-mono text-slate-900">
                    ${row.original.neto.toLocaleString('es-CL')}
                </div>
            ),
        },
        {
            accessorKey: "iva",
            header: ({ column }) => (
                <div className="text-right">IVA</div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-mono text-slate-600">
                    ${row.original.iva.toLocaleString('es-CL')}
                </div>
            ),
        },
        {
            accessorKey: "total",
            header: ({ column }) => (
                <div className="text-right">Total</div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-mono font-bold text-slate-900">
                    ${row.original.total.toLocaleString('es-CL')}
                </div>
            ),
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
