import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement);

export default function ChartView({ rows, columns }) {
  if (!columns || columns.length === 0 || !rows || rows.length === 0) {
    return <div className="muted">No chart to show</div>;
  }

  const hasNumericSecond = rows.every(r => !isNaN(Number(r[1])));

  const labels = rows.map(r => String(r[0]));
  const values = rows.map(r => Number(r[1]) || 0);

  if (columns.length >= 2 && hasNumericSecond) {
    const data = {
      labels,
      datasets: [
        {
          label: columns[1],
          data: values,
          backgroundColor: "#6C63FF",
          borderRadius: 6,
        },
      ],
    };
    return <Bar data={data} />;
  }

  return (
    <div>
      <table style={{width:"100%"}}>
        <thead><tr>{columns.map((c,i)=><th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r,ri)=>(<tr key={ri}>{r.map((cell,ci)=><td key={ci}>{String(cell)}</td>)}</tr>))}
        </tbody>
      </table>
    </div>
  );
}
