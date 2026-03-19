import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@dfinity/principal";
import { CheckCircle, Users, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageContent, SectionHeader } from "../../components/AppLayout";
import {
  useAdminUsersWithApproval,
  useSetApproval,
} from "../../hooks/useQueries";

type ActionTarget = {
  principal: Principal;
  name: string;
  action: "approve" | "reject";
} | null;

function StatusBadge({ status }: { status: string }) {
  if (status === "approved")
    return (
      <Badge className="bg-success/15 text-green-700 border-success/30 hover:bg-success/20">
        Disetujui
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge
        variant="destructive"
        className="bg-destructive/15 text-red-700 border-destructive/30"
      >
        Ditolak
      </Badge>
    );
  return (
    <Badge className="bg-warning/20 text-yellow-700 border-warning/30 hover:bg-warning/25">
      Menunggu
    </Badge>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin")
    return (
      <Badge variant="secondary" className="font-medium">
        Administrator
      </Badge>
    );
  return (
    <Badge variant="outline" className="font-medium">
      Penyuluh KB
    </Badge>
  );
}

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminUsersWithApproval();
  const setApproval = useSetApproval();
  const [actionTarget, setActionTarget] = useState<ActionTarget>(null);

  const handleConfirm = async () => {
    if (!actionTarget) return;
    try {
      await setApproval.mutateAsync({
        user: actionTarget.principal,
        status: actionTarget.action === "approve" ? "approved" : "rejected",
      });
      toast.success(
        actionTarget.action === "approve"
          ? `Pengguna ${actionTarget.name} telah disetujui`
          : `Pengguna ${actionTarget.name} telah ditolak`,
      );
    } catch {
      toast.error("Gagal memproses tindakan. Silakan coba lagi.");
    } finally {
      setActionTarget(null);
    }
  };

  const pendingCount = users?.filter((u) => u.status === "pending").length ?? 0;

  return (
    <PageContent>
      <SectionHeader
        title="Manajemen Pengguna"
        description="Kelola dan setujui akses pengguna ke sistem"
      />

      {pendingCount > 0 && (
        <div className="mb-4 p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
          <Users size={18} className="text-warning-foreground shrink-0" />
          <p className="text-sm font-medium text-warning-foreground">
            Terdapat <span className="font-bold">{pendingCount} pengguna</span>{" "}
            yang menunggu persetujuan Anda.
          </p>
        </div>
      )}

      <div
        data-ocid="users.table"
        className="bg-card rounded-lg border border-border shadow-xs overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">Nama</TableHead>
              <TableHead className="font-semibold">NIP</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">
                Unit Kerja
              </TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">
                Wilayah
              </TableHead>
              <TableHead className="font-semibold">Peran</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !users || users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="users.empty_state"
                >
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Belum ada pengguna terdaftar</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, idx) => (
                <TableRow
                  key={user.principal.toString()}
                  data-ocid={`users.item.${idx + 1}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="font-medium">
                    {user.profile?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {user.profile?.nip ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {user.profile?.unitKerja ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {user.profile?.wilayah ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RoleBadge
                      role={(user.profile?.role as string) ?? "guest"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.status !== "approved" && (
                        <Button
                          size="sm"
                          data-ocid={`users.approve.button.${idx + 1}`}
                          className="bg-success/15 text-green-700 hover:bg-success/25 border border-success/30 h-8"
                          variant="outline"
                          onClick={() =>
                            setActionTarget({
                              principal: user.principal,
                              name: user.profile?.name ?? "Pengguna",
                              action: "approve",
                            })
                          }
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Setujui
                        </Button>
                      )}
                      {user.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`users.reject.button.${idx + 1}`}
                          className="border-destructive/30 text-red-600 hover:bg-destructive/10 h-8"
                          onClick={() =>
                            setActionTarget({
                              principal: user.principal,
                              name: user.profile?.name ?? "Pengguna",
                              action: "reject",
                            })
                          }
                        >
                          <XCircle size={14} className="mr-1" />
                          Tolak
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!actionTarget}
        onOpenChange={(open) => !open && setActionTarget(null)}
      >
        <AlertDialogContent data-ocid="users.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget?.action === "approve"
                ? "Setujui Pengguna"
                : "Tolak Pengguna"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.action === "approve"
                ? `Apakah Anda yakin ingin menyetujui akses untuk ${actionTarget?.name}?`
                : `Apakah Anda yakin ingin menolak akses untuk ${actionTarget?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="users.cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="users.confirm_button"
              onClick={handleConfirm}
              className={
                actionTarget?.action === "reject"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {actionTarget?.action === "approve" ? "Setujui" : "Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContent>
  );
}
