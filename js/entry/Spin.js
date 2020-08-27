class Spin extends Tool {
    constructor(){
        super(...arguments);
    }

    ondblclick(e){
        let target = this.getMouseTarget(e);
        
        if(target !== null && this.selected == null){
            target.active = true;
            target.recalculate();

            this.selected = target;
            this.prevImage = target.src;
            this.prevSliced = document.createElement("canvas");
            this.prevSliced.width = target.sliced.width;
            this.prevSliced.height = target.sliced.height;
            let psctx = this.prevSliced.getContext("2d");
            psctx.drawImage(target.sliced, 0, 0);

            this.image = document.createElement("canvas");
            this.image.width = target.src.width;
            this.image.height = target.src.height;
            let ctx = this.image.getContext("2d");
            ctx.putImageData(target.src.imageData, 0, 0);

            this.sliced = document.createElement("canvas");
            this.sliced.width = target.sliced.width;
            this.sliced.height = target.sliced.height;
            let sctx = this.sliced.getContext("2d");
            sctx.drawImage(target.sliced, 0, 0);
            
            let [, , imgW, imgH] = target.src.getSize();
            let wantSize = Math.sqrt( Math.pow(imgW, 2) + Math.pow(imgH, 2) );
            let moveX = (wantSize - imgW) / 2;
            let moveY = (wantSize - imgH) / 2;

            target.canvas.width = target.canvas.height = wantSize;
            target.sliced.width = target.sliced.height = wantSize;
            target.x -= moveX;
            target.y -= moveY;

            this.canvas = document.createElement("canvas");
            this.canvas.width = this.canvas.height = wantSize;
            this.ctx = this.canvas.getContext("2d");

            let imgX = wantSize / 2 - this.image.width / 2;
            let imgY = wantSize / 2 - this.image.height / 2;
            this.ctx.drawImage(this.image, imgX, imgY);
            target.src = new Source( this.ctx.getImageData(0, 0, wantSize, wantSize) );

            target.sctx.clearRect(0, 0, target.sliced.width, target.sliced.height);
            target.sctx.drawImage(this.sliced, imgX, imgY);
        }

    }
    
    onmousedown(e){
        if(!this.selected) return;
        this.prevX = e.pageX;
    }

    onmousemove(e){
        if(!this.selected) return;
        let x = e.pageX;
        let target = this.selected;
        let size = this.canvas.width;
        let angle = -(x - this.prevX) * Math.PI / 180;
        this.prevX = x;

        let center = size / 2;
        let imgX = center - this.image.width / 2;
        let imgY = center - this.image.height / 2;

        this.ctx.translate(center, center);
        this.ctx.rotate(angle);
        this.ctx.translate(-center, -center);

        this.ctx.clearRect(0, 0, size, size);
        this.ctx.drawImage(this.image, imgX, imgY);
        target.src = new Source( this.ctx.getImageData(0, 0, size, size) );

        this.ctx.clearRect(0, 0, size, size);
        this.ctx.drawImage(this.sliced, imgX, imgY);
        target.sctx.clearRect(0, 0, target.sliced.width, target.sliced.height);
        target.sctx.drawImage(this.canvas, 0, 0);
    }

    oncontextmenu(makeFunc){
        if(!this.selected) return;
        makeFunc([
            {name: "확인", handler: this.accept},
            {name: "취소", handler: this.cancel}
        ]);
    }

    accept = e => {
        if(!this.selected) return;
        this.selected.recalculate();
        this.unselectAll();
    };

    cancel = e => {
        if(!this.selected) return;
        let moveX = (this.canvas.width - this.prevImage.width) / 2;
        let moveY = (this.canvas.height - this.prevImage.height) / 2;

        this.selected.x += moveX;
        this.selected.y += moveY;

        this.selected.canvas.width = this.prevImage.width;
        this.selected.canvas.height = this.prevImage.height;
        this.selected.src = this.prevImage;
        this.selected.sliced = this.prevSliced;

        this.selected.recalculate();
        this.unselectAll();
    };
}