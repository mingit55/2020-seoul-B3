class Tool {
    constructor(ws){
        this.ws = ws;
        this.selected = null;
    }

    getXY({pageX, pageY}){
        let {left, top} = $(this.ws.canvas).offset();
        let width = $(this.ws.canvas).width();
        let height = $(this.ws.canvas).height();

        let x = pageX - left;
        x = x < 0 ? 0 : x > width ? width : x;
        
        let y = pageY - top;
        y = y < 0 ? 0 : y > height ? height : y;

        return [x, y];
    }

    getMouseTarget(e){
        let [x, y] = this.getXY(e);
        let artworks = this.ws.artworks;
        for(let i = artworks.length - 1; i >= 0; i--){
            let artwork = artworks[i];
            
            if(artwork.src.getColor(x - artwork.x, y - artwork.y)){
                artworks.splice(i, 1);
                artworks.push(artwork);
                return artwork;
            }
        }
        return null;
    }

    unselectAll(){
        this.selected = null;
        this.ws.artworks.forEach(artwork => artwork.active = false);
    }
}