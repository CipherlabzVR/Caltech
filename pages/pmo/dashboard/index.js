import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PageHeader from "@/components/ProjectManagementModule/PageHeader";
import MetricCard from "@/components/ProjectManagementModule/MetricCard";
import StatusPill from "@/components/ProjectManagementModule/StatusPill";
import {
  getDashboardSummary,
  getProjects,
} from "@/Services/projectManagementService";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [summaryResponse, projectsResponse] = await Promise.all([
          getDashboardSummary(),
          getProjects({}),
        ]);
        setSummary(summaryResponse);
        setProjects(projectsResponse ?? []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const trendSeries = useMemo(() => {
    if (!summary?.financialTrend) return [];
    return [
      {
        name: "Income",
        data: summary.financialTrend.map((point) => ({
          x: new Date(point.period).toISOString(),
          y: Number(point.income?.toFixed(2)),
        })),
      },
      {
        name: "Expense",
        data: summary.financialTrend.map((point) => ({
          x: new Date(point.period).toISOString(),
          y: Number(point.expense?.toFixed(2)),
        })),
      },
    ];
  }, [summary]);

  const trendOptions = useMemo(
    () => ({
      chart: {
        type: "area",
        height: 320,
        toolbar: { show: false },
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      dataLabels: {
        enabled: false,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.55,
          opacityTo: 0,
          stops: [0, 90, 100],
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          format: "MMM yy",
        },
      },
      yaxis: {
        labels: {
          formatter: (val) => `${val?.toLocaleString?.() ?? val}`,
        },
      },
      colors: ["#6366F1", "#F97316"],
      legend: {
        position: "top",
        horizontalAlign: "left",
      },
    }),
    []
  );

  const expenseVsIncomeSeries = useMemo(() => {
    const totalIncome = summary?.financialSnapshot?.totalIncome || summary?.financialSnapshot?.TotalIncome || 0;
    const totalExpenses = summary?.financialSnapshot?.totalExpenses || summary?.financialSnapshot?.TotalExpenses || 0;
    
    if (totalIncome === 0 && totalExpenses === 0) {
      return [];
    }
    
    return [totalIncome, totalExpenses];
  }, [summary]);

  const expenseVsIncomeOptions = useMemo(() => {
    const totalIncome = summary?.financialSnapshot?.totalIncome || summary?.financialSnapshot?.TotalIncome || 0;
    const totalExpenses = summary?.financialSnapshot?.totalExpenses || summary?.financialSnapshot?.TotalExpenses || 0;
    const total = totalIncome + totalExpenses;
    const balance = totalIncome - totalExpenses;
    
    return {
      chart: {
        type: "donut",
        height: 320,
      },
      labels: ["Income", "Expenses"],
      legend: {
        position: "right",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "16px",
                fontWeight: 600,
              },
              value: {
                show: true,
                fontSize: "20px",
                fontWeight: 700,
                formatter: () => {
                  return balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                },
              },
              total: {
                show: false, // Remove total label
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => {
          if (total === 0 || Number(val) === 0) return "";
          const percentage = ((Number(val) / total) * 100).toFixed(1);
          return percentage === "0.0" ? "" : `${percentage}%`;
        },
      },
      colors: ["#22C55E", "#EF4444"], // Green for Income, Red for Expenses
      tooltip: {
        y: {
          formatter: (val) => {
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          },
        },
      },
    };
  }, [summary]);

  const incomeSeries = useMemo(() => {
    // Handle both camelCase and PascalCase from API
    const incomeData = summary?.incomeBreakdown || summary?.IncomeBreakdown || [];
    if (!incomeData.length) {
      return [];
    }
    // Filter out zero values and return array of numbers for donut chart
    const series = incomeData
      .map((item) => Number(item.amount || item.Amount || 0))
      .filter((val) => val > 0);
    return series;
  }, [summary]);

  const incomeOptions = useMemo(() => {
    // Handle both camelCase and PascalCase from API
    const incomeData = summary?.incomeBreakdown || summary?.IncomeBreakdown || [];
    if (!incomeData.length) {
      return {
        chart: { type: "donut", height: 320 },
        labels: [],
        legend: { position: "right" },
        plotOptions: { pie: { donut: { size: "65%" } } },
        dataLabels: { enabled: false },
      };
    }
    
    // Filter out zero values to match series
    const filteredData = incomeData.filter(
      (item) => Number(item.amount || item.Amount || 0) > 0
    );
    
    const labels = filteredData.map((item) => item.categoryName || item.CategoryName || "Unknown");
    
    const totalIncome = filteredData.reduce((sum, item) => {
      return sum + Number(item.amount || item.Amount || 0);
    }, 0);

    return {
      chart: {
        type: "donut",
        height: 320,
      },
      labels,
      legend: {
        position: "right",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              name: {
                show: false,
              },
              value: {
                show: false,
              },
              total: {
                show: true,
                label: "Total Income",
                fontSize: "14px",
                fontWeight: 600,
                formatter: () => {
                  return totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val) => {
          if (totalIncome === 0 || Number(val) === 0) return "";
          const percentage = ((Number(val) / totalIncome) * 100).toFixed(1);
          return percentage === "0.0" ? "" : `${percentage}%`;
        },
      },
      colors: ["#22C55E", "#84CC16", "#10B981", "#059669", "#047857", "#065F46", "#34D399", "#6EE7B7"],
      tooltip: {
        y: {
          formatter: (val) => {
            return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          },
        },
      },
    };
  }, [summary]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <>
      <PageHeader
        title="Project Operations Control Center"
        subtitle="Realtime health of programmes, financial burn and delivery focus."
      />

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Total Projects"
            value={summary?.totalProjects ?? 0}
            accent="primary.main"
            secondary={`${summary?.completedProjects ?? 0} completed`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Active Projects"
            value={summary?.activeProjects ?? 0}
            accent="success.main"
            secondary={`${summary?.upcomingDeadlines ?? 0} deadlines in 14 days`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="On Hold"
            value={summary?.onHoldProjects ?? 0}
            accent="warning.main"
            secondary="Review blockers & resources"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Completion Rate"
            value={
              summary?.totalProjects
                ? `${Math.round(
                    ((summary.completedProjects ?? 0) /
                      (summary.totalProjects || 1)) *
                      100
                  )}%`
                : "0%"
            }
            accent="secondary.main"
            secondary="Based on delivered projects"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              sx={{ mb: 2 }}
              spacing={1}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Income vs Expense Trend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly burn-down and revenue captures across programmes.
                </Typography>
              </Box>
            </Stack>
            <Chart options={trendOptions} series={trendSeries} type="area" height={320} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Income vs Expenses
            </Typography>
            {expenseVsIncomeSeries.length > 0 ? (
              <Chart options={expenseVsIncomeOptions} series={expenseVsIncomeSeries} type="donut" height={320} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No financial data available yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Income Distribution
            </Typography>
            {(() => {
              const incomeData = summary?.incomeBreakdown || summary?.IncomeBreakdown || [];
              const totalIncome = summary?.financialSnapshot?.totalIncome || summary?.financialSnapshot?.TotalIncome || 0;
              
              // Filter out zero values to match series
              const filteredIncomeData = incomeData.filter(
                (item) => Number(item.amount || item.Amount || 0) > 0
              );
              
              if (!filteredIncomeData.length || incomeSeries.length === 0) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    No income data available yet.
                  </Typography>
                );
              }
              
              return (
                <>
                  <Chart options={incomeOptions} series={incomeSeries} type="donut" height={320} />
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      Income Breakdown Details
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredIncomeData.map((item, index) => {
                          const amount = Number(item.amount || item.Amount || 0);
                          const categoryName = item.categoryName || item.CategoryName || "Unknown";
                          const percentage = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : "0.0";
                          
                          return (
                            <TableRow key={index} hover>
                              <TableCell>{categoryName}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 500 }}>
                                {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell align="right" color="text.secondary">
                                {percentage}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ bgcolor: "action.hover", fontWeight: 600 }}>
                          <TableCell sx={{ fontWeight: 600 }}>Total Income</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            100.0%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </>
              );
            })()}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Expense Distribution by Category
            </Typography>
            {(() => {
              const expenseData = summary?.expenseBreakdown || summary?.ExpenseBreakdown || [];
              const totalExpenses = summary?.financialSnapshot?.totalExpenses || summary?.financialSnapshot?.TotalExpenses || 0;
              
              // Filter out zero values
              const filteredExpenseData = expenseData.filter(
                (item) => Number(item.amount || item.Amount || 0) > 0
              );
              
              if (!filteredExpenseData.length) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    No expense data available yet.
                  </Typography>
                );
              }
              
              const expenseSeriesData = filteredExpenseData.map((item) => Number((item.amount || item.Amount || 0).toFixed(2)));
              const expenseLabels = filteredExpenseData.map((item) => item.categoryName || item.CategoryName || "Unknown");
              
              const expenseChartOptions = {
                chart: {
                  type: "donut",
                  height: 320,
                },
                labels: expenseLabels,
                legend: {
                  position: "right",
                },
                plotOptions: {
                  pie: {
                    donut: {
                      size: "65%",
                      labels: {
                        show: true,
                        name: {
                          show: false,
                        },
                        value: {
                          show: false,
                        },
                        total: {
                          show: true,
                          label: "Total Expenses",
                          fontSize: "14px",
                          fontWeight: 600,
                          formatter: () => {
                            return totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          },
                        },
                      },
                    },
                  },
                },
                dataLabels: {
                  enabled: false,
                },
                colors: ["#6366F1", "#22D3EE", "#F59E0B", "#F97316", "#A855F7", "#22C55E", "#EF4444", "#F87171"],
                tooltip: {
                  y: {
                    formatter: (val) => {
                      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    },
                  },
                },
              };
              
              return (
                <>
                  <Chart options={expenseChartOptions} series={expenseSeriesData} type="donut" height={320} />
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                      Expense Breakdown Details
                    </Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredExpenseData.map((item, index) => {
                          const amount = Number(item.amount || item.Amount || 0);
                          const categoryName = item.categoryName || item.CategoryName || "Unknown";
                          const percentage = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : "0.0";
                          
                          return (
                            <TableRow key={index} hover>
                              <TableCell>{categoryName}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 500 }}>
                                {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                              <TableCell align="right">{percentage}%</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ bgcolor: "action.hover", fontWeight: 600 }}>
                          <TableCell sx={{ fontWeight: 600 }}>Total Expenses</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            100.0%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </>
              );
            })()}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Total Income"
            value={summary?.financialSnapshot?.totalIncome?.toLocaleString() ?? "0"}
            accent="success.main"
            secondary="All income from projects"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Budget Ledger"
            value={summary?.financialSnapshot?.totalBudget?.toLocaleString() ?? "0"}
            accent="primary.main"
            secondary={`Advance secured: ${
              summary?.financialSnapshot?.totalAdvance?.toLocaleString() ?? 0
            }`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Expenses To Date"
            value={summary?.financialSnapshot?.totalExpenses?.toLocaleString() ?? "0"}
            accent="error.main"
            secondary={`Due to collect: ${
              summary?.financialSnapshot?.totalDue?.toLocaleString() ?? 0
            }`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="Profit / Loss Outlook"
            value={summary?.financialSnapshot?.profitOrLoss?.toLocaleString() ?? "0"}
            accent={
              summary?.financialSnapshot?.profitOrLoss >= 0
                ? "success.main"
                : "error.main"
            }
            secondary="Projection based on booked income"
          />
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Highlight Projects
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Budget</TableCell>
              <TableCell align="right">Progress</TableCell>
              <TableCell align="right">Due</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects?.slice(0, 8).map((project) => (
              <TableRow key={project.projectId} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">{project.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {project.code}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{project.clientName}</TableCell>
                <TableCell>
                  <StatusPill label={project.statusName} />
                </TableCell>
                <TableCell align="right">
                  {project.budgetAmount?.toLocaleString() ?? "—"}
                </TableCell>
                <TableCell align="right">{project.progress}%</TableCell>
                <TableCell align="right">
                  {new Date(project.endDate).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
};

export default Dashboard;

