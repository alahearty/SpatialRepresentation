window.MapContainer = {
    name: 'MapContainer',
    props: ['fields', 'boundary', 'visible', 'flowStations', 'route', 'fieldFilter'],
    emits: ['open-route-modal'],
    data() {
        return {
            map: null,
            wellMarkers: [],
            boundaryLayer: null,
            _resizeTimeout: null,
            flowStationMarkers: [],
            flowLines: [],
            routeLine: null,
            routePopup: null,
            routingControl: null, // Added for routing control
            productionLegend: null // Added for production legend
        };
    },
    watch: {
        visible(newVal) {
            if (newVal) {
                this.$nextTick(() => {
                    if (!this.map) {
                        this.initMap();
                    } else {
                        this.invalidateMapSize();
                    }
                });
            }
        },
        fields: {
            handler() { this.renderMap(); },
            deep: true
        },
        boundary: {
            handler() { this.renderMap(); },
            deep: true
        },
        flowStations: {
            handler() { this.renderMap(); },
            deep: true
        },
        route: {
            handler() { this.renderMap(); },
            deep: true
        },
        // Watch for field filter changes from parent
        fieldFilter: {
            handler(newVal) { this.focusOnField(newVal); },
            immediate: true
        }
    },
    mounted() {
        // --- Advanced Map Initialization ---
        // Base tile layers
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });
        const esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles © Esri'
        });
        const stamenTerrain = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg', {
            maxZoom: 18,
            attribution: 'Map tiles by Stamen Design'
        });
        this.map = L.map(this.$refs.map, {
            center: [5.5, 7.0],
            zoom: 9,
            layers: [osm]
        });
        const baseMaps = {
            'OpenStreetMap': osm,
            'Satellite': esriSat,
            'Terrain': stamenTerrain
        };
        L.control.layers(baseMaps).addTo(this.map);
        L.Control.geocoder().addTo(this.map);
        // Draw control
        const drawnItems = new L.FeatureGroup();
        this.map.addLayer(drawnItems);
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: true,
                polyline: false,
                rectangle: false,
                circle: false,
                marker: true
            },
            edit: {
                featureGroup: drawnItems
            }
        });
        this.map.addControl(drawControl);
        // --- End Advanced Map Initialization ---
        this.renderMap();
        this.$nextTick(() => this.invalidateMapSize());
        // Notify C# that the map is ready
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage('MAP_READY');
        }
        // Add production legend
        this.addProductionLegend();
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.debouncedInvalidateMapSize);
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    },
    methods: {
        initMap() {
            if (this.map) return;
            this.map = L.map(this.$refs.map, {
                center: [5.5, 7.0],
                zoom: 9,
                layers: [
                    L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=gaWUiYUc4XGStIPAFnMT', {
                        attribution: '© MapTiler © OpenStreetMap contributors',
                        maxZoom: 19
                    })
                ]
            });
            this.renderMap();
            this.$nextTick(() => this.invalidateMapSize());
            // Notify C# that the map is ready
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage('MAP_READY');
            }
        },
        getProductionColor(rate) {
            if (rate > 100) return '#e6194b'; // high
            if (rate > 50) return '#ffe119';  // medium
            return '#3cb44b';                 // low
        },
        computeConvexHull(points) {
            points.sort((a, b) => a.lat === b.lat ? a.lng - b.lng : a.lat - b.lat);
            const cross = (o, a, b) => (a.lat - o.lat) * (b.lng - o.lng) - (a.lng - o.lng) * (b.lat - o.lat);
            const lower = [], upper = [];
            for (let p of points) {
                while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
                lower.push(p);
            }
            for (let i = points.length - 1; i >= 0; i--) {
                const p = points[i];
                while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
                upper.push(p);
            }
            upper.pop(); lower.pop();
            return lower.concat(upper);
        },
        renderFlowStations() {
            // Clear existing flow station markers
            this.flowStationMarkers.forEach(marker => this.map.removeLayer(marker));
            this.flowStationMarkers = [];

            if (!this.flowStations || !Array.isArray(this.flowStations)) return;

            this.flowStations.forEach(fs => {
                if (!fs?.location || fs.location.lat == null || fs.location.lng == null) return;
                
                const { lat, lng } = fs.location;
                const flowStationMarker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    })
                }).addTo(this.map);
                
                flowStationMarker.bindPopup(`
                    <b>Flow Station:</b> ${fs.name}<br>
                    <b>Location:</b> ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>
                `);
                
                this.flowStationMarkers.push(flowStationMarker);
            });
        },
        renderWellToFlowStationLines() {
            // Clear existing flow lines
            this.flowLines.forEach(line => this.map.removeLayer(line));
            this.flowLines = [];

            if (!this.fields || !Array.isArray(this.fields)) return;

            // Create a map of flow station locations for quick lookup
            const flowStationMap = new Map();
            if (this.flowStations && Array.isArray(this.flowStations)) {
                this.flowStations.forEach(fs => {
                    if (fs?.location) {
                        flowStationMap.set(fs.id, fs.location);
                    }
                });
            }

            // Draw lines from wells to their flow stations
            this.fields.forEach(field => {
                if (!field?.wells || !Array.isArray(field.wells)) return;

                field.wells.forEach(well => {
                    if (!well?.location || !well.flowStationId) return;

                    const flowStationLocation = flowStationMap.get(well.flowStationId);
                    if (!flowStationLocation) return;

                    // Create polyline from well to flow station
                    const line = L.polyline([
                        [well.location.lat, well.location.lng],
                        [flowStationLocation.lat, flowStationLocation.lng]
                    ], {
                        color: '#ff6b35',
                        weight: 2,
                        opacity: 0.7,
                        dashArray: '5, 5'
                    }).addTo(this.map);

                    // Add popup to show connection info
                    line.bindPopup(`
                        <b>Well:</b> ${well.name}<br>
                        <b>Flow Station:</b> ${well.flowStationName || 'Unknown'}<br>
                        <b>Distance:</b> ${this.calculateDistance(well.location, flowStationLocation).toFixed(2)} km
                    `);

                    this.flowLines.push(line);
                });
            });
        },
        calculateDistance(point1, point2) {
            const R = 6371; // Earth's radius in km
            const dLat = (point2.lat - point1.lat) * Math.PI / 180;
            const dLng = (point2.lng - point1.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                     Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        },
        renderField(field, showRoute = true) {
            if (!field?.location || field.location.lat == null || field.location.lng == null) return;
            const { lat, lng } = field.location;
            const fieldMarker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                })
            }).addTo(this.map);
            fieldMarker.bindPopup(`
          <b>Field:</b> ${field.name || field.fieldName}<br>
          <b>Status:</b> ${field.status || ''}<br>
          <b>Formation:</b> ${field.formation || ''}<br>
          <b>Block:</b> ${field.block || ''}<br>
          <b>Estimated Reserves:</b> ${field.estimatedReserves || 'N/A'}<br>
        `);
            const routePoints = [];
            if (Array.isArray(field.wells)) {
                field.wells.forEach(well => {
                    if (!well?.location || well.location.lat == null || well.location.lng == null) return;
                    const { lat, lng } = well.location;
                    let size = 32;
                    if (typeof well.productionRate === 'number' && well.productionRate > 0) {
                        size = 32 + Math.min(18, Math.sqrt(well.productionRate));
                    }
                    const iconColor = this.getProductionColor(well.productionRate);
                    const wellMarker = L.circleMarker([lat, lng], {
                        radius: size / 4,
                        fillColor: iconColor,
                        color: '#333',
                        weight: 1,
                        fillOpacity: 0.7
                    }).addTo(this.map);
                    wellMarker.bindPopup(`
              <b>Well:</b> ${well.name}<br>
              <b>Type:</b> ${well.type}<br>
              <b>Status:</b> ${well.status}<br>
              <b>Production Rate:</b> ${well.productionRate || 'N/A'}<br>
              <b>Depth:</b> ${well.depth} m<br>
              <b>Formation:</b> ${well.formation}<br>
              <b>Block:</b> ${well.block}<br>
              <b>Flow Station:</b> ${well.flowStationName || 'N/A'}<br>
            `);
                    routePoints.push(L.latLng(lat, lng));
                    if (Array.isArray(well.trajectory) && well.trajectory.length > 1) {
                        const trajLatLngs = well.trajectory.map(pt => [pt.lat, pt.lng]);
                        const trajLine = L.polyline(trajLatLngs, {
                            color: '#666',
                            weight: 1,
                            opacity: 0.5,
                            dashArray: '3, 3'
                        }).addTo(this.map);
                        trajLine.bindPopup(`<b>Well Trajectory:</b> ${well.name}`);
                    }
                    this.wellMarkers.push(wellMarker);
                });
            }
            if (showRoute && routePoints.length > 2) {
                const hull = this.computeConvexHull(routePoints.map(p => ({ lat: p.lat, lng: p.lng })));
                if (hull.length > 2) {
                    const hullPolygon = L.polygon(hull.map(p => [p.lat, p.lng]), {
                        color: field.color || '#ff0000',
                        weight: 2,
                        fillColor: field.color || '#ff0000',
                        fillOpacity: 0.1
                    }).addTo(this.map);
                    hullPolygon.bindPopup(`<b>Field Boundary:</b> ${field.name || field.fieldName}`);
                }
            }
        },
        clearMap() {
            this.wellMarkers.forEach(marker => this.map.removeLayer(marker));
            this.wellMarkers = [];
            this.flowStationMarkers.forEach(marker => this.map.removeLayer(marker));
            this.flowStationMarkers = [];
            this.flowLines.forEach(line => this.map.removeLayer(line));
            this.flowLines = [];
            if (this.boundaryLayer) {
                this.map.removeLayer(this.boundaryLayer);
                this.boundaryLayer = null;
            }
        },
        addProductionLegend() {
            const legend = L.control({ position: 'bottomright' });
            legend.onAdd = () => {
                const div = L.DomUtil.create('div', 'info legend');
                div.style.backgroundColor = 'white';
                div.style.padding = '10px';
                div.style.border = '2px solid rgba(0,0,0,0.2)';
                div.style.borderRadius = '5px';
                div.innerHTML = `
          <h4>Production Rate</h4>
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="width: 20px; height: 20px; background-color: #3cb44b; border-radius: 50%; margin-right: 10px;"></div>
            <span>Low (&lt; 50)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="width: 20px; height: 20px; background-color: #ffe119; border-radius: 50%; margin-right: 10px;"></div>
            <span>Medium (50-100)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 5px 0;">
            <div style="width: 20px; height: 20px; background-color: #e6194b; border-radius: 50%; margin-right: 10px;"></div>
            <span>High (&gt; 100)</span>
          </div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ccc;">
            <div style="display: flex; align-items: center; margin: 5px 0;">
              <div style="width: 20px; height: 20px; background-color: #4363d8; border-radius: 50%; margin-right: 10px;"></div>
              <span>Flow Stations</span>
            </div>
            <div style="display: flex; align-items: center; margin: 5px 0;">
              <div style="width: 20px; height: 20px; background-color: #3cb44b; border-radius: 50%; margin-right: 10px;"></div>
              <span>Fields</span>
            </div>
          </div>
        `;
                return div;
            };
            legend.addTo(this.map);
            this.productionLegend = legend;
        },
        renderMap() {
            if (!this.map) return;
            this.clearMap();
            if (this.boundary && this.boundary.length > 2) {
                const boundaryLatLngs = this.boundary.map(pt => [pt.lat, pt.lng]);
                this.boundaryLayer = L.polygon(boundaryLatLngs, {
                    color: '#000',
                    weight: 2,
                    fillColor: '#000',
                    fillOpacity: 0.1
                }).addTo(this.map);
                this.boundaryLayer.bindPopup('<b>Concession Boundary</b>');
            }
            if (this.fields && Array.isArray(this.fields)) {
                this.fields.forEach(field => this.renderField(field));
            }
            // Render flow stations and well-to-flow-station lines
            this.renderFlowStations();
            this.renderWellToFlowStationLines();
            if (this.route && this.route.source && this.route.dest) {
                this.renderRoute(this.route);
            }
        },
        renderRoute(route) {
            if (this.routeLine) {
                this.map.removeLayer(this.routeLine);
            }
            if (this.routePopup) {
                this.map.removeLayer(this.routePopup);
            }
            if (this.routingControl) {
                this.map.removeControl(this.routingControl);
            }
            const sourceWell = this.findWellByName(route.source);
            const destWell = this.findWellByName(route.dest);
            if (sourceWell && destWell) {
                this.routingControl = L.Routing.control({
                    waypoints: [
                        L.latLng(sourceWell.location.lat, sourceWell.location.lng),
                        L.latLng(destWell.location.lat, destWell.location.lng)
                    ],
                    routeWhileDragging: true,
                    showAlternatives: false,
                    fitSelectedRoutes: true,
                    lineOptions: {
                        styles: [{ color: '#ff6b35', weight: 6, opacity: 0.8 }]
                    }
                }).addTo(this.map);
                this.routeLine = this.routingControl.getPlan();
                this.routePopup = L.popup()
                    .setLatLng([(sourceWell.location.lat + destWell.location.lat) / 2, (sourceWell.location.lng + destWell.location.lng) / 2])
                    .setContent(`
            <b>Route:</b> ${route.source} to ${route.dest}<br>
            <b>Type:</b> ${route.type}<br>
            <b>Distance:</b> ${this.calculateDistance(sourceWell.location, destWell.location).toFixed(2)} km
          `)
                    .openOn(this.map);
            }
        },
        findWellByName(name) {
            if (!this.fields || !Array.isArray(this.fields)) return null;
            for (const field of this.fields) {
                if (field.wells && Array.isArray(field.wells)) {
                    const well = field.wells.find(w => w.name === name);
                    if (well) return well;
                }
            }
            return null;
        },
        openRouteModal() {
            this.$emit('open-route-modal');
        },
        invalidateMapSize() {
            if (this._resizeTimeout) {
                clearTimeout(this._resizeTimeout);
            }
            this._resizeTimeout = setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        },
        focusOnField(fieldName) {
            if (!fieldName || !this.map) return;
            const field = this.fields?.find(f => f.name === fieldName || f.fieldName === fieldName);
            if (field?.location) {
                this.map.setView([field.location.lat, field.location.lng], 12);
            }
        }
    },
    template: `
      <div class="bg-white rounded-lg shadow overflow-hidden w-full" style="height: 60vh; min-height: 400px; position: relative;">
        <div ref="map" class="w-full h-full" style="height: 100%;"></div>
        <div class="absolute left-4 top-4 z-20 bg-white bg-opacity-90 rounded shadow p-2 text-xs flex flex-col gap-2">
          <div><span style="display:inline-block;width:12px;height:12px;background:blue;border-radius:50%;margin-right:4px;"></span>Well</div>
          <div><span style="display:inline-block;width:12px;height:12px;background:orange;border-radius:50%;margin-right:4px;border:2px solid #b45309;"></span>Flow Station</div>
          <div><svg width="24" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#b45309" stroke-width="2" stroke-dasharray="6,8"/><polygon points="20,0 24,4 20,8" fill="#b45309"/></svg>Flow Line</div>
        </div>
      </div>
    `
};