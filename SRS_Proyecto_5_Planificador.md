# Software Requirements Specification (SRS)
## Proyecto 5: Planificador avanzado (bloques, conflictos y re‑planificación)

### 1. Introducción
#### 1.1 Propósito
Desarrollar un asistente de planificación académica que asigne automáticamente tareas pendientes a bloques de tiempo disponibles en el día del estudiante, optimizando según prioridad y deadlines.

#### 1.2 Alcance
El sistema gestiona una lista de tareas (To-Do) y una configuración de horario diario. Genera una agenda ("Plan") mostrando qué hacer y cuándo, y alerta sobre imposibilidades.

### 2. Descripción General
#### 2.1 Lógica de Negocio
Es un problema de calendarización (Scheduling). El sistema debe decidir el orden de ejecución y el "slot" de tiempo.

### 3. Requerimientos Funcionales (MVP)

#### 3.1 Gestión de Tareas (Input)
- **RF-01 CRUD Tareas**: Crear tareas con Nombre, Duración estimada, Deadline (Fecha/Hora) y Prioridad.
- **RF-02 Estado**: Marcar tareas como Pendiente o Completada.

#### 3.2 Gestión de Tiempo
- **RF-03 Definición de Bloques**: El usuario define sus horas libres (ej. "Lunes 14:00-16:00", "Lunes 20:00-22:00").

#### 3.3 Planificador Automático
- **RF-04 Algoritmo de Asignación**: Llenar los bloques disponibles con tareas pendientes.
- **RF-05 Criterio de Selección (Greedy)**: Seleccionar la "mejor" tarea para el hueco actual basándose en Deadline próximo y Prioridad alta.
- **RF-06 Detección de Conflictos**: Identificar tareas que no caben en ningún bloque o cuyo deadline expira antes del bloque disponible.

#### 3.4 Feedback
- **RF-07 Alertas**: Notificar al usuario "La tarea X no entra en tu horario de hoy".

### 4. Requerimientos No Funcionales
- **Respuesta Inmediata**: La regeneración del plan debe ser rápida tras cambiar una tarea.
- **Eficiencia**: Uso de estructuras de ordenamiento adecuadas.

### 5. Estructuras de Datos
- **Cola de Tareas Candidatas**: Priority Queue (Heap) ordenada por "Urgencia" (función de deadline y prioridad).
- **Lista de Bloques**: Lista enlazada o Arreglo ordenado cronológicamente.
- **Map de Tareas**: `HashMap<ID, ObjetoTarea>` para acceso rápido.

### 6. Interfaz de Usuario
1.  **/tareas**: Lista clásica To-Do.
2.  **/bloques**: Interfaz de horario (tipo Google Calendar simplificado).
3.  **/plan**: Resultado visual. Cronograma del día con las tareas asignadas.

### 7. API Endpoints
- `POST /api/tasks`: Crear tarea.
- `POST /api/blocks`: Definir disponibilidad.
- `POST /api/plan/generate`: Ejecutar el scheduler.
- `GET /api/plan`: Obtener el plan actual JSON.


### 9. Principios de Diseño UX/UI (Sutiles)
- **Don Norman (Modelo Mental)**: La vista de calendario debe comportarse como una agenda física tradicional para coincidir con el modelo mental del estudiante.
- **Ley de Fitts**: Crear tareas nuevas debe ser una acción rápida, con botones flotantes (FAB) o atajos accesibles.
- **Ley de Hick**: Simplificar el formulario de creación de tarea ocultando campos opcionales por defecto.
- **Jakob Nielsen (Visibilidad del estado)**: Alertar visualmente (colores semafóricos) cuando un bloque de tiempo está sobrecargado o en conflicto.

### 8. Casos de Prueba
- Tarea con duración mayor al bloque más grande (No asignable).
- Tarea con deadline ya pasado (Vencida).
- Múltiples tareas compitiendo por un solo bloque (Verificar que gane la de mayor prioridad/urgencia).
