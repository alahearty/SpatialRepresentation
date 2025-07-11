
// Statistics Modal
window.StatisticsModal = {
    name: 'StatisticsModal',
    props: ['show', 'statsType', 'statsData'],
    emits: ['close'],
    template: `
      <div v-if="show" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <h3 class="text-xl font-bold mb-4">📊 Statistics</h3>
          <div v-if="statsType === 'field' && statsData">
            <div class="mb-2"><b>Field:</b> {{ statsData.name || statsData.fieldName }}</div>
            <div class="mb-2"><b>Total Wells:</b> {{ statsData.wells ? statsData.wells.length : 0 }}</div>
            <div class="mb-2"><b>Total Production:</b> {{ statsData.totalProduction }}</div>
            <div class="mb-2"><b>Active Wells:</b> {{ statsData.activeWells }}</div>
            <div class="mb-2"><b>Inactive Wells:</b> {{ statsData.inactiveWells }}</div>
            <div class="mb-2"><b>Abandoned Wells:</b> {{ statsData.abandonedWells }}</div>
            <!-- Add more KPIs or charts here -->
          </div>
          <div v-else-if="statsType === 'well' && statsData">
            <div class="mb-2"><b>Well:</b> {{ statsData.name }}</div>
            <div class="mb-2"><b>Production History:</b> {{ statsData.productionHistory }}</div>
            <!-- Add more well-level stats here -->
          </div>
          <div v-else>
            <div>No statistics available.</div>
          </div>
          <div class="flex justify-end mt-4">
            <button @click="$emit('close')" class="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
          </div>
        </div>
      </div>
    `
  };