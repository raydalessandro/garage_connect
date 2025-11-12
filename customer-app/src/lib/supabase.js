import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Multi-tenant helpers - FIXED per demo Aroni Moto
export const getWorkshopSlug = () => {
  const hostname = window.location.hostname
  
  // DEMO MODE: usa sempre aroni-moto
  // Funziona su localhost, Vercel, ovunque!
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('vercel.app')) {
    return 'aroni-moto'  // ← HARDCODED per demo
  }
  
  // Production con custom domain (es: aroni-moto.garageconnect.app)
  const parts = hostname.split('.')
  if (parts.length >= 3) {
    return parts[0] // primo subdomain
  }
  
  // Fallback: sempre aroni-moto
  return 'aroni-moto'
}

export const getWorkshop = async () => {
  const slug = getWorkshopSlug()
  if (!slug) return null
  
  const { data, error } = await supabase
    .from('workshops')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  
  if (error) {
    console.error('Workshop not found:', error)
    return null
  }
  
  return data
}

export const getCurrentCustomer = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('customers')
    .select('*, workshops(*)')
    .eq('auth_user_id', user.id)
    .single()
  
  if (error) {
    console.error('Customer not found:', error)
    return null
  }
  
  return data
}

// Auth helpers
export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signUp = async (email, password, customerData) => {
  // First create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (authError) return { error: authError }
  
  // Then create customer profile
  const workshop = await getWorkshop()
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      auth_user_id: authData.user.id,
      workshop_id: workshop.id,
      email,
      ...customerData
    })
    .select()
    .single()
  
  return { data, error }
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

// Storage helpers
export const uploadTripPhoto = async (tripId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${tripId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('trip-photos')
    .upload(fileName, file)
  
  if (error) return { error }
  
  const { data: { publicUrl } } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(fileName)
  
  return { data: { url: publicUrl }, error: null }
}

export const uploadAvatar = async (customerId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${customerId}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })
  
  if (error) return { error }
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)
  
  return { data: { url: publicUrl }, error: null }
}  if (error) {
    console.error('Workshop not found:', error)
    return null
  }
  
  return data
}

export const getCurrentCustomer = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from('customers')
    .select('*, workshops(*)')
    .eq('auth_user_id', user.id)
    .single()
  
  if (error) {
    console.error('Customer not found:', error)
    return null
  }
  
  return data
}

// Auth helpers
export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({ email, password })
}

export const signUp = async (email, password, customerData) => {
  // First create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (authError) return { error: authError }
  
  // Then create customer profile
  const workshop = await getWorkshop()
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      auth_user_id: authData.user.id,
      workshop_id: workshop.id,
      email,
      ...customerData
    })
    .select()
    .single()
  
  return { data, error }
}

export const signOut = async () => {
  return await supabase.auth.signOut()
}

// Storage helpers
export const uploadTripPhoto = async (tripId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${tripId}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('trip-photos')
    .upload(fileName, file)
  
  if (error) return { error }
  
  const { data: { publicUrl } } = supabase.storage
    .from('trip-photos')
    .getPublicUrl(fileName)
  
  return { data: { url: publicUrl }, error: null }
}

export const uploadAvatar = async (customerId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${customerId}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })
  
  if (error) return { error }
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)
  
  return { data: { url: publicUrl }, error: null }
}
