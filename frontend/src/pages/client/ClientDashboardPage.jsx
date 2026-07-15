import { ClientDashboardLayout } from "@/layout/ClientDashboardLayout"


export default function ClientDashboardPage(){

return (

<ClientDashboardLayout>

<div className="space-y-6">


<div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 text-white">

<p className="text-sm text-emerald-100">
Good afternoon
</p>


<h1 className="mt-1 text-2xl font-semibold">
Welcome back, Maria
</h1>


<p className="mt-1 text-sm text-emerald-100">
Santos Retail Trading · Client since 2022
</p>


</div>


</div>

</ClientDashboardLayout>

)

}