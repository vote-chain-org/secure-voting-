# Windows Laptop Voting Booth Setup

The physical voting booth operates on a Windows laptop, connected to the same Local Area Network (LAN) as the main VoteChain server. The Windows laptop is responsible for running the **Scanner Service** and displaying the **React Frontend UI** to the voter.

## Prerequisites

1. **Java Installation:**
   The laptop must have Java 11 or higher installed. To verify, open a Command Prompt and run:
   ```cmd
   java -version
   ```
   If Java is installed correctly, it will print the version number. If not, download and install the latest Java SE Development Kit (JDK) or JRE.

2. **SecuGen HU20 Hardware:**
   Plug the SecuGen HU20 Fingerprint Scanner into a USB port on the Windows laptop.
   *(Windows Update should automatically install the necessary device drivers upon connection.)*

## Step-by-Step Setup

### 1. Copy the Scanner Service Directory
1. On your main Linux server, locate the `scanner-service` directory inside the project folder.
2. Specifically, you need the compiled JAR file and the DLLs. Copy the entire `scanner-service` folder (or at least the `target/scanner-service-1.0.0.jar` and the `jnisgfplib/x64/` folder containing the `.dll` files) onto a USB drive.
3. Paste the folder onto the Desktop (or any preferred location) of the Windows laptop.

### 2. Verify DLL Placement
For the SecuGen hardware to communicate with Java, the necessary JNI `.dll` files must be located **in the exact same directory** as the `.jar` file, or installed globally in `C:\Windows\System32`.
- Ensure `jnisgfplib.dll` (and any related DLLs) are sitting right next to `scanner-service-1.0.0.jar`.

### 3. Run the Scanner Service
1. Open a Command Prompt or PowerShell window on the Windows laptop.
2. Navigate to the directory containing the `.jar` file:
   ```cmd
   cd Desktop\scanner-service\target
   ```
3. Run the service on port 9000 using Java:
   ```cmd
   java -jar scanner-service-1.0.0.jar 9000
   ```
4. You should see a startup message indicating the scanner was detected ("Device : ...") and the server is listening on port 9000.

### 4. Open the Voting UI
1. Open a modern web browser (Chrome or Edge) on the Windows laptop.
2. Navigate to the main server's LAN IP address on port 3000 (e.g., `http://192.168.0.109:3000`).
3. The voting interface will appear. Because the Scanner Service is running locally on this machine, the website will seamlessly communicate with `localhost:9000` when a user clicks the "Scan Fingerprint" button.
