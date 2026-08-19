"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Flag, Plus, Search, Trash2 } from "lucide-react";

import { Alert } from "@flaggable/ui/alert";
import { Button } from "@flaggable/ui/button";
import { Card } from "@flaggable/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flaggable/ui/dialog";
import { Input } from "@flaggable/ui/input";
import { Skeleton } from "@flaggable/ui/skeleton";
import { Label } from "@flaggable/ui/label";
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
import { toast } from "sonner";
export default function FlagsPage() {
  const [projectId, setProjectId] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFlagId, setSelectedFlagId] = useState("");
  const [isCreateFlagOpen, setIsCreateFlagOpen] = useState(false);
  const [isCreateSchemaOpen, setIsCreateSchemaOpen] = useState(false);
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
        `${flag.name} ${flag.description ?? ""}`.toLowerCase().includes(query.toLowerCase()),
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
        name: newFlagName.trim(),
        fallbackValue: fallbackForSchema(schema.schemaJson),
      },
      {
        onSuccess: (flag) => {
          setSelectedFlagId(flag.id);
          setNewFlagName("");
          setIsCreateFlagOpen(false);
          const message = `${flag.name} was created.`;
          setMessage(message);
          toast.success("Flag created", { description: message });
        },
        onError: (error) => {
          setMessage(error.message);
          toast.error("Could not create flag", { description: error.message });
        },
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
          const message = `${schema.name} was created.`;
          setMessage(message);
          toast.success("Schema created", { description: message });
        },
        onError: (error) => {
          setMessage(error.message);
          toast.error("Could not create schema", { description: error.message });
        },
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
          toast.success("Schema renamed");
        },
        onError: (error) => {
          setMessage(error.message);
          toast.error("Could not rename schema", { description: error.message });
        },
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
          toast.success("Targeting rule added");
        },
        onError: (error) => {
          setMessage(error.message);
          toast.error("Could not add targeting rule", { description: error.message });
        },
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
        <Card className="project-empty-state" aria-busy="true">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </Card>
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
        <Card className="project-empty-state">
          <div className="project-empty-icon">
            <Flag />
          </div>
          <h1>Create your first project</h1>
          <p>Projects keep your feature flags organized. Create one to get started.</p>
          <Button type="button" variant="primary" onClick={() => window.location.assign("/")}>
            Create project
          </Button>
        </Card>
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
            <Button type="button" variant="primary" onClick={() => setIsCreateFlagOpen(true)}>
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

        <Card className="flags-panel flags-page-panel gap-0 p-0">
          <div className="panel-heading">
            <div>
              <h2>All flags</h2>
              <p>{flags.length} flags in this project.</p>
            </div>
            <ArrowUpRight className="page-icon" aria-hidden="true" />
          </div>
          <div className="flag-toolbar">
            <div className="search-field">
              <Search aria-hidden="true" />
              <Label htmlFor="flags-page-search" className="sr-only">
                Search flags
              </Label>
              <Input
                id="flags-page-search"
                placeholder="Search flags"
                value={query}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setQuery(event.target.value)
                }
              />
            </div>
          </div>
          <FlagTable
            flags={visibleFlags}
            selectedFlagId={selectedFlag?.id}
            onSelect={setSelectedFlagId}
            isLoading={flagsQuery.isLoading}
            emptyMessage="No flags match your search."
          />
        </Card>

        <section className="dashboard-grid mt-6">
          <Card className="change-inspector m-0">
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
          </Card>

          {selectedFlag && (
            <Card className="change-inspector m-0">
              <div className="inspector-label">{selectedFlag.name.toUpperCase()}</div>
              <div className="inspector-content">
                <div>
                  <h2>{selectedFlag.name}</h2>
                  <p>{selectedFlag.description ?? "No description yet."}</p>
                </div>
                <Switch
                  checked={selectedFlag.enabled}
                  onCheckedChange={(enabled: boolean) =>
                    updateFlag.mutate(
                      { flagId: selectedFlag.id, values: { enabled } },
                      {
                        onSuccess: () =>
                          toast.success("Flag updated", {
                            description: `${selectedFlag.name} is now ${enabled ? "on" : "off"}.`,
                          }),
                        onError: (error) =>
                          toast.error("Could not update flag", { description: error.message }),
                      },
                    )
                  }
                  disabled={updateFlag.isPending}
                  aria-label={`Toggle ${selectedFlag.name}`}
                />
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() =>
                    archiveFlag.mutate(
                      { flagId: selectedFlag.id },
                      {
                        onSuccess: () => {
                          setMessage("Flag archived.");
                          toast.success("Flag archived");
                        },
                        onError: (error) => {
                          setMessage(error.message);
                          toast.error("Could not archive flag", { description: error.message });
                        },
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
            </Card>
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
              <div className="grid gap-2">
                <Label htmlFor="flags-new-flag-name">Flag name</Label>
                <Input
                  id="flags-new-flag-name"
                  required
                  value={newFlagName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setNewFlagName(event.target.value)
                  }
                  placeholder="Checkout redesign"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flags-value-schema">Value schema</Label>
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
              </div>
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
              <div className="grid gap-2">
                <Label htmlFor="new-schema-name">Schema name</Label>
                <Input
                  id="new-schema-name"
                  value={newSchemaName}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setNewSchemaName(event.target.value)
                  }
                  placeholder="Text values"
                  required
                />
              </div>
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
