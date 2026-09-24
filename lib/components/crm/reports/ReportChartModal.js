import React from "react";
import dynamic from "next/dynamic";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import BASE_URL from "Base/api";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const REPORT_ENDPOINTS = {
  1: "/Leads/GetCRMLeads",
  2: "/CRMContacts/GetCRMContacts",
  3: "/CRMAccounts/GetCRMAccounts",
  4: "/CRMOpportunities/GetCRMOpportunities",
};

const resolveLabel = (reportType, record) => {
  switch (Number(reportType)) {
    case 1:
      return record.leadName || record.company || `Lead #${record.id}`;
    case 2:
      return [record.firstName, record.lastName].filter(Boolean).join(" ") || record.email || `Contact #${record.id}`;
    case 3:
      return record.accountName || `Account #${record.id}`;
    case 4:
      return record.opportunityName || `Opportunity #${record.id}`;
    default:
      return record.name || `Record #${record.id}`;
  }
};

const resolveValue = (reportType, record) => {
  const safeNumber = (value, fallback = 1) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  switch (Number(reportType)) {
    case 1:
      return safeNumber(record.leadScore, 1);
    case 2:
      return 1;
    case 3:
      return safeNumber(record.annualRevenue, 1);
    case 4:
      return safeNumber(record.value || record.amount, 1);
    default:
      return 1;
  }
};

const buildChartConfig = (chartType, labels, values) => {
  const baseOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => (Number.isFinite(val) ? Number(val.toFixed(2)) : val),
    },
    xaxis: {
      categories: labels,
      labels: { rotate: -45 },
    },
    yaxis: {
      labels: {
        formatter: (val) => (Number.isFinite(val) ? Number(val.toFixed(2)) : val),
      },
    },
    legend: { position: "bottom" },
    tooltip: {
      y: {
        formatter: (val) => (Number.isFinite(val) ? Number(val.toFixed(2)) : val),
      },
    },
  };

  switch (Number(chartType)) {
    case 0: // Bar
      return {
        options: {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: "bar" },
          plotOptions: {
            bar: {
              horizontal: false,
              columnWidth: "60%",
              distributed: false,
            },
          },
        },
        series: [{ name: "Value", data: values }],
      };
    case 1: // Line
      return {
        options: {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: "line" },
          stroke: { curve: "smooth", width: 3 },
        },
        series: [{ name: "Value", data: values }],
      };
    case 2: // Pie
      return {
        options: {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: "pie" },
          labels,
          legend: { position: "bottom" },
          dataLabels: { enabled: true },
          tooltip: {
            y: {
              formatter: (val, opts) => {
                const label = labels[opts.seriesIndex] || "";
                return `${label}: ${Number(val.toFixed(2))}`;
              },
            },
          },
        },
        series: values,
      };
    case 3: // Funnel (approximate with horizontal bar)
    default:
      return {
        options: {
          ...baseOptions,
          chart: { ...baseOptions.chart, type: "bar" },
          plotOptions: {
            bar: {
              horizontal: true,
              barHeight: "65%",
              distributed: false,
            },
          },
          xaxis: {
            ...baseOptions.xaxis,
            categories: labels,
          },
        },
        series: [{ name: "Value", data: values }],
      };
  }
};

const extractRecords = (response) => {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response.result)) {
    return response.result;
  }
  if (response.result?.items && Array.isArray(response.result.items)) {
    return response.result.items;
  }
  if (Array.isArray(response.items)) {
    return response.items;
  }
  return [];
};

export default function ReportChartModal({ open, onClose, report }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [chartConfig, setChartConfig] = React.useState(null);

  const fetchRecords = React.useCallback(
    async (selectedReport) => {
      if (!selectedReport) {
        return;
      }

      const reportTypeKey = Number(selectedReport.reportType ?? selectedReport.reportTypeId);
      const endpoint = REPORT_ENDPOINTS[reportTypeKey];

      if (!endpoint) {
        setError("Unsupported report type.");
        setChartConfig(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load report data.");
        }

        const records = extractRecords(data);

        if (!Array.isArray(records) || records.length === 0) {
          setError("No data available to display.");
          setChartConfig(null);
          return;
        }

        const labels = records.map((item) => resolveLabel(reportTypeKey, item));
        const values = records.map((item) => resolveValue(reportTypeKey, item));

        const config = buildChartConfig(
          selectedReport.chartType ?? selectedReport.chartTypeId ?? 0,
          labels,
          values
        );

        setChartConfig(config);
      } catch (err) {
        console.error("Error loading report chart:", err);
        setError(err.message || "Failed to load report data.");
        setChartConfig(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    if (open && report) {
      fetchRecords(report);
    } else if (!open) {
      setChartConfig(null);
      setError(null);
    }
  }, [open, report, fetchRecords]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {report?.reportName || report?.name || "Report Chart"}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" textAlign="center">
            {error}
          </Typography>
        ) : chartConfig ? (
          <Box>
            <Chart options={chartConfig.options} series={chartConfig.series} type={chartConfig.options.chart.type} height={360} />
          </Box>
        ) : (
          <Typography textAlign="center" color="text.secondary">
            Select a report to view chart details.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "flex-end", px: 1 }}>
          <Button onClick={onClose}>Close</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}


