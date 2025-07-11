
// Statistics Modal
window.StatisticsModal = {
    name: 'StatisticsModal',
    props: ['show'],
    emits: ['close'],
    template: `
      <div v-if="show" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h3 class="text-xl font-bold mb-4">📊 Statistics</h3>
          <div class="mb-4">Show summary statistics here (charts, KPIs, etc.).</div>
          <div class="flex justify-end">
            <button @click="$emit('close')" class="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
          </div>
        </div>
      </div>
    `
  };