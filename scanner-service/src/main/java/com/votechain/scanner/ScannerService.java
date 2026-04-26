package com.votechain.scanner;

import SecuGen.FDxSDKPro.jni.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.util.Base64;

/**
 * VoteChain Scanner Service
 *
 * Runs a minimal HTTP server on localhost:9000 on the Windows voting booth.
 * The React frontend calls it to capture a fingerprint from the HU20 scanner.
 *
 * Endpoints:
 *   GET  /health   → {"status":"ok","device":"<model>"}
 *   POST /capture  → {"rawBase64":"<raw grayscale bytes>","width":N,"height":N,"quality":N,"error":null}
 *
 * The raw grayscale bytes are sent directly as base64 — NO BMP wrapping.
 * All image conversion (raw → PNG for ML, raw → SG400 template for SDK)
 * happens server-side on the Linux backend.
 *
 * Run:
 *   java -jar scanner-service.jar
 *   java -jar scanner-service.jar 9001     (custom port)
 *
 * Requirements on Windows booth:
 *   - HU20 plugged in via USB (driver auto-installs via Windows Update)
 *   - All DLLs from jnisgfplib/x64/ placed in same folder as the JAR
 *     OR copied to C:\Windows\System32
 *   - Java 11+ installed
 */
public class ScannerService {

    private static final int DEFAULT_PORT = 9000;
    // Timeout waiting for finger placement (milliseconds)
    private static final int CAPTURE_TIMEOUT_MS = 15000;

    public static void main(String[] args) throws Exception {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try { port = Integer.parseInt(args[0]); } catch (NumberFormatException ignored) {}
        }

        // ── Initialize SecuGen device ────────────────────────────────────────
        JSGFPLib sgfplib = new JSGFPLib();

        if (sgfplib.jniLoadStatus == SGFDxErrorCode.SGFDX_ERROR_JNI_DLLLOAD_FAILED) {
            System.err.println("[ERROR] Failed to load jnisgfplib.dll");
            System.err.println("  Make sure the DLL files from jnisgfplib/x64/ are in the same");
            System.err.println("  directory as this JAR, or copied to C:\\Windows\\System32");
            System.exit(1);
        }

        long err = sgfplib.Init(SGFDxDeviceName.SG_DEV_AUTO);
        if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
            System.err.println("[ERROR] sgfplib.Init() failed: " + err);
            System.err.println("  Is the HU20 scanner plugged in?");
            System.exit(1);
        }

        err = sgfplib.OpenDevice(SGPPPortAddr.AUTO_DETECT);
        if (err != SGFDxErrorCode.SGFDX_ERROR_NONE) {
            System.err.println("[ERROR] sgfplib.OpenDevice() failed: " + err);
            System.err.println("  Check USB connection and Windows driver installation.");
            System.exit(1);
        }

        SGDeviceInfoParam deviceInfo = new SGDeviceInfoParam();
        sgfplib.GetDeviceInfo(deviceInfo);
        String deviceModel = new String(deviceInfo.deviceSN()).trim();

        System.out.println("==============================================");
        System.out.println("  VoteChain Scanner Service");
        System.out.println("  Device : " + deviceModel);
        System.out.println("  Image  : " + deviceInfo.imageWidth + "x" + deviceInfo.imageHeight + " px");
        System.out.println("  Port   : " + port);
        System.out.println("==============================================");

        // ── Start HTTP server ────────────────────────────────────────────────
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);

        // Health check
        server.createContext("/health", exchange -> {
            String response = "{\"status\":\"ok\",\"device\":\"" + deviceModel + "\"}";
            sendJson(exchange, 200, response);
        });

        // Capture fingerprint
        server.createContext("/capture", exchange -> {
            // CORS headers so browser can call from any origin
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            System.out.println("[capture] Waiting for finger placement...");

            byte[] imageBuffer = new byte[deviceInfo.imageHeight * deviceInfo.imageWidth];
            sgfplib.SetLedOn(true);

            // GetImageEx supports timeout — waits up to CAPTURE_TIMEOUT_MS ms
            long captureErr = sgfplib.GetImageEx(imageBuffer,
                    CAPTURE_TIMEOUT_MS,
                    0,  // reserved
                    deviceInfo.imageWidth * deviceInfo.imageHeight);

            sgfplib.SetLedOn(false);

            if (captureErr != SGFDxErrorCode.SGFDX_ERROR_NONE) {
                System.out.println("[capture] Capture failed: " + captureErr);
                String response = "{\"rawBase64\":null,\"width\":0,\"height\":0,\"quality\":0,\"error\":\"Capture failed. Error code: " + captureErr + "\"}";
                sendJson(exchange, 500, response);
                return;
            }

            // Check image quality
            int[] quality = new int[1];
            sgfplib.GetImageQuality(deviceInfo.imageWidth, deviceInfo.imageHeight, imageBuffer, quality);
            System.out.println("[capture] Image quality: " + quality[0]);

            // Send raw grayscale bytes directly as base64 — no BMP wrapping
            String rawBase64 = Base64.getEncoder().encodeToString(imageBuffer);

            System.out.println("[capture] Success. Image size: " + imageBuffer.length + " bytes, quality: " + quality[0]);
            String response = "{\"rawBase64\":\"" + rawBase64
                    + "\",\"width\":" + deviceInfo.imageWidth
                    + ",\"height\":" + deviceInfo.imageHeight
                    + ",\"quality\":" + quality[0] + ",\"error\":null}";
            sendJson(exchange, 200, response);
        });

        server.start();
        System.out.println("[ready] Scanner service running at http://localhost:" + port);
        System.out.println("[ready] Press Ctrl+C to stop.");

        // Keep running until Ctrl+C
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("[shutdown] Closing device...");
            sgfplib.CloseDevice();
            server.stop(0);
        }));
    }

    private static void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        byte[] bytes = json.getBytes("UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
