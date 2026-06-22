import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Homepage from './pages/Homepage.jsx'
import AllProperties from './pages/AllProperties.jsx'
import Signup from './pages/Signup.jsx'
import Signin from './pages/Signin.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Profile from './pages/Profile.jsx'
import PropertyDetails from './pages/PropertyDetails.jsx'
import Booking from './pages/Booking.jsx'
import About from './pages/About.jsx'
import Notifications from './pages/Notifications.jsx'
import MyBookings from './pages/MyBookings.jsx'
import Reviews from './pages/Reviews.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/properties" element={<AllProperties />} />
      <Route path="/properties/:id" element={<PropertyDetails />} />
      <Route path="/client/signup" element={<Signup />} />
      <Route path="/client/signin" element={<Signin />} />
      <Route path="/client/forgot-password" element={<ForgotPassword />} />
      <Route path="/client/reset-password" element={<ResetPassword />} />
        <Route path="/client/profile" element={<Profile />} />
        <Route path="/client/notifications" element={<Notifications />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/bookings/:id/new" element={<Booking />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/about" element={<About />} />
    </Routes>
    </>
  )
}

export default App
