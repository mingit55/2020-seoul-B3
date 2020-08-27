class Workspace {
    constructor(app){
        this.app = app;

        this.canvas = document.querySelector(".workspace > canvas");
        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "#fff";

        this.sliced = document.createElement("canvas");
        this.sliced.width = this.canvas.width;
        this.sliced.height = this.canvas.height;

        this.selected = null;
        this.tools = {
            select: new Select(this),
            spin: new Spin(this),
            cut: new Cut(this),
            glue: new Glue(this)
        };

        this.artworks = [];

        this.render();
        this.setEvents();
    }

    get tool(){
        return this.tools[this.selected];
    }
    
    async pushArtwork({imageURL, width_size, height_size}){
        let image = await new Promise(res => {
            let img = new Image();
            img.src = imageURL;
            img.onload = () => res(img);
        });

        let canvas = document.createElement("canvas");
        canvas.width = width_size;
        canvas.height= height_size;
        let ctx = canvas.getContext("2d");
        
        let x, y, w, h;
        if(image.width > image.height){
            w = image.height * width_size / height_size;
            h = image.height;
            x = image.width / 2 - w / 2;
            y = 0;
        } else {
            w = image.width;
            h = image.width * height_size / width_size;
            x = 0;
            y = image.height / 2 - h / 2;
        }

        ctx.drawImage(image, x, y, w, h, 0, 0, canvas.width, canvas.height);
        
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let src = new Source(imageData);
        this.artworks.push( new Artwork(src) );
    }

    render(){
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.artworks.forEach(artwork => {
            artwork.render();
            this.ctx.drawImage(artwork.canvas, artwork.x, artwork.y);
            this.ctx.strokeRect(artwork.x, artwork.y, artwork.canvas.width, artwork.canvas.height);
        });
        
        this.ctx.drawImage(this.sliced, 0, 0);

        requestAnimationFrame(() => this.render());
    }

    setEvents(){
        $(this.canvas).on("mousedown", e => {
            if(this.tool && e.which === 1){
                e.preventDefault();
                this.tool.onmousedown && this.tool.onmousedown(e);
            }
        });
        $(window).on("mousemove", e => {
            if(this.tool && e.which === 1){
                e.preventDefault();
                this.tool.onmousemove && this.tool.onmousemove(e);
            }
        });
        $(window).on("mouseup", e => {
            if(this.tool && e.which === 1){
                e.preventDefault();
                this.tool.onmouseup && this.tool.onmouseup(e);
            }
        });
        $(window).on("dblclick", e => {
            if(this.tool && e.which === 1){
                e.preventDefault();
                this.tool.ondblclick && this.tool.ondblclick(e);
            }
        });
        $(this.canvas).on("contextmenu", e => {
            if(this.tool){
                e.preventDefault();
                this.tool.oncontextmenu && this.tool.oncontextmenu((menus) => this.app.makeContextMenu(e.pageX, e.pageY, menus));
            }
        });
    }
}