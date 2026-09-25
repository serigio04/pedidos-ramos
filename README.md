# 💐 Calculadora de Ramos y Gestión de Materiales

Una aplicación web diseñada específicamente para artesanos y creadores de ramos (limpiapipas, flores eternas, etc.). Permite llevar un control del inventario de materiales y calcular automáticamente la inversión total de cada pedido creado.

🚀 **[Ver Aplicación en Vivo](https://serigio04.github.io/pedidos-ramos/)**

---

## 📌 Características Principales

* 📱 **Diseño Mobile-First:** Interfaz optimizada para usarse cómodamente desde un teléfono celular.
* 📦 **Gestión de Inventario:** Agrega materiales base (limpiapipas, papel kraft, silicona, etc.) y especifica sus detalles (color, grosor). Controla el stock disponible y el precio unitario.
* 🧮 **Calculadora de Pedidos:** Arma un pedido seleccionando los materiales registrados. El sistema calcula automáticamente el total invertido y descuenta el uso del stock general.
* 💾 **Almacenamiento Local (Offline):** Funciona sin necesidad de internet ni bases de datos externas. Todos los datos se guardan de forma segura en el `localStorage` de tu navegador.
* 📊 **Importación y Exportación a Excel (CSV):**
  * Exporta tu inventario para tener respaldos.
  * Importa inventarios desde CSV para actualizar precios y stock rápidamente.
  * Exporta un resumen mensual de todos tus pedidos (Nombre y Total).
  * Exporta el desglose detallado de un pedido individual.

---

## 🛠️ Cómo funciona

La aplicación se divide en dos pestañas principales:

### 1. Pestaña de Materiales
Aquí configuras tu materia prima.
1. Selecciona una categoría base (Ej. *Limpiapipas*).
2. Agrega un detalle opcional (Ej. *Verde musgo*).
3. Ingresa tu stock actual y cuánto te costó cada unidad.
4. *Tip:* Utiliza los botones de Importar/Exportar para respaldar esta información o pasarla de tu celular a tu computadora.

### 2. Pestaña de Calculadora
Aquí creas los ramos para tus clientes.
1. Haz clic en "Crear Nuevo Pedido".
2. Escribe el nombre del cliente o referencia del ramo.
3. Selecciona los materiales que vas a utilizar y la cantidad. La app te avisará si no tienes stock suficiente.
4. Al guardar, el costo total se registrará en el historial y los materiales se descontarán de tu pestaña de inventario.

---

## 💻 Tecnologías Utilizadas

Este es un proyecto Frontend puro y ligero, construido con:
* **HTML5** (Estructura semántica)
* **CSS3** (Variables de color, Flexbox, CSS Grid y Media Queries)
* **JavaScript Moderno (ES6 Modules)** (Lógica separada en módulos `app.js`, `materiales.js`, `pedidos.js` y `utils.js` para fácil mantenimiento).
* **GitHub Pages** (Hosting gratuito).

---

## ⚙️ Uso en entorno de desarrollo (Local)

Si deseas descargar el código y modificarlo en tu computadora:

1. Clona el repositorio:
   ```bash
   git clone [https://github.com/serigio04/pedidos-ramos.git](https://github.com/serigio04/pedidos-ramos.git)