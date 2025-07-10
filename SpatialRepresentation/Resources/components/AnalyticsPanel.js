window.AnalyticsPanel = {
    name: 'AnalyticsPanel',
    props: ['chartData', 'title', 'type'],
    mounted() {
        // Support for different chart types
        new Chart(this.$refs.chart, {
            type: this.type || 'bar',
            data: this.chartData,
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    },
    template: `
  <div class="bg-white rounded-lg shadow p-4 sm:p-6 flex flex-col h-full min-h-[320px]">
    <h3 class="font-bold text-base sm:text-lg mb-4">{{ title }}</h3>
    <div class="flex-1 flex items-center justify-center">
      <canvas ref="chart" style="width:100%;height:100%;max-height:340px;min-height:200px;"></canvas>
    </div>
  </div>
`
};