window.MapContainer = {
    name: 'MapContainer',
    props: ['fields', 'boundary', 'visible', 'flowStations', 'route'],
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
            `);
            routePoints.push(L.latLng(lat, lng));
            if (Array.isArray(well.trajectory) && well.trajectory.length > 1) {
              const trajLatLngs = well.trajectory.map(pt => [pt.lat, pt.lng]);
              L.polyline(trajLatLngs, {
                color: '#0074D9',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 5'
              }).addTo(this.map);
            }
          });
        }
        if (routePoints.length > 2) {
          const hullPoints = this.computeConvexHull(routePoints.map(p => ({ lat: p.lat, lng: p.lng })));
          const latLngs = hullPoints.map(p => [p.lat, p.lng]);
          const polygon = L.polygon(latLngs, {
            color: field.color || '#000000',
            fillColor: field.color || '#000000',
            fillOpacity: 0.3
          }).addTo(this.map);
          polygon.bindTooltip(`Field: ${field.name || field.fieldName}<br>Wells: ${field.wells.length}`, { sticky: true });
        }
        if (showRoute && routePoints.length > 1) {
          if (this.routingControl) {
            this.map.removeControl(this.routingControl);
            this.routingControl = null;
          }
          this.routingControl = L.Routing.control({
            waypoints: routePoints,
            routeWhileDragging: false,
            draggableWaypoints: false,
            addWaypoints: false,
            createMarker: () => null
          }).addTo(this.map);
        }
      },
      clearMap() {
        this.map.eachLayer(layer => {
          if (layer instanceof L.Marker || layer instanceof L.Polygon || (layer instanceof L.Polyline && layer.options.className === 'routing-line')) {
            this.map.removeLayer(layer);
          }
        });
        if (this.routingControl) {
          this.map.removeControl(this.routingControl);
          this.routingControl = null;
        }
      },
      addProductionLegend() {
        if (this.productionLegend) {
          this.map.removeControl(this.productionLegend);
        }
        this.productionLegend = L.control({ position: 'bottomright' });
        this.productionLegend.onAdd = function () {
          const div = L.DomUtil.create('div', 'legend');
          div.innerHTML = `
            <b>Production Rate</b><br>
            <span style="display:inline-block;width:16px;height:16px;background:#e6194b;border-radius:8px;margin-right:4px;"></span> High (&gt;100)<br>
            <span style="display:inline-block;width:16px;height:16px;background:#ffe119;border-radius:8px;margin-right:4px;"></span> Medium (&gt;50)<br>
            <span style="display:inline-block;width:16px;height:16px;background:#3cb44b;border-radius:8px;margin-right:4px;"></span> Low (&le;50)<br>
          `;
          return div;
        };
        this.productionLegend.addTo(this.map);
      },
      renderMap() {
        this.clearMap();
        // Render all fields and wells
        (this.fields || []).forEach(field => this.renderField(field, false));
      },
      openRouteModal() {
        this.$emit('open-route-modal');
      },
      invalidateMapSize() {
        if (this.map) {
          this.map.invalidateSize();
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
        <!-- Removed Open Route Modal button -->
      </div>
    `
  };