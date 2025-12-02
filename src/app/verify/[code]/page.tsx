'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { csrfFetch } from '@/lib/csrf-client';

interface VerificationResult {
  valid: boolean;
  redeemed: boolean;
  founderNumber?: number;
  founderName?: string;
  redeemedBy?: string;
  redeemedAt?: string;
  message: string;
}

export default function VerifyBlackCard() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  const supabase = createClient();

  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    verifyCode();
  }, [code]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function verifyCode() {
    try {
      const response = await fetch(`/api/verify/${code}`);
      const data = await response.json();
      setVerification(data);
    } catch (error) {
      setVerification({
        valid: false,
        redeemed: false,
        message: 'Error verifying code',
      });
    } finally {
      setLoading(false);
    }
  }

  async function claimAccess() {
    if (!user) {
      // Redirect to sign up with return URL
      router.push(`/auth?redirect=/verify/${code}`);
      return;
    }

    setClaiming(true);
    try {
      const response = await csrfFetch(`/api/verify/${code}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        // Refresh verification status
        await verifyCode();
        // Show success message
        alert('🎉 Lifetime access granted! Welcome to the Founder\'s Circle.');
        // Redirect to app
        setTimeout(() => router.push('/app'), 2000);
      } else {
        alert(data.message || 'Failed to claim access');
      }
    } catch (error) {
      alert('Error claiming access');
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700]"></div>
      </div>
    );
  }

  if (!verification || !verification.valid) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Code</h1>
          <p className="text-zinc-400 mb-6">{verification?.message}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Black Card Display */}
        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-3xl p-8 mb-8 border border-[#ffd700] shadow-2xl shadow-[#ffd700]/20">
          <div className="flex items-center justify-center mb-6">
            <div className="text-6xl">👑</div>
          </div>

          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-[#ffd700] to-[#ffed4e] bg-clip-text text-transparent">
            SLTR Black Card
          </h1>

          <div className="text-center mb-6">
            <p className="text-zinc-400 text-sm uppercase tracking-widest">Founder's Circle</p>
            <p className="text-2xl font-bold text-white mt-2">#{verification.founderNumber}</p>
            <p className="text-lg text-zinc-300 mt-1">{verification.founderName}</p>
          </div>

          <div className="border-t border-zinc-800 pt-6">
            {verification.redeemed ? (
              <div className="text-center">
                <div className="text-4xl mb-3">✅</div>
                <h2 className="text-xl font-bold text-white mb-2">Already Redeemed</h2>
                <p className="text-zinc-400 text-sm">
                  This card was redeemed on {new Date(verification.redeemedAt!).toLocaleDateString()}
                </p>
                {verification.redeemedBy && (
                  <p className="text-zinc-500 text-xs mt-2">
                    by {verification.redeemedBy}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-3">✨</div>
                <h2 className="text-xl font-bold text-white mb-2">Valid Card</h2>
                <p className="text-zinc-400 text-sm mb-6">
                  This Black Card grants lifetime premium access to SLTR.
                </p>

                <button
                  onClick={claimAccess}
                  disabled={claiming}
                  className="w-full px-8 py-4 bg-gradient-to-r from-[#ffd700] to-[#ffed4e] text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black mr-2"></span>
                      Claiming...
                    </span>
                  ) : user ? (
                    'Claim Lifetime Access'
                  ) : (
                    'Sign In to Claim Access'
                  )}
                </button>

                {!user && (
                  <p className="text-zinc-500 text-xs mt-4">
                    You'll be redirected to sign in or create an account
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Perks Section */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h3 className="text-lg font-bold text-white mb-4">Founder's Circle Benefits</h3>
          <ul className="space-y-3">
            {[
              '♾️ Lifetime Premium Access',
              '🚀 Early Access to New Features',
              '💬 Direct Line to Founder',
              '🎁 Exclusive Events & Meetups',
              '🏆 Founding Member Badge',
              '📊 Priority Support',
            ].map((benefit, index) => (
              <li key={index} className="flex items-center text-zinc-300">
                <span className="mr-3">{benefit.split(' ')[0]}</span>
                <span>{benefit.split(' ').slice(1).join(' ')}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-zinc-500 text-sm">
            Part of the first 100 believers.
            <br />
            Rules don't apply to us.
          </p>
        </div>
      </div>
    </div>
  );
}
