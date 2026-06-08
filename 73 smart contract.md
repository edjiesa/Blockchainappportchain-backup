# 📜 73 Smart Contract Methods (PortChain)

Berikut adalah daftar lengkap seluruh fungsi pintar (Smart Contract) yang telah ditanamkan ke dalam arsitektur **Hyperledger Fabric** di proyek PortChain. Seluruh *contract* ini mendukung sistem perizinan pelabuhan, pencatatan bea cukai, verifikasi E-Bill of Lading (EBL), dan validasi integritas End-to-End.

## 🏢 1. Organisasi (Organization)
1. `CreateOrganization`
2. `GetOrganizationById`
3. `GetAllOrganizations`
4. `UpdateOrganization`

## 👤 2. Pengguna (User)
5. `CreateUser`
6. `GetUser`
7. `GetUsersByOrganization`
8. `UpdateUser`
9. `DeactivateUser`

## 🚢 3. Pengiriman (Shipment)
10. `CreateShipment`
11. `GetShipment`
12. `GetShipmentByCode`
13. `UpdateShipment`
14. `UpdateShipmentStatus`
15. `GetAllShipments`

## 📦 4. Kontainer (Container)
16. `CreateContainer`
17. `GetContainer`
18. `GetContainersByShipment`
19. `UpdateContainer`
20. `UpdateContainerStatus`

## 📄 5. Dokumen (Document)
21. `UploadDocument`
22. `GetDocument`
23. `GetDocumentsByShipment`
24. `UpdateDocument`
25. `InvalidateDocument`

## 📂 6. Arsip & Hashing Dokumen (Document File & Hash)
26. `StoreDocumentFile`
27. `GetDocumentFile`
28. `GenerateDocumentHash`
29. `GetDocumentHash`
30. `VerifyDocumentHash`
31. `RecordHashToBlockchain`

## 🛂 7. Bea Cukai (Customs Clearance)
32. `CreateCustomsClearance`
33. `GetCustomsClearance`
34. `UpdateCustomsStatus`
35. `ApproveCustoms`
36. `RejectCustoms`
37. `GetCustomsByShipment`

## 📜 8. Sertifikat (Certificate)
38. `IssueCertificate`
39. `GetCertificate`
40. `ValidateCertificate`
41. `RevokeCertificate`
42. `GetCertificatesByUser`

## 🔍 9. Riwayat Kontainer (Container Trace)
43. `LogContainerStatus`
44. `GetContainerHistory`
45. `VerifyContainerStatus`

## 🛡️ 10. Log Audit (Audit Trail)
46. `RecordAuditLog`
47. `GetAuditLogs`
48. `GetAuditLogsByUser`
49. `VerifyAuditIntegrity`

## ⛓️ 11. Transaksi Blockchain (Blockchain Tx)
50. `RecordBlockchainTx`
51. `GetBlockchainTx`
52. `LinkTxToEntity`
53. `VerifyTransaction`

## 🪙 12. Tokenisasi (E-Bill of Lading Token)
54. `IssueEBLToken`
55. `GetEBLToken`
56. `GetTokensByOwner`
57. `TransferEBLToken`
58. `VerifyTokenOwnership`

## 💸 13. Riwayat Transfer EBL (Transfer History)
59. `RecordEBLTransfer`
60. `GetTransferHistory`

## 🔄 14. Sinkronisasi Off-Chain ke On-Chain (Sync Layer)
61. `SyncAuditLogToBlockchain`
62. `SyncDocumentHash`
63. `SyncCustomsToBlockchain`
64. `SyncEBLTransfer`

## ✅ 15. Modul Validasi Lanjutan (Verifikasi End-to-End)
65. `VerifyDocumentIntegrity`
66. `VerifyAuditTrail`
67. `VerifyShipmentHistory`
68. `VerifyContainerTrace`
69. `VerifyEndToEndFlow`

## 🔐 Fungsi Internal & Akses
70. `CheckPermission` (Internal Access Control)
71. `OnlyAdmin` (Role Validation)
72. `OnlyCustomsOfficer` (Role Validation)
73. `OnlyOrgOwner` (Role Validation)
*(Fungsi utilitas `_putState` dan `_getState` tidak masuk hitungan publik)*

---
*File ini merepresentasikan cakupan logika bisnis lengkap pada `portchain-contract.js` di dalam arsitektur PortChain.*

## 🌐 Ekstensi Sistem (Off-Chain Query)
Selain 73 fungsi *On-Chain* di atas, ekosistem PortChain juga memiliki metode khusus di *middleware* (Go JSON-RPC) untuk kebutuhan akses data publik dengan performa tinggi:
- **`TrackShipment`**: Melakukan agregasi data riwayat pengiriman, status bea cukai, pencetakan token, dan transfer e-BL dari PostgreSQL untuk disajikan secara instan di Public Tracking Dashboard tanpa membebani *node* Fabric.
