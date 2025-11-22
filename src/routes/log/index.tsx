import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import "./style.css";

export const Route = createFileRoute("/log/")({
    component: LogPage,
});

function LogPage() {
    const [projectId, setProjectId] = useState("01");
    const [dept, setDept] = useState("###");
    const [user, setUser] = useState("DD");

    return (
        <div className="log-container">

            {/* === TOP: PROJECT INFO + PHASE BARS === */}
            <div className="top-section">

                {/* LEFT: DROPDOWNS */}
                <div className="left-controls">

                    {/* Project ID */}
                    <div className="select-block">
                        <label>Project ID</label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                        >
                            <option value="01">01</option>
                            <option value="02">02</option>
                        </select>
                    </div>

                    {/* Dept */}
                    <div className="select-block">
                        <label>Dept.</label>
                        <select
                            value={dept}
                            onChange={(e) => setDept(e.target.value)}
                        >
                            <option value="###">###</option>
                            <option value="PM">PM</option>
                            <option value="DD">DD</option>
                        </select>
                    </div>

                    {/* User */}
                    <div className="select-block">
                        <label>User</label>
                        <select
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                        >
                            <option value="DD">DD</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </div>

                {/* RIGHT: PHASE BANDS */}
                <div className="phase-bands">
                    <div className="phase phase1">Acquisition 1</div>
                    <div className="phase phase2">Acquisition 2</div>
                    <div className="phase phase3">Category</div>
                </div>
            </div>

            <div>
                {/* === TIMELINE AREA === */}
                <Timeline />

                {/* === CHECKED MILESTONE SECTION === */}
                <div className="checked-wrapper">
                    <CheckedMilestones />
                </div>
            </div>

        </div>
    );
}

function CheckedMilestones() {
    return (
        <div className="checked-section">
            <div className="checked-title">
                List of checked milestones
            </div>
            <div className="checked-subtitle">
                Milestones will be filtered when you select a department
            </div>
        </div>
    );
}

/* === TIMELINE COMPONENT === */
function Timeline() {
    const [circleChecked, setCircleChecked] = useState(false);
    const [squareChecked, setSquareChecked] = useState(false);

    return (
        <div className="timeline">

            {/* Horizontal line */}
            <div className="timeline-line" />

            {/* === QG 2 === */}
            <div className="qg qg2">
                <div className="qg-hitbox">
                    <div className="qg-triangle" />
                </div>
                <div className="qg-label">QG 2</div>
                <div className="qg-line" />
            </div>

            {/* === QG 3 === */}
            <div className="qg qg3">
                <div className="qg-hitbox">
                    <div className="qg-triangle" />
                </div>
                <div className="qg-label">QG 3</div>
                <div className="qg-line" />
            </div>

            {/* === CIRCLE MILESTONE === */}
            <div
                className="circle-wrapper"
                onClick={() => setCircleChecked(!circleChecked)}
            >
                <div
                    className={
                        "milestone circle " +
                        (circleChecked ? "checked" : "")
                    }
                >
                    {circleChecked ? "✔" : "4"}
                </div>
            </div>

            {/* === SQUARE MILESTONE === */}
            <div
                className="square-wrapper"
                onClick={() => setSquareChecked(!squareChecked)}
            >
                <div
                    className={
                        "milestone square " +
                        (squareChecked ? "checked" : "")
                    }
                >
                    {squareChecked ? "✔" : ""}
                </div>
            </div>

            {/* === V-BOX under QG2 === */}
            <div className="v-box">
                <div className="v-inner">V</div>
            </div>

        </div>
    );
}
