import { Navigate, useOutletContext } from "react-router-dom";

export default function ProtectedRoute({ requiredPermissions, children }) {
  const { myPermissions, isOwner, loaded, canCreatePharmacy, selectedPharmacy } = useOutletContext();

  if (!loaded) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-2xl">refresh</span>
      </div>
    );
  }

  if (myPermissions === null && selectedPharmacy) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-2xl">refresh</span>
      </div>
    );
  }

  if (myPermissions === null && !selectedPharmacy) {
    if (canCreatePharmacy && requiredPermissions.includes('pharmacy_manage')) {
      return children;
    }
    return <Navigate to="/Dashboard" replace />;
  }

  if (isOwner) return children;

  if (!requiredPermissions.length) return children;

  const hasAccess = requiredPermissions.some((p) => myPermissions[p]);
  if (!hasAccess) return <Navigate to="/Dashboard" replace />;

  return children;
}
