// Side-effect module: load .env.local BEFORE anything that reads process.env
// (e.g. lib/prisma constructs the Neon adapter at import time). Import this first.
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
