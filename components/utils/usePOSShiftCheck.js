import IsPOSShiftAvailable from "./IsPOSShiftAvailable";

const usePOSShiftCheck = () => {
  const { data: isShiftAvailable } = IsPOSShiftAvailable();

  if (isShiftAvailable === false) {
    return { result: true, message: "Please create shift first" };
  }

  return { result: false, message: "Unexpected condition" };
};

export default usePOSShiftCheck;
