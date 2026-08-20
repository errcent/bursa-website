import { hashPasswordForStorage } from "./password-storage";
import type { StoredUser } from "./types";

/** Local `next dev` only. Must not be imported from production client entry. */

export const DEV_SEED_USERS: StoredUser[] = [
  {
    id: "user-demo-andi",
    name: "Andi Rahayu",
    email: "demo@bursanalar.com",
    username: "andi_r",
    phone: "+6281110000002",
    password: hashPasswordForStorage("demo1234"),
    role: "learner",
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "user-admin-seed",
    name: "Test Admin",
    email: "admin@test.dev",
    username: "test_admin",
    phone: "+6281110000003",
    password: hashPasswordForStorage("password123"),
    role: "admin",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-learner-seed",
    name: "Test Learner",
    email: "learner@test.dev",
    username: "test_learner",
    phone: "+6281110000001",
    password: hashPasswordForStorage("password123"),
    role: "learner",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-mentor-seed",
    name: "Test Mentor",
    email: "mentor@test.dev",
    username: "test_mentor",
    phone: "+6281110000004",
    password: hashPasswordForStorage("password123"),
    role: "mentor",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-developer-seed",
    name: "Test Developer",
    email: "developer@test.dev",
    username: "test_developer",
    phone: "+6281110000005",
    password: hashPasswordForStorage("password123"),
    role: "developer",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];
