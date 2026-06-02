'use strict';

const { Contract } = require('fabric-contract-api');

class PortchainContract extends Contract {
    
    // ==========================================
    // 15. ACCESS CONTROL (70-73)
    // ==========================================
    async CheckPermission(ctx, requiredRole) {
        // Implementasi ACL sederhana
        const clientMSPID = ctx.clientIdentity.getMSPID();
        if (!clientMSPID) throw new Error('Unauthenticated user');
        return true;
    }

    async OnlyAdmin(ctx) {
        // Role validasi (Placeholder)
        const msp = ctx.clientIdentity.getMSPID();
        if (msp !== 'portorg') throw new Error('Access Denied: Only Admin (Port Org)');
    }

    async OnlyCustomsOfficer(ctx) {
        const msp = ctx.clientIdentity.getMSPID();
        if (msp !== 'customsorg') throw new Error('Access Denied: Only Customs');
    }

    async OnlyOrgOwner(ctx, orgId) {
        return true; // Simplified for MVP
    }

    // Helper Functions
    async _putState(ctx, key, obj) {
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(obj)));
        return JSON.stringify(obj);
    }

    async _getState(ctx, key) {
        const buffer = await ctx.stub.getState(key);
        if (!buffer || buffer.length === 0) return null;
        return JSON.parse(buffer.toString());
    }

    // ==========================================
    // 1. ORGANIZATION & USER (1-9)
    // ==========================================
    async CreateOrganization(ctx, orgId, orgName, orgType) {
        await this.OnlyAdmin(ctx);
        const org = { orgId, orgName, orgType, docType: 'organization' };
        return await this._putState(ctx, `ORG_${orgId}`, org);
    }
    
    async GetOrganizationById(ctx, orgId) {
        return await this._getState(ctx, `ORG_${orgId}`);
    }

    async GetAllOrganizations(ctx) {
        const iterator = await ctx.stub.getStateByRange('ORG_', 'ORG_~');
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const Record = JSON.parse(res.value.value.toString('utf8'));
                allResults.push(Record);
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    async UpdateOrganization(ctx, orgId, orgName) {
        await this.OnlyAdmin(ctx);
        const org = await this.GetOrganizationById(ctx, orgId);
        if (!org) throw new Error("Org not found");
        org.orgName = orgName;
        return await this._putState(ctx, `ORG_${orgId}`, org);
    }

    async CreateUser(ctx, userId, orgId, fullName, email, roleName) {
        const user = { userId, orgId, fullName, email, roleName, isActive: true, docType: 'user' };
        return await this._putState(ctx, `USER_${userId}`, user);
    }

    async GetUser(ctx, userId) {
        return await this._getState(ctx, `USER_${userId}`);
    }

    async GetUsersByOrganization(ctx, orgId) {
        const iterator = await ctx.stub.getStateByRange('USER_', 'USER_~');
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const Record = JSON.parse(res.value.value.toString('utf8'));
                if (Record.orgId === orgId) {
                    allResults.push(Record);
                }
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    async UpdateUser(ctx, userId, fullName) {
        const user = await this.GetUser(ctx, userId);
        if (!user) throw new Error("User not found");
        user.fullName = fullName;
        return await this._putState(ctx, `USER_${userId}`, user);
    }

    async DeactivateUser(ctx, userId) {
        const user = await this.GetUser(ctx, userId);
        if (!user) throw new Error("User not found");
        user.isActive = false;
        return await this._putState(ctx, `USER_${userId}`, user);
    }

    // ==========================================
    // 2. SHIPMENT (10-15)
    // ==========================================
    async CreateShipment(ctx, shipmentId, orgId, code, exporter, importer) {
        const shipment = { shipmentId, orgId, code, exporter, importer, status: 'CREATED', docType: 'shipment' };
        return await this._putState(ctx, `SHIPMENT_${shipmentId}`, shipment);
    }

    async GetShipment(ctx, shipmentId) {
        return await this._getState(ctx, `SHIPMENT_${shipmentId}`);
    }

    async GetShipmentByCode(ctx, code) {
        const iterator = await ctx.stub.getStateByRange('SHIPMENT_', 'SHIPMENT_~');
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const Record = JSON.parse(res.value.value.toString('utf8'));
                if (Record.code === code) {
                    allResults.push(Record);
                }
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }
    
    async UpdateShipment(ctx, shipmentId, exporter) {
        const shipment = await this.GetShipment(ctx, shipmentId);
        shipment.exporter = exporter;
        return await this._putState(ctx, `SHIPMENT_${shipmentId}`, shipment);
    }

    async UpdateShipmentStatus(ctx, shipmentId, newStatus) {
        const shipment = await this.GetShipment(ctx, shipmentId);
        shipment.status = newStatus;
        return await this._putState(ctx, `SHIPMENT_${shipmentId}`, shipment);
    }

    async GetAllShipments(ctx) {
        const iterator = await ctx.stub.getStateByRange('SHIPMENT_', 'SHIPMENT_~');
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const Record = JSON.parse(res.value.value.toString('utf8'));
                allResults.push(Record);
            }
            if (res.done) {
                await iterator.close();
                return JSON.stringify(allResults);
            }
        }
    }

    // ==========================================
    // 3. CONTAINER (16-20)
    // ==========================================
    async CreateContainer(ctx, containerId, shipmentId, number, type, size) {
        const container = { containerId, shipmentId, number, type, size, status: 'AT_PORT', docType: 'container' };
        return await this._putState(ctx, `CONTAINER_${containerId}`, container);
    }

    async GetContainer(ctx, containerId) {
        return await this._getState(ctx, `CONTAINER_${containerId}`);
    }

    async GetContainersByShipment(ctx, shipmentId) { return "[]"; }
    
    async UpdateContainer(ctx, containerId, newType) {
        const container = await this.GetContainer(ctx, containerId);
        container.type = newType;
        return await this._putState(ctx, `CONTAINER_${containerId}`, container);
    }

    async UpdateContainerStatus(ctx, containerId, newStatus) {
        const container = await this.GetContainer(ctx, containerId);
        container.status = newStatus;
        return await this._putState(ctx, `CONTAINER_${containerId}`, container);
    }

    // ==========================================
    // 4. DOCUMENT (21-25)
    // ==========================================
    async UploadDocument(ctx, documentId, shipmentId, type, title) {
        const doc = { documentId, shipmentId, type, title, status: 'UPLOADED', docType: 'document' };
        return await this._putState(ctx, `DOC_${documentId}`, doc);
    }

    async GetDocument(ctx, documentId) {
        return await this._getState(ctx, `DOC_${documentId}`);
    }

    async GetDocumentsByShipment(ctx, shipmentId) { return "[]"; }
    
    async UpdateDocument(ctx, documentId, title) {
        const doc = await this.GetDocument(ctx, documentId);
        doc.title = title;
        return await this._putState(ctx, `DOC_${documentId}`, doc);
    }

    async InvalidateDocument(ctx, documentId) {
        const doc = await this.GetDocument(ctx, documentId);
        doc.status = 'INVALID';
        return await this._putState(ctx, `DOC_${documentId}`, doc);
    }

    // ==========================================
    // 5. DOCUMENT FILE & HASH (26-31)
    // ==========================================
    async StoreDocumentFile(ctx, fileId, documentId, fileName, cipherAlgo) {
        const file = { fileId, documentId, fileName, cipherAlgo, docType: 'documentFile' };
        return await this._putState(ctx, `FILE_${fileId}`, file);
    }
    
    async GetDocumentFile(ctx, fileId) { return await this._getState(ctx, `FILE_${fileId}`); }
    async GenerateDocumentHash(ctx, fileId) { return "generated_hash_placeholder"; }
    async GetDocumentHash(ctx, hashId) { return await this._getState(ctx, `HASH_${hashId}`); }
    async VerifyDocumentHash(ctx, documentId, providedHash) { return true; }
    
    async RecordHashToBlockchain(ctx, hashId, documentId, hashValue) {
        const hash = { hashId, documentId, hashValue, docType: 'documentHash' };
        return await this._putState(ctx, `HASH_${hashId}`, hash);
    }

    // ==========================================
    // 6. CUSTOMS CLEARANCE (32-37)
    // ==========================================
    async CreateCustomsClearance(ctx, clearanceId, shipmentId, pibNumber) {
        const clearance = { clearanceId, shipmentId, pibNumber, status: 'PENDING', docType: 'customs' };
        return await this._putState(ctx, `CUSTOMS_${clearanceId}`, clearance);
    }
    
    async GetCustomsClearance(ctx, clearanceId) { return await this._getState(ctx, `CUSTOMS_${clearanceId}`); }
    async UpdateCustomsStatus(ctx, clearanceId, status) {
        const clearance = await this.GetCustomsClearance(ctx, clearanceId);
        clearance.status = status;
        return await this._putState(ctx, `CUSTOMS_${clearanceId}`, clearance);
    }
    async ApproveCustoms(ctx, clearanceId) { return await this.UpdateCustomsStatus(ctx, clearanceId, 'APPROVED'); }
    async RejectCustoms(ctx, clearanceId) { return await this.UpdateCustomsStatus(ctx, clearanceId, 'REJECTED'); }
    async GetCustomsByShipment(ctx, shipmentId) { return "[]"; }

    // ==========================================
    // 7. CERTIFICATE (38-42)
    // ==========================================
    async IssueCertificate(ctx, certId, userId, subject, issuer) {
        const cert = { certId, userId, subject, issuer, status: 'VALID', docType: 'certificate' };
        return await this._putState(ctx, `CERT_${certId}`, cert);
    }
    async GetCertificate(ctx, certId) { return await this._getState(ctx, `CERT_${certId}`); }
    async ValidateCertificate(ctx, certId) { return true; }
    async RevokeCertificate(ctx, certId) {
        const cert = await this.GetCertificate(ctx, certId);
        cert.status = 'REVOKED';
        return await this._putState(ctx, `CERT_${certId}`, cert);
    }
    async GetCertificatesByUser(ctx, userId) { return "[]"; }

    // ==========================================
    // 8. CONTAINER STATUS LOG (43-45)
    // ==========================================
    async LogContainerStatus(ctx, logId, containerId, statusCode, location) {
        const log = { logId, containerId, statusCode, location, docType: 'statusLog' };
        return await this._putState(ctx, `LOG_${logId}`, log);
    }
    async GetContainerHistory(ctx, containerId) { return "[]"; }
    async VerifyContainerStatus(ctx, containerId) { return true; }

    // ==========================================
    // 9. AUDIT LOG (46-49)
    // ==========================================
    async RecordAuditLog(ctx, auditId, userId, entityName, actionType) {
        const log = { auditId, userId, entityName, actionType, docType: 'auditLog' };
        return await this._putState(ctx, `AUDIT_${auditId}`, log);
    }
    async GetAuditLogs(ctx, entityName) { return "[]"; }
    async GetAuditLogsByUser(ctx, userId) { return "[]"; }
    async VerifyAuditIntegrity(ctx, auditId) { return true; }

    // ==========================================
    // 10. BLOCKCHAIN TRANSACTION (50-53)
    // ==========================================
    async RecordBlockchainTx(ctx, txId, channel, chaincode, type) {
        const tx = { txId, channel, chaincode, type, docType: 'blockchainTx' };
        return await this._putState(ctx, `TX_${txId}`, tx);
    }
    async GetBlockchainTx(ctx, txId) { return await this._getState(ctx, `TX_${txId}`); }
    async LinkTxToEntity(ctx, txId, entityId) { return true; }
    async VerifyTransaction(ctx, txId) { return true; }

    // ==========================================
    // 11. EBL TOKEN (54-58)
    // ==========================================
    async IssueEBLToken(ctx, tokenId, docId, ownerOrgId) {
        const token = { tokenId, docId, ownerOrgId, status: 'ISSUED', docType: 'eblToken' };
        return await this._putState(ctx, `TOKEN_${tokenId}`, token);
    }
    async GetEBLToken(ctx, tokenId) { return await this._getState(ctx, `TOKEN_${tokenId}`); }
    async GetTokensByOwner(ctx, ownerOrgId) { return "[]"; }
    async TransferEBLToken(ctx, tokenId, newOwnerOrgId) {
        const token = await this.GetEBLToken(ctx, tokenId);
        token.ownerOrgId = newOwnerOrgId;
        return await this._putState(ctx, `TOKEN_${tokenId}`, token);
    }
    async VerifyTokenOwnership(ctx, tokenId, orgId) {
        const token = await this.GetEBLToken(ctx, tokenId);
        return token.ownerOrgId === orgId;
    }

    // ==========================================
    // 12. EBL TRANSFER (59-60)
    // ==========================================
    async RecordEBLTransfer(ctx, transferId, tokenId, fromOrgId, toOrgId) {
        const transfer = { transferId, tokenId, fromOrgId, toOrgId, docType: 'eblTransfer' };
        return await this._putState(ctx, `TRANSFER_${transferId}`, transfer);
    }
    async GetTransferHistory(ctx, tokenId) { return "[]"; }

    // ==========================================
    // 13. INTEGRATION (OFF-CHAIN ON-CHAIN) (61-64)
    // ==========================================
    async SyncAuditLogToBlockchain(ctx, logDataStr) {
        const data = JSON.parse(logDataStr);
        return await this.RecordAuditLog(ctx, data.auditId, data.userId, data.entity, data.action);
    }
    async SyncDocumentHash(ctx, hashDataStr) { return true; }
    async SyncCustomsToBlockchain(ctx, customsDataStr) { return true; }
    async SyncEBLTransfer(ctx, transferDataStr) { return true; }

    // ==========================================
    // 14. VERIFICATION END-TO-END (65-69)
    // ==========================================
    async VerifyDocumentIntegrity(ctx, docId) { return true; }
    async VerifyAuditTrail(ctx, entityId) { return true; }
    async VerifyShipmentHistory(ctx, shipmentId) { return true; }
    async VerifyContainerTrace(ctx, containerId) { return true; }
    async VerifyEndToEndFlow(ctx, shipmentId) { return true; }

}

module.exports = PortchainContract;
