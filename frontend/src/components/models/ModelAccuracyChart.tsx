import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { modelPerformances } from "@/data/model-data";

export function ModelAccuracyChart() {
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={modelPerformances} margin={{ top: 24, right: 12, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#d7e7fb" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#334b75" }} interval={0} angle={-10} height={58} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#607193" }} />
          <Tooltip formatter={(value) => [`${Number(value || 0).toFixed(2)}%`, "Test Accuracy"]} cursor={{ fill: "rgba(11,124,255,0.06)" }} />
          <Bar dataKey="accuracy" radius={[10, 10, 4, 4]}>
            {modelPerformances.map((model) => (
              <Cell key={model.name} fill={model.name === "Improved CNN" ? "#0b7cff" : "#dbe7f4"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
