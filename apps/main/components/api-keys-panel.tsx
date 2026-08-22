"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Lock, Plus, ShieldCheck } from "lucide-react";
import { Alert } from "@flaggable/ui/alert";
import { Badge } from "@flaggable/ui/badge";
import { Button } from "@flaggable/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@flaggable/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flaggable/ui/dialog";
import { Input } from "@flaggable/ui/input";
import { Label } from "@flaggable/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@flaggable/ui/table";
import { useMutateCreateInternalKey, useQueryInternalKeys } from "@/slices/internal-keys/queries";
import { useMutateCreatePublicKey, useQueryPublicKeys } from "@/slices/public-keys/queries";

export function ApiKeysPanel({ projectId }: { projectId: string }) {
  const publicKeysQuery = useQueryPublicKeys(projectId);
  const createPublicKey = useMutateCreatePublicKey(projectId);

  const internalKeysQuery = useQueryInternalKeys(projectId);
  const createInternalKey = useMutateCreateInternalKey(projectId);

  const [rawSecretKey, setRawSecretKey] = useState<{
    key: string;
    type: "public" | "internal";
    name?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedInternalKeyId, setCopiedInternalKeyId] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [isInternalNameDialogOpen, setIsInternalNameDialogOpen] = useState(false);

  const handleCreatePublicKey = () => {
    createPublicKey.mutate(undefined, {
      onSuccess: (created) => {
        setRawSecretKey({ key: created.publicKey, type: "public" });
        setCopied(false);
      },
    });
  };

  const handleCreateInternalKey = () => {
    const name = newKeyName.trim() || "Internal API Key";
    createInternalKey.mutate(
      { name },
      {
        onSuccess: (created) => {
          setIsInternalNameDialogOpen(false);
          setNewKeyName("");
          setRawSecretKey({ key: created.internalKey, type: "internal", name: created.name });
          setCopied(false);
        },
      },
    );
  };

  const handleCopySecretKey = async () => {
    if (!rawSecretKey?.key) return;
    await navigator.clipboard.writeText(rawSecretKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyInternalKey = async (keyId: string, key?: string) => {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopiedInternalKeyId(keyId);
    setTimeout(() => setCopiedInternalKeyId(null), 2500);
  };

  return (
    <div className="api-keys-panel space-y-6">
      {/* Internal API Keys */}
      <Card>
        <CardHeader className="api-key-header flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4 text-orange-600" /> Internal API Keys
            </CardTitle>
            <CardDescription>
              Scoped project credentials for the CLI (
              <code className="font-mono text-xs">flaggable typegen</code>), devtools, and CI/CD
              scripts.
            </CardDescription>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setIsInternalNameDialogOpen(true)}
            disabled={createInternalKey.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="mr-1 size-3.5" />
            {createInternalKey.isPending ? "Creating…" : "Create internal key"}
          </Button>
        </CardHeader>
        <CardContent>
          {internalKeysQuery.error && (
            <Alert variant="destructive" className="mb-4">
              {internalKeysQuery.error.message}
            </Alert>
          )}
          {!internalKeysQuery.isLoading && !internalKeysQuery.data?.length ? (
            <p className="py-6 text-sm text-muted-foreground">
              No internal API keys generated yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Copy key</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalKeysQuery.data?.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium text-sm">{key.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        ik_••••••••••••••••
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.revokedAt ? "destructive" : "secondary"}>
                          {key.revokedAt ? "Revoked" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Copy ${key.name}`}
                          title={
                            key.internalKey
                              ? `Copy ${key.name}`
                              : "Key unavailable; create a new key"
                          }
                          disabled={!key.internalKey || Boolean(key.revokedAt)}
                          onClick={() => handleCopyInternalKey(key.id, key.internalKey)}
                        >
                          {copiedInternalKeyId === key.id ? <Check /> : <Copy />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public SDK Keys */}
      <Card>
        <CardHeader className="api-key-header flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" /> Public SDK Keys
            </CardTitle>
            <CardDescription>
              Public credentials safely embedded in client applications (
              <code className="font-mono text-xs">NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY</code>) to
              evaluate flags.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreatePublicKey}
            disabled={createPublicKey.isPending}
          >
            <Plus className="mr-1 size-3.5" />
            {createPublicKey.isPending ? "Creating…" : "Create public key"}
          </Button>
        </CardHeader>
        <CardContent>
          {publicKeysQuery.error && (
            <Alert variant="destructive" className="mb-4">
              {publicKeysQuery.error.message}
            </Alert>
          )}
          {!publicKeysQuery.isLoading && !publicKeysQuery.data?.length ? (
            <p className="py-6 text-sm text-muted-foreground">No public keys yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key Prefix</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicKeysQuery.data?.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        pk_••••••••••••••••
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(key.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={key.revokedAt ? "destructive" : "secondary"}>
                          {key.revokedAt ? "Revoked" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog to Name Internal Key */}
      <Dialog open={isInternalNameDialogOpen} onOpenChange={setIsInternalNameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Internal API Key</DialogTitle>
            <DialogDescription>
              Internal keys are used by developers and CLI scripts. Give it a descriptive name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="internal-key-name">Key Name / Description</Label>
            <Input
              id="internal-key-name"
              placeholder="e.g., Local Dev Typegen, CI/CD Pipeline"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInternalNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleCreateInternalKey}
              disabled={createInternalKey.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {createInternalKey.isPending ? "Creating..." : "Generate Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog to Display Newly Created Key Once */}
      <Dialog
        open={Boolean(rawSecretKey)}
        onOpenChange={(open: boolean) => {
          if (!open) setRawSecretKey(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mb-2">
              <KeyRound className="size-5" />
            </div>
            <DialogTitle>
              Save your {rawSecretKey?.type === "internal" ? "Internal API Key" : "Public SDK Key"}
            </DialogTitle>
            <DialogDescription>
              {rawSecretKey?.type === "internal"
                ? "This secret key is only shown once. Set FLAGGABLE_INTERNAL_API_KEY in your .env.local file."
                : "Copy this key to your .env.local file as NEXT_PUBLIC_FLAGGABLE_PUBLIC_KEY."}
            </DialogDescription>
          </DialogHeader>

          <code className="block break-all rounded-md border bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
            {rawSecretKey?.key}
          </code>

          <DialogFooter>
            <Button
              variant="accent"
              onClick={handleCopySecretKey}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
              {copied ? "Copied to Clipboard!" : "Copy Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
