import { useListTests } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function Tests() {
  const { data, isLoading } = useListTests({ limit: 50 });

  return (
    <div className="flex-1 flex flex-col items-center py-8">
      <div className="w-full max-w-7xl px-4 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Tier Tests</h1>
          <p className="text-muted-foreground text-sm">Active and recent tier test requests.</p>
        </div>

        <div className="glass-card rounded-xl overflow-hidden border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-black/60 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-bold">Player</th>
                  <th className="px-6 py-4 font-bold">Mode</th>
                  <th className="px-6 py-4 font-bold">Requested Tier</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Tester</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="h-24 bg-white/5 animate-pulse" /></tr>
                ) : data?.tests && data.tests.length > 0 ? (
                  data.tests.map((test) => (
                    <tr key={test.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{test.playerName}</td>
                      <td className="px-6 py-4">{test.gamemodeName}</td>
                      <td className="px-6 py-4 font-bold text-primary">{test.requestedTier}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          test.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          test.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          test.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {test.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{test.testerName || "-"}</td>
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(test.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No tests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
