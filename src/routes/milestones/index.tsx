import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/database'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute('/milestones/')({
  component: MilestonesComponent,
})

function MilestonesComponent() {
  const milestones = db.milestones.sort((a, b) => a.execution_number - b.execution_number);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Milestone Definitions</h1>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>Standard project milestones definitions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[300px]">Description</TableHead>
              <TableHead>Quality Gate</TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead>Department</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {milestones.map((milestone) => {
               const dept = db.departments.find(d => d.id === milestone.department_id);
               return (
                <TableRow key={milestone.id}>
                  <TableCell className="font-medium">{milestone.execution_number}</TableCell>
                  <TableCell>{milestone.label}</TableCell>
                  <TableCell>{milestone.name}</TableCell>
                  <TableCell>{milestone.description}</TableCell>
                  <TableCell>{milestone.previous_quality_gate > 0 ? milestone.previous_quality_gate : '-'}</TableCell>
                  <TableCell>{milestone.recurring ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{dept?.name || milestone.department_id}</TableCell>
                </TableRow>
               )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
