import React from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import EventIcon from "@mui/icons-material/Event";
import UpcomingIcon from "@mui/icons-material/Upcoming";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TodayIcon from "@mui/icons-material/Today";
import useApi from "@/components/utils/useApi";
import { formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { resolveEventTypeIcon } from "@/utils/photography/eventTypeIcons";

const CATEGORY_ID = 300;

const CHART_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6"];

const panelSx = {
  p: 3,
  borderRadius: 3,
  border: "1px solid #EEF0F4",
  bgcolor: "#fff",
  height: "100%",
  boxShadow: "0 1px 3px rgba(16,24,40,0.04)",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(16,24,40,0.12)",
    padding: "10px 14px",
  },
  itemStyle: { color: "#111827", fontSize: 13 },
  labelStyle: { color: "#6B7280", fontWeight: 600, marginBottom: 4 },
};

const StatCard = ({ icon, label, value, gradient }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      color: "#fff",
      background: gradient,
      boxShadow: "0 8px 20px rgba(16,24,40,0.16)",
      height: "100%",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        right: -18,
        top: -18,
        width: 90,
        height: 90,
        borderRadius: "50%",
        bgcolor: "rgba(255,255,255,0.14)",
      }}
    />
    <Stack direction="row" alignItems="center" spacing={2} sx={{ position: "relative" }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: "rgba(255,255,255,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {value ?? 0}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.92 }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const SectionTitle = ({ icon, children, action }) => (
  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
    <Stack direction="row" alignItems="center" spacing={1}>
      {icon}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#111827" }}>
        {children}
      </Typography>
    </Stack>
    {action}
  </Stack>
);

function FunctionsTable({ title, icon, items, emptyMessage }) {
  return (
    <Paper elevation={0} sx={panelSx}>
      <SectionTitle
        icon={icon}
        action={
          <Chip
            size="small"
            label={`${items.length} event${items.length === 1 ? "" : "s"}`}
            sx={{ fontWeight: 600, bgcolor: "#F3F4F6" }}
          />
        }
      >
        {title}
      </SectionTitle>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Card No</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Client</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Team</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.eventTime || "—"}</TableCell>
                  <TableCell>{row.cardNo}</TableCell>
                  <TableCell>{row.coupleNames}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.eventTypeName}
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: row.eventType === 1 ? "#BE185D" : "#B45309",
                        bgcolor: row.eventType === 1 ? "#FCE7F3" : "#FEF3C7",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.receptionLocation || "—"}
                  </TableCell>
                  <TableCell>{row.assignedTeamName || "—"}</TableCell>
                  <TableCell>{row.currentStatusName || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function PhotographyDashboard() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate } = IsPermissionEnabled(Number.isFinite(cId) ? cId : CATEGORY_ID);

  const { data, loading } = useApi("/PhotographyReservation/GetDashboard");
  const { data: eventTypesRaw } = useApi("/PhotographyEventType/GetActiveEventTypes");
  const d = data || {};
  const eventTypes = Array.isArray(eventTypesRaw) ? eventTypesRaw : [];
  const byStatus = d.byStatus || [];
  const byEventType = d.byEventType || [];
  const monthlyTrend = d.monthlyTrend || [];
  const teamWorkload = d.teamWorkload || [];
  const upcoming = d.upcomingReservations || [];
  const todayFunctions = d.todayFunctions || [];
  const tomorrowFunctions = d.tomorrowFunctions || [];

  const capacityPct =
    d.activeTeams > 0 ? Math.round(((d.weddingsToday || 0) / d.activeTeams) * 100) : 0;

  const statusPie = byStatus
    .filter((s) => s.count > 0)
    .map((s) => ({ name: s.statusName, value: s.count, color: s.colorCode }));
  const eventTypePie = byEventType.map((e) => ({ name: e.name, value: e.count }));
  const teamBars = teamWorkload.map((t) => ({ name: t.teamName, value: t.count }));
  const capacityData = [{ name: "Capacity", value: capacityPct, fill: capacityPct >= 100 ? "#EF4444" : "#6366F1" }];
  const eventTypeIcon = (name) => {
    const type = eventTypes.find(
      (eventType) => String(eventType.name || eventType.Name).toLowerCase() === String(name).toLowerCase()
    );
    const Icon = resolveEventTypeIcon(type?.iconName ?? type?.IconName);
    return <Icon />;
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>📊 Photography Dashboard</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Dashboard</li>
        </ul>
      </div>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={2.5}>
          {/* Stat cards */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<CameraAltIcon />}
              label="Total Reservations"
              value={d.total}
              gradient="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={eventTypeIcon("Wedding")}
              label="Weddings"
              value={d.weddings}
              gradient="linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={eventTypeIcon("Birthday Party")}
              label="Birthday Parties"
              value={d.birthdayParties}
              gradient="linear-gradient(135deg, #F59E0B 0%, #FB923C 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<UpcomingIcon />}
              label="Upcoming (30 days)"
              value={d.upcomingCount}
              gradient="linear-gradient(135deg, #10B981 0%, #14B8A6 100%)"
            />
          </Grid>

          {/* Monthly trend area chart */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={panelSx}>
              <SectionTitle icon={<EventIcon fontSize="small" sx={{ color: "#6366F1" }} />}>
                Bookings Trend (12 months)
              </SectionTitle>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gWed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC4899" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gBday" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13 }} />
                    <Area
                      type="monotone"
                      dataKey="weddings"
                      name="Weddings"
                      stroke="#EC4899"
                      strokeWidth={2.5}
                      fill="url(#gWed)"
                    />
                    <Area
                      type="monotone"
                      dataKey="birthdayParties"
                      name="Birthday Parties"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      fill="url(#gBday)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Event type donut */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={panelSx}>
              <SectionTitle icon={<EventIcon fontSize="small" sx={{ color: "#EC4899" }} />}>
                Event Types
              </SectionTitle>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventTypePie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {eventTypePie.map((entry, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Status distribution donut */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={panelSx}>
              <SectionTitle icon={<CheckCircleIcon fontSize="small" sx={{ color: "#10B981" }} />}>
                Reservations by Status
              </SectionTitle>
              <Box sx={{ height: 300 }}>
                {statusPie.length === 0 ? (
                  <Typography color="text.secondary">No status data.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusPie.map((entry, i) => (
                          <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                      <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Team workload bar chart */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={panelSx}>
              <SectionTitle icon={<CameraAltIcon fontSize="small" sx={{ color: "#3B82F6" }} />}>
                Team Workload (upcoming)
              </SectionTitle>
              <Box sx={{ height: 300 }}>
                {teamBars.length === 0 ? (
                  <Typography color="text.secondary">No upcoming assignments.</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamBars} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F1F4" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "#F9FAFB" }} />
                      <Bar dataKey="value" name="Events" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {teamBars.map((entry, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Capacity radial */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={panelSx}>
              <SectionTitle
                icon={<EventIcon fontSize="small" sx={{ color: "#F59E0B" }} />}
                action={
                  <Link href="/photography/availability/" style={{ textDecoration: "none" }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: "#6366F1" }}>
                      Check availability
                    </Typography>
                  </Link>
                }
              >
                Today&apos;s Wedding Capacity
              </SectionTitle>
              <Box sx={{ height: 230, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={20}
                    data={capacityData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar background dataKey="value" cornerRadius={12} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#111827" }}>
                    {capacityPct}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    used
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                {d.weddingsToday || 0} of {d.activeTeams || 0} slot(s) used ·{" "}
                <b>{d.capacityRemainingToday || 0}</b> remaining
              </Typography>
            </Paper>
          </Grid>

          {/* Today functions */}
          <Grid item xs={12}>
            <FunctionsTable
              title="Today — All Functions"
              icon={<TodayIcon fontSize="small" sx={{ color: "#6366F1" }} />}
              items={todayFunctions}
              emptyMessage="No functions scheduled for today."
            />
          </Grid>

          {/* Tomorrow functions */}
          <Grid item xs={12}>
            <FunctionsTable
              title="Tomorrow — Functions"
              icon={<UpcomingIcon fontSize="small" sx={{ color: "#10B981" }} />}
              items={tomorrowFunctions}
              emptyMessage="No functions scheduled for tomorrow."
            />
          </Grid>

          {/* Upcoming events table */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={panelSx}>
              <SectionTitle icon={<EventAvailableIcon fontSize="small" sx={{ color: "#8B5CF6" }} />}>
                Upcoming Events
              </SectionTitle>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Card No</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Couple / Client</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Team</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#6B7280" }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcoming.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography color="text.secondary">No upcoming events.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      upcoming.map((u) => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.cardNo}</TableCell>
                          <TableCell>{u.coupleNames}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={u.eventTypeName}
                              sx={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: u.eventType === 1 ? "#BE185D" : "#B45309",
                                bgcolor: u.eventType === 1 ? "#FCE7F3" : "#FEF3C7",
                              }}
                            />
                          </TableCell>
                          <TableCell>{formatDate(u.eventDate)}</TableCell>
                          <TableCell>{u.assignedTeamName || "—"}</TableCell>
                          <TableCell>{u.currentStatusName || "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </>
  );
}
