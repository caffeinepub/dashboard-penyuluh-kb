import type { Principal } from "@dfinity/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminStats() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getAdminStats();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAllReports() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["allReports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReports();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useMyReports() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["myReports"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyReports();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAdminUsersWithApproval() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery({
    queryKey: ["adminUsersWithApproval"],
    queryFn: async () => {
      if (!actor) return [];
      const approvals = await actor.listApprovals();
      const profiles = await Promise.all(
        approvals.map((a) => actor.getUserProfile(a.principal)),
      );
      return approvals.map((approval, i) => ({
        principal: approval.principal,
        status: approval.status as string,
        profile: profiles[i],
      }));
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: {
      nip: string;
      name: string;
      role: string;
      wilayah: string;
      unitKerja: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
    },
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: {
      user: Principal;
      status: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setApproval(user, status as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsersWithApproval"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useCreateReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: any) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createReport(report);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myReports"] });
      queryClient.invalidateQueries({ queryKey: ["allReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useSubmitReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nomorLaporan: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.submitReport(nomorLaporan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myReports"] });
      queryClient.invalidateQueries({ queryKey: ["allReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
