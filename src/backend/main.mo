import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Types
  public type TrailerStatus = { #available; #out; #returned; #incomplete };

  type TrailerData = {
    code : Text;
    name : Text;
    description : Text;
    status : TrailerStatus;
  };

  public type Trailer = {
    id : Nat;
    code : Text;
    name : Text;
    description : Text;
    status : TrailerStatus;
  };

  module Trailer {
    public func compare(t1 : Trailer, t2 : Trailer) : Order.Order {
      switch (Text.compare(t1.name, t2.name)) {
        case (#equal) { Text.compare(t1.code, t2.code) };
        case (order) { order };
      };
    };
  };

  type PartTypeData = {
    name : Text;
    unitLabel : Text;
  };

  public type PartType = {
    id : Nat;
    name : Text;
    unitLabel : Text;
  };

  public type LoadoutItem = {
    partTypeId : Nat;
    quantity : Nat;
  };

  public type Loadout = {
    trailerId : Nat;
    items : [LoadoutItem];
  };

  public type CheckoutRecord = {
    trailerId : Nat;
    user : Principal;
    timestamp : Time.Time;
    loadoutSnapshot : [LoadoutItem];
  };

  public type ReturnItem = {
    partTypeId : Nat;
    expectedCount : Nat;
    actualCount : Nat;
    discrepancy : {
      #missing;
      #extra;
      #ok;
    };
  };

  module ReturnItem {
    public func compare(left : ReturnItem, right : ReturnItem) : Order.Order {
      Nat.compare(left.partTypeId, right.partTypeId);
    };
  };

  public type ReturnRecord = {
    trailerId : Nat;
    user : Principal;
    timestamp : Time.Time;
    returnItems : [ReturnItem];
    status : {
      #complete;
      #incomplete;
    };
  };

  public type ActivityLogEntry = {
    trailerId : Nat;
    action : {
      #created;
      #loadoutSet;
      #checkedOut;
      #returned;
      #statusChanged;

    };
    user : Principal;
    timestamp : Time.Time;
    details : Text;
  };

  public type DashboardStats = {
    available : Nat;
    out : Nat;
    returned : Nat;
    incomplete : Nat;
  };

  // Inspection type
  public type InspectionStatus = { #open; #closed };

  public type Inspection = {
    id : Nat;
    trailerId : Nat;
    user : Principal;
    startTime : Time.Time;
    endTime : ?Time.Time;
    photoHashes : [Text];
    comments : Text;
    status : InspectionStatus;
  };

  // Storage
  let trailers = Map.empty<Nat, TrailerData>();
  let partTypes = Map.empty<Nat, PartTypeData>();
  let loadouts = Map.empty<Nat, [LoadoutItem]>();
  let checkouts = Map.empty<Nat, CheckoutRecord>();
  let returns = Map.empty<Nat, ReturnRecord>();
  let checkoutPhotos = Map.empty<Nat, [Text]>();
  let returnPhotos = Map.empty<Nat, [Text]>();
  let activityLogs = Map.empty<Nat, [ActivityLogEntry]>();
  let inspections = Map.empty<Nat, Inspection>();

  var nextTrailerId = 1;
  var nextPartTypeId = 1;
  var nextInspectionId = 1;

  func returnItemMapSorter(returnItems : Map.Map<Nat, ReturnItem>) : [(Nat, ReturnItem)] {
    returnItems.entries().toArray().sort(
      func(a, b) { ReturnItem.compare(a.1, b.1) },
    );
  };

  func toTrailer(id : Nat, data : TrailerData) : Trailer = {
    id;
    code = data.code;
    name = data.name;
    description = data.description;
    status = data.status;
  };

  func toPartType(id : Nat, data : PartTypeData) : PartType = {
    id;
    name = data.name;
    unitLabel = data.unitLabel;
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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

  // Create trailer (admin only)
  public shared ({ caller }) func createTrailer(code : Text, name : Text, description : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create trailers");
    };
    let id = nextTrailerId;
    let data : TrailerData = { code; name; description; status = #available };
    trailers.add(id, data);
    nextTrailerId += 1;
    addTrailerLog(caller, #created, id, "Trailer created by admin");
    id;
  };

  // Update trailer (admin only)
  public shared ({ caller }) func updateTrailer(id : Nat, name : Text, description : Text, status : TrailerStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update trailers");
    };
    switch (trailers.get(id)) {
      case (null) { Runtime.trap("Trailer not found") };
      case (?data) {
        let updated : TrailerData = { code = data.code; name; description; status };
        trailers.add(id, updated);
        if (data.status != status) {
          addTrailerLog(caller, #statusChanged, id, "Status changed by admin");
        };
      };
    };
  };

  // Get trailer by id
  public query ({ caller }) func getTrailer(id : Nat) : async Trailer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view trailers");
    };
    switch (trailers.get(id)) {
      case (null) { Runtime.trap("Trailer not found") };
      case (?data) { toTrailer(id, data) };
    };
  };

  // List all trailers
  public query ({ caller }) func listTrailers() : async [Trailer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list trailers");
    };
    let entries = trailers.entries().toArray();
    let withIds = entries.map(func(kv) { toTrailer(kv.0, kv.1) });
    withIds.sort(func(a, b) { Trailer.compare(a, b) });
  };

  // Create part type (admin only)
  public shared ({ caller }) func createPartType(name : Text, unitLabel : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create part types");
    };
    let id = nextPartTypeId;
    let data : PartTypeData = { name; unitLabel };
    partTypes.add(id, data);
    nextPartTypeId += 1;
    id;
  };

  // List all part types
  public query ({ caller }) func listPartTypes() : async [PartType] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list part types");
    };
    let entries = partTypes.entries().toArray();
    let withIds = entries.map(func(kv) { toPartType(kv.0, kv.1) });
    withIds.sort(func(a, b) { Text.compare(a.name, b.name) });
  };

  // Set loadout (admin only)
  public shared ({ caller }) func setLoadout(trailerId : Nat, items : [LoadoutItem]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set loadouts");
    };
    for (item in items.values()) {
      if (not partTypes.containsKey(item.partTypeId)) {
        Runtime.trap("Invalid part type ID: " # item.partTypeId.toText());
      };
    };
    loadouts.add(trailerId, items);
    addTrailerLog(caller, #loadoutSet, trailerId, "Loadout set by admin");
  };

  // Get loadout by trailer id
  public query ({ caller }) func getLoadout(trailerId : Nat) : async [LoadoutItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view loadouts");
    };
    switch (loadouts.get(trailerId)) {
      case (null) { [] };
      case (?items) { items };
    };
  };

  // Checkout trailer
  public shared ({ caller }) func checkoutTrailer(trailerId : Nat, photoHashes : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can checkout trailers");
    };
    switch (trailers.get(trailerId)) {
      case (null) { Runtime.trap("Trailer not found") };
      case (?data) {
        if (data.status != #available and data.status != #returned and data.status != #incomplete) {
          Runtime.trap("Trailer is not available for checkout");
        };
        trailers.add(trailerId, { code = data.code; name = data.name; description = data.description; status = #out });
        let loadout = switch (loadouts.get(trailerId)) {
          case (null) { [] };
          case (?items) { items };
        };
        checkouts.add(trailerId, { trailerId; user = caller; timestamp = Time.now(); loadoutSnapshot = loadout });
        if (photoHashes.size() > 0) { checkoutPhotos.add(trailerId, photoHashes) };
        addTrailerLog(caller, #checkedOut, trailerId, "Trailer checked out");
      };
    };
  };

  // Return trailer
  public shared ({ caller }) func returnTrailer(trailerId : Nat, actualItems : [ReturnItem], photoHashes : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only staff can return trailers");
    };
    switch (trailers.get(trailerId)) {
      case (null) { Runtime.trap("Trailer not found") };
      case (?data) {
        if (data.status != #out and data.status != #incomplete) {
          Runtime.trap("Trailer is not currently checked out");
        };
        let currentLoadout = switch (loadouts.get(trailerId)) {
          case (null) { [] };
          case (?items) { items };
        };
        let actualItemsMap = Map.empty<Nat, ReturnItem>();
        for (item in actualItems.values()) { actualItemsMap.add(item.partTypeId, item) };
        let discrepancyItemsMap = Map.empty<Nat, ReturnItem>();
        for (loadoutItem in currentLoadout.values()) {
          let actualCount = switch (actualItemsMap.get(loadoutItem.partTypeId)) {
            case (null) { 0 };
            case (?item) { item.actualCount };
          };
          let discrepancy = if (actualCount < loadoutItem.quantity) { #missing }
            else if (actualCount > loadoutItem.quantity) { #extra }
            else { #ok };
          discrepancyItemsMap.add(loadoutItem.partTypeId, {
            partTypeId = loadoutItem.partTypeId;
            expectedCount = loadoutItem.quantity;
            actualCount;
            discrepancy;
          });
        };
        let discrepancyArray = returnItemMapSorter(discrepancyItemsMap).map(func(kv) { kv.1 });
        let hasMissing = discrepancyArray.find(func(item) { item.discrepancy == #missing }) != null;
        let status = if (hasMissing) { #incomplete } else { #returned };
        trailers.add(trailerId, { code = data.code; name = data.name; description = data.description; status });
        returns.add(trailerId, {
          trailerId; user = caller; timestamp = Time.now();
          returnItems = discrepancyArray;
          status = if (hasMissing) { #incomplete } else { #complete };
        });
        if (photoHashes.size() > 0) { returnPhotos.add(trailerId, photoHashes) };
        addTrailerLog(caller, #returned, trailerId, "Trailer returned");
      };
    };
  };

  // --- INSPECTION FUNCTIONS ---

  // Start an inspection (authenticated users)
  public shared ({ caller }) func startInspection(trailerId : Nat, photoHashes : [Text], comments : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can start inspections");
    };
    switch (trailers.get(trailerId)) {
      case (null) { Runtime.trap("Trailer not found") };
      case (?_) {};
    };
    let id = nextInspectionId;
    let inspection : Inspection = {
      id;
      trailerId;
      user = caller;
      startTime = Time.now();
      endTime = null;
      photoHashes;
      comments;
      status = #open;
    };
    inspections.add(id, inspection);
    nextInspectionId += 1;

    id;
  };

  // Close an inspection by scanning QR code (validates trailer code)
  public shared ({ caller }) func closeInspection(inspectionId : Nat, trailerCode : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can close inspections");
    };
    switch (inspections.get(inspectionId)) {
      case (null) { Runtime.trap("Inspection not found") };
      case (?insp) {
        if (insp.status == #closed) {
          Runtime.trap("Inspection is already closed");
        };
        // Validate trailer code
        switch (trailers.get(insp.trailerId)) {
          case (null) { Runtime.trap("Trailer not found") };
          case (?trailer) {
            if (trailer.code != trailerCode) {
              Runtime.trap("QR-kod stämmer inte med trailern");
            };
          };
        };
        let closed : Inspection = {
          id = insp.id;
          trailerId = insp.trailerId;
          user = insp.user;
          startTime = insp.startTime;
          endTime = ?Time.now();
          photoHashes = insp.photoHashes;
          comments = insp.comments;
          status = #closed;
        };
        inspections.add(inspectionId, closed);

      };
    };
  };

  // Get inspections for a trailer (authenticated users)
  public query ({ caller }) func getInspections(trailerId : Nat) : async [Inspection] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let all = inspections.entries().toArray();
    let filtered = all
      .filter(func(kv) { kv.1.trailerId == trailerId })
      .map(func(kv) { kv.1 });
    filtered.sort(func(a, b) {
      if (a.startTime > b.startTime) { #less }
      else if (a.startTime < b.startTime) { #greater }
      else { #equal }
    });
  };

  // Get ALL inspections (admin only)
  public query ({ caller }) func getAllInspections() : async [Inspection] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all inspections");
    };
    let all = inspections.entries().toArray().map(func(kv) { kv.1 });
    all.sort(func(a, b) {
      if (a.startTime > b.startTime) { #less }
      else if (a.startTime < b.startTime) { #greater }
      else { #equal }
    });
  };

  // Get trailer activity log
  public query ({ caller }) func getTrailerLog(trailerId : Nat) : async [ActivityLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view trailer logs");
    };
    switch (activityLogs.get(trailerId)) {
      case (null) { [] };
      case (?entries) { entries };
    };
  };

  // Get ALL activity logs (admin only)
  public query ({ caller }) func getAllActivityLogs() : async [ActivityLogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all activity logs");
    };
    var all : [ActivityLogEntry] = [];
    for (entries in activityLogs.values()) {
      all := all.concat(entries);
    };
    all.sort(func(a, b) {
      if (a.timestamp > b.timestamp) { #less }
      else if (a.timestamp < b.timestamp) { #greater }
      else { #equal }
    });
  };

  // Get checkout photos (admin only)
  public query ({ caller }) func getCheckoutPhotos(trailerId : Nat) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view photos");
    };
    switch (checkoutPhotos.get(trailerId)) {
      case (null) { [] };
      case (?hashes) { hashes };
    };
  };

  // Get return photos (admin only)
  public query ({ caller }) func getReturnPhotos(trailerId : Nat) : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view photos");
    };
    switch (returnPhotos.get(trailerId)) {
      case (null) { [] };
      case (?hashes) { hashes };
    };
  };

  // Dashboard stats (public)
  public query func getDashboardStats() : async DashboardStats {
    var available = 0;
    var out = 0;
    var returned = 0;
    var incomplete = 0;
    for (data in trailers.values()) {
      switch (data.status) {
        case (#available) { available += 1 };
        case (#out) { out += 1 };
        case (#returned) { returned += 1 };
        case (#incomplete) { incomplete += 1 };
      };
    };
    { available; out; returned; incomplete };
  };

  func addTrailerLog(user : Principal, action : { #created; #loadoutSet; #checkedOut; #returned; #statusChanged }, trailerId : Nat, details : Text) {
    let entry : ActivityLogEntry = { trailerId; action; user; timestamp = Time.now(); details };
    let existing = switch (activityLogs.get(trailerId)) {
      case (null) { [] };
      case (?entries) { entries };
    };
    activityLogs.add(trailerId, [entry].concat(existing));
  };
};
