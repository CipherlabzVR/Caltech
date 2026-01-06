import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';
import {
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  OutlinedInput,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import ViewQuotation from "./ViewQuotation";
import BASE_URL from "Base/api";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const errorStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

export default function PrintQuotation({ quotationDet, fetchItems }) {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");
  const [errorOpen, setErrorOpen] = React.useState(false);
  const [disabled, setDisabled] = useState(true);
  const handleOpen = (scrollType) => {
    setScroll(scrollType);
    if (quotationDet.customerDetails) {
      setOpen(true);
    } else {
      setErrorOpen(true);
    }
  };

  const handleCloseError = () => setErrorOpen(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [url, setUrl] = useState("");
  const currentDate = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [validDate, setValidDate] = useState("");
  const [termDays, setTermDays] = useState("");
  const [handoverDate, setHandoverDate] = useState();
  const [selectedStartDate, setSelectedStartDate] = useState(currentDate);
  const [percentage, setPercentage] = useState();

  const handleClose = () => {
    setOpen(false);
    setSelectedDate(currentDate);
    setValidDate("");
    setTermDays("")
    setHandoverDate();
    setSelectedStartDate(currentDate);
    setPercentage();
    setSelectedOption("");
    fetchItems();
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: "numeric", month: "long", year: "numeric" };
    return date.toLocaleDateString("en-GB", options);
  }

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleDateSelect = (value) => {
    setSelectedDate(value);
  };

  const handleStartDateSelect = (value) => {
    setSelectedStartDate(value);
  };

  const handlePercentageSelect = (value) => {
    setPercentage(value);
  };
  const handleValidSelect = (value) => {
    if (value <= 40) {
      setValidDate(value);
    } else {
      setValidDate(40);
    }
  };

  const handleHandoverDateSelect = (value) => {
    if (value <= 30) {
      setHandoverDate(value);
    } else {
      setHandoverDate(30);
    }
  };

  const handleTermDays = (value) => {
    setTermDays(value);
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/AWS/GetAllDocumentsByOption?InquiryID=${quotationDet.inquiryID}&OptionId=${quotationDet.optionId}&WindowType=${quotationDet.windowType}`,
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
      const responseData = await response.json();
      if (!responseData.result || !Array.isArray(responseData.result)) {
        throw new Error("Data is not in the expected format");
      }
      const data = responseData.result;
      const filteredData = data.filter((item) => item.documentType === 7);
      const documentURLs = filteredData.map((item) => item.documentURL);
      setUrl(documentURLs[0]);
    } catch (error) { }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (
      selectedDate &&
      selectedStartDate &&
      percentage &&
      validDate &&
      handoverDate &&
      selectedOption
    ) {
      if (selectedOption === "2" || selectedOption === "3") {
        if (termDays) {
          setDisabled(false);
        } else {
          setDisabled(true);
        }
      } else {
        setDisabled(false);
      }
    } else {
      setDisabled(true);
    }
  }, [selectedDate, selectedStartDate, percentage, validDate, handoverDate, termDays, selectedOption]);

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        View
      </Button>
      <Modal
        scroll={scroll}
        open={open}
        // onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "500",
                  mb: "12px",
                }}
              >
                Quotation Details
              </Typography>
            </Grid>
            <Box sx={{ maxHeight: '60vh', overflowY: 'scroll' }}>
              <Grid container>
                <Grid item xs={12} lg={4} mt={1} p={1}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "8px",
                    }}
                  >
                    Date
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    id="outlined-basic"
                    variant="outlined"
                    value={selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} lg={4} mt={1} p={1}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "8px",
                    }}
                  >
                    Start Date
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    id="outlined-basic"
                    variant="outlined"
                    value={selectedStartDate}
                    onChange={(e) => handleStartDateSelect(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} lg={4} mt={1} p={1}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "8px",
                    }}
                  >
                    Advance Payment
                  </Typography>
                  <FormControl fullWidth>
                    <OutlinedInput
                      value={percentage}
                      id="outlined-adornment-amount"
                      onChange={(e) => handlePercentageSelect(e.target.value)}
                      endAdornment={
                        <InputAdornment position="start">%</InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} lg={4} mt={1} p={1}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "8px",
                    }}
                  >
                    Valid Days
                  </Typography>
                  <FormControl fullWidth>
                    <OutlinedInput
                      value={validDate}
                      id="outlined-adornment-amount"
                      onChange={(e) => handleValidSelect(e.target.value)}
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} lg={4} mt={1} p={1}>
                  <Typography
                    as="h5"
                    sx={{
                      fontWeight: "500",
                      fontSize: "14px",
                      mb: "8px",
                    }}
                  >
                    Working Days
                  </Typography>
                  <FormControl fullWidth>
                    <OutlinedInput
                      value={handoverDate}
                      id="outlined-adornment-amount"
                      onChange={(e) => handleHandoverDateSelect(e.target.value)}
                      endAdornment={
                        <InputAdornment position="start">
                          Working Days
                        </InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>
                {(selectedOption === "2" || selectedOption === "3") && (
                  <Grid item xs={12} lg={4} mt={1} p={1}>
                    <Typography
                      as="h5"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "8px",
                      }}
                    >
                      Credit Term Days
                    </Typography>
                    <FormControl fullWidth>
                      <OutlinedInput
                        value={termDays}
                        id="outlined-adornment-amount"
                        onChange={(e) => handleTermDays(e.target.value)}
                        endAdornment={
                          <InputAdornment position="start">Days</InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                )}
                {percentage && (
                  <Grid item xs={12} mt={1} p={1}>
                    <Typography
                      as="h5"
                      sx={{
                        fontWeight: "500",
                        fontSize: "14px",
                        mb: "8px",
                      }}
                    >
                      Select Option
                    </Typography>
                    <FormControl>
                      <RadioGroup
                        aria-labelledby="demo-row-radio-buttons-group-label"
                        defaultValue="1"
                        name="radio-buttons-group"
                        value={selectedOption}
                        onChange={handleOptionChange}
                      >
                        <FormControlLabel
                          value="1"
                          control={<Radio />}
                          label={
                            <span>
                              <strong>Option 1</strong> - {percentage}% Advance
                              payment with the confirmation of the order & balance is
                              due on prior to collection.
                            </span>
                          }
                        />
                        <FormControlLabel
                          sx={{ mt: 2 }}
                          value="2"
                          control={<Radio />}
                          label={
                            <span>
                              <strong>Option 2</strong> - {percentage}% advance
                              payment with the confirmation of the order & balance is
                              due within {termDays} days credit after the delivery.
                            </span>
                          }
                        />
                        <FormControlLabel
                          sx={{ mt: 2 }}
                          value="3"
                          control={<Radio />}
                          label={
                            <span>
                              <strong>Option 3</strong> - Purchase Order (PO) with the
                              confirmation of the order & payment is due within {" "}
                              {termDays} days credit after the delivery.
                            </span>
                          }
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </Box>
            <Grid item xs={12} mt={2}>
              <ViewQuotation
                percentage={percentage}
                startDate={formatDate(selectedStartDate)}
                quotDetails={quotationDet}
                selectedDate={formatDate(selectedDate)}
                selectedOption={selectedOption}
                validDate={validDate}
                termDay={termDays}
                handoverDate={handoverDate}
                url={url}
                isDisabled={disabled}
                onCloseModal={handleClose}
              />
              <Button
                sx={{ ml: 1 }}
                variant="contained"
                color="error"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      <Modal
        open={errorOpen}
        onClose={handleCloseError}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={errorStyle} className="bg-black">
          <Grid container>
            <Grid item xs={12} mt={1} p={1}>
              <center>
                <ReportGmailerrorredIcon sx={{ fontSize: '30px' }} color="error" />
              </center>
              <Typography variant="h6" color="error" align="center">Something went wrong!</Typography>
              <Typography color="error" align="center">Customer details not found or empty.</Typography>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
