export default function CheckedMilestones({
	checkedList,
}: {
	checkedList: string[];
}) {
	return (
		<div className="checked-section">
			<div className="checked-title">
				List of checked Quality Gates & Milestones
			</div>

			<div className="checked-subtitle">
				{checkedList.length === 0 ? (
					<>No milestones checked</>
				) : (
					checkedList.join(", ")
				)}
			</div>
		</div>
	);
}
