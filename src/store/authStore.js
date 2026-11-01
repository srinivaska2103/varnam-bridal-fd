import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  memberships: [],
  currentBusiness: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: ({ user, token, memberships }) => {
    const cleanMemberships = memberships || [];
    const firstMembership = cleanMemberships[0];

    const userRole = user?.role || firstMembership?.role || 'USER';

    const defaultBusiness = firstMembership
      ? {
          id: firstMembership.businessId || firstMembership.id || firstMembership.businesses?.id,
          name: firstMembership.businessName || firstMembership.name || firstMembership.businesses?.name || 'VARNAM Bridal Studio',
          slug: firstMembership.businessSlug || firstMembership.slug || firstMembership.businesses?.slug,
          logo_url: firstMembership.businessLogo || firstMembership.logo_url || firstMembership.logoUrl || firstMembership.businesses?.logo_url,
          role: firstMembership.role || userRole,
          ...firstMembership,
        }
      : null;

    // Retain explicit verified role without blindly defaulting to OWNER
    const resolvedRole = defaultBusiness?.role || userRole;
    const cleanUser = user ? { ...user, role: resolvedRole } : null;

    if (typeof window !== 'undefined') {
      const isUserRole = resolvedRole === 'USER';
      const tokenKey = isUserRole ? 'vexa_user_token' : 'vexa_admin_token';
      const userKey = isUserRole ? 'vexa_user_user' : 'vexa_admin_user';
      const memKey = isUserRole ? 'vexa_user_memberships' : 'vexa_admin_memberships';

      if (token) {
        localStorage.setItem(tokenKey, token);
        localStorage.setItem('vexa_auth_token', token);
      }
      if (cleanUser) {
        localStorage.setItem(userKey, JSON.stringify(cleanUser));
        localStorage.setItem('vexa_auth_user', JSON.stringify(cleanUser));
      }
      if (cleanMemberships) {
        localStorage.setItem(memKey, JSON.stringify(cleanMemberships));
        localStorage.setItem('vexa_memberships', JSON.stringify(cleanMemberships));
      }
      if (defaultBusiness?.id) {
        localStorage.setItem('vexa_active_business_id', defaultBusiness.id);
      }
    }

    set({
      user: cleanUser,
      token,
      memberships: cleanMemberships,
      currentBusiness: defaultBusiness,
      isAuthenticated: !!token,
      isInitialized: true,
    });
  },

  setCurrentBusiness: (business) => {
    if (typeof window !== 'undefined' && business) {
      const bId = business.id || business.business_id;
      localStorage.setItem('vexa_active_business_id', bId);
    }
    set({ currentBusiness: business });
  },

  logout: (portalScope) => {
    let userRole = null;
    let studioSlug = null;

    // First check state memory before clearing
    const state = get();
    userRole = state.currentBusiness?.role || state.user?.role;
    studioSlug = state.currentBusiness?.slug || state.currentBusiness?.businessSlug;

    if (typeof window !== 'undefined') {
      const isUserScope = portalScope === 'USER' || window.location.pathname.includes('/user');
      try {
        const userKey = isUserScope ? 'vexa_user_user' : 'vexa_admin_user';
        const userStr = localStorage.getItem(userKey) || localStorage.getItem('vexa_auth_user');
        const memKey = isUserScope ? 'vexa_user_memberships' : 'vexa_admin_memberships';
        const membershipsStr = localStorage.getItem(memKey) || localStorage.getItem('vexa_memberships');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (!userRole) userRole = u?.role;
        }
        if (membershipsStr) {
          const m = JSON.parse(membershipsStr);
          if (!studioSlug) studioSlug = m?.[0]?.businessSlug || m?.[0]?.slug || m?.[0]?.businesses?.slug;
          if (!userRole && m?.[0]?.role) userRole = m?.[0]?.role;
        }
      } catch (e) {
        // ignore parse error
      }

      if (isUserScope) {
        localStorage.removeItem('vexa_user_token');
        localStorage.removeItem('vexa_user_user');
        localStorage.removeItem('vexa_user_memberships');
      } else {
        localStorage.removeItem('vexa_admin_token');
        localStorage.removeItem('vexa_admin_user');
        localStorage.removeItem('vexa_admin_memberships');
      }
      localStorage.removeItem('vexa_auth_token');
      localStorage.removeItem('vexa_auth_user');
      localStorage.removeItem('vexa_memberships');
      localStorage.removeItem('vexa_active_business_id');
    }
    set({
      user: null,
      token: null,
      memberships: [],
      currentBusiness: null,
      isAuthenticated: false,
      isInitialized: true,
    });
    return { userRole, studioSlug };
  },

  initialize: async () => {
    if (typeof window === 'undefined') return;

    try {
      const path = window.location.pathname;
      const isUserRoute = path.includes('/user/') || path.endsWith('/user');

      // 1. Read isolated storage keys corresponding to current portal context
      const tokenKey = isUserRoute ? 'vexa_user_token' : 'vexa_admin_token';
      const userKey = isUserRoute ? 'vexa_user_user' : 'vexa_admin_user';
      const memKey = isUserRoute ? 'vexa_user_memberships' : 'vexa_admin_memberships';

      const token = localStorage.getItem(tokenKey) || localStorage.getItem('vexa_auth_token');
      const userStr = localStorage.getItem(userKey) || localStorage.getItem('vexa_auth_user');
      const membershipsStr = localStorage.getItem(memKey) || localStorage.getItem('vexa_memberships');
      const activeBusinessId = localStorage.getItem('vexa_active_business_id');

      if (!token) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AuthDebug] No session token found for scope:', isUserRoute ? 'USER' : 'ADMIN');
        }
        set({ isInitialized: true, isAuthenticated: false, user: null, currentBusiness: null });
        return;
      }

      // Synchronously read local cache for instant paint without flash
      let user = null;
      let memberships = [];
      let currentBusiness = null;

      try {
        user = userStr ? JSON.parse(userStr) : null;
        memberships = membershipsStr ? JSON.parse(membershipsStr) : [];
      } catch {
        // invalid JSON
      }

      if (memberships && memberships.length > 0) {
        const found = activeBusinessId
          ? memberships.find((m) => (m.businessId || m.business_id || m.id || m.businesses?.id) === activeBusinessId)
          : null;
        const target = found || memberships[0];

        currentBusiness = {
          ...target,
          id: target.businessId || target.business_id || target.id || target.businesses?.id,
          name: target.businessName || target.name || target.businesses?.name || 'VARNAM Bridal Studio',
          slug: target.businessSlug || target.slug || target.businesses?.slug,
          logo_url: target.businessLogo || target.logo_url || target.logoUrl || target.businesses?.logo_url,
          role: target.role || user?.role || (isUserRoute ? 'USER' : 'OWNER'),
        };
      }

      // If local cache has valid user and token, paint initial state
      set({
        user,
        token,
        memberships,
        currentBusiness,
        isAuthenticated: !!token,
        isInitialized: false, // Keep false until backend verification completes below
      });

      // Trusted Backend Authority: Validate session with backend /api/auth/me
      try {
        const { authApi, businessApi } = await import('@/services/api/modules');
        const meRes = await authApi.getMe();
        if (meRes?.data) {
          const freshMemberships = meRes.data.memberships || [];
          const activeId = localStorage.getItem('vexa_active_business_id');
          
          let matchedMembership = null;
          if (freshMemberships.length > 0) {
            matchedMembership = activeId
              ? freshMemberships.find((m) => (m.businessId || m.id) === activeId)
              : null;
            if (!matchedMembership) matchedMembership = freshMemberships[0];
          }

          // Backend is the single source of truth for user role
          const verifiedRole = matchedMembership?.role || meRes.data.role || (meRes.data.is_super_admin ? 'SUPER_ADMIN' : 'USER');

          const freshUser = {
            id: meRes.data.id,
            name: meRes.data.name,
            email: meRes.data.email,
            phone: meRes.data.phone,
            role: verifiedRole,
            is_super_admin: Boolean(meRes.data.is_super_admin),
          };

          const isUserRole = verifiedRole === 'USER';
          const freshTokenKey = isUserRole ? 'vexa_user_token' : 'vexa_admin_token';
          const freshUserKey = isUserRole ? 'vexa_user_user' : 'vexa_admin_user';
          const freshMemKey = isUserRole ? 'vexa_user_memberships' : 'vexa_admin_memberships';

          localStorage.setItem(freshTokenKey, token);
          localStorage.setItem(freshUserKey, JSON.stringify(freshUser));
          localStorage.setItem(freshMemKey, JSON.stringify(freshMemberships));
          localStorage.setItem('vexa_auth_user', JSON.stringify(freshUser));
          localStorage.setItem('vexa_memberships', JSON.stringify(freshMemberships));

          let syncedBusiness = currentBusiness;
          if (matchedMembership) {
            syncedBusiness = {
              ...matchedMembership,
              id: matchedMembership.businessId || matchedMembership.id,
              name: matchedMembership.businessName || matchedMembership.name || 'VARNAM Bridal Studio',
              slug: matchedMembership.businessSlug || matchedMembership.slug,
              logo_url: matchedMembership.businessLogo || matchedMembership.logo_url || matchedMembership.logoUrl,
              role: verifiedRole,
            };
            localStorage.setItem('vexa_active_business_id', syncedBusiness.id);

            // Fetch live business profile for dynamic studio settings/logo
            try {
              const bRes = await businessApi.getById(syncedBusiness.id);
              if (bRes?.data) {
                syncedBusiness = {
                  ...syncedBusiness,
                  ...bRes.data,
                  // Retain verified role explicitly
                  role: verifiedRole,
                  logo_url: bRes.data.logoUrl || bRes.data.logo_url || syncedBusiness.logo_url,
                };
              }
            } catch {
              // Retain syncedBusiness if single call fails
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            console.log('[AuthDebug] Session verified successfully:', {
              path,
              userId: freshUser.id,
              email: freshUser.email,
              verifiedRole,
              studioSlug: syncedBusiness?.slug
            });
          }

          set({
            user: freshUser,
            token,
            memberships: freshMemberships,
            currentBusiness: syncedBusiness,
            isInitialized: true,
            isAuthenticated: true,
          });
          return;
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[AuthDebug] Backend verification error:', err.message, err.response?.status);
        }
        // If server returns 401 Unauthorized, token has expired or is invalid
        if (err.status === 401 || err.response?.status === 401) {
          get().logout(isUserRoute ? 'USER' : 'ADMIN');
          if (isUserRoute) {
            window.location.href = `/${path.split('/')[1] || 'srinivasbridalstudio'}/user/login?expired=true`;
          } else {
            window.location.href = '/login?expired=true';
          }
          return;
        }
      }

      // If backend verification was unreachable but token exists, commit initialized state
      set({ isInitialized: true, isAuthenticated: true });
      return;
    } catch (e) {
      console.error('[AuthDebug] Error initializing auth store:', e);
    }

    set({ isInitialized: true, isAuthenticated: false });
  },
}));
