import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const IsPermissionEnabled = (cId) => {
  const hasPermission = (permissions, type, names = []) =>
    permissions.some((item) => {
      const permissionType = Number(item.permissionType ?? item.PermissionType);
      const permissionName = String(item.name ?? item.permissionName ?? item.Name ?? "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      const enabledValue =
        item.isActive ??
        item.IsActive ??
        item.isPermissionEnabled ??
        item.IsPermissionEnabled ??
        item.isGranted ??
        item.IsGranted;
      const isEnabled = enabledValue === undefined || enabledValue === true || enabledValue === 1 || enabledValue === "1";

      return isEnabled && (permissionType === type || names.includes(permissionName));
    });

  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [navigate, setNavigate] = useState(true);
  const [create, setCreate] = useState(false);
  const [update, setUpdate] = useState(false);
  const [remove, setRemove] = useState(false);
  const [print, setPrint] = useState(false);
  const [customPrint, setCustomPrint] = useState(false);
  const [approve1, setApprove1] = useState(false);
  const [approve2, setApprove2] = useState(false);
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
  // Stock Details — edit Selling / Cost Price (id 30)
  const [editStockPrice, setEditStockPrice] = useState(false);
  // Photography action perms (only present on PhotographyReservationCard category, ids 40-41)
  const [photoAssignTeam, setPhotoAssignTeam] = useState(false);
  const [photoChangeStatus, setPhotoChangeStatus] = useState(false);

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

        setNavigate(hasPermission(data, 1, ["navigation"]));
        setCreate(hasPermission(data, 2, ["create"]));
        setUpdate(hasPermission(data, 3, ["update"]));
        setRemove(hasPermission(data, 4, ["delete", "remove"]));
        setPrint(hasPermission(data, 5, ["print"]));
        setApprove1(hasPermission(data, 6, ["approvallevel1", "approvelevel1"]));
        setApprove2(hasPermission(data, 7, ["approvallevel2", "approvelevel2"]));
        setApprove3(hasPermission(data, 8, ["approvallevel3", "approvelevel3"]));
        setCustomPrint(hasPermission(data, 9, ["customprint"]));
        setJcDiagnose(hasPermission(data, 20));
        setJcApprove(hasPermission(data, 21));
        setJcStartWork(hasPermission(data, 22));
        setJcHoldResume(hasPermission(data, 23));
        setJcMarkReady(hasPermission(data, 24));
        setJcDeliver(hasPermission(data, 25));
        setJcPartsSubmit(hasPermission(data, 26));
        setJcPartsApprove(hasPermission(data, 27));
        setJcLineEdit(hasPermission(data, 28));
        setWhatsAppShare(hasPermission(data, 29));
        setEditStockPrice(hasPermission(data, 30));
        setPhotoAssignTeam(hasPermission(data, 40));
        setPhotoChangeStatus(hasPermission(data, 41));
      } catch (err) {
        if (!cancelled) {
          setNavigate(false);
          setCreate(false);
          setUpdate(false);
          setRemove(false);
          setPrint(false);
          setApprove1(false);
          setApprove2(false);
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
          setEditStockPrice(false);
          setPhotoAssignTeam(false);
          setPhotoChangeStatus(false);
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
    approve2,
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
    editStockPrice,
    photoAssignTeam,
    photoChangeStatus,
    permissionsLoading,
  };
};

export default IsPermissionEnabled;
