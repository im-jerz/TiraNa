import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-charcoal text-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">TiraNa</h3>
            <p className="text-xs sm:text-sm leading-relaxed">Ang iyong pinagkakatiwalaang platform para sa mga accommodation sa buong Pilipinas.</p>
          </div>
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">About</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Our Story</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Contact</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link to="/contact" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Support</Link></li>
              <li><button onClick={() => window.location = 'mailto:support@stayhub.com'} className="hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer text-xs sm:text-sm text-white/60">Email Us</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Legal</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} TiraNa. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/sitemap" className="hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
