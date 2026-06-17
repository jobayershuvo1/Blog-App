import type { Role } from "@/lib/constants";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      status: string;
      username?: string | null;
    };
  }

  interface User {
    id: string;
    role: Role;
    status: string;
    username?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: string;
    username?: string | null;
  }
}
