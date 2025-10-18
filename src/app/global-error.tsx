'use client'

export const dynamic = 'force-dynamic'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-destructive">Error</h1>
            <h2 className="text-2xl font-semibold mt-4">Something went wrong!</h2>
            <p className="text-muted-foreground mt-2">
              A global error occurred. Please try again.
            </p>
            <div className="mt-6 space-x-4">
              <button
                onClick={reset}
                className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}