# Plan de Producto — Generador de Paletas para Bricks Builder

## 1. Visión

Crear una herramienta web moderna, minimalista y precisa para generar sistemas de color compatibles con Bricks Builder. La herramienta debe permitir definir colores base, generar escalas, transparencias, variables CSS y, cuando sea viable, un archivo JSON compatible con la estructura de paletas/variables de Bricks.

La propuesta se inspira en generadores visuales como GenCSS, pero con una interfaz más refinada, enfocada en diseño profesional, control granular y exportación práctica para flujos reales de WordPress + Bricks.

---

## 2. Objetivo principal

Permitir que un diseñador o desarrollador cree rápidamente una paleta global para Bricks Builder con:

- Colores base: `primary`, `secondary`, `tertiary`, `accent`, `base`, `neutral`, `success`, `warning`, `error`, `info`.
- Variantes claras, oscuras y transparentes.
- Variables CSS listas para pegar o importar.
- Exportación JSON compatible con Bricks, sujeta a validación con la estructura real exportada desde Bricks.
- Soporte para modo claro y modo oscuro.
- Previsualización visual de la paleta en componentes reales.

---

## 3. Contexto técnico de Bricks

Bricks cuenta con un sistema de variables globales y un Color Manager. Según la documentación actual, las variables pueden importarse desde CSS o JSON, agruparse por categorías y usarse como design tokens dentro del builder. El Color Manager permite construir sistemas de color sobre variables CSS, con valores para modo claro/oscuro, variantes de color y clases utilitarias.

El JSON adjunto exportado desde Bricks muestra una estructura basada en:

- Un objeto raíz con `id`, `name` y `colors`.
- Colores padre con `id`, `raw`, `light`, `dark` y `darkModeEnabled`.
- Colores hijos con `type`, `raw`, `index`, `parent` y valores `light` o `dark`.
- Variantes tipo `light`, `dark` y `transparent`.
- Referencias CSS como `var(--primary)`, `var(--primary-l-1)`, `var(--primary-d-1)` y `var(--primary-t-1)`.

El archivo analizado contiene 4 colores padre y 244 entradas de color en total. Cada color padre tiene 60 variantes hijas: 10 claras, 10 oscuras y 10 transparentes para light mode, más 10 claras, 10 oscuras y 10 transparentes para dark mode.

---

## 4. Alcance del MVP

### 4.1 Funciones esenciales

1. **Editor de paleta**
   - Añadir, editar, duplicar y eliminar colores.
   - Definir nombre semántico del color.
   - Definir color base en HEX, HSL u OKLCH.
   - Activar/desactivar modo oscuro por color.
   - Definir color alternativo para dark mode.

2. **Generación automática de escalas**
   - Escala clara: `--primary-l-1` a `--primary-l-10`.
   - Escala oscura: `--primary-d-1` a `--primary-d-10`.
   - Escala transparente: `--primary-t-1` a `--primary-t-10`.
   - Control granular de hue, saturation/chroma y lightness.
   - Opción de escalas suaves, contrastadas o personalizadas.

3. **Salida CSS**
   - Generar bloque `:root`.
   - Generar bloque para dark mode, por ejemplo:
     - `[data-theme="dark"]`
     - `.bricks-is-frontend.dark`
     - Selector personalizado definido por el usuario.
   - Copiar CSS al portapapeles.
   - Descargar archivo `.css`.

4. **Salida JSON para Bricks**
   - Generar JSON con estructura equivalente al archivo exportado desde Bricks.
   - Crear IDs únicos para cada color.
   - Mantener relaciones `parent` entre colores base y variantes.
   - Exportar archivo `.json`.
   - Validar internamente el JSON antes de descargarlo.

5. **Previsualización**
   - Vista de rampas de color.
   - Vista de tarjetas, botones, textos, fondos y estados.
   - Validación básica de contraste.
   - Comparación entre light mode y dark mode.

---

## 5. Funciones para una versión avanzada

### 5.1 Importación

- Importar JSON exportado desde Bricks.
- Importar variables CSS existentes.
- Pegar un bloque CSS y convertirlo en paleta editable.
- Importar paletas desde formato JSON propio del generador.

### 5.2 Presets

- Paleta SaaS minimal.
- Paleta editorial.
- Paleta luxury.
- Paleta legal/corporativa.
- Paleta e-commerce.
- Paleta dark-first.
- Presets compatibles con convenciones tipo ACSS: `primary`, `secondary`, `base`, `neutral`, etc.

### 5.3 Validación profesional

- Contraste WCAG AA/AAA.
- Detección de colores demasiado similares.
- Recomendaciones para foreground/background.
- Detección de saturación excesiva.
- Simulación básica de daltonismo.
- Recomendaciones automáticas de dark mode.

### 5.4 Exportaciones adicionales

- JSON de design tokens.
- Tailwind config parcial.
- SCSS variables.
- CSS con fallback.
- Archivo compatible con Style Dictionary.
- Tokens para Figma, en una fase futura.

---

## 6. Modelo de datos propuesto

```ts
type PaletteColor = {
  id: string;
  name: string;
  variable: string;
  light: string;
  dark?: string;
  darkModeEnabled: boolean;
  shades: {
    light: ColorStep[];
    dark: ColorStep[];
    transparent: ColorStep[];
  };
  darkModeShades?: {
    light: ColorStep[];
    dark: ColorStep[];
    transparent: ColorStep[];
  };
};

type ColorStep = {
  id: string;
  type: "light" | "dark" | "transparent";
  index: number;
  variable: string;
  value: string;
  mode: "light" | "dark";
};
```

---

## 7. Estructura JSON objetivo para Bricks

La exportación debería generar una estructura similar a:

```json
{
  "id": "generated-id",
  "name": "Generated Palette",
  "colors": [
    {
      "id": "primary-id",
      "raw": "var(--primary)",
      "light": "hsl(220, 80%, 50%)",
      "darkModeEnabled": true,
      "dark": "hsl(220, 80%, 70%)"
    },
    {
      "id": "primary-l-1-id",
      "type": "light",
      "raw": "var(--primary-l-1)",
      "index": 0,
      "parent": "primary-id",
      "light": "hsl(220, 80%, 55%)"
    }
  ]
}
```

Punto crítico: antes de considerar esta exportación como estable, se debe validar con pruebas reales de importación en Bricks, porque la compatibilidad puede depender de la versión instalada y del área exacta de importación: Color Manager, Variable Manager o Global Theme Styles.

---

## 8. Arquitectura técnica recomendada

### 8.1 Stack sugerido

Para el MVP:

- **Frontend:** React + TypeScript.
- **Build tool:** Vite.
- **Estilos:** Tailwind CSS.
- **Color engine:** Culori o una utilidad propia basada en OKLCH/HSL.
- **Estado:** Zustand o TanStack Store.
- **Validación:** Zod.
- **Exportación:** generación local en navegador, sin backend inicial.

Para una versión más sofisticada:

- **Framework:** Next.js o Astro + React islands.
- **Persistencia:** LocalStorage primero; Supabase después.
- **Autenticación:** opcional solo si se quieren guardar paletas en la nube.
- **Backend:** innecesario para el MVP, salvo para cuentas, plantillas remotas o comunidad.

### 8.2 Módulos principales

```txt
/src
  /components
    ColorEditor.tsx
    PaletteRamp.tsx
    PreviewCanvas.tsx
    ExportPanel.tsx
    ContrastChecker.tsx
  /lib
    color-engine.ts
    bricks-json.ts
    css-export.ts
    id-generator.ts
    validators.ts
  /presets
    palettes.ts
  /types
    palette.ts
```

---

## 9. Experiencia de usuario

### 9.1 Dirección visual

Interfaz minimalista, elegante y técnica:

- Layout en dos o tres paneles.
- Fondo neutro, mucho espacio negativo.
- Controles compactos pero legibles.
- Rampas de color grandes y limpias.
- Microinteracciones suaves.
- Modo claro/oscuro en la propia app.
- Panel de exportación tipo code editor.
- Estética premium, más cercana a una herramienta de diseño que a un generador básico.

### 9.2 Flujo principal

1. El usuario crea o carga una paleta.
2. Define colores base.
3. Ajusta escalas y dark mode.
4. Revisa preview en componentes.
5. Valida contraste.
6. Exporta CSS.
7. Exporta JSON para Bricks.
8. Importa en Bricks y ajusta si es necesario.

---

## 10. Pantallas del MVP

### 10.1 Dashboard / Editor

- Sidebar con lista de colores.
- Área central con rampas.
- Panel lateral de configuración.
- Botones de exportación.

### 10.2 Vista de Preview

- Cards.
- Botones.
- Inputs.
- Badges.
- Alertas.
- Secciones hero.
- Texto sobre fondos claros/oscuros.

### 10.3 Vista de Exportación

Tabs:

- CSS
- JSON Bricks
- JSON Tokens
- Instrucciones de importación

---

## 11. Estrategia de generación de color

### 11.1 Modo base

Para cada color:

- Convertir input a OKLCH internamente.
- Generar tonos claros aumentando lightness.
- Generar tonos oscuros reduciendo lightness.
- Mantener hue estable.
- Ajustar chroma progresivamente para evitar colores visualmente sucios o sobresaturados.
- Exportar en HSL, HEX u OKLCH según preferencia del usuario.

### 11.2 Transparencias

Generar alpha steps:

```txt
-t-1  = 0.09
-t-2  = 0.18
-t-3  = 0.27
-t-4  = 0.36
-t-5  = 0.45
-t-6  = 0.55
-t-7  = 0.64
-t-8  = 0.73
-t-9  = 0.82
-t-10 = 0.91
```

Este patrón coincide con el comportamiento observado en el JSON adjunto.

---

## 12. Criterios de compatibilidad con Bricks

Para considerar estable la exportación JSON, el proyecto debe superar estas pruebas:

1. Importar una paleta simple con un solo color.
2. Importar una paleta con light/dark mode.
3. Importar colores con variantes `light`, `dark` y `transparent`.
4. Confirmar que Bricks reconoce las relaciones padre/hijo.
5. Confirmar que las variables se muestran correctamente en el Color Manager.
6. Confirmar que las variables pueden usarse en elementos.
7. Confirmar que la exportación desde Bricks después de importar mantiene una estructura equivalente.
8. Probar compatibilidad en al menos dos versiones recientes de Bricks.

---

## 13. Riesgos técnicos

### 13.1 JSON no documentado completamente

El JSON de paletas puede tener propiedades internas no documentadas o variar entre versiones. Por eso el generador debe tratar el JSON como una salida experimental hasta validarlo con importaciones reales.

### 13.2 IDs internos

Bricks usa IDs cortos por color. El generador debe producir IDs únicos y estables. Para evitar colisiones, se recomienda generar strings alfabéticos de 6 caracteres o UUIDs cortos si Bricks los acepta.

### 13.3 Diferencia entre variables y colores

Bricks distingue entre variables globales y Color Manager. El generador debe aclarar al usuario qué exportación está usando: CSS variables, JSON de variables o JSON de paleta de colores.

### 13.4 Dark mode

La implementación de dark mode puede depender del setup del sitio, clases, atributos o ajustes internos. El CSS exportado debe permitir selector configurable.

---

## 14. Roadmap sugerido

### Fase 1 — Investigación y prototipo

- Analizar varios JSON exportados desde Bricks.
- Crear parser del JSON adjunto.
- Definir modelo interno.
- Probar generación de IDs.
- Crear prototipo visual estático.

### Fase 2 — MVP funcional

- Editor de colores.
- Generador de escalas.
- Exportación CSS.
- Exportación JSON inicial.
- Preview light/dark.
- Descarga de archivos.

### Fase 3 — Validación Bricks

- Importación real en Bricks.
- Comparar JSON generado vs JSON exportado por Bricks.
- Ajustar estructura.
- Documentar limitaciones.
- Crear guía de importación.

### Fase 4 — Producto pulido

- Presets.
- Importación de CSS/JSON.
- Guardado local.
- Validación WCAG.
- Mejoras de UI.
- Landing page.

### Fase 5 — Versión profesional

- Cuentas de usuario.
- Biblioteca de paletas.
- Exportación Figma tokens.
- Compartir paletas por URL.
- Integración con frameworks CSS.
- Posible extensión para WordPress.

---

## 15. Entregables iniciales recomendados

1. `PLAN.md` con este documento.
2. `SPEC-BRICKS-JSON.md` con la estructura documentada del JSON.
3. `COLOR-ENGINE.md` con la lógica de generación de escalas.
4. `UX-WIREFRAME.md` con las pantallas y flujos.
5. Prototipo React del generador.
6. Set de JSONs de prueba exportados desde Bricks.

---

## 16. Definición de éxito del MVP

El MVP será exitoso si permite:

- Crear una paleta completa en menos de 5 minutos.
- Exportar CSS usable inmediatamente en un sitio Bricks.
- Exportar un JSON que pueda probarse en Bricks sin edición manual.
- Ajustar light/dark mode de forma visual.
- Validar contraste básico.
- Entregar una experiencia visual superior a generadores técnicos tradicionales.
