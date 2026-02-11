# 📅 Planificador de Tareas

Aplicación web desarrollada con **React + TypeScript + Vite** que permite gestionar tareas, organizarlas en bloques y visualizarlas en un calendario.

El objetivo del proyecto es proporcionar una herramienta sencilla e interactiva para planificar actividades de forma visual y estructurada.

---

## 🚀 Tecnologías Utilizadas

* **React** (UI)
* **TypeScript** (Tipado estático)
* **Vite** (Build tool y servidor de desarrollo)
* **HTML5 + CSS**
* Arquitectura modular basada en componentes

---

## 📁 Estructura del Proyecto

```
planificador_tareas/
│
├── App.tsx
├── index.tsx
├── index.html
├── scheduler.ts
├── types.ts
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
│
└── components/
    ├── BlocksManager.tsx
    ├── CalendarView.tsx
    ├── Header.tsx
    ├── Sidebar.tsx
    └── TaskQueue.tsx
```

---

## 🧠 Estructuras de Datos y Algoritmos

El núcleo del planificador (`scheduler.ts`) utiliza varias estructuras de datos eficientes para resolver el problema de asignación de horarios:

### 1️⃣ Algoritmo Greedy (Voraz)
El motor de planificación utiliza un enfoque **Greedy** para asignar tareas.
* **Lógica**: Ordena las tareas por "urgencia" y asigna cada una al *primer* bloque de tiempo disponible que cumpla con los requisitos (duración y deadline).
* **Justificación**: Es eficiente para problemas de planificación en tiempo real donde se busca una solución buena y rápida, aunque no necesariamente la matemáticamente perfecta.

### 2️⃣ Priority Queue (Simulada)
Para determinar qué tarea procesar primero, se utiliza una **Cola de Prioridad** lógica basada en un puntaje de urgencia calculada dinámicamente:
* `Urgency Score = PriorityScore / HoursUntilDeadline`
* Esto asegura que las tareas con alta prioridad y fechas límite cercanas se programen antes que las tareas de baja prioridad a largo plazo.

### 3️⃣ Tipos de Datos Clave
* **Arrays (`Task[]`, `TimeBlock[]`)**: Estructuras base para almacenar la lista de tareas y bloques de disponibilidad.
* **Maps (`Map<string, BlockState>`)**: Se utiliza `Map` para rastrear el "tiempo restante" mutable de cada bloque durante el proceso de asignación, permitiendo acceso O(1) por ID de bloque.
* **Sets (`Set<string>`)**: Se usa `Set` para rastrear los IDs de tareas ya asignadas (`assignedTaskIds`), garantizando unicidad y búsquedas O(1) para evitar duplicados.
* **Grafos de Intervalos (Implícito)**: El sistema maneja intervalos de tiempo `[Start, End)` y detecta colisiones verificando superposiciones entre rangos ocupados y nuevos intentos de asignación.

---

## 🧱 Arquitectura de la Solución

El proyecto sigue una arquitectura **modular basada en componentes**, separando:

### 1️⃣ Capa de Presentación (UI)

Ubicada principalmente en:

```
components/
```

Contiene los componentes visuales reutilizables:

* **Header.tsx** → Barra superior de navegación.
* **Sidebar.tsx** → Panel lateral de navegación o filtros.
* **CalendarView.tsx** → Vista principal del calendario.
* **TaskQueue.tsx** → Cola o lista de tareas pendientes.
* **BlocksManager.tsx** → Gestión de bloques de tiempo o tareas.

Estos componentes son controlados por:

* **App.tsx** → Componente raíz que organiza la estructura general.
* **index.tsx** → Punto de entrada de React.

---

### 2️⃣ Capa de Lógica de Negocio

Separada de la UI para mantener buena organización:

* **scheduler.ts**
  Contiene la lógica principal para planificar tareas y asignarlas a bloques de tiempo.

* **types.ts**
  Define las interfaces y tipos TypeScript del sistema (por ejemplo: Task, Block, Schedule, etc.), garantizando tipado fuerte y mejor mantenibilidad.

---

### 3️⃣ Configuración del Proyecto

* **vite.config.ts** → Configuración de Vite.
* **tsconfig.json** → Configuración de TypeScript.
* **package.json** → Dependencias y scripts.
* **metadata.json** → Metadatos adicionales del proyecto.

---

## 🏗️ Patrón Arquitectónico

El proyecto sigue principios de:

* ✔️ Separación de responsabilidades
* ✔️ Componentización
* ✔️ Tipado fuerte con TypeScript
* ✔️ Lógica desacoplada de la vista
* ✔️ Organización modular

No utiliza un backend externo; es una aplicación **frontend pura**, por lo que el estado se maneja localmente dentro de React.

---

## ⚙️ Cómo Ejecutar el Proyecto Localmente

### 🔹 1. Requisitos Previos

Asegúrate de tener instalado:

* **Node.js** (versión 18 o superior recomendada)
* **npm** (incluido con Node)

Verifica con:

```bash
node -v
npm -v
```

---

### 🔹 2. Clonar o Extraer el Proyecto

Si lo tienes como ZIP:

```bash
unzip planificador_tareas.zip
cd planificador_tareas/planificador_tareas
```

Si está en un repositorio:

```bash
git clone <url-del-repositorio>
cd planificador_tareas
```

---

### 🔹 3. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias definidas en `package.json`.

---

### 🔹 4. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

Vite iniciará un servidor local y mostrará algo como:

```
Local: http://localhost:5173/
```

Abre esa URL en tu navegador.

---

### 🔹 5. Compilar para Producción

```bash
npm run build
```

Generará la carpeta:

```
dist/
```

Para previsualizar el build:

```bash
npm run preview
```

---

## 📦 Scripts Disponibles

En `package.json`:

* `npm run dev` → Ejecuta servidor de desarrollo.
* `npm run build` → Genera versión optimizada.
* `npm run preview` → Previsualiza build de producción.

---

## 🧠 Flujo de Funcionamiento

1. El usuario crea tareas.
2. Las tareas pasan a una cola (`TaskQueue`).
3. El sistema usa la lógica en `scheduler.ts` para organizarlas.
4. Se visualizan en bloques dentro de `CalendarView`.
5. `BlocksManager` permite administrar los bloques asignados.

---

## 📚 Conceptos Clave Aplicados

* Componentización en React
* Manejo de estado
* Arquitectura modular
* Tipado con TypeScript
* Separación UI / lógica