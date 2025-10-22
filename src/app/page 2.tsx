'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl">
              🏡 Mafende Estate
            </CardTitle>
            <CardDescription className="text-lg">
              Management System MVP
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Alert */}
            <Alert variant="success">
              <AlertTitle>✅ Authentication & Layout Complete</AlertTitle>
              <AlertDescription>
                NextAuth.js authentication, role-based permissions, and dashboard layout are ready.
                Login to access the dashboard.
              </AlertDescription>
            </Alert>

            {/* Progress Grid */}
            <div className="form-grid-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-success">✅ Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      Next.js 14 project structure
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      TypeScript configuration
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      Database schema (Prisma)
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      Dim White theme setup
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      Redis caching setup
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      shadcn/ui components
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-warning">🚧 Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      NextAuth.js authentication
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="healthy">Done</Badge>
                      Dashboard layout
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="monitor">Queue</Badge>
                      Tenant management
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="monitor">Queue</Badge>
                      Lease management
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="monitor">Queue</Badge>
                      Payment recording
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Login Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔐 Test Credentials</CardTitle>
                <CardDescription>
                  Use these credentials to test the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admin:</span>
                    <span>admin@mafende.com / Admin@123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manager:</span>
                    <span>manager@mafende.com / Manager@123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accountant:</span>
                    <span>accountant@mafende.com / Accountant@123</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎨 shadcn/ui Components Demo</CardTitle>
                <CardDescription>
                  Professional components with dim white theme integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="form-grid-2">
                  <div className="space-y-3">
                    <h4 className="font-medium">Color Badges:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default">Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="success">Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="destructive">Error</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Status Badges:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="critical">Critical</Badge>
                      <Badge variant="attention">Attention</Badge>
                      <Badge variant="monitor">Monitor</Badge>
                      <Badge variant="healthy">Healthy</Badge>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="font-medium">Button Variants:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button>Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/login">
                <Button size="lg">
                  Login to Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                View Documentation
              </Button>
            </div>
          </CardContent>

          <CardFooter className="justify-center">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Built with Next.js 14, TypeScript & Tailwind CSS
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                🎨 Dim White Theme | 🚀 Optimized for Data Entry | 📱 Mobile Ready
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Keyboard Shortcuts Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h4 className="font-medium text-sm">Keyboard Shortcuts (Coming Soon)</h4>
              <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                <span><kbd>Ctrl</kbd> + <kbd>Enter</kbd> Submit</span>
                <span><kbd>Ctrl</kbd> + <kbd>S</kbd> Save</span>
                <span><kbd>Esc</kbd> Cancel</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}