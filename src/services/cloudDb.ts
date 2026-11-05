/**
 * JAYSOFTSHINE ERP - Cloud Database Service (Google Cloud Firestore)
 * Enables multi-device real-time state synchronization so that Auditors, Vendors,
 * Clients, and Administrators can sign in and operate from any device, anywhere.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  UserProfile,
  Client,
  Project,
  ProjectLocation,
  Vendor,
  Auditor,
  Assignment,
  AttendanceRecord,
  WorkReport,
  ClientInvoice,
  ClientPaymentReceipt,
  VendorBill,
  AuditorSettlement,
  ExpenseRecord,
  JournalEntry,
  SmtpConfig,
  SystemNotification,
  AuditLogEntry,
  RolePermissionConfig,
  OrganizationProfile,
  TaxClient,
} from '../types/erp';
import { AppState } from './storage';

// Initialize Firebase App & Firestore Database instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: false,
      isAnonymous: false,
      tenantId: null,
    },
    operationType,
    path,
  };
  console.warn('[Firestore Sync Notice]:', JSON.stringify(errInfo));
  return errInfo;
}

// Collection & Document Constants
const COLLECTION_NAME = 'erp_system';
const DOC_MASTER = 'master_state';
const DOC_USERS = 'users';
const DOC_ENTITIES = 'entities';
const DOC_OPERATIONS = 'operations';
const DOC_FIELD = 'field';
const DOC_FINANCIALS = 'financials';
const DOC_GOVERNANCE = 'governance';

export interface CloudSyncStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  error?: string | null;
}

let syncStatusListeners: ((status: CloudSyncStatus) => void)[] = [];
let currentSyncStatus: CloudSyncStatus = {
  connected: false,
  lastSyncedAt: null,
  error: null,
};

export function subscribeToSyncStatus(listener: (status: CloudSyncStatus) => void): () => void {
  syncStatusListeners.push(listener);
  listener(currentSyncStatus);
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== listener);
  };
}

function updateSyncStatus(status: Partial<CloudSyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...status };
  syncStatusListeners.forEach((l) => l(currentSyncStatus));
}

/**
 * Verifies live connection to the provisioned Firestore database
 */
export async function testCloudConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'test_connection', 'ping');
    await setDoc(testRef, {
      ping: 'pong',
      clientTime: new Date().toISOString(),
      timestamp: Date.now(),
    });
    const snap = await getDocFromServer(testRef);
    const ok = snap.exists();
    updateSyncStatus({ connected: ok, lastSyncedAt: new Date().toLocaleTimeString(), error: null });
    return ok;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, 'test_connection/ping');
    updateSyncStatus({ connected: false, error: err.message || 'Offline or network issue' });
    return false;
  }
}

/**
 * Loads all state partitions directly from Firestore cloud database.
 * Used during initial boot or when signing in on a new device.
 */
export async function fetchFullCloudState(): Promise<Partial<AppState> | null> {
  try {
    const masterRef = doc(db, COLLECTION_NAME, DOC_MASTER);
    const usersRef = doc(db, COLLECTION_NAME, DOC_USERS);
    const entitiesRef = doc(db, COLLECTION_NAME, DOC_ENTITIES);
    const operationsRef = doc(db, COLLECTION_NAME, DOC_OPERATIONS);
    const fieldRef = doc(db, COLLECTION_NAME, DOC_FIELD);
    const financialsRef = doc(db, COLLECTION_NAME, DOC_FINANCIALS);
    const governanceRef = doc(db, COLLECTION_NAME, DOC_GOVERNANCE);

    const [masterSnap, usersSnap, entitiesSnap, opsSnap, fieldSnap, finSnap, govSnap] =
      await Promise.all([
        getDoc(masterRef),
        getDoc(usersRef),
        getDoc(entitiesRef),
        getDoc(operationsRef),
        getDoc(fieldRef),
        getDoc(financialsRef),
        getDoc(governanceRef),
      ]);

    // If no data exists in cloud yet, return null to trigger seeding
    if (!usersSnap.exists() && !entitiesSnap.exists() && !masterSnap.exists()) {
      return null;
    }

    const partialState: Partial<AppState> = {};

    if (masterSnap.exists()) {
      const data = masterSnap.data();
      if (data.adminPassword) partialState.adminPassword = data.adminPassword;
      if (data.organization) partialState.organization = data.organization as OrganizationProfile;
      if (data.rolePermissions) partialState.rolePermissions = data.rolePermissions as RolePermissionConfig[];
      if (data.smtpConfig) partialState.smtpConfig = data.smtpConfig as SmtpConfig;
    }

    if (usersSnap.exists()) {
      const data = usersSnap.data();
      if (Array.isArray(data.items)) partialState.users = data.items as UserProfile[];
    }

    if (entitiesSnap.exists()) {
      const data = entitiesSnap.data();
      if (Array.isArray(data.vendors)) partialState.vendors = data.vendors as Vendor[];
      if (Array.isArray(data.auditors)) partialState.auditors = data.auditors as Auditor[];
      if (Array.isArray(data.clients)) partialState.clients = data.clients as Client[];
      if (Array.isArray(data.taxClients)) partialState.taxClients = data.taxClients as TaxClient[];
    }

    if (opsSnap.exists()) {
      const data = opsSnap.data();
      if (Array.isArray(data.projects)) partialState.projects = data.projects as Project[];
      if (Array.isArray(data.locations)) partialState.locations = data.locations as ProjectLocation[];
      if (Array.isArray(data.assignments)) partialState.assignments = data.assignments as Assignment[];
    }

    if (fieldSnap.exists()) {
      const data = fieldSnap.data();
      if (Array.isArray(data.attendance)) partialState.attendance = data.attendance as AttendanceRecord[];
      if (Array.isArray(data.reports)) partialState.reports = data.reports as WorkReport[];
      if (Array.isArray(data.expenses)) partialState.expenses = data.expenses as ExpenseRecord[];
    }

    if (finSnap.exists()) {
      const data = finSnap.data();
      if (Array.isArray(data.invoices)) partialState.invoices = data.invoices as ClientInvoice[];
      if (Array.isArray(data.receipts)) partialState.receipts = data.receipts as ClientPaymentReceipt[];
      if (Array.isArray(data.vendorBills)) partialState.vendorBills = data.vendorBills as VendorBill[];
      if (Array.isArray(data.auditorSettlements))
        partialState.auditorSettlements = data.auditorSettlements as AuditorSettlement[];
      if (Array.isArray(data.journals)) partialState.journals = data.journals as JournalEntry[];
    }

    if (govSnap.exists()) {
      const data = govSnap.data();
      if (Array.isArray(data.notifications))
        partialState.notifications = data.notifications as SystemNotification[];
      if (Array.isArray(data.auditLogs)) partialState.auditLogs = data.auditLogs as AuditLogEntry[];
    }

    updateSyncStatus({
      connected: true,
      lastSyncedAt: new Date().toLocaleTimeString(),
      error: null,
    });

    return partialState;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    updateSyncStatus({ connected: false, error: err.message });
    return null;
  }
}

/**
 * Fetches latest users and credentials directly from cloud Firestore.
 * Critical when logging in on any device so that accounts recently added or updated
 * on other laptops/phones are immediately recognized.
 */
export async function fetchLatestCloudAuthData(): Promise<{
  users?: UserProfile[];
  vendors?: Vendor[];
  auditors?: Auditor[];
  clients?: Client[];
  adminPassword?: string;
} | null> {
  try {
    const usersRef = doc(db, COLLECTION_NAME, DOC_USERS);
    const entitiesRef = doc(db, COLLECTION_NAME, DOC_ENTITIES);
    const masterRef = doc(db, COLLECTION_NAME, DOC_MASTER);

    const [usersSnap, entitiesSnap, masterSnap] = await Promise.all([
      getDoc(usersRef),
      getDoc(entitiesRef),
      getDoc(masterRef),
    ]);

    if (!usersSnap.exists() && !entitiesSnap.exists()) {
      return null;
    }

    const res: {
      users?: UserProfile[];
      vendors?: Vendor[];
      auditors?: Auditor[];
      clients?: Client[];
      adminPassword?: string;
    } = {};

    if (usersSnap.exists()) {
      const data = usersSnap.data();
      if (Array.isArray(data.items)) res.users = data.items as UserProfile[];
    }
    if (entitiesSnap.exists()) {
      const data = entitiesSnap.data();
      if (Array.isArray(data.vendors)) res.vendors = data.vendors as Vendor[];
      if (Array.isArray(data.auditors)) res.auditors = data.auditors as Auditor[];
      if (Array.isArray(data.clients)) res.clients = data.clients as Client[];
    }
    if (masterSnap.exists()) {
      const data = masterSnap.data();
      if (data.adminPassword) res.adminPassword = data.adminPassword;
    }

    return res;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${DOC_USERS}`);
    return null;
  }
}

// Debounce timer for cloud push to prevent Firestore quota waste
let saveTimeout: any = null;

/**
 * Pushes entire application state partitions to Google Cloud Firestore.
 * Debounced to batch rapid state modifications.
 */
export function pushStateToCloud(
  state: AppState,
  immediate: boolean = false
): Promise<void> {
  return new Promise((resolve) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    const executePush = async () => {
      try {
        const now = new Date().toISOString();

        // 1. Master state
        const masterRef = doc(db, COLLECTION_NAME, DOC_MASTER);
        await setDoc(
          masterRef,
          {
            adminPassword: state.adminPassword,
            organization: state.organization,
            rolePermissions: state.rolePermissions,
            smtpConfig: state.smtpConfig,
            updatedAt: now,
          },
          { merge: true }
        );

        // 2. Users (login credentials for all personas)
        const usersRef = doc(db, COLLECTION_NAME, DOC_USERS);
        await setDoc(usersRef, { items: state.users, updatedAt: now });

        // 3. Entities
        const entitiesRef = doc(db, COLLECTION_NAME, DOC_ENTITIES);
        await setDoc(entitiesRef, {
          vendors: state.vendors,
          auditors: state.auditors,
          clients: state.clients,
          taxClients: state.taxClients || [],
          updatedAt: now,
        });

        // 4. Operations
        const opsRef = doc(db, COLLECTION_NAME, DOC_OPERATIONS);
        await setDoc(opsRef, {
          projects: state.projects,
          locations: state.locations,
          assignments: state.assignments,
          updatedAt: now,
        });

        // 5. Field activities
        const fieldRef = doc(db, COLLECTION_NAME, DOC_FIELD);
        await setDoc(fieldRef, {
          attendance: state.attendance,
          reports: state.reports,
          expenses: state.expenses,
          updatedAt: now,
        });

        // 6. Financials
        const finRef = doc(db, COLLECTION_NAME, DOC_FINANCIALS);
        await setDoc(finRef, {
          invoices: state.invoices,
          receipts: state.receipts,
          vendorBills: state.vendorBills,
          auditorSettlements: state.auditorSettlements,
          journals: state.journals,
          updatedAt: now,
        });

        // 7. Governance
        const govRef = doc(db, COLLECTION_NAME, DOC_GOVERNANCE);
        await setDoc(govRef, {
          notifications: state.notifications.slice(0, 50), // keep latest 50
          auditLogs: state.auditLogs.slice(0, 100), // keep latest 100
          updatedAt: now,
        });

        updateSyncStatus({
          connected: true,
          lastSyncedAt: new Date().toLocaleTimeString(),
          error: null,
        });
        resolve();
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, COLLECTION_NAME);
        updateSyncStatus({ connected: false, error: err.message });
        resolve();
      }
    };

    if (immediate) {
      executePush();
    } else {
      saveTimeout = setTimeout(executePush, 500);
    }
  });
}

/**
 * Initializes real-time Firestore synchronization listeners across all devices.
 * Calls `onRemoteUpdate` whenever another device writes updates to the database.
 */
export function listenToCloudUpdates(
  onRemoteUpdate: (partial: Partial<AppState>) => void
): () => void {
  const unsubs: Unsubscribe[] = [];

  try {
    // 1. Listen to Users document
    const usersRef = doc(db, COLLECTION_NAME, DOC_USERS);
    unsubs.push(
      onSnapshot(
        usersRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.items)) {
              onRemoteUpdate({ users: data.items as UserProfile[] });
              updateSyncStatus({
                connected: true,
                lastSyncedAt: new Date().toLocaleTimeString(),
              });
            }
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_USERS}`)
      )
    );

    // 2. Listen to Entities document
    const entitiesRef = doc(db, COLLECTION_NAME, DOC_ENTITIES);
    unsubs.push(
      onSnapshot(
        entitiesRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const update: Partial<AppState> = {};
            if (Array.isArray(data.vendors)) update.vendors = data.vendors;
            if (Array.isArray(data.auditors)) update.auditors = data.auditors;
            if (Array.isArray(data.clients)) update.clients = data.clients;
            if (Array.isArray(data.taxClients)) update.taxClients = data.taxClients;
            onRemoteUpdate(update);
            updateSyncStatus({
              connected: true,
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_ENTITIES}`)
      )
    );

    // 3. Listen to Operations document
    const opsRef = doc(db, COLLECTION_NAME, DOC_OPERATIONS);
    unsubs.push(
      onSnapshot(
        opsRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const update: Partial<AppState> = {};
            if (Array.isArray(data.projects)) update.projects = data.projects;
            if (Array.isArray(data.locations)) update.locations = data.locations;
            if (Array.isArray(data.assignments)) update.assignments = data.assignments;
            onRemoteUpdate(update);
            updateSyncStatus({
              connected: true,
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_OPERATIONS}`)
      )
    );

    // 4. Listen to Field activities document
    const fieldRef = doc(db, COLLECTION_NAME, DOC_FIELD);
    unsubs.push(
      onSnapshot(
        fieldRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const update: Partial<AppState> = {};
            if (Array.isArray(data.attendance)) update.attendance = data.attendance;
            if (Array.isArray(data.reports)) update.reports = data.reports;
            if (Array.isArray(data.expenses)) update.expenses = data.expenses;
            onRemoteUpdate(update);
            updateSyncStatus({
              connected: true,
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_FIELD}`)
      )
    );

    // 5. Listen to Financials document
    const finRef = doc(db, COLLECTION_NAME, DOC_FINANCIALS);
    unsubs.push(
      onSnapshot(
        finRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const update: Partial<AppState> = {};
            if (Array.isArray(data.invoices)) update.invoices = data.invoices;
            if (Array.isArray(data.receipts)) update.receipts = data.receipts;
            if (Array.isArray(data.vendorBills)) update.vendorBills = data.vendorBills;
            if (Array.isArray(data.auditorSettlements)) update.auditorSettlements = data.auditorSettlements;
            if (Array.isArray(data.journals)) update.journals = data.journals;
            onRemoteUpdate(update);
            updateSyncStatus({
              connected: true,
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_FINANCIALS}`)
      )
    );

    // 6. Listen to Master state document
    const masterRef = doc(db, COLLECTION_NAME, DOC_MASTER);
    unsubs.push(
      onSnapshot(
        masterRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const update: Partial<AppState> = {};
            if (data.adminPassword) update.adminPassword = data.adminPassword;
            if (data.organization) update.organization = data.organization;
            if (data.rolePermissions) update.rolePermissions = data.rolePermissions;
            if (data.smtpConfig) update.smtpConfig = data.smtpConfig;
            onRemoteUpdate(update);
            updateSyncStatus({
              connected: true,
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, `${COLLECTION_NAME}/${DOC_MASTER}`)
      )
    );
  } catch (err: any) {
    handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
  }

  return () => {
    unsubs.forEach((unsub) => unsub());
  };
}
