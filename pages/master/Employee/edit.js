import React, { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogTitle, Grid, FormControl, InputLabel,
  MenuItem, Select, TextField, Typography, Button, IconButton, Tooltip,
  Checkbox, FormControlLabel, Box
} from "@mui/material";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import { Code } from "@mui/icons-material";

// Validation Schema
const validationSchema = Yup.object().shape({
  TitleName: Yup.string().required("Title is required"),
  FirstName: Yup.string().required("First Name is required"),
  NIC: Yup.string()
     .matches(/^\d{9}[vVxX]$|^\d{12}$/, "NIC must be valid (9 or 12 digits)")
     .required("NIC is required"),
  Gender: Yup.number().required("Gender is required"),
  ContractType: Yup.number().required("Contract type is required"),
  JoinDate: Yup.date().required("Join date is required"),
  SupervisorID: Yup.number().nullable(),
});



export default function EditEmployeeDialog({ fetchItems, item }) {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState("paper");
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
  const handleClose = () => setOpen(false);

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

    const titleData = await titles.json();
    const deptData = await depts.json();
    const jobData = await jobs.json();
    const supData = await sups.json();
    const contractData = await contracts.json();
    const genderData = await genderRes.json();
    const shiftData = await shiftsRes.json();

    setTitleList(titleData.result || []);
    setDepartments(deptData.result || []);
    setJobTitles(jobData.result || []);
    const allEmployees = supData.result || [];
    setSupervisors(allEmployees.filter((e) => e.isSupervisor === true || e.IsSupervisor === true));
    setContractTypes(contractData || []);
    setGenders(genderData);
    setShifts(shiftData?.result?.items ?? shiftData?.data?.items ?? []);
    const otTypeData = await otTypesRes.json();
    const otList = otTypeData?.result?.items ?? otTypeData?.data?.items ?? otTypeData?.items ?? [];
    setOtTypes(Array.isArray(otList) ? otList : []);
  } catch (err) {
    console.error("❌ Failed to load dropdown data:", err);
    toast.error("Failed to load dropdown data");
  }
};


  // Submit Handler
const handleSubmit = (values) => {
 const payload = {
  id: item.id,
  code: item.Code||"",               // ensure string
  titleName: values.TitleName|| "", // map selected id to string
  firstName: values.FirstName,
  lastName: values.LastName || "-",
  nic: values.NIC,
  birthDay: values.DateOfBirth || null,   // default date if null
  gender: parseInt(values.Gender),
  jobTitleId: parseInt(values.JobTitleId) || null,
  departmentId: parseInt(values.DepartmentId) || null,
  warehouseId: parseInt(values.WarehouseId) || 1,
  shiftId: values.ShiftId ? parseInt(values.ShiftId) : null,
  otTypeAvailable: values.OtTypeAvailable ?? false,
  otTypeId: values.OtTypeAvailable && values.OTTypeId ? parseInt(values.OTTypeId, 10) : null,
  contractType: parseInt(values.ContractType),
  joinDate: values.JoinDate,
  resignDate: values.ResignDate || null,
  permanentDate: values.PermanentDate || null,
  addressLine1: values.AddressLine1,
  addressLine2: values.AddressLine2,
  addressLine3: values.AddressLine3,
  contactNumber: values.ContactNumber,
  personalNumber: values.PersonalNumber,
  email: values.Email,
  supervisorID: values.SupervisorID ? parseInt(values.SupervisorID, 10) : null,
  imageURL: values.ImageURL || "",
  isActive: values.IsActive,
  isLabour: values.IsLabour,
  isSupervisor: values.IsSupervisor,
};


 
fetch(`${BASE_URL}/Employee/UpdateEmployeescyAsync`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
})
  .then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const text = await res.text(); // ✅ read raw text
    return text ? JSON.parse(text) : {}; // ✅ only parse if not empty
  })
  .then((data) => {
   
    if (data.statusCode === 200 || Object.keys(data).length === 0) {
      toast.success("Employee updated successfully");
      fetchItems();
      setOpen(false);
    } else {
      toast.error(data.message || "Update failed");
    }
  })
  .catch((err) => {
    console.error("❌ API Error:", err);
    toast.error(err.message);
  });

};


  return (
    <>
      <Tooltip title="Edit Employee">
        <IconButton onClick={handleClickOpen("paper")} size="small">
          <BorderColorIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} scroll={scroll} maxWidth="md" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={{
              Code:item.Code,
              TitleName: item.titleName || "",
              FirstName: item.firstName || "",
              LastName: item.lastName || "",
              NIC: item.nic || "",
              DateOfBirth: formatDate(item.birthDay) || "",
              Gender: item.gender || "",
              JobTitleId: item.jobTitleId || "",
              DepartmentId: item.departmentId || "",
              ShiftId: item.shiftId != null ? item.shiftId : "",
              OtTypeAvailable: item.otTypeAvailable ?? false,
              OTTypeId: item.otTypeId != null ? item.otTypeId : "",
              ContractType: item.contractType || "",
              JoinDate: formatDate(item.joinDate) || "",
              ResignDate: formatDate(item.resignDate) || "",
              PermanentDate: formatDate(item.permanentDate) || "",
              AddressLine1: item.addressLine1 || "",
              AddressLine2: item.addressLine2 || "",
              AddressLine3: item.addressLine3 || "",
              ContactNumber: item.contactNumber || "",
              PersonalNumber: item.personalNumber || "",
              Email: item.email || "",
              SupervisorID: item.supervisorID || "",
              WarehouseId: item.warehouseId || "1",
                IsActive: item.isActive ?? true,
                IsLabour: item.isLabour ?? false,
                IsSupervisor: item.isSupervisor ?? false,
              ImageURL: item.imageURL || "",
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
                      name="TitleName"
                      value={values.TitleName}   // match Formik initialValues
                      onChange={(e) => setFieldValue("TitleName", e.target.value)}
                    >
                      {titleList.map((t) => (
                        <MenuItem key={t.id} value={t.title}>{t.title}</MenuItem>
                      ))}
                    </Select>

                        {errors.TitleName && touched.TitleName && (
                          <Typography color="error">{errors.TitleName}</Typography>
                        )}
                      </FormControl>

                   </Grid>

                    {/* First Name, Last Name, NIC */}
                    {["FirstName", "LastName", "NIC"].map((f) => (
                      <Grid item xs={12} sm={6} key={f}>
                        <Field as={TextField} label={f} name={f} fullWidth
                          error={touched[f] && Boolean(errors[f])}
                          helperText={touched[f] && errors[f]}
                        />
                      </Grid>
                    ))}

                    {/* Date of Birth */}
                    <Grid item xs={12} sm={6}>
                      <Field as={TextField} type="date" label="Birthday" name="DateOfBirth"
                        fullWidth InputLabelProps={{ shrink: true }}
                        error={touched.DateOfBirth && Boolean(errors.DateOfBirth)}
                        helperText={touched.DateOfBirth && errors.DateOfBirth}
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
                      </FormControl>
                    </Grid>

                    {/* Department + Job Title */}
                    {[{ label: "DepartmentId", list: departments }, { label: "JobTitleId", list: jobTitles }].map(({ label, list }) => (
                      <Grid item xs={12} sm={6} key={label}>
                        <FormControl fullWidth>
                          <InputLabel>{label.replace(/Id$/, "")}</InputLabel>
                          <Select
                            name={label}
                            value={values[label]}
                            onChange={(e) => setFieldValue(label, e.target.value)}
                          >
                            {list.map((i) => (
                              <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
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
                          {contractTypes.map((c) => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Join, Resign, Permanent */}
                    {["Join Date", "Resign Date", "Permanent Date"].map((f) => (
                      <Grid item xs={12} sm={6} key={f}>
                        <Field as={TextField} type="date" label={f} name={f}
                          fullWidth InputLabelProps={{ shrink: true }} />
                      </Grid>
                    ))}


                    {/* Contact Info */}
                    {["ContactNumber", "PersonalNumber", "Email"].map((f) => (
                      <Grid item xs={12} sm={6} key={f}>
                        <Field as={TextField} label={f} name={f} fullWidth />
                      </Grid>
                    ))}

                    {/* Supervisor (optional) */}
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
                      </FormControl>
                    </Grid>

                    {/* Address */}
                    {["AddressLine1", "AddressLine2", "AddressLine3"].map((f) => (
                      <Grid item xs={12} key={f}>
                        <Field as={TextField} label={f} name={f} fullWidth />
                      </Grid>
                    ))}

                    {/* Flags */}
                    <Grid item xs={12}>
                      {["IsActive", "IsLabour", "IsSupervisor"].map((f) => (
                        <FormControlLabel
                          key={f}
                          control={<Checkbox checked={values[f]} onChange={(e) => setFieldValue(f, e.target.checked)} />}
                          label={f.replace("Is", "")}
                        />
                      ))}
                    </Grid>
                  </Grid>
                </Box>

                 <Grid item xs={12}>
                                      <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        sx={{
                                          textTransform: "capitalize",
                                          borderRadius: "8px",
                                          fontWeight: "500",
                                          fontSize: "16px",
                                          padding: "12px 10px",
                                          color: "#fff !important",
                                        }}
                                      >
                                        Update Employee
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
