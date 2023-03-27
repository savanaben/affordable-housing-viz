mapboxgl.accessToken = 'pk.eyJ1Ijoic2F2YW5hYmVuIiwiYSI6ImNsZTNobWs4YjA0eGkzcG1wZzhycjZrb3cifQ.4_Du3FBo2v9tdy2DZRhb6A';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [-74.7057, 40.1583],
    zoom: 7
});

async function fetchCsvData(csvUrl) {
    const response = await d3.csv(csvUrl);
    const lookup = {};
    response.forEach(row => {
        lookup[row.COUNTY] = {
            column2: row.column2,
            column3: row.column3
        };
    });
    return lookup;
}

map.on('load', async () => {
    // Fetch local CSV data and create a lookup object
    const csvDataLookup = await fetchCsvData('data-csvs/County_data.csv');

    // Fetch local GeoJSON file
    fetch('geoJSON/County_Boundaries_of_NJ2C_Hosted2C_3857.geojson')
        .then(response => response.json())
        .then(data => {
            // Add a source for the state polygons.
            map.addSource('states', {
                'type': 'geojson',
                'data': data
            });

            // Add a layer showing the state polygons.
            map.addLayer({
                'id': 'states-layer',
                'type': 'fill',
                'source': 'states',
                'paint': {
                    'fill-color': 'rgba(200, 100, 240, 0.22)',
                }
            });

            // Add a layer for the state outlines with the desired width.
            map.addLayer({
                'id': 'states-outline',
                'type': 'line',
                'source': 'states',
                'paint': {
                    'line-color': 'rgba(200, 100, 240, 1)',
                    'line-width': 2 // Set the outline width to 2 pixels
                }
            });

            // When a click event occurs on a feature in the states layer,
            // open a popup at the location of the click.
            map.on('click', 'states-layer', (e) => {
                // Get the COUNTY and COUNTY_LABEL properties from the clicked feature.
                const county = e.features[0].properties.COUNTY;
                const countyLabel = e.features[0].properties.COUNTY_LABEL;

                // Look up the corresponding rowData in the CSV data using the COUNTY value.
                const rowData = csvDataLookup[county];

                // Initialize the popup content with the county label.
                let popupContent = `<strong>${countyLabel}</strong>`;

                // If rowData exists, add column2 and column3 values if available.
                if (rowData) {
                    if (rowData.column2) {
                        popupContent += `<br>Column 2: ${rowData.column2}`;
                    }
                    if (rowData.column3) {
                        popupContent += `<br>Column 3: ${rowData.column3}`;
                    }
                }

                // Create a new popup with the constructed content and add it to the map.
                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(popupContent)
                    .addTo(map);
            });

            // Change the cursor to a pointer when
            // the mouse is over the states layer.
            map.on('mouseenter', 'states-layer', () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            // Change the cursor back to a pointer
            // when it leaves the states layer.
            map.on('mouseleave', 'states-layer', () => {
                map.getCanvas().style.cursor = '';
            });
        })
});