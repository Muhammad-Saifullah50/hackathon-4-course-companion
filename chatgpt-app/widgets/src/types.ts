export interface PanelAction {
  label: string;
  tool: string;
  args: Record<string, unknown>;
}

export interface ErrorState {
  message: string;
}
