# Native SecuGen Backend Verification Plan

This plan completely eliminates the inaccurate Python ML image-matching pipeline and replaces it with 100% accurate, high-speed minutiae template matching handled natively by your Spring Boot server using the SecuGen Linux SDK.

## User Review Required
> [!WARNING]
> This requires loading the Linux Native C-libraries (`.so` files) into the Java Spring Boot process. We will need to set `LD_LIBRARY_PATH` in your startup scripts so Java can find the SecuGen drivers.
> 
> Also, **all existing users in your PostgreSQL database will need to be deleted/re-enrolled**, because we are changing the storage format from `.png` images to Base64 Template Strings.

## Open Questions
> [!IMPORTANT]  
> 1. Can we completely delete the `backend-ml/` folder and `logs/ml.log` as part of this cleanup?
> 2. Are you okay with completely wiping the existing `users` table to accommodate the new `fingerprintTemplate` string column?

## Proposed Changes

### Scanner Hardware Service (Windows)
We will modify the Windows agent to extract the template directly at the booth, rather than making the server do image processing.

#### [MODIFY] `scanner-service/src/main/java/com/votechain/scanner/ScannerService.java`
- Import `Base64`.
- After capturing the image, initialize an empty `byte[] template = new byte[400];`.
- Call `sgfplib.CreateTemplate(fingerInfo, template)`.
- Encode the byte array to a Base64 string and add it to the JSON response (`"template": "..."`).

---

### Frontend React Application
We will drastically simplify the frontend since we no longer need to convert BMP files to PNG files.

#### [MODIFY] `frontend/src/pages/SignupPage.jsx` & `ElectionDetail.jsx`
- Remove the `bmpBase64ToPngFile()` function.
- In `handleScan()`, capture `data.template` from the scanner response.
- Send the raw Base64 template string in the JSON/FormData payloads to the backend `/api/auth/register` and `/api/votes/cast` endpoints.

---

### Spring Boot Backend (Linux Server)
We will embed the SecuGen Linux SDK into the backend to natively compare templates.

#### [MODIFY] `backend/src/main/java/com/votechain/backend/model/User.java`
- Add `@Column(columnDefinition = "TEXT") private String fingerprintTemplate;`

#### [MODIFY] `backend/src/main/java/com/votechain/backend/controller/AuthController.java` & `backend/src/main/java/com/votechain/backend/dto/RegisterRequest.java`
- Accept `fingerprintTemplate` as a string instead of a `MultipartFile`. Save it to the DB during signup.

#### [MODIFY] `backend/src/main/java/com/votechain/backend/controller/VoteController.java`
- Change `@RequestParam("fingerprint") MultipartFile fingerprint` to `@RequestParam("fingerprintTemplate") String template`.

#### [MODIFY] `backend/src/main/java/com/votechain/backend/service/VoteService.java`
- Completely remove the `MlClientService` dependency!
- Initialize `JSGFPLib sgfplib = new JSGFPLib();`
- Fetch the user's saved template from the database and decode it from Base64 to `byte[]`.
- Decode the incoming live vote template to `byte[]`.
- Call `sgfplib.MatchTemplate(dbTemplate, liveTemplate, SGFDxSecurityLevel.SG_DX_SECURE_NORMAL, matched)`.
- If `matched[0]` is true, cast the vote to the Blockchain!

#### [MODIFY] `backend/pom.xml`
- Install the `FDxSDKPro.jar` as a local system dependency into the Spring Boot project so `JSGFPLib` can be resolved.

---

### Build Scripts & Environment
We must tell the Linux server where the SecuGen `.so` files are, and clean up the Python trash.

#### [MODIFY] `run_server_v2.sh` & `tmux_votechain.sh`
- Delete all Python `venv`, `pip install`, and FastAPI background startup commands.
- Before starting the Spring Boot backend (`mvn spring-boot:run`), export the path to the extracted Linux `.so` library files:
  `export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$(pwd)/FDx_SDK_Pro_Linux_v4.0c/FDx SDK Pro for Linux v4.0c/FDx_SDK_PRO_LINUX4_X64_4_0_0/lib`

#### [DELETE] `backend-ml/` (Entire Folder)
- Safely purge the OpenCV machine learning service.

## Verification Plan
1. Re-build the `scanner-service` using Maven, copy the new `.jar` to the Windows machine, and restart port 9000.
2. Run `./tmux_votechain.sh` to rebuild the backend and wipe the DB.
3. Open the Frontend, create a new account, and scan a fingerprint. Verify the Base64 string is correctly saved to the PostgreSQL database in the new `fingerprintTemplate` column.
4. Attempt to vote using the *same* finger. Spring Boot should log `MatchTemplate: SUCCESS`.
5. Attempt to vote using a *different* finger. Spring Boot should log `MatchTemplate: FAILED`.
