/* This file contains classes related to the visualization aspect of the application. One class class defines
the graph that is drawn upon initially solving the differential equation. The other two represent the animated
component of the visualization. The first one defines the spring and the other the tracing balls on the graph.
Each class has a set of canvases it requires in order to properly draw itself and also requires a DiffEq object
to draw itself.

Programmers: Salvador Galarza, Jack Truckenmiller
Created: 05/04/19
Updated: 03/02/20
*/




function round100(x) {
    var wholeX = Math.floor(x);
    var decX = x - wholeX;
    var roundDecX = Math.round( decX * 100 )/100;
    return wholeX + roundDecX;
}

class Graph {
    constructor(axesCanvas,posCanvas,velCanvas,extForceCanvas,t0,tMin,tMax,tStep,xMin,xMax,xStep,diffEq) {
        this.axesCanvas = axesCanvas;
        this.posCanvas = posCanvas;
        this.velCanvas = velCanvas;
        this.extForceCanvas = extForceCanvas;
        this.axesCTX = null;
        this.posCTX = null;
        this.velCTX = null;
        this.extForceCTX = null;
        this.width = this.axesCanvas.width;
        this.height = this.axesCanvas.height;
        this.startT = t0;
        this.maxT = tMax;
        this.minT = tMin;
        this.maxX = xMax * this.height/this.width;
        this.minX = xMin * this.height/this.width;
        this.tTickDelta = tStep;
        this.xTickDelta = xStep;

        // When rendering, TSTEP determines the horizontal distance between points.
        this.TSTEP = (this.maxT - this.minT)/this.width;

        // The step size that is used to run the actual calculation of solutions.
        this.RKTSTEP = ((this.TSTEP * this.width)/10) * 1/this.width;

        // Stores the differential equation object to call later for calculating x values.
        this.diffEq = diffEq;
    }
    tC(t) { // Returns the t-coordinate
        return (t - this.minT) / (this.maxT - this.minT) * this.width;
    }
    xC(x) { // Returns x-coordinate
        return this.height - (x - this.minX) / (this.maxX - this.minX) * this.height;
    }
    draw() {
        if (this.axesCanvas.getContext && this.posCanvas.getContext && this.velCanvas.getContext && this.extForceCanvas.getContext) {
            // Set up the canvases:
            this.axesCTX = this.axesCanvas.getContext("2d");
            this.axesCTX.clearRect(0,0,this.width,this.height);
            this.posCTX = this.posCanvas.getContext("2d");
            this.posCTX.clearRect(0,0,this.width,this.height);
            this.velCTX = this.velCanvas.getContext("2d");
            this.velCTX.clearRect(0,0,this.width,this.height);
            this.extForceCTX = this.extForceCanvas.getContext("2d");
            this.extForceCTX.clearRect(0,0,this.width,this.width);

            // Draw:
            this.draxAxes();
            this.renderFunction(this.posCTX, "#136F29", "position");
            this.renderFunction(this.velCTX, "#13276F", "velocity");
            this.renderFunction(this.extForceCTX, "#6F1313", "external force")
        }
    }
    draxAxes() { // draws the T and X axes, with tick marks.
        this.axesCTX.save();
        this.axesCTX.lineWidth = 1;
        this.axesCTX.strokeStyle = "black";

        // +X axis
        this.axesCTX.beginPath();
        this.axesCTX.moveTo(this.tC(0),this.xC(0));
        this.axesCTX.lineTo(this.tC(0),this.xC(this.maxX));
        this.axesCTX.stroke();

        // -X axis
        this.axesCTX.beginPath() ;
        this.axesCTX.moveTo(this.tC(0),this.xC(0)) ;
        this.axesCTX.lineTo(this.tC(0),this.xC(this.minX)) ;
        this.axesCTX.stroke() ;

        // X axis tick marks
        let delta = this.xTickDelta ;
        for (let i = 1; (i * delta) < this.maxX ; ++i) {
            this.axesCTX.beginPath();
            this.axesCTX.moveTo(this.tC(0) - 5, this.xC(i * delta));
            this.axesCTX.lineTo(this.tC(0) + 5, this.xC(i * delta));
            this.axesCTX.stroke();
        }

        delta = this.xTickDelta;
        for (let i = 1; (i * delta) > this.minX; --i) {
            this.axesCTX.beginPath();
            this.axesCTX.moveTo(this.tC(0) - 5, this.xC(i * delta));
            this.axesCTX.lineTo(this.tC(0) + 5, this.xC(i * delta));
            this.axesCTX.stroke();
        }

        // +T axis
        this.axesCTX.beginPath();
        this.axesCTX.moveTo(this.tC(0), this.xC(0));
        this.axesCTX.lineTo(this.tC(this.maxT), this.xC(0));
        this.axesCTX.stroke();

        // -T axis
        this.axesCTX.beginPath();
        this.axesCTX.moveTo(this.tC(0), this.xC(0));
        this.axesCTX.lineTo(this.tC(this.minT), this.xC(0));
        this.axesCTX.stroke();

        // T tick marks
        delta = this.tTickDelta;
        for (let i = 1; (i * delta) < this.maxT ; ++i) {
            this.axesCTX.beginPath();
            this.axesCTX.moveTo(this.tC(i * delta), this.xC(0)-5);
            this.axesCTX.lineTo(this.tC(i * delta), this.xC(0)+5);
            this.axesCTX.stroke();
        }

        delta = this.tTickDelta;
        for (let i = 1; (i * delta) > this.minT ; --i) {
            this.axesCTX.beginPath();
            this.axesCTX.moveTo(this.tC(i * delta), this.xC(0)-5);
            this.axesCTX.lineTo(this.tC(i * delta), this.xC(0)+5);
            this.axesCTX.stroke();
        }
        this.axesCTX.restore();
    }
    renderFunction(ctx,color,type) { // RenderFunction renders the differential equation solution on the canvas.
        let first = true;
        ctx.lineWidth = 3;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur    = 5;
        ctx.shadowColor   = "gray";
        ctx.strokeStyle = color;

        // Draw the +T portion of th graph. This feature is more for Runge-Kutta than the other two.
        ctx.beginPath();
        for (let t = this.startT; t <= this.maxT + this.TSTEP; t += this.RKTSTEP) {
            t = round100(t);
            let x;
            switch (type) {
                case "position":
                    x = this.diffEq.solve(t, this.RKTSTEP);
                    break;
                case "velocity":
                    x = this.diffEq.derivSolve(t);
                    break;
                case "external force":
                    x = this.diffEq.b(t);
                    break;
                default:
                    x = 0;
                    break;
            }
            if (first) {
                ctx.moveTo(this.tC(t), this.xC(x));
                first = false;
            } else {
                // if (t%this.TSTEP == 0) {
                    ctx.lineTo(this.tC(t), this.xC(x));
                // }
            }
        }
        ctx.stroke();
        first = true;

        ctx.beginPath();
        for (let t = this.startT; t >= this.minT - this.TSTEP; t -= this.RKTSTEP) {
            t = round100(t);
            let x;
            switch (type) {
                case "position":
                    x = this.diffEq.solve(t, this.RKTSTEP);
                    break;
                case "velocity":
                    x = this.diffEq.derivSolve(t);
                    break;
                case "external force":
                    x = this.diffEq.b(t);
                    break;
                default:
                    x = 0;
                    break;
            }
            if (first) {
                ctx.moveTo(this.tC(t), this.xC(x));
                first = false;
            } else {
                // if (t%this.TSTEP == 0) {
                    ctx.lineTo(this.tC(t), this.xC(x));
                // }
            }
        }
        ctx.stroke();
    }
}


class Spring {
    constructor(canvas,xMin,xMax,xStep,diffEq) {
        this.canvas = canvas;
        this.ctx = null;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.maxX = xMin * this.height/this.width;
        this.minX = xMax * this.height/this.width;
        this.xTickDelta = xStep;
        this.diffEq = diffEq;
    }
    xC(x) { // Returns x-coordinate
        return this.height - (x - this.minX) / (this.maxX - this.minX) * this.height;
    }
    draw(t) {
        if (this.canvas.getContext) {
            this.ctx = this.canvas.getContext("2d");
            this.ctx.clearRect(0, 0, this.width, this.height);

            this.drawAxes();
            this.drawSpring(t);
        }
    }
    drawAxes() {
        this.ctx.save();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = "black";

        // X axis tick marks
        let delta = this.xTickDelta ;
        for (let i = 1; (i * delta) > this.maxX; --i) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.xC(i * delta));
            this.ctx.lineTo(5, this.xC(i * delta));
            this.ctx.stroke();
        }

        for (let i = 1; (i * delta) < this.minX; ++i) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.xC(i * delta));
            this.ctx.lineTo(5, this.xC(i * delta));
            this.ctx.stroke();
        }

        // T axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.xC(0));
        this.ctx.lineTo(this.width, this.xC(0));
        this.ctx.stroke();

        this.ctx.restore();
    }
    drawSpring(t) {
        var springStart = 0;
        var springEnd = this.xC(this.diffEq.solve(t));
        var tPos = this.width/2;

        this.ctx.save();

        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.shadowBlur    = 5;
        this.ctx.shadowColor   = "gray";

        this.ctx.strokeStyle = "gray";
        this.ctx.lineWidth = 8;
        this.ctx.lineJoin = "round";
        this.ctx.lineCap = "round";

        this.ctx.beginPath();
        this.ctx.moveTo(tPos, springStart);
        springStart += 10;
        springEnd -= 40;
        var x = springEnd - springStart;
        var step = 1 / 8;
        for(var i = 0; i <= 1-step; i += step){  // for each winding
            for(var j = 0; j < 1; j += 0.05){
                var tt = tPos;
                var xx = springStart + x * (i + j * step);
                tt -= Math.sin(j * Math.PI * 2) * 40;
                this.ctx.lineTo(tt,xx);
            }
        }
        this.ctx.lineTo(tPos, springEnd);
        this.ctx.lineTo(tPos, springEnd + 40)
        this.ctx.stroke();

        this.ctx.strokeStyle = "darkgray";
        this.ctx.lineWidth = 4;

        this.ctx.beginPath();
        this.ctx.moveTo(tPos, springStart - 10);
        this.ctx.lineTo(tPos, springStart);
        this.ctx.moveTo(tPos, springEnd);
        this.ctx.lineTo(tPos, springEnd + 40)
        for(var i = 0; i <= 1-step; i += step){  // for each winding
            for(var j = 0.25; j <= 0.76; j += 0.05){
                var tt = tPos;
                var xx = springStart + x * (i + j * step);
                tt -= Math.sin(j * Math.PI * 2) * 40;
                if(j === 0.25){
                    this.ctx.moveTo(tt,xx);

                }else{
                    this.ctx.lineTo(tt,xx);
                }
            }
        }
        this.ctx.stroke();

        this.ctx.strokeStyle = "darkgreen";
        this.ctx.lineWidth = 4;

        this.ctx.beginPath();
        this.ctx.moveTo(tPos, springEnd + 40);
        this.ctx.arc(tPos, springEnd + 40, 22, 0, 2 * Math.PI, false);
        this.ctx.stroke();

        this.ctx.fillStyle = "green";
        this.ctx.lineWidth = 8;

        this.ctx.beginPath();
        this.ctx.moveTo(tPos, springEnd + 40);
        this.ctx.arc(tPos, springEnd + 40, 22, 0, 2 * Math.PI, false);
        this.ctx.fill();

        this.ctx.restore();
    }
}



class Tracers {
    constructor(posCanvas,velCanvas,extForceCanvas,tMin,tMax,tStep,xMin,xMax,xStep,diffEq) {
        this.posCanvas = posCanvas;
        this.velCanvas = velCanvas;
        this.extForceCanvas = extForceCanvas;
        this.posCTX = null;
        this.velCTX = null;
        this.extForceCTX = null;
        this.width = this.posCanvas.width;
        this.height = this.posCanvas.height;
        this.maxT = tMax;
        this.minT = tMin;
        this.maxX = xMax * this.height/this.width;
        this.minX = xMin * this.height/this.width;
        this.tTickDelta = tStep;
        this.xTickDelta = xStep;

        // When rendering, TSTEP determines the horizontal distance between points.
        this.TSTEP = (this.maxT - this.minT)/this.width;

        // Stores the differential equation object to call later for calculating x values.
        this.diffEq = diffEq;
    }
    tC(t) { // Returns the physical t-coordinate from a logical t-coordinate
        return (t - this.minT) / (this.maxT - this.minT) * this.width;
    }
    xC(x) { // Returns the physical x-coordinate from a logical x-coordinate
        return this.height - (x - this.minX) / (this.maxX - this.minX) * this.height;
    }
    draw(t) {
        if (this.posCanvas.getContext && this.velCanvas.getContext && this.extForceCanvas.getContext) {
            // Set up the canvases:
            this.posCTX = this.posCanvas.getContext("2d");
            this.posCTX.clearRect(0,0,this.width,this.height);
            this.velCTX = this.velCanvas.getContext("2d");
            this.velCTX.clearRect(0,0,this.width,this.height);
            this.extForceCTX = this.extForceCanvas.getContext("2d");
            this.extForceCTX.clearRect(0,0,this.width,this.height);

            // Draw:
            this.traceFunction(this.posCTX, "#136F29", "position", t);
            this.traceFunction(this.velCTX, "#13276F", "velocity", t);
            this.traceFunction(this.extForceCTX, "#6F1313", "external force", t);
        }
    }
    traceFunction(ctx,color,type,t) {
        ctx.lineWidth = 3;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur    = 5;
        ctx.shadowColor   = "gray";
        ctx.fillStyle = color;

        let x;
        switch (type) {
            case "position":
                x = this.diffEq.solve(t);
                break;
            case "velocity":
                x = this.diffEq.derivSolve(t);
                break;
            case "external force":
                x = this.diffEq.b(t);
                break;
            default:
                x = 0;
                break;
        }

        ctx.beginPath();
        ctx.moveTo(this.tC(t),this.xC(x));
        ctx.arc(this.tC(t), this.xC(x), 10, 0, 2 * Math.PI, false);
        ctx.fill();
    }
}
