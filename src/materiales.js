import { descargarCSV } from './utils.js';

export let materiales = JSON.parse(localStorage.getItem('ramos_materiales')) || [];

// Lista reducida solo a las categorías base
const CATEGORIAS_BASE = [
    "Limpiapipas (unidad)",
    "Papel Kraft (pliego)",
    "Papel Coreano (pliego)",
    "Cinta/Listón (metro)",
    "Silicona (barra)",
    "Palos de madera (unidad)",
    "Pistilos perlados (unidad)",
    "Flora tape (metros)",
    "Tul liso (metros)",
    "Otro"
];

export function cargarOpcionesMateriales() {
    const selectCategoria = document.getElementById('mat-categoria');
    CATEGORIAS_BASE.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        selectCategoria.appendChild(option);
    });
}

export function guardarMateriales() {
    localStorage.setItem('ramos_materiales', JSON.stringify(materiales));
    renderizarMateriales();
}

export function renderizarMateriales() {
    const tablaMateriales = document.querySelector('#tabla-materiales tbody');
    tablaMateriales.innerHTML = '';
    materiales.forEach((mat, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${mat.nombre}</strong></td>
            <td>
                <span>${mat.stock}</span>
                <button class="btn-edit-small btn-editar-stock" data-index="${index}" title="Editar stock">✏️</button>
            </td>
            <td>$${parseFloat(mat.precio).toFixed(2)}</td>
            <td><button class="btn-delete-small btn-eliminar-mat" data-index="${index}">🗑️</button></td>
        `;
        tablaMateriales.appendChild(tr);
    });
}

export function initMateriales() {
    cargarOpcionesMateriales();
    renderizarMateriales();

// Delegación de eventos para la tabla de materiales
    document.querySelector('#tabla-materiales tbody').addEventListener('click', (e) => {
        // --- ELIMINAR MATERIAL ---
        if (e.target.classList.contains('btn-eliminar-mat')) {
            const index = e.target.getAttribute('data-index');
            if(confirm('¿Eliminar este material?')) {
                materiales.splice(index, 1);
                guardarMateriales();
            }
        }

        // --- EDITAR STOCK MANUALMENTE ---
        if (e.target.classList.contains('btn-editar-stock')) {
            const index = e.target.getAttribute('data-index');
            const mat = materiales[index];
            
            const nuevoStockInput = prompt(`Nuevo stock para "${mat.nombre}":`, mat.stock);
            
            // Si el usuario presiona "Cancelar", no hace nada
            if (nuevoStockInput !== null) {
                const nuevoStock = parseInt(nuevoStockInput);
                
                if (!isNaN(nuevoStock) && nuevoStock >= 0) {
                    materiales[index].stock = nuevoStock;
                    guardarMateriales(); // Guarda en localStorage y re-renderiza la tabla
                } else {
                    alert("Por favor, ingresa una cantidad numérica válida.");
                }
            }
        }
    });

    document.getElementById('form-material').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 1. Obtener la categoria
        let categoria = document.getElementById('mat-categoria').value;
        if (categoria === "Otro") {
            categoria = prompt("Escribe el nombre del material base:") || "Material";
        }
        
        // 2. Obtener el detalle (opcional)
        const detalle = document.getElementById('mat-detalle').value.trim();
        
        // 3. Componer el nombre final. Ej: "Limpiapipas (paquete) - Morado 7mm"
        const nombreFinal = detalle ? `${categoria} - ${detalle}` : categoria;
        
        const stock = parseInt(document.getElementById('mat-stock').value);
        const precio = parseFloat(document.getElementById('mat-precio').value);

        const existeIdx = materiales.findIndex(m => m.nombre === nombreFinal);
        if (existeIdx >= 0) {
            materiales[existeIdx].stock += stock;
            materiales[existeIdx].precio = precio;
        } else {
            materiales.push({ id: Date.now(), nombre: nombreFinal, stock, precio });
        }
        
        guardarMateriales();
        e.target.reset(); // Limpia el formulario
    });

    document.getElementById('btn-export-materials').addEventListener('click', () => {
        if (materiales.length === 0) return alert("No hay materiales para exportar.");
        let csvContent = "Nombre,Stock,PrecioUnitario\n";
        materiales.forEach(m => csvContent += `${m.nombre},${m.stock},${m.precio}\n`);
        descargarCSV(csvContent, "inventario_materiales.csv");
    });

    document.getElementById('import-csv').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const rows = event.target.result.split('\n');
            let importados = 0;
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i].split(',');
                if (cols.length >= 3) {
                    const nombre = cols[0].trim();
                    const stock = parseInt(cols[1]);
                    const precio = parseFloat(cols[2]);
                    if (nombre && !isNaN(stock) && !isNaN(precio)) {
                        const existeIdx = materiales.findIndex(m => m.nombre === nombre);
                        if (existeIdx >= 0) {
                            materiales[existeIdx].stock = stock;
                            materiales[existeIdx].precio = precio;
                        } else {
                            materiales.push({ id: Date.now() + i, nombre, stock, precio });
                        }
                        importados++;
                    }
                }
            }
            guardarMateriales();
            alert(`Se importaron/actualizaron ${importados} materiales.`);
            e.target.value = '';
        };
        reader.readAsText(file);
    });
}