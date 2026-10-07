import { descargarCSV } from './utils.js';
import { materiales, guardarMateriales } from './materiales.js';

let pedidos = JSON.parse(localStorage.getItem('ramos_pedidos')) || [];
let pedidoActual = [];
let indexPedidoEditando = null;
let itemsOriginalesEdicion = null; // Copia de respaldo por si el usuario cancela la edición

export function actualizarSelectMaterialesPedido() {
    const selectMatPedido = document.getElementById('ped-select-material');
    selectMatPedido.innerHTML = '<option value="">Elegir material...</option>';
    materiales.forEach(m => {
        if(m.stock > 0) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.nombre} (Dispo: ${m.stock} | $${m.precio})`;
            selectMatPedido.appendChild(opt);
        }
    });
}

function actualizarVistaPedidoActual() {
    const listaUso = document.getElementById('lista-uso-actual');
    const previewTotal = document.getElementById('preview-total');
    listaUso.innerHTML = '';
    let total = 0;

    pedidoActual.forEach((item, index) => {
        total += item.subtotal;
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.cantidad}x ${item.nombre}</span>
            <span>$${item.subtotal.toFixed(2)} <button class="btn-delete-small btn-quitar-item" data-index="${index}" style="padding:2px 6px">X</button></span>
        `;
        listaUso.appendChild(li);
    });
    previewTotal.textContent = total.toFixed(2);
}

export function renderizarPedidos() {
    const contenedor = document.getElementById('lista-pedidos');
    contenedor.innerHTML = '';
    pedidos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'pedido-card';
        let itemsHtml = p.items.map(i => `${i.cantidad}x ${i.nombre}`).join('<br>');
        div.innerHTML = `
            <div class="pedido-header">
                <strong>${p.cliente}</strong>
                <span class="pedido-fecha">${p.fecha}</span>
            </div>
            <p style="font-size:0.9rem; margin-bottom:10px; color:var(--text-light)">${itemsHtml}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 10px;">
                <span class="pedido-total">Inversión: $${p.total.toFixed(2)}</span>
                <div style="display:flex; gap: 5px;">
                    <button class="btn-edit-small btn-editar-pedido" data-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem;">✏️ Editar</button>
                    <button class="btn-export-small btn-exportar-unico" data-id="${p.id}">📤 Exportar</button>
                    <button class="btn-delete-small btn-eliminar-pedido" data-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem;">🗑️ Eliminar</button>
                </div>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

export function initPedidos() {
    renderizarPedidos();

    // Eliminar un item del listado en preparación
    document.getElementById('lista-uso-actual').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-quitar-item')) {
            const index = e.target.getAttribute('data-index');
            pedidoActual.splice(index, 1);
            actualizarVistaPedidoActual();
        }
    });

    // Delegación de eventos en la lista de pedidos (Editar, Exportar, Eliminar)
    document.getElementById('lista-pedidos').addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));

        // --- EDITAR PEDIDO ---
        if (e.target.classList.contains('btn-editar-pedido')) {
            const index = pedidos.findIndex(x => x.id === id);
            if (index === -1) return;

            const p = pedidos[index];
            indexPedidoEditando = index;
            itemsOriginalesEdicion = JSON.parse(JSON.stringify(p.items));

            // 1. Restaurar stock de los materiales de este pedido para tener disponibilidad real durante la edición
            p.items.forEach(item => {
                const mat = materiales.find(m => m.id === item.idMaterial);
                if (mat) mat.stock += item.cantidad;
            });
            guardarMateriales();

            // 2. Cargar datos del pedido al formulario de creación
            pedidoActual = JSON.parse(JSON.stringify(p.items));
            document.getElementById('ped-cliente').value = p.cliente;

            // 3. Ajustar UI para modo edición
            document.getElementById('creador-pedido').classList.remove('hidden');
            document.getElementById('btn-nuevo-pedido').classList.add('hidden');
            document.querySelector('#creador-pedido h3').textContent = 'Editar Pedido';
            document.getElementById('btn-guardar-pedido').textContent = '💾 Actualizar Pedido';

            actualizarVistaPedidoActual();
            actualizarSelectMaterialesPedido();
        }

        // --- EXPORTAR PEDIDO ÚNICO ---
        if (e.target.classList.contains('btn-exportar-unico')) {
            const p = pedidos.find(x => x.id === id);
            if(!p) return;
            let csv = `Pedido: ${p.cliente}, Total Invertido: $${p.total.toFixed(2)}\n\n`;
            csv += "Material,Cantidad,PrecioUnitario,Subtotal\n";
            p.items.forEach(i => csv += `${i.nombre},${i.cantidad},${i.precioU},${i.subtotal.toFixed(2)}\n`);
            descargarCSV(csv, `pedido_${p.cliente.replace(/\s+/g, '_')}.csv`);
        }

        // --- ELIMINAR PEDIDO ---
        if (e.target.classList.contains('btn-eliminar-pedido')) {
            const index = pedidos.findIndex(x => x.id === id);
            if (index === -1) return;

            if (confirm('¿Eliminar este pedido? Se restaurará el stock de los materiales utilizados.')) {
                const pedidoAEliminar = pedidos[index];
                pedidoAEliminar.items.forEach(item => {
                    const mat = materiales.find(m => m.id === item.idMaterial);
                    if (mat) mat.stock += item.cantidad;
                });

                pedidos.splice(index, 1);
                localStorage.setItem('ramos_pedidos', JSON.stringify(pedidos));
                guardarMateriales();
                renderizarPedidos();
            }
        }
    });

    // Abrir creador para NUEVO pedido
    document.getElementById('btn-nuevo-pedido').addEventListener('click', (e) => {
        indexPedidoEditando = null;
        itemsOriginalesEdicion = null;
        document.getElementById('creador-pedido').classList.remove('hidden');
        e.target.classList.add('hidden');
        document.querySelector('#creador-pedido h3').textContent = 'Armar Ramo';
        document.getElementById('btn-guardar-pedido').textContent = '💾 Guardar Pedido';
        pedidoActual = [];
        document.getElementById('ped-cliente').value = '';
        actualizarVistaPedidoActual();
        actualizarSelectMaterialesPedido();
    });

    // Cancelar creación / edición
    document.getElementById('btn-cancelar-pedido').addEventListener('click', () => {
        // Si estábamos editando, volvemos a descontar el stock original devuelto temporalmente
        if (indexPedidoEditando !== null && itemsOriginalesEdicion) {
            itemsOriginalesEdicion.forEach(item => {
                const mat = materiales.find(m => m.id === item.idMaterial);
                if (mat) mat.stock -= item.cantidad;
            });
            guardarMateriales();
            indexPedidoEditando = null;
            itemsOriginalesEdicion = null;
        }

        document.getElementById('creador-pedido').classList.add('hidden');
        document.getElementById('btn-nuevo-pedido').classList.remove('hidden');
        document.querySelector('#creador-pedido h3').textContent = 'Armar Ramo';
        document.getElementById('btn-guardar-pedido').textContent = '💾 Guardar Pedido';
    });

    // Añadir material al pedido
    document.getElementById('btn-add-uso').addEventListener('click', () => {
        const idMat = parseInt(document.getElementById('ped-select-material').value);
        const cant = parseInt(document.getElementById('ped-cantidad-uso').value);
        
        if(!idMat || isNaN(cant) || cant <= 0) return alert("Selecciona material y cantidad válida");

        const materialDb = materiales.find(m => m.id === idMat);
        if(cant > materialDb.stock) return alert(`Solo tienes ${materialDb.stock} en stock.`);

        // Comprobar si el material ya estaba en el pedido actual para sumar cantidad
        const itemExistente = pedidoActual.find(i => i.idMaterial === idMat);
        if (itemExistente) {
            if (itemExistente.cantidad + cant > materialDb.stock) {
                return alert(`Excedes el stock disponible (${materialDb.stock}).`);
            }
            itemExistente.cantidad += cant;
            itemExistente.subtotal = itemExistente.cantidad * itemExistente.precioU;
        } else {
            pedidoActual.push({
                idMaterial: materialDb.id,
                nombre: materialDb.nombre,
                cantidad: cant,
                precioU: materialDb.precio,
                subtotal: cant * materialDb.precio
            });
        }

        document.getElementById('ped-cantidad-uso').value = '';
        actualizarVistaPedidoActual();
    });

    // Guardar o Actualizar Pedido
    document.getElementById('btn-guardar-pedido').addEventListener('click', () => {
        if(pedidoActual.length === 0) return alert("Agrega materiales al pedido.");
        
        const cliente = document.getElementById('ped-cliente').value || 'Cliente sin nombre';
        const total = pedidoActual.reduce((sum, item) => sum + item.subtotal, 0);

        // Descontar stock del pedido final
        pedidoActual.forEach(item => {
            const mat = materiales.find(m => m.id === item.idMaterial);
            if(mat) mat.stock -= item.cantidad;
        });

        if (indexPedidoEditando !== null) {
            // Actualizar pedido existente
            pedidos[indexPedidoEditando].cliente = cliente;
            pedidos[indexPedidoEditando].items = [...pedidoActual];
            pedidos[indexPedidoEditando].total = total;
            indexPedidoEditando = null;
            itemsOriginalesEdicion = null;
        } else {
            // Nuevo pedido
            pedidos.unshift({ 
                id: Date.now(), 
                cliente, 
                fecha: new Date().toLocaleDateString(), 
                items: [...pedidoActual], 
                total 
            });
        }

        localStorage.setItem('ramos_pedidos', JSON.stringify(pedidos));
        guardarMateriales(); 
        
        document.getElementById('creador-pedido').classList.add('hidden');
        document.getElementById('btn-nuevo-pedido').classList.remove('hidden');
        document.querySelector('#creador-pedido h3').textContent = 'Armar Ramo';
        document.getElementById('btn-guardar-pedido').textContent = '💾 Guardar Pedido';
        renderizarPedidos();
    });

    // Exportar todos los pedidos
    document.getElementById('btn-export-pedidos').addEventListener('click', () => {
        if(pedidos.length === 0) return alert("No hay pedidos para exportar.");
        let csv = "Nombre del Pedido,Total del Pedido\n";
        pedidos.forEach(p => csv += `${p.cliente},${p.total.toFixed(2)}\n`);
        descargarCSV(csv, "resumen_pedidos.csv");
    });
}