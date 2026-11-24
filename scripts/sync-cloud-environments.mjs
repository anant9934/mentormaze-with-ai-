import fs from "node:fs";

// Read and parse .env
const envContent = fs.readFileSync(".env", "utf8");
const workingEnv = {};

for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    const key = match[1];

    // Explicitly skip any invalid or removed keys
    if (key === "RESEND_API_KEY") continue;
    if (key === "VERCEL_OIDC_TOKEN") continue;
    if (key.startsWith("LIVEKIT_P1_")) continue;

    workingEnv[key] = val;
  }
}

// Guarantee production variables for cloud deployments
workingEnv["NODE_ENV"] = "production";
workingEnv["ENABLE_MEETING_INTELLIGENCE"] = "true";
workingEnv["NEXTAUTH_URL"] = "https://mentormaze.aitathastu.com";
workingEnv["NEXT_PUBLIC_APP_URL"] = "https://mentormaze.aitathastu.com";

const vercelToken = workingEnv.VERCEL_TOKEN;
const renderApiKey = workingEnv.RENDER_API_KEY;
const vercelProjectId = "prj_KcWBdo30MFqq9JNyHuaFRAMzbwsV";
const renderServiceId = "srv-dc28o7p7lnhs73a1kufg";

function mask(v) {
  if (!v || v.length < 8) return v;
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}

async function syncVercel() {
  console.log("\n==========================================");
  console.log("1. SYNCHRONIZING VERCEL ENVIRONMENT (mentormaze)");
  console.log("==========================================");

  if (!vercelToken) {
    console.error("Missing VERCEL_TOKEN!");
    return;
  }

  // 1. Fetch existing env vars
  const listRes = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/env`, {
    headers: { Authorization: `Bearer ${vercelToken}` },
  });

  if (!listRes.ok) {
    console.error("Failed to list Vercel envs:", await listRes.text());
    return;
  }

  const listData = await listRes.json();
  const existingEnvs = {};
  for (const env of listData.envs || []) {
    existingEnvs[env.key] = env.id;
  }
  console.log(`Found ${Object.keys(existingEnvs).length} existing env vars on Vercel.`);

  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const [key, value] of Object.entries(workingEnv)) {
    const existingId = existingEnvs[key];
    try {
      if (existingId) {
        // Edit existing
        const patchRes = await fetch(
          `https://api.vercel.com/v9/projects/${vercelProjectId}/env/${existingId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              value,
              target: ["production", "preview", "development"],
            }),
          }
        );
        if (patchRes.ok) {
          updatedCount++;
        } else {
          console.warn(`Failed to update ${key} on Vercel:`, patchRes.status, await patchRes.text());
          errorCount++;
        }
      } else {
        // Create new
        const postRes = await fetch(
          `https://api.vercel.com/v10/projects/${vercelProjectId}/env`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key,
              value,
              type: "encrypted",
              target: ["production", "preview", "development"],
            }),
          }
        );
        if (postRes.ok) {
          createdCount++;
        } else {
          console.warn(`Failed to create ${key} on Vercel:`, postRes.status, await postRes.text());
          errorCount++;
        }
      }
    } catch (err) {
      console.error(`Error syncing ${key} to Vercel:`, err.message);
      errorCount++;
    }
  }

  console.log(`Vercel Sync Complete: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors.`);
}

async function syncRender() {
  console.log("\n==========================================");
  console.log("2. SYNCHRONIZING RENDER SERVICE (mentormaze-backend)");
  console.log("==========================================");

  if (!renderApiKey) {
    console.error("Missing RENDER_API_KEY!");
    return;
  }

  // 1. Fetch current env vars to preserve any Render-injected system settings
  const listRes = await fetch(`https://api.render.com/v1/services/${renderServiceId}/env-vars`, {
    headers: { Authorization: `Bearer ${renderApiKey}` },
  });

  if (!listRes.ok) {
    console.error("Failed to list Render envs:", await listRes.text());
    return;
  }

  const listData = await listRes.json();
  const renderEnvMap = new Map();

  // Preserve Render host variables if present
  const renderSystemKeys = ["PORT", "NODE_VERSION", "NODE_OPTIONS", "NEXT_CPU_NUM", "NEXT_TELEMETRY_DISABLED"];
  for (const item of listData) {
    if (item && item.envVar) {
      const k = item.envVar.key;
      if (renderSystemKeys.includes(k)) {
        renderEnvMap.set(k, item.envVar.value);
      }
    }
  }

  // Enforce critical production node settings
  renderEnvMap.set("NODE_VERSION", "20.17.0");

  // Now overlay all working keys from workingEnv
  for (const [key, value] of Object.entries(workingEnv)) {
    renderEnvMap.set(key, value);
  }

  // Guarantee production NODE_ENV and intelligence flags
  renderEnvMap.set("NODE_ENV", "production");
  renderEnvMap.set("ENABLE_MEETING_INTELLIGENCE", "true");

  const renderPayload = [];
  for (const [key, value] of renderEnvMap.entries()) {
    renderPayload.push({ key, value });
  }

  console.log(`Updating Render service with ${renderPayload.length} environment variables...`);

  const putRes = await fetch(`https://api.render.com/v1/services/${renderServiceId}/env-vars`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${renderApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(renderPayload),
  });

  if (putRes.ok) {
    const updatedVars = await putRes.json();
    console.log(`Render Sync Complete: successfully synced ${updatedVars.length} environment variables.`);
  } else {
    console.error("Failed to update Render envs:", putRes.status, await putRes.text());
  }
}

async function verifySync() {
  console.log("\n==========================================");
  console.log("3. VERIFYING CLOUD ENVIRONMENTS POST-SYNC");
  console.log("==========================================");

  // Check Vercel
  const vRes = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/env`, {
    headers: { Authorization: `Bearer ${vercelToken}` },
  });
  if (vRes.ok) {
    const vData = await vRes.json();
    const vKeys = (vData.envs || []).map((e) => e.key);
    console.log(`Vercel active env count: ${vKeys.length}`);
    console.log("Vercel AI keys check:", {
      hasGemini: vKeys.includes("GEMINI_API_KEY"),
      hasGemini2: vKeys.includes("GEMINI_API_KEY_2"),
      hasGroq: vKeys.includes("GROQ_API_KEY"),
      hasOpenRouter: vKeys.includes("OPENROUTER_API_KEY"),
      hasLiveKitPrimary: vKeys.includes("LIVEKIT_PRIMARY_API_KEY"),
    });
  }

  // Check Render
  const rRes = await fetch(`https://api.render.com/v1/services/${renderServiceId}/env-vars`, {
    headers: { Authorization: `Bearer ${renderApiKey}` },
  });
  if (rRes.ok) {
    const rData = await rRes.json();
    const rKeys = rData.map((e) => e.envVar.key);
    console.log(`Render active env count: ${rKeys.length}`);
    console.log("Render AI keys check:", {
      hasGemini: rKeys.includes("GEMINI_API_KEY"),
      hasGemini2: rKeys.includes("GEMINI_API_KEY_2"),
      hasGroq: rKeys.includes("GROQ_API_KEY"),
      hasOpenRouter: rKeys.includes("OPENROUTER_API_KEY"),
      hasLiveKitPrimary: rKeys.includes("LIVEKIT_PRIMARY_API_KEY"),
    });
  }
}

async function main() {
  console.log(`Loaded ${Object.keys(workingEnv).length} working environment variables from .env.`);
  await syncVercel();
  await syncRender();
  await verifySync();
}

main().catch(console.error);
