/* This file contains classes that represent differential equation objects. All differential equation objects
have certain properties and methods in common, which is represented by the superclass. The current application
makes use of two subclasses of the superclass that represent homogenous and inhomogenous differential equations.
The homogenous class solves the equation symbollically and presents this symbolic solution alongside indepth
steps for solving it by hand. The inhomogenous class uses Runge-Kutta fourth-order method to numerically
approximate the solution. 

Programmer: Jack Truckenmiller
Created: 05/03/19
Updated: 03/02/20
*/




// Differential equation superclass that defines the common constructor and methods used by all DiffEq objects.
class DiffEq {
    constructor(m,d,k,bt,t0,x0,v0) {
        // Coefficients of the differential equation.
        this.m = m;
        this.d = d;
        this.k = k;

        /* Sets the forcing term value for the DiffEq. If its homogeneous, this is simply "0". */
        this.f = bt;

        // Initial conditions. v0 is called u0 to keep consistent with what it is called in Runge-Kutta.
        this.t0 = t0;
        this.x0 = x0;
        this.u0 = v0;

        // String and string array that represent the symbolic solution, solution steps, and damping type.
        this.symSoln = "";
        this.solnSteps = [""];
        this.dampType = "";

        // Initializes a Map to hold calculated x values so they don't have to be found again when re-solving.
        this.values = new Map([[t0,x0]]);

        // Initializes a Map to hold calculated v values so they don't have to be found again when re-solving.
        this.derivValues = new Map([[t0,v0]]);

        /* Initializes a list of roots. The first value is the first distinct root or the repeated root 
        depending on the inputed equation. The second value is the second distinct root if there is one. The 
        third value is the complex portion of the root, if there is one. */
        this.r = [0, 0, 0];

        // Solves for the roots, solution type, and coefficients of a homogenous equation.
        if (d == 0) { // The Undamped case
            this.dampType = "Undamped";
            if (Math.sign(-k/m) == -1) {
                this.r[2] = Math.sqrt(k/m);
            } else {
                this.r[0] = Math.sqrt(-k/m);
                this.r[1] = -Math.sqrt(-k/m);
            }
        } else if (Math.pow(d, 2) - 4*m*k < 0) { // The Under Damped case
            this.dampType = "Under Damped";
            this.r[0] = -d/(2*m);
            this.r[2] = Math.sqrt(Math.abs(Math.pow(d, 2) - 4*m*k))/(2*m);
        } else if (Math.pow(d, 2) - 4*m*k > 0) { // The Over Damped case
            this.dampType = "Over Damped";
            this.r[0] = (-d/(2*m)) + (Math.sqrt(Math.pow(d, 2) - 4*m*k)/2*m);
            this.r[1] = (-d/(2*m)) - (Math.sqrt(Math.pow(d, 2) - 4*m*k)/2*m);
        } else if (Math.pow(d, 2) - 4*m*k == 0) { // The Critically Damped case
            this.dampType = "Critically Damped";
            this.r[0] = (-d/(2*m));
        }
    }
    b(t) { return 0; } // Redefined in IHDiffEq subclass to handle forcing terms.

    // These two methods are defined by the subclasses.
    solve(t, h) { return; }
    derivSolve(t) { return; }
    printSteps(step,values = null) { return; }
    formatNum(x) {
        if (x === 1) {
            return "";
        } else if (x === -1) {
            return "-";
        } else if (Number.isInteger(x)) {
            return String(x);
        } else {
            x = x.toFixed(2);
            if (x.lastIndexOf("0") == x.length - 1) {
                x = x.slice(0, -1);
            }
            return x;
        }
    }        
}




class HDiffEq extends DiffEq {
    constructor(m,d,k,t0,x0,v0) {
        // Initializes the superclass.
        super(m,d,k,0,t0,x0,v0);

        /* Initializes the solution type. The solution type is stored as a string and can be either real with 
        distinct roots, real with repeated roots, complex with only imaginary values, or complex with both a 
        real and imaginary value. */
        this.solnType = "";

        // Initializes the coefficients for the particular solution.
        this.A = 0;
        this.B = 0;

        // Initializes the array to hold the steps for solving the equation.
        this.solnSteps = [this.printSteps(1,[m,d,k,t0,x0,v0])];

        // Initializes the symbolic solution string.
        this.symSoln = "";

        // Solves for the roots, solution type, and coefficients of a homogenous equation.
        if (this.dampType === "Undamped") { // The Undamped case
            if (Math.sign(-k/m) == -1) {
                this.solnType = "compOnly"
                this.solnSteps.push(this.printSteps("2uc",[m,k,this.r]));
            } else {
                this.solnType = (this.r[0] == this.r[1]) ? "realRep" : "realDis";
                this.solnSteps.push(this.printSteps(this.solnType,[m,d,k,this.r]));
            }
        } else if (this.dampType === "Under Damped") { // The Under Damped case
            this.solnType = "complex";
            this.solnSteps.push(this.printSteps("2ud",[m,d,k,this.r]));
        } else if (this.dampType === "Over Damped") { // The Over Damped case
            this.solnType = (this.r[0] == this.r[1]) ? "realRep" : "realDis";
            this.solnSteps.push(this.printSteps(this.solnType,[m,d,k,this.r]));
        } else if (this.dampType === "Critically Damped") { // The Critically Damped case
            this.solnType = "realRep";
            this.solnSteps.push(this.printSteps(this.solnType,[m,d,k,this.r]));
        }

        let setSolns = [0,0];
        let derivSetSolns = [0,0];

        switch (this.solnType) {
            case "compOnly":
                setSolns = [Math.cos(this.r[2]*t0), Math.sin(this.r[2]*t0)];
                derivSetSolns = [-this.r[2]*Math.sin(this.r[2]*t0), this.r[2]*Math.cos(this.r[2]*t0)];
                this.solnSteps.push(this.printSteps("3i",this.r))
                break;
            case "complex":
                setSolns = [(Math.exp(this.r[0]*t0))*(Math.cos(this.r[2]*t0)), (Math.exp(this.r[0]*t0))*(Math.sin(this.r[2]*t0))];
                derivSetSolns = [(this.r[0]*Math.exp(this.r[0]*t0))*Math.cos(this.r[2]*t0) -
                                this.r[2]*(Math.exp(this.r[0]*t0))*Math.sin(this.r[2]*t0),
                                this.r[0]*(Math.exp(this.r[0]*t0))*Math.sin(this.r[2]*t0) +
                                this.r[2]*(Math.exp(this.r[0]*t0))*Math.cos(this.r[2]*t0)];
                this.solnSteps.push(this.printSteps("3c",this.r));
                break;
            case "realDis":
                setSolns = [Math.exp(this.r[0]*t0), Math.exp(this.r[1]*t0)];
                derivSetSolns = [this.r[0]*Math.exp(this.r[0]*t0), this.r[1]*Math.exp(this.r[1]*t0)];
                this.solnSteps.push(this.printSteps("3rd",this.r));
                break;
            case "realRep":
                setSolns = [Math.exp(this.r[0]*t0), t0*Math.exp(this.r[0]*t0)];
                derivSetSolns = [this.r[0]*Math.exp(this.r[0]*t0), Math.exp(this.r[0]*t0) + this.r[0]*t0*Math.exp(this.r[0]*t0)];
                this.solnSteps.push(this.printSteps("3rr",this.r));
                break;
        }

        // Check to see if the coefficients can be found easily or if the matrix method is required.
        if (setSolns[0] == 0) { // Happens when cos(this.r[2]*t0) = 0.
            this.B = x0/setSolns[1];
            this.A = (v0 - this.B*derivSetSolns[1])/derivSetSolns[0];
            this.solnSteps.push(this.printSteps("4cos(0)",[this.r,this.A,this.B,t0,x0,v0,setSolns,derivSetSolns]));
        } else if (setSolns[1] == 0) { // Happens when sin(this.r[2]*t0) = 0.
            this.A = x0/setSolns[0];
            this.B = (v0 - this.A*derivSetSolns[0])/derivSetSolns[1];
            this.solnSteps.push(this.printSteps("4sin(0)",[this.r,this.A,this.B,t0,x0,v0,derivSetSolns]));
        } else { // Happens when there aren't sines and cosines or neither sine nor cosine is 0 at t0.
            // Defines a matrix to be used to solve for the coefficients A and B by putting it into reduced row echelon form.
            let coeffMatrix = [
                setSolns[0], setSolns[1], x0,
                derivSetSolns[0], derivSetSolns[1], v0
            ];
            // All steps must be done in backwards order so that the value that gets reduced is preserved until the end of the step.
            // First step of RREF. Gets the second row to have a zero for the first element.
            coeffMatrix[5] = coeffMatrix[5]*coeffMatrix[0] - coeffMatrix[3]*coeffMatrix[2];
            coeffMatrix[4] = coeffMatrix[4]*coeffMatrix[0] - coeffMatrix[3]*coeffMatrix[1];
            coeffMatrix[3] = coeffMatrix[3]*coeffMatrix[0] - coeffMatrix[3]*coeffMatrix[0];

            // Second step of RREF. Gets the second row to have a one for the second element.
            coeffMatrix[5] = coeffMatrix[5]/coeffMatrix[4];
            coeffMatrix[4] = coeffMatrix[4]/coeffMatrix[4];

            // Third step of RREf. Gets the first row to have a zero for the second element.
            coeffMatrix[2] = coeffMatrix[2] - coeffMatrix[5]*coeffMatrix[1];
            coeffMatrix[1] = coeffMatrix[1] - coeffMatrix[4]*coeffMatrix[1];

            // Final step of RREF. Gets the first row to have a one for the first element.
            coeffMatrix[2] = coeffMatrix[2]/coeffMatrix[0];
            coeffMatrix[0] = coeffMatrix[0]/coeffMatrix[0];

            // The value of A is the top value of the augmented column of the matrix and the value of B is the bottom value.
            this.A = coeffMatrix[2];
            this.B = coeffMatrix[5];
            this.solnSteps.push(this.printSteps(4,[setSolns,derivSetSolns,x0,v0,coeffMatrix]));
        }

        switch (this.solnType) {
            case "compOnly":
                this.symSoln = (this.A == 0) ? (this.B == 0) ? "$$x(t) = 0$$" : "$$x(t) = " + this.formatNum(this.B) +
                                                                "\\sin(" + this.formatNum(this.r[2]) + "t)$$"
                            : (this.B == 0) ? "$$x(t) = " + this.formatNum(this.A) + "\\cos(" + this.formatNum(this.r[2]) + "t)$$"
                            : (this.B < 0) ? "$$x(t) = " + this.formatNum(this.A) + "\\cos(" + this.formatNum(this.r[2]) + "t) - " +
                                                this.formatNum(Math.abs(this.B)) + "\\sin(" + this.formatNum(this.r[2]) + "t)$$"
                            : "$$x(t) = " + this.formatNum(this.A) + "\\cos(" + this.formatNum(this.r[2]) + "t) + " +
                                this.formatNum(this.B) + "\\sin(" + this.formatNum(this.r[2]) + "t)$$";
                break;
            case "complex":
                this.symSoln = (this.A == 0) ? (this.B == 0) ? "$$x(t) = 0$$" : "$$x(t) = " + this.formatNum(this.B) + "e^{" +
                                                                this.formatNum(this.r[0]) + "t}\\sin(" + this.formatNum(this.r[2]) +
                                                                "t)$$"
                            : (this.B == 0) ? "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) +
                                                "t}\\cos(" + this.formatNum(this.r[2]) + "t)$$"
                            : (this.B < 0) ? "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t}\\cos(" +
                                                this.formatNum(this.r[2]) + "t) - " + this.formatNum(Math.abs(this.B)) + "e^{" +
                                                this.formatNum(this.r[0]) + "t}\\sin(" + this.formatNum(this.r[2]) + "t)$$"
                            : "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t}\\cos(" +
                                this.formatNum(this.r[2]) + "t) + " + this.formatNum(this.B) + "e^{" + this.formatNum(this.r[0]) +
                                "t}\\sin(" + this.formatNum(this.r[2]) + "t)$$";
                break;
            case "realDis":
                this.symSoln = (this.A == 0) ? (this.B == 0) ? "$$x(t) = 0$$" : "$$x(t) = " + this.formatNum(this.B) + "e^{" +
                                                                this.formatNum(this.r[1]) + "t}$$"
                            : (this.B == 0) ? "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t}$$"
                            : (this.B < 0) ? "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t} - " +
                                                this.formatNum(Math.abs(this.B)) + "e^{" + this.formatNum(this.r[1]) + "t}$$"
                            : "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t} + " +
                                this.formatNum(this.B) + "e^{" + this.formatNum(this.r[1]) + "t}$$";
                break;
            case "realRep":
                this.symSoln = (this.A == 0) ? (this.B == 0) ? "$$x(t) = 0$$" : "$$x(t) = " + this.formatNum(this.B) + "te^{" +
                                                                this.formatNum(this.r[0]) + "t}$$"
                            : (this.B == 0) ? "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t}$$"
                            : (this.B < 0) ? "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t} - " +
                                                this.formatNum(Math.abs(this.B)) + "te^{" + this.formatNum(this.r[0]) + "t}$$"
                            : "$$x(t) = " + this.formatNum(this.A) + "e^{" + this.formatNum(this.r[0]) + "t} + " +
                                this.formatNum(this.B) + "te^{" + this.formatNum(this.r[0]) + "t}$$";
                break;
        }
        this.solnSteps.push(this.printSteps(5,this.symSoln));
    }
    solve(t, H = undefined) {
        let x = this.values.get(t);
        if (x == undefined) {
            let setSolns = [0, 0];
            switch (this.solnType) {
                case "compOnly":
                    setSolns = [Math.cos(this.r[2]*t), Math.sin(this.r[2]*t)];
                    break;
                case "complex":
                    setSolns = [(Math.exp(this.r[0]*t))*Math.cos(this.r[2]*t), (Math.exp(this.r[0]*t))*Math.sin(this.r[2]*t)];
                    break;
                case "realDis":
                    setSolns = [Math.exp(this.r[0]*t), Math.exp(this.r[1]*t)];
                    break;
                case "realRep":
                    setSolns = [Math.exp(this.r[0]*t), t*Math.exp(this.r[0]*t)];
                    break;
            }
            x = this.A*setSolns[0] + this.B*setSolns[1];
            this.values.set(t, x);
        }
        return x;
    }
    derivSolve(t) {
        let v = this.derivValues.get(t);
        if (v == undefined) {
            let derivSetSolns = [0,0];
            switch (this.solnType) {
                case "compOnly":
                    derivSetSolns = [-this.r[2]*Math.sin(this.r[2]*t), this.r[2]*Math.cos(this.r[2]*t)];
                    break;
                case "complex":
                    derivSetSolns = [(this.r[0]*Math.exp(this.r[0]*t))*Math.cos(this.r[2]*t) -
                                    this.r[2]*(Math.exp(this.r[0]*t))*Math.sin(this.r[2]*t),
                                    this.r[0]*(Math.exp(this.r[0]*t))*Math.sin(this.r[2]*t) +
                                    this.r[2]*(Math.exp(this.r[0]*t))*Math.cos(this.r[2]*t)];
                    break;
                case "realDis":
                    derivSetSolns = [this.r[0]*Math.exp(this.r[0]*t), this.r[1]*Math.exp(this.r[1]*t)];
                    break;
                case "realRep":
                    derivSetSolns = [this.r[0]*Math.exp(this.r[0]*t), Math.exp(this.r[0]*t) + this.r[0]*t*Math.exp(this.r[0]*t)];
                    break;
            }
            v = this.A*derivSetSolns[0] + this.B*derivSetSolns[1];
            this.derivValues.set(t, v);
        }
        return v;
    }
    printSteps(step,values = null) {
        let string = "";
        try {
        switch (step) {
            case 1:
                string = "<p>$$" + String(values[0]) + "x&rsquo;&rsquo; + " + String(values[1]) + "x&rsquo; + " + String(values[2]) +
                            "x = 0$$\n$$x(" + String(values[3]) + ") = " + String(values[4]) + "$$\n$$x&rsquo;(" + String(values[3]) +
                            ") = " + String(values[5]) + "$$</p><p>We start solving this model of harmonic motion by taking a look at " +
                            "the differential equation itself. It's a second-order equation with the mass \\((m = " + String(values[0]) +
                            ")\\), damping \\((d = " + String(values[1]) + ")\\), and spring constant \\((k = " + String(values[2]) +
                            ")\\) as the coefficients. The external forcing term is \\(0\\). The initial time, \\(t_0\\), is " +
                            String(values[3]) + ", the inital position, \\(x(" + String(values[3]) + ")\\), is \\(" + String(values[4]) +
                            "\\), and the initial velocity, \\(x&rsquo;(" + String(values[3]) + ")\\), is \\(" + String(values[5]) +
                            "\\).</p><p>$$p(r) = " + String(values[0]) + "r^2 + " + ((values[1] == 0) ? "" : String(values[1]) + "r + ") +
                            String(values[2]) + "$$</p><p>As this equation is homogenous, \\(b(t) = 0\\), it is easy to solve. First, " +
                            "we will find the roots of the corresponding characteristic polynomial in order to determine what type of " +
                            "solution we are going to get.</p>";
                return string;
            case "2uc":
                string = "<p>$$r = \\sqrt{\\frac{" + String(-values[1]) + "}{" + String(values[0]) + "}}$$\n$$r = \\pm " +
                            String(values[2][2]) + "i$$</p><p>The roots of the characteristic polynomial can easily be found as the " +
                            "damping force (\\(d\\)) is \\(0\\). Another thing to note is that, because \\(d = 0\\), we say that the " +
                            "motion is <b><em>undamped</em></b>. Therefore, we simply move the value for \\(k\\) to the other side of the " +
                            "equation, divide by \\(m\\) and, the square root both sides. In this case, our roots are purely imaginary. " +
                            "We will now use this information to get the fundamental set of solutions for this equation.</p>";
                return string;
            case "2ud":
                string = "<p>$$r = \\frac{-" + String(values[1]) + " \\pm \\sqrt{(" + String(values[1]) + ")^2 - 4(" + String(values[0]) +
                            ")(" + String(values[2]) + ")}}{2(" + String(values[0]) + ")}$$\n$$r =" + String(values[3][0]) + " \\pm " +
                            String(values[3][2]) + "i$$</p><p>The roots of the characteristic polynomial can easily be found using the " +
                            "quadratic formula. In this case, our roots are complex as the discriminant (\\(d^2 - 4(m)(k)\\)) is " +
                            "less than \\(0\\). This means that the spring's motion is <b><em>under damped</em></b>. We will now use this " +
                            "information to get the fundamental set of solutions for this equation.</p>";
                return string;
            case "realDis":
                string = "<p>$$r = \\frac{-" + String(values[1]) + " \\pm \\sqrt{(" + String(values[1]) + ")^2 - 4(" + String(values[0]) +
                            ")(" + String(values[2]) + ")}}{2(" + String(values[0]) + ")}$$\n$$r_1 = " + String(values[3][0]) + " \nr_2 = " +
                            String(values[3][2]) + "$$</p><p>The roots of the characteristic polynomial can easily be found using the " +
                            "quadratic formula. In this case, our roots are real and distinct as the discriminant " + 
                            "(\\(d^2 - 4(m)(k)\\)) is greater than \\(0\\). This mean's that the spring's motion is <b><em>" +
                            "over damped</em></b>. We will now use this information to get the fundamental set of solutions for this " +
                            "equation.</p>";
                return string;
            case "realRep":
                string = "<p>$$r = \\frac{-" + String(values[1]) + " \\pm \\sqrt{(" + String(values[1]) + ")^2 - 4(" + String(values[0]) +
                            ")(" + String(values[2]) + ")}}{2(" + String(values[0]) + ")}$$\n$$r =" + String(values[3][0]) + "$$</p>" +
                            "<p>The roots of the characteristic polynomial can easily be found using the quadratic formula. In this " + 
                            "case, our roots are real and repeated as the discriminant (\\(d^2 - 4(m)(k)\\)) is equal to \\(0" +
                            "\\). This means that the spring's motion is <b><em>critically damped</em></b>. We will now use this " +
                            "information to get the fundamental set of solutions for this equation.</p>";
                return string;
            case "3i":
                string = "<p>$$\\{ \\cos(" + this.formatNum(values[2]) + "t), \\sin(" + this.formatNum(values[2]) + "t) \\}$$</p><p>This is " +
                            "the fundamental set of solutions for this equation. If we just wanted <em>the</em> general solution to " +
                            "the differential equation, we could use the set of solutions to find it and be done. However, we want the " +
                            "particular solution to this differential equation given the initial conditions (otherwise, we wouldn't be " +
                            "able to graph it or model its motion). We thus need to find the coefficients to the general solution.</p>" +
                            "<p>$$x(t) = A\\cos(" + this.formatNum(values[2]) + "t) + B\\sin(" + this.formatNum(values[2]) + "t)$$</p><p>" +
                            "$$x&rsquo;(t) = " + this.formatNum(-values[2]) + "A\\sin(" + this.formatNum(values[2]) + "t)" +
                            ((values[2] < 0) ? " - " + this.formatNum(Math.abs(values[2])) + "B\\cos(" + this.formatNum(values[2]) : " + " +
                            this.formatNum(values[2])) + "$$</p><p>Now that we have the general solution, we can solve for the " +
                            "particular solution to the differential equation by solving for the coefficients \\(A\\) and \\(B\\). " +
                            "To do so, we will also need the derivative of the general solution. Fortunately, this is easy to find " +
                            "as the equation only involves a cosine and a sine being added together.";
                return string;
            case "3c":
                string = "<p>$$\\{ e^{" + this.formatNum(values[0]) + "t}\\cos(" + this.formatNum(values[2]) + "t), e^{" +
                            this.formatNum(values[0]) + "t}\\sin(" + this.formatNum(values[2]) + "t) \\}$$</p><p>This is the fundamental " +
                            "set of solutions for this equation. If we just wanted <em>the</em> general solution to the equation," +
                            " we could use the set of solutions to find it and be done. However, we want the particular solution to " +
                            "this differential equation given the initial conditions (otherwise, we wouldn't be able to graph it or " +
                            "model its motion). We thus will need to find the coefficients.</p><p>$$x(t) = Ae^{" +
                            this.formatNum(values[0]) + "t}\\cos(" + this.formatNum(values[0]) + "t) + Be^{" + this.formatNum(values[0]) +
                            "t}\\sin(" + this.formatNum(values[0]) + "t)$$</p><p>$$x&rsquo;(t) = A(" + this.formatNum(values[0]) + "e^{" +
                            this.formatNum(values[0]) + "t}\\cos(" + this.formatNum(values[2]) + "t) " + ((values[2] < 0) ? " + " +
                            this.formatNum(Math.abs(values[2])) : " - " + this.formatNum(values[2])) + "e^{" + this.formatNum(values[0]) +
                            "t}\\sin(" + this.formatNum(values[2]) + "t))$$\n$$ + B(" + this.formatNum(values[0]) + "e^{" +
                            this.formatNum(values[0]) + "t}\\sin(" + this.formatNum(values[2]) + "t) " + ((values[2] < 0) ? " + " +
                            this.formatNum(Math.abs(values[2])) : " - " + this.formatNum(values[2])) + "e^{" + this.formatNum(values[0]) +
                            "t}\\cos(" + this.formatNum(values[2]) + "t))$$</p><p>Now that we have the general solution, we can solve " +
                            "for the particular solution to the differential equation by solving for the coefficients \\(A\\) and " +
                            "\\(B\\). To do so, we will also need to find the the derivative of the general solution. Unfortunately, " +
                            "because this solution has exponentials multiplying sines and cosines, we will need to use product rule. " +
                            "You should be able to find this derivative yourself, but we have provided it here for reference.</p>";
                return string;
            case "3rd":
                string = "<p>$$\\{ e^{" + this.formatNum(values[0]) + "t}, e^{" + this.formatNum(values[1]) +"t} \\}$$</p><p>This is " +
                            "the fundamental set of solutions for this equation. If we just wanted <em>the</em> general solution, we " +
                            "could use the set of solutions to find it and be done. However, we want the particular solution to this " +
                            "differential equation given the initial conditions (otherwise, we wouldn't be able to graph it or model " +
                            "its motion). We thus will need to find the coefficients of the general solution.</p><p>$$x(t) = Ae^{" +
                            this.formatNum(values[0]) +"t} + Be^{" + this.formatNum(values[1]) +"t}$$</p>";
                return string;
            case "3rr":
                string = "<p>$$\\{ e^{" + this.formatNum(values[0]) + "t}, te^{" + this.formatNum(values[0]) + "t} \\}$$</p><p>This is " +
                            "the fundamental set of solutions for this equation. If we just wanted <em>the</em> general solution, we " +
                            "could use the set of solutions to find it and be done. However, we want the particular solution to this " +
                            "differential equation given the initial conditions (otherwise, we wouldn't be able to graph it or model " +
                            "its motion). We thus will need to find the coefficients of the general solution.</p><p>$$x(t) = Ae^{" +
                            this.formatNum(values[0]) +"t} + Bte^{" + this.formatNum(values[0]) +"t}$$</p>";
                return string;
            case "4cos(0)":
                string = "<p>$$x(" + String(values[3]) + ") = " + String(values[4]) + " = " + this.formatNum(values[6][1]) +
                            "B$$\n$$x&rsquo;(" + String(values[3]) + ") = " + String(values[5]) + " = " + ((values[2] == 0) ?
                            this.formatNum(values[7][0]) + "A" : this.formatNum(values[7][0]) + "A" + ((values[2]*values[7][1] < 0) ?
                            " - " + ((values[2]*values[7][1] === -1) ? String(values[2]*values[7][1]) :
                                this.formatNum(Math.abs(values[2]*values[7][1]))) : " + " + ((values[2]*values[7][1] === 1) ?
                            String(values[2]*values[7][1]) : this.formatNum(values[2]*values[7][1])))) + "$$\n$$A = " +
                            ((Math.abs(values[1]) == 1) ? String(values[1]) : this.formatNum(values[1])) +
                            "$$</p><p>Fortunately , \\(\\cos(" + this.formatNum(values[0][2]) + "(" + String(values[3]) +
                            ")) = 0\\). This makes \\(B\\) easy to find, as the sine simplifies to \\(1\\), " +
                            "leaving only the exponential value to be evauluated. We can then divide \\(x_0\\) by this value to " +
                            "get \\(B\\). We can then plug \\(B\\) into the derivative of the general solution and evaluate the " +
                            "equation at \\(t_0\\) to get \\(A\\).</p>";
                return string;
            case "4sin(0)":
                string = "<p>$$x(" + String(values[3]) + ") = " + String(values[4]) + " = A$$\n$$x&rsquo;(" + String(values[3]) +
                            ") = " + String(values[5]) + " = " + ((values[1] == 0) ? this.formatNum(values[6][1]) + "B" :
                            this.formatNum(values[6][1]) + "B" + ((values[1]*values[6][0] < 0) ? " - " + ((values[1]*values[6][0]
                                === -1) ? String(values[1]*values[6][0]) : this.formatNum(Math.abs(values[1]*values[6][0]))) : " + " +
                            ((values[1]*values[6][0] === 1) ? String(values[1]*values[6][0]) :
                            this.formatNum(values[1]*values[6][0])))) + "$$\n$$B = " + ((Math.abs(values[2]) == 1) ? String(values[2]) :
                            this.formatNum(values[2])) + "$$</p><p>Fortunately because \\(t_0 = 0\\), \\(\\sin(" +
                            this.formatNum(values[0][2]) + "(0)) = 0\\). This makes \\(A\\) easy to find, as the exponential and " +
                            "the cosine simplify to \\(1\\), meaning that \\(A\\) is equal to \\(x_0\\). We can then easily find " +
                            "\\(B\\) by plugging in \\(A\\)'s value to the derivative of the general solution at \\(v_0\\) and " +
                            "solving for \\(B\\).</p>";
                return string;
            case 4:
                string = "<p>$$\\begin{bmatrix}" + ((Math.abs(values[0][0]) == 1) ? String(values[0][0]) : this.formatNum(values[0][0])) +
                            " &amp; " + ((Math.abs(values[0][1]) == 1) ? String(values[0][1]) : this.formatNum(values[0][1])) + " &amp; " +
                            String(values[2]) + " \\\\ " + ((Math.abs(values[1][0]) == 1) ? String(values[1][0]) :
                            this.formatNum(values[1][0])) + " &amp; " + ((Math.abs(values[1][1]) == 1) ? String(values[1][1]) :
                            this.formatNum(values[1][1])) + " &amp; " + String(values[3]) + " \\\\ \\end{bmatrix}$$\n$$\\begin{bmatrix} 1 " +
                            "&amp; 0 &amp; " + ((Math.abs(values[4][2]) == 1) ? String(values[4][2]) : this.formatNum(values[4][2])) + " \\\\ " +
                            "0 &amp; 1 &amp; " + ((Math.abs(values[4][5]) == 1) ? String(values[4][5]) : this.formatNum(values[4][5])) + " \\\\ "
                            + "\\end{bmatrix}$$\n$$A = " + ((Math.abs(values[4][2]) == 1) ? String(values[4][2]) :
                            this.formatNum(values[4][2])) + "$$\n$$B = " + ((Math.abs(values[4][5]) == 1) ? String(values[4][5]) :
                            this.formatNum(values[4][5])) + "$$</p><p>Unfortunately, neither part of the general solution simplifies " +
                            "to \\(0\\) when we plug in \\(t_0\\). Therefore, we must place the set of solutions and its derivative " +
                            "evaluated at \\(t_0\\) into a matrix augmented with the initial position for the first row and initial " +
                            "velocity for the second row. We then put the matrix in reduced row echelon form in order to solve for " +
                            "the coefficients. The solution in the first row is the value for \\(A\\) and likewise in the second row " +
                            "for \\(B\\).";
                return string;
            case 5:
                string = "<p>" + values + "</p><p>Plugging the values we found for \\(A\\) and \\(B\\) into the general solution gives " +
                            "us the particular solution you see when you first click solve. This is what we were looking for, so we " +
                            "are done with the problem.</p>";
                return string;
        }
    } catch (e) {
        string = "<p>An error occurred while calculating this step.</p>";
        console.error("Error occurred while calculating solution steps. The error is: " + e);
        return string;
    }
    }
}




class IHDiffEq extends DiffEq {
    constructor(m,d,k,bt,t0,x0,v0) {
        // Initializes the superclass.
        super(m,d,k,bt,t0,x0,v0);

        // Sets the display values for the solution steps.
        this.solnSteps = [this.printSteps(1,[m,d,k,bt,t0,x0,v0]),this.printSteps(2)];

        // Solves for the roots, solution type, and coefficients of a homogenous equation.
        if (this.dampType === "Undamped") { // The Undamped case
            if (Math.sign(-k/m) == -1) {
                this.solnSteps.push(this.printSteps("3i",this.r));
            } else {
                let solnType = (this.r[0] == this.r[1]) ? "realRep" : "realDis";
                this.solnSteps.push(this.printSteps(solnType,this.r));
            }
        } else if (this.dampType === "Under Damped") { // The Under Damped case
            this.solnSteps.push(this.printSteps("3ud",this.r));
        } else if (this.dampType === "Over Damped") { // The Over Damped case
            let solnType = (this.r[0] == this.r[1]) ? "realRep" : "realDis";
            this.solnSteps.push(this.printSteps(solnType,this.r));
        } else if (this.dampType === "Critically Damped") { // The Critically Damped case
            this.solnSteps.push(this.printSteps("realRep",this.r));
        }
    }
    b(t) { // Evaluates external forcing term at given time.
        return opPrecParse(this.f, t);
    }
    
    
    // Below code modified and/or written by Doug Baldwin in an attempt to get accurate
    // numerical solutions (or to at least explore why they aren't accurate).
    
    // Given values of t, x, and u (x'), calculate x''.
    d2x(t,u,x) {
    	return (this.b(t) - this.d*u - this.k*x)/this.m;
    }
    
    // A 4th-order Runge-Kutta calculation of x(tFinal) and u(tFinal), calculated by
    // doing Runge-Kutta from the last known x, u, and t values. Updates these last known
    // values, and the values and derivative values caches, at the end.
    rk4( tFinal ) {
    	
    	// Start Runge-Kutta from the t that is closest to tFinal and that already has
    	// x and u values cached.
    	let ts = this.values.keys();
    	let closeT;
    	for ( let currentT of ts ) {
    		if ( closeT == undefined || Math.abs( currentT - tFinal ) < Math.abs( closeT - tFinal ) ) {
    			closeT = currentT;
    		}
    	}
    
    	var t = closeT;
    	var x = this.values.get( closeT );
    	var u = this.derivValues.get( closeT );
    	const h = ( tFinal - closeT ) / 75;
    	const halfH = h / 2;
    	
    	// Do Runge-Kutta calculations until t passes tFinal. This interleaves steps of
    	// the Runge-Kutta calculations of both x and u (x'), following an idea from
    	// https://www.engr.colostate.edu/~thompson/hPage/CourseMat/Tutorials/CompMethods/Rungekutta.pdf
    	// (accessed July 16, 2020).
    	while ( ( h < 0 && t > tFinal ) || ( h > 0 && t < tFinal ) ) {
    		// Calculate estimated derivative and 2nd derivative of x. Calculations
    		// alternate between the 2nd derivative and the derivative, with each
    		// estimate using the previous one for (hopefully) improved accuracy
    		let k1u = this.d2x( t, u, x );
    		let k1x = u;
    		let k2u = this.d2x( t + halfH, u + k1u * halfH, x + k1x * halfH );
    		let k2x = u + k1u * halfH;							
    		let k3u = this.d2x( t + halfH, u + k2u * halfH, x + k2x * halfH );
    		let k3x = u + k2u * halfH;
    		let k4u = this.d2x( t + h, u + k3u * h, x + k3x * h );
    		let k4x = u + k4u * h;
    		// Estimate the next values of x and its derivative as the old values plus
    		// a weighted average derivative times the change in t.
    		u = u + h * ( k1u + 2 * k2u + 2 * k3u + k4u ) / 6;
    		x = x + h * ( k1x + 2 * k2x + 2 * k3x + k4x ) / 6;
    		t = t + h;
    	}
    	
    	// Store the x and u values at (up to round-off) t = tFinal in the caches.
    	this.values.set( tFinal, x );
    	this.derivValues.set( tFinal, u );
    }
    
    // Return x at a given t value. If this x isn't already cached, calculate it and add
    // it to the cache.
    solve( tFinal ) {
        var x = this.values.get( tFinal );
        if ( x == undefined || x == null ) {
            this.rk4( tFinal );
            x = this.values.get( tFinal );
        }
        return x;
    }
    
    // Return x', i.e., u, at a given t value. Calculate and cache it if not already in
    // the cache.
    derivSolve( tFinal ) {
        var u = this.derivValues.get( tFinal );
        if ( u == undefined || u == null ) {
        	this.rk4( tFinal );
        	u = this.derivValues.get( tFinal );
        }
        return u;
    }
    
    // End of Doug Baldwin modifications.
    
    
    printSteps(step,values = null) {
        let string = "";
        try {
        switch (step) {
            case 1:
                string = "<p>$$" + String(values[0]) + "x&rsquo;&rsquo; + " + String(values[1]) + "x&rsquo; + " + 
                            String(values[2]) + "x = " + values[3] + ", " + "x(" + String(values[4]) + ") = " + 
                            String(values[5]) + ", x&rsquo;(" + String(values[4]) + ") = " + String(values[6]) + 
                            "$$</p><p>We start solving this model of harmonic motion by taking a look at the " + 
                            "differential equation itself. It's a second-order equation with the mass \\((m = " + 
                            String(values[0]) + ")\\), damping \\((d = " + String(values[1]) + ")\\), and spring " + 
                            "constant \\((k = " + String(values[2]) + ")\\) as the coefficients. The external " + 
                            " forcing term is \\(" + values[3] + "\\). The initial time, \\(t_0\\), is " + String(values[4]) + 
                            ", the inital position, \\(x(" + String(values[4]) + ")\\), is \\(" + String(values[5]) + 
                            "\\), and the initial velocity, \\(x&rsquo;(" + String(values[4]) + ")\\), is \\(" + 
                            String(values[6]) + "\\).</p>";
                return string;
            case 2:
                string = "<p>Unfortunately, because the differential equation is not homogenous (\\(b(t) \\neq 0\\)), " + 
                            "it cannot be easily solved using traditional methods. We instead must use numerical methods to " + 
                            "approximate the values of \\(t\\) and \\(x\\) in order to graph the solution and model the motion " + 
                            "of the spring. This application uses the numerical method known as Fourth-order Runge Kutta in order " + 
                            "to do so.</p>";
                return string;
            case "3i":
                string = "<p>The fundamental set of solutions for the associated homogeneous equation is the " + 
                            "set: $$\\{ cos(" + this.formatNum(values[2]) + "t), sin(" + this.formatNum(values[2]) + "t) \\}$$" + 
                            "</p><p>If \\(x_{p}(t)\\) is a particular solution, then the general solution for the inhomogeneous" 
                            + " equation is $$x(t) = x_{p}(t) + Acos(" + this.formatNum(values[2]) + "t) + Bsin(" + 
                            this.formatNum(values[2]) + "t)$$</p>";
                return string;
            case "3ud":
                string = "<p>The fundamental set of solutions for the associated homogeneous equation is the " + 
                            "set: $$\\{ e^{" + this.formatNum(values[0]) + "t}cos(" + this.formatNum(values[2]) + "t), e^{" +
                            this.formatNum(values[0]) + "t}sin(" + this.formatNum(values[2]) + "t) \\}$$</p><p>If " +
                            "\\(x_{p}(t)\\) is a particular solution, then the general solution for the inhomogeneous " +
                            "equation is $$x(t) = x_{p}(t) + Ae^{" + this.formatNum(values[0]) + "t}cos(" + 
                            this.formatNum(values[0]) + "t) + Be^{" + this.formatNum(values[0]) + "t}sin(" + 
                            this.formatNum(values[0]) + "t)$$</p>";
                return string;
            case "realRep":
                string = "<p>The fundamental set of solutions for the associated homogeneous equation is the " +
                            "set: $$\\{ e^{" + this.formatNum(values[0]) + "t}, te^{" + this.formatNum(values[0]) + 
                            "t} \\}$$</p><p>If \\(x_{p}(t)\\) is a particular solution, then the general solution for the " +
                            "inhomogeneous equaion is $$x(t) = x_{p}(t) + Ae^{" + this.formatNum(values[0]) +"t} + " +
                            "Bte^{" + this.formatNum(values[0]) + "t}$$</p>";
                return string;
            case "realDis":
                string = "<p>The fundamental set of solutions for the associated homogeneous equation is the " +
                            "set: $$\\{ e^{" + this.formatNum(values[0]) + "t}, e^{" + this.formatNum(values[1]) + 
                            "t} \\}$$</p><p>If \\(x_{p}(t)\\) is a particular solution, then the general solution for the " +
                            "inhomogeneous equation is $$x(t) = x_{p}(t) + Ae^{" + this.formatNum(values[0]) +"t} + Be^{" + 
                            this.formatNum(values[1]) +"t}$$</p>";
                return string;
        }
    } catch (e) {
        string = "<p>An error occurred while calculating this step.</p>";
        console.error("Error occurred while calculating solution steps. The error is: " + e);
        return string;
    }
    }
}






