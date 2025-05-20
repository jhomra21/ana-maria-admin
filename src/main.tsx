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
import { Show} from 'solid-js'
import { Transition } from 'solid-transition-group'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import SkeuIcongenPage from './routes/SkeuIcongenPage'

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
                  { duration: 200, easing: 'ease-in-out' }
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
  component: SkeuIcongenPage,
})

const routeTree = rootRoute.addChildren([indexRoute])

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
const queryClient = new QueryClient();

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
