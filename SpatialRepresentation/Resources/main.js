// Define loadData BEFORE Vue app is created, so C# can always call it
let fields, wells, boundary, filteredFields;
window.loadData = (data) => {
    if (fields && wells && boundary && filteredFields) {
        fields.value = data.fields || [];
        boundary.value = data.concessionBoundary || [];
        wells.value = [];
        fields.value.forEach(f => (f.wells || []).forEach(w => wells.value.push(w)));
        filteredFields.value = fields.value;
    }
};

const { createApp, ref } = Vue;

createApp({
    components: {
        AppHeader: window.AppHeader,
        Sidebar: window.Sidebar,
        MapContainer: window.MapContainer,
        RouteModal: window.RouteModal,
        AnalyticsPanel: window.AnalyticsPanel
    },
    setup() {
        fields = ref([]);
        wells = ref([]);
        boundary = ref([]);
        const showRouteModal = ref(false);
        filteredFields = ref([]);
        const filters = ref({
            'Country': ['USA', 'UK', 'Norway'],
            'Field': ['Field A', 'Field B', 'Field C'],
            'Well Status': ['Active', 'Inactive', 'Abandoned'],
        });
        const activeTab = ref('Wells');

        // Chart data for Asset, Field, Well, Production, Campaign Info
        const assetChart = ref({
            labels: ['Asset 1', 'Asset 2', 'Asset 3'],
            datasets: [{
                label: 'Production (bbl)',
                data: [12000, 18000, 9000],
                backgroundColor: ['#3b82f6', '#22c55e', '#eab308']
            }]
        });
        const fieldChart = ref({
            labels: ['Field A', 'Field B', 'Field C'],
            datasets: [{
                label: 'Wells',
                data: [12, 8, 15],
                backgroundColor: ['#f59e42', '#10b981', '#6366f1']
            }]
        });
        const wellChart = ref({
            labels: ['Active', 'Inactive', 'Abandoned'],
            datasets: [{
                label: 'Wells',
                data: [20, 5, 2],
                backgroundColor: ['#22c55e', '#eab308', '#ef4444']
            }]
        });
        const productionChart = ref({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'Production (bbl)',
                data: [5000, 7000, 6000, 8000, 7500],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.2)',
                fill: true
            }]
        });
        const campaignChart = ref({
            labels: ['Campaign 1', 'Campaign 2', 'Campaign 3'],
            datasets: [{
                label: 'Budget (M$)',
                data: [2.5, 3.1, 1.8],
                backgroundColor: ['#a21caf', '#f43f5e', '#0ea5e9']
            }]
        });

        // Filtering logic
        function onFilterChange(key, value) {
            // Implement your filtering logic here
            // For now, just log
            console.log('Filter', key, value);
        }

        function handleFieldChange(fieldName) {
            if (!fieldName) {
                filteredFields.value = fields.value;
            } else {
                filteredFields.value = fields.value.filter(f => f.name === fieldName || f.fieldName === fieldName);
            }
        }

        // Modal logic
        function openRouteModal() { showRouteModal.value = true; }
        function closeRouteModal() { showRouteModal.value = false; }
        function handleCreateRoute({ source, dest, type }) {
            if (window.chrome && window.chrome.webview) {
                const message = `ROUTE_REQUEST:${source}:${dest}:${type}`;
                window.chrome.webview.postMessage(message);
            }
        }

        // Expose for C# integration
        window.filterByField = handleFieldChange;
        window.showRouteModal = openRouteModal;

        return {
            fields, wells, boundary, showRouteModal, handleCreateRoute, filteredFields, closeRouteModal, filters, onFilterChange, activeTab, handleFieldChange,
            assetChart, fieldChart, wellChart, productionChart, campaignChart
        };
    },
    mounted() {
        // Notify C# that the map/dashboard is ready
        if (window.chrome && window.chrome.webview) {
            window.chrome.webview.postMessage('MAP_READY');
        }
    },
    template: `
    <div class="min-h-screen bg-gray-100 flex flex-col">
      <AppHeader :fields="fields" @field-change="handleFieldChange" />
      <!-- Tabs -->
      <nav class="bg-blue-100 px-2 sm:px-6 py-2 flex flex-wrap space-x-2 sm:space-x-4 border-b border-blue-300">
        <button :class="['px-4 py-2 rounded-t font-semibold', activeTab === 'Wells' ? 'bg-white shadow text-blue-900' : 'text-blue-900 hover:bg-white']" @click="activeTab = 'Wells'">Wells</button>
        <button :class="['px-4 py-2 rounded-t font-semibold', activeTab === 'Fields' ? 'bg-white shadow text-blue-900' : 'text-blue-900 hover:bg-white']" @click="activeTab = 'Fields'">Fields</button>
        <button :class="['px-4 py-2 rounded-t font-semibold', activeTab === 'Routing' ? 'bg-white shadow text-blue-900' : 'text-blue-900 hover:bg-white']" @click="activeTab = 'Routing'">Routing</button>
        <button :class="['px-4 py-2 rounded-t font-semibold', activeTab === 'Analytics' ? 'bg-white shadow text-blue-900' : 'text-blue-900 hover:bg-white']" @click="activeTab = 'Analytics'">Spatial Analytics</button>
      </nav>
      <!-- Main Content -->
      <div class="flex flex-1 flex-col lg:flex-row px-2 sm:px-6 py-4 space-y-4 lg:space-y-0 lg:space-x-4 w-full">
        <!-- Sidebar -->
        <Sidebar :fields="fields" :filters="filters" :onFilterChange="onFilterChange" class="w-full lg:w-72" />
        <!-- Tab Content -->
        <main class="flex-1 flex flex-col space-y-4 w-full">
          <template v-if="activeTab === 'Wells'">
            <MapContainer :fields="filteredFields" :boundary="boundary" :visible="activeTab === 'Wells'" @open-route-modal="showRouteModal = true" class="flex-1 min-h-[300px] h-[40vh] md:h-[60vh]" />
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              <AnalyticsPanel :chartData="wellChart" title="Well Status Distribution" type="doughnut" />
              <AnalyticsPanel :chartData="productionChart" title="Monthly Production" type="line" />
            </div>
          </template>
          <template v-else-if="activeTab === 'Fields'">
            <MapContainer :fields="filteredFields" :boundary="boundary" :visible="activeTab === 'Fields'" @open-route-modal="showRouteModal = true" class="flex-1 min-h-[300px] h-[40vh] md:h-[60vh]" />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <AnalyticsPanel :chartData="fieldChart" title="Wells per Field" type="pie" />
              <AnalyticsPanel :chartData="assetChart" title="Production by Asset" type="bar" />
            </div>
          </template>
          <template v-else-if="activeTab === 'Routing'">
            <div class="flex flex-col items-center justify-center h-full py-10">
              <h2 class="text-xl font-bold mb-4">Routing Tools</h2>
              <p class="mb-4">Use the map and controls above to create and analyze well-to-well or field-to-field routes.</p>
              <button class="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded text-white" @click="showRouteModal = true">Open Route Modal</button>
            </div>
          </template>
          <template v-else-if="activeTab === 'Analytics'">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              <AnalyticsPanel :chartData="assetChart" title="Production by Asset" type="bar" />
              <AnalyticsPanel :chartData="fieldChart" title="Wells per Field" type="pie" />
              <AnalyticsPanel :chartData="wellChart" title="Well Status Distribution" type="doughnut" />
              <AnalyticsPanel :chartData="productionChart" title="Monthly Production" type="line" />
              <AnalyticsPanel :chartData="campaignChart" title="Campaign Budgets" type="radar" />
            </div>
          </template>
        </main>
      </div>
      <RouteModal :wells="wells" :show="showRouteModal" @close="closeRouteModal" @create-route="handleCreateRoute" />
    </div>
  `
}).mount('#app');