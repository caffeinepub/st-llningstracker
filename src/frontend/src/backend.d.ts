import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> { __kind__: "Some"; value: T; }
export interface None { __kind__: "None"; }
export type Option<T> = Some<T> | None;
export interface DashboardStats { out: bigint; incomplete: bigint; available: bigint; returned: bigint; }
export interface ActivityLogEntry {
    action: Variant_created_loadoutSet_statusChanged_checkedOut_returned;
    trailerId: bigint;
    user: Principal;
    timestamp: Time;
    details: string;
}
export type Time = bigint;
export interface LoadoutItem { quantity: bigint; partTypeId: bigint; }
export interface Trailer { id: bigint; status: TrailerStatus; code: string; name: string; description: string; }
export interface PartType { id: bigint; name: string; unitLabel: string; }
export interface UserProfile { name: string; }
export interface ReturnItem { expectedCount: bigint; actualCount: bigint; discrepancy: Variant_ok_missing_extra; partTypeId: bigint; }
export enum TrailerStatus { out = "out", incomplete = "incomplete", available = "available", returned = "returned" }
export enum UserRole { admin = "admin", user = "user", guest = "guest" }
export enum Variant_created_loadoutSet_statusChanged_checkedOut_returned {
    created = "created", loadoutSet = "loadoutSet", statusChanged = "statusChanged", checkedOut = "checkedOut", returned = "returned"
}
export enum Variant_ok_missing_extra { ok = "ok", missing = "missing", extra = "extra" }
export interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkoutTrailer(trailerId: bigint, photoHashes: string[]): Promise<void>;
    createPartType(name: string, unitLabel: string): Promise<bigint>;
    createTrailer(code: string, name: string, description: string): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getLoadout(trailerId: bigint): Promise<Array<LoadoutItem>>;
    getTrailer(id: bigint): Promise<Trailer>;
    getTrailerLog(trailerId: bigint): Promise<Array<ActivityLogEntry>>;
    getAllActivityLogs(): Promise<Array<ActivityLogEntry>>;
    getCheckoutPhotos(trailerId: bigint): Promise<string[]>;
    getReturnPhotos(trailerId: bigint): Promise<string[]>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listPartTypes(): Promise<Array<PartType>>;
    listTrailers(): Promise<Array<Trailer>>;
    returnTrailer(trailerId: bigint, actualItems: Array<ReturnItem>, photoHashes: string[]): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setLoadout(trailerId: bigint, items: Array<LoadoutItem>): Promise<void>;
    updateTrailer(id: bigint, name: string, description: string, status: TrailerStatus): Promise<void>;
}
