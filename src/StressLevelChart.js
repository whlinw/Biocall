import React from 'react';

const Chart = require('chart.js');

class StressLevelChart extends React.Component {
  componentDidMount() {
    this.ctx = document.getElementById('stress-level-chart').getContext('2d');
    const gradient = this.ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(116,0,255,0.8)');
    gradient.addColorStop(1, 'rgba(116,0,255,0)');
    this.gsrData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.config = {
      type: 'line',
      data: {
        labels: [ '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        datasets: [
          {
            label: 'Stress level', /* [EDIT] Change legend name here. */
            fill: true,
            backgroundColor: gradient,
            borderColor: 'rgba(116,0,255,1)',
            data: this.gsrData,
            radius: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            pointBackgroundColor: [
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
              'rgba(0,0,0,0)',
            ],
            pointBorderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: false,
        },
        tooltips: {
          mode: 'index',
          intersect: false,
        },
        hover: {
          mode: 'nearest',
          intersect: true,
        },
        scales: {
          xAxes: [
            {
              display: false,
            },
          ],
          yAxes: [
            {
              display: false,
              ticks: {
                min: 0,
                max: 5,
              },
            },
          ],
        },
      },
    };

    this.stressChart = new Chart(this.ctx, this.config);
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.time !== this.props.time) {
      return true;
    }
    return false;
  }

  updateChart(bioData) {
    if (this.stressChart !== undefined) {
      const maxChartVal = bioData.max + 0.5;
      this.stressChart.options.scales.yAxes[0].ticks.min = bioData.min;
      this.stressChart.options.scales.yAxes[0].ticks.max = maxChartVal;
      this.stressChart.data.datasets[0].data.push(bioData.value);

      this.stressChart.data.datasets[0].radius.push(0);
      this.stressChart.data.datasets[0].pointBackgroundColor.push('rgba(0,0,0,0)');

      this.stressChart.data.labels.push('');
      if (this.stressChart.data.datasets[0].data.length > 60) {
        this.stressChart.data.datasets[0].data.shift();
        this.stressChart.data.labels.shift();
        this.stressChart.data.datasets[0].radius.shift();
        this.stressChart.data.datasets[0].pointBackgroundColor.shift();
      }
      this.stressChart.update();
    }
  }

  render() {
    this.updateChart(this.props.bioData);
    return (
      <div className="StressLevelChart">
        <canvas id="stress-level-chart" width="200" height="300" />
      </div>
    );
  }
}

export default StressLevelChart;
