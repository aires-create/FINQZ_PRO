/**
 * FINQZ PRO - Z-Index Global Configuration
 * Centraliza todos os z-index do sistema para evitar conflitos
 * Referência: CSS z-index pyramid
 */

export const zIndex = {
  // Base: conteúdo principal
  base: 0,
  
  // Nível 1: Conteúdo dentro de containers
  content: 10,
  
  // Nível 2: Dropdowns, popovers, tooltips
  dropdown: 40,
  popover: 45,
  tooltip: 50,
  
  // Nível 3: Sidebars, drawers
  sidebar: 100,
  drawer: 120,
  
  // Nível 4: Overlay/Backdrop (deve estar abaixo do modal/dialog)
  overlay: 200,
  backdrop: 200,
  
  // Nível 5: Modais, Dialogs, Alerts
  modal: 300,
  dialog: 300,
  alert: 320,
  
  // Nível 6: Notifications, Toast messages (sempre acima de tudo)
  toast: 400,
  notification: 400,
  
  // Nível 7: Floating action buttons (máximo)
  fab: 500,
  
  // Especiais (podem ser ajustados por contexto)
  sticky: 30,
  fixed: 35,
} as const;

export type ZIndexKey = keyof typeof zIndex;
