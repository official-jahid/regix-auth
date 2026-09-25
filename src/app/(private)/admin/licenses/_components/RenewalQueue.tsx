import { Badge } from "@/components/shadcnui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcnui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcnui/table";
import { listRenewals } from "@/server/client";
import RenewalQueueActions from "../_components/RenewalQueueActions";

const RenewalQueue = async () => {
  const { items } = await listRenewals();

  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Renewal requests</CardTitle>
        <CardDescription>
          {items.length} {items.length === 1 ? "request" : "requests"} waiting.
          Approve extends expiry by the key duration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">
                    {item.license.key}
                  </TableCell>
                  <TableCell>
                    {item.requester?.username ??
                      item.license.owner?.username ??
                      "Unknown"}
                  </TableCell>
                  <TableCell>
                    {item.license.expiresAt ?
                      new Date(item.license.expiresAt).toLocaleDateString()
                    : "Lifetime"}
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.canManage ?
                      <RenewalQueueActions id={item.id} />
                    : <Badge variant="outline">pending</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RenewalQueue;
