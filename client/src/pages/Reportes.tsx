import { useState } from "react";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLowStockReport, useDailyCashReport } from "@/hooks/use-reports";
import {
  Package,
  ShoppingCart,
  Wrench,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Loader2,
  Users,
  Receipt,
  CalendarIcon,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function Reportes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<string>("");

  const { data: lowStockReport, isLoading: loadingStock } = useLowStockReport();
  const { data: cashReport, isLoading: loadingCash } = useDailyCashReport(selectedDate || undefined);

  const lowStockProducts = lowStockReport?.productos || [];
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'administrador';

  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    if (!dateString) return "Hoy";
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel de Control"
        description={`Bienvenido, ${user?.nombre || 'Usuario'} • ${new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      {/* Acciones Rápidas - Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Acciones Rápidas</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Ver Inventario -> Nuevo Repuesto */}
            <Button
              variant="secondary"
              className="h-auto py-4 px-4 flex-col gap-2 bg-white/10 hover:bg-white/20 border-0 text-white backdrop-blur-sm transition-all hover:scale-105"
              onClick={() => setLocation('/inventory?action=new')}
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-xs font-medium">Nuevo Repuesto</span>
            </Button>

            {/* Registrar Compra - Solo Admin */}
            {isAdmin && (
              <Button
                variant="secondary"
                className="h-auto py-4 px-4 flex-col gap-2 bg-white/10 hover:bg-white/20 border-0 text-white backdrop-blur-sm transition-all hover:scale-105"
                onClick={() => setLocation('/purchases/create')}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium">Nueva Compra</span>
              </Button>
            )}

            {/* Nueva Orden */}
            <Button
              variant="secondary"
              className="h-auto py-4 px-4 flex-col gap-2 bg-white/10 hover:bg-white/20 border-0 text-white backdrop-blur-sm transition-all hover:scale-105"
              onClick={() => setLocation('/work-orders?action=new')}
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs font-medium">Nueva Orden</span>
            </Button>

            {/* Venta Mostrador */}
            <Button
              variant="secondary"
              className="h-auto py-4 px-4 flex-col gap-2 bg-white/10 hover:bg-white/20 border-0 text-white backdrop-blur-sm transition-all hover:scale-105"
              onClick={() => setLocation('/counter-sales?action=new')}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-medium">Venta Mesón</span>
            </Button>

            {/* Ver Clientes -> Nuevo Cliente */}
            <Button
              variant="secondary"
              className="h-auto py-4 px-4 flex-col gap-2 bg-white/10 hover:bg-white/20 border-0 text-white backdrop-blur-sm transition-all hover:scale-105"
              onClick={() => setLocation('/clients?action=new')}
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs font-medium">Nuevo Cliente</span>
            </Button>

            {/* Ver Compras - Solo Admin */}
            {isAdmin && (
              <Button
                variant="secondary"
                className="h-auto py-4 px-4 flex-col gap-2 bg-white/10 hover:bg-white/20 border-0 text-white backdrop-blur-sm transition-all hover:scale-105"
                onClick={() => setLocation('/purchases')}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs font-medium">Historial</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Caja Diaria */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 leading-none">Resumen de Caja</h2>
          </div>

          {/* Selector de Fecha con Popover */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[200px] justify-start text-left font-normal h-9",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate + 'T12:00:00') : undefined}
                  locale={es}
                  onSelect={(date) => {
                    if (date) {
                      const formatted = date.toISOString().split('T')[0];
                      setSelectedDate(formatted);
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate("")}
                className="text-xs h-9"
              >
                Ver hoy
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Taller */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-50 to-green-100/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Taller</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingCash ? (
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-900">${(cashReport?.total_taller || 0).toLocaleString('es-CL')}</div>
                  <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>{cashReport?.cantidad_ordenes || 0} órdenes • {formatDate(selectedDate)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mesón */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Mesón</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingCash ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-900">${(cashReport?.total_meson || 0).toLocaleString('es-CL')}</div>
                  <div className="flex items-center gap-1 text-xs text-blue-700 mt-1">
                    <Receipt className="w-3 h-3" />
                    <span>{cashReport?.cantidad_ventas_meson || 0} ventas</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Total Día</CardTitle>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingCash ? (
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-purple-900">${(cashReport?.total_final || 0).toLocaleString('es-CL')}</div>
                  <div className="flex items-center gap-1 text-xs text-purple-700 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Taller + Mesón</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stock Bajo */}
          <Card className={`relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow ${lowStockProducts.length > 0
            ? 'bg-gradient-to-br from-red-50 to-red-100/50'
            : 'bg-gradient-to-br from-slate-50 to-slate-100/50'
            }`}>
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-1/2 translate-x-1/2 ${lowStockProducts.length > 0 ? 'bg-red-500/10' : 'bg-slate-500/10'
              }`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${lowStockProducts.length > 0 ? 'text-red-900' : 'text-slate-900'}`}>
                Stock Bajo
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockProducts.length > 0 ? 'bg-red-500/20' : 'bg-slate-500/20'
                }`}>
                {lowStockProducts.length > 0 ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingStock ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${lowStockProducts.length > 0 ? 'text-red-900' : 'text-slate-900'}`}>
                    {lowStockReport?.total_alertas || 0}
                  </div>
                  <div className={`flex items-center gap-1 text-xs mt-1 ${lowStockProducts.length > 0 ? 'text-red-700' : 'text-slate-600'
                    }`}>
                    <Package className="w-3 h-3" />
                    <span>{lowStockProducts.length > 0 ? 'productos a reponer' : 'todo en orden'}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {!loadingStock && lowStockProducts.length > 0 && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">⚠️ Alerta de Stock Bajo</AlertTitle>
          <AlertDescription>
            <p className="mb-3">{lowStockProducts.length} producto(s) requieren reposición:</p>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 6).map((product) => (
                <Badge key={product.id} variant="destructive" className="font-mono text-xs py-1 px-2">
                  {product.sku} • {product.nombre} ({product.stock_actual}/{product.stock_minimo})
                </Badge>
              ))}
              {lowStockProducts.length > 6 && (
                <Badge variant="outline" className="text-red-700 border-red-300">
                  +{lowStockProducts.length - 6} más
                </Badge>
              )}
            </div>
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                className="mt-3"
                onClick={() => setLocation('/purchases/create')}
              >
                Registrar Compra
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}