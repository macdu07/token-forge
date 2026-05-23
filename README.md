# TokenForge 🛠️🎨

**TokenForge** es una herramienta web moderna, minimalista y precisa para generar, gestionar y exportar sistemas de color y tokens de diseño para cualquier proyecto de desarrollo web. 

Diseñada con un enfoque técnico y profesional, permite a diseñadores y desarrolladores crear paletas consistentes mediante interpolaciones matemáticas avanzadas, verificar el contraste de accesibilidad en tiempo real y exportar el resultado a múltiples formatos estándar de la industria.

---

## ✨ Características clave

- 🚀 **Generación automática de escalas:** Produce tonos claros (light), oscuros (dark) y transparencias (alpha steps) a partir de colores base.
- 📐 **Control granular del motor de color:** Utiliza el espacio de color perceptual **OKLCH** o **HSL**. Permite configurar el factor de croma (chroma scaling), giros de tono (hue shift) y curvas de interpolación (Lineal, Ease In, Ease Out y Perceptual/Curva-S).
- 🌓 **Modo Oscuro inteligente:** Genera variantes oscuras automáticas optimizadas para accesibilidad y contraste, con inversión inteligente y adaptativa para colores neutros (como blanco y negro).
- 🔀 **Reordenación por Drag & Drop:** Reorganiza el orden de tus colores de forma interactiva en la barra lateral utilizando arrastrar y soltar nativo.
- 👁️ **Previsualizaciones en vivo:**
  - **Color Ramps:** Rampas visuales detalladas de todas las variaciones.
  - **Components Canvas:** Vista previa interactiva de la paleta en componentes reales de UI (tarjetas, botones, textos, alertas, etc.).
  - **Contrast Checker:** Validador automático de contraste bajo estándares **WCAG (AA y AAA)**.
- 📥 **Importación flexible:** Carga paletas existentes pegando código CSS (propiedades personalizadas), JSON de tokens estándar (W3C Design Tokens), o archivos JSON exportados desde WordPress (Bricks Builder).
- 📤 **Exportación multiformato:**
  - **CSS nativo** (bloques `:root` y clases de tema oscuro).
  - **SCSS** (variables Sass estructuradas).
  - **Tailwind CSS** (objeto extendido de configuración listo para `tailwind.config.js`).
  - **Design Tokens JSON** (formato universal compatible con Style Dictionary).
  - **Bricks JSON** (paleta nativa lista para importar en el builder de WordPress).
- 💾 **Persistencia local:** Tus paletas y configuraciones se guardan de forma automática en el navegador (`localStorage`) para que nunca pierdas tu trabajo.

---

## 🛠️ Stack tecnológico

- **Core:** React 19 + TypeScript + Vite
- **Estilos:** Tailwind CSS + Lucide Icons + Radix UI (Tabs, Switch)
- **Manejo del estado:** Zustand (con persistencia y migración de esquemas)
- **Motor de color:** Culori (espacio OKLCH y HSL)
- **Validaciones:** Zod

---

## 🚀 Inicio rápido (Desarrollo local)

Asegúrate de tener instalado [Node.js](https://nodejs.org/) y tu gestor de paquetes favorito (se recomienda [pnpm](https://pnpm.io/)).

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   pnpm run dev
   ```
   La aplicación se abrirá en `http://localhost:5173/`.

3. **Compilar para producción:**
   ```bash
   pnpm run build
   ```
   Los archivos listos para producción se generarán en la carpeta `/dist`.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de usarlo, modificarlo y adaptarlo a tus necesidades.
