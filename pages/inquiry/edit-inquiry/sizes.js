import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  Table,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  IconButton,
  Card,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AddSizesToInquiry from "@/components/UIElements/Modal/AddSizesToInquiry";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import EditSizesToInquiry from "@/components/UIElements/Modal/EditSizesToInquiry";

export default function SelectSizes() {
  const router = useRouter();
  const inqId = router.query.id;
  const optId = router.query.option;
  const [inquiry, setInquiry] = useState(null);
  const [inqType, setInqType] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [inquirySizeList, setInquirySizeList] = useState([]);

  const fetchInquiryById = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Inquiry/GetInquiryByInquiryId?id=${inqId}&optId=${optId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Fabric List");
      }

      const data = await response.json();
      const inq = data.result;
      setInquiry(inq);
      setInqType(inq.windowType);
      fetchInquirySizeList(inq.inquiryId, inq.optionId, inq.windowType);
      fetchComponent(inq.inquiryId, inq.optionId, inq.windowType);
    } catch (error) {
      console.error("Error fetching Fabric List:", error);
    }
  };

  const fetchInquirySizeList = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllInquirySize?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch GSM List");
      }

      const data = await response.json();
      setInquirySizeList(data.result);
    } catch (error) {
      console.error("Error fetching GSM List:", error);
    }
  };

  const fetchComponent = async (inquiryId, optionId, windowType) => {
    try {
      const response = await fetch(
        `${BASE_URL}/ComponentPanel/GetComponentPanelByInq?InquiryID=${inquiryId}&OptionId=${optionId}&WindowType=${windowType}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Neck Body List");
      }
      const data = await response.json();
      const dataresult = data.result.result;
      if (dataresult) {
        const resultoption = dataresult.find(
          (item) => item.componentTypes === 16
        );
        if (resultoption) {
          const type = resultoption.componentFirstRows;
          setSelectedOption(
            type == 7
              ? "Contrast"
              : type == 13
                ? "Flap"
                : type == 14
                  ? "Zipper"
                  : "Pockets"
          );
        }
      }
    } catch (error) {
      console.error("Error fetching Neck Body List:", error);
    }
  };

  useEffect(() => {
    if (inqId,optId) {
      fetchInquiryById();
    }
  }, []);

  const handleOptionChange = async (event, index) => {
    setSelectedOption(event.target.value);
    const response = await fetch(
      `${BASE_URL}/ComponentPanel/CreateComponentPanel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          InquiryID: inquiry.inquiryId,
          InqCode: inquiry.inquiryCode,
          OptionId: inquiry.optionId,
          InqOptionName: optionName,
          WindowType: inquiry.windowType,
          ComponentTypes: 16,
          ComponentFirstRows: index,
          ComponentValue: "",
        }),
      }
    );
  };

  const NavigationNext = () => {
    const routes = {
      1: "/inquiry/edit-inquiry/tshirt/neck/",
      2: "/inquiry/edit-inquiry/shirt/coller/",
      3: "/inquiry/edit-inquiry/cap/info/",
      4: "/inquiry/edit-inquiry/visor/components/",
      5: "/inquiry/edit-inquiry/hat/document-panel/",
      6: "/inquiry/edit-inquiry/bag/document-panel/",
      7: "/inquiry/edit-inquiry/bottom/component/",
      8: "/inquiry/edit-inquiry/short/component/",
    };
    router.push({
      pathname: routes[inquiry.windowType],
      query: { id: inquiry.inquiryId, option: inquiry.optionId },
    });
  };

  const DeleteInquirySize = (SizeID) => {
    const requestBody = {
      InquiryID: inquiry.inquiryId,
      OptionId: inquiry.optionId,
      SizeID: SizeID,
      WindowType: inquiry.windowType,
    };
    fetch(`${BASE_URL}/Inquiry/DeleteInquirySize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        toast.success(data.message);
        fetchInquirySizeList(inquiry.inquiryId, inquiry.optionId, inquiry.windowType);
      })
      .catch((error) => {
        console.error("There was a problem with the request:", error);
      });
  };

  return (
    <>
      <ToastContainer />

      <DashboardHeader
        customerName={inquiry ? inquiry.customerName : ""}
        optionName={inquiry ? inquiry.optionName : ""}
        href="/inquiry/inquries/"
        link="Inquiries"
        title="Sizes"
      />

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} display="flex" justifyContent="space-between">
          <Typography>Sizes</Typography>
          <Box display="flex" sx={{ gap: "10px" }}>
            <Link href={`/inquiry/edit-inquiry/color-code/?id=${inquiry ? inquiry.inquiryId : ""}&option=${inquiry ? inquiry.optionId : ""}`}>
              <Button variant="outlined" color="primary">
                previous
              </Button>
            </Link>
            <Button
              variant="outlined"
              color="primary"
              endIcon={<NavigateNextIcon />}
              onClick={() => NavigationNext()}
            >
              next
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12} p={1}>
              <TableContainer component={Paper}>
                <Table aria-label="simple table" className="dark-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Size</TableCell>
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">2XS</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">XS</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">S</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">M</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">L</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">2XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">3XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ? (
                        <TableCell align="center">4XL</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 ||
                        inqType == 2 ||
                        inqType == 7 ||
                        inqType == 8 ||
                        inqType == 6 ? (
                        <TableCell align="center">
                          {inqType == 6 ? "Side Width" : "5XL"}
                        </TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 6 ? (
                        <TableCell align="center">Width</TableCell>
                      ) : (
                        ""
                      )}
                      {inqType == 1 || inqType == 2 || inqType == 6 ? (
                        <TableCell align="center">
                          {inqType == 6 ? "Height" : "Length"}
                        </TableCell>
                      ) : (
                        ""
                      )}
                      <TableCell align="center">Total</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inquirySizeList.length === 0 ? (
                      <TableRow
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell colSpan={3} component="th" scope="row">
                          <Typography color="error">
                            No Inquiry Sizes Added
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      inquirySizeList.map((inquirysize, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {index + 1}
                          </TableCell>
                          <TableCell>{inquirysize.sizeName}</TableCell>
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.twoXS === 0
                                ? "-"
                                : inquirysize.twoXS}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.xs === 0 ? "-" : inquirysize.xs}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.s === 0 ? "-" : inquirysize.s}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.m === 0 ? "-" : inquirysize.m}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.l === 0 ? "-" : inquirysize.l}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.xl === 0 ? "-" : inquirysize.xl}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.twoXL === 0
                                ? "-"
                                : inquirysize.twoXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.threeXL === 0
                                ? "-"
                                : inquirysize.threeXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.fourXL === 0
                                ? "-"
                                : inquirysize.fourXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 ||
                            inqType == 2 ||
                            inqType == 6 ||
                            inqType == 7 ||
                            inqType == 8 ? (
                            <TableCell align="center">
                              {inquirysize.fiveXL === 0
                                ? "-"
                                : inquirysize.fiveXL}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 || inqType == 6 ? (
                            <TableCell align="center">
                              {inquirysize.width === 0
                                ? "-"
                                : inquirysize.width}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          {inqType == 1 || inqType == 2 || inqType == 6 ? (
                            <TableCell align="center">
                              {inquirysize.length === 0
                                ? "-"
                                : inquirysize.length}
                            </TableCell>
                          ) : (
                            ""
                          )}
                          <TableCell align="center">
                            {inquirysize.totalQty}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete" placement="top">
                              <IconButton
                                onClick={() =>
                                  DeleteInquirySize(inquirysize.sizeID)
                                }
                                aria-label="delete"
                                size="small"
                              >
                                <DeleteIcon color="error" fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} p={1}>
              <EditSizesToInquiry fetchItems={fetchInquirySizeList} inquiry={inquiry} />
            </Grid>
            {inqType == 6 ? (
              <Grid item xs={12} p={1}>
                <Grid container>
                  <Grid item xs={12} p={1} md={4} lg={3}>
                    <Card
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
                      <RadioGroup
                        name="bag"
                        value={selectedOption}
                        onChange={(event) => handleOptionChange(event, 7)}
                      >
                        <FormControlLabel
                          value="Contrast"
                          control={<Radio />}
                          label="Contrast"
                        />
                      </RadioGroup>
                    </Card>
                  </Grid>
                  <Grid item xs={12} p={1} md={4} lg={3}>
                    <Card
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
                      <RadioGroup
                        name="bag"
                        value={selectedOption}
                        onChange={(event) => handleOptionChange(event, 13)}
                      >
                        <FormControlLabel
                          value="Flap"
                          control={<Radio />}
                          label="Flap"
                        />
                      </RadioGroup>
                    </Card>
                  </Grid>
                  <Grid item xs={12} p={1} md={4} lg={3}>
                    <Card
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
                      <RadioGroup
                        name="bag"
                        value={selectedOption}
                        onChange={(event) => handleOptionChange(event, 14)}
                      >
                        <FormControlLabel
                          value="Zipper"
                          control={<Radio />}
                          label="Zipper"
                        />
                      </RadioGroup>
                    </Card>
                  </Grid>
                  <Grid item xs={12} p={1} md={4} lg={3}>
                    <Card
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
                      <RadioGroup
                        name="bag"
                        value={selectedOption}
                        onChange={(event) => handleOptionChange(event, 15)}
                      >
                        <FormControlLabel
                          value="Pockets"
                          control={<Radio />}
                          label="Pockets"
                        />
                      </RadioGroup>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            ) : (
              ""
            )}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
