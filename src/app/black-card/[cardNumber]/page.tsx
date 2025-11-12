import { redirect } from 'next/navigation'

export default function BlackCardPage({ params }: { params: { cardNumber: string } }) {
  // Redirect to the static HTML file
  redirect(`/black_cards/black_card_${params.cardNumber.padStart(4, '0')}.html`)
}
