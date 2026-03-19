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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  CheckCircle,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageContent, SectionHeader } from "../../components/AppLayout";
import {
  useAdminDeleteUser,
  useAdminEditUserProfile,
  useAdminRestoreUser,
  useAdminUsersWithApproval,
  useListDeletedUsers,
  useSetApproval,
} from "../../hooks/useQueries";

type ActionTarget = {
  principal: Principal;
  name: string;
  action: "approve" | "reject";
} | null;

type EditTarget = {
  principal: Principal;
  name: string;
  nip: string;
  unitKerja: string;
  wilayah: string;
  role: string;
} | null;

type DeleteTarget = {
  principal: Principal;
  name: string;
} | null;

type RestoreTarget = {
  principal: Principal;
  name: string;
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
  const { data: deletedUsers, isLoading: deletedLoading } =
    useListDeletedUsers();
  const setApproval = useSetApproval();
  const editUserProfile = useAdminEditUserProfile();
  const deleteUser = useAdminDeleteUser();
  const restoreUser = useAdminRestoreUser();

  const [actionTarget, setActionTarget] = useState<ActionTarget>(null);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    nip: "",
    unitKerja: "",
    wilayah: "",
    role: "penyuluh_kb",
  });

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

  const openEditDialog = (user: NonNullable<typeof users>[0]) => {
    setEditForm({
      name: user.profile?.name ?? "",
      nip: user.profile?.nip ?? "",
      unitKerja: user.profile?.unitKerja ?? "",
      wilayah: user.profile?.wilayah ?? "",
      role: (user.profile?.role as string) ?? "penyuluh_kb",
    });
    setEditTarget({
      principal: user.principal,
      name: user.profile?.name ?? "Pengguna",
      nip: user.profile?.nip ?? "",
      unitKerja: user.profile?.unitKerja ?? "",
      wilayah: user.profile?.wilayah ?? "",
      role: (user.profile?.role as string) ?? "penyuluh_kb",
    });
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    try {
      await editUserProfile.mutateAsync({
        user: editTarget.principal,
        profile: {
          name: editForm.name,
          nip: editForm.nip,
          unitKerja: editForm.unitKerja,
          wilayah: editForm.wilayah,
          role: editForm.role as any,
        },
      });
      toast.success(`Data pengguna ${editForm.name} berhasil diperbarui`);
      setEditTarget(null);
    } catch {
      toast.error("Gagal memperbarui data pengguna. Silakan coba lagi.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser.mutateAsync(deleteTarget.principal);
      toast.success(`Pengguna ${deleteTarget.name} berhasil dihapus`);
      setDeleteTarget(null);
    } catch {
      toast.error("Gagal menghapus pengguna. Silakan coba lagi.");
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;
    try {
      await restoreUser.mutateAsync(restoreTarget.principal);
      toast.success(`Akun ${restoreTarget.name} berhasil dipulihkan`);
      setRestoreTarget(null);
    } catch {
      toast.error("Gagal memulihkan akun. Silakan coba lagi.");
    }
  };

  const pendingCount = users?.filter((u) => u.status === "pending").length ?? 0;
  const hasDeletedUsers =
    deletedLoading || (deletedUsers && deletedUsers.length > 0);

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
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
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
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`users.edit_button.${idx + 1}`}
                        className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`users.delete_button.${idx + 1}`}
                        className="h-8 border-destructive/30 text-red-600 hover:bg-destructive/10"
                        onClick={() =>
                          setDeleteTarget({
                            principal: user.principal,
                            name: user.profile?.name ?? "Pengguna",
                          })
                        }
                      >
                        <Trash2 size={14} className="mr-1" />
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Deleted Users Section */}
      {hasDeletedUsers && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 size={18} className="text-destructive/70" />
            <h2 className="text-base font-semibold text-foreground">
              Akun Dihapus
            </h2>
            {deletedUsers && deletedUsers.length > 0 && (
              <Badge
                variant="destructive"
                className="bg-destructive/15 text-red-700 border-destructive/30 text-xs"
              >
                {deletedUsers.length} akun
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Akun pengguna yang telah dihapus. Anda dapat memulihkan akun agar
            dapat aktif kembali.
          </p>
          <div
            data-ocid="deleted_users.table"
            className="bg-card rounded-lg border border-destructive/20 shadow-xs overflow-hidden"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-destructive/5">
                  <TableHead className="font-semibold">Nama</TableHead>
                  <TableHead className="font-semibold">NIP</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">
                    Unit Kerja
                  </TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">
                    Wilayah
                  </TableHead>
                  <TableHead className="font-semibold">Peran</TableHead>
                  <TableHead className="font-semibold text-right">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !deletedUsers || deletedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                      data-ocid="deleted_users.empty_state"
                    >
                      <Trash2 size={28} className="mx-auto mb-2 opacity-25" />
                      <p className="text-sm">Tidak ada akun yang dihapus</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  deletedUsers.map((du, idx) => (
                    <TableRow
                      key={du.principal.toString()}
                      data-ocid={`deleted_users.item.${idx + 1}`}
                      className="hover:bg-destructive/5 opacity-80"
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {du.profile?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {du.profile?.nip ?? "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {du.profile?.unitKerja ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {du.profile?.wilayah ?? "—"}
                      </TableCell>
                      <TableCell>
                        <RoleBadge
                          role={(du.profile?.role as string) ?? "guest"}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`deleted_users.restore.button.${idx + 1}`}
                          className="h-8 border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() =>
                            setRestoreTarget({
                              principal: du.principal,
                              name: du.profile?.name ?? "Pengguna",
                            })
                          }
                        >
                          <RotateCcw size={14} className="mr-1" />
                          Pulihkan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Approve/Reject Dialog */}
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

      {/* Edit User Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent data-ocid="users.edit.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Pengguna</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Nama</Label>
              <Input
                id="edit-name"
                data-ocid="users.edit.name.input"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-nip">NIP</Label>
              <Input
                id="edit-nip"
                data-ocid="users.edit.nip.input"
                value={editForm.nip}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, nip: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-unitkerja">Unit Kerja</Label>
              <Input
                id="edit-unitkerja"
                data-ocid="users.edit.unitKerja.input"
                value={editForm.unitKerja}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    unitKerja: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-wilayah">Wilayah</Label>
              <Input
                id="edit-wilayah"
                data-ocid="users.edit.wilayah.input"
                value={editForm.wilayah}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, wilayah: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-role">Peran</Label>
              <Select
                value={editForm.role}
                onValueChange={(val) =>
                  setEditForm((prev) => ({ ...prev, role: val }))
                }
              >
                <SelectTrigger
                  id="edit-role"
                  data-ocid="users.edit.role.select"
                >
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="penyuluh_kb">Penyuluh KB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="users.edit.cancel_button"
              onClick={() => setEditTarget(null)}
            >
              Batal
            </Button>
            <Button
              data-ocid="users.edit.save_button"
              onClick={handleEditSubmit}
              disabled={editUserProfile.isPending}
            >
              {editUserProfile.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="users.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna{" "}
              <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="users.delete.cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="users.delete.confirm_button"
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore User AlertDialog */}
      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
      >
        <AlertDialogContent data-ocid="deleted_users.restore.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw size={18} className="text-green-600" />
              Pulihkan Akun
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin memulihkan akun{" "}
              <strong>{restoreTarget?.name}</strong>? Akun akan aktif kembali
              dan dapat login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="deleted_users.restore.cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="deleted_users.restore.confirm_button"
              onClick={handleRestoreConfirm}
              disabled={restoreUser.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {restoreUser.isPending ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                  Memulihkan...
                </>
              ) : (
                "Pulihkan"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContent>
  );
}
