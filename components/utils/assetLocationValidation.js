import * as Yup from "yup";

const CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_\- .]*$/;
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _\-./()&,]*$/;
const PATH_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _\-./>()&,]*$/;

export const locationLevelValues = [1, 2, 3, 4, 5, 6];

export const assetLocationValidationSchema = Yup.object().shape({
  LocationCode: Yup.string()
    .trim()
    .required("Location code is required")
    .min(2, "Min 2 characters")
    .max(20, "Max 20 characters")
    .matches(
      CODE_PATTERN,
      "Use letters, numbers, dot, dash, underscore or space"
    ),

  LocationName: Yup.string()
    .trim()
    .required("Location name is required")
    .min(2, "Min 2 characters")
    .max(150, "Max 150 characters")
    .matches(
      NAME_PATTERN,
      "Only letters, numbers and . _ - / ( ) & , are allowed"
    ),

  ParentLocationId: Yup.mixed()
    .nullable()
    .test(
      "parent-id-int",
      "Invalid parent location",
      (v) => v == null || v === "" || Number.isInteger(Number(v))
    ),

  LocationLevel: Yup.number()
    .typeError("Location level is required")
    .oneOf(locationLevelValues, "Select a valid level")
    .required("Location level is required"),

  FullPath: Yup.string()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .max(250, "Max 250 characters")
    .test(
      "path-pattern",
      "Use letters, numbers and . _ - / > ( ) & , are allowed",
      (v) => v == null || PATH_PATTERN.test(v)
    ),

  Address: Yup.string()
    .nullable()
    .transform((v) => (v === "" ? null : v))
    .max(500, "Max 500 characters"),

  IsActive: Yup.boolean().required(),
});
