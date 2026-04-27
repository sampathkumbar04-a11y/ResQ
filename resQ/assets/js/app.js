/**
 * ResQNet - Core Application Logic
 * Offline-first disaster coordination system
 */

// ==========================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================
const STORAGE_KEY_REQUESTS = 'resqnet_requests';
const STORAGE_KEY_USER = 'resqnet_user';
const STORAGE_KEY_ALERTS = 'resqnet_alerts';

let state = {
    user: JSON.parse(localStorage.getItem(STORAGE_KEY_USER)) || null,
    requests: JSON.parse(localStorage.getItem(STORAGE_KEY_REQUESTS)) || [],
    alerts: JSON.parse(localStorage.getItem(STORAGE_KEY_ALERTS)) || [],
    isOffline: !navigator.onLine,
    mapInstance: null,
    markers: []
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const views = {
    login: document.getElementById('view-login'),
    citizen: document.getElementById('view-citizen'),
    admin: document.getElementById('view-admin')
};

const offlineBanner = document.getElementById('offline-banner');
const alertBanner = document.getElementById('alert-banner');
const alertMessageText = document.getElementById('alert-message-text');

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupNetworkListeners();
    setupEventListeners();
    checkAuthStatus();
});

// ==========================================
// NETWORK STATUS & SYNCING
// ==========================================
function setupNetworkListeners() {
    updateNetworkStatus();
    window.addEventListener('online', () => {
        state.isOffline = false;
        updateNetworkStatus();
        syncData();
    });
    window.addEventListener('offline', () => {
        state.isOffline = true;
        updateNetworkStatus();
    });
}

function updateNetworkStatus() {
    if (state.isOffline) {
        offlineBanner.classList.remove('hidden');
        document.getElementById('sync-text').innerText = 'Offline (Local)';
        document.getElementById('sync-icon').classList.remove('syncing');
        document.getElementById('sync-icon').setAttribute('data-lucide', 'wifi-off');
    } else {
        offlineBanner.classList.add('hidden');
        document.getElementById('sync-text').innerText = 'Synced';
        document.getElementById('sync-icon').setAttribute('data-lucide', 'refresh-cw');
    }
    lucide.createIcons();
}

function syncData() {
    // Simulate syncing local data to server
    if (state.user && state.user.role === 'admin') {
        document.getElementById('sync-icon').classList.add('syncing');
        document.getElementById('sync-text').innerText = 'Syncing...';
        setTimeout(() => {
            document.getElementById('sync-icon').classList.remove('syncing');
            document.getElementById('sync-text').innerText = 'Synced';
            renderAdminDashboard(); // Refresh UI after sync
        }, 1500);
    }
}

// ==========================================
// AUTHENTICATION & ROUTING
// ==========================================
function checkAuthStatus() {
    if (state.user) {
        if (state.user.role === 'citizen') showView('citizen');
        else if (state.user.role === 'admin') showView('admin');
    } else {
        showView('login');
    }
}

function showView(viewName) {
    Object.values(views).forEach(v => v.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
    views[viewName].classList.add('active');

    if (viewName === 'citizen') initCitizenView();
    if (viewName === 'admin') initAdminView();
}

function loginUser(userData) {
    state.user = userData;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    checkAuthStatus();
}

function logoutUser() {
    state.user = null;
    localStorage.removeItem(STORAGE_KEY_USER);
    showView('login');
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================
function setupEventListeners() {
    // Login Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            if (e.target.dataset.tab === 'citizen') {
                document.getElementById('citizen-login-form').classList.remove('hidden');
                document.getElementById('admin-login-form').classList.add('hidden');
            } else {
                document.getElementById('citizen-login-form').classList.add('hidden');
                document.getElementById('admin-login-form').classList.remove('hidden');
            }
        });
    });

    // Login Forms
    document.getElementById('citizen-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        loginUser({
            role: 'citizen',
            name: document.getElementById('citizen-name').value,
            phone: document.getElementById('citizen-phone').value
        });
    });

    document.getElementById('admin-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        loginUser({
            role: 'admin',
            id: document.getElementById('admin-id').value,
            name: 'Rescue Unit ' + document.getElementById('admin-id').value
        });
    });

    // Logout
    document.getElementById('citizen-logout').addEventListener('click', logoutUser);
    document.getElementById('admin-logout').addEventListener('click', logoutUser);

    // Citizen Form
    const reqTypeSelect = document.getElementById('req-type');
    const reqConditionSelect = document.getElementById('req-condition');

    reqTypeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        reqConditionSelect.innerHTML = '<option value="" disabled selected>Select details</option>';

        if (type === 'medical') {
            reqConditionSelect.innerHTML += `
                <option value="critical">Heart Attack / Cardiac Arrest</option>
                <option value="critical">Severe Bleeding / Trauma</option>
                <option value="critical">Unconscious / Breathing Issue</option>
                <option value="medium">Bone Fracture</option>
                <option value="low">Minor Cut / Injury</option>
            `;
        } else if (type === 'fire') {
            reqConditionSelect.innerHTML += `
                <option value="critical">Building / Structure Fire</option>
                <option value="critical">Chemical / Hazardous Fire</option>
                <option value="medium">Brush / Wildfire spreading</option>
                <option value="low">Small contained fire</option>
            `;
        } else if (type === 'rescue') {
            reqConditionSelect.innerHTML += `
                <option value="critical">Drowning / Flood Trapped</option>
                <option value="critical">Trapped in collapsed structure</option>
                <option value="medium">Stranded but safe</option>
            `;
        } else if (type === 'food') {
            reqConditionSelect.innerHTML += `
                <option value="critical">No drinking water (>24hrs)</option>
                <option value="medium">No food (>24hrs)</option>
                <option value="low">Supplies running low</option>
            `;
        } else {
            reqConditionSelect.innerHTML += `
                <option value="critical">Life-threatening emergency</option>
                <option value="medium">Urgent assistance needed</option>
                <option value="low">General support / Info</option>
            `;
        }
    });

    document.getElementById('help-request-form').addEventListener('submit', handleCitizenSubmit);
    document.getElementById('btn-get-location').addEventListener('click', getGPSLocation);
    document.getElementById('btn-sms-fallback').addEventListener('click', prepareSMS);

    const sosBtn = document.getElementById('btn-sos-alert');
    if (sosBtn) {
        sosBtn.addEventListener('click', handleSOSAlert);
    }

    // Admin Actions
    document.getElementById('btn-broadcast').addEventListener('click', () => {
        document.getElementById('broadcast-modal').classList.remove('hidden');
    });
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        document.getElementById('broadcast-modal').classList.add('hidden');
    });
    document.getElementById('btn-send-alert').addEventListener('click', handleBroadcast);
    document.getElementById('close-alert-btn').addEventListener('click', () => {
        alertBanner.classList.add('hidden');
    });

    document.getElementById('filter-status').addEventListener('change', renderAdminDashboard);
}

// ==========================================
// CITIZEN VIEW LOGIC
// ==========================================
function initCitizenView() {
    document.getElementById('citizen-user-display').innerText = state.user.name;
    document.getElementById('citizen-phone-display').innerText = state.user.phone;
    document.getElementById('req-name').value = state.user.name;

    checkAlerts();
    renderCitizenActiveRequest();
}

function getGPSLocation() {
    const locInput = document.getElementById('req-location');
    locInput.value = "Fetching location...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                locInput.value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
            },
            () => {
                locInput.value = "Unable to get GPS. Enter manually.";
            }
        );
    } else {
        locInput.value = "GPS not supported. Enter manually.";
    }
}

function handleCitizenSubmit(e) {
    e.preventDefault();

    const type = document.getElementById('req-type').value;
    const condSelect = document.getElementById('req-condition');
    const priority = condSelect.value || 'medium';
    const condition = condSelect.options[condSelect.selectedIndex].text;
    const people = document.getElementById('req-people').value;

    const request = {
        id: 'REQ-' + Date.now().toString().slice(-6),
        name: state.user.name,
        phone: state.user.phone,
        location: document.getElementById('req-location').value,
        type: type,
        condition: condition,
        people: people,
        priority: priority,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    state.requests.unshift(request);
    saveRequests();

    // Reset form except name
    document.getElementById('req-location').value = '';
    document.getElementById('req-type').value = '';
    document.getElementById('req-condition').value = '';
    document.getElementById('req-people').value = '';

    renderCitizenActiveRequest();

    if (state.isOffline) {
        alert("Request saved locally. It will automatically sync when internet is restored.");
    } else {
        alert("Emergency request submitted successfully.");
    }
}

function formatCitizenStatusMessage(req) {
    if (req.status === 'pending') {
        return `<div style="background:#e0f2fe; color:#0369a1; padding:0.8rem; border-radius:6px; margin-bottom:1rem; font-size:0.9rem; border: 1px solid #bae6fd;"><i data-lucide="radio" style="width:18px;height:18px;vertical-align:middle;margin-right:5px;"></i> <strong>Request Broadcasted!</strong><br><span style="opacity:0.9;">Awaiting a nearby rescue team to accept your request.</span></div>`;
    }
    if (req.status === 'assigned') {
        return `<div style="background:#fef9c3; color:#a16207; padding:0.8rem; border-radius:6px; margin-bottom:1rem; font-size:0.9rem; border: 1px solid #fef08a;"><i data-lucide="check-circle" style="width:18px;height:18px;vertical-align:middle;margin-right:5px;"></i> <strong>Request Accepted!</strong><br><span style="opacity:0.9;">A rescue team has been assigned and is preparing to deploy.</span></div>`;
    }
    if (req.status === 'in_progress') {
        return `<div style="background:#dcfce7; color:#15803d; padding:0.8rem; border-radius:6px; margin-bottom:1rem; font-size:0.9rem; border: 1px solid #bbf7d0; animation: pulse 2s infinite;"><i data-lucide="truck" style="width:18px;height:18px;vertical-align:middle;margin-right:5px;"></i> <strong>Help is on the way!</strong><br><span style="opacity:0.9;">Responders are en route to your location. Stay visible and calm.</span></div>`;
    }
    if (req.status === 'completed') {
        return `<div style="background:#f1f5f9; color:#475569; padding:0.8rem; border-radius:6px; margin-bottom:1rem; font-size:0.9rem; border: 1px solid #e2e8f0;"><i data-lucide="flag" style="width:18px;height:18px;vertical-align:middle;margin-right:5px;"></i> <strong>Emergency Resolved</strong><br><span style="opacity:0.9;">This request has been marked as completed by the rescue team.</span></div>`;
    }
    return '';
}

function renderCitizenActiveRequest() {
    const container = document.getElementById('active-request-container');
    const myRequests = state.requests.filter(r => r.name === state.user.name);

    if (myRequests.length === 0) {
        container.innerHTML = `<p class="empty-state">No active requests.</p>`;
        return;
    }

    const req = myRequests[0]; // Show latest

    container.innerHTML = `
        <div class="active-req-item">
            ${formatCitizenStatusMessage(req)}
            <div class="req-header">
                <span>${req.id}</span>
                <span class="req-status status-${req.status}">${formatStatus(req.status)}</span>
            </div>
            <p class="small-text"><strong>Type:</strong> <span style="text-transform:capitalize">${req.type}</span> | <strong>Priority:</strong> <span style="text-transform:capitalize">${req.priority}</span></p>
            <p class="small-text"><strong>Condition:</strong> ${req.condition || 'N/A'}</p>
            <p class="small-text"><strong>People Affected:</strong> ${req.people || 1}</p>
            <p class="small-text"><strong>Location:</strong> ${req.location}</p>
        </div>
    `;
}

function handleSOSAlert() {
    if (!confirm("Are you sure you want to trigger an SOS? This will call 108 and alert rescue teams.")) return;

    window.location.href = "tel:108";

    let loc = "Unknown Location";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                loc = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
                createSOSRequest(loc);
            },
            () => {
                createSOSRequest(loc);
            }
        );
    } else {
        createSOSRequest(loc);
    }
}

function createSOSRequest(loc) {
    const request = {
        id: 'SOS-' + Date.now().toString().slice(-6),
        name: state.user.name,
        phone: state.user.phone,
        location: loc,
        type: 'sos',
        condition: 'INSTANT SOS ALERT',
        people: 1,
        priority: 'critical',
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    state.requests.unshift(request);
    saveRequests();
    renderCitizenActiveRequest();

    alert("SOS sent successfully. Rescue teams have been notified.");
}

function prepareSMS() {
    const type = document.getElementById('req-type').value || "[TYPE]";
    const loc = document.getElementById('req-location').value || "[LOCATION]";

    const message = `HELP | ${loc} | ${type} | ${state.user.name} | ${state.user.phone}`;
    const encoded = encodeURIComponent(message);

    // Simulating Twilio/Emergency shortcode
    const emergencyNumber = "911";

    document.getElementById('btn-sms-fallback').href = `sms:${emergencyNumber}?body=${encoded}`;
}

// ==========================================
// ADMIN VIEW LOGIC
// ==========================================
function initAdminView() {
    document.getElementById('admin-user-display').innerText = state.user.name;

    // Small delay to ensure map container is visible before initializing Leaflet
    setTimeout(() => {
        initMap();
        renderAdminDashboard();
    }, 100);
}

function renderAdminDashboard() {
    const listContainer = document.getElementById('requests-list-container');
    const filter = document.getElementById('filter-status').value;

    let filteredReqs = state.requests;

    if (filter === 'active') {
        filteredReqs = filteredReqs.filter(r => r.status !== 'completed');
    } else if (filter !== 'all') {
        filteredReqs = filteredReqs.filter(r => r.status === filter);
    }

    // Update Stats
    document.getElementById('stat-total').innerText = state.requests.length;
    document.getElementById('stat-critical').innerText = state.requests.filter(r => r.priority === 'critical').length;
    document.getElementById('stat-pending').innerText = state.requests.filter(r => r.status === 'pending').length;

    // Render List
    if (filteredReqs.length === 0) {
        listContainer.innerHTML = `<div class="empty-state">No requests found.</div>`;
    } else {
        listContainer.innerHTML = filteredReqs.map(req => {
            const assignment = getSmartAssignment(req.priority, req.type);
            const time = new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let actionBtn = '';
            if (req.status === 'pending') {
                actionBtn = `<button class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="updateRequestStatus('${req.id}', 'assigned')">Assign to Me</button>`;
            } else if (req.status === 'assigned') {
                actionBtn = `<button class="btn btn-info" style="background:#0ea5e9; color:white; padding: 0.3rem 0.6rem; font-size: 0.8rem; border:none;" onclick="updateRequestStatus('${req.id}', 'in_progress')">Mark En Route</button>`;
            } else if (req.status === 'in_progress') {
                actionBtn = `<button class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border:none;" onclick="updateRequestStatus('${req.id}', 'completed')">Complete Task</button>`;
            } else {
                actionBtn = `<span class="badge low">Completed</span>`;
            }

            const isSos = req.type === 'sos';
            const extraStyle = isSos ? 'background: #fee2e2; border: 2px solid #ef4444;' : '';
            const badgeStyle = isSos ? 'background: #ef4444; color: white;' : '';

            return `
                <div class="admin-req-card priority-${req.priority}" style="${extraStyle}">
                    <div class="req-card-top">
                        <span class="req-type-badge" style="${badgeStyle}"><i data-lucide="${getTypeIcon(req.type)}"></i> ${req.type.toUpperCase()}</span>
                        <span class="req-time">${time}</span>
                    </div>
                    <div class="req-card-mid">
                        <div class="req-name">${req.name} (${req.phone})</div>
                        <div class="req-loc" style="margin-bottom:0.2rem;"><strong>Condition:</strong> ${req.condition || 'N/A'} (People: ${req.people || 1})</div>
                        <div class="req-loc"><i data-lucide="map-pin"></i> ${req.location}</div>
                    </div>
                    <div class="req-card-bottom">
                        <div class="smart-assign">
                            <i data-lucide="zap"></i> Suggestion: ${assignment}
                        </div>
                        <div class="action-buttons">
                            ${actionBtn}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    lucide.createIcons();
    updateMapMarkers(filteredReqs);
}

function updateRequestStatus(id, newStatus) {
    const idx = state.requests.findIndex(r => r.id === id);
    if (idx > -1) {
        state.requests[idx].status = newStatus;
        saveRequests();
        renderAdminDashboard();
    }
}

// Smart Assignment Logic
function getSmartAssignment(priority, type) {
    if (type === 'sos') return 'ALL AVAILABLE UNITS (CODE RED)';
    if (type === 'fire') {
        if (priority === 'critical') return 'Fire Brigade & HAZMAT';
        return 'Local Fire Department';
    }
    if (type === 'medical') {
        if (priority === 'critical') return 'Ambulance & Advanced EMT';
        return 'Paramedic / First Aid Team';
    }
    if (type === 'rescue') {
        if (priority === 'critical') return 'Search & Rescue Squad (NDRF)';
        return 'Local Rescue Volunteers';
    }
    if (type === 'food') {
        return 'Relief Distribution Team';
    }

    if (priority === 'critical') return 'Emergency Response Unit';
    if (priority === 'medium') return 'Rescue Squad';
    return 'Local Volunteer Group';
}

function getTypeIcon(type) {
    const map = { medical: 'cross', rescue: 'life-buoy', food: 'package', fire: 'flame', sos: 'alert-octagon', other: 'info' };
    return map[type] || 'info';
}

// Map Initialization
function initMap() {
    if (state.mapInstance) return;

    // Default to a generic center (e.g., somewhere central or user's city)
    state.mapInstance = L.map('rescue-map').setView([20.5937, 78.9629], 5); // India center roughly

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(state.mapInstance);
}

function updateMapMarkers(requests) {
    if (!state.mapInstance) return;

    // Clear old markers
    state.markers.forEach(m => state.mapInstance.removeLayer(m));
    state.markers = [];

    // Add new markers
    requests.forEach(req => {
        // Simple heuristic: if location contains commas, try to parse as coords, else ignore for demo
        const coordsMatch = req.location.match(/([-+]?[0-9]*\.?[0-9]+),\s*([-+]?[0-9]*\.?[0-9]+)/);
        if (coordsMatch) {
            const lat = parseFloat(coordsMatch[1]);
            const lng = parseFloat(coordsMatch[2]);

            const color = req.priority === 'critical' ? 'red' : (req.priority === 'medium' ? 'orange' : 'green');

            const markerHtml = `<div style="background-color:${color}; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`;
            const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [15, 15] });

            const marker = L.marker([lat, lng], { icon }).addTo(state.mapInstance);
            marker.bindPopup(`<b>${req.type.toUpperCase()}</b><br>${req.name}<br>${req.status}`);
            state.markers.push(marker);
        }
    });

    if (state.markers.length > 0) {
        const group = new L.featureGroup(state.markers);
        state.mapInstance.fitBounds(group.getBounds().pad(0.1));
    }
}

// ==========================================
// ALERTS & UTILS
// ==========================================
function handleBroadcast() {
    const msg = document.getElementById('broadcast-msg').value;
    if (!msg) return;

    state.alerts.push({ text: msg, time: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(state.alerts));

    document.getElementById('broadcast-msg').value = '';
    document.getElementById('broadcast-modal').classList.add('hidden');

    alert("Alert broadcasted successfully. Citizens will see this on their dashboard.");
}

function checkAlerts() {
    if (state.alerts.length > 0) {
        const latestAlert = state.alerts[state.alerts.length - 1];
        alertMessageText.innerText = latestAlert.text;
        alertBanner.classList.remove('hidden');
    }
}

function saveRequests() {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(state.requests));
}

function formatStatus(status) {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}
