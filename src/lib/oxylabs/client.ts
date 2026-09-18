const endpoint = process.env.OXYLABS_ENDPOINT ?? "https://realtime.oxylabs.io/v1/queries";

export class OxylabsClient {
  async query(payload: Record<string,unknown>) {
    const username = process.env.OXYLABS_USERNAME;
    const password = process.env.OXYLABS_PASSWORD;
    if (!username || !password) throw new Error("Oxylabs credentials are not configured");
    const auth = Buffer.from(`${username}:${password}`).toString("base64");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {"content-type":"application/json", authorization:`Basic ${auth}`},
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Oxylabs request failed: ${response.status} ${await response.text()}`);
    return response.json();
  }
}
