import ky from "ky";

export const api = ky.create({
  prefixUrl: "/api/v1",
  headers: { "content-type": "application/json" },
});
