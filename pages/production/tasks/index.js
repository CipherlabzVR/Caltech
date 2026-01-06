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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Chip } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import { getProductionTaskStatus, getStatusColor, getWindowType } from "@/components/types/types";

export default function MyTasks() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [tasksList, setTasksList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { data: projectList } = useApi("/Inquiry/GetAllOngoingProjectsByStatus?inquirystatus=6");
  const router = useRouter();
  const userType = localStorage.getItem("type");

  const navigateToTask = (id) => {
    router.push({
      pathname: "/production/tasks/task-details",
      query: { taskId: id },
    });
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchTasksList(1, value, pageSize, projectId);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchTasksList(value, searchTerm, pageSize, projectId);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchTasksList(1, searchTerm, newSize, projectId);
  };

  const fetchTasksList = async (page = 1, search = "", size = pageSize, project) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Inquiry/GetAllTasksByProject?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&projectId=${project}&userType=${userType}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setTasksList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (projectList) {
      setProjects(projectList);
    }
  }, [projectList]);


  const handleSelectProject = (value) => {
    if (!value) {
      setTasksList([]);
    }
    setProjectId(value);
    fetchTasksList(1, searchTerm, pageSize, value);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>My Tasks</h1>
        <ul>
          <li>
            <Link href="/production/tasks/">My Tasks</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          <Select
            size="small"
            value={projectId}
            onChange={(e) => handleSelectProject(e.target.value)}
            displayEmpty
          >
            <MenuItem value="">
              Please Select Project
            </MenuItem>
            {projects.map((item, index) => (
              <MenuItem key={index} value={item.id}>{item.inqCode} - {item.customerName}</MenuItem>
            ))}

          </Select>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Inquiry</TableCell>
                  <TableCell>Inquiry Option</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Completed Quantity</TableCell>
                  <TableCell>Completed Percentage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasksList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No Tasks Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasksList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.taskName}</TableCell>
                      <TableCell>{getWindowType(item.windowType)}</TableCell>
                      <TableCell>{item.optionName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.completedQuantity}</TableCell>
                      <TableCell>{item.completedPercentage} %</TableCell>
                      <TableCell>
                        <Chip size="small" sx={{ background: getStatusColor(item.productionTaskStatus) }} label={getProductionTaskStatus(item.productionTaskStatus)} />
                      </TableCell>
                      <TableCell align="right">
                        <Button variant="outlined" onClick={() => navigateToTask(item.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
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
