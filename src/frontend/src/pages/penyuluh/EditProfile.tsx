import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import SignaturePad, {
  type SignaturePadHandle,
} from "../../components/SignaturePad";
import { useUpdateProfile } from "../../hooks/useQueries";

interface EditProfileProps {
  userProfile: {
    name: string;
    nip: string;
    unitKerja: string;
    wilayah: string;
    tandaTangan?: string;
  };
  onCancel: () => void;
}

export default function EditProfile({
  userProfile,
  onCancel,
}: EditProfileProps) {
  const [name, setName] = useState(userProfile.name);
  const [nip, setNip] = useState(userProfile.nip);
  const [unitKerja, setUnitKerja] = useState(userProfile.unitKerja);
  const [wilayah, setWilayah] = useState(userProfile.wilayah);
  const sigRef = useRef<SignaturePadHandle>(null);
  const { mutateAsync, isPending } = useUpdateProfile();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const newSig = sigRef.current?.isEmpty()
        ? undefined
        : sigRef.current?.getDataURL();
      await mutateAsync({
        name,
        nip,
        unitKerja,
        wilayah,
        tandaTangan: newSig ?? userProfile.tandaTangan,
      });
      toast.success("Profil berhasil diperbarui");
      onCancel();
    } catch {
      toast.error("Gagal memperbarui profil");
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Edit Profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perbarui informasi profil Anda
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input
            id="name"
            data-ocid="edit_profile.input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nip">NIP</Label>
          <Input
            id="nip"
            data-ocid="edit_profile.input"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitKerja">Unit Kerja</Label>
          <Input
            id="unitKerja"
            data-ocid="edit_profile.input"
            value={unitKerja}
            onChange={(e) => setUnitKerja(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wilayah">Wilayah Kerja</Label>
          <Input
            id="wilayah"
            data-ocid="edit_profile.input"
            value={wilayah}
            onChange={(e) => setWilayah(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tanda Tangan</Label>
          {userProfile.tandaTangan && sigRef.current?.isEmpty() !== false && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">
                Tanda tangan saat ini:
              </p>
              <img
                src={userProfile.tandaTangan}
                alt="Tanda Tangan Saat Ini"
                className="max-h-20 border border-input rounded-md p-1 bg-white"
              />
            </div>
          )}
          <SignaturePad ref={sigRef} />
          <p className="text-xs text-muted-foreground">
            Upload gambar tanda tangan baru (kosongkan jika tidak ingin
            mengubah)
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isPending}
            data-ocid="edit_profile.submit_button"
            className="gap-2"
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-ocid="edit_profile.cancel_button"
            className="gap-2"
          >
            <X size={16} />
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
