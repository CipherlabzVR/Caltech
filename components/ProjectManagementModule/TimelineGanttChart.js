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

const hashString = (value) => {
  const str = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // eslint-disable-line no-bitwise
  }
  return Math.abs(hash);
};

const getPhaseColorIndex = (phaseName) =>
  hashString(phaseName) % colorPalette.length;

const SDLC_PHASES = [
  "Planning",
  "Analysis",
  "Design",
  "Development",
  "Testing",
  "Deployment",
  "Maintenance",
];

const SDLC_ROWS = [...SDLC_PHASES, "Unassigned"];

const normalizeSdlcStage = (phaseType, phaseName) => {
  const candidate = String(phaseType || "").trim();
  if (candidate) return candidate;

  const fallback = String(phaseName || "").trim();
  if (!fallback) return "Unassigned";

  const match = SDLC_PHASES.find(
    (p) => p.toLowerCase() === fallback.toLowerCase()
  );
  return match || "Unassigned";
};

const buildPhaseRowLabel = (sdlcStage) => {
  const s = String(sdlcStage || "").trim();
  return s || "Unassigned";
};

const TimelineGanttChart = ({ data = [], title = "Project Timeline" }) => {
  const chartRef = useRef(null);
  const [chartId] = useState(() => `gantt-chart-${Math.random().toString(36).substr(2, 9)}`);

  const markOverdueSegments = () => {
    // Tag overdue segments after ApexCharts renders them.
    const root = typeof document !== "undefined" ? document.getElementById(chartId) : null;
    if (!root) return;

    const svg = root.querySelector("svg");
    if (!svg) return;

    // Ensure a reusable SVG filter exists for glow (more reliable than CSS drop-shadow on SVG).
    const filterId = `pmOverdueGlowFilter-${chartId}`;
    const ensureFilter = () => {
      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.insertBefore(defs, svg.firstChild);
      }

      const existing = defs.querySelector(`#${CSS.escape(filterId)}`);
      if (existing) return;

      const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
      filter.setAttribute("id", filterId);
      filter.setAttribute("x", "-50%");
      filter.setAttribute("y", "-50%");
      filter.setAttribute("width", "200%");
      filter.setAttribute("height", "200%");

      const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
      blur.setAttribute("in", "SourceGraphic");
      blur.setAttribute("stdDeviation", "3.5");
      blur.setAttribute("result", "blur");

      const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
      const m1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      m1.setAttribute("in", "blur");
      const m2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
      m2.setAttribute("in", "SourceGraphic");
      merge.appendChild(m1);
      merge.appendChild(m2);

      filter.appendChild(blur);
      filter.appendChild(merge);
      defs.appendChild(filter);
    };

    ensureFilter();

    const els = root.querySelectorAll("svg .apexcharts-series path, svg .apexcharts-series rect");

    els.forEach((el) => {
      el.classList.remove("pm-overdue-segment");

      const attrFill = (el.getAttribute("fill") || "").toLowerCase();
      const styleFill = (el.getAttribute("style") || "").toLowerCase();

      // Match our overdue fillColor "#EF4444" regardless of whether Apex uses attribute or inline style.
      const isRed =
        attrFill === "#ef4444" ||
        attrFill === "rgb(239, 68, 68)" ||
        attrFill === "rgba(239, 68, 68, 1)" ||
        styleFill.includes("#ef4444") ||
        styleFill.includes("239, 68, 68");

      if (isRed) {
        el.classList.add("pm-overdue-segment");
        // Force true red + apply SVG glow filter for consistent visuals.
        el.setAttribute("fill", "#EF4444");
        el.setAttribute("stroke", "#FF5A5A");
        el.setAttribute("stroke-width", "2");
        el.setAttribute("filter", `url(#${filterId})`);
      } else {
        // Clean up any previous filter/stroke from outdated renders.
        if (el.getAttribute("filter") === `url(#${filterId})`) el.removeAttribute("filter");
        if (el.getAttribute("stroke") === "#FF5A5A") el.removeAttribute("stroke");
        if (el.getAttribute("stroke-width") === "2") el.removeAttribute("stroke-width");
      }
    });
  };

  // Normalize data to handle both camelCase and PascalCase
  const normalizedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item) => {
      const members =
        item.members ||
        item.Members ||
        item.assignees ||
        item.Assignees ||
        [];

      const memberNames = members.length > 0
        ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
        : item.assignedToName || item.AssignedToName || "";

      const taskTitle =
        item.title ||
        item.Title ||
        item.taskTitle ||
        item.TaskTitle ||
        "";
      
      return {
        phaseName: item.phaseName || item.PhaseName || "",
        startDate: item.startDate || item.StartDate,
        // When feeding tasks, end date is task due date
        endDate: item.endDate || item.EndDate || item.dueDate || item.DueDate,
        assignedToName: memberNames || "Unassigned",
        assignedToMemberId: item.assignedToMemberId || item.AssignedToMemberId,
        members: members,
        phaseType: item.phaseType || item.PhaseType,
        notes: item.notes || item.Notes,
        taskTitle,
        isCompleted: Boolean(item.isCompleted ?? item.IsCompleted),
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

    const taskPoints = normalizedData
      .filter((item) => item && item.startDate && item.endDate)
      .map((item) => {
        const stage = normalizeSdlcStage(item.phaseType, item.phaseName);
        const rowLabel = buildPhaseRowLabel(stage);
        const startMs = new Date(item.startDate).getTime();
        const endMs = new Date(item.endDate).getTime();
        const nowMs = Date.now();

        const baseColorIndex = getPhaseColorIndex(stage);
        const base = {
          // Phase row label on Y axis
          x: rowLabel,
          // planned window (task bar)
          y: [startMs, endMs],
          fillColor: colorPalette[baseColorIndex],
          meta: {
            kind: "task",
            stage,
            rowLabel,
            taskTitle: item.taskTitle || "Untitled Task",
            phaseName: item.phaseName || "",
            assignedToName: item.assignedToName,
            members: item.members ?? [],
            startDate: item.startDate,
            endDate: item.endDate,
            isCompleted: item.isCompleted,
          },
        };

        const points = [base];

        // Overdue extension: if task is past due and not completed/end-column yet, show extra segment in red.
        if (!item.isCompleted && Number.isFinite(endMs) && nowMs > endMs) {
          points.push({
            x: rowLabel,
            y: [endMs, nowMs],
            fillColor: "#EF4444",
            meta: {
              ...base.meta,
              kind: "overdue",
            },
          });
        }

        return points;
      })
      .flat();

    // Force Y-axis row ordering to always match SDLC order.
    // ApexCharts derives row order from first occurrence of each category in series.data.
    // So we seed one invisible placeholder per SDLC row (in order) BEFORE adding any tasks.
    const minDateMs = (() => {
      const ms = taskPoints
        .map((t) => t?.y?.[0])
        .filter((v) => Number.isFinite(v));
      return ms.length ? Math.min(...ms) : Date.now();
    })();

    const ordered = SDLC_ROWS.map((stage) => ({
      x: stage,
      y: [minDateMs, minDateMs],
      fillColor: "rgba(0,0,0,0)",
      meta: { kind: "placeholder", stage, rowLabel: stage },
    }));

    ordered.push(...taskPoints);

    return [
      {
        name: "Phases",
        data: ordered,
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
          mounted: () => {
            // Run twice to catch initial paint + animations.
            requestAnimationFrame(() => {
              markOverdueSegments();
              requestAnimationFrame(markOverdueSegments);
            });
          },
          updated: () => {
            requestAnimationFrame(markOverdueSegments);
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
      fill: {
        type: "solid",
      },
      colors: colorPalette,
      stroke: { width: 0 },
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
          formatter: (val, index) => {
            // Apex sometimes renders numeric ticks for rangeBar grouped rows.
            // Map them to stable SDLC rows so the Y axis shows phase names.
            if (Number.isFinite(Number(index))) {
              return SDLC_ROWS[index] ?? val;
            }
            const n = Number(val);
            if (Number.isFinite(n)) {
              const idx = Math.floor(n) - 1; // ticks usually start at 1
              return SDLC_ROWS[idx] ?? val;
            }
            return val;
          },
          style: {
            colors: "#64748B",
            fontWeight: 600,
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (value, opts) => {
          const point = opts?.w?.config?.series?.[opts.seriesIndex]?.data?.[opts.dataPointIndex];
          const kind = point?.meta?.kind;
          if (kind === "placeholder" || kind === "overdue") return "";
          return point?.meta?.taskTitle || "";
        },
        style: {
          colors: ["#0F172A"],
          fontWeight: 600,
        },
      },
      tooltip: {
        shared: false,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const point = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex];
          const meta = point?.meta;
          if (!meta || meta.kind === "placeholder") {
            return `<div style="padding:12px;">No data available</div>`;
          }

          const members = meta?.members || [];
          const memberNames = members.length > 0
            ? members.map((m) => m.name || m.Name || "").filter(Boolean).join(", ")
            : meta?.assignedToName ?? "Unassigned";
          
          const isOverdue = meta.kind === "overdue";
          const stage = meta.stage || "—";
          const phaseName = meta.phaseName || "—";
          const rowLabel = meta.rowLabel || "—";

          return `<div style="padding:12px;">
            <strong>${meta?.taskTitle || "Untitled Task"}</strong>${isOverdue ? ' <span style="color:#EF4444;font-weight:700;">(Overdue)</span>' : ""}<br/>
            <span style="color:#64748B;"><strong>Row:</strong> ${rowLabel}</span><br/>
            <span style="color:#64748B;"><strong>SDLC:</strong> ${stage}</span><br/>
            <span style="color:#64748B;"><strong>Phase:</strong> ${phaseName}</span><br/>
            ${meta?.startDate ? new Date(meta.startDate).toLocaleDateString() : "N/A"} → ${meta?.endDate ? new Date(
            meta.endDate
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

      <style jsx global>{`
        @keyframes pmOverdueGlow {
          0% {
            opacity: 0.9;
            stroke-width: 1.5;
          }
          50% {
            opacity: 1;
            stroke-width: 3;
          }
          100% {
            opacity: 1;
            stroke-width: 3.5;
          }
        }

        /* Overdue segments are rendered with fillColor "#EF4444". Animate only those bars. */
        #${chartId} .pm-overdue-segment {
          animation: pmOverdueGlow 1.1s ease-in-out infinite alternate;
          will-change: opacity, stroke-width;
        }
      `}</style>
    </Box>
  );
};

export default TimelineGanttChart;

