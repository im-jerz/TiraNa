import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Loading from './components/Loading.jsx'

const Homepage = lazy(() => import('./pages/Homepage.jsx'))
const AllProperties = lazy(() => import('./pages/AllProperties.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const Signin = lazy(() => import('./pages/Signin.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))
const PropertyDetails = lazy(() => import('./pages/PropertyDetails.jsx'))
const Booking = lazy(() => import('./pages/Booking.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const MyBookings = lazy(() => import('./pages/MyBookings.jsx'))
const Reviews = lazy(() => import('./pages/Reviews.jsx'))
const SavedProperties = lazy(() => import('./pages/SavedProperties.jsx'))
const HostProfile = lazy(() => import('./pages/HostProfile.jsx'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess.jsx'))
const PaymentCancel = lazy(() => import('./pages/PaymentCancel.jsx'))

const noFooterRoutes = ['/client/signup', '/client/signin', '/client/forgot-password', '/client/reset-password']

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function App() {
  const { pathname } = useLocation()
  const showFooter = !noFooterRoutes.some(r => pathname.startsWith(r))

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Suspense fallback={<Loading />}>
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
          <Route path="/saved" element={<SavedProperties />} />
          <Route path="/about" element={<About />} />
          <Route path="/hosts/:id" element={<HostProfile />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
        </Routes>
      </Suspense>
      {showFooter && <Footer />}
    </div>
  )
}

export default App
