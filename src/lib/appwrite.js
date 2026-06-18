import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite";
import { APPWRITE } from "./config";

const client = new Client()
  .setEndpoint(APPWRITE.endpoint)
  .setProject(APPWRITE.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID, Query, Permission, Role, client };
