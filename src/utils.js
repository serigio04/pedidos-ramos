export function descargarCSV(contenido, nombreArchivo) {
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + contenido);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}