import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getReservations } from "@/lib/services/reservation.service";
import Link from "next/link";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  guest_submitted: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-purple-100 text-purple-700",
  signed: "bg-green-100 text-green-700",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  type ReservationRow = Awaited<ReturnType<typeof getReservations>>[number];
  const reservations: ReservationRow[] = await getReservations(session.user.id);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
        <Link
          href="/reservations/new"
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + New Reservation
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
          <p className="text-gray-400 text-sm mb-4">No reservations yet.</p>
          <Link
            href="/reservations/new"
            className="inline-block bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition"
          >
            Create your first reservation
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Check-In</th>
                <th className="px-4 py-3 text-left">Check-Out</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Contract</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map((r: ReservationRow) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.property.name}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.checkInDate).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.checkOutDate).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{r.source}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.contracts[0] ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[r.contracts[0].status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.contracts[0].status}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/reservations/${r.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
