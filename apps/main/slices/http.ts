import ky from "ky";

let activeProjectId: string | null = null;

export function setActiveProjectId(projectId: string | null) {
  activeProjectId = projectId;
}

export function getActiveProjectId(): string | null {
  return activeProjectId;
}

export const api = ky.create({
  prefix: "/api/v1",
  headers: {
    "content-type": "application/json",
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        if (activeProjectId && !request.headers.has("x-flaggable-project-id")) {
          request.headers.set("x-flaggable-project-id", activeProjectId);
        }
      },
    ],
  },
});

export function apiWithProject(projectId: string) {
  return api.extend({
    headers: {
      "x-flaggable-project-id": projectId,
    },
  });
}
