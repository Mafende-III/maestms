import { NextPageContext } from 'next'

interface ErrorProps {
  statusCode?: number
  hasGetInitialProps?: boolean
  err?: Error
}

function Error({ statusCode, hasGetInitialProps, err }: ErrorProps) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#ef4444' }}>
          {statusCode}
        </h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '1rem' }}>
          {statusCode === 404 ? 'Page Not Found' : 'Server Error'}
        </h2>
        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
          {statusCode === 404
            ? 'The page you are looking for does not exist.'
            : 'An error occurred while processing your request.'
          }
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none'
          }}
        >
          Go Home
        </a>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error