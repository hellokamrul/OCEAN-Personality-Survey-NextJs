// app/page.tsx
import { redirect } from 'next/navigation';

export default function Root() {
  // when someone visits "/", send them to "/survey"
  redirect('/survey');
}
