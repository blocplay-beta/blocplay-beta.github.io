import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { app } from "/js/firebase.js";

const messaging = getMessaging(app);

export async function initNotif() {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "CLE_VAPID_FIREBASE"
    });

    console.log("TOKEN:", token);

    // 👉 stocke le token avec ton utilisateur connecté
  }
}