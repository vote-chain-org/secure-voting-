# SDK-Backed Fingerprint Pipeline — Corrected Implementation Plan

## Core Correction: Raw Bytes Flow

> [!IMPORTANT]
> The scanner sends **raw grayscale pixel bytes directly encoded as base64** — NO BMP wrapping. All conversion (raw → PNG for ML, raw → SG400 template for SDK) happens server-side on Linux. The frontend only acts as a pass-through for the base64 string + image dimensions.

**New scanner response:**
```json
{ "rawBase64": "<base64 of raw pixel bytes>", "width": 300, "height": 400, "quality": 85, "error": null }
```

---

## Phase 0: SDK Setup (Run Once on Linux Server)

From `/home/shreyas/Downloads/GIT_CLONES/devansh/secure-voting-/final_project/`:

```bash
SDK_LIB="FDx_SDK_Pro_Linux_v4.0c/FDx SDK Pro for Linux v4.0c/FDx_SDK_PRO_LINUX4_X64_4_0_0/lib/linux4X64"
SDK_PY="FDx_SDK_Pro_Linux_v4.0c/FDx SDK Pro for Linux v4.0c/FDx_SDK_PRO_LINUX4_X64_4_0_0/python"

# Step 1: Install .so files
sudo cp "${SDK_LIB}/"*.so /usr/local/lib/
sudo cp "${SDK_LIB}/"*.dat /usr/local/lib/
sudo cp "${SDK_LIB}/"*.lic /usr/local/lib/

# Step 2: Create unversioned symlinks (pysgfplib.py loads these exact names)
sudo ln -sf /usr/local/lib/libpysgfplib.so.4.0.0 /usr/local/lib/libpysgfplib.so
sudo ln -sf /usr/local/lib/libsgfplib.so.4.0.1   /usr/local/lib/libsgfplib.so
sudo ln -sf /usr/local/lib/libsgimage.so.1.0.0   /usr/local/lib/libsgimage.so
sudo ln -sf /usr/local/lib/libsgnfiq.so.1.0.0    /usr/local/lib/libsgnfiq.so

# Step 3: Refresh dynamic linker cache
sudo ldconfig

# Step 4: Copy Python wrappers into ml service
mkdir -p backend-ml/src/sdk
cp "${SDK_PY}/pysgfplib.py"        backend-ml/src/sdk/
cp "${SDK_PY}/sgfdxerrorcode.py"   backend-ml/src/sdk/
cp "${SDK_PY}/sgfdxdevicename.py"  backend-ml/src/sdk/
cp "${SDK_PY}/sgfdxsecuritylevel.py" backend-ml/src/sdk/
touch backend-ml/src/sdk/__init__.py

# Step 5: Verify SDK loads
python3 -c "from ctypes import CDLL; CDLL('/usr/local/lib/libpysgfplib.so'); print('SDK OK')"
```

> [!WARNING]
> `pysgfplib.py` hardcodes `slib = '/usr/local/lib/libpysgfplib.so'`. The symlink in Step 2 is mandatory. The `.dat` and `.lic` files in `/usr/local/lib/` are the HU20 device licence files — without them the SDK will refuse to run template operations.

---

## File Inventory

### `scanner-service/` — Windows Java App
| Action | File |
|---|---|
| **MODIFY** | `src/.../ScannerService.java` — remove `rawToBmp()`, return raw bytes as base64 + width/height |

### `frontend/` — React
| Action | File |
|---|---|
| **MODIFY** | `pages/SignupPage.jsx` — remove `bmpBase64ToPngFile()` canvas fn; pass `rawBase64`+`width`+`height` |
| **MODIFY** | `pages/ElectionDetail.jsx` — same canvas removal; pass `rawBase64`+`width`+`height` |

### `backend/` — Spring Boot
| Action | File |
|---|---|
| **MODIFY** | `model/User.java` — add `fingerprintRawB64`, `fpWidth`, `fpHeight` fields |
| **MODIFY** | `dto/RegisterRequest.java` — add `fingerprintRawB64`, `fpWidth`, `fpHeight` |
| **NEW** | `util/FingerprintImageUtil.java` — raw bytes → PNG converter (Java ImageIO) |
| **MODIFY** | `service/AuthService.java` — store raw b64 to DB, convert→PNG, call ML `/enroll`, delete PNG |
| **MODIFY** | `service/MlClientService.java` — add `enroll()`, change `verify()` to call `/identify`, add `verifyWithId()` |
| **MODIFY** | `service/VoteService.java` — 6-gate flow; enforce sdk_score ≥ 165; delete temp PNG |
| **MODIFY** | `controller/VoteController.java` — accept `rawBase64`+`width`+`height` instead of MultipartFile |

### `backend-ml/` — Python ML Service (Full Revamp)
| Action | File |
|---|---|
| **REWRITE** | `api/main.py` — 3 endpoints: `/enroll`, `/identify` (1:N ORB), `/verify` (1:1 liveness+minutiae+SDK) |
| **REWRITE** | `src/matcher.py` — replace ORB with Gabor+skeleton+crossing-number (from secure-voting- reference) |
| **NEW** | `src/sdk/__init__.py` + 4 SDK wrapper files (copied in Phase 0) |
| **NEW** | `src/sdk_matcher.py` — wraps `PYSGFPLib.CreateSG400Template()` + `GetMatchingScore()` |
| **NEW** | `src/pipeline.py` — 3-step: liveness → minutiae → SDK score |
| **COPY** | `src/model.py` — copy from `secure-voting-/backend-ml/src/model.py` |
| **COPY** | `src/dataset.py` — copy from `secure-voting-/backend-ml/src/dataset.py` |
| **MODIFY** | `requirements.txt` — add torch, torchvision, scikit-image, psycopg2-binary, scikit-learn |

### Scripts & Docs
| Action | File |
|---|---|
| **MODIFY** | `run_server_v2.sh` — add SDK `.so` check in pre-flight Step 0 |
| **NEW** | `docs/low-level/fingerprint_pipeline.md` — end-to-end flow |
| **MODIFY** | `docs/database_guide/factory_reset.md` — add `voter_fingerprints` table to wipe steps |

---

## Detailed Changes

### 1. `scanner-service/ScannerService.java`

Remove the entire `rawToBmp()` method and `writeIntLE()`/`writeShortLE()` helpers. Change the capture endpoint to:

```java
// After GetImageEx succeeds:
String rawBase64 = Base64.getEncoder().encodeToString(imageBuffer);
String response = "{\"rawBase64\":\"" + rawBase64 + 
    "\",\"width\":" + deviceInfo.imageWidth +
    ",\"height\":" + deviceInfo.imageHeight +
    ",\"quality\":" + quality[0] + ",\"error\":null}";
sendJson(exchange, 200, response);
```

### 2. Frontend — Both `SignupPage.jsx` and `ElectionDetail.jsx`

**Remove:** The entire `bmpBase64ToPngFile()` function and all canvas-based BMP→PNG conversion.

**Change scan handler:** After `/capture` responds, extract `rawBase64`, `width`, `height` and store them in component state. Do NOT process the image in the browser.

**Registration submit:** Add `fingerprintRawB64`, `fpWidth`, `fpHeight` to the JSON payload alongside existing fields. Remove the separate `POST /enroll` call to the ML service (enrollment now fully server-side).

**Vote submit:** Send `rawBase64`, `width`, `height` as plain form fields to `/api/votes/cast`.

### 3. `backend/util/FingerprintImageUtil.java` [NEW]

```java
public static File rawToTempPng(String rawBase64, int width, int height) throws IOException {
    byte[] raw = Base64.getDecoder().decode(rawBase64);
    BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
    byte[] raster = ((DataBufferByte) img.getRaster().getDataBuffer()).getData();
    System.arraycopy(raw, 0, raster, 0, raw.length);
    File tmp = File.createTempFile("fp_", ".png");
    ImageIO.write(img, "PNG", tmp);
    return tmp;
}
```

### 4. `backend/model/User.java`

Add three columns (Spring Boot `ddl-auto=update` will add them on next start):
```java
@Column(columnDefinition = "TEXT")  private String fingerprintRawB64;
@Column private Integer fpWidth;
@Column private Integer fpHeight;
```

### 5. `backend/service/AuthService.java` — Registration

After saving user to DB:
1. Store `fingerprintRawB64`, `fpWidth`, `fpHeight` on the `User` entity.
2. Call `FingerprintImageUtil.rawToTempPng()` → temp PNG file.
3. Call `mlClientService.enroll(voterId, pngBytes)` → `POST /enroll` to ML.
4. `Files.delete(tmp.toPath())` — always delete, even on failure.

### 6. `backend/service/MlClientService.java`

Three methods:
- **`enroll(voterId, pngBytes)`** — `POST /enroll` with voter_id + PNG file
- **`identify(pngBytes)`** — `POST /identify` (1:N ORB, no voter_id) → returns `voter_id` or null
- **`verifyWithId(voterId, pngBytes)`** — `POST /verify` with voter_id + PNG → returns full result map including `sdk_score`

### 7. `backend/service/VoteService.java` — 6-Gate Voting Flow

```
Gate 1: mlClientService.identify(pngBytes) → voterId (null = reject)
Gate 2: User exists in PostgreSQL (null = reject)
Gate 3: mlClientService.verifyWithId(voterId, pngBytes)
          verified==false → reject with result.reason
Gate 4: result.sdk_score >= 165 → reject with "SDK score too low"
Gate 5: voteRepository.existsByUser_VoterIdAndElectionId() → reject "already voted"
Gate 6: fabricService.castVote() → blockchain (rejects double-vote at chain level too)
Always: delete temp PNG
```

### 8. `backend-ml/` — Full Revamp

#### `src/matcher.py` — Minutiae Extractor (copied from reference)
- Gabor filter bank (4 angles: 0°/45°/90°/135°)
- Otsu binarize → skeletonize → Crossing Number (CN=1: ending, CN=3: bifurcation)
- `extract_minutiae()`, `match_minutiae()`, `serialize_minutiae()`, `deserialize_minutiae()`

#### `src/sdk_matcher.py` [NEW]
```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sdk'))
from ctypes import c_int, create_string_buffer
from pysgfplib import PYSGFPLib

TEMPLATE_SIZE = 400

def get_sg400_template_from_png(png_path: str) -> bytes:
    """Load PNG as grayscale numpy array, run CreateSG400Template, return 400-byte template."""
    import cv2
    img = cv2.imread(png_path, cv2.IMREAD_GRAYSCALE)
    raw = img.tobytes()
    raw_buf = create_string_buffer(raw, len(raw))
    tmpl_buf = create_string_buffer(TEMPLATE_SIZE)
    sg = PYSGFPLib()
    sg.CreateSG400Template(raw_buf, tmpl_buf)
    return bytes(tmpl_buf)

def sdk_match_score(template1_bytes: bytes, template2_bytes: bytes) -> int:
    """Return SDK match score 0-199 between two SG400 templates."""
    buf1 = create_string_buffer(template1_bytes, TEMPLATE_SIZE)
    buf2 = create_string_buffer(template2_bytes, TEMPLATE_SIZE)
    score = c_int(0)
    sg = PYSGFPLib()
    sg.GetMatchingScore(buf1, buf2, score)
    return score.value
```

#### `src/pipeline.py` [NEW] — Follows `secure-voting-` structure

`VoterDB` class manages the `voter_fingerprints` table in PostgreSQL:
```sql
CREATE TABLE IF NOT EXISTS voter_fingerprints (
    voter_id       VARCHAR(64) PRIMARY KEY,
    minutiae_data  BYTEA NOT NULL,
    template_hash  VARCHAR(64) NOT NULL,
    sg400_template BYTEA NOT NULL,        -- 400 bytes, SecuGen format
    has_voted      BOOLEAN DEFAULT FALSE,
    vote_token     VARCHAR(128)
);
```

`enroll(voter_id, png_path)`:
1. Extract minutiae → serialize → SHA-256 hash
2. Create SG400 template via `sdk_matcher.get_sg400_template_from_png()`
3. INSERT both into `voter_fingerprints`

`verify_voter_for_voting(voter_id, png_path, liveness_model, device)`:
1. Load stored row; check `has_voted`, verify `template_hash` integrity
2. **Liveness:** ResNet-18 `model.liveness_score()` → must be ≥ 0.6
3. **Minutiae:** `match_minutiae(probe, stored)` → must be ≥ 0.4
4. **SDK:** `sdk_match_score(probe_tmpl, stored_tmpl)` → return as `sdk_score`
5. Return: `{verified, liveness_score, match_score, sdk_score, reason}`

The sdk_score threshold (165) is enforced by Spring Boot, not the ML service.

#### `api/main.py` [REWRITE] — 3 Endpoints

- **`POST /enroll`** — `voter_id` (Form) + `fingerprint` (PNG File) → `VoterDB.enroll()`
- **`POST /identify`** — `fingerprint` (PNG File) → 1:N ORB match against `data/fingerprints/*.png` (preserved from current system) → returns `{voter_id, score}`
- **`POST /verify`** — `voter_id` (Form) + `fingerprint` (PNG File) → full 3-step pipeline → returns `{verified, liveness_score, match_score, sdk_score, reason}`
- **`GET /health`** — `{model_loaded, enrolled_count}`

#### `requirements.txt`
```
fastapi>=0.100.0
uvicorn>=0.22.0
python-multipart>=0.0.6
opencv-python-headless>=4.7.0
numpy>=1.24.0
Pillow>=9.0.0
scikit-image>=0.21.0
torch>=2.0.0
torchvision>=0.15.0
psycopg2-binary>=2.9.0
scikit-learn>=1.3.0
```

### 9. `run_server_v2.sh` — Pre-flight Addition

Add to Step 0 checks:
```bash
if [ ! -f "/usr/local/lib/libpysgfplib.so" ]; then
    print_error "SecuGen Linux SDK not installed. Run Phase 0 setup from the implementation plan."
    exit 1
fi
```

---

## Verification Plan

```bash
# 1. SDK loads correctly
python3 -c "from ctypes import CDLL; CDLL('/usr/local/lib/libpysgfplib.so'); print('OK')"

# 2. ML service health after startup
curl http://localhost:5000/health
# Expected: {"status":"ok","model_loaded":true,"enrolled_count":N}

# 3. After registering a voter — check both DBs
psql -U postgres -d votechain -c "SELECT voter_id, fp_width, fp_height FROM users WHERE voter_id IS NOT NULL;"
psql -U postgres -d votechain -c "SELECT voter_id, has_voted, length(sg400_template) FROM voter_fingerprints;"
# sg400_template should be 400 bytes

# 4. Vote attempt — check backend log for:
# [VoteService] Gate 1: identified voter=sdgs
# [VoteService] Gate 3: liveness=0.87 match=0.63
# [VoteService] Gate 4: sdk_score=172 (threshold=165) PASS

# 5. Temp PNG cleanup
ls /tmp/fp_*.png  # Should return nothing after each vote attempt
```

---

## Post-Implementation: What the ML Service Does

### During `/enroll`

**Receives:** `voter_id` + PNG (server-converted from raw base64)

1. **Minutiae extraction** — Gabor filter at 4 angles enhances ridges → Otsu binarize → skeletonize to 1px → Crossing Number: CN=1 = ending, CN=3 = bifurcation → numpy array of `[x, y, type]` points → serialized to bytes + SHA-256 hash
2. **SDK template** — Load PNG as greyscale numpy → raw bytes → `CreateSG400Template()` → 400-byte proprietary SecuGen template
3. Both stored in `voter_fingerprints` PostgreSQL table

### During `/identify` (1:N, Gate 1)

**Receives:** PNG only — no voter_id

Runs ORB feature matching against all enrolled `data/fingerprints/*.png` images. Returns the `voter_id` with the highest match score. This is the identification step that preserves the zero-trust principle (voter never declares their own ID).

### During `/verify` (1:1, Gates 2+3+SDK)

**Receives:** `voter_id` (from Gate 1) + PNG

**Step 1 — Liveness (ResNet-18 CNN):**
- PNG → 224×224 resize → greyscale to 3-channel → ImageNet normalization → tensor
- Forward pass through frozen ResNet-18 backbone + custom head → softmax → class-1 probability
- Score < 0.6 → `reason: liveness_failed`, stop

**Step 2 — Minutiae 1:1 Match:**
- Extract minutiae from probe PNG using Gabor+skeleton+CN algorithm
- Load stored minutiae bytes from DB, verify SHA-256 hash (tamper check)
- `match_minutiae()`: for each probe point find nearest stored point within 20px; +1.0 if type matches, +0.7 if type differs; score = matched / max(|probe|, |stored|)
- Score < 0.4 → `reason: no_match`, stop

**Step 3 — SDK Score:**
- Load probe PNG as greyscale → raw bytes → `CreateSG400Template()` → 400-byte probe template
- Load stored `sg400_template` bytes from DB
- `GetMatchingScore(probe_tmpl, stored_tmpl, &score)` → integer 0–199
- Return `sdk_score` to Spring Boot (threshold enforcement is in Java)

**Returns:**
```json
{
  "verified": true,
  "voter_id": "sdgs",
  "liveness_score": 0.87,
  "match_score": 0.63,
  "sdk_score": 172,
  "reason": "match"
}
```

### Full 6-Gate Security Table

| Gate | Layer | Check | Rejects When |
|---|---|---|---|
| 1 | Java | ORB 1:N identification | No fingerprint matches any enrolled voter |
| 2 | Python | ResNet-18 liveness | Score < 0.6 (fake/printed finger) |
| 3 | Python | Minutiae 1:1 match | Score < 0.4 (wrong person's finger) |
| 4 | Java | SDK GetMatchingScore | sdk_score < 165/199 |
| 5 | Java | PostgreSQL double-vote | Already voted in this election |
| 6 | Blockchain | Chaincode hasVoted | Already voted on ledger |
