import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { CloudRedisClient } from "@google-cloud/redis";

// Create the client
const client = new SecretManagerServiceClient();

export async function getSecret(key: string): Promise<string | undefined> {
  try {
    const projectId = process.env.SECRET_PROJECT_ID;
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

// Creates a client
const cloudRedis = new CloudRedisClient();

export async function getRedisInstanceUrl(): Promise<string | undefined> {
  // Define your project ID and the location/region of your Redis instance
  const projectId = process.env.PROJECT_ID; // Replace with your actual project ID
  const location = process.env.REDIS_LOCATION; // e.g., us-central1
  const instanceId = process.env.REDIS_INSTANCE_ID; // Replace with your actual instance ID

  // Construct the name of the Redis instance
  const instanceName = `projects/${projectId}/locations/${location}/instances/${instanceId}`;

  try {
    // Get the Redis instance details
    const [instance] = await cloudRedis.getInstance({ name: instanceName });

    if (!instance) {
      throw new Error("No redis instance found");
    }

    // Extract the host and port to form the Redis URL
    const { host } = instance;
    const { port } = instance;
    return `redis://${host}:${port}`;
  } catch (error) {
    console.error("Error getting Redis instance details:", error);
  }
}
