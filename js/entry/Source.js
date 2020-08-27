class Source {
    constructor(imageData){
        this.borderColor = [255, 64, 64];
        this.imageData = imageData;
        this.borderData = this.getBorderData();
    }

    get data(){
        return this.imageData.data;
    }
    get width(){
        return this.imageData.width;
    }
    get height(){
        return this.imageData.height;
    }

    getBorderData(){
        let uint8 = new Uint8ClampedArray(this.data);
        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                if(this.isBorderedPixel(x, y)){
                    let i = x * 4 + y * 4 * this.width;
                    uint8[i] = this.borderColor[0];
                    uint8[i+1] = this.borderColor[1];
                    uint8[i+2] = this.borderColor[2];
                    uint8[i+3] = 255;
                }
            }
        }
        return new ImageData(uint8, this.width, this.height);
    }

    getColor(x, y){
        x = parseInt(x);
        y = parseInt(y);
        if(0 <= x && x < this.width && 0 <= y && y < this.height){
            let i = x * 4 + y * 4 * this.width;
            let r = this.data[i];
            let g = this.data[i+1];
            let b = this.data[i+2];
            let a = this.data[i+3];
            return r + g + b + a == 0 ? null : [r,g,b,a];
        } else return null;
    }

    setColor(x, y, color){
        x = parseInt(x);
        y = parseInt(y);
        if(0 <= x && x < this.width && 0 <= y && y < this.height){
            let i = x * 4 + y * 4 * this.width;
            this.data[i] = color[0];
            this.data[i+1] = color[1];
            this.data[i+2] = color[2];
            this.data[i+3] = color[3];
            return true;
        } else return false;       
    }

    isBorderedPixel(x, y){
        return this.getColor(x, y) &&
            (!this.getColor(x - 1, y)
            || !this.getColor(x + 1, y)
            || !this.getColor(x, y - 1)
            || !this.getColor(x, y + 1))
    }

    isSlicedPixel(x, y){
        // for(let i = y - 2; i <= y + 2; i++){
        //     for(let j = x - 2; j <= x + 2; j++){
        //         if(this.getColor(i, j)) return true;
        //     }
        // }
        // return false;
        let leftColor = this.getColor(x - 1, y);
        let rightColor = this.getColor(x + 1, y);
        let topColor = this.getColor(x, y - 1);
        let bottomColor = this.getColor(x, y + 1);
        
        return (leftColor || rightColor || topColor || bottomColor) && !(leftColor && rightColor && topColor && bottomColor);
    }

    getSize(){
        let top = this.height;
        let left = this.width;
        let bottom = 0;
        let right = 0;

        for(let y = 0; y < this.height; y++){
            for(let x = 0; x < this.width; x++){
                if(this.getColor(x, y)){
                    top = Math.min(top, y);
                    bottom = Math.max(bottom, y);
                    left = Math.min(left, x);
                    right = Math.max(right, x);
                }
            }
        }
        return [
            left,
            top, 
            right - left + 1,
            bottom - top + 1
        ];
    }
}