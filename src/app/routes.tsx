import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { Root } from "./components/Root";
import { Dashboard } from "./components/Dashboard";
import { Shipments } from "./components/Shipments";
import { CustomsClearance } from "./components/CustomsClearance";
import { Documents } from "./components/Documents";
import { EBLManagement } from "./components/EBLManagement";
import { Organizations } from "./components/Organizations";
import { BlockchainExplorer } from "./components/BlockchainExplorer";
import { AuditTrail } from "./components/AuditTrail";
import { HardwareWallet } from "./components/HardwareWallet";
import { ScannerTools } from "./components/ScannerTools";
import { Login } from "./components/Login";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Root,
    children: [
      {
        path: "/",
        Component: ProtectedRoute,
        children: [
          { index: true, Component: Dashboard },
          { path: "shipments", Component: Shipments },
          { path: "customs", Component: CustomsClearance },
          { path: "documents", Component: Documents },
          { path: "ebl", Component: EBLManagement },
          { path: "organizations", Component: Organizations },
          { path: "blockchain", Component: BlockchainExplorer },
          { path: "audit", Component: AuditTrail },
          { path: "wallet", Component: HardwareWallet },
          { path: "scanner", Component: ScannerTools },
        ],
      },
    ],
  },
]);