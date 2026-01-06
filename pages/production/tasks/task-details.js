import React, { useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import Chat from "../chat";
import AdminChat from "../adminchat";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { useEffect } from "react";
import TaskAltIcon from '@mui/icons-material/TaskAlt';

export default function TaskDetails() {
  const [start, setStart] = useState(false);
  const [taskDetails, setTaskDetails] = useState({});
  const [value, setValue] = useState(1);
  const [apQty, setApQty] = useState(30);
  const [ppQty, setPpQty] = useState(70);
  const usertype = localStorage.getItem("type");
  const router = useRouter();
  const { taskId } = router.query;

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetTasksById?id=${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      const task = data.result.result;
      const qty = task.quantity - task.completedQuantity;
      if (task.productionTaskStatus === 2) {
        setStart(true);
      }
      if (task.productionTaskStatus === 4) {
        setStart(false);
      }
      setTaskDetails(task);
      setPpQty(qty);
      setValue(task.completedQuantity);
    } catch (error) {
      console.error("Error fetching :", error);
    }
  };
  useEffect(() => {
    fetchTaskDetails();
  }, []);

  const handleStart = () => {
    if (start) {
      handleStatusUpdate(5);
    } else {
      handleStatusUpdate(2);
    }
    setStart((prevStart) => !prevStart);
  };

  const navigateToBack = () => {
    if(taskDetails.productionTaskStatus === 2){
      handleStatusUpdate(5);
    }
    router.push({
      pathname: "/production/tasks",
    });
  };

  const handleStatusUpdate = async (status) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/UpdateTaskStatusById?id=${taskId}&status=${status}&recheck=${false}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

    } catch (error) {
      console.error("Error fetching :", error);
    }
  }

  const handleQuantityUpdate = async (bool) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/UpdateTaskQuantityById?id=${taskId}&isAdd=${bool}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      fetchTaskDetails();
    } catch (error) {
      console.error("Error fetching :", error);
    }
  }

  const handlePlus = () => {
    setValue(value + 1);
    setApQty(apQty + 1);
    setPpQty(ppQty - 1);
    handleQuantityUpdate(true);
  };
  const handleMinus = () => {
    if (value != 0) {
      setValue(value - 1);
      setApQty(apQty - 1);
      setPpQty(ppQty + 1);
      handleQuantityUpdate(false);
    }
  };
  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Task Details</h1>
        <ul>
          <li>
            <Link href="/production/tasks">Tasks</Link>
          </li>
          <li>Task Details</li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={8} sx={{ background: "#fff" }} p={2}>
          <Grid container>
            <Grid item xs={12} mb={2}>
              <Typography variant="h6">{taskDetails.taskName}</Typography>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              {taskDetails.productionTaskStatus === 4 ?
                <Button
                  variant="contained"
                  color="success"
                  onClick={navigateToBack}
                >
                  <TaskAltIcon style={{ fontSize: '3rem', color: '#fff' }} />
                </Button>
                :
                <Button
                  variant={start ? "contained" : "outlined"}
                  color="primary"
                  onClick={handleStart}
                  sx={{
                    mt: 2,
                    textTransform: "uppercase",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "20px",
                    padding: "12px 20px",
                    width: "150px",
                  }}
                >
                  {start ? "Pause" : "Start"}
                </Button>}
              <Box
                mt={2}
                px={3}
                sx={{ gap: "10px", width: "100%" }}
                display="flex"
                justifyContent="space-between"
              >
                <ButtonGroup fullWidth>
                  <Button sx={{ height: "60px", border: "none" }}>
                    Project Pending Qunatity
                  </Button>
                  <Button sx={{ fontSize: "20px" }}>{ppQty}</Button>
                </ButtonGroup>
              </Box>

              <Button
                variant="outlined"
                color="error"
                onClick={navigateToBack}
                sx={{
                  mt: 2,
                  textTransform: "uppercase",
                  borderRadius: "8px",
                  fontWeight: "500",
                  fontSize: "20px",
                  padding: "12px 20px",
                  width: "150px",
                }}
              >
                Exit
              </Button>
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Grid container mt={2}>
                <Grid item xs={4}>
                  <Button
                    onClick={handleMinus}
                    disabled={!start}
                    variant="contained"
                    color="success"
                    sx={{
                      textTransform: "uppercase",
                      padding: "12px 20px",
                      height: "100px",
                    }}
                    fullWidth
                  >
                    <RemoveIcon sx={{ fontWeight: "500", fontSize: "30px" }} />
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{ height: "100%", border: "1px solid #e5e5e5" }}
                  >
                    <Typography sx={{ fontWeight: "bold" }} variant="h2">
                      {value}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    onClick={handlePlus}
                    disabled={!start}
                    variant="contained"
                    color="success"
                    sx={{
                      textTransform: "uppercase",
                      padding: "12px 20px",
                      height: "100px",
                    }}
                    fullWidth
                  >
                    <AddIcon sx={{ fontWeight: "500", fontSize: "30px" }} />
                  </Button>
                </Grid>
              </Grid>
            </Grid>

            <Grid
              item
              xs={12}
              mt={2}
              sx={{ gap: "10px" }}
              display="flex"
              justifyContent="space-between"
            >
              <ButtonGroup fullWidth>
                <Button sx={{ height: "60px", border: "none" }}>
                  Approval Pending Qunatity
                </Button>
                <Button sx={{ fontSize: "20px" }}>{apQty}</Button>
              </ButtonGroup>
            </Grid>
            <Grid
              item
              xs={12}
              mt={4}
              sx={{ gap: "10px" }}
              display="flex"
              justifyContent="space-between"
            >
              <ButtonGroup fullWidth>
                <Button sx={{ height: "60px", border: "none" }}>
                  Daily Target
                </Button>
                <Button sx={{ fontSize: "20px" }}>20</Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} lg={4} sx={{ background: "#fff" }} p={2}>
          {/* {usertype == 1 ? <AdminChat /> : <Chat />} */}
        </Grid>
      </Grid>
    </>
  );
}
