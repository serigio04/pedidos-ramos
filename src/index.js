import { initMateriales } from './materiales.js';
import { initPedidos, actualizarSelectMaterialesPedido } from './pedidos.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar módulos
    initMateriales();
    initPedidos();

    // 2. Lógica de Pestañas
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            
            // Si entramos a calculadora, actualizamos la lista
            if(btn.dataset.target === 'tab-calculadora') {
                actualizarSelectMaterialesPedido();
            }
        });
    });
});