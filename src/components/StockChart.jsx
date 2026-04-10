// src/components/StockChart.jsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
);

export default function StockChart({ labels, historicalData, predictedData, ticker }) {
  // Find where prediction starts (first non-null)
  const predStart = predictedData.findIndex((v) => v !== null);

  const data = {
    labels,
    datasets: [
      {
        label: "Historical Price",
        data: historicalData,
        borderColor: "#38BDF8",
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 350);
          gradient.addColorStop(0, "rgba(56,189,248,0.25)");
          gradient.addColorStop(1, "rgba(56,189,248,0.01)");
          return gradient;
        },
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: true,
      },
      {
        label: "AI Forecast (7-day)",
        data: predictedData,
        borderColor: "#F59E0B",
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 350);
          gradient.addColorStop(0, "rgba(245,158,11,0.18)");
          gradient.addColorStop(1, "rgba(245,158,11,0.01)");
          return gradient;
        },
        borderWidth: 2.5,
        borderDash: [6, 4],
        tension: 0.35,
        pointRadius: (ctx) => (ctx.dataIndex === predStart ? 6 : 3),
        pointHoverRadius: 6,
        pointBackgroundColor: "#F59E0B",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#94A3B8",
          font: { family: "'IBM Plex Mono', monospace", size: 12 },
          boxWidth: 20,
          padding: 20,
        },
      },
      title: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.92)",
        borderColor: "rgba(148,163,184,0.15)",
        borderWidth: 1,
        titleColor: "#E2E8F0",
        bodyColor: "#94A3B8",
        titleFont: { family: "'IBM Plex Mono', monospace", size: 12 },
        bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
        padding: 12,
        callbacks: {
          label: (ctx) => {
            if (ctx.parsed.y === null) return null;
            const val = ctx.parsed.y;
            const formatted = val >= 1000
              ? `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `$${val.toFixed(2)}`;
            return ` ${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148,163,184,0.06)", drawBorder: false },
        ticks: {
          color: "#475569",
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          maxTicksLimit: 10,
          maxRotation: 0,
        },
        border: { display: false },
      },
      y: {
        position: "right",
        grid: { color: "rgba(148,163,184,0.06)", drawBorder: false },
        ticks: {
          color: "#475569",
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          callback: (v) =>
            v >= 1000
              ? `$${(v / 1000).toFixed(1)}k`
              : `$${v.toFixed(0)}`,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "380px" }}>
      <Line data={data} options={options} />
    </div>
  );
}
