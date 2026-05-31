package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
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
	default:
		errObj = map[string]string{"code": "-32601", "message": "Method not found"}
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

	// Simulate Blockchain TX
	_, err := db.Exec(`
		INSERT INTO blockchain_transactions (blockchain_tx_id, tx_id, channel_name, chaincode_name, transaction_type, validation_status)
		VALUES ($1, $2, 'port-channel', 'portchain-cc', 'CreateShipment', 'VALID')
	`, txID, uuid.New().String(), string(input.ShipmentCode))
	
	if err != nil {
		log.Printf("Blockchain Tx Error: %v", err)
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
	var totalShipments, pendingCustoms, totalTransactions int

	db.QueryRow("SELECT COUNT(*) FROM shipments").Scan(&totalShipments)
	db.QueryRow("SELECT COUNT(*) FROM customs_clearance WHERE customs_status = 'PENDING'").Scan(&pendingCustoms)
	db.QueryRow("SELECT COUNT(*) FROM blockchain_transactions").Scan(&totalTransactions)

	stats := map[string]interface{}{
		"totalShipments":    totalShipments,
		"pendingCustoms":    pendingCustoms,
		"approvedCustoms":   0,
		"activeContainers":  0,
		"totalDocuments":    0,
		"activeEBLs":        0,
		"totalTransactions": totalTransactions,
		"channelNodes":      3,
	}

	return stats, nil
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
