import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";

export default function CheckedMilestones({
	checkedList,
}: {
	checkedList: string[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">
					List of checked Quality Gates & Milestones
				</CardTitle>
			</CardHeader>
			<CardContent>
				{checkedList.length === 0 ? (
					<p className="text-sm text-muted-foreground">No milestones checked</p>
				) : (
					<div className="flex flex-wrap gap-2">
						{checkedList.map((item) => (
							<Badge key={item} variant="secondary">
								{item}
							</Badge>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
