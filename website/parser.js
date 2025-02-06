/* This file contains classes and functions related to the operator precedence parser and its associated lexer.
The classes define operators and operands that can be found in expression strings and are created while the 
lexer is tokenizing the string. The operator classes store their precedence and have methods for performing
their operations on operands. The opPrecParse function encapsulates all of the classes and functions found in
this file and is used by DiffEq objects to parse non-zero external forcing terms. 

Programmer: Jack Truckenmiller
Created: 05/04/19
*/


// Defines the mathematical unit step function, which returns 0 for t - a for t <= a and 1 for t > a.
function step(t) { return (t <= 0) ? 0 : 1; }




// Classes used to represent operands and operators for the lexer used by the operator precedence parser.
class Operand {
    constructor(value) {
        this.sym = value;
    }
}

/* Superclass that represents all operators, which have symbolic representations, precendence in the token stream 
as well as in the operator stack, and operation that may involve elements of the data stack. */
class Operator {
    constructor(op,inputPrec,stackPrec = inputPrec) {
        this.sym = op;
        this.precedence = {
            inputPrec,
            stackPrec
        };
    }
    operate(stack, t) { return; }
}

class OpenParen extends Operator {
    constructor() {
        super("(", 20, 2);
    }
}

class CloseParen extends Operator {
    constructor() {
        super(")", 1);
    }
}

class Fn extends Operator {
    constructor(func) {
        super(func, 19);
    }
    operate(stack, t) {
        let x = stack.shift();
        switch (this.sym) {
            case "abs":
                return Math.abs(x);
            case "acos":
            case "arccos":
                return Math.acos(x);
            case "acosh":
            case "arccosh":
                return Math.acosh(x);
            case "asin":
            case "arcsin":
                return Math.asin(x);
            case "asinh":
            case "arcsinh":
                return Math.asinh(x);
            case "atan":
            case "arctan":
                return Math.atan(x);
            case "atanh":
            case "arctanh":
                return Math.atanh(x);
            case "cbrt":
                return Math.cbrt(x);
            case "ceil":
                return Math.ceil(x);
            case "cos":
                return Math.cos(x);
            case "cosh":
                return Math.cosh(x);
            case "exp":
                return Math.exp(x);
            case "expm1":
                return Math.expm1(x);
            case "floor":
                return Math.floor(x);
            case "fround":
                return Math.fround(x);
            case "ln":
            case "log":
                return Math.log(x);
            case "log10":
                return Math.log10(x);
            case "log1p":
                return Math.log1p(x);
            case "log2":
                return Math.log2(x);
            case "round":
                return Math.round(x);
            case "sin":
                return Math.sin(x);
            case "sinh":
                return Math.sinh(x);
            case "step":
                return step(x);
            case "sqrt":
                return Math.sqrt(x);
            case "tan":
                return Math.tan(x);
            case "tanh":
                return Math.tanh(x);
        }
    }
}

class Expo extends Operator {
    constructor() {
        super("^", 15);
    }
    operate(stack, t) {
        // x^n
        let n = stack.shift();
        let x = stack.shift();
        return x ** n;
    }
}

class Multi extends Operator {
    constructor() {
        super("*", 14)
    }
    operate(stack, t) {
        let b = stack.shift();
        let a = stack.shift();
        return a * b;
    }
}

class Div extends Operator {
    constructor() {
        super("/", 14);
    }
    operate(stack, t) {
        let b = stack.shift();
        let a = stack.shift();
        return a/b;
    }
}

class Add extends Operator {
    constructor() {
        super("+", 13);
    }
    operate(stack, t) {
        let b = stack.shift();
        let a = stack.shift();
        return a + b;
    }
}

class Sub extends Operator {
    constructor() {
        super("-", 13);
    }
    operate(stack, t) {
        let b = stack.shift();
        let a = stack.shift();
        return a - b;
    }
}

class Terminator extends Operator {
    constructor() {
        super("$", 0);
    }
}




// Tokenizer code adapted from code found at https://medium.freecodecamp.org/how-to-build-a-math-expression-tokenizer-using-javascript-3638d4e5fbe9
// Takes the user input for the external forcing term and turns into an array of tokens for the parser to evaluate.
function tokenize(expr, t) {
    expr.replace(/\s+/g, ""); // Remove all whitespace.
    var chars = expr.split(""); // Turn the string into an array of characters

    var tokens = [];
    var letterBuffer = []; // Holds characters to form function names or evaluate variable multiplication.
    var numberBuffer = []; // Holds numbers to build multi-digit numbers, negative numbers, and decimal numbers.
    var emptyLetterBuffer = (function() {
        for (let i = 0; i < letterBuffer.length; i++) {
            if (letterBuffer[i] == 't') {
                tokens.push(new Operand(t));
                if (i < letterBuffer.length - 1) {
                    tokens.push(new Multi());
                }
            } else if (letterBuffer[i] == 'e') {
                tokens.push(new Operand(Math.E))
                if (i < letterBuffer.length - 1) {
                    tokens.push(new Multi())
                }
            } else if (letterBuffer[i] == 'p') {
                continue;
            } else if (letterBuffer[i] == 'i') {
                if (letterBuffer[i-1] == 'p') {
                    tokens.push(new Operand(Math.PI));
                    if (i < letterBuffer.length - 1) {
                        tokens.push(new Multi());
                    }
                }
            }
        }
        letterBuffer = [];
    });
    var emptyNumberBuffer = (function() {
        if (numberBuffer.length) {
            tokens.push(new Operand(Number(numberBuffer.join(""))));
            numberBuffer = [];
        }
    });

    for (let char of chars) {
        if (/\d/.test(char)) {
            if (letterBuffer.length) {
                let lastLetter = letterBuffer[letterBuffer.length - 1];
                if (char == '1') {
                    if (lastLetter == 'g' || lastLetter == 'm') {
                        letterBuffer.push(char);
                    } else {
                        numberBuffer.push(char);
                    }
                } else if (char == '0') {
                    if (lastLetter == '1') {
                        letterBuffer.push(char);
                    } else {
                        numberBuffer.push(char);
                    }
                } else if (char == '2') {
                    if (lastLetter == 'g') {
                        letterBuffer.push(char);
                    } else {
                        numberBuffer.push(char);
                    }
                } else {
                    numberBuffer.push(char);
                }
            } else {
                numberBuffer.push(char);
            }
        } else if (char == '.') {
            numberBuffer.push(char);
        } else if (/[a-z]/i.test(char)) {
            if (numberBuffer.length) {
                emptyNumberBuffer();
                tokens.push(new Multi);
            }
            letterBuffer.push(char);
        } else if (/\+|-|\*|\/|\^|\$/.test(char)) {
            emptyNumberBuffer();
            emptyLetterBuffer();
            switch (char) {
                case '+':
                    tokens.push(new Add());
                    break;
                case '-':
                    let lastToken = tokens[tokens.length - 1];
                    if (!(lastToken instanceof CloseParen) && lastToken instanceof Operator) {
                        numberBuffer.push(char);
                    } else {
                        tokens.push(new Sub());
                    }
                    break;
                case '*':
                    tokens.push(new Multi());
                    break;
                case '/':
                    tokens.push(new Div());
                    break;
                case '^':
                    tokens.push(new Expo());
                    break;
                case '$':
                    tokens.push(new Terminator());
                    break;
            }
        } else if (/\(/.test(char)) {
            if (letterBuffer.length) {
                let name = [];
                while ((l = letterBuffer.shift()) !== undefined) {
                    if (l == 't') {
                        if (name.length) {
                            name.push(l);
                        } else if (letterBuffer[0] == 'a') {
                            name.push(l);
                        } else {
                            tokens.push(new Operand(t));
                            tokens.push(new Multi());
                        }
                    } else if (l == 'e') {
                        if (name.length) {
                            name.push(l);
                        } else if (letterBuffer[0] == 'x') {
                            name.push(l);
                        } else {
                            tokens.push(new Operand(Math.E));
                            tokens.push(new Multi());
                        }
                    } else if (l == 'p') {
                        if (name.length) {
                            name.push(l);
                        } else if (letterBuffer[0] == 'i') {
                            letterBuffer.shift();
                            tokens.push(new Operand(Math.PI));
                            tokens.push(new Multi());
                        } else {
                            name.push(l);
                        }
                    } else {
                        name.push(l);
                    }
                }
                tokens.push(new Fn(name.join("")));
            } else if (numberBuffer.length) {
                emptyNumberBuffer();
                tokens.push(new Multi());
            }
            tokens.push(new OpenParen());
        } else if (/\)/.test(char)) {
            emptyLetterBuffer();
            emptyNumberBuffer();
            tokens.push(new CloseParen());
        } else if (char == ' ') {
            continue;
        } else {
            console.error("Invalid character '" + char + "' detected.");
        }
    };
    if (numberBuffer.length) {
        emptyNumberBuffer();
    }
    if (letterBuffer.length) {
        emptyLetterBuffer();
    }

    return tokens;
}




// Main function that performs operator precedence parsing and utilizes all objects and functions degined in this file.
function opPrecParse (expr, t) {
    var dataStack = [];
    var opStack = [new Terminator()];
    var eq = expr + "$";
    var tokens = tokenize(eq, t);
    while ((token = tokens.shift()) !== undefined) {
        if (token instanceof Operator) {
            while (opStack.length) {
                if (opStack[0].precedence.stackPrec >= token.precedence.inputPrec) {
                    let op = opStack.shift();
                    let result = op.operate(dataStack, t);
                    if (result != undefined || result != null) {
                        dataStack.unshift(result);
                    }
                } else {
                    opStack.unshift(token);
                    break;
                }
            }
        } else if (token instanceof Operand) {
            dataStack.unshift(token.sym)
        } else {
            console.error("Invalid token value found: " + String(token.sym));
            alert("Invalid number/variable/operator/function " + String(token.sym) + "found in the external forcing term. Please " +
            "verify the expression and try again.");
            break;
        }
    }
    return dataStack.shift();
}
