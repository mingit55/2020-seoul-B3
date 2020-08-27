class Cut extends Tool {
    constructor(){
        super(...arguments);

        this.sliced = this.ws.sliced;
        this.sctx = this.ws.sliced.getContext("2d");
        this.sctx.setLineDash([5, 5]);
        this.sctx.lineWidth = 2;
        
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.ws.canvas.width;
        this.canvas.height = this.ws.canvas.height;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.lineWidth = 2;
    }

    ondblclick(e){
        let target = this.getMouseTarget(e);
        
        if(target !== null && this.selected === null){
            target.active = true;
            this.selected = target;
        }
    }

    onmousedown(e){
        if(!this.selected) return;
        let [x, y] = this.getXY(e);
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);

        this.sctx.clearRect(0, 0, this.sliced.width, this.sliced.height)
        this.sctx.beginPath();
        this.sctx.moveTo(x, y);
    }

    onmousemove(e){
        if(!this.selected) return;
        let [x, y] = this.getXY(e);
        
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.sctx.lineTo(x, y);
        this.sctx.stroke();
    }
 
    oncontextmenu(makeFunc){
        if(!this.selected) return;
        makeFunc([
            {name: "자르기", handler: this.accept},
            {name: "취소", handler: this.cancel}
        ]);
    }

    accept = e => {
        if(!this.selected) return;
        let target = this.selected;

        target.recalculate();
        
        let src = new Source( target.src.imageData );
        let ssrc = new Source( this.ctx.getImageData( 0, 0, this.canvas.width, this.canvas.height ) );
        let list = [];
        let slicedArr = [];

        this.ws.artworks = this.ws.artworks.filter(artwork => artwork !== target);
        

        for(let y = 0; y < this.canvas.height; y++){
            for(let x = 0; x < this.canvas.width; x++){
                if(ssrc.getColor(x, y)){
                    src.setColor(x - target.x, y - target.y, [0, 0, 0, 0]);
                    slicedArr.push([x - target.x, y - target.y]);
                }
            }
        }

        for(let y = 0; y < target.src.height; y++){
            for(let x = 0 ; x < target.src.width; x++){
                if(!src.getColor(x, y)) continue;

                let new_src = new Source( new ImageData(src.width, src.height) );
                let checkList = [ [x, y] ];

                while(checkList.length > 0){
                    let [x, y] = checkList.pop();
                    let left = false, right = false;
                    
                    while(src.getColor(x, y - 1)) y--;
                    
                    do {
                        let color = src.getColor(x, y);
                        if(!color) break;

                        src.setColor(x, y, [0, 0, 0, 0]);
                        new_src.setColor(x, y, color);
                        

                        if(src.getColor(x - 1, y)){
                            if(left == false){
                                checkList.push( [x - 1, y] );
                                left = true;
                            }
                        } else left = false;

                        if(src.getColor(x + 1, y)){
                            if(right == false){
                                checkList.push( [x + 1, y] );
                                right = true;
                            }
                        } else right = false;
                    } while(src.getColor(x, ++y));
                }
                
                list.push( new Artwork(new_src) );
            }
        }

        list.forEach(item => {
            item.x = target.x;
            item.y = target.y;
            item.sctx.drawImage(target.sliced, 0, 0);
            slicedArr.forEach(([x, y]) => item.sctx.fillRect(x - 1, y - 1, 2, 2));
            item.recalculate();
            this.ws.artworks.push(item);
        });

        this.cancel();
    };

    cancel = e => {
        if(!this.selected) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.sctx.clearRect(0, 0, this.sliced.width, this.sliced.height);
        this.unselectAll();
    };
}