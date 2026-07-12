import { Link } from 'react-router-dom'

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function PaymentCancel() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <XIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal mb-3">Payment Cancelled</h1>
        <p className="text-sm text-gray-500 mb-6">Your payment was cancelled. No charges have been made. You can try again from your bookings.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/bookings"
            className="px-6 py-3 bg-sage text-white font-medium uppercase tracking-wider text-sm hover:bg-olive transition-colors"
          >
            View My Bookings
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-gray-200 text-charcoal font-medium uppercase tracking-wider text-sm hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancel
