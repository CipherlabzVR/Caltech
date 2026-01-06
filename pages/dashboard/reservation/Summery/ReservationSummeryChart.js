import React, { Component } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import styles from "./Summery.module.css";

class ReservationSummeryChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      series: Array.isArray(props.features) ? props.features : [0],
      options: {
        colors: ["#00b69b", "#f7931a", "#757fef", "#e5e5e5"],
        chart: {
          type: "donut",
        },
        tooltip: {
          y: {
            formatter: function (val) {
              return val;
            },
          },
        },
        plotOptions: {
          pie: {
            donut: {
              size: "88%",
            },
          },
        },
        stroke: {
          width: 0,
          show: true,
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          offsetY: 0,
          show: false,
          fontSize: "14px",
          position: "bottom",
          horizontalAlign: "center",
        },
        labels: [
          "Reservations",
          "Pencil Notes",
          "Pending Payment Approval",
          "Other Notes",
        ],
      },
    };
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.features !== this.props.features &&
      Array.isArray(this.props.features)
    ) {
      this.setState({
        series: this.props.features,
      });
    }
  }

  componentDidMount() {
    if (Array.isArray(this.props.features)) {
      this.setState({ series: this.props.features });
    }
  }

  render() {
    return (
      <div className={styles.reservationSummeryChart}>
        <Chart
          options={this.state.options}
          series={this.state.series}
          type="donut"
          height={260}
        />
        <div className={styles.content}>
          <h5>{this.props.value}</h5>
          <p>Total Value</p>
        </div>
      </div>
    );
  }
}

export default ReservationSummeryChart;
