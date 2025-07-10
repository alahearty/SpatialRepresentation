window.MapContainer = {
    name: 'MapContainer',
    props: ['fields', 'boundary', 'visible'],
    emits: ['open-route-modal'],
    data() {
      return {
        map: null,
        wellMarkers: [],
        boundaryLayer: null,
        _resizeTimeout: null
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
  
        // Draw wells
        this.fields.forEach(field => {
          (field.wells || []).forEach(well => {
            if (well.location && well.location.lat && well.location.lng) {
              const marker = L.circleMarker([well.location.lat, well.location.lng], {
                color: 'blue',
                radius: 8,
                fillOpacity: 0.8
              }).addTo(this.map);
              marker.bindPopup(`<b>${well.name}</b><br>Status: ${well.status}<br>Type: ${well.type}`);
              this.wellMarkers.push(marker);
            }
          });
        });
  
        // Draw boundary
        if (this.boundary && this.boundary.length > 2) {
          this.boundaryLayer = L.polygon(this.boundary.map(pt => [pt.lat, pt.lng]), {
            color: 'blue', weight: 3, fill: false
          }).addTo(this.map);
        }
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
        <button @click="openRouteModal" class="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-600 text-white rounded shadow">Open Route Modal</button>
      </div>
    `
  };