// Canvas objects
const AXESGRAPH = [document.querySelector("#axesGraphEx1"),
                   document.querySelector("#axesGraphEx2"),
                   document.querySelector("#axesGraphEx3"),
                   document.querySelector("#axesGraphEx4")]; // Axes Graph Canvas
const POSGRAPH = [document.querySelector("#posGraphEx1"),
                  document.querySelector("#posGraphEx2"),
                  document.querySelector("#posGraphEx3"),
                  document.querySelector("#posGraphEx4")]; // Position Graph Canvas
const POSBALL = [document.querySelector("#posBallEx1"),
                 document.querySelector("#posBallEx2"),
                 document.querySelector("#posBallEx3"),
                 document.querySelector("#posBallEx4")]; // Position Ball
const VELGRAPH = [document.querySelector("#velGraphEx1"),
                  document.querySelector("#velGraphEx2"),
                  document.querySelector("#velGraphEx3"),
                  document.querySelector("#velGraphEx4")]; // Velocity Graph Canvas
const VELBALL = [document.querySelector("#velBallEx1"),
                 document.querySelector("#velBallEx2"),
                 document.querySelector("#velBallEx3"),
                 document.querySelector("#velBallEx4")]; // Velocity Ball
const EXTFORCEGRAPH = [document.querySelector("#extForceGraphEx1"),
                       document.querySelector("#extForceGraphEx2"),
                       document.querySelector("#extForceGraphEx3"),
                       document.querySelector("#extForceGraphEx4")]; // b(t) Graph Canvas
const EXTFORCEBALL = [document.querySelector("#extForceBallEx1"),
                      document.querySelector("#extForceBallEx2"),
                      document.querySelector("#extForceBallEx3"),
                      document.querySelector("#extForceBallEx4")]; // b(t) Ball
const SPRING = [document.querySelector("#springEx1"),
                document.querySelector("#springEx2"),
                document.querySelector("#springEx3"),
                document.querySelector("#springEx4")]; // Spring Canvas


// Checkboxes for showing the different graphs
const POSCHECK = [document.querySelector("#posCheckEx1"),
                  document.querySelector("#posCheckEx2"),
                  document.querySelector("#posCheckEx3"),
                  document.querySelector("#posCheckEx4")]; // Position
const VELCHECK = [document.querySelector("#velCheckEx1"),
                  document.querySelector("#velCheckEx2"),
                  document.querySelector("#velCheckEx3"),
                  document.querySelector("#velCheckEx4")]; // Velocity
const EXTFORCECHECK = [document.querySelector("#extForceCheckEx1"),
                       document.querySelector("#extForceCheckEx2"),
                       document.querySelector("#extForceCheckEx3"),
                       document.querySelector("#extForceCheckEx4")]; // b(t)


// Buttons for collapsible content
const COLLAPSE = document.getElementsByClassName("collapsible");


var diffEqs = [null,null,null,null], springs = [null,null,null,null], tracers = [null,null,null,null], time = [0,0,0,0], animationInterval = [null,null,null,null];

function showHideExample(e) {
    COLLAPSE[e].classList.toggle("active");
    var content = COLLAPSE[e].nextElementSibling;
    if (content.style.display === "block") {
        content.style.display = "none";
        stopSpringMotion(e);
    } else {
        content.style.display = "block";
        if (diffEqs[e] === null) {
            switch (e) {
                case 0: // Undamped example
                    diffEqs[e] = new HDiffEq(2,0,8,0,-4,0);
                    break;
                case 1: // Under Damped example
                    diffEqs[e] = new HDiffEq(5,1,10,0,-4,0);
                    break;
                case 2: // Criticlly Damped example
                    diffEqs[e] = new HDiffEq(2,4,2,0,-4,0);
                    break;
                case 3: // Over Damped example
                    diffEqs[e] = new HDiffEq(1,4,3,0,-4,0);
                    break;
            }
            setUpGraphs(e);
        }
        springMotion(e);
    }
}

function setUpGraphs(e) {
    var graph = new Graph(AXESGRAPH[e],POSGRAPH[e],VELGRAPH[e],EXTFORCEGRAPH[e],0,0,60,5,-10,10,1,diffEqs[e]);
    graph.draw();
    springs[e] = new Spring(SPRING[e],-10,10,1,diffEqs[e]);
    springs[e].draw(0);
    tracers[e] = new Tracers(POSBALL[e],VELBALL[e],EXTFORCEBALL[e],0,60,5,-10,10,1,diffEqs[e]);
    tracers[e].draw(0);
}

function solveDiffEqs() {
    diffEqs.push(new HDiffEq(5,1,10,0,5,0), new IHDiffEq(5,1,10,"sin(t)",0,5,0), new IHDiffEq(5,1,10,"3*step(t-25)",0,5,0));

    let graphs = [];
    for (let i = 0; i < 3; i++) {
        graphs.push(new Graph(AXESGRAPH[i],POSGRAPH[i],VELGRAPH[i],EXTFORCEGRAPH[i],0,0,60,5,-10,10,1,diffEqs[i]));
        springs.push(new Spring(SPRING[i],-10,10,1,diffEqs[i]));
        tracers.push(new Tracers(POSBALL[i],VELBALL[i],EXTFORCEBALL[i],0,60,5,-10,10,1,diffEqs[i]));
        graphs[i].draw();
        springs[i].draw(0);
        tracers[i].draw(0);
    }
}

function springMotion(e) {
    if (animationInterval[e] != null) {
        clearInterval(animationInterval[e]);
    }

    if (springs[e] != {} && tracers[e] != {}) {
        animationInterval[e] = setInterval(function(e) {
            springs[e].draw(time[e]);
            tracers[e].draw(time[e]);
            if (time[e] >= 60) {
                time[e] = 0;
            } else {
                time[e] += 0.12
            }
        },30,e);
    }
}

function stopSpringMotion(e) {
    if (animationInterval[e] != null) {
        clearInterval(animationInterval[e]);
        animationInterval[e] = null;
    }
}

function springsMotions() {
    if (animationInterval != undefined && animationInterval != null) {
        clearInterval(animationInterval);
    }

    if (springs != undefined && springs != [] && tracers != undefined && tracers != []) {
        // ANIMATEBTN.style = "display: none";
        // STOPANIMATEBTN.style = "display: inline";

        animationInterval = setInterval(function() {
            for (let spring of springs) {
                spring.draw(time);
            }
            for (let tracer of tracers) {
                tracer.draw(time);
            }
            if (time >= 60) {
                time = 0;
            } else {
                time += 0.12;
            }
        },30);
    } else {
        console.error("An error occurred while loading the page that prevented key objects from being defined.");
    }
}

function examplesLoad() {
    solveDiffEqs();
    springsMotions();
}

function showPositionGraph(e) {
    if (POSCHECK[e].checked) {
        POSGRAPH[e].style.visibility = "visible";
        POSBALL[e].style.visibility = "visible";
    } else {
        POSGRAPH[e].style.visibility = "hidden";
        POSBALL[e].style.visibility = "hidden";
    }
}

function showVelocityGraph(e) {
    if (VELCHECK[e].checked) {
        VELGRAPH[e].style.visibility = "visible";
        VELBALL[e].style.visibility = "visible";
    } else {
        VELGRAPH[e].style.visibility = "hidden";
        VELBALL[e].style.visibility = "hidden";
    }
}

function showForcingTermGraph(e) {
    if (EXTFORCECHECK[e].checked) {
        EXTFORCEGRAPH[e].style.visibility = "visible";
        EXTFORCEBALL[e].style.visibility = "visible";
    } else {
        EXTFORCEGRAPH[e].style.visibility = "hidden";
        EXTFORCEBALL[e].style.visibility = "hidden";
    }
}



// Event listeners that control when the functions above are called.
// window.addEventListener("load", examplesLoad);
