'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SCHEDULE } from '@/lib/ionickel/schedule'

interface LogActionButtonProps {
  currentKm: number
}

type Tab = 'odometer' | 'trip' | 'service'

export function LogActionButton({ currentKm }: LogActionButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('odometer')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const todayStr = new Date().toISOString().split('T')[0]

  // --- Odometer form state ---
  const [odoKm, setOdoKm] = useState(currentKm)
  const [odoDate, setOdoDate] = useState(todayStr)

  // --- Trip form state ---
  const [tripDate, setTripDate] = useState(todayStr)
  const [tripDistance, setTripDistance] = useState<number | ''>('')
  const [tripMode, setTripMode] = useState<'ev' | 'hybrid' | 'petrol'>('hybrid')
  const [tripFuel, setTripFuel] = useState<number | ''>('')
  const [tripEnergy, setTripEnergy] = useState<number | ''>('')
  const [tripDest, setTripDest] = useState('')

  // --- Service form state ---
  const [serviceKm, setServiceKm] = useState(currentKm)
  const [serviceDate, setServiceDate] = useState(todayStr)
  const [serviceItems, setServiceItems] = useState<string[]>([])
  const [serviceCost, setServiceCost] = useState<number | ''>('')
  const [serviceShop, setServiceShop] = useState('')
  const [serviceNotes, setServiceNotes] = useState('')

  const handleClose = () => {
    setIsOpen(false)
    setErrorMessage(null)
  }

  const handleOdometerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/ionickel/odometer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          km: Number(odoKm),
          date: odoDate,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update odometer.')
      }

      router.refresh()
      handleClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.')
    } finally {
      setLoading(false)
    }
  }

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tripDistance || Number(tripDistance) <= 0) {
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
          date: tripDate,
          distanceKm: Number(tripDistance),
          mode: tripMode,
          fuelLitres: tripMode !== 'ev' ? Number(tripFuel) || 0 : 0,
          energyKwh: tripMode !== 'petrol' ? Number(tripEnergy) || 0 : 0,
          destination: tripDest || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log trip.')
      }

      router.refresh()
      handleClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.')
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (serviceItems.length === 0) {
      setErrorMessage('Please select at least one service item.')
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/ionickel/service-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          km: Number(serviceKm),
          date: serviceDate,
          items: serviceItems.map((name) => ({ name, category: 'maintenance' })),
          cost: serviceCost !== '' ? Number(serviceCost) : null,
          shop: serviceShop || null,
          notes: serviceNotes || null,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to log service record.')
      }

      router.refresh()
      handleClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '6px' }}>
        + Log Action
      </button>

      {isOpen && (
        <div 
          className="modal-backdrop" 
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
            className="modal-content" 
            style={{
              backgroundColor: 'var(--card-bg, #1a1a1a)',
              color: 'var(--text, #ffffff)',
              border: '1px solid var(--border, #333333)',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Add Log Entry</h3>
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

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #333)', marginBottom: '20px' }}>
              {(['odometer', 'trip', 'service'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab)
                    setErrorMessage(null)
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--accent, #3b82f6)' : 'none',
                    color: activeTab === tab ? 'var(--text, #fff)' : 'var(--muted, #888)',
                    fontWeight: activeTab === tab ? 600 : 400,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Odometer Tab */}
            {activeTab === 'odometer' && (
              <form onSubmit={handleOdometerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Current Mileage (km)</label>
                  <input
                    type="number"
                    value={odoKm}
                    onChange={(e) => setOdoKm(Number(e.target.value))}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Date</label>
                  <input
                    type="date"
                    value={odoDate}
                    onChange={(e) => setOdoDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '10px', width: '100%', padding: '10px' }}>
                  {loading ? 'Saving...' : 'Update Odometer'}
                </button>
              </form>
            )}

            {/* Trip Tab */}
            {activeTab === 'trip' && (
              <form onSubmit={handleTripSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      value={tripDate}
                      onChange={(e) => setTripDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Distance (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tripDistance}
                      onChange={(e) => setTripDistance(e.target.value !== '' ? Number(e.target.value) : '')}
                      required
                      placeholder="e.g. 42.5"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Driving Mode</label>
                  <select
                    value={tripMode}
                    onChange={(e) => setTripMode(e.target.value as 'ev' | 'hybrid' | 'petrol')}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#222', border: '1px solid var(--border, #333)', color: '#fff' }}
                  >
                    <option value="ev">⚡ EV</option>
                    <option value="hybrid">⚡⛽ Hybrid</option>
                    <option value="petrol">⛽ Petrol Only</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {tripMode !== 'ev' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Fuel Used (L)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={tripFuel}
                        onChange={(e) => setTripFuel(e.target.value !== '' ? Number(e.target.value) : '')}
                        placeholder="0.0"
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                      />
                    </div>
                  )}
                  {tripMode !== 'petrol' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Electricity Used (kWh)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={tripEnergy}
                        onChange={(e) => setTripEnergy(e.target.value !== '' ? Number(e.target.value) : '')}
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
                    value={tripDest}
                    onChange={(e) => setTripDest(e.target.value)}
                    placeholder="e.g. Work commute"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '10px', width: '100%', padding: '10px' }}>
                  {loading ? 'Saving...' : 'Log Trip'}
                </button>
              </form>
            )}

            {/* Service Tab */}
            {activeTab === 'service' && (
              <form onSubmit={handleServiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Service Km</label>
                    <input
                      type="number"
                      value={serviceKm}
                      onChange={(e) => setServiceKm(Number(e.target.value))}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Service Date</label>
                    <input
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Completed Items</label>
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      border: '1px solid var(--border, #333)',
                      borderRadius: '6px',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.1)'
                    }}
                  >
                    {SCHEDULE.map((item) => (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={serviceItems.includes(item.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServiceItems([...serviceItems, item.name])
                            } else {
                              setServiceItems(serviceItems.filter((x) => x !== item.name))
                            }
                          }}
                        />
                        <span>{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Cost (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceCost}
                      onChange={(e) => setServiceCost(e.target.value !== '' ? Number(e.target.value) : '')}
                      placeholder="0.00"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Workshop / Shop</label>
                    <input
                      type="text"
                      value={serviceShop}
                      onChange={(e) => setServiceShop(e.target.value)}
                      placeholder="e.g. Dealership, DIY"
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted, #888)', marginBottom: '6px' }}>Notes</label>
                  <textarea
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide additional details..."
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border, #333)', color: '#fff', resize: 'vertical' }}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '10px', width: '100%', padding: '10px' }}>
                  {loading ? 'Saving...' : 'Save Service Record'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}