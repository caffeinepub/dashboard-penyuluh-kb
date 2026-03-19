import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";

import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";


actor {
  // Initialize access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);
  include MixinStorage();

  // User approval functions
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public type UserRole = {
    #admin;
    #penyuluh_kb;
    #guest;
  };

  public type UserProfile = {
    name : Text;
    nip : Text;
    unitKerja : Text;
    wilayah : Text;
    role : UserRole;
  };

  public type DeletedUser = {
    principal : Principal;
    profile : UserProfile;
  };

  public type ReportStatus = {
    #draft;
    #submitted;
  };

  public type LaporanRencanaKerja = {
    nomorLaporan : Text;
    tanggal : Text;
    namaKegiatan : Text;
    sasaran : Text;
    indikatorKeberhasilan : Text;
    volume : Text;
    metodeKegiatan : Text;
    lokasiKegiatan : Text;
    waktuPelaksanaan : Text;
    sumberDana : Text;
    keterangan : Text;
    lampiranIds : [Text];
    status : ReportStatus;
    author : Principal;
  };

  public type LaporanUpdate = {
    nomorLaporan : Text;
    tanggal : Text;
    namaKegiatan : Text;
    sasaran : Text;
    indikatorKeberhasilan : Text;
    volume : Text;
    metodeKegiatan : Text;
    lokasiKegiatan : Text;
    waktuPelaksanaan : Text;
    sumberDana : Text;
    keterangan : Text;
    lampiranIds : [Text];
    status : ReportStatus;
  };

  public type AdminStats = {
    totalUsers : Nat;
    approvedUsers : Nat;
    totalReports : Nat;
    submittedReports : Nat;
  };

  type ReportKey = (Principal, Text);

  module ReportKey {
    public func compare(k1 : ReportKey, k2 : ReportKey) : Order.Order {
      switch (Principal.compare(k1.0, k2.0)) {
        case (#less) { #less };
        case (#greater) { #greater };
        case (#equal) { Text.compare(k1.1, k2.1) };
      };
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let deletedUserProfiles = Map.empty<Principal, UserProfile>();
  let laporan = Map.empty<ReportKey, LaporanRencanaKerja>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can access their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func updateCallerUserProfile(name : ?Text, nip : ?Text, unitKerja : ?Text, wilayah : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?existingProfile) {
        let updatedProfile = {
          name = switch (name) { case (?n) n; case null existingProfile.name };
          nip = switch (nip) { case (?n) n; case null existingProfile.nip };
          unitKerja = switch (unitKerja) { case (?u) u; case null existingProfile.unitKerja };
          wilayah = switch (wilayah) { case (?w) w; case null existingProfile.wilayah };
          role = existingProfile.role;
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func listUsers() : async [UserProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    userProfiles.values().toArray();
  };

  public query ({ caller }) func getAdminStats() : async AdminStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let totalUsers = userProfiles.size();
    let approvals = UserApproval.listApprovals(approvalState);
    let approvedUsers = approvals.filter(func(info : UserApproval.UserApprovalInfo) : Bool {
      switch (info.status) {
        case (#approved) true;
        case (_) false;
      };
    }).size();

    let totalReports = laporan.size();
    let submittedReports = laporan.values().filter(func(report : LaporanRencanaKerja) : Bool {
      switch (report.status) {
        case (#submitted) true;
        case (_) false;
      };
    }).size();

    {
      totalUsers = totalUsers;
      approvedUsers = approvedUsers;
      totalReports = totalReports;
      submittedReports = submittedReports;
    };
  };

  public shared ({ caller }) func createReport(report : LaporanRencanaKerja) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create reports");
    };
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can create reports");
    };

    let reportKey = (caller, report.nomorLaporan);

    if (laporan.containsKey(reportKey)) {
      Runtime.trap("Report with this number already exists for this user");
    };

    laporan.add(reportKey, { report with author = caller });
  };

  public shared ({ caller }) func updateReport(nomorLaporan : Text, updatedReport : LaporanUpdate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update reports");
    };
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can update reports");
    };

    let reportKey = (caller, nomorLaporan);

    switch (laporan.get(reportKey)) {
      case (null) { Runtime.trap("Report not found") };
      case (?existingReport) {
        if (existingReport.author != caller) {
          Runtime.trap("Unauthorized: Can only update your own reports");
        };

        if (existingReport.status != #draft) {
          Runtime.trap("Only draft reports can be updated");
        };

        let newReport : LaporanRencanaKerja = {
          updatedReport with
          lampiranIds = updatedReport.lampiranIds;
          author = caller;
        };
        laporan.add(reportKey, newReport);
      };
    };
  };

  public shared ({ caller }) func submitReport(nomorLaporan : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reports");
    };
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can submit reports");
    };

    let reportKey = (caller, nomorLaporan);

    switch (laporan.get(reportKey)) {
      case (null) { Runtime.trap("Report not found") };
      case (?existingReport) {
        if (existingReport.author != caller) {
          Runtime.trap("Unauthorized: Can only submit your own reports");
        };

        if (existingReport.status != #draft) {
          Runtime.trap("Only draft reports can be submitted");
        };

        let updatedReport = { existingReport with status = #submitted };
        laporan.add(reportKey, updatedReport);
      };
    };
  };

  public query ({ caller }) func getMyReports() : async [LaporanRencanaKerja] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can view reports");
    };

    let matchingReports = laporan.entries().filter(
      func((key, _)) { key.0 == caller }
    );
    matchingReports
    .map(func((_, report)) { report })
    .toArray();
  };

  public query ({ caller }) func getAllReports() : async [LaporanRencanaKerja] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    laporan.values().toArray();
  };

  public shared ({ caller }) func addAttachmentToReport(nomorLaporan : Text, attachmentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add attachments");
    };
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can add attachments");
    };

    let reportKey = (caller, nomorLaporan);

    switch (laporan.get(reportKey)) {
      case (null) { Runtime.trap("Report not found") };
      case (?existingReport) {
        if (existingReport.author != caller) {
          Runtime.trap("Unauthorized: Can only update your own reports");
        };

        let updatedLampiranIds = existingReport.lampiranIds.concat([attachmentId]);
        let updatedReport = { existingReport with lampiranIds = updatedLampiranIds };
        laporan.add(reportKey, updatedReport);
      };
    };
  };

  public shared ({ caller }) func removeAttachmentFromReport(nomorLaporan : Text, attachmentId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove attachments");
    };
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can remove attachments");
    };

    let reportKey = (caller, nomorLaporan);

    switch (laporan.get(reportKey)) {
      case (null) { Runtime.trap("Report not found") };
      case (?existingReport) {
        if (existingReport.author != caller) {
          Runtime.trap("Unauthorized: Can only update your own reports");
        };

        let updatedLampiranIds = existingReport.lampiranIds.filter(func(id) { id != attachmentId });
        let updatedReport = { existingReport with lampiranIds = updatedLampiranIds };
        laporan.add(reportKey, updatedReport);
      };
    };
  };

  // Admin functions

  public shared ({ caller }) func adminEditUserProfile(user : Principal, profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    userProfiles.add(user, profile);
  };

  public shared ({ caller }) func adminDeleteUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    // Save profile to deleted map before removing
    switch (userProfiles.get(user)) {
      case (?profile) { deletedUserProfiles.add(user, profile) };
      case (null) {};
    };
    userProfiles.remove(user);
    UserApproval.setApproval(approvalState, user, #rejected);
  };

  public query ({ caller }) func listDeletedUsers() : async [DeletedUser] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    deletedUserProfiles.entries().map(func((principal, profile)) : DeletedUser {
      { principal = principal; profile = profile }
    }).toArray();
  };

  public shared ({ caller }) func adminRestoreUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    switch (deletedUserProfiles.get(user)) {
      case (null) { Runtime.trap("Deleted user not found") };
      case (?profile) {
        userProfiles.add(user, profile);
        deletedUserProfiles.remove(user);
        UserApproval.setApproval(approvalState, user, #approved);
      };
    };
  };

  public shared ({ caller }) func adminEditReport(author : Principal, nomorLaporan : Text, updatedReport : LaporanUpdate) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let reportKey = (author, nomorLaporan);

    switch (laporan.get(reportKey)) {
      case (null) { Runtime.trap("Report not found") };
      case (?_) {
        let newReport : LaporanRencanaKerja = {
          updatedReport with
          lampiranIds = updatedReport.lampiranIds;
          author = author;
        };
        laporan.add(reportKey, newReport);
      };
    };
  };

  public shared ({ caller }) func adminDeleteReport(author : Principal, nomorLaporan : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let reportKey = (author, nomorLaporan);
    switch (laporan.get(reportKey)) {
      case (null) { Runtime.trap("Report not found") };
      case (?_) {
        laporan.remove(reportKey);
      };
    };
  };

};
