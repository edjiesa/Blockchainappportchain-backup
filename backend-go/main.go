package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type RPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
	ID      int             `json:"id"`
}

type RPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	Result  interface{} `json:"result,omitempty"`
	Error   interface{} `json:"error,omitempty"`
	ID      int         `json:"id"`
}

var db *sql.DB

func main() {
	log.Println("Starting PortChain Go API Gateway (JSON-RPC)...")

	// 1. Initialize PostgreSQL Database
	initDB()

	// 2. Start PostgreSQL Listener for Audit Logs (pgAudit simulation)
	go startDBListener()

	// 3. Start JSON-RPC HTTP Server
	http.HandleFunc("/rpc", rpcHandler)

	// Add a simple status endpoint for Kubernetes/Docker healthcheck
	http.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		err := db.Ping()
		dbStatus := "connected"
		if err != nil {
			dbStatus = "disconnected"
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":  err == nil,
			"fabric":   "connected (simulated)",
			"database": dbStatus,
			"message":  "Backend Go (JSON-RPC) terhubung ke Fabric dan PostgreSQL!",
		})
	})

	http.HandleFunc("/api/explorer/transactions", handleExplorerTransactions)
	http.HandleFunc("/api/explorer/stats", handleExplorerStats)

	// Add CORS support for the frontend
	handler := corsMiddleware(http.DefaultServeMux)

	port := "3001"
	log.Printf("Server listening on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func initDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://portchain:portchain123@localhost:5432/portchain_offchain?sslmode=disable"
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	// Retry connection loop for docker-compose startup
	for i := 0; i < 10; i++ {
		err = db.Ping()
		if err == nil {
			break
		}
		log.Printf("Waiting for DB to be ready... (%d/10)", i+1)
		time.Sleep(2 * time.Second)
	}

	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	log.Println("Successfully connected to PostgreSQL Database!")
}

func rpcHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodOptions {
		http.Error(w, "Only POST is supported for JSON-RPC", http.StatusMethodNotAllowed)
		return
	}

	var req RPCRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	log.Printf("Received RPC Call: %s", req.Method)

	var result interface{}
	var errObj interface{}

	// Basic router for Logic Layer
	switch req.Method {
	case "CreateShipment":
		result, errObj = handleCreateShipment(req.Params)
	case "GetAllShipments":
		result, errObj = handleGetAllShipments()
	case "GetDashboardStats":
		result, errObj = handleGetDashboardStats()
	case "RegisterUser":
		result, errObj = handleRegisterUser(req.Params)
	case "GetUsers":
		result, errObj = handleGetUsers()
	case "GetCustomsClearances":
		result, errObj = handleGetCustomsClearances()
	case "GetAuditLogs":
		result, errObj = handleGetAuditLogs()
	case "GetDocuments":
		result, errObj = handleGetDocuments()
	case "UploadDocument":
		result, errObj = handleUploadDocument(req.Params)
	case "GetOrganizations":
		result, errObj = handleGetOrganizations()
	case "GetEBLTokens":
		result, errObj = handleGetEBLTokens()
	case "TransferEBLToken":
		result, errObj = handleTransferEBLToken(req.Params)
	case "CreateCustomsClearance":
		result, errObj = handleCreateCustomsClearance(req.Params)
	case "UpdateCustomsStatus":
		result, errObj = handleUpdateCustomsStatus(req.Params)
	default:
		// Forward dynamic methods (like the 73 Smart Contract functions) to the Node.js Fabric Connector
		result, errObj = handleSmartContractForwarding(req.Method, req.Params)
	}

	resp := RPCResponse{
		JSONRPC: "2.0",
		Result:  result,
		Error:   errObj,
		ID:      req.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// ---- LOGIC METHODS ----

func handleSmartContractForwarding(method string, params json.RawMessage) (interface{}, interface{}) {
	isQuery := false
	if strings.HasPrefix(method, "Get") || strings.HasPrefix(method, "Verify") {
		isQuery = true
	}

	url := "http://127.0.0.1:3002/api/invoke"
	if isQuery {
		url = "http://127.0.0.1:3002/api/query"
	}

	var argsArray []interface{}
	if len(params) > 0 {
		if params[0] == '[' {
			json.Unmarshal(params, &argsArray)
		} else if params[0] == '{' {
			// Extract as a single JSON string if it's an object, some contracts accept this
			argsArray = []interface{}{string(params)}
		}
	}

	argsJSON, _ := json.Marshal(argsArray)

	var reqObj *http.Request
	var err error

	if isQuery {
		reqObj, err = http.NewRequest("GET", url, nil)
		if err == nil {
			q := reqObj.URL.Query()
			q.Add("chaincode", "portchain-cc")
			q.Add("functionName", method)
			if len(argsArray) > 0 {
				q.Add("args", string(argsJSON))
			}
			reqObj.URL.RawQuery = q.Encode()
		}
	} else {
		payload := map[string]interface{}{
			"chaincode": "portchain-cc",
			"functionName": method,
			"args": argsArray,
		}
		payloadBytes, _ := json.Marshal(payload)
		reqObj, err = http.NewRequest("POST", url, bytes.NewBuffer(payloadBytes))
		if err == nil {
			reqObj.Header.Set("Content-Type", "application/json")
		}
	}

	if err != nil {
		return nil, map[string]string{"code": "-32000", "message": "Failed to construct request to Fabric Connector"}
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(reqObj)
	if err != nil {
		return nil, map[string]string{"code": "-32001", "message": "Failed to connect to Fabric Connector at " + url}
	}
	defer resp.Body.Close()

	var fabricResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&fabricResp); err != nil {
		return nil, map[string]string{"code": "-32002", "message": "Invalid JSON response from Fabric Connector"}
	}

	if success, ok := fabricResp["success"].(bool); ok && !success {
		errMsg := "Unknown Fabric Error"
		if e, ok := fabricResp["error"].(string); ok {
			errMsg = e
		}
		return nil, map[string]string{"code": "-32003", "message": errMsg}
	}

	return fabricResp["result"], nil
}

func handleRegisterUser(params json.RawMessage) (interface{}, interface{}) {
	var input struct {
		UserID         string `json:"user_id"`
		OrganizationID string `json:"organization_id"`
		Username       string `json:"username"`
		Email          string `json:"email"`
		RoleName       string `json:"role_name"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return nil, map[string]string{"code": "-32602", "message": "Invalid params"}
	}

	txID := uuid.New().String()

	// Insert into DB
	_, err := db.Exec(`
		INSERT INTO users (user_id, organization_id, full_name, email, role_name, is_active)
		VALUES ($1, $2, $3, $4, $5, true)
	`, input.UserID, input.OrganizationID, input.Username, input.Email, input.RoleName)
	if err != nil {
		log.Printf("DB Insert Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to insert into database"}
	}

	// Simulate Blockchain TX for Fabric CA Registration
	db.Exec(`
		INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
		VALUES ($1, $2, 'port-channel', 'fabric-ca', 'RegisterUser', 'VALID')
	`, txID, uuid.New().String())

	return map[string]interface{}{
		"success": true,
		"message": "User registered successfully",
		"tx_id":   txID,
	}, nil
}

func handleGetUsers() (interface{}, interface{}) {
	rows, err := db.Query(`
		SELECT user_id, organization_id, full_name, email, role_name, is_active, created_at
		FROM users ORDER BY created_at DESC
	`)
	if err != nil {
		log.Printf("Query Error: %v", err)
		return nil, map[string]string{"code": "-32002", "message": "Database error"}
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var (
			uID, oID, fName, email, rName string
			isActive                      bool
			createdAt                     time.Time
		)
		if err := rows.Scan(&uID, &oID, &fName, &email, &rName, &isActive, &createdAt); err == nil {
			users = append(users, map[string]interface{}{
				"user_id":         uID,
				"organization_id": oID,
				"username":        fName,
				"email":           email,
				"role_name":       rName,
				"is_active":       isActive,
				"created_at":      createdAt,
			})
		}
	}
	if users == nil {
		users = []map[string]interface{}{}
	}
	return users, nil
}

func handleGetCustomsClearances() (interface{}, interface{}) {
	rows, err := db.Query(`
		SELECT customs_clearance_id, shipment_id, pib_number, customs_status, customs_lane, decided_at, blockchain_tx_id, created_at
		FROM customs_clearance ORDER BY created_at DESC
	`)
	if err != nil {
		log.Printf("Query Error: %v", err)
		return nil, map[string]string{"code": "-32002", "message": "Database error"}
	}
	defer rows.Close()

	var clearances []map[string]interface{}
	for rows.Next() {
		var (
			cID, sID, pib, status, lane, txID string
			decidedAt                         sql.NullTime
			createdAt                         time.Time
		)
		if err := rows.Scan(&cID, &sID, &pib, &status, &lane, &decidedAt, &txID, &createdAt); err == nil {
			item := map[string]interface{}{
				"customs_clearance_id": cID,
				"shipment_id":          sID,
				"pib_number":           pib,
				"customs_status":       status,
				"customs_lane":         lane,
				"blockchain_tx_id":     txID,
				"created_at":           createdAt,
			}
			if decidedAt.Valid {
				item["decided_at"] = decidedAt.Time
			} else {
				item["decided_at"] = nil
			}
			clearances = append(clearances, item)
		}
	}
	if clearances == nil {
		clearances = []map[string]interface{}{}
	}
	return clearances, nil
}

func handleGetAuditLogs() (interface{}, interface{}) {
	rows, err := db.Query(`
		SELECT blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status, created_at
		FROM blockchain_transactions 
		ORDER BY created_at DESC
	`)
	if err != nil {
		log.Printf("Query Error: %v", err)
		return nil, map[string]string{"code": "-32002", "message": "Database error"}
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var (
			bTxID, txID, channel, chaincode, txType, status sql.NullString
			createdAt                                       time.Time
		)
		if err := rows.Scan(&bTxID, &txID, &channel, &chaincode, &txType, &status, &createdAt); err == nil {
			logs = append(logs, map[string]interface{}{
				"blockchain_tx_id": bTxID.String,
				"tx_id":            txID.String,
				"channel_name":     channel.String,
				"chaincode_name":   chaincode.String,
				"transaction_type": txType.String,
				"validation_status": status.String,
				"created_at":       createdAt,
			})
		}
	}
	if logs == nil {
		logs = []map[string]interface{}{}
	}
	return logs, nil
}

func handleGetDocuments() (interface{}, interface{}) {
	rows, err := db.Query(`
		SELECT 
			d.document_id, d.shipment_id, d.document_type, d.document_title, 
			d.document_version, d.issued_at,
			h.document_hash_value
		FROM documents d
		LEFT JOIN document_hashes h ON d.document_id = h.document_id
		ORDER BY d.issued_at DESC
	`)
	if err != nil {
		log.Printf("Query Error: %v", err)
		return nil, map[string]string{"code": "-32002", "message": "Database error"}
	}
	defer rows.Close()

	var docs []map[string]interface{}
	for rows.Next() {
		var (
			dID, sID, dType, dTitle, dVer sql.NullString
			hVal                          sql.NullString
			issuedAt                      time.Time
		)
		if err := rows.Scan(&dID, &sID, &dType, &dTitle, &dVer, &issuedAt, &hVal); err == nil {
			docs = append(docs, map[string]interface{}{
				"document_id":         dID.String,
				"shipment_id":         sID.String,
				"document_type":       dType.String,
				"document_title":      dTitle.String,
				"document_version":    dVer.String,
				"issued_date":         issuedAt,
				"document_hash_value": hVal.String,
			})
		}
	}
	if docs == nil {
		docs = []map[string]interface{}{}
	}
	return docs, nil
}

func handleUploadDocument(params json.RawMessage) (interface{}, interface{}) {
	var input struct {
		ShipmentID       string `json:"shipment_id"`
		DocumentType     string `json:"document_type"`
		DocumentCategory string `json:"document_category"` // Maps to document_title for simplicity in UI mapping
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return nil, map[string]string{"code": "-32602", "message": "Invalid params"}
	}

	docID := "doc-" + uuid.New().String()[:8]
	txID := uuid.New().String()
	hashID := "hash-" + uuid.New().String()[:8]
	docHash := uuid.New().String() // Simulated SHA-256

	// 1. Log to Blockchain Transactions
	_, err := db.Exec(`
		INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
		VALUES ($1, $2, 'port-channel', 'portchain-cc', 'UploadDocument', 'VALID')
	`, txID, uuid.New().String())
	if err != nil {
		log.Printf("Blockchain TX Insert Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to log blockchain tx"}
	}

	// 2. Insert Document (storing Category in document_title to fulfill mock format)
	_, err = db.Exec(`
		INSERT INTO documents (document_id, shipment_id, document_type, document_title, document_version, document_status, issued_at)
		VALUES ($1, $2, $3, $4, 'v1.0', 'UPLOADED', NOW())
	`, docID, input.ShipmentID, input.DocumentType, input.DocumentCategory)
	if err != nil {
		log.Printf("DB Insert Document Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to insert document"}
	}

	// 3. Insert Document Hash
	_, err = db.Exec(`
		INSERT INTO document_hashes (document_hash_id, document_id, hash_algorithm, document_hash_value, hash_status, blockchain_tx_id)
		VALUES ($1, $2, 'SHA-256', $3, 'VERIFIED', $4)
	`, hashID, docID, docHash, txID)
	if err != nil {
		log.Printf("DB Insert Document Hash Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to insert document hash"}
	}

	return map[string]interface{}{"success": true, "message": "Document uploaded successfully", "document_id": docID}, nil
}

func handleGetOrganizations() (interface{}, interface{}) {
	rows, err := db.Query(`SELECT organization_id, organization_name, organization_type FROM organizations ORDER BY organization_name`)
	if err != nil {
		log.Printf("Query Error: %v", err)
		return nil, map[string]string{"code": "-32002", "message": "Database error"}
	}
	defer rows.Close()

	var orgs []map[string]interface{}
	for rows.Next() {
		var oID, oName, oType sql.NullString
		if err := rows.Scan(&oID, &oName, &oType); err == nil {
			orgs = append(orgs, map[string]interface{}{
				"organization_id":   oID.String,
				"organization_name": oName.String,
				"organization_type": oType.String,
			})
		}
	}
	if orgs == nil {
		orgs = []map[string]interface{}{}
	}
	return orgs, nil
}

func handleGetEBLTokens() (interface{}, interface{}) {
	// Auto-mint a dummy EBL if none exists
	var count int
	db.QueryRow("SELECT COUNT(*) FROM ebl_tokens").Scan(&count)
	if count == 0 {
		eblID := "ebl-" + uuid.New().String()[:8]
		txID := "tx-" + uuid.New().String()[:8]
		
		// Insert a dummy document if none exists, just to attach the EBL
		var docID string
		err := db.QueryRow("SELECT document_id FROM documents LIMIT 1").Scan(&docID)
		if err != nil || docID == "" {
			docID = "doc-" + uuid.New().String()[:8]
			db.Exec(`INSERT INTO documents (document_id, document_type, document_title, issued_at) VALUES ($1, 'Bill of Lading', 'Auto Generated EBL Doc', NOW())`, docID)
		}

		// Insert a dummy organization if none exists
		var orgID string
		err = db.QueryRow("SELECT organization_id FROM organizations LIMIT 1").Scan(&orgID)
		if err != nil || orgID == "" {
			orgID = "org-001"
		}

		db.Exec(`
			INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
			VALUES ($1, $2, 'port-channel', 'ebl-cc', 'IssueEBLToken', 'VALID')
		`, txID, uuid.New().String())

		db.Exec(`
			INSERT INTO ebl_tokens (ebl_token_id, document_id, token_number, current_owner_org_id, token_status, issued_at, blockchain_tx_id)
			VALUES ($1, $2, 'EBL-TOKEN-001', $3, 'ACTIVE', NOW(), $4)
		`, eblID, docID, orgID, txID)
	}

	rows, err := db.Query(`
		SELECT ebl_token_id, document_id, token_number, current_owner_org_id, token_status, issued_at, blockchain_tx_id
		FROM ebl_tokens ORDER BY issued_at DESC
	`)
	if err != nil {
		log.Printf("Query Error: %v", err)
		return nil, map[string]string{"code": "-32002", "message": "Database error"}
	}
	defer rows.Close()

	var tokens []map[string]interface{}
	for rows.Next() {
		var (
			eID, dID, tNum, cOrgID, tStatus, bTxID sql.NullString
			issuedAt                               time.Time
		)
		if err := rows.Scan(&eID, &dID, &tNum, &cOrgID, &tStatus, &issuedAt, &bTxID); err == nil {
			tokens = append(tokens, map[string]interface{}{
				"ebl_token_id":         eID.String,
				"document_id":          dID.String,
				"token_number":         tNum.String,
				"current_owner_org_id": cOrgID.String,
				"token_status":         tStatus.String,
				"issued_at":            issuedAt,
				"blockchain_tx_id":     bTxID.String,
			})
		}
	}
	if tokens == nil {
		tokens = []map[string]interface{}{}
	}
	return tokens, nil
}

func handleTransferEBLToken(params json.RawMessage) (interface{}, interface{}) {
	var input struct {
		TokenNumber     string `json:"token_number"`
		ToOrgID         string `json:"to_org_id"`
		TransferReason  string `json:"transfer_reason"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return nil, map[string]string{"code": "-32602", "message": "Invalid params"}
	}

	txID := "tx-" + uuid.New().String()[:8]
	transferID := "trf-" + uuid.New().String()[:8]

	var eblID, fromOrgID string
	err := db.QueryRow("SELECT ebl_token_id, current_owner_org_id FROM ebl_tokens WHERE token_number = $1", input.TokenNumber).Scan(&eblID, &fromOrgID)
	if err != nil {
		return nil, map[string]string{"code": "-32002", "message": "Token not found"}
	}

	// 1. Log to Blockchain Transactions
	_, err = db.Exec(`
		INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
		VALUES ($1, $2, 'port-channel', 'ebl-cc', 'TransferEBLToken', 'VALID')
	`, txID, uuid.New().String())
	if err != nil {
		log.Printf("Blockchain TX Insert Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to log blockchain tx"}
	}

	// 2. Insert Transfer Record
	_, err = db.Exec(`
		INSERT INTO ebl_transfers (ebl_transfer_id, ebl_token_id, from_org_id, to_org_id, transfer_reason, transferred_at, blockchain_tx_id)
		VALUES ($1, $2, $3, $4, $5, NOW(), $6)
	`, transferID, eblID, fromOrgID, input.ToOrgID, input.TransferReason, txID)
	if err != nil {
		log.Printf("DB Insert Transfer Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to record transfer"}
	}

	// 3. Update EBL Token Owner
	_, err = db.Exec(`
		UPDATE ebl_tokens SET current_owner_org_id = $1 WHERE ebl_token_id = $2
	`, input.ToOrgID, eblID)
	if err != nil {
		log.Printf("DB Update EBL Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to update EBL ownership"}
	}

	return map[string]interface{}{"success": true, "message": "EBL transferred successfully"}, nil
}

func handleCreateCustomsClearance(params json.RawMessage) (interface{}, interface{}) {
	var input struct {
		ShipmentID string `json:"shipment_id"`
		PibNumber  string `json:"pib_number"`
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return nil, map[string]string{"code": "-32602", "message": "Invalid params"}
	}

	cID := "cc-" + uuid.New().String()[:8]
	txID := uuid.New().String()

	// Insert into blockchain_transactions first to satisfy foreign key constraint
	_, err := db.Exec(`
		INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
		VALUES ($1, $2, 'port-channel', 'customs-cc', 'CreateCustomsClearance', 'VALID')
	`, txID, uuid.New().String())
	if err != nil {
		log.Printf("Blockchain TX Insert Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to log blockchain tx"}
	}

	_, err = db.Exec(`
		INSERT INTO customs_clearance (customs_clearance_id, shipment_id, pib_number, customs_status, customs_lane, blockchain_tx_id)
		VALUES ($1, $2, $3, 'pending', 'YELLOW', $4)
	`, cID, input.ShipmentID, input.PibNumber, txID)
	if err != nil {
		log.Printf("DB Insert Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to insert into database"}
	}

	return map[string]interface{}{"success": true, "message": "Customs Clearance Submitted", "customs_clearance_id": cID}, nil
}

func handleUpdateCustomsStatus(params json.RawMessage) (interface{}, interface{}) {
	var input struct {
		CustomsClearanceID string `json:"customs_clearance_id"`
		Status             string `json:"status"` // 'approved' or 'rejected'
	}
	if err := json.Unmarshal(params, &input); err != nil {
		return nil, map[string]string{"code": "-32602", "message": "Invalid params"}
	}

	newTxID := uuid.New().String()

	// Insert into blockchain_transactions first to satisfy foreign key constraint
	_, err := db.Exec(`
		INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
		VALUES ($1, $2, 'port-channel', 'customs-cc', 'UpdateCustomsStatus', 'VALID')
	`, newTxID, uuid.New().String())
	if err != nil {
		log.Printf("Blockchain TX Insert Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to log blockchain tx"}
	}

	_, err = db.Exec(`
		UPDATE customs_clearance 
		SET customs_status = $1, decided_at = NOW(), blockchain_tx_id = $2
		WHERE customs_clearance_id = $3
	`, input.Status, newTxID, input.CustomsClearanceID)
	if err != nil {
		log.Printf("DB Update Error: %v", err)
		return nil, map[string]string{"code": "-32001", "message": "Failed to update database"}
	}

	return map[string]interface{}{"success": true, "message": "Status updated successfully"}, nil
}


func handleCreateShipment(params json.RawMessage) (interface{}, interface{}) {
	var input struct {
		ShipmentCode    string  `json:"shipment_code"`
		ExporterName    string  `json:"exporter_name"`
		ImporterName    string  `json:"importer_name"`
		ShippingLine    string  `json:"shipping_line_name"`
		VesselName      string  `json:"vessel_name"`
		OriginPort      string  `json:"origin_port"`
		DestinationPort string  `json:"destination_port"`
		TotalWeight     float64 `json:"total_weight_kg"`
		GoodsDesc       string  `json:"goods_description"`
	}

	if err := json.Unmarshal(params, &input); err != nil {
		return nil, map[string]string{"code": "-32602", "message": "Invalid params"}
	}

	shipmentID := uuid.New().String()
	orgID := "org-001" // Default for port admin
	txID := "tx-" + uuid.New().String()[:8]

	// Invoke Real Blockchain Smart Contract
	fabricArgs := []interface{}{shipmentID, orgID, input.ShipmentCode, input.ExporterName, input.ImporterName}
	fabricArgsJSON, _ := json.Marshal(fabricArgs)
	_, fabricErr := handleSmartContractForwarding("CreateShipment", json.RawMessage(fabricArgsJSON))
	
	if fabricErr != nil {
		log.Printf("Blockchain Tx Error: %v", fabricErr)
	} else {
		log.Printf("Successfully committed CreateShipment to Fabric!")
	}

	// Also log to blockchain_transactions table for UI history
	_, err := db.Exec(`
		INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
		VALUES ($1, $2, 'port-channel', 'portchain-cc', 'CreateShipment', 'VALID')
	`, txID, uuid.New().String())
	
	if err != nil {
		log.Printf("Blockchain Tx Log Error: %v", err)
	}

	// Insert into PostgreSQL
	query := `
		INSERT INTO shipments (
			shipment_id, organization_id, shipment_code, exporter_name, importer_name, 
			shipping_line_name, vessel_name, origin_port, destination_port, shipment_status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'CREATED')
	`
	_, err = db.Exec(query, shipmentID, orgID, input.ShipmentCode, input.ExporterName, input.ImporterName,
		input.ShippingLine, input.VesselName, input.OriginPort, input.DestinationPort)

	if err != nil {
		log.Printf("DB Error: %v", err)
		return nil, map[string]string{"code": "-32000", "message": "Failed to create shipment: " + err.Error()}
	}

	return map[string]interface{}{
		"status":      "Shipment Created",
		"shipment_id": shipmentID,
		"txId":        txID,
	}, nil
}

func handleGetAllShipments() (interface{}, interface{}) {
	rows, err := db.Query(`
		SELECT shipment_id, shipment_code, exporter_name, importer_name, shipping_line_name, 
		       vessel_name, origin_port, destination_port, shipment_status, created_at
		FROM shipments ORDER BY created_at DESC
	`)
	if err != nil {
		log.Printf("DB Error: %v", err)
		return nil, map[string]string{"code": "-32000", "message": "Failed to fetch shipments"}
	}
	defer rows.Close()

	var shipments []map[string]interface{}
	for rows.Next() {
		var (
			sID, sCode, exporter, importer, sLine, vName, oPort, dPort, sStatus string
			createdAt time.Time
		)
		err := rows.Scan(&sID, &sCode, &exporter, &importer, &sLine, &vName, &oPort, &dPort, &sStatus, &createdAt)
		if err == nil {
			shipments = append(shipments, map[string]interface{}{
				"shipment_id":        sID,
				"shipment_code":      sCode,
				"exporter_name":      exporter,
				"importer_name":      importer,
				"shipping_line_name": sLine,
				"vessel_name":        vName,
				"origin_port":        oPort,
				"destination_port":   dPort,
				"shipment_status":    sStatus,
				"created_at":         createdAt,
				"total_weight_kg":    25000, // Dummy weight just for UI visualization
			})
		}
	}
	
	if shipments == nil {
		shipments = []map[string]interface{}{}
	}
	return shipments, nil
}

func handleGetDashboardStats() (interface{}, interface{}) {
	var totalShipments, pendingCustoms, approvedCustoms, rejectedCustoms, totalTransactions, totalDocuments, activeEBLs, channelNodes int

	db.QueryRow("SELECT COUNT(*) FROM shipments").Scan(&totalShipments)
	db.QueryRow("SELECT COUNT(*) FROM customs_clearance WHERE UPPER(customs_status) = 'PENDING'").Scan(&pendingCustoms)
	db.QueryRow("SELECT COUNT(*) FROM customs_clearance WHERE UPPER(customs_status) = 'APPROVED'").Scan(&approvedCustoms)
	db.QueryRow("SELECT COUNT(*) FROM customs_clearance WHERE UPPER(customs_status) = 'REJECTED'").Scan(&rejectedCustoms)
	db.QueryRow("SELECT COUNT(*) FROM blockchain_transactions").Scan(&totalTransactions)
	db.QueryRow("SELECT COUNT(*) FROM documents").Scan(&totalDocuments)
	db.QueryRow("SELECT COUNT(*) FROM ebl_tokens").Scan(&activeEBLs)
	db.QueryRow("SELECT COUNT(*) FROM organizations").Scan(&channelNodes)

	stats := map[string]interface{}{
		"totalShipments":    totalShipments,
		"pendingCustoms":    pendingCustoms,
		"approvedCustoms":   approvedCustoms,
		"rejectedCustoms":   rejectedCustoms,
		"activeContainers":  0,
		"totalDocuments":    totalDocuments,
		"activeEBLs":        activeEBLs,
		"totalTransactions": totalTransactions,
		"channelNodes":      channelNodes,
	}

	return stats, nil
}

func handleExplorerTransactions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := db.Query(`
		SELECT blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status, created_at
		FROM blockchain_transactions ORDER BY created_at DESC LIMIT 50
	`)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"success": false})
		return
	}
	defer rows.Close()

	var txs []map[string]interface{}
	for rows.Next() {
		var (
			bID, tID, cName, ccName, tType, vStatus string
			createdAt time.Time
		)
		if err := rows.Scan(&bID, &tID, &cName, &ccName, &tType, &vStatus, &createdAt); err == nil {
			txs = append(txs, map[string]interface{}{
				"blockchain_tx_id":  bID,
				"tx_id":             tID,
				"channel_name":      cName,
				"chaincode_name":    ccName,
				"function_name":     tType,
				"validation_status": vStatus,
				"created_at":        createdAt,
			})
		}
	}
	if txs == nil {
		txs = []map[string]interface{}{}
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": txs})
}

func handleExplorerStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var total int
	db.QueryRow("SELECT COUNT(*) FROM blockchain_transactions").Scan(&total)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"total_transactions": total,
			"valid_transactions": total,
			"latest_block":       total,
			"chaincodes":         []string{"portchain-cc", "customs-cc", "ebl-cc"},
		},
	})
}

// ---- BACKGROUND LISTENER ----

func startDBListener() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return
	}

	listener := pq.NewListener(dbURL, 10, 90, func(ev pq.ListenerEventType, err error) {})
	if err := listener.Listen("pgaudit_events"); err != nil {
		log.Printf("Failed to listen to pgaudit_events: %v", err)
		return
	}

	log.Println("Go Listener (pgAudit) started. Listening for database changes...")
	for {
		select {
		case n := <-listener.Notify:
			log.Printf("[pgAudit] Database Change Detected: %s", n.Extra)
		}
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
