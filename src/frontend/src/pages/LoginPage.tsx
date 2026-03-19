import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Shield, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRequestApproval, useSaveProfile } from "../hooks/useQueries";

interface LoginPageProps {
  showRegister: boolean;
}

export default function LoginPage({ showRegister }: LoginPageProps) {
  const { login, loginStatus, identity } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  const saveProfile = useSaveProfile();
  const requestApproval = useRequestApproval();

  const [form, setForm] = useState({
    name: "",
    nip: "",
    unitKerja: "",
    wilayah: "",
    role: "penyuluh_kb",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.nip || !form.unitKerja || !form.wilayah) {
      toast.error("Mohon lengkapi semua field yang diperlukan");
      return;
    }
    setIsSubmitting(true);
    try {
      await saveProfile.mutateAsync(form);
      await requestApproval.mutateAsync();
      toast.success("Pendaftaran berhasil! Menunggu persetujuan Admin.");
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show register form if logged in but no profile
  if (identity && showRegister) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-6">
            <img
              src="/assets/uploads/logo-bkkbn-1.jpg"
              alt="BKKBN"
              className="h-16 mx-auto object-contain mb-4"
            />
          </div>
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-primary">
                <UserPlus size={20} />
                Lengkapi Profil
              </CardTitle>
              <CardDescription>
                Isi data di bawah untuk mendaftarkan akun Anda. Akun akan aktif
                setelah disetujui oleh Admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <Input
                    id="name"
                    data-ocid="register.name.input"
                    placeholder="Masukkan nama lengkap"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nip">NIP *</Label>
                  <Input
                    id="nip"
                    data-ocid="register.nip.input"
                    placeholder="Nomor Induk Pegawai"
                    value={form.nip}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, nip: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unitKerja">Unit Kerja *</Label>
                  <Input
                    id="unitKerja"
                    data-ocid="register.unitKerja.input"
                    placeholder="Contoh: BKKBN Provinsi Jawa Barat"
                    value={form.unitKerja}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, unitKerja: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wilayah">Wilayah Kerja *</Label>
                  <Input
                    id="wilayah"
                    data-ocid="register.wilayah.input"
                    placeholder="Contoh: Kec. Bandung Barat"
                    value={form.wilayah}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, wilayah: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">Peran *</Label>
                  <Select
                    value={form.role}
                    onValueChange={(val) =>
                      setForm((p) => ({ ...p, role: val }))
                    }
                  >
                    <SelectTrigger id="role" data-ocid="register.role.select">
                      <SelectValue placeholder="Pilih peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="penyuluh_kb">Penyuluh KB</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  data-ocid="register.submit_button"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    "Daftar & Minta Persetujuan"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-screen bg-sidebar flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
        <img
          src="/assets/uploads/logo-bkkbn-1.jpg"
          alt="BKKBN"
          className="h-14 w-auto object-contain brightness-0 invert self-start"
        />
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-white leading-tight">
            Sistem Laporan
            <br />
            <span className="text-sidebar-primary">Rencana Kerja Harian</span>
          </h1>
          <p className="text-white/70 mt-4 text-base leading-relaxed">
            Dashboard digital untuk Penyuluh KB dalam mencatat dan mengelola
            laporan rencana kerja harian sesuai Permen No. 10.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Pencatatan laporan digital yang mudah",
              "Manajemen pengguna berbasis persetujuan",
              "Unduh laporan dalam format PDF",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                <span className="text-white/80 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </motion.div>
        <p className="text-white/40 text-xs">
          &copy; {new Date().getFullYear()} BKKBN Kemendukbangga
        </p>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 bg-background flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-8 text-center">
            <img
              src="/assets/uploads/logo-bkkbn-1.jpg"
              alt="BKKBN"
              className="h-12 mx-auto object-contain mb-3"
            />
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Selamat Datang
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Masuk untuk mengakses sistem laporan rencana kerja harian
            </p>
          </div>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield size={28} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">
                    Masuk dengan Internet Identity
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Autentikasi aman menggunakan Internet Identity
                  </p>
                </div>
                <Button
                  data-ocid="login.primary_button"
                  className="w-full"
                  onClick={login}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang Masuk...
                    </>
                  ) : (
                    "Masuk / Login"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Belum memiliki akun? Masuk terlebih dahulu lalu lengkapi profil
            Anda.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
