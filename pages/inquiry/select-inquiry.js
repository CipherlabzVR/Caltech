import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  Button,
  Typography,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
} from "@mui/material";
import Card from "@mui/material/Card";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import AddOption from "@/components/UIElements/Modal/AddOption";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import EditOption from "@/components/UIElements/Modal/EditOption";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};
const hover = {
  transition: "0.5s",
  "&:hover": {
    backgroundColor: "#e5e5e5",
    cursor: "pointer",
  },
};

export default function SelectInquiry() {
  const [open, setOpen] = React.useState(false);
  const [selectedInquiry, setSelectedInquiry] = React.useState(1);
  const router = useRouter();
  const inquiryDetailsStringified = localStorage.getItem("InquiryDetails");
  const inquiryDetails = JSON.parse(inquiryDetailsStringified);
  const customerName = inquiryDetails.customerName;
  const InqId = inquiryDetails.id;
  const [optionList, setOptionList] = useState([]);

  const handleClose = () => setOpen(false);

  const handleNavigation = (optionDetails) => {
    // const OptionDetailsStringified = JSON.stringify(optionDetails);
    // localStorage.setItem("OptionDetails", OptionDetailsStringified);


    router.push({
      pathname: "/inquiry/edit-inquiry/",
      query: { id: optionDetails.inquiryID, from: 1, option: optionDetails.id },
    });
    // if (selectedInquiry === 1) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 1 },
    //   });
    // } else if (selectedInquiry === 2) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 2 },
    //   });
    // } else if (selectedInquiry === 3) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 3 },
    //   });
    // } else if (selectedInquiry === 4) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 4 },
    //   });
    // } else if (selectedInquiry === 5) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 5 },
    //   });
    // } else if (selectedInquiry === 6) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 6 },
    //   });
    // } else if (selectedInquiry === 7) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 7 },
    //   });
    // } else if (selectedInquiry === 8) {
    //   router.push({
    //     pathname: "/inquiry/select-fabric",
    //     query: { inqType: 8 },
    //   });
    // }
  };

  const handleFileChange = async (event, option) => {
    const file = event.target.files[0];
    try {
      const formData = new FormData();
      formData.append("File", file);
      formData.append("InquiryID", option.inquiryID);
      formData.append("InqCode", option.inqCode);
      formData.append("WindowType", option.windowType);
      formData.append("OptionId", option.id);
      formData.append("DocumentType", 8);
      formData.append("DocumentContentType", 14);
      formData.append("DocumentSubContentType", 6);
      formData.append("FileName", `Option.png`);

      const response = await fetch(`${BASE_URL}/AWS/DocumentUpload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  };

  const fetchOptionList = async (category) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquiryOptionByWindowType?inqCateforyId=${category}&inqId=${InqId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Color Code List");
      }

      const data = await response.json();
      setOptionList(data.result);
    } catch (error) {
      console.error("Error fetching Color Code List:", error);
    }
  };

  const handleOpen = (category) => {
    setSelectedInquiry(category);
    setOpen(true);
    fetchOptionList(category);
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <Typography color="primary" variant="h6">
          {customerName}'s Inquiry
        </Typography>
        <ul>
          <li>
            <Link href="/inquiry/inquries/">Inquries</Link>
          </li>
          <li>Select Inquiry Category</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Select Inquiry Category</Typography>
          <Link href="/inquiry/inquries/">
            <Button variant="outlined" color="error">
              exit
            </Button>
          </Link>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(1)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      T Shirt
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/tshirt.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(2)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      Shirt
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/shirt.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(3)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      Cap
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/cap.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(4)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      Visor
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/visor.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(5)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      Hat
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/hat.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(6)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      Bag
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/bag.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(7)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      Bottom
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/bottom.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} p={1} md={4} lg={3}>
              <Card
                onClick={() => handleOpen(8)}
                sx={{
                  boxShadow: "none",
                  borderRadius: "10px",
                  p: "20px",
                  mb: "15px",
                  position: "relative",
                  height: "auto",
                  cursor: "pointer",
                }}
              >
                <Grid container>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      alignItems="end"
                      as="h4"
                      fontWeight="500"
                      fontSize="17px"
                      mt="10px"
                    >
                      Short
                    </Typography>
                  </Grid>
                  <Grid
                    mt={2}
                    mb={2}
                    item
                    display="flex"
                    justifyContent="center"
                    xs={12}
                  >
                    <img width="100px" src="/images/inquiry/shorts.png" />
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {/* modal */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid container>
              <Grid item xs={12} display="flex" justifyContent="space-between">
                <AddOption
                  category={selectedInquiry}
                  fetchItems={fetchOptionList}
                />
                <IconButton
                  color="error"
                  variant="contained"
                  onClick={handleClose}
                >
                  <CloseIcon />
                </IconButton>
              </Grid>
              <Grid item xs={12} mt={2}>
                <Box sx={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                  <Grid container>
                    <TableContainer component={Paper}>
                      <Table aria-label="simple table" className="dark-table">
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Inquiry No</TableCell>
                            <TableCell align="right">Inquiry Option</TableCell>
                            <TableCell align="right">Document</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {optionList.length === 0 ? (
                            <TableRow
                              sx={{
                                "&:last-child td, &:last-child th": { border: 0 },
                              }}
                            >
                              <TableCell colSpan={3} component="th" scope="row">
                                <Typography color="error">
                                  No Options Available
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            optionList.map((option, index) => {
                              const isDisabled = option.inquiryStatus === 1;

                              return (
                                <TableRow
                                  key={index}
                                  sx={hover}
                                  style={!isDisabled ? { pointerEvents: "none", opacity: 0.5 } : {}}
                                >
                                  <TableCell
                                    component="th"
                                    scope="row"
                                    onClick={isDisabled ? () => handleNavigation(option) : undefined}
                                  >
                                    <Box>
                                      {index + 1}
                                    </Box>
                                  </TableCell>
                                  <TableCell
                                    onClick={isDisabled ? () => handleNavigation(option) : undefined}
                                  >
                                    <Box>{option.inqCode}</Box>
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    onClick={isDisabled ? () => handleNavigation(option) : undefined}
                                  >
                                    <Box>{option.optionName}</Box>
                                  </TableCell>
                                  <TableCell align="right">
                                    <input
                                      type="file"
                                      id={`frontImage-${index}`}
                                      accept="image/*"
                                      style={{ display: "none" }}
                                      onChange={(event) => handleFileChange(event, option)}
                                      disabled={!isDisabled}
                                    />
                                    <label htmlFor={`frontImage-${index}`}>
                                      <IconButton color="primary" component="span" disabled={isDisabled}>
                                        <CloudUploadOutlinedIcon />
                                      </IconButton>
                                    </label>
                                  </TableCell>
                                  <TableCell align="right">
                                    <EditOption
                                      category={selectedInquiry}
                                      fetchItems={fetchOptionList}
                                      item={option}
                                      disabled={isDisabled}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })

                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
