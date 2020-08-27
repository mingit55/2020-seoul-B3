class Artwork {
    constructor(src){
        this.src = src;
        this.active = false;
        this.x = 0;
        this.y = 0;

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;
        this.ctx = this.canvas.getContext("2d");

        this.sliced = document.createElement("canvas");
        this.sliced.width = this.src.width;
        this.sliced.height = this.src.height;
        this.sctx = this.sliced.getContext("2d");
    }

    render(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if(this.active) this.ctx.putImageData(this.src.borderData, 0, 0);
        else this.ctx.putImageData(this.src.imageData, 0, 0);

        this.ctx.drawImage(this.sliced, 0, 0);
    }

    recalculate(){
        let [X, Y, W, H] = this.src.getSize();
        let src = new Source( new ImageData( W, H ) );
        
        for(let y = Y; y < Y + H; y++){
            for(let x = X; x < X + W; x++){
                let color = this.src.getColor(x, y);
                if(!color) continue;
                src.setColor(x - X, y - Y, color);
            }
        }

        src.borderData = src.getBorderData();
        this.src = src;
        
        this.canvas.width = W;
        this.canvas.height = H;
        this.x += X;
        this.y += Y;

        let slicedData = this.sctx.getImageData(0, 0, this.sliced.width, this.sliced.height);
        this.sliced.width = W;
        this.sliced.height = H;
        this.sctx.putImageData(slicedData, -X, -Y);

        let ssrc = new Source(this.sctx.getImageData(0, 0, this.sliced.width, this.sliced.height));
        this.sliced.width = W;
        this.sliced.height = H;
        this.sctx.clearRect(0, 0, this.sliced.width, this.sliced.height);
        for(let y = 0; y < this.sliced.height; y++){
            for(let x = 0; x < this.sliced.width; x++){
                if(ssrc.getColor(x, y) && src.isSlicedPixel(x, y)){
                    this.sctx.fillRect(x - 1, y - 1, 2, 2);
                }
            }
        }
    }

    isNear(artwork){
        for(let y = this.y; y < this.y + this.src.height; y++){
            for(let x = this.x; x < this.x + this.src.width; x++){
                let ax = x - artwork.x;
                let ay = y - artwork.y;
                
                let tx = x - this.x;
                let ty = y - this.y;

                if(artwork.src.getColor(ax, ay) && this.src.getColor(tx, ty)){
                    return true;
                }
            }
        }
        return false;
    }
}