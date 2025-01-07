import { Typography } from "@mui/material";
import React from "react";
import {
  Bar,
  BarChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const Analytics = (props) => {


  const { nodes } = props;

  return (
    <div
      style={{
        flex: 1,
    padding: "16px",
    borderLeft: "1px solid #ddd",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    minWidth: "300px",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Analytics
      </Typography>
      {nodes?.length != 0 ? (
        <>
          <BarChart
            width={300}
            height={200}
            data={nodes?.map((node) => ({
              name: node?.data?.label,
              time: node?.data?.executionTime || 0,
            }))}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="time" fill="#8884d8" />
          </BarChart>

          <LineChart
            width={300}
            height={200}
            data={nodes?.map((node, index) => ({
              name: node?.data?.label,
              cumulative:
                index === 0
                  ? 0
                  : (nodes[index - 1]?.data?.executionTime || 0) +
                    (node?.data?.executionTime || 0),
            }))}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cumulative" stroke="#82ca9d" />
          </LineChart>

          <PieChart width={400} height={200}>
            <Pie
              data={nodes?.map((node) => ({
                name: node?.data?.label,
                value: node?.data?.executionTime || 0,
              }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
            />
          </PieChart>
        </>
      ) : (
        <div>
          <Typography variant="h8" gutterBottom>
            No data available.
          </Typography>
        </div>
      )}
    </div>
  );
};

export default Analytics;
