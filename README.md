# Lucky Motors Risk Manager

Sistema administrativo web para la gestión, análisis y auditoría de riesgos de información, físicos y humanos de la empresa Lucky Motors, Tarapoto.

## Descripción del Proyecto

El sistema está construido con:
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Backend & Base de Datos:** Supabase (PostgreSQL, Auth, Storage, RLS).
- **Arquitectura Visual:** Inspirada en paneles administrativos modernos tipo TailAdmin, con soporte para modo claro y oscuro.

## Requisitos Previos

- Node.js 18+
- NPM o Yarn
- Una cuenta en [Supabase](https://supabase.com/)
- Cuenta de Google Cloud Console (para OAuth)

## Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configuración de Variables de Entorno:**
   Copia el archivo `.env.example` y renómbralo a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Rellena los valores de `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con las credenciales de tu proyecto Supabase.

3. **Configuración de Base de Datos (Supabase):**
   - Ve a tu panel de Supabase > SQL Editor.
   - Copia todo el contenido del archivo `supabase/schema.sql` y ejecútalo. Esto creará:
     - Todas las tablas necesarias.
     - Funciones y triggers para calcular automáticamente los niveles de riesgo.
     - Políticas RLS.
     - Datos iniciales (*seed*) de activos y riesgos de Lucky Motors.

4. **Configuración de Autenticación con Google:**
   - En tu panel de Supabase, ve a **Authentication** > **Providers** > **Google**.
   - Habilita el proveedor e ingresa el Client ID y Client Secret que obtengas de tu consola de Google Cloud.
   - Añade la URL de redirección: `http://localhost:3000/auth/callback` (para desarrollo local).

5. **Configuración de Storage (Evidencias):**
   - En Supabase, ve a **Storage**.
   - Crea un bucket llamado `risk-evidences` de acceso público.
   - Aplica las políticas RLS necesarias para permitir subidas a usuarios autenticados.

## Ejecución Local

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

El sistema estará disponible en `http://localhost:3000`.

## Módulos del Sistema

- **Dashboard:** Resumen de KPIs, métricas críticas y acceso rápido a los módulos.
- **Activos:** Inventario de activos físicos, humanos, tecnológicos y de información de la empresa.
- **Matriz de Riesgos:** Registro y cálculo automático (Probabilidad × Impacto = Nivel).
- **Mapa de Calor:** Visualización interactiva 5x5 de todos los riesgos categorizados.
- **Tratamiento:** Seguimiento de las acciones de mitigación para cada riesgo crítico o alto.
- **Evidencias:** Repositorio de documentos que sustentan la mitigación de los riesgos.
- **Auditoría:** Log defensivo que registra eventos críticos del sistema (quién, qué y cuándo).
