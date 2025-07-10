window.Sidebar = {
    name: 'Sidebar',
    props: ['fields', 'filters', 'onFilterChange'],
    template: `
    <aside class="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
      <div class="bg-white rounded-lg shadow p-4 mb-4">
        <h2 class="font-bold text-lg mb-2">Filter Wells & Fields</h2>
        <div v-for="(options, key) in filters" :key="key" class="mb-4">
          <label class="block text-xs font-semibold mb-1">{{ key }}</label>
          <select class="w-full border rounded p-2" @change="onFilterChange(key, $event.target.value)">
            <option value="">All</option>
            <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
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