// packages/notifications/push.ts
import Expo, { ExpoPushMessage } from 'expo-server-sdk'

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN })

export async function sendCommissionAlert(
  expoPushToken: string,
  officerName: string,
  amount: number,
  productName: string
): Promise<void> {
  if (!Expo.isExpoPushToken(expoPushToken)) return

  const message: ExpoPushMessage = {
    to: expoPushToken,
    sound: 'default',
    title: '💰 Commission Confirmed!',
    body: `${officerName}, you earned ₦${amount.toLocaleString()} on ${productName}`,
    data: { type: 'commission_confirmed', amount },
  }

  await expo.sendPushNotificationsAsync([message])
}

export async function sendRemappingAlert(
  expoPushToken: string,
  message: string
): Promise<void> {
  if (!Expo.isExpoPushToken(expoPushToken)) return

  await expo.sendPushNotificationsAsync([{
    to: expoPushToken,
    sound: 'default',
    title: 'Client Remapping Update',
    body: message,
  }])
}

export async function sendLeadConversionAlert(
  expoPushToken: string,
  clientName: string
): Promise<void> {
  if (!Expo.isExpoPushToken(expoPushToken)) return

  await expo.sendPushNotificationsAsync([{
    to: expoPushToken,
    sound: 'default',
    title: '🎉 Lead Converted!',
    body: `${clientName} is now your client. Commission incoming.`,
  }])
}
