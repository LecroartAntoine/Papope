'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LogTripButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  // --- Form state ---
  const [date, setDate] = useState(todayStr)
  const [distanceKm, setDistanceKm] = useState<number | ''>('')
  const [mode, setMode] = useState<'ev' | 'hybrid' | 'petrol'>('hybrid')
  const [fuelLitres, setFuelLitres] = useState<number | ''>('')
  const [energyKwh, setEnergyKwh] = useState<number | ''>('')
  const [destination, setDestination] = useState('')

  const handleClose = () => {
    setIsOpen(false)
    setErrorMessage(null)
    // Reset state
    setDate(todayStr)
    setDistanceKm('')
    setMode('hybrid')
    setFuelLitres('')
    setEnergyKwh('')
    setDestination('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!distanceKm || Number(distanceKm) <= 0) {
      setErrorMessage('Please enter a valid trip distance.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/ionickel/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          distanceKm: Number(distanceKm),
          mode,
          fuelLitres: mode !== 'ev' ? Number(fuelLitres) || 0 : 0,
          energyKwh: mode !== 'petrol' ? Number(energyKwh) || 0 : 0,
          destination: destination || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save the trip.')
      }

      router.refresh()
      handleClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the trip.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn btn-primary" 
        style={{ padding: '8px 16px', borderRadius: '6px' }}
      >
        + Log Trip
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div 
            style={{
              backgroundColor: 'var(--card-bg, #1a1a1a)',
              color: 'var(--text, #ffffff)',
              border: '1px solid var(--border, #333333)',
              borderRadius: '12px',
              maxWidth: '450px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Log New Trip</h3>
              <button 
                onClick={handleClose} 
                style={{ background: 'none', border: 'none', color: 'var(--muted, #888)', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value !== '' ? Number(e.target.value) : '')}
                    required
                    placeholder="e.g. 15.2"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Driving Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as 'ev' | 'hybrid' | 'petrol')}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#222', border: '1px solid var(--border, #333)', color: '#fff' }}
                >
                  <option value="ev">⚡ EV</option>
                  <option value="hybrid">⚡⛽ Hybrid</option>
                  <option value="petrol">⛽ Petrol Only</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {mode !== 'ev' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Fuel Used (L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fuelLitres}
                      onChange={(e) => setFuelLitres(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="0.0"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                )}
                {mode !== 'petrol' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Electricity Used (kWh)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={energyKwh}
                      onChange={(e) => setEnergyKwh(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="0.0"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Destination (Optional)</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Work commute"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={handleClose} 
                  disabled={loading}
                  className="btn btn-ghost" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '10px' }}
                >
                  {loading ? 'Logging...' : 'Save Trip'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  )
}