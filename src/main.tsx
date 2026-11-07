import React from "react";
import ReactDOM from "react-dom/client";
import SpaceInvadersGame from "./SpaceInvadersGame.tsx";
import { AuthGate } from "./auth/AuthGate";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthGate>
      {({ username, signOut }) => <SpaceInvadersGame username={username} signOut={signOut} />}
    </AuthGate>
  </React.StrictMode>
);
