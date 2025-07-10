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
        routePopup: null
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
      if (this.visible) {
        this.initMap();
      }
      // Debounced resize handler
      this.debouncedInvalidateMapSize = () => {
        clearTimeout(this._resizeTimeout);
        this._resizeTimeout = setTimeout(() => this.invalidateMapSize(), 200);
      };
      window.addEventListener('resize', this.debouncedInvalidateMapSize);
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
      renderMap() {
        if (!this.map) return;
        // Remove old markers and polygons
        if (this.wellMarkers) this.wellMarkers.forEach(m => this.map.removeLayer(m));
        this.wellMarkers = [];
        if (this.boundaryLayer) this.map.removeLayer(this.boundaryLayer);
        if (this.flowStationMarkers) this.flowStationMarkers.forEach(m => this.map.removeLayer(m));
        this.flowStationMarkers = [];
        if (this.flowLines) this.flowLines.forEach(l => this.map.removeLayer(l));
        this.flowLines = [];
        if (this.routeLine) { this.map.removeLayer(this.routeLine); this.routeLine = null; }
        if (this.routePopup) { this.map.removeLayer(this.routePopup); this.routePopup = null; }

        // Draw wells (first)
        this.fields.forEach(field => {
          (field.wells || []).forEach(well => {
            if (well.location && well.location.lat && well.location.lng) {
              const marker = L.circleMarker([well.location.lat, well.location.lng], {
                color: 'blue',
                radius: 8,
                fillOpacity: 0.8
              }).addTo(this.map);
              marker.bindPopup(`<b>${well.name}</b><br>Status: ${well.status}<br>Type: ${well.type || ''}`);
              this.wellMarkers.push(marker);
            }
          });
        });

        // Draw flow stations (second)
        if (this.flowStations && this.flowStations.length) {
          this.flowStations.forEach(fs => {
            if (fs.location && fs.location.lat && fs.location.lng) {
              const marker = L.circleMarker([fs.location.lat, fs.location.lng], {
                color: '#b45309',
                fillColor: 'orange',
                fillOpacity: 1,
                radius: 10,
                weight: 3
              }).addTo(this.map);
              marker.bindPopup(`<b>${fs.name}</b><br>Flow Station`);
              if (!this.flowStationMarkers) this.flowStationMarkers = [];
              this.flowStationMarkers.push(marker);
            }
          });
        }

        // Draw flow lines/arrows (after markers)
        this.fields.forEach(field => {
          (field.wells || []).forEach(well => {
            if (well.location && well.location.lat && well.location.lng && well.flowStationId) {
              const fs = (this.flowStations || []).find(f => f.id === well.flowStationId);
              if (fs && fs.location && fs.location.lat && fs.location.lng) {
                // Dotted line
                const line = L.polyline([
                  [well.location.lat, well.location.lng],
                  [fs.location.lat, fs.location.lng]
                ], {
                  color: '#b45309',
                  dashArray: '6, 8',
                  weight: 2
                }).addTo(this.map);
                if (!this.flowLines) this.flowLines = [];
                this.flowLines.push(line);
                // Try to add arrowhead if PolylineDecorator is available
                if (window.L && L.polylineDecorator && L.Symbol && L.Symbol.arrowHead) {
                  const arrowHead = L.polylineDecorator(line, {
                    patterns: [
                      {
                        offset: '100%',
                        repeat: 0,
                        symbol: L.Symbol.arrowHead({ pixelSize: 12, polygon: false, pathOptions: { stroke: true, color: '#b45309', weight: 2 } })
                      }
                    ]
                  });
                  arrowHead.addTo(this.map);
                  this.flowLines.push(arrowHead);
                }
              }
            }
          });
        });

        // Draw route if present
        if (this.route && this.route.source && this.route.dest) {
          const src = this.route.source.location;
          const dst = this.route.dest.location;
          this.routeLine = L.polyline([
            [src.lat, src.lng],
            [dst.lat, dst.lng]
          ], {
            color: '#2563eb',
            weight: 4,
            opacity: 0.8
          }).addTo(this.map);
          // Add arrowhead if possible
          if (window.L && L.polylineDecorator && L.Symbol && L.Symbol.arrowHead) {
            const arrowHead = L.polylineDecorator(this.routeLine, {
              patterns: [
                {
                  offset: '100%',
                  repeat: 0,
                  symbol: L.Symbol.arrowHead({ pixelSize: 16, polygon: false, pathOptions: { stroke: true, color: '#2563eb', weight: 4 } })
                }
              ]
            });
            arrowHead.addTo(this.map);
          }
          // Show popup with metadata at midpoint
          const midLat = (src.lat + dst.lat) / 2;
          const midLng = (src.lng + dst.lng) / 2;
          const dist = this.route.distance > 1000 ? (this.route.distance/1000).toFixed(2) + ' km' : Math.round(this.route.distance) + ' m';
          const time = this.route.time > 60 ? (this.route.time/60).toFixed(1) + ' hr' : Math.round(this.route.time) + ' min';
          const meta = `<b>Route Info</b><br>From: ${this.route.source.name}<br>To: ${this.route.dest.name}<br>Distance: ${dist}<br>Est. Time: ${time}<br>Type: ${this.route.type}`;
          this.routePopup = L.popup({ closeButton: false, autoClose: false })
            .setLatLng([midLat, midLng])
            .setContent(meta)
            .openOn(this.map);
        }

        // Draw boundary
        if (this.boundary && this.boundary.length > 2) {
          this.boundaryLayer = L.polygon(this.boundary.map(pt => [pt.lat, pt.lng]), {
            color: 'blue', weight: 3, fill: false
          }).addTo(this.map);
        }
        // Force map redraw
        this.map.invalidateSize();
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
        <button @click="openRouteModal" class="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-600 text-white rounded shadow">Open Route Modal</button>
      </div>
    `
  };