import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const IsPermissionEnabled = (cId) => {
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [navigate, setNavigate] = useState(true);
  const [create, setCreate] = useState(false);
  const [update, setUpdate] = useState(false);
  const [remove, setRemove] = useState(false);
  const [print, setPrint] = useState(false);
  const [customPrint, setCustomPrint] = useState(false);
  const [approve1, setApprove1] = useState(false);
  const [approve3, setApprove3] = useState(false);
  // Job Card action perms (only present on ServiceJobCard category, ids 20-28)
  const [jcDiagnose, setJcDiagnose] = useState(false);
  const [jcApprove, setJcApprove] = useState(false);
  const [jcStartWork, setJcStartWork] = useState(false);
  const [jcHoldResume, setJcHoldResume] = useState(false);
  const [jcMarkReady, setJcMarkReady] = useState(false);
  const [jcDeliver, setJcDeliver] = useState(false);
  const [jcPartsSubmit, setJcPartsSubmit] = useState(false);
  const [jcPartsApprove, setJcPartsApprove] = useState(false);
  const [jcLineEdit, setJcLineEdit] = useState(false);
  // WhatsApp Share (scoped to modules that expose share, id 29)
  const [whatsAppShare, setWhatsAppShare] = useState(false);

  useEffect(() => {
    const role =
      typeof window !== "undefined" ? localStorage.getItem("role") : null;

    if (!role || cId == null || cId === "") {
      setPermissionsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;
        const response = await fetch(
          `${BASE_URL}/User/GetModuleCategoryPermissions?roleId=${role}&categoryId=${cId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch");
        }

        const result = await response.json();
        const data = result?.result?.result;
        if (!Array.isArray(data)) {
          throw new Error("Invalid permissions payload");
        }

        if (cancelled) return;

        setNavigate(data.some((item) => item.permissionType === 1));
        setCreate(data.some((item) => item.permissionType === 2));
        setUpdate(data.some((item) => item.permissionType === 3));
        setRemove(data.some((item) => item.permissionType === 4));
        setPrint(data.some((item) => item.permissionType === 5));
        setApprove1(data.some((item) => item.permissionType === 6));
        setApprove3(data.some((item) => item.permissionType === 8));
        setCustomPrint(data.some((item) => item.permissionType === 9));
        setJcDiagnose(data.some((item) => item.permissionType === 20));
        setJcApprove(data.some((item) => item.permissionType === 21));
        setJcStartWork(data.some((item) => item.permissionType === 22));
        setJcHoldResume(data.some((item) => item.permissionType === 23));
        setJcMarkReady(data.some((item) => item.permissionType === 24));
        setJcDeliver(data.some((item) => item.permissionType === 25));
        setJcPartsSubmit(data.some((item) => item.permissionType === 26));
        setJcPartsApprove(data.some((item) => item.permissionType === 27));
        setJcLineEdit(data.some((item) => item.permissionType === 28));
        setWhatsAppShare(data.some((item) => item.permissionType === 29));
      } catch (err) {
        if (!cancelled) {
          setNavigate(false);
          setCreate(false);
          setUpdate(false);
          setRemove(false);
          setPrint(false);
          setApprove1(false);
          setApprove3(false);
          setCustomPrint(false);
          setJcDiagnose(false);
          setJcApprove(false);
          setJcStartWork(false);
          setJcHoldResume(false);
          setJcMarkReady(false);
          setJcDeliver(false);
          setJcPartsSubmit(false);
          setJcPartsApprove(false);
          setJcLineEdit(false);
          setWhatsAppShare(false);
        }
      } finally {
        if (!cancelled) {
          setPermissionsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [cId]);

  return {
    navigate,
    create,
    update,
    remove,
    print,
    customPrint,
    approve1,
    approve3,
    jcDiagnose,
    jcApprove,
    jcStartWork,
    jcHoldResume,
    jcMarkReady,
    jcDeliver,
    jcPartsSubmit,
    jcPartsApprove,
    jcLineEdit,
    whatsAppShare,
    permissionsLoading,
  };
};

export default IsPermissionEnabled;
