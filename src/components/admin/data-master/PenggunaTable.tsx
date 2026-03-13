"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, X, Loader2, UserX, RefreshCw, GraduationCap, UserCircle2, BookOpen } from "lucide-react";
import { createPengguna, updatePengguna, deletePengguna, resetPassword } from "@/lib/actions/pengguna";

// Tipe Data
type Role = "ADMIN" | "GURU" | "PENGAWAS" | "SISWA";

interface UserData {
  id: string;
  name: string | null;
  username: string | null;
  role: Role;
  siswa?: {
    nis: string;
    kelas: {
      id: string;
      nama: string;
    }
  } | null;
  guru?: {
    nip: string | null;
    mataPelajaran: {
      id: string;
      nama: string;
      kode: string;
    }[];
  } | null;
}

interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
}

interface Mapel {
  id: string;
  nama: string;
  kode: string;
}

interface Props {
  data: UserData[];
  listKelas: Kelas[];
  listMapel: Mapel[];
}

export function PenggunaTable({ data, listKelas, listMapel }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL");
  
  // State for Form
  const [editingItem, setEditingItem] = useState<UserData | null>(null);
  const [formRole, setFormRole] = useState<Role>("SISWA");
  // Multi-select state for mapel
  const [selectedMapels, setSelectedMapels] = useState<string[]>([]);

  const filteredData = filterRole === "ALL" 
    ? data 
    : data.filter(user => user.role === filterRole);

  const handleOpenModal = (item?: UserData) => {
    if (item) {
      setEditingItem(item);
      setFormRole(item.role);
      if (item.guru?.mataPelajaran) {
        setSelectedMapels(item.guru.mataPelajaran.map(m => m.id));
      } else {
        setSelectedMapels([]);
      }
    } else {
      setEditingItem(null);
      setFormRole("SISWA");
      setSelectedMapels([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleMapelToggle = (id: string) => {
    setSelectedMapels(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("role", formRole);
    
    // Append mapel array manually
    selectedMapels.forEach(id => {
        formData.append("mapelIds", id);
    });
    
    startTransition(async () => {
      try {
        if (editingItem) {
           await updatePengguna(editingItem.id, formData);
        } else {
           await createPengguna(formData);
        }
        handleCloseModal();
      } catch (error: any) {
        alert(error.message || "Terjadi kesalahan saat menyimpan data");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini beserta seluruh datanya?")) {
      startTransition(async () => {
        await deletePengguna(id);
      });
    }
  };

  const handleResetPassword = async (id: string) => {
    if (confirm("Reset password pengguna ini menjadi 'rahasia123'?")) {
      startTransition(async () => {
        await resetPassword(id);
        alert("Password berhasil direset menjadi: rahasia123");
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-foreground">Daftar Pengguna</h2>
           <p className="text-sm text-muted-foreground mt-1">Kelola data Guru, Siswa, dan Pengawas.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            className="px-4 py-2 rounded-md border border-border bg-card text-sm font-medium focus:outline-none focus:border-primary transition-colors"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
          >
            <option value="ALL">Semua Role</option>
            <option value="SISWA">Siswa</option>
            <option value="GURU">Guru</option>
            <option value="PENGAWAS">Pengawas</option>
          </select>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all hover-lift font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>
      </div>

      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground bg-muted/30">
                <th className="py-4 px-6 font-medium">Nama / Username</th>
                <th className="py-4 px-6 font-medium">Role</th>
                <th className="py-4 px-6 font-medium">Informasi Profil</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Belum ada data pengguna untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">
                        <div className="font-bold text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-1 tracking-wide">@{item.username}</div>
                    </td>
                    <td className="py-4 px-6">
                        <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                            ${item.role === 'SISWA' ? 'bg-primary/10 text-primary' : 
                              item.role === 'GURU' ? 'bg-accent/10 text-accent' : 
                              'bg-secondary/10 text-secondary'}`}>
                            {item.role === 'SISWA' ? <GraduationCap className="w-3.5 h-3.5"/> : <UserCircle2 className="w-3.5 h-3.5"/>}
                            {item.role}
                        </span>
                    </td>
                    <td className="py-4 px-6">
                      {item.role === 'SISWA' && item.siswa && (
                         <div className="text-muted-foreground">
                           <div>NIS: <span className="font-medium text-foreground">{item.siswa.nis}</span></div>
                           <div className="text-xs mt-0.5">Kls: <span className="font-medium text-foreground">{item.siswa.kelas.nama}</span></div>
                         </div>
                      )}
                      {item.role === 'GURU' && item.guru && (
                        <div className="text-muted-foreground">
                           <div>NIP: <span className="text-foreground">{item.guru.nip || "-"}</span></div>
                           {item.guru.mataPelajaran.length > 0 ? (
                               <div className="flex flex-wrap gap-1 mt-1.5">
                                   {item.guru.mataPelajaran.map(mapel => (
                                       <span key={mapel.id} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/50" title={mapel.nama}>
                                           {mapel.kode}
                                       </span>
                                   ))}
                               </div>
                           ) : (
                               <div className="text-xs mt-0.5 italic text-amber-500/70">Belum ada Mapel</div>
                           )}
                        </div>
                      )}
                      {item.role === 'PENGAWAS' && (
                        <div className="text-muted-foreground">-</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Reset Password"
                          onClick={() => handleResetPassword(item.id)}
                          disabled={isPending}
                          className="p-2 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 rounded-md transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit Pengguna"
                          onClick={() => handleOpenModal(item)}
                          disabled={isPending}
                          className="p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Hapus Pengguna"
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-[var(--radius-lg)] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingItem ? "Edit Pengguna" : "Tambah Pengguna"}
              </h2>
              <button 
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Role Selection */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg w-full mb-6 relative">
                {(["SISWA", "GURU", "PENGAWAS"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormRole(r)}
                      disabled={!!editingItem && r !== formRole} // Optional: limit role switching during edit
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        formRole === r 
                          ? 'bg-background shadow-sm text-foreground' 
                          : 'text-muted-foreground hover:text-foreground'
                      } ${!!editingItem && r !== formRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {r === 'SISWA' ? 'Siswa' : r === 'GURU' ? 'Guru' : 'Pengawas'}
                    </button>
                ))}
              </div>

              {/* Data Umum */}
              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nama Lengkap</label>
                    <input
                      name="name"
                      defaultValue={editingItem?.name || ""}
                      required
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Username (Login)</label>
                    <input
                      name="username"
                      defaultValue={editingItem?.username || ""}
                      required
                      placeholder="username.unik"
                      className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
              </div>

              {/* Conditional Fields: Siswa */}
              {formRole === "SISWA" && (
                <div className="space-y-4 pt-4 border-t border-border mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">NIS (Nomor Induk Siswa)</label>
                    <input
                      name="nis"
                      defaultValue={editingItem?.siswa?.nis || ""}
                      required
                      placeholder="Contoh: 123456"
                      className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Kelas</label>
                    <select
                      name="kelasId"
                      required
                      defaultValue={editingItem?.siswa?.kelas?.id || ""}
                      className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="" disabled>Pilih Kelas Siswa...</option>
                      {listKelas.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama} (Tingkat {k.tingkat})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Conditional Fields: Guru */}
              {formRole === "GURU" && (
                  <div className="space-y-4 pt-4 border-t border-border mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">NIP (Opsional)</label>
                      <input
                        name="nip"
                        defaultValue={editingItem?.guru?.nip || ""}
                        placeholder="Contoh: 198012122005011002"
                        className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                         <BookOpen className="w-4 h-4 text-muted-foreground"/> Mata Pelajaran yang Diampu
                      </label>
                      <div className="bg-muted/30 border border-border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2 custom-scrollbar">
                         {listMapel.length === 0 ? (
                             <p className="text-xs text-muted-foreground italic text-center py-2">Belum ada mata pelajaran. Tambahkan di menu Data Master.</p>
                         ) : (
                             listMapel.map(mapel => (
                                 <label key={mapel.id} className="flex items-center gap-3 p-1.5 hover:bg-muted/50 rounded cursor-pointer transition-colors">
                                     <input 
                                         type="checkbox"
                                         checked={selectedMapels.includes(mapel.id)}
                                         onChange={() => handleMapelToggle(mapel.id)}
                                         className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                                     />
                                     <span className="text-sm font-medium text-foreground">{mapel.nama}</span>
                                     <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded ml-auto border border-border/50 uppercase">{mapel.kode}</span>
                                 </label>
                             ))
                         )}
                      </div>
                    </div>
                  </div>
              )}

              {!editingItem && (
                 <p className="text-xs text-muted-foreground my-2"> * Password default akun baru adalah: <strong>rahasia123</strong> </p>
              )}

              <div className="pt-4 flex gap-3 mt-6 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted font-medium transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-all flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingItem ? "Update Data" : "Tambah Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
