import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Home, Plus, Trash2, Calendar, FileText, Edit, Heart, Download } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyCwS1xS39EQChrjgnWGmW9tj5vVBf1O4tI",
  authDomain: "keuangan-rumah-e0b8f.firebaseapp.com",
  projectId: "keuangan-rumah-e0b8f",
  storageBucket: "keuangan-rumah-e0b8f.firebasestorage.app",
  messagingSenderId: "361798810617",
  appId: "1:361798810617:web:e7a4d5759bfb20e4439b28",
  measurementId: "G-JCRGZHMM27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Ubah baris appId menjadi teks statis yang aman dari karakter garis miring
const appId = 'keuangan-rumah-app';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // State baru untuk fitur edit
  const [editingId, setEditingId] = useState(null);

  // State baru untuk menu filter riwayat
  const [filter, setFilter] = useState('all'); // Pilihan: 'all', 'income', 'expense'

  // State baru untuk fitur tombol Instalasi (PWA)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Mendengarkan event dari browser jika aplikasi siap diinstal
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Mencegah popup bawaan browser yang kadang mengganggu
      setDeferredPrompt(e); // Menyimpan event untuk dipanggil nanti saat tombol ditekan
      setIsInstallable(true); // Memunculkan tombol "Instal" di layar
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    
    // Memunculkan popup instalasi resmi dari sistem Android/Chrome
    deferredPrompt.prompt();
    
    // Menunggu respon pengguna (apakah mengklik Instal atau Batal)
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User menerima instalasi PWA');
      setIsInstallable(false); // Sembunyikan tombol setelah berhasil diinstal
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          try {
            // Lingkungan pratinjau mencoba login dengan token khusus
            await signInWithCustomToken(auth, __initial_auth_token);
          } catch (e) {
            // Jika token mismatch (karena menggunakan API Key Anda sendiri), paksa gunakan login Anonim
            console.warn("Menggunakan Firebase milik pengguna. Beralih ke Anonymous Login.");
            await signInAnonymously(auth);
          }
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // UBAH BARIS INI: Ganti jalur database menjadi 'public/data' agar sinkron antar perangkat
    const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Data error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, balance: income - expense };
  }, [transactions]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number);
  };

  // Fungsi baru untuk menangani input angka dan memberi titik otomatis
  const handleAmountChange = (e) => {
    // Hanya ambil karakter angka (0-9), buang huruf atau simbol lain
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    
    if (rawValue) {
      // Ubah jadi angka lalu format dengan titik (standar id-ID)
      setAmount(parseInt(rawValue, 10).toLocaleString('id-ID'));
    } else {
      setAmount('');
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    
    // Sebelum disimpan ke Firebase, hapus dulu titiknya agar kembali menjadi angka murni
    const cleanAmount = amount.replace(/\./g, '');

    if (!description || !cleanAmount || !date || !user) return;

    try {
      if (editingId) {
        // Mode Edit: Update dokumen yang sudah ada
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', editingId);
        await updateDoc(docRef, {
          type,
          description,
          amount: parseFloat(cleanAmount),
          date
        });
        setEditingId(null); // Selesai edit, kembali ke mode normal
      } else {
        // Mode Tambah: Buat dokumen baru
        const txRef = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
        await addDoc(txRef, {
          type,
          description,
          amount: parseFloat(cleanAmount),
          date,
          createdAt: Date.now()
        });
      }
      
      // Kosongkan form setelah berhasil
      setDescription('');
      setAmount('');
    } catch (error) {
      console.error("Error adding/updating doc:", error);
    }
  };

  // Fungsi saat tombol Edit ditekan
  const handleEdit = (t) => {
    setEditingId(t.id);
    setType(t.type);
    setDescription(t.description);
    setAmount(t.amount.toLocaleString('id-ID')); // Tambahkan format titik kembali ke layar
    setDate(t.date);
    
    // Gulir layar ke atas secara otomatis agar form edit terlihat
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fungsi untuk membatalkan edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setAmount('');
    setType('expense');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = async (id) => {
    if (!user) return;
    try {
      // UBAH BARIS INI: Ganti jalur database menjadi 'public/data'
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting doc:", error);
    }
  };

  // Fungsi untuk memfilter transaksi berdasarkan menu tab yang dipilih
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  return (
    <div className="min-h-screen bg-slate-200 text-slate-800 font-sans sm:py-8">
      {/* Container utama: Dibuat lebih elegan dengan flex-col agar footer selalu di bawah */}
      <div className="max-w-md mx-auto bg-slate-50 min-h-screen sm:min-h-0 sm:rounded-3xl shadow-2xl sm:border border-slate-300 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="bg-blue-700 text-white p-4 shadow-sm rounded-b-2xl mb-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Home size={100} />
          </div>
          
          {/* Tombol Instal Pintar (Hanya muncul jika belum diinstal & didukung browser) */}
          {isInstallable && (
            <button 
              onClick={handleInstallApp}
              className="absolute right-4 top-4 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[10px] font-bold py-1.5 px-3 rounded-full flex items-center gap-1.5 backdrop-blur-sm transition-all z-20 shadow-sm border border-white/30"
            >
              <Download size={14} /> 
              <span>Instal App</span>
            </button>
          )}

          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/20 p-2 rounded-lg mt-6">
              <Home size={22} className="text-white" />
            </div>
            <div className="mt-6">
              <h1 className="text-lg font-bold leading-none">Keuangan Bekeng Rumah</h1>
              <p className="text-blue-100 text-xs mt-1">Catat Samua Doi Maso deng Kaluar Disini</p>
            </div>
          </div>
        </header>

        <main className="px-4 space-y-4">
          
          {/* Ringkasan Saldo */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-[-10px] right-[-10px] p-2 opacity-5">
              <Wallet size={100} />
            </div>
            <p className="text-slate-500 text-xs font-semibold mb-1">Sisa Saldo</p>
            <h2 className={`text-2xl font-bold mb-4 truncate ${balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {formatRupiah(balance)}
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="flex items-center gap-1 text-emerald-600 mb-1">
                  <TrendingUp size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Masuk</span>
                </div>
                <p className="text-emerald-700 font-bold text-sm truncate">{formatRupiah(totalIncome)}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                <div className="flex items-center gap-1 text-rose-600 mb-1">
                  <TrendingDown size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Keluar</span>
                </div>
                <p className="text-rose-700 font-bold text-sm truncate">{formatRupiah(totalExpense)}</p>
              </div>
            </div>
          </section>

          {}
          {/* Form Tambah/Edit Transaksi */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Plus size={16} className={`transition-colors ${editingId ? 'text-orange-500 rotate-45' : 'text-blue-600'}`} />
              {editingId ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
            </h3>
            <form onSubmit={handleAddTransaction} className="space-y-3">
              
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                    type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Calendar size={14} className="text-slate-400" />
                  </div>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold text-xs">Rp</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Jumlah"
                    value={amount}
                    onChange={handleAmountChange}
                    className="w-full pl-8 pr-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 top-2.5 pl-2.5 flex items-start pointer-events-none">
                  <FileText size={14} className="text-slate-400" />
                </div>
                <textarea
                  required
                  rows="2"
                  placeholder="Keterangan (Cth: Semen 50 sak & Pasir 1 Truk)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {editingId ? (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-lg text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-transform ${
                      type === 'expense' ? 'bg-orange-500' : 'bg-emerald-600'
                    }`}
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-2.5 rounded-lg bg-slate-200 text-slate-700 font-bold text-sm shadow-sm active:scale-[0.98] transition-transform"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-transform ${
                    type === 'expense' ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                >
                  Simpan Transaksi
                </button>
              )}
            </form>
          </section>

          {}
          {/* Riwayat Transaksi */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold mb-3">Daftar Transaksi</h3>
            
            {/* Menu Tab Filter */}
            <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                  filter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilter('income')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                  filter === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'
                }`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setFilter('expense')}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                  filter === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'
                }`}
              >
                Pengeluaran
              </button>
            </div>
            
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm">Memuat data...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <FileText size={32} className="mb-2 opacity-50" />
                <p className="text-sm">
                  {filter === 'income' ? 'Belum ada pemasukan' : 
                   filter === 'expense' ? 'Belum ada pengeluaran' : 'Belum ada catatan'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((t) => (
                  <div key={t.id} className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 gap-2">
                    
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-800 break-words leading-tight">
                          {t.description}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Bagian Kanan: Harga & Tombol */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`font-bold text-sm whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEdit(t)}
                          className="text-slate-400 active:text-blue-600 p-1.5 rounded-md active:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="text-slate-400 active:text-rose-600 p-1.5 rounded-md active:bg-rose-100 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
          
        </main>

        {/* Footer Baru yang Lebih Elegan */}
        <footer className="mt-auto pt-12 pb-6 bg-slate-50 text-center relative z-10">
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="flex items-center gap-1.5 opacity-80">
              <Home size={14} className="text-blue-600" />
              <span className="text-[11px] font-bold text-slate-600 tracking-widest uppercase">Semoga Selalu Lancar Semua Urusan</span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              Sten. Sucita. Jourell <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse" />
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}