const getDeviceName = () => {
  if (typeof navigator === "undefined") {
    return "Unknown Device";
  }

  const platform = navigator.userAgentData?.platform || navigator.platform || "Unknown Platform";
  return platform;
};

export default getDeviceName;
