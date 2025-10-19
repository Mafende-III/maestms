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

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        // Check if login was successful
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An error occurred during login')
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
                <Alert variant="error">
                  <AlertDescription>{error}</AlertDescription>
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
                disabled={!email || !password}
              >
                Sign In
              </Button>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
                </p>
              </div>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-md">
              <h4 className="font-medium text-sm mb-2">Demo Credentials:</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Admin:</strong> admin@mafende.com / Admin123!</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}