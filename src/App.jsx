import React, { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Home, Plus, Trash2, Calendar, FileText } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'income', description: 'Dana Awal Tabungan', amount: 150000000, date: new Date().toISOString().split('T')[0] },
    { id: 2, type: 'expense', description: 'Beli Semen 50 Sak, Pasir 1 Truk, dan Paku 5 Kg untuk mulai pondasi', amount: 4850000, date: new Date().toISOString().split('T')[0] },
    { id: 3, type: 'expense', description: 'Bayar Tukang (Minggu 1)', amount: 4000000, date: new Date().toISOString().split('T')[0] },
  ]);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!description || !amount || !date) return;

    const newTransaction = {
      id: Date.now(),
      type,
      description,
      amount: parseFloat(amount),
      date,
    };
    setTransactions([newTransaction, ...transactions]);
    setDescription('');
    setAmount('');
  };

  const handleDelete = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-200 text-slate-800 font-sans pb-6">
      {/* Container utama dibuat seperti frame HP (max-w-md) agar selalu konsisten dan rapi */}
      <div className="max-w-md mx-auto bg-slate-50 min-h-screen shadow-xl sm:border-x border-slate-300">
        
        {/* Header */}
        <header className="bg-blue-700 text-white p-4 shadow-sm rounded-b-2xl mb-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Home size={100} />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/20 p-2 rounded-lg">
              <Home size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Keuangan Rumah</h1>
              <p className="text-blue-100 text-xs mt-1">Pencatatan Pembangunan</p>
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

          {/* Form Tambah Transaksi */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" />
              Catat Transaksi Baru
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
                    type="number"
                    required
                    min="1"
                    placeholder="Jumlah"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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

              <button
                type="submit"
                className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-transform ${
                  type === 'expense' ? 'bg-rose-600' : 'bg-emerald-600'
                }`}
              >
                Simpan Transaksi
              </button>
            </form>
          </section>

          {/* Riwayat Transaksi */}
          <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold mb-3">Riwayat Terakhir</h3>
            
            {transactions.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <FileText size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Belum ada catatan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => (
                  /* Menggunakan items-start agar jika teks menjadi 2 baris, layout tetap sejajar di atas */
                  <div key={t.id} className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 gap-2">
                    
                    {/* Bagian Kiri: Ikon & Teks */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div className="flex-1">
                        {/* break-words membuat teks panjang turun ke bawah alih-alih terpotong */}
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
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-slate-400 active:text-rose-600 p-1.5 rounded-md active:bg-rose-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
          
        </main>
      </div>
    </div>
  );
}