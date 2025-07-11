window.AppHeader = {
    name: 'AppHeader',
    props: ['fields', 'onFieldChange'],
    data() {
        return {
            selectedField: '',
            uploadFileName: '',
        };
    },
    methods: {
        handleFieldChange(e) {
            this.selectedField = e.target.value;
            this.$emit('field-change', this.selectedField);
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage(`FIELD_SELECTED:${this.selectedField}`);
            }
        },
        handleChooseFile(e) {
            const file = e.target.files[0];
            if (file) {
                this.uploadFileName = file.name;
                // You can send the file name or file content to C# here if needed
                if (window.chrome && window.chrome.webview) {
                    window.chrome.webview.postMessage(`FILE_CHOSEN:${file.name}`);
                }
            }
        },
        handleUpload() {
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage('UPLOAD_FILE');
            }
        },
        handleExportGeoJson() {
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage('EXPORT_GEOJSON');
            }
        },
        handleRouteWells() {
            this.$emit('open-route-modal');
        },
        handleInfo() {
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage('SHOW_INFO');
            }
        },
        handleRoutes() {
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage('SHOW_ROUTES');
            }
        },
        handleShowStatistics() {
            if (window.chrome && window.chrome.webview) {
                window.chrome.webview.postMessage('SHOW_STATISTICS');
            }
        }
    },
    template: `
    <header class="bg-blue-900 text-white flex flex-col md:flex-row items-start md:items-center px-2 sm:px-6 py-3 shadow gap-2 md:gap-4">
      <div class="flex items-center gap-2 flex-wrap w-full md:w-auto">
        <h1 class="text-lg sm:text-2xl font-bold flex-1 text-center md:text-left">Spatial Dashboard</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
        <label class="text-white text-sm">Field:</label>
        <select class="rounded px-2 py-1 text-black" v-model="selectedField" @change="handleFieldChange">
          <option value="">All Fields</option>
          <option v-for="field in fields" :key="field.id" :value="field.name">{{ field.name }}</option>
        </select>
        <label class="text-white text-sm">Upload:</label>
        <input type="text" class="rounded px-2 py-1 text-black w-32" :value="uploadFileName" readonly />
        <label class="bg-gray-200 text-black px-2 py-1 rounded cursor-pointer border border-gray-300 hover:bg-gray-300">
          Choose File
          <input type="file" class="hidden" @change="handleChooseFile" />
        </label>
        <button class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded" @click="handleUpload">Upload</button>
        <button class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded" @click="handleExportGeoJson">Export GeoJSON</button>
        <button class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded" @click="handleRouteWells">Route Wells</button>
        <button class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded" @click="$emit('open-route-modal')">Open Route Modal</button>
        <button class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded" @click="$emit('show-info')">Info</button>
        <button class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded" @click="$emit('show-routes')">Routes</button>
        <button class="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded" @click="$emit('show-statistics')">Show Statistics</button>
      </div>
      
    </header>
  `
};