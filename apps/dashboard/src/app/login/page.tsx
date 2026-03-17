'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const res = await authAPI.login(email, password)
      saveAuth({
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        user: res.data.user,
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>⬡</div>
          <h1 style={styles.logoText}>AidMesh</h1>
        </div>
        <p style={styles.subtitle}>Panel Operativo</p>

        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operador@proteccioncivil.gob.mx"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>

        <p style={styles.footer}>
          Protección Civil BCS · AidMesh v0.1
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1117',
    padding: '20px',
  },
  card: {
    background: '#1a1d26',
    border: '1px solid #2a2d3e',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  logoIcon: {
    fontSize: '28px',
    color: '#534ab7',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#e8e8e8',
  },
  subtitle: {
    color: '#8b8fa8',
    fontSize: '13px',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    color: '#8b8fa8',
    fontWeight: '500',
  },
  input: {
    background: '#0f1117',
    border: '1px solid #2a2d3e',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#e8e8e8',
    fontSize: '14px',
    width: '100%',
  },
  error: {
    color: '#e53935',
    fontSize: '12px',
    background: '#2a1515',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #4a2020',
  },
  button: {
    background: '#534ab7',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '8px',
    transition: 'background 0.2s',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '11px',
    color: '#8b8fa8',
  },
}