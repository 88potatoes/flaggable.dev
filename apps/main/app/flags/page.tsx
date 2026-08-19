"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Flag, Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@flaggable/ui/badge";
import { Button } from "@flaggable/ui/button";
import { Input } from "@flaggable/ui/input";
import { Switch } from "@flaggable/ui/switch";
import { DashboardShell } from "@/components/dashboard-sidebar";
import {
  useMutateArchiveFlag,
  useMutateCreateFlag,
  useMutateUpdateFlag,
  useQueryFlags,
} from "@/slices/flags/queries";
import {
  useMutateCreateCondition,
  useMutateUpdateCondition,
  useQueryConditions,
} from "@/slices/conditions/queries";
import {
  useMutateCreateSchema,
  useMutateUpdateSchema,
  useQuerySchemas,
} from "@/slices/value-schemas/queries";
import { useQueryProjects } from "@/slices/projects/queries";
export default function FlagsPage() {
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFlagId, setSelectedFlagId] = useState("");
  const [isCreateFlagOpen, setIsCreateFlagOpen] = useState(false);
  const [isCreateSchemaOpen, setIsCreateSchemaOpen] = useState(false);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagName, setNewFlagName] = useState("");
  const [newFlagSchemaId, setNewFlagSchemaId] = useState("");
  const [newSchemaName, setNewSchemaName] = useState("");
  const [editingSchemaId, setEditingSchemaId] = useState("");
  const [editingSchemaName, setEditingSchemaName] = useState("");
  const [conditionProperty, setConditionProperty] = useState("");
  const [conditionValue, setConditionValue] = useState("");
  const [conditionResult, setConditionResult] = useState("");
  const [message, setMessage] = useState("");

  const projectsQuery = useQueryProjects();
  const projects = projectsQuery.data ?? [];
  const flagsQuery = useQueryFlags(projectId);
  const schemasQuery = useQuerySchemas(projectId);
  const flags = flagsQuery.data ?? [];
  const schemas = schemasQuery.data ?? [];
  const selectedFlag = flags.find((flag) => flag.id === selectedFlagId) ?? flags[0];
  const conditionsQuery = useQueryConditions(selectedFlag?.id ?? "");
  const conditions = conditionsQuery.data ?? [];
  const createFlag = useMutateCreateFlag(projectId);
  const updateFlag = useMutateUpdateFlag(projectId);
  const archiveFlag = useMutateArchiveFlag(projectId);
  const createSchema = useMutateCreateSchema(projectId);
  const updateSchema = useMutateUpdateSchema(projectId);
  const createCondition = useMutateCreateCondition(selectedFlag?.id ?? "");
  const updateCondition = useMutateUpdateCondition(selectedFlag?.id ?? "");

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
  }, [projectId, projects]);

  useEffect(() => {
    if (flags.length && !flags.some((flag) => flag.id === selectedFlagId)) {
      setSelectedFlagId(flags[0].id);
    }
  }, [flags, selectedFlagId]);

  useEffect(() => {
    if (!newFlagSchemaId && schemas[0]) setNewFlagSchemaId(schemas[0].id);
  }, [newFlagSchemaId, schemas]);

  const visibleFlags = useMemo(
    () =>
      flags.filter((flag) =>
        `${flag.key} ${flag.name} ${flag.description ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [flags, query],
  );

  function selectProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setSelectedFlagId("");
    setMessage("");
  }

  function submitCreateFlag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const schema = schemas.find((item) => item.id === newFlagSchemaId) ?? schemas[0];
    if (!schema) {
      setMessage("Create a value schema before creating a flag.");
      return;
    }
    createFlag.mutate(
      {
        valueSchemaId: schema.id,
        key: newFlagKey.trim(),
        name: newFlagName.trim() || newFlagKey.trim(),
        fallbackValue: fallbackForSchema(schema.schemaJson),
      },
      {
        onSuccess: (flag) => {
          setSelectedFlagId(flag.id);
          setNewFlagKey("");
          setNewFlagName("");
          setIsCreateFlagOpen(false);
          setMessage(`${flag.key} was created.`);
        },
        onError: (error) => setMessage(error.message),
      },
    );
  }

  function submitCreateSchema(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createSchema.mutate(
      { name: newSchemaName.trim(), schemaJson: { type: "string" } },
      {
        onSuccess: (schema) => {
          setNewSchemaName("");
          setNewFlagSchemaId(schema.id);
          setIsCreateSchemaOpen(false);
          setMessage(`${schema.name} was created.`);
        },
        onError: (error) => setMessage(error.message),
      },
    );
  }

  function submitSchemaRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSchema.mutate(
      { schemaId: editingSchemaId, values: { name: editingSchemaName.trim() } },
      {
        onSuccess: () => {
          setEditingSchemaId("");
          setMessage("Schema renamed.");
        },
        onError: (error) => setMessage(error.message),
      },
    );
  }

  function submitCondition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFlag) return;
    createCondition.mutate(
      {
        position: conditions.length + 1,
        property: conditionProperty.trim(),
        operator: "equals",
        predicateValue: conditionValue,
        resultValue: conditionResult || selectedFlag.fallbackValue,
      },
      {
        onSuccess: () => {
          setConditionProperty("");
          setConditionValue("");
          setConditionResult("");
          setMessage("Targeting rule added.");
        },
        onError: (error) => setMessage(error.message),
      },
    );
  }

  if (projectsQuery.isLoading) {
    return (
      <DashboardShell
        projects={projects}
        projectId={projectId}
        flagCount={0}
        onProjectChange={selectProject}
      >
        <div className="project-empty-state">
          <p>Loading projects…</p>
        </div>
      </DashboardShell>
    );
  }

  if (!projects.length) {
    return (
      <DashboardShell
        projects={projects}
        projectId={projectId}
        flagCount={0}
        onProjectChange={selectProject}
      >
        <div className="project-empty-state">
          <div className="project-empty-icon">
            <Flag />
          </div>
          <h1>Create your first project</h1>
          <p>Projects keep your feature flags organized. Create one to get started.</p>
          <Button
            type="button"
            className="button-primary"
            onClick={() => window.location.assign("/")}
          >
            Create project
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      projects={projects}
      projectId={projectId}
      flagCount={flags.length}
      onProjectChange={selectProject}
    >
      <div className="dashboard-inner flags-page">
        <div className="dashboard-title-row">
          <div>
            <h1>Feature flags</h1>
            <p className="dashboard-subtitle">Manage flags, schemas, and targeting rules.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateSchemaOpen(true)}>
              New schema
            </Button>
            <Button
              type="button"
              className="button-primary"
              onClick={() => setIsCreateFlagOpen(true)}
            >
              <Plus /> New flag
            </Button>
          </div>
        </div>

        {message && (
          <div className="dashboard-alert is-success" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}

        <section className="flags-panel flags-page-panel">
          <div className="panel-heading">
            <div>
              <h2>All flags</h2>
              <p>{flags.length} flags in this project.</p>
            </div>
            <ArrowUpRight className="page-icon" aria-hidden="true" />
          </div>
          <div className="flag-toolbar">
            <label className="search-field">
              <Search />
              <Input
                aria-label="Search flags"
                placeholder="Search flags"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>
          <div className="flags-table">
            <div className="flag-row table-heading">
              <span>Flag</span>
              <span>Status</span>
              <span>Updated</span>
              <span />
            </div>
            {flagsQuery.isLoading ? (
              <div className="table-empty">Loading flags…</div>
            ) : visibleFlags.length === 0 ? (
              <div className="table-empty">No flags match your search.</div>
            ) : (
              visibleFlags.map((flag) => (
                <button
                  type="button"
                  className={`flag-row ${selectedFlag?.id === flag.id ? "selected" : ""}`}
                  key={flag.id}
                  onClick={() => setSelectedFlagId(flag.id)}
                >
                  <span className="flag-name">
                    <i className={`status-dot ${flag.enabled ? "green" : "purple"}`} />
                    <span>
                      <b>{flag.key}</b>
                      <small>{flag.description ?? flag.name}</small>
                    </span>
                  </span>
                  <span>
                    <Badge
                      variant={flag.enabled ? "default" : "secondary"}
                      className={`rollout-pill ${flag.enabled ? "on" : "off"}`}
                    >
                      <i />
                      {flag.enabled ? "Enabled" : "Off"}
                    </Badge>
                  </span>
                  <span className="updated">{formatUpdated(flag.updatedAt)}</span>
                  <span className="row-arrow">
                    <ArrowUpRight />
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="dashboard-grid mt-6">
          <section className="change-inspector m-0">
            <div className="inspector-label">VALUE SCHEMAS</div>
            {schemasQuery.isLoading ? (
              <p>Loading schemas…</p>
            ) : schemas.length === 0 ? (
              <p>Create a schema to define valid flag values.</p>
            ) : (
              schemas.map((schema) =>
                editingSchemaId === schema.id ? (
                  <form className="flex gap-2" key={schema.id} onSubmit={submitSchemaRename}>
                    <Input
                      value={editingSchemaName}
                      onChange={(event) => setEditingSchemaName(event.target.value)}
                      required
                    />
                    <Button type="submit" disabled={updateSchema.isPending}>
                      Save
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3 py-2" key={schema.id}>
                    <span>
                      <b>{schema.name}</b>
                      <small className="ml-2 text-muted-foreground">
                        {String(schema.schemaJson.type ?? "JSON")}
                      </small>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSchemaId(schema.id);
                        setEditingSchemaName(schema.name);
                      }}
                    >
                      Rename
                    </Button>
                  </div>
                ),
              )
            )}
          </section>

          {selectedFlag && (
            <section className="change-inspector m-0">
              <div className="inspector-label">{selectedFlag.key.toUpperCase()}</div>
              <div className="inspector-content">
                <div>
                  <h2>{selectedFlag.name}</h2>
                  <p>{selectedFlag.description ?? "No description yet."}</p>
                </div>
                <Switch
                  checked={selectedFlag.enabled}
                  onCheckedChange={(enabled) =>
                    updateFlag.mutate({ flagId: selectedFlag.id, values: { enabled } })
                  }
                  disabled={updateFlag.isPending}
                  aria-label={`Toggle ${selectedFlag.key}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="button-quiet"
                  onClick={() =>
                    archiveFlag.mutate(
                      { flagId: selectedFlag.id },
                      {
                        onSuccess: () => setMessage("Flag archived."),
                        onError: (error) => setMessage(error.message),
                      },
                    )
                  }
                >
                  <Trash2 /> Archive
                </Button>
              </div>
              <div className="mt-4">
                <p className="inspector-label">TARGETING RULES</p>
                {conditions.map((condition) => (
                  <div
                    className="flex items-center justify-between border-b py-2"
                    key={condition.id}
                  >
                    <span>
                      {condition.property} {condition.operator} {String(condition.predicateValue)}
                    </span>
                    <Switch
                      checked={condition.enabled}
                      onCheckedChange={(enabled) =>
                        updateCondition.mutate({ conditionId: condition.id, values: { enabled } })
                      }
                    />
                  </div>
                ))}
                <form className="mt-4 grid gap-2" onSubmit={submitCondition}>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Property (e.g. country)"
                      value={conditionProperty}
                      onChange={(event) => setConditionProperty(event.target.value)}
                      required
                    />
                    <Input
                      placeholder="Equals (e.g. US)"
                      value={conditionValue}
                      onChange={(event) => setConditionValue(event.target.value)}
                      required
                    />
                  </div>
                  <Input
                    placeholder="Result value (optional)"
                    value={conditionResult}
                    onChange={(event) => setConditionResult(event.target.value)}
                  />
                  <Button type="submit" variant="outline" disabled={createCondition.isPending}>
                    Add targeting rule
                  </Button>
                </form>
              </div>
            </section>
          )}
        </section>

        {isCreateFlagOpen && (
          <div
            className="dialog-backdrop"
            role="presentation"
            onMouseDown={() => setIsCreateFlagOpen(false)}
          >
            <form
              className="create-panel"
              onSubmit={submitCreateFlag}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="create-panel-heading">
                <div>
                  <h2>Create a flag</h2>
                  <p>Choose the schema that validates its fallback value.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateFlagOpen(false)}
                  aria-label="Close"
                >
                  ×
                </Button>
              </div>
              <label>
                Flag key
                <Input
                  required
                  pattern="[a-z0-9_-]+"
                  value={newFlagKey}
                  onChange={(event) => setNewFlagKey(event.target.value)}
                  placeholder="checkout-redesign"
                />
              </label>
              <label>
                Display name
                <Input
                  value={newFlagName}
                  onChange={(event) => setNewFlagName(event.target.value)}
                  placeholder="Checkout redesign"
                />
              </label>
              <label>
                Value schema
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={newFlagSchemaId}
                  onChange={(event) => setNewFlagSchemaId(event.target.value)}
                  required
                >
                  {schemas.map((schema) => (
                    <option key={schema.id} value={schema.id}>
                      {schema.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                className="button-primary"
                type="submit"
                disabled={createFlag.isPending || !schemas.length}
              >
                {createFlag.isPending ? "Creating…" : "Create flag"}
              </Button>
            </form>
          </div>
        )}
        {isCreateSchemaOpen && (
          <div
            className="dialog-backdrop"
            role="presentation"
            onMouseDown={() => setIsCreateSchemaOpen(false)}
          >
            <form
              className="create-panel"
              onSubmit={submitCreateSchema}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="create-panel-heading">
                <div>
                  <h2>Create a schema</h2>
                  <p>New schemas start as strings.</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCreateSchemaOpen(false)}
                  aria-label="Close"
                >
                  ×
                </Button>
              </div>
              <label>
                Schema name
                <Input
                  value={newSchemaName}
                  onChange={(event) => setNewSchemaName(event.target.value)}
                  placeholder="Text values"
                  required
                />
              </label>
              <Button className="button-primary" type="submit" disabled={createSchema.isPending}>
                {createSchema.isPending ? "Creating…" : "Create schema"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function fallbackForSchema(schema: Record<string, unknown>) {
  if (schema.type === "number") return 0;
  if (schema.type === "boolean") return false;
  return "";
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - date.valueOf()) / 60000));
  return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
}
