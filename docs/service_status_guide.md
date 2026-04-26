# Service Status Guide

Use this guide to verify if the individual components of the VoteChain system are running correctly.

## 1. Quick Terminal Check (All Ports)
The fastest way to see which services are listening is to check the network ports:

```bash
# Should show:
# :3000 (Frontend)
# :8080 (Backend)
# :5000 (ML Service)
# :5432 (PostgreSQL)
sudo lsof -i -P -n | grep LISTEN
```

---

## 2. Checking Individual Services

### A. React Frontend (Port 3000)
*   **Command:** `lsof -i :3000`
*   **Process Name:** `node`
*   **Manual Log:** `tail -f logs/frontend.log`
*   **URL:** `http://localhost:3000`

### B. Spring Boot Backend (Port 8080)
*   **Command:** `lsof -i :8080`
*   **Process Name:** `java`
*   **Manual Log:** `tail -f logs/backend.log`
*   **Health Check:** `curl http://localhost:8080/api/auth/test` (Should return "API working")

### C. ML Verification Service (Port 5000)
*   **Command:** `lsof -i :5000`
*   **Process Name:** `uvicorn`
*   **Manual Log:** `tail -f logs/ml.log`
*   **Health Check:** `curl http://localhost:5000/docs` (Should return the Swagger UI HTML)

### D. PostgreSQL Database (Port 5432)
*   **Command:** `systemctl status postgresql` or `pg_isready`
*   **Connection Test:** `sudo -u postgres psql -d votechain -c "SELECT 1;"`

### E. Blockchain Network (Docker)
*   **Command:** `docker ps`
*   **Containers to look for:**
    *   `peer0.org1.example.com` (Main Ledger Node)
    *   `orderer.election.example.com` (Transaction Sequencer)
    *   `fabric-cli` (Administrative Tool)

---

## 3. Checking the Orchestration (Tmux)
If you started the server using the `tmux` script, you can see all services running in a tiled layout.

*   **To Attach:** `tmux attach -t votechain`
*   **To Detach (without stopping):** Press `Ctrl+B` then `D`.
*   **Navigation:** Use your mouse to click on different panes or use `Ctrl+B` followed by arrow keys to switch views.

## 4. Troubleshooting "Failed to Fetch"
If you see "Failed to Fetch" in your browser:
1.  **Check IP:** Ensure your laptop IP hasn't changed. Run `hostname -I`.
2.  **Restart:** Run `./run_server_v2.sh` to refresh all IP hardcodes in the React code.
3.  **Port Check:** Use Step 1 above to ensure the Backend (`:8080`) hasn't crashed.
