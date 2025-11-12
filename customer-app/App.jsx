import { useState, useEffect } from 'react'
import { supabase, getWorkshop, getCurrentCustomer, signIn, signUp, signOut, uploadTripPhoto } from './lib/supabase'
import { Home, Map, Users, Wrench, User, Plus, X, Calendar, Heart, MessageCircle, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

// Fix Leaflet default marker icon
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function App() {
  // State
  const [loading, setLoading] = useState(true)
  const [workshop, setWorkshop] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [currentScreen, setCurrentScreen] = useState('home')
  const [showModal, setShowModal] = useState(null)
  const [toast, setToast] = useState(null)
  
  // Data state
  const [trips, setTrips] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [communityPosts, setCommunityPosts] = useState([])
  const [appointments, setAppointments] = useState([])

  // Initialize app
  useEffect(() => {
    initApp()
  }, [])

  const initApp = async () => {
    try {
      // 1. Get workshop from subdomain
      const workshopData = await getWorkshop()
      if (!workshopData) {
        setToast('Officina non trovata')
        setLoading(false)
        return
      }
      
      setWorkshop(workshopData)
      
      // 2. Apply branding
      applyBranding(workshopData)
      
      // 3. Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const customerData = await getCurrentCustomer()
        setCustomer(customerData)
        loadAllData(customerData.id, workshopData.id)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Init error:', error)
      setToast('Errore di inizializzazione')
      setLoading(false)
    }
  }

  const applyBranding = (workshopData) => {
    // Set CSS variables for dynamic branding
    document.documentElement.style.setProperty('--brand-primary', workshopData.primary_color)
    document.documentElement.style.setProperty('--brand-secondary', workshopData.secondary_color)
    document.title = `${workshopData.name} - Garage Connect`
    
    // Set favicon if exists
    if (workshopData.logo_url) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = workshopData.logo_url
      document.getElementsByTagName('head')[0].appendChild(link)
    }
  }

  const loadAllData = async (customerId, workshopId) => {
    // Load trips
    const { data: tripsData } = await supabase
      .from('trips')
      .select('*, trip_photos(*)')
      .eq('customer_id', customerId)
      .order('start_date', { ascending: false })
    setTrips(tripsData || [])
    
    // Load maintenance
    const { data: maintData } = await supabase
      .from('maintenance')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false })
    setMaintenance(maintData || [])
    
    // Load restaurants (workshop-wide)
    const { data: resData } = await supabase
      .from('restaurants')
      .select('*, customers(name)')
      .eq('workshop_id', workshopId)
      .order('rating', { ascending: false })
    setRestaurants(resData || [])
    
    // Load community posts (shared trips + posts)
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*, customers(name, avatar_url), trips(title)')
      .eq('workshop_id', workshopId)
      .order('created_at', { ascending: false })
      .limit(20)
    setCommunityPosts(postsData || [])
    
    // Load appointments
    const { data: appData } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_id', customerId)
      .order('date', { ascending: false })
    setAppointments(appData || [])
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // ============================================
  // AUTH SCREENS
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!workshop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Officina non trovata</h1>
          <p className="text-gray-400">Verifica l'URL e riprova</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return <LoginScreen workshop={workshop} onLogin={(user) => setCustomer(user)} showToast={showToast} />
  }

  // ============================================
  // MAIN APP
  // ============================================

  return (
    <div className="app-container">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-card border-b border-dark-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workshop.logo_url && (
              <img src={workshop.logo_url} alt={workshop.name} className="h-8 w-8 object-contain" />
            )}
            <div>
              <h1 className="text-sm font-bold">{workshop.name}</h1>
              <p className="text-xs text-gray-400">Benvenuto, {customer.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal('profile')}
            className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center"
          >
            {customer.avatar_url ? (
              <img src={customer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User size={16} />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {currentScreen === 'home' && <HomeScreen customer={customer} trips={trips} maintenance={maintenance} appointments={appointments} showToast={showToast} setShowModal={setShowModal} />}
        {currentScreen === 'trips' && <TripsScreen trips={trips} setTrips={setTrips} customer={customer} showToast={showToast} setShowModal={setShowModal} />}
        {currentScreen === 'explorer' && <ExplorerScreen restaurants={restaurants} setRestaurants={setRestaurants} workshop={workshop} customer={customer} showToast={showToast} setShowModal={setShowModal} />}
        {currentScreen === 'community' && <CommunityScreen posts={communityPosts} setPosts={setCommunityPosts} customer={customer} workshop={workshop} showToast={showToast} />}
        {currentScreen === 'service' && <ServiceScreen maintenance={maintenance} setMaintenance={setMaintenance} appointments={appointments} setAppointments={setAppointments} customer={customer} workshop={workshop} showToast={showToast} setShowModal={setShowModal} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border z-50">
        <div className="max-w-app mx-auto flex">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'trips', icon: Map, label: 'Viaggi' },
            { id: 'explorer', icon: MapPin, label: 'Explorer' },
            { id: 'community', icon: Users, label: 'Community' },
            { id: 'service', icon: Wrench, label: 'Service' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                currentScreen === item.id ? 'text-brand-primary' : 'text-gray-400'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {showModal === 'profile' && <ProfileModal customer={customer} workshop={workshop} onClose={() => setShowModal(null)} onLogout={async () => { await signOut(); window.location.reload(); }} />}
      {showModal === 'addTrip' && <AddTripModal customer={customer} onClose={() => setShowModal(null)} onSave={(trip) => { setTrips([trip, ...trips]); showToast('Viaggio salvato!'); }} />}
      {showModal === 'addRestaurant' && <AddRestaurantModal workshop={workshop} customer={customer} onClose={() => setShowModal(null)} onSave={(restaurant) => { setRestaurants([restaurant, ...restaurants]); showToast('Ristorante aggiunto!'); }} />}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// ============================================
// LOGIN SCREEN
// ============================================

function LoginScreen({ workshop, onLogin, showToast }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
        const customer = await getCurrentCustomer()
        onLogin(customer)
      } else {
        const { error } = await signUp(email, password, { name, workshop_id: workshop.id })
        if (error) throw error
        showToast('Registrazione completata! Effettua il login.')
        setIsLogin(true)
      }
    } catch (error) {
      showToast(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Workshop Branding */}
        <div className="text-center mb-8">
          {workshop.logo_url && (
            <img src={workshop.logo_url} alt={workshop.name} className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">{workshop.name}</h1>
          <p className="text-gray-400">La tua officina, sempre con te</p>
        </div>

        {/* Form */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">{isLogin ? 'Accedi' : 'Registrati'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 btn-brand rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Caricamento...' : (isLogin ? 'Accedi' : 'Registrati')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-brand-primary hover:underline"
            >
              {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// HOME SCREEN
// ============================================

function HomeScreen({ customer, trips, maintenance, appointments, showToast, setShowModal }) {
  const totalKm = trips.reduce((sum, t) => sum + t.distance, 0)
  const nextAppointment = appointments.find(a => a.status === 'pending' && new Date(a.date) > new Date())
  const lastService = maintenance.find(m => m.type === 'service')
  
  return (
    <div className="p-4 space-y-6 fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-primary">{totalKm.toFixed(0)}</div>
          <div className="text-sm text-gray-400">km totali</div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-primary">{trips.length}</div>
          <div className="text-sm text-gray-400">viaggi</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold mb-3">Azioni Rapide</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowModal('addTrip')}
            className="bg-brand-primary text-white rounded-lg p-4 flex flex-col items-center gap-2"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Nuovo Viaggio</span>
          </button>
          <button
            onClick={() => setShowModal('addMaintenance')}
            className="bg-dark-card border border-dark-border rounded-lg p-4 flex flex-col items-center gap-2"
          >
            <Wrench size={24} />
            <span className="text-sm font-medium">Aggiungi Manutenzione</span>
          </button>
        </div>
      </div>

      {/* Next Service */}
      {lastService && (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4">
          <h3 className="font-medium mb-2">Prossimo Tagliando</h3>
          <p className="text-sm text-gray-400">
            Ultimo service: {format(new Date(lastService.date), 'dd MMM yyyy', { locale: it })} ({lastService.km} km)
          </p>
          {lastService.next_service_km && (
            <p className="text-sm text-brand-primary mt-1">
              Fra {lastService.next_service_km - customer.current_km} km
            </p>
          )}
        </div>
      )}

      {/* Next Appointment */}
      {nextAppointment && (
        <div className="bg-brand-primary bg-opacity-10 border border-brand-primary rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} className="text-brand-primary" />
            <h3 className="font-medium">Prossimo Appuntamento</h3>
          </div>
          <p className="text-sm">
            {format(new Date(nextAppointment.date), 'dd MMMM yyyy', { locale: it })} alle {nextAppointment.time}
          </p>
          <p className="text-sm text-gray-400 mt-1">{nextAppointment.service_type}</p>
        </div>
      )}

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Ultimi Viaggi</h2>
          <button className="text-sm text-brand-primary">Vedi tutti</button>
        </div>
        {trips.slice(0, 3).map(trip => (
          <div key={trip.id} className="bg-dark-card border border-dark-border rounded-lg p-4 mb-3">
            <h3 className="font-medium mb-1">{trip.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{format(new Date(trip.start_date), 'dd MMM yyyy', { locale: it })}</span>
              <span>{trip.distance} km</span>
              {trip.duration && <span>{trip.duration}h</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// TRIPS SCREEN (Based on Ray's BMW app)
// ============================================

function TripsScreen({ trips, setTrips, customer, showToast, setShowModal }) {
  return (
    <div className="fade-in">
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">I Miei Viaggi</h2>
          <button
            onClick={() => setShowModal('addTrip')}
            className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {trips.length === 0 ? (
          <div className="empty-state">
            <Map size={48} className="mb-4 opacity-30" />
            <p className="text-lg mb-2">Nessun viaggio ancora</p>
            <p className="text-sm mb-6">Inizia a tracciare le tue avventure</p>
            <button onClick={() => setShowModal('addTrip')} className="btn-brand px-6 py-2 rounded-lg">
              Aggiungi Viaggio
            </button>
          </div>
        ) : (
          trips.map(trip => (
            <div key={trip.id} className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
              {trip.trip_photos?.length > 0 && (
                <div className="photo-grid">
                  {trip.trip_photos.slice(0, 3).map(photo => (
                    <div key={photo.id} className="photo-grid-item">
                      <img src={photo.photo_url} alt="" />
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">{trip.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <span>{format(new Date(trip.start_date), 'dd MMM yyyy', { locale: it })}</span>
                  <span>{trip.distance} km</span>
                  {trip.duration && <span>{trip.duration}h</span>}
                </div>
                {trip.notes && (
                  <p className="text-sm text-gray-300 mb-3">{trip.notes}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <button className="flex items-center gap-1 text-brand-primary">
                    <Heart size={16} />
                    <span>{trip.likes_count || 0}</span>
                  </button>
                  {trip.is_shared && (
                    <span className="text-gray-400">Condiviso</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================
// EXPLORER SCREEN (Based on Ray's Explorer module)
// ============================================

function ExplorerScreen({ restaurants, setRestaurants, workshop, customer, showToast, setShowModal }) {
  const [mapCenter] = useState([45.4642, 9.1900]) // Milano default
  
  return (
    <div className="h-screen flex flex-col">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={13} className="h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {restaurants.filter(r => r.lat && r.lng).map(restaurant => (
            <Marker key={restaurant.id} position={[restaurant.lat, restaurant.lng]}>
              <Popup>
                <div className="text-black">
                  <strong>{restaurant.name}</strong><br />
                  {'⭐'.repeat(restaurant.rating)}<br />
                  {restaurant.location}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        <button
          onClick={() => setShowModal('addRestaurant')}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-brand-primary shadow-lg flex items-center justify-center z-[1000]"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Restaurants List */}
      <div className="bg-dark-bg border-t border-dark-border p-4 max-h-64 overflow-y-auto">
        <h3 className="font-bold mb-3">Ristoranti Consigliati</h3>
        <div className="space-y-2">
          {restaurants.slice(0, 5).map(restaurant => (
            <div key={restaurant.id} className="bg-dark-card border border-dark-border rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{restaurant.name}</h4>
                  <p className="text-sm text-gray-400">{restaurant.location}</p>
                  <div className="mt-1">{'⭐'.repeat(restaurant.rating)}</div>
                </div>
                <button className="text-brand-primary">
                  <Heart size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMMUNITY SCREEN
// ============================================

function CommunityScreen({ posts, setPosts, customer, workshop, showToast }) {
  return (
    <div className="fade-in">
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-xl font-bold">Community {workshop.name}</h2>
        <p className="text-sm text-gray-400 mt-1">Condividi esperienze con altri motociclisti</p>
      </div>

      <div className="p-4 space-y-4">
        {posts.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="mb-4 opacity-30" />
            <p className="text-lg mb-2">Nessun post ancora</p>
            <p className="text-sm">Condividi il tuo primo viaggio!</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-dark-card border border-dark-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                  {post.customers?.avatar_url ? (
                    <img src={post.customers.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div>
                  <div className="font-medium">{post.customers?.name || 'Utente'}</div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(post.created_at), 'dd MMM HH:mm', { locale: it })}
                  </div>
                </div>
              </div>
              
              {post.trip_id && post.trips && (
                <div className="mb-2 text-brand-primary text-sm">
                  📍 {post.trips.title}
                </div>
              )}
              
              <p className="text-sm mb-3">{post.content}</p>
              
              {post.media_url && (
                <img src={post.media_url} alt="" className="w-full rounded-lg mb-3" />
              )}
              
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <button className="flex items-center gap-1 hover:text-brand-primary">
                  <Heart size={16} />
                  <span>{post.likes_count || 0}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-brand-primary">
                  <MessageCircle size={16} />
                  <span>{post.comments_count || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ============================================
// SERVICE SCREEN
// ============================================

function ServiceScreen({ maintenance, setMaintenance, appointments, setAppointments, customer, workshop, showToast, setShowModal }) {
  return (
    <div className="fade-in">
      <div className="p-4 border-b border-dark-border">
        <h2 className="text-xl font-bold">Manutenzione & Service</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Appointments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Prossimi Appuntamenti</h3>
            <button className="text-sm text-brand-primary">Prenota</button>
          </div>
          {appointments.filter(a => a.status === 'pending').length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center text-sm text-gray-400">
              Nessun appuntamento prenotato
            </div>
          ) : (
            appointments.filter(a => a.status === 'pending').map(app => (
              <div key={app.id} className="bg-dark-card border border-dark-border rounded-lg p-4 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{app.service_type}</span>
                  <span className="text-sm text-brand-primary">{app.status}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {format(new Date(app.date), 'dd MMM yyyy', { locale: it })} alle {app.time}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Maintenance History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Storico Manutenzione</h3>
            <button onClick={() => setShowModal('addMaintenance')} className="text-sm text-brand-primary">
              + Aggiungi
            </button>
          </div>
          {maintenance.length === 0 ? (
            <div className="bg-dark-card border border-dark-border rounded-lg p-4 text-center text-sm text-gray-400">
              Nessuna manutenzione registrata
            </div>
          ) : (
            maintenance.map(maint => (
              <div key={maint.id} className="bg-dark-card border border-dark-border rounded-lg p-4 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{maint.type.toUpperCase()}</span>
                  {maint.verified && (
                    <span className="text-xs bg-green-500 bg-opacity-20 text-green-500 px-2 py-1 rounded">
                      Verificato
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {format(new Date(maint.date), 'dd MMM yyyy', { locale: it })} - {maint.km} km
                </div>
                {maint.description && (
                  <p className="text-sm mb-2">{maint.description}</p>
                )}
                {maint.cost && (
                  <div className="text-sm text-brand-primary">€{maint.cost.toFixed(2)}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// MODALS
// ============================================

function ProfileModal({ customer, workshop, onClose, onLogout }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Profilo</h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-brand-primary mx-auto mb-3 flex items-center justify-center text-2xl">
              {customer.avatar_url ? (
                <img src={customer.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                customer.name?.charAt(0).toUpperCase()
              )}
            </div>
            <h2 className="text-xl font-bold">{customer.name}</h2>
            <p className="text-sm text-gray-400">{customer.email}</p>
          </div>

          <div className="space-y-3">
            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Moto</div>
              <div className="font-medium">
                {customer.bike_brand} {customer.bike_model} {customer.bike_year && `(${customer.bike_year})`}
              </div>
            </div>
            
            {customer.plate_number && (
              <div className="bg-dark-bg rounded-lg p-3">
                <div className="text-sm text-gray-400 mb-1">Targa</div>
                <div className="font-medium">{customer.plate_number}</div>
              </div>
            )}

            <div className="bg-dark-bg rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-1">Km attuali</div>
              <div className="font-medium">{customer.current_km?.toLocaleString('it-IT') || 0} km</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3 bg-red-500 bg-opacity-20 text-red-500 rounded-lg font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

function AddTripModal({ customer, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    distance: '',
    duration: '',
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          customer_id: customer.id,
          workshop_id: customer.workshop_id,
          ...formData,
          distance: parseFloat(formData.distance),
          duration: formData.duration ? parseFloat(formData.duration) : null
        })
        .select()
        .single()

      if (error) throw error
      onSave(data)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      alert('Errore nel salvare il viaggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Nuovo Viaggio</h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Titolo</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Es: Weekend in Toscana"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Data</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Km</label>
              <input
                type="number"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                required
                min="0"
                step="0.1"
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Ore (opz.)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                min="0"
                step="0.5"
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Note (opzionale)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-brand rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Salva Viaggio'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AddRestaurantModal({ workshop, customer, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'traditional',
    rating: 3,
    notes: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          workshop_id: workshop.id,
          added_by: customer.id,
          ...formData,
          rating: parseInt(formData.rating)
        })
        .select()
        .single()

      if (error) throw error
      onSave(data)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      alert('Errore nel salvare il ristorante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-bold">Aggiungi Ristorante</h3>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Località</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
            >
              <option value="pizza">Pizzeria</option>
              <option value="traditional">Tradizionale</option>
              <option value="quick">Fast Food</option>
              <option value="gourmet">Gourmet</option>
              <option value="bar">Bar/Caffè</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className={`text-2xl ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Note (opzionale)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg focus:outline-none focus:border-brand-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 btn-brand rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Salva Ristorante'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
