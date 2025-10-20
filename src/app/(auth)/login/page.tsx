'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      console.log('Login result:', result) // Debug log

      if (result?.error) {
        // More specific error messages
        if (result.error === 'CredentialsSignin') {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (result.error === 'Configuration') {
          setError('System configuration error. Please contact support.')
        } else {
          setError(result.error || 'Login failed. Please try again.')
        }
      } else if (result?.ok) {
        // Successful login
        router.push('/dashboard')
        router.refresh() // Force refresh to update session
      } else {
        // No result or unexpected response
        setError('Unable to process login. Please check your connection and try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Connection error. Please check your internet connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              🏡 Mafende Estate
            </CardTitle>
            <CardDescription>
              Management System Login
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
              {error && (
                <Alert variant="error" className="border-red-500 bg-red-50 text-red-900">
                  <AlertDescription className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </AlertDescription>
                </Alert>
              )}

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@mafende.com"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={!email || !password || isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
                </p>
              </div>
            </form>

          </CardContent>
        </Card>
      </div>
    </main>
  )
}