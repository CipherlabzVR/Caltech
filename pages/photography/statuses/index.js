import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  Chip,
  Stack,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import AddStatus from "./create";
import EditStatus from "./edit";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { getAgentTypes, isApiSuccess } from "@/Services/photographyAgentService";

const CATEGORY_ID = 228;

export default function PhotographyStatusList() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, update, remove } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );
  const controller = "PhotographyEventStatus/DeleteStatus";
  const [agentTypeFilter, setAgentTypeFilter] = useState("");
  const [agentTypeOptions, setAgentTypeOptions] = useState([]);

  const {
    data: list,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    setExtraQuery,
    fetchData: fetchList,
  } = usePaginatedFetch("PhotographyEventStatus/GetAllStatusPaged", "", 10, false, false);

  useEffect(() => {
    getAgentTypes()
      .then((data) => {
        if (!isApiSuccess(data)) return;
        const rows = data.result || data.Result || [];
        const mapped = rows
          .map((t) => ({
            value: Number(t.id ?? t.Id),
            label: t.name ?? t.Name ?? "",
          }))
          .filter((t) => Number.isFinite(t.value) && t.value > 0 && t.label);
        if (mapped.length) setAgentTypeOptions(mapped);
      })
      .catch(() => {});
  }, []);

  const extraFor = (agentType) => (agentType ? { AgentType: agentType } : {});

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchList(1, event.target.value, pageSize, false, "", extraFor(agentTypeFilter));
    setPage(1);
  };

  const handleAgentTypeFilterChange = (event) => {
    const value = event.target.value;
    setAgentTypeFilter(value);
    const extra = extraFor(value);
    setExtraQuery(extra);
    setPage(1);
    fetchList(1, search, pageSize, false, "", extra);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchList(value, search, pageSize, false, "", extraFor(agentTypeFilter));
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchList(1, search, size, false, "", extraFor(agentTypeFilter));
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>🏷️ Reservation Statuses</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Statuses</li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} md={5} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by name…"
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} md={4} lg={3} order={{ xs: 3, lg: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Agent Type</InputLabel>
            <Select
              value={agentTypeFilter}
              label="Agent Type"
              onChange={handleAgentTypeFilterChange}
            >
              <MenuItem value="">All agents</MenuItem>
              {agentTypeOptions.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3} lg={5} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 3 }}>
          {create ? <AddStatus fetchItems={() => fetchList(page, search, pageSize, false, "", extraFor(agentTypeFilter))} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 4, lg: 4 }}>
          <TableContainer component={Paper}>
            <Table aria-label="statuses" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Agents</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!list || list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No statuses available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.displayOrder}</TableCell>
                      <TableCell>
                        {item.colorCode ? (
                          <span
                            style={{
                              display: "inline-block",
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              backgroundColor: item.colorCode,
                              verticalAlign: "middle",
                              marginRight: 6,
                            }}
                          />
                        ) : null}
                        {item.colorCode || "-"}
                      </TableCell>
                      <TableCell>
                        {item.isSystem ? (
                          <span className="successBadge">System</span>
                        ) : (
                          <span>Custom</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.agentTypeNames?.length ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {item.agentTypeNames.map((name) => (
                              <Chip key={name} size="small" label={name} />
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="error">Not set</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? <EditStatus item={item} fetchItems={fetchList} /> : ""}
                        {remove && !item.isSystem ? (
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={fetchList}
                          />
                        ) : (
                          ""
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
                page={page}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handleChangeRowsPerPage}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
