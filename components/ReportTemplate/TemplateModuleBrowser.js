import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Grid,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SearchIcon from "@mui/icons-material/Search";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import styles from "@/styles/PageTitle.module.css";

function EmptyState({ message, sx }) {
  return (
    <Box sx={{ textAlign: "center", py: 8, color: "text.secondary", ...sx }}>
      <FolderOpenOutlinedIcon sx={{ fontSize: 52, opacity: 0.4 }} />
      <Typography sx={{ mt: 1 }}>{message}</Typography>
    </Box>
  );
}

/**
 * Master–detail browser for report/screen templates.
 *   Left  : searchable list of modules (e.g. Inventory, Sales, ...)
 *   Right : the templates inside the selected module (click to open the editor)
 * The selected module is driven by the `?module=` query param (deep-linkable),
 * defaulting to the first module so content is shown immediately.
 */
export default function TemplateModuleBrowser({
  pageTitle,
  basePath,
  modules = [],
  emptyMessage,
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const queryKey =
    typeof router.query.module === "string" ? router.query.module : null;
  const activeKey =
    (queryKey && modules.some((m) => m.key === queryKey) && queryKey) ||
    modules[0]?.key ||
    null;
  const activeModule = modules.find((m) => m.key === activeKey) || null;

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.templates || []).some((t) => t.title.toLowerCase().includes(q))
    );
  }, [modules, search]);

  const selectModule = (key) =>
    router.push({ pathname: basePath, query: { module: key } }, undefined, {
      shallow: true,
    });
  const openTemplate = (path) => router.push(path);

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>{pageTitle}</h1>
        <ul>
          <li>
            <Link href="/report-template/screens-template/">Report Template</Link>
          </li>
          <li>{pageTitle}</li>
          {activeModule && <li>{activeModule.title}</li>}
        </ul>
      </div>

      {modules.length === 0 ? (
        <Paper sx={{ p: { xs: 2, md: 3 } }}>
          <EmptyState message={emptyMessage || "No templates available yet."} />
        </Paper>
      ) : (
        <Grid container spacing={2} alignItems="stretch">
          {/* Left: module list */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 1.5, height: "100%" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search modules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              <Typography
                variant="overline"
                sx={{ px: 1, color: "text.secondary", letterSpacing: 0.6 }}
              >
                Modules
              </Typography>
              <List sx={{ maxHeight: { md: "62vh" }, overflowY: "auto", py: 0.5 }}>
                {filteredModules.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 1.5, py: 2 }}
                  >
                    No modules match “{search}”.
                  </Typography>
                ) : (
                  filteredModules.map((module) => {
                    const count = module.templates?.length || 0;
                    const isActive = module.key === activeKey;
                    return (
                      <ListItemButton
                        key={module.key}
                        selected={isActive}
                        onClick={() => selectModule(module.key)}
                        sx={{
                          borderRadius: 1.5,
                          mb: 0.5,
                          borderLeft: "3px solid transparent",
                          "&.Mui-selected": {
                            bgcolor: (theme) =>
                              alpha(theme.palette.primary.main, 0.1),
                            borderLeftColor: "primary.main",
                            "&:hover": {
                              bgcolor: (theme) =>
                                alpha(theme.palette.primary.main, 0.16),
                            },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 38 }}>
                          {module.icon ?? (
                            <Inventory2OutlinedIcon
                              fontSize="small"
                              color={isActive ? "primary" : "action"}
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={module.title}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 700 : 500,
                            fontSize: "0.9rem",
                          }}
                        />
                        <Chip
                          label={count}
                          size="small"
                          color={isActive ? "primary" : "default"}
                          variant={isActive ? "filled" : "outlined"}
                          sx={{ height: 20, minWidth: 26, fontSize: "0.7rem" }}
                        />
                      </ListItemButton>
                    );
                  })
                )}
              </List>
            </Paper>
          </Grid>

          {/* Right: templates of the selected module */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper sx={{ p: { xs: 2, md: 3 }, height: "100%" }}>
              {activeModule ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2.5,
                      pb: 2,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                      }}
                    >
                      {activeModule.icon ?? <Inventory2OutlinedIcon />}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {activeModule.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(activeModule.templates?.length || 0)} print template
                        {(activeModule.templates?.length || 0) === 1 ? "" : "s"}
                      </Typography>
                    </Box>
                  </Box>

                  {activeModule.templates?.length ? (
                    <Grid container spacing={2}>
                      {activeModule.templates.map((template) => (
                        <Grid item xs={12} sm={6} lg={4} key={template.key}>
                          <Card
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              height: "100%",
                              transition: "all 0.18s ease",
                              "&:hover": {
                                borderColor: "primary.main",
                                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                                transform: "translateY(-2px)",
                              },
                            }}
                          >
                            <CardActionArea
                              onClick={() => openTemplate(template.path)}
                              sx={{ p: 2, height: "100%" }}
                            >
                              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Box
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    bgcolor: (theme) =>
                                      alpha(theme.palette.primary.main, 0.1),
                                    color: "primary.main",
                                    flexShrink: 0,
                                  }}
                                >
                                  <DescriptionOutlinedIcon fontSize="small" />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 600 }}>
                                    {template.title}
                                  </Typography>
                                  {template.description && (
                                    <Typography variant="body2" color="text.secondary">
                                      {template.description}
                                    </Typography>
                                  )}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.3,
                                      mt: 1,
                                      color: "primary.main",
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Open editor
                                    <ChevronRightIcon sx={{ fontSize: 16 }} />
                                  </Box>
                                </Box>
                              </Box>
                            </CardActionArea>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <EmptyState message="No templates available for this module yet." />
                  )}
                </>
              ) : (
                <EmptyState message="Select a module to manage its print templates." />
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </>
  );
}
