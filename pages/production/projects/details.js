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
import { Box, Button, Chip, Typography } from "@mui/material";
import AddPayment from "@/components/UIElements/Modal/AddPayment";
import Notes from "@/components/UIElements/Modal/Notes";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatCurrency } from "@/components/utils/formatHelper";
import { getProductionTaskStatus, getStatusColor, getWindowType } from "@/components/types/types";

export default function ProjectDetails() {
  const router = useRouter();
  const id = router.query.id;
  const [project, setProject] = useState({});
  const [tasks, setTasks] = useState([]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetProjectDetailsById?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Fabric List");
      }
      const data = await response.json();
      setProject(data.result.result);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllProjectTaskByProjectId?projectId=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Fabric List");
      }
      const data = await response.json();
      setTasks(data.result);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
  }, []);

  const navigateToRecheck = (id) => {
    router.push({
      pathname: "/production/projects/task-details",
      query: { taskId: id },
    });
  };  

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Project Details</h1>
        <ul>
          <li>
            <Link href="/production/projects">All Projects</Link>
          </li>
          <li>Projects Details</li>
        </ul>
      </div>
      <Grid container sx={{ background: "#fff" }}>
        <Grid item xs={12} px={2} pt={2} display="flex" gap={2}>
          <Link href="/production/projects">
            <Button variant="outlined">Go Back</Button>
          </Link>
          <Chip color="primary" label="50% Completed" />
        </Grid>
        <Grid item xs={12} lg={5} px={2}>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>Customer Name</Typography>
            <Typography as="h5">{project?.customerDetails?.title} {project?.customerDetails?.firstName} {project?.customerDetails?.lastName}</Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography> Customer NIC</Typography>
            <Typography as="h5">
              {project?.customerDetails?.nic}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography> Customer Address</Typography>
            <Typography as="h5">
              {project?.customerDetails?.addressLine1} {project?.customerDetails?.addressLine2} {project?.customerDetails?.addressLine3}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography> Company</Typography>
            <Typography as="h5">
              {project?.customerDetails?.company}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>Designation</Typography>
            <Typography as="h5">
              {project?.customerDetails?.designation}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>
              Inquiry Type
            </Typography>
            <Typography as="h5">
              {getWindowType(project.windowType)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} lg={5} px={2}>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>
              Inquiry Code
            </Typography>
            <Typography as="h5">
              {project?.inqCode}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>
              Inquiry Option Name
            </Typography>
            <Typography as="h5">
              {project?.inqOptionName}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>
              Style Name
            </Typography>
            <Typography as="h5">
              {project?.styleName}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>
              Quantity
            </Typography>
            <Typography as="h5">
              {project?.totalUnits}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>
              Approved Unit Cost
            </Typography>
            <Typography as="h5">
              {formatCurrency(project?.apprvedUnitCost)}
            </Typography>
          </Box>
          <Box my={2} display="flex" justifyContent="space-between">
            <Typography>
              Approved Selling Price
            </Typography>
            <Typography as="h5">
              {formatCurrency(project?.apprvedSellingPrice)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} lg={2} px={2}>
          <Box my={2}>
            <AddPayment />
          </Box>
          <Box my={2}>
            <Button fullWidth variant="contained" color="primary">
              Delivered
            </Button>
          </Box>
          <Box my={2}>
            <Notes />
          </Box>
        </Grid>
        <Grid item xs={12} mb={3} px={2}>
          <Typography variant="h5" my={2}>
            Task Details
          </Typography>
          <TableContainer component={Paper}>
            <Table
              aria-label="simple table"
              className="dark-table"
            >
              <TableHead>
                <TableRow sx={{ background: "#757fef" }}>
                  <TableCell sx={{ color: "#fff" }}>Task</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Completed Quantity</TableCell>                  
                  <TableCell sx={{ color: "#fff" }}>Completed Percentage</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Status</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Rechecked Quantity</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Rechecking Status</TableCell>
                  <TableCell sx={{ color: "#fff" }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ?
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography color="error">No Tasks Available</Typography>
                    </TableCell>
                  </TableRow> : (
                    tasks.map((task, index) => (
                      <TableRow key={index}>
                        <TableCell>{task.taskName}</TableCell>
                        <TableCell>{task.completedQuantity}</TableCell>                        
                        <TableCell>{task.completedPercentage} %</TableCell>
                        <TableCell>
                          <Chip size="small" sx={{ background: getStatusColor(task.productionTaskStatus) }} label={getProductionTaskStatus(task.productionTaskStatus)} />
                        </TableCell>
                        <TableCell>{task.recheckedQuantity}</TableCell>
                        <TableCell>
                          <Chip size="small" sx={{ background: getStatusColor(task.checkingTaskStatus) }} label={getProductionTaskStatus(task.checkingTaskStatus)} />
                        </TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" onClick={() => navigateToRecheck(task.id)}>
                            Recheck
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
              </TableBody>
              <TableBody>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
