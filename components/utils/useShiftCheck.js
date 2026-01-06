import IsShiftAvailable from "@/components/utils/IsShiftAvailable";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import IsDayEndDone from "@/components/utils/IsDayEndDone";

const useShiftCheck = () => {
  const { data: isShiftAvailable } = IsShiftAvailable();
  const { data: isDayEndDone } = IsDayEndDone();
  const { data: isPOSShiftLinkToBackOffice } = IsAppSettingEnabled("IsPOSShiftLinkToBackOffice");

  if (isPOSShiftLinkToBackOffice === false) {
    return { result: false, message: "POS Shift Link is not enabled" };
  }

  if (isShiftAvailable === false) {
    return { result: true, message: "Please create shift first" };
  }

  return { result: false, message: "Unexpected condition" };
};

export default useShiftCheck;
