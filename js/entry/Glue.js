class Glue extends Tool {
    constructor(){
        super(...arguments);
        this.glueList = [];
    }

    onmousedown(e){
        let target = this.getMouseTarget(e);
        console.log("Mouse Down");
        console.log("Target", target);
        console.log("Selected", this.selected);
        if(target !== null){
            if(this.selected === null){
                target.active = true;
                this.selected = target;
                this.glueList.push(target);
            } 
            else if(target.isNear(this.selected) && !this.glueList.includes(target)){
                target.active = true;
                this.glueList.push(target);
            }
        } else {
            this.unselectAll();
            this.glueList = [];
        }

        console.log(this.glueList);
    }

    oncontextmenu(makeFunc){
        makeFunc([
            {name: "붙이기", handler: this.accept},
            {name: "취소", handler: this.cancel}
        ]);
    }

    accept = e => {
        let first = this.glueList[0];
        let left = this.glueList.reduce((p, c) => Math.min(p, c.x), first.x);
        let top = this.glueList.reduce((p, c) => Math.min(p, c.y), first.y);
        let right = this.glueList.reduce((p, c) => Math.max(p, c.x + c.src.width), first.x + first.src.width);
        let bottom = this.glueList.reduce((p, c) => Math.max(p, c.y + c.src.height), first.y + first.src.height);
        console.log(this.glueList, left, top, right, bottom);
        
        let X = left;
        let Y = top;
        let W = right - left + 1;
        let H = bottom - top + 1;

        let src = new Source( new ImageData( W, H ) );
        let sliced = document.createElement("canvas");
        sliced.width = W;
        sliced.height = H;
        let sctx = sliced.getContext("2d");
        
        this.glueList.forEach(glueItem => {
            sctx.drawImage(glueItem.sliced, glueItem.x - X, glueItem.y - Y);

            for(let y = top; y < bottom; y++){
                for(let x = left; x < right; x++){
                    let gx = x - glueItem.x;
                    let gy = y - glueItem.y;

                    let color = glueItem.src.getColor(gx, gy);
                    if(color){
                        src.setColor(x - X, y - Y, color);
                    }
                }
            }
        });

        src.borderData = src.getBorderData();

        let artwork = new Artwork( src );
        artwork.active = true;
        artwork.x = X;
        artwork.y = Y;
        artwork.sliced = sliced;
        artwork.sctx = sctx;
        artwork.recalculate();

        this.ws.artworks = this.ws.artworks.filter(artwork => !this.glueList.includes(artwork));
        this.ws.artworks.push(artwork);

        this.cancel();
    };

    cancel = e => {
        this.glueList = [];
        this.unselectAll();
    };
}