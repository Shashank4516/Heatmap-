// World Map Initialization with Real-time Heatmap Updates
//
// WebSocket Configuration:
// To configure the WebSocket URL, set it before the page loads:
//   window.WEBSOCKET_URL = 'ws://localhost:8080/heatmap-updates'; // Local development
//   window.WEBSOCKET_URL = 'wss://your-server.com/heatmap-updates'; // Production (secure)
//
// WebSocket Message Format:
// The server should send JSON messages in one of these formats:
//   - { type: "heatmap_update", data: [[lat, lng, intensity], ...] }
//   - { type: "full_update", data: [[lat, lng, intensity], ...] }
//   - Direct array: [[lat, lng, intensity], ...]
//
// The heatmap will automatically update when new data is received via WebSocket.
// If WebSocket connection fails, it will fallback to static data.
//
window.addEventListener("load", function () {
  console.log("Page loaded, initializing map...");

  // Wait for Leaflet to be available
  function waitForLeaflet(callback, maxAttempts) {
    maxAttempts = maxAttempts || 50;
    var attempts = 0;

    function check() {
      attempts++;
      if (typeof L !== "undefined") {
        console.log("Leaflet loaded!");
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(check, 100);
      } else {
        console.error(
          "Leaflet failed to load after " + maxAttempts + " attempts"
        );
      }
    }
    check();
  }

  waitForLeaflet(function () {
    // Get map container
    var mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.error("Map container not found!");
      return;
    }

    console.log("Map container found, initializing...");

    try {
      // Initialize the map - store globally to prevent garbage collection
      // Center on Gujarat, India (23.5° N, 72.5° E)
      window.worldMap = L.map("map", {
        center: [23.5, 72.5],
        zoom: 7,
        zoomControl: true,
      });

      var map = window.worldMap; // Use the global reference

      console.log("Map object created");

      // Ensure map container stays visible
      var mapContainer = document.getElementById("map");
      if (mapContainer) {
        mapContainer.style.display = "block";
        mapContainer.style.visibility = "visible";
        mapContainer.style.height = "600px";
        mapContainer.style.width = "100%";
      }

      // Add tile layer with error handling
      var osmLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      );

      osmLayer.addTo(map);
      console.log("Tile layer added");

      // Wait a moment then invalidate size - do it multiple times to ensure rendering
      setTimeout(function () {
        map.invalidateSize();
        console.log("Map size invalidated (first time)");
      }, 200);

      setTimeout(function () {
        map.invalidateSize();
        console.log("Map size invalidated (second time)");
      }, 500);

      setTimeout(function () {
        map.invalidateSize();
        console.log("Map size invalidated (third time)");
      }, 1000);

      // Update coordinates and zoom level display
      var coordinatesElement = document.getElementById("coordinates");
      var zoomLevelElement = document.getElementById("zoom-level");

      if (coordinatesElement && zoomLevelElement) {
        // Update zoom level
        map.on("zoomend", function () {
          zoomLevelElement.textContent = map.getZoom();
        });

        // Update coordinates on mouse move
        map.on("mousemove", function (e) {
          var lat = e.latlng.lat.toFixed(4);
          var lng = e.latlng.lng.toFixed(4);
          coordinatesElement.textContent = lat + ", " + lng;
        });

        // Set initial zoom level
        zoomLevelElement.textContent = map.getZoom();
      }

      // Add markers after map is ready
      map.whenReady(function () {
        // Add some example markers for major cities
        var cities = [
          { name: "New York", lat: 40.7128, lng: -74.006 },
          { name: "London", lat: 51.5074, lng: -0.1278 },
          { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
          { name: "Sydney", lat: -33.8688, lng: 151.2093 },
          { name: "Paris", lat: 48.8566, lng: 2.3522 },
          { name: "Dubai", lat: 25.2048, lng: 55.2708 },
          { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
          { name: "Mumbai", lat: 19.076, lng: 72.8777 },
          { name: "Gujarat", lat: 23.0225, lng: 72.5714 },
        ];

        cities.forEach(function (city) {
          var marker = L.marker([city.lat, city.lng])
            .addTo(map)
            .bindPopup(
              "<b>" + city.name + "</b><br>" + city.lat + ", " + city.lng
            );

          // Log Gujarat marker specifically
          if (city.name === "Gujarat") {
            console.log("Gujarat marker added at:", city.lat, city.lng);
            console.log("Gujarat marker object:", marker);
            // Ensure Gujarat marker is visible
            setTimeout(function () {
              map.setView([city.lat, city.lng], 7);
              map.invalidateSize();
            }, 300);
          }
        });

        console.log("All city markers added, total:", cities.length);

        // Add Somnath Mandir marker (special location)
        var somnathMandir = L.marker([20.8883, 70.4011])
          .addTo(map)
          .bindPopup(
            "<b>🕉️ Somnath Mandir</b><br>Somnath Temple, Veraval<br>Coordinates: 20.8883° N, 70.4011° E<br><br>One of the 12 Jyotirlinga shrines of Lord Shiva"
          );

        console.log("Somnath Mandir marker added at: 20.8883, 70.4011");

        // Add heatmap for Gujarat only with WebSocket real-time updates
        setTimeout(function () {
          // Wait for heatmap library to load
          function addGujaratHeatmap() {
            if (
              typeof L !== "undefined" &&
              typeof L.heatLayer !== "undefined"
            ) {
              // Create heatmap layer (initially empty, will be populated via WebSocket)
              if (!window.heatmapLayer) {
                window.heatmapLayer = L.heatLayer([], {
                  radius: 60, // Increased radius for better visibility
                  blur: 35, // Increased blur for smoother, more visible effect
                  maxZoom: 18,
                  gradient: {
                    0.0: "#0000ff", // Bright blue
                    0.1: "#00ffff", // Cyan
                    0.3: "#00ff00", // Bright green
                    0.5: "#ffff00", // Bright yellow
                    0.7: "#ff8800", // Bright orange
                    0.9: "#ff4400", // Bright red-orange
                    1.0: "#ff0000", // Bright red
                  },
                  max: 1.0,
                }).addTo(map);

                console.log("Gujarat heatmap layer created (awaiting data)");
              }

              // Fallback static data (used if WebSocket fails or for initial load)
              var fallbackStaticData = [
                [23.0225, 72.5714, 1.0], // Ahmedabad - maximum intensity
                [22.3072, 70.8022, 0.8], // Jamnagar
                [21.1702, 72.8311, 0.9], // Surat
                [23.1815, 69.6692, 0.7], // Kutch
                [22.4707, 70.0583, 0.8], // Rajkot
                [23.2156, 72.6369, 0.9], // Gandhinagar
                [22.3039, 70.8022, 0.7], // Porbandar
                [21.7645, 72.1519, 0.8], // Vadodara
                [23.8481, 72.1293, 0.7], // Patan
                [24.5854, 72.7023, 0.6], // Palanpur
                [22.3094, 73.1812, 0.7], // Anand
                [22.6015, 72.9697, 0.8], // Bharuch
                [23.1667, 70.1333, 0.6], // Bhuj
                [22.3, 73.2, 0.7], // Nadiad
                [23.0333, 72.6167, 0.9], // Kalol
                [22.7, 72.8667, 0.7], // Mehsana
                [21.5167, 70.45, 0.6], // Junagadh
                [22.5667, 72.9167, 0.7], // Modasa
                [23.0833, 72.6333, 0.8], // Sanand
                [22.45, 72.8, 0.7], // Kheda
                [23.0225, 72.5714, 1.0], // Ahmedabad center (maximum intensity)
                [23.0325, 72.5814, 0.9], // Ahmedabad area
                [23.0125, 72.5614, 0.9], // Ahmedabad area
                [23.0425, 72.5914, 0.8], // Ahmedabad area
                [23.0025, 72.5514, 0.8], // Ahmedabad area
                [22.3072, 70.8022, 0.8], // Jamnagar
                [21.1702, 72.8311, 0.9], // Surat
                [21.1802, 72.8411, 0.8], // Surat area
                [21.1602, 72.8211, 0.8], // Surat area
                [21.1902, 72.8511, 0.7], // Surat area
                [21.1502, 72.8111, 0.7], // Surat area
                [20.8883, 70.4011, 0.9], // Somnath Mandir - high intensity
                [20.8983, 70.4111, 0.8], // Somnath area
                [20.8783, 70.3911, 0.8], // Somnath area
              ];

              // Function to update heatmap with new data
              function updateHeatmapData(data) {
                if (window.heatmapLayer && Array.isArray(data)) {
                  window.heatmapLayer.setLatLngs(data);
                  console.log(
                    "Heatmap updated via WebSocket with",
                    data.length,
                    "data points at",
                    new Date().toLocaleTimeString()
                  );
                }
              }

              // Function to use fallback static data
              function useFallbackData() {
                if (window.heatmapLayer) {
                  window.heatmapLayer.setLatLngs(fallbackStaticData);
                  console.log(
                    "Using fallback static data with",
                    fallbackStaticData.length,
                    "data points"
                  );
                }
              }

              // WebSocket connection for real-time updates
              function connectWebSocket() {
                // WebSocket URL - change this to your server's WebSocket endpoint
                // For local development: 'ws://localhost:8080/heatmap-updates'
                // For production: 'wss://your-server.com/heatmap-updates'
                var wsUrl =
                  window.WEBSOCKET_URL || "ws://localhost:8080/heatmap-updates";

                try {
                  console.log("Connecting to WebSocket:", wsUrl);
                  var ws = new WebSocket(wsUrl);

                  ws.onopen = function () {
                    console.log("WebSocket connection opened successfully");
                    // Optionally send a message to request initial data
                    ws.send(
                      JSON.stringify({
                        type: "request_data",
                        region: "gujarat",
                      })
                    );
                  };

                  ws.onmessage = function (event) {
                    try {
                      var message = JSON.parse(event.data);

                      // Handle different message types
                      if (message.type === "heatmap_update" && message.data) {
                        // Expected format: message.data = [[lat, lng, intensity], ...]
                        updateHeatmapData(message.data);
                      } else if (
                        message.type === "full_update" &&
                        message.data
                      ) {
                        // Full data replacement
                        updateHeatmapData(message.data);
                      } else if (Array.isArray(message)) {
                        // If message is directly an array
                        updateHeatmapData(message);
                      } else if (message.data && Array.isArray(message.data)) {
                        // If data is nested
                        updateHeatmapData(message.data);
                      } else {
                        console.warn("Unknown message format:", message);
                      }
                    } catch (error) {
                      console.error("Error parsing WebSocket message:", error);
                      console.error("Raw message:", event.data);
                    }
                  };

                  ws.onerror = function (error) {
                    console.error("WebSocket error:", error);
                    // Use fallback data on error
                    useFallbackData();
                  };

                  ws.onclose = function (event) {
                    console.log(
                      "WebSocket connection closed",
                      event.code,
                      event.reason
                    );

                    // Use fallback data when connection closes
                    useFallbackData();

                    // Attempt to reconnect after 5 seconds
                    console.log("Attempting to reconnect in 5 seconds...");
                    setTimeout(function () {
                      if (!window.wsReconnectDisabled) {
                        connectWebSocket();
                      }
                    }, 5000);
                  };

                  // Store WebSocket globally for manual control
                  window.heatmapWebSocket = ws;
                } catch (error) {
                  console.error(
                    "Failed to create WebSocket connection:",
                    error
                  );
                  useFallbackData();
                }
              }

              // Initialize with fallback data first
              useFallbackData();

              // Attempt WebSocket connection
              connectWebSocket();

              console.log("Gujarat heatmap initialized with WebSocket support");
              return true;
            }
            return false;
          }

          // Try to add heatmap, retry if library not loaded yet
          if (!addGujaratHeatmap()) {
            var attempts = 0;
            var maxAttempts = 20;
            var retryInterval = setInterval(function () {
              attempts++;
              if (addGujaratHeatmap() || attempts >= maxAttempts) {
                clearInterval(retryInterval);
                if (attempts >= maxAttempts) {
                  console.error(
                    "Failed to load heatmap library after",
                    maxAttempts,
                    "attempts"
                  );
                }
              }
            }, 100);
          }
        }, 500);
      });

      // Add click event to add markers
      map.on("click", function (e) {
        var lat = e.latlng.lat.toFixed(4);
        var lng = e.latlng.lng.toFixed(4);

        L.marker([e.latlng.lat, e.latlng.lng])
          .addTo(map)
          .bindPopup(
            "<b>Custom Location</b><br>Lat: " + lat + "<br>Lng: " + lng
          )
          .openPopup();
      });

      // Add scale control
      L.control
        .scale({
          imperial: false,
          metric: true,
        })
        .addTo(map);

      console.log("Map initialized successfully!");

      // Monitor map container to prevent it from being hidden
      var observer = new MutationObserver(function (mutations) {
        var container = document.getElementById("map");
        if (container) {
          var style = window.getComputedStyle(container);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.height === "0px"
          ) {
            console.warn("Map container was hidden, restoring...");
            container.style.display = "block";
            container.style.visibility = "visible";
            container.style.height = "600px";
            map.invalidateSize();
          }
        }
      });

      if (mapContainer) {
        observer.observe(mapContainer, {
          attributes: true,
          attributeFilter: ["style", "class"],
          childList: false,
          subtree: false,
        });
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      alert("Error loading map: " + error.message);
    }
  });
});
