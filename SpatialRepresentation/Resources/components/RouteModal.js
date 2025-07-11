window.RouteModal = {
    name: 'RouteModal',
    props: ['wells', 'show', 'fieldName'],
    emits: ['close', 'create-route'],
    data() {
      return {
        sourceWell: '',
        destWell: '',
        routeType: 'driving',
        routeSummary: null
      };
    },
    methods: {
      createRoute() {
        if (!this.sourceWell || !this.destWell || this.sourceWell === this.destWell) {
          alert('Please select two different wells.');
          return;
        }
        this.routeSummary = {
          source: this.sourceWell,
          dest: this.destWell,
          type: this.routeType
        };
        this.$emit('create-route', {
          source: this.sourceWell,
          dest: this.destWell,
          type: this.routeType
        });
        this.$emit('close');
      }
    },
    template: `
      <div v-if="show" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <h3 class="text-xl font-bold mb-4">🚀 Route Between Wells <span v-if="fieldName">in {{ fieldName }}</span></h3>
          <div class="mb-3">
            <label class="block mb-1">📍 Source Well:</label>
            <select v-model="sourceWell" class="w-full border rounded p-2">
              <option value="">-- Select Source Well --</option>
              <option v-for="well in wells" :key="well.id" :value="well.id">{{ well.name }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="block mb-1">🎯 Destination Well:</label>
            <select v-model="destWell" class="w-full border rounded p-2">
              <option value="">-- Select Destination Well --</option>
              <option v-for="well in wells" :key="well.id" :value="well.id">{{ well.name }}</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="block mb-1">🛣️ Route Type:</label>
            <select v-model="routeType" class="w-full border rounded p-2">
              <option value="driving">Driving Route</option>
              <option value="walking">Walking Route</option>
              <option value="cycling">Cycling Route</option>
              <option value="straight">Straight Line</option>
            </select>
          </div>
          <div v-if="routeSummary" class="mb-3 p-2 bg-gray-100 rounded">
            <b>Route Summary:</b><br>
            From: {{ routeSummary.source }}<br>
            To: {{ routeSummary.dest }}<br>
            Type: {{ routeSummary.type }}
          </div>
          <div class="flex justify-end gap-2">
            <button @click="$emit('close')" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button @click="createRoute" class="px-4 py-2 bg-blue-600 text-white rounded">Create Route</button>
          </div>
        </div>
      </div>
    `
  };