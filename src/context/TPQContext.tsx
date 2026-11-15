import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  onSnapshot,
  query,
  where,
  doc,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  SantriPublicSummary,
  checkIsAdminUser,
  collectionRef,
  createDokumentasiInFirestore,
  createSyahriahInFirestore,
  deleteAsatidzFromFirestore,
  deleteDokumentasiFromFirestore,
  deleteProgressLogFromFirestore,
  deleteSantriFromFirestore,
  seedInitialDataIfEmpty,
  syncAbsensiAsatidzBatchToFirestore,
  syncAbsensiSantriBatchToFirestore,
  syncAsatidzToFirestore,
  syncHafalanMasterToFirestore,
  syncHafalanStatusToFirestore,
  syncLaporanKeuanganListToFirestore,
  syncProgressLogToFirestore,
  syncSantriToFirestore,
  syncTPQProfileToFirestore,
  updateSyahriahStatusInFirestore,
  upsertUserProfileDoc,
} from '../services/firestoreSync';
import {
  Role,
  User,
  TPQProfile,
  Asatidz,
  Santri,
  AbsensiSantri,
  AbsensiAsatidz,
  SuratJuz30,
  HafalanMasterItem,
  SantriHafalanStatus,
  LogProgressHarian,
  PembayaranSyahriah,
  LaporanKeuangan,
  DokumentasiKegiatan,
} from '../types';
import {
  SURAT_JUZ_30,
  INITIAL_TPQ_PROFILE,
  INITIAL_ASATIDZ,
  INITIAL_SANTRI,
  INITIAL_HAFALAN_MASTER,
  INITIAL_HAFALAN_STATUS,
  INITIAL_PROGRESS_LOG,
  INITIAL_ABSENSI_SANTRI,
  INITIAL_ABSENSI_ASATIDZ,
  INITIAL_SYAHRIAH,
  INITIAL_LAPORAN_KEUANGAN,
  INITIAL_DOKUMENTASI,
} from '../data/initialData';

interface TPQContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  firebaseReady: boolean;
  isFirebaseAdmin: boolean;
  firebaseSyncStatus: 'local' | 'connecting' | 'synced' | 'error';
  tpqProfile: TPQProfile;
  asatidzList: Asatidz[];
  santriList: Santri[];
  santriPublicList: SantriPublicSummary[];
  hafalanMaster: HafalanMasterItem[];
  santriHafalanStatus: SantriHafalanStatus[];
  progressLogs: LogProgressHarian[];
  absensiSantri: AbsensiSantri[];
  absensiAsatidz: AbsensiAsatidz[];
  syahriahList: PembayaranSyahriah[];
  laporanKeuangan: LaporanKeuangan[];
  dokumentasiList: DokumentasiKegiatan[];

  // Auth
  login: (identifier: string, password?: string, targetRole?: Role) => { success: boolean; message: string };
  loginWithGoogle: (targetRole?: Role) => Promise<{ success: boolean; message: string }>;
  loginDemo: (role: 'santri') => void;
  logout: () => void;
  registerAccount: (data: {
    nama: string;
    username: string;
    email: string;
    password: string;
    role?: Role;
  }) => { success: boolean; message: string };
  resetPasswordRequest: (identifier: string) => { success: boolean; message: string };

  // Profile TPQ
  updateTPQProfile: (profile: TPQProfile) => void;

  // Asatidz CRUD
  addAsatidz: (asatidz: Omit<Asatidz, 'id'>) => void;
  updateAsatidz: (id: string, asatidz: Partial<Asatidz>) => void;
  deleteAsatidz: (id: string) => void;

  // Santri CRUD
  addSantri: (santri: Omit<Santri, 'id' | 'username'> & { username?: string }) => Santri;
  importSantriBatch: (santriItems: Array<Omit<Santri, 'id' | 'username'> & { username?: string }>) => number;
  updateSantri: (id: string, santri: Partial<Santri>) => void;
  deleteSantri: (id: string) => void;

  // Absensi
  saveAbsensiSantri: (date: string, records: { santriId: string; status: AbsensiSantri['status']; keterangan?: string }[]) => void;
  saveAbsensiAsatidz: (date: string, records: { asatidzId: string; jamMasuk: string; status: AbsensiAsatidz['status']; keterangan?: string }[]) => void;

  // Hafalan & Progress
  addCustomHafalan: (item: { judul: string; kategori: HafalanMasterItem['kategori']; deskripsi?: string; arabic?: string }) => void;
  toggleHafalanStatus: (santriId: string, hafalanId: string, lancar: boolean, catatan?: string) => void;
  addProgressLog: (log: Omit<LogProgressHarian, 'id'>) => void;
  updateProgressLog: (id: string, log: Partial<LogProgressHarian>) => void;
  deleteProgressLog: (id: string) => void;

  // Syahriah & Finance
  bayarSyahriah: (payment: Omit<PembayaranSyahriah, 'id' | 'status'> & { status?: PembayaranSyahriah['status'] }) => void;
  verifikasiSyahriah: (id: string, status: PembayaranSyahriah['status'], verifiedBy?: string) => void;
  cancelSyahriah: (id: string, alasan?: string) => void;

  // Laporan Keuangan
  addLaporanKeuangan: (item: Omit<LaporanKeuangan, 'id' | 'no' | 'saldo'>) => void;
  updateLaporanKeuangan: (id: string, item: Partial<Omit<LaporanKeuangan, 'id' | 'no' | 'saldo'>>) => void;
  deleteLaporanKeuangan: (id: string) => void;

  // Dokumentasi
  addDokumentasi: (item: Omit<DokumentasiKegiatan, 'id'>) => void;
  deleteDokumentasi: (id: string) => void;

  // Reset to demo
  resetAllData: () => void;
}

const STORAGE_KEYS = {
  CURRENT_USER: 'tpq_user_v2',
  PROFILE: 'tpq_profile_v2',
  ASATIDZ: 'tpq_asatidz_v2',
  SANTRI: 'tpq_santri_v2',
  HAFALAN_MASTER: 'tpq_hafalan_master_v2',
  HAFALAN_STATUS: 'tpq_hafalan_status_v2',
  PROGRESS_LOG: 'tpq_progress_log_v2',
  ABS_SANTRI: 'tpq_abs_santri_v2',
  ABS_ASATIDZ: 'tpq_abs_asatidz_v2',
  SYAHRIAH: 'tpq_syahriah_v2',
  KEUANGAN: 'tpq_keuangan_v2',
  DOKUMENTASI: 'tpq_dokumentasi_v2',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage error for key:', key, err);
  }
}

// Convert 37 Juz 30 Surahs into HafalanMasterItems
const ALL_INITIAL_HAFALAN_MASTER: HafalanMasterItem[] = [
  ...SURAT_JUZ_30.map((s: SuratJuz30) => ({
    id: `surat-${s.nomor}`,
    kategori: 'surat' as const,
    judul: `Surat ${s.nama} (${s.nomor})`,
    deskripsi: `${s.arti} · ${s.ayatCount} Ayat`,
  })),
  ...INITIAL_HAFALAN_MASTER,
];

const TPQContext = createContext<TPQContextType | undefined>(undefined);

export const TPQProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() =>
    loadStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null)
  );
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<'local' | 'connecting' | 'synced' | 'error'>('local');

  const [tpqProfile, setTpqProfile] = useState<TPQProfile>(() =>
    loadStorage<TPQProfile>(STORAGE_KEYS.PROFILE, INITIAL_TPQ_PROFILE)
  );
  const [asatidzList, setAsatidzList] = useState<Asatidz[]>(() =>
    loadStorage<Asatidz[]>(STORAGE_KEYS.ASATIDZ, INITIAL_ASATIDZ)
  );
  const [santriList, setSantriList] = useState<Santri[]>(() =>
    loadStorage<Santri[]>(STORAGE_KEYS.SANTRI, INITIAL_SANTRI)
  );
  const [firestoreSantriPublic, setFirestoreSantriPublic] = useState<SantriPublicSummary[] | null>(null);
  const [hafalanMaster, setHafalanMaster] = useState<HafalanMasterItem[]>(() =>
    loadStorage<HafalanMasterItem[]>(STORAGE_KEYS.HAFALAN_MASTER, ALL_INITIAL_HAFALAN_MASTER)
  );
  const [santriHafalanStatus, setSantriHafalanStatus] = useState<SantriHafalanStatus[]>(() =>
    loadStorage<SantriHafalanStatus[]>(STORAGE_KEYS.HAFALAN_STATUS, INITIAL_HAFALAN_STATUS)
  );
  const [progressLogs, setProgressLogs] = useState<LogProgressHarian[]>(() =>
    loadStorage<LogProgressHarian[]>(STORAGE_KEYS.PROGRESS_LOG, INITIAL_PROGRESS_LOG)
  );
  const [absensiSantri, setAbsensiSantri] = useState<AbsensiSantri[]>(() =>
    loadStorage<AbsensiSantri[]>(STORAGE_KEYS.ABS_SANTRI, INITIAL_ABSENSI_SANTRI)
  );
  const [absensiAsatidz, setAbsensiAsatidz] = useState<AbsensiAsatidz[]>(() =>
    loadStorage<AbsensiAsatidz[]>(STORAGE_KEYS.ABS_ASATIDZ, INITIAL_ABSENSI_ASATIDZ)
  );
  const [syahriahList, setSyahriahList] = useState<PembayaranSyahriah[]>(() =>
    loadStorage<PembayaranSyahriah[]>(STORAGE_KEYS.SYAHRIAH, INITIAL_SYAHRIAH)
  );
  const [laporanKeuangan, setLaporanKeuangan] = useState<LaporanKeuangan[]>(() =>
    loadStorage<LaporanKeuangan[]>(STORAGE_KEYS.KEUANGAN, INITIAL_LAPORAN_KEUANGAN)
  );
  const [dokumentasiList, setDokumentasiList] = useState<DokumentasiKegiatan[]>(() =>
    loadStorage<DokumentasiKegiatan[]>(STORAGE_KEYS.DOKUMENTASI, INITIAL_DOKUMENTASI)
  );

  // Track ownerUid per santriId for relational Firestore rules
  const santriOwnerMapRef = useRef<Record<string, string>>({});

  // Sync state to LocalStorage
  useEffect(() => saveStorage(STORAGE_KEYS.CURRENT_USER, currentUser), [currentUser]);
  useEffect(() => saveStorage(STORAGE_KEYS.PROFILE, tpqProfile), [tpqProfile]);
  useEffect(() => saveStorage(STORAGE_KEYS.ASATIDZ, asatidzList), [asatidzList]);
  useEffect(() => saveStorage(STORAGE_KEYS.SANTRI, santriList), [santriList]);
  useEffect(() => saveStorage(STORAGE_KEYS.HAFALAN_MASTER, hafalanMaster), [hafalanMaster]);
  useEffect(() => saveStorage(STORAGE_KEYS.HAFALAN_STATUS, santriHafalanStatus), [santriHafalanStatus]);
  useEffect(() => saveStorage(STORAGE_KEYS.PROGRESS_LOG, progressLogs), [progressLogs]);
  useEffect(() => saveStorage(STORAGE_KEYS.ABS_SANTRI, absensiSantri), [absensiSantri]);
  useEffect(() => saveStorage(STORAGE_KEYS.ABS_ASATIDZ, absensiAsatidz), [absensiAsatidz]);
  useEffect(() => saveStorage(STORAGE_KEYS.SYAHRIAH, syahriahList), [syahriahList]);
  useEffect(() => saveStorage(STORAGE_KEYS.KEUANGAN, laporanKeuangan), [laporanKeuangan]);
  useEffect(() => saveStorage(STORAGE_KEYS.DOKUMENTASI, dokumentasiList), [dokumentasiList]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setIsFirebaseAdmin(false);
        setFirebaseSyncStatus('local');
        setFirestoreSantriPublic(null);
        setFirebaseReady(true);
        return;
      }

      setFirebaseSyncStatus('connecting');
      try {
        const adminStatus = await checkIsAdminUser(fbUser.uid, fbUser.email);
        setIsFirebaseAdmin(adminStatus);

        if (adminStatus) {
          await seedInitialDataIfEmpty({
            adminUid: fbUser.uid,
            adminEmail: fbUser.email || BOOTSTRAPPED_ADMIN_EMAIL,
            adminName: fbUser.displayName || 'Dewan Asatidz',
            tpqProfile,
            asatidzList,
            santriList,
            hafalanMaster,
            santriHafalanStatus,
            progressLogs,
            absensiSantri,
            absensiAsatidz,
            syahriahList,
            laporanKeuangan,
            dokumentasiList,
          });
        }

        await upsertUserProfileDoc({
          uid: fbUser.uid,
          role: adminStatus ? 'asatidz' : 'santri',
          nama: fbUser.displayName || (adminStatus ? 'Dewan Asatidz' : 'Wali Santri'),
          email: fbUser.email || 'user@tpq.com',
        });

        setFirebaseSyncStatus('synced');
      } catch (err) {
        console.error('Firebase initialization warning:', err);
        setFirebaseSyncStatus('error');
      } finally {
        setFirebaseReady(true);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time Firestore listeners (ONLY when firebaseUser is authenticated)
  useEffect(() => {
    if (!firebaseReady || !firebaseUser) return;

    const unsubscribers: Array<() => void> = [];

    // 1. TPQ Profile (public read for signed-in users)
    unsubscribers.push(
      onSnapshot(
        doc(db, 'tpq_profile', 'main'),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setTpqProfile({
              nama: d.nama || INITIAL_TPQ_PROFILE.nama,
              logo: d.logo || INITIAL_TPQ_PROFILE.logo,
              alamat: d.alamat || INITIAL_TPQ_PROFILE.alamat,
              tahunBerdiri: d.tahunBerdiri || INITIAL_TPQ_PROFILE.tahunBerdiri,
              badanHukum: d.badanHukum || INITIAL_TPQ_PROFILE.badanHukum,
              noSkKemenag: d.noSkKemenag || INITIAL_TPQ_PROFILE.noSkKemenag,
              telepon: d.telepon || INITIAL_TPQ_PROFILE.telepon,
              email: d.email || INITIAL_TPQ_PROFILE.email,
              rekeningList: Array.isArray(d.rekeningList) ? d.rekeningList : INITIAL_TPQ_PROFILE.rekeningList,
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'tpq_profile/main')
      )
    );

    // 2. Public Curriculum (Hafalan Master)
    const hafalanQuery = isFirebaseAdmin
      ? collectionRef('hafalan_master')
      : query(collectionRef('hafalan_master'), where('isPublicCurriculum', '==', true));
    unsubscribers.push(
      onSnapshot(
        hafalanQuery,
        (snap) => {
          if (!snap.empty) {
            setHafalanMaster(
              snap.docs.map((d) => ({
                id: d.id,
                kategori: d.data().kategori,
                judul: d.data().judul,
                deskripsi: d.data().deskripsi,
                arabic: d.data().arabic,
              }))
            );
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'hafalan_master')
      )
    );

    // 3. Public Cash Ledger
    const kasQuery = isFirebaseAdmin
      ? collectionRef('laporan_keuangan')
      : query(collectionRef('laporan_keuangan'), where('isPublicReport', '==', true));
    unsubscribers.push(
      onSnapshot(
        kasQuery,
        (snap) => {
          if (!snap.empty) {
            const items: LaporanKeuangan[] = snap.docs
              .map((d) => ({
                id: d.id,
                no: Number(d.data().no) || 1,
                tanggal: d.data().tanggal || '',
                uraian: d.data().uraian || '',
                jenis: d.data().jenis,
                nominal: Number(d.data().nominal) || 0,
                saldo: Number(d.data().saldo) || 0,
                keterangan: d.data().keterangan,
              }))
              .sort((a, b) => a.no - b.no);
            setLaporanKeuangan(items);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'laporan_keuangan')
      )
    );

    // 4. Public Activity Gallery
    const dokQuery = isFirebaseAdmin
      ? collectionRef('dokumentasi')
      : query(collectionRef('dokumentasi'), where('isPublicGallery', '==', true));
    unsubscribers.push(
      onSnapshot(
        dokQuery,
        (snap) => {
          if (!snap.empty) {
            setDokumentasiList(
              snap.docs.map((d) => ({
                id: d.id,
                judul: d.data().judul || '',
                tanggal: d.data().tanggal || '',
                kategori: d.data().kategori || 'Kegiatan',
                deskripsi: d.data().deskripsi || '',
                fotoUrl: d.data().fotoUrl || '',
                dibuatOleh: d.data().dibuatOleh || 'Asatidz',
              }))
            );
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'dokumentasi')
      )
    );

    // 5. Santri Public Summary (for Syahriah transparency board)
    const santriPublicQuery = isFirebaseAdmin
      ? collectionRef('santri_public')
      : query(collectionRef('santri_public'), where('isPublicSummary', '==', true));
    unsubscribers.push(
      onSnapshot(
        santriPublicQuery,
        (snap) => {
          if (!snap.empty) {
            setFirestoreSantriPublic(
              snap.docs.map((d) => ({
                id: d.id,
                nama: d.data().nama || '',
                jilid: d.data().jilid || '',
                foto: d.data().foto,
                paidMonths: Array.isArray(d.data().paidMonths) ? d.data().paidMonths : [],
              }))
            );
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'santri_public')
      )
    );

    // 6. Role-scoped private collections
    if (isFirebaseAdmin) {
      unsubscribers.push(
        onSnapshot(
          collectionRef('asatidz'),
          (snap) => {
            if (!snap.empty) {
              setAsatidzList(
                snap.docs.map((d) => ({
                  id: d.id,
                  nama: d.data().nama || '',
                  nik: d.data().nik || '',
                  username: d.data().username,
                  password: d.data().password,
                  tempatLahir: d.data().tempatLahir || '',
                  tanggalLahir: d.data().tanggalLahir || '',
                  pendidikan: d.data().pendidikan || '',
                  mengajar: d.data().mengajar || 'Iqro',
                  alamat: d.data().alamat || '',
                  tanggalMulaiTugas: d.data().tanggalMulaiTugas || '',
                  foto: d.data().foto || '',
                  noHp: d.data().noHp || '',
                  statusAktif: d.data().statusAktif !== false,
                }))
              );
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'asatidz')
        )
      );

      unsubscribers.push(
        onSnapshot(
          collectionRef('absensi_asatidz'),
          (snap) => {
            if (!snap.empty) {
              setAbsensiAsatidz(
                snap.docs.map((d) => ({
                  id: d.id,
                  tanggal: d.data().tanggal || '',
                  asatidzId: d.data().asatidzId || '',
                  jamMasuk: d.data().jamMasuk || '',
                  status: d.data().status,
                  keterangan: d.data().keterangan,
                }))
              );
            }
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'absensi_asatidz')
        )
      );
    }

    const santriQuery = isFirebaseAdmin
      ? collectionRef('santri')
      : query(collectionRef('santri'), where('ownerUid', '==', firebaseUser.uid));
    unsubscribers.push(
      onSnapshot(
        santriQuery,
        (snap) => {
          if (isFirebaseAdmin && snap.empty) return;
          const map: Record<string, string> = {};
          const items: Santri[] = snap.docs.map((d) => {
            const data = d.data();
            map[d.id] = data.ownerUid || firebaseUser.uid;
            return {
              id: d.id,
              nama: data.nama || '',
              nik: data.nik || '',
              tempatLahir: data.tempatLahir || '',
              tanggalLahir: data.tanggalLahir || '',
              alamat: data.alamat || '',
              terdaftarTanggal: data.terdaftarTanggal || '',
              foto: data.foto || '',
              namaWali: data.namaWali || '',
              noHpWali: data.noHpWali || '',
              jilid: data.jilid || 'Jilid 1',
              username: data.username || '',
              password: data.password || 'santri123',
              jenisKelamin: data.jenisKelamin === 'P' ? 'P' : 'L',
            };
          });
          santriOwnerMapRef.current = map;
          if (items.length > 0) {
            setSantriList(items);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'santri')
      )
    );

    const statusQuery = isFirebaseAdmin
      ? collectionRef('hafalan_status')
      : query(collectionRef('hafalan_status'), where('ownerUid', '==', firebaseUser.uid));
    unsubscribers.push(
      onSnapshot(
        statusQuery,
        (snap) => {
          if (isFirebaseAdmin && snap.empty) return;
          setSantriHafalanStatus(
            snap.docs.map((d) => ({
              id: d.id,
              santriId: d.data().santriId,
              hafalanId: d.data().hafalanId,
              lancar: Boolean(d.data().lancar),
              tanggalLancar: d.data().tanggalLancar,
              catatan: d.data().catatan,
            }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'hafalan_status')
      )
    );

    const logQuery = isFirebaseAdmin
      ? collectionRef('progress_logs')
      : query(collectionRef('progress_logs'), where('ownerUid', '==', firebaseUser.uid));
    unsubscribers.push(
      onSnapshot(
        logQuery,
        (snap) => {
          if (isFirebaseAdmin && snap.empty) return;
          setProgressLogs(
            snap.docs.map((d) => ({
              id: d.id,
              santriId: d.data().santriId,
              tanggal: d.data().tanggal,
              jenisBacaan: d.data().jenisBacaan,
              jilidAtauSurat: d.data().jilidAtauSurat,
              halamanAyat: d.data().halamanAyat || '',
              lancar: Boolean(d.data().lancar),
              catatanGuru: d.data().catatanGuru || '',
              asatidzNama: d.data().asatidzNama,
            }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'progress_logs')
      )
    );

    const absSantriQuery = isFirebaseAdmin
      ? collectionRef('absensi_santri')
      : query(collectionRef('absensi_santri'), where('ownerUid', '==', firebaseUser.uid));
    unsubscribers.push(
      onSnapshot(
        absSantriQuery,
        (snap) => {
          if (isFirebaseAdmin && snap.empty) return;
          setAbsensiSantri(
            snap.docs.map((d) => ({
              id: d.id,
              tanggal: d.data().tanggal,
              santriId: d.data().santriId,
              status: d.data().status,
              keterangan: d.data().keterangan,
            }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'absensi_santri')
      )
    );

    const syahriahQuery = isFirebaseAdmin
      ? collectionRef('syahriah')
      : query(collectionRef('syahriah'), where('ownerUid', '==', firebaseUser.uid));
    unsubscribers.push(
      onSnapshot(
        syahriahQuery,
        (snap) => {
          if (isFirebaseAdmin && snap.empty) return;
          setSyahriahList(
            snap.docs.map((d) => ({
              id: d.id,
              santriId: d.data().santriId,
              bulanList: Array.isArray(d.data().bulanList) ? d.data().bulanList : [],
              nominalPerBulan: Number(d.data().nominalPerBulan) || 50000,
              totalNominal: Number(d.data().totalNominal) || 50000,
              tanggalBayar: d.data().tanggalBayar || '',
              metode: d.data().metode || 'Transfer Bank',
              bankTujuan: d.data().bankTujuan,
              buktiTransferUrl: d.data().buktiTransferUrl,
              status: d.data().status || 'Menunggu Konfirmasi',
              catatan: d.data().catatan,
              diverifikasiOleh: d.data().diverifikasiOleh,
            }))
          );
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'syahriah')
      )
    );

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [firebaseReady, firebaseUser, isFirebaseAdmin]);

  // Derived Santri Public Summary List (falls back to local state when offline/unauthenticated)
  const santriPublicList = useMemo<SantriPublicSummary[]>(() => {
    if (firestoreSantriPublic && firestoreSantriPublic.length > 0) {
      return firestoreSantriPublic;
    }
    return santriList.map((s) => {
      const paidSet = new Set<string>();
      syahriahList
        .filter((p) => p.santriId === s.id && p.status === 'Lunas')
        .forEach((p) => p.bulanList.forEach((m) => paidSet.add(m)));
      return {
        id: s.id,
        nama: s.nama,
        jilid: s.jilid,
        foto: s.foto,
        paidMonths: Array.from(paidSet),
      };
    });
  }, [firestoreSantriPublic, santriList, syahriahList]);

  // Validate active session belongs to a real record for its role (or verified Google session)
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'asatidz') {
      const validGoogleAdmin =
        Boolean(firebaseUser) &&
        isFirebaseAdmin &&
        currentUser.email?.toLowerCase() === firebaseUser?.email?.toLowerCase();
      const validAsatidz =
        validGoogleAdmin ||
        asatidzList.some(
          (a) =>
            (currentUser.asatidzId && a.id === currentUser.asatidzId) ||
            a.nik === currentUser.username ||
            (a.username && a.username === currentUser.username)
        );
      if (!validAsatidz) {
        setCurrentUser(null);
      }
    } else if (currentUser.role === 'santri') {
      const validGoogleSantri =
        Boolean(firebaseUser) &&
        currentUser.id === `fb-${firebaseUser?.uid}`;
      const validSantri =
        validGoogleSantri ||
        santriList.some(
          (s) =>
            (currentUser.santriId && s.id === currentUser.santriId) ||
            s.username === currentUser.username
        );
      if (!validSantri) {
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  }, [currentUser, asatidzList, santriList, firebaseUser, isFirebaseAdmin]);

  // Helper to resolve ownerUid for a given santriId
  const getOwnerUidForSantri = (santriId: string): string => {
    return santriOwnerMapRef.current[santriId] || firebaseUser?.uid || 'unclaimed';
  };

  // Auth functions
  const login = (
    identifier: string,
    password?: string,
    targetRole: Role = 'santri'
  ): { success: boolean; message: string } => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPassword = password?.trim() || '';

    if (!cleanId) {
      return { success: false, message: 'Mohon masukkan NIK atau username akun Anda.' };
    }

    if (!cleanPassword) {
      return { success: false, message: 'Kata sandi wajib diisi untuk masuk.' };
    }

    const matchedSantri = santriList.find(
      (s) =>
        s.username.toLowerCase() === cleanId ||
        s.nik.toLowerCase() === cleanId ||
        `${s.nik.toLowerCase()}@tpq.com` === cleanId
    );

    const matchedAsatidz = asatidzList.find(
      (a) =>
        a.nik.toLowerCase() === cleanId ||
        (a.username && a.username.toLowerCase() === cleanId)
    );

    if (targetRole === 'asatidz') {
      if (matchedSantri && !matchedAsatidz) {
        return {
          success: false,
          message: 'Akses ditolak: Akun Santri / Orang Tua tidak dapat masuk ke role Asatidz.',
        };
      }

      if (!matchedAsatidz) {
        return {
          success: false,
          message: 'Akun Asatidz tidak ditemukan. Gunakan NIK atau Username Asatidz yang terdaftar.',
        };
      }

      const expectedPassword = matchedAsatidz.password || 'asatidz123';
      if (cleanPassword !== expectedPassword) {
        return {
          success: false,
          message: 'Kata sandi Asatidz tidak sesuai.',
        };
      }

      const user: User = {
        id: `user-${matchedAsatidz.id}`,
        role: 'asatidz',
        nama: matchedAsatidz.nama,
        username: matchedAsatidz.username || matchedAsatidz.nik,
        foto: matchedAsatidz.foto,
        asatidzId: matchedAsatidz.id,
      };
      setCurrentUser(user);
      return { success: true, message: `Ahlan wa Sahlan, ${matchedAsatidz.nama}` };
    }

    if (!matchedSantri) {
      if (matchedAsatidz) {
        return {
          success: false,
          message: 'Akun ini terdaftar sebagai Dewan Asatidz. Silakan pilih tab login Dewan Asatidz.',
        };
      }
      return {
        success: false,
        message: 'Akun Santri tidak ditemukan. Pastikan username (NIK@tpq.com) atau NIK sudah benar.',
      };
    }

    const expectedSantriPassword = matchedSantri.password || 'santri123';
    if (cleanPassword !== expectedSantriPassword) {
      return {
        success: false,
        message: 'Kata sandi santri tidak sesuai. Silakan hubungi asatidz.',
      };
    }

    const user: User = {
      id: `user-${matchedSantri.id}`,
      role: 'santri',
      nama: matchedSantri.nama,
      username: matchedSantri.username,
      foto: matchedSantri.foto,
      santriId: matchedSantri.id,
    };
    setCurrentUser(user);
    return { success: true, message: `Selamat datang santri kami, ${matchedSantri.nama}` };
  };

  // Google Sign-In via Firebase Authentication
  const loginWithGoogle = async (targetRole?: Role): Promise<{ success: boolean; message: string }> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const adminStatus = await checkIsAdminUser(fbUser.uid, fbUser.email);

      if (targetRole === 'asatidz' && !adminStatus) {
        await signOut(auth);
        return {
          success: false,
          message: 'Akses ditolak: Akun Google ini bukan akun Dewan Asatidz terverifikasi.',
        };
      }

      if (adminStatus && targetRole !== 'santri') {
        const matchedUst = asatidzList[0] || INITIAL_ASATIDZ[0];
        const user: User = {
          id: `fb-${fbUser.uid}`,
          role: 'asatidz',
          nama: fbUser.displayName || matchedUst.nama,
          username: fbUser.email || matchedUst.nik,
          email: fbUser.email || undefined,
          foto: fbUser.photoURL || matchedUst.foto,
          asatidzId: matchedUst.id,
        };
        setIsFirebaseAdmin(true);
        setCurrentUser(user);
        return { success: true, message: `Berhasil terhubung ke Firebase sebagai ${user.nama}` };
      }

      // Santri / Wali Google Sign-In
      const firstSantri = santriList[0] || INITIAL_SANTRI[0];
      const user: User = {
        id: `fb-${fbUser.uid}`,
        role: 'santri',
        nama: fbUser.displayName || firstSantri.nama,
        username: fbUser.email || firstSantri.username,
        email: fbUser.email || undefined,
        foto: fbUser.photoURL || firstSantri.foto,
        santriId: firstSantri.id,
      };
      setCurrentUser(user);
      return { success: true, message: `Selamat datang di Portal Santri, ${user.nama}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal login dengan Google';
      if (msg.includes('popup-closed-by-user')) {
        return { success: false, message: 'Login Google dibatalkan.' };
      }
      return { success: false, message: `Autentikasi Firebase gagal: ${msg}` };
    }
  };

  // Demo login strictly limited to Santri portal only
  const loginDemo = (role: 'santri') => {
    if (role !== 'santri') return;
    const first = santriList[0] || INITIAL_SANTRI[0];
    setCurrentUser({
      id: `user-${first.id}`,
      role: 'santri',
      nama: first.nama,
      username: first.username,
      foto: first.foto,
      santriId: first.id,
    });
  };

  const logout = () => {
    setCurrentUser(null);
    if (auth.currentUser) {
      void signOut(auth);
    }
  };

  // Self-registration strictly restricted to Santri / Orang Tua
  const registerAccount = (data: {
    nama: string;
    username: string;
    email: string;
    password: string;
    role?: Role;
  }) => {
    if (data.role === 'asatidz') {
      return {
        success: false,
        message: 'Pendaftaran mandiri hanya untuk Santri / Orang Tua. Akun Asatidz hanya dibuat oleh pengurus TPQ.',
      };
    }

    const rawInput = data.username.trim();
    const nik = rawInput.includes('@') ? rawInput.split('@')[0].trim() : rawInput;
    const generatedUsername = `${nik}@tpq.com`;

    const duplicateSantri = santriList.some(
      (s) => s.nik.toLowerCase() === nik.toLowerCase() || s.username.toLowerCase() === generatedUsername.toLowerCase()
    );
    if (duplicateSantri) {
      return {
        success: false,
        message: 'NIK tersebut sudah terdaftar. Silakan masuk menggunakan NIK & kata sandi Anda.',
      };
    }

    const newSantri: Santri = {
      id: `san-${Date.now()}`,
      nama: data.nama.trim(),
      nik,
      tempatLahir: 'Semarang',
      tanggalLahir: '2018-01-01',
      alamat: 'Semarang',
      terdaftarTanggal: new Date().toISOString().slice(0, 10),
      foto: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=300&q=80',
      namaWali: 'Wali ' + data.nama.trim(),
      noHpWali: '0812-9988-7766',
      jilid: 'Jilid 1',
      username: generatedUsername,
      password: data.password.trim() || 'santri123',
      jenisKelamin: 'L',
    };
    setSantriList((prev) => [newSantri, ...prev]);

    if (firebaseUser) {
      void syncSantriToFirestore(newSantri, firebaseUser.uid, syahriahList, true);
    }

    setCurrentUser({
      id: `user-${newSantri.id}`,
      role: 'santri',
      nama: newSantri.nama,
      username: newSantri.username,
      email: data.email,
      foto: newSantri.foto,
      santriId: newSantri.id,
    });
    return { success: true, message: 'Pendaftaran Santri berhasil! Anda sudah masuk ke portal santri.' };
  };

  const resetPasswordRequest = (identifier: string): { success: boolean; message: string } => {
    return {
      success: true,
      message: `Tautan reset sandi telah dipersiapkan untuk "${identifier}". Silakan hubungi Sekretariat Asatidz jika perlu reset manual instan.`,
    };
  };

  const updateTPQProfile = (profile: TPQProfile) => {
    setTpqProfile(profile);
    if (firebaseUser && isFirebaseAdmin) {
      void syncTPQProfileToFirestore(profile);
    }
  };

  // Asatidz CRUD
  const addAsatidz = (asatidzData: Omit<Asatidz, 'id'>) => {
    const newAsatidz: Asatidz = {
      ...asatidzData,
      id: `ust-${Date.now()}`,
      username: asatidzData.username?.trim() || undefined,
      password: asatidzData.password?.trim() || 'asatidz123',
    };
    setAsatidzList((prev) => [newAsatidz, ...prev]);
    if (firebaseUser && isFirebaseAdmin) {
      void syncAsatidzToFirestore(newAsatidz);
    }
  };

  const updateAsatidz = (id: string, updated: Partial<Asatidz>) => {
    setAsatidzList((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...updated } : a));
      if (firebaseUser && isFirebaseAdmin) {
        const target = next.find((a) => a.id === id);
        if (target) void syncAsatidzToFirestore(target);
      }
      return next;
    });
  };

  const deleteAsatidz = (id: string) => {
    setAsatidzList((prev) => prev.filter((a) => a.id !== id));
    if (firebaseUser && isFirebaseAdmin) {
      void deleteAsatidzFromFirestore(id);
    }
  };

  // Santri CRUD
  const addSantri = (santriData: Omit<Santri, 'id' | 'username'> & { username?: string }): Santri => {
    const generatedUsername = santriData.username || `${santriData.nik.trim()}@tpq.com`;
    const newSantri: Santri = {
      ...santriData,
      id: `san-${Date.now()}`,
      username: generatedUsername,
      password: santriData.password || 'santri123',
    };
    setSantriList((prev) => [newSantri, ...prev]);
    if (firebaseUser && isFirebaseAdmin) {
      void syncSantriToFirestore(newSantri, firebaseUser.uid, syahriahList, true);
    }
    return newSantri;
  };

  const importSantriBatch = (santriItems: Array<Omit<Santri, 'id' | 'username'> & { username?: string }>): number => {
    const defaultBoyPhotos = [
      'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
    ];
    const defaultGirlPhotos = [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    ];

    const newSantriList: Santri[] = santriItems.map((item, idx) => {
      const cleanNik = item.nik.trim();
      const generatedUsername = item.username || `${cleanNik}@tpq.com`;
      const isFemale = item.jenisKelamin === 'P';
      const fallbackPhoto = isFemale
        ? defaultGirlPhotos[idx % defaultGirlPhotos.length]
        : defaultBoyPhotos[idx % defaultBoyPhotos.length];

      return {
        ...item,
        id: `san-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        nik: cleanNik,
        foto: item.foto && item.foto.trim() ? item.foto.trim() : fallbackPhoto,
        username: generatedUsername,
        password: item.password || 'santri123',
        terdaftarTanggal: item.terdaftarTanggal || new Date().toISOString().slice(0, 10),
      };
    });

    setSantriList((prev) => [...newSantriList, ...prev]);
    if (firebaseUser && isFirebaseAdmin) {
      newSantriList.forEach((item) => {
        void syncSantriToFirestore(item, firebaseUser.uid, syahriahList, true);
      });
    }
    return newSantriList.length;
  };

  const updateSantri = (id: string, updated: Partial<Santri>) => {
    setSantriList((prev) => {
      const next = prev.map((s) => {
        if (s.id !== id) return s;
        const merged = { ...s, ...updated };
        if (updated.nik && !updated.username) {
          merged.username = `${updated.nik.trim()}@tpq.com`;
        }
        return merged;
      });
      if (firebaseUser) {
        const target = next.find((s) => s.id === id);
        if (target) {
          void syncSantriToFirestore(target, getOwnerUidForSantri(id), syahriahList, false);
        }
      }
      return next;
    });
  };

  const deleteSantri = (id: string) => {
    setSantriList((prev) => prev.filter((s) => s.id !== id));
    if (firebaseUser && isFirebaseAdmin) {
      void deleteSantriFromFirestore(id);
    }
  };

  // Absensi
  const saveAbsensiSantri = (date: string, records: { santriId: string; status: AbsensiSantri['status']; keterangan?: string }[]) => {
    const newItems: AbsensiSantri[] = records.map((r, idx) => ({
      id: `abs-s-${Date.now()}-${idx}`,
      tanggal: date,
      santriId: r.santriId,
      status: r.status,
      keterangan: r.keterangan || '',
    }));

    const deletedIds = absensiSantri.filter((item) => item.tanggal === date).map((item) => item.id);
    setAbsensiSantri((prev) => {
      const filtered = prev.filter((item) => item.tanggal !== date);
      return [...newItems, ...filtered];
    });

    if (firebaseUser && isFirebaseAdmin) {
      void syncAbsensiSantriBatchToFirestore(newItems, deletedIds, santriOwnerMapRef.current);
    }
  };

  const saveAbsensiAsatidz = (date: string, records: { asatidzId: string; jamMasuk: string; status: AbsensiAsatidz['status']; keterangan?: string }[]) => {
    const newItems: AbsensiAsatidz[] = records.map((r, idx) => ({
      id: `abs-u-${Date.now()}-${idx}`,
      tanggal: date,
      asatidzId: r.asatidzId,
      jamMasuk: r.jamMasuk,
      status: r.status,
      keterangan: r.keterangan || '',
    }));

    const deletedIds = absensiAsatidz.filter((item) => item.tanggal === date).map((item) => item.id);
    setAbsensiAsatidz((prev) => {
      const filtered = prev.filter((item) => item.tanggal !== date);
      return [...newItems, ...filtered];
    });

    if (firebaseUser && isFirebaseAdmin) {
      void syncAbsensiAsatidzBatchToFirestore(newItems, deletedIds);
    }
  };

  // Hafalan & Progress
  const addCustomHafalan = (item: { judul: string; kategori: HafalanMasterItem['kategori']; deskripsi?: string; arabic?: string }) => {
    const newItem: HafalanMasterItem = {
      id: `haf-custom-${Date.now()}`,
      ...item,
    };
    setHafalanMaster((prev) => [...prev, newItem]);
    if (firebaseUser && isFirebaseAdmin) {
      void syncHafalanMasterToFirestore(newItem);
    }
  };

  const toggleHafalanStatus = (santriId: string, hafalanId: string, lancar: boolean, catatan?: string) => {
    setSantriHafalanStatus((prev) => {
      const existing = prev.find((h) => h.santriId === santriId && h.hafalanId === hafalanId);
      let syncedItem: SantriHafalanStatus;
      let next: SantriHafalanStatus[];
      if (existing) {
        syncedItem = {
          ...existing,
          lancar,
          tanggalLancar: lancar ? new Date().toISOString().slice(0, 10) : undefined,
          catatan: catatan !== undefined ? catatan : existing.catatan,
        };
        next = prev.map((h) => (h.id === existing.id ? syncedItem : h));
      } else {
        syncedItem = {
          id: `hs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          santriId,
          hafalanId,
          lancar,
          tanggalLancar: lancar ? new Date().toISOString().slice(0, 10) : undefined,
          catatan: catatan || '',
        };
        next = [...prev, syncedItem];
      }

      if (firebaseUser && isFirebaseAdmin) {
        void syncHafalanStatusToFirestore(syncedItem, getOwnerUidForSantri(santriId));
      }
      return next;
    });
  };

  const addProgressLog = (logData: Omit<LogProgressHarian, 'id'>) => {
    const newLog: LogProgressHarian = {
      ...logData,
      id: `log-${Date.now()}`,
    };
    setProgressLogs((prev) => [newLog, ...prev]);
    if (firebaseUser && isFirebaseAdmin) {
      void syncProgressLogToFirestore(newLog, getOwnerUidForSantri(newLog.santriId), true);
    }
  };

  const updateProgressLog = (id: string, updated: Partial<LogProgressHarian>) => {
    setProgressLogs((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...updated } : l));
      if (firebaseUser && isFirebaseAdmin) {
        const target = next.find((l) => l.id === id);
        if (target) {
          void syncProgressLogToFirestore(target, getOwnerUidForSantri(target.santriId), false);
        }
      }
      return next;
    });
  };

  const deleteProgressLog = (id: string) => {
    setProgressLogs((prev) => prev.filter((l) => l.id !== id));
    if (firebaseUser && isFirebaseAdmin) {
      void deleteProgressLogFromFirestore(id);
    }
  };

  // Syahriah & Finance
  const bayarSyahriah = (paymentData: Omit<PembayaranSyahriah, 'id' | 'status'> & { status?: PembayaranSyahriah['status'] }) => {
    const newPayment: PembayaranSyahriah = {
      ...paymentData,
      id: `sya-${Date.now()}`,
      status: isFirebaseAdmin || !firebaseUser ? paymentData.status || 'Lunas' : 'Menunggu Konfirmasi',
    };
    const nextSyahriah = [newPayment, ...syahriahList];
    setSyahriahList(nextSyahriah);

    if (firebaseUser) {
      void createSyahriahInFirestore(newPayment, getOwnerUidForSantri(newPayment.santriId));
    }

    if (newPayment.status === 'Lunas') {
      const santri = santriList.find((s) => s.id === newPayment.santriId);
      const santriName = santri ? santri.nama : 'Santri';
      const lastSaldo = laporanKeuangan.length > 0 ? laporanKeuangan[laporanKeuangan.length - 1].saldo : 0;
      const newKas: LaporanKeuangan = {
        id: `kas-${Date.now()}`,
        no: laporanKeuangan.length + 1,
        tanggal: newPayment.tanggalBayar,
        uraian: `Penerimaan Syahriah (${santriName} - ${newPayment.bulanList.join(', ')})`,
        jenis: 'Masuk',
        nominal: newPayment.totalNominal,
        saldo: lastSaldo + newPayment.totalNominal,
        keterangan: newPayment.metode,
      };
      const nextKas = [...laporanKeuangan, newKas];
      setLaporanKeuangan(nextKas);

      if (firebaseUser && isFirebaseAdmin) {
        void syncLaporanKeuanganListToFirestore([newKas]);
        if (santri) {
          void syncSantriToFirestore(santri, getOwnerUidForSantri(santri.id), nextSyahriah, false);
        }
      }
    }
  };

  const verifikasiSyahriah = (id: string, status: PembayaranSyahriah['status'], verifiedBy?: string) => {
    const target = syahriahList.find((s) => s.id === id);
    if (!target) return;

    const nextSyahriah = syahriahList.map((s) =>
      s.id === id ? { ...s, status, diverifikasiOleh: verifiedBy || 'Asatidz' } : s
    );
    setSyahriahList(nextSyahriah);

    if (firebaseUser && isFirebaseAdmin) {
      void updateSyahriahStatusInFirestore(id, {
        status,
        diverifikasiOleh: verifiedBy || 'Asatidz',
      });
    }

    if (status === 'Lunas' && target.status !== 'Lunas') {
      const santri = santriList.find((s) => s.id === target.santriId);
      const santriName = santri ? santri.nama : 'Santri';
      const lastSaldo = laporanKeuangan.length > 0 ? laporanKeuangan[laporanKeuangan.length - 1].saldo : 0;
      const newKas: LaporanKeuangan = {
        id: `kas-${Date.now()}`,
        no: laporanKeuangan.length + 1,
        tanggal: new Date().toISOString().slice(0, 10),
        uraian: `Penerimaan Syahriah (${santriName} - ${target.bulanList.join(', ')})`,
        jenis: 'Masuk',
        nominal: target.totalNominal,
        saldo: lastSaldo + target.totalNominal,
        keterangan: `Verifikasi ${target.metode}`,
      };
      setLaporanKeuangan((prev) => [...prev, newKas]);

      if (firebaseUser && isFirebaseAdmin) {
        void syncLaporanKeuanganListToFirestore([newKas]);
        if (santri) {
          void syncSantriToFirestore(santri, getOwnerUidForSantri(santri.id), nextSyahriah, false);
        }
      }
    }
  };

  const cancelSyahriah = (id: string, alasan?: string) => {
    const target = syahriahList.find((s) => s.id === id);
    if (!target) return;

    const catatanText = alasan ? `${target.catatan ? target.catatan + ' · ' : ''}Batal: ${alasan}` : target.catatan;
    const nextSyahriah = syahriahList.map((s) =>
      s.id === id ? { ...s, status: 'Dibatalkan' as const, catatan: catatanText } : s
    );
    setSyahriahList(nextSyahriah);

    if (firebaseUser && isFirebaseAdmin) {
      void updateSyahriahStatusInFirestore(id, {
        status: 'Dibatalkan',
        catatan: catatanText,
      });
    }

    if (target.status === 'Lunas') {
      const santri = santriList.find((s) => s.id === target.santriId);
      const santriName = santri ? santri.nama : 'Santri';
      const lastSaldo = laporanKeuangan.length > 0 ? laporanKeuangan[laporanKeuangan.length - 1].saldo : 0;
      const reversalKas: LaporanKeuangan = {
        id: `kas-${Date.now()}`,
        no: laporanKeuangan.length + 1,
        tanggal: new Date().toISOString().slice(0, 10),
        uraian: `Koreksi / Pembatalan Syahriah (${santriName} - ${target.bulanList.join(', ')})`,
        jenis: 'Keluar',
        nominal: target.totalNominal,
        saldo: lastSaldo - target.totalNominal,
        keterangan: `Pembatalan: ${alasan || 'Koreksi administrasi'}`,
      };
      setLaporanKeuangan((prev) => [...prev, reversalKas]);

      if (firebaseUser && isFirebaseAdmin) {
        void syncLaporanKeuanganListToFirestore([reversalKas]);
        if (santri) {
          void syncSantriToFirestore(santri, getOwnerUidForSantri(santri.id), nextSyahriah, false);
        }
      }
    }
  };

  // Laporan Keuangan
  const recalculateKas = (list: LaporanKeuangan[]): LaporanKeuangan[] => {
    let runningSaldo = 0;
    return list.map((item, index) => {
      if (item.jenis === 'Masuk') {
        runningSaldo += item.nominal;
      } else {
        runningSaldo -= item.nominal;
      }
      return {
        ...item,
        no: index + 1,
        saldo: runningSaldo,
      };
    });
  };

  const addLaporanKeuangan = (item: Omit<LaporanKeuangan, 'id' | 'no' | 'saldo'>) => {
    setLaporanKeuangan((prev) => {
      const newItem: LaporanKeuangan = {
        ...item,
        id: `kas-${Date.now()}`,
        no: prev.length + 1,
        saldo: 0,
      };
      const recalculated = recalculateKas([...prev, newItem]);
      if (firebaseUser && isFirebaseAdmin) {
        void syncLaporanKeuanganListToFirestore(recalculated);
      }
      return recalculated;
    });
  };

  const updateLaporanKeuangan = (id: string, updated: Partial<Omit<LaporanKeuangan, 'id' | 'no' | 'saldo'>>) => {
    setLaporanKeuangan((prev) => {
      const modified = prev.map((k) => (k.id === id ? { ...k, ...updated } : k));
      const recalculated = recalculateKas(modified);
      if (firebaseUser && isFirebaseAdmin) {
        void syncLaporanKeuanganListToFirestore(recalculated);
      }
      return recalculated;
    });
  };

  const deleteLaporanKeuangan = (id: string) => {
    setLaporanKeuangan((prev) => {
      const recalculated = recalculateKas(prev.filter((k) => k.id !== id));
      if (firebaseUser && isFirebaseAdmin) {
        void syncLaporanKeuanganListToFirestore(recalculated, [id]);
      }
      return recalculated;
    });
  };

  // Dokumentasi
  const addDokumentasi = (item: Omit<DokumentasiKegiatan, 'id'>) => {
    const newItem: DokumentasiKegiatan = {
      ...item,
      id: `dok-${Date.now()}`,
    };
    setDokumentasiList((prev) => [newItem, ...prev]);
    if (firebaseUser && isFirebaseAdmin) {
      void createDokumentasiInFirestore(newItem);
    }
  };

  const deleteDokumentasi = (id: string) => {
    setDokumentasiList((prev) => prev.filter((d) => d.id !== id));
    if (firebaseUser && isFirebaseAdmin) {
      void deleteDokumentasiFromFirestore(id);
    }
  };

  const resetAllData = () => {
    setTpqProfile(INITIAL_TPQ_PROFILE);
    setAsatidzList(INITIAL_ASATIDZ);
    setSantriList(INITIAL_SANTRI);
    setHafalanMaster(ALL_INITIAL_HAFALAN_MASTER);
    setSantriHafalanStatus(INITIAL_HAFALAN_STATUS);
    setProgressLogs(INITIAL_PROGRESS_LOG);
    setAbsensiSantri(INITIAL_ABSENSI_SANTRI);
    setAbsensiAsatidz(INITIAL_ABSENSI_ASATIDZ);
    setSyahriahList(INITIAL_SYAHRIAH);
    setLaporanKeuangan(INITIAL_LAPORAN_KEUANGAN);
    setDokumentasiList(INITIAL_DOKUMENTASI);
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  };

  return (
    <TPQContext.Provider
      value={{
        currentUser,
        firebaseUser,
        firebaseReady,
        isFirebaseAdmin,
        firebaseSyncStatus,
        tpqProfile,
        asatidzList,
        santriList,
        santriPublicList,
        hafalanMaster,
        santriHafalanStatus,
        progressLogs,
        absensiSantri,
        absensiAsatidz,
        syahriahList,
        laporanKeuangan,
        dokumentasiList,
        login,
        loginWithGoogle,
        loginDemo,
        logout,
        registerAccount,
        resetPasswordRequest,
        updateTPQProfile,
        addAsatidz,
        updateAsatidz,
        deleteAsatidz,
        addSantri,
        importSantriBatch,
        updateSantri,
        deleteSantri,
        saveAbsensiSantri,
        saveAbsensiAsatidz,
        addCustomHafalan,
        toggleHafalanStatus,
        addProgressLog,
        updateProgressLog,
        deleteProgressLog,
        bayarSyahriah,
        verifikasiSyahriah,
        cancelSyahriah,
        addLaporanKeuangan,
        updateLaporanKeuangan,
        deleteLaporanKeuangan,
        addDokumentasi,
        deleteDokumentasi,
        resetAllData,
      }}
    >
      {children}
    </TPQContext.Provider>
  );
};

export const useTPQ = () => {
  const context = useContext(TPQContext);
  if (!context) {
    throw new Error('useTPQ must be used within a TPQProvider');
  }
  return context;
};
