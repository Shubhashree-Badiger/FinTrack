// "Install app" support: captures the browser's install prompt and exposes a simple hook.
import { useEffect, useState } from "react";

let deferred = null; // the beforeinstallprompt event, kept until the user chooses

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export function useInstall() {
  const [canPrompt, setCanPrompt] = useState(!!deferred);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      deferred = e;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      deferred = null;
      setCanPrompt(false);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    setCanPrompt(false);
  }

  // Safari on iPhone has no install prompt; the user must use Share > Add to Home Screen.
  return { canPrompt, installed, iosHint: isIOS() && !installed, install };
}
