import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Dashboard } from "./components/Dashboard";
import { Shipments } from "./components/Shipments";
import { CustomsClearance } from "./components/CustomsClearance";
import { Documents } from "./components/Documents";
import { EBLManagement } from "./components/EBLManagement";
import { Organizations } from "./components/Organizations";
import { BlockchainExplorer } from "./components/BlockchainExplorer";
import { AuditTrail } from "./components/AuditTrail";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { 
        index: true, 
        Component: Dashboard 
      },
      { 
        path: "shipments", 
        Component: Shipments 
      },
      { 
        path: "customs", 
        Component: CustomsClearance 
      },
      { 
        path: "documents", 
        Component: Documents 
      },
      { 
        path: "ebl", 
        Component: EBLManagement 
      },
      { 
        path: "organizations", 
        Component: Organizations 
      },
      { 
        path: "blockchain", 
        Component: BlockchainExplorer 
      },
      { 
        path: "audit", 
        Component: AuditTrail 
      },
    ],
  },
]);