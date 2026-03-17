type SidePanelChrome = typeof globalThis & {
  chrome?: {
    sidePanel?: {
      setPanelBehavior: (options: {
        openPanelOnActionClick: boolean;
      }) => Promise<void>;
    };
  };
};

export default defineBackground(() => {
  const chromeApi = (globalThis as SidePanelChrome).chrome;

  if (chromeApi?.sidePanel?.setPanelBehavior) {
    void chromeApi.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    });
  }
});
