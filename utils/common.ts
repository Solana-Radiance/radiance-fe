export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * Runs the function if it's a function, returns the result or undefined
 * @param fn
 * @param args
 */
export const runIfFunction = (fn: any, ...args: any): any | undefined => {
    if(typeof(fn) == 'function'){
        return fn(...args);
    }

    return undefined;
}



export function cloneObj(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export function ellipsizeThis(x: string, leftCharLength: number, rightCharLength: number) {
    let totalLength = leftCharLength + rightCharLength;
    
    if(totalLength >= x.length) {
        return x;
    }
    
    return x.substring(0, leftCharLength) + "..." + x.substr(-rightCharLength);
}

export function toShortNumber(x: string | number, decimalPlaces = 0, cutoff = 1e-3): string{
    let power = 1;

    if(typeof(x) == "string"){
        x = parseFloat(x);
    }

    let isIncrease = Math.abs(x) >= 1;
    let isNegative = x < 0;

    x = Math.abs(x); //ignore negative

    if(x < cutoff) {
        return (0).toFixed(decimalPlaces);
    }

    if(x >= 1000 || x <= 0.001){
        while(true){
            if(isIncrease){
                x = x / 1000;
                power += 3;
    
                if(x < 1000){
                    break;
                }
            }
    
            else {
                x = x * 1000;
                power -= 3;
    
                if(x >= 1){
                    break;
                }
            }
    
            //prevent endless loop
            if(power < -9 || power > 12){
                break;
            }
        }
    }
    
    if(isNegative){
        x = -x;
    }

    let suffix = "";

    if(power >= 12){
        suffix = "T";
    }

    else if(power >= 9){
        suffix = "B";
    }

    else if(power >= 6){
        suffix = "M";
    }

    else if(power >= 3){
        suffix = "k";
    }
    else if(power >= 0){
        suffix = "";
    }
    else if(power >= -3){
        suffix = "m";
    }
    else if(power >= -6){
        suffix = "u";
    }
    else if(power >= -9){
        suffix = "p";
    }

    return x.toFixed(decimalPlaces) + suffix;

}

/**
 * Returns the number with 'en' locale settings, ie 1,000
 * @param x number
 * @param minDecimal number
 * @param maxDecimal number
 */
 export function toLocaleDecimal(x: number, minDecimal: number, maxDecimal: number) {
    return x.toLocaleString('en', {
        minimumFractionDigits: minDecimal,
        maximumFractionDigits: maxDecimal,
    });
}

export const getRandomNumber = (min: number, max: number, isInteger = false) => {
    let rand = min + (Math.random() * (max - min));
    if(isInteger) {
        rand = Math.round(rand);
    }

    else {
        // to 3 decimals
        rand = Math.floor(rand * 1000) / 1000;
    }

    return rand;
}