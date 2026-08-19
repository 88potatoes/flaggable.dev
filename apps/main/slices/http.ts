import ky from "ky";

export const api = ky.create({
  prefix: "/api/v1",
  headers: { "content-type": "application/json" },
});
