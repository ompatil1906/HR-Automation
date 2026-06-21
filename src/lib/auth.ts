import { SignJWT, jwtVerify } from "jose";

const key = () => new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "development-only-change-me");
export async function createSession() { return new SignJWT({ role: "owner" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key()); }
export async function verifySession(token: string) { return jwtVerify(token, key()); }
