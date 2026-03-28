/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface ActivityLogEntry {
  'action' : { 'created' : null } |
    { 'loadoutSet' : null } |
    { 'statusChanged' : null } |
    { 'checkedOut' : null } |
    { 'returned' : null },
  'trailerId' : bigint,
  'user' : Principal,
  'timestamp' : Time,
  'details' : string,
}
export interface DashboardStats {
  'out' : bigint,
  'incomplete' : bigint,
  'available' : bigint,
  'returned' : bigint,
}
export interface LoadoutItem { 'quantity' : bigint, 'partTypeId' : bigint }
export interface PartType { 'id' : bigint, 'name' : string, 'unitLabel' : string }
export interface ReturnItem {
  'expectedCount' : bigint,
  'actualCount' : bigint,
  'discrepancy' : { 'ok' : null } |
    { 'missing' : null } |
    { 'extra' : null },
  'partTypeId' : bigint,
}
export type Time = bigint;
export interface Trailer {
  'id' : bigint,
  'status' : TrailerStatus,
  'code' : string,
  'name' : string,
  'description' : string,
}
export type TrailerStatus = { 'out' : null } |
  { 'incomplete' : null } |
  { 'available' : null } |
  { 'returned' : null };
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface _SERVICE {
  '_initializeAccessControlWithSecret' : ActorMethod<[string], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'checkoutTrailer' : ActorMethod<[bigint, Array<string>], undefined>,
  'createPartType' : ActorMethod<[string, string], bigint>,
  'createTrailer' : ActorMethod<[string, string, string], bigint>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getDashboardStats' : ActorMethod<[], DashboardStats>,
  'getLoadout' : ActorMethod<[bigint], Array<LoadoutItem>>,
  'getTrailer' : ActorMethod<[bigint], Trailer>,
  'getTrailerLog' : ActorMethod<[bigint], Array<ActivityLogEntry>>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'listPartTypes' : ActorMethod<[], Array<PartType>>,
  'listTrailers' : ActorMethod<[], Array<Trailer>>,
  'returnTrailer' : ActorMethod<[bigint, Array<ReturnItem>, Array<string>], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'setLoadout' : ActorMethod<[bigint, Array<LoadoutItem>], undefined>,
  'updateTrailer' : ActorMethod<[bigint, string, string, TrailerStatus], undefined>,
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
