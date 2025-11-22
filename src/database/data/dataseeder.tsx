import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// __dirname für ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const milestoneQualityGateConnections: any[] = [];

// 20 Milestones auf 11 Quality Gates verteilen (jeweils 2 Milestones pro QG)
// QG-0 bis QG-4 sind offen (haben risklevel)
// QG-5 bis QG-10 sind geschlossen (risklevel = null)

for (let qgIndex = 0; qgIndex <= 10; qgIndex++) {
    const milestone1Index = qgIndex * 2 + 1; // 1, 3, 5, 7, ...
    const milestone2Index = qgIndex * 2 + 2; // 2, 4, 6, 8, ...

    // Quality Gates bis einschließlich QG-4 sind offen (haben risklevel)
    const isOpen = qgIndex <= 4;

    // Erste Milestone für dieses Quality Gate
    if (milestone1Index <= 20) {
        // Wenn QG offen ist (0-4), dann ist completed_at null und es gibt ein risklevel
        // Wenn QG geschlossen ist (5-10), dann gibt es completed_at und kein risklevel
        const completedAt = isOpen ? null : "2024-02-01T12:00:00Z";
        const riskLevel = isOpen ? Math.floor(Math.random() * 3) + 1 : null;

        const connection: any = {
            id: `mqg-qg-${qgIndex}-ms-${milestone1Index}`,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            quality_gate_id: `qg-${qgIndex}`,
            milestone_id: `ms-${milestone1Index}`,
            completed_at: completedAt,
            risklevel: riskLevel
        };
        milestoneQualityGateConnections.push(connection);
    }

    // Zweite Milestone für dieses Quality Gate
    if (milestone2Index <= 20) {
        // Wenn QG offen ist (0-4), dann ist completed_at null und es gibt ein risklevel
        // Wenn QG geschlossen ist (5-10), dann gibt es completed_at und kein risklevel
        const completedAt = isOpen ? null : "2024-02-01T12:00:00Z";
        const riskLevel = isOpen ? Math.floor(Math.random() * 3) + 1 : null;

        const connection: any = {
            id: `mqg-qg-${qgIndex}-ms-${milestone2Index}`,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            quality_gate_id: `qg-${qgIndex}`,
            milestone_id: `ms-${milestone2Index}`,
            completed_at: completedAt,
            risklevel: riskLevel
        };
        milestoneQualityGateConnections.push(connection);
    }
}

const outputPath = join(__dirname, "milestone_quality_gate_connections.json");
writeFileSync(outputPath, JSON.stringify(milestoneQualityGateConnections, null, 2));

console.log(
    `Generated ${milestoneQualityGateConnections.length} milestone-quality gate connections at ${outputPath}`
);
console.log(`- Open gates (with risklevel): QG-0 to QG-4`);
console.log(`- Closed gates (risklevel = null): QG-5 to QG-10`);