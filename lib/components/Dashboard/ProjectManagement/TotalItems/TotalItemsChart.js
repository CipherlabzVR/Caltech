import React, { Component } from "react";
import { Box, Typography } from "@mui/material";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

class TotalItemsChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      series: props.stock && Array.isArray(props.stock) ? props.stock : [0],
      labels: props.productNames && Array.isArray(props.productNames) ? props.productNames : ["-"],
      options: {
        labels: props.productNames && Array.isArray(props.productNames) ? props.productNames : ["-"],
        stroke: {
          width: 0,
          show: true
        },
        colors: ["#757FEF", "#90C6E0", "#E040FB", "#C68EFD"],
        legend: {
          offsetY: 0,
          show: false,
          position: "bottom",
          fontSize: "14px",
          labels: {
            colors: '#5B5B98',
          },
        },
        tooltip: {
          y: {
            formatter: (value, { seriesIndex, w }) => {
              const label = w?.config?.labels?.[seriesIndex] || "";
              return `${label} ${value}`;
            },
          },
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              height: 280
            }
          }
        }]
      }
      
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const updatedSeries = Array.isArray(nextProps.stock) ? nextProps.stock : [0];
    const updatedLabels = Array.isArray(nextProps.productNames) ? nextProps.productNames : ["-"];
  
    if (
      nextProps.stock !== prevState.series ||
      nextProps.productNames !== prevState.labels
    ) {
      return {
        series: updatedSeries,
        labels: updatedLabels,
        options: {
          ...prevState.options,
          labels: updatedLabels
        }
      };
    }
    return null;
  }
  

  render() {
    const { series, labels, options } = this.state;

    return (
      <>
        {series && series.length > 0 ? (
          <Chart
            options={options}
            series={series}
            type="pie"
            height={290}
          />
        ) : (
          <Typography color="textSecondary">No data available</Typography>
        )}

        {/* <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            textAlign: "center",
            mt: "30px",
          }}
        >
          {labels.map((label, index) => (
            <Box key={index}>
              <Typography color="#A9A9C8" mb={1} fontSize="14px">
                {label}
              </Typography>
              <Typography fontWeight="500" fontSize="18px" as="h4">
                {series[index] ? `${series[index]}` : "0"}
              </Typography>
            </Box>
          ))}
        </Box> */}
      </>
    );
  }
}

export default TotalItemsChart;
