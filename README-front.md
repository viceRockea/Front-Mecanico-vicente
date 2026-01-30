# Sistema de Gestión - Frenos Aguilera

Sistema de gestión de inventario, órdenes de trabajo y ventas para taller mecánico.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en http://localhost:5000

## 📋 Credenciales de Prueba

- **RUT**: 11.111.111-1
- **Password**: admin123
- **Rol**: Administrador

## 📁 Estructura del Proyecto

```
├── client/               # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── hooks/       # Custom hooks (React Query)
│   │   ├── lib/         # Utilidades
│   │   └── pages/       # Páginas principales
├── server/              # Backend Express + TypeScript
├── shared/              # Código compartido (schemas)
├── docs/                # Documentación
└── script/              # Scripts de build
```

## 🔧 Tecnologías

### Frontend
- React 18 + TypeScript
- TanStack Query v5 (React Query)
- Wouter (Router)
- shadcn/ui + Tailwind CSS

### Backend
- Express.js + TypeScript
- Almacenamiento en memoria (desarrollo)

## 📖 Documentación

La documentación completa está en la carpeta `docs/`:

- [QUICKSTART.md](docs/QUICKSTART.md) - Guía de inicio rápido
- [BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md) - Integración con backend
- [HOOKS_REFERENCE.md](docs/HOOKS_REFERENCE.md) - Referencia de hooks
- [PROXY_CONFIG.md](docs/PROXY_CONFIG.md) - Configuración de proxy
- [LOGIN_INSTRUCTIONS.md](docs/LOGIN_INSTRUCTIONS.md) - Instrucciones de login

## 🎯 Funcionalidades

- ✅ Gestión de inventario de productos
- ✅ Órdenes de trabajo con seguimiento
- ✅ Ventas de mostrador
- ✅ Compras a proveedores (solo ADMIN)
- ✅ Reportes de stock bajo y caja diaria
- ✅ Búsqueda global (clientes, vehículos, órdenes)
- ✅ Gestión de clientes y vehículos
- ✅ Autenticación con roles (ADMIN/WORKER)

## 🔐 Roles y Permisos

### Administrador (ADMIN)
- Acceso completo a todas las funciones
- Gestión de proveedores y compras
- Todos los permisos de trabajador

### Trabajador (WORKER)
- Inventario (lectura)
- Órdenes de trabajo
- Ventas de mostrador
- Reportes básicos

## 🌐 Conexión con Backend Externo

El frontend está preparado para conectarse con un backend NestJS. Ver [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md) para detalles.

## 📝 Notas

- El servidor de desarrollo usa almacenamiento en memoria
- Los datos se reinician al reiniciar el servidor
- Para producción, conectar con el backend real
