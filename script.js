mapboxgl.accessToken = 'pk.eyJ1IjoicGFjby1zb2xzb25hIiwiYSI6ImNseXJlcjN6bDA2M2kyaXB5d2NtYWJ3N2UifQ.s0HyJk7NLcV5ToGO-rLOew';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/paco-solsona/cm4uaefep009a01s299um2mku',
    projection: 'globe',
    zoom: 13,
    center: [-100.39279, 20.59246]
});

map.on('style.load', () => {
    map.setFog({});
});

// Función para volver a cargar la capa personalizada
function addCustomLayers() {
    if (!map.getSource('autoservicios')) {
        map.addSource('autoservicios', {
            type: 'vector',
            url: 'mapbox://paco-solsona.4ro1b1dz' // URL del vector layer
        });
    }
    if (!map.getLayer('point-layer')) {
        map.addLayer({
            'id': 'point-layer',
            'type': 'circle',
            'source': 'autoservicios',
            'source-layer': 'C22_ZMP_AUTOSERVICIO_2024-3ol7aq',
            'minzoom': 0,
            'maxzoom': 22,
            'paint': {
                'circle-radius': [
                    'step', ['get', 'ID_PLADESU'],
                    2, 0,
                    3, 1,
                    4, 2,
                    5, 3,
                    6, 4,
                    7
                ],
                'circle-color': [
                    'match', ['get', 'ID_PLADESU'],
                    0, 'rgb(103, 78, 167)',
                    1, 'rgb(60, 120, 216)',
                    2, 'rgb(56, 118, 29)',
                    3, 'rgb(241, 194, 50)',
                    4, 'rgb(230, 145, 56)',
                    5, 'rgb(204, 0, 0)',
                    'rgb(128, 128, 128)'
                ],
                'circle-opacity': 1
            },
            'layout': {
                'circle-sort-key': ['get', 'ID_PLADESU']
            }
        });
    }
}

// Escuchar cuando el estilo del mapa cambia y volver a añadir las capas
map.on('styledata', () => {
    addCustomLayers();
});

// Llamar a la función al cargar inicialmente el mapa
map.on('load', () => {
    addCustomLayers();
    // Cambiar el cursor al interactuar con la capa
    map.on('mouseenter', 'point-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'point-layer', () => {
        map.getCanvas().style.cursor = '';
    });
});

////////////////////////////////////////////
// FUNCION PARA ENCENDER/APAGAR LAS CAPAS //
////////////////////////////////////////////
// Identificar el botón y añadir el evento de clic
document.getElementById('layer-control').addEventListener('click', function () {
    // Verificar la visibilidad actual de la capa
    const visibility = map.getLayoutProperty('point-layer', 'visibility');

    if (visibility === 'none') {
        // Hacer visible la capa si está oculta
        map.setLayoutProperty('point-layer', 'visibility', 'visible');
    } else {
        // Ocultar la capa si está visible
        map.setLayoutProperty('point-layer', 'visibility', 'none');
    }
});
////////////////////////////////////////////
////// FUNCION PARA CAMBIAR MAPA BASE //////
////////////////////////////////////////////
const mapStyles = [
    'mapbox://styles/paco-solsona/cm4uaefep009a01s299um2mku', // Estilo inicial
    'mapbox://styles/mapbox/dark-v11', // Estilo oscuro
    'mapbox://styles/mapbox/satellite-v9' // Estilo satélite
];

let currentStyleIndex = 0; // Índice para el estilo actual

document.getElementById('base-map-toggle').addEventListener('click', () => {
    currentStyleIndex = (currentStyleIndex + 1) % mapStyles.length; // Alterna entre estilos
    map.setStyle(mapStyles[currentStyleIndex]); // Cambia el estilo del mapa
});
//////////////////////////////////////
// CONTROLAMOS EL TAMAÑO DEL RADIO ///
//////////////////////////////////////
// Declarar el radio fijo en metros
const fixedDistance = 500; // Radio fijo de 500 metros

map.on('click', (e) => {
    const { lng, lat } = e.lngLat;

    // Borrar el polígono anterior, si existe
    if (lastPolygon) {
        if (map.getSource('search-area')) {
            map.removeLayer('search-area');
            map.removeSource('search-area');
        }
        lastPolygon = null;
    }
    const points = map.querySourceFeatures('autoservicios', {
        sourceLayer: 'C22_ZMP_AUTOSERVICIO_2024-3ol7aq', // Nombre de la capa de puntos
    });
    console.log('Puntos obtenidos:', points); // Verifica si están siendo devueltos
    // Crear un círculo con un radio fijo
    const point = turf.point([lng, lat]);
    const circle = turf.buffer(point, fixedDistance / 1000, { units: 'kilometers' });
    // Guardar la nueva geometría
    lastPolygon = circle;
    map.addSource(`search-area`, {
        type: "geojson",
        data: circle,
    });
    map.addLayer({
        id: `search-area`,
        type: "fill",
        source: `search-area`,
        paint: {
            "fill-color": "rgba(0, 100, 255, 0.4)",
            "fill-outline-color": "rgba(0, 100, 255, 1)",
        },
    });
});
let lastPolygon = null; // Almacena el último polígono generado

//////////////////////////////////////////////
// FUNCION PARA CONTROLAR HOVER DE PESTAÑAS //
//////////////////////////////////////////////

// MANEJAMOS EL TOOLTIP AL HACER HOVER SOBRE EL MENU DE LAS PESTANAS
function showTooltip(text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerText = text; // Asigna el texto del tooltip
    tooltip.style.display = 'block'; // Muestra el tooltip
    // Coloca el tooltip en la posición del mouse
    document.onmousemove = function(e) {
        tooltip.style.left = e.pageX + 10 + 'px'; // Ajusta la posición
        tooltip.style.top = e.pageY + 10 + 'px'; // Ajusta la posición
    };
}
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none'; // Oculta el tooltip
    document.onmousemove = null; // Limpia el evento de movimiento del mouse
}
//////////////////////////////////////
// FUNCION PARA LOS TABS //
//////////////////////////////////////

// Variable para rastrear el botón y la pestaña activa
let activeButton = null;
let activeTab = null; 

function showTab(tabId) {
    // Ocultar todas las pestañas
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    // Mostrar la pestaña seleccionada
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        // Verifica si la pestaña seleccionada ya estaba activa
        if (activeTab === tabId) {
            // Si está activa, oculta la pestaña y reinicia activeTab
            selectedTab.style.display = 'none';
            activeTab = null;
        } else {
            // Si no está activa, muestra la pestaña y actualiza activeTab
            infoContainer.style.display = 'block'; // Asegurar que el contenedor principal esté visible
            selectedTab.style.display = 'block';
            activeTab = tabId;
        }
    }
}

var buttons = document.querySelectorAll('.tab-button');
buttons.forEach(function(button) {
    button.addEventListener('click', function() {
        // Eliminar la clase 'active' de todos los botones
        buttons.forEach(btn => btn.classList.remove('active'));
        // Agregar la clase 'active' al botón clicado
        this.classList.add('active');
    });
});

document.getElementById('menu-toggle').addEventListener('click', function() {
    const sideTabs = document.getElementById('side-tabs');
    const buttons = document.querySelectorAll('.side-tabs .tab-button:not(#menu-toggle)');
    if (sideTabs.classList.contains('expanded')) {
        sideTabs.classList.remove('expanded');
        buttons.forEach(button => {
            button.style.display = 'none';
        });
    } else {
        sideTabs.classList.add('expanded');
        buttons.forEach(button => {
            button.style.display = 'block';
        });
    }
});

//////////////////////////////////////
// FUNCION PARA LOS SUBMENUS //
//////////////////////////////////////
var menuToggle = document.getElementById('menu-toggle');
var infoContainer = document.querySelector('.info-container');

// Inicializa el estado de visibilidad
infoContainer.style.display = 'none'; // Asegúrate de que comience oculto
// Función para desplegar/ocultar los botones y el info-container
menuToggle.addEventListener('click', function () {
    var buttons = document.querySelectorAll('.side-tabs .tab-button:not(#menu-toggle)');
    buttons.forEach(function (button) {
        button.style.display = button.style.display === 'none' || button.style.display === '' ? 'block' : 'none'; // Alternar visibilidad
    });
    // Ocultar el info-container al hacer clic en el menu-toggle
    if (infoContainer.style.display === 'block') {
        infoContainer.style.display = 'none'; // Ocultar el info-container
    }
});

// Función para manejar el clic en los `submenu-item` específicos
var submenuItems = document.querySelectorAll('.submenu-item');
submenuItems.forEach(function (item) {
    item.addEventListener('click', function () {
        // Obtener el texto del botón clicado
        var selectedTitle = this.textContent;
        // Mostrar el info-container
        infoContainer.style.display = 'block';
        // Asignar el texto al infoContainer
        infoContainer.innerHTML = `<h3>${selectedTitle}</h3>`;
    });
});

// AQUI CONTROLAMOS LA RESPUESTA AL CLICK DE CADA UNO DE LOS TABS
document.querySelector('#tab-description').addEventListener('click', () => {
    toggleSubmenu('#tab-description');
});
document.querySelector('#tab-how-to').addEventListener('click', () => {
    toggleSubmenu('#tab-how-to');
});
document.querySelector('#tab-point-info').addEventListener('click', () => {
    toggleSubmenu('#tab-point-info');
});
document.querySelector('#tab-share').addEventListener('click', () => {
    toggleSubmenu('#tab-share');
});
document.querySelector('#tab-download').addEventListener('click', () => {
    toggleSubmenu('#tab-download');
});
// FUNCION PARA MOSTRAR/OCULTAR SUBMENUS
function toggleSubmenu(tabId) {
    const tabContainer = document.querySelector(`${tabId}`).closest('.tab-button-container');
    const submenu = tabContainer.querySelector('.submenu');
    // Alternar visibilidad del submenu
    submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
    // Ocultar otros submenus
    document.querySelectorAll('.submenu').forEach((menu) => {
        if (menu !== submenu) {
            menu.style.display = 'none';
        }
    });
}
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// FUNCIONES PARA TODOS LOS BOTONES DEL SUBMENÚ ////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////
//// SUBMENÚ INFORMACIÓN-RESUMEN /////
//////////////////////////////////////

// Seleccionar el botón del submenú "Resumen"
const resumenButton = document.querySelector('#point-info-option-a');
// Función para manejar el clic en el submenú "Resumen"
resumenButton.addEventListener('click', () => {
    // Seleccionar el contenedor donde se mostrará el contenido
    const infoContainer = document.querySelector('#info-container');
    // Limpiar el contenido actual del contenedor
    infoContainer.innerHTML = '';
    // Crear el título "Resumen"
    const title = document.createElement('h2');
    
    title.innerHTML = '<i class="icon-list-alt" id="submenu-icon"></i> Resumen';
    // Crear un párrafo con instrucciones
    const instructions = document.createElement('p');
    instructions.textContent = 'Instrucciones: Para utilizar la función haz click en un sitio de interés, posteriormente haz click al botón "Resumen" para consultar información relevante';
    // Añadir el título y el párrafo al contenedor
    infoContainer.appendChild(title);
    infoContainer.appendChild(instructions);
    // Llamar a la función para contar los puntos dentro del radio
    const counts = countPointsWithinPolygon();
    // Mostrar el resumen en el info-container
    const summary = document.createElement('p');
    summary.innerHTML = `Total de establecimientos dentro del radio: ${counts.total}`;
    infoContainer.appendChild(summary);

    // Definir los colores para cada categoría de 'ID_PLADESU'
    const categoryColors = {
        0: 'rgb(103, 78, 167)',
        1: 'rgb(60, 120, 216)',
        2: 'rgb(56, 118, 29)',
        3: 'rgb(241, 194, 50)',
        4: 'rgb(230, 145, 56)',
        5: 'rgb(204, 0, 0)'
    };
    
    // Mostrar detalles por categoría
    Object.entries(counts.categories).forEach(([id, count]) => {
        const categoryDetail = document.createElement('p');
        const color = categoryColors[id] || 'rgb(128, 128, 128)'; // Color por defecto si el ID no está en categoryColors
        categoryDetail.innerHTML = `<strong>Categoría ${id}: ${count} establecimientos</strong>`;
        categoryDetail.style.color = color; // Asignar el color al texto
        infoContainer.appendChild(categoryDetail);
    });

    // Crear contenedor para los gráficos
    const chartContainerWrapper = document.createElement('div');
    chartContainerWrapper.classList.add('chart-container-wrapper'); // Clase para aplicar el estilo CSS

    // AQUI VAMOS A CREAR EL PRIMER GRÁFICO
    const chart1Wrapper = document.createElement('div'); // Contenedor para el gráfico
    const chartTitle1 = document.createElement('h3');
    chartTitle1.textContent = 'Distribución de Categorías (Gráfico de Pastel)';
    chart1Wrapper.appendChild(chartTitle1); // Agregar título
    const chartContainer1 = document.createElement('canvas');
    chartContainer1.id = 'pieChart';
    chart1Wrapper.appendChild(chartContainer1);

    // Botón para descargar el gráfico como JPG
    const downloadButton1 = document.createElement('button');
    downloadButton1.textContent = 'Descargar JPG';
    downloadButton1.addEventListener('click', () => {
        const imageUrl = chartContainer1.toDataURL('image/jpeg');
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = 'grafico_pastel.jpg';
        a.click();
    });
    chart1Wrapper.appendChild(downloadButton1);
    chartContainerWrapper.appendChild(chart1Wrapper); // Agregar gráfico a la estructura general

    new Chart(chartContainer1, {
        type: 'pie',
        data: {
            labels: Object.keys(counts.categories),
            datasets: [{
                data: Object.values(counts.categories),
                backgroundColor: Object.keys(counts.categories).map(id => categoryColors[id] || 'rgb(128, 128, 128)'),
                borderWidth: 1,
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                datalabels: {
                    formatter: (value, ctx) => {
                        return value; // Muestra el valor numérico de cada sección
                    },
                    color: 'white', // Color de las etiquetas
                    font: {
                        weight: 'bold', // Peso de la fuente
                    },
                },
            },
        },
        plugins: [ChartDataLabels], // Asegúrate de incluir el plugin
    });

    // AQUI VAMOS A CREAR EL SEGUNDO GRÁFICO
    const chart2Wrapper = document.createElement('div'); // Contenedor para el gráfico
    const chartTitle2 = document.createElement('h3');
    chartTitle2.textContent = 'Distribución de Categorías (Gráfico de Barras)';
    chart2Wrapper.appendChild(chartTitle2); // Agregar título
    const chartContainer2 = document.createElement('canvas');
    chartContainer2.id = 'barChart';
    chart2Wrapper.appendChild(chartContainer2);
    chartContainerWrapper.appendChild(chart2Wrapper); // Agregar gráfico a la estructura general

    new Chart(chartContainer2, {
        type: 'bar',
        data: {
            labels: Object.keys(counts.categories),
            datasets: [{
                label: 'Cantidad por Categoría',
                data: Object.values(counts.categories),
                backgroundColor: Object.keys(counts.categories).map(id => categoryColors[id] || 'rgb(128, 128, 128)'),
                borderWidth: 1,
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });

    // AQUI VAMOS A CREAR EL TERCER GRÁFICO
    const chart3Wrapper = document.createElement('div'); // Contenedor para el gráfico
    const chartTitle3 = document.createElement('h3');
    chartTitle3.textContent = 'Tendencia de Categorías (Gráfico de Líneas)';
    chart3Wrapper.appendChild(chartTitle3); // Agregar título
    const chartContainer3 = document.createElement('canvas');
    chartContainer3.id = 'lineChart';
    chart3Wrapper.appendChild(chartContainer3);
    chartContainerWrapper.appendChild(chart3Wrapper); // Agregar gráfico a la estructura general

    new Chart(chartContainer3, {
        type: 'line',
        data: {
            labels: Object.keys(counts.categories),
            datasets: [{
                label: 'Cantidad por Categoría',
                data: Object.values(counts.categories),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });

    // AQUI VAMOS A CREAR EL CUARTO GRÁFICO
    const chart4Wrapper = document.createElement('div'); // Contenedor para el gráfico
    const chartTitle4 = document.createElement('h3');
    chartTitle4.textContent = 'Distribución de Categorías (Gráfico de Radar)';
    chart4Wrapper.appendChild(chartTitle4); // Agregar título
    const chartContainer4 = document.createElement('canvas');
    chartContainer4.id = 'radarChart';
    chart4Wrapper.appendChild(chartContainer4);
    chartContainerWrapper.appendChild(chart4Wrapper); // Agregar gráfico a la estructura general

    new Chart(chartContainer4, {
        type: 'radar',
        data: {
            labels: Object.keys(counts.categories),
            datasets: [{
                label: 'Cantidad por Categoría',
                data: Object.values(counts.categories),
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
            }],
        },
        options: {
            responsive: false,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            },
        },
    });

    // Agregar los gráficos a la página
    infoContainer.appendChild(chartContainerWrapper);
});

// Función para contar los puntos dentro del radio y clasificar por 'ID_PLADESU'
function countPointsWithinPolygon() {
    if (!lastPolygon) return { total: 0, categories: {} };
    // Obtener los puntos de la capa de autoservicios
    const points = map.querySourceFeatures('autoservicios', {
        sourceLayer: 'C22_ZMP_AUTOSERVICIO_2024-3ol7aq', // Nombre de la capa de puntos
    });
    const counts = {
        total: 0, // Total de puntos dentro del radio
        categories: {} // Contador de puntos por categoría de 'ID_PLADESU'
    };
    // Filtrar los puntos dentro del círculo usando turf
    points.forEach((point) => {
        const coordinates = point.geometry.coordinates;
        if (coordinates && coordinates.length === 2) {
            const pointGeo = turf.point(coordinates);
            if (turf.booleanPointInPolygon(pointGeo, lastPolygon)) {
                const id = point.properties.ID_PLADESU;
                counts.total += 1;
                if (!counts.categories[id]) {
                    counts.categories[id] = 0;
                }
                counts.categories[id] += 1;
            }
        }
    });
    return counts;
}



// Seleccionar el botón del submenú "Tabla"
const tablaButton = document.querySelector('#point-info-option-b');

// Función para manejar el clic en el submenú "Tabla"
tablaButton.addEventListener('click', () => {
    // Seleccionar el contenedor donde se mostrará la tabla
    const infoContainer = document.querySelector('#info-container');
    // Limpiar el contenido actual del contenedor
    infoContainer.innerHTML = '';
    // Crear el título "Tabla"
    const title = document.createElement('h2');
    title.innerHTML = '<i class="icon-table" id="submenu-icon"></i> Tabla';
    
    // Añadir el título al contenedor
    infoContainer.appendChild(title);
    // Llamar a la función para obtener los puntos dentro del radio y clasificarlos
    const pointsTable = createPointsTable();
    // Añadir la tabla al contenedor
    infoContainer.appendChild(pointsTable);
});

// Función para crear una tabla con puntos dentro del radio
function createPointsTable() {
    if (!lastPolygon) {
        return document.createTextNode('No hay puntos dentro del radio.');
    }
    // Obtener los puntos de la capa de autoservicios
    const points = map.querySourceFeatures('autoservicios', {
        sourceLayer: 'C22_ZMP_AUTOSERVICIO_2024-3ol7aq', // Nombre de la capa de puntos
    });
    // Filtrar los puntos dentro del círculo usando turf
    const filteredPoints = points.filter((point) => {
        const coordinates = point.geometry.coordinates;
        if (coordinates && coordinates.length === 2) {
            const pointGeo = turf.point(coordinates);
            return turf.booleanPointInPolygon(pointGeo, lastPolygon);
        }
        return false;
    });

    // Crear la tabla
    const table = document.createElement('table');
    table.className = 'points-table';

    // Crear la cabecera de la tabla (con los nombres de los atributos)
    const headerRow = document.createElement('tr');
    const headers = Object.keys(filteredPoints[0].properties); // Obtener todos los atributos de la primera propiedad

    // Crear encabezados con botones de orden
    headers.forEach(header => {
        const th = document.createElement('th');
        th.innerHTML = `${header} <button class="sort-btn" data-column="${header}">&#x2195;</button>`;
        headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    // Agregar los puntos a la tabla
    filteredPoints.forEach((point) => {
        const row = document.createElement('tr');
        // Crear una celda para cada atributo del punto
        row.innerHTML = headers.map(header => {
            // Si el atributo es 'coordinates', se muestra como texto separado por comas
            if (header === 'coordinates') {
                return `<td>${point.geometry.coordinates.join(', ')}</td>`;
            } else {
                return `<td>${point.properties[header]}</td>`;
            }
        }).join('');
        table.appendChild(row);
    });

    // Agregar la funcionalidad de ordenación al hacer clic en el botón de cada columna
    const sortButtons = table.querySelectorAll('.sort-btn');
    sortButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const column = event.target.getAttribute('data-column');
            const order = event.target.classList.contains('asc') ? 'desc' : 'asc';
            sortTable(table, column, order);
            toggleSortOrder(button, order);
        });
    });

    return table;
}

// Función para ordenar la tabla
function sortTable(table, column, order) {
    const rows = Array.from(table.querySelectorAll('tr:nth-child(n+2)')); // Excluir la fila de encabezado
    const index = Array.from(table.querySelectorAll('th')).findIndex(th => th.textContent.includes(column));

    rows.sort((rowA, rowB) => {
        const cellA = rowA.cells[index].textContent;
        const cellB = rowB.cells[index].textContent;

        let comparison = 0;
        if (isNaN(cellA) && isNaN(cellB)) {
            comparison = cellA.localeCompare(cellB);
        } else {
            comparison = parseFloat(cellA) - parseFloat(cellB);
        }

        return order === 'asc' ? comparison : -comparison;
    });

    rows.forEach(row => table.appendChild(row)); // Reordenar las filas
}

// Función para alternar el orden de los botones de orden (asc/desc)
function toggleSortOrder(button, order) {
    // Eliminar el orden anterior
    button.classList.remove('asc', 'desc');
    button.classList.add(order);
}

///////////////////////////////////////////////////////
// FUNCION PARA COMPARTIR A TRAVES DE REDES SOCIALES //
///////////////////////////////////////////////////////

// URL a compartir (puedes personalizarla según la página que desees compartir)
const shareUrl = encodeURIComponent("https://www.tupagina.com");
const shareText = encodeURIComponent("¡Mira este increíble contenido!");

// Compartir en LinkedIn
function shareToLinkedIn() {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
    window.open(linkedInUrl, "_blank");
}

// Compartir en Facebook
function shareToFacebook() {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
    window.open(facebookUrl, "_blank");
}