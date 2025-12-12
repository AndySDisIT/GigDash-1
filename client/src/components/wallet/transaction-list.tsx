import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FuelIcon } from "lucide-react";
import { format } from "date-fns";
import type { WalletEntry } from "@shared/schema";

export function TransactionList() {
  const { data: transactions, isLoading } = useQuery<WalletEntry[]>({
    queryKey: ["/api/wallet/entries"],
  });

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            View All
          </Button>
        </div>
      </div>
      <div className="divide-y divide-slate-200">
        {transactions?.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-slate-600">No transactions found.</p>
          </div>
        ) : (
          transactions?.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  transaction.type === "earning" 
                    ? "bg-green-100" 
                    : "bg-red-100"
                }`}>
                  {transaction.type === "earning" ? (
                    <Plus className={`w-4 h-4 ${
                      transaction.type === "earning" 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`} />
                  ) : (
                    <FuelIcon className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-slate-800">{transaction.description}</h4>
                  <p className="text-sm text-slate-600">
                    {transaction.category} • {format(new Date(transaction.transactionDate), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${
                  transaction.type === "earning" 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {transaction.type === "earning" ? "+" : "-"}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                </div>
                <div className={`text-sm ${
                  transaction.status === "paid" 
                    ? "text-green-500" 
                    : transaction.status === "processing" 
                    ? "text-amber-500" 
                    : "text-slate-500"
                }`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
