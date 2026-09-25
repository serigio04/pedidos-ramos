import { descargarCSV } from './utils.js';
import { materiales, guardarMateriales } from './materiales.js';

let pedidos = JSON.parse(localStorage.getItem('ramos_pedidos')) || [];
let pedidoActual = [];

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
        div.innerHTML = `
            <div class="pedido-header">
                <strong>${p.cliente}</strong>
                <span class="pedido-fecha">${p.fecha}</span>
            </div>
            <p style="font-size:0.9rem; margin-bottom:10px; color:var(--text-light)">${itemsHtml}</p>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="pedido-total">Inversión: Q${p.total.toFixed(2)}</span>
                <button class="btn-export-small btn-exportar-unico" data-id="${p.id}">Exportar CSV</button>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

export function initPedidos() {
    renderizarPedidos();

    // Delegación de eventos para la lista de uso temporal
    document.getElementById('lista-uso-actual').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-quitar-item')) {
            const index = e.target.getAttribute('data-index');
            pedidoActual.splice(index, 1);
            actualizarVistaPedidoActual();
        }
    });

    // Delegación de eventos para exportar un pedido único
    document.getElementById('lista-pedidos').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-exportar-unico')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            const p = pedidos.find(x => x.id === id);
            if(!p) return;
            
            let csv = `Pedido: ${p.cliente}, Total Invertido: Q${p.total.toFixed(2)}\n\n`;
            csv += "Material,Cantidad,PrecioUnitario,Subtotal\n";
            p.items.forEach(i => csv += `${i.nombre},${i.cantidad},${i.precioU},${i.subtotal.toFixed(2)}\n`);
            
            descargarCSV(csv, `pedido_${p.cliente.replace(/\s+/g, '_')}.csv`);
        }
    });

    document.getElementById('btn-nuevo-pedido').addEventListener('click', (e) => {
        document.getElementById('creador-pedido').classList.remove('hidden');
        e.target.classList.add('hidden');
        pedidoActual = [];
        document.getElementById('ped-cliente').value = '';
        actualizarVistaPedidoActual();
    });

    document.getElementById('btn-cancelar-pedido').addEventListener('click', () => {
        document.getElementById('creador-pedido').classList.add('hidden');
        document.getElementById('btn-nuevo-pedido').classList.remove('hidden');
    });

    document.getElementById('btn-add-uso').addEventListener('click', () => {
        const idMat = parseInt(document.getElementById('ped-select-material').value);
        const cant = parseInt(document.getElementById('ped-cantidad-uso').value);
        
        if(!idMat || isNaN(cant) || cant <= 0) return alert("Selecciona material y cantidad válida");

        const materialDb = materiales.find(m => m.id === idMat);
        if(cant > materialDb.stock) return alert(`Solo tienes ${materialDb.stock} en stock.`);

        pedidoActual.push({
            idMaterial: materialDb.id,
            nombre: materialDb.nombre,
            cantidad: cant,
            precioU: materialDb.precio,
            subtotal: cant * materialDb.precio
        });

        document.getElementById('ped-cantidad-uso').value = '';
        actualizarVistaPedidoActual();
    });

    document.getElementById('btn-guardar-pedido').addEventListener('click', () => {
        if(pedidoActual.length === 0) return alert("Agrega materiales al pedido.");
        
        const cliente = document.getElementById('ped-cliente').value || 'Cliente sin nombre';
        const total = pedidoActual.reduce((sum, item) => sum + item.subtotal, 0);

        pedidoActual.forEach(item => {
            const mat = materiales.find(m => m.id === item.idMaterial);
            if(mat) mat.stock -= item.cantidad;
        });

        pedidos.unshift({ id: Date.now(), cliente, fecha: new Date().toLocaleDateString(), items: [...pedidoActual], total });
        localStorage.setItem('ramos_pedidos', JSON.stringify(pedidos));
        
        guardarMateriales(); 
        
        document.getElementById('creador-pedido').classList.add('hidden');
        document.getElementById('btn-nuevo-pedido').classList.remove('hidden');
        renderizarPedidos();
    });

    document.getElementById('btn-export-pedidos').addEventListener('click', () => {
        if(pedidos.length === 0) return alert("No hay pedidos para exportar.");
        
        let csv = "Nombre del Pedido,Total del Pedido\n";
        pedidos.forEach(p => {
            csv += `${p.cliente},${p.total.toFixed(2)}\n`;
        });
        
        descargarCSV(csv, "resumen_pedidos.csv");
    });
}