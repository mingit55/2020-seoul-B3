class App {
    constructor(){
        this.helps = [
            `선택 도구는 가장 기본적인 도구로써, 작업 영역 내의 한지를 선택할 수 있게 합니다. 마우스 클릭으로 한지를 활성화하여 이동시킬 수 있으며, 선택된 한지는 삭제 버튼으로 삭제시킬 수 있습니다.`,
            `회전 도구는 작업 영역 내의 한지를 회전할 수 있는 도구입니다. 마우스 더블 클릭으로 회전하고자 하는 한지를 선택하면, 좌우로 마우스를 끌어당겨 회전시킬 수 있습니다. 회전한 뒤에는 우 클릭의 콘텍스트 메뉴로 '확인'을 눌러 한지의 회전 상태를 작업 영역에 반영할 수 있습니다.`,
            `자르기 도구는 작업 영역 내의 한지를 자를 수 있는 도구입니다. 마우스 더블 클릭으로 자르고자 하는 한지를 선택하면 마우스를 움직임으로써 자르고자 하는 궤적을 그릴 수 있습니다. 궤적을 그린 뒤에는 우 클릭의 콘텍스트 메뉴로 '자르기'를 눌러 그려진 궤적에 따라 한지를 자를 수 있습니다.`,
            `붙이기 도구는 작업 영역 내의 한지들을 붙일 수 있는 도구입니다. 마우스 더블 클릭으로 붙이고자 하는 한지를 선택하면 처음 선택한 한지와 근접한 한지들을 선택할 수 있습니다. 붙일 한지를 모두 선택한 뒤에는 우 클릭의 콘텍스트 메뉴로 '붙이기'를 눌러 선택한 한지를 붙일 수 있습니다.`
        ];
        this.find = [];
        this.findIdx = null;

        new IDB("seoul", ["inventory"], async db => {
            this.db = db;
            this.inventory = await this.db.getAll("inventory");

            this.ws = new Workspace(this);
            
            this.setEvents();
        });
    }
    /**
     * 콘텍스트 메뉴
     */
    makeContextMenu(x, y, menus){
        $(".context-menu").remove();

        let $menus = $(`<div class="context-menu" style="left: ${x}px; top: ${y}px"></div>`);

        menus.forEach(({name, handler}) => {
            let $menu = $(`<div class="context-menu__item">${name}</div>`);
            $menu.on("click", handler);
            $menus.append($menu);
        });

        $(document.body).append($menus);
    }

    /**
     * 이벤트
     */
    setEvents(){
        /**
         * 컨텍스트 메뉴
         */
        $(window).on("click", e => {
            $(".context-menu").remove();
        });

        /**
         * 도구 선택
         */
        $("[data-role].tool__item").on("click", e => {
            let role = e.currentTarget.dataset.role;
            
            $(".tool__item").removeClass("active");
            if(this.ws.selected === null){
                this.ws.selected = role;
                $(e.currentTarget).addClass("active");
            } else {
                this.ws.tool.cancel && this.ws.tool.cancel();

                if(this.ws.selected === role){
                    this.ws.selected = null;
                } else {
                    this.ws.selected = role;
                    $(e.currentTarget).addClass("active");
                }
            }
            
        });

        /**
         * 이미지 추가
         */
        $("[data-target='#list-modal']").on("click", e => {
            $("#list-modal .row").html("");
            
            this.inventory.forEach(item => {
                $("#list-modal .row").append(`<div class="col-lg-3" data-id="${item.id}">
                                                <div class="border bg-white">
                                                    <img src="${item.image}" alt="상품 이미지" class="fit-cover hx-200">
                                                    <div class="p-3">
                                                        <div class="fx-2">${item.paper_name}</div>
                                                        <div class="mt-2">
                                                            <span class="fx-n2 text-muted">사이즈</span>
                                                            <span class="ml-2 fx-n1">${item.width_size}px × ${item.height_size}px</span>
                                                        </div>
                                                        <div class="mt-2">
                                                            <span class="fx-n2 text-muted">소지수량</span>
                                                            <span class="ml-2 fx-n1">${item.count}개</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>`);
            });
        });

        /**
         * 이미지 삭제
         */
        $(".remove-artwork").on("click", e => {
            if(this.ws.selected === "select" && this.ws.tool.selected){
                this.ws.artworks = this.ws.artworks.filter(artwork => this.ws.tool.selected !== artwork);
            }
        });

        $("#list-modal").on("click", ".col-lg-3", e => {
            let paper = this.inventory.find(item => item.id == e.currentTarget.dataset.id);
            paper.count--;
            if(paper.count == 0){
                this.db.delete("inventory", paper.id);
                this.inventory = this.inventory.filter(item => paper !== item);
            } else {
                this.db.put("inventory", paper);
            }

            this.ws.pushArtwork({imageURL: paper.image, width_size: paper.width_size, height_size: paper.height_size});

            $("#list-modal").modal("hide");
        });

        /**
         * 도움말 영역
         */
        $(".btn-search").on("click", e => {
            let keyword = $(".helper-search > input").val().replace(/([.*+?^$()\[\]\\\\\\/])/g, "\\$1");
            if(!keyword) return;

            let regex = new RegExp(keyword, "g");

            this.helps.forEach((help, i) => {
                let htmlText = help.replace(regex, m1 => `<span>${m1}</span>`)
                $(".helper-body > .tab").eq(i).html(htmlText);
            });

            this.find = Array.from($(".helper-body > .tab > span"));
            if(this.find.length === 0) return;

            this.findIdx = 0;
            this.find[this.findIdx].classList.add("active");

            
            $(".search-comment").text(`${this.find.length}개 중 ${this.findIdx + 1}번째`);

            let target = this.find[this.findIdx].parentElement.dataset.target;
            $("input[name='tabs']").removeAttr("checked");
            $(`#focus-${target}`).attr("checked", true);
        });

        $(".btn-prev").on("click", e => {
            if(this.find.length == 0 || this.findIdx === null) return;

            this.find[this.findIdx].classList.remove("active");
            this.findIdx = this.findIdx - 1 < 0 ? this.find.length - 1 : this.findIdx - 1;
            this.find[this.findIdx].classList.add("active");
            
            $(".search-comment").text(`${this.find.length}개 중 ${this.findIdx + 1}번째`);

            let target = this.find[this.findIdx].parentElement.dataset.target;
            $("input[name='tabs']").removeAttr("checked");
            $(`#focus-${target}`).attr("checked", true);
        });

        $(".btn-next").on("click", e => {
            if(this.find.length == 0 || this.findIdx === null) return;

            this.find[this.findIdx].classList.remove("active");
            this.findIdx = this.findIdx + 1 >= this.find.length ? 0 : this.findIdx + 1;
            this.find[this.findIdx].classList.add("active");
            
            $(".search-comment").text(`${this.find.length}개 중 ${this.findIdx + 1}번째`);

            let target = this.find[this.findIdx].parentElement.dataset.target;
            $("input[name='tabs']").removeAttr("checked");
            $(`#focus-${target}`).attr("checked", true);
        });
    }
}

$(function(){
    let app = new App();
});