/* This file contains functions that control the main application. It provides actions for when buttions are
clicked, checkboxes checked, etc. The actions performed either relate to making the page more dynamic or
creating the objects defined in diffeqs.js and visuals.js in order to provide the main visualiztion feature of
the application.

Programmers: Jack Truckenmiller, Salvador Galarza
Created: 02/10/19
Updated: 11/24/19
*/




// Constants representing HTML element objects
// Canvas objects
const AXESGRAPH = document.querySelector("#axesGraph"); // Axes Graph Canvas
const POSGRAPH = document.querySelector("#posGraph"); // Position Graph Canvas
const POSBALL = document.querySelector("#posBall"); // Position Ball
const VELGRAPH = document.querySelector("#velGraph"); // Velocity Graph Canvas
const VELBALL = document.querySelector("#velBall"); // Velocity Ball
const EXTFORCEGRAPH = document.querySelector("#extForceGraph"); // b(t) Graph Canvas
const EXTFORCEBALL = document.querySelector("#extForceBall"); // b(t) Ball
const SPRING = document.querySelector("#spring"); // Spring Canvas

// Button objects
const OSIDEBTN = document.querySelector("#openside"); // Solution Steps button
const CSIDEBTN = document.querySelector("#closeside"); // Solution Steps close button
const SOLVEBTN = document.querySelector("#solve"); // Solve button
const ANIMATEBTN = document.querySelector("#animate"); // Animate button
const STOPANIMATEBTN = document.querySelector("#stopAnimate"); // Stop Animating button
const RESETBTN = document.querySelector("#reset"); // Reset Button
const UPDATEBTN = document.querySelector("#update"); // Update Button

// Checkboxes for showing the different graphs
const POSCHECK = document.querySelector("#posCheck"); // Position
const VELCHECK = document.querySelector("#velCheck"); // Velocity
const EXTFORCECHECK = document.querySelector("#extForceCheck"); // b(t)

// Inputs for the equation and graph
const M = document.querySelector("#mass"); // Mass
const D = document.querySelector("#damping"); // Damping
const K = document.querySelector("#springConst"); // Spring Constant
const BT = document.querySelector("#extForceTerm"); // External Forcing Term
const T0 = document.querySelector("#initTime"); // Initial Time
const X0 = document.querySelector("#initPos"); // Initial Position
const V0 = document.querySelector("#initVel"); // Initial Velocity
const XMIN = document.querySelector("#xMin");
const XMAX = document.querySelector("#xMax");
const XSTEP = document.querySelector("#xStep");
const TMIN = document.querySelector("#timeMin");
const TMAX = document.querySelector("#timeMax");
const TSTEP = document.querySelector("#timeStep");

// Display objects for showing solution and steps
const STEPPH = document.querySelector("#stepPH");
const SYMSOLN = document.querySelector("#symSoln");
const EQ = document.querySelector("#eq");
const DAMPTYPE = document.querySelector("#dampType");


// Global variables used to graph the differential equation, animate the spring, and trace the graph
var diffEq, spring, tracers, time, animationInterval;


function validateStepInputs() {
    if (Number(XSTEP.value) <= 0) {
        alert("Invalid x-Step: " + XSTEP.value + "\nThe x-Step cannot be less than or equal to 0.");
        console.error("Invalid x-step, " + XSTEP.value + ", inputted. Script execution was halted.");
        XSTEP.value = 1;
    } else if (Number(TSTEP.value) <= 0) {
        alert("Invalid t-Step: " + TSTEP.value + "\nThe t-Step cannot be less than or equal to 0.");
        console.error("Invalid t-step, " + TSTEP.value + ", inputted. Script execution was halted.");
        TSTEP.value = 5;
    }
}

function solveDiffEq(e) {
    if (Number(M.value) === 0) {
        alert("Invalid mass: " + M.value + "\nThe mass cannot be 0.");
        console.error("Invalid mass, " + M.value + ", inputted. Script execution was halted.");
        M.value = 8;
    } else if (Number(XSTEP.value) <= 0 || Number(TSTEP.value <= 0)) {
        validateStepInputs();
    } else {
        if (Number(BT.value) == 0) { // If the external forcing term is 0, then we can create a homogenous differential equation class.
            diffEq = new HDiffEq(Number(M.value),Number(D.value),Number(K.value),Number(T0.value),Number(X0.value),Number(V0.value));
        } else {
            diffEq = new IHDiffEq(Number(M.value),Number(D.value),Number(K.value),BT.value,Number(T0.value),Number(X0.value),Number(V0.value));
        }
        let graph = new Graph(AXESGRAPH,POSGRAPH,VELGRAPH,EXTFORCEGRAPH,Number(T0.value),Number(TMIN.value),Number(TMAX.value),Number(TSTEP.value),Number(XMIN.value),Number(XMAX.value),Number(XSTEP.value),diffEq);
        graph.draw();
        spring = new Spring(SPRING, Number(XMIN.value), Number(XMAX.value), Number(XSTEP.value), diffEq);
        spring.draw(Number(TMIN.value));
        tracers = new Tracers(POSBALL,VELBALL,EXTFORCEBALL,Number(TMIN.value),Number(TMAX.value),Number(TSTEP.value),Number(XMIN.value),Number(XMAX.value),Number(XSTEP.value),diffEq);
        tracers.draw(Number(TMIN.value));
        time = Number(TMIN.value);

        DAMPTYPE.innerHTML = diffEq.dampType;

        if (diffEq.symSoln != "") {
            SYMSOLN.style = "visibility: visible";
            EQ.innerHTML = diffEq.symSoln;
            MathJax.Hub.Queue(["Typeset",MathJax.Hub,"eq"]);
        } else {
            SYMSOLN.style = "visibility: hidden";
            EQ.innerHTML = "";
        }

        if (diffEq.solnSteps != []) {
            STEPPH.style = "display: none";
            for (var i = 0; i < diffEq.solnSteps.length; i++) {
                let stepP = "step" + String(i + 1);
                let stepDOM = document.querySelector("#" + stepP);
                stepDOM.innerHTML = diffEq.solnSteps[i];
                MathJax.Hub.Queue(["Typeset",MathJax.Hub,stepP]);
            }
            if (diffEq.solnSteps.length < 5) {
                for (var i = diffEq.solnSteps.length + 1; i <= 5; i++) {
                    let stepP = "step" + String(i);
                    let stepDOM = document.querySelector("#" + stepP);
                    stepDOM.innerHTML = "";
                }
            }
        }
    }
}

function springMotion(e) {
    if (animationInterval != undefined && animationInterval != null) {
        clearInterval(animationInterval);
    }

    if (spring != undefined && spring != null && tracers != undefined && tracers != null) {
        ANIMATEBTN.style = "display: none";
        STOPANIMATEBTN.style = "display: inline";

        animationInterval = setInterval(function() {
            spring.draw(time);
            tracers.draw(time);
            if (time >= Number(TMAX.value)) {
                time = Number(TMIN.value);
            } else {
                time += (Number(TMAX.value) - Number(TMIN.value))/AXESGRAPH.width;
                time = round100(time);
            }
        },30);
    } else {
        console.error("ANIMATE clicked before SOLVE.");
        alert("You must SOLVE the differential equation before you can ANIMATE it.");
    }
}

function stopSpringMotion(e) {
    if (animationInterval != undefined && animationInterval != null) {
        clearInterval(animationInterval);
    }

    ANIMATEBTN.style = "display: inline";
    STOPANIMATEBTN.style = "display: none";
}

function reset(e) {
    stopSpringMotion(e);
    STEPPH.style = "display: block";
    for (let i = 1; i <= 5; i++) {
        let stepDOM = document.querySelector("#step" + String(i));
        stepDOM.innerHTML = "";
    }
    AXESGRAPH.getContext('2d').clearRect(0,0,AXESGRAPH.width,AXESGRAPH.height);
    SPRING.getContext('2d').clearRect(0,0,SPRING.width,SPRING.height);
    DAMPTYPE.innerHTML = "";
    EQ.innerHTML = "";
    SYMSOLN.style = "visibility: hidden";
    diffEq = undefined;
    spring = undefined;
    tracers = undefined;
    time = undefined;
    animationInterval = undefined;
    M.value = 8;
    D.value = 1.4;
    K.value = 10;
    BT.value = 0;
    T0.value = 0;
    X0.value = -4;
    V0.value = 0;
    XMIN.value = -6;
    XMAX.value = 6;
    XSTEP.value = 1;
    TMIN.value = 0;
    TMAX.value = 60;
    TSTEP.value = 5;
    solveDiffEq(e);
}

function w3_open(e) { document.getElementById("mySidebar").style.display = "block"; }
function w3_close(e) { document.getElementById("mySidebar").style.display = "none"; }

function showPositionGraph(e) {
    if (POSCHECK.checked) {
        POSGRAPH.style.visibility = "visible";
        POSBALL.style.visibility = "visible";
    } else {
        POSGRAPH.style.visibility = "hidden";
        POSBALL.style.visibility = "hidden";
    }
}

function showVelocityGraph(e) {
    if (VELCHECK.checked) {
        VELGRAPH.style.visibility = "visible";
        VELBALL.style.visibility = "visible";
    } else {
        VELGRAPH.style.visibility = "hidden";
        VELBALL.style.visibility = "hidden";
    }
}

function showExternalForcingTermGraph(e) {
    if (EXTFORCECHECK.checked) {
        EXTFORCEGRAPH.style.visibility = "visible";
        EXTFORCEBALL.style.visibility = "visible";
    } else {
        EXTFORCEGRAPH.style.visibility = "hidden";
        EXTFORCEBALL.style.visibility = "hidden";
    }
}

function updateVisuals() {
    if (Number(XSTEP.value) <= 0 || Number(TSTEP.value <= 0)) {
        validateStepInputs();
    } else {
        let graph = new Graph(AXESGRAPH,POSGRAPH,VELGRAPH,EXTFORCEGRAPH,Number(T0.value),Number(TMIN.value),Number(TMAX.value),Number(TSTEP.value),Number(XMIN.value),Number(XMAX.value),Number(XSTEP.value),diffEq);
        graph.draw();
        spring = new Spring(SPRING, Number(XMIN.value), Number(XMAX.value), Number(XSTEP.value), diffEq);
        tracers = new Tracers(POSBALL,VELBALL,EXTFORCEBALL,Number(TMIN.value),Number(TMAX.value),Number(TSTEP.value),Number(XMIN.value),Number(XMAX.value),Number(XSTEP.value),diffEq);

        if (animationInterval == undefined || animationInterval == null) {
            spring.draw(Number(TMIN.value));
            tracers.draw(Number(TMIN.value));
            time = Number(TMIN.value);
        }
    }
}




// Event listeners that control when the functions above are called.
window.addEventListener("load", solveDiffEq);

OSIDEBTN.addEventListener("click", w3_open);
CSIDEBTN.addEventListener("click", w3_close);
POSCHECK.addEventListener("click", showPositionGraph);
VELCHECK.addEventListener("click", showVelocityGraph);
EXTFORCECHECK.addEventListener("click", showExternalForcingTermGraph);
SOLVEBTN.addEventListener("click", solveDiffEq);
ANIMATEBTN.addEventListener("click", springMotion);
STOPANIMATEBTN.addEventListener("click", stopSpringMotion)
RESETBTN.addEventListener("click", reset);
UPDATEBTN.addEventListener("click", updateVisuals);
