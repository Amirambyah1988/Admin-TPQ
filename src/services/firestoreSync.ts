import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  TPQProfile,
  Asatidz,
  Santri,
  HafalanMasterItem,
  SantriHafalanStatus,
  LogProgressHarian,
  AbsensiSantri,
  AbsensiAsatidz,
  PembayaranSyahriah,
  LaporanKeuangan,
  DokumentasiKegiatan,
} from '../types';

export interface SantriPublicSummary {
  id: string;
  nama: string;
  jilid: string;
  foto?: string;
  paidMonths: string[];
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'nurulislam.cangkiran@gmail.com';

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `id_${Date.now()}`;
}

function clip(val: string | undefined, maxLen: number): string {
  return (val || '').trim().slice(0, maxLen);
}

export function buildSantriPublicPayload(santri: Santri, syahriahList: PembayaranSyahriah[]) {
  const paidSet = new Set<string>();
  syahriahList
    .filter((p) => p.santriId === santri.id && p.status === 'Lunas')
    .forEach((p) => p.bulanList.forEach((m) => paidSet.add(m)));

  return {
    nama: clip(santri.nama, 150) || 'Santri',
    jilid: clip(santri.jilid, 50) || 'Jilid 1',
    foto: clip(santri.foto, 500),
    paidMonths: Array.from(paidSet).slice(0, 24),
    isPublicSummary: true,
    updatedAt: serverTimestamp(),
  };
}

export async function checkIsAdminUser(uid: string, email: string | null): Promise<boolean> {
  if (email && email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL) {
    return true;
  }
  const path = `admins/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', sanitizeId(uid)));
    return snap.exists();
  } catch (err) {
    // Expected if non-admin doesn't have an entry or before rules sync
    console.warn('Admin lookup note:', err instanceof Error ? err.message : err, path);
    return false;
  }
}

export async function upsertUserProfileDoc(params: {
  uid: string;
  role: 'asatidz' | 'santri';
  nama: string;
  email: string;
  santriId?: string;
  asatidzId?: string;
}) {
  const safeUid = sanitizeId(params.uid);
  const path = `users/${safeUid}`;
  try {
    const payload: Record<string, unknown> = {
      uid: safeUid,
      role: params.role,
      nama: clip(params.nama, 150) || 'Pengguna TPQ',
      email: clip(params.email, 160) || 'user@tpq.com',
      updatedAt: serverTimestamp(),
    };
    if (params.santriId) payload.santriId = sanitizeId(params.santriId);
    if (params.asatidzId) payload.asatidzId = sanitizeId(params.asatidzId);
    await setDoc(doc(db, 'users', safeUid), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncTPQProfileToFirestore(profile: TPQProfile) {
  const path = 'tpq_profile/main';
  try {
    await setDoc(doc(db, 'tpq_profile', 'main'), {
      nama: clip(profile.nama, 150) || 'TPQ Digital',
      logo: clip(profile.logo, 500),
      alamat: clip(profile.alamat, 350) || '-',
      tahunBerdiri: clip(profile.tahunBerdiri, 20),
      badanHukum: clip(profile.badanHukum, 150),
      noSkKemenag: clip(profile.noSkKemenag, 120),
      telepon: clip(profile.telepon, 50),
      email: clip(profile.email, 160),
      rekeningList: (profile.rekeningList || []).slice(0, 10),
      isPublicProfile: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncAsatidzToFirestore(item: Asatidz) {
  const safeId = sanitizeId(item.id);
  const path = `asatidz/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      nama: clip(item.nama, 150) || 'Asatidz',
      nik: clip(item.nik, 40) || '0000',
      tempatLahir: clip(item.tempatLahir, 100),
      tanggalLahir: clip(item.tanggalLahir, 30),
      pendidikan: clip(item.pendidikan, 150),
      mengajar: item.mengajar,
      alamat: clip(item.alamat, 350),
      tanggalMulaiTugas: clip(item.tanggalMulaiTugas, 30),
      foto: clip(item.foto, 500),
      noHp: clip(item.noHp, 50),
      statusAktif: Boolean(item.statusAktif),
      updatedAt: serverTimestamp(),
    };
    if (item.username) payload.username = clip(item.username, 80);
    if (item.password) payload.password = clip(item.password, 120);
    await setDoc(doc(db, 'asatidz', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAsatidzFromFirestore(id: string) {
  const safeId = sanitizeId(id);
  const path = `asatidz/${safeId}`;
  try {
    await deleteDoc(doc(db, 'asatidz', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncSantriToFirestore(
  item: Santri,
  ownerUid: string,
  syahriahList: PembayaranSyahriah[],
  isNew = false
) {
  const safeId = sanitizeId(item.id);
  const path = `santri/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      nama: clip(item.nama, 150) || 'Santri',
      nik: clip(item.nik, 40) || '0000',
      tempatLahir: clip(item.tempatLahir, 100),
      tanggalLahir: clip(item.tanggalLahir, 30),
      alamat: clip(item.alamat, 350),
      terdaftarTanggal: clip(item.terdaftarTanggal, 30),
      foto: clip(item.foto, 500),
      namaWali: clip(item.namaWali, 150),
      noHpWali: clip(item.noHpWali, 50),
      jilid: clip(item.jilid, 50) || 'Jilid 1',
      username: clip(item.username, 120) || `${clip(item.nik, 40)}@tpq.com`,
      password: clip(item.password, 120) || 'santri123',
      jenisKelamin: item.jenisKelamin === 'P' ? 'P' : 'L',
      ownerUid: clip(ownerUid, 128) || 'unclaimed',
      updatedAt: serverTimestamp(),
    };
    if (isNew) {
      payload.createdAt = serverTimestamp();
      await setDoc(doc(db, 'santri', safeId), payload);
    } else {
      const existingSnap = await getDoc(doc(db, 'santri', safeId));
      if (!existingSnap.exists()) {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'santri', safeId), payload);
      } else {
        await updateDoc(doc(db, 'santri', safeId), payload);
      }
    }

    // Keep non-PII summary in sync for Santri Syahriah transparency board
    await setDoc(
      doc(db, 'santri_public', safeId),
      buildSantriPublicPayload(item, syahriahList)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSantriFromFirestore(id: string) {
  const safeId = sanitizeId(id);
  const path = `santri/${safeId}`;
  try {
    await deleteDoc(doc(db, 'santri', safeId));
    await deleteDoc(doc(db, 'santri_public', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncHafalanMasterToFirestore(item: HafalanMasterItem) {
  const safeId = sanitizeId(item.id);
  const path = `hafalan_master/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      kategori: item.kategori,
      judul: clip(item.judul, 200) || 'Hafalan',
      isPublicCurriculum: true,
      updatedAt: serverTimestamp(),
    };
    if (item.deskripsi) payload.deskripsi = clip(item.deskripsi, 400);
    if (item.arabic) payload.arabic = clip(item.arabic, 1000);
    await setDoc(doc(db, 'hafalan_master', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncHafalanStatusToFirestore(item: SantriHafalanStatus, ownerUid: string) {
  const safeId = sanitizeId(item.id);
  const path = `hafalan_status/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      santriId: sanitizeId(item.santriId),
      ownerUid: clip(ownerUid, 128) || 'unclaimed',
      hafalanId: sanitizeId(item.hafalanId),
      lancar: Boolean(item.lancar),
      updatedAt: serverTimestamp(),
    };
    if (item.tanggalLancar) payload.tanggalLancar = clip(item.tanggalLancar, 30);
    if (item.catatan !== undefined) payload.catatan = clip(item.catatan, 400);
    await setDoc(doc(db, 'hafalan_status', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncProgressLogToFirestore(item: LogProgressHarian, ownerUid: string, isNew = false) {
  const safeId = sanitizeId(item.id);
  const path = `progress_logs/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      santriId: sanitizeId(item.santriId),
      ownerUid: clip(ownerUid, 128) || 'unclaimed',
      tanggal: clip(item.tanggal, 30),
      jenisBacaan: item.jenisBacaan,
      jilidAtauSurat: clip(item.jilidAtauSurat, 120) || 'Iqro 1',
      halamanAyat: clip(item.halamanAyat, 120),
      lancar: Boolean(item.lancar),
      catatanGuru: clip(item.catatanGuru, 500),
      asatidzNama: clip(item.asatidzNama, 150),
      updatedAt: serverTimestamp(),
    };
    if (isNew) {
      payload.createdAt = serverTimestamp();
      await setDoc(doc(db, 'progress_logs', safeId), payload);
    } else {
      const snap = await getDoc(doc(db, 'progress_logs', safeId));
      if (!snap.exists()) {
        payload.createdAt = serverTimestamp();
        await setDoc(doc(db, 'progress_logs', safeId), payload);
      } else {
        await updateDoc(doc(db, 'progress_logs', safeId), payload);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProgressLogFromFirestore(id: string) {
  const safeId = sanitizeId(id);
  const path = `progress_logs/${safeId}`;
  try {
    await deleteDoc(doc(db, 'progress_logs', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncAbsensiSantriBatchToFirestore(
  records: AbsensiSantri[],
  deletedIds: string[],
  ownerUidMap: Record<string, string>
) {
  const path = 'absensi_santri';
  try {
    const batch = writeBatch(db);
    deletedIds.forEach((id) => {
      batch.delete(doc(db, 'absensi_santri', sanitizeId(id)));
    });
    records.forEach((r) => {
      const safeId = sanitizeId(r.id);
      batch.set(doc(db, 'absensi_santri', safeId), {
        tanggal: clip(r.tanggal, 30),
        santriId: sanitizeId(r.santriId),
        ownerUid: clip(ownerUidMap[r.santriId] || 'unclaimed', 128),
        status: r.status,
        keterangan: clip(r.keterangan, 300),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncAbsensiAsatidzBatchToFirestore(
  records: AbsensiAsatidz[],
  deletedIds: string[]
) {
  const path = 'absensi_asatidz';
  try {
    const batch = writeBatch(db);
    deletedIds.forEach((id) => {
      batch.delete(doc(db, 'absensi_asatidz', sanitizeId(id)));
    });
    records.forEach((r) => {
      const safeId = sanitizeId(r.id);
      batch.set(doc(db, 'absensi_asatidz', safeId), {
        tanggal: clip(r.tanggal, 30),
        asatidzId: sanitizeId(r.asatidzId),
        jamMasuk: clip(r.jamMasuk, 20),
        status: r.status,
        keterangan: clip(r.keterangan, 300),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createSyahriahInFirestore(
  item: PembayaranSyahriah,
  ownerUid: string
) {
  const safeId = sanitizeId(item.id);
  const path = `syahriah/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      santriId: sanitizeId(item.santriId),
      ownerUid: clip(ownerUid, 128) || 'unclaimed',
      bulanList: item.bulanList.slice(0, 12),
      nominalPerBulan: Math.max(1, Number(item.nominalPerBulan) || 50000),
      totalNominal: Math.max(1, Number(item.totalNominal) || 50000),
      tanggalBayar: clip(item.tanggalBayar, 30),
      metode: item.metode,
      status: item.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (item.bankTujuan) payload.bankTujuan = clip(item.bankTujuan, 150);
    if (item.buktiTransferUrl) payload.buktiTransferUrl = clip(item.buktiTransferUrl, 500);
    if (item.catatan) payload.catatan = clip(item.catatan, 400);
    if (item.diverifikasiOleh) payload.diverifikasiOleh = clip(item.diverifikasiOleh, 150);
    await setDoc(doc(db, 'syahriah', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateSyahriahStatusInFirestore(
  id: string,
  updates: { status: PembayaranSyahriah['status']; diverifikasiOleh?: string; catatan?: string }
) {
  const safeId = sanitizeId(id);
  const path = `syahriah/${safeId}`;
  try {
    const payload: Record<string, unknown> = {
      status: updates.status,
      updatedAt: serverTimestamp(),
    };
    if (updates.diverifikasiOleh !== undefined) {
      payload.diverifikasiOleh = clip(updates.diverifikasiOleh, 150);
    }
    if (updates.catatan !== undefined) {
      payload.catatan = clip(updates.catatan, 400);
    }
    await updateDoc(doc(db, 'syahriah', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncLaporanKeuanganListToFirestore(
  list: LaporanKeuangan[],
  deletedIds: string[] = []
) {
  const path = 'laporan_keuangan';
  try {
    const batch = writeBatch(db);
    deletedIds.forEach((id) => {
      batch.delete(doc(db, 'laporan_keuangan', sanitizeId(id)));
    });
    list.forEach((item) => {
      const safeId = sanitizeId(item.id);
      batch.set(doc(db, 'laporan_keuangan', safeId), {
        no: Number(item.no) || 1,
        tanggal: clip(item.tanggal, 30),
        uraian: clip(item.uraian, 300) || 'Transaksi',
        jenis: item.jenis,
        nominal: Math.max(0, Number(item.nominal) || 0),
        saldo: Number(item.saldo) || 0,
        keterangan: clip(item.keterangan, 300),
        isPublicReport: true,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createDokumentasiInFirestore(item: DokumentasiKegiatan) {
  const safeId = sanitizeId(item.id);
  const path = `dokumentasi/${safeId}`;
  try {
    await setDoc(doc(db, 'dokumentasi', safeId), {
      judul: clip(item.judul, 200) || 'Dokumentasi TPQ',
      tanggal: clip(item.tanggal, 30),
      kategori: clip(item.kategori, 100) || 'Kegiatan',
      deskripsi: clip(item.deskripsi, 800),
      fotoUrl: clip(item.fotoUrl, 500) || 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=400&q=80',
      dibuatOleh: clip(item.dibuatOleh, 150) || 'Asatidz',
      isPublicGallery: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteDokumentasiFromFirestore(id: string) {
  const safeId = sanitizeId(id);
  const path = `dokumentasi/${safeId}`;
  try {
    await deleteDoc(doc(db, 'dokumentasi', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedInitialDataIfEmpty(params: {
  adminUid: string;
  adminEmail: string;
  adminName: string;
  tpqProfile: TPQProfile;
  asatidzList: Asatidz[];
  santriList: Santri[];
  hafalanMaster: HafalanMasterItem[];
  santriHafalanStatus: SantriHafalanStatus[];
  progressLogs: LogProgressHarian[];
  absensiSantri: AbsensiSantri[];
  absensiAsatidz: AbsensiAsatidz[];
  syahriahList: PembayaranSyahriah[];
  laporanKeuangan: LaporanKeuangan[];
  dokumentasiList: DokumentasiKegiatan[];
}): Promise<boolean> {
  try {
    const profileSnap = await getDoc(doc(db, 'tpq_profile', 'main'));
    if (profileSnap.exists()) {
      return false; // Already seeded
    }

    // Seed admin entry first
    await setDoc(doc(db, 'admins', sanitizeId(params.adminUid)), {
      uid: sanitizeId(params.adminUid),
      email: clip(params.adminEmail, 160),
      nama: clip(params.adminName, 150) || 'Pengurus TPQ',
      createdAt: serverTimestamp(),
    });

    await syncTPQProfileToFirestore(params.tpqProfile);

    // Seed Asatidz & Santri before dependent collections (exists() checks in rules!)
    for (const a of params.asatidzList) {
      await syncAsatidzToFirestore(a);
    }
    for (const s of params.santriList) {
      await syncSantriToFirestore(s, params.adminUid, params.syahriahList, true);
    }

    // Batch remaining collections safely (<= 400 ops per batch)
    const batch1 = writeBatch(db);
    params.hafalanMaster.forEach((h) => {
      batch1.set(doc(db, 'hafalan_master', sanitizeId(h.id)), {
        kategori: h.kategori,
        judul: clip(h.judul, 200),
        deskripsi: clip(h.deskripsi, 400),
        arabic: clip(h.arabic, 1000),
        isPublicCurriculum: true,
        updatedAt: serverTimestamp(),
      });
    });
    params.santriHafalanStatus.forEach((hs) => {
      batch1.set(doc(db, 'hafalan_status', sanitizeId(hs.id)), {
        santriId: sanitizeId(hs.santriId),
        ownerUid: sanitizeId(params.adminUid),
        hafalanId: sanitizeId(hs.hafalanId),
        lancar: Boolean(hs.lancar),
        tanggalLancar: clip(hs.tanggalLancar, 30),
        catatan: clip(hs.catatan, 400),
        updatedAt: serverTimestamp(),
      });
    });
    params.progressLogs.forEach((l) => {
      batch1.set(doc(db, 'progress_logs', sanitizeId(l.id)), {
        santriId: sanitizeId(l.santriId),
        ownerUid: sanitizeId(params.adminUid),
        tanggal: clip(l.tanggal, 30),
        jenisBacaan: l.jenisBacaan,
        jilidAtauSurat: clip(l.jilidAtauSurat, 120),
        halamanAyat: clip(l.halamanAyat, 120),
        lancar: Boolean(l.lancar),
        catatanGuru: clip(l.catatanGuru, 500),
        asatidzNama: clip(l.asatidzNama, 150),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    params.absensiSantri.forEach((ab) => {
      batch1.set(doc(db, 'absensi_santri', sanitizeId(ab.id)), {
        tanggal: clip(ab.tanggal, 30),
        santriId: sanitizeId(ab.santriId),
        ownerUid: sanitizeId(params.adminUid),
        status: ab.status,
        keterangan: clip(ab.keterangan, 300),
        updatedAt: serverTimestamp(),
      });
    });
    params.absensiAsatidz.forEach((ab) => {
      batch1.set(doc(db, 'absensi_asatidz', sanitizeId(ab.id)), {
        tanggal: clip(ab.tanggal, 30),
        asatidzId: sanitizeId(ab.asatidzId),
        jamMasuk: clip(ab.jamMasuk, 20),
        status: ab.status,
        keterangan: clip(ab.keterangan, 300),
        updatedAt: serverTimestamp(),
      });
    });
    params.syahriahList.forEach((sy) => {
      batch1.set(doc(db, 'syahriah', sanitizeId(sy.id)), {
        santriId: sanitizeId(sy.santriId),
        ownerUid: sanitizeId(params.adminUid),
        bulanList: sy.bulanList.slice(0, 12),
        nominalPerBulan: Math.max(1, Number(sy.nominalPerBulan) || 50000),
        totalNominal: Math.max(1, Number(sy.totalNominal) || 50000),
        tanggalBayar: clip(sy.tanggalBayar, 30),
        metode: sy.metode,
        bankTujuan: clip(sy.bankTujuan, 150),
        buktiTransferUrl: clip(sy.buktiTransferUrl, 500),
        status: sy.status,
        catatan: clip(sy.catatan, 400),
        diverifikasiOleh: clip(sy.diverifikasiOleh, 150),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    params.laporanKeuangan.forEach((k) => {
      batch1.set(doc(db, 'laporan_keuangan', sanitizeId(k.id)), {
        no: Number(k.no) || 1,
        tanggal: clip(k.tanggal, 30),
        uraian: clip(k.uraian, 300),
        jenis: k.jenis,
        nominal: Math.max(0, Number(k.nominal) || 0),
        saldo: Number(k.saldo) || 0,
        keterangan: clip(k.keterangan, 300),
        isPublicReport: true,
        updatedAt: serverTimestamp(),
      });
    });
    params.dokumentasiList.forEach((d) => {
      batch1.set(doc(db, 'dokumentasi', sanitizeId(d.id)), {
        judul: clip(d.judul, 200),
        tanggal: clip(d.tanggal, 30),
        kategori: clip(d.kategori, 100),
        deskripsi: clip(d.deskripsi, 800),
        fotoUrl: clip(d.fotoUrl, 500),
        dibuatOleh: clip(d.dibuatOleh, 150),
        isPublicGallery: true,
        createdAt: serverTimestamp(),
      });
    });
    await batch1.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seed_initial_data');
  }
}

export function collectionRef(name: string) {
  return collection(db, name);
}
