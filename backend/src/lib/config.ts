import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

// Create the client
const client = new SecretManagerServiceClient();

export async function getSecret(key: string): Promise<string | undefined> {
  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID;
    // Access the secret version
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${key}/versions/latest`,
    });

    // Extract the payload as a string
    return version?.payload?.data?.toString() || "";
  } catch (error) {
    console.error("Error accessing secret:", error);
  }
}
