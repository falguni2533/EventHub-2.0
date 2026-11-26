import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { BarChart3, CalendarRange, PieChart, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

const BASE_TOOLTIP = {
  backgroundColor: '#0f172a',
  titleColor: '#f8fafc',
  bodyColor: '#e2e8f0',
  padding: 10,
  cornerRadius: 8,
  displayColors: true,
};

function ChartEmptyState({ icon: Icon, title, description }) {
  return (
    <div className="att-chart-empty">
      <Icon size={24} strokeWidth={1.7} aria-hidden="true" />
      <p>{title}</p>
      <span>{description}</span>
    </div>
  );
}

export function AttendanceLineChart({
  title = 'Attendance Overview',
  subtitle = 'Attendance trend across event dates',
  points = [],
  mode = 'admin', // 'admin' | 'student'
  loading = false,
}) {
  const hasData = points.length > 0;

  const data = {
    labels: points.map((p) => (mode === 'student' ? p.eventTitle : p.label)),
    datasets:
      mode === 'student'
        ? [
            {
              label: 'Cumulative Attendance %',
              data: points.map((p) => p.cumulativeRate),
              borderColor: '#6d28d9',
              backgroundColor: 'rgba(109, 40, 217, 0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 5,
              pointHoverRadius: 7,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#6d28d9',
              pointBorderWidth: 2.5,
            },
          ]
        : [
            {
              label: 'Present',
              data: points.map((p) => p.present),
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.14)',
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#4f46e5',
            },
            {
              label: 'Absent',
              data: points.map((p) => p.absent),
              borderColor: '#e11d48',
              backgroundColor: 'rgba(225, 29, 72, 0.06)',
              fill: false,
              tension: 0.35,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#e11d48',
            },
          ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, color: '#475569', padding: 14 },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        callbacks:
          mode === 'student'
            ? {
                afterLabel: (ctx) => {
                  const pt = points[ctx.dataIndex];
                  return pt ? `Session: ${pt.attended ? 'Present' : 'Absent'} (${pt.label})` : '';
                },
              }
            : undefined,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', maxRotation: 25 },
      },
      y: {
        beginAtZero: true,
        max: mode === 'student' ? 100 : undefined,
        ticks: {
          precision: 0,
          color: '#64748b',
          callback: (val) => (mode === 'student' ? `${val}%` : val),
        },
        grid: { color: '#f1f5f9' },
      },
    },
  };

  return (
    <article className="att-chart-card">
      <div className="att-chart-header">
        <div className="att-chart-title-wrap">
          <span className="att-chart-badge-icon" aria-hidden="true">
            <TrendingUp size={17} />
          </span>
          <div>
            <h3 className="att-chart-title">{title}</h3>
            <p className="att-chart-subtitle">{subtitle}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="att-skeleton-chart" />
      ) : !hasData ? (
        <ChartEmptyState
          icon={TrendingUp}
          title="No trend data yet"
          description="Attendance trend points appear as soon as event registrations exist."
        />
      ) : (
        <div className="att-chart-canvas-wrap">
          <Line data={data} options={options} />
        </div>
      )}
    </article>
  );
}

export function PresentAbsentDoughnutChart({
  title = 'Present vs Absent',
  subtitle = 'Overall attendance ratio',
  present = 0,
  absent = 0,
  loading = false,
}) {
  const total = present + absent;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  const data = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [present, absent],
        backgroundColor: ['#4f46e5', '#e2e8f0'],
        hoverBackgroundColor: ['#4338ca', '#cbd5e1'],
        borderWidth: 0,
        cutout: '72%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, color: '#475569', padding: 14 },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw || 0;
            const share = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${ctx.label}: ${val} (${share}%)`;
          },
        },
      },
    },
  };

  return (
    <article className="att-chart-card">
      <div className="att-chart-header">
        <div className="att-chart-title-wrap">
          <span className="att-chart-badge-icon" aria-hidden="true">
            <PieChart size={17} />
          </span>
          <div>
            <h3 className="att-chart-title">{title}</h3>
            <p className="att-chart-subtitle">{subtitle}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="att-skeleton-chart" />
      ) : total === 0 ? (
        <ChartEmptyState
          icon={PieChart}
          title="No attendance split yet"
          description="Present vs absent breakdown will render once records match your filters."
        />
      ) : (
        <div className="att-doughnut-wrap">
          <Doughnut data={data} options={options} />
          <div className="att-doughnut-center">
            <strong>{pct}%</strong>
            <span>Present</span>
          </div>
        </div>
      )}
    </article>
  );
}

export function EventAttendanceBarChart({
  title = 'Event-wise Attendance',
  subtitle = 'Attendance comparison by event',
  items = [],
  mode = 'admin', // 'admin' | 'student'
  loading = false,
}) {
  const hasData = items.length > 0;

  const data = {
    labels: items.map((i) => i.eventTitle),
    datasets:
      mode === 'student'
        ? [
            {
              label: 'Attended',
              data: items.map((i) => i.attended),
              backgroundColor: '#6d28d9',
              borderRadius: 6,
            },
            {
              label: 'Missed',
              data: items.map((i) => i.missed),
              backgroundColor: '#fb7185',
              borderRadius: 6,
            },
          ]
        : [
            {
              label: 'Present',
              data: items.map((i) => i.present),
              backgroundColor: '#4f46e5',
              borderRadius: 6,
            },
            {
              label: 'Absent',
              data: items.map((i) => i.absent),
              backgroundColor: '#cbd5e1',
              borderRadius: 6,
            },
          ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, color: '#475569', padding: 14 },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        callbacks: {
          afterBody: (tooltipItems) => {
            const idx = tooltipItems?.[0]?.dataIndex;
            const item = idx !== undefined ? items[idx] : null;
            if (!item || mode === 'student') return '';
            return `Attendance Rate: ${item.rate}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, stepSize: mode === 'student' ? 1 : undefined, color: '#64748b' },
        grid: { color: '#f1f5f9' },
      },
    },
  };

  return (
    <article className="att-chart-card">
      <div className="att-chart-header">
        <div className="att-chart-title-wrap">
          <span className="att-chart-badge-icon" aria-hidden="true">
            <BarChart3 size={17} />
          </span>
          <div>
            <h3 className="att-chart-title">{title}</h3>
            <p className="att-chart-subtitle">{subtitle}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="att-skeleton-chart" />
      ) : !hasData ? (
        <ChartEmptyState
          icon={BarChart3}
          title="No event breakdown yet"
          description="Per-event attendance bars appear when events have active registrations."
        />
      ) : (
        <div className="att-chart-canvas-wrap">
          <Bar data={data} options={options} />
        </div>
      )}
    </article>
  );
}

export function WeeklyTrendsChart({
  title = 'Weekly Attendance Trends',
  subtitle = 'Week-over-week attendance rate (%)',
  weeks = [],
  loading = false,
}) {
  const hasData = weeks.length > 0;

  const data = {
    labels: weeks.map((w) => w.label),
    datasets: [
      {
        label: 'Attendance %',
        data: weeks.map((w) => w.rate),
        backgroundColor: 'rgba(124, 58, 237, 0.85)',
        hoverBackgroundColor: '#6d28d9',
        borderRadius: 8,
        maxBarThickness: 44,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { usePointStyle: true, boxWidth: 8, color: '#475569', padding: 14 },
      },
      tooltip: {
        ...BASE_TOOLTIP,
        callbacks: {
          afterLabel: (ctx) => {
            const w = weeks[ctx.dataIndex];
            return w ? `Present: ${w.present} / ${w.total}` : '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: '#64748b', callback: (v) => `${v}%` },
        grid: { color: '#f1f5f9' },
      },
    },
  };

  return (
    <article className="att-chart-card">
      <div className="att-chart-header">
        <div className="att-chart-title-wrap">
          <span className="att-chart-badge-icon" aria-hidden="true">
            <CalendarRange size={17} />
          </span>
          <div>
            <h3 className="att-chart-title">{title}</h3>
            <p className="att-chart-subtitle">{subtitle}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="att-skeleton-chart" />
      ) : !hasData ? (
        <ChartEmptyState
          icon={CalendarRange}
          title="No weekly trends yet"
          description="Weekly attendance rate comparisons appear once records span event dates."
        />
      ) : (
        <div className="att-chart-canvas-wrap">
          <Bar data={data} options={options} />
        </div>
      )}
    </article>
  );
}
