'use client';

import React from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Clock,
} from 'lucide-react';

// Authentic Brand SVG Icons
function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z" />
    </svg>
  );
}

function YoutubeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function PinterestIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.33 1.366-.053.225-.172.271-.401.165-1.495-.695-2.433-2.878-2.433-4.632 0-3.774 2.743-7.241 7.906-7.241 4.15 0 7.377 2.957 7.377 6.91 0 4.124-2.599 7.444-6.208 7.444-1.212 0-2.352-.63-2.744-1.377l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export const SOCIAL_PLATFORM_CONFIG = {
  instagram: {
    name: 'Instagram',
    icon: InstagramIcon,
    placeholder: 'https://instagram.com/yourstudio',
    prefix: 'https://instagram.com/',
  },
  facebook: {
    name: 'Facebook',
    icon: FacebookIcon,
    placeholder: 'https://facebook.com/yourstudio',
    prefix: 'https://facebook.com/',
  },
  youtube: {
    name: 'YouTube',
    icon: YoutubeIcon,
    placeholder: 'https://youtube.com/@yourstudio',
    prefix: 'https://youtube.com/',
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: MessageSquare,
    placeholder: '+91 98765 43210 or full wa.me link',
    prefix: 'https://wa.me/',
  },
  pinterest: {
    name: 'Pinterest',
    icon: PinterestIcon,
    placeholder: 'https://pinterest.com/yourstudio',
    prefix: 'https://pinterest.com/',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: LinkedinIcon,
    placeholder: 'https://linkedin.com/company/yourstudio',
    prefix: 'https://linkedin.com/in/',
  },
};

/**
 * Normalizes WhatsApp input into a valid wa.me URL
 */
export function formatWhatsAppUrl(rawVal) {
  if (!rawVal) return '';
  const trimmed = String(rawVal).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits.startsWith('91') && digits.length >= 12 ? digits : digits.length === 10 ? `91${digits}` : digits}`;
}

/**
 * Validates social link input
 */
export function validateSocialLink(platform, value) {
  if (!value || typeof value !== 'string' || value.trim() === '') return { isValid: true, message: '' };
  const trimmed = value.trim();

  if (platform === 'whatsapp') {
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)/i.test(trimmed)) {
      return { isValid: true, message: '' };
    }
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) {
      return { isValid: true, message: '' };
    }
    return {
      isValid: false,
      message: 'Enter a valid 10-digit number with country code (e.g. +91 98765 43210) or wa.me link',
    };
  }

  // URL platforms
  try {
    const urlObj = new URL(trimmed);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, message: 'URL must begin with http:// or https://' };
    }
    const host = urlObj.hostname.toLowerCase();
    if (platform === 'instagram' && !host.includes('instagram.com')) {
      return { isValid: false, message: 'Must be an instagram.com link' };
    }
    if (platform === 'facebook' && !host.includes('facebook.com') && !host.includes('fb.me')) {
      return { isValid: false, message: 'Must be a facebook.com link' };
    }
    if (platform === 'youtube' && !host.includes('youtube.com') && !host.includes('youtu.be')) {
      return { isValid: false, message: 'Must be a youtube.com link' };
    }
    if (platform === 'pinterest' && !host.includes('pinterest.com') && !host.includes('pin.it')) {
      return { isValid: false, message: 'Must be a pinterest.com link' };
    }
    if (platform === 'linkedin' && !host.includes('linkedin.com')) {
      return { isValid: false, message: 'Must be a linkedin.com link' };
    }
    return { isValid: true, message: '' };
  } catch (err) {
    return { isValid: false, message: 'Please enter a valid URL starting with https://' };
  }
}

/**
 * Renders Social Media Icons
 */
export function FooterSocialIcons({ socialLinks = [], accentColor = '#F97316' }) {
  if (!Array.isArray(socialLinks) || socialLinks.length === 0) return null;

  const validItems = socialLinks.filter((item) => {
    if (!item?.enabled || !item?.url || typeof item.url !== 'string') return false;
    const trimmed = item.url.trim();
    if (!trimmed) return false;
    return validateSocialLink(item.platform, trimmed).isValid;
  });

  if (validItems.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2.5 pt-1">
      {validItems.map((item) => {
        const conf = SOCIAL_PLATFORM_CONFIG[item.platform] || { name: item.platform, icon: ExternalLink };
        const IconComponent = conf.icon;
        const href = item.platform === 'whatsapp' ? formatWhatsAppUrl(item.url) : item.url.trim();

        return (
          <a
            key={item.platform}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={conf.name}
            aria-label={conf.name}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all border shadow-2xs hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              color: 'currentColor',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = accentColor;
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = 'currentColor';
            }}
          >
            <IconComponent className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
}

/**
 * Customizable Footer Renderer
 * Used for both the Live Preview in Website Settings and on the Published Public Website
 */
export default function CustomizableFooter({
  footerSettings = {},
  business = {},
  businessHours = [],
  servicesCount = 0,
  packagesCount = 0,
  portfolioCount = 0,
  slug = '',
  isPreview = false,
}) {
  const currentYear = new Date().getFullYear();
  const studioName = footerSettings.studio_name || business.name || 'Bridal Makeup Studio';
  const logoUrl = footerSettings.logo_url || business.logo_url;
  const description =
    footerSettings.description ||
    'Bridal makeup artistry for your most memorable moments.';
  const layout = footerSettings.layout || 'multi_column';
  const bgColor = footerSettings.background_color || '#1C1917';
  const textColor = footerSettings.text_color || '#A8A29E';
  const accentColor = footerSettings.accent_color || '#F97316';

  const showLogo = footerSettings.show_logo ?? true;
  const showSocialLinks = footerSettings.show_social_links ?? true;
  const showQuickLinks = footerSettings.show_quick_links ?? true;
  const showContactInfo = footerSettings.show_contact_info ?? true;
  const showCopyright = footerSettings.show_copyright ?? true;

  const rawCopyright = footerSettings.copyright_text || `© {currentYear} {businessName}. All rights reserved.`;
  const copyrightText = rawCopyright
    .replace('{currentYear}', String(currentYear))
    .replace('{businessName}', studioName);

  const socialLinks = Array.isArray(footerSettings.social_links) ? footerSettings.social_links : [];
  const quickLinks = Array.isArray(footerSettings.quick_links) ? footerSettings.quick_links : [];
  const contact = footerSettings.contact_settings || {};

  // Plan entitlement filtering for navigation links
  // Starter businesses must not receive public service/package/portfolio navigation if not available
  const filteredQuickLinks = quickLinks.filter((link) => {
    if (!link || !link.enabled || !link.label) return false;
    const url = (link.url || '').toLowerCase();
    if (url.includes('services') && servicesCount === 0 && !isPreview) return false;
    if (url.includes('packages') && packagesCount === 0 && !isPreview) return false;
    if (url.includes('portfolio') && portfolioCount === 0 && !isPreview) return false;
    return true;
  });

  const phone = contact.phone || business.business_phone || '';
  const email = contact.email || business.business_email || '';
  const address = contact.address || (business.city && business.state ? `${business.city}, ${business.state}, India` : business.city || '');
  const mapUrl = contact.map_url || '';

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Scroll to top handler
  const handleScrollTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      className={`w-full relative transition-colors duration-200 border-t border-white/10 ${
        isPreview ? 'py-8 px-4 sm:px-6' : 'py-12 sm:py-16 px-4 sm:px-6 lg:px-8'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* LAYOUT 1: MULTI-COLUMN */}
        {layout === 'multi_column' && (
          <div
            className={`grid gap-6 sm:gap-8 pb-8 sm:pb-12 ${
              isPreview
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10'
            }`}
          >
            {/* Branding Column */}
            <div
              className={`space-y-4 ${
                isPreview ? 'col-span-1' : 'sm:col-span-2 lg:col-span-4'
              }`}
            >
              <div className="flex items-center gap-3">
                {showLogo && logoUrl && (
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-white/10 p-1 border border-white/15 shrink-0 flex items-center justify-center shadow-xs">
                    <img src={logoUrl} alt={studioName} className="w-full h-full object-cover rounded-xl" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight truncate block">
                    {studioName}
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium block truncate" style={{ color: accentColor }}>
                    Luxury Bridal Artistry Studio
                  </span>
                </div>
              </div>

              {description && (
                <p className="text-xs leading-relaxed max-w-sm" style={{ color: textColor }}>
                  {description}
                </p>
              )}

              {showSocialLinks && socialLinks.length > 0 && (
                <FooterSocialIcons socialLinks={socialLinks} accentColor={accentColor} />
              )}
            </div>

            {/* Quick Links Column */}
            {showQuickLinks && filteredQuickLinks.length > 0 && (
              <div
                className={`space-y-3 ${
                  isPreview ? 'sm:col-span-1 lg:col-span-1' : 'sm:col-span-1 lg:col-span-2'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: accentColor }}>
                  Explore
                </span>
                <ul className="space-y-2 text-xs">
                  {filteredQuickLinks.map((link, idx) => (
                    <li key={link.id || idx}>
                      <a
                        href={link.url}
                        className="transition-colors hover:underline inline-block py-0.5"
                        style={{ color: textColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = textColor)}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                  {slug && (
                    <li>
                      <a
                        href={`/${slug}/enquiry-form`}
                        className="inline-flex items-center gap-1 font-semibold py-0.5 transition-colors"
                        style={{ color: accentColor }}
                      >
                        <span>Enquiry Form</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Studio Hours Column */}
            {showContactInfo && contact.show_hours !== false && (
              <div
                className={`space-y-3 ${
                  isPreview ? 'sm:col-span-1 lg:col-span-1' : 'sm:col-span-1 lg:col-span-3'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: accentColor }}>
                  Studio Hours
                </span>
                <ul className="space-y-1.5 text-xs">
                  {businessHours && businessHours.length > 0 ? (
                    businessHours.map((h) => (
                      <li key={h.day_of_week} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
                        <span className="font-medium text-white/80">{dayNames[h.day_of_week]}</span>
                        <span className={h.is_closed ? 'opacity-50 font-medium' : 'font-semibold text-white'}>
                          {h.is_closed ? 'Closed' : `${h.open_time} – ${h.close_time}`}
                        </span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
                        <span className="font-medium text-white/80">Mon – Sat</span>
                        <span className="font-semibold text-white">09:00 AM – 08:00 PM</span>
                      </li>
                      <li className="flex items-center justify-between gap-2 border-b border-white/5 pb-1">
                        <span className="font-medium text-white/80">Sunday</span>
                        <span className="opacity-50 font-medium">Closed</span>
                      </li>
                    </>
                  )}
                  <li className="flex items-center justify-between gap-2 pt-1 font-medium" style={{ color: accentColor }}>
                    <span>Wedding Trials</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] border border-white/20 bg-white/5">
                      By Appointment
                    </span>
                  </li>
                </ul>
              </div>
            )}

            {/* Contact Details Column */}
            {showContactInfo && (
              <div
                className={`space-y-3 ${
                  isPreview ? 'col-span-1' : 'sm:col-span-2 lg:col-span-3'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: accentColor }}>
                  Studio Contact
                </span>
                <div className="text-xs space-y-2.5 leading-relaxed">
                  {contact.show_address !== false && address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
                      {mapUrl && contact.show_map !== false ? (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-white transition-colors"
                        >
                          {address}
                        </a>
                      ) : (
                        <span>{address}</span>
                      )}
                    </div>
                  )}

                  {contact.show_phone !== false && phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                      <a href={`tel:${phone}`} className="hover:underline hover:text-white transition-colors">
                        +91 {phone}
                      </a>
                    </div>
                  )}

                  {contact.show_email !== false && email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                      <a href={`mailto:${email}`} className="hover:underline hover:text-white transition-colors">
                        {email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LAYOUT 2: CENTERED */}
        {layout === 'centered' && (
          <div className="flex flex-col items-center text-center space-y-6 pb-12 max-w-2xl mx-auto">
            {showLogo && logoUrl && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 p-1.5 border border-white/15">
                <img src={logoUrl} alt={studioName} className="w-full h-full object-cover rounded-xl" />
              </div>
            )}

            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">{studioName}</h3>
              {description && (
                <p className="text-xs leading-relaxed max-w-md mx-auto mt-2" style={{ color: textColor }}>
                  {description}
                </p>
              )}
            </div>

            {/* Quick Links Horizontal */}
            {showQuickLinks && filteredQuickLinks.length > 0 && (
              <nav aria-label="Footer navigation">
                <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
                  {filteredQuickLinks.map((link, idx) => (
                    <li key={link.id || idx}>
                      <a
                        href={link.url}
                        className="transition-colors hover:underline"
                        style={{ color: textColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = textColor)}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                  {slug && (
                    <li>
                      <a
                        href={`/${slug}/enquiry-form`}
                        className="inline-flex items-center gap-1 font-semibold"
                        style={{ color: accentColor }}
                      >
                        <span>Enquiry Form</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  )}
                </ul>
              </nav>
            )}

            {/* Contact details line */}
            {showContactInfo && (phone || email || address) && (
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1" style={{ color: textColor }}>
                {contact.show_phone !== false && phone && (
                  <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-white">
                    <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span>+91 {phone}</span>
                  </a>
                )}
                {contact.show_email !== false && email && (
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 hover:text-white">
                    <Mail className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span>{email}</span>
                  </a>
                )}
                {contact.show_address !== false && address && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span>{address}</span>
                  </span>
                )}
              </div>
            )}

            {showSocialLinks && socialLinks.length > 0 && (
              <FooterSocialIcons socialLinks={socialLinks} accentColor={accentColor} />
            )}
          </div>
        )}

        {/* LAYOUT 3: CLASSIC */}
        {layout === 'classic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pb-12">
            {/* Left Column: Branding & Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {showLogo && logoUrl && (
                  <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/10 p-1 border border-white/15 shrink-0 flex items-center justify-center">
                    <img src={logoUrl} alt={studioName} className="w-full h-full object-cover rounded-xl" />
                  </div>
                )}
                <div>
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight block">
                    {studioName}
                  </span>
                  <span className="text-xs font-medium" style={{ color: accentColor }}>
                    Luxury Bridal Makeup Studio
                  </span>
                </div>
              </div>

              {description && (
                <p className="text-xs leading-relaxed max-w-sm" style={{ color: textColor }}>
                  {description}
                </p>
              )}

              {showContactInfo && (
                <div className="text-xs space-y-1.5 pt-1">
                  {contact.show_phone !== false && phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      <a href={`tel:${phone}`} className="hover:underline hover:text-white">
                        +91 {phone}
                      </a>
                    </div>
                  )}
                  {contact.show_email !== false && email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      <a href={`mailto:${email}`} className="hover:underline hover:text-white">
                        {email}
                      </a>
                    </div>
                  )}
                  {contact.show_address !== false && address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      <span>{address}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Quick Links & Social Icons */}
            <div className="flex flex-col md:items-end space-y-5">
              {showQuickLinks && filteredQuickLinks.length > 0 && (
                <div className="space-y-2 md:text-right">
                  <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: accentColor }}>
                    Quick Navigation
                  </span>
                  <ul className="flex flex-wrap md:justify-end gap-x-5 gap-y-2 text-xs">
                    {filteredQuickLinks.map((link, idx) => (
                      <li key={link.id || idx}>
                        <a
                          href={link.url}
                          className="transition-colors hover:underline"
                          style={{ color: textColor }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = textColor)}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                    {slug && (
                      <li>
                        <a
                          href={`/${slug}/enquiry-form`}
                          className="inline-flex items-center gap-1 font-semibold"
                          style={{ color: accentColor }}
                        >
                          <span>Enquiry Form</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {showSocialLinks && socialLinks.length > 0 && (
                <div className="space-y-2 md:text-right">
                  <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: accentColor }}>
                    Follow Studio
                  </span>
                  <FooterSocialIcons socialLinks={socialLinks} accentColor={accentColor} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTOM BAR: COPYRIGHT & BACK TO TOP */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {showCopyright ? (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
              <span>{copyrightText}</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-white/60 font-medium">
                Powered by <strong style={{ color: accentColor }}>VARNAM</strong> Bridal Studio Suite
              </span>
            </div>
          ) : (
            <div />
          )}

          {!isPreview && (
            <button
              type="button"
              onClick={handleScrollTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 text-[11px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95 hover:bg-white/10 hover:text-white"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: textColor,
              }}
            >
              <span>Back to Top</span>
              <span style={{ color: accentColor }} className="font-bold">
                &uarr;
              </span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
