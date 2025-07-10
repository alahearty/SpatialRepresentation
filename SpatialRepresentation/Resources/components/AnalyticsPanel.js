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
    <div class="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 class="font-bold text-base sm:text-lg mb-4">{{ title }}</h3>
      <canvas ref="chart" height="100"></canvas>
    </div>
  `
};