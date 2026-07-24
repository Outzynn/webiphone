# WebiPhone — Gestión de compra/venta de iPhones

App web para controlar inventario, compras, ventas (contado/cuotas), clientes,
proveedores, garantías y ganancias/inversión de un negocio de compra/venta de
iPhones nuevos y usados, con impresión de mini etiquetas autoadhesivas (modelo,
IMEI, batería, almacenamiento + QR) para pegar en cada equipo.

Stack: Next.js 16 (App Router) + TypeScript + Supabase (Postgres, Auth, Storage)
+ Tailwind CSS + shadcn/ui + Recharts.

## 1. Crear el proyecto en Supabase

1. Andá a [supabase.com](https://supabase.com), creá una cuenta (gratis) y un
   nuevo proyecto.
2. En **Project Settings > API** copiá:
   - `Project URL`
   - `anon public` key
3. Creá el archivo `.env.local` en la raíz (copiando `.env.local.example`) y
   pegá esos valores:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SUPABASE_PHOTOS_BUCKET=device-photos
   ```

## 2. Cargar el schema de la base de datos

1. En el dashboard de Supabase, abrí **SQL Editor > New query**.
2. Pegá todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y
   ejecutalo. Esto crea todas las tablas, los tipos, los índices y las
   políticas de seguridad (RLS).

## 3. Crear el bucket de fotos

1. Andá a **Storage > New bucket**.
2. Nombre: `device-photos` (debe coincidir con `NEXT_PUBLIC_SUPABASE_PHOTOS_BUCKET`).
3. Dejalo **privado** (no marcar "Public bucket") — el acceso se maneja con las
   políticas ya creadas por `schema.sql`.

## 4. Crear los usuarios (los 4 empleados)

1. Andá a **Authentication > Users > Add user**.
2. Creá un usuario por cada persona que va a usar el sistema (email +
   contraseña). Todos comparten los mismos permisos, no hace falta configurar
   roles.

## 5. Instalar dependencias y correr en desarrollo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) e iniciá sesión con
cualquiera de los usuarios creados en el paso 4.

## 6. Deploy

- **Vercel** (recomendado, gratis): importá el repo en
  [vercel.com/new](https://vercel.com/new), configurá las mismas variables de
  entorno del `.env.local` en el proyecto de Vercel, y desplegá.
- Supabase ya queda funcionando en la nube desde el paso 1, no requiere nada
  adicional.

## Notas

- **Etiquetas**: el tamaño de la etiqueta (en mm) se configura en
  `/configuracion`. La impresión usa el diálogo de impresión del navegador
  (`window.print()`), así que funciona con cualquier impresora térmica que
  tenga driver instalado en Windows. Si la impresora que compres solo imprime
  a través de su app propia (pasa con algunos modelos Niimbot), va a hacer
  falta una integración puntual con su SDK — avisame cuando la tengas para
  ajustar esa parte.
- **Cotización del dólar**: se trae automáticamente de
  [dolarapi.com](https://dolarapi.com) (blue u oficial, configurable en
  `/configuracion`), o se puede fijar manualmente.
- **IMEI**: el campo de IMEI en el alta de dispositivo tiene autofocus y
  funciona directo con un lector de código de barras USB (que actúa como
  teclado).
