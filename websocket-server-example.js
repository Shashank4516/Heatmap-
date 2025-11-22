// Example WebSocket Server for Heatmap Real-time Updates
// This is a Node.js example using the 'ws' library
//
// Installation:
//   npm install ws
//
// Run:
//   node websocket-server-example.js
//
// The server will start on ws://localhost:8080/heatmap-updates

const WebSocket = require("ws");

// Create WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log("WebSocket server started on ws://localhost:8080");

// Somnath Temple coordinates
const SOMNATH_TEMPLE = {
  lat: 20.8883,
  lng: 70.4011,
};

// Base heatmap data for Gujarat
const baseHeatmapData = [
  [23.0225, 72.5714, 0.7], // Ahmedabad
  [22.3072, 70.8022, 0.6], // Jamnagar
  [21.1702, 72.8311, 0.7], // Surat
  [23.1815, 69.6692, 0.5], // Kutch
  [22.4707, 70.0583, 0.6], // Rajkot
  [23.2156, 72.6369, 0.7], // Gandhinagar
  [21.7645, 72.1519, 0.6], // Vadodara
  [23.0333, 72.6167, 0.7], // Kalol
  [22.7, 72.8667, 0.5], // Mehsana
];

// Track crowd gathering at Somnath Temple
let somnathCrowdIntensity = 0.5; // Start with low intensity
let crowdGatheringActive = true; // Set to false to stop gathering simulation
let updateCount = 0;

// Function to generate heatmap data points around Somnath Temple
// More people = more data points with higher intensity
function generateSomnathHeatPoints(intensity) {
  const points = [];
  const numPoints = Math.floor(intensity * 15) + 5; // 5-20 points based on intensity

  // Main temple point (always highest)
  points.push([SOMNATH_TEMPLE.lat, SOMNATH_TEMPLE.lng, intensity]);

  // Generate surrounding points to show crowd spread
  for (let i = 0; i < numPoints - 1; i++) {
    // Random offset within ~500 meters of temple
    const latOffset = (Math.random() - 0.5) * 0.01; // ~1km range
    const lngOffset = (Math.random() - 0.5) * 0.01;

    // Intensity decreases slightly from center
    const pointIntensity = intensity * (0.7 + Math.random() * 0.3);

    points.push([
      SOMNATH_TEMPLE.lat + latOffset,
      SOMNATH_TEMPLE.lng + lngOffset,
      Math.min(1.0, pointIntensity),
    ]);
  }

  return points;
}

// Function to get current heatmap data
function getCurrentHeatmapData() {
  const somnathPoints = generateSomnathHeatPoints(somnathCrowdIntensity);
  return [...baseHeatmapData, ...somnathPoints];
}

// Track connected clients
const clients = new Set();

wss.on("connection", function connection(ws, req) {
  console.log("New client connected:", req.socket.remoteAddress);
  clients.add(ws);

  // Send initial data when client connects
  ws.send(
    JSON.stringify({
      type: "full_update",
      data: getCurrentHeatmapData(),
      message:
        "Initial heatmap data - Somnath Temple crowd intensity: " +
        somnathCrowdIntensity.toFixed(2),
    })
  );

  // Handle incoming messages from client
  ws.on("message", function incoming(message) {
    try {
      const data = JSON.parse(message);
      console.log("Received:", data);

      // Handle request for data
      if (data.type === "request_data" && data.region === "gujarat") {
        ws.send(
          JSON.stringify({
            type: "full_update",
            data: getCurrentHeatmapData(),
            message:
              "Somnath Temple crowd intensity: " +
              somnathCrowdIntensity.toFixed(2),
          })
        );
      }

      // Handle manual crowd control (optional)
      if (data.type === "set_crowd_intensity") {
        somnathCrowdIntensity = Math.max(0, Math.min(1.0, data.intensity));
        console.log("Crowd intensity manually set to:", somnathCrowdIntensity);
      }

      if (data.type === "toggle_gathering") {
        crowdGatheringActive = data.active;
        console.log(
          "Crowd gathering:",
          crowdGatheringActive ? "ACTIVE" : "PAUSED"
        );
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", function close() {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", function error(err) {
    console.error("WebSocket error:", err);
    clients.delete(ws);
  });
});

// Simulate people gathering at Somnath Temple
// Updates every 3 seconds for smoother real-time effect
setInterval(function () {
  if (clients.size > 0) {
    // Simulate crowd gathering (gradually increase intensity)
    if (crowdGatheringActive) {
      updateCount++;

      // Gradually increase intensity over time
      // Reaches maximum (1.0) after ~5 minutes (100 updates * 3 seconds)
      const targetIntensity = Math.min(1.0, 0.5 + (updateCount / 100) * 0.5);

      // Add some realistic variation (crowd fluctuates)
      const variation = (Math.random() - 0.5) * 0.05; // Small random variation
      somnathCrowdIntensity = Math.max(
        0.3,
        Math.min(1.0, targetIntensity + variation)
      );

      // Occasionally simulate peak times (festivals, special events)
      if (Math.random() < 0.1) {
        // 10% chance
        somnathCrowdIntensity = Math.min(1.0, somnathCrowdIntensity + 0.2);
        console.log("🌟 Peak crowd detected at Somnath Temple!");
      }
    }

    // Get current heatmap data with updated Somnath intensity
    const currentData = getCurrentHeatmapData();

    // Add small random variations to other locations (simulate normal activity)
    const updatedData = currentData.map((point) => {
      const [lat, lng, intensity] = point;

      // Don't modify Somnath Temple points (they're already updated)
      const isSomnathArea =
        Math.abs(lat - SOMNATH_TEMPLE.lat) < 0.02 &&
        Math.abs(lng - SOMNATH_TEMPLE.lng) < 0.02;

      if (isSomnathArea) {
        return point; // Keep Somnath points as-is
      }

      // Small random variation for other locations
      const variation = (Math.random() - 0.5) * 0.1;
      const newIntensity = Math.max(0.1, Math.min(1.0, intensity + variation));
      return [lat, lng, newIntensity];
    });

    // Send update to all connected clients
    const message = JSON.stringify({
      type: "heatmap_update",
      data: updatedData,
      timestamp: new Date().toISOString(),
      somnathIntensity: somnathCrowdIntensity.toFixed(3),
      crowdCount: Math.floor(somnathCrowdIntensity * 1000), // Estimated crowd size
    });

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(
      `📊 Update #${updateCount} - Somnath Temple intensity: ${somnathCrowdIntensity.toFixed(
        3
      )} ` +
        `(Estimated crowd: ~${Math.floor(
          somnathCrowdIntensity * 1000
        )} people) - ` +
        `Sent to ${clients.size} client(s)`
    );
  }
}, 3000); // Update every 3 seconds for smoother real-time updates

// Handle server shutdown gracefully
process.on("SIGINT", function () {
  console.log("\nShutting down WebSocket server...");
  wss.close(function () {
    console.log("WebSocket server closed");
    process.exit(0);
  });
});
