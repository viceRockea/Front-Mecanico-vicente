"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Link, MoreHorizontal, Pencil, Trash2, AlertTriangle, Car } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

import type { Product } from "@/hooks/use-products"

interface ColumnActionsProps {
    product: Product;
    isAdmin: boolean;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
}

const ActionsCell = ({ product, isAdmin, onEdit, onDelete }: ColumnActionsProps) => {
    if (!isAdmin) return null;
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.sku)}>
                    Copiar SKU
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(product)} className="text-blue-600 focus:text-blue-700 focus:bg-blue-50">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const createColumns = (
    isAdmin: boolean,
    onEdit: (p: Product) => void,
    onDelete: (p: Product) => void
): ColumnDef<Product>[] => [
        {
            accessorKey: "sku",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-slate-50 -ml-4"
                    >
                        SKU
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-mono font-medium text-slate-600">{row.getValue("sku")}</div>,
        },
        {
            accessorKey: "nombre",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="hover:bg-slate-50 -ml-4"
                    >
                        Nombre
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-semibold text-slate-900">{row.getValue("nombre")}</div>,
        },
        {
            accessorKey: "categoria",
            header: "Categoría",
            cell: ({ row }) => {
                const cat = row.original.categoria;
                return cat ? (
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-normal">
                        {cat.nombre}
                    </Badge>
                ) : (
                    <span className="text-slate-400 text-xs italic">Sin categoría</span>
                )
            },
            filterFn: (row, id, value) => {
                const catName = row.original.categoria?.nombre || "";
                return catName === value;
            },
        },
        {
            id: "compatibilidad",
            header: "Compatibilidad",
            cell: ({ row }) => {
                const compat = row.original.modelosCompatibles || row.original.compatibilidades || [];
                if (compat.length === 0) {
                    return <span className="text-slate-400 text-xs italic flex items-center gap-1"><Car className="w-3 h-3" /> Universal / N/A</span>
                }

                const first = compat[0];
                const count = compat.length;

                return (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div className="cursor-help inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors group">
                                <Car className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-medium text-slate-700">
                                    {first.marca} {first.modelo} {count > 1 ? `+${count - 1}` : `(${first.anio})`}
                                </span>
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-0 overflow-hidden shadow-xl border-slate-200">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Vehículos Compatibles</span>
                                <Badge variant="secondary" className="h-5 text-[10px] bg-white border border-slate-200">{count}</Badge>
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2 bg-white">
                                {compat.map((c: any) => (
                                    <div key={c.id} className="text-sm py-1.5 px-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-sm flex justify-between items-center text-slate-600">
                                        <span className="font-medium">{c.marca} {c.modelo}</span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{c.anio}</span>
                                    </div>
                                ))}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )
            },
        },
        {
            accessorKey: "marca",
            header: "Marca",
            cell: ({ row }) => <div className="text-sm text-slate-600">{row.getValue("marca") || "Genérico"}</div>,
        },
        {
            accessorKey: "calidad",
            header: "Calidad",
            cell: ({ row }) => {
                const val = row.getValue("calidad") as string;
                if (!val) return <span className="text-slate-300">-</span>;
                return <span className="text-xs font-medium text-slate-600">{val}</span>;
            },
        },
        {
            accessorKey: "stock_actual",
            header: "Stock",
            cell: ({ row }) => {
                const stock = row.getValue("stock_actual") as number;
                const min = row.original.stock_minimo;
                const isLow = stock <= min;

                return (
                    <div className="flex items-center gap-2">
                        <div className={`font-bold ${isLow ? "text-orange-600" : "text-slate-600"}`}>
                            {stock}
                        </div>
                        {isLow && (
                            <HoverCard>
                                <HoverCardTrigger>
                                    <AlertTriangle className="w-4 h-4 text-orange-500 cursor-help animate-pulse" />
                                </HoverCardTrigger>
                                <HoverCardContent className="w-auto p-2 text-xs bg-orange-50 text-orange-800 border-orange-100">
                                    Stock crítico (Mín: {min})
                                </HoverCardContent>
                            </HoverCard>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "precio_venta",
            header: ({ column }) => {
                return (
                    <div className="text-right">
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="hover:bg-slate-50 -mr-4"
                        >
                            Precio
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("precio_venta"))
                const formatted = new Intl.NumberFormat("es-CL", {
                    style: "currency",
                    currency: "CLP",
                }).format(amount);

                return <div className="font-bold text-slate-900 text-right">{formatted}</div>
            },
        },
        {
            id: "actions",
            cell: ({ row }) => <ActionsCell product={row.original} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} />
        },
    ]
