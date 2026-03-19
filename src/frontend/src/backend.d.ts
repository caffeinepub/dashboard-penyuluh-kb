import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LaporanUpdate {
    status: ReportStatus;
    tanggal: string;
    sumberDana: string;
    waktuPelaksanaan: string;
    volume: string;
    metodeKegiatan: string;
    keterangan: string;
    lokasiKegiatan: string;
    indikatorKeberhasilan: string;
    lampiranIds: Array<string>;
    nomorLaporan: string;
    sasaran: string;
    namaKegiatan: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface LaporanRencanaKerja {
    status: ReportStatus;
    tanggal: string;
    sumberDana: string;
    waktuPelaksanaan: string;
    volume: string;
    author: Principal;
    metodeKegiatan: string;
    keterangan: string;
    lokasiKegiatan: string;
    indikatorKeberhasilan: string;
    lampiranIds: Array<string>;
    nomorLaporan: string;
    sasaran: string;
    namaKegiatan: string;
}
export interface AdminStats {
    submittedReports: bigint;
    totalReports: bigint;
    approvedUsers: bigint;
    totalUsers: bigint;
}
export interface UserProfile {
    nip: string;
    name: string;
    role: UserRole;
    wilayah: string;
    unitKerja: string;
}
export interface DeletedUser {
    principal: Principal;
    profile: UserProfile;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ReportStatus {
    submitted = "submitted",
    draft = "draft"
}
export enum UserRole {
    admin = "admin",
    guest = "guest",
    penyuluh_kb = "penyuluh_kb"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAttachmentToReport(nomorLaporan: string, attachmentId: string): Promise<void>;
    adminDeleteReport(author: Principal, nomorLaporan: string): Promise<void>;
    adminDeleteUser(user: Principal): Promise<void>;
    adminEditReport(author: Principal, nomorLaporan: string, updatedReport: LaporanUpdate): Promise<void>;
    adminEditUserProfile(user: Principal, profile: UserProfile): Promise<void>;
    adminRestoreUser(user: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createReport(report: LaporanRencanaKerja): Promise<void>;
    getAdminStats(): Promise<AdminStats>;
    getAllReports(): Promise<Array<LaporanRencanaKerja>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getMyReports(): Promise<Array<LaporanRencanaKerja>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listDeletedUsers(): Promise<Array<DeletedUser>>;
    listUsers(): Promise<Array<UserProfile>>;
    removeAttachmentFromReport(nomorLaporan: string, attachmentId: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    submitReport(nomorLaporan: string): Promise<void>;
    updateCallerUserProfile(name: string | null, nip: string | null, unitKerja: string | null, wilayah: string | null): Promise<void>;
    updateReport(nomorLaporan: string, updatedReport: LaporanUpdate): Promise<void>;
}
