import { MockChatPanel } from "@/components/mock-chat-panel";

function App() {
  return (
    <MockChatPanel
      badgeLabel="Sidebar"
      shellClassName="sidepanel-root"
      subtitle="Browser side panel mock, not a page overlay."
    />
  );
}

export default App;
