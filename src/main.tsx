import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'
import { render } from 'solid-js/web'
import { Show, Suspense } from 'solid-js'
import { Transition } from 'solid-transition-group'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import DBTest from './routes/DBtest'
// Import admin routes
import AlbumsPage from './routes/admin/albums'
import SongsPage from './routes/admin/songs'

import './styles.css'

import {
  SidebarProvider,
  SidebarTrigger,
} from './components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/ui/tooltip"
import { AppSidebar, navRoutes } from './components/AppSidebar'

const rootRoute = createRootRoute({
  component: () => {
    const location = useLocation();

    return (
      <SidebarProvider>
        <AppSidebar />
        <main class="flex flex-col flex-grow h-screen overflow-hidden p-2 transition-all duration-150 ease-in data-[sidebar-open=true]:md:ml-[var(--sidebar-width)] min-w-0">
          <div class="flex-shrink-0 p-1.5 border border-gray-200 !bg-transparent !backdrop-blur-sm rounded-lg flex items-center gap-x-3">
            <Tooltip openDelay={500}>
              <TooltipTrigger>
                <SidebarTrigger />
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Sidebar</p>
              </TooltipContent>
            </Tooltip>
            <div class="text-base font-semibold text-slate-700 dark:text-slate-300">
              {(() => {
                const currentPath = location().pathname;
                const route = navRoutes.find((r: { path: string }) => r.path === currentPath);
                if (route) {
                  return route.name;
                }
                const segments = currentPath.split('/').filter(s => s.length > 0);
                if (segments.length > 0) {
                  // Capitalize first letter of the first segment
                  return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
                }
                return 'Page'; // Fallback
              })()}
            </div>
          </div>
          <div class="flex-grow overflow-y-auto py-4 relative">
            <Suspense fallback={
              <div class="w-full h-full flex items-center justify-center">
                <p>Loading...</p>
              </div>
            }>
              <Transition
                mode="outin"
                onEnter={(el, done) => {
                  const animation = el.animate(
                    [
                      { opacity: 0, transform: 'translateY(10px)' },
                      { opacity: 1, transform: 'translateY(0px)' }
                    ],
                    { duration: 200, easing: 'ease-in-out' }
                  );
                  animation.finished.then(done);
                }}
                onExit={(el, done) => {
                  const animation = el.animate(
                    [
                      { opacity: 1 },
                      { opacity: 0 }
                    ],
                    { duration: 150, easing: 'ease-in-out' }
                  );
                  animation.finished.then(done);
                }}
              >
                <Show when={location().pathname} keyed>
                  {(_pathname) => ( 
                    <div class="page-container">
                      <Outlet />
                    </div>
                  )}
                </Show>
              </Transition>
            </Suspense>
          </div>
          <TanStackRouterDevtools position="bottom-right" />
        </main>
      </SidebarProvider>
    );
  },
})



const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DBTest,
  errorComponent: () => (
    <div class="p-4 text-red-500">
      An error occurred while loading this component. 
      Please check the console for more details.
    </div>
  )
})

// Admin routes
const adminAlbumsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/albums',
  component: AlbumsPage,
  errorComponent: () => (
    <div class="p-4 text-red-500">
      An error occurred while loading the Albums page. 
      Please check the console for more details.
    </div>
  )
})

const adminSongsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/songs',
  component: SongsPage,
  errorComponent: () => (
    <div class="p-4 text-red-500">
      An error occurred while loading the Songs page. 
      Please check the console for more details.
    </div>
  )
})

// Add more admin routes as needed

const routeTree = rootRoute.addChildren([
  indexRoute, 
  adminAlbumsRoute,
  adminSongsRoute,
])

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/solid-router' {
  interface Register {
    router: typeof router
  }
}

// Create a new QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      gcTime: 1000 * 60 * 30, // 30 minutes
      suspense: true,
    },
  },
});

function MainApp() {
  return (
    // Wrap RouterProvider with QueryClientProvider
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('app')
if (rootElement) {
  render(() => <MainApp />, rootElement)
}
