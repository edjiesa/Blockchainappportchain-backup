package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

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

func main() {
	log.Println("Starting PortChain Go API Gateway (JSON-RPC)...")

	// 1. Initialize Fabric Gateway (Mock logic for this demonstration)
	log.Println("Initializing Fabric Gateway connection (TLS 1.3)...")

	// 2. Start PostgreSQL Listener for Audit Logs (pgAudit simulation)
	go startDBListener()

	// 3. Start JSON-RPC HTTP Server
	http.HandleFunc("/rpc", rpcHandler)
	
	// Add a simple status endpoint for Kubernetes/Docker healthcheck
	http.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		// Simulate the old Node.js response format so the frontend doesn't break entirely while transitioning
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"fabric": "connected",
			"database": "connected",
			"message": "Backend Go (JSON-RPC) terhubung ke Fabric (Multi-Org) dan PostgreSQL!",
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

func rpcHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
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
	case "createShipment":
		result = map[string]string{"status": "Shipment Created", "txId": "0xABC123"}
	case "executePayment":
		// Simulating External Tier connection
		result = map[string]string{"status": "Payment Executed via Banking Node", "contract": "payment-contract"}
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

func startDBListener() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("Warning: DATABASE_URL not set. Skipping pgAudit Listener.")
		return
	}

	// Listen for PostgreSQL NOTIFY events
	listener := pq.NewListener(dbURL, 10, 90, func(ev pq.ListenerEventType, err error) {
		if err != nil {
			log.Printf("Listener Error: %v", err)
		}
	})

	err := listener.Listen("pgaudit_events")
	if err != nil {
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
