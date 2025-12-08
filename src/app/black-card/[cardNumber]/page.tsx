import { redirect } from 'next/navigation'
import { use } from 'react'

export default function BlackCardPage({ params }: { params: Promise<{ cardNumber: string }> }) {
  const { cardNumber } = use(params)
  // Redirect to the static HTML file
  redirect(`/black_cards/black_card_${cardNumber.padStart(4, '0')}.html`)
}
