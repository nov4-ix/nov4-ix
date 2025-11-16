
# Son1k-GO! - Tu Asistente de Desarrollo y Despliegue IA

**Son1k-GO!** es un entorno de desarrollo web que integra un potente asistente de IA para acelerar drásticamente el ciclo de vida del software, desde la idea inicial hasta el despliegue en producción. La aplicación te permite conectar tu cuenta de GitHub, seleccionar un repositorio (o crear uno nuevo), modificar el código mediante lenguaje natural y desplegarlo en plataformas líderes como Vercel, Netlify o Railway con solo unos clics.

## ✨ Filosofía

El objetivo principal de **Son1k-GO!** es eliminar la fricción entre encontrar un proyecto interesante en GitHub y empezar a trabajar en él. Simplificamos los pasos iniciales (fork, clonación, configuración del entorno) y potenciamos el proceso de desarrollo con una IA que actúa como un compañero de programación, permitiéndote centrarte en la funcionalidad y no en la configuración.

---

## 🚀 Características Principales

### 1. Inicio de Proyectos Acelerado
- **Fork y Edita al Instante**: Pega la URL de cualquier repositorio público de GitHub para crear una copia ("fork") en tu cuenta y empezar a editar su código de inmediato.
- **Crea desde Cero**: Inicia un nuevo repositorio en tu cuenta de GitHub directamente desde la aplicación, con una estructura inicial lista para que la IA comience a trabajar.
- **Accede a tus Repositorios**: Navega y selecciona cualquiera de tus repositorios existentes para empezar a trabajar en ellos.

### 2. Asistente de Código Potenciado por IA
- **Editor con Pestañas**: Trabaja en múltiples archivos a la vez gracias a una interfaz de pestañas intuitiva, similar a la de un IDE de escritorio como VS Code.
- **Chat Unificado a Nivel de Repositorio**: Mantén una única conversación con la IA que persiste en todo el proyecto. El asistente recordará el contexto incluso cuando cambies de archivo, permitiendo realizar tareas complejas que involucren múltiples ficheros.
- **Generación y Sugerencia de Código**: Da instrucciones en lenguaje natural (ej. "refactoriza este componente para usar TypeScript" o "añade un botón para eliminar un elemento") y la IA generará el código por ti.
- **Revisión de Cambios (Diff Viewer)**: Antes de aplicar cualquier cambio, la IA te mostrará una vista "diferencial" (diff) clara, resaltando las líneas añadidas y eliminadas para que tengas control total sobre el código.
- **Commit con un Clic**: Acepta las sugerencias de la IA para confirmar los cambios directamente en tu repositorio con un mensaje de commit autogenerado.

### 3. Gestión de Archivos Integrada
- **Creación y Eliminación de Archivos**: Crea nuevos archivos o elimina los existentes directamente desde el explorador de archivos, sin necesidad de salir de la aplicación.

### 4. Pipeline de Despliegue Automatizado
- **Análisis Inteligente del Proyecto**: La aplicación inspecciona tu `package.json` para detectar automáticamente el tipo de proyecto (Next.js, Vite, Create React App, etc.) y optimizar la configuración.
- **Generación de Archivos de Configuración**: Crea automáticamente los archivos necesarios (`vercel.json`, `netlify.toml`, `railway.json`) con la configuración recomendada para la plataforma de despliegue que elijas.
- **Despliegue Guiado**: Una vez que confirmas el archivo de configuración en tu repositorio, la aplicación te proporciona un enlace directo para importar y desplegar tu proyecto en Vercel, Netlify o Railway.

### 5. Soporte Multi-Proveedor de IA
- **Flexible y Configurable**: Elige entre diferentes proveedores de IA como **Google Gemini** (configuración por defecto), **OpenAI** o **Anthropic**. También puedes configurar una URL base para usar modelos locales a través de servicios como **Ollama**.

---

## 💻 Flujo de Trabajo Típico

1.  **Conectar**: Inicia sesión de forma segura con un [Token de Acceso Personal de GitHub](https://github.com/settings/tokens/new?scopes=repo).
2.  **Elegir un Proyecto**:
    - **Opción A (Fork)**: Pega la URL de un repositorio público para empezar a trabajar en tu propia versión.
    - **Opción B (Crear)**: Crea un nuevo repositorio desde cero.
    - **Opción C (Existente)**: Elige un proyecto que ya tengas en tu cuenta.
3.  **Desarrollar con la IA**:
    - Abre los archivos que necesites en el editor de pestañas.
    - Pide a la IA que realice cambios, añada funcionalidades o corrija errores.
    - Revisa la sugerencia en la vista de diferencias (diff).
    - Acepta para hacer `commit` de los cambios directamente a tu repositorio.
4.  **Desplegar**:
    - Haz clic en "Desplegar Proyecto".
    - Revisa la configuración autodetectada y la plataforma sugerida.
    - Confirma para añadir el archivo de configuración a tu repo.
    - Usa el enlace final para lanzar tu proyecto al mundo.
