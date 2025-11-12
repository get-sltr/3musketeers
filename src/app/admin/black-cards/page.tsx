'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface BlackCard {
  id: string;
  founder_number: number;
  founder_name: string;
  verification_code: string;
  verify_url: string;
  redeemed: boolean;
  redeemed_at: string | null;
  redeemed_email: string | null;
  is_active: boolean;
  created_at: string;
}

export default function BlackCardsAdmin() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [cards, setCards] = useState<BlackCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'redeemed' | 'available'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    redeemed: 0,
    available: 0,
    redemptionRate: 0,
  });

  useEffect(() => {
    checkAdmin();
    fetchCards();
  }, []);

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth');
      return;
    }

    // Check if user is admin (you can implement your admin check logic here)
    // For now, just check if authenticated
  }

  async function fetchCards() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('founder_cards')
        .select('*')
        .order('founder_number', { ascending: true });

      if (error) throw error;

      setCards(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(cardsData: BlackCard[]) {
    const total = cardsData.length;
    const redeemed = cardsData.filter((c) => c.redeemed).length;
    const available = total - redeemed;
    const redemptionRate = total > 0 ? (redeemed / total) * 100 : 0;

    setStats({ total, redeemed, available, redemptionRate });
  }

  function getFilteredCards() {
    let filtered = cards;

    // Apply status filter
    if (filter === 'redeemed') {
      filtered = filtered.filter((c) => c.redeemed);
    } else if (filter === 'available') {
      filtered = filtered.filter((c) => !c.redeemed);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.founder_name.toLowerCase().includes(term) ||
          c.verification_code.toLowerCase().includes(term) ||
          c.redeemed_email?.toLowerCase().includes(term) ||
          c.founder_number.toString().includes(term)
      );
    }

    return filtered;
  }

  function exportToCSV() {
    const filtered = getFilteredCards();
    const csv = [
      ['#', 'Name', 'Code', 'Status', 'Redeemed By', 'Redeemed At'].join(','),
      ...filtered.map((c) =>
        [
          c.founder_number,
          c.founder_name,
          c.verification_code,
          c.redeemed ? 'Redeemed' : 'Available',
          c.redeemed_email || '',
          c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString() : '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `black-cards-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  }

  const filteredCards = getFilteredCards();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#ffd700] to-[#ffed4e] bg-clip-text text-transparent">
            👑 Black Card Admin
          </h1>
          <p className="text-zinc-400">Founder's Circle Management Dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-zinc-400 text-sm mt-1">Total Cards</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6 border border-green-900">
            <div className="text-3xl font-bold text-green-500">{stats.redeemed}</div>
            <div className="text-zinc-400 text-sm mt-1">Redeemed</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6 border border-yellow-900">
            <div className="text-3xl font-bold text-yellow-500">{stats.available}</div>
            <div className="text-zinc-400 text-sm mt-1">Available</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-6 border border-[#ffd700]">
            <div className="text-3xl font-bold text-[#ffd700]">
              {stats.redemptionRate.toFixed(1)}%
            </div>
            <div className="text-zinc-400 text-sm mt-1">Redemption Rate</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, code, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-[#ffd700] focus:outline-none"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:border-[#ffd700] focus:outline-none"
          >
            <option value="all">All Cards</option>
            <option value="redeemed">Redeemed</option>
            <option value="available">Available</option>
          </select>

          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-[#ffd700] text-black font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            📥 Export CSV
          </button>

          <button
            onClick={fetchCards}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Cards Table */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800 border-b border-zinc-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Founder Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Verification Code
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Redeemed By
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Redeemed At
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                      #{card.founder_number.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 text-sm text-white font-medium">
                      {card.founder_name}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-zinc-300">
                      <button
                        onClick={() => copyCode(card.verification_code)}
                        className="hover:text-[#ffd700] transition-colors"
                        title="Click to copy"
                      >
                        {card.verification_code}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {card.redeemed ? (
                        <span className="px-3 py-1 bg-green-900/30 text-green-500 rounded-full text-xs font-semibold">
                          ✅ Redeemed
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-900/30 text-yellow-500 rounded-full text-xs font-semibold">
                          ⏳ Available
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {card.redeemed_email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {card.redeemed_at
                        ? new Date(card.redeemed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={card.verify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ffd700] hover:underline"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-zinc-400">No cards found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-6 text-center text-zinc-500 text-sm">
          Showing {filteredCards.length} of {cards.length} cards
        </div>
      </div>
    </div>
  );
}
