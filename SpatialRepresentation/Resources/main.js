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
        AnalyticsPanel: window.AnalyticsPanel,
        InfoModal: window.InfoModal,
        RoutesModal: window.RoutesModal,
        StatisticsModal: window.StatisticsModal
    },
    setup() {
        fields = ref([]);
        wells = ref([]);
        boundary = ref([]);
        const showRouteModal = ref(false);
        filteredFields = ref([]);
        const filters = ref({
            'Asset (OML)': ['OML 1', 'OML 2', 'OML 3'],
            'Field': [],
            'Well': [],
            'Well Status': ['Active', 'Inactive', 'Abandoned'],
        });
        const activeTab = ref('Map');

        // Mock flow stations with coordinates (distinct clusters for each field)
        const flowStations = ref([
            { id: 'FS1', name: 'Flow Station Alpha', field: 'Field A', location: { lat: 5.55, lng: 7.05 } }, // Cluster 1 (near Enugu)
            { id: 'FS2', name: 'Flow Station Beta', field: 'Field B', location: { lat: 5.35, lng: 6.25 } },  // Cluster 2 (near Warri)
            { id: 'FS3', name: 'Flow Station Gamma', field: 'Field C', location: { lat: 5.95, lng: 6.45 } }  // Cluster 3 (near Makurdi)
        ]);

        // Expanded mock hierarchical data with many wells per field, each linked to a flow station in the same field and close in coordinates
        const assets = ref([
            {
                name: 'OML 1',
                fields: [
                    {
                        name: 'Field A',
                        wells: [
                            { name: 'Well 1', status: 'Active', production: [1000, 1200, 1100, 1300, 1250], location: { lat: 5.56, lng: 7.06 }, flowStationId: 'FS1', flowStationName: 'Flow Station Alpha' },
                            { name: 'Well 2', status: 'Inactive', production: [0, 0, 0, 0, 0], location: { lat: 5.54, lng: 7.04 }, flowStationId: 'FS1', flowStationName: 'Flow Station Alpha' },
                            { name: 'Well 3', status: 'Active', production: [900, 950, 1000, 1100, 1050], location: { lat: 5.55, lng: 7.07 }, flowStationId: 'FS1', flowStationName: 'Flow Station Alpha' },
                            { name: 'Well 4', status: 'Abandoned', production: [0, 0, 0, 0, 0], location: { lat: 5.57, lng: 7.05 }, flowStationId: 'FS1', flowStationName: 'Flow Station Alpha' }
                        ]
                    },
                    {
                        name: 'Field B',
                        wells: [
                            { name: 'Well 5', status: 'Active', production: [800, 850, 900, 950, 1000], location: { lat: 5.36, lng: 6.26 }, flowStationId: 'FS2', flowStationName: 'Flow Station Beta' },
                            { name: 'Well 6', status: 'Inactive', production: [0, 0, 0, 0, 0], location: { lat: 5.34, lng: 6.24 }, flowStationId: 'FS2', flowStationName: 'Flow Station Beta' },
                            { name: 'Well 7', status: 'Active', production: [1100, 1150, 1200, 1250, 1300], location: { lat: 5.35, lng: 6.27 }, flowStationId: 'FS2', flowStationName: 'Flow Station Beta' },
                            { name: 'Well 8', status: 'Abandoned', production: [0, 0, 0, 0, 0], location: { lat: 5.37, lng: 6.25 }, flowStationId: 'FS2', flowStationName: 'Flow Station Beta' }
                        ]
                    }
                ]
            },
            {
                name: 'OML 2',
                fields: [
                    {
                        name: 'Field C',
                        wells: [
                            { name: 'Well 9', status: 'Active', production: [1200, 1250, 1300, 1350, 1400], location: { lat: 6.26, lng: 7.46 }, flowStationId: 'FS3', flowStationName: 'Flow Station Gamma' },
                            { name: 'Well 10', status: 'Inactive', production: [0, 0, 0, 0, 0], location: { lat: 6.24, lng: 7.44 }, flowStationId: 'FS3', flowStationName: 'Flow Station Gamma' },
                            { name: 'Well 11', status: 'Active', production: [950, 1000, 1050, 1100, 1150], location: { lat: 6.25, lng: 7.47 }, flowStationId: 'FS3', flowStationName: 'Flow Station Gamma' },
                            { name: 'Well 12', status: 'Abandoned', production: [0, 0, 0, 0, 0], location: { lat: 6.27, lng: 7.45 }, flowStationId: 'FS3', flowStationName: 'Flow Station Gamma' }
                        ]
                    }
                ]
            }
        ]);

        // Add topWellsChart for Top Producing Wells
        const topWellsChart = ref({
            labels: [],
            datasets: [{
                label: 'Total Production (bbl)',
                data: [],
                backgroundColor: ['#6366f1', '#3b82f6', '#22c55e', '#eab308', '#f59e42']
            }]
        });

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

        const currentRoute = ref(null); // { source, dest, type, distance, time, meta }

        function updateCharts() {
            // Get current selections
            const selectedAsset = filters.value['Asset (OML)'];
            const selectedField = filters.value['Field'];
            const selectedWell = filters.value['Well'];

            // Asset Chart: sum production for each asset
            const assetLabels = assets.value.map(a => a.name);
            const assetData = assets.value.map(a => a.fields.reduce((sum, f) => sum + f.wells.reduce((wSum, w) => wSum + w.production.reduce((pSum, p) => pSum + p, 0), 0), 0));
            assetChart.value = {
                labels: assetLabels,
                datasets: [{
                    label: 'Total Production (bbl)',
                    data: assetData,
                    backgroundColor: ['#3b82f6', '#22c55e', '#eab308', '#f59e42', '#10b981', '#6366f1']
                }]
            };

            // Field Chart: count wells per field (filtered by asset if selected)
            let fieldsList = [];
            if (selectedAsset) {
                const asset = assets.value.find(a => a.name === selectedAsset);
                fieldsList = asset ? asset.fields : [];
            } else {
                fieldsList = assets.value.flatMap(a => a.fields);
            }
            const fieldLabels = fieldsList.map(f => f.name);
            const fieldData = fieldsList.map(f => f.wells ? f.wells.length : 0);
            fieldChart.value = {
                labels: fieldLabels.length ? fieldLabels : ['No data'],
                datasets: [{
                    label: 'Wells',
                    data: fieldData.length ? fieldData : [0],
                    backgroundColor: ['#f59e42', '#10b981', '#6366f1', '#eab308', '#22c55e', '#ef4444']
                }]
            };

            // Well Chart: status distribution (filtered by field if selected)
            let wellsList = [];
            if (selectedField) {
                wellsList = fieldsList.find(f => f.name === selectedField)?.wells || [];
            } else {
                wellsList = fieldsList.flatMap(f => f.wells);
            }
            if (selectedWell) {
                wellsList = wellsList.filter(w => w.name === selectedWell);
            }
            const statusCounts = { 'Active': 0, 'Inactive': 0, 'Abandoned': 0 };
            wellsList.forEach(w => { statusCounts[w.status] = (statusCounts[w.status] || 0) + 1; });
            wellChart.value = {
                labels: Object.keys(statusCounts),
                datasets: [{
                    label: 'Wells',
                    data: Object.values(statusCounts),
                    backgroundColor: ['#22c55e', '#eab308', '#ef4444']
                }]
            };

            // Production Chart: sum production for all filtered wells by month
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
            const monthlyProduction = [0, 0, 0, 0, 0];
            wellsList.forEach(w => w.production.forEach((p, i) => monthlyProduction[i] += p));
            productionChart.value = {
                labels: months,
                datasets: [{
                    label: 'Production (bbl)',
                    data: monthlyProduction,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.2)',
                    fill: true
                }]
            };

            // Top Producing Wells: top 5 wells by total production
            const allWells = assets.value.flatMap(a => a.fields.flatMap(f => f.wells));
            const topWells = allWells.map(w => ({
                name: w.name,
                total: w.production.reduce((a, b) => a + b, 0)
            })).sort((a, b) => b.total - a.total).slice(0, 5);
            topWellsChart.value = {
                labels: topWells.length ? topWells.map(w => w.name) : ['No data'],
                datasets: [{
                    label: 'Total Production (bbl)',
                    data: topWells.length ? topWells.map(w => w.total) : [0],
                    backgroundColor: ['#6366f1', '#3b82f6', '#22c55e', '#eab308', '#f59e42']
                }]
            };
        }

        function updateFilters() {
            // Asset (OML)
            filters.value['Asset (OML)'] = assets.value.map(a => a.name);
            // Field
            let fieldsList = [];
            if (filters.value['Asset (OML)'] && filters.value['Asset (OML)'].length && filters.value['Asset (OML)'].includes(filters.value['Asset (OML)'])) {
                const asset = assets.value.find(a => a.name === filters.value['Asset (OML)']);
                fieldsList = asset ? asset.fields : [];
            } else {
                fieldsList = assets.value.flatMap(a => a.fields);
            }
            filters.value['Field'] = fieldsList.map(f => f.name);
            // Well
            let wellsList = [];
            if (filters.value['Field'] && filters.value['Field'].length && filters.value['Field'].includes(filters.value['Field'])) {
                const field = fieldsList.find(f => f.name === filters.value['Field']);
                wellsList = field ? field.wells : [];
            } else {
                wellsList = fieldsList.flatMap(f => f.wells);
            }
            filters.value['Well'] = wellsList.map(w => w.name);
            // Well Status
            const statuses = new Set(wellsList.map(w => w.status));
            filters.value['Well Status'] = Array.from(statuses);
        }

        function onFilterChange(key, value) {
            if (key === 'Asset (OML)') {
                filters.value['Asset (OML)'] = value;
                filters.value['Field'] = '';
                filters.value['Well'] = '';
            } else if (key === 'Field') {
                filters.value['Field'] = value;
                filters.value['Well'] = '';
            } else if (key === 'Well') {
                filters.value['Well'] = value;
            } else if (key === 'Well Status') {
                filters.value['Well Status'] = value;
            }
            updateFilters();
            updateCharts();
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
        function handleAppHeaderEvent(event) {
            if (event === 'open-route-modal') openRouteModal();
            if (event === 'show-info') showInfoModal.value = true;
            if (event === 'show-routes') showRoutesModal.value = true;
            if (event === 'show-statistics') showStatisticsModal.value = true;
        }
        function handleCreateRoute({ source, dest, type }) {
            // Find wells by id
            const allWells = assets.value.flatMap(a => a.fields.flatMap(f => f.wells));
            const src = allWells.find(w => w.name === source || w.id === source);
            const dst = allWells.find(w => w.name === dest || w.id === dest);
            if (!src || !dst) return;
            // Calculate distance (Haversine formula)
            function toRad(x) { return x * Math.PI / 180; }
            const R = 6371e3; // meters
            const φ1 = toRad(src.location.lat), φ2 = toRad(dst.location.lat);
            const Δφ = toRad(dst.location.lat - src.location.lat);
            const Δλ = toRad(dst.location.lng - src.location.lng);
            const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // meters
            // Estimate time (simple): walking 5km/h, driving 50km/h, cycling 15km/h
            let speed = 5; // km/h
            if (type === 'driving') speed = 50;
            else if (type === 'cycling') speed = 15;
            const timeHrs = distance / 1000 / speed;
            const timeMin = timeHrs * 60;
            // Store route info
            currentRoute.value = {
                source: src,
                dest: dst,
                type,
                distance,
                time: timeMin,
                meta: {
                    start: src.location,
                    end: dst.location
                }
            };
        }

        // Expose for C# integration
        window.filterByField = handleFieldChange;
        window.showRouteModal = openRouteModal;

        updateCharts();
        updateFilters();

        // Wells per Field Pie Chart
        const wellsPerFieldPieChart = ref({
            labels: ['Field A', 'Field B', 'Field C'],
            datasets: [{
                label: 'Wells',
                data: [4, 4, 4],
                backgroundColor: ['#f59e42', '#10b981', '#6366f1']
            }]
        });
        // Well Status Distribution Pie Chart
        const wellStatusPieChart = ref({
            labels: ['Active', 'Inactive', 'Abandoned'],
            datasets: [{
                label: 'Wells',
                data: [6, 3, 3],
                backgroundColor: ['#22c55e', '#eab308', '#ef4444']
            }]
        });
        // Active Wells Over Time Line Chart
        const activeWellsOverTimeChart = ref({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'Active Wells',
                data: [8, 9, 10, 11, 12],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59,130,246,0.2)',
                fill: true
            }]
        });
        // Production by Well Status Stacked Bar Chart
        const productionByStatusChart = ref({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [
                {
                    label: 'Active',
                    data: [5000, 6000, 7000, 8000, 9000],
                    backgroundColor: '#22c55e',
                    stack: 'Status'
                },
                {
                    label: 'Inactive',
                    data: [1000, 1200, 1100, 1300, 1250],
                    backgroundColor: '#eab308',
                    stack: 'Status'
                },
                {
                    label: 'Abandoned',
                    data: [200, 300, 250, 400, 350],
                    backgroundColor: '#ef4444',
                    stack: 'Status'
                }
            ]
        });

        const showInfoModal = ref(false);
        const showRoutesModal = ref(false);
        const showStatisticsModal = ref(false);
        function closeInfoModal() { showInfoModal.value = false; }
        function closeRoutesModal() { showRoutesModal.value = false; }
        function closeStatisticsModal() { showStatisticsModal.value = false; }

        return {
            fields, wells, boundary, showRouteModal, handleCreateRoute, filteredFields, closeRouteModal, filters, onFilterChange, activeTab, handleFieldChange,
            assetChart, fieldChart, wellChart, productionChart, campaignChart, topWellsChart, flowStations, currentRoute, wellsPerFieldPieChart, wellStatusPieChart, activeWellsOverTimeChart, productionByStatusChart,
            showInfoModal, showRoutesModal, showStatisticsModal, closeInfoModal, closeRoutesModal, closeStatisticsModal
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
      <AppHeader :fields="fields" @field-change="handleFieldChange" @open-route-modal="() => handleAppHeaderEvent('open-route-modal')" @show-info="() => handleAppHeaderEvent('show-info')" @show-routes="() => handleAppHeaderEvent('show-routes')" @show-statistics="() => handleAppHeaderEvent('show-statistics')" />
      <!-- Tabs -->
      <nav class="bg-blue-100 px-2 sm:px-6 py-2 flex flex-wrap space-x-2 sm:space-x-4 border-b border-blue-300">
        <button :class="['px-4 py-2 rounded-t font-semibold', activeTab === 'Map' ? 'bg-white shadow text-blue-900' : 'text-blue-900 hover:bg-white']" @click="activeTab = 'Map'">Map</button>
        <button :class="['px-4 py-2 rounded-t font-semibold', activeTab === 'Analytics' ? 'bg-white shadow text-blue-900' : 'text-blue-900 hover:bg-white']" @click="activeTab = 'Analytics'">Spatial Analytics</button>
      </nav>
      <!-- Main Content -->
      <div class="flex flex-1 flex-col lg:flex-row px-2 sm:px-6 py-4 space-y-4 lg:space-y-0 lg:space-x-4 w-full">
        <!-- Sidebar -->
        <Sidebar :fields="fields" :filters="filters" :onFilterChange="onFilterChange" class="w-full lg:w-72" />
        <!-- Tab Content -->
        <main class="flex-1 flex flex-col space-y-4 w-full">
          <template v-if="activeTab === 'Map'">
            <MapContainer :fields="filteredFields" :boundary="boundary" :visible="true" :flowStations="flowStations" :route="currentRoute" @open-route-modal="showRouteModal = true" class="flex-1 min-h-[300px] h-[40vh] md:h-[60vh]" />
          </template>
          <template v-else-if="activeTab === 'Analytics'">
            <div class="flex flex-col items-center w-full">
              <div class="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnalyticsPanel :chartData="fieldChart" title="Wells per Field (Bar)" type="bar" />
                <AnalyticsPanel :chartData="wellsPerFieldPieChart" title="Wells per Field (Pie)" type="pie" />
                <AnalyticsPanel :chartData="wellChart" title="Well Status Distribution (Bar)" type="bar" />
                <AnalyticsPanel :chartData="wellStatusPieChart" title="Well Status Distribution (Pie)" type="pie" />
                <AnalyticsPanel :chartData="productionChart" title="Monthly Production" type="line" />
                <AnalyticsPanel :chartData="activeWellsOverTimeChart" title="Active Wells Over Time" type="line" />
                <AnalyticsPanel :chartData="assetChart" title="Production by Asset" type="bar" />
                <AnalyticsPanel :chartData="productionByStatusChart" title="Production by Well Status" type="bar" />
                <AnalyticsPanel :chartData="campaignChart" title="Campaign Budgets" type="radar" />
                <AnalyticsPanel :chartData="topWellsChart" title="Top Producing Wells" type="bar" />
              </div>
            </div>
          </template>
        </main>
      </div>
      <RouteModal :wells="(wells && wells.length) ? wells : [{id: 'dummy1', name: 'Well Alpha'}, {id: 'dummy2', name: 'Well Beta'}]" :show="showRouteModal" @close="closeRouteModal" @create-route="handleCreateRoute" />
      <InfoModal :show="showInfoModal" @close="closeInfoModal" />
      <RoutesModal :show="showRoutesModal" @close="closeRoutesModal" />
      <StatisticsModal :show="showStatisticsModal" @close="closeStatisticsModal" />
    </div>
  `
}).mount('#app');