import ReactECharts from 'echarts-for-react'

export function EventBarChart() {
  const option = {
    backgroundColor: 'transparent',
    grid: { left: 36, right: 8, top: 28, bottom: 24 },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.5)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        data: [42, 68, 55, 128, 92, 76, 88],
        barWidth: 14,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#38bdf8' },
              { offset: 1, color: '#0369a1' },
            ],
          },
        },
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
}

export function TrendLineChart() {
  const option = {
    backgroundColor: 'transparent',
    grid: { left: 40, right: 12, top: 20, bottom: 22 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['08-31', '09-07', '09-14', '09-21', '09-24'],
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.45)' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: [220, 380, 290, 520, 460],
        lineStyle: { width: 2, color: '#fbbf24' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(251,191,36,0.35)' },
              { offset: 1, color: 'rgba(251,191,36,0)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#fbbf24' },
      },
      {
        type: 'line',
        smooth: true,
        data: [180, 240, 360, 310, 400],
        lineStyle: { width: 2, color: '#a78bfa' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(167,139,250,0.28)' },
              { offset: 1, color: 'rgba(167,139,250,0)' },
            ],
          },
        },
        symbol: 'none',
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
}

export function ProgressGauge() {
  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 5,
        radius: '88%',
        axisLine: {
          lineStyle: {
            width: 10,
            color: [[1, 'rgba(56,189,248,0.25)']],
          },
        },
        progress: {
          show: true,
          width: 10,
          itemStyle: { color: '#38bdf8' },
        },
        axisTick: { show: false },
        splitLine: { length: 8, lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', distance: 14, fontSize: 10 },
        pointer: { show: false },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#e2e8f0',
          fontSize: 22,
          offsetCenter: [0, '10%'],
        },
        data: [{ value: 68 }],
      },
    ],
  }
  return <ReactECharts option={option} style={{ height: '100%', width: '100%' }} opts={{ renderer: 'canvas' }} />
}
