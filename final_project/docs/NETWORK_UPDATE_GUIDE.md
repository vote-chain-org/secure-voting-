# Network Update Guide

This application requires explicit LAN IP configuration to function correctly across multiple devices on the same network. Whenever the server connects to a new Wi-Fi network, the LAN IP address will change, and you must update the URLs in the frontend files manually.

## Step-by-Step Instructions

1. **Find your new LAN IP:**
   On the server (Linux machine), open a terminal and run:
   ```bash
   hostname -I
   ```
   *Copy the first IP address listed (e.g., `192.168.0.109`).*

2. **Update the Frontend Files:**
   Open each of the files listed in the table below and replace the old IP address with the new one.

| File Path | What to Change | Example Old Value | Example New Value | Purpose |
| --------- | -------------- | ----------------- | ----------------- | ------- |
| `frontend/src/pages/AdminDashboard.jsx` | `API` variable | `http://192.168.0.109:8080` | `http://<NEW_IP>:8080` | Backend connectivity |
| `frontend/src/pages/ElectionDetail.jsx` | `API` variable | `http://192.168.0.109:8080` | `http://<NEW_IP>:8080` | Backend connectivity |
| `frontend/src/pages/MyVotesPage.jsx` | `API` variable | `http://192.168.0.109:8080` | `http://<NEW_IP>:8080` | Backend connectivity |
| `frontend/src/pages/ProfilePage.jsx` | `API` and `ML_URL` variables | `http://192.168.0.109:8080` and `:5000` | `http://<NEW_IP>:8080` and `:5000` | Backend & ML connectivity |
| `frontend/src/pages/SignupPage.jsx` | `API` and `ML_URL` variables | `http://192.168.0.109:8080` and `:5000` | `http://<NEW_IP>:8080` and `:5000` | Backend & ML connectivity |
| `frontend/src/pages/LoginPage.jsx` | `apiBase` variable | `http://192.168.0.109:8080` | `http://<NEW_IP>:8080` | Backend connectivity |

*(Note: The `SCANNER_URL` in `SignupPage.jsx` and `ElectionDetail.jsx` remains `http://localhost:9000` as the frontend is accessed directly from the voting booth machine running the scanner).*

3. **Restart Services:**
   After updating the files, you must restart the servers to apply the changes:
   ```bash
   ./run_server_v2.sh stop
   ./run_server_v2.sh
   ```

4. **Verify Connectivity:**
   Open the frontend from another device (e.g., `http://<NEW_IP>:3000`) and log in to verify that the frontend can successfully communicate with the backend.
