import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, User, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ClienteDetalle {
    id: string;
    nombre: string;
    rut: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    cantidad_ordenes?: number;
}

export const createColumns = (
    onView: (cliente: ClienteDetalle) => void
): ColumnDef<ClienteDetalle>[] => [
        {
            accessorKey: "nombre",
            header: "Nombre",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 font-medium text-slate-900">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {row.getValue("nombre")}
                </div>
            ),
        },
        {
            accessorKey: "rut",
            header: "RUT",
            cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("rut")}</div>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => {
                const email = row.getValue("email") as string;
                return email ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        {email}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                );
            },
        },
        {
            accessorKey: "telefono",
            header: "Teléfono",
            cell: ({ row }) => {
                const phone = row.getValue("telefono") as string;
                return phone ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {phone}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                );
            },
        },
        {
            accessorKey: "direccion",
            header: "Dirección",
            cell: ({ row }) => {
                const address = row.getValue("direccion") as string;
                return address ? (
                    <div className="max-w-xs truncate text-sm text-slate-600" title={address}>
                        {address}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                );
            },
        },
        {
            accessorKey: "cantidad_ordenes",
            header: () => <div className="text-center">Órdenes</div>,
            cell: ({ row }) => {
                const count = row.getValue("cantidad_ordenes") as number;
                return (
                    <div className="text-center">
                        {count > 0 ? (
                            <Badge variant="secondary">{count}</Badge>
                        ) : (
                            <span className="text-muted-foreground text-sm">0</span>
                        )}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const client = row.original;

                return (
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onView(client);
                            }}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalle
                        </Button>
                    </div>
                );
            },
        },
    ];
