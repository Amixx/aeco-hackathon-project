
import { writeFileSync } from 'fs';
import { join } from 'path';

// Mock data IDs
const projects = ['proj-1', 'proj-2', 'proj-3', 'proj-4', 'proj-5'];
const milestones = Array.from({length: 20}, (_, i) => `ms-${i+1}`);
const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];

const projectMilestones: any[] = [];

projects.forEach((projectId) => {
    // Vary completion based on project ID logic I used before
    let completedCount = 0;
    if (projectId === 'proj-1') completedCount = 2;
    if (projectId === 'proj-2') completedCount = 5;
    if (projectId === 'proj-3') completedCount = 10;
    if (projectId === 'proj-4') completedCount = 20;
    if (projectId === 'proj-5') completedCount = 15;

    milestones.forEach((milestoneId, mIndex) => {
        const isCompleted = (mIndex + 1) <= completedCount;
        
        // Assign a random responsible person
        const randomUser = users[Math.floor(Math.random() * users.length)];
        
        projectMilestones.push({
            id: `pm-${projectId}-${milestoneId}`,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            project_id: projectId,
            milestone_id: milestoneId,
            completed_at: isCompleted ? "2024-02-01T12:00:00Z" : null,
            responsible_person_id: randomUser
        });
    });
});

const outputPath = join(import.meta.dir, 'project_milestones.json');
writeFileSync(outputPath, JSON.stringify(projectMilestones, null, 2));
console.log(`Generated ${projectMilestones.length} project milestones at ${outputPath}`);
