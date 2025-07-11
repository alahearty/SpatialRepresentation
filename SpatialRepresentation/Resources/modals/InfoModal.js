// Info Modal
window.InfoModal = {
    name: 'InfoModal',
    props: ['show', 'infoType', 'infoData'],
    emits: ['close'],
    computed: {
      isField() { return this.infoType === 'field'; },
      isWell() { return this.infoType === 'well'; }
    },
    template: `
      <div v-if="show" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h3 class="text-xl font-bold mb-4">ℹ️ Information</h3>
          <div v-if="isField">
            <div class="mb-2"><b>Field:</b> {{ infoData.name || infoData.fieldName }}</div>
            <div class="mb-2"><b>Operator:</b> {{ infoData.operator }}</div>
            <div class="mb-2"><b>Status:</b> {{ infoData.status }}</div>
            <div class="mb-2"><b>Formation:</b> {{ infoData.formation }}</div>
            <div class="mb-2"><b>Block:</b> {{ infoData.block }}</div>
            <div class="mb-2"><b>Geologic Description:</b> {{ infoData.geologicDescription }}</div>
            <div class="mb-2"><b>Estimated Reserves:</b> {{ infoData.estimatedReserves }}</div>
            <div class="mb-2"><b>Discovery Date:</b> {{ infoData.discoveryDate }}</div>
          </div>
          <div v-else-if="isWell">
            <div class="mb-2"><b>Well:</b> {{ infoData.name }}</div>
            <div class="mb-2"><b>Type:</b> {{ infoData.type }}</div>
            <div class="mb-2"><b>Status:</b> {{ infoData.status }}</div>
            <div class="mb-2"><b>Operator:</b> {{ infoData.operator }}</div>
            <div class="mb-2"><b>Production Rate:</b> {{ infoData.productionRate }}</div>
            <div class="mb-2"><b>Depth:</b> {{ infoData.depth }}</div>
            <div class="mb-2"><b>Formation:</b> {{ infoData.formation }}</div>
            <div class="mb-2"><b>Block:</b> {{ infoData.block }}</div>
            <div class="mb-2"><b>Geologic Description:</b> {{ infoData.geologicDescription }}</div>
          </div>
          <div v-else>
            <div>No information available.</div>
          </div>
          <div class="flex justify-end mt-4">
            <button @click="$emit('close')" class="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
          </div>
        </div>
      </div>
    `
  };