// Wait for DOM to be fully loaded and Leaflet to be available
document.addEventListener('DOMContentLoaded', function() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library is not loaded!');
        return;
    }

    // Check if map container exists
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }

    // Initialize the map centered on the world
    const map = L.map('map').setView([20, 0], 2);

    // Add OpenStreetMap tile layer (free, no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0
    }).addTo(map);

    // Update coordinates and zoom level display
    const coordinatesElement = document.getElementById('coordinates');
    const zoomLevelElement = document.getElementById('zoom-level');

    // Check if elements exist before using them
    if (coordinatesElement && zoomLevelElement) {
        // Update zoom level
        map.on('zoomend', function() {
            zoomLevelElement.textContent = map.getZoom();
        });

        // Update coordinates on mouse move
        map.on('mousemove', function(e) {
            const lat = e.latlng.lat.toFixed(4);
            const lng = e.latlng.lng.toFixed(4);
            coordinatesElement.textContent = `${lat}, ${lng}`;
        });

        // Set initial zoom level
        zoomLevelElement.textContent = map.getZoom();
    }

    // Add some example markers for major cities
    const cities = [
        { name: 'New York', lat: 40.7128, lng: -74.0060 },
        { name: 'London', lat: 51.5074, lng: -0.1278 },
        { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
        { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
        { name: 'Paris', lat: 48.8566, lng: 2.3522 },
        { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
        { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777 }
    ];

    cities.forEach(city => {
        L.marker([city.lat, city.lng])
            .addTo(map)
            .bindPopup(`<b>${city.name}</b><br>${city.lat}, ${city.lng}`)
            .openPopup();
    });

    // Add click event to add markers
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(4);
        const lng = e.latlng.lng.toFixed(4);
        
        L.marker([e.latlng.lat, e.latlng.lng])
            .addTo(map)
            .bindPopup(`<b>Custom Location</b><br>Lat: ${lat}<br>Lng: ${lng}`)
            .openPopup();
    });

    // Add scale control
    L.control.scale({
        imperial: false,
        metric: true
    }).addTo(map);

    // Add zoom control with custom position
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
});

