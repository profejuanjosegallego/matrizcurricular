# Matriz del Consultor · CESDE Desarrollo de Software

Página colaborativa para que los docentes definan el perfil del **consultor** en cada uno de los
9 submódulos del programa: cómo lo entienden y qué debería **saber / saber-hacer / saber-ser**.
Con los aportes se construye una **definición única** por submódulo, base para ajustar el programa.

Los datos se guardan en **MongoDB Atlas** mediante funciones serverless en **Vercel**.

## Estructura
```
matriz-consultor/
├─ index.html          # interfaz (las 9 materias + formularios)
├─ api/
│  ├─ aportes.js       # GET/POST de los aportes de cada docente
│  └─ definicion.js    # GET/POST de la definición única por materia
├─ lib/mongo.js        # conexión reutilizable a MongoDB
├─ package.json
└─ .env.example
```

> ⚠️ La página NO funciona abriéndola con doble clic (`file://`): las rutas `/api` necesitan
> el entorno de Vercel. Usa `vercel dev` (local) o despliega en Vercel.

## 1) Crear el cluster GRATIS en MongoDB Atlas
El plan gratis se llama **M0** (no "free"). Si solo ves M10 / M30 / Flex:
- Crea un **nuevo Project** (Atlas solo permite **1 cluster M0 por proyecto**) y créalo ahí.
- Elige la plantilla **M0**, proveedor **AWS**, región recomendada (ej. *us-east-1*).

Luego:
1. **Database Access** → crea un usuario y contraseña.
2. **Network Access** → *Add IP Address* → `0.0.0.0/0` (permitir desde cualquier lugar; necesario para Vercel).
3. **Connect → Drivers** → copia la cadena `mongodb+srv://...` (es tu `MONGODB_URI`).

## 2) Desplegar en Vercel
1. Sube esta carpeta a un repositorio de GitHub (o `vercel` desde la terminal).
2. En Vercel: **New Project** → importa el repo.
3. **Settings → Environment Variables** agrega:
   - `MONGODB_URI` = la cadena de conexión (¡incluye usuario y contraseña!)
   - `MONGODB_DB`  = `cesde_consultor` (opcional)
   - `GROQ_API_KEY` = tu clave de Groq (para la síntesis con IA) — se obtiene en https://console.groq.com/keys
   - `GROQ_MODEL` = `llama-3.3-70b-versatile` (opcional)
4. **Deploy**. Comparte el link con los 3 docentes.

## 3) Probar en local (opcional)
```bash
npm install
npm i -g vercel
copy .env.example .env.local   # y edita MONGODB_URI
vercel dev
```
Abre http://localhost:3000

## Modelo de datos
- Colección `aportes`: `{ materiaId, profesor, comprension, saber, saberHacer, saberSer, updatedAt }`
  (clave única por `materiaId + profesor`, así cada docente edita su propio aporte).
- Colección `definiciones`: `{ materiaId, definicion, updatedAt }` (la síntesis acordada por materia).

## Seguridad
La página es de acceso abierto por el link (sin login). Para un grupo cerrado de 3 docentes suele
bastar; si necesitas protegerla, se puede añadir una clave compartida o autenticación.
