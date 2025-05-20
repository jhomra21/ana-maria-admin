import { Link, useLocation } from '@tanstack/solid-router';
import { For, createMemo, children } from 'solid-js';
import { Icon, type IconName } from './ui/icon';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from './ui/sidebar';
// Tooltip components are not directly used by AppSidebar itself, but by its parent in main.tsx
// However, SidebarMenuButton can accept a tooltip prop, which is used here.
// So, if SidebarMenuButton itself internally uses Tooltip, these might not be needed here directly,
// but it's safer to keep them if the button relies on context or specific imports.
// For now, assuming SidebarMenuButton handles its tooltip internally or it's passed as a simple string.
// If Tooltip components are needed here directly for <SidebarMenuButton tooltip={...}> to function,
// they would need to be imported. Let's assume they are not for now and can be removed if unused.

export const navRoutes: { path: string; name: string; iconName: IconName }[] = [
  { path: '/', name: 'Home', iconName: 'house' },
];

export function AppSidebar() {
  const { setOpenMobile, isMobile, state } = useSidebar();
  const location = useLocation();
  
  const currentPath = () => location().pathname;

  const handleLinkClick = () => {
    if (isMobile()) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <For each={navRoutes}>
                {(route) => {
                  const isActive = createMemo(() => {
                    return currentPath() === route.path;
                  });
                  
                  const linkChildren = children(() => (
                    <div class="flex items-center gap-2 relative w-full">
                      <Icon name={route.iconName} class="h-5 w-5 absolute transition-all duration-200" classList={{
                        "left-0": state() === "expanded",
                        "-left-0.5": state() === "collapsed"
                      }} />
                      <span class="transition-all duration-200 pl-7 transform-gpu" classList={{ 
                        "opacity-0 blur-md pointer-events-none absolute text-2xl": state() === "collapsed",
                        "opacity-100 blur-0": state() === "expanded"
                      }}>
                        {route.name}
                      </span>
                    </div>
                  ));

                  return (
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        as={Link} 
                        to={route.path} 
                        preload="intent"
                        class="w-full text-left"
                        onClick={handleLinkClick}
                        tooltip={route.name} // SidebarMenuButton uses this prop
                        isActive={isActive()}
                      >
                        {linkChildren()} 
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }}
              </For>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
} 