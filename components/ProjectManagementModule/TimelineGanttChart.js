import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Box, Button, Stack, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const colorPalette = [
  "#6366F1",
  "#EC4899",
  "#22D3EE",
  "#F97316",
  "#84CC16",
  "#F87171",
  "#38BDF8",
  "#A855F7",
];

const TimelineGanttChart = ({ data = [], title = "Project Timeline" }) => {
  const chartRef = useRef(null);
  const [chartId] = useState(() => `gantt-chart-${Math.random().toString(36).substr(2, 9)}`);

  // Normalize data to handle both camelCase and PascalCase
  const normalizedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item) => {
      const members = item.members || item.Members || [];
      const memberNames = members.length > 0
        ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
        : item.assignedToName || item.AssignedToName || "";
      
      return {
        phaseName: item.phaseName || item.PhaseName || "",
        startDate: item.startDate || item.StartDate,
        endDate: item.endDate || item.EndDate,
        assignedToName: memberNames || "Unassigned",
        assignedToMemberId: item.assignedToMemberId || item.AssignedToMemberId,
        members: members,
        phaseType: item.phaseType || item.PhaseType,
        notes: item.notes || item.Notes,
      };
    });
  }, [data]);

  const series = useMemo(() => {
    if (!normalizedData || normalizedData.length === 0) {
      return [
        {
          name: "Phases",
          data: [],
        },
      ];
    }

    const transformed = normalizedData
      .filter((item) => item && item.phaseName && item.startDate && item.endDate)
      .map((item, index) => ({
        x: item.phaseName || "Unknown Phase",
        y: [
          new Date(item.startDate).getTime(),
          new Date(item.endDate).getTime(),
        ],
        fillColor: colorPalette[index % colorPalette.length],
        goals: item.assignedToName
          ? [
              {
                name: item.assignedToName,
                value: new Date(item.endDate).getTime(),
                strokeColor: "#0EA5E9",
              },
            ]
          : undefined,
      }));

    return [
      {
        name: "Phases",
        data: transformed,
      },
    ];
  }, [normalizedData]);

  const options = useMemo(
    () => ({
      chart: {
        id: chartId,
        type: "rangeBar",
        height: 420,
        toolbar: {
          show: false,
        },
        events: {
          mounted: (chartContext, config) => {
            // Chart is mounted and ready
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          rangeBarGroupRows: true,
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          style: {
            colors: "#94A3B8",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#64748B",
            fontWeight: 600,
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (value, opts) => {
          const entry = normalizedData?.[opts.dataPointIndex];
          const assigned = entry?.assignedToName ?? "Unassigned";
          return `${assigned}`;
        },
        style: {
          colors: ["#0F172A"],
          fontWeight: 600,
        },
      },
      tooltip: {
        shared: false,
        custom: ({ dataPointIndex }) => {
          const entry = normalizedData?.[dataPointIndex];
          if (!entry) {
            return `<div style="padding:12px;">No data available</div>`;
          }
          const members = entry?.members || [];
          const memberNames = members.length > 0
            ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
            : entry?.assignedToName ?? "Unassigned";
          
          return `<div style="padding:12px;">
            <strong>${entry?.phaseName || "Unknown Phase"}</strong><br/>
            ${entry?.startDate ? new Date(entry.startDate).toLocaleDateString() : "N/A"} → ${entry?.endDate ? new Date(
            entry.endDate
          ).toLocaleDateString() : "N/A"}<br/>
            <strong>Members:</strong> ${memberNames}
          </div>`;
        },
      },
      grid: {
        borderColor: "#1E293B22",
      },
    }),
    [normalizedData, chartId]
  );

  const handleExportExcel = () => {
    try {
      if (!normalizedData || normalizedData.length === 0) {
        alert("No data to export.");
        return;
      }

      // Calculate date range for Gantt chart
      const dates = normalizedData
        .map((entry) => {
          const start = entry.startDate ? new Date(entry.startDate) : null;
          const end = entry.endDate ? new Date(entry.endDate) : null;
          return { start, end };
        })
        .filter((d) => d.start && d.end);

      if (dates.length === 0) {
        alert("No valid date data to export.");
        return;
      }

      const minDate = new Date(Math.min(...dates.map((d) => d.start.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.end.getTime())));
      
      // Generate date columns (one column per day)
      const dateColumns = [];
      const currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        dateColumns.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Prepare data for Gantt chart visualization
      const ganttData = [];
      
      // Header row 1: Phase info
      const headerRow1 = ["Phase #", "Phase Name", "SDLC Stage", "Start Date", "End Date", "Duration", "Assigned Members"];
      // Add date headers
      dateColumns.forEach(() => headerRow1.push(""));
      ganttData.push(headerRow1);

      // Header row 2: Date labels
      const headerRow2 = ["", "", "", "", "", "", ""];
      dateColumns.forEach((date) => {
        headerRow2.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      });
      ganttData.push(headerRow2);

      // Data rows with Gantt bars
      normalizedData.forEach((entry, index) => {
        const members = entry.members || [];
        const memberNames = members.length > 0
          ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
          : entry.assignedToName || "Unassigned";

        const startDate = entry.startDate ? new Date(entry.startDate) : null;
        const endDate = entry.endDate ? new Date(entry.endDate) : null;
        
        let duration = "";
        if (startDate && endDate) {
          const diffTime = Math.abs(endDate - startDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          duration = `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        }

        const row = [
          index + 1,
          entry.phaseName || "",
          entry.phaseType || "",
          startDate ? startDate.toLocaleDateString() : "",
          endDate ? endDate.toLocaleDateString() : "",
          duration,
          memberNames,
        ];

        // Add Gantt bar visualization
        dateColumns.forEach((date) => {
          if (startDate && endDate) {
            const dateTime = date.getTime();
            const startTime = startDate.getTime();
            const endTime = endDate.getTime();
            
            // Check if this date falls within the phase timeline
            if (dateTime >= startTime && dateTime <= endTime) {
              // Use a character to represent the bar (Excel will show this)
              row.push("█");
            } else {
              row.push("");
            }
          } else {
            row.push("");
          }
        });

        ganttData.push(row);
      });

      // Create worksheet from array of arrays
      const worksheet = XLSX.utils.aoa_to_sheet(ganttData);
      
      // Set column widths
      const columnWidths = [
        { wch: 8 },  // Phase #
        { wch: 25 }, // Phase Name
        { wch: 15 }, // SDLC Stage
        { wch: 12 }, // Start Date
        { wch: 12 }, // End Date
        { wch: 12 }, // Duration
        { wch: 30 }, // Assigned Members
      ];
      
      // Add widths for date columns (narrow for timeline visualization)
      dateColumns.forEach(() => {
        columnWidths.push({ wch: 3 });
      });
      
      worksheet["!cols"] = columnWidths;

      // Freeze first 7 columns (phase info) and first 2 rows (headers)
      worksheet["!freeze"] = { xSplit: 7, ySplit: 2, topLeftCell: "H3", activePane: "bottomRight" };

      // Create a second sheet with detailed data
      const detailData = normalizedData.map((entry, index) => {
        const members = entry.members || [];
        const memberNames = members.length > 0
          ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
          : entry.assignedToName || "Unassigned";

        const startDate = entry.startDate ? new Date(entry.startDate) : null;
        const endDate = entry.endDate ? new Date(entry.endDate) : null;
        
        let duration = "";
        if (startDate && endDate) {
          const diffTime = Math.abs(endDate - startDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          duration = `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
        }

        return {
          "Phase #": index + 1,
          "Phase Name": entry.phaseName || "",
          "SDLC Stage": entry.phaseType || "",
          "Start Date": startDate ? startDate.toLocaleDateString() : "",
          "End Date": endDate ? endDate.toLocaleDateString() : "",
          "Duration (Days)": duration,
          "Assigned Members": memberNames,
          "Notes": entry.notes || "",
        };
      });

      const detailWorksheet = XLSX.utils.json_to_sheet(detailData);
      detailWorksheet["!cols"] = [
        { wch: 10 }, // Phase #
        { wch: 25 }, // Phase Name
        { wch: 15 }, // SDLC Stage
        { wch: 12 }, // Start Date
        { wch: 12 }, // End Date
        { wch: 15 }, // Duration
        { wch: 30 }, // Assigned Members
        { wch: 40 }, // Notes
      ];

      // Create workbook with two sheets
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Gantt Chart");
      XLSX.utils.book_append_sheet(workbook, detailWorksheet, "Details");

      // Generate filename with current date
      const filename = `gantt-chart-${new Date().toISOString().split("T")[0]}.xlsx`;
      
      // Write file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        bgcolor: "background.paper",
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visual timeline with responsibility mapping.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportExcel}
        >
          Export to Excel
        </Button>
      </Stack>
      <Box id={chartId}>
        <Chart ref={chartRef} options={options} series={series} type="rangeBar" height={420} />
      </Box>
    </Box>
  );
};

export default TimelineGanttChart;

