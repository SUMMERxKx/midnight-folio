import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="animate-pulse" style={{ color: '#6b6560' }}>Loading…</div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err);
    setSubmitting(false);
  };

  return (
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0a' }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8 rounded-xl border"
        style={{ backgroundColor: '#151515', borderColor: '#2a2a2a' }}
      >
        <h1
          className="text-3xl font-bold text-center mb-1"
          style={{ fontFamily: 'EB Garamond', color: '#e0ddd5' }}
        >
          Folio
        </h1>
        <p className="text-center text-xs mb-8" style={{ color: '#6b6560' }}>
          Sign in to your scrapbook
        </p>

        {error && (
          <div
            className="mb-4 text-sm text-center px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          >
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-xs mb-1.5 block" style={{ color: '#6b6560' }}>
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-1"
            style={{
              backgroundColor: '#0a0a0a',
              borderColor: '#2a2a2a',
              color: '#e0ddd5',
              ringColor: '#c9a96e',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#c9a96e')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          />
        </label>

        <label className="block mb-6">
          <span className="text-xs mb-1.5 block" style={{ color: '#6b6560' }}>
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition focus:ring-1"
            style={{
              backgroundColor: '#0a0a0a',
              borderColor: '#2a2a2a',
              color: '#e0ddd5',
              ringColor: '#c9a96e',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#c9a96e')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          style={{ backgroundColor: '#c9a96e', color: '#0a0a0a' }}
          onMouseEnter={(e) => !submitting && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
