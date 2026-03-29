import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ActivityLogEntry,
  type DashboardStats,
  type LoadoutItem,
  type PartType,
  type ReturnItem,
  type Trailer,
  TrailerStatus,
  type UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export type {
  Trailer,
  PartType,
  LoadoutItem,
  ReturnItem,
  DashboardStats,
  ActivityLogEntry,
  UserProfile,
};
export { TrailerStatus };

export function useListTrailers() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<Trailer>>({
    queryKey: ["trailers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTrailers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTrailer(id: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Trailer>({
    queryKey: ["trailer", id?.toString()],
    queryFn: async () => {
      if (!actor || id === undefined) throw new Error("No actor");
      return actor.getTrailer(id);
    },
    enabled: !!actor && !isFetching && id !== undefined,
  });
}

export function useLoadout(trailerId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<LoadoutItem[]>({
    queryKey: ["loadout", trailerId?.toString()],
    queryFn: async () => {
      if (!actor || trailerId === undefined) return [];
      return actor.getLoadout(trailerId);
    },
    enabled: !!actor && !isFetching && trailerId !== undefined,
  });
}

export function useListPartTypes() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<PartType>>({
    queryKey: ["partTypes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPartTypes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTrailerLog(trailerId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<ActivityLogEntry[]>({
    queryKey: ["trailerLog", trailerId?.toString()],
    queryFn: async () => {
      if (!actor || trailerId === undefined) return [];
      return actor.getTrailerLog(trailerId);
    },
    enabled: !!actor && !isFetching && trailerId !== undefined,
  });
}

export function useAllActivityLogs() {
  const { actor, isFetching } = useActor();
  return useQuery<ActivityLogEntry[]>({
    queryKey: ["allActivityLogs"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllActivityLogs() as Promise<ActivityLogEntry[]>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCheckoutPhotos(trailerId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["checkoutPhotos", trailerId?.toString()],
    queryFn: async () => {
      if (!actor || trailerId === undefined) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getCheckoutPhotos(trailerId) as Promise<string[]>;
    },
    enabled: !!actor && !isFetching && trailerId !== undefined,
  });
}

export function useReturnPhotos(trailerId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["returnPhotos", trailerId?.toString()],
    queryFn: async () => {
      if (!actor || trailerId === undefined) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getReturnPhotos(trailerId) as Promise<string[]>;
    },
    enabled: !!actor && !isFetching && trailerId !== undefined,
  });
}

export function useAllPhotos(trailerIds: bigint[]) {
  const { actor, isFetching } = useActor();
  const key = trailerIds.map((id) => id.toString()).join(",");
  return useQuery<{
    checkoutPhotos: Record<string, string[]>;
    returnPhotos: Record<string, string[]>;
  }>({
    queryKey: ["allPhotos", key],
    queryFn: async () => {
      if (!actor || trailerIds.length === 0)
        return { checkoutPhotos: {}, returnPhotos: {} };
      const results = await Promise.all(
        trailerIds.map(async (id) => {
          const [co, ret] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (actor as any).getCheckoutPhotos(id) as Promise<string[]>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (actor as any).getReturnPhotos(id) as Promise<string[]>,
          ]);
          return { id: id.toString(), co, ret };
        }),
      );
      const checkoutPhotos: Record<string, string[]> = {};
      const returnPhotos: Record<string, string[]> = {};
      for (const r of results) {
        if (r.co.length > 0) checkoutPhotos[r.id] = r.co;
        if (r.ret.length > 0) returnPhotos[r.id] = r.ret;
      }
      return { checkoutPhotos, returnPhotos };
    },
    enabled: !!actor && !isFetching && trailerIds.length > 0,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
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

export function useCheckoutTrailer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trailerId,
      photoHashes,
    }: { trailerId: bigint; photoHashes: string[] }) => {
      if (!actor) throw new Error("No actor");
      await actor.checkoutTrailer(trailerId, photoHashes);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trailers"] });
      qc.invalidateQueries({ queryKey: ["trailer"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["allActivityLogs"] });
      qc.invalidateQueries({ queryKey: ["checkoutPhotos"] });
      qc.invalidateQueries({ queryKey: ["allPhotos"] });
    },
  });
}

export function useReturnTrailer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trailerId,
      items,
      photoHashes,
    }: { trailerId: bigint; items: ReturnItem[]; photoHashes: string[] }) => {
      if (!actor) throw new Error("No actor");
      await actor.returnTrailer(trailerId, items, photoHashes);
    },
    onSuccess: (_data, { trailerId }) => {
      qc.invalidateQueries({ queryKey: ["trailers"] });
      qc.invalidateQueries({ queryKey: ["trailer", trailerId.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["trailerLog", trailerId.toString()] });
      qc.invalidateQueries({ queryKey: ["allActivityLogs"] });
      qc.invalidateQueries({ queryKey: ["returnPhotos"] });
      qc.invalidateQueries({ queryKey: ["allPhotos"] });
    },
  });
}

export function useCreateTrailer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      code,
      name,
      description,
    }: { code: string; name: string; description: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createTrailer(code, name, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trailers"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useCreatePartType() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      unitLabel,
    }: { name: string; unitLabel: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.createPartType(name, unitLabel);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partTypes"] });
    },
  });
}

export function useSetLoadout() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trailerId,
      items,
    }: { trailerId: bigint; items: LoadoutItem[] }) => {
      if (!actor) throw new Error("No actor");
      await actor.setLoadout(trailerId, items);
    },
    onSuccess: (_data, { trailerId }) => {
      qc.invalidateQueries({ queryKey: ["loadout", trailerId.toString()] });
    },
  });
}

export function useUpdateTrailer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      status,
    }: {
      id: bigint;
      name: string;
      description: string;
      status: TrailerStatus;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateTrailer(id, name, description, status);
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["trailers"] });
      qc.invalidateQueries({ queryKey: ["trailer", id.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["allActivityLogs"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useStartInspection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      trailerId,
      photoHashes,
      comments,
    }: { trailerId: bigint; photoHashes: string[]; comments: string }) => {
      if (!actor) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).startInspection(trailerId, photoHashes, comments);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allActivityLogs"] });
      qc.invalidateQueries({ queryKey: ["allInspections"] });
      qc.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}

export function useCloseInspection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      inspectionId,
      trailerCode,
    }: { inspectionId: bigint; trailerCode: string }) => {
      if (!actor) throw new Error("No actor");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).closeInspection(inspectionId, trailerCode);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allActivityLogs"] });
      qc.invalidateQueries({ queryKey: ["allInspections"] });
      qc.invalidateQueries({ queryKey: ["inspections"] });
    },
  });
}

export function useGetInspections(trailerId: bigint | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<unknown[]>({
    queryKey: ["inspections", trailerId?.toString()],
    queryFn: async () => {
      if (!actor || trailerId === undefined) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getInspections(trailerId) as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching && trailerId !== undefined,
  });
}

export function useGetAllInspections() {
  const { actor, isFetching } = useActor();
  return useQuery<unknown[]>({
    queryKey: ["allInspections"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAllInspections() as Promise<unknown[]>;
    },
    enabled: !!actor && !isFetching,
  });
}
