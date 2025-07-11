window.Sidebar = {
    name: 'Sidebar',
    props: ['fields', 'filters', 'onFilterChange'],
    template: `
    <aside class="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <h2 class="font-bold text-lg mb-2">Filter Assets, Fields & Wells</h2>
        <div class="mb-4">
          <label class="block text-xs font-semibold mb-1">Asset (OML)</label>
          <select class="w-full border rounded p-2" @change="onFilterChange('Asset (OML)', $event.target.value)">
            <option value="">All</option>
            <option v-for="opt in filters['Asset (OML)']" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-semibold mb-1">Field</label>
          <select class="w-full border rounded p-2" @change="onFilterChange('Field', $event.target.value)">
            <option value="">All</option>
            <option v-for="opt in filters['Field']" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-semibold mb-1">Well</label>
          <select class="w-full border rounded p-2" @change="onFilterChange('Well', $event.target.value)">
            <option value="">All</option>
            <option v-for="opt in filters['Well']" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-semibold mb-1">Well Status</label>
          <select class="w-full border rounded p-2" @change="onFilterChange('Well Status', $event.target.value)">
            <option value="">All</option>
            <option v-for="opt in filters['Well Status']" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
      </div>

      <!-- Field Selection -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="font-bold text-lg mb-2">Fields</h2>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div v-for="field in fields" :key="field.id || field.name" 
               class="border rounded p-3 cursor-pointer hover:bg-blue-50 transition-colors"
               @click="selectField(field)">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-sm">{{ field.name || field.fieldName }}</h3>
                <p class="text-xs text-gray-600">{{ field.operatorName || 'Unknown Operator' }}</p>
                <p class="text-xs text-gray-500">{{ field.wells ? field.wells.length : 0 }} wells</p>
              </div>
              <div class="flex items-center gap-2">
                <span :class="['inline-block w-3 h-3 rounded-full']" 
                      :style="{ backgroundColor: field.color || '#3b82f6' }"></span>
                <span class="text-xs">{{ field.status || 'Active' }}</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-gray-600">
              <p><strong>Formation:</strong> {{ field.formation || 'N/A' }}</p>
              <p><strong>Block:</strong> {{ field.block || 'N/A' }}</p>
              <p><strong>Reserves:</strong> {{ formatReserves(field.estimatedReserves) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Well Details -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="font-bold text-lg mb-2">Well Details</h2>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div v-for="well in selectedFieldWells" :key="well.id" 
               class="border rounded p-2 text-xs">
            <div class="flex items-center justify-between mb-1">
              <span class="font-semibold">{{ well.name }}</span>
              <span :class="['px-2 py-1 rounded text-xs', getStatusClass(well.status)]">
                {{ well.status }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-1 text-gray-600">
              <div><strong>Type:</strong> {{ well.type }}</div>
              <div><strong>Depth:</strong> {{ well.depth }}m</div>
              <div><strong>Production:</strong> {{ well.productionRate || 0 }} bbl/d</div>
              <div><strong>Flow Station:</strong> {{ well.flowStationName || 'N/A' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Well Status Legend -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="font-bold text-lg mb-2">Well Status Legend</h2>
        <div v-for="status in ['Active','Inactive','Abandoned']" :key="status" class="flex items-center gap-2 mb-2">
          <span :class="['inline-block w-4 h-4 rounded', statusColor(status)]"></span>
          <span class="text-xs">{{ status }}</span>
        </div>
      </div>

      <!-- Flow Stations -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="font-bold text-lg mb-2">Flow Stations</h2>
        <div class="space-y-2">
          <div v-for="fs in flowStations" :key="fs.id" class="border rounded p-2 text-xs">
            <div class="font-semibold">{{ fs.name }}</div>
            <div class="text-gray-600">
              <div><strong>Location:</strong> {{ formatLocation(fs.location) }}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  `,
    data() {
        return {
            selectedField: null
        };
    },
    computed: {
        selectedFieldWells() {
            if (!this.selectedField) return [];
            return this.selectedField.wells || [];
        },
        flowStations() {
            // Extract flow stations from fields data
            const flowStationMap = new Map();
            this.fields.forEach(field => {
                if (field.wells) {
                    field.wells.forEach(well => {
                        if (well.flowStationId && well.flowStationName) {
                            flowStationMap.set(well.flowStationId, {
                                id: well.flowStationId,
                                name: well.flowStationName,
                                location: well.location // Using well location as proxy
                            });
                        }
                    });
                }
            });
            return Array.from(flowStationMap.values());
        }
    },
    methods: {
        statusColor(status) {
            const colors = {
                'Active': 'bg-green-500',
                'Inactive': 'bg-yellow-500',
                'Abandoned': 'bg-red-500'
            };
            return colors[status] || 'bg-gray-400';
        },
        getStatusClass(status) {
            const classes = {
                'Active': 'bg-green-100 text-green-800',
                'Inactive': 'bg-yellow-100 text-yellow-800',
                'Abandoned': 'bg-red-100 text-red-800'
            };
            return classes[status] || 'bg-gray-100 text-gray-800';
        },
        selectField(field) {
            this.selectedField = field;
            // Emit field selection event
            this.$emit('field-selected', field.name || field.fieldName);
        },
        formatReserves(reserves) {
            if (!reserves) return 'N/A';
            if (reserves >= 1000000000) {
                return (reserves / 1000000000).toFixed(1) + ' B BOE';
            } else if (reserves >= 1000000) {
                return (reserves / 1000000).toFixed(1) + ' M BOE';
            } else {
                return reserves.toLocaleString() + ' BOE';
            }
        },
        formatLocation(location) {
            if (!location) return 'N/A';
            return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
        }
    }
};