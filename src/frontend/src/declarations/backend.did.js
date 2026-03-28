/* eslint-disable */

// @ts-nocheck

import { IDL } from '@icp-sdk/core/candid';

export const UserRole = IDL.Variant({
  'admin' : IDL.Null,
  'user' : IDL.Null,
  'guest' : IDL.Null,
});
export const UserProfile = IDL.Record({ 'name' : IDL.Text });
export const DashboardStats = IDL.Record({
  'out' : IDL.Nat,
  'incomplete' : IDL.Nat,
  'available' : IDL.Nat,
  'returned' : IDL.Nat,
});
export const LoadoutItem = IDL.Record({
  'quantity' : IDL.Nat,
  'partTypeId' : IDL.Nat,
});
export const TrailerStatus = IDL.Variant({
  'out' : IDL.Null,
  'incomplete' : IDL.Null,
  'available' : IDL.Null,
  'returned' : IDL.Null,
});
export const Trailer = IDL.Record({
  'id' : IDL.Nat,
  'status' : TrailerStatus,
  'code' : IDL.Text,
  'name' : IDL.Text,
  'description' : IDL.Text,
});
export const Time = IDL.Int;
export const ActivityLogEntry = IDL.Record({
  'action' : IDL.Variant({
    'created' : IDL.Null,
    'loadoutSet' : IDL.Null,
    'statusChanged' : IDL.Null,
    'checkedOut' : IDL.Null,
    'returned' : IDL.Null,
  }),
  'trailerId' : IDL.Nat,
  'user' : IDL.Principal,
  'timestamp' : Time,
  'details' : IDL.Text,
});
export const PartType = IDL.Record({
  'id' : IDL.Nat,
  'name' : IDL.Text,
  'unitLabel' : IDL.Text,
});
export const ReturnItem = IDL.Record({
  'expectedCount' : IDL.Nat,
  'actualCount' : IDL.Nat,
  'discrepancy' : IDL.Variant({
    'ok' : IDL.Null,
    'missing' : IDL.Null,
    'extra' : IDL.Null,
  }),
  'partTypeId' : IDL.Nat,
});

export const idlService = IDL.Service({
  '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
  'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
  'checkoutTrailer' : IDL.Func([IDL.Nat, IDL.Vec(IDL.Text)], [], []),
  'createPartType' : IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
  'createTrailer' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
  'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
  'getDashboardStats' : IDL.Func([], [DashboardStats], ['query']),
  'getLoadout' : IDL.Func([IDL.Nat], [IDL.Vec(LoadoutItem)], ['query']),
  'getTrailer' : IDL.Func([IDL.Nat], [Trailer], ['query']),
  'getTrailerLog' : IDL.Func([IDL.Nat], [IDL.Vec(ActivityLogEntry)], ['query']),
  'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
  'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
  'listPartTypes' : IDL.Func([], [IDL.Vec(PartType)], ['query']),
  'listTrailers' : IDL.Func([], [IDL.Vec(Trailer)], ['query']),
  'returnTrailer' : IDL.Func([IDL.Nat, IDL.Vec(ReturnItem), IDL.Vec(IDL.Text)], [], []),
  'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
  'setLoadout' : IDL.Func([IDL.Nat, IDL.Vec(LoadoutItem)], [], []),
  'updateTrailer' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text, TrailerStatus], [], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({ 'admin' : IDL.Null, 'user' : IDL.Null, 'guest' : IDL.Null });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const DashboardStats = IDL.Record({ 'out' : IDL.Nat, 'incomplete' : IDL.Nat, 'available' : IDL.Nat, 'returned' : IDL.Nat });
  const LoadoutItem = IDL.Record({ 'quantity' : IDL.Nat, 'partTypeId' : IDL.Nat });
  const TrailerStatus = IDL.Variant({ 'out' : IDL.Null, 'incomplete' : IDL.Null, 'available' : IDL.Null, 'returned' : IDL.Null });
  const Trailer = IDL.Record({ 'id' : IDL.Nat, 'status' : TrailerStatus, 'code' : IDL.Text, 'name' : IDL.Text, 'description' : IDL.Text });
  const Time = IDL.Int;
  const ActivityLogEntry = IDL.Record({
    'action' : IDL.Variant({ 'created' : IDL.Null, 'loadoutSet' : IDL.Null, 'statusChanged' : IDL.Null, 'checkedOut' : IDL.Null, 'returned' : IDL.Null }),
    'trailerId' : IDL.Nat, 'user' : IDL.Principal, 'timestamp' : Time, 'details' : IDL.Text,
  });
  const PartType = IDL.Record({ 'id' : IDL.Nat, 'name' : IDL.Text, 'unitLabel' : IDL.Text });
  const ReturnItem = IDL.Record({
    'expectedCount' : IDL.Nat, 'actualCount' : IDL.Nat,
    'discrepancy' : IDL.Variant({ 'ok' : IDL.Null, 'missing' : IDL.Null, 'extra' : IDL.Null }),
    'partTypeId' : IDL.Nat,
  });
  return IDL.Service({
    '_initializeAccessControlWithSecret' : IDL.Func([IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'checkoutTrailer' : IDL.Func([IDL.Nat, IDL.Vec(IDL.Text)], [], []),
    'createPartType' : IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    'createTrailer' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getDashboardStats' : IDL.Func([], [DashboardStats], ['query']),
    'getLoadout' : IDL.Func([IDL.Nat], [IDL.Vec(LoadoutItem)], ['query']),
    'getTrailer' : IDL.Func([IDL.Nat], [Trailer], ['query']),
    'getTrailerLog' : IDL.Func([IDL.Nat], [IDL.Vec(ActivityLogEntry)], ['query']),
    'getUserProfile' : IDL.Func([IDL.Principal], [IDL.Opt(UserProfile)], ['query']),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'listPartTypes' : IDL.Func([], [IDL.Vec(PartType)], ['query']),
    'listTrailers' : IDL.Func([], [IDL.Vec(Trailer)], ['query']),
    'returnTrailer' : IDL.Func([IDL.Nat, IDL.Vec(ReturnItem), IDL.Vec(IDL.Text)], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'setLoadout' : IDL.Func([IDL.Nat, IDL.Vec(LoadoutItem)], [], []),
    'updateTrailer' : IDL.Func([IDL.Nat, IDL.Text, IDL.Text, TrailerStatus], [], []),
  });
};

export const init = ({ IDL }) => { return []; };