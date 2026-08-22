"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Plus } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@flaggable/ui/table";
import { useMutateCreatePublicKey, useQueryPublicKeys } from "@/slices/public-keys/queries";

export function PublicKeysPanel({ projectId }: { projectId: string }) {
  const query = useQueryPublicKeys(projectId);

  const create = useMutateCreatePublicKey(projectId);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createKey = () =>
    create.mutate(undefined, {
      onSuccess: (created) => {
        setRawKey(created.publicKey);
        setCopied(false);
        create.reset();
      },
    });
  const copyKey = async () => {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" /> Public keys
          </CardTitle>
          <CardDescription>
            Use a key to evaluate this project from your frontend SDK.
          </CardDescription>
        </div>
        <Button variant="accent" onClick={createKey} disabled={create.isPending}>
          <Plus /> {create.isPending ? "Creating…" : "Create key"}
        </Button>
      </CardHeader>
      <CardContent>
        {!query.isLoading && !query.data?.length ? (
          <p className="py-6 text-sm text-muted-foreground">No public keys yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-mono text-xs">pk_••••••••</TableCell>
                  <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={key.revokedAt ? "destructive" : "secondary"}>
                      {key.revokedAt ? "Revoked" : "Active"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <Dialog
        open={Boolean(rawKey)}
        onOpenChange={(open: boolean) => {
          if (!open) setRawKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save your public key</DialogTitle>
            <DialogDescription>
              This key is shown once. Copy it now; it cannot be recovered after closing.
            </DialogDescription>
          </DialogHeader>
          <code className="block break-all rounded-md border bg-muted p-3 text-sm">{rawKey}</code>
          <DialogFooter>
            <Button variant="accent" onClick={copyKey}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
