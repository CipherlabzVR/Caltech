// Imports
import React, { useState } from "react";
import {
  Box, Button, Checkbox, Dialog, DialogContent, DialogTitle, FormControl,
  FormControlLabel, Grid, InputLabel, MenuItem, Select, TextField, Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { getOrgId } from "components/utils/apiHelpers";

// Validation Schema
const validationSchema = Yup.object().shape({
  TitleName: Yup.string().required("Title is required"),
  FirstName: Yup.string().required("First Name is required"),
  LastName: Yup.string().required("Last Name is required"),
  NIC: Yup.string()
    .matches(/^\d{9}[vVxX]$|^\d{12}$/, "NIC must be valid (9 or 12 digits)")
    .required("NIC is required"),
  Gender: Yup.number().required("Gender is required"),
  ContractType: Yup.number().required("Contract type is required"),
  JoinDate: Yup.date().required("Join date is required"),
  AddressLine1: Yup.string().required("Address is required"),
  ContactNumber: Yup.string().required("Contact number is required"),
  Email: Yup.string().email("Invalid email format").required("Email is required"),
  SupervisorID: Yup.number().nullable(),
});

export default function AddEmployeeDialog({ fetchEmployees }) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState("paper");
  const [imageFile, setImageFile] = useState(null);
  const [titleList, setTitleList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [contractTypes, setContractTypes] = useState([]);
  const [genders, setGenders] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [otTypes, setOtTypes] = useState([]);

  const token = localStorage.getItem("token");

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
    fetchDropdowns();
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Fetch dropdowns
  const fetchDropdowns = async () => {
    try {
      const authHeader = { Authorization: `Bearer ${token}` };

      const [titles, depts, jobs, sups, contracts, genderRes, shiftsRes, otTypesRes] = await Promise.all([
        fetch(`${BASE_URL}/Customer/GetAllPersonTitle`, { headers: authHeader }),
        fetch(`${BASE_URL}/Employee/GetAlldepartment`, { headers: authHeader }),
        fetch(`${BASE_URL}/Employee/GetAllJobTitle`, { headers: authHeader }),
        fetch(`${BASE_URL}/Employee/GetAllEmployees`, { headers: authHeader }),
        fetch(`${BASE_URL}/Employee/contract-types`, { headers: authHeader }),
        fetch(`${BASE_URL}/Employee/GetGender`, { headers: authHeader }),
        fetch(`${BASE_URL}/ShiftMaster/GetAllShifts?Search=&SkipCount=0&MaxResultCount=500`, { headers: authHeader }),
        fetch(`${BASE_URL}/OTType/GetAllOTType?Search=&SkipCount=0&MaxResultCount=500`, { headers: authHeader }),
      ]);

      setTitleList((await titles.json()).result || []);
      setDepartments((await depts.json()).result || []);
      setJobTitles((await jobs.json()).result || []);
      const allEmployees = (await sups.json()).result || [];
      setSupervisors(allEmployees.filter((e) => e.isSupervisor === true || e.IsSupervisor === true));
      setContractTypes((await contracts.json()) || []);
      setGenders((await genderRes.json()) || []);
      const shiftData = await shiftsRes.json();
      setShifts(shiftData?.result?.items ?? shiftData?.data?.items ?? []);
      const otTypeData = await otTypesRes.json();
      const otList = otTypeData?.result?.items ?? otTypeData?.data?.items ?? otTypeData?.items ?? [];
      setOtTypes(Array.isArray(otList) ? otList : []);
    } catch (err) {
      toast.error("Failed to load dropdown data");
    }
  };

  // Submit
  const handleSubmit = (values, { resetForm }) => {
    const payload = {
      titleName: values.TitleName,
      firstName: values.FirstName.trim(),
      lastName: values.LastName.trim(),
      nic: values.NIC.trim(),
      dateOfBirth: values.DateOfBirth || null,
      gender: parseInt(values.Gender, 10),
      jobTitleId: values.JobTitleId ? parseInt(values.JobTitleId, 10) : null,
      departmentId: values.DepartmentId ? parseInt(values.DepartmentId, 10) : null,
      warehouseId: values.WarehouseId ? parseInt(values.WarehouseId, 10) : null,
      contractType: parseInt(values.ContractType, 10),
      joinDate: values.JoinDate || null,
      resignDate: values.ResignDate || null,
      permanentDate: values.PermanentDate || null,
      addressLine1: values.AddressLine1?.trim() ?? "",
      addressLine2: values.AddressLine2?.trim() ?? "",
      addressLine3: values.AddressLine3?.trim() ?? "",
      contactNumber: values.ContactNumber?.trim() ?? "",
      personalNumber: values.PersonalNumber?.trim() ?? "",
      email: values.Email?.trim() ?? "",
      supervisorID: values.SupervisorID ? parseInt(values.SupervisorID, 10) : null,
      shiftId: values.ShiftId ? parseInt(values.ShiftId, 10) : null,
      otTypeAvailable: values.OtTypeAvailable ?? false,
      otTypeId: values.OtTypeAvailable && values.OTTypeId ? parseInt(values.OTTypeId, 10) : null,
      imageURL: values.ImageURL || "",
      isActive: values.IsActive,
      isLabour: values.IsLabour,
      isSupervisor: values.IsSupervisor,
    };

    fetch(`${BASE_URL}/Employee/CreateEmployeescyAsync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          toast.error(res.ok ? "Invalid response from server" : text?.slice(0, 100) || "Request failed");
          return;
        }
        const statusCode = data.statusCode ?? data.StatusCode;
        const isSuccess = 
          statusCode === 200 || 
          statusCode === "200" ||
          statusCode === "SUCCESS" ||
          (res.ok && statusCode !== -99 && statusCode !== "-99" && statusCode !== "FAILED");
        
        if (isSuccess) {
          toast.success(data.message || data.Message || "Employee created successfully");
          if (typeof fetchEmployees === "function") {
            fetchEmployees(); // refresh table after creation
          }
          resetForm();
          handleClose();
        } else {
          const errorMsg = data.message || data.Message || "Creation failed";
          toast.error(errorMsg);
        }
      })
      .catch((err) => {
        console.error("Error creating employee:", err);
        toast.error("Error: " + err.message);
      });
  };

  return (
    <>
      <Button variant="outlined" onClick={handleClickOpen("paper")}>
        <AddIcon /> Create New Employee
      </Button>

      <Dialog open={open} onClose={handleClose} scroll={scroll} maxWidth="md" fullWidth>
        <DialogTitle>Create Employee</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              TitleName: "",
              FirstName: "",
              LastName: "",
              NIC: "",
              DateOfBirth: "",
              Gender: "",
              JobTitleId: "",
              DepartmentId: "",
              ShiftId: "",
              OtTypeAvailable: false,
              OTTypeId: "",
              ContractType: "",
              JoinDate: "",
              ResignDate: "",
              PermanentDate: "",
              AddressLine1: "",
              AddressLine2: "",
              AddressLine3: "",
              ContactNumber: "",
              PersonalNumber: "",
              Email: "",
              SupervisorID: "", // optional
              WarehouseId: "1",
              ImageURL: "",
              IsActive: true,
              IsLabour: false,
              IsSupervisor: false,
              orgid: getOrgId() || "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, setFieldValue }) => (
              <Form>
                <Box sx={{ maxHeight: "70vh", overflowY: "auto" }}>
                  <Grid container spacing={2}>
                    {/* Title */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Title</InputLabel>
                        <Select
                          name="Title Name"
                          value={values.TitleName}
                          onChange={(e) => setFieldValue("TitleName", e.target.value)}
                        >
                          {titleList.map((title) => (
                            <MenuItem key={title.id} value={title.title}>{title.title}</MenuItem>
                          ))}
                        </Select>
                        {errors.TitleName && touched.TitleName && (
                          <Typography color="error">{errors.TitleName}</Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* FirstName, LastName, NIC */}
                    {["FirstName", "LastName", "NIC"].map((field) => (
                      <Grid item xs={12} sm={6} key={field}>
                        <Field
                          as={TextField}
                          label={field}
                          name={field}
                          fullWidth
                          error={touched[field] && Boolean(errors[field])}
                          helperText={touched[field] && errors[field]}
                        />
                      </Grid>
                    ))}

                    {/* Date of Birth */}
                    <Grid item xs={12} sm={6}>
                      <Field
                        as={TextField}
                        type="date"
                        label="Date of Birth"
                        name="DateOfBirth"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>

                    {/* Gender */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          name="Gender"
                          value={values.Gender}
                          onChange={(e) => setFieldValue("Gender", e.target.value)}
                        >
                          {genders.map((g) => (
                            <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                          ))}
                        </Select>
                        {errors.Gender && touched.Gender && (
                          <Typography color="error">{errors.Gender}</Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Department & Job Title */}
                    {[{ label: "DepartmentId", list: departments }, { label: "JobTitleId", list: jobTitles }].map(({ label, list }) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <FormControl fullWidth>
                          <InputLabel>{label.replace(/Id$/, "")}</InputLabel>
                          <Select
                            name={label}
                            value={values[label]}
                            onChange={(e) => setFieldValue(label, e.target.value)}
                          >
                            {list.map((item) => (
                              <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    ))}

                    {/* Shift (optional) */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Shift (optional)</InputLabel>
                        <Select
                          name="ShiftId"
                          value={values.ShiftId}
                          onChange={(e) => setFieldValue("ShiftId", e.target.value)}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {shifts.map((s) => (
                            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Is OT available + OT Type */}
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={values.OtTypeAvailable}
                            onChange={(e) => {
                              setFieldValue("OtTypeAvailable", e.target.checked);
                              if (!e.target.checked) setFieldValue("OTTypeId", "");
                            }}
                          />
                        }
                        label="Is OT available"
                      />
                      {values.OtTypeAvailable && (
                        <FormControl fullWidth size="small" sx={{ mt: 1, minWidth: 200 }}>
                          <InputLabel>OT Type</InputLabel>
                          <Select
                            name="OTTypeId"
                            label="OT Type"
                            value={values.OTTypeId ?? ""}
                            onChange={(e) => setFieldValue("OTTypeId", e.target.value ? Number(e.target.value) : "")}
                          >
                            <MenuItem value=""><em>Select OT Type</em></MenuItem>
                            {otTypes.map((ot) => (
                              <MenuItem key={ot.id} value={ot.id}>{ot.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>

                    {/* Contract Type */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Contract Type</InputLabel>
                        <Select
                          name="ContractType"
                          value={values.ContractType}
                          onChange={(e) => setFieldValue("ContractType", e.target.value)}
                        >
                          {contractTypes.map((ct) => (
                            <MenuItem key={ct.id} value={ct.id}>{ct.name}</MenuItem>
                          ))}
                        </Select>
                        {errors.ContractType && touched.ContractType && (
                          <Typography color="error">{errors.ContractType}</Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Dates */}
                    {[
                      { name: "JoinDate", label: "Join Date" },
                      { name: "ResignDate", label: "Resign Date" },
                      { name: "PermanentDate", label: "Permanent Date" },
                    ].map(({ name, label }) => (
                      <Grid item xs={12} sm={6} key={name}>
                        <Field
                          as={TextField}
                          type="date"
                          label={label}
                          name={name}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={touched[name] && Boolean(errors[name])}
                          helperText={touched[name] && errors[name]}
                        />
                      </Grid>
                    ))}

                    {/* Contact Info */}
                    {[
                      { name: "ContactNumber", label: "Contact Number" },
                      { name: "PersonalNumber", label: "Personal Number" },
                      { name: "Email", label: "Email" },
                    ].map(({ name, label }) => (
                      <Grid item xs={12} sm={6} key={name}>
                        <Field
                          as={TextField}
                          label={label}
                          name={name}
                          fullWidth
                          error={touched[name] && Boolean(errors[name])}
                          helperText={touched[name] && errors[name]}
                        />
                      </Grid>
                    ))}

                    {/* Supervisor Dropdown (optional) */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Supervisor (optional)</InputLabel>
                        <Select
                          name="SupervisorID"
                          value={values.SupervisorID ?? ""}
                          onChange={(e) => setFieldValue("SupervisorID", e.target.value || "")}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {supervisors.map((s) => (
                            <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>
                          ))}
                        </Select>
                        {errors.SupervisorID && touched.SupervisorID && (
                          <Typography color="error">{errors.SupervisorID}</Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Upload Image */}
                    <Grid item xs={12} sm={6}>
                      <Button variant="contained" component="label" fullWidth>
                        Upload Image
                        <input type="file" hidden accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                      </Button>
                      {imageFile && <Typography variant="body2">{imageFile.name}</Typography>}
                    </Grid>

                    {/* Address Fields */}
                    {["AddressLine1", "AddressLine2", "AddressLine3"].map((field) => (
                      <Grid item xs={12} key={field}>
                        <Field
                          as={TextField}
                          label={field}
                          name={field}
                          fullWidth
                          error={touched[field] && Boolean(errors[field])}
                          helperText={touched[field] && errors[field]}
                        />
                      </Grid>
                    ))}

                    {/* Flags */}
                    <Grid item xs={12}>
                      {["IsActive", "IsLabour", "IsSupervisor"].map((field) => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Checkbox
                              checked={values[field]}
                              onChange={(e) => setFieldValue(field, e.target.checked)}
                            />
                          }
                          label={field.replace("Is", "")}
                        />
                      ))}
                    </Grid>
                  </Grid>
                </Box>

                <Grid container justifyContent="space-between" mt={2}>
                  <Button type="button" color="error" variant="contained" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained">
                    Create Employee
                  </Button>
                </Grid>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    </>
  );
}
