"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Flag, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@flaggable/ui/button";
import { Alert } from "@flaggable/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flaggable/ui/dialog";
import { Input } from "@flaggable/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flaggable/ui/select";
import { Switch } from "@flaggable/ui/switch";
import { DashboardShell } from "@/components/dashboard-sidebar";
import { FlagTable } from "@/components/flag-table";
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
          <Alert variant="success" className="mb-6 flex items-center justify-between">
            <span>{message}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </Button>
          </Alert>
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
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setQuery(event.target.value)
                }
              />
            </label>
          </div>
          <FlagTable
            flags={visibleFlags}
            selectedFlagId={selectedFlag?.id}
            onSelect={setSelectedFlagId}
            isLoading={flagsQuery.isLoading}
            emptyMessage="No flags match your search."
          />
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
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setEditingSchemaName(event.target.value)
                      }
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
                  onCheckedChange={(enabled: boolean) =>
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
                      onCheckedChange={(enabled: boolean) =>
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
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setConditionProperty(event.target.value)
                      }
                      required
                    />
                    <Input
                      placeholder="Equals (e.g. US)"
                      value={conditionValue}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        setConditionValue(event.target.value)
                      }
                      required
                    />
                  </div>
                  <Input
                    placeholder="Result value (optional)"
                    value={conditionResult}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setConditionResult(event.target.value)
                    }
                  />
                  <Button type="submit" variant="outline" disabled={createCondition.isPending}>
                    Add targeting rule
                  </Button>
                </form>
              </div>
            </section>
          )}
        </section>

        <Dialog open={isCreateFlagOpen} onOpenChange={setIsCreateFlagOpen}>
          <DialogContent className="create-panel">
            <DialogHeader>
              <DialogTitle>Create a flag</DialogTitle>
              <DialogDescription>
                Choose the schema that validates its fallback value.
              </DialogDescription>
            </DialogHeader>
            <form className="grid gap-4" onSubmit={submitCreateFlag}>
              <label>
                Flag key
                <Input
                  required
                  pattern="[a-z0-9_-]+"
                  value={newFlagKey}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setNewFlagKey(event.target.value)
                  }
                  placeholder="checkout-redesign"
                />
              </label>
              <label>
                Display name
                <Input
                  value={newFlagName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setNewFlagName(event.target.value)
                  }
                  placeholder="Checkout redesign"
                />
              </label>
              <label>
                Value schema
                <Select value={newFlagSchemaId} onValueChange={setNewFlagSchemaId} required>
                  <SelectTrigger aria-label="Value schema" className="w-full">
                    <SelectValue placeholder="Choose a schema" />
                  </SelectTrigger>
                  <SelectContent>
                    {schemas.map((schema) => (
                      <SelectItem key={schema.id} value={schema.id}>
                        {schema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <DialogFooter>
                <Button type="submit" disabled={createFlag.isPending || !schemas.length}>
                  {createFlag.isPending ? "Creating…" : "Create flag"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isCreateSchemaOpen} onOpenChange={setIsCreateSchemaOpen}>
          <DialogContent className="create-panel">
            <DialogHeader>
              <DialogTitle>Create a schema</DialogTitle>
              <DialogDescription>New schemas start as strings.</DialogDescription>
            </DialogHeader>
            <form className="grid gap-4" onSubmit={submitCreateSchema}>
              <label>
                Schema name
                <Input
                  value={newSchemaName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setNewSchemaName(event.target.value)
                  }
                  placeholder="Text values"
                  required
                />
              </label>
              <DialogFooter>
                <Button type="submit" disabled={createSchema.isPending}>
                  {createSchema.isPending ? "Creating…" : "Create schema"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}

function fallbackForSchema(schema: Record<string, unknown>) {
  if (schema.type === "number") return 0;
  if (schema.type === "boolean") return false;
  return "";
}
