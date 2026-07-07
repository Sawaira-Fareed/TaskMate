import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function App() {
  const [result, setResult] = useState(null)

  useEffect(() => {
    setResult('Connecting...')
    
    supabase.from('service_types').select('*')
      .then(({ data, error }) => {
        if (error) setResult('FAILED: ' + error.message)
        else if (data?.length > 0) setResult('WORKS: ' + data.length + ' service types found')
        else setResult('NO DATA: connected but no rows')
      })
      .catch(err => setResult('ERROR: ' + err.message))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-lg font-medium">{result || 'Starting...'}</p>
    </div>
  )
}