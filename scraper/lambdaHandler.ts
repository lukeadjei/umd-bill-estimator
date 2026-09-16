import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// Populates process.env.SUPABASE_SERVICE_ROLE_KEY from Secrets Manager --
// must run and complete BEFORE supabaseClient.ts is imported anywhere in the
// call graph below, since that module reads the env var at import time, not
// per-call. Auth to Secrets Manager itself is implicit: no credentials here,
// just the IAM role attached to this Lambda.
async function loadServiceRoleKeyIntoEnv(): Promise<void> {
  const secretArn = process.env.SUPABASE_SECRET_ARN;
  if (!secretArn) {
    throw new Error("Missing SUPABASE_SECRET_ARN environment variable (set on the Lambda's configuration)");
  }

  const client = new SecretsManagerClient({});
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));
  if (!response.SecretString) {
    throw new Error(`Secrets Manager returned no SecretString for ${secretArn}`);
  }

  const parsed = JSON.parse(response.SecretString) as { SUPABASE_SERVICE_ROLE_KEY: string };
  process.env.SUPABASE_SERVICE_ROLE_KEY = parsed.SUPABASE_SERVICE_ROLE_KEY;
}

// The Lambda entry point -- triggered on a schedule by EventBridge
// Scheduler, not by a human typing a command. Unlike the CLI (which takes an
// explicit academic_year_id argument, since a human running it by hand might
// legitimately be refreshing a not-yet-current year while staging it), this
// always resolves and refreshes whichever year is CURRENTLY live -- "which
// year is current" is exactly what a scheduled refresh should mean, and
// there's no argv to pass anything else in through anyway. Never touches
// promotion or academic_years.is_current -- those stay deliberate manual
// steps (npm run promote / academic-year:activate), same as always.
//
// Deliberately lets errors propagate (not caught/swallowed here) -- Lambda's
// own execution status should show "Error" for a failed scrape, not quietly
// report success, and CloudWatch Logs already captures the full stack trace
// via console.error calls throughout the scraper. A transient failure (e.g.
// one UMD page briefly unreachable) is also a case where Lambda's own retry
// behavior on a failed invocation is the right response, not something this
// handler should try to paper over.
export async function handler(): Promise<{ statusCode: number; body: string }> {
  await loadServiceRoleKeyIntoEnv();
  const { supabase } = await import("./supabaseClient");
  const { runScrape } = await import("./runScrape");

  const { data: currentYear, error } = await supabase
    .from("academic_years")
    .select("id, label")
    .eq("is_current", true)
    .single();

  if (error || !currentYear) {
    throw new Error(`No current academic year found (${error?.message ?? "no row marked is_current"})`);
  }

  console.log(`Scheduled scrape starting for current year: ${currentYear.label} (${currentYear.id})`);
  await runScrape(currentYear.id);
  console.log("Scheduled scrape finished -- review staged data before promoting.");

  return { statusCode: 200, body: `Scraped into staging for ${currentYear.label}` };
}
