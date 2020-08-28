class App {
    constructor(){
        this.$store = $("#store");
        this.$cart = $("#cart");
        this.$totalPoint = $("#total-point");
        
        new IDB("seoul", ["papers", "inventory"], async db => {
            this.db = db;
            this.papers = await this.getPapers();
            this.cartList = [];

            this.tags = this.papers.reduce((p, c) => [...p, ...c.hash_tags], []);
            this.searchModule = new HashModule("#search-area", this.tags);
            this.entryModule = new HashModule("#entry-tags", this.tags);
            
            this.updateStore();
            this.updateCart();
            this.setEvents();
        });
    }

    get totalPoint(){
        return this.papers.reduce((p, c) => p + c.totalPoint, 0);
    }

    get totalCount(){
        return this.papers.reduce((p, c) => p + c.buyCount, 0);
    }

    async getPapers(){
        let papers = await this.db.getAll("papers");

        if(papers.length == 0){
            let req = await fetch("/json/papers.json");
            let jsonList = await req.json();
            papers = jsonList.map(paper => ({
                ...paper,
                id: parseInt(paper.id),
                image: "/images/papers/" + paper.image,
                width_size: parseInt( paper.width_size.replace(/[^0-9]/g, "") ),
                height_size: parseInt( paper.height_size.replace(/[^0-9]/g, "") ),
                point: parseInt( paper.point.replace(/[^0-9]/g, "") ),
                hash_tags: [],
            }));
            papers.forEach(paper => this.db.add("papers", paper));
        }

        return papers.map(paper => new Paper(paper));
    }
    
    updateStore(){
        let viewList = this.papers;
        
        if(this.searchModule.tags.length > 0){
            viewList = viewList.filter(item => item.hash_tags.every(tag => this.searchModule.tags.includes(tag)));
        }
        
        this.$store.html("");
        viewList.forEach(viewItem => {
            viewItem.updateStore();
            this.$store.append( viewItem.$storeElem );
        });
    }

    updateCart(){
        let viewList = this.cartList;
        
        this.$cart.html("");
        viewList.forEach(viewItem => {
            viewItem.updateCart();
            this.$cart.append( viewItem.$cartElem );
        });

        this.$totalPoint.text(this.totalPoint);
    }

    setEvents(){
        // 장바구니 추가
        this.$store.on("click", ".btn-add", e => {
            let item = this.papers.find(paper => paper.id == e.currentTarget.dataset.id);
            
            if(!this.cartList.includes(item))
                this.cartList.push(item);
            item.buyCount++;

            this.updateCart();
            this.updateStore();
        });

        // 장바구니 수정
        this.$cart.on("input", ".buy-count", e => {
            let value = parseInt(e.target.value);

            if(isNaN(value) || value < 1) value = 1;
            else if(value > 1000) value = 1000;
            
            let item = this.cartList.find(paper => paper.id == e.currentTarget.dataset.id);
            item.buyCount = value;

            this.updateCart();
            this.updateStore();

            e.target.focus();
        });

        // 장바구니 삭제
        this.$cart.on("click", ".remove", e => {
            let item = this.cartList.find(paper => paper.id == e.currentTarget.dataset.id);
            item.count = 0;

            this.cartList = this.cartList.filter(paper => paper !== item);
            this.updateCart();
            this.updateStore();
        });

        // 상품 추가
        $("#entry-modal").on("submit", async e => {
            e.preventDefault();
            let input = Array.from($("#entry-modal input[name]"))
                            .reduce((p, c) => {
                                p[c.name] = c.value;
                                return p;
                            }, {});

            let paper = {
                ...input,
                width_size: parseInt(input.width_size),
                height_size: parseInt(input.height_size),
                point: parseInt(input.point),
                hash_tags: JSON.parse(input.hash_tags)
            };
            
            paper.id = await this.db.add("papers", paper);
            this.papers.push( new Paper(paper) );
            this.tags.push( ...paper.hash_tags );
            
            this.updateStore();

            $("#entry-modal").modal("hide");
            $("#entry-modal input").val("");
            this.entryModule.tags = null;
            this.entryModule.render();
        });

        // 상품 추가 - 파일 업로드
        $("#upload").on("change", e => {
            if(e.target.files.length === 0) return;
            let file = e.target.files[0];

            if(file.size > 1024 * 1024 * 5){
                alert("이미지는 5MB 이내여야 합니다.");
                e.target.value = "";
                return;
            }
            if(!["png", "jpg", "gif"].includes(file.name.substr(-3).toLowerCase())){
                alert("이미지 파일만 업로드할 수 있습니다.");
                e.target.value = "";
                return;
            }

            let reader = new FileReader();
            reader.onload = () => {
                $("#base64").val(reader.result);
            }
            reader.readAsDataURL(file);
        });

        // 구매하기
        $("#btn-buy").on("click", async e => {
            alert(`총 ${this.totalCount}개의 한지가 구매되었습니다.`);
            
            await Promise.all(this.cartList.map(async item => {
                let exist = await this.db.get("inventory", item.id);
                if(exist){
                    exist.count += item.buyCount;
                    await this.db.put("inventory", exist);
                } else {
                    await this.db.add("inventory", ({
                        id: item.id,
                        image: item.image,
                        count: item.buyCount,
                        paper_name: item.paper_name,
                        width_size: item.width_size,
                        height_size: item.height_size,
                    }));
                }

                item.buyCount = 0;
            }));

            this.cartList = [];
            this.updateCart();
            this.updateStore();
        });
    }
}


class Paper {
    constructor({id, image, paper_name, company_name, width_size, height_size, point, hash_tags}){
        this.id = id;
        this.image = image;
        this.paper_name = paper_name;
        this.company_name = company_name;
        this.width_size = width_size;
        this.height_size = height_size;
        this.point = point;
        this.hash_tags = hash_tags;

        this.buyCount = 0;
    }
    
    get totalPoint(){
        return this.buyCount * this.point;
    }

    updateStore(){
        if(!this.$storeElem){
            this.$storeElem = $(`<div class="col-lg-3 mb-4">
                                    <div class="bg-white border">
                                        <img src="${this.image}" alt="상품 이미지" class="fit-cover hx-200">
                                        <div class="p-3">
                                            <div class="fx-2">${this.paper_name}</div>
                                            <div class="mt-2">
                                                <span class="fx-n2 text-muted">업체명</span>
                                                <span class="fx-n1 ml-2">${this.company_name}</span>
                                            </div>
                                            <div class="mt-2">
                                                <span class="fx-n2 text-muted">사이즈</span>
                                                <span class="fx-n1 ml-2">${this.width_size}px × ${this.height_size}px</span>
                                            </div>
                                            <div class="mt-2">
                                                <span class="fx-n2 text-muted">포인트</span>
                                                <span class="fx-n1 ml-2">${this.point}p</span>
                                            </div>
                                            <div class="mt-2 d-flex flex-wrap">
                                                ${
                                                    this.hash_tags.map(tag => `<div class="m-1 text-muted fx-n2"># ${tag}</div>`).join("")
                                                }
                                            </div>
                                            <button class="btn-add mt-4 btn-filled" data-id="${this.id}">구매하기</button>
                                        </div>
                                    </div>
                                </div>`);
        } else {
            this.$storeElem.find(".btn-add").text(this.buyCount > 0 ? `추가하기(${this.buyCount}개)` : "구매하기");
        }
    }

    updateCart(){
        if(!this.$cartElem){
            this.$cartElem = $(`<div class="t-row">
                                    <div class="cell-50">
                                        <div class="d-flex align-items-center">
                                            <img src="${this.image}" alt="상품 이미지" width="80" height="80">
                                            <div class="text-left ml-4">
                                                <div>
                                                    <span class="fx-2">${this.paper_name}</span>
                                                    <span class="ml-1 badge badge-primary">${this.point}p</span>
                                                </div>
                                                <div class="mt-2 text-muted fx-n1">${this.company_name}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="cell-20">
                                        <input type="number" class="buy-count" min="1" value="${this.buyCount}" data-id="${this.id}">
                                    </div>
                                    <div class="cell-20">
                                        <span class="total">${this.totalPoint}</span>p
                                    </div>
                                    <div class="cell-10">
                                        <button class="remove btn-bordered" data-id="${this.id}">삭제</button>
                                    </div>
                                </div>`);
        } else {
            this.$cartElem.find(".buy-count").val(this.buyCount);
            this.$cartElem.find(".total").text(this.totalPoint);
        }
    }
}

$(function(){
    let app = new App();
});