import { createClient } from '@/lib/supabase/server'
import MarketingOpsOS from '@/components/MarketingOpsOS'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <MarketingOpsOS userEmail={user?.email} userId={user?.id} />
}
