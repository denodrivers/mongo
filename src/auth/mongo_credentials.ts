import { Document } from "../../bson.ts";

export interface AuthMechanismProperties extends Document {
   SERVICE_HOST?: string;
   SERVICE_NAME?: string;
   SERVICE_REALM?: string;
   CANONICALIZE_HOST_NAME?: unknown; // TODO: implement
   AWS_SESSION_TOKEN?: string;
 }