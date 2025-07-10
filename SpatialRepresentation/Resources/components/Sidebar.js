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
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="font-bold text-lg mb-2">Well Status Legend</h2>
        <div v-for="status in ['Active','Inactive','Abandoned']" :key="status" class="flex items-center gap-2 mb-2">
          <span :class="['inline-block w-4 h-4 rounded', statusColor(status)]"></span>
          <span class="text-xs">{{ status }}</span>
        </div>
      </div>
    </aside>
  `,
    methods: {
        statusColor(status) {
            const colors = {
                'Active': 'bg-green-500',
                'Inactive': 'bg-yellow-500',
                'Abandoned': 'bg-red-500'
            };
            return colors[status] || 'bg-gray-400';
        }
    }
};