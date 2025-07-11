
// Statistics Modal
window.StatisticsModal = {
    name: 'StatisticsModal',
    props: ['show', 'statsType', 'statsData'],
    emits: ['close'],
    data() {
        return {
            selectedTab: 'overview'
        };
    },
    computed: {
        assetsList() {
            return this.statsData && this.statsData.assets ? this.statsData.assets : [];
        },
        fieldsList() {
            return this.assetsList.flatMap(asset => asset.fields.map(field => ({...field, asset: asset.name})));
        },
        wellsList() {
            return this.fieldsList.flatMap(field => (field.wells || []).map(well => ({...well, field: field.name, asset: field.asset})));
        },
        overviewStats() {
            const assets = this.assetsList;
            const totalFields = assets.reduce((sum, asset) => sum + (asset.fields?.length || 0), 0);
            const totalWells = assets.reduce((sum, asset) => sum + asset.fields.reduce((fSum, field) => fSum + (field.wells?.length || 0), 0), 0);
            return {
                totalAssets: assets.length,
                totalFields,
                totalWells
            };
        }
    },
    template: `
      <div v-if="show" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" style="z-index: 9999;">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">📊 Statistics</h3>
            <button @click="$emit('close')" class="text-2xl text-gray-500 hover:text-gray-700">&times;</button>
          </div>
          <div class="flex border-b mb-4">
            <button @click="selectedTab = 'overview'" :class="['px-4 py-2', selectedTab === 'overview' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-600']">Overview</button>
            <button @click="selectedTab = 'assets'" :class="['px-4 py-2', selectedTab === 'assets' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-600']">Assets</button>
            <button @click="selectedTab = 'fields'" :class="['px-4 py-2', selectedTab === 'fields' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-600']">Fields</button>
            <button @click="selectedTab = 'wells'" :class="['px-4 py-2', selectedTab === 'wells' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-600']">Wells</button>
          </div>
          <div v-if="selectedTab === 'overview'">
            <div class="mb-2"><b>Total Assets:</b> {{ overviewStats.totalAssets }}</div>
            <div class="mb-2"><b>Total Fields:</b> {{ overviewStats.totalFields }}</div>
            <div class="mb-2"><b>Total Wells:</b> {{ overviewStats.totalWells }}</div>
          </div>
          <div v-else-if="selectedTab === 'assets'">
            <table class="w-full text-left border">
              <thead><tr><th class="p-2 border-b">Asset</th><th class="p-2 border-b">Fields</th><th class="p-2 border-b">Wells</th></tr></thead>
              <tbody>
                <tr v-for="asset in assetsList" :key="asset.name">
                  <td class="p-2 border-b">{{ asset.name }}</td>
                  <td class="p-2 border-b">{{ asset.fields.length }}</td>
                  <td class="p-2 border-b">{{ asset.fields.reduce((sum, f) => sum + (f.wells ? f.wells.length : 0), 0) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="selectedTab === 'fields'">
            <table class="w-full text-left border">
              <thead><tr><th class="p-2 border-b">Field</th><th class="p-2 border-b">Asset</th><th class="p-2 border-b">Wells</th></tr></thead>
              <tbody>
                <tr v-for="field in fieldsList" :key="field.name + '-' + field.asset">
                  <td class="p-2 border-b">{{ field.name }}</td>
                  <td class="p-2 border-b">{{ field.asset }}</td>
                  <td class="p-2 border-b">{{ field.wells ? field.wells.length : 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="selectedTab === 'wells'">
            <table class="w-full text-left border">
              <thead><tr><th class="p-2 border-b">Well</th><th class="p-2 border-b">Field</th><th class="p-2 border-b">Asset</th><th class="p-2 border-b">Status</th></tr></thead>
              <tbody>
                <tr v-for="well in wellsList" :key="well.name + '-' + well.field + '-' + well.asset">
                  <td class="p-2 border-b">{{ well.name }}</td>
                  <td class="p-2 border-b">{{ well.field }}</td>
                  <td class="p-2 border-b">{{ well.asset }}</td>
                  <td class="p-2 border-b">{{ well.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
};