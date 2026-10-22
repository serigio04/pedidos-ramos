import { descargarCSV } from './utils.js';
import { materiales, guardarMateriales } from './materiales.js';

let pedidos = JSON.parse(localStorage.getItem('ramos_pedidos')) || [];
let pedidoActual = [];
let indexPedidoEditando = null;
let itemsOriginalesEdicion = null;

export function actualizarSelectMaterialesPedido() {
    const selectMatPedido = document.getElementById('ped-select-material');
    selectMatPedido.innerHTML = '<option value="">Elegir material...</option>';
    materiales.forEach(m => {
        if(m.stock > 0) {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.nombre} (Dispo: ${m.stock} | Q${m.precio})`;
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
            <span>Q${item.subtotal.toFixed(2)} <button class="btn-delete-small btn-quitar-item" data-index="${index}" style="padding:2px 6px">X</button></span>
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
        
        const precioVenta = p.precioVenta || 0;
        const ganancia = p.ganancia !== undefined ? p.ganancia : (precioVenta - p.total);
        const colorGanancia = ganancia >= 0 ? '#2e7d32' : '#c62828';

        div.innerHTML = `
            <div class="pedido-header">
                <strong>${p.cliente}</strong>
                <span class="pedido-fecha">${p.fecha}</span>
            </div>
            <p style="font-size:0.9rem; margin-bottom:10px; color:var(--text-light)">${itemsHtml}</p>
            
            <div style="font-size:0.85rem; background:rgba(0,0,0,0.03); padding:8px; border-radius:6px; margin-bottom:10px;">
                <div><strong>Inversión:</strong> Q${p.total.toFixed(2)}</div>
                <div><strong>Precio Venta:</strong> Q${precioVenta.toFixed(2)}</div>
                <div><strong>Ganancia:</strong> <span style="color:${colorGanancia}; font-weight:bold;">Q${ganancia.toFixed(2)}</span></div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap: 5px; margin-top: 10px;">
                <button class="btn-edit-small btn-editar-pedido" data-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem;">✏️ Editar</button>
                <button class="btn-export-small btn-exportar-unico" data-id="${p.id}">📤 Exportar</button>
                <button class="btn-delete-small btn-eliminar-pedido" data-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem;">🗑️ Eliminar</button>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

export function initPedidos() {
    renderizarPedidos();

    // Eliminar item del pedido en preparación
    document.getElementById('lista-uso-actual').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-quitar-item')) {
            const index = e.target.getAttribute('data-index');
            pedidoActual.splice(index, 1);
            actualizarVistaPedidoActual();
        }
    });

    // Delegación de eventos en la lista de pedidos
    document.getElementById('lista-pedidos').addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));

        // --- EDITAR PEDIDO ---
        if (e.target.classList.contains('btn-editar-pedido')) {
            const index = pedidos.findIndex(x => x.id === id);
            if (index === -1) return;

            const p = pedidos[index];
            indexPedidoEditando = index;
            itemsOriginalesEdicion = JSON.parse(JSON.stringify(p.items));

            // Restaurar stock temporalmente para la edición
            p.items.forEach(item => {
                const mat = materiales.find(m => m.id === item.idMaterial);
                if (mat) mat.stock += item.cantidad;
            });
            guardarMateriales();

            // Cargar datos en el formulario
            pedidoActual = JSON.parse(JSON.stringify(p.items));
            document.getElementById('ped-cliente').value = p.cliente;
            document.getElementById('ped-precio-venta').value = p.precioVenta || '';

            // Ajustar UI a modo edición
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
            const precioVenta = p.precioVenta || 0;
            const ganancia = p.ganancia !== undefined ? p.ganancia : (precioVenta - p.total);

            let csv = `Pedido: ${p.cliente}\n`;
            csv += `Inversion Total: Q${p.total.toFixed(2)}\n`;
            csv += `Precio Venta: Q${precioVenta.toFixed(2)}\n`;
            csv += `Ganancia: Q${ganancia.toFixed(2)}\n\n`;
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
        document.getElementById('ped-precio-venta').value = '';
        actualizarVistaPedidoActual();
        actualizarSelectMaterialesPedido();
    });

    // Cancelar creación / edición
    document.getElementById('btn-cancelar-pedido').addEventListener('click', () => {
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

    // Añadir material
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

    // Guardar / Actualizar Pedido
    document.getElementById('btn-guardar-pedido').addEventListener('click', () => {
        if(pedidoActual.length === 0) return alert("Agrega materiales al pedido.");
        
        const cliente = document.getElementById('ped-cliente').value || 'Cliente sin nombre';
        const precioVentaInput = parseFloat(document.getElementById('ped-precio-venta').value);
        const precioVenta = isNaN(precioVentaInput) ? 0 : precioVentaInput;
        const totalInversion = pedidoActual.reduce((sum, item) => sum + item.subtotal, 0);
        const ganancia = precioVenta - totalInversion;

        // Descontar stock
        pedidoActual.forEach(item => {
            const mat = materiales.find(m => m.id === item.idMaterial);
            if(mat) mat.stock -= item.cantidad;
        });

        if (indexPedidoEditando !== null) {
            pedidos[indexPedidoEditando].cliente = cliente;
            pedidos[indexPedidoEditando].items = [...pedidoActual];
            pedidos[indexPedidoEditando].total = totalInversion;
            pedidos[indexPedidoEditando].precioVenta = precioVenta;
            pedidos[indexPedidoEditando].ganancia = ganancia;
            indexPedidoEditando = null;
            itemsOriginalesEdicion = null;
        } else {
            pedidos.unshift({ 
                id: Date.now(), 
                cliente, 
                fecha: new Date().toLocaleDateString(), 
                items: [...pedidoActual], 
                total: totalInversion,
                precioVenta,
                ganancia
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

    // Exportar todos los pedidos (Resumen general)
    document.getElementById('btn-export-pedidos').addEventListener('click', () => {
        if(pedidos.length === 0) return alert("No hay pedidos para exportar.");
        let csv = "Nombre del Pedido,Fecha,Inversion Total,Precio Venta,Ganancia\n";
        pedidos.forEach(p => {
            const precioVenta = p.precioVenta || 0;
            const ganancia = p.ganancia !== undefined ? p.ganancia : (precioVenta - p.total);
            csv += `${p.cliente},${p.fecha},${p.total.toFixed(2)},${precioVenta.toFixed(2)},${ganancia.toFixed(2)}\n`;
        });
        descargarCSV(csv, "resumen_pedidos.csv");
    });
}