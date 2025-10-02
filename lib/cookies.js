// Cookie management utilities for city selection

export const CITY_COOKIE_NAME = 'urban-planner-selected-city'
export const CITY_COOKIE_EXPIRY_DAYS = 30

// Set city selection in cookies
export function setSelectedCity(country, city) {
  if (typeof window === 'undefined') return
  
  const cityData = {
    country,
    city,
    timestamp: Date.now()
  }
  
  const expires = new Date()
  expires.setDate(expires.getDate() + CITY_COOKIE_EXPIRY_DAYS)
  
  document.cookie = `${CITY_COOKIE_NAME}=${JSON.stringify(cityData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

// Get city selection from cookies
export function getSelectedCity() {
  if (typeof window === 'undefined') return null
  
  try {
    const cookies = document.cookie.split(';')
    const cityCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${CITY_COOKIE_NAME}=`)
    )
    
    if (!cityCookie) return null
    
    const cookieValue = cityCookie.split('=')[1]
    const cityData = JSON.parse(decodeURIComponent(cookieValue))
    
    // Check if cookie is still valid (not older than expiry days)
    const now = Date.now()
    const cookieAge = now - cityData.timestamp
    const maxAge = CITY_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000 // Convert to milliseconds
    
    if (cookieAge > maxAge) {
      clearSelectedCity()
      return null
    }
    
    return {
      country: cityData.country,
      city: cityData.city
    }
  } catch (error) {
    console.error('Error reading city cookie:', error)
    clearSelectedCity()
    return null
  }
}

// Clear city selection from cookies
export function clearSelectedCity() {
  if (typeof window === 'undefined') return
  
  document.cookie = `${CITY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// Check if a city selection exists in cookies
export function hasSelectedCity() {
  return getSelectedCity() !== null
}
