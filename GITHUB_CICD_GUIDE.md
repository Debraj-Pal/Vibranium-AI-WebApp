# 🚀 Vibranium AI - Production GitHub CI/CD Pipeline Guide

This documentation provides complete instructions for managing, operating, and configuring the automated GitHub Actions CI/CD workflows for **Vibranium AI**.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Workflow Descriptions](#2-workflow-descriptions)
3. [Branch Strategy](#3-branch-strategy)
4. [GitHub Secrets Configuration](#4-github-secrets-configuration)
5. [Android Signing Key Setup & Replacement](#5-android-signing-key-setup--replacement)
6. [How Automatic & Manual Builds Work](#6-how-automatic--manual-builds-work)
7. [How Releases are Generated](#7-how-releases-are-generated)
8. [How to Download APKs and AABs](#8-how-to-download-apks-and-aabs)
9. [Troubleshooting & Debugging Failed Builds](#9-troubleshooting--debugging-failed-builds)
10. [Disabling and Enabling Workflows](#10-disabling-and-enabling-workflows)

---

## 1. Architecture Overview

The Vibranium AI codebase maintains a **single unified codebase** powering both the **Web Application** (Vercel) and **Mobile Android Native App** (Capacitor APK/AAB).

```
                      ┌────────────────────────┐
                      │    Push to GitHub      │
                      └───────────┬────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
 ┌───────────────┐        ┌───────────────┐        ┌───────────────┐
 │  quality.yml  │        │   build.yml   │        │  vercel.yml   │
 │ (Type check & │        │  (Web Production│      │ (Auto Deploy  │
 │  Lint checks) │        │     Build)    │        │   Vercel Web) │
 └───────────────┘        └───────────────┘        └───────────────┘
                                  │
                                  ▼
                          ┌───────────────┐
                          │  android.yml  │
                          │(Capacitor Sync│
                          │  APK & AAB)   │
                          └───────────────┘
                                  │
                        [Tag: v1.0.0 created]
                                  │
                                  ▼
                          ┌───────────────┐
                          │  release.yml  │
                          │(Attach APK/AAB│
                          │& Publish Tag) │
                          └───────────────┘
```

---

## 2. Workflow Descriptions

All workflows are located inside `.github/workflows/`:

| Workflow File | Trigger Events | Purpose | Outputs |
| :--- | :--- | :--- | :--- |
| **`quality.yml`** | `push`, `pull_request` on `main`, `develop`, `feature/*` | Continuous Integration, TypeScript verification, audit checks | Job Summary |
| **`build.yml`** | `push` on `main`, `develop`, `workflow_dispatch` | Web application production build validation | `web-production-build` artifact |
| **`vercel.yml`** | `push` on `main`, `develop`, `feature/*` | Auto-deploy to Vercel (Production on `main`, Preview on others) | Live Deployment URL |
| **`android.yml`** | `push` on `main`, `develop`, `workflow_dispatch` | Syncs Capacitor, builds Signed/Debug APK & AAB bundles | `vibranium-android-apks`, `vibranium-android-aab` artifacts |
| **`release.yml`** | Tag push (`v*`), `workflow_dispatch` | Generates tagged Release, attaches Release APK & AAB | GitHub Release with binary assets |

---

## 3. Branch Strategy

- **`main`**: Production branch.
  - Runs full CI quality checks
  - Builds Web app
  - Deploys live to **Vercel Production**
  - Syncs Capacitor and generates production-signed **APK** & **AAB**
  - Prepares assets for release tags
- **`develop`**: Staging branch.
  - Runs CI quality checks
  - Deploys to **Vercel Preview**
  - Generates test APKs and AABs
- **`feature/*`**: Feature branches.
  - Runs CI quality checks & type checks
  - Generates ephemeral preview deployments on Vercel
  - Does **not** trigger Android builds to conserve build minutes

---

## 4. GitHub Secrets Configuration

To enable automated deployments and Android signing, navigate to:
**GitHub Repository ➔ Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret**

### A. Vercel Deployment Secrets
- `VERCEL_TOKEN`: Personal access token generated from Vercel account settings.
- `VERCEL_ORG_ID`: Vercel team/org ID (found in `.vercel/project.json`).
- `VERCEL_PROJECT_ID`: Vercel project ID (found in `.vercel/project.json`).

### B. Android Release Signing Secrets
- `ANDROID_KEYSTORE_BASE64`: Base64-encoded string of your `.keystore` or `.jks` file.
- `ANDROID_STORE_PASSWORD`: Keystore password.
- `ANDROID_KEY_ALIAS`: Key alias name.
- `ANDROID_KEY_PASSWORD`: Key password.

### C. Application Environment Secrets
- `VITE_GEMINI_API_KEY`: Google Gemini API key for server AI model logic.
- `VITE_API_SERVER_URL`: Production backend server URL (optional override).

---

## 5. Android Signing Key Setup & Replacement

### Creating a New Android Release Keystore
Run the following command in your local terminal:
```bash
keytool -genkey -v -keystore release.keystore -alias vibranium-key -keyalg RSA -keysize 2048 -validity 10000
```

### Converting Keystore to Base64
Convert the generated `release.keystore` to a single Base64 string:

* **Linux / macOS**:
  ```bash
  base64 -i release.keystore -o keystore_base64.txt
  cat keystore_base64.txt
  ```
* **Windows (PowerShell)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) > keystore_base64.txt
  ```

Copy the full text inside `keystore_base64.txt` and save it in GitHub Secrets as `ANDROID_KEYSTORE_BASE64`.

### Replacing an Existing Signing Key
1. Generate or obtain your new `.keystore` file.
2. Encode it to base64 as shown above.
3. Update the `ANDROID_KEYSTORE_BASE64`, `ANDROID_STORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD` secrets in GitHub Settings.
4. Re-run the **Capacitor Android Build** workflow in GitHub Actions.

---

## 6. How Automatic & Manual Builds Work

### Automatic Builds
When you push code:
```bash
git add .
git commit -m "feat: enhance AI response model"
git push origin main
```
GitHub Actions will automatically trigger `quality.yml`, `build.yml`, `vercel.yml`, and `android.yml` in parallel/sequence.

### Manual Triggering (Workflow Dispatch)
1. Go to your GitHub repository tab **Actions**.
2. Select any workflow (e.g. **Capacitor Android Build** or **Vercel Web Deployment**).
3. Click the **Run workflow** dropdown button on the right side.
4. Select the target branch (`main` or `develop`) and click **Run workflow**.

---

## 7. How Releases are Generated

To trigger a production release with attached binaries:

1. Create a version tag locally and push it:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
2. GitHub Actions triggers `.github/workflows/release.yml`.
3. The workflow compiles the web app, syncs Capacitor, builds signed Release APK & AAB files, creates a new entry under **Releases**, and attaches the files automatically.

---

## 8. How to Download APKs and AABs

### From GitHub Actions Workflow Runs:
1. Open the **Actions** tab on GitHub.
2. Click on a completed **Capacitor Android Build** run.
3. Scroll down to the **Artifacts** section at the bottom.
4. Click `vibranium-android-apks` to download the zip containing `.apk` files.
5. Click `vibranium-android-aab` to download the `.aab` bundle for Google Play Store upload.

### From GitHub Releases:
1. Open the **Releases** section on your GitHub repository page (`/releases`).
2. Select the latest version tag (e.g., `v1.0.0`).
3. Under **Assets**, click to download `VibraniumAI-v1.0.0.apk` or `VibraniumAI-v1.0.0.aab`.

---

## 9. Troubleshooting & Debugging Failed Builds

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `TypeScript error` during CI | Type mismatch or missing type imports | Run `npm run lint` locally and resolve any `tsc` compilation issues before pushing. |
| `Android build failed: gradlew permission denied` | Executable bit lost on `gradlew` | Workflow automatically executes `chmod +x android/gradlew`. |
| `Keystore not found` warning | Missing `ANDROID_KEYSTORE_BASE64` secret | The pipeline automatically falls back to debug APKs. Add the base64 keystore secret to produce signed release binaries. |
| `Vercel deployment error 403` | Invalid or expired `VERCEL_TOKEN` | Regenerate token in Vercel settings and update GitHub Secret. |

---

## 10. Disabling and Enabling Workflows

### Disabling a Workflow temporarily in GitHub UI:
1. Go to **Actions** ➔ Click the workflow name in the left sidebar.
2. Click the `...` menu on the top right.
3. Click **Disable workflow**.

### Re-enabling a Workflow:
1. Go to **Actions** ➔ Select the disabled workflow.
2. Click **Enable workflow**.
