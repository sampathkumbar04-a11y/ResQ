# ResQ - Offline Disaster Coordination System

ResQ is an offline-first, dynamic web application designed to coordinate disaster relief efforts between citizens in distress and rescue teams. Built specifically for environments with intermittent or zero internet connectivity, ResQ ensures that critical emergency data is captured, securely stored, and instantly synchronized when connectivity is restored.

## 🚀 Key Features

*   **Offline-First Architecture**: 
    *   Utilizes HTML5 `localStorage` as a resilient local data queue.
    *   Features a Progressive Web App **Service Worker** (`sw.js`) that automatically caches static assets and map tiles. Once a responder views a map area online, it remains permanently available offline.
*   **Dual-Role Dashboards**: 
    *   **Citizen View**: Streamlined interface for rapid help requests, GPS capturing, and real-time status banners ("Broadcasted", "Accepted", "En Route").
    *   **Rescue Team View**: Command center dashboard with a live map, active request filtering, and a progressive assignment workflow (Assign ➔ En Route ➔ Complete).
*   **Smart Emergency Routing**: 
    *   Users select a specific condition (e.g., "Chemical Fire", "Cardiac Arrest"), and the system automatically calculates the Priority Level (Critical/Medium/Low) and suggests the exact type of Responder Unit needed (e.g., "HAZMAT Team", "Advanced EMT").
*   **Zero-Internet Fallbacks**: 
    *   **Toll-Free SOS**: A dedicated button instantly opens the native phone dialer to call emergency services (108) while simultaneously logging a digital Code Red alert.
    *   **SMS Fallback**: If internet is down but a cellular signal exists, the app dynamically packages the citizen's GPS and emergency data into a pre-filled SMS message to the local emergency shortcode.
*   **Modern Glassmorphism UI**: A highly polished, responsive interface utilizing an animated background, frosted glass elements, and a high-visibility Rescue Orange & Responder Navy color palette.

## 🛠️ Technology Stack

*   **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6)
*   **Mapping**: Leaflet.js (OpenStreetMap tiles)
*   **Iconography**: Lucide Icons (Vector)
*   **State Management**: Native `localStorage` (No backend database required for local simulation)

## 🏃 How to Run Locally

Because ResQ uses Service Workers and modules, it must be run through a local web server (opening the file directly via `file:///` will block some offline features).

1.  Open the project folder in **Visual Studio Code**.
2.  Ensure you have the **Live Server** extension installed.
3.  Right-click on `index.html` and select **"Open with Live Server"**.
4.  The application will automatically launch in your default web browser at `http://127.0.0.1:5500`.

### Testing Offline Capabilities
1. Open your browser's Developer Tools (F12).
2. Go to the **Network** tab.
3. Change the throttling dropdown from "No throttling" to **"Offline"**.
4. Refresh the page! The application and the map (if previously viewed) will load instantly.

## 📁 Project Structure

```text
resQ/
├── index.html          # Main Single Page Application shell
├── sw.js               # Service Worker for offline caching
├── README.md           # Project documentation
└── assets/
    ├── css/
    │   └── style.css   # Glassmorphism UI and theme variables
    ├── js/
    │   └── app.js      # Core business logic and state management
    └── logo.jpg        # App icon
```
