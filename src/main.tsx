import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startIsoDateAutoFormatter } from "./utils/dateFormat";

startIsoDateAutoFormatter();

createRoot(document.getElementById("root")!).render(<App />);
